import React from "react";
import { Database } from "lucide-react";

import SoilTestsTab from "../components/myrecords/SoilTestsTab";

export default function MyRecordsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
            <div className="mx-auto max-w-7xl">
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold text-green-900 md:text-4xl">
                            <Database className="h-8 w-8" />
                            My Records
                        </h1>
                        <p className="text-lg text-green-800">
                            All evidence across your fields in one place: incoming documents and uploads up top,{" "}
                            <strong>saved records</strong>, the <strong>customizable data sheet</strong>, and{" "}
                            <strong>export</strong> below.
                        </p>
                        <p className="mt-2 max-w-3xl text-sm text-slate-600">
                            Flow: upload → review → save → structured records appear in Standard or Data Sheet → export CSV.
                        </p>
                    </div>
                </div>

                <SoilTestsTab />
            </div>
        </div>
    );
}
