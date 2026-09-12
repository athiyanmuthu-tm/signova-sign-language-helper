// ============================================================
// GESTURE CLASSIFIER
// Converts hand landmarks into features for sign matching
// ============================================================

// ----------------------------------------------------------
// Helper: Calculate distance between two points
// ----------------------------------------------------------
function calculateDistance(point1, point2) {
  const differenceX = point2.x - point1.x
  const differenceY = point2.y - point1.y
  return Math.sqrt(differenceX * differenceX + differenceY * differenceY)
}

// ----------------------------------------------------------
// Helper: Calculate angle at point B formed by A-B-C
// Returns angle in degrees (0 to 180)
// ----------------------------------------------------------
function calculateAngle(pointA, pointB, pointC) {
  // Create vectors from B to A and B to C
  const vectorBAx = pointA.x - pointB.x
  const vectorBAy = pointA.y - pointB.y
  const vectorBCx = pointC.x - pointB.x
  const vectorBCy = pointC.y - pointB.y
  
  // Calculate dot product
  const dotProduct = vectorBAx * vectorBCx + vectorBAy * vectorBCy
  
  // Calculate lengths of vectors
  const lengthBA = Math.sqrt(vectorBAx * vectorBAx + vectorBAy * vectorBAy)
  const lengthBC = Math.sqrt(vectorBCx * vectorBCx + vectorBCy * vectorBCy)
  
  // Avoid division by zero
  if (lengthBA === 0 || lengthBC === 0) {
    return 180
  }
  
  // Calculate cosine of angle
  const cosineValue = dotProduct / (lengthBA * lengthBC)
  
  // Clamp to valid range for acos
  const clampedCosine = Math.max(-1, Math.min(1, cosineValue))
  
  // Convert to degrees
  const angleInRadians = Math.acos(clampedCosine)
  const angleInDegrees = angleInRadians * 180 / Math.PI
  
  return angleInDegrees
}

// ----------------------------------------------------------
// Helper: Get finger state from angle
// Returns "straight", "curved", or "curled"
// ----------------------------------------------------------
function getFingerStateFromAngle(angle) {
  if (angle > 160) {
    return 'straight'
  } else if (angle > 60) {
    return 'curved'
  } else {
    return 'curled'
  }
}

