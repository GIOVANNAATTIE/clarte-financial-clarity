import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ClientProvider } from "@/contexts/ClientContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import SelectClient from "./pages/SelectClient";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import Transactions from "./pages/Transactions";
import Lancamentos from "./pages/Lancamentos";
import FluxoCaixa from "./pages/FluxoCaixa";
import DRE from "./pages/DRE";
import ClientesFornecedores from "./pages/ClientesFornecedores";
import Classificacoes from "./pages/Classificacoes";
import Reports from "./pages/Reports";
import ClientSettings from "./pages/ClientSettings";
import TrilhaAuditoria from "./pages/TrilhaAuditoria";
import MeuPerfil from "./pages/MeuPerfil";
import AppLayout from "./components/AppLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ClientProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/select-client" element={<SelectClient />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/lancamentos" element={<Lancamentos />} />
              <Route path="/fluxo-caixa" element={<FluxoCaixa />} />
              <Route path="/dre" element={<DRE />} />
              <Route path="/clientes-fornecedores" element={<ClientesFornecedores />} />
              <Route path="/classificacoes" element={<Classificacoes />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<ClientSettings />} />
              <Route path="/trilha-auditoria" element={<TrilhaAuditoria />} />
              <Route path="/meu-perfil" element={<MeuPerfil />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </ClientProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
