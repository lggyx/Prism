const { execSync } = require('child_process')
const path = require('path')

console.log('开始构建项目...')

try {
  // 1. 构建前端
  console.log('\n1. 构建前端...')
  execSync('npm run build', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  })

  // 2. 同步到Capacitor
  console.log('\n2. 同步到Capacitor...')
  execSync('npx cap sync', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  })

  console.log('\n✅ 构建完成！')
  console.log('\n下一步:')
  console.log('  - Android: npm run cap:open:android')
  console.log('  - iOS: npm run cap:open:ios')
} catch (error) {
  console.error('\n❌ 构建失败:', error.message)
  process.exit(1)
}
