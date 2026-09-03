const { GlassPanel, TerritoryCard, Button, Field, Switch, Segmented, LessonRow, ChipRow, Tag, Avatar, CheckLine, DocLine, PriceBlock, ProgressBar, TabBar, Icon, IconButton, Wordmark } = window.DS;
/* `ONGLETS` vient de ScreensNatifApp.js, chargé avant celui-ci. */

/* ══════════════════════════════════════════════════════════════════════════════
   PORTAGE — COMPTE, PRÉFÉRENCES ET LE CLUB.

   Ce lot est celui où les RÈGLES DES MAGASINS décident du dessin, trois fois — pas une.
   Aucune n'est un détail juridique : chacune change un écran.

   · CONNEXION. L'App Store impose « Se connecter avec Apple » dès qu'on propose une
     connexion tierce (règle 4.8). Offrir Google sans Apple fait rejeter l'app. Le bouton
     n'existe donc que dans le châssis iOS — première fois du portage qu'un écran diffère
     par son CONTENU et pas seulement par son cadre.

   · SUPPRESSION DE COMPTE. L'App Store exige qu'elle soit faisable DANS l'app
     (règle 5.1.1(v)) : un lien vers le site ne suffit pas. Le web le faisait déjà bien,
     donc l'écran se porte — mais il devient obligatoire au lieu d'être vertueux.

   · ABONNEMENT AU CLUB. Même règle que les formations : 19 900 F encaissés dans l'app
     imposent l'achat intégré. Le mur renvoie donc au site, comme celui des cours.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ══ 1 · CONNEXION ══ */
function NatConnexion({os}){
  return (
    <NativeScreen os={os} territory="forme"
      droite={<IconButton label="Fermer"><Icon name="close" size={17} strokeWidth={2.4} /></IconButton>}>
      <div style={{minHeight:'96%',display:'flex',flexDirection:'column',justifyContent:'center',paddingBottom:'20px'}}>
        <div className="rv-s"><Wordmark brand="rysmo" size={30} /></div>
        <NTitre size={29} lines={['CONTENT DE','TE REVOIR.']} style={{marginTop:'18px'}} />

        <GlassPanel level="hero" padding={20} className="rv" style={{'--i':4,marginTop:'20px'}}>
          {/* iOS : obligatoire dès qu'une connexion tierce est proposée (règle 4.8).
              La marque Apple doit venir de l'asset officiel fourni par Apple — elle ne se
              redessine pas, et son usage est imposé par les mêmes directives. */}
          {os === 'ios' && (
            <Button style={{background:'#0E1116',color:'#fff',marginBottom:'9px'}}>
              <span aria-hidden="true" style={{width:'19px',height:'19px',borderRadius:'4px',
                background:'rgba(255,255,255,.18)',display:'grid',placeItems:'center',
                fontFamily:'var(--f-mono)',fontSize:'8px',fontWeight:700}}>◻</span>
              Continuer avec Apple
            </Button>
          )}
          <Button tone="ghost" style={{background:'rgba(255,255,255,.9)'}}>
            <img src="../../assets/icons/google.svg" alt="" width="19" height="19" style={{display:'block'}} />
            Continuer avec Google
          </Button>
          <div style={{display:'flex',alignItems:'center',gap:'12px',margin:'18px 0'}}>
            <span style={{flex:1,height:'1px',background:'var(--border-hair)'}} />
            <NSourcil style={{margin:0}}>ou</NSourcil>
            <span style={{flex:1,height:'1px',background:'var(--border-hair)'}} />
          </div>
          <Field label="Ton e-mail" placeholder="aissatou@exemple.sn" style={{marginTop:0}} />
          <Field label="Ton mot de passe" value="••••••••••" state="focus"
            trailing={<Icon name="eye" size={18} color="#5A6472" />} />
          <Button tone="forme" style={{marginTop:'17px'}}>Je me connecte</Button>
          <p style={{textAlign:'center',fontSize:'13px',color:'var(--text-muted)',margin:'13px 0 0'}}>Mot de passe oublié ?</p>
        </GlassPanel>

        <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'14px'}}>
          <NSourcil style={{marginBottom:'6px'}}>
            {os === 'ios' ? 'Trois moyens, un seul compte' : 'Deux moyens, un seul compte'}</NSourcil>
          <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>
            {os === 'ios'
              ? 'Apple, Google ou ton e-mail : tu retrouves les mêmes cours, la même progression, les mêmes certificats. Ce n\u2019est pas trois comptes.'
              : 'Google ou ton e-mail : tu retrouves les mêmes cours, la même progression, les mêmes certificats. Ce n\u2019est pas deux comptes.'}</p>
        </GlassPanel>

        <p className="rv" style={{'--i':6,textAlign:'center',fontSize:'13.5px',color:'var(--text-muted)',marginTop:'18px'}}>
          Pas encore de compte ? <b style={{color:'var(--mm-bleu)'}}>Crée-le, c'est gratuit</b></p>
      </div>
    </NativeScreen>
  );
}

