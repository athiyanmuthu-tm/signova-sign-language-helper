import { useState } from 'react'
import { useAuth } from '../../context/authContext'


export default function Auth({ go }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    try {
      if (mode === 'login') await login(username.trim(), password)
      else await register(username.trim(), password)
      go('dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page auth-page">
      <div className="auth-card">
        <div className="auth-toggle">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Sign in</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Create account</button>
        </div>
        <h1>{mode === 'login' ? 'Welcome back' : 'Join Signova'}</h1>
        <p className="sub">
          Just a unique name and password — your progress syncs across devices.
        </p>
        <form onSubmit={submit}>
          <label>
            Name
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your name"
              autoComplete="username"
              required
              minLength={3}
              maxLength={20}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'register' ? 'at least 6 characters' : 'your password'}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="btn primary wide" disabled={busy || !username.trim() || password.length < 6}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account & start'}
          </button>
        </form>
        <button className="linklike" onClick={() => go('home')}>
          Continue without an account →
        </button>
      </div>
    </div>
  )
}
