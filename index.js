const mineflayer = require('mineflayer')
const fs = require('fs')
const express = require('express')

// Load config
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

// Simple uptime server (ping with UptimeRobot/Render health checks)
const app = express()
const PORT = process.env.PORT || 3000
app.get('/', (req, res) => res.send('Bot is running!'))
app.listen(PORT, '0.0.0.0', () => console.log(`[UPTIME] Listening on ${PORT}`))

function createBot() {
  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    auth: config.auth,
    viewDistance: 2 // minimal chunk loading = lower RAM use
  })

  bot.on('login', () => console.log(`[BOT] Logged in as ${bot.username}`))
  bot.on('spawn', () => {
    console.log('[BOT] Spawned in the world!')
    startAntiAFK(bot)
  })

  bot.on('kicked', reason => console.log(`[BOT] Kicked: ${reason}`))
  bot.on('end', reason => {
    console.log(`[BOT] Disconnected: ${reason}`)
    console.log('[BOT] Reconnecting in 10s...')
    setTimeout(createBot, 10000)
  })
  bot.on('error', err => console.error('[BOT] Error:', err.message))
}

// Minimal & Safe Anti-AFK
function startAntiAFK(bot) {
  setInterval(() => {
    if (!bot.entity) return

    // Slight head movement (super light on server)
    bot.look(
      bot.entity.yaw + (Math.random() - 0.5) * 0.3,
      bot.entity.pitch,
      true
    )

    // Small jump every ~30–45 seconds
    if (Math.random() < 0.3) {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 250)
    }
  }, 30000 + Math.random() * 15000)
}

createBot()
