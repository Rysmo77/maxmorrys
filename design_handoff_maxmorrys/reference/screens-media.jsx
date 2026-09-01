const { GlassPanel, MediaCard, SubNav, Button, Segmented, PayOption, LessonRow, Tag, Breadcrumb, Icon, IconButton, PillButton } = window.DS;

/* ── PÔLE MÉDIA · /podcast-et-videos ──
   Rangé sous « Je te transforme », pas sous « Je t'informe » : le blog donne une méthode,
   le podcast donne une voix. Et ça produit une échelle — tu écoutes ceux qui l'ont fait,
   puis tu rejoins ceux qui le font.
   Le risque à neutraliser : ce territoire abritait du payant fermé. D'où la sous-navigation
   en tête, le mot « gratuit » dans le premier écran, et le Club en bas. Jamais devant. */

/* M1 — le pôle */
function MediaPole({go}){
  return (
    <Screen territory="transforme"
      bar={<AppBar left={<PillButton>Menu</PillButton>} right={<IconButton label="Chercher"><Icon name="search" size={17} strokeWidth={2.4} /></IconButton>} />}>
      <div className="rv"><SubNav items={[{label:'Écouter & regarder'},{label:'Le Club',color:'#6C23DD'}]} active="Écouter & regarder" /></div>
      <Eyebrow style={{'--i':1,marginTop:'18px'}}>Je te transforme · gratuit</Eyebrow>
      <Display size="sm" lines={["DES GENS D'ICI",'QUI RACONTENT','CE QU\u2019ILS ONT FAIT.']} style={{marginTop:'6px'}} />
      <Lede style={{'--i':5,marginTop:'12px'}}>Pas de méthode, pas de tutoriel — ça, c'est le blog. Ici, des gens qui vendent vraiment quelque chose à Dakar et à Abidjan racontent ce qui a marché, et ce qui leur a coûté cher.</Lede>
      <div className="rv" style={{'--i':6,display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
        <Tag tone="ok">Écoute gratuite, sans compte</Tag>
        <Tag>Transcription lisible sans audio</Tag>
      </div>
      <div className="rv" style={{'--i':7,marginTop:'18px'}}>
        <MediaCard format="audio" artHeight={170} titleSize={22}
          eyebrow="Podcast · épisode 1 · 6 août"
          title="Vendre sans budget pub, avec Fatou D."
          body="Gérante d'une boutique de cosmétiques aux Almadies. Elle a arrêté la publicité payante pendant trois mois pour voir. Le chiffre n'a pas bougé."
          cost={['34:20','31 Mo','Transcription · 0 Mo']}
          actions={<>
            <Button tone="transforme" size="sm" onClick={()=>go&&go('episode')}>Écouter</Button>
            <Button tone="quiet" size="sm" onClick={()=>go&&go('episode')}>Lire la transcription</Button>
          </>} />
      </div>
      <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'14px'}}>Un épisode par mois, quand j'ai quelqu'un qui vaut la peine d'être écouté. Pas de calendrier tenu à vide.</p>
      <GlassPanel level="truth" className="rv" style={{'--i':9,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi il n'y a que trois éléments</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Un épisode et deux vidéos. C'est tout, et je préfère te le montrer comme ça plutôt que de remplir une grille. <b style={{color:'var(--ink)'}}>Le blog, lui, en a 46</b> — si tu cherches de la matière tout de suite, c'est par là.</p>
      </GlassPanel>
    </Screen>
  );
}

/* M2 — les vidéos, puis l'échelle vers le Club */
function MediaVideos({go}){
  const [vue,setVue] = React.useState('Tout · 3');
  return (
    <Screen territory="transforme" bar={<AppBar left={<BackButton onClick={()=>go&&go('pole')} />} center={<span style={{fontSize:'13px',fontWeight:600}}>Écouter & regarder</span>} />}>
      <div className="rv"><Segmented options={['Tout · 3','À écouter · 1','À regarder · 2']} value={vue} onChange={setVue} /></div>
      <div className="rv" style={{'--i':2,marginTop:'16px'}}>
        <MediaCard format="video" badge="Vidéo · 16:9" artHeight={140}
          eyebrow="Vidéo · 12 juillet" title="Trois heures avec un commerçant du marché Sandaga"
          body="Ce qu'il vend, comment il compte, et pourquoi il n'a jamais voulu de site."
          cost={['18:04','96 Mo en HD','24 Mo en 480p']}
          actions={<Button tone="quiet" size="sm" onClick={()=>go&&go('video')}>Voir la vidéo</Button>} />
      </div>
      <div className="rv" style={{'--i':3,marginTop:'12px'}}>
        <MediaCard format="video" badge="Vidéo · 16:9" artHeight={140} gradient="linear-gradient(140deg,#02AC9C,#0057BC)"
          eyebrow="Vidéo · 28 juin" title="J'ouvre ma fiche Google devant vous"
          body="Une fiche réelle, corrigée en direct, avec les erreurs laissées à l'écran."
          cost={['11:32','61 Mo en HD','15 Mo en 480p']}
          actions={<Button tone="quiet" size="sm" onClick={()=>go&&go('video')}>Voir la vidéo</Button>} />
      </div>
      <Eyebrow style={{'--i':4,marginTop:'22px'}}>Écoute où tu veux</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':4,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="chat" size={14} color="#fff" />} iconBackground="#1DB954" title="Spotify" trailing={<Button tone="quiet" size="sm">Suivre</Button>} />
        <LessonRow state="plain" icon={<Icon name="play" size={14} color="#fff" />} iconBackground="#FF0000" title="YouTube" trailing={<Button tone="quiet" size="sm">S'abonner</Button>} />
        <LessonRow state="plain" icon={<Icon name="doc" size={14} />} title="Flux RSS" trailing={<Button tone="quiet" size="sm">Copier</Button>} last />
      </GlassPanel>
      <p className="rv" style={{'--i':5,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'12px'}}>Si tu y es déjà abonné, garde tes habitudes — je ne t'obligerai pas à revenir ici pour écouter. Aucun compteur d'écoute n'est affiché : à un épisode, un compteur ne dit rien d'utile.</p>
      <div className="rv-s" style={{'--i':6,marginTop:'22px',padding:'24px',borderRadius:'var(--r-xl)',
        background:'linear-gradient(140deg,#6C23DD,#0057BC 72%,#02AC9C)',color:'#fff',boxShadow:'0 16px 40px rgba(108,35,221,.34)'}}>
        <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.72)',margin:0}}>L'étage au-dessus</p>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'23px',letterSpacing:'-.03em',lineHeight:1.08,margin:'8px 0 0'}}>Tu viens d'écouter quelqu'un qui l'a fait. Le Club, c'est là où ils sont.</p>
        <p style={{fontSize:'13.5px',color:'rgba(255,255,255,.86)',margin:'10px 0 0'}}>Le podcast est gratuit et le restera — le Club, c'est quand tu veux leur parler au lieu de les écouter.</p>
        <Button style={{marginTop:'16px',background:'#fff',color:'var(--ink)'}} onClick={()=>go&&go('club')}>Voir le Club — <span className="mm-num">1 658 F</span>/mois</Button>
        <p style={{fontSize:'12px',color:'rgba(255,255,255,.72)',textAlign:'center',margin:'9px 0 0'}}>Facturé <b className="mm-num">19 900 F</b> une fois par an</p>
      </div>
    </Screen>
  );
}

