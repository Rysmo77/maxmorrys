const { GlassPanel, Button, Skeleton, EmptyState, LessonRow, Switch, Tag, Icon, IconButton, PillButton, Wordmark } = window.DS;

/* ── 1 · CHARGEMENT ── La forme exacte du contenu réel : rien ne saute à l'arrivée. */
function Chargement(){
  return (
    <Screen territory="forme" bar={<AppBar left={<Skeleton width={90} height={42} radius={999} />} right={<Skeleton width={42} height={42} radius={999} />} />}>
      <Skeleton width={110} height={11} />
      <div style={{marginTop:'14px',display:'grid',gap:'10px'}}>
        <Skeleton height={34} width="86%" />
        <Skeleton height={34} width="64%" />
      </div>
      <Skeleton height={56} radius={999} style={{marginTop:'20px'}} />
      <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
        <Skeleton width={70} height={40} radius={999} /><Skeleton width={84} height={40} radius={999} /><Skeleton width={62} height={40} radius={999} />
      </div>
      <div style={{display:'grid',gap:'12px',marginTop:'22px'}}>
        <Skeleton height={118} radius={24} /><Skeleton height={118} radius={24} /><Skeleton height={118} radius={24} />
      </div>
      <p style={{fontFamily:'var(--f-mono)',fontSize:'11px',color:'var(--text-faint)',marginTop:'20px'}}>Quand le contenu arrive, rien ne saute.</p>
    </Screen>
  );
}

/* ── 2 · ÉTAT VIDE ── Une invitation à agir, pas une excuse. */
function Vide(){
  return (
    <Screen territory="transforme" bar={<AppBar left={<BackButton />} center={<span style={{fontSize:'13px',fontWeight:600}}>Boîte de support</span>} />}>
      <div style={{minHeight:'82%',display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <GlassPanel level="flat" padding={6}>
          <EmptyState
            glyph={<Icon name="comment" size={26} color="#6C23DD" />}
            glyphBackground="linear-gradient(135deg,#DFD0FF,#C7E1FF)"
            title="La boîte est vide."
            body="Zéro message, zéro témoignage, zéro rendez-vous depuis l'origine. La boîte fonctionne — personne n'écrit encore."
            action={<Button tone="transforme">Publier un article pour attirer</Button>} />
        </GlassPanel>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',marginTop:'16px'}}>Un zéro daté est une information. Un tiret n'en est pas une.</p>
      </div>
    </Screen>
  );
}

/* ── 3 · ERREUR ── Motif, conséquence, sortie. Dans cet ordre. */
function Erreur(){
  return (
    <Screen territory="forme">
      <div style={{minHeight:'100%',display:'flex',flexDirection:'column',justifyContent:'center',paddingBottom:'40px'}}>
        <div className="rv-s" style={{width:'70px',height:'70px',borderRadius:'22px',background:'linear-gradient(135deg,#E4564F,#B4231F)',display:'grid',placeItems:'center',boxShadow:'0 12px 32px rgba(180,35,31,.3)'}}>
          <Icon name="alert" size={30} color="#fff" strokeWidth={2.4} />
        </div>
        <Display lines={[<>La leçon ne s'est<br />pas chargée.</>]} style={{marginTop:'24px'}} />
        <GlassPanel level="flat" padding={18} className="rv" style={{'--i':4,marginTop:'18px'}}>
          <Eyebrow style={{marginBottom:'8px'}}>Le motif</Eyebrow>
          <p style={{fontSize:'13.5px',lineHeight:1.5,margin:0}}>La vidéo a mis plus de 30 secondes à répondre. Le réseau a coupé pendant le transfert.</p>
          <div style={{height:'1px',background:'rgba(14,17,22,.1)',margin:'14px 0'}} />
          <Eyebrow style={{marginBottom:'8px'}}>La conséquence</Eyebrow>
          <p style={{fontSize:'13.5px',lineHeight:1.5,margin:0}}>Ta progression est intacte : elle est enregistrée sur ton inscription, pas dans le navigateur. Rien n'est perdu.</p>
        </GlassPanel>
        <Button tone="forme" className="rv" style={{'--i':5,marginTop:'18px'}}>Réessayer</Button>
        <Button tone="quiet" fullWidth className="rv" style={{'--i':6,marginTop:'10px'}}>Lire la transcription à la place</Button>
        <p className="rv" style={{'--i':7,fontFamily:'var(--f-mono)',fontSize:'11px',color:'var(--text-faint)',textAlign:'center',marginTop:'14px'}}>Référence de l'incident : MM-E-7741</p>
      </div>
    </Screen>
  );
}

/* ── 4 · HORS CONNEXION ── Le forfait est compté : chaque poids est affiché. */
function HorsConnexion(){
  const [wifi,setWifi] = React.useState(true);
  return (
    <Screen territory="informe"
      bar={<AppBar left={<BackButton />} right={<Tag tone="stop">Hors connexion</Tag>} />}>
      <Display size="sm" lines={['Pas de réseau.']} style={{marginTop:'8px'}} />
      <Lede style={{'--i':2,marginTop:'11px'}}>Tu peux continuer les <b className="mm-num" style={{color:'var(--ink)'}}>3</b> leçons déjà téléchargées. Ta progression partira dès que tu retrouves du réseau.</Lede>
      <Eyebrow style={{'--i':3,marginTop:'22px'}}>Disponible sans réseau</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':4,marginTop:'10px'}}>
        <LessonRow state="done" title="Choisir tes mots-clés" meta="vidéo · 12 Mo" />
        <LessonRow state="done" title="Ce que cherche un client à Dakar" meta="vidéo · 9 Mo" />
        <LessonRow state="todo" title="Exercice : ta liste de 20 mots" meta="PDF · 180 Ko" last />
      </GlassPanel>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':5,marginTop:'14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{flex:1}}>
            <p style={{fontSize:'14px',fontWeight:600,margin:0}}>Télécharger en Wi-Fi seulement</p>
            <p style={{fontSize:'12px',color:'var(--text-muted)',margin:'2px 0 0'}}>Pour ne pas entamer ton forfait.</p>
          </div>
          <Switch on={wifi} onClick={()=>setWifi(!wifi)} />
        </div>
      </GlassPanel>
      <Eyebrow style={{'--i':6,marginTop:'22px'}}>En attente d'envoi</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':6,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="check" size={13} color="#8A4B00" strokeWidth={3.4} />} iconBackground="rgba(243,139,10,.18)" title="Leçon 5 terminée" meta="il y a 12 min" trailing={<Tag tone="warn">en file</Tag>} />
        <LessonRow state="plain" icon={<Icon name="comment" size={13} color="#8A4B00" />} iconBackground="rgba(243,139,10,.18)" title="1 note écrite" meta="il y a 9 min" trailing={<Tag tone="warn">en file</Tag>} last />
      </GlassPanel>
      <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'14px'}}>Le parcours survit à une session interrompue et reprise des jours plus tard : la file part au retour du réseau, sans rien te demander.</p>
    </Screen>
  );
}

