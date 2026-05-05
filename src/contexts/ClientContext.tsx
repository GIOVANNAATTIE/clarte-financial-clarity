import { createContext, useContext, useState, ReactNode } from "react";

export type Client = {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
  logoUrl: string;
};

const mockClients: Client[] = [
  { id: "1", name: "Grupo TDL", cnpj: "12.345.678/0001-90", segment: "Empresarial", logoUrl: "" },
  { id: "2", name: "MKPlace", cnpj: "23.456.789/0001-01", segment: "Marketplace", logoUrl: "" },
  { id: "3", name: "Tech Solutions Ltda", cnpj: "34.567.890/0001-12", segment: "Tecnologia", logoUrl: "" },
  { id: "4", name: "Construtora Horizonte", cnpj: "45.678.901/0001-23", segment: "Construção Civil", logoUrl: "" },
  { id: "5", name: "Clínica Bem Estar", cnpj: "56.789.012/0001-34", segment: "Saúde", logoUrl: "" },
];

type ClientContextType = {
  clients: Client[];
  selectedClient: Client | null;
  selectClient: (client: Client) => void;
  clearClient: () => void;
};

const ClientContext = createContext<ClientContextType | null>(null);

export const useClient = () => {
  const ctx = useContext(ClientContext);
  if (!ctx) {
    // Fallback for HMR or missing provider — return safe defaults
    return {
      clients: [],
      selectedClient: null,
      selectClient: () => {},
      clearClient: () => {},
    } as ClientContextType;
  }
  return ctx;
};

export const ClientProvider = ({ children }: { children: ReactNode }) => {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  return (
    <ClientContext.Provider
      value={{
        clients: mockClients,
        selectedClient,
        selectClient: setSelectedClient,
        clearClient: () => setSelectedClient(null),
      }}
    >
      {children}
    </ClientContext.Provider>
  );
};