/* ══ 2 · CRÉATION DE COMPTE ══
   La case de consentement n'est JAMAIS pré-cochée, et le consentement est horodaté. */
function NatCreation({os}){
  const [news,setNews] = React.useState(false);
  return (
    <NativeScreen os={os} territory="forme" retour="Connexion" titre={os==='android'?'Créer un compte':null}>
      <NTitre size={29} lines={['ON COMMENCE','PAR TOI.']} style={{marginTop:'10px'}} />

      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':3,marginTop:'20px'}}>
        {os === 'ios' && (
          <Button style={{background:'#0E1116',color:'#fff',marginBottom:'9px'}}>
            <span aria-hidden="true" style={{width:'19px',height:'19px',borderRadius:'4px',
              background:'rgba(255,255,255,.18)',display:'grid',placeItems:'center',
              fontFamily:'var(--f-mono)',fontSize:'8px',fontWeight:700}}>◻</span>
            Continuer avec Apple
          </Button>
        )}
        <Button tone="ghost" style={{background:'rgba(255,255,255,.9)'}}>
          <img src="../../assets/icons/google.svg" alt="" width="19" height="19" style={{display:'block'}} />
          Continuer avec Google
        </Button>
        <div style={{display:'flex',alignItems:'center',gap:'12px',margin:'18px 0'}}>
          <span style={{flex:1,height:'1px',background:'var(--border-hair)'}} />
          <NSourcil style={{margin:0}}>ou</NSourcil>
          <span style={{flex:1,height:'1px',background:'var(--border-hair)'}} />
        </div>
        <Field label="Ton prénom et ton nom" value="Aïssatou Ndiaye" style={{marginTop:0}} />
        <Field label="Ton e-mail" placeholder="aissatou@exemple.sn" />
        <Field label="Ton mot de passe" value="••••••••••"
          trailing={<Icon name="eye" size={18} color="#5A6472" />} hint="Huit caractères au minimum." />

        <span className="mm-press" onClick={()=>setNews(!news)} style={{display:'flex',gap:'11px',
          alignItems:'flex-start',marginTop:'16px',cursor:'pointer'}}>
          <span style={{width:'24px',height:'24px',borderRadius:'7px',flex:'0 0 auto',marginTop:'1px',
            border:'1.5px solid '+(news?'var(--ink)':'var(--ctl-radio-brd)'),
            background:news?'var(--ink)':'var(--ctl-off-bg)',display:'grid',placeItems:'center'}}>
            {news && <Icon name="check" size={14} color="#fff" strokeWidth={3.4} />}
          </span>
          <span style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.45}}>
            Je veux recevoir la lettre d'information. Je peux me désinscrire à tout moment —
            <b style={{color:'var(--mm-bleu)'}}> politique de confidentialité</b>.</span>
        </span>

        <Button tone="forme" style={{marginTop:'17px'}}>Crée mon compte</Button>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':4,marginTop:'14px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Cette case n'est jamais pré-cochée</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Le consentement est horodaté, et la règle de la base refuse une inscription sans lui. Créer un compte n'inscrit à rien d'autre.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 3 · PRÉFÉRENCES ══
   La section des notifications devient RÉELLE : elle reflète l'état de la permission
   système, et la ligne « par e-mail » reste grisée parce qu'aucun canal n'existe. */
