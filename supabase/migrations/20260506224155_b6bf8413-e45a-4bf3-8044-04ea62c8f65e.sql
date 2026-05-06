
-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  cnpj TEXT,
  segment TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own companies"
  ON public.companies FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add company_id to transactions
ALTER TABLE public.transactions
  ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add company_id to entities
ALTER TABLE public.entities
  ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add company_id to categories
ALTER TABLE public.categories
  ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Add company_id to cost_centers
ALTER TABLE public.cost_centers
  ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX idx_entities_company_id ON public.entities(company_id);
CREATE INDEX idx_categories_company_id ON public.categories(company_id);
CREATE INDEX idx_cost_centers_company_id ON public.cost_centers(company_id);
