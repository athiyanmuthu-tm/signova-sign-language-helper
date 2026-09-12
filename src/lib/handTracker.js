// ============================================================
// HAND TRACKER
// Opens webcam and draws hand skeleton
// ============================================================

// Cached AI model
let cachedModel = null

// ----------------------------------------------------------
// Load the MediaPipe hand model
// ----------------------------------------------------------
export async function loadModel() {
  // Return cached model if already loaded
  if (cachedModel) {
    return cachedModel
  }
  
  // Import MediaPipe from CDN
  const { HandLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
  
  // Load WASM files
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )
  
  // Create the hand landmarker
  cachedModel = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      // AI model URL
      modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
      // Use GPU for faster processing
      delegate: 'GPU'
    },
    // Process video frames continuously
    runningMode: 'VIDEO',
    // Detect up to 2 hands
    numHands: 2
  })
  
  return cachedModel
}

// ----------------------------------------------------------
// Start the webcam
// ----------------------------------------------------------
export async function startCamera(videoElement) {
  // Ask browser for camera access
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: 960,
      height: 720
    }
  })
  
  // Show camera in video element
  videoElement.srcObject = stream
  
  // Wait for video to be ready
  await new Promise(function(resolve) {
    videoElement.onloadedmetadata = function() {
      videoElement.play().then(resolve)
    }
  })
  
  return stream
}

// ----------------------------------------------------------
// Stop the webcam
// ----------------------------------------------------------
export function stopCamera(stream) {
  if (stream) {
    // Stop all video tracks
    stream.getTracks().forEach(function(track) {
      track.stop()
    })
  }
}

// ----------------------------------------------------------
// Draw hand skeleton on canvas
// ----------------------------------------------------------
export function drawSkeleton(canvas, results) {
  // Get canvas drawing context
  const ctx = canvas.getContext('2d')
  
  // Set canvas size
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // If no hand detected, stop here
  if (!results || !results.landmarks || results.landmarks.length === 0) {
    return
  }
  
  // Define which points to connect (hand skeleton)
  // Each pair [a, b] means draw a line from point a to point b
  const connections = [
    // Thumb (4 points)
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Index finger (4 points)
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Middle finger (4 points)
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Ring finger (4 points)
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Pinky finger (4 points)
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Palm connections
    [5, 9], [9, 13], [13, 17]
  ]
  
  // Draw for each detected hand
  results.landmarks.forEach(function(landmarks) {
    // Set line style
    ctx.strokeStyle = '#38e8b2'
    ctx.lineWidth = 2
    
    // Draw all lines
    connections.forEach(function(pair) {
      const pointA = pair[0]
      const pointB = pair[1]
      
      const x1 = (1 - landmarks[pointA].x) * canvas.width
      const y1 = landmarks[pointA].y * canvas.height
      const x2 = (1 - landmarks[pointB].x) * canvas.width
      const y2 = landmarks[pointB].y * canvas.height
      
      //to draw lines
      ctx.beginPath() 
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    })
    
    // Draw dots at each point
    ctx.fillStyle = '#38e8b2'
    landmarks.forEach(function(point) {
      const x = (1 - point.x) * canvas.width
      const y = point.y * canvas.height
      
      //to draw the points
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, Math.PI * 2)
      ctx.fill()
    })
  })
}
