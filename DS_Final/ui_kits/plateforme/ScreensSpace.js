const { GlassPanel, TerritoryCard, Button, ChipRow, ProgressBar, LessonRow, QuotaMeter, Avatar, ChatBubble, SearchPill, TabBar, Tag, PriceBlock, CheckLine, SubNav, MediaCard, IconButton, PillButton, Icon } = window.DS;

const mmTabItems = (go)=>[
  {label:'Espace',icon:<Icon name="home" size={21} />},
  {label:'Cours',icon:<Icon name="book" size={21} />},
  {label:tutorNom(),icon:<Icon name="chat" size={21} />},
  {label:'Club',icon:<Icon name="users" size={21} />},
  {label:'Profil',icon:<Icon name="user" size={21} />}
];
const mmTabRoute = {Espace:'espace',Cours:'lecteur',Club:'club',Profil:'espace'};
const mmRoutePourOnglet = (l)=> l===tutorNom() ? 'rysmo' : (mmTabRoute[l] || 'espace');

function Espace({go}){
  return (
    <Screen territory="transforme"
      bar={<AppBar
        left={<div className="rv"><Eyebrow>Bonsoir</Eyebrow><p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'23px',letterSpacing:'-.035em',lineHeight:1,margin:0}}>Aïssatou</p></div>}
        right={<span style={{display:'flex',gap:'9px'}}><IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton><Avatar initials="A" /></span>} />}
      tabbar={<TabBar items={mmTabItems()} active="Espace" onSelect={(l)=>go(mmRoutePourOnglet(l))} />}>
      <div className="rv" style={{'--i':2}}>
        <TerritoryCard first territory="forme" meta="Tu t'es arrêtée il y a 8 jours">
          <div style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.032em',lineHeight:1,marginTop:'5px'}}>Leçon 5 · Les mots que tapent tes clients</div>
          <ProgressBar value={34} style={{marginTop:'15px'}} />
          <RowBetween style={{marginTop:'10px'}}>
            <span className="mm-num" style={{fontSize:'12px'}}>16 / 47 leçons · 34 %</span>
            <Button tone="primary" size="sm" onClick={()=>go('lecteur')}>Reprendre</Button>
          </RowBetween>
        </TerritoryCard>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'18px'}}>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':4}}><Eyebrow>Série</Eyebrow><p className="mm-num" style={{fontSize:'27px',margin:'4px 0 0'}}>3 j</p><p style={{fontSize:'11.5px',color:'var(--text-muted)',margin:0}}>Record : <span className="mm-num">7 j</span></p></GlassPanel>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':5}}><Eyebrow>Niveau</Eyebrow><p className="mm-num" style={{fontSize:'27px',margin:'4px 0 0'}}>4</p><ProgressBar value={60} style={{marginTop:'8px'}} /></GlassPanel>
      </div>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':6,marginTop:'12px'}}>
        <RowBetween>
          <div><p style={{fontWeight:700,fontSize:'14.5px',margin:0}}>Demande à ton {tutorNom().toLowerCase()}</p><p style={{fontSize:'12.5px',color:'var(--text-muted)',margin:'2px 0 0'}}>Il sait où tu t'es arrêtée.</p></div>
          <span onClick={()=>go('rysmo')} style={{width:'44px',height:'44px',borderRadius:'50%',background:'var(--action-transforme)',display:'grid',placeItems:'center',boxShadow:'0 8px 20px rgba(108,35,221,.34)',cursor:'pointer'}}><Icon name="chat" color="#fff" strokeWidth={2.2} /></span>
        </RowBetween>
        <QuotaMeter used={2} total={5} style={{marginTop:'13px'}} />
      </GlassPanel>
      <Eyebrow style={{'--i':7,marginTop:'22px'}}>Dans ton espace</Eyebrow>
      <GlassPanel level="flat" padding="4px 18px" className="rv" style={{'--i':8,marginTop:'10px'}}>
        <LessonRow icon={<Icon name="doc" size={14} />} title="Mes paiements" meta="1 transaction" trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow icon={<Icon name="star" size={14} />} title="Mes certificats" meta="0 émis" trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} onClick={()=>go('certificat')} last />
      </GlassPanel>
    </Screen>
  );
}

