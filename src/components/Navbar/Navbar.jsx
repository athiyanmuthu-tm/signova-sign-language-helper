import { useAuth } from '../../context/authContext'

const TABS = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "learn", label: "Learn", icon: "📚" },
  { id: "practice", label: "Practice", icon: "🎯" },
  { id: "translate", label: "Translate", icon: "🔁" },
  { id: "dashboard", label: "Dashboard", icon: "🏆" },
  { id: "tutor", label: "AI Tutor", icon: "💬" },
];

export default function Navbar({ active, onChange }) {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="brand">
        <span className="brand-mark">🤟</span>
        <span>Signova</span>
        <small>AI × Sign Language</small>
      </div>
      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={active === t.id ? 'tab active' : 'tab'} onClick={() => onChange(t.id)}>
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      <div className="user-chip">
        {user ? (
          <>
            <span title={user}>👤 {user}</span>
            <button className="linklike" onClick={logout}>Logout</button>
          </>
        ) : (
          <button className="btn small" onClick={() => onChange('auth')}>Sign in</button>
        )}
      </div>
    </nav>
  )
}
