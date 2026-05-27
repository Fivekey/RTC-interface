import { WebSocket, WebSocketServer } from 'ws'

const PORT = 8080
const clients: WebSocket[] = []

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  if (clients.length >= 2) {
    ws.close(4000, 'Chat is full')
    return
  }

  clients.push(ws)
  console.log(`Client connected (${clients.length}/2)`)

  if (clients.length === 2) {
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'peer' }))
      }
    }
  }

  ws.on('message', (data) => {
    const text = data.toString()
    const other = clients.find(
      (c) => c !== ws && c.readyState === WebSocket.OPEN,
    )
    if (other) {
      other.send(text)
    }
  })

  const remove = () => {
    const index = clients.indexOf(ws)
    if (index !== -1) {
      clients.splice(index, 1)
      console.log(`Client disconnected (${clients.length}/2)`)
    }
  }

  ws.on('close', remove)
  ws.on('error', remove)
})

console.log(`WebSocket server listening on ws://localhost:${PORT}`)
