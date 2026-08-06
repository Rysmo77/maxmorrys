# ⚠️ `calendrier_editorial_30_jours.csv` est obsolète (6 août 2026)

Ce fichier n'a jamais été un calendrier : c'est un **motif de 5 lignes répété six fois**, du
28 juin au 27 juillet 2026. Mêmes angles, mêmes CTA, mêmes canaux à chaque cycle. C'était un gabarit
de démonstration, laissé en l'état.

Il est aussi bâti sur des piliers **périmés** (`Apprendre / Progresser / Partager / Impacter /
Accompagner`), qui ne correspondent ni au champ `Pilier` réel d'Airtable, ni à ce que le pipeline
valide.

**Le calendrier qui fait foi :** `docs/calendrier_editorial_12_semaines.csv`
— 12 semaines réelles (10 août → 1ᵉʳ novembre 2026), 252 contenus, colonnes alignées sur les champs
Airtable, régénérable par `python3 scripts/build_calendrier_editorial.py`.

**La stratégie qui le produit :** `docs/STRATEGIE_COMMUNICATION_2026.md`.

Le CSV d'origine est conservé parce que le playbook du brand kit le cite — il ne doit plus servir
de référence de production.
