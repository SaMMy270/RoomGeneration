import React from "react";

const products = [
    { name: "Gaming Chair", price: 8000, path: "/products/models/gaming_chair.glb", img: "/products/assets/gamingchair.webp" },
    { name: "Sofa", price: 12000, path: "/products/models/sofa.glb", img: "./products/assets/sofa.jpg" },
    { name: "Bed", price: 15000, path: "/products/models/single_bed.glb", img: "./products/assets/bed1.jpg" },
    { name: "Table", price: 5000, path: "/products/models/study_table.glb", img: "./products/assets/table1.webp"}
];

export default function Catalog({ onSelect, selected }) {
    return (
        <div className="catalog-wrapper">
            <h3>🛋️ Catalog</h3>
            <div className="catalog-grid">
                {products.map((p) => (
                    <div
                        key={p.name}
                        className={`catalog-item ${selected?.name === p.name ? "selected" : ""}`}
                        onClick={() => onSelect(p)}
                    >
                        <img src={p.img} alt={p.name} className="catalog-img" />
                        <div className="catalog-info">
                            <div className="catalog-name">{p.name}</div>
                            <div className="catalog-price">₹{p.price.toLocaleString()}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}