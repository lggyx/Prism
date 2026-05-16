import { dirname, isAbsolute, join } from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

export type StorageProvider = {
  providerName: string;
  putObject(input: { key: string; bytes: Uint8Array; contentType: string }): Promise<{ url: string }>;
  publicUrl(path: string): string;
  rootDir: string;
};

export function createLocalStorageProvider(input: { publicBaseUrl?: string; rootDir?: string } = {}): StorageProvider {
  const baseUrl = input.publicBaseUrl ?? process.env.PUBLIC_ASSET_BASE_URL ?? "/assets";
  const rootDir = resolveRootDir(input.rootDir ?? process.env.PUBLIC_ASSET_ROOT_DIR ?? "storage");
  return {
    providerName: "local",
    rootDir,
    async putObject(object) {
      const relativePath = object.key.replace(/^\/+/, "");
      const filePath = join(rootDir, relativePath);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, object.bytes);
      return { url: `${baseUrl}/${relativePath}` };
    },
    publicUrl(path) {
      return `${baseUrl}/${path.replace(/^\/+/, "")}`;
    }
  };
}

function resolveRootDir(rootDir: string) {
  return isAbsolute(rootDir) ? rootDir : join(process.cwd(), rootDir);
}