/* ── 5 · /403 ── Ce que les règles ont déjà refusé. */
function Interdit403(){
  return (
    <Screen territory="nuit" dark bar={<AppBar left={<IconButton label="Retour"><Icon name="back" strokeWidth={2.4} /></IconButton>} center={<Wordmark brand="rysmo" size={20} night tail="#fff" />} />}>
      <p className="mm-num rv-s" style={{fontSize:'96px',lineHeight:1,color:'rgba(236,240,245,.14)',margin:'10px 0 0',letterSpacing:'-.04em'}}>403</p>
      <Display size="sm" lines={["Cette page n'est","pas pour ce rôle."]} style={{marginTop:'6px'}} />
      <Lede style={{'--i':4,marginTop:'12px'}}>Ton rôle est <b className="mm-num" style={{color:'#ECF0F5'}}>support</b>. Il atteint exactement cinq écrans, et celui-ci n'en fait pas partie.</Lede>
      <Eyebrow style={{'--i':5,marginTop:'22px'}}>Ce que le rôle support atteint</Eyebrow>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':5,marginTop:'10px'}}>
        {['Messages','Témoignages','Rendez-vous','Prospects','Projets'].map((t,i,a)=>(
          <LessonRow key={t} state="plain" icon={<Icon name="check" size={13} color="#3FD9C6" strokeWidth={3.4} />} iconBackground="rgba(63,217,198,.18)" title={t} last={i===a.length-1}
            trailing={<Icon name="forward" size={15} color="#7C8896" strokeWidth={2.4} />} />
        ))}
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':6,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce que cette page est, exactement</Eyebrow>
        <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>Un garde de route est du code client : il cache, il n'interdit pas. Le vrai cloisonnement est dans les règles de la base — cette page dit simplement ce qu'elles ont déjà refusé.</p>
      </GlassPanel>
    </Screen>
  );
}

const MM_EXPORT = {Chargement,Vide,Erreur,HorsConnexion,Interdit403};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensEtats.js');
