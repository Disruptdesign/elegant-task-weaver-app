
import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, Calendar, Settings, Menu, X, FolderOpen, Inbox, Bell } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  sidebarFooter?: React.ReactNode;
}

export function Layout({ children, currentView, onViewChange, sidebarFooter }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, description: 'Vue d\'ensemble' },
    { id: 'tasks', name: 'Tâches', icon: CheckSquare, description: 'Gérer mes tâches' },
    { id: 'calendar', name: 'Calendrier', icon: Calendar, description: 'Planning' },
    { id: 'projects', name: 'Projets', icon: FolderOpen, description: 'Mes projets' },
    { id: 'inbox', name: 'Inbox', icon: Inbox, description: 'Idées rapides' },
    { id: 'settings', name: 'Paramètres', icon: Settings, description: 'Configuration' },
  ];

  const handleViewChange = (viewId: string) => {
    onViewChange(viewId);
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex">
      {/* Sidebar mobile overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo et fermeture mobile */}
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckSquare className="text-white" size={22} />
              </div>
              <div>
                <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  FlowSavvy
                </h1>
                <p className="text-xs text-gray-500">Planification intelligente</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation améliorée */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`w-full group flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <div className={`p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                  }`}>
                    <IconComponent size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.name}</div>
                    <div className="text-xs text-gray-500 truncate">{item.description}</div>
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          {sidebarFooter && (
            <div className="border-t border-gray-100">
              {sidebarFooter}
            </div>
          )}

          {/* Version */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>FlowSavvy v1.0</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>En ligne</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar mobile amélioré */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-100 p-4 lg:hidden sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <CheckSquare className="text-white" size={14} />
              </div>
              <span className="font-semibold text-gray-900">FlowSavvy</span>
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
