import React from 'react';

const SHAPES = [
  { id: 'SQUARE', name: 'Square', icon: 'M4,4 H20 V20 H4 Z' },
  { id: 'L_SHAPE', name: 'L-Shaped', icon: 'M4,4 H12 V12 H20 V20 H4 Z' },
  { id: 'T_SHAPE', name: 'T-Shaped', icon: 'M4,4 H20 V10 H14 V20 H10 V10 H4 Z' },
  { id: 'HEXAGON', name: 'Hexagon', icon: 'M12,2 L20,6 V14 L12,18 L4,14 V6 Z' }
];

export default function RoomSelector({ onSelect }) {
  return (
    <div className="selector-screen">
      <h1>PlanPro Room Designer</h1>
      <p>Select your floor plan layout</p>
      <div className="shape-grid">
        {SHAPES.map((shape) => (
          <div key={shape.id} className="shape-card" onClick={() => onSelect(shape.id)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d={shape.icon} />
            </svg>
            <span>{shape.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}