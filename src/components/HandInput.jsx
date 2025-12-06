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

      // --- DRAW CAMERA FEED PREVIEW ---
      // Draw a small preview of the camera feed in the top-right corner
      // Since we are mirrored with scale(-1, 1) and translated to (width, 0),
      // drawing at (0,0) will place it at the top-RIGHT of the screen visually.
      if (results.image) {
        canvasCtx.save();
        // Flip the image back so the preview looks like a mirror (standard for webcam)
        // Wait, the context is already flipped. If we draw the image normally, it will appear flipped (mirrored).
        // This is what we want for a "mirror" view.
        
        // Position: Top Right (0,0 in this coordinate system)
        const previewW = videoWidth * 0.2; // 20% size
        const previewH = videoHeight * 0.2;
        const margin = 20;
        
        // Add a white border/background
        canvasCtx.fillStyle = 'white';
        canvasCtx.fillRect(margin - 5, margin - 5, previewW + 10, previewH + 10);
        
        // Draw the video frame
        canvasCtx.drawImage(results.image, margin, margin, previewW, previewH);
        
        // Add "Camera" label
        canvasCtx.scale(-1, 1); // Un-mirror text
        canvasCtx.fillStyle = '#333';
        canvasCtx.font = '12px Arial';
        // Calculate text position. We un-mirrored, so X is negative.
        // The box is at +margin. 
        // -margin - previewW/2 = center of box
        canvasCtx.fillText("Camera", -margin - previewW + 5, margin + previewH + 20);
        canvasCtx.restore();
      }

      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        const palmCenter = landmarks[9]; 
        
        const distance = Math.sqrt(
          Math.pow(indexTip.x - thumbTip.x, 2) + Math.pow(indexTip.y - thumbTip.y, 2)
        );
        
        const isPinching = distance < 0.1;
        
        const smoothFactor = 0.2;
        smoothedPos.current.x += (palmCenter.x - smoothedPos.current.x) * smoothFactor;
        smoothedPos.current.y += (palmCenter.y - smoothedPos.current.y) * smoothFactor;
        
        const billOpenAmount = Math.max(0, Math.min(1, (distance - 0.1) / 0.15));
        
        const duckX = smoothedPos.current.x * videoWidth;
        const duckY = smoothedPos.current.y * videoHeight;
        const duckSize = Math.min(videoWidth, videoHeight) * 0.08; 
        
        const facingLeft = thumbTip.x > indexTip.x;
        
        const s = duckSize * 0.8;
        const billOffsetX = (facingLeft ? -1 : 1) * (s * 2.0);
        const billOffsetY = -s * 0.5; 
        
        const visualDuckX = smoothedPos.current.x * videoWidth;
        const visualDuckY = smoothedPos.current.y * videoHeight;
        
        const billTipX = visualDuckX + billOffsetX;
        const billTipY = visualDuckY + billOffsetY;
        
        const billTipNormalizedX = billTipX / videoWidth;
        const billTipNormalizedY = billTipY / videoHeight;

        drawDuck(canvasCtx, visualDuckX, visualDuckY, duckSize, billOpenAmount, facingLeft);
        
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
          
          canvasCtx.save();
          canvasCtx.scale(-1, 1); 
          canvasCtx.fillStyle = '#FF6F00';
          canvasCtx.font = `bold ${duckSize * 0.4}px Comic Sans MS, sans-serif`;
          canvasCtx.textAlign = 'center';
          canvasCtx.fillText('Grab!', -bubbleX, bubbleY + duckSize * 0.15);
          canvasCtx.restore();
        }

        const videoAspect = videoWidth / videoHeight;
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const screenAspect = screenW / screenH;
        
        let scale, offsetX, offsetY;
        
        if (screenAspect > videoAspect) {
          scale = screenW / videoWidth;
          const displayedHeight = videoHeight * scale;
          offsetX = 0;
          offsetY = (screenH - displayedHeight) / 2; 
        } else {
          scale = screenH / videoHeight;
          const displayedWidth = videoWidth * scale;
          offsetX = (screenW - displayedWidth) / 2; 
          offsetY = 0;
        }
        
        const mirroredX = videoWidth - (billTipNormalizedX * videoWidth);
        
        const rawX = mirroredX;
        const rawY = billTipNormalizedY * videoHeight;
        
        const screenX = rawX * scale + offsetX;
        const screenY = rawY * scale + offsetY;
        
        const normalizedScreenX = screenX / screenW;
        const normalizedScreenY = screenY / screenH;

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
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '100%',
      }}>
        {/* ONE Webcam, opacity 0. Used for tracking + source for canvas preview */}
        <Webcam
          ref={webcamRef}
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