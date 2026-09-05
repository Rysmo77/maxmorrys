const { Mesh, GlassPanel, Button, Switch, LessonRow, Tag, Icon, IconButton, PillButton, LogoMark, Wordmark, Avatar, ProgressBar, Segmented } = window.DS;

/* ══ VERSION INSTALLABLE (PWA) — pas une application native ══
   L'application native est hors périmètre, et pas seulement par manque de moyens : Apple et
   Google prélèvent 15 à 30 % sur tout achat de contenu numérique fait dans l'application, en
   carte, sans Wave ni Orange Money. Sur une formation à 95 000 F, c'est 14 250 à 28 500 F par
   vente — et surtout, c'est le paiement en monnaie électronique locale, le seul vrai avantage
   du produit, qui disparaît de l'écran d'achat.
   Le seul argument d'installation qui vaille sur ce marché, c'est le forfait et le réseau.
   Pas la vitesse, pas les notifications. */

/* ── 1 · INVITATION À INSTALLER ──
   Discrète, en bas d'écran, après la deuxième visite. Un seul argument. */
function PwaInvitation({go}){
  return (
    <Screen territory="forme"
      bar={<AppBar left={<PillButton>Menu</PillButton>} right={<IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton>} />}>
      <Eyebrow>Je te forme</Eyebrow>
      <Display size="sm" lines={['LES MOTS QUE','TAPENT TES','CLIENTS.']} style={{marginTop:'6px'}} />
      <Lede style={{'--i':5,marginTop:'12px'}}>Module 3 · leçon 5. Tu t'étais arrêtée ici il y a huit jours.</Lede>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':6,marginTop:'18px'}}>
        <LessonRow state="done" title="Choisir tes mots-clés" meta="06:12 · 12 Mo" />
        <LessonRow state="current" icon={<Icon name="play" size={13} color="#fff" />} iconBackground="linear-gradient(135deg,#0057BC,#6C23DD)" title="Les mots que tapent tes clients" meta="08:24 · en cours" />
        <LessonRow state="todo" title="Écrire une fiche qui remonte" meta="07:03 · 9 Mo" last />
      </GlassPanel>
      <ProgressBar value={34} style={{marginTop:'16px'}} />
      <p className="mm-num rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'8px'}}>16 / 47 leçons · 34 %</p>

      {/* La bannière : posée en bas, au-dessus du contenu, jamais en modale.
          Une modale à la deuxième visite interrompt exactement ce qu'on est venu faire. */}
      <div style={{position:'absolute',left:'14px',right:'14px',bottom:'16px',zIndex:9}}>
        <GlassPanel level="hero" padding={16} className="rv-s" style={{'--i':8}}>
          <div style={{display:'flex',gap:'13px',alignItems:'flex-start'}}>
            <LogoMark size={42} src="../../assets/logo-mm-icon.png" />
            <div style={{flex:1}}>
              <p style={{fontSize:'14.5px',fontWeight:700,letterSpacing:'-.01em',margin:0}}>Garde tes leçons hors connexion.</p>
              <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.45,margin:'4px 0 0'}}>Ajoute Rysmo à ton écran d'accueil : les leçons déjà vues restent lisibles sans réseau.</p>
            </div>
            <span style={{width:'26px',height:'26px',borderRadius:'50%',background:'var(--fill-2)',display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}>
              <Icon name="close" size={13} strokeWidth={2.6} />
            </span>
          </div>
          <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
            <Button tone="primary" size="sm" style={{flex:1}}>Ajouter à l'écran d'accueil</Button>
            <Button tone="quiet" size="sm" style={{flex:'0 0 auto'}}>Plus tard</Button>
          </div>
          <p style={{fontSize:'11px',color:'var(--text-faint)',textAlign:'center',margin:'9px 0 0'}}>Aucun téléchargement, aucun magasin d'applications.</p>
        </GlassPanel>
      </div>
    </Screen>
  );
}

/* ── 2 · HORS CONNEXION ──
   Chaque ressource porte son poids. Le forfait est compté : c'est l'information
   qui permet de décider, et elle ne se déduit d'aucune autre. */
