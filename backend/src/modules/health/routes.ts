import { Hono } from "hono";
import { sendOk } from "../../shared/response";

export function createHealthRoutes() {
  const app = new Hono();

  app.get("/", (c) =>
    sendOk(c, {
      service: "prism-backend",
      version: "0.1.0",
      docs: "backend/docs/世界观透镜_后端并行开发接口文档_v2.md"
    })
  );

  app.get("/health", (c) =>
    sendOk(c, {
      status: "ok",
      service: "prism-backend",
      time: new Date().toISOString()
    })
  );

  return app;
}
