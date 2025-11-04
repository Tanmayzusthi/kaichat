
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import SplashScreen from './components/UI/SplashScreen';
import Login from './components/Auth/Login';
import SignUp from './components/Auth/SignUp';
import AdminPanel from './components/Admin/AdminPanel';
import ChatLayout from './components/Chat/ChatLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { db } from './lib/firebase'; // Import from the new safe module

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
       <div className="flex items-center justify-center h-screen bg-white">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-stone-300"></div>
       </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


function AppRoutes() {
  const { user, loading } = useAuth();
  
  if (loading) {
     return (
       <div className="flex items-center justify-center h-screen bg-white">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-stone-300"></div>
       </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />
      <Route path="/admin" element={<AdminPanel />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <ChatLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}


export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setShowSplash(false);
    }, 2500);
  }, []);
  
  // This is the runtime validation check. If `db` is null, it means
  // Firebase initialization failed (due to missing keys), and we
  // show a helpful setup screen instead of crashing.
  if (!db) {
     return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-800 p-8 text-center">
            <div className="w-full max-w-lg p-8 bg-white border border-gray-200 rounded-2xl shadow-lg">
                <h1 className="text-3xl font-bold mb-4 text-stone-800">
                  <span className="mr-2">⚙️</span>
                  Firebase Not Configured
                </h1>
                <p className="text-gray-600 mb-6">
                    Welcome to KAICHAT! To get started, you need to connect the app to your Firebase project.
                </p>
                <div className="text-left bg-stone-100 p-4 rounded-md border border-stone-200">
                  <p className="text-stone-600 text-sm">
                    1. Find the <code className="bg-stone-200 text-stone-800 px-1 rounded">.env.example</code> file in the project root.
                  </p>
                  <p className="text-stone-600 text-sm mt-2">
                    2. Rename it to <code className="bg-stone-200 text-stone-800 px-1 rounded">.env.local</code>.
                  </p>
                   <p className="text-stone-600 text-sm mt-2">
                    3. Open <code className="bg-stone-200 text-stone-800 px-1 rounded">.env.local</code> and fill in your Firebase project keys.
                  </p>
                   <p className="text-stone-600 text-sm mt-4">
                    After saving the file, please restart the application.
                  </p>
                </div>
            </div>
        </div>
     );
  }


  return (
    <div className="bg-white text-gray-800 min-h-screen">
       {showSplash ? (
        <SplashScreen />
      ) : (
        <AuthProvider>
            <HashRouter>
               <AppRoutes/>
            </HashRouter>
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#ffffff',
                        color: '#1f2937',
                        border: '1px solid #e5e7eb',
                    },
                }}
            />
        </AuthProvider>
      )}
    </div>
  );
}