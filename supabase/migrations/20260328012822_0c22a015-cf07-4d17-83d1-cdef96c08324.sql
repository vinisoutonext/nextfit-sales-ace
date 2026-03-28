ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS avaliacao text DEFAULT NULL;
ALTER TABLE public.logs ADD COLUMN IF NOT EXISTS categoria text DEFAULT NULL;

CREATE POLICY "Anyone can update logs" ON public.logs FOR UPDATE TO public USING (true) WITH CHECK (true);