import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { MapPin, Search, Plus } from "lucide-react";
import { claimOhioFields } from "@/api/functions";
import { toast } from "sonner";

export default function FieldClaimingModal({ isOpen, onClose, onFieldsClaimed }) {
    const [searchAddress, setSearchAddress] = useState('');
    const [availableFields, setAvailableFields] = useState([]);
    const [selectedFields, setSelectedFields] = useState(new Set());
    const [isSearching, setIsSearching] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);
    const [mapCenter, setMapCenter] = useState([39.8, -83.0]); // Central Ohio

    const handleSearch = async () => {
        if (!searchAddress.trim()) {
            toast.error('Please enter an address or location to search');
            return;
        }

        setIsSearching(true);
        try {
            const response = await claimOhioFields({
                action: 'search',
                search_address: searchAddress
            });

            if (response.data.success) {
                setAvailableFields(response.data.fields);
                
                // Center map on search results
                if (response.data.fields.length > 0) {
                    const firstField = response.data.fields[0];
                    const coords = firstField.geometry.coordinates[0][0];
                    setMapCenter([coords[1], coords[0]]);
                }
                
                toast.success(`Found ${response.data.fields.length} available fields`);
            } else {
                throw new Error(response.data.error || 'Search failed');
            }
        } catch (error) {
            console.error('Field search error:', error);
            toast.error('Failed to search for fields');
        } finally {
            setIsSearching(false);
        }
    };

    const handleFieldToggle = (fieldId, checked) => {
        const newSelected = new Set(selectedFields);
        if (checked) {
            newSelected.add(fieldId);
        } else {
            newSelected.delete(fieldId);
        }
        setSelectedFields(newSelected);
    };

    const handleClaimFields = async () => {
        if (selectedFields.size === 0) {
            toast.error('Please select at least one field to claim');
            return;
        }

        setIsClaiming(true);
        try {
            const response = await claimOhioFields({
                action: 'claim',
                field_ids: Array.from(selectedFields)
            });

            if (response.data.success) {
                toast.success(`Successfully claimed ${response.data.claimed_fields.length} fields!`);
                onFieldsClaimed(response.data.claimed_fields);
                onClose();
            } else {
                throw new Error(response.data.error || 'Failed to claim fields');
            }
        } catch (error) {
            console.error('Field claiming error:', error);
            toast.error('Failed to claim fields');
        } finally {
            setIsClaiming(false);
        }
    };

    const styleField = (feature) => ({
        fillColor: selectedFields.has(feature.properties.field_id) ? '#22c55e' : '#3b82f6',
        weight: 2,
        opacity: 1,
        color: '#ffffff',
        dashArray: '3',
        fillOpacity: selectedFields.has(feature.properties.field_id) ? 0.8 : 0.5
    });

    const onEachField = (feature, layer) => {
        const props = feature.properties;
        
        layer.bindPopup(`
            <div class="p-2">
                <strong>Field ${props.field_id}</strong><br/>
                <strong>Size:</strong> ${props.estimated_acres} acres<br/>
                <strong>County:</strong> ${props.county}<br/>
                <strong>Land Use:</strong> ${props.land_use}
            </div>
        `);

        layer.on({
            click: () => {
                const isSelected = selectedFields.has(props.field_id);
                handleFieldToggle(props.field_id, !isSelected);
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} className="max-w-4xl">
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        Claim Fields in Ohio
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search Section */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label htmlFor="search">Search by Address or Location</Label>
                            <Input
                                id="search"
                                placeholder="e.g., Columbus, OH or 123 Farm Road, Delaware, OH"
                                value={searchAddress}
                                onChange={(e) => setSearchAddress(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? 'Searching...' : <><Search className="w-4 h-4 mr-2" />Search</>}
                            </Button>
                        </div>
                    </div>

                    {/* Map Section */}
                    {availableFields.length > 0 && (
                        <div className="h-96 border rounded-lg overflow-hidden">
                            <MapContainer
                                center={mapCenter}
                                zoom={12}
                                style={{ height: '100%', width: '100%' }}
                                key={mapCenter.join(',')}
                            >
                                <TileLayer
                                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                                    attribution='&copy; Esri'
                                />
                                <GeoJSON
                                    data={{
                                        type: "FeatureCollection",
                                        features: availableFields
                                    }}
                                    style={styleField}
                                    onEachFeature={onEachField}
                                />
                            </MapContainer>
                        </div>
                    )}

                    {/* Field Selection List */}
                    {availableFields.length > 0 && (
                        <div className="max-h-48 overflow-y-auto border rounded-lg">
                            <div className="p-3 bg-gray-50 border-b">
                                <h4 className="font-semibold">Available Fields ({availableFields.length})</h4>
                                <p className="text-sm text-gray-600">Click on fields in the map or check boxes below to select</p>
                            </div>
                            <div className="p-3 space-y-2">
                                {availableFields.map((field) => (
                                    <div key={field.properties.field_id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={field.properties.field_id}
                                            checked={selectedFields.has(field.properties.field_id)}
                                            onCheckedChange={(checked) => handleFieldToggle(field.properties.field_id, checked)}
                                        />
                                        <Label htmlFor={field.properties.field_id} className="flex-1 cursor-pointer">
                                            <strong>Field {field.properties.field_id}</strong> - {field.properties.estimated_acres} acres
                                            <span className="text-gray-500 ml-2">({field.properties.county} County, {field.properties.land_use})</span>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        {selectedFields.size > 0 && (
                            <Button onClick={handleClaimFields} disabled={isClaiming}>
                                {isClaiming ? 'Claiming...' : `Claim ${selectedFields.size} Field(s)`}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}