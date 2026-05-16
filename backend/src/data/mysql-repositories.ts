import type { Pool, RowDataPacket } from "mysql2/promise";
import { annotations, location, observer as seedObserver } from "./seed";
import { dateLabel, nowIso } from "../shared/date";
import { PrismError } from "../shared/response";
import type { CaptureAsset, Lens, Observer, Reading, Settings, Slice } from "../shared/types";
import type { Repositories } from "./repositories";
import { getCurrentUserId } from "../shared/request-context";
import { createLocalStorageProvider } from "../providers/storage.provider";
import { createAiProvider } from "../providers/ai.provider";
import type { AppEnv } from "../config/env";

const currentUserId = () => getCurrentUserId();
export function createMysqlRepositories(pool: Pool, env?: AppEnv): Repositories {
  const storageProvider = createLocalStorageProvider({
    publicBaseUrl: env?.storage.publicBaseUrl,
    rootDir: env?.storage.rootDir
  });
  const aiProvider = createAiProvider({
    provider: env?.ai.provider ?? "mock",
    apiKey: env?.ai.apiKey,
    baseUrl: env?.ai.baseUrl ?? "https://api.openai.com/v1",
    model: env?.ai.model ?? "gpt-4.1-mini"
  });

  const findLens = async (id: string) => {
    const hasLensUsage = await tableExists(pool, "lens_usage");
    const rows = await queryRows<LensRow>(
      pool,
      hasLensUsage
        ? `SELECT
          l.*,
          COALESCE(lu.usage_count, 0) AS usage_count,
          COALESCE(global_usage.global_usage_count, 0) AS global_usage_count
        FROM lenses l
        LEFT JOIN lens_usage lu ON lu.lens_id = l.id AND lu.observer_id = ?
        LEFT JOIN (
          SELECT lens_id, SUM(usage_count) AS global_usage_count
          FROM lens_usage
          GROUP BY lens_id
        ) global_usage ON global_usage.lens_id = l.id
        WHERE l.id = ?
          AND l.is_available = TRUE
          AND (l.is_preset = TRUE OR l.created_by = ?)
        LIMIT 1`
        : `SELECT l.*, 0 AS usage_count, 0 AS global_usage_count
        FROM lenses l
        WHERE l.id = ?
          AND l.is_available = TRUE
          AND (l.is_preset = TRUE OR l.created_by = ?)
        LIMIT 1`,
      hasLensUsage ? [currentUserId(), id, currentUserId()] : [id, currentUserId()]
    );
    const row = rows[0];
    if (!row) throw new PrismError("PRISM_NOT_FOUND", "lens not found", 404);
    return mapLens(row);
  };

  const findCapture = async (id: string) => {
    const rows = await queryRows<CaptureRow>(pool, "SELECT * FROM captures WHERE id = ? AND owner_id = ? LIMIT 1", [id, currentUserId()]);
    const row = rows[0];
    if (!row) throw new PrismError("PRISM_NOT_FOUND", "capture not found", 404);
    return mapCapture(row);
  };

  const findReading = async (id: string) => {
    const rows = await queryRows<ReadingRow>(pool, "SELECT * FROM readings WHERE id = ? AND owner_id = ? LIMIT 1", [id, currentUserId()]);
    const row = rows[0];
    if (!row) throw new PrismError("PRISM_NOT_FOUND", "reading not found", 404);
    return mapReading(row);
  };

  return {
    auth: {
      async login(target) {
        const rows = await queryRows<ObserverRow>(pool, "SELECT * FROM observers WHERE email = ? OR phone = ? LIMIT 1", [target, target]);
        const existing = rows[0];
        if (existing) return { observer: mapObserver(existing), isNewUser: false };

        const userCountRows = await queryRows<RowDataPacket & { count: number | string }>(pool, "SELECT COUNT(*) AS count FROM observers");
        const nextNo = Number(userCountRows[0]?.count ?? 0) + 1;
        const id = `user_${String(nextNo).padStart(2, "0")}`;
        const observerCode = `OBS-${String(nextNo).padStart(4, "0")}`;
        const observerNo = String(nextNo).padStart(2, "0");
        await pool.execute(
          `INSERT INTO observers (
            id, observer_code, observer_no, email, phone, is_anonymous, active_since
          ) VALUES (?, ?, ?, ?, ?, FALSE, UTC_TIMESTAMP())`,
          [id, observerCode, observerNo, target.includes("@") ? target : null, target.includes("@") ? null : target]
        );
        await ensureSettingsForUser(pool, id);
        const created = await queryRows<ObserverRow>(pool, "SELECT * FROM observers WHERE id = ? LIMIT 1", [id]);
        return { observer: mapObserver(required(created[0], "observer not found")), isNewUser: true };
      }
    },
    users: {
      async getMe() {
        const rows = await queryRows<ObserverRow>(pool, "SELECT * FROM observers WHERE id = ? LIMIT 1", [currentUserId()]);
        return mapObserver(required(rows[0], "observer not found"));
      },
      async getSettings() {
        await ensureSettings(pool);
        const rows = await queryRows<SettingsRow>(pool, "SELECT * FROM observer_settings WHERE observer_id = ? LIMIT 1", [currentUserId()]);
        return mapSettings(required(rows[0], "settings not found"));
      },
      async updateSettings(input) {
        await ensureSettings(pool);
        const current = await this.getSettings();
        const next = { ...current, ...input, interfaceTheme: "DARK" as const };
        await pool.execute(
          `UPDATE observer_settings
          SET show_community_location = ?,
            location_precision = ?,
            challenge_notifications = ?,
            interface_theme = ?,
            default_slice_public = ?
          WHERE observer_id = ?`,
          [next.showCommunityLocation, next.locationPrecision, next.challengeNotifications, next.interfaceTheme, next.defaultSlicePublic, currentUserId()]
        );
        return next;
      },
      async getStats() {
        const rows = await queryRows<StatsRow>(
          pool,
          `SELECT
            COUNT(*) AS slice_count,
            COUNT(DISTINCT lens_id) AS used_lens_count,
            SUM(CASE WHEN c.private_text IS NOT NULL THEN 1 ELSE 0 END) AS location_count,
            COALESCE(SUM(s.resonance_count), 0) AS resonance_received
          FROM slices s
          LEFT JOIN captures c ON c.id = s.capture_id
          WHERE s.owner_id = ?`,
          [currentUserId()]
        );
        const row = required(rows[0], "stats not found");
        return {
          sliceCount: Number(row.slice_count),
          usedLensCount: Number(row.used_lens_count),
          locationCount: Number(row.location_count ?? 0),
          resonanceReceived: Number(row.resonance_received ?? 0)
        };
      },
      async getLensDistribution() {
        const rows = await queryRows<RowDataPacket & { lens_id: string; name: string; color: string; count: number | string }>(
          pool,
          `SELECT s.lens_id, l.name, l.color, COUNT(*) AS count
          FROM slices s
          JOIN lenses l ON l.id = s.lens_id
          WHERE s.owner_id = ?
          GROUP BY s.lens_id, l.name, l.color
          ORDER BY count DESC`,
          [currentUserId()]
        );
        const max = Math.max(1, ...rows.map((row) => Number(row.count)));
        return rows.map((row) => ({
          lensId: row.lens_id,
          name: row.name,
          color: row.color,
          count: Number(row.count),
          ratio: Number((Number(row.count) / max).toFixed(2))
        }));
      },
      async getActivity() {
        const dates = lastSevenDates();
        const rows = await queryRows<RowDataPacket & { date: string; count: number | string }>(
          pool,
          `SELECT DATE(created_at) AS date, COUNT(*) AS count
          FROM slices
          WHERE owner_id = ?
            AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
          GROUP BY DATE(created_at)`,
          [currentUserId()]
        );
        const counts = new Map(rows.map((row) => [String(row.date), Number(row.count)]));
        return {
          range: "last_7_days" as const,
          items: dates.map((date) => {
            const count = counts.get(date) ?? 0;
            const weekday = weekdayLabel(date);
            return {
              date,
              weekday,
              sliceCount: count,
              level: Math.min(3, count),
              detailText: `${weekday} · ${count} ${count === 1 ? "slice" : "slices"}`
            };
          })
        };
      }
    },
    lenses: {
      async list(input) {
        const hasLensUsage = await tableExists(pool, "lens_usage");
        const params: unknown[] = hasLensUsage ? [currentUserId()] : [];
        const where: string[] = ["l.is_available = TRUE", "(l.is_preset = TRUE OR l.created_by = ?)"];
        params.push(currentUserId());
        if (input.category && input.category !== "ALL") {
          where.push("l.category = ?");
          params.push(input.category);
        }
        if (input.scope === "preset") where.push("l.is_preset = TRUE");
        if (input.scope === "custom") where.push("l.is_preset = FALSE");

        const rows = await queryRows<LensRow>(
          pool,
          hasLensUsage
            ? `SELECT
              l.*,
              COALESCE(lu.usage_count, 0) AS usage_count,
              COALESCE(global_usage.global_usage_count, 0) AS global_usage_count
            FROM lenses l
            LEFT JOIN lens_usage lu ON lu.lens_id = l.id AND lu.observer_id = ?
            LEFT JOIN (
              SELECT lens_id, SUM(usage_count) AS global_usage_count
              FROM lens_usage
              GROUP BY lens_id
            ) global_usage ON global_usage.lens_id = l.id
          WHERE ${where.join(" AND ")}
          ORDER BY l.is_preset DESC, l.created_at ASC`
            : `SELECT l.*, 0 AS usage_count, 0 AS global_usage_count
          FROM lenses l
          WHERE ${where.join(" AND ")}
          ORDER BY l.is_preset DESC, l.created_at ASC`,
          params
        );
        return { total: rows.length, items: rows.map(mapLens) };
      },
      findById: findLens,
      async detail(id) {
        const lens = await findLens(id);
        const statsRows = await queryRows<RowDataPacket & { usage_count: number | string; first_used_at: Date | string | null; last_used_at: Date | string | null }>(
          pool,
          `SELECT usage_count, first_used_at, last_used_at
          FROM lens_usage
          WHERE observer_id = ? AND lens_id = ?
          LIMIT 1`,
          [currentUserId(), id]
        );
        const sampleRows = await queryRows<SliceListRow>(
          pool,
          `SELECT
            s.id,
            s.thumbnail_url,
            s.summary,
            s.created_at,
            c.private_text,
            l.id AS lens_id,
            l.name AS lens_name,
            l.english_name,
            l.category,
            l.color,
            l.icon
          FROM slices s
          JOIN lenses l ON l.id = s.lens_id
          LEFT JOIN captures c ON c.id = s.capture_id
          WHERE s.lens_id = ? AND s.owner_id = ?
          ORDER BY s.created_at DESC
          LIMIT 6`,
          [id, currentUserId()]
        );
        const stats = statsRows[0];
        return {
          lens,
          stats: {
            usageCount: Number(stats?.usage_count ?? 0),
            firstUsedAt: stats?.first_used_at ? toIso(stats.first_used_at) : null,
            lastUsedAt: stats?.last_used_at ? toIso(stats.last_used_at) : null
          },
          sampleSlices: sampleRows.map((row) => ({
            id: row.id,
            thumbnailUrl: row.thumbnail_url,
            summary: row.summary,
            locationText: row.private_text,
            createdAt: toIso(row.created_at),
            annotationsPreview: []
          })),
          emptyState: {
            visible: sampleRows.length === 0,
            title: "NO READINGS YET",
            actionText: "CAPTURE WITH THIS LENS"
          }
        };
      },
      async trending(limit) {
        const rows = await queryRows<LensRow>(
          pool,
          `SELECT
            l.*,
            COALESCE(lu.usage_count, 0) AS usage_count,
            COALESCE(global_usage.global_usage_count, 0) AS global_usage_count
          FROM lenses l
          LEFT JOIN lens_usage lu ON lu.lens_id = l.id AND lu.observer_id = ?
          LEFT JOIN (
            SELECT lens_id, SUM(usage_count) AS global_usage_count
            FROM lens_usage
            GROUP BY lens_id
          ) global_usage ON global_usage.lens_id = l.id
          WHERE l.is_available = TRUE
            AND l.is_preset = TRUE
          ORDER BY global_usage_count DESC, l.created_at ASC
          LIMIT ?`,
          [currentUserId(), limit]
        );
        return {
          items: rows.map((row) => ({
            id: row.id,
            name: row.name,
            englishName: row.english_name,
            color: row.color,
            icon: row.icon,
            heat: Number(row.global_usage_count ?? 0)
          }))
        };
      }
    },
    captures: {
      async create(input) {
        await ensureObserver(pool);
        const id = await nextId(pool, "captures", "cap");
        const capturedAtIso = new Date(input.capturedAt ?? nowIso()).toISOString();
        const capturedAt = toMysqlDateTime(capturedAtIso);
        const captureLocation = input.latitude !== undefined && input.longitude !== undefined ? { ...location, latitude: input.latitude, longitude: input.longitude } : location;
        validateCaptureImage(input.image);
        const image = input.image ?? {
          type: "image/jpeg",
          arrayBuffer: async () => new ArrayBuffer(0)
        };
        const bytes = new Uint8Array(await image.arrayBuffer());
        const imageKey = `captures/${id}.${mimeExtension(image.type ?? "image/jpeg")}`;
        const thumbnailKey = `captures/${id}_thumb.${mimeExtension(image.type ?? "image/jpeg")}`;
        const uploaded = await storageProvider.putObject({ key: imageKey, bytes, contentType: image.type ?? "image/jpeg" });
        const thumbnail = await storageProvider.putObject({ key: thumbnailKey, bytes, contentType: image.type ?? "image/jpeg" });
        const capture: CaptureAsset = {
          id,
          imageUrl: uploaded.url,
          thumbnailUrl: thumbnail.url,
          width: 3024,
          height: 4032,
          mimeType: normalizeImageMimeType(image.type),
          capturedAt: capturedAtIso,
          location: captureLocation
        };

        await pool.execute(
          `INSERT INTO captures (
            id,
            owner_id,
            image_url,
            thumbnail_url,
            width,
            height,
            mime_type,
            captured_at,
            latitude,
            longitude,
            accuracy_meters,
            city,
            province,
            private_text,
            public_text
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            capture.id,
            currentUserId(),
            capture.imageUrl,
            capture.thumbnailUrl ?? null,
            capture.width,
            capture.height,
            capture.mimeType,
            capturedAt,
            capture.location?.latitude ?? null,
            capture.location?.longitude ?? null,
            capture.location?.accuracyMeters ?? null,
            capture.location?.city ?? null,
            capture.location?.province ?? null,
            capture.location?.privateText ?? null,
            capture.location?.publicText ?? null
          ]
        );

        return capture;
      },
      findById: findCapture
    },
    readings: {
      async create(input) {
        await findCapture(input.captureId);
        const storedLensId = input.lensId.startsWith("mock-") ? "naturalist" : input.lensId;
        await findLens(storedLensId);
        const id = await nextId(pool, "readings", "read");
        const status = input.lensId === "mock-failed" ? "failed" : input.lensId === "mock-empty" ? "empty" : input.lensId === "mock-timeout" ? "timeout" : "queued";
        const failureReason = status === "failed" ? "MODEL_ERROR" : status === "timeout" ? "TIMEOUT" : null;
        const emptyReason = status === "empty" ? "BLURRY" : null;

        await pool.execute(
          `INSERT INTO readings (
            id,
            owner_id,
            capture_id,
            lens_id,
            status,
            failure_reason,
            empty_reason,
            annotations_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, currentUserId(), input.captureId, storedLensId, status, failureReason, emptyReason, JSON.stringify(annotations)]
        );

        return findReading(id);
      },
      findById: findReading,
      async getDetail(id) {
        const reading = await findReading(id);
        if (reading.status === "failed" || reading.status === "timeout") {
          return {
            id: reading.id,
            status: reading.status,
            failureReason: reading.status === "timeout" ? "TIMEOUT" : "MODEL_ERROR",
            userMessage: reading.status === "timeout" ? "解析超时，请稍后重试" : "解析失败，请稍后重试"
          };
        }
        if (reading.status === "empty") {
          return { id: reading.id, status: "empty", emptyReason: "BLURRY", userMessage: "这片视野太模糊了，试试靠近一点？" };
        }

        if (reading.status === "queued") {
          await pool.execute("UPDATE readings SET status = 'processing' WHERE id = ?", [id]);
          return { id: reading.id, status: "processing", progress: 0.42, pollAfterMs: 800 };
        }

        const wasAlreadySucceeded = reading.status === "succeeded";
        const capture = await findCapture(reading.captureId);
        const lens = await findLens(reading.lensId);
        const shortLens = toShortLens(lens);
        const generated = await aiProvider.createReadingSummary({ lensName: lens.name });
        await pool.execute(
          `UPDATE readings
          SET status = 'succeeded',
            summary = ?,
            completed_at = COALESCE(completed_at, UTC_TIMESTAMP()),
            annotations_json = ?
          WHERE id = ?`,
          [generated.summary, JSON.stringify(generated.annotations), id]
        );
        if (!wasAlreadySucceeded) await incrementLensUsage(pool, reading.lensId);
        const updated = await findReading(id);

        return {
          id: reading.id,
          captureId: reading.captureId,
          imageUrl: capture.imageUrl,
          status: "succeeded",
          lens: shortLens,
          summary: generated.summary,
          annotations: generated.annotations,
          createdAt: updated.createdAt,
          completedAt: updated.completedAt
        };
      },
      async retry(input) {
        const old = await findReading(input.readingId);
        const newReading = await this.create({ captureId: old.captureId, lensId: input.lensId ?? old.lensId });
        return { id: newReading.id, status: "queued", pollAfterMs: 800 };
      }
    },
    slices: {
      async create(input) {
        const existingRows = await queryRows<RowDataPacket>(pool, "SELECT id FROM slices WHERE reading_id = ? AND owner_id = ? LIMIT 1", [input.readingId, currentUserId()]);
        const existing = existingRows[0];
        if (existing?.id) return { sliceId: String(existing.id), alreadySaved: true };

        const reading = await findReading(input.readingId);
        const capture = await findCapture(reading.captureId);
        const lens = await findLens(reading.lensId);
        const id = await nextId(pool, "slices", "slice");
        const summary = `${lens.name}视角下，普通现场显露出另一层秩序。`;

        await pool.execute(
          `INSERT INTO slices (
            id,
            owner_id,
            reading_id,
            capture_id,
            lens_id,
            image_url,
            thumbnail_url,
            summary,
            annotations_json,
            is_public,
            resonance_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            currentUserId(),
            reading.id,
            capture.id,
            lens.id,
            capture.imageUrl,
            storageProvider.publicUrl(`slices/${id}_thumb.jpg`),
            summary,
            JSON.stringify(annotations),
            input.isPublic,
            0
          ]
        );

        return { sliceId: id, alreadySaved: false };
      },
      async list(input) {
        if (input.empty) {
          return {
            total: 0,
            filters: [],
            items: [],
            nextCursor: null,
            hasMore: false,
            emptyState: collectionEmptyState()
          };
        }

        const filters = await sliceFilters(pool);
        const params: unknown[] = [currentUserId()];
        const where = ["s.owner_id = ?"];
        if (input.lensId && input.lensId !== "ALL") {
          where.push("s.lens_id = ?");
          params.push(input.lensId);
        }
        const rows = await queryRows<SliceListRow>(
          pool,
          `SELECT
            s.id,
            s.thumbnail_url,
            s.summary,
            s.created_at,
            c.private_text,
            l.id AS lens_id,
            l.name AS lens_name,
            l.english_name,
            l.category,
            l.color,
            l.icon
          FROM slices s
          JOIN lenses l ON l.id = s.lens_id
          LEFT JOIN captures c ON c.id = s.capture_id
          WHERE ${where.join(" AND ")}
          ORDER BY s.created_at DESC`,
          params
        );

        if (!rows.length) {
          return {
            total: 0,
            filters,
            items: [],
            nextCursor: null,
            hasMore: false,
            emptyState: input.lensId && input.lensId !== "ALL" ? filterEmptyState() : collectionEmptyState()
          };
        }

        return {
          total: rows.length,
          filters,
          items: rows.map((row) => ({
            id: row.id,
            lens: {
              id: row.lens_id,
              name: row.lens_name,
              englishName: row.english_name,
              category: row.category,
              color: row.color,
              icon: row.icon
            },
            thumbnailUrl: row.thumbnail_url,
            summary: row.summary,
            dateLabel: dateLabel(new Date(row.created_at)),
            locationText: row.private_text,
            createdAt: toIso(row.created_at)
          })),
          nextCursor: null,
          hasMore: false,
          emptyState: null
        };
      },
      async findById(id) {
        const rows = await queryRows<SliceDetailRow>(
          pool,
          `SELECT
            s.*,
            c.private_text,
            l.id AS lens_id,
            l.name AS lens_name,
            l.english_name,
            l.category,
            l.color,
            l.icon
          FROM slices s
          JOIN lenses l ON l.id = s.lens_id
          LEFT JOIN captures c ON c.id = s.capture_id
          WHERE s.id = ? AND s.owner_id = ?
          LIMIT 1`,
          [id, currentUserId()]
        );
        const row = rows[0];
        if (!row) throw new PrismError("PRISM_NOT_FOUND", "slice not found", 404);
        return {
          id: row.id,
          readingId: row.reading_id,
          captureId: row.capture_id,
          imageUrl: row.image_url,
          lens: {
            id: row.lens_id,
            name: row.lens_name,
            englishName: row.english_name,
            category: row.category,
            color: row.color,
            icon: row.icon
          },
          summary: row.summary,
          annotations: parseJson(row.annotations_json, annotations),
          location: row.private_text ? { privateText: row.private_text } : undefined,
          isPublic: Boolean(row.is_public),
          resonanceCount: Number(row.resonance_count),
          createdAt: toIso(row.created_at)
        };
      },
      async delete(id) {
        await pool.execute("DELETE FROM export_tasks WHERE slice_id = ? AND owner_id = ?", [id, currentUserId()]);
        const [result] = await pool.execute(`DELETE FROM slices WHERE id = ? AND owner_id = ?`, [id, currentUserId()]);
        return { deleted: (result as { affectedRows?: number }).affectedRows !== 0 };
      },
      async reanalyze(input) {
        const rows = await queryRows<RowDataPacket & { capture_id: string }>(pool, "SELECT capture_id FROM slices WHERE id = ? AND owner_id = ? LIMIT 1", [input.sliceId, currentUserId()]);
        const row = rows[0];
        if (!row) throw new PrismError("PRISM_NOT_FOUND", "slice not found", 404);
        const reading = await createReadingRecord(pool, row.capture_id, input.lensId);
        return { captureId: row.capture_id, id: reading.id, status: "queued", nextRoute: "lens-result" };
      },
      async createExport(input) {
        const rows = await queryRows<RowDataPacket & { id: string }>(pool, "SELECT id FROM slices WHERE id = ? AND owner_id = ? LIMIT 1", [input.sliceId, currentUserId()]);
        if (!rows[0]) throw new PrismError("PRISM_NOT_FOUND", "slice not found", 404);
        const id = await nextId(pool, "export_tasks", "export");
        const exportKey = `exports/${input.sliceId}.png`;
        const exported = await storageProvider.putObject({ key: exportKey, bytes: placeholderPng(), contentType: "image/png" });
        await pool.execute(
          `INSERT INTO export_tasks (
            id, owner_id, slice_id, status, format, include_location, template, export_url, completed_at, expires_at
          ) VALUES (?, ?, ?, 'succeeded', ?, ?, ?, ?, UTC_TIMESTAMP(), DATE_ADD(UTC_TIMESTAMP(), INTERVAL 1 DAY))`,
          [id, currentUserId(), input.sliceId, input.format, input.includeLocation, input.template, exported.url]
        );
        return { exportTaskId: id, status: "processing", pollAfterMs: 1000 };
      }
    },
    community: {
      async discover() {
        const challenge = currentChallengePayload();
        const trending = await thisLikeLensTrending(pool);
        const signalFeed = await publicSignalFeed(pool, {});
        const observerRows = await queryRows<RowDataPacket & { count: number | string }>(pool, "SELECT COUNT(*) AS count FROM observers");
        return {
          observerCount: Number(observerRows[0]?.count ?? 0),
          weeklyChallenge: challenge,
          trendingLenses: trending.items.map((item) => ({ id: item.id, name: item.name, color: item.color, heat: item.heat })),
          signalFeed,
          emptyState: null
        };
      },
      async currentChallenge() {
        return {
          ...currentChallengePayload(),
          description: "把每天经过的地方想象成千年后的考古现场",
          endsAt: "2026-05-20T23:59:59+08:00",
          progress: 0.4
        };
      },
      async joinChallenge() {
        return { hasJoined: true, joinedCount: 39, suggestedLensId: "ruin-archaeology", nextRoute: "capture" };
      },
      async listSignals(input) {
        if (input.empty) return emptySignalFeed();
        return publicSignalFeed(pool, input);
      },
      async findSignal(signalId) {
        const sliceId = signalToSliceId(signalId);
        const rows = await publicSignalRows(pool, { sliceId });
        const row = rows[0];
        if (!row) throw new PrismError("PRISM_NOT_FOUND", "signal not found", 404);
        return mapSignal(row, true);
      },
      async resonate(signalId) {
        const sliceId = signalToSliceId(signalId);
        await pool.execute("UPDATE slices SET resonance_count = resonance_count + 1 WHERE id = ? AND is_public = TRUE", [sliceId]);
        const rows = await queryRows<RowDataPacket & { resonance_count: number | string }>(pool, "SELECT resonance_count FROM slices WHERE id = ? LIMIT 1", [sliceId]);
        return { hasResonated: true, resonanceCount: Number(rows[0]?.resonance_count ?? 0) };
      },
      async unresonate(signalId) {
        const sliceId = signalToSliceId(signalId);
        await pool.execute("UPDATE slices SET resonance_count = GREATEST(resonance_count - 1, 0) WHERE id = ? AND is_public = TRUE", [sliceId]);
        const rows = await queryRows<RowDataPacket & { resonance_count: number | string }>(pool, "SELECT resonance_count FROM slices WHERE id = ? LIMIT 1", [sliceId]);
        return { hasResonated: false, resonanceCount: Number(rows[0]?.resonance_count ?? 0) };
      },
      async saveSignal(signalId) {
        const sourceId = signalToSliceId(signalId);
        const rows = await queryRows<SliceDetailRow>(
          pool,
          `SELECT
            s.*,
            c.private_text,
            l.id AS lens_id,
            l.name AS lens_name,
            l.english_name,
            l.category,
            l.color,
            l.icon
          FROM slices s
          JOIN lenses l ON l.id = s.lens_id
          LEFT JOIN captures c ON c.id = s.capture_id
          WHERE s.id = ? AND s.is_public = TRUE
          LIMIT 1`,
          [sourceId]
        );
        const source = rows[0];
        if (!source) throw new PrismError("PRISM_NOT_FOUND", "signal not found", 404);
        const id = await nextId(pool, "slices", "slice");
        await pool.execute(
          `INSERT INTO slices (
            id, owner_id, reading_id, capture_id, lens_id, image_url, thumbnail_url, summary, annotations_json, is_public, resonance_count
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, 0)`,
          [id, currentUserId(), source.reading_id, source.capture_id, source.lens_id, source.image_url, source.thumbnail_url, source.summary, source.annotations_json]
        );
        return { sliceId: id, alreadySaved: false };
      },
      async reportSignal(signalId) {
        signalToSliceId(signalId);
        return { reported: true };
      }
    },
    exports: {
      async findById(id) {
        const rows = await queryRows<ExportTaskRow>(pool, "SELECT * FROM export_tasks WHERE id = ? AND owner_id = ? LIMIT 1", [id, currentUserId()]);
        const row = rows[0];
        if (!row) throw new PrismError("PRISM_NOT_FOUND", "export task not found", 404);
        return {
          id: row.id,
          status: row.status,
          exportUrl: row.export_url,
          expiresAt: row.expires_at ? toIso(row.expires_at) : null,
          error: row.error_json ? parseJson(row.error_json, null) : undefined
        };
      }
    },
    lensCreator: {
      async createSession(input) {
        const id = await nextId(pool, "lens_creator_sessions", "lc");
        await pool.execute(
          "INSERT INTO lens_creator_sessions (id, owner_id, status, entry) VALUES (?, ?, 'asking', ?)",
          [id, currentUserId(), input.entry ?? null]
        );
        return { sessionId: id, status: "asking", assistantMessage: "你想用什么样的视角看世界？" };
      },
      async transcribeAudio(sessionId) {
        await ensureLensCreatorSession(pool, sessionId);
        const transcript = "我想用一个考古学家的视角看城市。";
        await pool.execute("UPDATE lens_creator_sessions SET transcript = ? WHERE id = ? AND owner_id = ?", [transcript, sessionId, currentUserId()]);
        return { transcript, confidence: 0.91 };
      },
      async sendMessage(sessionId, input) {
        await ensureLensCreatorSession(pool, sessionId);
        const draftLens = await aiProvider.draftLens({ text: input.text });
        await pool.execute(
          "UPDATE lens_creator_sessions SET status = 'draft_ready', transcript = ?, draft_lens_json = ? WHERE id = ? AND owner_id = ?",
          [input.text, JSON.stringify(draftLens), sessionId, currentUserId()]
        );
        return { sessionId, status: "draft_ready", assistantMessage: "我为你生成了一枚镜片草稿。", draftLens };
      },
      async confirm(sessionId) {
        const session = await ensureLensCreatorSession(pool, sessionId);
        const draft = parseJson(
          session.draft_lens_json,
          await aiProvider.draftLens({ text: session.transcript ?? "私人观察者" })
        );
        const id = uniqueCustomLensId(String(draft.englishName ?? draft.name));
        await pool.execute(
          `INSERT INTO lenses (
            id, name, english_name, category, color, icon, description, full_description, prompt, is_preset, is_available, created_by
          ) VALUES (?, ?, ?, 'CUSTOM', ?, 'ti-eye', ?, ?, ?, FALSE, TRUE, ?)
          ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), prompt = VALUES(prompt), is_available = TRUE`,
          [id, draft.name, draft.englishName, draft.color, draft.description, draft.description, draft.prompt, currentUserId()]
        );
        await pool.execute("UPDATE lens_creator_sessions SET status = 'confirmed' WHERE id = ? AND owner_id = ?", [sessionId, currentUserId()]);
        return {
          lens: {
            id,
            name: draft.name,
            englishName: draft.englishName,
            category: "CUSTOM",
            color: draft.color,
            icon: "ti-eye",
            description: draft.description,
            usageCount: 0,
            isPreset: false,
            isAvailable: true
          }
        };
      }
    },
    system: {
      async legalDoc(docType) {
        if (!["terms", "privacy"].includes(docType)) throw new PrismError("PRISM_NOT_FOUND", "legal document not found", 404);
        return {
          docType,
          title: docType === "terms" ? "用户协议" : "隐私政策",
          version: "2026.05.17",
          contentMarkdown: `## ${docType === "terms" ? "用户协议" : "隐私政策"}\n\n世界观透镜 MVP 开发环境文档。`
        };
      },
      async clientConfig() {
        return {
          permissions: {
            camera: { title: "需要相机权限", description: "用于拍摄你正在观察的现实现场。" },
            location: { title: "需要位置权限", description: "用于为私人切片保留时空坐标，社区展示会自动模糊。" },
            microphone: { title: "需要麦克风权限", description: "用于通过语音创建自定义镜片。" }
          },
          providers: {
            ai: aiProvider.providerName,
            storage: storageProvider.providerName
          }
        };
      }
    }
  };
}