// ----------------------------------------------------------
// MAIN FUNCTION: Extract features from 21 hand landmarks
// Input: 21 points from MediaPipe
// Output: Simple features describing the hand
// ----------------------------------------------------------
function getHandFeatures(landmarks) {
  
  // Get wrist and middle finger base for reference
  const wrist = landmarks[0]
  const middleBase = landmarks[9]
  
  // Calculate hand size (used to check if fingers are touching)
  const handSize = calculateDistance(wrist, middleBase)
  
  // --- Get angle for each finger ---
  const thumbAngle = calculateAngle(landmarks[1], landmarks[3], landmarks[4])
  const indexAngle = calculateAngle(landmarks[5], landmarks[6], landmarks[8])
  const middleAngle = calculateAngle(landmarks[9], landmarks[10], landmarks[12])
  const ringAngle = calculateAngle(landmarks[13], landmarks[14], landmarks[16])
  const pinkyAngle = calculateAngle(landmarks[17], landmarks[18], landmarks[20])
  
  // Convert angles to states
  const fingerStates = [
    getFingerStateFromAngle(thumbAngle),
    getFingerStateFromAngle(indexAngle),
    getFingerStateFromAngle(middleAngle),
    getFingerStateFromAngle(ringAngle),
    getFingerStateFromAngle(pinkyAngle)
  ]
  
  // --- Check if thumb touches each fingertip ---
  const thumbTip = landmarks[4]
  const indexTip = landmarks[8]
  const middleTip = landmarks[12]
  const ringTip = landmarks[16]
  const pinkyTip = landmarks[20]
  
  // Thumb touches if distance is less than 25% of hand size
  const touchDistance = handSize * 0.25
  
  const thumbTouchesIndex = calculateDistance(thumbTip, indexTip) < touchDistance
  const thumbTouchesMiddle = calculateDistance(thumbTip, middleTip) < touchDistance
  const thumbTouchesRing = calculateDistance(thumbTip, ringTip) < touchDistance
  const thumbTouchesPinky = calculateDistance(thumbTip, pinkyTip) < touchDistance
  
  const touches = [
    thumbTouchesIndex,
    thumbTouchesMiddle,
    thumbTouchesRing,
    thumbTouchesPinky
  ]
  
  // --- Calculate finger spread (distance between adjacent fingers) ---
  const indexToMiddle = calculateDistance(indexTip, middleTip) / handSize
  const middleToRing = calculateDistance(middleTip, ringTip) / handSize
  const ringToPinky = calculateDistance(ringTip, pinkyTip) / handSize
  
  const fingerSpread = [indexToMiddle, middleToRing, ringToPinky]
  
  // --- Check thumb position ---
  const indexBase = landmarks[5]
  
  // Thumb is tucked if it's below the index finger base
  const thumbIsTucked = thumbTip.y > indexBase.y + handSize * 0.02
  
  // Thumb is to the side if it's far from the index finger base
  const thumbIsToSide = Math.abs(thumbTip.x - indexBase.x) > handSize * 1.2
  
  // --- Check if index is hooked (for X sign) ---
  const indexIsHooked = (
    fingerStates[1] === 'curved' &&
    fingerStates[2] === 'curled' &&
    fingerStates[3] === 'curled' &&
    fingerStates[4] === 'curled'
  )
  
  // --- Check if middle finger crosses over index ---
  const middleCrossesIndex = middleTip.x < indexTip.x
  
  // --- Get hand orientation (which way is the hand pointing) ---
  const averageFingertipY = (indexTip.y + middleTip.y + ringTip.y + pinkyTip.y) / 4
  
  let handOrientation
  if (averageFingertipY < wrist.y - 0.04) {
    handOrientation = 'up'
  } else if (averageFingertipY > wrist.y + 0.04) {
    handOrientation = 'down'
  } else {
    handOrientation = 'side'
  }
  
  // Return all features
  return {
    fingerStates: fingerStates,
    touches: touches,
    spread: fingerSpread,
    thumbTucked: thumbIsTucked,
    thumbSide: thumbIsToSide,
    hookedIndex: indexIsHooked,
    middleCrossed: middleCrossesIndex,
    orientation: handOrientation
  }
}

