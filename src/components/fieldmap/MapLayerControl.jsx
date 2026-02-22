import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Layers } from "lucide-react";

export default function MapLayerControl({ layers, activeLayer, onLayerChange }) {
    return (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm relative">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900">
                    <Layers className="w-5 h-5" />
                    Map Layers
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <Label htmlFor="layer-select" className="text-sm font-medium text-green-700">
                        Data Overlay
                    </Label>
                    <Select value={activeLayer} onValueChange={onLayerChange}>
                        <SelectTrigger id="layer-select">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {layers.map(layer => (
                                <SelectItem key={layer.value} value={layer.value}>{layer.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="mt-4 bg-white/90 rounded-lg p-3">
                      <h4 className="font-semibold text-green-900 mb-2 text-sm">Data Legend</h4>
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#f03b20'}}></div>
                          <span>Low</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#feb24c'}}></div>
                          <span>Mid</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#4add8c'}}></div>
                          <span>High</span>
                        </div>
                      </div>
                    </div>
            </CardContent>
        </Card>
    );
}