type ObserverRow = RowDataPacket & {
  id: string;
  observer_code: string;
  observer_no: string;
  email: string | null;
  phone: string | null;
  is_anonymous: number | boolean;
  active_since: Date | string;
};

type SettingsRow = RowDataPacket & {
  show_community_location: number | boolean;
  location_precision: Settings["locationPrecision"];
  challenge_notifications: number | boolean;
  interface_theme: Settings["interfaceTheme"];
  default_slice_public: number | boolean;
};

type LensRow = RowDataPacket & {
  id: string;
  name: string;
  english_name: string;
  category: Lens["category"];
  color: string;
  icon: string;
  description: string;
  full_description: string | null;
  prompt: string | null;
  usage_count: number | string;
  global_usage_count: number | string;
  is_preset: number | boolean;
  is_available: number | boolean;
  created_by: string | null;
  created_at: Date | string;
};

type CaptureRow = RowDataPacket & {
  id: string;
  image_url: string;
  thumbnail_url: string | null;
  width: number;
  height: number;
  mime_type: CaptureAsset["mimeType"];
  captured_at: Date | string;
  latitude: number | string | null;
  longitude: number | string | null;
  accuracy_meters: number | null;
  city: string | null;
  province: string | null;
  private_text: string | null;
  public_text: string | null;
};

