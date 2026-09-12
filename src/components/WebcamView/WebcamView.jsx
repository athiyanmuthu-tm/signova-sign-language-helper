// ============================================================
// WEBCAM VIEW COMPONENT
// Shows live webcam feed with hand skeleton overlay
// ============================================================

import { useEffect, useRef, useState } from 'react'
import { loadModel, startCamera, stopCamera, drawSkeleton } from '../../lib/handTracker'

export default function WebcamView(props) {
  // Get settings from props
  const onFrame = props.onFrame
  const externalRef = props.videoRef
  const showSkeleton = props.showSkeleton !== false
  const onError = props.onError
  
  // Refs to access DOM elements
  const videoRef = externalRef || useRef(null)
  const canvasRef = useRef(null)
  
  // Show "Loading..." until camera is ready
  const [isLoading, setIsLoading] = useState(true)
  
  // Start camera when component loads
  useEffect(function() {
    // Run setup in async function
    ;(async function() {
      try {
        // Step 1: Load the AI hand model
        const model = await loadModel()
        
        // Step 2: Turn on the webcam
        const stream = await startCamera(videoRef.current)
        
        // Step 3: Hide loading message
        setIsLoading(false)
        
        // Step 4: Start detection loop
        function runDetection() {
          // Find 21 hand points in the video
          const results = model.detectForVideo(videoRef.current, performance.now())
          
          // Draw skeleton on canvas
          if (showSkeleton) {
            drawSkeleton(canvasRef.current, results)
          }
          
          // Send results to parent component
          if (onFrame) {
            onFrame(results)
          }
          
          // Run again on next frame
          requestAnimationFrame(runDetection)
        }
        runDetection()
        
        // Cleanup: stop camera when leaving page
        return function() {
          stopCamera(stream)
        }
        
      } catch (error) {
        // Camera failed
        if (onError) {
          onError(error.message)
        }
        setIsLoading(false)
      }
    })()
  }, [])
  
  return (
    <div className="webcam-container">
      {/* Live webcam video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="webcam-video"
      />
      
      {/* Canvas for drawing hand skeleton */}
      {showSkeleton && (
        <canvas ref={canvasRef} className="webcam-canvas" />
      )}
      
      {/* Show loading text while camera starts */}
      {isLoading && (
        <div className="webcam-loading">
          Starting camera...
        </div>
      )}
    </div>
  )
}