function PwaHorsConnexion({go}){
  const [wifi,setWifi] = React.useState(true);
  return (
    <Screen territory="informe"
      bar={<AppBar left={<BackButton />} right={<Tag tone="stop">Hors connexion</Tag>} />}>
      <Display size="sm" lines={['Pas de réseau.']} style={{marginTop:'8px'}} />
      <Lede style={{'--i':2,marginTop:'11px'}}>Tu peux continuer les <b className="mm-num" style={{color:'var(--ink)'}}>3</b> leçons déjà téléchargées. Ta progression partira dès que tu retrouves du réseau.</Lede>

      <Eyebrow style={{'--i':3,marginTop:'22px'}}>Utilisable sans réseau · 21,2 Mo en cache</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':4,marginTop:'10px'}}>
        <LessonRow state="done" title="Choisir tes mots-clés" meta="vidéo · 12 Mo" />
        <LessonRow state="done" title="Ce que cherche un client à Dakar" meta="vidéo · 9 Mo" />
        <LessonRow state="todo" title="Exercice : ta liste de 20 mots" meta="PDF · 180 Ko" />
        <LessonRow state="plain" icon={<Icon name="doc" size={14} />} title="Mes 14 notes" meta="texte · 24 Ko" last />
      </GlassPanel>

      <Eyebrow style={{'--i':5,marginTop:'22px'}}>Indisponible sans réseau</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':5,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="chat" size={14} color="var(--text-faint)" />} title={<span style={{color:'var(--text-faint)'}}>Ton {tutorNom().toLowerCase()}</span>} meta="a besoin du réseau" />
        <LessonRow state="plain" icon={<Icon name="card" size={14} color="var(--text-faint)" />} title={<span style={{color:'var(--text-faint)'}}>Paiement</span>} meta="a besoin du réseau" last />
      </GlassPanel>

      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':6,marginTop:'16px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{flex:1}}>
            <p style={{fontSize:'14px',fontWeight:600,margin:0}}>Télécharger en Wi-Fi seulement</p>
            <p style={{fontSize:'12px',color:'var(--text-muted)',margin:'2px 0 0'}}>Pour ne pas entamer ton forfait.</p>
          </div>
          <Switch on={wifi} onClick={()=>setWifi(!wifi)} />
        </div>
      </GlassPanel>

      <Eyebrow style={{'--i':7,marginTop:'22px'}}>En attente d'envoi</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':7,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="check" size={13} color="#8A4B00" strokeWidth={3.4} />} iconBackground="rgba(243,139,10,.18)" title="Leçon 5 terminée" meta="il y a 12 min" trailing={<Tag tone="warn">en file</Tag>} />
        <LessonRow state="plain" icon={<Icon name="comment" size={13} color="#8A4B00" />} iconBackground="rgba(243,139,10,.18)" title="1 note écrite" meta="il y a 9 min" trailing={<Tag tone="warn">en file</Tag>} />
        <LessonRow state="plain" icon={<Icon name="bookmark" size={13} color="#8A4B00" />} iconBackground="rgba(243,139,10,.18)" title="1 article enregistré" meta="hier, 22:41" trailing={<Tag tone="warn">en file</Tag>} last />
      </GlassPanel>
      <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'14px'}}>La file part au retour du réseau, sans rien te demander. Un parcours interrompu et reprise des jours plus tard reste un parcours valide.</p>
    </Screen>
  );
}

/* ── 3 · CENTRE DE NOTIFICATIONS ──
   Le seul canal sortant du produit aujourd'hui : aucun e-mail ne part. D'où le fait que
   cet écran ne soit pas un accessoire mais l'unique moyen de relancer quelqu'un. */
