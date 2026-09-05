# Travail différé

Objectifs séparés de l'intention « terminer le code natif restant » au titre de la règle
de portée du workflow : un objectif livrable par spécification. Le hors-ligne (téléchargements
+ lecture audio en fond) a été retenu en premier parce que c'est lui qui rallume la majorité
des dix-huit contrôles éteints.

- source_spec: none
  summary: Charger les trois fontes de marque (expo-font) au lieu de retomber sur la police système.
  evidence: Livrable indépendamment — aucune donnée, aucun contrôle, aucun écran ne change de comportement. Séparé du hors-ligne, avec lequel il ne partage ni fichier ni dépendance.

- source_spec: none
  summary: Trancher les notifications (expo-notifications) — les demander vraiment, ou retirer l'écran d'amorce.
  evidence: Décision produit avant d'être du code : brancher le paquet impose une permission Android, une icône de notification et une ligne au formulaire de confidentialité des deux magasins. L'écran `permissions.tsx` est déjà rendu honnête ; il n'y a pas d'urgence technique.

- source_spec: none
  summary: Déverrouillage biométrique (expo-local-authentication) sur `biometrie.tsx`.
  evidence: Dépend de la persistance de session, qui existe désormais, mais ne partage rien avec le hors-ligne. L'écran affiche déjà ce qu'il ne fait pas.

- source_spec: none
  summary: Orientation paysage (expo-screen-orientation) et état du réseau (expo-network).
  evidence: Deux paquets, deux écrans (`plein-ecran`, `hors-connexion`), aucun lien avec le stockage local. `hors-connexion` deviendra utile APRÈS le hors-ligne, mais ne le bloque pas.

## Différés une seconde fois, après investigation (2026-09-04)

- source_spec: none
  summary: Orientation paysage (`expo-screen-orientation`) sur `plein-ecran.tsx`.
  evidence: L'écran fait pivoter un LECTEUR QUI NE LIT RIEN — la vidéo de leçon est un `<iframe>` hébergé ailleurs (voir `constat-hors-ligne.md`). Faire tourner un dégradé statique n'est pas une fonction. À reprendre quand le média sera hébergé, pas avant.

- source_spec: none
  summary: Notifications (`expo-notifications`) — demander la permission et envoyer.
  evidence: Le paquet ne fait que la moitié du travail : il demande une autorisation. Ce qui manque est un SERVEUR QUI ENVOIE, et il n'existe pas. Brancher la demande sans l'envoi produirait une permission accordée pour rien — et une ligne au formulaire Data Safety des deux magasins pour une capacité jamais exercée. `permissions.tsx` et `profil.tsx` sont déjà honnêtes sur ce point depuis la correction du 3 septembre.
