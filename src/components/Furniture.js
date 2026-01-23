import React, { useRef, useMemo, useState, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

export default function Furniture({ 
    item, 
    index, 
    furnitureList, 
    setFurnitureList, 
    setSelectedIndex, 
    controlsRef, 
    L, 
    W, 
    isSelected, 
    setWarning 
}) {
    const { scene: gltf } = useGLTF(item.path);
    const { camera, gl } = useThree();
    const groupRef = useRef();
    const [colliding, setColliding] = useState(false);
    const model = useMemo(() => gltf.clone(), [gltf]);
    const clickStartTime = useRef(0);
    
    // We store the drag offset and last valid position in a ref to avoid re-renders
    const draggingRef = useRef({ 
        offset: new THREE.Vector3(), 
        lastValid: new THREE.Vector3() 
    });

    // Helper ref to keep track of collision state inside event listeners
    const collidingRef = useRef(false);
    useEffect(() => {
        collidingRef.current = colliding;
    }, [colliding]);

    const onMove = (ev) => {
        if (!groupRef.current) return;

        // 1. Convert mouse position to 3D space
        const rect = gl.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2(
            ((ev.clientX - rect.left) / rect.width) * 2 - 1,
            -((ev.clientY - rect.top) / rect.height) * 2 + 1
        );

        const ray = new THREE.Raycaster();
        ray.setFromCamera(mouse, camera);
        const intersect = new THREE.Vector3();

        // 2. Find where the mouse hits the floor plane (y=0)
        if (ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), intersect)) {
            let pos = intersect.add(draggingRef.current.offset);

            // 3. Boundary Clamping: Allows placement anywhere within L/2 and W/2
            const clampedX = Math.max(-L / 2, Math.min(L / 2, pos.x));
            const clampedZ = Math.max(-W / 2, Math.min(W / 2, pos.z));

            groupRef.current.position.set(clampedX, 0, clampedZ);

            // 4. Collision Detection: Check distance to all other furniture
            const hit = furnitureList.some((other, i) => {
                if (i === index) return false;
                const distance = new THREE.Vector3(...other.position).distanceTo(groupRef.current.position);
                return distance < 1.0; // 1 meter buffer
            });

            setColliding(hit);
            if (!hit) draggingRef.current.lastValid.copy(groupRef.current.position);
        }
    };

    const onUp = () => {
        const clickDuration = Date.now() - clickStartTime.current;

        if (!groupRef.current) {
            cleanupListeners();
            return;
        }

        // Handle Click (Rotation) vs Drag (Placement)
        if (clickDuration < 200) {
            const newRotation = (item.rotation || 0) + Math.PI / 2;
            setFurnitureList(prev => prev.map((f, i) =>
                i === index ? { ...f, rotation: newRotation } : f
            ));
        } else {
            if (collidingRef.current) {
                setWarning({ show: true, message: "Collision detected! Object removed." });
                setFurnitureList(prev => prev.filter((_, i) => i !== index));
                setSelectedIndex(null);
            } else {
                const p = groupRef.current.position;
                setFurnitureList(prev => prev.map((f, i) =>
                    i === index ? { ...f, position: [p.x, 0, p.z] } : f
                ));
            }
        }
        cleanupListeners();
    };

    const cleanupListeners = () => {
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
                    
                    // Calculate offset so the object doesn't "snap" its center to the mouse
                    draggingRef.current.offset.copy(groupRef.current.position).sub(e.point);
                    
                    if (controlsRef.current) controlsRef.current.enabled = false;
                    window.addEventListener("pointermove", onMove);
                    window.addEventListener("pointerup", onUp);
                }}
            />
            
            {/* Visual feedback for selection and collision */}
            {isSelected && (
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                    <planeGeometry args={[1.2, 1.2]} />
                    <meshBasicMaterial 
                        color={colliding ? "red" : "lime"} 
                        transparent 
                        opacity={0.3} 
                    />
                </mesh>
            )}
        </group>
    );
}