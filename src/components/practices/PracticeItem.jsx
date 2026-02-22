import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Sprout,
    MapPin,
    DollarSign,
    Pencil,
    Trash2,
    CheckCircle2,
    Clock,
    MoreVertical
} from "lucide-react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const typeInfo = {
  fertilizer_application: { icon: Sprout, color: "bg-green-100 text-green-800" },
  cover_crop: { icon: Sprout, color: "bg-lime-100 text-lime-800" },
  tillage: { icon: MapPin, color: "bg-orange-100 text-orange-800" },
  biological_input: { icon: Sprout, color: "bg-blue-100 text-blue-800" },
  lime_application: { icon: MapPin, color: "bg-yellow-100 text-yellow-800" },
  compost: { icon: Sprout, color: "bg-amber-100 text-amber-800" },
  crop_rotation: { icon: MapPin, color: "bg-purple-100 text-purple-800" },
  other: { icon: Sprout, color: "bg-gray-100 text-gray-800" },
};

export default function PracticeItem({ practice, onStatusChange, onDelete, onEdit, soilTests }) {
    const info = typeInfo[practice.practice_type] || typeInfo.other;
    const Icon = info.icon;
    const fieldName = soilTests.find(st => st.id === practice.soil_test_id)?.field_name || "Unassigned";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
            layout
        >
            <Card className={`border-l-4 ${practice.completed ? 'border-green-500' : 'border-amber-500'} bg-white hover:shadow-lg transition-all duration-300`}>
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center ${info.color}`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className={`font-bold text-lg ${practice.completed ? 'text-gray-500 line-through' : 'text-green-900'}`}>
                                {practice.practice_name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {fieldName}</div>
                                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {format(new Date(practice.application_date), "MMM d, yyyy")}</div>
                                <div className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> ${practice.cost_per_acre?.toFixed(2) || '0.00'}/acre</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 self-end md:self-center">
                        <Badge className={`${info.color} border capitalize`}>
                            {practice.practice_type.replace(/_/g, ' ')}
                        </Badge>
                        <Badge variant={practice.completed ? "default" : "secondary"} className={practice.completed ? 'bg-green-600' : 'bg-amber-100 text-amber-800 border-amber-200'}>
                            {practice.completed ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <Clock className="w-3.5 h-3.5 mr-1.5" />}
                            {practice.completed ? 'Completed' : 'Pending'}
                        </Badge>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-5 h-5" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onStatusChange(practice, !practice.completed)}>
                                    {practice.completed ? <Clock className="w-4 h-4 mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                    Mark as {practice.completed ? 'Pending' : 'Completed'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onEdit(practice)}>
                                    <Pencil className="w-4 h-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onDelete(practice.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}