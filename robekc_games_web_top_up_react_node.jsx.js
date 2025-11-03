// ROBEKC_GAMES - Full single-file starter (README + frontend + backend snippets)
// Type: code/react
// How to use: This document contains a React frontend component (single-file), plus
// Node/Express backend snippets (API, payment placeholder) and a Telegram Bot webhook example
// (Telegraf). Follow "Setup & Deployment" section at the bottom.

/* ==========================
   ROBEKC GAMES - Top Up Web
   ==========================
   Tujuan: Starter kit legal untuk web top-up game yang:
   - Menampilkan daftar produk top-up
   - Memiliki flow checkout sederhana
   - Menyediakan endpoint backend untuk create-order (mock)
   - Contoh integrasi Telegram Bot (pembayaran via bot atau forward order)

   CATATAN PENTING (BACA):
   - Ini contoh starter. Untuk menerima pembayaran sungguhan, wajib integrasi ke payment gateway resmi
     (midtrans, xendit, stripe, paypal, dsb) dan patuhi ketentuan layanan game publisher.
   - Jangan gunakan script ini untuk menjual item/layanan ilegal atau melakukan fraud.

   Struktur dokumen ini:
   1) Frontend (React single-file component)
   2) Backend (Node/Express snippets)
   3) Telegram Bot (Telegraf webhook snippet)
   4) Setup & Deployment (GitHub + Vercel / Railway / Render)
   5) Checklist legal & keamanan singkat
*/

/* ------------------ 1) FRONTEND: src/App.jsx ------------------ */

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">ROBEKC GAMES — Top Up</h1>
          <p className="text-sm text-gray-600">Pilih produk, masukkan ID game, bayar, dan konfirmasi via Telegram.</p>
        </header>

        <Products />
      </div>
    </div>
  )
}

// Minimal CSS using Tailwind classes in JSX. If you don't use Tailwind, replace with plain CSS.

function Products() {
  // contoh produk statis; replace dengan fetch('/api/products') jika backend siap
  const products = [
    { id: 'p100', name: 'Diamond 50', price: 12000 },
    { id: 'p200', name: 'Diamond 120', price: 30000 },
    { id: 'p300', name: 'Voucher 50k', price: 50000 },
  ]

  const [cart, setCart] = React.useState(null)
  const [userId, setUserId] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState('')

  async function handleBuy(product) {
    if (!userId) { setMessage('Masukkan Player ID/UID terlebih dahulu'); return }
    setLoading(true)
    setMessage('')
    try {
      // panggil backend untuk buat order
      const res = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Gagal buat order')

      setCart({ product, orderId: data.orderId, payUrl: data.payUrl })
    } catch (e) {
      setMessage(e.message)
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Player ID / UID</label>
        <input value={userId} onChange={e=>setUserId(e.target.value)} className="mt-1 p-2 border rounded w-full" placeholder="Contoh: 123456789" />
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {products.map(p => (
          <li key={p.id} className="border rounded p-4 flex flex-col justify-between">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-600">Rp {formatRp(p.price)}</div>
            </div>
            <button onClick={()=>handleBuy(p)} className="mt-4 py-2 rounded bg-blue-600 text-white">Beli</button>
          </li>
        ))}
      </ul>

      {loading && <div className="text-sm text-gray-500">Memproses...</div>}
      {message && <div className="text-sm text-red-600">{message}</div>}

      {cart && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-semibold">Order dibuat</h3>
          <p>Order ID: <code>{cart.orderId}</code></p>
          <p>Produk: {cart.product.name} — Rp {formatRp(cart.product.price)}</p>
          <div className="mt-2 flex gap-2">
            <a href={cart.payUrl} target="_blank" rel="noreferrer" className="px-3 py-2 rounded bg-green-600 text-white">Bayar</a>
            <button onClick={()=>notifyTelegram(cart.orderId)} className="px-3 py-2 rounded bg-blue-500 text-white">Kirim ke Telegram (Bot)</button>
          </div>
        </div>
      )}

    </div>
  )
}

function formatRp(n){ return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') }

async function notifyTelegram(orderId){
  try{
    const res = await fetch('/api/notify-telegram', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orderId }) })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Gagal mengirim ke Telegram')
    alert('Notifikasi terkirim ke Telegram: ' + data.result)
  }catch(e){ alert(e.message) }
}

