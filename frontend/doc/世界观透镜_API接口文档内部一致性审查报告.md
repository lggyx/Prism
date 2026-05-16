# 世界观透镜 — API 接口文档内部一致性审查报告

> 审查对象：[世界观透镜_后端并行开发接口文档_v2.md](./世界观透镜_后端并行开发接口文档_v2.md)  
> 审查日期：2026-05-17

---

## 结论

v2 文档已作为当前唯一实现契约。已对内部命名、路由、状态枚举、位置隐私、页面映射、优先级和 JSON 示例进行复查与修正。

机器校验结果：

```text
json_blocks=59 errors=0
```

---

## 已修正的问题

| 问题 | 修正 |
|---|---|
| v1 与 v2 并存，容易误用旧文档 | 已在 v1 顶部标注历史版本，明确 v2 为唯一实现契约 |
| 社区位置字段存在 `location.publicText` 与 `locationText` 两种表述 | 统一为接口返回 `locationText`；其值由内部 `GeoLocation.publicText` 派生 |
| 用户关闭社区位置时字段语义不清 | 统一为 `locationText = null`，且不返回经纬度 |
| 导出模块曾出现 `/slices/{id}/export` 与 `/slices/{sliceId}/export` | 统一为 `/slices/{sliceId}/export` |
| Capture 模型未覆盖约束里提到的 `image/heic` | `CaptureAsset.mimeType` 已补充 `image/heic` |
| 图片超限错误写成非文档错误码 `413 PAYLOAD_TOO_LARGE` | 统一为 `PRISM_IMAGE_TOO_LARGE` |
| 个人页活动范围与最新 G 页不一致 | 统一为 `last_7_days`，7 条数据，level 0-3 |
| 镜片详情统计字段 `usedTimes` 与 Lens 模型 `usageCount` 不一致 | 统一为 `usageCount` |
| 发现页热门镜片字段 `usageCount` 与热门镜片接口 `heat` 不一致 | 聚合接口改为 `heat` |
| `儿童之眼` 与种子数据 `儿童视角` 不一致 | 统一为 `儿童视角` |
| 筛选空状态响应缺少分页与筛选字段 | 补齐 `filters`、`nextCursor`、`hasMore` |
| `PRISM_EMPTY_READING` 作为 200 错误码语义矛盾 | 移除错误码，明确 `status="empty"` 是业务状态而非错误响应 |

---

## 当前统一规范

| 主题 | 规范 |
|---|---|
| 权威文档 | `世界观透镜_后端并行开发接口文档_v2.md` |
| 资源主键 | 对象内统一 `id`；创建响应可额外返回 `sliceId`、`exportTaskId` 等便捷取值 |
| AI 状态 | `queued / processing / succeeded / failed / timeout / empty` |
| 空结果 | `Reading.status = "empty"`，不是错误响应 |
| 私人位置 | `location.privateText` |
| 社区位置 | `locationText`，关闭时为 `null` |
| 路由提示 | `onboarding / collection / capture / lens-picker / lens-result` |
| 空状态 | 列表接口统一返回 `data.emptyState`，非空时为 `null` |
| 图片类型 | `image/jpeg / image/png / image/webp / image/heic` |

---

## 审查后仍需工程侧注意

1. `A shooting.html` 与 `B lens-selection.html` 是旧拆分原型，真实主流程应以 `B+A capture-to-lens.html` 为准。
2. `v1` 文档仅供历史参考，不应继续被后端任务或 Mock 服务引用。
3. 真实实现时需将所有 toast 型跳转映射为文档中的 `nextRoute` 或前端路由。
4. 社区接口不得返回 `GeoLocation.latitude`、`longitude`、`privateText`。

