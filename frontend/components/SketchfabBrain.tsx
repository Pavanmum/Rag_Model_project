'use client';

import React from 'react';

interface SketchfabBrainProps {
  width?: number;
  height?: number;
}

const SketchfabBrain: React.FC<SketchfabBrainProps> = ({
  width = 600,
  height = 500
}) => {
  return (
    <div 
      className="sketchfab-embed-wrapper"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        borderRadius: '12px',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <iframe 
        title="Brain - 3D Model by Javi_DaviYT" 
        frameBorder="0" 
        allowFullScreen 
        allow="autoplay; fullscreen; xr-spatial-tracking" 
        src="https://sketchfab.com/models/3022543bb7a54b88b892ff4907e50929/embed?autostart=1&ui_theme=dark&ui_hint=0&preload=1"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '12px'
        }}
      />
    </div>
  );
};

export default SketchfabBrain;

