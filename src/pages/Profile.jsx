import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { User as UserIcon, ArrowLeft } from "lucide-react";
import AccountIdentityReadOnly from "@/components/account/AccountIdentityReadOnly";

export default function ProfilePage() {
    const navigate = useNavigate();
    const [me, setMe] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoading(true);
            try {
                const current = await User.me();
                if (!cancelled) setMe(current);
            } catch (error) {
                console.error("Failed to fetch user data:", error);
                if (!cancelled) {
                    setMe(null);
                    toast.error("Could not load your account from the server.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8 flex items-center gap-4">
                        <Skeleton className="h-10 w-10" />
                        <div>
                            <Skeleton className="mb-2 h-8 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
            <div className="mx-auto max-w-4xl">
                <div className="mb-8 flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate(createPageUrl("Dashboard"))}
                        className="border-green-200 hover:bg-green-100"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-green-900 md:text-3xl">Account</h1>
                        <p className="mt-1 text-green-800">
                            Signed-in identity from your auth provider (GET /me). This page is read-only.
                        </p>
                    </div>
                </div>

                <Card className="border-none bg-white/80 shadow-xl backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-green-900">
                            <UserIcon className="h-6 w-6 text-green-600" />
                            Your identity
                        </CardTitle>
                        <CardDescription>
                            Values come from the API. If first or last name is empty, your provider may not include those
                            claims in the token yet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8">
                        {me ? (
                            <AccountIdentityReadOnly me={me} />
                        ) : (
                            <p className="text-sm text-muted-foreground">No account data loaded.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
