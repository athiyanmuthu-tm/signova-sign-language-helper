import { useRef, useState } from 'react'
import { chat } from '../../lib/aiClient.jsx'


const SYSTEM_PROMPT = `You are Mitra, a sign language tutor in the Signova app.
Answer all questions on any topic. For sign language topics, give clear practical guidance and respect regional variations.
Keep answers short. For quizzes, make 5 questions and grade after answers.
Respect Deaf culture — sign languages are real languages.`

const QUICK = [
  'Teach me to introduce myself',
  'Quiz me on the alphabet!',
  'What is Deaf culture etiquette?',
  'How do I sign "Where is the bus station?"',
]

export default function Tutor() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I am Mitra, your sign language tutor. Ask me anything — grammar, signs, culture, or request a quiz.' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef(null)
  const messagesRef = useRef(messages)

  messagesRef.current = messages

  const send = async (raw) => {
    const text = (raw ?? input).trim()
    if (!text || busy) return
    setInput('')
    const next = [...messagesRef.current, { role: 'user', content: text }]
    setMessages(next)
    setBusy(true)
    try {
      const { text: content } = await chat({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...next.slice(-10)],
      })
      setMessages([...next, { role: 'assistant', content }])
} catch (error) {
       console.error('AI chat error:', error)
       setMessages([...next, { role: 'assistant', content: 'Mitra error: ' + error.message }])
    } finally {
      setBusy(false)
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: 999999, behavior: 'smooth' }))
    }
  }

  return (
    <div className="page tutor-page">
      <div className="page-head">
        <h1>AI Tutor</h1>
        <p className="sub">Mitra answers anything and knows sign language inside out.</p>
      </div>
      <div className="chat" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>{m.content}</div>
        ))}
        {busy && <div className="msg assistant typing">Mitra is thinking…</div>}
      </div>
      <div className="quick-row">
        {QUICK.map((q) => (
          <button key={q} className="chip" onClick={() => send(q)} disabled={busy}>{q}</button>
        ))}
      </div>
      <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send() }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about any sign…" />
        <button className="btn primary" disabled={busy || !input.trim()}>Send</button>
      </form>
    </div>
  )
}