function NatPreferences({os}){
  return (
    <NativeScreen os={os} territory="transforme" retour="Espace" titre={os==='android'?'Mon profil':null}
      tabbar={<TabBar items={ONGLETS()} active="Profil" />}>
      <GlassPanel level="flat" padding={18} className="rv" style={{marginTop:'8px'}}>
        <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
          <Avatar initials="A" size={54} />
          <div style={{flex:1}}>
            <p style={{fontSize:'16px',fontWeight:700,margin:0}}>Aïssatou Ndiaye</p>
            <p className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)',margin:'2px 0 0'}}>aissatou@exemple.sn</p>
          </div>
          <Button tone="quiet" size="sm" fullWidth={false}>Modifier</Button>
        </div>
      </GlassPanel>

      <NSourcil style={{'--i':2,marginTop:'22px'}}>Notifications</NSourcil>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':3,marginTop:'10px'}}>
        <LessonRow state="plain" title="Reprise de cours" meta="après 5 jours sans activité" trailing={<Switch on />} />
        <LessonRow state="plain" title="Ta série va se casser" meta="le soir du 5e jour" trailing={<Switch on />} />
        <LessonRow state="plain" title="Session du Club" meta="1 h avant, si tu es inscrite" trailing={<Switch on />} />
        <LessonRow state="plain" title={<span style={{color:'var(--text-faint)'}}>Par e-mail</span>}
          meta="aucun canal d'envoi n'existe encore" trailing={<Switch disabled />} last />
      </GlassPanel>
      <GlassPanel padding={16} className="rv" style={{'--i':4,marginTop:'10px'}}>
        <div style={{display:'flex',gap:'11px',alignItems:'flex-start'}}>
          <span style={{width:'30px',height:'30px',borderRadius:'10px',background:'rgba(15,123,82,.14)',
            display:'grid',placeItems:'center',flex:'0 0 auto'}}>
            <Icon name="check" size={15} color="#0F7B52" strokeWidth={3.2} /></span>
          <div style={{flex:1}}>
            <p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Autorisées sur cet appareil</p>
            <p style={{fontSize:'12px',color:'var(--text-muted)',lineHeight:1.5,margin:'3px 0 0'}}>
              Si tu changes d'avis, ça se coupe dans {os === 'ios' ? 'les Réglages' : 'les paramètres'} du
              téléphone — l'app ne peut plus reposer la question.</p>
          </div>
        </div>
      </GlassPanel>

      <NSourcil style={{'--i':5,marginTop:'22px'}}>Langue et apparence</NSourcil>
      <div className="rv" style={{'--i':5,marginTop:'10px'}}><Segmented options={['Français','English']} value="Français" /></div>
      <div className="rv" style={{'--i':6,marginTop:'8px'}}><Segmented options={['Clair','Sombre','Système']} value="Système" /></div>

      <NSourcil style={{'--i':7,marginTop:'22px'}}>Ton répétiteur</NSourcil>
      <GlassPanel level="flat" padding={17} className="rv" style={{'--i':7,marginTop:'10px'}}>
        <Field label="Comment tu l'appelles" value="Répétiteur" style={{marginTop:0}}
          hint="Par défaut : Répétiteur. Le nom ne change que pour toi." />
      </GlassPanel>

      <NSourcil style={{'--i':8,marginTop:'22px'}}>Sur cet appareil</NSourcil>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':8,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="lock" size={14} />}
          title={os === 'ios' ? 'Entrer avec Face ID' : "Entrer avec l'empreinte"} meta="raccourci, pas remplacement"
          trailing={<Switch on />} />
        <LessonRow state="plain" icon={<Icon name="download" size={14} />} title="Téléchargements" meta="3 leçons · 21 Mo"
          trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} last />
      </GlassPanel>

      <NSourcil style={{'--i':9,marginTop:'22px'}}>Tes données</NSourcil>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':9,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="download" size={14} />} title="Exporter mes données"
          meta="tout ce qui te concerne, en un fichier"
          trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="trash" size={14} color="#B4231F" />}
          iconBackground="rgba(180,35,31,.12)"
          title={<span style={{color:'var(--stop)'}}>Supprimer mon compte</span>} meta="définitif, sans passer par le support"
          trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} last />
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 4 · SUPPRESSION DE COMPTE ══
   Faisable DANS l'app, sans lien sortant : l'App Store l'exige (règle 5.1.1(v)). Le web
   le faisait déjà bien ; ici ça devient obligatoire au lieu d'être vertueux. */
