import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { OnboardingScreen } from "@/components/chat/OnboardingScreen";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider, useSession } from "@/hooks/useSession";
import ChatPage from "./pages/ChatPage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const StartupScreen = () => (
  <div className="min-h-screen flex items-center justify-center p-6">
    <div className="glass rounded-3xl px-8 py-7 text-center max-w-sm w-full animate-fade-in">
      <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-secondary glow-primary mb-4">
        <span className="text-2xl" role="img" aria-label="Logo do Sonigram">
          🔊
        </span>
      </div>
      <h1 className="font-heading text-2xl font-bold text-foreground">
        <span className="text-primary">Soni</span>gram
      </h1>
      <p className="text-sm text-muted-foreground mt-2">Carregando sua conversa…</p>
      <div
        className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mt-5"
        aria-hidden="true"
      />
    </div>
  </div>
);

const RootRedirect = () => {
  const { user, loading } = useSession();

  if (loading) {
    return <StartupScreen />;
  }

  return <Navigate to={user ? "/chat" : "/onboarding"} replace />;
};

const OnboardingRoute = () => {
  const { user, loading, login } = useSession();

  if (loading) {
    return <StartupScreen />;
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }

  return <OnboardingScreen onLogin={login} />;
};

const ChatRoute = () => {
  const { user, loading } = useSession();

  if (loading) {
    return <StartupScreen />;
  }

  if (!user) {
    return <Navigate to="/onboarding" replace />;
  }

  return <ChatPage />;
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
            <Route path="/onboarding" element={<OnboardingRoute />} />
            <Route path="/chat" element={<ChatRoute />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SessionProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