// ----------------------------------------------------------
// MAIN FUNCTION: Score how well hand matches a sign
// Returns score (0 to 1) and improvement hints
// ----------------------------------------------------------
function scoreSign(sign, landmarks) {
  
  // Get hand features
  const handFeatures = getHandFeatures(landmarks)
  
  // Create list of hints to show user
  const hints = []
  
  // List of finger names for hints
  const fingerNames = ['thumb', 'index', 'middle', 'ring', 'pinky']
  
  // Get what the sign expects
  const expectedFingers = sign.fingerState || sign.pattern
  
  // --- Part 1: Check finger states (40% of score) ---
  let correctFingers = 0
  
  for (let i = 0; i < 5; i++) {
    const expected = expectedFingers[i]
    const actual = handFeatures.fingerStates[i]
    
    let isMatch
    if (sign.fingerState) {
      // New format: compare exact state
      isMatch = actual === expected
    } else {
      // Old format: true means straight, false means curled
      isMatch = (actual === 'straight') === expected
    }
    
    if (isMatch) {
      correctFingers = correctFingers + 1
    } else {
      hints.push(fingerNames[i] + ' should be ' + expected)
    }
  }
  
  // Calculate finger score (40% max)
  const fingerScore = (correctFingers / 5) * 0.4
  
  // --- Part 2: Check extra features (60% of score) ---
  const extra = sign.extra || {}
  let correctExtra = 0
  let totalExtra = 0
  
  // Check orientation
  if (extra.orientation !== undefined) {
    totalExtra = totalExtra + 1
    if (handFeatures.orientation === extra.orientation) {
      correctExtra = correctExtra + 1
    } else {
      hints.push('Point hand ' + extra.orientation)
    }
  }
  
  // Check thumb to side
  if (extra.thumbSide === true) {
    totalExtra = totalExtra + 1
    if (handFeatures.thumbSide) {
      correctExtra = correctExtra + 1
    } else {
      hints.push('Stick thumb out to side')
    }
  }
  
  // Check thumb tucked
  if (extra.thumbUnder === true) {
    totalExtra = totalExtra + 1
    if (handFeatures.thumbTucked) {
      correctExtra = correctExtra + 1
    } else {
      hints.push('Tuck thumb under fingers')
    }
  }
  
  // Check hooked index
  if (extra.hookedIndex === true) {
    totalExtra = totalExtra + 1
    if (handFeatures.hookedIndex) {
      correctExtra = correctExtra + 1
    } else {
      hints.push('Bend index finger into hook')
    }
  }
  
  // Check crossed fingers
  if (extra.crossedIndexMiddle === true) {
    totalExtra = totalExtra + 1
    if (handFeatures.middleCrossed) {
      correctExtra = correctExtra + 1
    } else {
      hints.push('Cross middle over index')
    }
  }
  
  // Check thumb touching index
  if (extra.thumbTipTouch === true) {
    totalExtra = totalExtra + 1
    if (handFeatures.touches[0]) {
      correctExtra = correctExtra + 1
    } else {
      hints.push('Touch thumb to index finger')
    }
  }
  
  // Check thumb touching middle
  if (extra.thumbTouchesMiddle === true) {
    totalExtra = totalExtra + 1
    if (handFeatures.touches[1]) {
      correctExtra = correctExtra + 1
    } else {
      hints.push('Touch thumb to middle finger')
    }
  }
  
  // Check all fingers curled
  if (extra.fingerCurl === 'curled') {
    totalExtra = totalExtra + 1
    const allCurled = handFeatures.fingerStates.slice(1).every(state => state === 'curled')
    if (allCurled) {
      correctExtra = correctExtra + 1
    } else {
      hints.push('Curl all fingers tight')
    }
  }
  
  // Calculate extra score (60% max)
  let extraScore
  if (totalExtra > 0) {
    extraScore = (correctExtra / totalExtra) * 0.6
  } else {
    // If no extra features defined, give 60% by default
    extraScore = 0.6
  }
  
  // Total score
  const totalScore = fingerScore + extraScore
  
  // Return score and up to 3 hints
  return {
    score: Math.min(1, totalScore),
    hints: hints.slice(0, 3)
  }
}

// ----------------------------------------------------------
// MAIN FUNCTION: Find best matching sign from candidates
// Returns array of {sign, score} sorted by score
// ----------------------------------------------------------
function classifyFrame(results, candidates) {
  // If no hand detected, return empty
  if (!results || !results.landmarks || results.landmarks.length === 0) {
    return []
  }
  
  // Get the first hand's landmarks
  const landmarks = results.landmarks[0]
  
  // Score each candidate sign
  const scored = candidates.map(function(sign) {
    const score = scoreSign(sign, landmarks).score
    return { sign: sign, score: score }
  })
  
  // Sort by score (highest first)
  scored.sort(function(a, b) {
    return b.score - a.score
  })
  
  return scored
}

// ----------------------------------------------------------
// CLASS: StableDetector
// Waits for same sign to appear multiple times
// ----------------------------------------------------------
class StableDetector {
  
  constructor(settings) {
    // How many matching frames needed
    this.framesNeeded = settings.needed || 9
    // How many frames to wait after confirming
    this.cooldownFrames = settings.cooldownFrames || 18
    // Minimum score to accept
    this.minimumScore = settings.threshold || 0.78
    
    // Internal state
    this.lastSign = null
    this.matchingFrames = 0
    this.waitingFrames = 0
  }
  
