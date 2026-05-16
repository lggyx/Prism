# 世界观透镜 — Capacitor 插件需求目录

> 基于《世界观透镜_后端并行开发接口文档_v2.md》、《世界观透镜_UI交互设计规范_v2.md》、《世界观透镜_项目进度总结.md》及全部前端原型页面整理。
>
> 技术栈：React + Capacitor（Android 优先，iOS 后续）
>
> 依赖管理：统一使用 **Bun**，不使用 npm / pnpm / yarn。

---

## 目录总览

| # | 插件 | 包名 | 优先级 | 关联页面/功能 |
|---|------|----------|--------|---------------|
| 1 | Camera Preview（自定义取景） | `@capacitor-community/camera-preview` | **P0** | A 取景页 |
| 2 | Geolocation（GPS 定位） | `@capacitor/geolocation` | **P0** | A 取景页、拍摄上传、切片坐标 |
| 3 | HTTP / 网络请求 | `@capacitor/core`（fetch）或 `axios` | **P0** | 全部后端 API 调用 |
| 4 | Preferences（本地键值存储） | `@capacitor/preferences` | **P0** | Token 存储、设备 ID、本地设置 |
| 5 | Device（设备信息） | `@capacitor/device` | **P0** | 生成 X-Device-Id |
| 6 | Splash Screen（启动屏） | `@capacitor/splash-screen` | **P0** | 0-1 splash.html |
| 7 | Status Bar（状态栏控制） | `@capacitor/status-bar` | **P0** | 全局深色沉浸式 UI |
| 8 | Keyboard（键盘控制） | `@capacitor/keyboard` | **P1** | H auth.html 输入框 |
| 9 | Haptics（触觉反馈） | `@capacitor/haptics` | **P1** | 快门按钮、保存切片动效 |
| 10 | Network（网络状态检测） | `@capacitor/network` | **P1** | 离线/弱网状态提示 |
| 11 | Filesystem（文件系统） | `@capacitor/filesystem` | **P2** | 导出分享图保存到本地 |
| 12 | Share（系统分享） | `@capacitor/share` | **P2** | X-4 分享预览页 |
| 13 | 录音（语音录制） | `@capacitor-community/media` 或原生录音插件 | **P2** | B-1 语聊创建镜片 |
| 14 | App（应用生命周期） | `@capacitor/app` | **P1** | 前后台切换、深度链接 |
| 15 | Local Notifications（本地通知） | `@capacitor/local-notifications` | **P2** | 挑战提醒通知 |

---

## 1. Camera Preview — 自定义取景界面

**包名**: `@capacitor-community/camera-preview`

**优先级**: P0（核心流程第一步）

**关联页面**: [`A shooting.html`](Prism/frontend/A%20shooting.html) → [`B+A capture-to-lens.html`](Prism/frontend/B+A%20capture-to-lens.html)

**为什么不用 `@capacitor/camera`**：产品要求自定义取景 UI（同心圆准星、十字线、GPS 背印、仪器参数叠层），标准 Camera 插件只能调用系统相机，无法实现自定义取景界面。

**需要的能力**：

| 能力 | 用途 | 对应产品需求 |
|------|------|-------------|
| `start()` | 启动相机预览 | 取景页全屏实时画面 |
| `stop()` | 关闭相机预览 | 离开取景页 |
| `capture()` | 拍照获取图片数据 | 快门按钮 → 获取照片 Base64/文件路径 |
| `flip()` | 前后摄像头切换 | MVP 可不需要，但插件支持 |
| `setFlashMode()` | 闪光灯控制 | 取景页右上角闪光灯切换按钮 |

**对应后端接口**: [`POST /captures`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:607) — 拍照后将图片以 `multipart/form-data` 上传

**注意事项**：
- 图片来源仅限实时拍照，**不接入相册**（设计决策已确认）
- 图片最大 10MB，支持 JPEG/PNG/WebP/HEIC
- 拍照后执行 Iris Close 过渡动效（前端 CSS 动画，不依赖插件）

---

## 2. Geolocation — GPS 定位

**包名**: `@capacitor/geolocation`

**优先级**: P0

