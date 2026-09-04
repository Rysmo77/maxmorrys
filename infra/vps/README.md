# Le canal marketing — Brevo, et pourquoi pas Listmonk

Ce dossier ne décrit plus aucune installation. Il conserve une **décision et son
retournement**, parce que l'erreur est plus instructive que le résultat.

## Ce qui a été fait, puis défait

Listmonk a été installé sur le VPS le 04/09/2026 — conteneur, Postgres, entrée Caddy,
sauvegarde quotidienne, relais SMTP Brevo configuré et testé — puis **entièrement retiré le
même jour**.

Le raisonnement initial : « Brevo ne s'auto-héberge pas, donc Listmonk sur le VPS relayant
vers Brevo permet de garder la donnée chez soi. » Il était juste sur les faits et faux sur
les conséquences.

### Les trois raisons du retrait

**Le quota était identique.** Listmonk relayait *à travers* Brevo. Il n'apportait donc rien
sur le plafond de 300 envois/jour du plan gratuit, qui est la contrainte dure du programme.

**Brevo ne facture pas au contact.** La raison classique d'auto-héberger — la facturation par
abonné — n'existait pas ici.

**Listmonk ne sait pas faire de séquences.** Il envoie des campagnes, pas des scénarios. Or
le plan de campagnes contient une bienvenue en trois e-mails et un nurture de devis en deux
temps. L'outil recommandé ne savait pas exécuter la moitié du plan écrit ensuite.

### L'argument qui restait, et pourquoi il ne tenait pas

« Les données restent chez nous. » Mais **la preuve du consentement vit dans Firestore** —
`newsletter.consentAt`, horodaté, exigé par les règles serveur. Listmonk n'en était pas le
dépositaire : c'était une copie intermédiaire de plus, susceptible de diverger de la source.

## Ce qui survit au retrait, et qui valait le détour

Le démontage n'a rien coûté de ce qui comptait, parce que l'essentiel ne dépendait pas de
l'outil :

| Acquis | État |
|---|---|
| `lettre.maxmorrys.me` authentifié chez Brevo | SPF, DKIM (`brevo1`/`brevo2`), DMARC `p=quarantine` |
| Séparation des réputations | Le marketing part de `lettre.`, jamais de la racine ni de `mail.` |
| Trou SPF de la racine | Comblé — elle n'en avait aucun, avec un DMARC en `p=none` |
| Transactionnel | Intact, `mail.maxmorrys.me` toujours en `p=reject` |
| Désabonnement | `GET /desabonnement`, dans le Worker, sans JavaScript ni compte |
| Synchronisation d'audience | `worker/apps/api/src/lib/brevo-contacts.ts` |

## L'architecture actuelle

```
TRANSACTIONNEL                         MARKETING
Worker Cloudflare                      Worker Cloudflare (cron 08:00)
  binding send_email, aucune clé         → POST api.brevo.com/v3/contacts
  facture@mail.maxmorrys.me              → campagnes depuis la console Brevo
  DMARC p=reject                         lettre@lettre.maxmorrys.me
                                         DMARC p=quarantine
```

Aucun service à maintenir sur le VPS pour l'e-mail. Les deux canaux ne partagent ni
fournisseur, ni sous-domaine, ni réputation.

## Où vivent les choses

- **Listes Brevo** : `4` — Lettre — apprenants · `5` — Lettre — commerces (dossier `Max-Morrys`)
- **Attributs déclarés** : `SOURCE`, `LOCALE`, `COMPTE`, `VILLE`, `INSCRIT_LE`, `CONSENTI_LE`,
  `ONBOARDING`. ⚠️ Brevo **rejette** un contact portant un attribut non déclaré, il ne
  l'ignore pas : tout nouvel attribut se crée d'abord dans la console.
- **Clé API** : secret du Worker (`BREVO_API_KEY`), jamais dans le dépôt.
- **Sauvegardes Listmonk** : deux archives conservées dans
  `/opt/maxmorrys-stack/sauvegardes/listmonk/` sur le VPS. Elles ne contiennent que des
  données de test — à supprimer sans hésiter.

## Ce qui reste à faire sur le VPS

`/opt/maxmorrys-stack/listmonk/.env` porte encore les secrets d'un service démonté
(mot de passe Postgres, admin Listmonk, clé SMTP Brevo). Le fichier est en mode 600, mais il
n'a plus de raison d'être.
