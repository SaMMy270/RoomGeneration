import React, { useState, useMemo } from 'react';
import { toFeetInches, toMeters } from '../utils/UnitUtils';

export default function DimensionSetup({ data, onUpdate, onNext, onBack }) {
    const [activeWall, setActiveWall] = useState(null);
    const [useMetric, setUseMetric] = useState(data.units === 'METERS');

    const handleUpdate = (key, value) => {
        onUpdate({ dimensions: { ...data.dimensions, [key]: parseFloat(value) || 0 } });
    };

    const labels = useMemo(() => {
        if (data.shape === 'L_SHAPE') return { nL: "Recess Length", nW: "Recess Width" };
        if (data.shape === 'T_SHAPE') return { nL: "Top Bar Height", nW: "Stem Width" };
        return { nL: "Notch L", nW: "Notch W" };
    }, [data.shape]);

    // Helper to determine if we show notch inputs
    const showNotches = data.shape === 'L_SHAPE' || data.shape === 'T_SHAPE';

    return (
        <div className="setup-container">
            <div className="setup-card">
                <h2>Step 2: Define Dimensions</h2>

                <div className="setup-layout">
                    <div className="inputs-section">
                        <div className="unit-toggle">
                            <button className={useMetric ? 'active' : ''} onClick={() => setUseMetric(true)}>Metric (m)</button>
                            <button className={!useMetric ? 'active' : ''} onClick={() => setUseMetric(false)}>Imperial (ft/in)</button>
                        </div>

                        <DimensionInput
                            label="Total Length"
                            val={data.dimensions.length}
                            isMetric={useMetric}
                            onUpdate={(v) => handleUpdate('length', v)}
                            onHover={() => setActiveWall('length')}
                        />

                        {/* Only show Total Width if it's NOT a regular Hexagon */}
                        {data.shape !== 'HEXAGON' && (
                            <DimensionInput
                                label="Total Width"
                                val={data.dimensions.width}
                                isMetric={useMetric}
                                onUpdate={(v) => handleUpdate('width', v)}
                                onHover={() => setActiveWall('width')}
                            />
                        )}

                        {/* Show Notches ONLY for L and T shapes */}
                        {showNotches && (
                            <>
                                <DimensionInput
                                    label={labels.nL}
                                    val={data.dimensions.notchL}
                                    isMetric={useMetric}
                                    onUpdate={(v) => handleUpdate('notchL', v)}
                                    onHover={() => setActiveWall('notchL')}
                                />
                                <DimensionInput
                                    label={labels.nW}
                                    val={data.dimensions.notchW}
                                    isMetric={useMetric}
                                    onUpdate={(v) => handleUpdate('notchW', v)}
                                    onHover={() => setActiveWall('notchW')}
                                />
                            </>
                        )}

                        <div className="setup-actions">
                            <button onClick={onBack}>Back</button>
                            <button className="btn-primary" onClick={onNext}>Next: Place Openings</button>
                        </div>
                    </div>

                    <div className="preview-section">
                        <ShapePreview
                            shape={data.shape}
                            dims={data.dimensions}
                            activeWall={activeWall}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-component for individual Inputs
// Sub-component for individual Inputs
function DimensionInput({ label, val, isMetric, onUpdate, onHover }) {
    const { feet, inches } = toFeetInches(val || 0);

    const handleMetricChange = (e) => {
        let value = parseFloat(e.target.value);
        // Limit meters to 7
        if (value > 7) value = 7;
        onUpdate(value || 0);
    };

    const handleImperialChange = (f, i) => {
        let fVal = parseFloat(f) || 0;
        let iVal = parseFloat(i) || 0;

        // Limit inches to 11 (standard imperial rollover)
        // If you want a hard limit of 7 inches specifically:
        if (iVal > 7) iVal = 7;

        onUpdate(toMeters(fVal, iVal));
    };

    return (
        <div className="input-group" onMouseEnter={onHover} onMouseLeave={() => onHover(null)}>
            <label>{label}</label>
            <div className="input-with-unit">
                {isMetric ? (
                    <div className="unit-wrapper">
                        <input
                            type="number"
                            step="0.1"
                            max="7"
                            value={val}
                            onChange={handleMetricChange}
                        />
                        <span className="unit-label">m</span>
                    </div>
                ) : (
                    <div className="imperial-inputs">
                        <div className="unit-wrapper">
                            <input
                                type="number"
                                placeholder="ft"
                                value={feet}
                                onChange={(e) => handleImperialChange(e.target.value, inches)}
                            />
                            <span className="unit-label">ft</span>
                        </div>
                        <div className="unit-wrapper">
                            <input
                                type="number"
                                placeholder="in"
                                max="7"
                                value={inches}
                                onChange={(e) => handleImperialChange(feet, e.target.value)}
                            />
                            <span className="unit-label">in</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component for SVG Preview
function ShapePreview({ shape, dims, activeWall }) {
    const { length: L, width: W, notchL, notchW } = dims;
    const centerX = 50;
    const centerY = 50;
    const size = 35; // Base visual size

    const getPoints = () => {
        // size = 35; centerX = 50; centerY = 50;
        if (shape === 'SQUARE') {
            return [
                { x: centerX - size, y: centerY - size, id: 'length' },
                { x: centerX + size, y: centerY - size, id: 'width' },
                { x: centerX + size, y: centerY + size, id: 'length' },
                { x: centerX - size, y: centerY + size, id: 'width' }
            ];
        }
        if (shape === 'L_SHAPE') {
            const nL = (notchL / L) * (size * 2);
            const nW = (notchW / W) * (size * 2);
            return [
                { x: centerX - size, y: centerY - size, id: 'length' },
                { x: centerX + size, y: centerY - size, id: 'width' },
                { x: centerX + size, y: centerY + size - nW, id: 'notchW' },
                { x: centerX + size - nL, y: centerY + size - nW, id: 'notchL' },
                { x: centerX + size - nL, y: centerY + size, id: 'width' },
                { x: centerX - size, y: centerY + size, id: 'length' }
            ];
        }
        if (shape === 'T_SHAPE') {
            // Calculations to keep the "T" centered and scaled
            const headH = (notchW / W) * (size * 2); // Height of the horizontal bar
            const stemW = (notchL / L) * (size * 2); // Width of the vertical bar
            const halfStem = stemW / 2;

            return [
                { x: centerX - halfStem, y: centerY + size, id: 'notchW' }, // Bottom Left of stem
                { x: centerX + halfStem, y: centerY + size, id: 'notchW' }, // Bottom Right of stem
                { x: centerX + halfStem, y: centerY - size + headH, id: 'notchL' }, // Right neck
                { x: centerX + size, y: centerY - size + headH, id: 'length' },     // Right arm bottom
                { x: centerX + size, y: centerY - size, id: 'width' },             // Right arm top
                { x: centerX - size, y: centerY - size, id: 'width' },             // Left arm top
                { x: centerX - size, y: centerY - size + headH, id: 'length' },    // Left arm bottom
                { x: centerX - halfStem, y: centerY - size + headH, id: 'notchL' } // Left neck
            ];
        }
        if (shape === 'HEXAGON') {
            const pts = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
                pts.push({
                    x: centerX + Math.cos(angle) * size,
                    y: centerY + Math.sin(angle) * size,
                    id: 'length'
                });
            }
            return pts;
        }
        return [];
    };


const pts = getPoints();

return (
    <svg viewBox="0 0 100 100" className="shape-svg">
        <polygon
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1"
        />
        {pts.map((p, i) => {
            const nextP = pts[(i + 1) % pts.length];
            const isHighlit = activeWall === p.id;
            return (
                <line
                    key={i}
                    x1={p.x} y1={p.y} x2={nextP.x} y2={nextP.y}
                    stroke={isHighlit ? "#3b82f6" : "#475569"}
                    strokeWidth={isHighlit ? "3" : "1.5"}
                />
            );
        })}
    </svg>
);
}