function PwaNotifications({go}){
  const [f,setF] = React.useState('Tout · 7');
  const puce = (nom,couleur,fond) => <Icon name={nom} size={14} color={couleur} />;
  return (
    <Screen territory="transforme"
      bar={<AppBar left={<BackButton />} center={<span style={{fontSize:'13px',fontWeight:600}}>Notifications</span>} right={<Button tone="quiet" size="sm" fullWidth={false}>Tout lire</Button>} />}>
      <div className="rv"><Segmented options={['Tout · 7','Non lues · 3']} value={f} onChange={setF} /></div>

      <Eyebrow style={{'--i':2,marginTop:'20px'}}>Aujourd'hui</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':3,marginTop:'10px'}}>
        <LessonRow state="plain" icon={puce('book','#0057BC')} iconBackground="rgba(0,87,188,.14)"
          title={<b style={{fontWeight:600}}>Ta formation est ouverte</b>} meta="Inscription · il y a 2 h"
          trailing={<span style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--mm-violet)',flex:'0 0 auto'}} />} />
        <LessonRow state="plain" icon={puce('star','#8A4B00')} iconBackground="rgba(243,139,10,.18)"
          title={<b style={{fontWeight:600}}>Ton certificat est émis</b>} meta="Certificat · il y a 4 h"
          trailing={<span style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--mm-violet)',flex:'0 0 auto'}} />} />
        <LessonRow state="plain" icon={puce('doc','#00695E')} iconBackground="rgba(2,172,156,.18)"
          title={<b style={{fontWeight:600}}>Nouvel article : les photos de fiche</b>} meta="Contenu · il y a 6 h"
          trailing={<span style={{width:'8px',height:'8px',borderRadius:'50%',background:'var(--mm-violet)',flex:'0 0 auto'}} />} last />
      </GlassPanel>

      <Eyebrow style={{'--i':4,marginTop:'22px'}}>Cette semaine</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':5,marginTop:'10px'}}>
        <LessonRow state="plain" icon={puce('users','#5A17BE')} iconBackground="rgba(108,35,221,.14)"
          title="Session en direct jeudi 20 h" meta="Club · hier" trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={puce('users','#5A17BE')} iconBackground="rgba(108,35,221,.14)"
          title="Seynabou a répondu dans « Entraide »" meta="Club · mardi" trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={puce('alert','#5A6472')} iconBackground="var(--fill-2)"
          title="Reprise de cours : 8 jours sans leçon" meta="Système · lundi" trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={puce('card','#5A6472')} iconBackground="var(--fill-2)"
          title="Paiement Wave confirmé · 80 750 F" meta="Système · lundi" trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} last />
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi cet écran compte autant</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>C'est <b style={{color:'var(--ink)'}}>le seul canal sortant du produit</b> : aucun e-mail ne part encore. Une relance qui n'arrive pas ici n'arrive nulle part — et c'est pour ça que la reprise de cours est le premier objet de ton espace, et pas une notification de plus.</p>
      </GlassPanel>
      <div className="rv" style={{'--i':7,display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
        <Tag>Inscription</Tag><Tag>Certificat</Tag><Tag>Contenu</Tag><Tag>Club</Tag><Tag>Système</Tag>
      </div>
    </Screen>
  );
}

/* ── 4 · ÉCRAN DE LANCEMENT ──
   Le M sur un maillage FIGÉ : au lancement, le processeur sert à démarrer l'application,
   pas à animer trois lobes flous. C'est le seul endroit du produit où la dérive est coupée
   sans que l'appareil ou la préférence système l'exigent. */
function PwaLancement(){
  return (
    <div className="play" style={{position:'relative',width:'100%',height:'100%',overflow:'hidden',
      background:'var(--surface-page)',isolation:'isolate',display:'grid',placeItems:'center'}}>
      <div className="lowfi" style={{position:'absolute',inset:0,zIndex:0}}><Mesh territory="forme" /></div>
      <div style={{position:'relative',zIndex:3,textAlign:'center'}}>
        <LogoMark size={92} src="../../assets/logo-mm-icon.png" style={{margin:'0 auto'}} />
        <div style={{marginTop:'22px'}}><Wordmark brand="rysmo" size={28} /></div>
        <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.16em',textTransform:'uppercase',color:'var(--text-faint)',margin:'10px 0 0'}}>Dakar · Sénégal</p>
      </div>
      <p style={{position:'absolute',left:0,right:0,bottom:'34px',zIndex:3,textAlign:'center',
        fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-faint)',margin:0}}>
        Maillage figé au lancement
      </p>
    </div>
  );
}

const MM_EXPORT = {PwaInvitation,PwaHorsConnexion,PwaNotifications,PwaLancement};
Object.assign(window, MM_EXPORT);
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensPwa.js');
