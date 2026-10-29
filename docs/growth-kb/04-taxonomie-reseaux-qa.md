# 04 — Taxonomie, réseaux, UTM, QA, validation

> Extrait du dossier de connaissance du 29/10/2026 (branche `refonte/sous-domaines`, HEAD `77dd43f`). Chaque fait renvoie à `fichier:ligne` : **revérifier dans le code avant de citer un prix, une règle ou une URL.** Ordre d'autorité : code et tests > i18n `src/i18n/locales/` > PRD rév. 5 > CDC 14/09 > STRATEGIE_COMMUNICATION_2026 et skills paperclip/soc (périmés) > BUSINESS_MODEL/PLAN (spéculatifs). ⚠️ contradiction · ⛔ interdit · ✅ vérifié.

### 5.4 Taxonomie des contenus (NocoDB, SingleSelect fermés : `paperclip/skills/airtable-marketing-schema/SKILL.md:21-23,44-57`)
| Étiquette | Valeurs exactes |
|---|---|
| `Pilier` | Autorité · Éducation · Inspiration · Produit · Communauté · Autre. ⛔ Ne pas renommer : valeurs codées en dur dans le nœud « TH — Parse posts » de `WF-TG-ROUTER` |
| `Serie` | RADAR · ATELIER · PREUVE · COULISSES · CERCLE · OFFRE |
| `Offre` | Formations · Club Digitos · Rysmo · **Agence** · Accompagnement · Non-produit (⚠️ « Agence » existe, contrairement à certaines listes) |
| `Cible` | Apprenants · Commerçants · Mixte |
| `Status` | idée → planifié → rédigé → image_needed → **prêt_à_valider** → validé → en_publication → publié, plus échec et rejeté (`:36-38`) |

- **Mix hebdomadaire de 14 posts** (`STRATEGIE:139-152`) : ATELIER 3, OFFRE 3, puis RADAR, PREUVE, COULISSES et CERCLE à 2 chacun.
  - ⛔ **OFFRE ≤ 3 sur 14.**
  - Les cinq offres doivent être couvertes sur 3 semaines glissantes.
  - Créneaux OFFRE : Facebook mercredi 9 h = agence ; Instagram samedi 11 h = la plateforme en rotation (`:156-164`).
  - Équilibre : ≈ 5 Apprenants, 3,5 Commerçants, 5,5 Mixte (`:169-171`).
- **Grille de 21 créneaux** (14 posts et 7 stories à 12 h) : `content-strategy:75-106`. Pas de vidéo ni de TikTok depuis le 06/08/2026.
- ⚠️ Le mix 60/30/10 (`soc-brand-kit:47-48`, Playbook `:42-45`) et les piliers « Formations / Contenus / Communauté / IA / Accompagnement » (`soc-brand-kit:18`, Charte `:27-33`) sont **périmés**.
- **Accent couleur par pilier** (social, kit marketing) : Éducation turquoise, Inspiration violet, Produit orange, Autorité corail, Communauté vert (`STRATEGIE:529-540`).
- **Matrice des angles** (accroche → preuve → CTA) : Gain de temps, Croissance, IA pratique, Communauté, Accompagnement. Sources : `skills/soc-brand-kit/SKILL.md:55-60`, `Max-Morrys_BrandKit_Complet/07_Templates_Marketing/matrice_angles_creatifs.csv`, Playbook `04_…/Max-Morrys_Playbook_Equipes_Marketing.md:89-91`.
- **Rituel du vendredi à 17 h** (4 thèmes → 1 à 3 outils → 1 à 2 tendances) : `content-strategy:43-66`.
- **Calendrier** `docs/calendrier_editorial_12_semaines.csv` (252 posts) :
  - colonnes `Semaine, Date_Publication_Prevue, Reseau, Format_Post, Pilier, Serie, Offre, Cible, Thematique, Titre, CTA, Status` ;
  - du 2026-08-10 au **2026-11-01** ;
  - répartition des offres : Non-produit 204, Agence 20, Formations 9, Club 8, Rysmo 6, Accompagnement 5 ;
  - régénéré par `scripts/build_calendrier_editorial.py`.
  - ⚠️ **Il s'arrête dans 3 jours, et aucun fil rouge n'est défini après octobre.**

