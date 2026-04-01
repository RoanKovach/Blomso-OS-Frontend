import React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePersistedCollapsible } from "./usePersistedCollapsible";
import { SectionHelpHint } from "./MyRecordsHelp";

/**
 * Consistent collapsible section for My Records (persisted open state).
 */
export default function RecordsCollapsible({
    storageKey,
    defaultOpen = true,
    title,
    sectionHelp,
    children,
    className,
    contentClassName,
    nested = false,
}) {
    const [open, setOpen] = usePersistedCollapsible(storageKey, defaultOpen);

    return (
        <Collapsible open={open} onOpenChange={setOpen} className={cn("space-y-2", className)}>
            <div
                className={cn(
                    "flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white/70 px-2 py-2 sm:px-3",
                    nested && "border-slate-200/60 bg-slate-50/70"
                )}
            >
                <CollapsibleTrigger asChild>
                    <button
                        type="button"
                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-0.5 text-left text-green-900"
                    >
                        <ChevronDown
                            className={cn(
                                "h-4 w-4 shrink-0 text-slate-600 transition-transform",
                                open ? "rotate-0" : "-rotate-90"
                            )}
                            aria-hidden
                        />
                        <span className={cn("font-semibold leading-tight", nested ? "text-base" : "text-lg")}>
                            {title}
                        </span>
                    </button>
                </CollapsibleTrigger>
                {sectionHelp ? <SectionHelpHint section={sectionHelp} /> : null}
            </div>
            <CollapsibleContent className={cn("space-y-3", contentClassName)}>{children}</CollapsibleContent>
        </Collapsible>
    );
}
