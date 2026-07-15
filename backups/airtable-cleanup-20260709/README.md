# Nettoyage tables Airtable — 2026-07-09

Base `apppkEbepilHCYiso` (marketing Max-Morrys). 5 tables identifiées inutilisées (réf. uniquement workflows archivés/désactivés, aucun WF actif ni script vivant).

## À supprimer (UI Airtable — l'API ne permet pas de DROP une table)

| Table | ID | Records | Backup CSV | Raison |
|---|---|---|---|---|
| Interactions | tblaSee9z4T26Szin | 0 | — (vide) | réf. [ARCHIVED] WF-05/06 |
| Rapports Hebdo | tbl1xrxYxVMtTq5MX | 0 | — (vide) | réf. [ARCHIVED] WF-06 |
| Calendrier Editorial | tblTlBSOSI1UOmQ1I | 37 | calendrier-editorial.csv | remplacée par Contenus |
| Medias Generes | tbleUm1UoP9qqOdOn | 10 | medias-generes.csv | remplacée par Storage + renderSocialCard |
| Banque Idees Social | tblOA6igI4bSz3fwS | 173 | banque-idees-social.csv | remplacée par WF-THEMES |

## Conservées
Contenus, Config, Logs, SEO, Emails, WhatsApp (utilisées/dormantes à valeur), + Banque Idees Articles, Banque Idees Cours, Cours en Production (pipelines dormants LMS/SEO-articles).
