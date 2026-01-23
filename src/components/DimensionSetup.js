import React, { useState, useMemo } from 'react';
import { toFeetInches, toMeters } from '../utils/UnitUtils';

export default function DimensionSetup({ data, onUpdate, onNext, onBack }) {
    const [activeWall, setActiveWall] = useState(null); // Tracks which input is focused/hovered
    const [useMetric, setUseMetric] = useState(data.units === 'METERS');

    const handleUpdate = (key, value) => {
        onUpdate({ dimensions: { ...data.dimensions, [key]: parseFloat(value) || 0 } });
    };

    // Calculate dynamic labels based on shape
    const labels = useMemo(() => {
        if (data.shape === 'L_SHAPE') return { nL: "Recess Length", nW: "Recess Width" };
        if (data.shape === 'T_SHAPE') return { nL: "Top Bar Height", nW: "Stem Width" };
        return { nL: "Notch L", nW: "Notch W" };
    }, [data.shape]);

    return (
        <div className="setup-container">
            <div className="setup-card">
                <h2>Step 2: Define Dimensions</h2>

                <div className="setup-layout">
                    {/* LEFT: INPUTS */}
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
                        <DimensionInput
                            label="Total Width"
                            val={data.dimensions.width}
                            isMetric={useMetric}
                            onUpdate={(v) => handleUpdate('width', v)}
                            onHover={() => setActiveWall('width')}
                        />

                        {data.shape !== 'SQUARE' && (
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

                    {/* RIGHT: VISUAL PREVIEW */}
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
function DimensionInput({ label, val, isMetric, onUpdate, onHover }) {
    const { feet, inches } = toFeetInches(val);

    return (
        <div className="input-group" onMouseEnter={onHover} onMouseLeave={() => onHover(null)}>
            <label>{label}</label>
            {isMetric ? (
                <input type="number" value={val} onChange={(e) => onUpdate(e.target.value)} />
            ) : (
                <div className="imperial-inputs">
                    <input type="number" placeholder="ft" value={feet}
                        onChange={(e) => onUpdate(toMeters(e.target.value, inches))} />
                    <input type="number" placeholder="in" value={inches}
                        onChange={(e) => onUpdate(toMeters(feet, e.target.value))} />
                </div>
            )}
        </div>
    );
}

// Sub-component for SVG Highlighting
function ShapePreview({ shape, dims, activeWall }) {
    const { length: L, width: W, notchL, notchW } = dims;
    const hL = 40; // Scaled for SVG viewbox
    const hW = 40;
    const centerX = 50;
    const centerY = 50;

    const getPoints = () => {
        if (shape === 'SQUARE') {
            return [
                { x: centerX - hL, y: centerY - hW, id: 'length' },
                { x: centerX + hL, y: centerY - hW, id: 'width' },
                { x: centerX + hL, y: centerY + hW, id: 'length' },
                { x: centerX - hL, y: centerY + hW, id: 'width' }
            ];
        }
        if (shape === 'L_SHAPE') {
            const nL = (notchL / L) * (hL * 2);
            const nW = (notchW / W) * (hW * 2);
            return [
                { x: centerX - hL, y: centerY - hW, id: 'length' },
                { x: centerX + hL, y: centerY - hW, id: 'width' },
                { x: centerX + hL, y: centerY + hW - nW, id: 'notchW' },
                { x: centerX + hL - nL, y: centerY + hW - nW, id: 'notchL' },
                { x: centerX + hL - nL, y: centerY + hW, id: 'width' },
                { x: centerX - hL, y: centerY + hW, id: 'length' }
            ];
        }
        if (shape === 'T_SHAPE') {
            const nL = (notchL / L) * (hL * 2);
            const nW = (notchW / W) * (hW * 2);
            return [
                { x: centerX - hL, y: centerY + hW, id: 'length' },
                { x: centerX + hL, y: centerY + hW, id: 'length' },
                { x: centerX + hL, y: centerY + hW - nL, id: 'notchL' },
                { x: centerX + (nW / 2), y: centerY + hW - nL, id: 'notchW' },
                { x: centerX + (nW / 2), y: centerY - hW, id: 'width' },
                { x: centerX - (nW / 2), y: centerY - hW, id: 'width' },
                { x: centerX - (nW / 2), y: centerY + hW - nL, id: 'notchW' },
                { x: centerX - hL, y: centerY + hW - nL, id: 'notchL' }
            ];
        }
        if (shape === 'HEXAGON') {
            const pts = [];
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                pts.push({
                    x: centerX + Math.cos(angle) * hL,
                    y: centerY + Math.sin(angle) * hW,
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
                        style={{ transition: 'all 0.2s' }}
                    />
                );
            })}
        </svg>
    );
}