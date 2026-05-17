const { exec } = require('child_process')
const path = require('path')

console.log('启动开发服务器...')
console.log('前端: http://localhost:5173')
console.log('后端: http://localhost:3001')
console.log('')

// 启动后端服务器
const serverProcess = exec('cd server && npm run dev', {
  cwd: path.join(__dirname, '..')
})

serverProcess.stdout?.pipe(process.stdout)
serverProcess.stderr?.pipe(process.stderr)

// 启动前端开发服务器
const frontendProcess = exec('npm run dev', {
  cwd: path.join(__dirname, '..')
})

frontendProcess.stdout?.pipe(process.stdout)
frontendProcess.stderr?.pipe(process.stderr)

// 处理退出
process.on('SIGINT', () => {
  console.log('\n正在关闭服务器...')
  serverProcess.kill()
  frontendProcess.kill()
  process.exit(0)
})
