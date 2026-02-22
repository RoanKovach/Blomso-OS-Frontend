import React, { useEffect, useMemo, useState, useCallback } from "react";
import { SoilTest } from "@/api/entities";
import { User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeftRight, Wand2 } from "lucide-react";
import { format } from "date-fns";

function itemMatchesQuery(item, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  return (
    (item.field_name || "").toLowerCase().includes(s) ||
    (item.zone_name || "").toLowerCase().includes(s) ||
    (item.crop_type || "").toLowerCase().includes(s)
  );
}

function autoSelectSmart(tests) {
  if (!tests || tests.length === 0) return [];
  // Prefer: latest two within same field_name; else latest two overall (by test_date or updated_date)
  const byField = tests.reduce((acc, t) => {
    const key = (t.field_name || "Unknown").toLowerCase();
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});
  for (const key of Object.keys(byField)) {
    if (byField[key].length >= 2) {
      const sorted = [...byField[key]].sort((a, b) => {
        const da = new Date(a.test_date || a.updated_date || a.created_date || 0).getTime();
        const db = new Date(b.test_date || b.updated_date || b.created_date || 0).getTime();
        return db - da;
      });
      return [sorted[0].id, sorted[1].id];
    }
  }
  const overall = [...tests].sort((a, b) => {
    const da = new Date(a.test_date || a.updated_date || a.created_date || 0).getTime();
    const db = new Date(b.test_date || b.updated_date || b.created_date || 0).getTime();
    return db - da;
  });
  return overall.slice(0, 2).map(t => t.id);
}

export default function SoilTestRecordPicker({
  onChange,
  initialSelectedIds = [],
  className = ""
}) {
  const [allTests, setAllTests] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(initialSelectedIds.slice(0, 2));
  const [isLoading, setIsLoading] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        let me;
        try {
          me = await User.me();
          setIsAnonymous(false);
        } catch {
          setIsAnonymous(true);
        }

        if (me) {
          // Only the user's own records are visible due to RLS
          const tests = await SoilTest.list("-updated_date", 200);
          setAllTests(tests || []);
        } else {
          // Guest/demo: read from sessionStorage if present
          const guest = sessionStorage.getItem("guestSoilTests");
          setAllTests(guest ? JSON.parse(guest) : []);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // Smart fill once on load (if nothing preselected)
  useEffect(() => {
    if (!isLoading && selected.length === 0 && allTests.length) {
      const auto = autoSelectSmart(allTests);
      setSelected(auto);
      onChange?.(auto);
    }
  }, [isLoading, allTests, selected.length, onChange]);

  const filtered = useMemo(() => {
    return (allTests || []).filter(t => itemMatchesQuery(t, query));
  }, [allTests, query]);

  const toggle = useCallback((id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        const next = prev.filter(x => x !== id);
        onChange?.(next);
        return next;
      }
      if (prev.length >= 2) {
        const next = [prev[1], id];
        onChange?.(next);
        return next;
      }
      const next = [...prev, id];
      onChange?.(next);
      return next;
    });
  }, [onChange]);

  const smartFill = () => {
    const auto = autoSelectSmart(filtered.length ? filtered : allTests);
    setSelected(auto);
    onChange?.(auto);
  };

  const selectedSet = new Set(selected);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="flex items-center justify-between">
          <span>Select two soil tests to compare</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={smartFill} className="gap-2">
              <Wand2 className="w-4 h-4" /> Smart Fill
            </Button>
          </div>
        </CardTitle>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by field, zone, or crop…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-gray-500 text-sm">Loading your records…</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-sm">
            {isAnonymous
              ? "No demo records found. Upload a soil test to compare."
              : "No soil tests found. Upload a soil test to compare."}
          </div>
        ) : (
          <div className="max-h-80 overflow-auto divide-y">
            {filtered.map((t) => {
              const d = t.test_date ? new Date(t.test_date) : (t.updated_date ? new Date(t.updated_date) : null);
              const dateStr = d ? format(d, "MMM d, yyyy") : "N/A";
              const active = selectedSet.has(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggle(t.id)}
                  className={`w-full text-left p-3 hover:bg-emerald-50 flex items-center justify-between gap-3 ${active ? "bg-emerald-50 ring-1 ring-emerald-200" : ""}`}
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{t.field_name || "Untitled field"}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{dateStr}</span>
                      {t.crop_type && <span className="mx-1">•</span>}
                      {t.crop_type && <span>{t.crop_type}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{t.soil_health_index ?? "—"}</Badge>
                    {active && (
                      <Badge className="bg-emerald-600">Selected</Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-3">
          <Badge variant="outline" className="gap-1">
            <ArrowLeftRight className="w-3 h-3" /> {selected.length}/2 selected
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}