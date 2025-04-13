# Guide: Aktivere Beskyttelse mot Lekkede Passord i Supabase

For å håndtere advarselen "Leaked Password Protection Disabled" i Security Advisor, følg disse trinnene:

## Trinn 1: Gå til Supabase Dashboard

1. Logg inn på Supabase-dashbordet: https://supabase.com/dashboard
2. Velg prosjektet ditt ("SnakkaZ" i dette tilfellet)

## Trinn 2: Naviger til Auth-innstillinger

1. Klikk på "Authentication" i venstremenyen
2. Velg "Providers" eller "Settings" under Authentication
3. Finn seksjonen for "Passord" eller "Security"

## Trinn 3: Aktivere Leaked Password Protection

1. Se etter en innstilling som heter "Leaked Password Protection" eller "Check for compromised passwords"
2. Aktiver denne funksjonen ved å slå på bryteren
3. Lagre innstillingene

## Trinn 4: Verifiser at innstillingen er aktivert

1. Gå tilbake til "Security Advisor" i Supabase-dashbordet
2. Klikk på "Refresh" for å oppdatere advarslene
3. Bekreft at "Leaked Password Protection Disabled" advarselen er borte

## Hvorfor dette er viktig

Når "Leaked Password Protection" er aktivert, vil Supabase kontrollere passord mot kjente databaser av kompromitterte passord når brukere registrerer seg eller endrer passord. Dette forhindrer brukere i å velge passord som allerede er lekket i datalekkasjer, og forbedrer den generelle sikkerheten til applikasjonen din.

## Kjøre SQL-migrasjonen for å fikse Function Search Path

For å implementere fiksen for "Function Search Path Mutable"-advarslene:

1. Koble til ditt Supabase-prosjekt via SQL Editor
2. Kjør SQL-koden fra `supabase/migrations/20240510_fix_security_warnings.sql`
3. Gå tilbake til Security Advisor og klikk "Refresh" for å verifisere at advarslene nå er løst

Alternativt kan du bruke Supabase CLI til å kjøre migrasjonen:

```bash
supabase db push --db-url <din-supabase-db-url>
``` 