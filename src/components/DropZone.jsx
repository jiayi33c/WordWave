import React from 'react';

export function DropZone({ hovered, droppedWords = [] }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '300px',
      height: droppedWords.length > 0 ? 'auto' : '80px',
      minHeight: '80px',
      border: `4px solid #FFB74D`,
      borderRadius: '20px',
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: droppedWords.length > 0 ? 'flex-start' : 'center',
      padding: '10px',
      transition: 'all 0.3s ease',
      pointerEvents: 'none',
      zIndex: 10
    }}>
      <span style={{ 
        fontFamily: '"Comic Sans MS", sans-serif', 
        color: '#FF6F00',
        fontSize: '16px',
        fontWeight: 'bold',
        marginBottom: droppedWords.length > 0 ? '10px' : '0'
      }}>
        🦆 {droppedWords.length > 0 ? `Collected: ${droppedWords.length}` : "Pinch clouds to collect!"}
      </span>
      
      {droppedWords.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', justifyContent: 'center' }}>
          {droppedWords.map((word, i) => (
            <span key={i} style={{
              background: '#FFF9C4',
              padding: '4px 10px',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#333',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              fontFamily: '"Comic Sans MS", sans-serif',
              border: '2px solid #FFD54F'
            }}>
              {word.text}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

