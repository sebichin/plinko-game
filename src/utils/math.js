/**
 * Normal Probability Density Function
 * Calculates the height of the bell curve at position x
 * @param {number} x - Position along x-axis
 * @param {number} mean - Center of distribution
 * @param {number} stdDev - Standard deviation (spread)
 * @returns {number} PDF value (curve height)
 */
export function normalPDF(x, mean, stdDev) {
    const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
    const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
    return coefficient * Math.exp(exponent);
}
