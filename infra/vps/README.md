# Infrastructure VPS — Listmonk

Ce dossier est le **premier fichier de déploiement VPS versionné du dépôt**. Jusqu'ici, la
seule trace de l'infrastructure était `docs/typesense-vps.md`, qui la décrivait par ricochet.
Le VPS portait n8n, NocoDB, Typesense et `render-card` sans qu'aucun de leurs fichiers ne
soit sauvegardé ailleurs que sur la machine elle-même.

## Le contexte

Le produit envoie déjà du **transactionnel** par Cloudflare Email Service — facture,
confirmations d'achat, rappels. Ce canal reste inchangé et ne bouge pas.

Ce dossier installe le **canal marketing**, qui ne peut pas passer par Cloudflare : Email
Sending y est contractuellement réservé au transactionnel. Et Brevo, dont un compte existe
déjà, **ne s'installe pas** — c'est un SaaS exclusif.

D'où le montage : **Listmonk tient tout sur le VPS** (listes, segments, campagnes,
désabonnement natif, statistiques) et ne délègue à Brevo que l'acheminement SMTP.

---

## 1. DNS — l'état relevé, et ce qu'il faut poser

### Ce qui existe déjà (mesuré, ne pas y toucher)

| Nom | Contenu | Rôle |
|---|---|---|
| `mail.maxmorrys.me` | SPF `_spf.mx.cloudflare.net`, DKIM `cf-bounce`, DMARC `p=reject`, MX de rebond | **Transactionnel Cloudflare.** Intouchable. |
| `maxmorrys.me` | DKIM `brevo1`/`brevo2`, TXT `brevo-code:…` | Brevo est déjà autorisé sur la racine |

### ⚠️ Deux défauts à corriger

**La racine n'a aucun SPF.** Brevo y a son DKIM, mais rien ne l'autorise en SPF, et le DMARC
racine est en `p=none`. La délivrabilité repose donc entièrement sur l'alignement DKIM —
fragile, à l'heure où Gmail et Yahoo durcissent leurs exigences.

**Le marketing ne doit pas partir de la racine.** `maxmorrys.me` porte les échanges
personnels. Une plainte pour spam y abîmerait leur réputation *et*, par voisinage de domaine,
celle des factures. C'est le raisonnement qui avait fait choisir `mail.` pour le
transactionnel ; il vaut double pour le marketing, dont le taux de plainte est
structurellement plus élevé.

### À créer

| Type | Nom | Valeur | Proxy |
|---|---|---|---|
| A | `listmonk.maxmorrys.me` | `158.220.124.185` | **DNS only** — le défi ACME HTTP-01 doit atteindre Caddy |
| TXT | `lettre.maxmorrys.me` | `v=spf1 include:spf.brevo.com -all` | — |
| CNAME | `brevo1._domainkey.lettre.maxmorrys.me` | `b1.lettre-maxmorrys-me.dkim.brevo.com` † | DNS only |
| CNAME | `brevo2._domainkey.lettre.maxmorrys.me` | `b2.lettre-maxmorrys-me.dkim.brevo.com` † | DNS only |
| TXT | `_dmarc.lettre.maxmorrys.me` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@maxmorrys.me; pct=100` | — |
| TXT | `maxmorrys.me` | `v=spf1 include:spf.brevo.com ~all` | — (comble le trou) |

† **Motif déduit, à confirmer dans l'interface.** Il est relevé sur la racine, déjà vérifiée
chez Brevo : `brevo1._domainkey.maxmorrys.me` pointe sur `b1.maxmorrys-me.dkim.brevo.com`,
lui-même sur `brevo15.dkim.brevo.com`. Brevo remplace les points du domaine par des tirets.
C'est néanmoins **Brevo qui fait foi** : déclarer le sous-domaine (Senders → Domains) et
recopier les valeurs qu'il affiche, sans les déduire.

Les valeurs SPF ci-dessus sont vérifiées : `spf.brevo.com` publie bien un enregistrement, et
`smtp-relay.brevo.com` (172.246.243.66) tombe dans son bloc `172.246.0.0/18`.

> **Le DMARC du marketing démarre en `p=quarantine`, pas `p=reject`.** Un `reject` sur un
> sous-domaine dont la réputation n'est pas encore établie fait disparaître les messages
> plutôt que de les mettre de côté — et l'on perd le signal qui permettrait de corriger.
> Passer à `reject` après un mois de rapports propres.

---

## 2. Installation

Toutes les commandes depuis `maxmorrys-vps` (alias SSH), dans `/opt/maxmorrys-stack/`.

```bash
# 1. Les secrets, dans le .env du stack — jamais dans le dépôt.
#    Le mot de passe admin n'y reste QUE le temps du premier démarrage (voir compose).
cat >> /opt/maxmorrys-stack/.env <<'EOF'
LISTMONK_DB_PASSWORD=<mot de passe long, tiré au hasard>
LISTMONK_ADMIN_USER=<identifiant>
LISTMONK_ADMIN_PASSWORD=<mot de passe long, tiré au hasard>
EOF

