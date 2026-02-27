const path = require('path')

// Load .env if present
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') })
} catch {}

const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
const sispro = require('./routes/routesSisproind')
app.use('/api/responseSisproind', sispro)

app.get('/health', (req, res) => res.json({ ok: true }))

const port = Number(process.env.PORT || 3021)
app.listen(port, '0.0.0.0', () => {
  console.log(`[backend-sisproind] listening on ${port}`)
})
