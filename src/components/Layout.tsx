
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
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200 bg-white">
          <SidebarHeader className="p-0">
            <div className="flex items-center gap-3 p-6 border-b border-gray-100">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckSquare className="text-white" size={22} />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MotionFlow</h1>
                <p className="text-xs text-gray-500">Planification intelligente</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-0">
            <SidebarGroup className="p-0">
              <SidebarGroupLabel className="px-6 py-4 text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent className="px-3">
                <SidebarMenu className="space-y-1">
                  {navigation.map(item => {
                    const IconComponent = item.icon;
                    const isActive = currentView === item.id;
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton 
                          onClick={() => handleViewChange(item.id)}
                          isActive={isActive}
                          className={`
                            w-full p-3 rounded-xl mx-0 transition-all duration-200 group
                            ${isActive 
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                            }
                          `}
                        >
                          <IconComponent size={20} className={`
                            ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}
                          `} />
                          <div className="flex-1 min-w-0 text-left">
                            <div className={`font-medium truncate text-sm ${isActive ? 'text-white' : ''}`}>
                              {item.name}
                            </div>
                            <div className={`text-xs truncate ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                              {item.description}
                            </div>
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
            <SidebarFooter className="p-0 border-t border-gray-100">
              {sidebarFooter}
            </SidebarFooter>
          )}

          <SidebarFooter className="p-0 border-t border-gray-100">
            <div className="p-4">
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

        <main className="flex-1 bg-gray-50">
          <div className="flex items-center p-4 lg:hidden border-b border-gray-200 bg-white">
            <SidebarTrigger className="mr-4 p-2 hover:bg-gray-100 rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="text-white" size={14} />
              </div>
              <span className="font-semibold text-gray-900">MotionFlow</span>
            </div>
            <button className="ml-auto p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
            </button>
          </div>
          
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
