import React, { useMemo, useRef, Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import FurniturePrimitive from "./FurniturePrimitive";

// --- Helper: AABB Collision Check (UNCHANGED) ---
const checkCollision = (pos, size, existingItems) => {
    const margin = 0.1;
    const w1 = size.width || 1;
    const d1 = size.depth || 1;
    return existingItems.some(item => {
        const w2 = item.dimensions?.width || 1;
        const d2 = item.dimensions?.depth || 1;
        const dx = Math.abs(pos[0] - item.position[0]);
        const dz = Math.abs(pos[2] - item.position[2]);
        return dx < (w1 + w2) / 2 - margin && dz < (d1 + d2) / 2 - margin;
    });
};

function SceneContent({ roomData, wallColor, floorTexture, furnitureList, setFurnitureList, selectedModel, setSelectedModel, selectedIndex, setSelectedIndex }) {
    const controlsRef = useRef();

    const { shape, dimensions, openings = [] } = roomData || {};
    const { length: L = 6, width: W = 6, notchL = 2, notchW = 2 } = dimensions || {};

    // Load Texture logic remains the same...
    const textureUrls = {
        wood: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg",
        tiles: "https://threejs.org/examples/textures/grid.png"
    };
    const loadedTexture = useLoader(THREE.TextureLoader, floorTexture === 'wood' ? textureUrls.wood : textureUrls.tiles);
    if (loadedTexture) {
        loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(L / 2, W / 2);
    }

    // 1. UPDATED: Points Logic (Hexagon oriented flat-side down, ignores width/notches)
    const points = useMemo(() => {
        const hL = L / 2;
        const hW = W / 2;

        switch (shape) {
            case 'L_SHAPE':
                return [
                    new THREE.Vector2(-hL, -hW), new THREE.Vector2(hL, -hW),
                    new THREE.Vector2(hL, hW - notchW), new THREE.Vector2(hL - notchL, hW - notchW),
                    new THREE.Vector2(hL - notchL, hW), new THREE.Vector2(-hL, hW),
                ];
            case 'T_SHAPE':
                const sW = notchW / 2; const headY = hW - notchL;
                return [
                    new THREE.Vector2(-sW, -hW), new THREE.Vector2(sW, -hW),
                    new THREE.Vector2(sW, headY), new THREE.Vector2(hL, headY),
                    new THREE.Vector2(hL, hW), new THREE.Vector2(-hL, hW),
                    new THREE.Vector2(-hL, headY), new THREE.Vector2(-sW, headY),
                ];
            case 'HEXAGON':
                const hexPts = [];
                for (let i = 0; i < 6; i++) {
                    // Adding Math.PI / 6 rotates it to have a flat bottom edge
                    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
                    hexPts.push(new THREE.Vector2(Math.cos(angle) * hL, Math.sin(angle) * hL));
                }
                return hexPts;
            default: // SQUARE
                return [
                    new THREE.Vector2(-hL, -hW), new THREE.Vector2(hL, -hW),
                    new THREE.Vector2(hL, hW), new THREE.Vector2(-hL, hW)
                ];
        }
    }, [shape, L, W, notchL, notchW]);

    const wallData = useMemo(() => {
        return points.map((p1, i) => {
            const p2 = points[(i + 1) % points.length];
            const dist = p1.distanceTo(p2);
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const opening = openings.find(o => o.wallIndex === i);

            // If no opening, center is the midpoint. 
            // If opening exists, lerp between p1 and p2 using the offset.
            const t = opening ? (opening.offset ?? 0.5) : 0.5;
            const center = new THREE.Vector2().lerpVectors(p1, p2, t);

            return { center, dist, angle, opening };
        });
    }, [points, openings]);

    const floorShape = useMemo(() => {
        if (!points || points.length === 0) return null;
        const shapeObj = new THREE.Shape();
        shapeObj.moveTo(points[0].x, points[0].y);
        points.forEach((p, i) => { if (i !== 0) shapeObj.lineTo(p.x, p.y); });
        shapeObj.closePath();
        return shapeObj;
    }, [points]);

    const handleFloorClick = (e) => {
        e.stopPropagation();
        if (!selectedModel) { setSelectedIndex(null); return; }
        const newPos = [e.point.x, 0, e.point.z];
        if (checkCollision(newPos, selectedModel.dimensions || { width: 1, depth: 1 }, furnitureList)) {
            alert("⚠️ Collision detected!"); return;
        }
        setFurnitureList([...furnitureList, { id: Date.now(), ...selectedModel, position: newPos, rotation: 0 }]);
        setSelectedModel(null);
    };

    return (
        <>
            <OrbitControls ref={controlsRef} makeDefault />
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <Grid infiniteGrid cellSize={0.5} sectionSize={1} fadeDistance={30} />

            {/* VISUAL FLOOR (Now serves as the click target) */}
            {floorShape && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onPointerDown={handleFloorClick}>
                    <shapeGeometry args={[floorShape]} />
                    <meshStandardMaterial
                        color={floorTexture === 'plain' ? '#e2e8f0' : '#ffffff'}
                        map={floorTexture !== 'plain' ? loadedTexture : null}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {wallData.map((wall, i) => (
                <group key={i} position={[wall.center.x, 0, wall.center.y]} rotation={[0, -wall.angle, 0]}>
                    {!wall.opening ? (
                        <mesh position={[0, 1.25, 0]}>
                            <planeGeometry args={[wall.dist, 2.5]} />
                            <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
                        </mesh>
                    ) : (
                        <WallAperture wall={wall} color={wallColor} />
                    )}
                </group>
            ))}

            {furnitureList.map((it, idx) => (
                <FurniturePrimitive key={it.id} item={it} index={idx} isSelected={selectedIndex === idx} furnitureList={furnitureList} setFurnitureList={setFurnitureList} setSelectedIndex={setSelectedIndex} points={points} controlsRef={controlsRef} />
            ))}
        </>
    );
}

// Room Export (UNCHANGED)
export default function Room(props) {
    return (
        <Canvas camera={{ position: [10, 10, 10], fov: 45 }}>
            <Suspense fallback={null}>
                <SceneContent {...props} />
            </Suspense>
        </Canvas>
    );
}

// WallAperture (UNCHANGED)
function WallAperture({ wall, color }) {
    const { opening, dist } = wall;
    const isDoor = opening.type === 'DOOR';

    // Standard dimensions
    const holeW = isDoor ? 1.0 : 1.4;
    const holeH = isDoor ? 2.1 : 1.2;
    const sillH = isDoor ? 0.0 : 0.9;

    // Calculate how far from the start of the wall the opening center is
    const centerPos = opening.offset * dist;

    // Calculate widths of the solid wall parts
    const leftWidth = centerPos - (holeW / 2);
    const rightWidth = (dist - centerPos) - (holeW / 2);

    return (
        <group>
            {/* Left Wall Segment */}
            {leftWidth > 0 && (
                <mesh position={[-dist / 2 + leftWidth / 2, 1.25, 0]}>
                    <planeGeometry args={[leftWidth, 2.5]} />
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                </mesh>
            )}

            {/* Right Wall Segment */}
            {rightWidth > 0 && (
                <mesh position={[dist / 2 - rightWidth / 2, 1.25, 0]}>
                    <planeGeometry args={[rightWidth, 2.5]} />
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                </mesh>
            )}

            {/* Top Header (Above the door/window) */}
            <mesh position={[centerPos - dist / 2, (2.5 + (sillH + holeH)) / 2, 0]}>
                <planeGeometry args={[holeW, 2.5 - (sillH + holeH)]} />
                <meshStandardMaterial color={color} side={THREE.DoubleSide} />
            </mesh>

            {/* Bottom Sill (Windows only) */}
            {!isDoor && (
                <mesh position={[centerPos - dist / 2, sillH / 2, 0]}>
                    <planeGeometry args={[holeW, sillH]} />
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                </mesh>
            )}

            {/* Glass / Door Surface */}
            <mesh position={[centerPos - dist / 2, sillH + holeH / 2, 0]}>
                <planeGeometry args={[holeW, holeH]} />
                <meshStandardMaterial
                    color={isDoor ? "#1a1a1a" : "#87ceeb"}
                    transparent
                    opacity={0.4}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );
}