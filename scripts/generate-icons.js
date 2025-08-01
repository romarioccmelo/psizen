// Script para gerar ícones PWA (opcional)
// Você pode usar ferramentas online como https://realfavicongenerator.net/
// ou https://www.pwabuilder.com/imageGenerator

const fs = require('fs')
const path = require('path')

console.log('Gerando ícones PWA...')

// Lista de tamanhos de ícones necessários
const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
]

console.log('Ícones necessários:')
iconSizes.forEach(icon => {
  console.log(`- ${icon.name} (${icon.size}x${icon.size})`)
})

console.log('\nPara gerar os ícones:')
console.log('1. Use https://realfavicongenerator.net/')
console.log('2. Faça upload de uma imagem 512x512 ou maior')
console.log('3. Baixe os ícones gerados')
console.log('4. Coloque-os na pasta /public/')

console.log('\nOu use o PWA Builder:')
console.log('https://www.pwabuilder.com/imageGenerator') 