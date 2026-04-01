import React from "react";
import { Database } from "lucide-react";

import SoilTestsTab from "../components/myrecords/SoilTestsTab";
import { MyRecordsWorkflowHelp } from "../components/myrecords/MyRecordsHelp";

export default function MyRecordsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <h1 className="flex items-center gap-3 text-3xl font-bold text-green-900 md:text-4xl">
                        <Database className="h-8 w-8 shrink-0" />
                        My Records
                    </h1>
                    <MyRecordsWorkflowHelp />
                </div>

                <SoilTestsTab />
            </div>
        </div>
    );
}
