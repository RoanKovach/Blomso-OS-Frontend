import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";

const SECTION_COPY = {
    filters: "Filter lists by field, document family, crop, or status.",
    incoming: "Uploads appear here first. Use Review to run the extraction workflow.",
    saved: "Structured records, Standard vs Data Sheet, and CSV export.",
    soil: "Expand a row for details and to change linked field. Standard is the default view.",
    yield: "Expand a row for ticket details. Field reassignment for yield tickets is not available yet.",
};

export function SectionHelpHint({ section }) {
    const text = SECTION_COPY[section];
    if (!text) return null;
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-slate-500 hover:text-slate-800"
                    aria-label={`Help: ${section}`}
                >
                    <HelpCircle className="h-4 w-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3 text-sm text-slate-700" align="end" sideOffset={6}>
                {text}
            </PopoverContent>
        </Popover>
    );
}

/** Page-level help near My Records title — mental model, dismissible. */
export function MyRecordsWorkflowHelp() {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 gap-1.5 text-slate-600 hover:text-slate-900"
                >
                    <HelpCircle className="h-4 w-4" />
                    Help
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end" sideOffset={8}>
                <p className="mb-2 text-sm font-semibold text-slate-900">How My Records works</p>
                <ul className="list-disc space-y-1.5 pl-4 text-sm text-slate-700">
                    <li>Incoming documents land in the first section.</li>
                    <li>Review and save to create structured records.</li>
                    <li>Standard is the default, trustworthy table view.</li>
                    <li>Data Sheet customizes columns for export or modeling prep.</li>
                </ul>
            </PopoverContent>
        </Popover>
    );
}
