import React, { useRef, useState, useMemo } from "react";
import { useGLTF, Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

function isPointInPoly(pt, poly) {
    let x = pt.x, z = pt.z, inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        let xi = poly[i].x, zi = poly[i].y;
        let xj = poly[j].x, zj = poly[j].y;
        if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) inside = !inside;
    }
    return inside;
}

export default function FurniturePrimitive({ item, index, isSelected, furnitureList, setFurnitureList, setSelectedIndex, points, controlsRef }) {
    const { scene } = useGLTF(item.path);
    const { camera, gl } = useThree();
    const model = useMemo(() => scene.clone(), [scene]);
    const groupRef = useRef();

    const [showCollisionModal, setShowCollisionModal] = useState(false);
    const draggingRef = useRef({ active: false, offset: new THREE.Vector3() });

    // --- CAMERA LOCK LOGIC ---
    const setCameraLocked = (locked) => {
        if (controlsRef.current) {
            controlsRef.current.enabled = !locked;
        }
    };

    const stopDraggingListeners = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        draggingRef.current.active = false;
    };

    const onMove = (ev) => {
        if (!draggingRef.current.active) return;

        const rect = gl.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((ev.clientX - rect.left) / rect.width) * 2 - 1,
            -((ev.clientY - rect.top) / rect.height) * 2 + 1
        );

        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);
        const intersect = new THREE.Vector3();

        if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), intersect)) {
            const target = intersect.add(draggingRef.current.offset);

            const isInside = isPointInPoly(target, points);
            const myW = item.dimensions?.width || 1.2;
            const myD = item.dimensions?.depth || 1.2;

            const isHittingOther = furnitureList.some((other, i) => {
                if (i === index) return false;
                const otherW = other.dimensions?.width || 1.2;
                const otherD = other.dimensions?.depth || 1.2;
                const dx = Math.abs(target.x - other.position[0]);
                const dz = Math.abs(target.z - other.position[2]);
                return dx < (myW + otherW) / 2 - 0.1 && dz < (myD + otherD) / 2 - 0.1;
            });

            // --- INTERRUPT TRIGGER ---
            if (!isInside || isHittingOther) {
                stopDraggingListeners();
                // We DON'T unlock camera here because the modal is about to show
                setShowCollisionModal(true);
                return;
            }

            if (groupRef.current) groupRef.current.position.set(target.x, 0, target.z);
        }
    };

    const onUp = () => {
        stopDraggingListeners();
        setCameraLocked(false); // Unlock camera on successful drop
        const p = groupRef.current.position;
        setFurnitureList(prev => prev.map((f, i) => i === index ? { ...f, position: [p.x, 0, p.z] } : f));
    };

    const handleConfirmDeletion = () => {
        setFurnitureList(prev => prev.filter((_, i) => i !== index));
        setSelectedIndex(null);
        setShowCollisionModal(false);
        setCameraLocked(false); // Unlock camera ONLY after they click OK
    };

    return (
        <group ref={groupRef} position={item.position}>
            <primitive
                object={model}
                rotation={[0, item.rotation || 0, 0]}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(index);
                    setCameraLocked(true); // Lock camera immediately on grab
                    draggingRef.current.active = true;
                    draggingRef.current.offset.copy(groupRef.current.position).sub(e.point);
                    window.addEventListener("pointermove", onMove);
                    window.addEventListener("pointerup", onUp);
                }}
            />

            {showCollisionModal && (
                <Html center>
                    <div style={{
                        background: 'white', padding: '20px', borderRadius: '12px',
                        width: '220px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        border: '2px solid #ff4d4d', textAlign: 'center',
                        fontFamily: 'sans-serif', pointerEvents: 'auto'
                    }}>
                        <div style={{ fontSize: '30px', marginBottom: '10px' }}>⚠️</div>
                        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Collision!</h4>
                        <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
                            Invalid placement detected.
                        </p>
                        <button
                            onClick={handleConfirmDeletion}
                            style={{
                                width: '100%', padding: '10px', background: '#ff4d4d',
                                color: 'white', border: 'none', borderRadius: '6px',
                                fontWeight: 'bold', cursor: 'pointer'
                            }}
                        >
                            OK
                        </button>
                    </div>
                </Html>
            )}

            {isSelected && !showCollisionModal && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <ringGeometry args={[0.7, 0.8, 32]} />
                    <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
                </mesh>
            )}
        </group>
    );
}