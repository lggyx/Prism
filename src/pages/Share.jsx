import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Share as CapacitorShare } from '@capacitor/share'
import axios from 'axios'
import { QRCodeSVG } from 'qrcode.react'
import './Share.css'

function SharePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const result = location.state?.result

  if (!result) {
    navigate('/')
    return null
  }

  const handleShare = async (platform) => {
    try {
      setLoading(true)
      
      // 发送到服务端生成带二维码的图片
      const response = await axios.post('/api/generate-share-image', {
        imageUrl: result.styledImage,
        url: result.url,
        title: result.entry.title,
        description: result.entry.description
      })

      const shareImageUrl = response.data.shareImageUrl
      const shareUrl = response.data.url

      // 使用Capacitor Share插件分享
      await CapacitorShare.share({
        title: result.entry.title,
        text: result.entry.description,
        url: shareUrl,
        files: [shareImageUrl]
      })
    } catch (error) {
      console.error('分享失败:', error)
      alert('分享失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = () => {
    const url = result.url || window.location.origin + '/card/' + result.id
    setQrCodeUrl(url)
  }

  const handleCopyLink = () => {
    const url = result.url || window.location.origin + '/card/' + result.id
    navigator.clipboard.writeText(url)
    alert('链接已复制到剪贴板')
  }

  return (
    <div className="share-container">
      <div className="share-header">
        <button className="back-btn" onClick={() => navigate('/result')}>
          ← 返回
        </button>
        <h2>分享你的卡片</h2>
      </div>

      <div className="share-content">
        <div className="share-preview">
          <img src={result.styledImage} alt="你的卡片" />
        </div>

        <div className="share-actions">
          <h3>选择分享方式</h3>
          
          <div className="share-buttons">
            <button 
              className="share-btn wechat"
              onClick={() => handleShare('wechat')}
              disabled={loading}
            >
              <span className="share-icon">💬</span>
              <span>微信好友</span>
            </button>
            
            <button 
              className="share-btn moments"
              onClick={() => handleShare('moments')}
              disabled={loading}
            >
              <span className="share-icon">⭕</span>
              <span>朋友圈</span>
            </button>
            
            <button 
              className="share-btn qq"
              onClick={() => handleShare('qq')}
              disabled={loading}
            >
              <span className="share-icon">🐧</span>
              <span>QQ好友</span>
            </button>
            
            <button 
              className="share-btn qzone"
              onClick={() => handleShare('qzone')}
              disabled={loading}
            >
              <span className="share-icon">🌟</span>
              <span>QQ空间</span>
            </button>
          </div>

          <div className="qr-section">
            <h4>或扫描二维码查看</h4>
            <div className="qr-code-container">
              {qrCodeUrl ? (
                <QRCodeSVG value={qrCodeUrl} size={200} />
              ) : (
                <button className="generate-qr-btn" onClick={generateQRCode}>
                  生成二维码
                </button>
              )}
            </div>
            <button className="copy-link-btn" onClick={handleCopyLink}>
              📋 复制链接
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SharePage