**关联页面**: [`A shooting.html`](Prism/frontend/A%20shooting.html)、[`X-3 permission-request.html`](Prism/frontend/X-3%20permission-request.html)

**需要的能力**：

| 能力 | 用途 |
|------|------|
| `getCurrentPosition()` | 取景页左下角显示 GPS 坐标；拍照时附带经纬度 |
| `watchPosition()` | 可选：实时更新取景页坐标显示 |
| `checkPermissions()` | 检查定位权限状态 |
| `requestPermissions()` | 请求定位权限 |

**对应后端接口**:
- [`POST /captures`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:607) — 请求字段 `latitude`、`longitude`、`accuracyMeters`
- [`GET /client-config`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:1594) — 权限解释文案

**隐私规则**（来自接口文档 §1.5 + §4.7）：
- 私人数据保留精确坐标（`GeoLocation.privateText`）
- 社区数据模糊到城市级（`GeoLocation.publicText`）
- 用户可设置 `locationPrecision`: `CITY` / `DISTRICT` / `OFF`

---

## 3. HTTP / 网络请求

**包名**: 使用 `fetch` API 或 `axios`（不需要额外 Capacitor 插件）

**优先级**: P0

**关联功能**: 全部 35 个后端 API 接口

**请求头约定**（来自接口文档 §1.2）：

```http
Authorization: Bearer <accessToken>
X-Device-Id: <deviceUuid>
X-Client-Version: 0.1.0
```

**建议封装**：统一的 API Client，处理：
- Token 自动附加与刷新（[`POST /auth/refresh`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:425)）
- 错误码统一处理（§10 错误码表，12 种业务错误码）
- 游标分页统一抽象（`cursor` + `hasMore`）
- 轮询任务状态（AI 重述、导出任务的 `pollAfterMs`）

---

## 4. Preferences — 本地键值存储

**包名**: `@capacitor/preferences`

**优先级**: P0

**存储内容**：

| Key | 值 | 用途 |
|-----|-----|------|
| `accessToken` | JWT | API 鉴权 |
| `refreshToken` | JWT | Token 刷新 |
| `deviceId` | UUID | 请求头 `X-Device-Id` |
| `isNewUser` | boolean | 是否展示 Onboarding |
| `observerCode` | string | 本地缓存用户编号 |
| `interfaceTheme` | `DARK` | MVP 仅深色 |
| `defaultSlicePublic` | boolean | 默认切片公开设置 |
| `locationPrecision` | `CITY/DISTRICT/OFF` | 位置隐私级别 |

**对应后端接口**:
- [`POST /auth/login`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:347) — 登录后存储 token
- [`PATCH /me/settings`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:558) — 设置同步

---

## 5. Device — 设备信息

**包名**: `@capacitor/device`

**优先级**: P0

**需要的能力**：

| 能力 | 用途 |
|------|------|
| `getId()` | 获取设备唯一标识，用于 `X-Device-Id` 请求头 |
| `getInfo()` | 获取设备型号、操作系统版本（可选，用于调试） |

**对应后端约定**（来自接口文档 §1.2）：
> 登录前允许匿名设备态，服务端可基于 `X-Device-Id` 分配临时 `observerCode`。

---

## 6. Splash Screen — 启动屏

**包名**: `@capacitor/splash-screen`

**优先级**: P0

**关联页面**: [`0-1 splash.html`](Prism/frontend/0-1%20splash.html)

**需要的能力**：

| 能力 | 用途 |
|------|------|
| `show()` | 启动时显示品牌闪屏 |
| `hide()` | App 初始化完成后隐藏，进入登录页或收藏页 |

**配合 `nextRoute` 逻辑**：
- 新用户 → `onboarding`
- 老用户 → `collection`
- 未登录 → `auth`

---

## 7. Status Bar — 状态栏控制

**包名**: `@capacitor/status-bar`

**优先级**: P0

**关联需求**: 全局深色沉浸式 UI（背景 `#0a0c10`）

**需要的能力**：

| 能力 | 用途 |
|------|------|
| `setStyle({ style: 'DARK' })` | 状态栏文字改为白色 |
| `setBackgroundColor({ color: '#0a0c10' })` | 状态栏背景与 App 一致 |
| `setOverlaysWebView({ overlay: true })` | 取景页全屏沉浸（相机画面延伸到状态栏区域） |