type ReadingRow = RowDataPacket & {
  id: string;
  capture_id: string;
  lens_id: string;
  status: Reading["status"];
  created_at: Date | string;
  completed_at: Date | string | null;
};

type StatsRow = RowDataPacket & {
  slice_count: number | string;
  used_lens_count: number | string;
  location_count: number | string | null;
  resonance_received: number | string | null;
};

type SliceListRow = RowDataPacket & {
  id: string;
  thumbnail_url: string;
  summary: string;
  created_at: Date | string;
  private_text: string | null;
  lens_id: string;
  lens_name: string;
  english_name: string;
  category: Lens["category"];
  color: string;
  icon: string;
};

type SliceDetailRow = SliceListRow & {
  reading_id: string;
  capture_id: string;
  image_url: string;
  annotations_json: string;
  is_public: number | boolean;
  resonance_count: number | string;
};

type PublicSignalRow = SliceDetailRow & {
  observer_code: string;
  public_text: string | null;
};

type ExportTaskRow = RowDataPacket & {
  id: string;
  status: "processing" | "succeeded" | "failed";
  export_url: string | null;
  expires_at: Date | string | null;
  error_json: string | null;
};

type LensCreatorSessionRow = RowDataPacket & {
  id: string;
  status: "asking" | "draft_ready" | "confirmed";
  transcript: string | null;
  draft_lens_json: string | null;
};

