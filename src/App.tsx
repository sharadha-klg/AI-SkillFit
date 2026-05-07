import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import CandidateDashboard from "./pages/CandidateDashboard";
import Interview from "./pages/Interview";
import Result from "./pages/Result";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCandidate from "./pages/AdminCandidate";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner theme="dark" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<CandidateDashboard />} />
          <Route path="/interview/:id" element={<Interview />} />
          <Route path="/result/:id" element={<Result />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/candidate/:id" element={<AdminCandidate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
