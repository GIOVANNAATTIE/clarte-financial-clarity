// Shared cadastro data used across Movimentação, Categorias, Clientes/Fornecedores and Centros de Custo

export type ClienteFornecedor = {
  id: number;
  nome: string;
  tipo: "cliente" | "fornecedor";
  documento: string;
  contato: string;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  banco: string;
  agencia: string;
  conta: string;
  tipoConta: string;
  chavePix: string;
  categoriaPadrao: string;
};

export type Categoria = {
  id: number;
  nome: string;
  tipo: "receita" | "despesa";
};

export type CentroCusto = {
  id: number;
  nome: string;
  descricao: string;
};

const emptyFields = { email: "", telefone: "", cep: "", endereco: "", bairro: "", cidade: "", estado: "", banco: "", agencia: "", conta: "", tipoConta: "", chavePix: "", categoriaPadrao: "" };

export const initialClientesFornecedores: ClienteFornecedor[] = [
  { id: 1, nome: "Fornecedor ABC", tipo: "fornecedor", documento: "12.345.678/0001-90", contato: "contato@abc.com", ...emptyFields },
  { id: 2, nome: "Cliente XYZ", tipo: "cliente", documento: "98.765.432/0001-10", contato: "xyz@email.com", ...emptyFields },
  { id: 3, nome: "Consultoria Delta", tipo: "fornecedor", documento: "11.222.333/0001-44", contato: "delta@consul.com", ...emptyFields },
  { id: 4, nome: "Loja Premium", tipo: "cliente", documento: "55.666.777/0001-88", contato: "premium@loja.com", ...emptyFields },
];

export const initialCategorias: Categoria[] = [
  { id: 1, nome: "Fornecedores", tipo: "despesa" },
  { id: 2, nome: "Receitas", tipo: "receita" },
  { id: 3, nome: "Pessoal", tipo: "despesa" },
  { id: 4, nome: "Infraestrutura", tipo: "despesa" },
  { id: 5, nome: "Serviços", tipo: "despesa" },
  { id: 6, nome: "Materiais", tipo: "despesa" },
];

export const initialCentrosCusto: CentroCusto[] = [
  { id: 1, nome: "Operações", descricao: "Atividades operacionais" },
  { id: 2, nome: "Comercial", descricao: "Vendas e marketing" },
  { id: 3, nome: "RH", descricao: "Recursos humanos" },
  { id: 4, nome: "Administrativo", descricao: "Gestão administrativa" },
  { id: 5, nome: "Projetos", descricao: "Gestão de projetos" },
];
