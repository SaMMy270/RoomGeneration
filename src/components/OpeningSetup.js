import React, { useState, useMemo } from 'react';
import * as THREE from 'three';

export default function OpeningsSetup({ data, onUpdate, onNext, onBack }) {
    const { shape, dimensions, openings = [] } = data;
    const { length: L, width: W, notchL, notchW } = dimensions;
    
    const [selectedType, setSelectedType] = useState('DOOR');

    // 1. UPDATED: Points Logic (Hexagon oriented flat-side down, ignores width/notches)
    const points = useMemo(() => {
        const hL = L / 2;
        const hW = W / 2;

        switch (shape) {
            case 'L_SHAPE':
                return [
                    new THREE.Vector2(-hL, -hW), new THREE.Vector2(hL, -hW),
                    new THREE.Vector2(hL, hW - notchW), new THREE.Vector2(hL - notchL, hW - notchW),
                    new THREE.Vector2(hL - notchL, hW), new THREE.Vector2(-hL, hW),
                ];
            case 'T_SHAPE':
                const sW = notchW / 2; const headY = hW - notchL;
                return [
                    new THREE.Vector2(-sW, -hW), new THREE.Vector2(sW, -hW),
                    new THREE.Vector2(sW, headY), new THREE.Vector2(hL, headY),
                    new THREE.Vector2(hL, hW), new THREE.Vector2(-hL, hW),
                    new THREE.Vector2(-hL, headY), new THREE.Vector2(-sW, headY),
                ];
            case 'HEXAGON':
                const hexPoints = [];
                for (let i = 0; i < 6; i++) {
                    // + PI/6 rotates flat side to bottom. hL used for both to keep it regular.
                    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
                    hexPoints.push(new THREE.Vector2(Math.cos(angle) * hL, Math.sin(angle) * hL));
                }
                return hexPoints;
            default: // SQUARE
                return [
                    new THREE.Vector2(-hL, -hW), new THREE.Vector2(hL, -hW),
                    new THREE.Vector2(hL, hW), new THREE.Vector2(-hL, hW)
                ];
        }
    }, [shape, L, W, notchL, notchW]);

    const handleWallClick = (index) => {
        if (selectedType === 'DOOR' && openings.some(o => o.type === 'DOOR')) {
            alert("Only one door is allowed per room.");
            return;
        }

        // Override: Remove existing opening on this wall
        const remainingOpenings = openings.filter(o => o.wallIndex !== index);

        const newOpening = {
            id: Date.now(),
            type: selectedType,
            wallIndex: index,
            offset: 0.5 
        };

        onUpdate({ ...data, openings: [...remainingOpenings, newOpening] });
    };

    const updateOffset = (id, val) => {
        const updated = openings.map(o => o.id === id ? { ...o, offset: parseFloat(val) } : o);
        onUpdate({ ...data, openings: updated });
    };

    return (
        <div className="setup-container">
            <div className="setup-card">
                <div className="setup-header">
                    <h2>Step 3: Door & Window Placement</h2>
                    <p>Click a wall to place. Use sliders to move them along the wall.</p>
                </div>

                <div className="openings-interface">
                    <div className="opening-tools">
                        <div className="tool-selector">
                            <button className={`tool-btn ${selectedType === 'DOOR' ? 'active-door' : ''}`} onClick={() => setSelectedType('DOOR')}>🚪 Add Door</button>
                            <button className={`tool-btn ${selectedType === 'WINDOW' ? 'active-win' : ''}`} onClick={() => setSelectedType('WINDOW')}>🪟 Add Window</button>
                        </div>

                        <div className="placed-list">
                            <h3>Adjust Positions</h3>
                            {openings.map(o => (
                                <div key={o.id} className="offset-control">
                                    <div className="offset-label">
                                        <span>{o.type} (Wall {o.wallIndex + 1})</span>
                                        <button onClick={() => onUpdate({ ...data, openings: openings.filter(x => x.id !== o.id) })}>🗑️</button>
                                    </div>
                                    <input 
                                        type="range" min="0.1" max="0.9" step="0.01" 
                                        value={o.offset} 
                                        onChange={(e) => updateOffset(o.id, e.target.value)} 
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="map-container">
                        <svg viewBox="-10 -10 20 20" className="opening-svg">
                            {/* Room Polyline */}
                            <polygon 
                                points={points.map(p => `${p.x},${p.y}`).join(' ')} 
                                fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.1" 
                            />
                            
                            {points.map((p, i) => {
                                const nextP = points[(i + 1) % points.length];
                                return (
                                    <g key={i} className="wall-segment" onClick={() => handleWallClick(i)}>
                                        <line x1={p.x} y1={p.y} x2={nextP.x} y2={nextP.y} stroke="#334155" strokeWidth="0.4" />
                                        <line x1={p.x} y1={p.y} x2={nextP.x} y2={nextP.y} stroke="transparent" strokeWidth="1.2" className="hit-area" />

                                        {openings.filter(o => o.wallIndex === i).map(o => {
                                            // Calculate position based on USER SLIDER (offset)
                                            const x = p.x + (nextP.x - p.x) * o.offset;
                                            const y = p.y + (nextP.y - p.y) * o.offset;
                                            return (
                                                <circle key={o.id} cx={x} cy={y} r="0.5" fill={o.type === 'DOOR' ? '#10b981' : '#3b82f6'} stroke="white" strokeWidth="0.1" />
                                            );
                                        })}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </div>

                <div className="setup-footer">
                    <button className="btn-secondary" onClick={onBack}>Back</button>
                    <button className="btn-primary" onClick={onNext}>Finalize Design</button>
                </div>
            </div>
        </div>
    );
}