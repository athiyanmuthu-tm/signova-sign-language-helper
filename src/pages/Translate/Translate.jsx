// ============================================================
// TRANSLATE PAGE
// MediaPipe-based sign recognition with improved finger detection.
// Uses distance-ratio based finger extension detection for accurate classification.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import WebcamView from '../../components/WebcamView/WebcamView'
import { useSigns } from '../../data/signs'
import { classifyFrame, StableDetector, ZMotionDetector, JMotionDetector } from '../../lib/gestureClassifier.jsx'

const frameCount = { current: 0 }
const detector = new StableDetector({ needed: 3, cooldownFrames: 10, threshold: 0.45 })
const zDetector = new ZMotionDetector()
const jDetector = new JMotionDetector()
const skipIds = new Set()

export default function Translate() {
  const { ready, translateable } = useSigns()
  const [text, setText] = useState('')
  const [current, setCurrent] = useState('—')
  const textRef = useRef('')
  const signsRef = useRef([])
  const localVideoRef = useRef(null)
  const [cameraError, setCameraError] = useState(null)

  // Keep signsRef.current in sync on every render. WebcamView's useEffect
  // runs BEFORE this component's useEffect (child effects fire first),
  // so we MUST update the ref during render — not in useEffect.
  signsRef.current = translateable

  useEffect(() => {
    detector.reset()
  }, [ready, translateable])

  useEffect(() => { textRef.current = text }, [text])

  const onFrame = useCallback((results) => {
    frameCount.current++

    // If no signs loaded yet, nothing to match against
    if (!signsRef.current.length) {
      setCurrent('—')
      return
    }

    // If no hand detected by MediaPipe, show idle state
    if (!results?.landmarks?.length) {
      setCurrent('—')
      return
    }

    const matches = classifyFrame(results, signsRef.current)
    if (!matches.length) { setCurrent('—'); return }
    const best = matches[0]
    setCurrent(best.sign.label)

    const commit = (label, id) => {
      setText((t) => (t + label).slice(-40))
      if (id) { skipIds.add(id); setTimeout(() => skipIds.delete(id), 2000) }
    }

    // Z and J motion detection
    const lm = results.landmarks[0]
    const zr = zDetector.update(lm)
    const jr = jDetector.update(lm)
    if (zr.done) commit('Z', 'z')
    if (jr.done) commit('J', 'j')

    const committed = skipIds.size === 0 && detector.update(best.sign.id, best.score)
    if (committed) {
      skipIds.add(committed)
      setTimeout(() => skipIds.delete(committed), 800)
      const s = signsRef.current.find((x) => x.id === committed)
      if (s) commit(s.label)
    }
  }, [])

  if (!ready) return <p className="empty">Loading signs…</p>

  return (
    <div className="page">
      <div className="page-head">
        <h1>Translate</h1>
        <p className="sub">Fingerspell in front of the camera — hold each letter steady to commit it.</p>
      </div>
      <div className="translate-layout">
        <div className="stage">
          <WebcamView
            onFrame={onFrame}
            videoRef={localVideoRef}
            onError={setCameraError}
          />
          {cameraError && (
            <div className="camera-error">
              <strong>Camera error:</strong> {cameraError}
              <p className="tip">Please allow camera access in your browser and reload the page.</p>
            </div>
          )}
          <div className="current-sign">Detected: <strong>{current}</strong></div>
        </div>
        <aside className="text-panel">
          <h2>Spelled text</h2>
          <output className="text-out" aria-live="polite">{text || '…'}</output>
          <div className="btn-row">
            <button className="btn ghost" onClick={() => setText((t) => t.slice(0, -1))}>⌫ Backspace</button>
            <button className="btn ghost" onClick={() => setText((t) => t + ' ')}>Space</button>
            <button className="btn danger" onClick={() => { setText(''); detector.reset(); zDetector.reset(); jDetector.reset() }}>Clear</button>
          </div>
          <p className="tip">This bridges Deaf to hearing conversation: fingerspell, then read the text on screen.</p>
        </aside>
      </div>
    </div>
  )
}
