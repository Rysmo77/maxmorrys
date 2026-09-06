# Lot 4 — la chaîne de première ouverture, sur l'émulateur

Android 15, AVD `rysmo`, variante `debug`, données effacées avant le parcours.

| Fichier | Ce que l'écran affichait au moment du déclenchement |
|---|---|
| `1-accueil-1sur3.png` | Passer · Rysmo · **1 SUR 3** · APPRENDS / QUAND TU PEUX. / HORS RÉSEAU AUSSI. |
| `2-accueil-2sur3.png` | Passer · Rysmo · **2 SUR 3** · UN RÉPÉTITEUR / QUI CONNAÎT / TON PARCOURS. |
| `3-accueil-3sur3.png` | Passer · Rysmo · **3 SUR 3** · LE CLUB, / QUAND TU ES / PRÊTE. |
| `4-espace.png` | ESPACE · **BONJOUR. / REPRENDS / OÙ TU T'ES ARRÊTÉE.** · PAS ENCORE BRANCHÉ |

C'est la chaîne que le port React Native n'atteignait jamais : elle était écrite,
complète, et aucun chemin n'y menait.

## ⛔ Trois pièges de la sonde, mesurés en prenant ces quatre images

Ils ont produit, chacun, une capture faussement étiquetée. Ils sont écrits ici parce
qu'une preuve mal nommée est pire qu'une preuve absente.

**1 · Une capture ne prouve rien sans le paquet au premier plan.** Deux autres
applications de l'émulateur (`app.amourdivin`, `com.myonoma.stepsmagazine`) se
réveillent seules et passent devant. Trois captures les montraient — et rien, à
l'œil, ne disait que ce n'était pas Rysmo. Elles sont désactivées le temps des
mesures (`pm disable-user`), et le paquet est relevé à chaque prise.

**2 · `uiautomator dump` rend le fichier PRÉCÉDENT quand il échoue.** Il écrit dans
`/sdcard/u.xml` ; un échec laisse l'ancien contenu, et la lecture suivante rend un
état périmé sans la moindre erreur. Le fichier est donc effacé avant chaque dump.
Le service se bloque aussi après un usage répété (« UiAutomationService already
registered ») — `pkill -f uiautomator` le remet en marche.

**3 · Le nom vient de l'OBSERVATION, jamais de l'attente.** Nommer les fichiers dans
l'ordre où on croit avoir tapé produit un décalage d'une étape dès que l'application
est lente à froid. Ici, chaque capture attend le marqueur de son écran, et prend son
nom de ce qui a été lu.

⚠️ La lenteur n'était pas anodine : le disque de la machine était à 100 %, ce qui
avait tué les services de l'émulateur avant ces prises.
