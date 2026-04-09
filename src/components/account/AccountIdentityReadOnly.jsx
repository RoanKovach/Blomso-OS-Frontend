import React from "react";
import { Label } from "@/components/ui/label";
import { pickMeIdentity } from "@/utils/meIdentity";
import { cn } from "@/lib/utils";

function IdentityRow({ label, value, mono = false }) {
    const display = value != null && String(value).trim() !== "" ? String(value).trim() : "—";
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
            <p
                className={cn(
                    "text-sm text-foreground",
                    mono && "break-all font-mono text-xs",
                )}
            >
                {display}
            </p>
        </div>
    );
}

/**
 * Read-only account identity from GET /me payload.
 */
export default function AccountIdentityReadOnly({ me, className }) {
    const idn = pickMeIdentity(me);
    if (!idn) return null;

    return (
        <div className={cn("grid gap-6 sm:grid-cols-2", className)}>
            <IdentityRow label="First name" value={idn.firstName} />
            <IdentityRow label="Last name" value={idn.lastName} />
            <div className="sm:col-span-2">
                <IdentityRow label="Full name" value={idn.fullName} />
            </div>
            <div className="sm:col-span-2">
                <IdentityRow label="Email" value={idn.email} />
            </div>
            <div className="sm:col-span-2">
                <IdentityRow label="User ID" value={idn.userId} mono />
            </div>
        </div>
    );
}
