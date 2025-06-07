
import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, Calendar, Settings, Menu, X, FolderOpen, Inbox, Bell } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from './ui/sidebar';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  sidebarFooter?: React.ReactNode;
}

export function Layout({
  children,
  currentView,
  onViewChange,
  sidebarFooter
}: LayoutProps) {
  const navigation = [{
    id: 'dashboard',
    name: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Vue d\'ensemble'
  }, {
    id: 'tasks',
    name: 'Tâches & Événements',
    icon: CheckSquare,
    description: 'Gérer mes tâches et événements'
  }, {
    id: 'calendar',
    name: 'Calendrier',
    icon: Calendar,
    description: 'Planning'
  }, {
    id: 'projects',
    name: 'Projets',
    icon: FolderOpen,
    description: 'Mes projets'
  }, {
    id: 'inbox',
    name: 'Inbox',
    icon: Inbox,
    description: 'Idées rapides'
  }, {
    id: 'settings',
    name: 'Paramètres',
    icon: Settings,
    description: 'Configuration'
  }];

  const handleViewChange = (viewId: string) => {
    onViewChange(viewId);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 p-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckSquare className="text-white" size={22} />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MotionFlow</h1>
                <p className="text-xs text-gray-500">Planification intelligente</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map(item => {
                    const IconComponent = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton 
                          onClick={() => handleViewChange(item.id)}
                          isActive={isActive}
                          className="w-full"
                        >
                          <IconComponent size={18} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.name}</div>
                            <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          {sidebarFooter && (
            <SidebarFooter>
              {sidebarFooter}
            </SidebarFooter>
          )}

          <SidebarFooter>
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>FlowSavvy v1.0</span>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>En ligne</span>
                </div>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="flex items-center mb-6 lg:hidden">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="text-white" size={14} />
              </div>
              <span className="font-semibold text-gray-900">Flowmotion</span>
            </div>
            <button className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
            </button>
          </div>
          
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
