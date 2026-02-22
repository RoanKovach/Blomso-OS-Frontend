import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import SoilTestRecordPicker from "./SoilTestRecordPicker";
import { ArrowLeftRight, Upload, TrendingUp, TrendingDown } from "lucide-react";
import { SoilTest } from "@/api/entities";

const NUMERIC_KEYS = [
  "ph","organic_matter","nitrogen","phosphorus","potassium","calcium","magnesium","sulfur","cec","base_saturation","iron","zinc","manganese","copper","boron"
];

function diffTwoTests(a, b) {
  if (!a || !b) return null;
  const d = { deltas: [], meta: {} };
  d.meta.fieldMatch = a.field_name && b.field_name && a.field_name === b.field_name;
  d.meta.aDate = a.test_date || a.updated_date || a.created_date;
  d.meta.bDate = b.test_date || b.updated_date || b.created_date;

  const sa = a.soil_data || {};
  const sb = b.soil_data || {};
  NUMERIC_KEYS.forEach(k => {
    const va = typeof sa[k] === "number" ? sa[k] : null;
    const vb = typeof sb[k] === "number" ? sb[k] : null;
    if (va === null && vb === null) return;
    const delta = (vb ?? 0) - (va ?? 0);
    d.deltas.push({ key: k, a: va, b: vb, delta });
  });
  return d;
}

export default function WhatChangedTool() {
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);

  // Fetch selected test objects when IDs change
  useEffect(() => {
    let canceled = false;
    async function loadSelected() {
      if (selectedIds.length === 0) {
        setSelectedTests([]);
        return;
      }
      // Try to resolve from DB first; fall back to sessionStorage for demo users
      const map = new Map();
      try {
        const results = await SoilTest.filter({ id: selectedIds }, "-updated_date", 2);
        results.forEach(r => map.set(r.id, r));
      } catch {
        // ignore; RLS or anon
      }
      if (map.size < selectedIds.length) {
        const guest = sessionStorage.getItem("guestSoilTests");
        if (guest) {
          JSON.parse(guest).forEach(t => {
            if (selectedIds.includes(t.id)) map.set(t.id, t);
          });
        }
      }
      const ordered = selectedIds.map(id => map.get(id)).filter(Boolean);
      if (!canceled) setSelectedTests(ordered);
    }
    loadSelected();
    return () => { canceled = true; };
  }, [selectedIds]);

  const diff = useMemo(() => {
    if (selectedTests.length !== 2) return null;
    return diffTwoTests(selectedTests[0], selectedTests[1]);
  }, [selectedTests]);

  return (
    <div className="space-y-4">
      <SoilTestRecordPicker onChange={setSelectedIds} />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Comparison summary
          </CardTitle>
          <Link to={createPageUrl("Upload")}>
            <Button variant="outline" className="gap-2">
              <Upload className="w-4 h-4" />
              Upload new soil test
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {!diff ? (
            <div className="text-gray-500 text-sm">
              Select two records to see what changed across soil metrics.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={diff.meta.fieldMatch ? "default" : "outline"}>
                  {diff.meta.fieldMatch ? "Same field" : "Different fields"}
                </Badge>
                {selectedTests.map((t, i) => (
                  <Badge key={t.id} variant="outline">
                    {i === 0 ? "A:" : "B:"} {t.field_name || "Untitled"} {t.test_date ? `• ${t.test_date}` : ""}
                  </Badge>
                ))}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {diff.deltas.map(({ key, a, b, delta }) => {
                  const up = delta > 0;
                  const down = delta < 0;
                  const neutral = delta === 0 || isNaN(delta);
                  return (
                    <Card key={key} className="border-gray-200">
                      <CardContent className="p-3">
                        <div className="text-xs text-gray-500 uppercase tracking-wide">{key.replace(/_/g, " ")}</div>
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-sm text-gray-700">
                            A: {a ?? "—"}
                          </div>
                          <div className="text-sm text-gray-700">
                            B: {b ?? "—"}
                          </div>
                        </div>
                        <div className={`mt-2 text-sm font-medium flex items-center gap-1 ${up ? "text-emerald-700" : down ? "text-red-600" : "text-gray-600"}`}>
                          {up && <TrendingUp className="w-4 h-4" />}
                          {down && <TrendingDown className="w-4 h-4" />}
                          {neutral && <span className="w-4 h-4 inline-block" />}
                          Δ {isNaN(delta) ? "—" : delta.toFixed(2)}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}