Le passage entre maxmorrys.me, edu.maxmorrys.me et club.maxmorrys.me, et les deux lanceurs du tableau de bord.

**Fournir** : l'espace courant, l'état de session (le passage ne redemande jamais de connexion — voir la section Architecture), pour les lanceurs : un fait réel par espace (leçon en cours, prochaine session, messages non lus).

**Où** : dans l'en-tête de chaque espace connecté ; les lanceurs `mm-launch is-edu` / `is-club` sur le tableau de bord du hub et en croisé (Edu → Club, Club → Edu).

**Mouvement** : le pouce glisse (220 ms) puis la page change par une View Transition (480 ms, `t-page`). Sur un lanceur : levée de 2 px, halo qui dérive, flèche qui pivote.

**Ne pas** afficher un lanceur Club « vendeur » à un membre ; un non-membre voit le lanceur avec le prix, jamais un compte de membres.