async function queryRows<T extends RowDataPacket>(pool: Pool, sql: string, params: unknown[] = []) {
  const [rows] = await pool.query<T[]>(sql, params);
  return rows;
}

async function tableExists(pool: Pool, tableName: string) {
  const rows = await queryRows<RowDataPacket & { count: number }>(
    pool,
    `SELECT COUNT(*) AS count
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows[0]?.count ?? 0) > 0;
}

async function nextId(pool: Pool, table: string, prefix: string) {
  const [result] = await pool.query<RowDataPacket[]>(
    `SELECT id
    FROM ${table}
    WHERE id LIKE ?
    ORDER BY CAST(SUBSTRING(id, ?) AS UNSIGNED) DESC
    LIMIT 1`,
    [`${prefix}_%`, prefix.length + 2]
  );
  const current = String(result[0]?.id ?? "");
  const currentNo = Number(current.slice(prefix.length + 1));
  const nextNo = Number.isFinite(currentNo) ? currentNo + 1 : 1;
  return `${prefix}_${String(nextNo).padStart(2, "0")}`;
}

async function createReadingRecord(pool: Pool, captureId: string, lensId: string) {
  await queryRows<CaptureRow>(pool, "SELECT * FROM captures WHERE id = ? AND owner_id = ? LIMIT 1", [captureId, currentUserId()]).then((rows) => {
    if (!rows[0]) throw new PrismError("PRISM_NOT_FOUND", "capture not found", 404);
  });
  const storedLensId = lensId.startsWith("mock-") ? "naturalist" : lensId;
  const id = await nextId(pool, "readings", "read");
  const status = lensId === "mock-failed" ? "failed" : lensId === "mock-empty" ? "empty" : lensId === "mock-timeout" ? "timeout" : "queued";
  const failureReason = status === "failed" ? "MODEL_ERROR" : status === "timeout" ? "TIMEOUT" : null;
  const emptyReason = status === "empty" ? "BLURRY" : null;
  await pool.execute(
    `INSERT INTO readings (
      id,
      owner_id,
      capture_id,
      lens_id,
      status,
      failure_reason,
      empty_reason,
      annotations_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, currentUserId(), captureId, storedLensId, status, failureReason, emptyReason, JSON.stringify(annotations)]
  );
  const rows = await queryRows<ReadingRow>(pool, "SELECT * FROM readings WHERE id = ? AND owner_id = ? LIMIT 1", [id, currentUserId()]);
  return mapReading(required(rows[0], "reading not found"));
}