### 5.5 Règles par réseau (`STRATEGIE:331-402`, `content-strategy:122-137`)
| Format | Longueur | Emojis | Hashtags | Autres règles |
|---|---|---|---|---|
| LinkedIn post | 150 à 300 mots, accroche sur 2 lignes | fonctionnels `• → ✅ ❌ 💡` | 3 à 5 | — |
| LinkedIn carrousel | 8 à 12 slides | aucun sur les slides | — | la slide 1 tient seule ; 1 CTA final |
| Instagram post | 100 à 200 mots | sobres | — | — |
| Instagram carrousel | 5 à 8 slides | — | 5 à 10 (2-3 locaux, 3-5 thématiques, 2-3 génériques) | couverture ≤ 7 mots ; dernière slide « Sauvegarde pour plus tard » ; légende autonome |
| Story | un seul message | — | — | jamais de lien nu |
| Facebook (commerçants) | 150 à 250 mots | `👋 🙏 💬` | — | zéro jargon |
| Thread X | 5 à 10 tweets autonomes | 1 maximum | 1 à 2 | — |
| YouTube | titre < 60 caractères ; miniature de 3-4 mots (`PROMPTS_YOUTUBE:48,78`) | — | Short 3 à 5, vidéo longue 8 à 12 (`:281,295`) | — |
| E-mail | objet < 50 caractères, préheader, 1 CTA, lien de désinscription | — | — | ⛔ jamais de WhatsApp non sollicité (`skills/lifecycle-kit/SKILL.md:23-32`) |

### 5.6 UTM, nommage, QA, validation
- **UTM :** `?utm_source={canal}&utm_medium={format}&utm_campaign={campagne}&utm_content={angle}_v{NN}` (`STRATEGIE:624`, `soc-brand-kit:63-64`).
  - Exemple : `utm_source=instagram&utm_medium=carousel&utm_campaign=formation_whatsapp&utm_content=angle_gain_temps_v01`.
  - Pour l'agence, `utm_campaign` commence par `agence_` (`STRATEGIE:625-626`).
  - Sur les sites clients, `utm_medium=footer-signature` (`src/lib/popups/entrySource.ts:19-23`).
  - Taxonomie complète : `07_Templates_Marketing/utm_taxonomy.csv`.
  - ⚠️ Avec les sous-domaines, viser directement `edu.` ou `club.` pour éviter de perdre les UTM dans une redirection 301 (**à vérifier**).
- **Fichiers :** `MM_[Canal]_[Format]_[Campagne]_[Angle]_[Version]_[Date ISO]`, sans espaces ni accents. Exemple : `MM_IG_Carousel_WhatsAppBusiness_GainTemps_V01_2026-06-28.png` (Playbook `:217-221`, `07_Templates_Marketing/conventions_nommage.md`).
- **QA :**
  - compris en 3 secondes ? identifiable Max-Morrys ? valeur claire ? un seul CTA ? (`soc-brand-kit:67-70`) ;
  - pas de faute, contraste, ton, UTM ;
  - checklist complète : `07_Templates_Marketing/checklist_QA_marketing.md`, Playbook `:165-187`.
  - À ajouter : registre conforme à la piste, aucun montant de mémoire, aucune promesse de remboursement, crochets conservés.
- **Validation :** `paperclip/skills/approval-protocol/SKILL.md`.
  - ⛔ Aucune action sortante sans validation humaine sur Telegram.
  - L'agent ne met **que** `Status=prêt_à_valider`. Il ne passe jamais à `validé` ou `publié` et n'appelle jamais l'API d'une plateforme (`:3-24`).
  - `PUBLISH_ENABLED` doit valoir `true`.
  - Côté commercial, la signature d'un contrat est toujours faite par un humain (`skills/commercial-kit/SKILL.md:82,100`).

