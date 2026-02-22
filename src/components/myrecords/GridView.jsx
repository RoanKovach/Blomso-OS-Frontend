
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Edit, Trash2, ArrowUpDown, Settings2, RotateCcw, Save, X, Info, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import _get from 'lodash/get';
import _set from 'lodash/set';

export default function GridView({ tests, onEdit, onDelete, isDemo = false }) {
    const navigate = useNavigate();
    const [sortField, setSortField] = useState('updated_date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [filters, setFilters] = useState({
        field_name: '',
        crop_type: '',
        date_from: '',
        date_to: ''
    });
    const [editingCell, setEditingCell] = useState(null);
    const [editValue, setEditValue] = useState('');
    const [unsavedChanges, setUnsavedChanges] = useState(new Set());
    const [showUserGuide, setShowUserGuide] = useState(true);

    // Default column order and visibility
    const defaultColumns = [
        { key: 'field_name', label: 'Field Name', sticky: true, editable: true, type: 'text' },
        { key: 'zone_name', label: 'Zone', editable: true, type: 'text' },
        { key: 'test_date', label: 'Test Date', editable: true, type: 'date' },
        { key: 'crop_type', label: 'Crop', editable: true, type: 'text' },
        { key: 'field_size_acres', label: 'Acres', editable: true, type: 'number' },
        { key: 'soil_health_index', label: 'SHI', editable: true, type: 'number' },
        { key: 'soil_data.ph', label: 'pH', editable: true, type: 'number' },
        { key: 'soil_data.organic_matter', label: 'OM %', editable: true, type: 'number' },
        { key: 'soil_data.nitrogen', label: 'N (ppm)', editable: true, type: 'number' },
        { key: 'soil_data.phosphorus', label: 'P (ppm)', editable: true, type: 'number' },
        { key: 'soil_data.potassium', label: 'K (ppm)', editable: true, type: 'number' },
        { key: 'soil_data.calcium', label: 'Ca (ppm)', editable: true, type: 'number' },
        { key: 'soil_data.magnesium', label: 'Mg (ppm)', editable: true, type: 'number' },
        { key: 'soil_data.sulfur', label: 'S (ppm)', editable: true, type: 'number' },
        { key: 'soil_data.cec', label: 'CEC', editable: true, type: 'number' },
        { key: 'summary', label: 'AI Summary', editable: true, type: 'textarea' },
        { key: 'farming_method', label: 'Farming Method', editable: true, type: 'select', options: ['Conventional', 'Organic', 'No-Till', 'Regenerative'] },
        { key: 'irrigation_type', label: 'Irrigation', editable: true, type: 'select', options: ['Dryland', 'Center Pivot', 'Flood', 'Drip', 'Sprinkler'] },
        { key: 'created_date', label: 'Created', editable: false, type: 'date' },
        { key: 'updated_date', label: 'Updated', editable: false, type: 'date' },
        { key: 'actions', label: 'Actions', editable: false, type: 'actions' }
    ];

    // Column order state
    const [columnOrder, setColumnOrder] = useState(() => 
        defaultColumns.map(col => col.key)
    );

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState({
        field_name: true,
        zone_name: true,
        test_date: true,
        crop_type: true,
        field_size_acres: true,
        soil_health_index: true,
        'soil_data.ph': true,
        'soil_data.organic_matter': true,
        'soil_data.nitrogen': true,
        'soil_data.phosphorus': true,
        'soil_data.potassium': true,
        'soil_data.calcium': false,
        'soil_data.magnesium': false,
        'soil_data.sulfur': false,
        'soil_data.cec': false,
        summary: false,
        farming_method: false,
        irrigation_type: false,
        created_date: false,
        updated_date: true,
        actions: true
    });

    // Get ordered columns based on current order
    const getOrderedColumns = () => {
        return columnOrder.map(key => 
            defaultColumns.find(col => col.key === key)
        ).filter(Boolean);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleFilter = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleCellEdit = (testId, field, currentValue) => {
        const column = defaultColumns.find(c => c.key === field);
        if (!column || !column.editable) return;
        
        setEditingCell({ testId, field });
        setEditValue(currentValue || '');
        
        // Mark as unsaved change
        const changeKey = `${testId}-${field}`;
        setUnsavedChanges(prev => new Set([...prev, changeKey]));
    };

    const handleCellSave = async () => {
        if (!editingCell) return;
        
        try {
            // Prepare the update data based on field path
            let updateData = {};
            if (editingCell.field.includes('.')) {
                // Handle nested fields like soil_data.ph
                const [parent, child] = editingCell.field.split('.');
                const test = tests.find(t => t.id === editingCell.testId);
                updateData[parent] = { ...test[parent], [child]: parseFloat(editValue) || editValue };
            } else {
                // Handle top-level fields
                const column = defaultColumns.find(c => c.key === editingCell.field);
                if (column?.type === 'number') {
                    updateData[editingCell.field] = parseFloat(editValue) || 0;
                } else {
                    updateData[editingCell.field] = editValue;
                }
            }
            
            await onEdit(editingCell.testId, updateData);
            
            // Remove from unsaved changes
            const changeKey = `${editingCell.testId}-${editingCell.field}`;
            setUnsavedChanges(prev => {
                const newSet = new Set(prev);
                newSet.delete(changeKey);
                return newSet;
            });
            
            toast.success("Field updated successfully");
        } catch (error) {
            toast.error("Failed to update field");
        }
        setEditingCell(null);
        setEditValue('');
    };

    const handleCellCancel = () => {
        if (editingCell) {
            // Remove from unsaved changes
            const changeKey = `${editingCell.testId}-${editingCell.field}`;
            setUnsavedChanges(prev => {
                const newSet = new Set(prev);
                newSet.delete(changeKey);
                return newSet;
            });
        }
        setEditingCell(null);
        setEditValue('');
    };

    const handleCellKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleCellSave();
        } else if (e.key === 'Escape') {
            handleCellCancel();
        }
    };

    const getCellValue = (test, field) => {
        return _get(test, field);
    };

    const formatCellValue = (value, fieldKey) => {
        if (value === undefined || value === null || value === '') return 'N/A';
        
        const column = defaultColumns.find(c => c.key === fieldKey);

        if (column?.type === 'date') {
            try {
                return format(new Date(value), 'MMM d, yyyy');
            } catch (e) {
                return String(value);
            }
        }
        
        if (fieldKey === 'summary') {
            const strValue = String(value);
            return strValue.length > 50 ? `${strValue.substring(0, 50)}...` : strValue;
        }

        if (column?.type === 'number') {
            const numValue = parseFloat(value);
            return isNaN(numValue) ? 'N/A' : numValue.toFixed(2);
        }
        
        return String(value);
    };

    // Handle column drag and drop in table header
    const handleColumnDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(columnOrder);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        setColumnOrder(items);
        toast.success("Column reordered");
    };

    // Reset column order to default
    const resetColumnOrder = () => {
        setColumnOrder(defaultColumns.map(col => col.key));
        toast.success("Column order reset to default");
    };

    // Apply filters and sorting
    const filteredAndSortedTests = tests
        .filter(test => {
            if (filters.field_name && !test.field_name?.toLowerCase().includes(filters.field_name.toLowerCase())) return false;
            if (filters.crop_type && !test.crop_type?.toLowerCase().includes(filters.crop_type.toLowerCase())) return false;
            if (filters.date_from && test.test_date && new Date(test.test_date) < new Date(filters.date_from)) return false;
            if (filters.date_to && test.test_date && new Date(test.test_date) > new Date(filters.date_to)) return false;
            return true;
        })
        .sort((a, b) => {
            const aValue = getCellValue(a, sortField);
            const bValue = getCellValue(b, sortField);
            
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            if (sortDirection === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });

    const orderedColumns = getOrderedColumns();
    const visibleOrderedColumns = orderedColumns.filter(col => visibleColumns[col.key]);

    const renderEditableCell = (test, col) => {
        const isEditing = editingCell?.testId === test.id && editingCell?.field === col.key;
        const changeKey = `${test.id}-${col.key}`;
        const hasUnsavedChanges = unsavedChanges.has(changeKey);
        const cellValue = getCellValue(test, col.key);

        if (isEditing) {
            if (col.type === 'select' && col.options) {
                return (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Select value={editValue} onValueChange={setEditValue}>
                            <SelectTrigger className="h-8 text-sm border-blue-300">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {col.options.map(option => (
                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCellSave}
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                        >
                            <Save className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCellCancel}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                );
            } else if (col.type === 'textarea') {
                return (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <textarea
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleCellKeyDown}
                            className="w-full h-16 text-sm border border-blue-300 rounded px-2 py-1 resize-none"
                            autoFocus
                        />
                        <div className="flex flex-col gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCellSave}
                                className="h-6 w-6 p-0 text-green-600 hover:bg-green-50"
                            >
                                <Save className="w-3 h-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCellCancel}
                                className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                );
            } else {
                return (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                            type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleCellKeyDown}
                            className="h-8 text-sm border-blue-300"
                            autoFocus
                        />
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCellSave}
                            className="h-8 w-8 p-0 text-green-600 hover:bg-green-50"
                        >
                            <Save className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCellCancel}
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                );
            }
        }

        // Non-editing state
        if (col.type === 'badge') {
            return (
                <Badge className="bg-green-100 text-green-800 cursor-pointer hover:bg-green-200 transition-colors">
                    {formatCellValue(cellValue, col.key)}
                </Badge>
            );
        }

        return (
            <span className={`cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors text-sm ${
                hasUnsavedChanges ? 'bg-orange-50 border-l-4 border-orange-400' : ''
            } ${col.editable ? 'border-b border-dashed border-gray-300 hover:border-blue-400' : ''}`}>
                {formatCellValue(cellValue, col.key)}
            </span>
        );
    };

    return (
        <div className="space-y-4">
            {/* User Guide Alert */}
            {showUserGuide && (
                <Alert className="border-blue-200 bg-blue-50">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <div className="flex justify-between items-start">
                            <div>
                                <strong>💡 Pro Tip:</strong> Click on any cell (except headers) to edit your soil data directly. 
                                Changes are saved automatically. You can also drag column headers to reorder them!
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowUserGuide(false)}
                                className="text-blue-600 hover:bg-blue-100 ml-4"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Filter Bar */}
            <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                <Input
                    placeholder="Filter by field name..."
                    value={filters.field_name}
                    onChange={(e) => handleFilter('field_name', e.target.value)}
                    className="w-48"
                />
                <Input
                    placeholder="Filter by crop..."
                    value={filters.crop_type}
                    onChange={(e) => handleFilter('crop_type', e.target.value)}
                    className="w-48"
                />
                <Input
                    type="date"
                    placeholder="From date"
                    value={filters.date_from}
                    onChange={(e) => handleFilter('date_from', e.target.value)}
                    className="w-36"
                />
                <Input
                    type="date"
                    placeholder="To date"
                    value={filters.date_to}
                    onChange={(e) => handleFilter('date_to', e.target.value)}
                    className="w-36"
                />
                
                {/* Column Management */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline">
                            <Settings2 className="w-4 h-4 mr-2" />
                            Show/Hide Columns
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Column Visibility</h4>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={resetColumnOrder}
                                    className="text-xs"
                                >
                                    <RotateCcw className="w-3 h-3 mr-1" />
                                    Reset Order
                                </Button>
                            </div>
                            
                            {/* Column Visibility */}
                            <div>
                                <h5 className="text-sm font-medium mb-2">Show/Hide Columns</h5>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {defaultColumns.map(col => (
                                        <div key={col.key} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={col.key}
                                                checked={!!visibleColumns[col.key]}
                                                onCheckedChange={(checked) => 
                                                    setVisibleColumns(prev => ({ ...prev, [col.key]: checked }))
                                                }
                                                disabled={col.key === 'field_name' || col.key === 'actions'}
                                            />
                                            <label htmlFor={col.key} className="text-xs cursor-pointer">{col.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    💡 <strong>Tip:</strong> Drag column headers in the table to reorder them!
                                </p>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Desktop Grid View with Enhanced Styling */}
            <div className="hidden md:block">
                <div className="border rounded-lg overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <Table className="border-collapse">
                            <DragDropContext onDragEnd={handleColumnDragEnd}>
                                <Droppable droppableId="table-headers" direction="horizontal">
                                    {(provided) => (
                                        <TableHeader 
                                            className="sticky top-0 bg-gray-50 z-10 border-b-2 border-gray-300"
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                        >
                                            <TableRow>
                                                {visibleOrderedColumns.map((col, index) => (
                                                    <Draggable
                                                        key={col.key}
                                                        draggableId={col.key}
                                                        index={index}
                                                        isDragDisabled={col.key === 'field_name' || col.key === 'actions'}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <TableHead
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`${col.sticky ? 'sticky left-0 bg-gray-50 z-20' : ''} 
                                                                    min-w-24 px-4 py-3 text-left font-semibold text-gray-700 
                                                                    border-r border-gray-300 ${
                                                                    snapshot.isDragging 
                                                                        ? 'bg-blue-100 shadow-2xl border-2 border-blue-400 transform scale-105' 
                                                                        : (col.key === 'field_name' || col.key === 'actions')
                                                                        ? 'cursor-default' 
                                                                        : 'cursor-grab active:cursor-grabbing hover:bg-gray-100'
                                                                } transition-all duration-200 ease-in-out`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-sm">{col.label}</span>
                                                                    {col.key !== 'actions' && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleSort(col.key);
                                                                            }}
                                                                            className="h-auto p-1 ml-auto hover:bg-gray-200"
                                                                        >
                                                                            <ArrowUpDown className="w-3 h-3" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </TableHead>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                            </TableRow>
                                        </TableHeader>
                                    )}
                                </Droppable>
                            </DragDropContext>
                            <TableBody>
                                {filteredAndSortedTests.map((test, rowIndex) => (
                                    <TableRow 
                                        key={test.id} 
                                        className={`
                                            ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} 
                                            hover:bg-blue-50 transition-colors duration-150 border-b border-gray-200
                                        `}
                                    >
                                        {visibleOrderedColumns.map(col => (
                                            <TableCell
                                                key={col.key}
                                                className={`${col.sticky ? 'sticky left-0 z-10' : ''} 
                                                    px-4 py-3 border-r border-gray-200 ${
                                                    col.editable ? 'cursor-pointer hover:bg-yellow-50' : ''
                                                } ${
                                                    editingCell?.testId === test.id && editingCell?.field === col.key
                                                        ? 'bg-blue-100 ring-2 ring-blue-400'
                                                        : col.sticky 
                                                        ? (rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50')
                                                        : ''
                                                } ${
                                                    unsavedChanges.has(`${test.id}-${col.key}`) 
                                                        ? 'bg-orange-50 border-l-4 border-orange-400' 
                                                        : ''
                                                }`}
                                                onClick={() => col.editable && handleCellEdit(test.id, col.key, getCellValue(test, col.key))}
                                            >
                                                {col.key === 'actions' ? (
                                                    <div className="flex space-x-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                navigate(createPageUrl(`Recommendations?test_id=${test.id}`)) 
                                                            }}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                onEdit(test) 
                                                            }}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="destructive"
                                                            size="sm"
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                onDelete(test) 
                                                            }}
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    renderEditableCell(test, col)
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {filteredAndSortedTests.map(test => (
                    <Card key={test.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{test.field_name}</CardTitle>
                                <Badge className="bg-green-100 text-green-800">
                                    {formatCellValue(test.soil_health_index, 'soil_health_index')}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div><strong>Date:</strong> {formatCellValue(test.test_date, 'test_date')}</div>
                                <div><strong>Crop:</strong> {formatCellValue(test.crop_type, 'crop_type')}</div>
                                <div><strong>pH:</strong> {formatCellValue(test.soil_data?.ph, 'soil_data.ph')}</div>
                                <div><strong>OM:</strong> {formatCellValue(test.soil_data?.organic_matter, 'soil_data.organic_matter')}%</div>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(createPageUrl(`Recommendations?test_id=${test.id}`))}
                                >
                                    <Eye className="w-4 h-4 mr-1" /> View
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onEdit(test)}
                                >
                                    <Edit className="w-4 h-4 mr-1" /> Edit
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => onDelete(test)}
                                >
                                    <Trash2 className="w-4 h-4 mr-1" /> Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
