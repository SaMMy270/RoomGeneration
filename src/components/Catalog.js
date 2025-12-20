// src/components/Catalog.js
import React from "react";

const products = [
    { name: "Gaming Chair", price: 8000, path: "/products/models/gaming_chair.glb", img: "/products/assets/gamingchair.webp" },
    { name: "Sofa", price: 12000, path: "/products/models/sofa.glb", img: "/products/assets/sofa.jpg" },
];

export default function Catalog({ onSelect, selected }) {
    return (
        <div
            style={{
                width: "320px",
                background: "#f3f4f6",
                padding: "50px",
                overflowY: "auto",
                borderRight: "1px solid #ddd",
            }}
        >
            <h3 style={{ marginBottom: "10px" }}>🛋️ Catalog</h3>
            {products.map((p) => (
                <div
                    key={p.name}
                    style={{
                        border:
                            selected?.path === p.path ? "2px solid #007bff" : "1px solid #ccc",
                        borderRadius: "8px",
                        marginBottom: "30px",
                        cursor: "pointer",
                        padding: "20px",
                        background: "#fff",
                        textAlign: "center",
                    }}
                    onClick={() => onSelect(p)}
                >
                    <img
                        src={p.img}
                        alt={p.name}
                        style={{
                            width: "100%",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "4px",
                        }}
                    />
                    <div style={{ fontWeight: "bold", marginTop: "5px" }}>{p.name}</div>
                    <div>₹{p.price}</div>
                </div>
            ))}
        </div>
    );
}
