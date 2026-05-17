# 快速启动指南

## 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install
```

## 2. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，填入你的OpenAI API密钥
# OPENAI_API_KEY=your-actual-api-key-here
```

## 3. 启动开发服务器

### 方式一：分别启动（推荐）

```bash
# 终端1：启动后端服务器
npm run start:server

# 终端2：启动前端开发服务器
npm run dev
```

### 方式二：同时启动

```bash
npm run start:all
```

访问 http://localhost:5173 查看应用

## 4. 构建生产版本

```bash
# 构建并同步到Capacitor
npm run build:all

# 或分别执行
npm run build
npx cap sync
```

## 5. 打开原生项目

```bash
# Android
npm run cap:open:android

# iOS
npm run cap:open:ios
```

## 项目结构说明

```
Demo/
├── src/                    # 前端源码
│   ├── pages/             # 页面组件
│   │   ├── Home.jsx       # 首页
│   │   ├── Camera.jsx     # 拍照页面
│   │   ├── WorldSelect.jsx # 世界观选择
│   │   ├── Result.jsx     # 结果展示
│   │   ├── Share.jsx      # 分享页面
│   │   └── Download.jsx   # 下载页面
│   ├── data/
│   │   └── worlds.js      # 世界观数据（10种风格）
│   └── App.jsx            # 主应用组件
├── server/                 # 后端服务
│   ├── server.js          # Express服务器
│   └── package.json
├── android/               # Android原生项目
├── ios/                   # iOS原生项目
├── capacitor.config.json  # Capacitor配置
└── vite.config.js         # Vite配置
```

## 功能流程

1. **首页** → 点击"开始拍照"
2. **拍照页面** → 拍照或从相册选择照片
3. **世界观选择** → 点击"随机抽取世界观"按钮，类似抽奖效果
4. **结果展示** → AI处理图片，生成风格化卡片和词条
5. **分享页面** → 选择分享方式（微信、QQ等）或生成二维码
6. **下载页面** → 提供App下载引导

## 世界观风格

应用包含10种预设风格：
- 赛博朋克、蒸汽朋克、水墨中国、像素艺术
- 油画质感、动漫风格、哥特式、波普艺术
- 水彩画、素描风格

## API接口

- `POST /api/process-image` - 处理图片并生成卡片
- `POST /api/generate-share-image` - 生成分享图片
- `GET /card/:id` - 查看卡片详情
- `GET /download` - 下载页面

## 注意事项

1. 需要配置OpenAI API密钥才能使用AI功能
2. 开发时需要同时运行前端和后端服务器
3. 移动端构建需要安装Android Studio或Xcode
4. 分享功能在真机上测试效果最佳

## 常见问题

**Q: 如何修改世界观数据？**
A: 编辑 `src/data/worlds.js` 文件

**Q: 如何自定义词条生成？**
A: 编辑 `server/server.js` 中的 `generateEntry` 函数

**Q: 如何接入真实的OpenAI DALL-E API？**
A: 在 `server/server.js` 的 `process-image` 路由中调用DALL-E API替换当前的Sharp模拟处理
