import React, { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { User as UserIcon } from "lucide-react";
import AccountIdentityReadOnly from "@/components/account/AccountIdentityReadOnly";

export default function ProfilePanel() {
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
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <UserIcon className="h-6 w-6" /> Account
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none bg-white/80 shadow-lg backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-green-900">
                    <UserIcon className="h-6 w-6 text-green-600" />
                    Account
                </CardTitle>
                <CardDescription>Read-only identity from GET /me.</CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
                {me ? (
                    <AccountIdentityReadOnly me={me} />
                ) : (
                    <p className="text-sm text-muted-foreground">No account data loaded.</p>
                )}
            </CardContent>
        </Card>
    );
}
