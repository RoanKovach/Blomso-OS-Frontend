import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Loader2, User as UserIcon, ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        full_name: '',
        company_or_farm_name: '',
        address: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const currentUser = await User.me();
                setUser(currentUser);
                setFormData({
                    full_name: currentUser.full_name || '',
                    company_or_farm_name: currentUser.company_or_farm_name || '',
                    address: currentUser.address || ''
                });
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                toast.error("Could not load your profile data.");
            }
            setIsLoading(false);
        };
        fetchUser();
    }, []);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updatedUser = await User.updateMyUserData(formData);
            setUser(updatedUser);
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error("Failed to update profile:", error);
            toast.error("Failed to save your profile. Please try again.");
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <Skeleton className="w-10 h-10" />
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <Skeleton className="w-full h-96" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(createPageUrl("Dashboard"))}
                        className="border-green-200 hover:bg-green-100"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-green-900">My Profile</h1>
                        <p className="text-green-700 mt-1">Manage your personal and farm information</p>
                    </div>
                </div>

                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-green-900">
                            <UserIcon className="w-6 h-6 text-green-600" />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Update your personal details and farm information below.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSave}>
                        <CardContent className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={handleInputChange}
                                        placeholder="Your full name"
                                        className="text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="company_or_farm_name">Company / Farm Name</Label>
                                    <Input
                                        id="company_or_farm_name"
                                        value={formData.company_or_farm_name}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Green Acre Farms"
                                        className="text-lg"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Input
                                    id="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="123 Farm Road, Greenfield"
                                    className="text-lg"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input id="email" value={user.email} disabled className="bg-gray-50" />
                                    <p className="text-xs text-gray-500">Your email is managed by your login provider and cannot be changed here.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="user_id">User ID</Label>
                                    <Input id="user_id" value={user.id} disabled className="bg-gray-50 font-mono text-sm" />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col md:flex-row justify-between items-center bg-gray-50/50 py-6 px-6 rounded-b-lg gap-4">
                            <div className="order-2 md:order-1">
                                {user && user.updated_date && (
                                    <p className="text-sm text-gray-500">
                                        Last updated: {format(new Date(user.updated_date), "dd MMM yyyy 'at' HH:mm")}
                                    </p>
                                )}
                            </div>
                            <Button type="submit" disabled={isSaving} className="order-1 md:order-2 bg-green-600 hover:bg-green-700">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}