async function ensureLensCreatorSession(pool: Pool, sessionId: string) {
  const rows = await queryRows<LensCreatorSessionRow>(pool, "SELECT * FROM lens_creator_sessions WHERE id = ? AND owner_id = ? LIMIT 1", [sessionId, currentUserId()]);
  const row = rows[0];
  if (!row) throw new PrismError("PRISM_NOT_FOUND", "lens creator session not found", 404);
  return row;
}

async function ensureObserver(pool: Pool) {
  const rows = await queryRows<ObserverRow>(pool, "SELECT * FROM observers WHERE id = ? LIMIT 1", [currentUserId()]);
  if (rows[0]) return;
  await pool.execute(
    `INSERT INTO observers (id, observer_code, observer_no, email, is_anonymous, active_since)
    VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
    [seedObserver.id, seedObserver.observerCode, seedObserver.observerNo, seedObserver.email ?? null, seedObserver.isAnonymous]
  );
  await ensureSettings(pool);
}

async function ensureSettings(pool: Pool) {
  await ensureObserverWithoutSettings(pool);
  await ensureSettingsForUser(pool, currentUserId());
}

async function ensureSettingsForUser(pool: Pool, userId: string) {
  await pool.execute(
    `INSERT IGNORE INTO observer_settings (
      observer_id,
      show_community_location,
      location_precision,
      challenge_notifications,
      interface_theme,
      default_slice_public
    ) VALUES (?, TRUE, 'CITY', TRUE, 'DARK', FALSE)`,
    [userId]
  );
}

async function ensureObserverWithoutSettings(pool: Pool) {
  const rows = await queryRows<ObserverRow>(pool, "SELECT * FROM observers WHERE id = ? LIMIT 1", [currentUserId()]);
  if (rows[0]) return;
  await pool.execute(
    `INSERT INTO observers (id, observer_code, observer_no, email, is_anonymous, active_since)
    VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
    [seedObserver.id, seedObserver.observerCode, seedObserver.observerNo, seedObserver.email ?? null, seedObserver.isAnonymous]
  );
}

