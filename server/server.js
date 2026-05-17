const express = require('express')
const multer = require('multer')
const cors = require('cors')
const path = require('path')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const QRCode = require('qrcode')
const sharp = require('sharp')
const OpenAI = require('openai')

const app = express()
const PORT = process.env.PORT || 3001

// 中间件
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/generated', express.static(path.join(__dirname, 'generated')))

// 确保目录存在
const uploadsDir = path.join(__dirname, 'uploads')
const generatedDir = path.join(__dirname, 'generated')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true })

// 配置multer用于文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)
    if (extname && mimetype) {
      return cb(null, true)
    }
    cb(new Error('只支持图片文件'))
  }
})

// 初始化OpenAI客户端（支持OpenAI Compatible API）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
})

// 存储卡片数据
const cards = new Map()

// 生成词条介绍
const generateEntry = (worldName, prompt) => {
  const entries = {
    '赛博朋克': {
      title: '霓虹行者',
      description: '在赛博朋克的霓虹都市中，你的身影化作一道光影，穿梭于高楼大厦之间。高科技与低生活的碰撞，让你成为了这个数字世界中的独特存在。',
      rarity: '史诗',
      attribute: '科技'
    },
    '蒸汽朋克': {
      title: '机械师',
      description: '维多利亚时代的机械美学与你完美融合，黄铜齿轮在你身边旋转，蒸汽引擎为你提供动力。你是这个蒸汽世界中的创造者。',
      rarity: '稀有',
      attribute: '机械'
    },
    '水墨中国': {
      title: '墨客',
      description: '传统东方水墨画风格中，你如同一幅流动的山水画。笔墨之间，尽显东方神韵，你是这水墨世界中的诗意存在。',
      rarity: '传说',
      attribute: '自然'
    },
    '像素艺术': {
      title: '像素勇者',
      description: '在8-bit的复古游戏世界中，你化身为像素英雄。每一个方块都承载着冒险的记忆，你是这个数字王国中的传奇。',
      rarity: '稀有',
      attribute: '游戏'
    },
    '油画质感': {
      title: '古典画师',
      description: '古典油画的质感让你仿佛从文艺复兴时期走来。厚重的笔触、丰富的色彩，你是这艺术殿堂中的杰作。',
      rarity: '史诗',
      attribute: '艺术'
    },
    '动漫风格': {
      title: '动漫主角',
      description: '日本动漫美学中，你成为了故事的主角。 vibrant的色彩、clean的线条，你的冒险故事即将展开。',
      rarity: '稀有',
      attribute: '幻想'
    },
    '哥特式': {
      title: '暗夜贵族',
      description: '在黑暗神秘的哥特美学中，你如同中世纪的贵族。 ornate的装饰、dramatic的阴影，你是这暗夜世界中的优雅存在。',
      rarity: '史诗',
      attribute: '暗黑'
    },
    '波普艺术': {
      title: '波普明星',
      description: '大胆鲜艳的波普艺术风格让你成为焦点。Andy Warhol式的艺术处理，让你成为流行文化的代表。',
      rarity: '稀有',
      attribute: '流行'
    },
    '水彩画': {
      title: '水彩精灵',
      description: '柔和透明的水彩效果中，你如同梦境中的精灵。flowing的色彩、dreamy的氛围，你是这艺术世界中的诗意存在。',
      rarity: '稀有',
      attribute: '梦幻'
    },
    '素描风格': {
      title: '素描艺术家',
      description: '铅笔素描的艺术效果让你成为画布上的杰作。detailed的线条、artistic的 shading，你是这黑白世界中的艺术大师。',
      rarity: '稀有',
      attribute: '艺术'
    }
  }

  return entries[worldName] || {
    title: '世界旅者',
    description: '在这个独特的世界观中，你成为了一个神秘的存在。你的故事才刚刚开始，等待被书写。',
    rarity: '普通',
    attribute: '未知'
  }
}

// API路由：处理图片
app.post('/api/process-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '未上传图片' })
    }

    const { worldId, worldName, prompt } = req.body
    const imagePath = req.file.path
    const cardId = uuidv4()

    // 1. 使用sharp处理图片（模拟主体提取和风格化）
    // 在实际应用中，这里应该调用OpenAI DALL-E API进行真正的风格化
    const styledImagePath = path.join(generatedDir, `${cardId}-styled.png`)
    
    // 模拟风格化处理：调整图片色调和饱和度
    await sharp(imagePath)
      .modulate({
        brightness: 1.1,
        saturation: 1.3,
        hue: Math.floor(Math.random() * 360)
      })
      .png()
      .toFile(styledImagePath)

    // 2. 生成词条
    const entry = generateEntry(worldName, prompt)

    // 3. 生成唯一URL
    const cardUrl = `${req.protocol}://${req.get('host')}/card/${cardId}`

    // 4. 保存卡片数据
    const cardData = {
      id: cardId,
      originalImage: `/uploads/${req.file.filename}`,
      styledImage: `/generated/${cardId}-styled.png`,
      worldId,
      worldName,
      prompt,
      entry,
      url: cardUrl,
      createdAt: new Date().toISOString()
    }
    cards.set(cardId, cardData)

    // 5. 返回结果
    res.json({
      success: true,
      id: cardId,
      styledImage: cardData.styledImage,
      entry,
      url: cardUrl
    })

  } catch (error) {
    console.error('处理图片失败:', error)
    res.status(500).json({ error: '图片处理失败' })
  }
})

