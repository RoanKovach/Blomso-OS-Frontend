
import React, { useState, useEffect, useCallback } from "react";
import { Practice } from "@/api/entities";
import { SoilTest } from "@/api/entities";
import { User } from "@/api/entities";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Edit, Trash2, AlertTriangle, Plus, ListFilter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import ConfirmationModal from "./ConfirmationModal";
import PracticeForm from "../practices/PracticeForm";
import PracticeFilters from "../practices/PracticeFilters";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function PracticesTab() {
    const [practices, setPractices] = useState([]);
    const [soilTests, setSoilTests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [practiceToDelete, setPracticeToDelete] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingPractice, setEditingPractice] = useState(null);
    const [filters, setFilters] = useState({ status: "all", type: "all" });
    const [isDemoUser, setIsDemoUser] = useState(false);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const user = await User.me();
            if (user && user.email && user.email.includes('demo')) {
                setIsDemoUser(true);
            }
            const [userPractices, userTests] = await Promise.all([
                Practice.filter({ created_by: user.email }, "-application_date"),
                SoilTest.filter({ created_by: user.email }, "field_name"),
            ]);
            setPractices(userPractices);
            setSoilTests(userTests);
        } catch (error) {
            console.error("Error loading practices data:", error);
            toast.error("Failed to load your practice records.");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const getFieldName = (testId) => {
        const test = soilTests.find(t => t.id === testId);
        return test ? test.field_name : "N/A";
    };

    const handleSubmit = async (practiceData) => {
        try {
            const dataToSave = { ...practiceData };
            // Tag new practices from demo users as temporary
            if (isDemoUser) {
                const expirationDate = new Date();
                expirationDate.setDate(expirationDate.getDate() + 1); // 24-hour expiration
                dataToSave.is_demo_data = true;
                dataToSave.expires_at = expirationDate.toISOString();
            }

            if (editingPractice) {
                await Practice.update(editingPractice.id, dataToSave);
                toast.success("Practice updated successfully!");
            } else {
                await Practice.create(dataToSave);
                toast.success("Practice logged successfully!");
            }
        } catch (error) {
            console.error("Error saving practice:", error);
            toast.error("Failed to save practice.");
        }
        setShowForm(false);
        setEditingPractice(null);
        await loadData();
    };

    const handleStatusChange = async (practice, completed) => {
        try {
            await Practice.update(practice.id, { completed });
            toast.success(`Practice marked as ${completed ? 'completed' : 'pending'}!`);
            await loadData();
        } catch (error) {
            console.error("Error updating practice status:", error);
            toast.error("Failed to update practice status.");
        }
    };

    const handleEdit = (practice) => {
        setEditingPractice(practice);
        setShowForm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!practiceToDelete) return;
        try {
            await Practice.delete(practiceToDelete.id);
            toast.success("Practice record deleted successfully.");
            await loadData();
        } catch (error) {
            console.error("Error deleting practice:", error);
            toast.error("Failed to delete practice record.");
        }
        setPracticeToDelete(null);
    };

    const filteredPractices = practices.filter(practice => {
        const statusMatch = filters.status === "all" || (filters.status === "completed" && practice.completed) || (filters.status === "pending" && !practice.completed);
        const typeMatch = filters.type === "all" || practice.practice_type === filters.type;
        return statusMatch && typeMatch;
    });

    if (isLoading) {
        return <Skeleton className="w-full h-64" />;
    }

    return (
        <div className="space-y-6">
            {isDemoUser && (
                <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                    <Info className="h-4 w-4 !text-blue-800" />
                    <AlertTitle>Demo Mode</AlertTitle>
                    <AlertDescription>
                        You're in demo mode. Any records you create will be automatically deleted after 24 hours.
                    </AlertDescription>
                </Alert>
            )}
            {/* Header with Add Button */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-green-900">Practice Management</h3>
                    <p className="text-green-700">Log, track, and manage all your agricultural activities.</p>
                </div>
                <Button
                    onClick={() => { setEditingPractice(null); setShowForm(!showForm); }}
                    className="bg-green-600 hover:bg-green-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? "Hide Form" : "Log New Practice"}
                </Button>
            </div>

            {/* Form Animation */}
            <AnimatePresence>
                {showForm && (
                    <PracticeForm
                        practice={editingPractice}
                        soilTests={soilTests}
                        onSubmit={handleSubmit}
                        onCancel={() => { setShowForm(false); setEditingPractice(null); }}
                    />
                )}
            </AnimatePresence>

            {/* Filters */}
            <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-green-900">
                        <ListFilter className="w-5 h-5 text-green-600" />
                        Filter Practices
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <PracticeFilters onFilterChange={setFilters} />
                </CardContent>
            </Card>

            {practices.length === 0 ? (
                <Card className="text-center p-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-800">No Practices Logged</h3>
                    <p className="text-gray-600">You haven't logged any farming practices yet.</p>
                </Card>
            ) : (
                <>
                    {/* Desktop View */}
                    <div className="hidden md:block">
                         {/* This wrapper div makes the table scrollable on smaller viewports */}
                        <div className="overflow-x-auto border rounded-lg bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Practice</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Associated Field</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPractices.map(practice => (
                                        <TableRow key={practice.id}>
                                            <TableCell className="font-medium">{practice.practice_name}</TableCell>
                                            <TableCell>{practice.practice_type.replace(/_/g, ' ')}</TableCell>
                                            <TableCell>{practice.application_date ? format(new Date(practice.application_date), 'MMM d, yyyy') : 'N/A'}</TableCell>
                                            <TableCell>{getFieldName(practice.soil_test_id)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={practice.completed ? "default" : "secondary"}
                                                    className="cursor-pointer"
                                                    onClick={() => handleStatusChange(practice, !practice.completed)}
                                                >
                                                    {practice.completed ? "Completed" : "Pending"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="space-x-2">
                                                <Button variant="ghost" size="icon" disabled>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(practice)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setPracticeToDelete(practice)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {filteredPractices.map(practice => (
                            <Card key={practice.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg">{practice.practice_name}</h3>
                                            <p className="text-sm text-gray-500">{practice.application_date ? format(new Date(practice.application_date), 'MMM d, yyyy') : 'N/A'}</p>
                                        </div>
                                        <Badge
                                            variant={practice.completed ? "default" : "secondary"}
                                            className="cursor-pointer"
                                            onClick={() => handleStatusChange(practice, !practice.completed)}
                                        >
                                            {practice.completed ? "Completed" : "Pending"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm mt-2">Field: {getFieldName(practice.soil_test_id)}</p>
                                    <div className="border-t mt-4 pt-4 flex justify-end space-x-2">
                                        <Button variant="outline" size="sm" disabled>
                                            <Eye className="w-4 h-4 mr-1" /> View
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleEdit(practice)}>
                                            <Edit className="w-4 h-4 mr-1" /> Edit
                                        </Button>
                                        <Button variant="destructive" size="sm" onClick={() => setPracticeToDelete(practice)}>
                                            <Trash2 className="w-4 h-4 mr-1" /> Delete
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </>
            )}

            <ConfirmationModal
                isOpen={!!practiceToDelete}
                onClose={() => setPracticeToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Permanently delete this practice log?"
                description="This will remove the record of this practice. This action cannot be undone."
            />
        </div>
    );
}