# 2. Fusionner les deux services dans le docker-compose.yml du stack,
#    puis le fragment Caddy dans le Caddyfile.

# 3. Démarrage — Listmonk applique son schéma tout seul au premier lancement.
docker compose up -d maxmorrys-listmonk-db maxmorrys-listmonk
docker compose logs -f maxmorrys-listmonk   # attendre « listening on 0.0.0.0:9000 »

# 4. Une fois le compte administrateur créé, RETIRER les deux variables d'admin du .env
#    et redémarrer : les laisser réécrit le mot de passe à chaque redémarrage.

# 5. La sauvegarde quotidienne.
install -m 755 sauvegarde.sh /opt/maxmorrys-stack/sauvegarde-listmonk.sh
( crontab -l 2>/dev/null; echo '0 2 * * * /opt/maxmorrys-stack/sauvegarde-listmonk.sh >> /var/log/listmonk-backup.log 2>&1' ) | crontab -
/opt/maxmorrys-stack/sauvegarde-listmonk.sh    # premier passage à la main : il doit dire OK
```

---

## 3. Le relais Brevo

Dans Listmonk, **Settings → SMTP**, un seul serveur :

| Champ | Valeur |
|---|---|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Auth protocol | `LOGIN` |
| Username | l'identifiant SMTP Brevo (≠ l'adresse e-mail du compte) |
| Password | la clé SMTP Brevo — **pas** la clé API v3 |
| TLS | `STARTTLS`, vérification activée |
| Max connections | `5` pour commencer |

La clé vit dans Listmonk et dans `/opt/maxmorrys-stack/.env`. Le dépôt déclare déjà
`BREVO_API_KEY` **vide** dans `paperclip/org.json` — il doit le rester.

Puis **Settings → General** : expéditeur `lettre@lettre.maxmorrys.me`, et l'URL racine
`https://listmonk.maxmorrys.me` (elle construit les liens de désabonnement natifs).

> Listmonk pose `List-Unsubscribe` et `List-Unsubscribe-Post` de lui-même. C'est une des
> raisons de ce montage : le binding Cloudflare, tel qu'il est typé, n'expose aucun en-tête
> personnalisé et ne pourrait pas les porter.

---

## 4. Vérification

```bash
# La console répond, avec son certificat.
curl -sI https://listmonk.maxmorrys.me | head -3

# La console n'est PAS indexable.
curl -sI https://listmonk.maxmorrys.me | grep -i x-robots-tag

# Le port 9000 n'est pas joignable depuis l'extérieur.
curl -sS --max-time 5 http://158.220.124.185:9000 && echo "⚠️ EXPOSÉ" || echo "OK, fermé"

# L'authentification du sous-domaine d'envoi.
dig +short TXT lettre.maxmorrys.me
dig +short TXT _dmarc.lettre.maxmorrys.me

# ⚠️ Et surtout : le transactionnel n'a pas bougé.
dig +short TXT mail.maxmorrys.me
dig +short TXT _dmarc.mail.maxmorrys.me    # doit toujours dire p=reject
```

Puis une campagne de test vers une adresse Gmail, et **« Afficher l'original »** : trois
`PASS` exigés — SPF, DKIM, DMARC — comme pour le canal transactionnel.

---

## 5. Ce que ce dossier ne fait pas

- **Il n'installe rien tout seul.** Les commandes sont à jouer à la main sur le VPS ; aucun
  script ne s'y connecte depuis le dépôt.
- **Il ne remplace pas** `WF-EMAIL-SEND` / `WF-EMAIL-NOTIFY` de n8n : ces workflows sont
  inactifs et destinés à être abandonnés, pas réactivés. Leur circuit d'approbation Telegram
  reste en revanche un bon modèle pour valider une campagne avant envoi.
- **Il ne synchronise aucune audience.** C'est le lot suivant : un cron du Worker qui pousse
  vers l'API Listmonk les abonnés consentants, et EUX SEULS — jamais les adresses issues de
  `appointments`, `messages` ou `agency_leads`, qui ne recueillent aucun consentement.
