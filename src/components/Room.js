import React, { useMemo, useRef, Suspense, useState, useEffect } from "react";
import { Canvas, useLoader, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import * as THREE from "three";
import FurniturePrimitive from "./FurniturePrimitive";

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

function SceneContent({
    roomData,
    wallColor,
    floorTexture,
    furnitureList = [],
    setFurnitureList,
    selectedModel,
    setSelectedModel,
    selectedIndex,
    setSelectedIndex,
    highlightedWallType,
    isPlacementMode,
    onWallClick,
    viewMode = '3D',
    isPreviewActive = false
}) {
    const { camera } = useThree();
    const controlsRef = useRef();
    const [hoveredWall, setHoveredWall] = useState(null);

    // NEW: Manual override flag to allow free camera movement
    const [hasInteracted, setHasInteracted] = useState(false);

    // Camera Animation State
    const [viewTarget, setViewTarget] = useState({
        pos: new THREE.Vector3(8, 8, 8),
        look: new THREE.Vector3(0, 0, 0)
    });

    const { shape, dimensions, openings = [] } = roomData || {};
    const { length: L = 6, width: W = 6, notchL = 2, notchW = 2 } = dimensions || {};

    // --- 1. Geometry Logic (Points for T-Shape, L-Shape, etc.) ---
    const pointsData = useMemo(() => {
        const hL = L / 2;
        const hW = W / 2;
        const sW = notchW / 2;
        const headY = hW - notchL;

        switch (shape) {
            case 'L_SHAPE':
                return [
                    { pos: new THREE.Vector2(-hL, -hW), id: 'length' },
                    { pos: new THREE.Vector2(hL, -hW), id: 'width' },
                    { pos: new THREE.Vector2(hL, hW - notchW), id: 'notchW' },
                    { pos: new THREE.Vector2(hL - notchL, hW - notchW), id: 'notchL' },
                    { pos: new THREE.Vector2(hL - notchL, hW), id: 'width' },
                    { pos: new THREE.Vector2(-hL, hW), id: 'length' },
                ];
            case 'T_SHAPE':
                return [
                    { pos: new THREE.Vector2(-sW, -hW), id: 'notchW' },
                    { pos: new THREE.Vector2(sW, -hW), id: 'notchW' },
                    { pos: new THREE.Vector2(sW, headY), id: 'notchL' },
                    { pos: new THREE.Vector2(hL, headY), id: 'length' },
                    { pos: new THREE.Vector2(hL, hW), id: 'width' },
                    { pos: new THREE.Vector2(-hL, hW), id: 'width' },
                    { pos: new THREE.Vector2(-hL, headY), id: 'length' },
                    { pos: new THREE.Vector2(-sW, headY), id: 'notchL' },
                ];
            case 'HEXAGON':
                const hexPts = [];
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
                    hexPts.push({ pos: new THREE.Vector2(Math.cos(angle) * hL, Math.sin(angle) * hL), id: 'length' });
                }
                return hexPts;
            default: // SQUARE
                return [
                    { pos: new THREE.Vector2(-hL, -hW), id: 'length' },
                    { pos: new THREE.Vector2(hL, -hW), id: 'width' },
                    { pos: new THREE.Vector2(hL, hW), id: 'length' },
                    { pos: new THREE.Vector2(-hL, hW), id: 'width' }
                ];
        }
    }, [shape, L, W, notchL, notchW]);

    const wallData = useMemo(() => {
        return pointsData.map((p1Obj, i) => {
            const p1 = p1Obj.pos;
            const p2 = pointsData[(i + 1) % pointsData.length].pos;
            const dist = p1.distanceTo(p2);
            const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
            const opening = (openings || []).find(o => o.wallIndex === i);
            const staticCenter = new THREE.Vector2().lerpVectors(p1, p2, 0.5);
            return { staticCenter, dist, angle, opening, type: p1Obj.id };
        });
    }, [pointsData, openings]);

    // --- 2. Camera View Mode Logic ---
    useEffect(() => {
        if (isPlacementMode) return;

        // Reset interaction flag whenever viewMode changes so camera can auto-move again
        setHasInteracted(false);

        const offsetDist = 10;

        if (viewMode === 'TOP') {
            setViewTarget({
                pos: new THREE.Vector3(0, 15, 0),
                look: new THREE.Vector3(0, 0, 0)
            });
            if (controlsRef.current) controlsRef.current.enableRotate = false;
        } else if (viewMode.startsWith('WALL_')) {
            const wallIdx = parseInt(viewMode.split('_')[1]);
            const wall = wallData[wallIdx];
            if (wall) {
                const angle = -wall.angle + Math.PI / 2;
                setViewTarget({
                    pos: new THREE.Vector3(
                        wall.staticCenter.x + Math.cos(angle) * offsetDist,
                        1.25,
                        wall.staticCenter.y + Math.sin(angle) * offsetDist
                    ),
                    look: new THREE.Vector3(wall.staticCenter.x, 1.25, wall.staticCenter.y)
                });
            }
            if (controlsRef.current) controlsRef.current.enableRotate = true;
        } else {
            setViewTarget({ pos: new THREE.Vector3(8, 8, 8), look: new THREE.Vector3(0, 0, 0) });
            if (controlsRef.current) controlsRef.current.enableRotate = true;
        }
    }, [viewMode, wallData, isPlacementMode]);

    useFrame(() => {
        // ONLY lerp to target if user hasn't manually taken control
        if (!hasInteracted) {
            camera.position.lerp(viewTarget.pos, 0.1);
            if (controlsRef.current) {
                controlsRef.current.target.lerp(viewTarget.look, 0.1);
                controlsRef.current.update();
            }
        }
    });

    // --- 3. Floor & Walls Logic ---
    const textureUrls = {
        wood: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg",
        tiles: "https://threejs.org/examples/textures/grid.png"
    };
    const loadedTexture = useLoader(THREE.TextureLoader, floorTexture === 'wood' ? textureUrls.wood : textureUrls.tiles);
    if (loadedTexture) {
        loadedTexture.wrapS = loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(L / 2, W / 2);
    }

    const floorShape = useMemo(() => {
        const pts = pointsData.map(p => p.pos);
        if (!pts.length) return null;
        const shapeObj = new THREE.Shape();
        shapeObj.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) shapeObj.lineTo(pts[i].x, pts[i].y);
        shapeObj.closePath();
        return shapeObj;
    }, [pointsData]);

    const handleFloorClick = (e) => {
        e.stopPropagation();
        if (isPlacementMode) return;
        if (!selectedModel) { setSelectedIndex?.(null); return; }
        const newPos = [e.point.x, 0, e.point.z];
        if (checkCollision(newPos, selectedModel.dimensions || { width: 1, depth: 1 }, furnitureList)) return;
        setFurnitureList([...furnitureList, { id: Date.now(), ...selectedModel, position: newPos, rotation: 0 }]);
        setSelectedModel(null);
    };

    return (
        <>
            <OrbitControls
                ref={controlsRef}
                makeDefault
                onStart={() => setHasInteracted(true)} // Disable auto-snap when user moves camera
            />
            <ambientLight intensity={0.7} />
            <pointLight position={[10, 10, 10]} intensity={1.5} />
            <Grid infiniteGrid cellSize={0.5} sectionSize={1} fadeDistance={30} />

            {floorShape && (
                <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.001, 0]} onPointerDown={handleFloorClick}>
                    <shapeGeometry args={[floorShape]} />
                    <meshStandardMaterial
                        color={floorTexture === 'plain' ? '#e2e8f0' : '#ffffff'}
                        map={floorTexture !== 'plain' ? loadedTexture : null}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            )}

            {wallData.map((wall, i) => {
                const isHighlitByParent = highlightedWallType === wall.type;
                const isHoveredLocal = hoveredWall === i;

                let isHidden = false;
                if (isPreviewActive && viewMode.startsWith('WALL_')) {
                    const viewDir = new THREE.Vector3().subVectors(viewTarget.look, viewTarget.pos).normalize();
                    const wallPos = new THREE.Vector3(wall.staticCenter.x, 1.25, wall.staticCenter.y);
                    const dirToWall = new THREE.Vector3().subVectors(wallPos, camera.position).normalize();
                    if (viewDir.dot(dirToWall) < 0.1) isHidden = true;
                }

                const finalColor = (isHighlitByParent || (isPlacementMode && isHoveredLocal)) ? "#3b82f6" : wallColor;

                return (
                    <group
                        key={i}
                        position={[wall.staticCenter.x, 0, wall.staticCenter.y]}
                        rotation={[0, -wall.angle, 0]}
                        visible={!isHidden}
                    >
                        <mesh
                            visible={false}
                            onClick={(e) => { e.stopPropagation(); if (isPlacementMode) onWallClick(i); }}
                            onPointerOver={() => isPlacementMode && setHoveredWall(i)}
                            onPointerOut={() => setHoveredWall(null)}
                        >
                            <planeGeometry args={[wall.dist, 2.5]} />
                        </mesh>

                        {!wall.opening ? (
                            <mesh position={[0, 1.25, 0]}>
                                <planeGeometry args={[wall.dist, 2.5]} />
                                <meshStandardMaterial color={finalColor} side={THREE.DoubleSide} />
                            </mesh>
                        ) : (
                            <WallAperture wall={wall} color={finalColor} />
                        )}
                    </group>
                );
            })}

            {furnitureList.map((it, idx) => (
                <FurniturePrimitive
                    key={it.id}
                    item={it}
                    index={idx}
                    isSelected={selectedIndex === idx}
                    furnitureList={furnitureList}
                    setFurnitureList={setFurnitureList}
                    setSelectedIndex={setSelectedIndex}
                    points={pointsData.map(p => p.pos)}
                    controlsRef={controlsRef}
                />
            ))}
        </>
    );
}

