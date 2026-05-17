import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import './Camera.css'

function CameraPage() {
  const navigate = useNavigate()
  const [photo, setPhoto] = useState(null)
  const [loading, setLoading] = useState(false)

  const takePhoto = async () => {
    try {
      setLoading(true)
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
      })
      
      setPhoto(image.webPath)
      setLoading(false)
      
      // 拍照完成后跳转到世界观选择页面
      setTimeout(() => {
        navigate('/world-select', { state: { photo: image.webPath } })
      }, 500)
    } catch (error) {
      console.error('拍照失败:', error)
      setLoading(false)
      alert('拍照失败，请重试')
    }
  }

  const selectFromGallery = async () => {
    try {
      setLoading(true)
      const image = await CapacitorCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
      })
      
      setPhoto(image.webPath)
      setLoading(false)
      
      // 选择图片完成后跳转到世界观选择页面
      setTimeout(() => {
        navigate('/world-select', { state: { photo: image.webPath } })
      }, 500)
    } catch (error) {
      console.error('选择图片失败:', error)
      setLoading(false)
      alert('选择图片失败，请重试')
    }
  }

  return (
    <div className="camera-container">
      <div className="camera-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ← 返回
        </button>
        <h2>拍照上传</h2>
      </div>

      <div className="camera-content">
        {photo ? (
          <div className="photo-preview">
            <img src={photo} alt="预览" />
            <div className="photo-actions">
              <button 
                className="retake-btn"
                onClick={() => setPhoto(null)}
              >
                重新拍摄
              </button>
              <button 
                className="confirm-btn"
                onClick={() => navigate('/world-select', { state: { photo } })}
              >
                确认使用
              </button>
            </div>
          </div>
        ) : (
          <div className="camera-actions">
            <button 
              className="camera-btn"
              onClick={takePhoto}
              disabled={loading}
            >
              {loading ? '处理中...' : '📷 拍照'}
            </button>
            <button 
              className="gallery-btn"
              onClick={selectFromGallery}
              disabled={loading}
            >
              {loading ? '处理中...' : '🖼️ 从相册选择'}
            </button>
          </div>
        )}
      </div>

      <div className="camera-tips">
        <p>💡 提示：选择清晰的主体照片效果更佳</p>
      </div>
    </div>
  )
}

export default CameraPage
