const { GlassPanel, Button, Field, Switch, Segmented, LessonRow, Tag, Avatar, Icon, IconButton, Wordmark } = window.DS;

function Case({on,children}){
  return (
    <span style={{display:'flex',gap:'11px',alignItems:'flex-start',cursor:'pointer'}}>
      <span style={{width:'22px',height:'22px',borderRadius:'7px',flex:'0 0 auto',marginTop:'1px',
        border:'1.5px solid '+(on?'var(--ink)':'rgba(14,17,22,.24)'),background:on?'var(--ink)':'rgba(255,255,255,.7)',
        display:'grid',placeItems:'center'}}>{on && <Icon name="check" size={13} color="#fff" strokeWidth={3.4} />}</span>
      <span style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.45}}>{children}</span>
    </span>
  );
}

/* ── 1 · CONNEXION ── */
function Connexion({go}){
  return (
    <Screen territory="forme"
      bar={<AppBar left={<IconButton label="Fermer"><Icon name="close" strokeWidth={2.4} /></IconButton>} center={<Wordmark brand="rysmo" size={22} />} />}>
      <Display size="sm" lines={['CONTENT DE','TE REVOIR.']} style={{marginTop:'14px'}} />
      <GlassPanel level="hero" padding={22} className="rv" style={{'--i':3,marginTop:'20px'}}>
        <Button tone="ghost">
          <img src="../../assets/icons/google.svg" alt="" width="19" height="19" style={{display:'block'}} /> Continuer avec Google
        </Button>
        <div style={{display:'flex',alignItems:'center',gap:'12px',margin:'18px 0'}}>
          <span style={{flex:1,height:'1px',background:'rgba(14,17,22,.12)'}} />
          <Eyebrow>ou</Eyebrow>
          <span style={{flex:1,height:'1px',background:'rgba(14,17,22,.12)'}} />
        </div>
        <Field label="Ton e-mail" placeholder="aissatou@exemple.sn" style={{marginTop:0}} />
        <Field label="Ton mot de passe" value="••••••••••" state="focus" trailing={<Icon name="eye" size={18} color="#5A6472" />} />
        <Button tone="forme" style={{marginTop:'17px'}}>Je me connecte</Button>
        <p style={{textAlign:'center',fontSize:'13px',color:'var(--text-muted)',margin:'13px 0 0'}}>Mot de passe oublié ?</p>
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':4,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Les deux moyens mènent au même endroit</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Que tu passes par Google ou par ton e-mail, tu retrouves les mêmes cours, la même progression, les mêmes certificats. Ce n'est pas deux comptes.</p>
      </GlassPanel>
      <p className="rv" style={{'--i':5,textAlign:'center',fontSize:'13.5px',color:'var(--text-muted)',marginTop:'20px'}}>Pas encore de compte ? <b style={{color:'var(--mm-bleu)'}}>Crée-le, c'est gratuit</b></p>
    </Screen>
  );
}

/* ── 2 · CRÉATION DE COMPTE ── FR-006 : case jamais pré-cochée. */
function Creation({go}){
  const [news,setNews] = React.useState(false);
  return (
    <Screen territory="forme"
      bar={<AppBar left={<BackButton onClick={()=>go&&go('connexion')} />} center={<Wordmark brand="rysmo" size={22} />} />}>
      <Display size="sm" lines={['ON COMMENCE','PAR TOI.']} style={{marginTop:'14px'}} />
      <GlassPanel level="hero" padding={22} className="rv" style={{'--i':3,marginTop:'20px'}}>
        <Button tone="ghost">
          <img src="../../assets/icons/google.svg" alt="" width="19" height="19" style={{display:'block'}} /> Continuer avec Google
        </Button>
        <div style={{display:'flex',alignItems:'center',gap:'12px',margin:'18px 0'}}>
          <span style={{flex:1,height:'1px',background:'rgba(14,17,22,.12)'}} />
          <Eyebrow>ou</Eyebrow>
          <span style={{flex:1,height:'1px',background:'rgba(14,17,22,.12)'}} />
        </div>
        <Field label="Ton prénom et ton nom" value="Aïssatou Ndiaye" style={{marginTop:0}} />
        <Field label="Ton e-mail" placeholder="aissatou@exemple.sn" />
        <Field label="Ton mot de passe" value="••••••••••" trailing={<Icon name="eye" size={18} color="#5A6472" />} hint="Huit caractères au minimum." />
        <div style={{marginTop:'16px'}}>
          <span onClick={()=>setNews(!news)}>
            <Case on={news}>Je veux recevoir la lettre d'information. Je peux me désinscrire à tout moment — <b style={{color:'var(--mm-bleu)'}}>politique de confidentialité</b>.</Case>
          </span>
        </div>
        <Button tone="forme" style={{marginTop:'17px'}}>Crée mon compte</Button>
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':4,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Cette case n'est jamais pré-cochée</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Le consentement est horodaté, et la règle de la base refuse une inscription sans lui. Créer un compte n'inscrit à rien d'autre.</p>
      </GlassPanel>
    </Screen>
  );
}

