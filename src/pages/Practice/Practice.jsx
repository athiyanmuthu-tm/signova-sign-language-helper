// Practice page — improved MediaPipe-based sign detection.
// Uses distance-ratio finger detection for accurate scoring.

import { useEffect, useRef, useState, useCallback } from 'react'
import WebcamView from '../../components/WebcamView/WebcamView'
import HandPoseGuide from '../../components/HandPoseGuide/HandPoseGuide'
import { useSigns } from '../../data/signs'
import { scoreSign, ZMotionDetector, JMotionDetector } from '../../lib/gestureClassifier.jsx'
import { get, onChange, master, addTime } from '../../lib/progress.jsx'

const zDetector = new ZMotionDetector()
const jDetector = new JMotionDetector()

export default function Practice({ seedId }) {
  const { ready, scoreable } = useSigns()
  const [targetId, setTargetId] = useState(seedId || 'a')
  const [masteredVersion, setMasteredVersion] = useState(0)
  const [cameraError, setCameraError] = useState(null)
  const stateRef = useRef({ hold: 0, timeAcc: 0, lastTime: 0 })
  const localVideoRef = useRef(null)

  const target = scoreable.find((s) => s.id === targetId) || scoreable[0]

  useEffect(() => {
    zDetector.reset()
    jDetector.reset()
  }, [targetId])

  useEffect(() => onChange(() => setMasteredVersion((v) => v + 1)), [])

  const masteredSet = useCallback(
    () => new Set(Object.keys(get().mastered)),
    [masteredVersion],
  )

  const isMastered = masteredSet().has(target.id)

  const onFrame = useCallback((results) => {
    if (!results?.landmarks?.length) {
      zDetector.reset()
      jDetector.reset()
      return
    }

    // Z motion sign
    if (target.id === 'z') {
      const r = zDetector.update(results.landmarks[0])
      if (r.done) { master('z') }
      return
    }

    // J motion sign
    if (target.id === 'j') {
      const r = jDetector.update(results.landmarks[0])
      if (r.done) { master('j') }
      return
    }

    // Regular signs: use the improved distance-ratio scoreSign
    const { score } = scoreSign(target, results.landmarks[0])

    if (score >= 0.85) stateRef.current.hold += 1
    else stateRef.current.hold = 0

    if (stateRef.current.hold === 25) master(target.id)

    const now = Date.now()
    if (stateRef.current.lastTime) {
      stateRef.current.timeAcc += now - stateRef.current.lastTime
      if (stateRef.current.timeAcc >= 5000) {
        addTime(stateRef.current.timeAcc)
        stateRef.current.timeAcc = 0
      }
    }
    stateRef.current.lastTime = now
  }, [target])

  if (!ready) return <p className="empty">Loading signs…</p>

  return (
    <div className="page">
      <div className="page-head">
        <h1>Practice</h1>
        <p className="sub">Hold the sign in front of the camera.</p>
      </div>
      <div className="practice-layout">
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
        </div>
        <aside className="text-panel">
          <div className="target-card">
            <h2>{target.label}{isMastered && <span className="mastered-badge"> ✓ Mastered</span>}</h2>
            <HandPoseGuide fingerState={target.fingerState} />
            <p>{target.instructions}</p>
            {target.tip && <p className="tip">{target.tip}</p>}
            {target.motion && <p className="motion-badge">Movement-based sign</p>}
          </div>
          <div className="sign-picker">
            <h3>Pick a sign</h3>
            <div className="picker-grid">
              {scoreable.map((s) => {
                const mastered = masteredSet().has(s.id)
                return (
                  <button
                    key={s.id}
                    className={`picker-btn${s.id === targetId ? ' active' : ''}${mastered ? ' mastered' : ''}`}
                    onClick={() => { setTargetId(s.id); stateRef.current.hold = 0 }}
                  >
                    {s.label}{mastered && <span className="mastered-dot" />}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}