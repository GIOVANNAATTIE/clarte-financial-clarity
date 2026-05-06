
## Plano de Implementação

### 1. Migração de Banco de Dados

Criar a tabela `companies` e adicionar `company_id` (nullable inicialmente) nas tabelas existentes:

- **Nova tabela `companies`**: `id`, `name`, `cnpj`, `segment`, `logo_url`, `user_id`, `created_at`
- **Adicionar coluna `company_id`** (UUID, nullable, FK para companies) em: `transactions`, `entities`, `categories`, `cost_centers`
- RLS: usuários só acessam empresas e dados onde `user_id = auth.uid()`

### 2. Atualização do ClientContext

- Remover `mockClients` e dados estáticos
- Buscar empresas do banco (`companies`) via Supabase
- Armazenar `selectedClient` com `company_id` real do banco
- Expor funções `addClient`, `deleteClient`, `fetchClients`

### 3. Tela SelectClient — CRUD de Empresas

- Botão "+ Nova Empresa" abre modal com Nome, CNPJ, Segmento
- Ícone de lixeira em cada empresa com confirmação de exclusão
- Dados vêm do banco, não mais estáticos

### 4. Filtro por `company_id` em Todas as Páginas

Atualizar queries em:
- `Transactions.tsx` — todas as queries adicionam `.eq("company_id", selectedCompanyId)`
- `Lancamentos.tsx` — idem
- `ClientesFornecedores.tsx` — idem
- `Categorias.tsx` — idem  
- `CentrosCusto.tsx` — idem
- Inserts também incluem `company_id`

### 5. Clientes/Fornecedores — Checkbox + Exclusão em Massa + Bloqueio de Duplicatas

- Adicionar checkbox em cada linha e "selecionar todos"
- Barra de ação com "Excluir Selecionados" + confirmação
- Na criação/importação: verificar duplicata case-insensitive por `name` + `user_id` + `company_id`

### 6. Movimentação — Coluna Centro de Custo

A coluna já existe no código atual (linha 716-719). Confirmarei que está renderizando corretamente.

---

### Detalhes Técnicos

- A migração será feita em um único SQL
- `company_id` começa nullable para não quebrar dados existentes
- A exclusão de empresa fará cascade delete via FK nas tabelas filhas
- O OFX import também passará a incluir `company_id`
