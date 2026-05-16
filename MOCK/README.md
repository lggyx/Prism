# 世界观透镜 Mock Server

零依赖 Node.js mock 服务，按 `frontend/doc/世界观透镜_后端并行开发接口文档_v2.md` 实现 `/api/v1` 接口。

## 启动

```bash
cd MOCK
npm start
```

默认地址：

```text
http://localhost:3000/api/v1
```

可用环境变量：

```bash
PORT=3001 npm start
```

## 测试

```bash
cd MOCK
npm test
```

测试脚本会启动临时 mock 服务，覆盖登录、镜片、上传、AI 轮询、切片、发现、挑战、共鸣、导出、设置、协议和客户端配置等接口。

## 便利用法

部分列表接口支持调试空态：

```text
GET /api/v1/slices?empty=1
GET /api/v1/slices?lensId=unknown
GET /api/v1/signals?empty=1
```

AI 重述任务支持通过 `lensId` 触发边界状态：

```text
POST /api/v1/readings { "captureId": "cap_01", "lensId": "mock-failed" }
POST /api/v1/readings { "captureId": "cap_01", "lensId": "mock-empty" }
POST /api/v1/readings { "captureId": "cap_01", "lensId": "mock-timeout" }
```
