import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, MapPin, Calendar, TrendingUp, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function RecentSoilTests({ soilTests, isLoading }) {
  const getHealthBadge = (score) => {
    if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
    if (score >= 60) return "bg-blue-100 text-blue-800 border-blue-200";
    if (score >= 40) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  return (
    <Card className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-green-100">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-green-900">
            <FileText className="w-6 h-6 text-green-600" />
            Recent Soil Tests
          </CardTitle>
          <Link to={createPageUrl("Upload")}>
            <Button variant="outline" className="border-green-200 hover:bg-green-100">
              Upload New Test
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
        ) : soilTests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">No Soil Tests Yet</h3>
            <p className="text-green-700 mb-4">Start by uploading your first soil test to get AI-powered insights.</p>
            <Link to={createPageUrl("Upload")}>
              <Button className="bg-green-600 hover:bg-green-700">
                Upload First Test
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-green-50">
                  <TableHead className="font-semibold text-green-900">Field</TableHead>
                  <TableHead className="font-semibold text-green-900">Test Date</TableHead>
                  <TableHead className="font-semibold text-green-900">Health Score</TableHead>
                  <TableHead className="font-semibold text-green-900">Acres</TableHead>
                  <TableHead className="font-semibold text-green-900">Crop</TableHead>
                  <TableHead className="font-semibold text-green-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soilTests.map((test) => (
                  <TableRow key={test.id} className="hover:bg-green-50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">{test.field_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-green-600" />
                        {format(new Date(test.test_date), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getHealthBadge(test.soil_health_index || 0)} border font-medium`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {test.soil_health_index || 0}/100
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {test.field_size_acres || 0} acres
                    </TableCell>
                    <TableCell>
                      <span className="text-green-800 font-medium">{test.crop_type || "Not specified"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`Recommendations?test_id=${test.id}`)}>
                          <Button variant="outline" size="sm" className="border-green-200 hover:bg-green-100">
                            View AI Report
                          </Button>
                        </Link>
                        {test.raw_file_url && (
                          <a href={test.raw_file_url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}