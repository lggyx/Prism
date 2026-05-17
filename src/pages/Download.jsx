import { useNavigate } from 'react-router-dom'
import './Download.css'

function Download() {
  const navigate = useNavigate()

  return (
    <div className="download-container">
      <div className="download-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h2>下载App</h2>
      </div>

      <div className="download-content">
        <div className="app-preview">
          <div className="phone-mockup">
            <div className="phone-screen">
              <div className="app-icon">🎴</div>
              <h3>AI世界卡片</h3>
              <p>拍照生成你的专属世界卡片</p>
            </div>
          </div>
        </div>

        <div className="download-info">
          <h3>立即下载体验</h3>
          <p className="download-description">
            使用AI技术将你的照片转换为独特的艺术卡片，
            支持多种世界观风格，一键分享到社交平台。
          </p>

          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">📸</span>
              <span>拍照上传</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎨</span>
              <span>AI风格化</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎲</span>
              <span>随机世界观</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📤</span>
              <span>一键分享</span>
            </div>
          </div>

          <div className="download-buttons">
            <button className="download-btn ios">
              <span className="btn-icon">🍎</span>
              <div className="btn-text">
                <span className="btn-small">Download on the</span>
                <span className="btn-large">App Store</span>
              </div>
            </button>
            
            <button className="download-btn android">
              <span className="btn-icon">🤖</span>
              <div className="btn-text">
                <span className="btn-small">GET IT ON</span>
                <span className="btn-large">Google Play</span>
              </div>
            </button>
          </div>

          <div className="qr-download">
            <h4>或扫描二维码下载</h4>
            <div className="qr-placeholder">
              <div className="qr-code">
                <div className="qr-pattern"></div>
              </div>
            </div>
            <p className="qr-hint">支持iOS和Android</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Download
