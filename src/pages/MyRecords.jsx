import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, Beaker, Tractor } from "lucide-react";

import SoilTestsTab from "../components/myrecords/SoilTestsTab";
import PracticesTab from "../components/myrecords/PracticesTab";

export default function MyRecordsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-amber-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-green-900 mb-2 flex items-center gap-3">
                            <Database className="w-8 h-8" />
                            My Records
                        </h1>
                        <p className="text-green-700 text-lg">
                            View, manage, and export all your farm data.
                        </p>
                    </div>
                </div>

                <Tabs defaultValue="soil_tests" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="soil_tests">
                            <Beaker className="w-4 h-4 mr-2" />
                            Soil Tests
                        </TabsTrigger>
                        <TabsTrigger value="practices">
                            <Tractor className="w-4 h-4 mr-2" />
                            Practices
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="soil_tests" className="mt-6">
                        <SoilTestsTab />
                    </TabsContent>
                    <TabsContent value="practices" className="mt-6">
                        <PracticesTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}