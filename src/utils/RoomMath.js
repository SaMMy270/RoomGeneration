
export const getShapePoints = (shape, [L, W, nL, nW]) => {
    if (shape === 'SQUARE') {
        return [
            [-L/2, -W/2], [L/2, -W/2], [L/2, W/2], [-L/2, W/2]
        ];
    }
    if (shape === 'L_SHAPE') {
        // Creates 6 points for an L-shape
        return [
            [-L/2, -W/2],            // Bottom Left
            [L/2, -W/2],             // Bottom Right
            [L/2, W/2 - nW],         // Inner corner 1
            [L/2 - nL, W/2 - nW],    // Inner corner 2 (The Notch)
            [L/2 - nL, W/2],         // Top Right
            [-L/2, W/2]              // Top Left
        ];
    }
    return [];
};

export const getWallSegments = (points) => {
    return points.map((p1, i) => {
        const p2 = points[(i + 1) % points.length];
        const dx = p2[0] - p1[0];
        const dz = p2[1] - p1[1];
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        return {
            pos: [(p1[0] + p2[0]) / 2, 1.25, (p1[1] + p2[1]) / 2],
            rot: [0, -angle, 0],
            width: length
        };
    });
};

export const isPointInRoom = (x, z, points) => {
  // Logic to check if a point [x, z] is inside the polygon defined by points
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0], zi = points[i][1];
    const xj = points[j][0], zj = points[j][1];
    const intersect = ((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};