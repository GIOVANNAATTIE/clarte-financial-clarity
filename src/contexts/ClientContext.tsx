import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Client = {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  logoUrl: string;
};

export type CompanyPayload = {
  name: string;
  fantasy_name?: string;
  cnpj?: string;
  segment?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  email?: string;
  phone?: string;
};

type ClientContextType = {
  clients: Client[];
  selectedClient: Client | null;
  selectClient: (client: Client) => void;
  clearClient: () => void;
  updateClient: (client: Client) => void;
  fetchClients: () => Promise<void>;
  addClient: (payload: CompanyPayload) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  loading: boolean;
};

const ClientContext = createContext<ClientContextType | null>(null);

export const useClient = () => {
  const ctx = useContext(ClientContext);
  if (!ctx) {
    return {
      clients: [],
      selectedClient: null,
      selectClient: () => {},
      clearClient: () => {},
      updateClient: () => {},
      fetchClients: async () => {},
      addClient: async () => {},
      deleteClient: async () => {},
      loading: false,
    } as ClientContextType;
  }
  return ctx;
};

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    if (data) {
      setClients(data.map(c => ({
        id: c.id,
        name: c.name,
        cnpj: c.cnpj || "",
        segment: c.segment || "",
        logoUrl: c.logo_url || "",
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const addClient = async (payload: CompanyPayload) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("companies").insert({
      user_id: user.id,
      name: payload.name,
      fantasy_name: payload.fantasy_name || null,
      cnpj: payload.cnpj || null,
      segment: payload.segment || null,
      address: payload.address || null,
      city: payload.city || null,
      state: payload.state || null,
      zip_code: payload.zip_code || null,
      email: payload.email || null,
      phone: payload.phone || null,
    } as any);
    await fetchClients();
  };

  const deleteClient = async (id: string) => {
    await supabase.from("companies").delete().eq("id", id);
    if (selectedClient?.id === id) setSelectedClient(null);
    await fetchClients();
  };

  const updateClient = (updated: Client) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedClient?.id === updated.id) setSelectedClient(updated);
  };

  return (
    <ClientContext.Provider
      value={{
        clients,
        selectedClient,
        selectClient: setSelectedClient,
        clearClient: () => setSelectedClient(null),
        updateClient,
        fetchClients,
        addClient,
        deleteClient,
        loading,
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};
