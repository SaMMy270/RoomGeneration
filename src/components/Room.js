import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Grid, useTexture } from "@react-three/drei";
import * as THREE from "three";

// 1. Texture Definitions
const TEXTURES = {
    wood: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg",
    tiles: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/checker.png",
    carpet: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/terrain/grasslight-big.jpg"
};

// 2. Floor Sub-Component
function Floor({ length, width, textureType, onPlacement }) {
    const isPlain = textureType === 'plain' || !TEXTURES[textureType];
    // Always call the hook, but handle the map carefully
    const texture = useTexture(isPlain ? TEXTURES.wood : TEXTURES[textureType]);

    useEffect(() => {
        if (texture && !isPlain) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(length / 2, width / 2);
            texture.needsUpdate = true;
        }
    }, [texture, length, width, isPlain]);

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.01, 0]} // Keep slightly below 0 to avoid flickering
            onPointerDown={onPlacement}
        >
            <planeGeometry args={[length, width]} />
            <meshStandardMaterial
                map={isPlain ? null : texture}
                color={isPlain ? "#e2e8f0" : "#ffffff"}
            />
        </mesh>
    );
}

// 3. Main Room Component
export default function Room({ length, width, wallColor, floorTexture, furnitureList, setFurnitureList, selectedModel, setSelectedModel, selectedIndex, setSelectedIndex, setWarning }) {
    const controlsRef = useRef();
    const draggingRef = useRef({ index: null, offset: new THREE.Vector3(), lastValid: new THREE.Vector3() });

    const L = parseFloat(length) || 4;
    const W = parseFloat(width) || 3;

    function SceneCanvas() {
        const onFloorDown = (e) => {
            e.stopPropagation();
            if (!selectedModel) return;

            // Check if distance to any existing item is less than 1 meter
            const isTooClose = furnitureList.some(item =>
                new THREE.Vector3(...item.position).distanceTo(e.point) < 1.0
            );

            if (isTooClose) {
                setWarning({ show: true, message: "You can't place 2 objects on top of each other!" });
                return;
            }

            const newItem = {
                id: Date.now(),
                ...selectedModel,
                position: [e.point.x, 0, e.point.z],
                rotation: 0
            };
            setFurnitureList([...furnitureList, newItem]);
            setSelectedModel(null);
        };

        return (
            <>
                <ambientLight intensity={0.8} />
                <pointLight position={[10, 10, 10]} intensity={1.5} />
                <Grid infiniteGrid cellSize={0.5} sectionSize={1} fadeDistance={30} />

                <Floor
                    length={L}
                    width={W}
                    textureType={floorTexture}
                    onPlacement={onFloorDown}
                />

                {/* --- WALLS --- */}
                <mesh position={[0, 1.25, -W / 2]}><planeGeometry args={[L, 2.5]} /><meshStandardMaterial color={wallColor} side={THREE.DoubleSide} /></mesh>
                <mesh position={[0, 1.25, W / 2]} rotation={[0, Math.PI, 0]}><planeGeometry args={[L, 2.5]} /><meshStandardMaterial color={wallColor} side={THREE.DoubleSide} /></mesh>
                <mesh position={[-L / 2, 1.25, 0]} rotation={[0, Math.PI / 2, 0]}><planeGeometry args={[W, 2.5]} /><meshStandardMaterial color={wallColor} side={THREE.DoubleSide} /></mesh>
                <mesh position={[L / 2, 1.25, 0]} rotation={[0, -Math.PI / 2, 0]}><planeGeometry args={[W, 2.5]} /><meshStandardMaterial color={wallColor} side={THREE.DoubleSide} /></mesh>

                {furnitureList.map((it, idx) => (
                    <FurniturePrimitive key={it.id} item={it} index={idx} isSelected={selectedIndex === idx} />
                ))}
            </>
        );
    }

    function FurniturePrimitive({ item, index, isSelected }) {
        const { scene: gltf } = useGLTF(item.path);
        const { camera, gl } = useThree();
        const groupRef = useRef();
        const [colliding, setColliding] = useState(false);
        const model = useMemo(() => gltf.clone(), [gltf]);
        const clickStartTime = useRef(0);

        // We use a ref for colliding so the event listeners always have the "real-time" value
        const collidingRef = useRef(false);
        useEffect(() => {
            collidingRef.current = colliding;
        }, [colliding]);

        const onMove = (ev) => {
            if (draggingRef.current.index !== index || !groupRef.current) return;

            const rect = gl.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((ev.clientX - rect.left) / rect.width) * 2 - 1,
                -((ev.clientY - rect.top) / rect.height) * 2 + 1
            );

            const ray = new THREE.Raycaster();
            ray.setFromCamera(mouse, camera);
            const intersect = new THREE.Vector3();

            if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), intersect)) {
                let pos = intersect.add(draggingRef.current.offset);

                const clampedX = Math.max(-L / 2, Math.min(L / 2, pos.x));
                const clampedZ = Math.max(-W / 2, Math.min(W / 2, pos.z));

                groupRef.current.position.set(clampedX, 0, clampedZ);

                const hit = furnitureList.some((other, i) => {
                    if (i === index) return false;
                    const distance = new THREE.Vector3(...other.position).distanceTo(groupRef.current.position);
                    return distance < 1.2; // Slightly increased for better detection
                });

                setColliding(hit);
                if (!hit) draggingRef.current.lastValid.copy(groupRef.current.position);
            }
        };

        const onUp = () => {
            const clickDuration = Date.now() - clickStartTime.current;

            // SAFETY CHECK: If the ref is null, stop immediately
            if (!groupRef.current) {
                cleanupListeners();
                return;
            }

            if (clickDuration < 200 && draggingRef.current.index === index) {
                // Rotation logic
                const newRotation = (item.rotation || 0) + Math.PI / 2;
                setFurnitureList(prev => prev.map((f, i) =>
                    i === index ? { ...f, rotation: newRotation } : f
                ));
            } else if (draggingRef.current.index === index) {
                if (collidingRef.current) {
                    setWarning({ show: true, message: "Collision detected! The object has been removed." });
                    setFurnitureList(prev => prev.filter((_, i) => i !== index));
                    setSelectedIndex(null);
                    // We return here so we don't try to read position below
                    cleanupListeners();
                    return;
                } else {
                    // Check again before reading position
                    if (groupRef.current) {
                        const p = groupRef.current.position;
                        setFurnitureList(prev => prev.map((f, i) =>
                            i === index ? { ...f, position: [p.x, 0, p.z] } : f
                        ));
                    }
                }
            }

            cleanupListeners();
        };

        // Helper to keep code clean
        const cleanupListeners = () => {
            draggingRef.current.index = null;
            if (controlsRef.current) controlsRef.current.enabled = true;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };

        return (
            <group ref={groupRef} position={item.position}>
                <primitive
                    object={model}
                    rotation={[0, item.rotation || 0, 0]}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(index);
                        clickStartTime.current = Date.now();
                        draggingRef.current = {
                            index,
                            offset: groupRef.current.position.clone().sub(e.point),
                            lastValid: groupRef.current.position.clone()
                        };
                        if (controlsRef.current) controlsRef.current.enabled = false;
                        window.addEventListener("pointermove", onMove);
                        window.addEventListener("pointerup", onUp);
                    }}
                />
                {isSelected && (
                    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                        <planeGeometry args={[1.5, 1.5]} />
                        <meshBasicMaterial color={colliding ? "red" : "lime"} transparent opacity={0.3} />
                    </mesh>
                )}
            </group>
        );
    }

    return (
        <Canvas camera={{ position: [5, 5, 5], fov: 45 }}>
            <OrbitControls ref={controlsRef} makeDefault />
            <SceneCanvas />
        </Canvas>
    );
}