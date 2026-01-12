import React, { useState } from "react";
import Room from "./components/Room";
import './style.css';

import sofa1 from "./products/assets/sofa.jpg";
import sofa2 from "./products/models/sofa.glb";
import chair1 from "./products/assets/gamingchair.webp";
import chair2 from "./products/models/gaming_chair.glb";
import bed1 from "./products/assets/bed1.jpg";
import bed2 from "./products/models/single_bed.glb";
import table1 from "./products/assets/table1.webp";
import table2 from "./products/models/study_table.glb";


const PRODUCTS = [
  { id: "sofa1", name: "Modern Sofa", price: 30000, model: sofa2, thumbnail: sofa1 },
  { id: "chair1", name: "Gaming Chair", price: 15000, model: chair2, thumbnail: chair1 },
  {id:"bed1", name:"Single Bed", price:3000, model:bed2 , thumbnail:bed1},
  {id: "table1", name:"Dining Table", price: 2000, model:table2,thumbnail:table1},
];

export default function App() {
  const [length, setLength] = useState(4);
  const [width, setWidth] = useState(3);
  const [wallColor, setWallColor] = useState("#ffffff");
  const [recentColors, setRecentColors] = useState(["#ffffff", "#27272a"]);
  const [furnitureList, setFurnitureList] = useState([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isBillOpen, setIsBillOpen] = useState(false);

  const totalCost = furnitureList.reduce((sum, item) => sum + item.price, 0);

  const updateWallColor = (color) => {
    setWallColor(color);
    if (!recentColors.includes(color)) {
      setRecentColors([color, ...recentColors].slice(0, 5));
    }
  };

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="logo">PlanPro — Room Designer</div>
        <button className="btn-primary">Export .glb</button>
      </header>

      <div className="main">
        <aside className="sidebar">
          <div className="panel">
            <h3>Dimensions (meters)</h3>
            <div className="input-group">
              <label>L:</label>
              <input type="number" value={length} onChange={(e) => setLength(e.target.value)} />
              <label>W:</label>
              <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} />
            </div>
          </div>

          <div className="panel">
            <h3>Wall Color</h3>
            <div className="swatch-grid">
              {["#ffffff", "#f1f5f9", "#cbd5e1", "#ffedd5", "#fee2e2"].map(c => (
                <div key={c} className="swatch" style={{ background: c }} onClick={() => updateWallColor(c)} />
              ))}
            </div>
            <p className="sub-label">Recent Colors</p>
            <div className="swatch-grid">
              {recentColors.map((c, i) => (
                <div key={i} className="swatch mini" style={{ background: c }} onClick={() => setWallColor(c)} />
              ))}
            </div>
          </div>

          <div className="panel">
            <button className="btn-bill" onClick={() => setIsBillOpen(true)}>Check Bill</button>
            <p className="total-text">Total: ₹{totalCost.toLocaleString()}</p>
          </div>
        </aside>

        <section className="canvas-area">
          <Room
            length={length} width={width}
            wallColor={wallColor}
            furnitureList={furnitureList} setFurnitureList={setFurnitureList}
            selectedModel={selectedCatalogItem} setSelectedModel={setSelectedCatalogItem}
            selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex}
          />
          {selectedIndex !== null && (
            <button className="btn-delete" onClick={() => {
              setFurnitureList(furnitureList.filter((_, i) => i !== selectedIndex));
              setSelectedIndex(null);
            }}>Delete Selected Item</button>
          )}
        </section>

        <aside className="catalog-side">
          <h3>Catalog</h3>
          <div className="catalog-grid">
            {PRODUCTS.map(p => (
              <div key={p.id} className={`cat-card ${selectedCatalogItem?.id === p.id ? 'active' : ''}`} onClick={() => setSelectedCatalogItem(p)}>
                <img src={p.thumbnail} alt={p.name} />
                <div className="cat-info">
                  <p>{p.name}</p>
                  <span>₹{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {isBillOpen && (
        <div className="modal-overlay" onClick={() => setIsBillOpen(false)}>
          <div className="bill-box" onClick={e => e.stopPropagation()}>
            <h2>Order Summary</h2>
            {furnitureList.map((item, i) => (
              <div key={i} className="bill-row"><span>{item.name}</span><span>₹{item.price}</span></div>
            ))}
            <div className="bill-total">Total: ₹{totalCost.toLocaleString()}</div>
            <button onClick={() => setIsBillOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}