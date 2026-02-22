import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Map, 
  Upload, 
  Trash2, 
  MapPin,
  Plus,
  AlertCircle,
  Database,
  Search
} from "lucide-react";
import { toast } from "sonner";

export default function FieldManager({ fields, selectedField, onSelectField, onDeleteField, onStartDrawing, isLoading }) {
    
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredFields = fields.filter(field => 
        field.field_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (field.farm_name && field.farm_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleShapefileImport = () => {
        toast.info('Shapefile import coming soon!');
    };

    const handleClaimPublicBoundary = () => {
        toast.info('Public boundary claiming coming soon!');
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Map className="w-6 h-6 text-green-600" />
                    Field Visualization
                </h1>
                <p className="text-gray-600 mt-1 text-sm">
                    Manage field boundaries and analyze spatial data.
                </p>
            </div>

            {/* Main content area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="flex gap-2">
                    <Button
                        onClick={onStartDrawing}
                        className="bg-green-600 hover:bg-green-700 w-full"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Draw New Field
                    </Button>
                </div>

                {/* Field List */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Your Fields ({fields.length})</CardTitle>
                        <div className="relative mt-2">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                                placeholder="Search fields..." 
                                className="pl-8 h-9"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-4 text-gray-500">Loading...</div>
                        ) : fields.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                <p>No fields found</p>
                                <p className="text-sm">Draw your first field to get started.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {filteredFields.map((field) => (
                                    <div
                                        key={field.id}
                                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                        selectedField?.id === field.id
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                        onClick={() => onSelectField(field)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-sm truncate">{field.field_name}</div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {field.acres ? `${field.acres} acres` : 'Area unknown'}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteField(field.id);
                                                }}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Selected Field Details */}
                {selectedField && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Field Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div>
                            <Label className="font-medium">Name</Label>
                            <div>{selectedField.field_name}</div>
                        </div>
                        <div>
                            <Label className="font-medium">Area</Label>
                            <div>{selectedField.acres ? `${selectedField.acres} acres` : 'Unknown'}</div>
                        </div>
                        <div>
                            <Label className="font-medium">Data Source</Label>
                            <div className="capitalize">{selectedField.data_source?.replace('_', ' ') || 'Unknown'}</div>
                        </div>
                    </CardContent>
                </Card>
                )}

                {/* Import Options */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Import Options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="outline" className="w-full justify-start" onClick={handleShapefileImport}>
                            <Upload className="w-4 h-4 mr-2" /> Import Shapefile
                            <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={handleClaimPublicBoundary}>
                            <Database className="w-4 h-4 mr-2" /> Claim Public Boundary
                            <Badge variant="secondary" className="ml-auto text-xs">Soon</Badge>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}