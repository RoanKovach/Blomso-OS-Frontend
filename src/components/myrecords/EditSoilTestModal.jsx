
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react';

export default function EditSoilTestModal({ isOpen, onClose, onSave, test }) {
    const [formData, setFormData] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (test) {
            setFormData({
                field_name: test.field_name || '',
                test_date: test.test_date ? test.test_date.split('T')[0] : '', // Format for <input type="date">
                crop_type: test.crop_type || '',
                field_size_acres: test.field_size_acres || 0,
            });
        }
    }, [test]);

    if (!test) return null;

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        const isNumber = e.target.type === 'number';
        setFormData(prev => ({ ...prev, [id]: isNumber ? parseFloat(value) || 0 : value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Add proper timestamp when saving
            const dataWithTimestamp = {
                ...formData,
                updated_date: new Date().toISOString()
            };
            
            await onSave(dataWithTimestamp);
            toast.success("Soil test updated successfully.");
            onClose();
        } catch (error) {
            console.error("Failed to update soil test:", error);
            toast.error("Failed to update soil test.");
        }
        setIsSaving(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Soil Test</DialogTitle>
                    <DialogDescription>
                        Update the contextual details for your test on "{test.field_name}".
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="field_name" className="text-right">Field Name</Label>
                        <Input id="field_name" value={formData.field_name} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="test_date" className="text-right">Test Date</Label>
                        <Input id="test_date" type="date" value={formData.test_date} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="crop_type" className="text-right">Crop Type</Label>
                        <Input id="crop_type" value={formData.crop_type} onChange={handleInputChange} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="field_size_acres" className="text-right">Acres</Label>
                        <Input id="field_size_acres" type="number" value={formData.field_size_acres} onChange={handleInputChange} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
