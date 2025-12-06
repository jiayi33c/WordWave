import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Hands } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';

const HandInput = ({ onHandMove }) => {
  const webcamRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // Landmark 9 is Middle Finger MCP (center of palm mostly)
        // Landmark 8 is Index Finger Tip
        const landmarks = results.multiHandLandmarks[0];
        
        // We'll use the index finger tip for pointer-like control
        const point = landmarks[8]; 
        
        // Coordinates are normalized [0, 1]. 
        // x: 0 (left) -> 1 (right) in video frame.
        // y: 0 (top) -> 1 (bottom) in video frame.
        // Note: Webcam is usually mirrored visually, but the data might need inversion depending on usage.
        // If mirrored=true in Webcam component, the visual is flipped.
        // Mediapipe usually gives coordinates relative to the image source.
        
        onHandMove({ x: point.x, y: point.y });
      } else {
        onHandMove(null);
      }
    });

    if (webcamRef.current && webcamRef.current.video) {
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (webcamRef.current && webcamRef.current.video) {
            await hands.send({ image: webcamRef.current.video });
          }
        },
        width: 320,
        height: 240,
      });
      camera.start();
      setIsLoaded(true);
    }
  }, [onHandMove]);

  return (
    <div style={{ position: 'absolute', top: 20, left: 20, zIndex: 1000 }}>
      <div style={{ 
        border: '2px solid white', 
        borderRadius: '8px', 
        overflow: 'hidden', 
        width: '160px',
        height: '120px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
      }}>
        <Webcam
          ref={webcamRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          mirrored={true}
          videoConstraints={{ width: 320, height: 240 }}
        />
      </div>
      <div style={{ color: 'white', marginTop: '5px', fontSize: '12px', textShadow: '1px 1px 2px black' }}>
        {isLoaded ? "Show hand to move!" : "Loading..."}
      </div>
    </div>
  );
};

export default HandInput;