// API路由：生成分享图片（带二维码）
app.post('/api/generate-share-image', async (req, res) => {
  try {
    const { imageUrl, url, title, description } = req.body

    // 生成二维码
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    // 创建分享图片（图片+二维码+文字）
    // 这里简化处理，实际应该使用canvas或sharp合成
    const shareImageId = uuidv4()
    const shareImagePath = path.join(generatedDir, `${shareImageId}-share.png`)

    // 模拟：直接返回原图URL，实际应该合成二维码
    res.json({
      success: true,
      shareImageUrl: imageUrl,
      url: url,
      qrCode: qrCodeDataUrl
    })

  } catch (error) {
    console.error('生成分享图片失败:', error)
    res.status(500).json({ error: '生成分享图片失败' })
  }
})

// 查看卡片页面
app.get('/card/:id', (req, res) => {
  const cardId = req.params.id
  const card = cards.get(cardId)

  if (!card) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>卡片未找到</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 400px;
          }
          h1 { font-size: 2rem; margin-bottom: 20px; }
          p { font-size: 1.1rem; opacity: 0.9; }
          .btn {
            display: inline-block;
            margin-top: 30px;
            padding: 12px 30px;
            background: white;
            color: #667eea;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎴 卡片未找到</h1>
          <p>这张卡片可能已被删除或链接无效</p>
          <a href="/" class="btn">返回首页</a>
        </div>
      </body>
      </html>
    `)
  }

  // 返回卡片展示页面
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${card.entry.title} - AI世界卡片</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta property="og:title" content="${card.entry.title}">
      <meta property="og:description" content="${card.entry.description}">
      <meta property="og:image" content="${req.protocol}://${req.get('host')}${card.styledImage}">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
        }
        .card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 20px;
          -webkit-backdrop-filter: blur(10px);
          backdrop-filter: blur(10px);
        }
        .card-image {
          width: 100%;
          border-radius: 15px;
          margin-bottom: 20px;
        }
        .card-title {
          font-size: 2rem;
          margin-bottom: 10px;
          color: #ffd700;
        }
        .card-world {
          font-size: 1.2rem;
          margin-bottom: 15px;
          opacity: 0.8;
        }
        .card-description {
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .card-tags {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-bottom: 20px;
        }
        .tag {
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
        }
        .download-section {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
        .download-btn {
          display: inline-block;
          padding: 15px 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          border-radius: 25px;
          font-weight: 600;
          font-size: 1.1rem;
          margin: 10px;
        }
        .download-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <img src="${req.protocol}://${req.get('host')}${card.styledImage}" alt="${card.entry.title}" class="card-image">
          <h1 class="card-title">${card.entry.title}</h1>
          <p class="card-world">${card.worldName}风格</p>
          <p class="card-description">${card.entry.description}</p>
          <div class="card-tags">
            <span class="tag">稀有度: ${card.entry.rarity}</span>
            <span class="tag">属性: ${card.entry.attribute}</span>
          </div>
          <div class="download-section">
            <p style="margin-bottom: 20px; opacity: 0.8;">下载App创建你的专属卡片</p>
            <a href="/download" class="download-btn">📱 下载App</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `)
})

// 下载页面
app.get('/download', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>下载AI世界卡片App</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .container {
          text-align: center;
          max-width: 500px;
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 20px;
        }
        .description {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 40px;
          line-height: 1.6;
        }
        .download-buttons {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-bottom: 40px;
        }
        .download-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          padding: 15px 30px;
          background: #000;
          color: white;
          text-decoration: none;
          border-radius: 12px;
          font-weight: 600;
          transition: transform 0.3s;
        }
        .download-btn:hover {
          transform: translateY(-2px);
        }
        .download-btn.android {
          background: white;
          color: #000;
        }
        .btn-icon {
          font-size: 2rem;
        }
        .btn-text {
          text-align: left;
        }
        .btn-small {
          font-size: 0.75rem;
          opacity: 0.8;
        }
        .btn-large {
          font-size: 1.2rem;
        }
        .qr-section {
          background: rgba(255, 255, 255, 0.1);
          padding: 30px;
          border-radius: 20px;
        }
        .qr-placeholder {
          width: 150px;
          height: 150px;
          background: white;
          margin: 20px auto;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎴 AI世界卡片</h1>
        <p class="description">
          拍照生成你的专属世界卡片<br>
          支持多种世界观风格，一键分享到社交平台
        </p>
        <div class="download-buttons">
          <a href="#" class="download-btn">
            <span class="btn-icon">🍎</span>
            <div class="btn-text">
              <div class="btn-small">Download on the</div>
              <div class="btn-large">App Store</div>
            </div>
          </a>
          <a href="#" class="download-btn android">
            <span class="btn-icon">🤖</span>
            <div class="btn-text">
              <div class="btn-small">GET IT ON</div>
              <div class="btn-large">Google Play</div>
            </div>
          </a>
        </div>
        <div class="qr-section">
          <h3>或扫描二维码下载</h3>
          <div class="qr-placeholder">
            二维码区域
          </div>
          <p style="opacity: 0.7; margin-top: 10px;">支持iOS和Android</p>
        </div>
      </div>
    </body>
    </html>
  `)
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
  console.log(`访问 http://localhost:${PORT}`)
})
