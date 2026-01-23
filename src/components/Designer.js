import React, { useState } from "react";
import Room from "./Room";
import Catalog from "./Catalog";
import Billpop from "./Billpop";
import Sidebar from "./SIdebar";

export default function Designer({ roomData, onUpdate, onBack }) {
    const [furnitureList, setFurnitureList] = useState([]);
    const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(null);
    const [isBillOpen, setIsBillOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    
    // NEW: View and Full Preview States
    const [viewMode, setViewMode] = useState('3D'); 
    const [isPreviewActive, setIsPreviewActive] = useState(false);

    const wallColor = roomData.wallColor || "#ffffff";
    const floorTexture = roomData.floorTexture || "plain";
    const totalCost = furnitureList.reduce((sum, item) => sum + (item.price || 0), 0);
    const wallCount = roomData.shape === 'SQUARE' ? 4 : (roomData.shape === 'HEXAGON' ? 6 : 8);

    const rotateSelected = (deg) => {
        if (selectedIndex === null) return;
        const newList = [...furnitureList];
        const currentRot = newList[selectedIndex].rotation || 0;
        newList[selectedIndex].rotation = currentRot + (deg * Math.PI / 180);
        setFurnitureList(newList);
    };

    // Toggle logic: If exiting preview, force back to 3D view
    const togglePreview = () => {
        if (isPreviewActive) {
            setViewMode('3D');
            setIsPreviewActive(false);
        } else {
            setIsPreviewActive(true);
        }
    };

    return (
        <div className={`designer-root ${isPreviewActive ? 'preview-mode-active' : ''}`}>
            <header className="topbar">
                <button onClick={onBack} className="btn-back">← Back</button>

                <div className="project-title-area">
                    {isEditingTitle ? (
                        <input
                            autoFocus
                            className="title-edit-input"
                            value={roomData.projectTitle || "Untitled Project"}
                            onBlur={() => setIsEditingTitle(false)}
                            onChange={(e) => onUpdate({ projectTitle: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                        />
                    ) : (
                        <h2 onClick={() => setIsEditingTitle(true)}>
                            {roomData.projectTitle || "Untitled Project"} <span className="edit-pencil">✏️</span>
                        </h2>
                    )}
                </div>

                <div className="view-controls-top">
                    {/* MAIN PREVIEW TOGGLE */}
                    <button 
                        className={`preview-toggle-btn ${isPreviewActive ? 'active' : ''}`}
                        onClick={togglePreview}
                    >
                        {isPreviewActive ? "🛠️ Exit Preview" : "👁️ Full Preview"}
                    </button>

                    {/* ONLY SHOW THESE WHEN PREVIEW IS ON */}
                    {isPreviewActive && (
                        <div className="preview-options fade-in">
                            <button className={viewMode === 'TOP' ? 'active' : ''} onClick={() => setViewMode('TOP')}>📐 Top</button>
                            <select value={viewMode.startsWith('WALL_') ? viewMode : ""} onChange={(e) => setViewMode(e.target.value)}>
                                <option value="" disabled>Select Wall...</option>
                                {[...Array(wallCount)].map((_, i) => (
                                    <option key={i} value={`WALL_${i}`}>Wall {i + 1} View</option>
                                ))}
                            </select>
                            <button className={viewMode === '3D' ? 'active' : ''} onClick={() => setViewMode('3D')}>🏠 Reset 3D</button>
                        </div>
                    )}
                </div>

                <button className="btn-bill" onClick={() => setIsBillOpen(true)}>
                    🛒 ₹{totalCost.toLocaleString()}
                </button>
            </header>

            <div className="main-content">
                {/* HIDE SIDEBARS IF PREVIEW ACTIVE */}
                {!isPreviewActive && (
                    <aside className="sidebar-left">
                        <Sidebar
                            wallColor={wallColor}
                            setWallColor={(col) => onUpdate({ wallColor: col })}
                            floorTexture={floorTexture}
                            setFloorTexture={(tex) => onUpdate({ floorTexture: tex })}
                            selectedIndex={selectedIndex}
                            rotateSelected={rotateSelected}
                        />
                    </aside>
                )}

                <section className="canvas-wrapper">
                    <Room
                        roomData={roomData}
                        wallColor={wallColor}
                        floorTexture={floorTexture}
                        furnitureList={furnitureList}
                        setFurnitureList={setFurnitureList}
                        selectedModel={selectedCatalogItem}
                        setSelectedModel={setSelectedCatalogItem}
                        selectedIndex={selectedIndex}
                        setSelectedIndex={setSelectedIndex}
                        viewMode={viewMode}
                        isPreviewActive={isPreviewActive} // Pass this down!
                    />
                </section>

                {!isPreviewActive && (
                    <aside className="sidebar-right">
                        <Catalog onSelect={setSelectedCatalogItem} selected={selectedCatalogItem} />
                    </aside>
                )}
            </div>

            {isBillOpen && (
                <Billpop
                    totalCost={totalCost}
                    items={furnitureList}
                    onClose={() => setIsBillOpen(false)}
                />
            )}
        </div>
    );
}