export default function Sidebar({ wallColor, setWallColor, floorTexture, setFloorTexture, addEssential }) {
    const wallPalette = ["#f8fafc", "#e2e8f0", "#94a3b8", "#ffedd5", "#dbeafe"];

    return (
        <div className="sidebar">
            {/* NEW: ESSENTIALS SECTION */}
            <h3>Room Essentials</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => addEssential('door')} style={{ padding: '8px', cursor: 'pointer' }}>+ Add Door</button>
                <button onClick={() => addEssential('window')} style={{ padding: '8px', cursor: 'pointer' }}>+ Add Window</button>
            </div>

            <h3>Wall Finishes</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                {wallPalette.map(color => (
                    <div
                        key={color}
                        onClick={() => setWallColor(color)}
                        style={{
                            width: '30px', height: '30px', borderRadius: '50%',
                            backgroundColor: color,
                            border: wallColor === color ? '2px solid #3b82f6' : '1px solid #ddd',
                            cursor: 'pointer'
                        }}
                    />
                ))}
            </div>

            <h3>Floor Textures</h3>
            <div className="texture-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => setFloorTexture('wood')}>Oak Wood</button>
                <button onClick={() => setFloorTexture('tiles')}>Tiles</button>
                <button onClick={() => setFloorTexture('plain')}>Default</button>
            </div>
        </div>
    );
}