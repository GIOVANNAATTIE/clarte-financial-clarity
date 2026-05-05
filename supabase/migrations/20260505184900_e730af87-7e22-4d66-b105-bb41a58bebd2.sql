
ALTER TABLE public.entities
ADD COLUMN default_category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
