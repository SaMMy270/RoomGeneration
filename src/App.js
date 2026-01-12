import React, { useState } from "react";
import Room from "./components/Room";
import Sidebar from "./components/SIdebar"; // Import your component
import './style.css';

// Import assets
import sofa1 from "./products/assets/sofa.jpg";
import sofa2 from "./products/models/sofa.glb";
import chair1 from "./products/assets/gamingchair.webp";
import chair2 from "./products/models/gaming_chair.glb";
import bed1 from "./products/assets/bed1.jpg";
import bed2 from "./products/models/single_bed.glb";
import table1 from "./products/assets/table1.webp";
import table2 from "./products/models/study_table.glb";
import door from "./products/models/door.glb";
import window from "./products/models/window.glb";

// IMPORTANT: Standardized to use "path" to match Room.js logic
const PRODUCTS = [
  { id: "sofa1", name: "Modern Sofa", price: 30000, path: sofa2, img: sofa1, category: 'furniture' },
  { id: "chair1", name: "Gaming Chair", price: 15000, path: chair2, img: chair1, category: 'furniture' },
  { id: "bed1", name: "Single Bed", price: 3000, path: bed2, img: bed1, category: 'furniture' },
  { id: "table1", name: "Dining Table", price: 2000, path: table2, img: table1, category: 'furniture' },
];

export default function App() {
  const [length, setLength] = useState(4);
  const [width, setWidth] = useState(3);
  const [wallColor, setWallColor] = useState("#ffffff");
  const [floorTexture, setFloorTexture] = useState("plain");
  const [furnitureList, setFurnitureList] = useState([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isBillOpen, setIsBillOpen] = useState(false);

  const totalCost = furnitureList.reduce((sum, item) => sum + item.price, 0);

  // Function to handle Doors and Windows (The "Essentials")
  const addEssential = (type) => {
    const essentials = {
      door: {
        id: 'door',
        name: "Main Door",
        price: 5000,
        path: door,
        category: 'wall-item'
      },
      window: {
        id: 'window',
        name: "Window",
        price: 3000,
        path: window,
        category: 'wall-item'
      }
    };

    // This sets the "active" item to be placed when the user clicks the floor
    setSelectedCatalogItem(essentials[type]);
  };

  return (
    <div className="app-root">
      <header className="topbar">
        <div className="logo">PlanPro — Room Designer</div>
        <button className="btn-primary">Export .glb</button>
      </header>

      <div className="main">
        <aside className="sidebar-container">
          <div className="panel dimensions-panel">
            <h3>Dimensions (meters)</h3>
            <div className="input-group">
              <label>L: </label>
              <input type="number" value={length} min={1} max={8} onChange={(e) => setLength(e.target.value)} />
              <label>W: </label>
              <input type="number" value={width} min={1} max={8} onChange={(e) => setWidth(e.target.value)} />
            </div>
          </div>
          <Sidebar
            wallColor={wallColor}
            setWallColor={setWallColor}
            floorTexture={floorTexture}
            setFloorTexture={setFloorTexture}
            addEssential={addEssential}
          />

          {/* Move dimensions here so they stay in the left panel */}

        </aside>

        <section className="canvas-area">


          <Room

            length={length}
            width={width}
            wallColor={wallColor}
            floorTexture={floorTexture}
            furnitureList={furnitureList}
            setFurnitureList={setFurnitureList}
            selectedModel={selectedCatalogItem} // HANDSHAKE: App state -> Room prop
            setSelectedModel={setSelectedCatalogItem} // To clear it after placement
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}

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
              <div
                key={p.id}
                className={`cat-card ${selectedCatalogItem?.id === p.id ? 'active' : ''}`}
                onClick={() => setSelectedCatalogItem(p)}
              >
                <img src={p.img} alt={p.name} />
                <div className="cat-info">
                  <p>{p.name}</p>
                  <span>₹{p.price}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bill-preview">
            <button className="btn-bill" onClick={() => setIsBillOpen(true)}>Check Bill</button>
            <p>Total: ₹{totalCost.toLocaleString()}</p>
          </div>
        </aside>
      </div>

      {isBillOpen && (
        <div className="modal-overlay" onClick={() => setIsBillOpen(false)}>
          <div className="bill-box" onClick={e => e.stopPropagation()}>
            <h2>Order Summary</h2>
            <div className="bill-scroll">
              {furnitureList.map((item, i) => (
                <div key={i} className="bill-row"><span>{item.name}</span><span>₹{item.price}</span></div>
              ))}
            </div>
            <div className="bill-total">Total: ₹{totalCost.toLocaleString()}</div>
            <button className="btn-close-modal" onClick={() => setIsBillOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}