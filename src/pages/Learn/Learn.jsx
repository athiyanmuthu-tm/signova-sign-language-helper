import { useState } from 'react'
import { useSigns } from '../../data/signs'
import HandPoseGuide from '../../components/HandPoseGuide/HandPoseGuide'


export default function Learn() {
  const { ready, alphabet, numbers, words, groupMeta, fingerNames, scoreable } = useSigns()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('alphabet')

  const scoreableIds = new Set(scoreable.map((s) => s.id))

  if (!ready) return <p className="empty">Loading signs…</p>

  const groups = { alphabet, numbers, words }
  const list = groups[tab] || []
  const filtered = search
    ? [...alphabet, ...numbers, ...words].filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        (s.instructions || '').toLowerCase().includes(search.toLowerCase())
      )
    : list

  return (
    <div className="page">
      <div className="page-head">
        <h1>Learn Sign Language</h1>
        <p className="sub">Browse the sign dictionary — tap any card to see the hand pose guide.</p>
      </div>
      <div className="learn-tabs">
        {['alphabet', 'numbers', 'words'].map((t) => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); setSearch(''); setSelected(null) }}>
            {groupMeta[t]?.title || t}
          </button>
        ))}
      </div>
      <input
        className="learn-search"
        placeholder="Search signs…"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setSelected(null) }}
      />
      {selected && (
        <div className="learn-detail">
          <div className="learn-detail-card">
            <h2>{selected.label}</h2>
            <HandPoseGuide fingerState={selected.fingerState} />
            <p>{selected.instructions}</p>
            {selected.tip && <p className="tip">💡 {selected.tip}</p>}
            {selected.motion && <p className="motion-badge">Movement-based sign</p>}
            {!scoreableIds.has(selected.id) && <p className="tip">This sign is shown for reference — the camera cannot reliably distinguish it from similar poses.</p>}
          </div>
        </div>
      )}
      <div className="sign-grid">
        {filtered.map((s) => (
          <button key={s.id} className={`sign-card${selected?.id === s.id ? ' active' : ''}${!scoreableIds.has(s.id) ? ' reference-only' : ''}`} onClick={() => setSelected(s)}>
            <span className="sign-label">{s.label}{!scoreableIds.has(s.id) && <span className="ref-badge">ref</span>}</span>
            <HandPoseGuide fingerState={s.fingerState} size="small" />
          </button>
        ))}
        {filtered.length === 0 && <p className="empty">No signs match your search.</p>}
      </div>
      <section className="finger-ref">
        <h3>Finger Reference</h3>
        <div className="finger-row">
          {fingerNames.map((name, i) => (
            <span key={name} className="finger-chip">{i + 1}. {name}</span>
          ))}
        </div>
      </section>
    </div>
  )
}
