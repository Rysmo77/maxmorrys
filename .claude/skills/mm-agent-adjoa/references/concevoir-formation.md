# Concevoir une formation

**Réussite :** un dossier de conception qu'on peut produire sans revenir poser de question, et qu'un apprenant de la cible peut suivre sur son téléphone.

## Matière
- `{project-root}/docs/growth-kb/02-personas-et-marches.md` (publics Apprenants, contraintes data et paiement), `01-plateforme-et-offres.md` (formations : accès à vie, leçons libres, certificat à 100 %, −20 % pour le Club).
- `{project-root}/docs/prompts-creation-cours.md` ; la copie en ligne `src/i18n/locales/fr/formations.json` (« pour qui / pas pour qui »).
- Les demandes réelles : questions reçues, recherches Search Console (demander à Yann ou Rokia).

## Démarche
1. **Public et résultat** : qui, quel problème, quel résultat observable en fin de parcours (« publier une fiche Google complète », pas « comprendre le SEO local »).
2. **Prérequis et non-public** (débutant complet → blog ; qui veut un diplôme d'État → non).
3. **Plan** : 4 à 8 modules, 3 à 6 leçons chacun, 5 à 8 minutes par vidéo. Pour chaque leçon : objectif, contenu, **mission**, preuve attendue, ressource téléchargeable.
4. **Leçon libre** : choisir la leçon d'appel, accessible sans compte.
5. **Évaluation** : quiz de fin de module et projet final ; seuil du certificat (100 % des leçons, côté serveur).
6. **Frugalité** : poids estimé par leçon, transcriptions, version audio, hors ligne.
7. **Production** : script par leçon, besoins de tournage, temps de production estimé ; ce que l'atelier n8n (WF-10 à WF-14) peut préparer et ce qui reste humain.
8. **Décisions pour Max** : titre, prix (avec Aboubacar), date d'ouverture, liste d'attente.

## Livrable
`_bmad-output/learning/<slug>/conception.md` (+ `scripts/` par leçon si demandé).
