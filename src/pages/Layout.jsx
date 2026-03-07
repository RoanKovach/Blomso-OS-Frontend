

import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getUserDisplayIdentity } from "@/utils/displayIdentity";
import { User } from "@/api/entities";
import { isHostedUiConfigured } from "@/api/auth";
import { useAuth } from "@/contexts/AuthContext";
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
import { toast } from "sonner";
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
  const { user } = useAuth();
  const location = useLocation();
  const { trackPageView } = useTracking();

  // Track page views (guard in case trackPageView is ever not a function)
  useEffect(() => {
    if (currentPageName && typeof trackPageView === 'function') {
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
                  src="/logo-icon.png" 
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

            <SidebarFooter className="border-t border-gray-200 px-3 py-3">
              {user ? (() => {
                const { primary, secondary, initial } = getUserDisplayIdentity(user);
                return (
                  <div className="flex flex-col gap-1">
                    <Link
                      to={createPageUrl("Profile")}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition-colors min-w-0"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={user?.avatar_url} />
                        <AvatarFallback className="text-xs bg-sidebar-accent text-sidebar-accent-foreground">
                          {initial}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">{primary}</p>
                        <p className="text-xs text-muted-foreground truncate">{secondary}</p>
                      </div>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => User.logout()}
                      className="h-8 w-full justify-start text-muted-foreground hover:text-sidebar-foreground"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-2 shrink-0" />
                      Sign out
                    </Button>
                  </div>
                );
              })() : (
                /* Not logged in: always show Sign in button so users can start Hosted UI flow */
                <div className="flex flex-col gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (isHostedUiConfigured()) {
                        User.login();
                      } else {
                        toast.info("Sign-in is not configured for this environment.", {
                          description: "Set VITE_APP_URL, VITE_COGNITO_DOMAIN, and VITE_COGNITO_CLIENT_ID in the build to enable sign-in.",
                        });
                      }
                    }}
                    className="w-full justify-center"
                  >
                    <UserIcon className="w-4 h-4 mr-2" />
                    Sign in
                  </Button>
                  <p className="text-xs text-gray-500 text-center">Sign in to save data</p>
                </div>
              )}
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

