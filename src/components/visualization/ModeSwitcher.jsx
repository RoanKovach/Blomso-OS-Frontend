import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye, Pencil, BarChart2 } from "lucide-react";

export default function ModeSwitcher({ currentMode, onModeChange }) {
  const modes = [
    { name: 'view', label: 'View', icon: Eye },
    { name: 'draw', label: 'Draw', icon: Pencil },
    { name: 'analyze', label: 'Analyze', icon: BarChart2, disabled: true },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-1 flex items-center gap-1 border border-gray-200">
      {modes.map(mode => (
        <Button
          key={mode.name}
          variant={currentMode === mode.name ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => onModeChange(mode.name)}
          disabled={mode.disabled}
          className={`flex items-center gap-2 px-3 py-1 h-8 transition-colors rounded-md ${
            currentMode === mode.name
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          title={mode.disabled ? `${mode.label} (Coming Soon)`: mode.label}
        >
          <mode.icon className="w-4 h-4" />
          <span className="hidden sm:inline">{mode.label}</span>
        </Button>
      ))}
    </div>
  );
}