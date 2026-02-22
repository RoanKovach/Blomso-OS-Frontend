/**
 * Utility functions for geometry calculations and validation
 */

/**
 * Calculate the area of a GeoJSON polygon in acres
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {number} Area in acres
 */
export const calculateAreaInAcres = (geometry) => {
  if (!geometry || geometry.type !== 'Polygon') {
    return 0;
  }

  try {
    const coordinates = geometry.coordinates[0]; // Get exterior ring
    if (coordinates.length < 4) return 0;

    // Use the Shoelace formula to calculate area
    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [x1, y1] = coordinates[i];
      const [x2, y2] = coordinates[i + 1];
      area += (x1 * y2) - (x2 * y1);
    }
    area = Math.abs(area) / 2;

    // Convert from square degrees to square meters (approximate)
    // This is a rough approximation - for precise calculations, use a proper projection
    const metersPerDegree = 111319.5; // meters per degree at equator
    const areaInSquareMeters = area * metersPerDegree * metersPerDegree;
    
    // Convert square meters to acres (1 acre = 4046.86 square meters)
    return areaInSquareMeters / 4046.86;
  } catch (error) {
    console.error('Error calculating area:', error);
    return 0;
  }
};

/**
 * Validate a GeoJSON geometry object
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {Object} Validation result with isValid and error properties
 */
export const validateGeometry = (geometry) => {
  if (!geometry) {
    return { isValid: false, error: 'Geometry is required' };
  }

  if (!geometry.type) {
    return { isValid: false, error: 'Geometry type is required' };
  }

  if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
    return { isValid: false, error: 'Only Polygon and MultiPolygon geometries are supported' };
  }

  if (!geometry.coordinates || !Array.isArray(geometry.coordinates)) {
    return { isValid: false, error: 'Geometry coordinates must be an array' };
  }

  if (geometry.type === 'Polygon') {
    if (geometry.coordinates.length === 0) {
      return { isValid: false, error: 'Polygon must have at least one ring' };
    }

    const ring = geometry.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) {
      return { isValid: false, error: 'Polygon ring must have at least 4 points' };
    }

    // Check if first and last points are the same (closed ring)
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      return { isValid: false, error: 'Polygon ring must be closed (first and last points must be the same)' };
    }
  }

  return { isValid: true, error: null };
};

/**
 * Calculate the center point of a polygon
 * @param {Object} geometry - GeoJSON geometry object
 * @returns {Object} Center point with latitude and longitude
 */
export const calculateCenterPoint = (geometry) => {
  if (!geometry || geometry.type !== 'Polygon') {
    return null;
  }

  try {
    const coordinates = geometry.coordinates[0];
    let totalLat = 0;
    let totalLng = 0;
    let pointCount = coordinates.length - 1; // Exclude the closing point

    for (let i = 0; i < pointCount; i++) {
      totalLng += coordinates[i][0];
      totalLat += coordinates[i][1];
    }

    return {
      longitude: totalLng / pointCount,
      latitude: totalLat / pointCount
    };
  } catch (error) {
    console.error('Error calculating center point:', error);
    return null;
  }
};