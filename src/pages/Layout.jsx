

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User } from "@/api/entities";
import { 
  LayoutDashboard,
  Upload, 
  Map, 
  BrainCircuit, 
  LogOut,
  Database,
  User as UserIcon,
  MapPin 
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/sonner";
import 'leaflet/dist/leaflet.css'; // Globally import Leaflet CSS to fix map rendering
import { useTracking } from '@/components/analytics/useTracking';
import AppErrorBoundary from '@/components/error/AppErrorBoundary';
import { ConnectionStatusBanner } from '@/components/ui/ConnectionStatusBanner';

const navigationItems = [
  { name: "Dashboard", href: "Dashboard", icon: LayoutDashboard },
  { name: "Upload Data", href: "Upload", icon: Upload },
  { name: "Field Visualization", href: "FieldVisualization", icon: Map },
  { name: "My Records", href: "MyRecords", icon: Database },
  { name: "AI Recommendations", href: "Recommendations", icon: BrainCircuit },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const { trackPageView } = useTracking();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
      } catch (error) {
        console.error("User not authenticated", error);
      }
    };
    fetchUser();
  }, [location]);

  // Track page views
  useEffect(() => {
    if (currentPageName) {
      trackPageView(currentPageName, {
        is_authenticated: !!user,
        user_type: user?.email?.includes('demo') ? 'demo' : user ? 'authenticated' : 'anonymous'
      });
    }
  }, [currentPageName, user, trackPageView]);

  return (
    <SidebarProvider>
      <AppErrorBoundary>
        <div className="min-h-screen flex w-full bg-gray-50">
          <Sidebar className="border-r border-gray-200 bg-white">
            <SidebarHeader>
              <Link to={createPageUrl("Dashboard")} className="flex items-center justify-center p-4">
                <img 
                  src="/logo.svg" 
                  alt="Blomso Logo" 
                  className="h-10 w-auto" 
                />
              </Link>
            </SidebarHeader>
            
            <SidebarContent className="p-4 flex flex-col justify-between">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.name}>
                        <Link to={item.disabled ? "#" : createPageUrl(item.href)}>
                          <SidebarMenuButton
                            isActive={currentPageName === item.href}
                            disabled={item.disabled}
                            className="flex items-center gap-3"
                          >
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                          </SidebarMenuButton>
                        </Link>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-200 p-4">
              <Link 
                to={createPageUrl("Profile")} 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                <Avatar>
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback>{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{user?.full_name || "User"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email || "user@email.com"}</p>
                </div>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => User.logout()} className="mt-2 w-full justify-start">
                <LogOut className="w-4 h-4 mr-2 text-gray-500"/>
                Sign Out
              </Button>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col">
            <header className="lg:hidden p-4 border-b bg-white">
              <SidebarTrigger />
            </header>

            {/* Connection Status Banner */}
            <ConnectionStatusBanner />

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </AppErrorBoundary>
    </SidebarProvider>
  );
}

