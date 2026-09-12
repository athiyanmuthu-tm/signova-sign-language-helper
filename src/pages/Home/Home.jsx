import { useAuth } from '../../context/authContext'

export default function Home({ go }) {
  const { user } = useAuth()

  const modes = [
    { id: 'learn', icon: '📚', title: 'Learn', desc: 'Alphabet, numbers and everyday sign language words with visual pose guides.' },
    { id: 'practice', icon: '🎯', title: 'Practice', desc: 'Sign in front of your webcam and get instant AI scoring and corrections.' },
    { id: 'translate', icon: '🔁', title: 'Translate', desc: 'Fingerspell to the camera — AI turns it into text on screen.' },
    { id: 'tutor', icon: '💬', title: 'AI Tutor', desc: 'Chat about sign language grammar, Deaf culture, or generate custom quizzes.' },
  ]

  return (
    <div className="page">
      <section className="hero">
        {user && (
          <p className="welcome-back">
            Welcome back, <strong>@{user}</strong> — keep your streak alive!{' '}
            <button className="linklike" onClick={() => go('dashboard')}>View dashboard →</button>
          </p>
        )}
        <h1>
          Break communication barriers with <em>Sign Language</em>
        </h1>
        <p>
          Signova helps anyone learn sign language with live camera feedback and an AI companion —
          bridging conversations between Deaf and hearing people.
        </p>
        <div className="hero-actions">
          <button className="btn primary" onClick={() => go('learn')}>Start learning</button>
          <button className="btn ghost" onClick={() => go('translate')}>Try live translate</button>
        </div>
      </section>
      <section className="mode-grid">
        {modes.map((m) => (
          <button key={m.id} className="mode-card" onClick={() => go(m.id)}>
            <span className="mode-icon" aria-hidden>{m.icon}</span>
            <h3>{m.title}</h3>
            <p>{m.desc}</p>
          </button>
        ))}
      </section>
      <section className="how">
        <h2>How it works</h2>
        <ol>
          <li><strong>See</strong> — your camera feed is analyzed frame-by-frame, entirely inside your browser.</li>
          <li><strong>Understand</strong> — an on-device engine scores finger shapes, pinches and orientation against each sign's pattern.</li>
          <li><strong>Coach</strong> — Mitra explains mistakes in plain language and answers anything about sign language.</li>
        </ol>
        <p className="privacy">Video never leaves your device — all detection runs locally in your browser.</p>
      </section>
    </div>
  )
}
