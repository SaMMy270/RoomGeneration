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

    const wallColor = roomData.wallColor || "#ffffff";
    const floorTexture = roomData.floorTexture || "plain";
    const totalCost = furnitureList.reduce((sum, item) => sum + (item.price || 0), 0);

    const rotateSelected = (deg) => {
        if (selectedIndex === null) return;
        const newList = [...furnitureList];
        const currentRot = newList[selectedIndex].rotation || 0;
        newList[selectedIndex].rotation = currentRot + (deg * Math.PI / 180);
        setFurnitureList(newList);
    };

    return (
        <div className="designer-root">
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
                    <span className="shape-badge">{roomData.shape.replace('_', ' ')}</span>
                </div>

                <button className="btn-bill" onClick={() => setIsBillOpen(true)}>
                    🛒 ₹{totalCost.toLocaleString()}
                </button>
            </header>

            <div className="main-content">
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
                    />

                    {selectedIndex !== null && (
                        <button className="btn-delete-floating" onClick={() => {
                            setFurnitureList(furnitureList.filter((_, i) => i !== selectedIndex));
                            setSelectedIndex(null);
                        }}>
                            🗑️ Delete Item
                        </button>
                    )}
                </section>

                <aside className="sidebar-right">
                    <Catalog onSelect={setSelectedCatalogItem} selected={selectedCatalogItem} />
                </aside>
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