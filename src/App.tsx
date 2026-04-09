import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthScreen } from "@/components/chat/AuthScreen";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider, useSession } from "@/hooks/useSession";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";
import SettingsPage from "./pages/SettingsPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const StartupScreen = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="glass rounded-3xl px-8 py-7 text-center max-w-sm w-full animate-fade-in">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary glow-primary mb-4">
        <span className="text-2xl" role="img" aria-label="Logo do Sonigram">🔊</span>
      </div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        <span className="text-primary">Soni</span>gram
      </h1>
      <p className="text-sm text-muted-foreground mt-2">Carregando sua conversa…</p>
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-5" aria-hidden="true" />
    </div>
  </div>
);

const RootRedirect = () => {
  const { user, loading } = useSession();
  if (loading) return <StartupScreen />;
  return <Navigate to={user ? "/chat" : "/auth"} replace />;
};

const AuthRoute = () => {
  const { user, loading, login, signup, resetPassword } = useSession();
  if (loading) return <StartupScreen />;
  if (user) return <Navigate to="/chat" replace />;
  return <AuthScreen onAuth={{ login, signup, resetPassword }} />;
};

const ChatRoute = () => {
  const { user, loading } = useSession();
  if (loading) return <StartupScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <ChatPage />;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useSession();
  if (loading) return <StartupScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SessionProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<AuthRoute />} />
            <Route path="/onboarding" element={<Navigate to="/auth" replace />} />
            <Route path="/chat" element={<ChatRoute />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
            <Route path="/configuracoes" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