function NatSuppression({os}){
  return (
    <NativeScreen os={os} territory="transforme" retour="Profil" titre={os==='android'?'Supprimer mon compte':null}>
      <NTitre size={27} lines={['Ce qui part','avec ton compte.']} style={{marginTop:'10px'}} />

      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':3,marginTop:'20px'}}>
        <LessonRow state="plain" title="2 inscriptions et leur progression" meta="accès à vie perdu, sans remboursement" />
        <LessonRow state="plain" title="Tes 14 notes personnelles" meta="elles ne sont nulle part ailleurs" />
        <LessonRow state="plain" title="La mémoire de ton répétiteur" meta="effaçable seule, sans supprimer le compte" />
        <LessonRow state="plain" title="Ton abonnement au Club" meta="échéance au 14/02/2027, non remboursée" />
        <LessonRow state="plain" title="Les 21 Mo téléchargés sur ce téléphone" meta="supprimés à la déconnexion" last />
      </GlassPanel>

      <GlassPanel padding={18} className="rv" style={{'--i':4,marginTop:'14px',borderColor:'rgba(15,123,82,.28)'}}>
        <p style={{fontSize:'14.5px',fontWeight:700,color:'var(--ok)',margin:0}}>Ce qui reste</p>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:'6px 0 0'}}>Tes certificats déjà émis restent vérifiables par leur code — c'est le principe même d'un certificat. Le miroir public ne porte aucun identifiant de compte.</p>
      </GlassPanel>

      <GlassPanel padding={19} className="rv" style={{'--i':5,marginTop:'14px'}}>
        <Field label={<>Écris <b className="mm-num" style={{color:'var(--ink)'}}>SUPPRIMER</b> pour confirmer</>}
          placeholder="SUPPRIMER" state="error" hint="Le texte ne correspond pas encore." style={{marginTop:0}} />
        <Button disabled style={{marginTop:'16px'}}>Supprimer définitivement</Button>
        <Button tone="quiet" fullWidth style={{marginTop:'9px'}}>J'exporte d'abord mes données</Button>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'14px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Pourquoi tout se passe ici</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>La suppression se fait <b style={{color:'var(--ink)'}}>dans l'app</b>, sans lien vers le site et sans écrire au support. C'est la règle de l'App Store, et c'était déjà la nôtre.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 5 · CLUB, MUR D'ABONNEMENT ══
   Même règle que les formations : 19 900 F encaissés dans l'app imposent l'achat intégré.
   Le mur renvoie donc au site, et le prix reste cadré au mois ET à l'année. */
function NatClubMur({os}){
  return (
    <NativeScreen os={os} territory="transforme" retour="Espace" titre={os==='android'?'Le Club':null}
      tabbar={<TabBar items={ONGLETS()} active="Club" />}>
      <NSourcil style={{marginTop:'6px'}}>Je te transforme · payant, fermé</NSourcil>
      <NTitre size={29} lines={['LE CLUB DES','DIGITOS.']} />
      <NChapo>Une année avec moi, et avec ceux qui font la même chose que toi. Des sessions en direct, des missions qui circulent, et quelqu'un à qui poser la question que tu ne poses à personne.</NChapo>

      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':5,marginTop:'18px'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:'8px'}}>
          <b className="mm-num" style={{fontSize:'34px',letterSpacing:'-.045em',color:'var(--mm-violet-t)'}}>1 658</b>
          <span style={{fontSize:'14px',fontWeight:600}}>F / mois</span>
        </div>
        <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'5px 0 0'}}>Facturé <b className="mm-num" style={{color:'var(--ink)'}}>19 900 F</b>, une fois, pour douze mois.</p>
        <div style={{height:'1px',background:'var(--border-hair)',margin:'15px 0'}} />
        <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>
          L'abonnement se prend <b style={{color:'var(--ink)'}}>sur le site</b> — {os === 'ios' ? "l\u2019App Store" : 'Google Play'} exige
          son propre système de paiement pour tout achat fait dans une application, et il ne
          connaît ni Wave ni Orange&nbsp;Money.</p>
        <Button tone="transforme" style={{marginTop:'15px'}}>
          Ouvrir sur maxmorrys.me <Icon name="forward" size={16} strokeWidth={2.6} />
        </Button>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>
          Parrainé ? Ton code te fait <b className="mm-num">16 915 F</b>.</p>
      </GlassPanel>

      <NSourcil style={{'--i':6,marginTop:'24px'}}>Ce que tu paies, précisément</NSourcil>
      <GlassPanel padding={18} className="rv" style={{'--i':6,marginTop:'10px'}}>
        <CheckLine style={{marginTop:0,fontSize:'14px'}}><b className="mm-num">2</b> sessions en direct par mois, avec moi</CheckLine>
        <CheckLine style={{fontSize:'14px'}}>Les missions que je sors de mon carnet</CheckLine>
        <CheckLine style={{fontSize:'14px'}}>Les ateliers à Dakar, places membres</CheckLine>
        <CheckLine style={{fontSize:'14px'}}>Une réponse de moi, pas d'un modérateur</CheckLine>
        <CheckLine style={{fontSize:'14px'}}>Ton répétiteur à <b className="mm-num">5</b> questions/jour au lieu de <b className="mm-num">2</b></CheckLine>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'14px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que je ne te promets pas</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Le Club a ouvert cette année. Je ne t'annonce pas un nombre de membres, parce qu'il serait faux — et parce que tu le vérifierais au premier écran après avoir payé.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 6 · CLUB, LE FIL ══
   Le bilan d'abonnement en tête, permanent. Carte d'encre opaque : la page est claire. */
