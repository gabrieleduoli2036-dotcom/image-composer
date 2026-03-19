const express = require('express')
const sharp = require('sharp')
const axios = require('axios')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const app = express()
app.use(express.json())

// Serve arquivos gerados publicamente
app.use('/output', express.static(path.join(__dirname, 'output')))

// Cria pasta output se não existir
const outputDir = path.join(__dirname, 'output')
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

const TEMPLATE_PATH = path.join(__dirname, 'template.jpg')
const SQUARE = { left: 242, top: 599, size: 325 }
const BASE_URL = process.env.BASE_URL || 'https://node-js-image-composer.nmzktq.easypanel.host'

app.post('/compose', async (req, res) => {
  const { photo_url } = req.body
  if (!photo_url) return res.status(400).json({ error: 'photo_url obrigatório' })

  try {
    const response = await axios.get(photo_url, { responseType: 'arraybuffer' })
    const photoBuffer = Buffer.from(response.data)

    const resizedPhoto = await sharp(photoBuffer)
      .resize(SQUARE.size, SQUARE.size, { fit: 'cover' })
      .toBuffer()

    const result = await sharp(TEMPLATE_PATH)
      .composite([{ input: resizedPhoto, left: SQUARE.left, top: SQUARE.top }])
      .jpeg({ quality: 90 })
      .toBuffer()

    // Salva com nome único
    const filename = `${crypto.randomUUID()}.jpg`
    fs.writeFileSync(path.join(outputDir, filename), result)

    const imageUrl = `${BASE_URL}/output/${filename}`
    res.json({ url: imageUrl })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erro ao compor imagem' })
  }
})

app.listen(3333, () => console.log('Image composer rodando na porta 3333'))