  // Reset all state
  reset() {
    this.lastSign = null
    this.matchingFrames = 0
    this.waitingFrames = 0
  }
  
  // Check a new frame
  // Returns sign ID if confirmed, null otherwise
  update(signId, score) {
    // If waiting, ignore input
    if (this.waitingFrames > 0) {
      this.waitingFrames = this.waitingFrames - 1
      return null
    }
    
    // Check if this sign matches last sign and score is high enough
    if (signId && score >= this.minimumScore && signId === this.lastSign) {
      this.matchingFrames = this.matchingFrames + 1
    } else {
      this.lastSign = signId
      this.matchingFrames = signId ? 1 : 0
    }
    
    // If we have enough matching frames, confirm the sign
    if (this.matchingFrames >= this.framesNeeded) {
      this.waitingFrames = this.cooldownFrames
      this.matchingFrames = 0
      return signId
    }
    
    return null
  }
}

// ----------------------------------------------------------
// CLASS: ZMotionDetector
// Detects when user draws Z in the air
// ----------------------------------------------------------
class ZMotionDetector {
  
  constructor() {
    this.reset()
  }
  
  reset() {
    // List of strokes completed
    this.strokes = []
    // Where the current stroke started
    this.startPoint = null
    // Previous fingertip position
    this.previousPoint = null
    // Current direction of movement
    this.directionX = 0
    this.directionY = 0
    // Wait time after confirming
    this.cooldownUntil = 0
    // Whether Z was just completed
    this.justCompleted = false
  }
  
  // Check if Z pattern is complete
  update(landmarks) {
    // If in cooldown, do nothing
    if (performance.now() < this.cooldownUntil) {
      return { score: 1, hints: [], done: false }
    }
    
    // Get hand features
    const features = getHandFeatures(landmarks)
    
    // Z requires index straight and other fingers curled
    const indexStraight = features.fingerStates[1] === 'straight'
    const othersCurled = (
      features.fingerStates[2] === 'curled' &&
      features.fingerStates[3] === 'curled' &&
      features.fingerStates[4] === 'curled'
    )
    
    if (!indexStraight || !othersCurled) {
      // Show progress
      const progress = (this.strokes.length / 3) * 0.8
      return { score: progress, hints: ['Point index finger up'], done: false }
    }
    
    // Get index fingertip position (mirrored for video)
    const tipX = -landmarks[8].x
    const tipY = landmarks[8].y
    
    // First frame
    if (!this.previousPoint) {
      this.previousPoint = { x: tipX, y: tipY }
      this.startPoint = { x: tipX, y: tipY }
      return this.getReport()
    }
    
    // Calculate movement
    const moveX = tipX - this.previousPoint.x
    const moveY = tipY - this.previousPoint.y
    const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY)
    
    // Update direction if moved enough
    if (moveDistance > 0.02) {
      this.directionX = this.directionX * 0.6 + moveX * 0.4
      this.directionY = this.directionY * 0.6 + moveY * 0.4
      this.previousPoint = { x: tipX, y: tipY }
    }
    
    // Check if stroke is complete
    const totalX = tipX - this.startPoint.x
    const totalY = tipY - this.startPoint.y
    const totalDistance = Math.sqrt(totalX * totalX + totalY * totalY)
    
    // Stroke ends when direction reverses
    if (totalDistance > 0.10) {
      const dotProduct = this.directionX * totalX + this.directionY * totalY
      if (dotProduct < 0) {
        // Direction reversed, stroke complete
        const isHorizontal = Math.abs(totalX) > Math.abs(totalY)
        const strokeType = isHorizontal ? 'right' : 'diag'
        
        // Z pattern: right, diagonal, right
        const expectedPattern = ['right', 'diag', 'right']
        const expectedStroke = expectedPattern[this.strokes.length]
        
        if (strokeType === expectedStroke) {
          this.strokes.push(strokeType)
          
          // Check if Z is complete
          if (this.strokes.length === 3) {
            this.strokes = []
            this.cooldownUntil = performance.now() + 1200
            this.justCompleted = true
          }
        } else if (strokeType === 'right') {
          // Reset to right stroke
          this.strokes = ['right']
        } else {
          // Reset completely
          this.strokes = []
        }
        
        this.startPoint = { x: tipX, y: tipY }
      }
    }
    