function Lecteur({go}){
  const [onglet,setOnglet] = React.useState('Vidéo');
  return (
    <Screen territory="forme"
      bar={<AppBar left={<BackButton onClick={()=>go('espace')} />} right={<span style={{display:'flex',gap:'9px'}}><IconButton label="Mes notes"><Icon name="comment" size={17} strokeWidth={2} /></IconButton><IconButton label="Marquer"><Icon name="bookmark" size={17} strokeWidth={2} /></IconButton></span>} />}
      tabbar={<TabBar items={mmTabItems()} active="Cours" onSelect={(l)=>go(mmRoutePourOnglet(l))} />}>
      <Eyebrow>Module 3 · Leçon 5</Eyebrow>
      <Display lines={[<>Les mots que<br/>tapent tes clients</>]} style={{marginTop:'6px'}} />
      <MediaBlock height={178} gradient="linear-gradient(135deg,#0057BC,#6C23DD 70%,#F38B0A)" style={{'--i':3,marginTop:'16px',display:'grid',placeItems:'center'}}>
        <span style={{width:'64px',height:'64px',borderRadius:'50%',background:'rgba(255,255,255,.9)',display:'grid',placeItems:'center',border:'1px solid rgba(255,255,255,.7)'}}><Icon name="play" size={22} color="#0E1116" /></span>
        <span style={{position:'absolute',bottom:'12px',left:'14px',right:'14px',display:'flex',alignItems:'center',gap:'9px',color:'#fff',fontFamily:'var(--f-mono)',fontSize:'11px'}}>
          <span>03:12</span><span style={{flex:1,height:'3px',borderRadius:'2px',background:'rgba(255,255,255,.35)'}}><b className="bar-fill" style={{display:'block',width:'8%',height:'100%',background:'#fff',borderRadius:'2px'}} /></span><span>08:24</span>
        </span>
      </MediaBlock>
      <div className="rv" style={{'--i':4,marginTop:'12px'}}><ChipRow height={36} options={['Vidéo','Transcription','Mes notes','Ressources']} value={onglet} onChange={setOnglet} /></div>
      <RowBetween className="rv" style={{'--i':5,marginTop:'20px'}}>
        <div><p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'20px',letterSpacing:'-.035em',margin:0}}>Le programme</p><p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:0}}>6 modules · 47 leçons · 16 faites</p></div>
        <span className="mm-num" style={{fontSize:'21px'}}>34 %</span>
      </RowBetween>
      <ProgressBar value={34} style={{marginTop:'10px'}} />
      <GlassPanel level="flat" padding="4px 18px" className="rv" style={{'--i':7,marginTop:'14px'}}>
        <LessonRow state="done" title="Choisir tes mots-clés" meta="06:12" />
        <LessonRow state="done" title="Ce que cherche un client à Dakar" meta="04:48" />
        <LessonRow state="current" icon={<Icon name="play" size={13} color="#fff" />} iconBackground="linear-gradient(135deg,#0057BC,#6C23DD)" title="Les mots que tapent tes clients" meta="08:24 · en cours" />
        <LessonRow state="todo" title="Écrire une fiche qui remonte" meta="07:03" />
        <LessonRow state="todo" title="Exercice : ta liste de 20 mots" meta="PDF · 180 Ko" last />
      </GlassPanel>
    </Screen>
  );
}

function Rysmo({go}){
  return (
    <Screen territory="transforme"
      bar={<AppBar left={<BackButton onClick={()=>go('espace')} />}
        center={<div style={{textAlign:'center'}}><p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.035em',margin:0}}>{tutorNom()}</p><QuotaMeter used={3} total={5} label="3 / 5" style={{justifyContent:'center',fontSize:'10.5px'}} /></div>}
        right={<IconButton label={'Options de ton '+tutorNom().toLowerCase()} onClick={()=>go('memoire')}><Icon name="dots" size={17} strokeWidth={2} /></IconButton>} />}
      tabbar={<TabBar items={mmTabItems()} active={tutorNom()} onSelect={(l)=>go(mmRoutePourOnglet(l))} />}>
      <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'8px'}}>
        <div className="rv"><ChatBubble>Salut Aïssatou. Je suis ton {tutorNom().toLowerCase()} — tu peux me donner un autre nom quand tu veux. Tu t'es arrêtée à la leçon 5 du module 3, « Les mots que tapent tes clients ». On la reprend, ou tu as une question ?</ChatBubble></div>
        <div className="rv" style={{'--i':2}}><ChatBubble from="me">Comment je choisis mes mots-clés pour une boutique de cosmétiques à Dakar ?</ChatBubble></div>
        <div className="rv" style={{'--i':4}}><ChatBubble>Ta leçon 4 donne la méthode en trois temps. Applique-la à ton cas :<br/><br/>1. Liste ce que ta cliente dit à voix haute, pas ce que tu vends.<br/>2. Ajoute le quartier — « cosmétique Almadies » convertit mieux que « cosmétique Sénégal ».<br/>3. Garde les 20 qui reviennent.
          <div style={{marginTop:'13px',padding:'12px 14px',borderRadius:'14px',background:'var(--surface-card)',border:'1px solid rgba(108,35,221,.18)'}}>
            <Eyebrow>Depuis ton cours</Eyebrow><p style={{fontSize:'13px',fontWeight:600,margin:'3px 0 0'}}>Module 3 · Leçon 4 — Ce que cherche un client à Dakar</p>
          </div></ChatBubble></div>
        <div className="rv" style={{'--i':6}}><ChatBubble typing /></div>
      </div>
      <GlassPanel level="flat" padding="15px 17px" className="rv" style={{'--i':7,marginTop:'18px'}}>
        <p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Il te reste 2 questions aujourd'hui</p>
        <p style={{fontSize:'12px',color:'var(--text-muted)',margin:'2px 0 0'}}>Remis à zéro à minuit. Un pack ne se périme pas.</p>
        <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
          <Button tone="quiet" size="sm" style={{flex:1}}><span className="mm-num">30&nbsp;q</span> · 500 F</Button>
          <Button tone="transforme" size="sm" style={{flex:1}}>Lite · <span className="mm-num">3 000</span>/m</Button>
        </div>
      </GlassPanel>
      <div style={{marginTop:'12px'}}>
        <SearchPill height={54} hint="Écris ta question…" trailing={<span style={{width:'36px',height:'36px',borderRadius:'50%',background:'var(--action-transforme)',display:'grid',placeItems:'center',boxShadow:'0 6px 16px rgba(108,35,221,.35)'}}><Icon name="send" size={16} color="#fff" /></span>} />
      </div>
    </Screen>
  );
}

