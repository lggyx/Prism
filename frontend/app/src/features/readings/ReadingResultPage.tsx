import { Link, useNavigate } from "react-router-dom";
import { useReadingQuery, useRetryReadingMutation, useSaveSliceMutation } from "../../api/hooks";
import { PhotoSurface } from "../../components/PhotoSurface";
import { StateBlock } from "../../components/StateBlock";
import { useAppStore } from "../../stores/appStore";

export function ReadingResultPage() {
  const navigate = useNavigate();
  const storedReading = useAppStore((state) => state.reading);
  const setReading = useAppStore((state) => state.setReading);
  const selectedLens = useAppStore((state) => state.selectedLens);
  const reading = useReadingQuery(storedReading?.id);
  const saveSlice = useSaveSliceMutation();
  const retry = useRetryReadingMutation();
  const current = reading.data ?? storedReading;

  async function handleSave() {
    if (!current?.id) return;
    await saveSlice.mutateAsync({ readingId: current.id, isPublic: false });
    navigate("/collection");
  }

  async function handleRetry() {
    if (!current?.id || !(current.lens?.id || selectedLens?.id)) return;
    const next = await retry.mutateAsync({ readingId: current.id, lensId: current.lens?.id || selectedLens!.id });
    setReading(next);
  }

  if (!storedReading?.id) {
    return (
      <div className="reading-screen">
        <PhotoSurface />
        <div className="capture-overlay">
          <StateBlock title="NO READING TASK" body="请先拍摄并选择镜片。" action={<Link className="primary-button inline" to="/capture">CAPTURE</Link>} />
        </div>
      </div>
    );
  }

  const isPending = !current || current.status === "queued" || current.status === "processing";
  const isFailed = current?.status === "failed" || current?.status === "timeout" || current?.status === "empty";

  return (
    <section className="reading-screen">
      <PhotoSurface annotations={current?.annotations} imageUrl={current?.imageUrl} />
      <header className="reading-top">
        <Link to="/capture">换镜片</Link>
        <span style={{ "--lens": current?.lens?.color || selectedLens?.color || "#a78bfa" } as React.CSSProperties}>
          {current?.lens?.name || selectedLens?.name || "READING"}
        </span>
      </header>

      {isPending ? (
        <div className="capture-overlay">
          <StateBlock title="AI READING" body={`状态：${current?.status ?? "queued"}，正在轮询结果。`} />
        </div>
      ) : null}

      {reading.error ? (
        <div className="capture-overlay">
          <StateBlock tone="error" title="READING OFFLINE" body={reading.error.message} />
        </div>
      ) : null}

      {isFailed ? (
        <div className="capture-overlay">
          <StateBlock
            tone="error"
            title={current?.userMessage ?? "解析失败"}
            body="可以重试当前镜片，或返回重新拍摄。"
            action={<button className="primary-button inline" onClick={handleRetry}>RETRY</button>}
          />
        </div>
      ) : null}

      {current?.status === "succeeded" ? (
        <footer className="reading-actions">
          <p>{current.summary}</p>
          <button className="primary-button" onClick={handleSave} disabled={saveSlice.isPending}>
            {saveSlice.isPending ? "SAVING" : "SAVE SLICE"}
          </button>
        </footer>
      ) : null}
    </section>
  );
}
