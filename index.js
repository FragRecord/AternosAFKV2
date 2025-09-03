const mineflayer = require('mineflayer')
const fs = require('fs')
const express = require('express')

// load config
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'))

// uptime express server (ping this with UptimeRobot)
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
    version: config.version || false
  })

  // when logged in
  bot.on('login', () => {
    console.log(`[BOT] Logged in as ${bot.username}`)
  })

  // when spawned
  bot.on('spawn', () => {
    console.log('[BOT] Spawned in the world!')
    startAntiAFK(bot)
  })

  // when kicked
  bot.on('kicked', (reason) => {
    console.log(`[BOT] Kicked: ${reason}`)
  })

  // when disconnected
  bot.on('end', (reason) => {
    console.log(`[BOT] Disconnected: ${reason}`)
    console.log('[BOT] Reconnecting in 10s...')
    setTimeout(createBot, 10000)
  })

  // error handling
  bot.on('error', (err) => {
    console.error('[BOT] Error:', err.message)
  })
}

// simple anti-AFK
function startAntiAFK(bot) {
  setInterval(() => {
    if (!bot.entity) return
    const actions = [
      () => bot.setControlState('jump', true),
      () => bot.setControlState('jump', false),
      () => bot.setControlState('left', true),
      () => bot.setControlState('left', false),
      () => bot.setControlState('right', true),
      () => bot.setControlState('right', false)
    ]
    const randomAction = actions[Math.floor(Math.random() * actions.length)]
    randomAction()
  }, 15000) // every 15s do a random move
}

createBot()
