import { createContext, useContext, useState, ReactNode } from "react";

export type Client = {
  id: string;
  name: string;
  cnpj: string;
  segment: string;
};

const mockClients: Client[] = [
  { id: "1", name: "Tech Solutions Ltda", cnpj: "12.345.678/0001-90", segment: "Tecnologia" },
  { id: "2", name: "Construtora Horizonte", cnpj: "23.456.789/0001-01", segment: "Construção Civil" },
  { id: "3", name: "Grupo Alimentar SA", cnpj: "34.567.890/0001-12", segment: "Alimentos" },
  { id: "4", name: "Clínica Bem Estar", cnpj: "45.678.901/0001-23", segment: "Saúde" },
  { id: "5", name: "Auto Peças Nacional", cnpj: "56.789.012/0001-34", segment: "Automotivo" },
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
  if (!ctx) throw new Error("useClient must be used within ClientProvider");
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
