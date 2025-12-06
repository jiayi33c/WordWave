import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

// Draw a cute cartoon duck!
function drawDuck(ctx, x, y, size, billOpenAmount, facingLeft = false) {
  ctx.save();
  ctx.translate(x, y);
  if (facingLeft) {
    ctx.scale(-1, 1);
  }
  
  const s = size * 0.8; // Make it much smaller (was 1.2, now 0.8)
  
  // -- Feet (orange) --
  ctx.fillStyle = '#FF9800';
  ctx.beginPath();
  ctx.ellipse(0, s * 0.6, s * 0.3, s * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // -- Body (Fluffy Yellow Circle) --
  ctx.fillStyle = '#FFEB3B'; // Brighter yellow
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#FBC02D';
  ctx.lineWidth = 4;
  ctx.stroke();
  
  // -- Wing (Cute little flap) --
  ctx.fillStyle = '#FDD835';
  ctx.beginPath();
  ctx.ellipse(-s * 0.2, s * 0.1, s * 0.3, s * 0.2, -0.2, 0, Math.PI * 2);
  ctx.fill();
  
  // -- Eye (Big & Cute) --
  // White background
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.ellipse(s * 0.3, -s * 0.2, s * 0.25, s * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Black pupil
  ctx.fillStyle = '#212121';
  ctx.beginPath();
  ctx.arc(s * 0.35, -s * 0.2, s * 0.12, 0, Math.PI * 2);
  ctx.fill();
  // Shiny highlight
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(s * 0.4, -s * 0.25, s * 0.05, 0, Math.PI * 2);
  ctx.fill();

  // -- Bill (Orange & Rounded) --
  // billOpenAmount: 0 = closed, 1 = open
  const open = billOpenAmount * 0.5; // Max open angle
  
  // Top Bill
  ctx.save();
  ctx.translate(s * 0.65, 0); // Anchor point
  ctx.rotate(-open);
  ctx.fillStyle = '#FF9800';
  ctx.beginPath();
  ctx.ellipse(s * 0.2, -s * 0.05, s * 0.25, s * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  
  // Bottom Bill
  ctx.save();
  ctx.translate(s * 0.65, 0.1 * s);
  ctx.rotate(open * 0.5);
  ctx.fillStyle = '#F57C00';
  ctx.beginPath();
  ctx.ellipse(s * 0.15, s * 0.05, s * 0.2, s * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // -- Pink Blush Cheek --
  ctx.fillStyle = 'rgba(255, 82, 82, 0.4)';
  ctx.beginPath();
  ctx.arc(s * 0.1, 0.1 * s, s * 0.15, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}

const HandInput = ({ onHandMove, onPinch }) => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Smoothed position for duck
  const smoothedPos = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results) => {
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      const canvasCtx = canvasRef.current.getContext('2d');
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasCtx.translate(canvasRef.current.width, 0);
      canvasCtx.scale(-1, 1); // Mirror for drawing

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        // Landmark 8: Index Finger Tip
        // Landmark 4: Thumb Tip
        // Landmark 0: Wrist
        // Landmark 9: Middle finger base (palm center-ish)
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const palmCenter = landmarks[9]; // Use middle finger base as reference
        
        // Calculate distance for pinch detection
        const distance = Math.sqrt(
          Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2)
        );
        
        // Threshold for pinch
        // 0.1 provides a tighter, more precise pinch feel
        const isPinching = distance < 0.1;
        
        // Smooth the duck position
        const smoothFactor = 0.2;
        smoothedPos.current.x += (palmCenter.x - smoothedPos.current.x) * smoothFactor;
        smoothedPos.current.y += (palmCenter.y - smoothedPos.current.y) * smoothFactor;
        
        // Calculate bill open amount (0 = closed, 1 = open)
        // Sync with isPinching: closed at 0.1, fully open at 0.25
        const billOpenAmount = Math.max(0, Math.min(1, (distance - 0.1) / 0.15));
        
        // Draw the duck at the smoothed palm position
        const duckX = smoothedPos.current.x * videoWidth;
        const duckY = smoothedPos.current.y * videoHeight;
        const duckSize = Math.min(videoWidth, videoHeight) * 0.08; // Size based on screen
        
        // Determine if duck should face left based on hand orientation
        const facingLeft = thumbTip.x > indexTip.x;
        
        // Calculate Bill Tip Position relative to palm center
        // Duck is drawn at smoothedPos.current (palm center)
        // Bill tip offset depends on size (s) and facing direction
        // s = duckSize * 0.8
        const s = duckSize * 0.8;
        // Bill starts at s * 1.4 from center, length ~0.6s -> tip at ~2.0s
        // Let's verify drawDuck: translate(s * 1.4, ...) lineTo(s * 0.6, ...) -> s*2.0 total from center
        const billOffsetX = (facingLeft ? -1 : 1) * (s * 2.0);
        const billOffsetY = -s * 0.5; // Rough height of bill
        
        // The duck visual position (Video Pixel Coords)
        const visualDuckX = smoothedPos.current.x * videoWidth;
        const visualDuckY = smoothedPos.current.y * videoHeight;
        
        // The actual Bill Tip position (Video Pixel Coords)
        const billTipX = visualDuckX + billOffsetX;
        const billTipY = visualDuckY + billOffsetY;
        
        // Normalize Bill Tip to 0-1 of Video Dimensions
        const billTipNormalizedX = billTipX / videoWidth;
        const billTipNormalizedY = billTipY / videoHeight;

        drawDuck(canvasCtx, visualDuckX, visualDuckY, duckSize, billOpenAmount, facingLeft);
        
        // Add speech bubble when pinching (grabbing)
        if (isPinching) {
          canvasCtx.fillStyle = 'white';
          canvasCtx.strokeStyle = '#333';
          canvasCtx.lineWidth = 2;
          canvasCtx.beginPath();
          const bubbleX = visualDuckX + (facingLeft ? -duckSize * 2 : duckSize * 2);
          const bubbleY = visualDuckY - duckSize * 1.5;
          canvasCtx.ellipse(bubbleX, bubbleY, duckSize * 0.8, duckSize * 0.5, 0, 0, Math.PI * 2);
          canvasCtx.fill();
          canvasCtx.stroke();
          
          // "Quack!" text
          canvasCtx.save();
          canvasCtx.scale(-1, 1); // Unmirror for text
          canvasCtx.fillStyle = '#FF6F00';
          canvasCtx.font = `bold ${duckSize * 0.4}px Comic Sans MS, sans-serif`;
          canvasCtx.textAlign = 'center';
          canvasCtx.fillText('Grab!', -bubbleX, bubbleY + duckSize * 0.15);
          canvasCtx.restore();
        }

        // Calculate adjusted coordinates for object-fit: cover
        // The video is cropped to fit the screen aspect ratio
        const videoAspect = videoWidth / videoHeight;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const screenAspect = screenW / screenH;
        
        let scale, offsetX, offsetY;
        
        if (screenAspect > videoAspect) {
          // Screen is wider -> Video is cropped top/bottom
          // Width fits perfectly (scaled up), Height overflows
          scale = screenW / videoWidth;
          const displayedHeight = videoHeight * scale;
          offsetX = 0;
          offsetY = (screenH - displayedHeight) / 2; // Negative value
        } else {
          // Screen is taller -> Video is cropped left/right
          // Height fits perfectly (scaled up), Width overflows
          scale = screenH / videoHeight;
          const displayedWidth = videoWidth * scale;
          offsetX = (screenW - displayedWidth) / 2; // Negative value
          offsetY = 0;
        }
        
        // Raw pixel coordinates on the canvas (video resolution)
        // MIRROR the rawX because the video and canvas are mirrored
        // Visual duck is drawn mirrored, so rawX=0 (video left) should be treated as Right
        // Use billTipNormalizedX instead of smoothedPos.current.x
        const mirroredX = videoWidth - (billTipNormalizedX * videoWidth);
        
        const rawX = mirroredX;
        const rawY = billTipNormalizedY * videoHeight;
        
        // Convert to Screen Pixel Coordinates
        // Apply scale and offset
        const screenX = rawX * scale + offsetX;
        const screenY = rawY * scale + offsetY;
        
        // Normalize to 0-1 of Screen Dimensions
        const normalizedScreenX = screenX / screenW;
        const normalizedScreenY = screenY / screenH;

        // Send CORRECTED data up
        onHandMove({ x: normalizedScreenX, y: normalizedScreenY });
        onPinch(isPinching);
        
      } else {
        onHandMove(null);
        onPinch(false);
      }
      canvasCtx.restore();
    });

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video) {
            await hands.send({ image: webcamRef.current.video });
          }
        },
        width: 1280,
        height: 720,
      });
      camera.start();
      setIsLoaded(true);
    }
  }, [onHandMove, onPinch]);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000, pointerEvents: 'none' }}>
      {/* Small camera feed in corner */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: '160px',
        height: '120px',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '3px solid white',
        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
        zIndex: 1001,
      }}>
         <Webcam
          ref={webcamRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          mirrored={false} // We mirror with transform to avoid React webcam prop confusion with internal canvas
          videoConstraints={{ width: 320, height: 240 }} // Lower res for small preview
        />
      </div>

      {/* Full screen invisible webcam for tracking logic */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
      }}>
        <Webcam
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0 }}
          mirrored={true}
          videoConstraints={{ width: 1280, height: 720 }}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div style={{ 
        position: 'absolute', 
        top: 20, 
        left: 20, 
        color: 'white', 
        fontSize: '14px', 
        textShadow: '1px 1px 2px black',
        background: 'rgba(255, 200, 40, 0.9)',
        padding: '8px 15px',
        borderRadius: '15px',
        border: '2px solid #FFA000',
        fontFamily: '"Comic Sans MS", sans-serif'
      }}>
        {isLoaded ? "🦆 Ducky Mode!" : "Loading..."}
      </div>
    </div>
  );
};

export default HandInput;
