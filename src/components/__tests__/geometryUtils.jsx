import { describe, it, expect } from 'vitest';
import { 
  validateGeometry, 
  calculateAreaInAcres, 
  convertSquareMetersToAcres,
  createTestPolygon 
} from '../utils/geometryUtils';

describe('geometryUtils', () => {
  describe('validateGeometry', () => {
    it('should accept valid Polygon geometry', () => {
      const validPolygon = {
        type: 'Polygon',
        coordinates: [[
          [-83.0, 40.0],
          [-82.9, 40.0],
          [-82.9, 40.1],
          [-83.0, 40.1],
          [-83.0, 40.0] // Closed
        ]]
      };

      const result = validateGeometry(validPolygon);
      expect(result.isValid).toBe(true);
      expect(result.error).toBe(null);
    });

    it('should reject geometry without coordinates', () => {
      const invalidGeometry = {
        type: 'Polygon'
        // Missing coordinates
      };

      const result = validateGeometry(invalidGeometry);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('coordinates');
    });

    it('should reject unclosed polygon', () => {
      const unclosedPolygon = {
        type: 'Polygon',
        coordinates: [[
          [-83.0, 40.0],
          [-82.9, 40.0],
          [-82.9, 40.1],
          [-83.0, 40.1]
          // Missing closing coordinate
        ]]
      };

      const result = validateGeometry(unclosedPolygon);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('closed');
    });

    it('should reject unsupported geometry types', () => {
      const pointGeometry = {
        type: 'Point',
        coordinates: [-83.0, 40.0]
      };

      const result = validateGeometry(pointGeometry);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not supported');
    });
  });

  describe('convertSquareMetersToAcres', () => {
    it('should convert square meters to acres correctly', () => {
      // 1 acre = 4046.8564224 square meters
      const oneAcreInSquareMeters = 4046.8564224;
      const result = convertSquareMetersToAcres(oneAcreInSquareMeters);
      expect(result).toBeCloseTo(1, 6); // Should be very close to 1
    });

    it('should handle zero area', () => {
      const result = convertSquareMetersToAcres(0);
      expect(result).toBe(0);
    });
  });

  describe('calculateAreaInAcres', () => {
    it('should return 0 for invalid geometry', () => {
      const invalidGeometry = { type: 'Point' };
      const result = calculateAreaInAcres(invalidGeometry);
      expect(result).toBe(0);
    });

    it('should calculate area for valid polygon using fallback method', () => {
      // Create a test polygon (roughly 1000m x 1000m = ~247 acres)
      const testPolygon = createTestPolygon(1000, 1000);
      const result = calculateAreaInAcres(testPolygon);
      
      // Should be roughly 247 acres (1,000,000 sq meters / 4046.86)
      expect(result).toBeGreaterThan(200);
      expect(result).toBeLessThan(300);
    });
  });

  describe('createTestPolygon', () => {
    it('should create a valid rectangular polygon', () => {
      const polygon = createTestPolygon(1000, 1000, [-83.0, 40.0]);
      
      expect(polygon.type).toBe('Polygon');
      expect(polygon.coordinates).toHaveLength(1);
      expect(polygon.coordinates[0]).toHaveLength(5); // 4 corners + closing point
      
      // Verify it's closed
      const coords = polygon.coordinates[0];
      expect(coords[0]).toEqual(coords[4]);
      
      // Validate using our validator
      const validation = validateGeometry(polygon);
      expect(validation.isValid).toBe(true);
    });
  });
});