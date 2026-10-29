# Guide — Jeton Meta d'utilisateur système (Facebook, Instagram, WhatsApp)

> Pourquoi : le jeton actuel est un jeton de page dérivé d'un compte personnel. Son accès aux données a expiré le 26/09/2026 (`data_access_expires_at`), ce qui bloque la publication. Un **utilisateur système** appartient au Business Manager, pas à une personne : son jeton peut ne jamais expirer et il n'est pas soumis à cette expiration d'accès. Il remplace donc la « ré-autorisation » de l'appli.
>
> Actifs concernés : appli Meta `1949642005700806`, page Facebook **Max-Morrys** `585922641265463`, Instagram **@maxmorrys.me** `17841453827450786`, compte WhatsApp Business `555647320972170` (numéro `595631163627228`).

## 1. Vérifier que tout appartient au même Business Manager (5 min)

1. Ouvre https://business.facebook.com/settings (Paramètres de l'entreprise).
2. **Comptes → Pages** : la page Max-Morrys doit y figurer. Sinon : « Ajouter → Ajouter une page » (demande ou revendication).
3. **Comptes → Comptes Instagram** : @maxmorrys.me doit y figurer, relié à la page.
4. **Comptes → Applications** : l'appli `1949642005700806` doit appartenir à ce Business (ou y être connectée).
5. **Comptes → Comptes WhatsApp** : le compte `555647320972170`.

## 2. Créer l'utilisateur système (3 min)

1. **Utilisateurs → Utilisateurs système → Ajouter**.
2. Nom : `maxmorrys-automation` — Rôle : **Administrateur** (« Admin system user »).
3. Sur sa fiche, **Attribuer des actifs** :
   - Page Max-Morrys : **Contrôle total** (tout cocher) ;
   - Compte Instagram @maxmorrys.me : **Contrôle total** ;
   - Appli `1949642005700806` : **Contrôle total / Gérer l'application** ;
   - Compte WhatsApp : **Contrôle total** ;
   - Compte publicitaire : seulement si on veut que Koffi prépare des campagnes plus tard (lecture d'abord).

## 3. Générer le jeton (3 min)

1. Sur la fiche de l'utilisateur système : **Générer un nouveau jeton**.
2. Appli : `1949642005700806`. Expiration : **Jamais**.
3. Autorisations à cocher :
   - Pages : `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `pages_manage_metadata`, `pages_read_user_content`, `pages_manage_engagement`, `read_insights` ;
   - Instagram : `instagram_basic`, `instagram_content_publish`, `instagram_manage_comments`, `instagram_manage_insights` ;
   - WhatsApp : `whatsapp_business_messaging`, `whatsapp_business_management` ;
   - Général : `business_management` ;
   - Publicité (facultatif) : `ads_read` (puis `ads_management` si on lance des campagnes).
4. Copie le jeton (il ne sera plus affiché).

> Si une autorisation est grisée : l'appli doit avoir le « cas d'usage » correspondant (Facebook Login for Business / Instagram / WhatsApp) dans le tableau de bord développeur. Pour des actifs qui appartiennent au même Business que l'appli, l'accès standard suffit en général ; aucune revue d'appli n'est nécessaire.

## 4. Me transmettre le jeton sans le laisser traîner

Le plus sûr : ne pas le coller dans la conversation. Ajoute une ligne à `.env.local` (fichier jamais commité) :

```
META_SYSTEM_USER_TOKEN=EAA…
```

puis dis-moi « jeton posé ». Je ferai alors :
1. vérifier le jeton (`debug_token` : type SYSTEM_USER, expiration, autorisations) ;
2. en dériver le jeton de page (`GET /me/accounts`), non expirant lui aussi ;
3. le ranger dans les **credentials chiffrés de n8n** (et non plus dans la table NocoDB `Config`, où les secrets sont en clair), et rebrancher WF-SOCIAL-05 et les workflows WhatsApp dessus ;
4. retirer les anciens jetons de `Config` ;
5. faire un **post de test** (avec ton accord, que je supprime ensuite si tu veux) pour prouver la publication de bout en bout ;
6. diagnostiquer l'erreur HTTP 500 du numéro WhatsApp.

## 5. Après coup

- Révoque l'ancien jeton personnel si tu le souhaites (Paramètres Facebook → Sécurité → Applications et sites web).
- Garde l'utilisateur système au rôle Admin, mais ne partage jamais son jeton : il donne le contrôle total de la page.
