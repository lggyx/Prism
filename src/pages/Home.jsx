import { useNavigate } from 'react-router-dom'
import './Home.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <div className="hero-section">
        <h1 className="title">AI 世界卡片</h1>
        <p className="subtitle">拍照生成你的专属世界卡片</p>
      </div>
      
      <div className="action-buttons">
        <button 
          className="primary-btn"
          onClick={() => navigate('/camera')}
        >
          开始拍照
        </button>
        <button 
          className="secondary-btn"
          onClick={() => navigate('/download')}
        >
          下载App
        </button>
      </div>

      <div className="features">
        <div className="feature-item">
          <span className="feature-icon">📸</span>
          <span className="feature-text">拍照上传</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🎲</span>
          <span className="feature-text">随机世界观</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">🎨</span>
          <span className="feature-text">AI风格化</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📤</span>
          <span className="feature-text">一键分享</span>
        </div>
      </div>
    </div>
  )
}

export default Home
