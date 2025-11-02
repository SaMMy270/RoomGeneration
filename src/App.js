// App.js
import React, { useState, useRef } from "react";
import RoomCanvas from "./RoomCanvas";
import { saveRoomToFirestore, loadRoomFromFirestore } from "./firebase";
import { exportSceneToGLB } from "./exporter";
import "./style.css";

const catalog = [
  { name: "Chair", model: "/models/gaming_chair.glb" },
  { name: "Table", model: "/models/table.glb" },
  { name: "Sofa", model: "/models/sofa.glb" },
];

export default function App() {
  const [length, setLength] = useState(4);
  const [width, setWidth] = useState(3);
  const [height, setHeight] = useState(2.6);
  const [name, setName] = useState("my-room");

  // which model in catalog is chosen to place (string: model path)
  const [selectedCatalogModel, setSelectedCatalogModel] = useState(null);

  // furniture list stored as objects: { id, model, position }
  const [furnitureList, setFurnitureList] = useState([]);
  const sceneRef = useRef(null);

  // Add furniture at given position. Only works if a catalog item is selected.
  const handleAddFurniture = (position) => {
    if (!selectedCatalogModel) return alert("Select a furniture item from the catalog first.");
    const id = Date.now().toString();
    setFurnitureList((prev) => [...prev, { id, model: selectedCatalogModel, position }]);
  };

  // Update furniture position (called from RoomCanvas while dragging)
  const handleUpdateFurniture = (index, newPos) => {
    setFurnitureList((prev) => prev.map((it, i) => (i === index ? { ...it, position: newPos } : it)));
  };

  // Save/load/export are unchanged
  const handleSave = async () => {
    const payload = {
      name: name || `room-${Date.now()}`,
      length,
      width,
      height,
      furnitureList,
      createdAt: Date.now(),
    };
    try {
      await saveRoomToFirestore(payload);
      alert("Saved to Firebase!");
    } catch (e) {
      console.error(e);
      alert("Save failed.");
    }
  };

  const handleLoad = async () => {
    try {
      const doc = await loadRoomFromFirestore();
      if (!doc) return alert("No rooms found.");
      setLength(doc.length);
      setWidth(doc.width);
      setHeight(doc.height);
      setName(doc.name || "loaded-room");
      setFurnitureList(doc.furnitureList || []);
      alert("Loaded latest room.");
    } catch (e) {
      console.error(e);
      alert("Load failed.");
    }
  };

  const handleExport = async () => {
    if (!sceneRef.current) return alert("Scene not ready.");
    try {
      await exportSceneToGLB(sceneRef.current, `${name || "room"}.glb`);
    } catch (e) {
      console.error(e);
      alert("Export failed: " + e.message);
    }
  };

  // Delete last selected or by index: for now provide a simple delete-last button or you can extend selection deletion later
  const handleDeleteLast = () => setFurnitureList((prev) => prev.slice(0, -1));

  return (
    <div className="app">
      <div className="sidebar">
        <h3>Room Generator</h3>
        <label>
          Project name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <label>
          Length (m)
          <input type="number" step="0.1" value={length} onChange={(e) => setLength(parseFloat(e.target.value) || 0)} />
        </label>

        <label>
          Width (m)
          <input type="number" step="0.1" value={width} onChange={(e) => setWidth(parseFloat(e.target.value) || 0)} />
        </label>

        <label>
          Height (m)
          <input type="number" step="0.05" value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 0)} />
        </label>

        <div className="controls">
          <button onClick={handleSave}>Save</button>
          <button onClick={handleLoad}>Load</button>
          <button onClick={handleExport}>Export</button>
        </div>

        <hr />

        <h4>Furniture Catalog</h4>
        <div className="catalog">
          {catalog.map((item) => (
            <button
              key={item.name}
              className={selectedCatalogModel === item.model ? "selected" : ""}
              onClick={() => setSelectedCatalogModel(item.model)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, marginTop: 10 }}>
          Select an item in the catalog, then click the floor to place it. <br />
          Click a furniture item to select and drag it to move (camera will be disabled during drag).
        </p>

        <button style={{ marginTop: 8 }} onClick={handleDeleteLast}>
          Delete Last Furniture
        </button>
      </div>

      <div className="canvas-wrap">
        <RoomCanvas
          ref={sceneRef}
          length={length}
          width={width}
          height={height}
          furnitureList={furnitureList}
          onAddFurniture={handleAddFurniture}
          onUpdateFurniture={handleUpdateFurniture}
        />
      </div>
    </div>
  );
}
