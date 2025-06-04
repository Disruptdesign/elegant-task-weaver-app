
import React, { Suspense } from 'react';
import { AuthWrapper } from '../components/AuthWrapper';
import { AppContainer } from '../components/AppContainer';
import { Alert, AlertDescription } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';

function TaskManager() {
  return <AppContainer />;
}

export default function Index() {
  return (
    <AuthWrapper>
      <Suspense fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      }>
        <TaskManager />
      </Suspense>
    </AuthWrapper>
  );
}