async function incrementLensUsage(pool: Pool, lensId: string) {
  await pool.execute(
    `INSERT INTO lens_usage (observer_id, lens_id, usage_count, first_used_at, last_used_at)
    VALUES (?, ?, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP())
    ON DUPLICATE KEY UPDATE usage_count = usage_count + 1, last_used_at = UTC_TIMESTAMP()`,
    [currentUserId(), lensId]
  );
}

async function sliceFilters(pool: Pool) {
  const rows = await queryRows<RowDataPacket & { lens_id: string; name: string; color: string; count: number | string }>(
    pool,
    `SELECT l.id AS lens_id, l.name, l.color, COUNT(s.id) AS count
    FROM lenses l
    LEFT JOIN slices s ON s.lens_id = l.id AND s.owner_id = ?
    WHERE l.is_available = TRUE
      AND (l.is_preset = TRUE OR l.created_by = ?)
    GROUP BY l.id, l.name, l.color
    ORDER BY l.is_preset DESC, l.created_at ASC
    LIMIT 4`,
    [currentUserId(), currentUserId()]
  );
  return rows.map((row) => ({ lensId: row.lens_id, name: row.name, color: row.color, count: Number(row.count) }));
}

async function thisLikeLensTrending(pool: Pool, limit = 4) {
  const rows = await queryRows<LensRow>(
    pool,
    `SELECT
      l.*,
      COALESCE(lu.usage_count, 0) AS usage_count,
      COALESCE(global_usage.global_usage_count, 0) AS global_usage_count
    FROM lenses l
    LEFT JOIN lens_usage lu ON lu.lens_id = l.id AND lu.observer_id = ?
    LEFT JOIN (
      SELECT lens_id, SUM(usage_count) AS global_usage_count
      FROM lens_usage
      GROUP BY lens_id
    ) global_usage ON global_usage.lens_id = l.id
    WHERE l.is_available = TRUE
      AND l.is_preset = TRUE
    ORDER BY global_usage_count DESC, l.created_at ASC
    LIMIT ?`,
    [currentUserId(), limit]
  );
  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      englishName: row.english_name,
      color: row.color,
      icon: row.icon,
      heat: Number(row.global_usage_count ?? 0)
    }))
  };
}

