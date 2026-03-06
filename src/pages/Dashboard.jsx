
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Zap,
  FlaskConical,
  Loader2,
  FileText,
  Download
} from "lucide-react";
import { useTracking } from '@/components/analytics/useTracking';

import MiniToolsSection from "../components/dashboard/MiniToolsSection";
import { SoilTest } from "@/api/entities";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

const HeroSection = () => {
  const { trackUserAction } = useTracking();

  const handleGetStarted = () => {
    trackUserAction('hero_cta_clicked', {
      button_text: 'Start Analysis',
      page: 'Dashboard'
    });
  };

  const handleFeedbackClick = (type) => {
    trackUserAction('external_link_clicked', {
      link_type: type,
      destination: type === 'roadmap' ? 'featurebase_roadmap' : 'featurebase_feedback'
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/10 via-yellow-300/10 to-green-300/10 p-8 mb-8 border border-black/5">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-emerald-500/5 to-transparent -z-10" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-t from-yellow-300/5 to-transparent -z-10" />
      
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.svg" 
              alt="Blomso Logo" 
              className="h-12 w-auto"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div className="bg-yellow-200/50 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
              <Zap className="h-3 w-3" />
              Demo Mode
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-800">
            Transform Your Soil Data into <span className="text-emerald-600">Actionable Insights</span>
          </h1>
          <p className="text-lg text-gray-600">
            Explore this demo application for soil health analysis. Upload your own data or try our sample datasets to see how AI can help with agricultural insights.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link to={createPageUrl("Upload")}>
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-emerald-600 to-green-500 text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto"
                  onClick={handleGetStarted}
                >
                    Start Analysis
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <div className="flex gap-2">
                <a href="https://blomso.featurebase.app/roadmap" target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:text-blue-700"
                    onClick={() => handleFeedbackClick('roadmap')}
                  >
                    🗺️ Roadmap
                  </Button>
                </a>
                <a href="https://blomso.featurebase.app/" target="_blank" rel="noopener noreferrer">
                  <Button 
                    variant="ghost" 
                    className="text-gray-600 hover:text-blue-700"
                    onClick={() => handleFeedbackClick('feedback')}
                  >
                    💬 Feedback
                  </Button>
                </a>
              </div>
          </div>
        </div>
        
        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md lg:max-w-lg">
            <img 
              src="/logo.svg" 
              alt="Smart Farming Technology Illustration" 
              className="w-full h-auto rounded-lg shadow-lg object-cover"
              style={{ aspectRatio: '4/3' }}
              onError={(e) => {
                console.error('Failed to load hero image');
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiCiAgICAgICAgICAgICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgICAgICAgICAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGM0Y0RjYiLz4KICAgICAgICAgICAgPHBhdGggZD0iTTIxMi41IDE1MEwxODcuNSAxMjVIMjM3LjVMMjEyLjUgMTUwWiIgZmlsbD0iIjlDQTM1Ii8+CiAgICAgICAgICAgIDxwPgoKICAgICAgICAgICAgPC9wPgoKICAgICAgICAgICAgPHRleHQgeD0iMjAwIiB5PSIxODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjcyODAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHR9IjUwMCI+U21hcnQgRmFybWluZyBJbGx1c3RyYXRpb248L3RleHQ+Cjwvc3ZnPgo=';
              }}
              onLoad={() => {
                console.log('Hero image loaded successfully');
              }}
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
    }
  ];

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center">
            <FlaskConical className="w-6 h-6 text-gray-600" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Don't have a soil test?
            </h2>
            <p className="text-gray-600">
              Download a sample PDF to try our AI analysis on the <Link to={createPageUrl("Upload")} className="text-emerald-600 font-medium hover:underline">Upload Data page</Link>.
            </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sampleFiles.map((file, index) => (
          <a 
            key={index}
            href={file.url}
            download={file.name}
            className="group flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 transition-all duration-200"
          >
            <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span className="flex-1 font-medium text-gray-700 group-hover:text-emerald-800 text-sm truncate">
              {file.name}
            </span>
            <Download className="w-4 h-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
          </a>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  return (
    <div className="p-4 md:p-8 bg-gray-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <HeroSection />
        
        <MiniToolsSection />
        
        <div className="mt-12">
          <DemoSection />
        </div>
        
        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Blomso. Powered by <a href="https://blomso.com" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Blomso.com</a>.</p>
        </footer>
      </div>
    </div>
  );
}