function NatClubFil({os}){
  return (
    <NativeScreen os={os} territory="transforme" titre={os==='android'?'Le fil':null}
      droite={<><IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton>
        <Avatar initials="A" size={os==='android'?40:36} /></>}
      tabbar={<TabBar items={ONGLETS()} active="Club" />}>
      <GlassPanel level="ink" padding={18} className="rv" style={{marginTop:'8px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
          <div>
            <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',
              color:'var(--text-muted)',margin:0}}>Ton abonnement, depuis février</p>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.032em',
              margin:'5px 0 0',color:'var(--text-body)'}}>Ce qu'il t'a apporté</p>
          </div>
          <Tag tone="ok">Actif</Tag>
        </div>
        <div style={{display:'flex',gap:'10px',marginTop:'15px'}}>
          {[['6','sessions suivies'],['14','opportunités vues'],['2','missions décrochées']].map(([n,l])=>(
            <div key={l} style={{flex:1}}>
              <p className="mm-num" style={{fontSize:'23px',margin:0,color:'var(--text-body)'}}>{n}</p>
              <p style={{fontSize:'10.5px',color:'var(--text-muted)',lineHeight:1.3,margin:0}}>{l}</p>
            </div>
          ))}
        </div>
        <div style={{height:'1px',background:'rgba(255,255,255,.12)',margin:'14px 0'}} />
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
          <span style={{fontSize:'12px',color:'var(--text-muted)'}}>Échéance</span>
          <b className="mm-num" style={{fontSize:'12.5px',color:'var(--text-body)'}}>14/02/2027 · rien n'est prélevé</b>
        </div>
      </GlassPanel>

      <div className="rv" style={{'--i':2,marginTop:'18px'}}>
        <ChipRow options={['Fil','Discussions','Membres','Opportunités']} value="Fil" />
      </div>

      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':3,marginTop:'14px'}}>
        <div style={{display:'flex',gap:'11px',alignItems:'center'}}>
          <Avatar initials="SK" size={38} />
          <div style={{flex:1}}>
            <p style={{fontSize:'14px',fontWeight:600,margin:0}}>Seynabou K.</p>
            <p className="mm-num" style={{fontSize:'11px',color:'var(--text-faint)',margin:0}}>Entraide · il y a 2 h</p>
          </div>
          <Tag>Entraide</Tag>
        </div>
        <p style={{fontSize:'14px',lineHeight:1.5,margin:'12px 0 0'}}>J'ai refait ma fiche Google en suivant le module 2. Trois appels en une semaine, sur des recherches « coiffure Ouakam ». Je mets ma liste de mots en commentaire si ça sert à quelqu'un.</p>
        <div style={{display:'flex',gap:'18px',marginTop:'14px',alignItems:'center'}}>
          <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}>
            <Icon name="heart" size={16} color="#5A17BE" /><b className="mm-num" style={{fontSize:'12.5px'}}>12</b></span>
          <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}>
            <Icon name="repeat" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>3</b></span>
          <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}>
            <Icon name="comment" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>7</b></span>
        </div>
      </GlassPanel>

      <div className="rv" style={{'--i':4,marginTop:'12px'}}>
        <TerritoryCard first territory="transforme" meta="Mission · Dakar · publiée hier"
          title="Fiche Google pour trois boutiques">
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
            <PriceBlock amount="180 000" size={21} note="Budget annoncé par la personne qui publie" />
            <Button tone="transforme" size="sm" fullWidth={false}>Postuler</Button>
          </div>
        </TerritoryCard>
      </div>
    </NativeScreen>
  );
}

