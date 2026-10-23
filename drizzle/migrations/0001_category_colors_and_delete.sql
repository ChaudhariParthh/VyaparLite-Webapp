ALTER TABLE public.categories ADD COLUMN color text;
UPDATE public.categories SET color = CASE WHEN type = 'income' THEN '#34764f' ELSE '#c05a41' END WHERE color IS NULL;
COMMENT ON COLUMN public.categories.color IS 'Optional hex swatch shown in the UI; NULL falls back to the type colour.';
CREATE POLICY "cat delete" ON public.categories FOR DELETE TO authenticated USING (owns_business(business_id));
GRANT DELETE ON public.categories TO authenticated;