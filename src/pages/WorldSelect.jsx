import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { worlds, getRandomWorld } from '../data/worlds'
import './WorldSelect.css'

function WorldSelect() {
  const location = useLocation()
  const navigate = useNavigate()
  const [selectedWorld, setSelectedWorld] = useState(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const photo = location.state?.photo

  useEffect(() => {
    if (!photo) {
      navigate('/camera')
    }
  }, [photo, navigate])

  const handleSpin = () => {
    if (isSpinning) return
    
    setIsSpinning(true)
    setShowResult(false)
    
    // 模拟抽奖动画
    let spinCount = 0
    const maxSpins = 20
    const spinInterval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * worlds.length)
      setSelectedWorld(worlds[randomIndex])
      spinCount++
      
      if (spinCount >= maxSpins) {
        clearInterval(spinInterval)
        const finalWorld = getRandomWorld()
        setSelectedWorld(finalWorld)
        setIsSpinning(false)
        setShowResult(true)
      }
    }, 100)
  }

  const handleConfirm = () => {
    if (selectedWorld) {
      navigate('/result', { 
        state: { 
          photo, 
          world: selectedWorld 
        } 
      })
    }
  }

  if (!photo) return null

  return (
    <div className="world-select-container">
      <div className="world-header">
        <button className="back-btn" onClick={() => navigate('/camera')}>
          ← 返回
        </button>
        <h2>选择世界观</h2>
      </div>

      <div className="world-content">
        <div className="photo-preview-small">
          <img src={photo} alt="你的照片" />
        </div>

        <div className="spin-section">
          <button 
            className={`spin-btn ${isSpinning ? 'spinning' : ''}`}
            onClick={handleSpin}
            disabled={isSpinning}
          >
            {isSpinning ? '🎲 抽取中...' : '🎲 随机抽取世界观'}
          </button>
        </div>

        {selectedWorld && (
          <div className={`world-card ${showResult ? 'show' : ''}`}>
            <div className="world-image">
              <img src={selectedWorld.exampleImage} alt={selectedWorld.name} />
            </div>
            <div className="world-info">
              <h3 style={{ color: selectedWorld.color }}>{selectedWorld.name}</h3>
              <p className="world-description">{selectedWorld.description}</p>
              <div className="world-prompt">
                <strong>风格提示词：</strong>
                <p>{selectedWorld.prompt}</p>
              </div>
            </div>
          </div>
        )}

        {showResult && (
          <div className="confirm-section">
            <button className="confirm-world-btn" onClick={handleConfirm}>
              确认使用此世界观
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorldSelect
