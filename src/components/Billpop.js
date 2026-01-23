// src/components/Billpop.js
import React from "react";

export default function Billpop({ totalCost, onClose, items }) {
    return (
        <div style={{
            position: "fixed", // Fixed ensures it covers the whole screen
            top: 0, left: 0,
            width: "100vw", height: "100vh",
            background: "rgba(0,0,0,0.6)",
            display: "flex", justifyContent: "center", alignItems: "center",
            zIndex: 1000,
        }}>
            <div style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "12px",
                width: "350px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
            }}>
                <h3 style={{ marginTop: 0 }}>Order Summary</h3>
                <hr />
                <div style={{ maxHeight: "200px", overflowY: "auto", margin: "15px 0" }}>
                    {items.map((item, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                            <span>{item.name}</span>
                            <span>₹{item.price.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", borderTop: "1px solid #eee", paddingTop: "10px" }}>
                    Total: ₹{totalCost.toLocaleString()}
                </div>
                <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                    <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "5px", border: "1px solid #ccc", cursor: "pointer" }}>
                        Back to Design
                    </button>
                    <button style={{ flex: 1, background: "#007bff", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}