/* Mur d'abonnement — écran public Club-M1 de la page /club-des-digitos.
   Le prix est donné des deux façons dès le premier écran (FR-074), et l'écran ne vend
   que les cinq engagements qui ne dépendent que d'une personne. */
function Club({go}){
  return (
    <Screen territory="transforme" bar={<AppBar left={<BackButton onClick={()=>go('accueil')} />} right={<Button tone="quiet" size="sm">Connexion</Button>} />}
      tabbar={<TabBar items={mmTabItems()} active="Club" onSelect={(l)=>go(mmRoutePourOnglet(l))} />}>
      <div className="rv"><SubNav active="Le Club" items={[{label:'Écouter & regarder'},{label:'Le Club',color:'#6C23DD'}]} onSelect={(l)=>{ if (l !== 'Le Club') go('pole'); }} /></div>
      <Eyebrow style={{'--i':1,marginTop:'18px'}}>Je te transforme · payant, fermé</Eyebrow>
      <Display size="sm" lines={['LE CLUB DES','DIGITOS.']} style={{marginTop:'6px'}} />
      <Lede style={{'--i':4,marginTop:'12px'}}>Une année avec moi, et avec ceux qui font la même chose que toi. Des sessions en direct, des missions qui circulent, et quelqu'un à qui poser la question que tu ne poses à personne.</Lede>
      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':5,marginTop:'18px'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:'8px'}}>
          <b className="mm-num" style={{fontSize:'36px',letterSpacing:'-.045em',color:'var(--mm-violet-t)'}}>1 658</b>
          <span style={{fontSize:'14px',fontWeight:600}}>F / mois</span>
        </div>
        <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'5px 0 0'}}>Facturé <b className="mm-num" style={{color:'var(--ink)'}}>19 900 F</b>, une fois, pour douze mois.</p>
        <Button tone="transforme" style={{marginTop:'15px'}}>Je rejoins le Club</Button>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>Parrainé ? Ton code te fait <b className="mm-num">16 915 F</b>.</p>
      </GlassPanel>
      <Eyebrow style={{'--i':6,marginTop:'24px'}}>Ce que tu paies, précisément</Eyebrow>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':6,marginTop:'10px'}}>
        <CheckLine style={{marginTop:0,fontSize:'14px'}}><b className="mm-num">2</b> sessions en direct par mois, avec moi</CheckLine>
        <CheckLine style={{fontSize:'14px'}}>Les missions que je sors de mon carnet</CheckLine>
        <CheckLine style={{fontSize:'14px'}}>Les ateliers à Dakar, places membres</CheckLine>
        <CheckLine style={{fontSize:'14px'}}>Une réponse de moi, pas d'un modérateur</CheckLine>
        <CheckLine style={{fontSize:'14px'}}>Ton répétiteur à <b className="mm-num">5</b> questions/jour au lieu de <b className="mm-num">2</b></CheckLine>
        <div style={{height:'1px',background:'rgba(14,17,22,.1)',margin:'15px 0'}} />
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Ces cinq lignes ne dépendent que de moi. C'est pour ça qu'elles sont ici, et pas des promesses sur l'ambiance.</p>
      </GlassPanel>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':7,marginTop:'14px'}}>
        <Eyebrow>Ce qui se passe à l'échéance</Eyebrow>
        <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>À l'échéance, ton accès s'arrête. <b style={{color:'var(--ink)'}}>Tu réabonnes si tu veux.</b> Rien n'est prélevé automatiquement.</p>
      </GlassPanel>
      <GlassPanel level="flat" className="rv" style={{'--i':8,marginTop:'14px',padding:'18px'}}>
        <Eyebrow>Avant de payer, écoute-les</Eyebrow>
        <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 12px'}}>Le podcast et les vidéos sont à l'étage du dessous du même territoire : <b style={{color:'var(--ink)'}}>gratuits, sans compte</b>.</p>
        <Button tone="quiet" fullWidth size="sm" onClick={()=>go('pole')}>Écouter l'épisode — 34:20</Button>
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':9,marginTop:'14px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce que je ne te promets pas</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Le Club a ouvert cette année. Je ne t'annonce pas un nombre de membres, parce qu'il serait faux — et parce que tu le vérifierais au premier écran après avoir payé.</p>
      </GlassPanel>
    </Screen>
  );
}

const MM_EXPORT = {Espace,Lecteur,Rysmo,Club};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensSpace.js');
