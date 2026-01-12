import React, { useRef, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Grid } from "@react-three/drei";
import * as THREE from "three";

export default function Room({ length, width, wallColor, furnitureList, setFurnitureList, selectedModel, setSelectedModel, selectedIndex, setSelectedIndex }) {
    const controlsRef = useRef();
    const draggingRef = useRef({ index: null, offset: new THREE.Vector3() });

    const L = parseFloat(length) || "";
    const W = parseFloat(width) || "";

    function SceneCanvas() {
        const { scene } = useThree();

        const onFloorDown = (e) => {
            e.stopPropagation();
            if (!selectedModel) return;
            const newItem = {
                id: Date.now(),
                ...selectedModel,
                position: [e.point.x, 0, e.point.z],
                rotation: 0
            };
            setFurnitureList([...furnitureList, newItem]);
            setSelectedModel(null);
            setSelectedIndex(furnitureList.length);
        };

        return (
            <>
                <ambientLight intensity={0.7} />
                <pointLight position={[5, 5, 5]} />
                <Grid infiniteGrid cellSize={0.5} sectionSize={1} fadeDistance={20} />

                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerDown={onFloorDown}>
                    <planeGeometry args={[L, W]} />
                    <meshStandardMaterial color="#f8fafc" />
                </mesh>

                {/* Walls */}
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
        const { scene: gltf } = useGLTF(item.model);
        const { camera, gl } = useThree();
        const groupRef = useRef();
        const [colliding, setColliding] = useState(false);
        const model = useMemo(() => gltf.clone(), [gltf]);

        const onMove = (ev) => {
            if (draggingRef.current.index !== index || !groupRef.current) return;
            const rect = gl.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(((ev.clientX - rect.left) / rect.width) * 2 - 1, -((ev.clientY - rect.top) / rect.height) * 2 + 1);
            const ray = new THREE.Raycaster();
            ray.setFromCamera(mouse, camera);
            const intersect = new THREE.Vector3();
            if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), intersect)) {
                const pos = intersect.add(draggingRef.current.offset);
                groupRef.current.position.set(pos.x, 0, pos.z);

                // Simple Collision Logic
                const hit = furnitureList.some((other, i) => i !== index && new THREE.Vector3(...other.position).distanceTo(groupRef.current.position) < 0.8);
                setColliding(hit);
            }
        };

        const onUp = () => {
            if (draggingRef.current.index === index && groupRef.current) {
                const p = groupRef.current.position;
                setFurnitureList(prev => prev.map((f, i) => i === index ? { ...f, position: [p.x, 0, p.z] } : f));
            }
            draggingRef.current.index = null;
            if (controlsRef.current) controlsRef.current.enabled = true;
            window.removeEventListener("pointermove", onMove);
            window.removeEventListener("pointerup", onUp);
        };

        return (
            <group ref={groupRef} position={item.position}>
                <primitive object={model} rotation={[0, item.rotation || 0, 0]}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        setSelectedIndex(index);
                        draggingRef.current = { index, offset: groupRef.current.position.clone().sub(e.point) };
                        if (controlsRef.current) controlsRef.current.enabled = false;
                        window.addEventListener("pointermove", onMove);
                        window.addEventListener("pointerup", onUp);
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isSelected) setFurnitureList(prev => prev.map((f, i) => i === index ? { ...f, rotation: (f.rotation || 0) + Math.PI / 4 } : f));
                    }}
                />
                {isSelected && (
                    <group position={[0, 0.02, 0]}>
                        <mesh rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[1.5, 1.5]} />
                            <meshBasicMaterial color={colliding ? "red" : "#00ff00"} transparent opacity={0.3} />
                        </mesh>
                        <gridHelper args={[1.5, 4, colliding ? "red" : "#00ff00", colliding ? "red" : "#00ff00"]} />
                    </group>
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