async function publicSignalFeed(pool: Pool, input: { lensId?: string; challengeId?: string }) {
  const rows = await publicSignalRows(pool, input);
  if (!rows.length) return emptySignalFeed();
  return {
    items: rows.map((row) => mapSignal(row, false)),
    nextCursor: null,
    hasMore: false,
    emptyState: null
  };
}

async function publicSignalRows(pool: Pool, input: { sliceId?: string; lensId?: string; challengeId?: string }) {
  const params: unknown[] = [];
  const where = ["s.is_public = TRUE"];
  if (input.sliceId) {
    where.push("s.id = ?");
    params.push(input.sliceId);
  }
  if (input.lensId) {
    where.push("s.lens_id = ?");
    params.push(input.lensId);
  }
  if (input.challengeId) {
    where.push("s.lens_id = ?");
    params.push("ruin-archaeology");
  }
  return queryRows<PublicSignalRow>(
    pool,
    `SELECT
      s.*,
      o.observer_code,
      c.private_text,
      c.public_text,
      l.id AS lens_id,
      l.name AS lens_name,
      l.english_name,
      l.category,
      l.color,
      l.icon
    FROM slices s
    JOIN observers o ON o.id = s.owner_id
    JOIN lenses l ON l.id = s.lens_id
    LEFT JOIN captures c ON c.id = s.capture_id
    WHERE ${where.join(" AND ")}
    ORDER BY s.created_at DESC
    LIMIT 20`,
    params
  );
}

