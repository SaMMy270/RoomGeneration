// src/App.js
import React, { useState, useRef } from "react";
import Room from "./components/Room";
import { exportSceneToGLB } from "./utils/exporter";
import './style.css';
import chair1 from './products/models/gaming_chair.glb';
import sofa1 from './products/models/sofa.glb';
import bed1 from "./products/models/single_bed.glb";
import table1 from "./products/models/study_table.glb"
import cimg from "./products/assets/gamingchair.webp"
import simg from "./products/assets/sofa.jpg"
import bimg from "./products/assets/bed1.jpg"
import timg from "./products/assets/table1.webp"
// Catalog products
const PRODUCTS = [
  { id: "chair1", name: "Gaming Chair", category: "Chair", model: chair1, thumbnail: cimg, price: 15000 },
  { id: "sofa1", name: "Sofa", category: "Sofa", model: sofa1, thumbnail: simg, price: 30000 },
  { id: "bed1", name: "Single Bed", category: "Bed", model: bed1, thumbnail: bimg, price: 10000 },
  { id: "table1", name: "Study Table", category: "Table", model: table1, thumbnail: timg, price: 3000 }
];

function BillModal({ total, onClose, onAddToCart }) {
  return (
    <div className="bill-overlay">
      <div className="bill-box">
        <h2>Bill Summary</h2>
        <p>Total furniture cost: ₹{total.toLocaleString()}</p>
        <div className="bill-actions">
          <button onClick={onClose} className="btn btn-muted">Close</button>
          <button onClick={onAddToCart} className="btn btn-primary">Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [length, setLength] = useState(4);
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2.6);
  const [wallColor, setWallColor] = useState("#f8fafc");

  const [catalogSelection, setCatalogSelection] = useState(null);
  const [furnitureList, setFurnitureList] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isBillOpen, setIsBillOpen] = useState(false);
  const [category, setCategory] = useState("All");

  const sceneRef = useRef(null);
  const totalCost = furnitureList.reduce((s, f) => s + (f.price || 0), 0);

  const handleExport = () => {
    if (!sceneRef.current) return alert("Scene not ready yet.");
    exportSceneToGLB(sceneRef.current, `room_${Date.now()}.glb`);
  };

  const handleAddToCart = () => {
    setIsBillOpen(false);
    alert("✅ Added to cart.");
  };

  // When furniture is placed in Room, clear the selected model
  const handlePlaced = () => setCatalogSelection(null);

  // Filter products by category
  const filteredProducts = category === "All"
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === category);
  // global hook to detect placement and deselect model
  window.onModelPlaced = () => {
    setCatalogSelection(null);
  };

  return (
    <div className="app-root">
      <header className="topbar">
        <h1>PlanPro — Room Designer</h1>
        <button onClick={handleExport} className="btn btn-primary">Export .glb</button>
      </header>

      <div className="main">
        {/* Left sidebar — room controls */}
        <aside className="sidebar">
          <div className="panel">
            <h3>Room Dimensions</h3>
            <label>Length (m)</label>
            <input type="number" value={length} step="0.1" onChange={(e) => setLength(parseFloat(e.target.value) || "-")} /><br></br>
            <label>Width (m)</label>
            <input type="number" value={width} step="0.1" onChange={(e) => setWidth(parseFloat(e.target.value) || "-")} /><br></br>
            <label>Height (m)</label>
            <input type="number" value={height} step="0.05" onChange={(e) => setHeight(parseFloat(e.target.value) || "-")} />
          </div>

          <div className="panel">
            <h3>Wall Color</h3>
            <input type="color" value={wallColor} onChange={(e) => setWallColor(e.target.value)} />
          </div>

          <div className="panel">
            <button className="btn btn-primary" onClick={() => setIsBillOpen(true)}>Show Total Cost</button>
            <div style={{ marginTop: 8, color: "#444" }}>Current total: ₹{totalCost.toLocaleString()}</div>
          </div>
        </aside>

        {/* Center: 3D Room */}
        <section className="canvas-area">
          <Room
            length={length}
            width={width}
            height={height}
            wallColor={wallColor}
            selectedModel={catalogSelection}
            furnitureList={furnitureList}
            setFurnitureList={setFurnitureList}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            sceneRefRef={sceneRef}

          />
        </section>
        {selectedIndex !== null && (
          <div className="floating-toolbar">
            <button
              className="btn btn-danger"
              onClick={() => {
                setFurnitureList(furnitureList.filter((_, i) => i !== selectedIndex));
                setSelectedIndex(null);
              }}
            >
              🗑 Delete Selected
            </button>
          </div>
        )}

        {/* Right side: Catalog */}
        <aside className="catalog-side">
          <div className="panel">
            <h3>Catalog</h3>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option>All</option>
              <option>Chair</option>
              <option>Sofa</option>
              <option>Table</option>
              <option>Bed</option>
            </select>

            <div className="catalog-grid">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className={`catalog-card ${catalogSelection?.id === p.id ? "selected" : ""}`}
                  onClick={() => setCatalogSelection(p)}
                >
                  <img src={p.thumbnail} alt={p.name} />
                  <div className="catalog-info">
                    <div className="catalog-name">{p.name}</div>
                    <div className="catalog-price">₹{p.price.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {isBillOpen && (
        <BillModal total={totalCost} onClose={() => setIsBillOpen(false)} onAddToCart={handleAddToCart} />
      )}
    </div>


  );
}
