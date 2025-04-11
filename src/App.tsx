import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import Index from '@/pages/Index';
import Chat from '@/pages/Chat';
import NotFound from '@/pages/NotFound';
import Register from '@/pages/Register';
import Profile from '@/pages/Profile';
import Info from '@/pages/Info';
import Admin from '@/pages/Admin';
import Login from '@/pages/Login';
import { useAuthState } from '@/hooks/useAuthState';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import "./App.css";

function AppRoutes() {
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const { userId, checkAuth } = useAuthState();

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setIsAuthChecking(false);
    };
    
    verifyAuth();
  }, [checkAuth]);

  // Show loading spinner while checking auth
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-cyberdark-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-cyberblue-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cyberblue-400">Laster inn SnakkaZ...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/chat" element={userId ? <Chat /> : <Navigate to="/login" />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profil" element={userId ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/info" element={<Info />} />
      <Route path="/admin" element={userId ? <Admin /> : <Navigate to="/login" />} />
      <Route path="/login" element={userId ? <Navigate to="/chat" /> : <Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
