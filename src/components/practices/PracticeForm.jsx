import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Save, XCircle, PlusCircle } from "lucide-react";

const PRACTICE_TYPES = [
    "fertilizer_application", "cover_crop", "tillage", "biological_input", 
    "lime_application", "compost", "crop_rotation", "other"
];

export default function PracticeForm({ practice, soilTests, onSubmit, onCancel }) {
    const [currentPractice, setCurrentPractice] = useState({
        practice_type: "",
        practice_name: "",
        soil_test_id: "",
        application_date: new Date().toISOString().split('T')[0],
        product_used: "",
        rate_per_acre: "",
        unit: "lbs",
        cost_per_acre: "",
        notes: "",
        completed: false
    });

    useEffect(() => {
        if (practice) {
            setCurrentPractice({
                ...practice,
                application_date: practice.application_date ? new Date(practice.application_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            });
        }
    }, [practice]);

    const handleChange = (field, value) => {
        setCurrentPractice(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSubmit = {
            ...currentPractice,
            rate_per_acre: currentPractice.rate_per_acre ? parseFloat(currentPractice.rate_per_acre) : null,
            cost_per_acre: currentPractice.cost_per_acre ? parseFloat(currentPractice.cost_per_acre) : null,
        };
        onSubmit(dataToSubmit);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-8 overflow-hidden"
        >
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
                        <PlusCircle className="w-6 h-6 text-green-600" />
                        {practice ? 'Edit Practice' : 'Log New Practice'}
                    </CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="practice_type">Practice Type</Label>
                                <Select
                                    value={currentPractice.practice_type}
                                    onValueChange={(value) => handleChange('practice_type', value)}
                                >
                                    <SelectTrigger id="practice_type"><SelectValue placeholder="Select type..." /></SelectTrigger>
                                    <SelectContent>
                                        {PRACTICE_TYPES.map(type => (
                                            <SelectItem key={type} value={type}>
                                                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="practice_name">Practice Name</Label>
                                <Input id="practice_name" placeholder="e.g., Spring Nitrogen Application" value={currentPractice.practice_name} onChange={(e) => handleChange('practice_name', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="soil_test_id">Associated Field</Label>
                                <Select value={currentPractice.soil_test_id} onValueChange={(value) => handleChange('soil_test_id', value)}>
                                    <SelectTrigger id="soil_test_id"><SelectValue placeholder="Select field..." /></SelectTrigger>
                                    <SelectContent>
                                        {soilTests.map(test => (
                                            <SelectItem key={test.id} value={test.id}>{test.field_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="application_date">Application Date</Label>
                                <Input id="application_date" type="date" value={currentPractice.application_date} onChange={(e) => handleChange('application_date', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="product_used">Product Used</Label>
                                <Input id="product_used" placeholder="e.g., Urea (46-0-0)" value={currentPractice.product_used} onChange={(e) => handleChange('product_used', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="rate_per_acre">Rate per Acre</Label>
                                <Input id="rate_per_acre" type="number" placeholder="e.g., 150" value={currentPractice.rate_per_acre} onChange={(e) => handleChange('rate_per_acre', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Input id="unit" placeholder="e.g., lbs, gallons" value={currentPractice.unit} onChange={(e) => handleChange('unit', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cost_per_acre">Cost per Acre ($)</Label>
                                <Input id="cost_per_acre" type="number" placeholder="e.g., 75" value={currentPractice.cost_per_acre} onChange={(e) => handleChange('cost_per_acre', e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" placeholder="Add any relevant notes..." value={currentPractice.notes} onChange={(e) => handleChange('notes', e.target.value)} />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" /> Cancel
                        </Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
                            <Save className="w-4 h-4" /> {practice ? 'Update' : 'Save'} Practice
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </motion.div>
    );
}