// src/components/Popup.js
import React from "react";

export default function Popup({ totalCost, onClose, onAddToCart }) {
    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 20,
            }}
        >
            <div
                style={{
                    background: "#fff",
                    padding: "25px",
                    borderRadius: "12px",
                    textAlign: "center",
                    width: "300px",
                }}
            >
                <h3>Total Bill</h3>
                <p>₹{totalCost}</p>
                <div style={{ display: "flex", justifyContent: "space-around" }}>
                    <button onClick={onClose}>Close</button>
                    <button onClick={onAddToCart} style={{ background: "#007bff", color: "#fff" }}>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
}