/* ══ 7 · CLUB, AGENDA ══
   Le seul écran du portage qui GAGNE une action native : « ajouter à mon agenda ». Une
   session dans l'agenda système survit à la désinstallation de l'app — c'est le meilleur
   rappel possible, et il ne coûte aucune notification. */
function NatClubAgenda({os}){
  return (
    <NativeScreen os={os} territory="transforme" retour="Club" titre={os==='android'?'Agenda':null}
      tabbar={<TabBar items={ONGLETS()} active="Club" />}>
      <div className="rv" style={{marginTop:'8px'}}>
        <Segmented options={['À venir','Mes inscriptions','Passées']} value="À venir" />
      </div>

      <NSourcil style={{'--i':2,marginTop:'22px'}}>Jeudi 10 septembre</NSourcil>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':3,marginTop:'10px'}}>
        <div style={{display:'flex',gap:'13px'}}>
          <span style={{width:'44px',height:'44px',borderRadius:'14px',background:'var(--action-transforme)',
            display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="chat" size={20} color="#fff" /></span>
          <div style={{flex:1}}>
            <p style={{fontSize:'15px',fontWeight:700,margin:0}}>Ta fiche Google, en direct</p>
            <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'3px 0 0'}}>20:00 → 21:00 · en ligne</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',marginTop:'14px'}}>
          <Tag tone="ok">Tu es inscrite</Tag>
          <Button tone="quiet" size="sm" fullWidth={false}>Me désinscrire</Button>
        </div>
        {/* L'action que le web ne pouvait pas offrir. */}
        <Button tone="ghost" style={{marginTop:'10px'}}>
          <Icon name="calendar" size={17} strokeWidth={2.2} /> Ajouter à mon agenda
        </Button>
      </GlassPanel>

      <NSourcil style={{'--i':4,marginTop:'22px'}}>Samedi 20 septembre</NSourcil>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':5,marginTop:'10px'}}>
        <div style={{display:'flex',gap:'13px'}}>
          <span style={{width:'44px',height:'44px',borderRadius:'14px',background:'var(--action-digitalise)',
            display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="users" size={20} color="#fff" /></span>
          <div style={{flex:1}}>
            <p style={{fontSize:'15px',fontWeight:700,margin:0}}>Atelier fiche produit</p>
            <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'3px 0 0'}}>10:00 → 13:00 · Dakar, Point E</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',marginTop:'14px'}}>
          <span className="mm-num" style={{fontSize:'12.5px',color:'var(--mm-teal-t)'}}>4 / 12 places</span>
          <Button tone="digitalise" size="sm" fullWidth={false}>Je réserve</Button>
        </div>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'18px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Pourquoi l'agenda système, et pas une notification</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Une session dans ton agenda <b style={{color:'var(--ink)'}}>survit à la désinstallation de l'app</b> et ne dépend d'aucune permission de notification. C'est le meilleur rappel possible, et il ne me coûte rien.</p>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'10px 0 0'}}>Te réinscrire ne crée pas de doublon, et personne ne peut t'inscrire à ta place.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

const MM_EXPORT = {NatConnexion,NatCreation,NatPreferences,NatSuppression,NatClubMur,NatClubFil,NatClubAgenda};
Object.assign(window, MM_EXPORT);
window.MMNAT = Object.assign(window.MMNAT||{}, MM_EXPORT);