---

## 8. Keyboard — 键盘控制

**包名**: `@capacitor/keyboard`

**优先级**: P1

**关联页面**: [`H auth.html`](Prism/frontend/H%20auth.html)（邮箱输入、验证码输入）

**需要的能力**：

| 能力 | 用途 |
|------|------|
| `setAccessoryBarVisible()` | 控制键盘工具栏 |
| `setScroll()` | 防止键盘弹出时页面滚动异常 |
| `addListener('keyboardWillShow')` | 动态调整输入区域布局 |
| `addListener('keyboardWillHide')` | 恢复布局 |

---

## 9. Haptics — 触觉反馈

**包名**: `@capacitor/haptics`

**优先级**: P1

**关联交互**：

| 场景 | 反馈类型 | 来源页面 |
|------|----------|---------|
| 快门按下 | `impact({ style: 'MEDIUM' })` | A 取景页 |
| 切片保存成功（闪白截屏感） | `notification({ type: 'SUCCESS' })` | C 重述结果页 |
| 长按切片触发操作菜单 | `impact({ style: 'LIGHT' })` | D 收藏页 |
| ◇ 共鸣点击 | `impact({ style: 'LIGHT' })` | F 发现页 |

---

## 10. Network — 网络状态检测

**包名**: `@capacitor/network`

**优先级**: P1

**需要的能力**：

| 能力 | 用途 |
|------|------|
| `getStatus()` | 检测当前网络状态 |
| `addListener('networkStatusChange')` | 监听网络变化，弱网时提示用户 |

**对应场景**：
- 拍照上传失败时的错误提示
- AI 重述轮询超时处理（`Reading.status = timeout`）
- 社区信号流加载失败提示

---

## 11. Filesystem — 文件系统

**包名**: `@capacitor/filesystem`

**优先级**: P2

**关联页面**: [`X-4 share-preview.html`](Prism/frontend/X-4%20share-preview.html)

**需要的能力**：

| 能力 | 用途 |
|------|------|
| `writeFile()` | 将导出的分享图保存到设备相册/下载目录 |
| `readFile()` | 读取本地缓存的图片 |

**对应后端接口**:
- [`POST /slices/{sliceId}/export`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:1239) — 创建导出任务
- [`GET /exports/{exportTaskId}`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:1270) — 获取导出图片 URL

---

## 12. Share — 系统分享

**包名**: `@capacitor/share`

**优先级**: P2

**关联页面**: [`X-4 share-preview.html`](Prism/frontend/X-4%20share-preview.html)

**需要的能力**：

| 能力 | 用途 |
|------|------|
| `share({ url, title, text })` | 调用系统分享面板，分享切片导出图 |
| `canShare()` | 检查是否支持分享 |

**工作流程**：
1. 调用 `POST /slices/{sliceId}/export` 创建导出任务
2. 轮询 `GET /exports/{exportTaskId}` 获取 `exportUrl`
3. 下载图片到本地（Filesystem）
4. 调用 `Share.share()` 打开系统分享面板

---

## 13. 录音插件 — 语音录制

**包名**: `@capacitor-community/media` 或 `capacitor-voice-recorder`

**优先级**: P2

**关联页面**: [`B-1 voice-lens-creator.html`](Prism/frontend/B-1%20voice-lens-creator.html)

**需要的能力**：

| 能力 | 用途 |
|------|------|
| 开始录音 | 用户按住录音按钮，开始录制语音 |
| 停止录音并获取音频文件 | 松开按钮，获取音频 Blob/File |
| 请求麦克风权限 | 首次使用时请求 |

**对应后端接口**:
- [`POST /lens-creator/sessions`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:921) — 创建语音会话
- [`POST /lens-creator/sessions/{sessionId}/audio`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:950) — 上传语音并转写
- [`POST /lens-creator/sessions/{sessionId}/messages`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:976) — 推进对话
- [`POST /lens-creator/sessions/{sessionId}/confirm`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:1013) — 确认创建镜片

**备注**: 项目进度总结中提到"STT 云端 API（讯飞/Google Speech）+ 录音插件"