/* M3 — l'épisode : la transcription d'abord */
function MediaEpisode({go}){
  const [vue,setVue] = React.useState('Transcription');
  return (
    <Screen territory="transforme" bar={<AppBar left={<BackButton onClick={()=>go&&go('pole')} />} right={<IconButton label="Partager"><Icon name="share" size={17} strokeWidth={2} /></IconButton>} />}>
      <Breadcrumb items={['Je te transforme','Podcast','Épisode 1']} />
      <Display size="sm" lines={['Vendre sans','budget pub.']} style={{marginTop:'8px'}} />
      <p className="mm-num rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'10px'}}>6 août 2026 · 34:20 · avec Fatou D.</p>
      <div className="rv-s" style={{'--i':5,marginTop:'16px',borderRadius:'var(--r-media)',padding:'18px',
        background:'linear-gradient(140deg,#6C23DD,#0057BC 62%,#02AC9C)',boxShadow:'0 14px 34px rgba(108,35,221,.28)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px',justifyContent:'center'}}>
          <span style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(255,255,255,.22)',display:'grid',placeItems:'center',color:'#fff',fontFamily:'var(--f-mono)',fontSize:'10px',fontWeight:700}}>−15</span>
          <span style={{width:'62px',height:'62px',borderRadius:'50%',background:'rgba(255,255,255,.92)',display:'grid',placeItems:'center'}}><Icon name="play" size={22} color="#0E1116" /></span>
          <span style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(255,255,255,.22)',display:'grid',placeItems:'center',color:'#fff',fontFamily:'var(--f-mono)',fontSize:'10px',fontWeight:700}}>+15</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'9px',marginTop:'16px',color:'#fff',fontFamily:'var(--f-mono)',fontSize:'11px'}}>
          <span>00:00</span>
          <span style={{flex:1,height:'3px',borderRadius:'2px',background:'rgba(255,255,255,.35)'}}><b className="bar-fill" style={{display:'block',width:'8%',height:'100%',background:'#fff',borderRadius:'2px'}} /></span>
          <span>34:20</span>
        </div>
        <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',color:'rgba(255,255,255,.78)',textAlign:'center',margin:'12px 0 0'}}>Écouter · 31 Mo · rien ne se charge avant que tu lances</p>
      </div>
      <div className="rv" style={{'--i':6,marginTop:'16px'}}><Segmented options={['Transcription','Chapitres','Notes']} value={vue} onChange={setVue} /></div>
      <p className="rv" style={{'--i':7,fontSize:'12px',color:'var(--text-muted)',lineHeight:1.5,marginTop:'12px'}}>La transcription s'affiche par défaut : elle se lit sans charger l'audio — <b className="mm-num" style={{color:'var(--ink)'}}>0 Mo</b> contre 31.</p>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':8,marginTop:'12px'}}>
        <LessonRow state="plain" meta="00:42" title="Fatou : « Au début je payais 15 000 par semaine en pub, et je vendais autant qu'avant. »" />
        <LessonRow state="plain" meta="04:18" title="« La première cliente venue de Google, je m'en souviens : elle avait cherché cosmétique Almadies. »" />
        <LessonRow state="plain" meta="11:05" title="Max-Morrys : la différence entre une page Facebook et une fiche Google." />
        <LessonRow state="plain" meta="19:37" title="« Six mois pour comprendre qu'une photo de vitrine vaut mieux qu'une affiche. »" />
        <LessonRow state="plain" meta="28:12" title="Ce qu'elle referait autrement, et ce qu'elle ne referait pas." last />
      </GlassPanel>
    </Screen>
  );
}