/* ── 3 · MOT DE PASSE OUBLIÉ ── */
function MotDePasse({go}){
  return (
    <Screen territory="forme" bar={<AppBar left={<BackButton onClick={()=>go&&go('connexion')} />} />}>
      <Display size="sm" lines={['On te remet','dedans.']} style={{marginTop:'10px'}} />
      <Lede style={{'--i':3,marginTop:'12px'}}>Donne ton e-mail : je t'envoie un lien de réinitialisation valable une heure.</Lede>
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':4,marginTop:'20px'}}>
        <Field label="Ton e-mail" value="aissatou@exemple.sn" state="focus" style={{marginTop:0}} />
        <Button tone="forme" style={{marginTop:'16px'}}>Envoie-moi le lien</Button>
      </GlassPanel>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':5,marginTop:'16px',borderColor:'rgba(15,123,82,.28)'}}>
        <div style={{display:'flex',gap:'11px'}}>
          <span style={{width:'30px',height:'30px',borderRadius:'50%',background:'rgba(15,123,82,.16)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>
            <Icon name="check" size={15} color="#0F7B52" strokeWidth={3.2} />
          </span>
          <div>
            <p style={{fontWeight:700,fontSize:'14.5px',color:'var(--ok)',margin:0}}>C'est parti</p>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'3px 0 0'}}>Si un compte existe à cette adresse, le lien y est déjà. Vérifie aussi tes indésirables.</p>
          </div>
        </div>
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi ce « si »</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Je ne te dirai jamais si une adresse a un compte ou non. Ça paraît moins serviable, mais ça évite qu'un inconnu puisse tester des adresses pour savoir qui est inscrit.</p>
      </GlassPanel>
      <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'16px'}}>Ce lien dépend d'un canal d'envoi d'e-mail, qui n'existe pas encore dans le produit.</p>
    </Screen>
  );
}

