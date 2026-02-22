import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Satellite, Cloud, Zap, Database, Wifi } from "lucide-react";
import { DataSource } from '@/api/entities';
import { toast } from "sonner";

const DATA_SOURCE_TYPES = [
    {
        type: 'satellite',
        name: 'Satellite Imagery',
        icon: Satellite,
        description: 'Landsat, Sentinel-2, Planet for NDVI, vegetation indices',
        providers: ['Landsat 8/9', 'Sentinel-2', 'Planet Labs', 'MODIS'],
        dataTypes: ['NDVI', 'EVI', 'RGB Imagery', 'NIR', 'SWIR']
    },
    {
        type: 'weather',
        name: 'Weather Data',
        icon: Cloud,
        description: 'Temperature, precipitation, humidity, wind data',
        providers: ['OpenWeatherMap', 'Weather Underground', 'NOAA', 'Dark Sky'],
        dataTypes: ['Temperature', 'Precipitation', 'Humidity', 'Wind Speed', 'Solar Radiation']
    },
    {
        type: 'drone',
        name: 'Drone Imagery',
        icon: Zap,
        description: 'High-resolution field imagery and multispectral analysis',
        providers: ['DJI', 'AgEagle', 'senseFly', 'Manual Upload'],
        dataTypes: ['RGB Imagery', 'Multispectral', 'Thermal', 'Plant Count', 'Crop Health']
    },
    {
        type: 'soil_sensor',
        name: 'Soil Sensors',
        icon: Database,
        description: 'IoT sensors for soil moisture, temperature, pH monitoring',
        providers: ['John Deere', 'CropX', 'Sentek', 'Decagon', 'Custom API'],
        dataTypes: ['Soil Moisture', 'Soil Temperature', 'pH', 'EC', 'NPK']
    },
    {
        type: 'yield_monitor',
        name: 'Yield Monitor',
        icon: Wifi,
        description: 'Harvest data from combine harvesters and yield mapping',
        providers: ['John Deere', 'Case IH', 'New Holland', 'Trimble', 'AgLeader'],
        dataTypes: ['Yield', 'Moisture', 'Protein', 'Test Weight', 'GPS Coordinates']
    }
];

export default function DataSourceSetup({ onClose, onSuccess }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedType, setSelectedType] = useState(null);
    const [formData, setFormData] = useState({
        source_name: '',
        source_type: '',
        provider: '',
        sync_frequency: 'weekly',
        api_key: '',
        api_endpoint: '',
        username: '',
        password: '',
        additional_config: '',
        data_types: []
    });

    const handleTypeSelect = (sourceType) => {
        setSelectedType(sourceType);
        setFormData(prev => ({
            ...prev,
            source_type: sourceType.type,
            provider: sourceType.providers[0],
            data_types: sourceType.dataTypes
        }));
        setCurrentStep(2);
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            const connection_config = {
                api_key: formData.api_key,
                api_endpoint: formData.api_endpoint,
                username: formData.username,
                password: formData.password,
                additional_config: formData.additional_config ? JSON.parse(formData.additional_config) : {}
            };

            await DataSource.create({
                source_name: formData.source_name,
                source_type: formData.source_type,
                provider: formData.provider,
                sync_frequency: formData.sync_frequency,
                connection_config,
                data_types: formData.data_types,
                status: 'setup_incomplete',
                field_mappings: []
            });

            toast.success("Data source created successfully!");
            onSuccess();
        } catch (error) {
            console.error("Error creating data source:", error);
            toast.error("Failed to create data source");
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-green-900">
                        Add Data Source - Step {currentStep} of 2
                    </DialogTitle>
                </DialogHeader>

                {currentStep === 1 && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Choose Your Data Source Type
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {DATA_SOURCE_TYPES.map(sourceType => {
                                    const IconComponent = sourceType.icon;
                                    return (
                                        <Card
                                            key={sourceType.type}
                                            className="cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-green-300"
                                            onClick={() => handleTypeSelect(sourceType)}
                                        >
                                            <CardHeader className="pb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                        <IconComponent className="w-6 h-6 text-green-600" />
                                                    </div>
                                                    <CardTitle className="text-lg">{sourceType.name}</CardTitle>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-gray-600 text-sm mb-3">{sourceType.description}</p>
                                                <div className="space-y-2">
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-500">PROVIDERS:</span>
                                                        <p className="text-xs text-gray-700">{sourceType.providers.join(', ')}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-semibold text-gray-500">DATA TYPES:</span>
                                                        <p className="text-xs text-gray-700">{sourceType.dataTypes.join(', ')}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {currentStep === 2 && selectedType && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                            <selectedType.icon className="w-6 h-6 text-green-600" />
                            <div>
                                <h3 className="font-semibold text-green-900">{selectedType.name}</h3>
                                <p className="text-sm text-green-700">{selectedType.description}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="source_name">Data Source Name</Label>
                                    <Input
                                        id="source_name"
                                        placeholder="e.g., My Farm Satellite Data"
                                        value={formData.source_name}
                                        onChange={(e) => handleInputChange('source_name', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="provider">Provider</Label>
                                    <Select value={formData.provider} onValueChange={(value) => handleInputChange('provider', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {selectedType.providers.map(provider => (
                                                <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="sync_frequency">Sync Frequency</Label>
                                    <Select value={formData.sync_frequency} onValueChange={(value) => handleInputChange('sync_frequency', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">Daily</SelectItem>
                                            <SelectItem value="weekly">Weekly</SelectItem>
                                            <SelectItem value="monthly">Monthly</SelectItem>
                                            <SelectItem value="on_demand">On Demand</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="api_key">API Key</Label>
                                    <Input
                                        id="api_key"
                                        type="password"
                                        placeholder="Enter your API key"
                                        value={formData.api_key}
                                        onChange={(e) => handleInputChange('api_key', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="api_endpoint">API Endpoint (Optional)</Label>
                                    <Input
                                        id="api_endpoint"
                                        placeholder="https://api.example.com/v1"
                                        value={formData.api_endpoint}
                                        onChange={(e) => handleInputChange('api_endpoint', e.target.value)}
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="additional_config">Additional Configuration (JSON)</Label>
                                    <Textarea
                                        id="additional_config"
                                        placeholder='{"region": "us-west", "resolution": "30m"}'
                                        value={formData.additional_config}
                                        onChange={(e) => handleInputChange('additional_config', e.target.value)}
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between pt-6">
                            <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                Back
                            </Button>
                            <Button 
                                onClick={handleSubmit}
                                disabled={!formData.source_name || !formData.api_key}
                                className="bg-green-600 hover:bg-green-700"
                            >
                                Create Data Source
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}