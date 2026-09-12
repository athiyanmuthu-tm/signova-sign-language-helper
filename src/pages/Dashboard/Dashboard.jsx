import { useEffect, useState } from 'react'
import { useAuth } from '../../context/authContext'
import { get, onChange } from '../../lib/progress.jsx'
import { useSigns } from '../../data/signs'
import HeatmapGrid from '../../components/HeatmapGrid/HeatmapGrid'

export default function Dashboard({ go, practiceSeed }) {
  const { user } = useAuth()
  const { ready, alphabet, numbers } = useSigns()
  const [snap, setSnap] = useState(() => get())

  useEffect(() => onChange(() => setSnap(get())), [])

  const p = snap

  if (!user) {
    return (
      <div className="page">
        <div className="auth-card slim">
          <h1>Track your journey</h1>
          <p className="sub">Sign in to see progress, streaks and mastered signs — synced across your devices.</p>
          <button className="btn primary" onClick={() => go('auth')}>Sign in / Create account</button>
        </div>
      </div>
    )
  }

  const recentMastered = Object.entries(p.mastered)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const labelOf = (id) => [...alphabet, ...numbers].find((s) => s.id === id)?.label || id
  const minutes = Math.round(p.totalPracticeMs / 60000)
  const streak = Object.keys(p.days).length

  const levelOf = (id) => {
    if (p.mastered[id]) return 'mastered'
    return 'none'
  }

  if (!ready) return <p className="empty">Loading signs…</p>

  return (
    <div className="page">
      <div className="page-head">
        <h1>Progress <span className="accent">@{user}</span></h1>
        <p className="sub">Synced to your account · updates live as you practice</p>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><span className="stat-num">{Object.keys(p.mastered).length}</span><span className="stat-label">signs mastered</span></div>
        <div className="stat-card"><span className="stat-num">{streak}</span><span className="stat-label">day streak</span></div>
        <div className="stat-card"><span className="stat-num">{minutes}m</span><span className="stat-label">hands-on practice</span></div>
      </div>
      <section className="dash-section">
        <h2>Mastery map</h2>
        <p className="sub">Click any sign to jump straight into practicing it.</p>
        <HeatmapGrid signs={[...alphabet, ...numbers]} levelOf={levelOf} onSelect={(id) => practiceSeed(id)} />
        <div className="legend-row">
          <span className="heat-cell none">not practiced</span>
          <span className="heat-cell mastered">mastered</span>
        </div>
      </section>
      <section className="dash-section">
        <h2>Recent unlocks</h2>
        {recentMastered.length === 0 && <p className="empty">No mastered signs yet — practice a sign to unlock it.</p>}
        <ul className="unlock-list">
          {recentMastered.map(([id, ts]) => (
            <li key={id}><strong>{labelOf(id)}</strong><span>{new Date(ts).toLocaleDateString()}</span></li>
          ))}
        </ul>
      </section>
    </div>
  )
}
