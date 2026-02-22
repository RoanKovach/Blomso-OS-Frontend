import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRACTICE_TYPES = [
    "fertilizer_application", "cover_crop", "tillage", "biological_input", 
    "lime_application", "compost", "crop_rotation", "other"
];

export default function PracticeFilters({ onFilterChange }) {
    const [status, setStatus] = React.useState("all");
    const [type, setType] = React.useState("all");

    const handleFilterChange = (filterType, value) => {
        let newStatus = status;
        let newType = type;

        if (filterType === "status") {
            setStatus(value);
            newStatus = value;
        }
        if (filterType === "type") {
            setType(value);
            newType = value;
        }
        onFilterChange({ status: newStatus, type: newType });
    };

    return (
        <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
                <Select value={status} onValueChange={(value) => handleFilterChange("status", value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by status..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex-1">
                <Select value={type} onValueChange={(value) => handleFilterChange("type", value)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Filter by type..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {PRACTICE_TYPES.map(type => (
                            <SelectItem key={type} value={type}>
                                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}