/* ── 4 · PRÉFÉRENCES ── */
function Preferences({go}){
  const [lang,setLang] = React.useState('Français');
  const [app,setApp] = React.useState('Clair');
  const [n1,setN1] = React.useState(true);
  const [n2,setN2] = React.useState(true);
  const [n3,setN3] = React.useState(true);
  return (
    <Screen territory="transforme" bar={<AppBar left={<BackButton onClick={()=>go&&go('espace')} />} center={<span style={{fontSize:'13px',fontWeight:600}}>Préférences</span>} />}>
      <GlassPanel level="flat" padding={18} className="rv">
        <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
          <Avatar initials="A" size={56} />
          <div style={{flex:1}}>
            <p style={{fontWeight:700,fontSize:'16px',margin:0}}>Aïssatou Ndiaye</p>
            <p className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)',margin:0}}>aissatou@exemple.sn</p>
          </div>
          <Button tone="quiet" size="sm">Modifier</Button>
        </div>
      </GlassPanel>
      <Eyebrow style={{'--i':2,marginTop:'22px'}}>Langue de l'interface</Eyebrow>
      <div className="rv" style={{'--i':3,marginTop:'9px'}}><Segmented options={['Français','English']} value={lang} onChange={setLang} /></div>
      <p className="rv" style={{'--i':3,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'6px'}}>Les articles sont traduits automatiquement. La version française est celle que j'écris.</p>
      <Eyebrow style={{'--i':4,marginTop:'20px'}}>Ton répétiteur</Eyebrow>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':4,marginTop:'9px'}}>
        <Field label="Comment tu l'appelles" value={tutorNom()} style={{marginTop:0}}
          hint="Par défaut : Répétiteur. Le nom ne change que pour toi." />
      </GlassPanel>
      <Eyebrow style={{'--i':4,marginTop:'20px'}}>Apparence</Eyebrow>
      <div className="rv" style={{'--i':4,marginTop:'9px'}}><Segmented options={['Clair','Sombre','Système']} value={app} onChange={setApp} /></div>
      <Eyebrow style={{'--i':5,marginTop:'22px'}}>Ce que je t'envoie</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':5,marginTop:'10px'}}>
        <LessonRow state="plain" title="Reprise de cours" meta="quand tu t'arrêtes plus de 5 jours" trailing={<Switch on={n1} onClick={()=>setN1(!n1)} />} />
        <LessonRow state="plain" title="Série quotidienne" meta="avant qu'elle ne se casse" trailing={<Switch on={n2} onClick={()=>setN2(!n2)} />} />
        <LessonRow state="plain" title="Digest du Club" meta="un résumé par semaine" trailing={<Switch on={n3} onClick={()=>setN3(!n3)} />} />
        <LessonRow state="plain" title={<span style={{color:'var(--text-faint)'}}>Par e-mail</span>} meta="pas encore disponible" trailing={<Switch disabled />} last />
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'14px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce que ces interrupteurs font aujourd'hui</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Ils règlent ce qui arrive dans ton centre de notifications, dans l'application. <b style={{color:'var(--ink)'}}>Aucun e-mail ne part encore</b> — la ligne grisée le dit au lieu de le laisser croire.</p>
      </GlassPanel>
      <Eyebrow style={{'--i':7,marginTop:'22px'}}>Tes données</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':7,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="download" size={14} />} title="Exporter mes données" meta="tout ce qui te concerne, en un fichier" />
        <LessonRow state="plain" icon={<Icon name="trash" size={14} color="#B4231F" />} iconBackground="rgba(180,35,31,.12)"
          title={<span style={{color:'var(--stop)'}}>Supprimer mon compte</span>} meta="définitif, sans passer par le support" last />
      </GlassPanel>
    </Screen>
  );
}

/* ── 5 · SUPPRESSION ── */
function Suppression({go}){
  return (
    <Screen territory="transforme" bar={<AppBar left={<BackButton onClick={()=>go&&go('preferences')} />} />}>
      <Display size="sm" lines={['Ce qui part','avec ton compte.']} style={{marginTop:'10px'}} />
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':3,marginTop:'20px'}}>
        <LessonRow state="plain" title="2 inscriptions et leur progression" meta="accès à vie perdu, sans remboursement" />
        <LessonRow state="plain" title="Tes notes personnelles" meta="14 notes" />
        <LessonRow state="plain" title={'La mémoire de ton '+tutorNom().toLowerCase()} meta="effaçable seule, sans supprimer le compte" />
        <LessonRow state="plain" title="Ton abonnement au Club" meta="échéance au 14/02/2027, non remboursée" last />
      </GlassPanel>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':4,marginTop:'16px',borderColor:'rgba(15,123,82,.28)'}}>
        <p style={{fontWeight:700,fontSize:'14.5px',color:'var(--ok)',margin:0}}>Ce qui reste</p>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Tes certificats déjà émis restent vérifiables par leur code — c'est le principe même d'un certificat. Le miroir public ne porte aucun identifiant de compte.</p>
      </GlassPanel>
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':5,marginTop:'16px'}}>
        <Field label={<>Écris <b className="mm-num" style={{color:'var(--ink)'}}>SUPPRIMER</b> pour confirmer</>} placeholder="SUPPRIMER" state="error" hint="Le texte ne correspond pas encore." style={{marginTop:0}} />
        <Button disabled style={{marginTop:'16px'}}>Supprimer définitivement</Button>
        <Button tone="quiet" fullWidth style={{marginTop:'10px'}}>J'exporte d'abord mes données</Button>
      </GlassPanel>
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'14px'}}>La suppression retire le compte d'authentification et ses documents, par traitement serveur. Elle ne passe pas par le support.</p>
    </Screen>
  );
}

const MM_EXPORT = {Case,Connexion,Creation,MotDePasse,Preferences,Suppression};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensCompte.js');
