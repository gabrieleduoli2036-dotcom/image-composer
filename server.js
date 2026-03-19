const express = require('express')
const sharp = require('sharp')
const axios = require('axios')
const path = require('path')

const app = express()
app.use(express.json())

const TEMPLATE_PATH = path.join(__dirname, 'template.jpg')

// Coordenadas do quadrado branco — vamos calibrar depois
const SQUARE = { left: 262, top: 580, size: 280 }

app.post('/compose', async (req, res) => {
  const { photo_url, name } = req.body
  if (!photo_url) return res.status(400).json({ error: 'photo_url obrigatório' })

  try {
    const response = await axios.get(photo_url, { responseType: 'arraybuffer' })
    const photoBuffer = Buffer.from(response.data)

    const resizedPhoto = await sharp(photoBuffer)
      .resize(SQUARE.size, SQUARE.size, { fit: 'cover' })
      .toBuffer()

    const result = await sharp(TEMPLATE_PATH)
      .composite([{
        input: resizedPhoto,
        left: SQUARE.left,
        top: SQUARE.top
      }])
      .jpeg({ quality: 90 })
      .toBuffer()

    res.set('Content-Type', 'image/jpeg')
    res.send(result)

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao compor imagem' })
  }
})

app.listen(3333, () => console.log('Image composer rodando na porta 3333'))
