import React from 'react';
import { Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Define the map layers available
export const MapLayers = {
  satellite: {
    name: 'Satellite',
    url: 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  hybrid: {
    name: 'Hybrid',
    url: 'https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',
    attribution: '&copy; Google Maps',
    subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
  },
  street: {
    name: 'Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
};

export default function LayerControl({ currentLayer, onLayerChange }) {
  return (
    <div className="absolute bottom-4 right-4 z-[1000]">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="shadow-lg">
            <Layers className="w-4 h-4 mr-2" />
            Layers
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value={currentLayer} onValueChange={onLayerChange}>
            {Object.entries(MapLayers).map(([key, layer]) => (
              <DropdownMenuRadioItem key={key} value={key}>
                {layer.name}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}