function mapSignal(row: PublicSignalRow, detail: boolean) {
  const parsedAnnotations = parseJson(row.annotations_json, annotations);
  const base = {
    id: `signal_${row.id}`,
    sliceId: row.id,
    observerCode: row.observer_code,
    timeLabel: "just now",
    lens: {
      id: row.lens_id,
      name: row.lens_name,
      englishName: row.english_name,
      category: row.category,
      color: row.color,
      icon: row.icon
    },
    thumbnailUrl: row.thumbnail_url,
    summary: row.summary,
    annotationsPreview: parsedAnnotations.slice(0, 2).map((annotation) => ({ text: annotation.text, target: annotation.target })),
    locationText: row.public_text,
    resonanceCount: Number(row.resonance_count),
    hasResonated: false,
    createdAt: toIso(row.created_at)
  };
  return detail ? { ...base, imageUrl: row.image_url, annotations: parsedAnnotations } : base;
}

function signalToSliceId(signalId: string) {
  return signalId.startsWith("signal_") ? signalId.slice("signal_".length) : signalId;
}

function emptySignalFeed() {
  return {
    items: [],
    nextCursor: null,
    hasMore: false,
    emptyState: {
      type: "signal_empty",
      title: "暂无信号",
      subtitle: "成为第一个观察者",
      actionText: "BEGIN OBSERVATION",
      actionRoute: "capture"
    }
  };
}

function currentChallengePayload() {
  return {
    id: "challenge_07",
    issueNo: "#07",
    title: "用废墟考古的眼光看你的通勤路",
    lensId: "ruin-archaeology",
    lensColor: "#F0997B",
    joinedCount: 38,
    hasJoined: false,
    daysLeft: 3
  };
}

function lastSevenDates() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
}

function weekdayLabel(date: string) {
  return ["S", "M", "T", "W", "T", "F", "S"][new Date(`${date}T00:00:00Z`).getUTCDay()] ?? "M";
}

function uniqueCustomLensId(value: string) {
  return `custom_${value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "lens"}_${Date.now().toString(36)}`;
}

function validateCaptureImage(image: { type?: string; size?: number } | undefined) {
  if (!image) return;
  const supported = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  if (image.type && !supported.includes(image.type)) {
    throw new PrismError("PRISM_UNSUPPORTED_IMAGE", "unsupported image type", 400);
  }
  if (image.size && image.size > 10 * 1024 * 1024) {
    throw new PrismError("PRISM_IMAGE_TOO_LARGE", "image too large", 413);
  }
}

function mimeExtension(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  if (mimeType === "image/heic") return "heic";
  return "jpg";
}

function normalizeImageMimeType(mimeType: string | undefined): CaptureAsset["mimeType"] {
  if (mimeType === "image/png" || mimeType === "image/webp" || mimeType === "image/heic") return mimeType;
  return "image/jpeg";
}

function placeholderPng() {
  return Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21,
    196, 137, 0, 0, 0, 13, 73, 68, 65, 84, 120, 156, 99, 96, 96, 96, 248, 15, 0, 1, 5, 1, 2, 160, 174, 139, 123,
    0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
  ]);
}

function mapObserver(row: ObserverRow): Observer {
  return {
    id: row.id,
    observerCode: row.observer_code,
    observerNo: row.observer_no,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    isAnonymous: Boolean(row.is_anonymous),
    activeSince: toIso(row.active_since),
    activeSinceLabel: `ACTIVE SINCE ${toIso(row.active_since).slice(0, 10).replaceAll("-", ".")}`
  };
}

function mapSettings(row: SettingsRow): Settings {
  return {
    showCommunityLocation: Boolean(row.show_community_location),
    locationPrecision: row.location_precision,
    challengeNotifications: Boolean(row.challenge_notifications),
    interfaceTheme: row.interface_theme,
    defaultSlicePublic: Boolean(row.default_slice_public)
  };
}

function mapLens(row: LensRow): Lens {
  return {
    id: row.id,
    name: row.name,
    englishName: row.english_name,
    category: row.category,
    color: row.color,
    icon: row.icon,
    description: row.description,
    fullDescription: row.full_description ?? undefined,
    prompt: row.prompt ?? undefined,
    usageCount: Number(row.usage_count ?? 0),
    globalUsageCount: Number(row.global_usage_count ?? 0),
    isPreset: Boolean(row.is_preset),
    isAvailable: Boolean(row.is_available),
    createdBy: row.created_by ?? undefined,
    createdAt: toIso(row.created_at)
  };
}

function mapCapture(row: CaptureRow): CaptureAsset {
  return {
    id: row.id,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    width: row.width,
    height: row.height,
    mimeType: row.mime_type,
    capturedAt: toIso(row.captured_at),
    location:
      row.latitude !== null && row.longitude !== null
        ? {
            latitude: Number(row.latitude),
            longitude: Number(row.longitude),
            accuracyMeters: row.accuracy_meters ?? undefined,
            city: row.city ?? undefined,
            province: row.province ?? undefined,
            privateText: row.private_text ?? `${row.latitude}, ${row.longitude}`,
            publicText: row.public_text ?? `${row.latitude}, ${row.longitude}`
          }
        : undefined
  };
}

function mapReading(row: ReadingRow): Reading {
  return {
    id: row.id,
    captureId: row.capture_id,
    lensId: row.lens_id,
    status: row.status,
    createdAt: toIso(row.created_at),
    completedAt: row.completed_at ? toIso(row.completed_at) : undefined,
    polls: row.status === "queued" ? 0 : 1
  };
}

function toShortLens(lens: Lens): Slice["lens"] {
  return {
    id: lens.id,
    name: lens.name,
    englishName: lens.englishName,
    category: lens.category,
    color: lens.color,
    icon: lens.icon
  };
}

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new PrismError("PRISM_NOT_FOUND", message, 404);
  return value;
}

function toMysqlDateTime(value: string) {
  return new Date(value).toISOString().slice(0, 19).replace("T", " ");
}

function toIso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function collectionEmptyState() {
  return {
    type: "collection_empty",
    title: "还没有认知切片",
    subtitle: "拍下第一张照片，开始收藏你的视角",
    actionText: "BEGIN OBSERVATION",
    actionRoute: "capture"
  };
}

function filterEmptyState() {
  return {
    type: "filter_empty",
    title: "该镜片下暂无切片",
    actionText: "CAPTURE WITH THIS LENS",
    actionRoute: "capture"
  };
}
