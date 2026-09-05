# Le conteneur GTM — ce que ce dossier est, et ce qu'il n'est pas

`maxmorrys-gtm-import.json` est un **fichier d'amorçage**, pas un instantané de la
production. Il porte `accountId: "0"`, `containerId: "0"` et un `exportTime` du
2026-05-01 : ces trois valeurs suffisent à le dire.

**Le modifier ici ne change rien au site.** Le conteneur en service vit dans l'interface
Google Tag Manager, sous `GTM-PJ3R433M`, et seule une **version publiée** y prend effet.

## Ce qui doit être reporté à la main dans l'interface

Le 05/09/2026, les deux tags GA4 sont passés de `consentStatus: NOT_SET` à
`NEEDED` sur `analytics_storage`. Tant que ce n'est pas fait dans l'interface **puis
publié**, le comportement réel reste celui d'avant.

Ce que ça change : le site pose déjà un Consent Mode v2 en `denied` par défaut
(`index.html`, avant le snippet GTM), donc GA4 n'écrit aucun cookie sans accord. Mais
`NOT_SET` laisse les tags se déclencher quand même, en pings sans identifiant. `NEEDED`
les met en attente jusqu'au consentement, puis les rejoue — la file du Consent Mode fait
le travail, sans qu'aucune garde côté client n'ait à intercepter le `dataLayer`.

## Deux choses à vérifier avant de conclure que « la mesure ne marche pas »

1. **La version publiée contient-elle bien les deux tags et le déclencheur ?**
   `GA4 - Config` porte `send_page_view: false` : **toutes** les vues de page dépendent
   du déclencheur `All Custom Events` (regex `.*`), alimenté par `trackPageView()`
   (`src/lib/tracking.ts`) depuis `src/components/tracking/MetaPixelTracker.tsx`. Si ce
   déclencheur ou la balise `GA4 - All Events` n'est pas publié, GA4 ne reçoit rien —
   quelle que soit la qualité du reste du dispositif.

2. **Le bandeau met 1500 ms à apparaître** (`src/components/shared/CookieBanner.tsx`), et
   tant que personne n'a cliqué, `analytics_storage` reste `denied`. Dans GA4, cela
   ressemble beaucoup à « aucune donnée ». C'est la première cause à écarter avant de
   soupçonner une panne technique.

## Le mode Aperçu

`tagassistant.google.com` a été ajouté à la CSP (`firebase.json`, directives `script-src`,
`connect-src` et `frame-src`) le 05/09/2026 — il n'y figurait pas, ce qui rendait le mode
Aperçu inopérant : l'outil censé prouver qu'une balise se déclenche était lui-même bloqué.

⚠️ Si l'Aperçu échoue encore, le suspect suivant est `X-Frame-Options: DENY`, posé sur
`**` dans `firebase.json`. Il n'a **pas** été touché : c'est une protection réelle contre
le détournement de clic, et l'assouplir est un arbitrage de sécurité, pas un détail de
configuration. `tests/unit/csp.test.ts` garde les trois directives.
