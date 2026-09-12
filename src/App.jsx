import { AuthProvider } from './context/AuthContext.jsx'
import Navbar from './components/Navbar/Navbar'
import Home from './pages/Home/Home'
import Learn from './pages/Learn/Learn'
import Practice from './pages/Practice/Practice'
import Translate from './pages/Translate/Translate'
import Dashboard from './pages/Dashboard/Dashboard'
import Auth from './pages/Auth/Auth'
import Tutor from './pages/Tutor/Tutor'
import { useAppState } from './hooks/useAppState'

export default function App() {
  const { tab, setTab, seed, practiceSeed } = useAppState()

  return (
    <AuthProvider>
      <div className="app">
        <Navbar active={tab} onChange={setTab} />
        <main>
          {tab === 'home' && <Home go={setTab} />}
          {tab === 'learn' && <Learn />}
          {tab === 'practice' && <Practice key={seed || 'default'} seedId={seed} />}
          {tab === 'translate' && <Translate />}
          {tab === 'dashboard' && <Dashboard go={setTab} practiceSeed={practiceSeed} />}
          {tab === 'auth' && <Auth go={setTab} />}
          {tab === 'tutor' && <Tutor />}
        </main>
        <footer className="footer">
          Sign language is regional — when in doubt, ask a local Deaf mentor 🤟
        </footer>
      </div>
    </AuthProvider>
  )
}
