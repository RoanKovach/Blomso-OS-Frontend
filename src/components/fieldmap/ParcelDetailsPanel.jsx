import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MapPin, 
  TrendingUp, 
  Droplets, 
  Sprout, 
  FlaskConical,
  Clock,
  User,
  Plus,
  Loader2,
  CheckCircle2,
  X
} from "lucide-react";
import { toast } from 'sonner';
import { manageParcelField } from "@/api/functions";

export default function ParcelDetailsPanel({ parcel, details, isLoading, onClose }) {
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [selectedSoilTests, setSelectedSoilTests] = useState(new Set());
  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimParcel = async () => {
    if (!customName.trim()) {
      toast.error('Please enter a name for this field');
      return;
    }

    setIsClaiming(true);
    try {
      const response = await manageParcelField({
        action: 'claim_parcel',
        payload: {
          parcel: parcel,
          custom_name: customName,
          link_soil_test_ids: Array.from(selectedSoilTests)
        }
      });

      if (response && response.data && response.data.success) {
        toast.success(`Successfully claimed "${customName}"`);
        setShowClaimForm(false);
        // Refresh the details to show updated status
        window.location.reload();
      } else {
        throw new Error('Failed to claim parcel');
      }
    } catch (error) {
      console.error('Claim error:', error);
      toast.error('Failed to claim parcel');
    } finally {
      setIsClaiming(false);
    }
  };

  const handleSoilTestToggle = (testId, checked) => {
    const newSelected = new Set(selectedSoilTests);
    if (checked) {
      newSelected.add(testId);
    } else {
      newSelected.delete(testId);
    }
    setSelectedSoilTests(newSelected);
  };

  if (!parcel) return null;

  const props = parcel.properties;

  return (
    <Card className="border-none shadow-lg bg-white/90 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg font-bold text-green-900">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Parcel Details
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Basic Parcel Info */}
        <div>
          <h4 className="font-semibold text-green-900 mb-2">{props.display_name}</h4>
          <div className="space-y-1 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{props.county} County, Ohio</span>
            </div>
            <div>
              <strong>Size:</strong> {props.acres?.toFixed(1) || 0} acres
            </div>
            <div>
              <strong>Parcel ID:</strong> {props.parcel_id}
            </div>
            {props.owner && (
              <div>
                <strong>Owner:</strong> {props.owner}
              </div>
            )}
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-6">
            <div className="flex items-center gap-2 text-green-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Loading agricultural data...</span>
            </div>
          </div>
        )}

        {details && !isLoading && (
          <>
            {/* Live Agricultural Data */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-green-900 mb-3">Live Agricultural Data</h4>
              <div className="space-y-3">
                {/* NDVI */}
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Sprout className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">NDVI (Vegetation Health)</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">
                    {details.live_data.ndvi.mean.toFixed(3)}
                  </p>
                  <p className="text-xs text-gray-600">
                    {details.live_data.ndvi.date} • {details.live_data.ndvi.source}
                  </p>
                </div>

                {/* ET */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Water Usage (ET)</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">
                    {details.live_data.evapotranspiration.seasonal_total_mm} mm
                  </p>
                  <p className="text-xs text-gray-600">
                    Seasonal Total • {details.live_data.evapotranspiration.source}
                  </p>
                  <Badge className="mt-1 text-xs">
                    {details.live_data.evapotranspiration.water_stress_indicator} Stress
                  </Badge>
                </div>

                {/* Soil */}
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <FlaskConical className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">Soil Properties</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">
                    pH {details.live_data.soil.ph}
                  </p>
                  <p className="text-xs text-gray-600">
                    {details.live_data.soil.texture} • {details.live_data.soil.drainage_class}
                  </p>
                </div>

                {/* Health Score */}
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Health Score</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800">
                    {details.live_data.calculated_metrics.health_score}/100
                  </p>
                  <Badge className="mt-1 text-xs">
                    {details.live_data.calculated_metrics.management_zone}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Linkable Soil Tests */}
            {details.linkable_soil_tests && details.linkable_soil_tests.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-semibold text-green-900 mb-3">
                  Matching Soil Tests ({details.linkable_soil_tests.length})
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {details.linkable_soil_tests.map((test) => (
                    <div key={test.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                      <Checkbox
                        id={test.id}
                        checked={selectedSoilTests.has(test.id)}
                        onCheckedChange={(checked) => handleSoilTestToggle(test.id, checked)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{test.field_name}</p>
                        <p className="text-xs text-gray-500">
                          {test.test_date} • {test.confidence} confidence match
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Actions */}
            <div className="border-t pt-4">
              {details.user_relationship.is_claimed ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">You own this field</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Your Name:</strong> {details.user_relationship.claimed_field.field_name}
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      Rename Field
                    </Button>
                    <Button size="sm" variant="outline">
                      View in My Records
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {!showClaimForm ? (
                    <Button
                      onClick={() => setShowClaimForm(true)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Claim & Name This Field
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Input
                        placeholder="Enter a name for this field..."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={handleClaimParcel}
                          disabled={isClaiming || !customName.trim()}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          {isClaiming ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          )}
                          {isClaiming ? 'Claiming...' : 'Claim Field'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowClaimForm(false)}
                          disabled={isClaiming}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Claiming lets you rename this field and link your soil test data.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}