/* ------------------ End frontend ------------------ */

/* ------------------ 2) BACKEND (Node/Express) ------------------
   File: server/index.js (snippet)
   RUN: node index.js (or use pm2 / deploy to Railway/Render)
*/

/*
const express = require('express')
const bodyParser = require('body-parser')
const { v4: uuidv4 } = require('uuid')
const app = express()
app.use(bodyParser.json())

// MOCK DB in-memory (ganti dengan database riil: Mongo/Postgres)
const ORDERS = {}

// contoh endpoint create-order
app.post('/api/create-order', (req, res) => {
  const { productId, userId } = req.body
  if (!productId || !userId) return res.status(400).json({ error: 'Missing fields' })

  // VALIDASI productId di DB/produk nyata
  const orderId = 'ROBEKC-' + uuidv4()
  const amount = 10000 // sesuaikan dengan productId
  const order = { orderId, productId, userId, amount, status: 'pending', createdAt: new Date() }
  ORDERS[orderId] = order

  // payUrl: pada implementasi nyata, Anda harus membuat pembayaran di payment gateway
  const payUrl = `https://example-payment-gateway/checkout?order=${orderId}`

  res.json({ orderId, payUrl })
})

// endpoint notify-telegram (dipanggil dari frontend)
app.post('/api/notify-telegram', async (req, res) => {
  const { orderId } = req.body
  const order = ORDERS[orderId]
  if (!order) return res.status(404).json({ error: 'Order not found' })

  // Kirim notifikasi ke Telegram melalui Bot API - lebih bagus pakai Telegraf
  // Contoh sederhana: fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, ...)

  // MOCK
  res.json({ result: 'ok' })
})

app.listen(process.env.PORT || 3000, ()=> console.log('Server running'))
*/

/* ------------------ 3) TELEGRAM BOT (Telegraf webhook example) ------------------
   File: telegram/bot.js
   npm i telegraf node-fetch
*/

/*
const { Telegraf } = require('telegraf')
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

// command /start
bot.start((ctx) => ctx.reply('Halo! Kirim /orders untuk melihat order terbaru.'))

// simple admin-only command to check order
bot.command('orders', async (ctx) => {
  const chatId = ctx.chat.id
  // cek apakah admin (bandingkan chatId dengan list admin)
  if (![process.env.ADMIN_CHAT_ID].includes(String(chatId))) return ctx.reply('Akses ditolak')

  // ambil order terbaru dari DB (ganti dengan panggilan ke DB nyata)
  ctx.reply('Order terbaru: ...')
})

// contoh webhook handler jika Anda pasang bot ke server
// bot.launch({ webhook: { domain: 'https://your-domain.com', port: process.env.PORT } })

bot.launch()
*/

/* ------------------ 4) SETUP & DEPLOYMENT ------------------
   1) Buat repository GitHub baru (ROBEKC-GAMES).
   2) Struktur sederhana:
      - /client (React app, App.jsx dari atas)
      - /server (index.js express)
      - /telegram (bot.js)
   3) Integrasi payment gateway:
      - Untuk Indonesia: Xendit atau Midtrans mudah dipakai.
      - Untuk internasional: Stripe.
      - Ikuti dokumentasi gateway: buat invoice, webhook konfirmasi, lalu update ORDERS status.
   4) Deploy:
      - Frontend: Vercel / Netlify
      - Backend: Railway / Render / Heroku (atau Vercel Serverless API)
      - Telegram Bot: dapat berjalan di same backend atau di worker terpisah.
   5) HTTPS wajib jika webhook/Payment callbacks.

   Contoh file .env (server + telegram):
   PORT=3000
   TELEGRAM_BOT_TOKEN=123:ABC
   ADMIN_CHAT_ID=987654321
   PAYMENT_SECRET=...
*/

/* ------------------ 5) CHECKLIST LEGAL & KEAMANAN ------------------
 - Pastikan Anda memiliki izin/kerjasama dengan publisher game jika diperlukan.
 - Tampilkan kebijakan privasi & syarat layanan.
 - Simpan minimal data pribadi; enkripsi data sensitif.
 - Gunakan HTTPS, sanitize user input (hindari SQL injection).
 - Simpan bukti transaksi & log untuk audit.
 - Integrasikan webhook payment gateway untuk konfirmasi otomatis.
*/

// END OF FILE
