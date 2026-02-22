import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Save, RotateCcw, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function EditTestModal({ isOpen, test, onSave, onReset, onClose }) {
  const [editedData, setEditedData] = useState(test);

  useEffect(() => {
    setEditedData(test);
  }, [test]);

  const handleInputChange = (field, value, parent = null) => {
    if (parent) {
      setEditedData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [field]: value
        }
      }));
    } else {
      setEditedData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSave = () => {
    onSave(editedData);
  };

  const handleReset = () => {
    onReset(test.tempId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Review & Edit: {test.field_name}</DialogTitle>
          <DialogDescription>
            Verify the data extracted by the AI. You can correct any values before finalizing.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] p-4">
          <div className="space-y-6">
            <CardSection title="Field Information">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="field_name">Field/Plot Name</Label>
                  <Input id="field_name" value={editedData.field_name || ''} onChange={(e) => handleInputChange('field_name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test_date">Test Date</Label>
                  <Input id="test_date" type="date" value={editedData.test_date || ''} onChange={(e) => handleInputChange('test_date', e.target.value)} />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="crop_type">Crop Type</Label>
                  <Input id="crop_type" value={editedData.crop_type || ''} onChange={(e) => handleInputChange('crop_type', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field_size_acres">Field Size (Acres)</Label>
                  <Input id="field_size_acres" type="number" value={editedData.field_size_acres || ''} onChange={(e) => handleInputChange('field_size_acres', parseFloat(e.target.value))} />
                </div>
              </div>
            </CardSection>

            <CardSection title="Soil Analysis Data">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(editedData.soil_data || {}).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</Label>
                    <Input id={key} type="number" step="0.01" value={value ?? ''} onChange={(e) => handleInputChange(key, parseFloat(e.target.value), 'soil_data')} />
                  </div>
                ))}
              </div>
            </CardSection>
            
            <p className="text-xs text-center text-gray-500 pt-4">Note: Displaying a raw snippet of the uploaded file for direct comparison is a planned future enhancement.</p>

          </div>
        </ScrollArea>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between sm:space-x-2 gap-2">
          <Button onClick={handleReset} variant="destructive" className="flex items-center gap-2 w-full sm:w-auto">
            <RotateCcw className="w-4 h-4" /> Reset to Original
          </Button>
          <div className="flex justify-end gap-2 w-full sm:w-auto">
             <Button onClick={onClose} variant="outline" className="flex items-center gap-2">
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const CardSection = ({ title, children }) => (
  <div>
    <h3 className="text-lg font-semibold text-green-900 mb-3 border-b pb-2">{title}</h3>
    {children}
  </div>
);