export default function Room(props) {
    return (
        <Canvas camera={{ position: [8, 8, 8], fov: 45 }} shadows>
            <Suspense fallback={null}>
                <SceneContent {...props} />
            </Suspense>
        </Canvas>
    );
}

function WallAperture({ wall, color }) {
    const { opening, dist } = wall;
    const isDoor = opening.type === 'DOOR';
    const holeW = isDoor ? 1.0 : 1.4;
    const holeH = isDoor ? 2.1 : 1.2;
    const sillH = isDoor ? 0.0 : 0.9;

    const holeCenterOnWall = (opening.offset * dist) - (dist / 2);
    const leftSectionWidth = (opening.offset * dist) - (holeW / 2);
    const rightSectionWidth = (dist - (opening.offset * dist)) - (holeW / 2);

    return (
        <group>
            {leftSectionWidth > 0 && (
                <mesh position={[(-dist / 2) + (leftSectionWidth / 2), 1.25, 0]}>
                    <planeGeometry args={[leftSectionWidth, 2.5]} />
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                </mesh>
            )}
            {rightSectionWidth > 0 && (
                <mesh position={[(dist / 2) - (rightSectionWidth / 2), 1.25, 0]}>
                    <planeGeometry args={[rightSectionWidth, 2.5]} />
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                </mesh>
            )}
            <mesh position={[holeCenterOnWall, (2.5 + (sillH + holeH)) / 2, 0]}>
                <planeGeometry args={[holeW, 2.5 - (sillH + holeH)]} />
                <meshStandardMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
            {!isDoor && (
                <mesh position={[holeCenterOnWall, sillH / 2, 0]}>
                    <planeGeometry args={[holeW, sillH]} />
                    <meshStandardMaterial color={color} side={THREE.DoubleSide} />
                </mesh>
            )}
            <mesh position={[holeCenterOnWall, sillH + holeH / 2, 0.01]}>
                <planeGeometry args={[holeW, holeH]} />
                <meshStandardMaterial color={isDoor ? "#1a1a1a" : "#87ceeb"} transparent opacity={0.6} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}