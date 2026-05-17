# AI世界卡片 - React + Vite + Capacitor 8 移动应用

一个基于React + Vite + Capacitor 8开发的移动应用，使用AI技术将照片转换为独特的艺术卡片。

## 功能特性

- 📸 **拍照上传** - 支持拍照或从相册选择照片
- 🎲 **随机世界观** - 从10种不同的艺术风格中随机抽取
- 🎨 **AI风格化** - 使用OpenAI API将照片转换为选定风格
- 📖 **生成词条** - 为每张卡片生成独特的介绍词条
- 📤 **一键分享** - 支持微信、QQ等社交平台分享
- 🔗 **二维码分享** - 生成带二维码的分享图片
- 🌐 **独立URL** - 每张卡片都有独特的访问链接
- 📱 **App下载** - 提供iOS和Android下载引导

## 技术栈

- **前端**: React 18 + Vite
- **移动端**: Capacitor 8
- **后端**: Node.js + Express
- **AI服务**: OpenAI API (DALL-E)
- **图片处理**: Sharp
- **二维码**: QRCode

## 项目结构

```
Demo/
├── src/                    # 前端源码
│   ├── components/         # 组件
│   ├── pages/             # 页面
│   │   ├── Home.jsx       # 首页
│   │   ├── Camera.jsx     # 拍照页面
│   │   ├── WorldSelect.jsx # 世界观选择
│   │   ├── Result.jsx     # 结果展示
│   │   ├── Share.jsx      # 分享页面
│   │   └── Download.jsx   # 下载页面
│   ├── data/              # 数据
│   │   └── worlds.js      # 世界观数据
│   ├── utils/             # 工具函数
│   └── services/          # API服务
├── server/                 # 后端服务
│   ├── server.js          # Express服务器
│   └── package.json
├── public/                 # 静态资源
├── capacitor.config.json   # Capacitor配置
└── package.json           # 前端依赖
```

## 安装和运行

### 1. 安装依赖

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填入你的OpenAI API密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：
```
OPENAI_API_KEY=your-actual-api-key-here
```

### 3. 启动开发服务器

```bash
# 启动后端服务器 (端口3001)
cd server && npm run dev

# 启动前端开发服务器 (端口5173)
npm run dev
```

访问 http://localhost:5173 查看应用

### 4. 构建生产版本

```bash
# 构建前端
npm run build

# 同步到Capacitor
npx cap sync

# 添加平台
npx cap add android
npx cap add ios

# 打开原生项目
npx cap open android
npx cap open ios
```

## 世界观风格

应用包含10种预设的世界观风格：

1. **赛博朋克** - 高科技低生活的未来都市
2. **蒸汽朋克** - 维多利亚时代的机械美学
3. **水墨中国** - 传统东方水墨画风格
4. **像素艺术** - 复古8-bit游戏风格
5. **油画质感** - 古典油画的艺术风格
6. **动漫风格** - 日本动漫美学
7. **哥特式** - 黑暗神秘的哥特美学
8. **波普艺术** - 大胆鲜艳的流行艺术
9. **水彩画** - 柔和透明的水彩效果
10. **素描风格** - 铅笔素描的艺术效果

## API接口

### POST /api/process-image
处理图片并生成风格化卡片

**请求参数:**
- `image`: 图片文件
- `worldId`: 世界观ID
- `worldName`: 世界观名称
- `prompt`: 风格提示词

**响应:**
```json
{
  "success": true,
  "id": "card-id",
  "styledImage": "/generated/card-id-styled.png",
  "entry": {
    "title": "卡片标题",
    "description": "卡片描述",
    "rarity": "稀有度",
    "attribute": "属性"
  },
  "url": "http://localhost:3001/card/card-id"
}
```

### POST /api/generate-share-image
生成带二维码的分享图片

### GET /card/:id
查看卡片详情页面

### GET /download
下载页面

## 开发说明

### 修改世界观数据
编辑 `src/data/worlds.js` 文件可以添加或修改世界观风格。

### 自定义词条生成
编辑 `server/server.js` 中的 `generateEntry` 函数来自定义词条内容。

### 接入真实的OpenAI API
在 `server/server.js` 中，当前使用Sharp模拟图片处理。要接入真实的OpenAI DALL-E API，需要：

1. 安装OpenAI SDK: `npm install openai`
2. 在 `process-image` 路由中调用DALL-E API
3. 处理返回的图片URL并保存到本地

## 注意事项

1. **OpenAI API密钥**: 需要有效的OpenAI API密钥才能使用AI功能
2. **图片大小**: 上传的图片限制为10MB
3. **移动端权限**: 需要在Capacitor配置中申请相机和相册权限
4. **分享功能**: 微信和QQ分享需要原生应用支持，Web版本可能受限

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！
