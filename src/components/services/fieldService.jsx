import { Field } from '@/api/entities';

// Helper function to calculate polygon area in acres
const calculatePolygonAcres = (coordinates) => {
  if (!coordinates || !coordinates[0] || coordinates[0].length < 4) {
    return 0;
  }
  
  // Simple area calculation using shoelace formula
  // For more precision, you could use @turf/area
  const points = coordinates[0];
  let area = 0;
  
  for (let i = 0; i < points.length - 1; i++) {
    area += (points[i][0] * points[i + 1][1]) - (points[i + 1][0] * points[i][1]);
  }
  
  area = Math.abs(area) / 2;
  // Convert from decimal degrees to approximate acres (very rough)
  return Math.round(area * 247105); // Rough conversion factor
};

// Helper function to calculate polygon centroid
const calculateCentroid = (coordinates) => {
  if (!coordinates || !coordinates[0]) {
    return { latitude: 0, longitude: 0 };
  }
  
  const points = coordinates[0];
  let lat = 0, lng = 0;
  const count = points.length - 1; // Exclude closing point
  
  for (let i = 0; i < count; i++) {
    lng += points[i][0];
    lat += points[i][1];
  }
  
  return {
    latitude: lat / count,
    longitude: lng / count
  };
};

// Convert drawing points to GeoJSON Polygon
const drawingPointsToGeoJSON = (drawingPoints) => {
  if (!drawingPoints || drawingPoints.length < 3) {
    throw new Error('Need at least 3 points to create a polygon');
  }
  
  // Convert leaflet LatLng objects to [longitude, latitude] format
  const coordinates = drawingPoints.map(point => [
    typeof point.lng !== 'undefined' ? point.lng : point.longitude,
    typeof point.lat !== 'undefined' ? point.lat : point.latitude
  ]);
  
  // Close the polygon by adding the first point at the end
  coordinates.push(coordinates[0]);
  
  return {
    type: "Polygon",
    coordinates: [coordinates]
  };
};

export const FieldService = {
  // Get all user fields
  async getUserFields() {
    try {
      return await Field.list('-updated_date'); // Most recently updated first
    } catch (error) {
      console.error('Error fetching user fields:', error);
      throw new Error(`Failed to load fields: ${error.message}`);
    }
  },

  // Create a new field from drawing points
  async createFieldFromDrawing(fieldData, drawingPoints) {
    try {
      // Validate input
      if (!fieldData.field_name || !fieldData.field_name.trim()) {
        throw new Error('Field name is required');
      }
      
      if (!drawingPoints || drawingPoints.length < 3) {
        throw new Error('Need at least 3 points to create a field');
      }
      
      // Convert drawing points to GeoJSON
      const geometry = drawingPointsToGeoJSON(drawingPoints);
      
      // Calculate metrics
      const acres = calculatePolygonAcres(geometry.coordinates);
      const center_point = calculateCentroid(geometry.coordinates);
      
      // Prepare field data
      const fieldPayload = {
        field_name: fieldData.field_name.trim(),
        farm_name: fieldData.farm_name || 'My Farm',
        geometry: geometry,
        center_point: center_point,
        acres: acres,
        data_source: 'user_drawn',
        current_crop: fieldData.crop_type || null,
        auto_update_enabled: true,
        current_metrics: {
          health_score: 75, // Default value
          last_updated: new Date().toISOString()
        }
      };
      
      console.log('Creating field with payload:', fieldPayload);
      
      // Create the field
      const newField = await Field.create(fieldPayload);
      
      return newField;
    } catch (error) {
      console.error('Error creating field from drawing:', error);
      throw new Error(`Failed to create field: ${error.message}`);
    }
  },

  // Generic field creation method
  async createField(fieldData) {
    try {
      const newField = await Field.create(fieldData);
      return newField;
    } catch (error) {
      console.error('Error creating field:', error);
      throw new Error(`Failed to create field: ${error.message}`);
    }
  },

  // Update an existing field
  async updateField(fieldId, updateData) {
    try {
      const updatedField = await Field.update(fieldId, {
        ...updateData,
        updated_date: new Date().toISOString()
      });
      return updatedField;
    } catch (error) {
      console.error('Error updating field:', error);
      throw new Error(`Failed to update field: ${error.message}`);
    }
  },

  // Delete a field
  async deleteField(fieldId) {
    try {
      await Field.delete(fieldId);
    } catch (error) {
      console.error('Error deleting field:', error);
      throw new Error(`Failed to delete field: ${error.message}`);
    }
  }
};