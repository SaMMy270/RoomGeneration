import React, { useEffect, useMemo } from "react";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

const TEXTURES = {
    wood: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/floors/FloorsCheckerboard_S_Diffuse.jpg",
    tiles: "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/checker.png",
};

export default function Floor({ points, textureType, onPlacement }) {
    // 1. Create the custom shape based on the perimeter points
    const floorShape = useMemo(() => {
        if (!points || points.length === 0) return null;

        const shape = new THREE.Shape();
        // Start at the first point
        shape.moveTo(points[0].x, points[0].y);

        // Draw lines to subsequent points
        for (let i = 1; i < points.length; i++) {
            shape.lineTo(points[i].x, points[i].y);
        }

        shape.closePath();
        return shape;
    }, [points]);

    // 2. Texture Loading
    const isPlain = textureType === 'plain' || !TEXTURES[textureType];
    const texture = useTexture(isPlain ? TEXTURES.wood : TEXTURES[textureType]);

    // 3. Texture Calculation (UV Tiling for complex shapes)
    useEffect(() => {
        if (texture && !isPlain && points.length > 0) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            // Calculate the bounding box of the points to get the overall size
            const box = new THREE.Box2().setFromPoints(points);
            const sizeX = box.max.x - box.min.x;
            const sizeY = box.max.y - box.min.y;

            // Set repeat based on the actual bounds of the perimeter
            texture.repeat.set(sizeX / 2, sizeY / 2);
            texture.needsUpdate = true;
        }
    }, [texture, points, isPlain]);

    if (!floorShape) return null;

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.01, 0]}
            onPointerDown={onPlacement}
        >
            {/* Replace PlaneGeometry with ShapeGeometry */}
            <shapeGeometry args={[floorShape]} />

            <meshStandardMaterial
                map={isPlain ? null : texture}
                color={isPlain ? "#e2e8f0" : "#ffffff"}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}