import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Home from './pages/Home'
import CameraPage from './pages/Camera'
import WorldSelect from './pages/WorldSelect'
import Result from './pages/Result'
import SharePage from './pages/Share'
import Download from './pages/Download'
import './App.css'

function App() {
  const router = createBrowserRouter([
    { path: '/', element: <Home /> },
    { path: '/camera', element: <CameraPage /> },
    { path: '/world-select', element: <WorldSelect /> },
    { path: '/result', element: <Result /> },
    { path: '/share', element: <SharePage /> },
    { path: '/download', element: <Download /> },
  ])

  return <RouterProvider router={router} />
}

export default App
