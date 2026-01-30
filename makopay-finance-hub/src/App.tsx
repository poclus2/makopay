import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Index from "./pages/Index";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyPhone from "./pages/auth/VerifyPhone";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { SupportProvider } from "@/contexts/SupportContext";
import { SupportScreen } from "@/components/screens/SupportScreen";
import KycScreen from "@/components/screens/KycScreen";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <CurrencyProvider>
        <TooltipProvider>
          <AuthProvider>
            <SupportProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/register" element={<Register />} />
                  <Route path="/auth/verify-phone" element={<VerifyPhone />} />

                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Index />} />
                    <Route path="/support" element={<SupportScreen onBack={() => window.history.back()} />} />
                    <Route path="/kyc" element={<KycScreen onBack={() => window.history.back()} />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </SupportProvider>
          </AuthProvider>
        </TooltipProvider>
      </CurrencyProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
