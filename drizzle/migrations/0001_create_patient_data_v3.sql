CREATE TABLE IF NOT EXISTS public.patient_data (
  user_id uuid PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_data TO authenticated;
GRANT ALL ON public.patient_data TO service_role;
ALTER TABLE public.patient_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own select" ON public.patient_data;
DROP POLICY IF EXISTS "own insert" ON public.patient_data;
DROP POLICY IF EXISTS "own update" ON public.patient_data;
DROP POLICY IF EXISTS "own delete" ON public.patient_data;
CREATE POLICY "own select" ON public.patient_data FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.patient_data FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.patient_data FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.patient_data FOR DELETE TO authenticated USING (auth.uid() = user_id);