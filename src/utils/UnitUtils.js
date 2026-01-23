export const M_TO_FT = 3.28084;

export const toFeetInches = (meters) => {
    const totalInches = meters * 39.3701;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
};

export const toMeters = (feet, inches) => {
    const f = parseFloat(feet) || 0;
    const i = parseFloat(inches) || 0;
    return (f * 12 + i) * 0.0254;
};