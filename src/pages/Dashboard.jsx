
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Zap,
  FlaskConical,
  FileText,
  Download,
  MapPin,
  Database,
  Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const OrientationSection = () => {
  const { isDemoMode } = useAuth();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-black/5 bg-gradient-to-br from-emerald-600/10 via-yellow-300/10 to-green-300/10 p-8 mb-8">
      <div className="absolute top-0 right-0 -z-10 h-full w-1/3 bg-gradient-to-l from-emerald-500/5 to-transparent" />
      <div className="absolute bottom-0 left-0 -z-10 h-1/2 w-1/2 bg-gradient-to-t from-yellow-300/5 to-transparent" />

      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img
              src="/logo-icon.png"
              alt="Blomso Logo"
              className="h-12 w-auto"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            {isDemoMode && (
              <div className="flex items-center gap-1.5 rounded-full bg-yellow-200/50 px-3 py-1 text-xs font-bold text-yellow-800">
                <Zap className="h-3 w-3" />
                Demo Mode
              </div>
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-800 md:text-4xl">
            Your field evidence workbench
          </h1>
          <p className="text-lg text-gray-600">
            Attach uploads to fields, review and save structured records, then export — all in one place.
            The map supports your fields; fields stay the anchor.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="bg-emerald-700 hover:bg-emerald-800">
              <Link to={createPageUrl("FieldVisualization")} className="inline-flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Open Fields
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-emerald-200 bg-white/80">
              <Link to={createPageUrl("Upload")} className="inline-flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Add data
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link to={createPageUrl("MyRecords")} className="inline-flex items-center gap-2">
                <Database className="h-5 w-5" />
                My Records
              </Link>
            </Button>
          </div>

          <p className="text-sm text-gray-500">
            Optional:{" "}
            <Link to={createPageUrl("Recommendations")} className="font-medium text-emerald-700 underline-offset-2 hover:underline">
              Insights
            </Link>{" "}
            for later-stage analysis when you are ready.
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md lg:max-w-lg">
            <img
              src="/dashboard-hero.png"
              alt="Field and records workflow"
              className="h-auto w-full rounded-lg object-cover shadow-lg"
              style={{ aspectRatio: "4/3" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const DemoSection = () => {
  const sampleFiles = [
    {
      name: "Field 44 - Penn State Soil Test.pdf",
      url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/e13b9ca92_S24-26393.pdf",
    },
    {
      name: "Field 48 - Penn State Soil Test.pdf",
      url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fb9368828_S24-26397.pdf",
    },
    {
      name: "Field 49 - Penn State Soil Test.pdf",
      url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/3d3ab1784_S24-26398.pdf",
    },
    {
      name: "Field 2 - Penn State Soil Test.pdf",
      url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/7ca35b2ef_S24-26347.pdf",
    },
  ];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white/60 p-8 shadow-sm backdrop-blur-sm">
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
          <FlaskConical className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Try a sample soil test</h2>
          <p className="text-gray-600">
            Download a sample PDF and add it on the{" "}
            <Link to={createPageUrl("Upload")} className="font-medium text-emerald-600 hover:underline">
              Add Data
            </Link>{" "}
            page to see the review flow.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {sampleFiles.map((file, index) => (
          <a
            key={index}
            href={file.url}
            download={file.name}
            className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50"
          >
            <FileText className="h-5 w-5 flex-shrink-0 text-red-500" />
            <span className="flex-1 truncate text-sm font-medium text-gray-700 group-hover:text-emerald-800">
              {file.name}
            </span>
            <Download className="h-4 w-4 flex-shrink-0 text-gray-400 transition-colors group-hover:text-emerald-600" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <OrientationSection />

        <DemoSection />

        <footer className="mt-16 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Blomso. Powered by{" "}
            <a
              href="https://blomso.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              Blomso.com
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