/* M4 — la vidéo : le choix de qualité AVANT la lecture, pas dans un menu caché */
function MediaVideo({go}){
  const [q,setQ] = React.useState('480p');
  return (
    <Screen territory="transforme" bar={<AppBar left={<BackButton onClick={()=>go&&go('videos')} />} right={<IconButton label="Partager"><Icon name="share" size={17} strokeWidth={2} /></IconButton>} />}>
      <Breadcrumb items={['Je te transforme','Vidéo']} />
      <Display size="sm" lines={['Trois heures au','marché Sandaga']} style={{marginTop:'8px'}} />
      <div className="rv-s" style={{'--i':3,marginTop:'16px',height:'190px',borderRadius:'var(--r-xl)',
        background:'linear-gradient(140deg,#0057BC,#6C23DD)',display:'grid',placeItems:'center',position:'relative',border:'1px solid rgba(255,255,255,.16)'}}>
        <span style={{width:'62px',height:'62px',borderRadius:'50%',background:'rgba(255,255,255,.92)',display:'grid',placeItems:'center',boxShadow:'0 8px 22px rgba(14,17,22,.24)'}}>
          <Icon name="play" size={20} color="#0E1116" />
        </span>
        <span style={{position:'absolute',left:'14px',top:'14px',display:'inline-flex',alignItems:'center',height:'25px',padding:'0 10px',borderRadius:'var(--r-pill)',
          fontSize:'10.5px',fontWeight:600,background:'rgba(0,0,0,.5)',color:'#fff'}}>18:04</span>
      </div>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':4,marginTop:'16px'}}>
        <Eyebrow>Avant de lancer</Eyebrow>
        <p style={{fontSize:'13.5px',color:'var(--text-muted)',margin:'7px 0 0'}}>Choisis ta qualité. Rien ne se télécharge tant que tu n'as pas choisi.</p>
        <div style={{display:'grid',gap:'9px',marginTop:'13px'}}>
          <PayOption on={q==='480p'} onClick={()=>setQ('480p')} title="480p — recommandé en 4G" note="24 Mo" style={{minHeight:'58px'}} />
          <PayOption on={q==='720p'} onClick={()=>setQ('720p')} title="720p HD" note="96 Mo" style={{minHeight:'58px'}} />
        </div>
        <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
          <Button tone="transforme" size="sm" style={{flex:1}}>Lancer ici</Button>
          <Button tone="quiet" size="sm" style={{flex:1}}>Ouvrir sur YouTube</Button>
        </div>
      </GlassPanel>
      <Eyebrow style={{'--i':5,marginTop:'22px'}}>Ce qu'il y a dedans</Eyebrow>
      <GlassPanel level="flat" padding="4px 18px" className="rv" style={{'--i':5,marginTop:'10px'}}>
        <LessonRow state="plain" meta="00:00" title="Le stand, à 6 h du matin" />
        <LessonRow state="plain" meta="04:12" title="Comment il fixe ses prix" />
        <LessonRow state="plain" meta="09:38" title="« Un site, pour quoi faire ? »" />
        <LessonRow state="plain" meta="14:20" title="Ce qu'il ferait avec 50 000 F" last />
      </GlassPanel>
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'12px'}}>Les chapitres se lisent sans lancer la vidéo. C'est souvent tout ce qu'on cherche.</p>
    </Screen>
  );
}

const MM_EXPORT = {MediaPole,MediaVideos,MediaEpisode,MediaVideo};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