    return this.getReport()
  }
  
  getReport() {
    const completed = this.justCompleted
    this.justCompleted = false
    const progress = Math.min(1, (this.strokes.length / 3) * 0.9 + 0.05)
    return { score: progress, hints: ['Draw Z in the air'], done: completed }
  }
}

// ----------------------------------------------------------
// CLASS: JMotionDetector
// Detects when user draws J in the air
// ----------------------------------------------------------
class JMotionDetector {
  
  constructor() {
    this.reset()
  }
  
  reset() {
    this.strokes = []
    this.startPoint = null
    this.previousPoint = null
    this.directionX = 0
    this.directionY = 0
    this.cooldownUntil = 0
    this.justCompleted = false
  }
  
  update(landmarks) {
    // If in cooldown, do nothing
    if (performance.now() < this.cooldownUntil) {
      return { score: 1, hints: [], done: false }
    }
    
    // Get hand features
    const features = getHandFeatures(landmarks)
    
    // J requires pinky straight and other fingers curled
    const pinkyStraight = features.fingerStates[4] === 'straight'
    const othersCurled = (
      features.fingerStates[1] === 'curled' &&
      features.fingerStates[2] === 'curled' &&
      features.fingerStates[3] === 'curled'
    )
    
    if (!pinkyStraight || !othersCurled) {
      const progress = (this.strokes.length / 2) * 0.8
      return { score: progress, hints: ['Point pinky finger up'], done: false }
    }
    
    // Get pinky fingertip position (mirrored for video)
    const tipX = -landmarks[20].x
    const tipY = landmarks[20].y
    
    // First frame
    if (!this.previousPoint) {
      this.previousPoint = { x: tipX, y: tipY }
      this.startPoint = { x: tipX, y: tipY }
      return this.getReport()
    }
    
    // Calculate movement
    const moveX = tipX - this.previousPoint.x
    const moveY = tipY - this.previousPoint.y
    const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY)
    
    if (moveDistance > 0.02) {
      this.directionX = this.directionX * 0.6 + moveX * 0.4
      this.directionY = this.directionY * 0.6 + moveY * 0.4
      this.previousPoint = { x: tipX, y: tipY }
    }
    
    // Check if stroke is complete
    const totalX = tipX - this.startPoint.x
    const totalY = tipY - this.startPoint.y
    const totalDistance = Math.sqrt(totalX * totalX + totalY * totalY)
    
    if (totalDistance > 0.10) {
      const dotProduct = this.directionX * totalX + this.directionY * totalY
      if (dotProduct < 0) {
        const isVertical = Math.abs(totalY) > Math.abs(totalX)
        const strokeType = isVertical ? 'down' : 'hook'
        
        // J pattern: down, then hook
        const expectedPattern = ['down', 'hook']
        const expectedStroke = expectedPattern[this.strokes.length]
        
        if (strokeType === expectedStroke) {
          this.strokes.push(strokeType)
          
          if (this.strokes.length === 2) {
            this.strokes = []
            this.cooldownUntil = performance.now() + 1200
            this.justCompleted = true
          }
        } else if (strokeType === 'down') {
          this.strokes = ['down']
        } else {
          this.strokes = []
        }
        
        this.startPoint = { x: tipX, y: tipY }
      }
    }
    
    return this.getReport()
  }
  
  getReport() {
    const completed = this.justCompleted
    this.justCompleted = false
    const progress = Math.min(1, (this.strokes.length / 2) * 0.9 + 0.05)
    return { score: progress, hints: ['Draw J in the air'], done: completed }
  }
}

// Export all functions and classes
export {
  getHandFeatures,
  scoreSign,
  classifyFrame,
  StableDetector,
  ZMotionDetector,
  JMotionDetector
}