---

## 14. App — 应用生命周期

**包名**: `@capacitor/app`

**优先级**: P1

**需要的能力**：

| 能力 | 用途 |
|------|------|
| `addListener('appStateChange')` | 前后台切换：恢复相机预览、刷新 Token |
| `addListener('backButton')` | Android 返回键处理 |
| `getInfo()` | 获取 App 版本号，用于 `X-Client-Version` 请求头 |

---

## 15. Local Notifications — 本地通知

**包名**: `@capacitor/local-notifications`

**优先级**: P2

**关联功能**: 挑战提醒

**对应设置**: `challengeNotifications` 字段（[`PATCH /me/settings`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:558)）

---

## 按优先级安装清单

### P0 — 演示闭环必须安装

```bash
bun add @capacitor-community/camera-preview \
            @capacitor/geolocation \
            @capacitor/preferences \
            @capacitor/device \
            @capacitor/splash-screen \
            @capacitor/status-bar
```

### P1 — 体验完整性

```bash
bun add @capacitor/keyboard \
            @capacitor/haptics \
            @capacitor/network \
            @capacitor/app
```

### P2 — 加分能力

```bash
bun add @capacitor/filesystem \
            @capacitor/share \
            @capacitor/local-notifications \
            capacitor-voice-recorder
```

---

## 插件 ↔ 后端接口映射关系

```text
┌─────────────────────────┐     ┌──────────────────────────────────────┐
│  Camera Preview          │────▶│ POST /captures (上传拍摄照片)          │
│  (拍照获取图片)            │     │                                      │
└─────────────────────────┘     └──────────────────────────────────────┘

┌─────────────────────────┐     ┌──────────────────────────────────────┐
│  Geolocation             │────▶│ POST /captures 的 latitude/longitude  │
│  (GPS 坐标)              │     │ 取景页左下角坐标显示                     │
└─────────────────────────┘     └──────────────────────────────────────┘

┌─────────────────────────┐     ┌──────────────────────────────────────┐
│  Device                  │────▶│ X-Device-Id 请求头                    │
│  (设备 ID)               │     │ POST /auth/login 的 deviceId 字段     │
└─────────────────────────┘     └──────────────────────────────────────┘

┌─────────────────────────┐     ┌──────────────────────────────────────┐
│  Preferences             │────▶│ accessToken / refreshToken 本地存储    │
│  (Token 持久化)           │     │ POST /auth/refresh 刷新 Token         │
└─────────────────────────┘     └──────────────────────────────────────┘

┌─────────────────────────┐     ┌──────────────────────────────────────┐
│  Voice Recorder          │────▶│ POST /lens-creator/sessions/*/audio   │
│  (语音录制)              │     │ (上传语音并转写)                        │
└─────────────────────────┘     └──────────────────────────────────────┘

┌─────────────────────────┐     ┌──────────────────────────────────────┐
│  Filesystem + Share      │────▶│ POST /slices/*/export                 │
│  (导出保存+分享)          │     │ GET /exports/{exportTaskId}           │
└─────────────────────────┘     └──────────────────────────────────────┘

┌─────────────────────────┐     ┌──────────────────────────────────────┐
│  App                     │────▶│ X-Client-Version 请求头               │
│  (应用版本/生命周期)       │     │ GET /client-config                    │
└─────────────────────────┘     └──────────────────────────────────────┘
```

---

## Android 权限声明（AndroidManifest.xml）

以下权限需要在 `android/app/src/main/AndroidManifest.xml` 中声明：

```xml
<!-- P0: 相机 -->
<uses-permission android:name="android.permission.CAMERA" />

<!-- P0: GPS 定位 -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- P1: 网络 -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

<!-- P2: 麦克风（语音创建镜片） -->
<uses-permission android:name="android.permission.RECORD_AUDIO" />

<!-- P2: 文件存储（导出图片） -->
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

**权限请求解释页**: [`X-3 permission-request.html`](Prism/frontend/X-3%20permission-request.html) + [`GET /client-config`](frontend/doc/世界观透镜_后端并行开发接口文档_v2.md:1594) 提供权限解释文案。

---

*文档生成时间：2026-05-17*
