// RoomCanvas.jsx
import React, {
    forwardRef,
    useRef,
    useState,
    useMemo,
    useImperativeHandle,
    useEffect,
} from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";

/* -------------------------
   Furniture loader component
   ------------------------- */
function Furniture({ id, modelPath, position, isSelected, onPointerDownLocal }) {
    const { scene } = useGLTF(modelPath);
    const ref = useRef();

    // Slight visual cue when selected
    useEffect(() => {
        if (!ref.current) return;
        ref.current.traverse((c) => {
            if (c.isMesh) {
                if (isSelected) {
                    c.material.emissive = new THREE.Color(0x444400);
                } else {
                    c.material.emissive = new THREE.Color(0x000000);
                }
            }
        });
    }, [isSelected]);

    return (
        <primitive
            ref={ref}
            object={scene.clone()}
            position={position}
            scale={1}
            // pointerdown used for selecting and initiating drag
            onPointerDown={(e) => {
                e.stopPropagation();
                onPointerDownLocal(id, ref.current, e.nativeEvent);
            }}
            // prevent clicks from falling through
            onPointerUp={(e) => e.stopPropagation()}
        />
    );
}

/* -------------------------
   Room mesh (floor + walls)
   ------------------------- */
const RoomMesh = ({ length = 4, width = 3, height = 2.6, onFloorPointerDown }) => {
    const halfX = length / 2;
    const halfZ = width / 2;

    const wallMat = useMemo(
        () => new THREE.MeshStandardMaterial({ color: "#f8fafc", side: THREE.DoubleSide }),
        []
    );

    return (
        <group>
            {/* Floor (name floor so we can detect specifically) */}
            <mesh
                name="floor"
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0, 0]}
                receiveShadow
                onPointerDown={(e) => {
                    // clicking floor -> placement (if caller wants)
                    e.stopPropagation();
                    if (onFloorPointerDown) onFloorPointerDown(e.point);
                }}
            >
                <planeGeometry args={[length, width]} />
                <meshStandardMaterial color={"#e6dfd6"} />
            </mesh>

            {/* Walls */}
            <mesh position={[0, height / 2, -halfZ]}>
                <planeGeometry args={[length, height]} />
                <primitive object={wallMat} attach="material" />
            </mesh>

            <mesh position={[0, height / 2, halfZ]} rotation={[0, Math.PI, 0]}>
                <planeGeometry args={[length, height]} />
                <primitive object={wallMat} attach="material" />
            </mesh>

            <mesh position={[-halfX, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[width, height]} />
                <primitive object={wallMat} attach="material" />
            </mesh>

            <mesh position={[halfX, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
                <planeGeometry args={[width, height]} />
                <primitive object={wallMat} attach="material" />
            </mesh>
        </group>
    );
};

/* -------------------------
   Inner canvas: contains scene + drag logic
   ------------------------- */
const InnerCanvas = forwardRef(
    ({ length, width, height, furnitureList, onAddFurniture, onUpdateFurniture }, ref) => {
        const { scene, camera, gl } = useThree();
        const controlsRef = useRef(null); // assigned to OrbitControls below
        useImperativeHandle(ref, () => scene, [scene]);

        // Selected furniture id and reference to the current dragging mesh
        const [selectedId, setSelectedId] = useState(null);
        const draggingRef = useRef(null);
        const draggingObjectRef = useRef(null);

        // raycaster / plane helpers for converting mouse -> ground
        const raycaster = useMemo(() => new THREE.Raycaster(), []);
        const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
        const mouse = useMemo(() => new THREE.Vector2(), []);

        // pointer move handler when dragging
        const pointerMoveHandler = (event) => {
            if (!draggingRef.current || !draggingObjectRef.current) return;
            const rect = gl.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersection = new THREE.Vector3();
            raycaster.ray.intersectPlane(plane, intersection);
            if (intersection) {
                // keep y = 0 (floor)
                draggingObjectRef.current.position.set(intersection.x, 0, intersection.z);
                // reflect change up to parent
                const idx = furnitureList.findIndex((f) => f.id === draggingRef.current);
                if (idx >= 0) onUpdateFurniture(idx, [intersection.x, 0, intersection.z]);
            }
        };

        // pointer up -> stop dragging
        const pointerUpHandler = () => {
            if (draggingRef.current) {
                draggingRef.current = null;
                draggingObjectRef.current = null;
                // re-enable orbit
                if (controlsRef.current) controlsRef.current.enabled = true;
            }
            // remove global listeners
            gl.domElement.removeEventListener("pointermove", pointerMoveHandler);
            window.removeEventListener("pointerup", pointerUpHandler);
        };

        // Called when furniture primitive receives pointerDown
        const handleFurniturePointerDown = (id, mesh, nativeEvent) => {
            // select the item
            setSelectedId(id);

            // start dragging
            draggingRef.current = id;
            draggingObjectRef.current = mesh;
            // disable camera orbit
            if (controlsRef.current) controlsRef.current.enabled = false;

            // add global listeners so we track pointer regardless of hitting other objects
            gl.domElement.addEventListener("pointermove", pointerMoveHandler);
            window.addEventListener("pointerup", pointerUpHandler);
        };

        // Floor pointer down -> place a selected catalog model (handled in App via onAddFurniture)
        const handleFloorPointerDown = (point) => {
            // forward the clicked floor point to parent
            if (onAddFurniture) onAddFurniture([point.x, 0, point.z]);
        };

        // click elsewhere should clear selection (pointer miss)
        const handlePointerMissed = () => {
            // do not clear selection while dragging
            if (!draggingRef.current) setSelectedId(null);
        };

        return (
            <group onPointerMissed={handlePointerMissed}>
                {/* lights and grid */}
                <ambientLight intensity={0.6} />
                <directionalLight intensity={0.9} position={[5, 10, 7]} castShadow />
                <Grid args={[Math.max(length, width) * 4, Math.max(length, width) * 8]} />

                {/* room geometry */}
                <RoomMesh length={length} width={width} height={height} onFloorPointerDown={handleFloorPointerDown} />

                {/* furniture */}
                {furnitureList.map((f) => (
                    <Furniture
                        key={f.id}
                        id={f.id}
                        modelPath={f.model}
                        position={f.position}
                        isSelected={selectedId === f.id}
                        onPointerDownLocal={handleFurniturePointerDown}
                    />
                ))}

                {/* small UI overlay */}
                <Html position={[-Math.max(length, width) / 2 + 0.3, 0.2, 0]}>
                    <div
                        style={{
                            background: "rgba(255,255,255,0.85)",
                            padding: 8,
                            borderRadius: 6,
                            fontSize: 12,
                        }}
                    >
                        Dimensions: {length}m × {width}m × {height}m
                    </div>
                </Html>

                {/* OrbitControls with ref so we can enable/disable */}
                <OrbitControls ref={controlsRef} target={[0, height / 2, 0]} />
            </group>
        );
    }
);

export default forwardRef(function RoomCanvas({ length, width, height, furnitureList, onAddFurniture, onUpdateFurniture }, ref) {
    return (
        <Canvas shadows camera={{ position: [6, 4, 6], fov: 50 }}>
            <color attach="background" args={["#f8fafc"]} />
            <InnerCanvas
                ref={ref}
                length={length}
                width={width}
                height={height}
                furnitureList={furnitureList}
                onAddFurniture={onAddFurniture}
                onUpdateFurniture={onUpdateFurniture}
            />
        </Canvas>
    );
});
