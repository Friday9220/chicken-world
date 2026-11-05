-- Chicken World – adgangskode til ordresiden (personale.html)
-- Ordresiden laver adgangskoden om til en nøgle: sha256('chickenworld:' + koden med små bogstaver).
-- Skift SKRIV_ADGANGSKODE_HER til den ønskede kode (små bogstaver), og kør filen i
-- Supabase: SQL Editor -> New query -> indsæt -> Run.
-- Det gamle hemmelige link holder op med at virke, når koden er sat.
-- Læg aldrig den udfyldte fil i GitHub.

update private.settings
set staff_key = encode(sha256(convert_to('chickenworld:' || lower(trim('SKRIV_ADGANGSKODE_HER')), 'UTF8')), 'hex');

select 'Adgangskoden er sat' as resultat from private.settings;
