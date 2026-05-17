import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
import './Result.css'

function Result() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  
  const photo = location.state?.photo
  const world = location.state?.world

  useEffect(() => {
    if (!photo || !world) {
      navigate('/camera')
      return
    }

    const processImage = async () => {
      try {
        setLoading(true)
        setError(null)

        // 将base64图片转换为blob
        const response = await fetch(photo)
        const blob = await response.blob()
        
        // 创建FormData
        const formData = new FormData()
        formData.append('image', blob, 'photo.jpg')
        formData.append('worldId', world.id)
        formData.append('worldName', world.name)
        formData.append('prompt', world.prompt)

        // 发送到服务端处理
        const apiResponse = await axios.post('/api/process-image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        setResult(apiResponse.data)
      } catch (err) {
        console.error('处理图片失败:', err)
        setError('图片处理失败，请重试')
      } finally {
        setLoading(false)
      }
    }

    processImage()
  }, [photo, world, navigate])

  const handleShare = () => {
    if (result) {
      navigate('/share', { state: { result } })
    }
  }

  if (!photo || !world) return null

  return (
    <div className="result-container">
      <div className="result-header">
        <button className="back-btn" onClick={() => navigate('/world-select', { state: { photo } })}>
          ← 返回
        </button>
        <h2>生成结果</h2>
      </div>

      <div className="result-content">
        {loading ? (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>AI正在为你创作专属卡片...</p>
            <p className="loading-subtitle">提取主体 + 风格化 + 生成词条</p>
          </div>
        ) : error ? (
          <div className="error-section">
            <p className="error-text">{error}</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              重试
            </button>
          </div>
        ) : result && result.entry ? (
          <div className="result-card">
            <div className="result-image">
              <img src={result.styledImage} alt="风格化后的图片" />
            </div>
            
            <div className="result-info">
              <h3 style={{ color: world.color }}>{world.name}风格</h3>
              
              <div className="entry-section">
                <h4>📖 世界卡片词条</h4>
                <div className="entry-content">
                  <p className="entry-title">{result.entry?.title || '未知标题'}</p>
                  <p className="entry-description">{result.entry?.description || '暂无描述'}</p>
                  <div className="entry-details">
                    <span className="entry-tag">稀有度: {result.entry?.rarity || '普通'}</span>
                    <span className="entry-tag">属性: {result.entry?.attribute || '未知'}</span>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button className="share-btn" onClick={handleShare}>
                  📤 分享卡片
                </button>
                <button className="download-btn" onClick={() => window.open(result.url, '_blank')}>
                  🔗 查看详情
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default Result
