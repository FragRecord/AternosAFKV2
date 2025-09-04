const mineflayer = require('mineflayer')
const fs = require('fs')
const express = require('express')

// Load config
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

// Express uptime server (ping with UptimeRobot)
const app = express()
const PORT = process.env.PORT || 3000
app.get('/', (req, res) => res.send('Bot is running!'))
app.listen(PORT, '0.0.0.0', () => console.log(`[UPTIME] Server listening on ${PORT}`))

function createBot() {
  const bot = mineflayer.createBot({
    host: config.host,
    port: config.port,
    username: config.username,
    auth: config.auth,
    viewDistance: 2, // minimal chunks loaded to save RAM
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

// Anti-AFK function (stationary, safe, low RAM)
function startAntiAFK(bot) {
  if (!bot.entity) return

  // single merged interval every 30–45s
  setInterval(() => {
    if (!bot.entity) return

    // Slight look around
    bot.look(
      bot.entity.yaw + (Math.random() - 0.5) * 0.5,
      bot.entity.pitch + (Math.random() - 0.5) * 0.2,
      true
    )

    // Tiny jump (no horizontal movement)
    if (Math.random() < 0.3) {
      bot.setControlState('jump', true)
      setTimeout(() => bot.setControlState('jump', false), 500)
    }

    // Harmless chat
    if (Math.random() < 0.2 && bot.chat) {
      const messages = ['.', 'ping', 'hi', '!']
      bot.chat(messages[Math.floor(Math.random() * messages.length)])
    }

    // Unload far chunks to free RAM
    bot.world.chunkMap.forEach((chunk, key) => {
      const distance = Math.sqrt(
        Math.pow(chunk.x * 16 - bot.entity.position.x, 2) +
        Math.pow(chunk.z * 16 - bot.entity.position.z, 2)
      )
      if (distance > 32 * 16) { // unload chunks beyond 32-block radius
        bot.world.unloadChunk(chunk.x, chunk.z)
      }
    })
  }, 30000 + Math.random() * 15000)
}

createBot()
