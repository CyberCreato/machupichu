import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "@/components/LoginModal";
import AdminDashboard from "./pages/AdminDashboard";
import StaffDashboard from "./pages/StaffDashboard";
import EnhancedFormFillPage from "./pages/EnhancedFormFillPage";
import NotFound from "./pages/NotFound";
import { suppressResizeObserverLoopError } from "./utils/resizeObserverFix";
import React from "react";

// Suppress ResizeObserver loop warnings globally
suppressResizeObserverLoopError();

// Additional window error handler for ResizeObserver
window.addEventListener("error", (event) => {
  if (
    event.message &&
    event.message.includes(
      "ResizeObserver loop completed with undelivered notifications",
    )
  ) {
    event.preventDefault();
    event.stopPropagation();
  }
});

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginModal open={true} onOpenChange={() => {}} />;
  }

  return <>{children}</>;
}

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) {
    return <LoginModal open={true} onOpenChange={() => {}} />;
  }

  if (user.role === "admin" || user.role === "supervisor") {
    return <AdminDashboard />;
  } else {
    return <StaffDashboard />;
  }
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fill-form"
              element={
                <ProtectedRoute>
                  <EnhancedFormFillPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
