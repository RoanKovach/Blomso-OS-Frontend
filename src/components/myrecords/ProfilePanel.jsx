import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Save, Loader2, User as UserIcon } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePanel() {
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
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <UserIcon className="w-6 h-6" /> My Profile
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
                <CardFooter>
                    <Skeleton className="h-10 w-24" />
                </CardFooter>
            </Card>
        );
    }
    
    return (
        <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-green-900">
                    <UserIcon className="w-6 h-6 text-green-600" />
                    My Profile
                </CardTitle>
                <CardDescription>Manage your personal and farm information.</CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                placeholder="Your full name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company_or_farm_name">Company / Farm Name</Label>
                            <Input
                                id="company_or_farm_name"
                                value={formData.company_or_farm_name}
                                onChange={handleInputChange}
                                placeholder="e.g., Green Acre Farms"
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
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" value={user.email} disabled />
                            <p className="text-xs text-gray-500">Your email is managed by your login provider and cannot be changed here.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="user_id">User ID</Label>
                            <Input id="user_id" value={user.id} disabled />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center bg-gray-50/50 py-4 px-6 rounded-b-lg">
                    <Button type="submit" disabled={isSaving}>
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
                    {user && user.updated_date && (
                        <p className="text-sm text-gray-500">
                            Last updated: {format(new Date(user.updated_date), "dd MMM yyyy 'at' HH:mm")}
                        </p>
                    )}
                </CardFooter>
            </form>
        </Card>
    );
}