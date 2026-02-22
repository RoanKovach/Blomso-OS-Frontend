import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, X, FileText, Beaker } from "lucide-react";

const SOIL_NUTRIENTS = [
  { key: 'ph', label: 'pH Level', unit: '', type: 'number', step: '0.1' },
  { key: 'organic_matter', label: 'Organic Matter', unit: '%', type: 'number', step: '0.1' },
  { key: 'nitrogen', label: 'Nitrogen (N)', unit: 'ppm', type: 'number', step: '1' },
  { key: 'phosphorus', label: 'Phosphorus (P)', unit: 'ppm', type: 'number', step: '1' },
  { key: 'potassium', label: 'Potassium (K)', unit: 'ppm', type: 'number', step: '1' },
  { key: 'calcium', label: 'Calcium (Ca)', unit: 'ppm', type: 'number', step: '1' },
  { key: 'magnesium', label: 'Magnesium (Mg)', unit: 'ppm', type: 'number', step: '1' },
  { key: 'sulfur', label: 'Sulfur (S)', unit: 'ppm', type: 'number', step: '1' },
  { key: 'cec', label: 'CEC', unit: 'meq/100g', type: 'number', step: '0.1' },
  { key: 'base_saturation', label: 'Base Saturation', unit: '%', type: 'number', step: '1' },
  { key: 'iron', label: 'Iron (Fe)', unit: 'ppm', type: 'number', step: '0.1' },
  { key: 'zinc', label: 'Zinc (Zn)', unit: 'ppm', type: 'number', step: '0.1' },
  { key: 'manganese', label: 'Manganese (Mn)', unit: 'ppm', type: 'number', step: '0.1' },
  { key: 'copper', label: 'Copper (Cu)', unit: 'ppm', type: 'number', step: '0.1' },
  { key: 'boron', label: 'Boron (B)', unit: 'ppm', type: 'number', step: '0.1' }
];

export default function EditZoneModal({ isOpen, test, onSave, onReset, onClose }) {
  const [editedTest, setEditedTest] = useState(test);
  const [activeTab, setActiveTab] = useState('basic');

  useEffect(() => {
    if (test) {
      setEditedTest({ ...test });
    }
  }, [test]);

  const handleSoilDataChange = (nutrient, value) => {
    setEditedTest(prev => ({
      ...prev,
      soil_data: {
        ...prev.soil_data,
        [nutrient]: value === '' ? null : parseFloat(value)
      }
    }));
  };

  const handleBasicInfoChange = (field, value) => {
    setEditedTest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSave(editedTest);
  };

  const handleReset = () => {
    onReset(test.tempId);
    onClose();
  };

  if (!test) return null;

  const criticalNutrients = SOIL_NUTRIENTS.filter(nutrient => 
    ['ph', 'organic_matter', 'nitrogen', 'phosphorus', 'potassium'].includes(nutrient.key)
  );
  const additionalNutrients = SOIL_NUTRIENTS.filter(nutrient => 
    !['ph', 'organic_matter', 'nitrogen', 'phosphorus', 'potassium'].includes(nutrient.key)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
            <FileText className="w-5 h-5" />
            Edit Zone: {editedTest.zone_name || 'Unnamed Zone'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="nutrients">Soil Data</TabsTrigger>
            <TabsTrigger value="lab">Lab Methods</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone_name">Zone Name</Label>
                <Input
                  id="zone_name"
                  value={editedTest.zone_name || ''}
                  onChange={(e) => handleBasicInfoChange('zone_name', e.target.value)}
                  placeholder="e.g., Plot A - North"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sampling_depth">Sampling Depth</Label>
                <Input
                  id="sampling_depth"
                  value={editedTest.sampling_depth || ''}
                  onChange={(e) => handleBasicInfoChange('sampling_depth', e.target.value)}
                  placeholder="e.g., 0-6 inches"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test_date">Test Date</Label>
                <Input
                  id="test_date"
                  type="date"
                  value={editedTest.test_date || ''}
                  onChange={(e) => handleBasicInfoChange('test_date', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="field_size_acres">Zone Size (Acres)</Label>
                <Input
                  id="field_size_acres"
                  type="number"
                  step="0.1"
                  value={editedTest.field_size_acres || ''}
                  onChange={(e) => handleBasicInfoChange('field_size_acres', parseFloat(e.target.value))}
                  placeholder="e.g., 25.5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="field_notes">Field Notes</Label>
              <Textarea
                id="field_notes"
                value={editedTest.field_notes || ''}
                onChange={(e) => handleBasicInfoChange('field_notes', e.target.value)}
                placeholder="Any additional notes about this zone..."
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="nutrients" className="space-y-6">
            {/* Critical Nutrients */}
            <div>
              <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                Critical Nutrients
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {criticalNutrients.map(nutrient => (
                  <div key={nutrient.key} className="space-y-2">
                    <Label htmlFor={nutrient.key} className="text-sm font-medium">
                      {nutrient.label}
                      {nutrient.unit && <span className="text-gray-500 ml-1">({nutrient.unit})</span>}
                    </Label>
                    <Input
                      id={nutrient.key}
                      type={nutrient.type}
                      step={nutrient.step}
                      value={editedTest.soil_data?.[nutrient.key] || ''}
                      onChange={(e) => handleSoilDataChange(nutrient.key, e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Nutrients */}
            <div>
              <h3 className="font-semibold text-green-900 mb-3">Additional Nutrients</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {additionalNutrients.map(nutrient => (
                  <div key={nutrient.key} className="space-y-2">
                    <Label htmlFor={nutrient.key} className="text-sm font-medium">
                      {nutrient.label}
                      {nutrient.unit && <span className="text-gray-500 ml-1">({nutrient.unit})</span>}
                    </Label>
                    <Input
                      id={nutrient.key}
                      type={nutrient.type}
                      step={nutrient.step}
                      value={editedTest.soil_data?.[nutrient.key] || ''}
                      onChange={(e) => handleSoilDataChange(nutrient.key, e.target.value)}
                      placeholder="Enter value"
                    />
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="lab" className="space-y-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-green-900">Laboratory Methods</h3>
              <p className="text-sm text-gray-600">
                Track the specific laboratory methods used for testing. This helps ensure accurate comparisons with future tests.
              </p>
              
              {/* Lab Methods would go here - for now showing info */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Common Lab Methods:</h4>
                <div className="space-y-2 text-sm text-blue-800">
                  <div>• <strong>Phosphorus:</strong> Olsen P, Bray P1, Bray P2, Mehlich III</div>
                  <div>• <strong>Potassium:</strong> Ammonium acetate, Mehlich III</div>
                  <div>• <strong>pH:</strong> Water pH, Salt pH</div>
                  <div>• <strong>Organic Matter:</strong> Walkley-Black, Loss on ignition</div>
                </div>
              </div>
              
              {test.lab_info && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Lab Information:</h4>
                  <div className="space-y-1 text-sm text-gray-700">
                    {test.lab_info.lab_name && <div><strong>Lab:</strong> {test.lab_info.lab_name}</div>}
                    {test.lab_info.report_date && <div><strong>Report Date:</strong> {test.lab_info.report_date}</div>}
                    {test.lab_info.methods_used && (
                      <div>
                        <strong>Methods:</strong>
                        <div className="ml-4 mt-1">
                          {Object.entries(test.lab_info.methods_used).map(([method, value]) => (
                            <div key={method} className="flex gap-2">
                              <Badge variant="outline" className="text-xs">{method}: {value}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="text-gray-600">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset to Original
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}