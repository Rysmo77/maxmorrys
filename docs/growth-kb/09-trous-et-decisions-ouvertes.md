# 09 — Contradictions, trous et décisions ouvertes

> Extrait du dossier de connaissance du 29/10/2026 (branche `refonte/sous-domaines`, HEAD `77dd43f`). Chaque fait renvoie à `fichier:ligne` : **revérifier dans le code avant de citer un prix, une règle ou une URL.** Ordre d'autorité : code et tests > i18n `src/i18n/locales/` > PRD rév. 5 > CDC 14/09 > STRATEGIE_COMMUNICATION_2026 et skills paperclip/soc (périmés) > BUSINESS_MODEL/PLAN (spéculatifs). ⚠️ contradiction · ⛔ interdit · ✅ vérifié.

## 8. Contradictions et trous (ce qui manque à des agents seniors)

### Bloquants
1. **Aucune formation publiée.** On ne connaît ni les titres, ni les prix, ni les durées (tout est dans Firestore, vide). Les agents ne peuvent pas promouvoir une formation précise. Utiliser l'état « annoncé » ou la liste d'attente, ou attendre les données de l'humain.
2. **Promesses fausses en ligne, à corriger avant toute campagne :**
   - « garantie 7 jours » et « coaching/consulting » dans le chatbot (`rysmo-knowledge.ts:21`) ;
   - pop-up « Toutes les formations… pour un seul abonnement », « Sans risque », « La formation la plus suivie » (`fr/shared.json:80,88,92`) ;
   - miroir SEO à 295 000 sans HT (`static-pages.ts:380,388`) ;
   - « 14 jours » peut-être encore sur `main` ou en production.
3. **Les skills marketing sont périmées** : registre, `/agence`, `src/lib/agency/offer.ts`, polices Merriweather/Inter, packs « 295 k », table commerçants au vouvoiement, mix 60/30/10. Il faut les réaligner sur FR-121 et `offer.ts` avant de lancer les agents.
4. **Le calendrier éditorial se termine le 01/11/2026** ; aucun fil rouge pour novembre et décembre, qui sont pourtant la haute saison des fêtes pour les commerçants.

### Personas et marchés
5. **Il manque des personas pour :**
   - Projets sur mesure (directions d'entreprise, clients européens, groupes ivoiriens : une seule ligne dans le CDC) ;
   - Rysmo et Rysmo+ ;
   - la formation d'équipe B2B ;
   - la diaspora (« le segment le plus solvable ») ;
   - créateurs et étudiants (jeu A sans parcours).
6. **Personas rév. 5 contre rév. 6** contradictoires ; la rév. 6 n'est pas versionnée. Il faut que l'humain désigne le jeu officiel.
7. **Champs absents de toutes les personas :** revenus (sauf Fatou, fictive), modèle de téléphone, objections autres que le prix, déclencheurs d'achat côté apprenants, saisonnalité religieuse (Ramadan, Korité, Tabaski, Magal), usage du wolof.
8. **Géographie floue :** Cameroun (BP) contre Bénin (PRD et offre TPE) ; Abidjan disparaît en rév. 6.
9. **Chiffres de marché non sourcés** à bannir : WhatsApp « 95 %+ », Wave « 70 % », SAM de 300–500 k, taux de complétion de 98 %, données d'élèves de `BUSINESS_MODEL.md`, « 33 clients », « +1 790 % ».

### Marque et canaux
10. **Slogan :** « Maîtrise le digital… » (kit, `index.html`, n8n) contre « Former. Construire. [Transmettre.] » (site).
11. **Noms des pistes :** LEARN / WORK WITH ME (`company.ts:81`) contre Conception / Apprendre.
12. **E-mail :** `hello@` contre `contact@`.
13. **Deux kits visuels incompatibles** (§6).
14. **« Une seule personne »** contre « nous » et « mon studio ».
15. **La lettre** : cadence contradictoire :
    - « toutes les deux semaines » (`fr/shared.json:6`) ;
    - « quand il y a quelque chose à dire » (`fr/footer.json:39`) ;
    - « Pas de lettre d'information » (`fr/formations.json:234`).
16. **Offre TPE** : trois noms (Digital Commerce Local, Présence Digitale, Commerces et TPE). **Rysmo** : quatre appellations.
17. **TikTok et vidéo** à l'arrêt depuis le 06/08, mais le compte TikTok reste dans `sameAs`. L'appli Rysmo n'est pas publiée : ⛔ ne pas promouvoir de téléchargement.
18. **Typographie française** : aucune règle écrite pour les espaces insécables ; les catalogues utilisent une espace normale.
19. **DOVEN** pointe vers myonoma.com ; **NAYO** n'a pas de description validée (`src/pages/About.tsx:29`).
20. **Aucune politique écrite** sur les témoignages (format, consentement), alors que le témoignage audio et vidéo existe côté produit. Aucun guide visuel social aligné sur le kit B.
