import React from "react";

export default function Sidebar({ wallColor, setWallColor, floorTexture, setFloorTexture, selectedIndex, rotateSelected }) {
    const wallPalette = ["#ffffff", "#f8fafc", "#e2e8f0", "#94a3b8", "#ffedd5", "#dbeafe"];

    return (
        <div className="sidebar" style={{ padding: '20px' }}>
            {/* WALL FINISHES */}
            <div className="panel" style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Wall Finishes</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
                    {wallPalette.map(color => (
                        <div
                            key={color}
                            onClick={() => setWallColor(color)}
                            style={{
                                width: '35px',
                                height: '35px',
                                borderRadius: '50%',
                                backgroundColor: color,
                                border: wallColor === color ? '3px solid #3b82f6' : '1px solid #ddd',
                                cursor: 'pointer',
                                transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1.0)'}
                        />
                    ))}
                </div>
                <input 
                    type="color" 
                    value={wallColor} 
                    onChange={(e) => setWallColor(e.target.value)} 
                    style={{ width: '100%', height: '30px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px' }} 
                />
            </div>

            {/* FLOOR TEXTURES */}
            <div className="panel" style={{ marginBottom: '30px' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '15px' }}>Floor Materials</h3>
                <div className="texture-stack" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                        className={`btn-tex ${floorTexture === 'wood' ? 'active' : ''}`} 
                        onClick={() => setFloorTexture('wood')}
                        style={textureButtonStyle(floorTexture === 'wood')}
                    >🪵 Oak Wood</button>
                    <button 
                        className={`btn-tex ${floorTexture === 'tiles' ? 'active' : ''}`} 
                        onClick={() => setFloorTexture('tiles')}
                        style={textureButtonStyle(floorTexture === 'tiles')}
                    >🏁 Ceramic Tiles</button>
                    <button 
                        className={`btn-tex ${floorTexture === 'plain' ? 'active' : ''}`} 
                        onClick={() => setFloorTexture('plain')}
                        style={textureButtonStyle(floorTexture === 'plain')}
                    >⬜ Default Grey</button>
                </div>
            </div>

            {/* OBJECT CONTROLS (Only visible when an item is clicked in 3D) */}
            {selectedIndex !== null && (
                <div className="panel" style={{ padding: '15px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                    <h3 style={{ fontSize: '0.9rem', color: '#0369a1', marginTop: 0 }}>Item Controls</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <button onClick={() => rotateSelected(-45)} style={controlButtonStyle}>↺ -45°</button>
                        <button onClick={() => rotateSelected(45)} style={controlButtonStyle}>↻ +45°</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// Inline styles for cleaner component
const textureButtonStyle = (isActive) => ({
    padding: '12px',
    textAlign: 'left',
    cursor: 'pointer',
    backgroundColor: isActive ? '#eff6ff' : 'white',
    border: isActive ? '2px solid #3b82f6' : '1px solid #e2e8f0',
    borderRadius: '8px',
    fontWeight: isActive ? 'bold' : 'normal',
    color: isActive ? '#1e40af' : '#475569'
});

const controlButtonStyle = {
    padding: '8px',
    cursor: 'pointer',
    background: 'white',
    border: '1px solid #cbd5e1',
    borderRadius: '4px',
    fontSize: '14px'
};