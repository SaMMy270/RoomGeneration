import React, { useState } from 'react';

import Room from './Room'; // Import our 3D component

export default function OpeningsSetup({ data, onUpdate, onNext, onBack }) {
    const { openings = [] } = data;
    const [selectedType, setSelectedType] = useState('DOOR');

    // Handle clicks coming from the 3D Room walls
    const handleWallClick = (index) => {
        if (selectedType === 'DOOR' && openings.some(o => o.type === 'DOOR')) {
            alert("Only one door is allowed per room.");
            return;
        }

        // Remove existing opening on this wall if user clicks it again with a different tool
        const remainingOpenings = openings.filter(o => o.wallIndex !== index);

        const newOpening = {
            id: Date.now(),
            type: selectedType,
            wallIndex: index,
            offset: 0.5 // Default to center
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
                    <p>Click a wall in the 3D view to place an opening. Use sliders to adjust position.</p>
                </div>

                <div className="openings-interface">
                    <div className="opening-tools">
                        <div className="tool-selector">
                            <button
                                className={`tool-btn ${selectedType === 'DOOR' ? 'active-door' : ''}`}
                                onClick={() => setSelectedType('DOOR')}
                            >
                                🚪 Add Door
                            </button>
                            <button
                                className={`tool-btn ${selectedType === 'WINDOW' ? 'active-win' : ''}`}
                                onClick={() => setSelectedType('WINDOW')}
                            >
                                🪟 Add Window
                            </button>
                        </div>

                        <div className="placed-list">
                            <h3>Adjust Positions</h3>
                            {openings.length === 0 && <p className="hint-text">No openings placed yet.</p>}
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

                    {/* 3D VIEW REPLACES THE SVG */}
                    <div className="map-container" style={{ background: '#111', 
                    borderRadius: '8px', 
                    overflow: 'hidden' ,
                    height:'200px',
                    width:'500px'

                    }}>
                        <Room
                            roomData={data}
                            isPlacementMode={true}
                            onWallClick={handleWallClick}
                            wallColor="#94a3b8"
                        />
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