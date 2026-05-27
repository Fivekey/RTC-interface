import { useEffect, useRef, useState } from 'react'
import './App.css'

type Message = {
  id: string
  text: string
  mine: boolean
}

type Status = 'connecting' | 'waiting' | 'ready' | 'full' | 'closed'

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<Status>('connecting')
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080')
    wsRef.current = ws

    ws.onopen = () => {
      setStatus('waiting')
    }

    ws.onmessage = (ev) => {
      const raw = ev.data.toString()
      try {
        const parsed = JSON.parse(raw) as { type?: string }
        if (parsed.type === 'peer') {
          setStatus('ready')
          return
        }
      } catch {
        // plain text message
      }

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), text: raw, mine: false },
      ])
    }

    ws.onclose = (ev) => {
      if (ev.code === 4000) {
        setStatus('full')
      } else {
        setStatus('closed')
      }
    }

    ws.onerror = () => {
      setStatus('closed')
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [])

  function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    const ws = wsRef.current
    if (!text || !ws || ws.readyState !== WebSocket.OPEN) return

    ws.send(text)
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text, mine: true },
    ])
    setInput('')
  }

  const statusText =
    status === 'connecting'
      ? 'Connecting…'
      : status === 'waiting'
        ? 'Waiting for the other person…'
        : status === 'ready'
          ? 'Connected'
          : status === 'full'
            ? 'Chat is full — only two people allowed'
            : 'Disconnected'

  const canSend = status === 'ready' && input.trim().length > 0

  return (
    <div className="page">
      <div className="chat-panel">
        <p className="status">{statusText}</p>
        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={`bubble ${m.mine ? 'mine' : ''}`}>
              {m.text}
            </div>
          ))}
        </div>
        <form className="composer" onSubmit={sendMessage}>
          <input
            type="text"
            placeholder="Enter message"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== 'ready'}
          />
          <button type="submit" disabled={!canSend}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
