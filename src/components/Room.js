
/* eslint-env es2020 */

import React, { useRef, useEffect, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * Props:
 * - length, width, height  (room dims in meters)
 * - wallColor
 * - selectedModel (object or null) { model, price, name }
 * - furnitureList (array of { id, model, position, price })
 * - setFurnitureList (setter)
 * - selectedIndex, setSelectedIndex
 * - sceneRefRef (ref in parent to receive scene for exporter)
 */
export default function Room({
    length = 4,
    width = 3,
    height = 2.6,
    wallColor = "#f8fafc",
    selectedModel,
    furnitureList,
    setFurnitureList,
    selectedIndex,
    setSelectedIndex,
    sceneRefRef, // ref object passed from parent to capture scene
}) {
    // Canvas-level refs
    const controlsRef = useRef();
    const draggingRef = useRef({ index: null, mesh: null, offset: new THREE.Vector3() });

    // helper: clamp position inside room bounds
    const clampPos = (vec) => {
        const halfX = length / 2;
        const halfZ = width / 2;
        vec.x = Math.max(-halfX + 0.01, Math.min(halfX - 0.01, vec.x));
        vec.z = Math.max(-halfZ + 0.01, Math.min(halfZ - 0.01, vec.z));
        vec.y = 0;
        return vec;
    };

    // Render a furniture primitive - loads GLB and clones scene
    function FurniturePrimitive({ item, index, isSelected }) {
        const { scene } = useGLTF(item.model);
        const meshRef = useRef();

        // selection visual: add a wireframe box when selected
        useEffect(() => {
            if (!meshRef.current) return;
            // ensure meshRef.current exists
            meshRef.current.traverse((c) => {
                if (c.isMesh) {
                    // no change in material here to keep original textures;
                }
            });
        }, []);

        // pointer down on furniture -> select & start drag
        const onPointerDown = (e) => {
            e.stopPropagation();
            setSelectedIndex(index);
            // start dragging
            draggingRef.current.index = index;
            draggingRef.current.mesh = meshRef.current;
            // compute offset between mesh position and click point on plane
            const clickPoint = e.point.clone();
            const meshPos = meshRef.current.position.clone();
            draggingRef.current.offset.copy(meshPos).sub(clickPoint);
            // disable orbit controls while dragging
            if (controlsRef.current) controlsRef.current.enabled = false;
            // add listeners on document for move/up
            window.addEventListener("pointermove", onPointerMove);
            window.addEventListener("pointerup", onPointerUp);
        };

        // pointer move handler uses ray to plane
        const onPointerMove = (ev) => {
            if (draggingRef.current.index === null) return;
            // use camera + domElement from three
            const gl = globalThis._RENDERER_GL; // we set this in SceneCanvas onCreated
            const cam = globalThis._RENDERER_CAMERA;
            if (!gl || !cam) return;
            const rect = gl.domElement.getBoundingClientRect();
            const mouse = new THREE.Vector2(
                ((ev.clientX - rect.left) / rect.width) * 2 - 1,
                -((ev.clientY - rect.top) / rect.height) * 2 + 1
            );
            const ray = new THREE.Raycaster();
            ray.setFromCamera(mouse, cam);
            const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
            const intersect = new THREE.Vector3();
            ray.ray.intersectPlane(plane, intersect);
            if (intersect) {
                intersect.add(draggingRef.current.offset);
                clampPos(intersect);
                setFurnitureList((prev) =>
                    prev.map((f, i) => (i === draggingRef.current.index ? { ...f, position: [intersect.x, 0, intersect.z] } : f))
                );
            }
        };

        const onPointerUp = () => {
            // stop dragging
            draggingRef.current.index = null;
            draggingRef.current.mesh = null;
            if (controlsRef.current) controlsRef.current.enabled = true;
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
        };

        return (
            <group>
                <primitive
                    ref={meshRef}
                    object={scene.clone()}
                    position={item.position}
                    scale={1}
                    onPointerDown={onPointerDown}
                />
                {isSelected && (
                    <mesh>
                        {/* Add a glowing ring around selected object */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[item.position[0], 0.01, item.position[2]]}>
                            <ringGeometry args={[0.8, 0.9, 32]} />
                            <meshBasicMaterial color="#FFD700" side={THREE.DoubleSide} />
                        </mesh>
                    </mesh>
                )}
            </group>
        );
    }

    // Floor and walls
    const halfX = length / 2;
    const halfZ = width / 2;

    // Scene wrapper component to capture three context and wire global refs
    function SceneCanvas() {
        const { gl, scene, camera } = useThree();

        // expose scene for exporter: parent passed a ref object (sceneRefRef.current)
        useEffect(() => {
            if (sceneRefRef) sceneRefRef.current = scene;
            // also set globals so primitives can access camera & gl for pointermove fallback
            globalThis._RENDERER_GL = gl;
            globalThis._RENDERER_CAMERA = camera;
            return () => {
                // cleanup
                if (sceneRefRef) sceneRefRef.current = null;
                globalThis._RENDERER_GL = null;
                globalThis._RENDERER_CAMERA = null;
            };
        }, [gl, scene, camera]);

        // click on floor to place model if selectedModel exists
        const onFloorPointerDown = (e) => {
            e.stopPropagation();
            if (!selectedModel) return;
            const pt = e.point.clone();
            clampPos(pt);
            const newItem = { id: Date.now(), model: selectedModel.model, position: [pt.x, 0, pt.z], price: selectedModel.price, name: selectedModel.name };
            setFurnitureList((prev) => [...prev, newItem]);
            // auto-deselect catalog item after placing
            if (typeof window.onModelPlaced === "function") {
                window.onModelPlaced();
            };
        }

        return (
            <>
                <ambientLight intensity={0.6} />
                <directionalLight intensity={0.9} position={[5, 10, 7]} castShadow />
                {/* grid */}
                <gridHelper args={[Math.max(length, width) * 2, Math.max(length, width) * 4]} rotation={[0, 0, 0]} position={[0, 0.001, 0]} />

                {/* Floor */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow onPointerDown={onFloorPointerDown}>
                    <planeGeometry args={[length, width]} />
                    <meshStandardMaterial color="#e6dfd6" />
                </mesh>

                {/* Walls (open top; inside visible) */}
                <mesh position={[0, height / 2, -halfZ]}>
                    <planeGeometry args={[length, height]} />
                    <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[0, height / 2, halfZ]} rotation={[0, Math.PI, 0]}>
                    <planeGeometry args={[length, height]} />
                    <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[-halfX, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                    <planeGeometry args={[width, height]} />
                    <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[halfX, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
                    <planeGeometry args={[width, height]} />
                    <meshStandardMaterial color={wallColor} side={THREE.DoubleSide} />
                </mesh>
            </>
        );
    }

    // delete selected index via Delete key -- parent may also handle but include here for safety
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === "Delete" && selectedIndex !== null) {
                setFurnitureList((prev) => prev.filter((_, i) => i !== selectedIndex));
                setSelectedIndex(null);
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [selectedIndex, setFurnitureList, setSelectedIndex]);

    return (
        <div style={{ flex: 1, height: "100%" }}>
            <Canvas
                shadows
                camera={{ position: [length + 2, Math.max(3, height + 1), -width - 2], fov: 50 }}
                style={{ height: "100%", width: "100%" }}
                onCreated={({ gl, camera }) => {
                    // store renderer and camera globally for pointermove logic used in dragging
                    globalThis._RENDERER_GL = gl;
                    globalThis._RENDERER_CAMERA = camera;
                }}
            >
                <OrbitControls ref={controlsRef} enablePan enableZoom />
                <SceneCanvas />

                {/* Render furniture */}
                {furnitureList.map((it, idx) => (
                    <FurniturePrimitive key={it.id} item={it} index={idx} isSelected={selectedIndex === idx} />
                ))}
            </Canvas>
        </div>
    );
}
