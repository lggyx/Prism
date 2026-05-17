export const worlds = [
  {
    id: 1,
    name: '赛博朋克',
    description: '高科技低生活的未来都市',
    prompt: 'cyberpunk style, neon lights, futuristic city, high tech low life, dark atmosphere, glowing signs, rain, reflections',
    exampleImage: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?w=400',
    color: '#00ffff'
  },
  {
    id: 2,
    name: '蒸汽朋克',
    description: '维多利亚时代的机械美学',
    prompt: 'steampunk style, Victorian era, brass gears, steam engines, mechanical parts, vintage aesthetic, copper tones',
    exampleImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    color: '#cd7f32'
  },
  {
    id: 3,
    name: '水墨中国',
    description: '传统东方水墨画风格',
    prompt: 'traditional Chinese ink painting style, watercolor, brush strokes, mountains, mist, elegant, minimalistic, black and white with subtle colors',
    exampleImage: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    color: '#2c3e50'
  },
  {
    id: 4,
    name: '像素艺术',
    description: '复古8-bit游戏风格',
    prompt: 'pixel art style, 8-bit, retro game, blocky, vibrant colors, nostalgic, low resolution aesthetic',
    exampleImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400',
    color: '#ff6b6b'
  },
  {
    id: 5,
    name: '油画质感',
    description: '古典油画的艺术风格',
    prompt: 'oil painting style, classical art, textured brush strokes, rich colors, Renaissance aesthetic, dramatic lighting',
    exampleImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400',
    color: '#d4af37'
  },
  {
    id: 6,
    name: '动漫风格',
    description: '日本动漫美学',
    prompt: 'anime style, Japanese animation, vibrant colors, clean lines, expressive, manga aesthetic, cel shading',
    exampleImage: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
    color: '#ff69b4'
  },
  {
    id: 7,
    name: '哥特式',
    description: '黑暗神秘的哥特美学',
    prompt: 'gothic style, dark, mysterious, ornate, medieval, dramatic shadows, black and red, cathedral architecture',
    exampleImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
    color: '#4b0082'
  },
  {
    id: 8,
    name: '波普艺术',
    description: '大胆鲜艳的流行艺术',
    prompt: 'pop art style, bold colors, comic book aesthetic, Andy Warhol inspired, high contrast, graphic design',
    exampleImage: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400',
    color: '#ff1493'
  },
  {
    id: 9,
    name: '水彩画',
    description: '柔和透明的水彩效果',
    prompt: 'watercolor painting style, soft, transparent, flowing colors, dreamy, artistic, wet on wet technique',
    exampleImage: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
    color: '#87ceeb'
  },
  {
    id: 10,
    name: '素描风格',
    description: '铅笔素描的艺术效果',
    prompt: 'pencil sketch style, graphite, black and white, hand drawn, artistic, detailed lines, shading',
    exampleImage: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400',
    color: '#708090'
  }
]

export const getRandomWorld = () => {
  const randomIndex = Math.floor(Math.random() * worlds.length)
  return worlds[randomIndex]
}
