const fs = require('fs')
const path = require('path')

const src = path.resolve(__dirname, '..', '..', 'images', 'Imagen2.png')
const destDir = path.resolve(__dirname, '..', 'public')
const dest = path.join(destDir, 'Imagen2.png')

if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })

try {
  fs.copyFileSync(src, dest)
  console.log('Logo copied to', dest)
} catch (err) {
  console.warn('Could not copy logo:', err.message)
}
