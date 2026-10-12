import { useEffect, useRef, useState } from 'react'
import './app.css'
import { getReply } from './kb'

const CHIPS = [
  'Headache since morning',
  'Fever and body ache',
  'Trouble sleeping',
  'Stomach upset',
  "Cough that won't go",
  'Feeling stressed',
]

const WELCOME = {
  role: 'bot',
  r: {
    text: "Hi, I'm Pulse. Tell me what you're feeling and I'll share possible causes, simple things you can do, and warning signs to watch for.",
  },
}

const BEAT = [0, 0, 0, 0, 0.06, 0.12, 0.06, 0, 0, 0, -0.12, 0.95, -0.4, 0, 0, 0, 0, 0.1, 0.2, 0.1, 0, 0, 0, 0, 0, 0, 0, 0]

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#2CF5C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12h4l2-5 4 10 2-5h6" />
    </svg>
  )
}

// Ek heading ke neeche list dikhane ke liye
function Section({ title, items, cls = '' }) {
  return (
    <div className={`sec ${cls}`}>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

function BotBubble({ r }) {
  return (
    <div className={r.urgent ? 'bubble urgent' : 'bubble'}>
      {r.urgent && (
        <div className="urg-title">
          <i /> This may be an emergency
        </div>
      )}

      <p>{r.text}</p>

      {r.urgent && r.steps && <Section title="Do this now" items={r.steps} />}
      {r.causes && <Section title="Possible causes" items={r.causes} />}
      {r.tips && <Section title={r.causes ? 'What can help' : 'Tips'} items={r.tips} />}
      {r.see && <Section title="See a doctor if" items={r.see} cls="see" />}
    </div>
  )
}

function Ecg() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    const GAP = 3
    const points = new Array(Math.floor(canvas.width / GAP)).fill(0)
    let step = 0
    let frameId

    function draw() {
      points.push(BEAT[step % BEAT.length])
      points.shift()
      step++

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = '#2CF5C2'
      ctx.lineWidth = 2
      ctx.beginPath()
      points.forEach((value, i) => {
        const x = i * GAP
        const y = canvas.height * 0.68 - value * canvas.height * 0.5
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

      frameId = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(frameId)
  }, [])

  return <canvas id="ecg" ref={canvasRef} aria-hidden="true" />
}

export default function App() {
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatRef = useRef(null)

  useEffect(() => {
    chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, loading])

  async function send(text) {
    text = text.trim()
    if (!text || loading) return

    setMessages((prev) => [...prev, { role: 'user', text }])
    setInput('')
    setLoading(true)

    console.log(text)
    
    let reply
    try {
      reply = await getReply(text)
    } catch (err) {
      reply = { text: 'Something went wrong on my side. Please try again in a moment.' }
    }
    
    setMessages((prev) => [...prev, { role: 'bot', r: reply }])
    setLoading(false)
  }
  
  async function LLMResponse(text) {
  text = text.trim()
  if (!text || loading) return

  setMessages((prev) => [...prev, { role: 'user', text }])
  setInput('')
  setLoading(true)

  let reply
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text }),
    })

    if (!res.ok) throw new Error('Server error')

    const data = await res.json()
    reply = { text: data.reply }   
  } catch (err) {
    console.log(err)
    reply = { text: 'Something went wrong on my side. Please try again in a moment.' }
  }

  setMessages((prev) => [...prev, { role: 'bot', r: reply }])
  setLoading(false)
}

  function handleKeyDown(e) {
    // Enter = send, Shift+Enter = nayi line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      LLMResponse(input)
    }
  }

  function newChat() {
    setMessages([WELCOME])
    setInput('')
    setLoading(false)
  }

  return (
    <div className="app">
      <header>
        <Ecg />
        <div className="head-in">
          <div className="logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="#2CF5C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20.5s-8-4.6-8-10.4A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 8 2.7c0 5.8-8 10.4-8 10.4z" />
              <path d="M6 12h3l1.5-3 3 6 1.5-3h3" strokeWidth="1.6" />
            </svg>
          </div>
          <div>
            <h1>Pulse</h1>
            <div className="sub">
              <span className="dot" />
              AI health assistant · online
            </div>
          </div>
          <div className="spacer" />
          <button className="ghost" onClick={newChat}>New chat</button>
        </div>
      </header>

      <main id="chat" ref={chatRef} aria-live="polite">
        {messages.map((m, index) =>
          m.role === 'user' ? (
            <div className="msg user" key={index}>
              <div className="bubble">{m.text}</div>
            </div>
          ) : (
            <div className="msg bot" key={index}>
              <div className="av"><HeartIcon /></div>
              <BotBubble r={m.r} />
            </div>
          )
        )}

        {loading && (
          <div className="msg bot">
            <div className="av"><HeartIcon /></div>
            <div className="bubble typing"><span /><span /><span /></div>
          </div>
        )}
      </main>

      {/* chips sirf tab dikhao jab chat start ho */}
      <div className={messages.length > 1 ? 'chips hide' : 'chips'}>
        {CHIPS.map((chip) => (
          <button className="chip" key={chip} onClick={() => send(chip)}>
            {chip}
          </button>
        ))}
      </div>

      <div className="composer">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe how you're feeling…"
          aria-label="Message"
        />
        <button id="send" onClick={() => LLMResponse(input)} aria-label="Send message">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <div className="note">
        Pulse shares general health information, not a diagnosis. In an emergency, call your local emergency number.
      </div>
    </div>
  )
}
