const { GlassPanel, Button, ChipRow, ProgressBar, LessonRow, TabBar, Tag, Field, Icon, IconButton, Wordmark, Avatar, DocLine, Mesh } = window.DS;

const notesTabs = ()=>[
  {label:'Espace',icon:<Icon name="home" size={21} />},
  {label:'Cours',icon:<Icon name="book" size={21} />},
  {label:tutorNom(),icon:<Icon name="chat" size={21} />},
  {label:'Club',icon:<Icon name="users" size={21} />},
  {label:'Profil',icon:<Icon name="user" size={21} />}
];

/** Lecteur, onglet « Mes notes » actif. FR-023 : les notes vivent sous le compte, lisibles par elle seule. */
function MesNotes({go}){
  return (
    <Screen territory="forme"
      bar={<AppBar left={<BackButton onClick={()=>go&&go('lecteur')} />} right={<IconButton label="Chercher dans mes notes"><Icon name="search" size={17} strokeWidth={2.4} /></IconButton>} />}
      tabbar={<TabBar items={notesTabs()} active="Cours" onSelect={()=>go&&go('espace')} />}>
      <Eyebrow>Module 3 · Leçon 5</Eyebrow>
      <Display lines={[<>Les mots que<br />tapent tes clients</>]} style={{marginTop:'6px'}} />
      <div className="rv" style={{'--i':3,marginTop:'16px'}}><ChipRow height={36} options={['Vidéo','Transcription','Mes notes','Ressources']} value="Mes notes" /></div>
      <RowBetween className="rv" style={{'--i':4,marginTop:'20px'}}>
        <div>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'20px',letterSpacing:'-.035em',margin:0}}>Mes notes</p>
          <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:0}}>14 notes · 6 leçons</p>
        </div>
        <Tag>Toi seule les lis</Tag>
      </RowBetween>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':5,marginTop:'14px'}}>
        <LessonRow state="plain" icon={<Icon name="comment" size={14} />} title="Lister ce que la cliente dit à voix haute, pas ce que je vends." meta="04/09 · 21:14 · Leçon 5" trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="comment" size={14} />} title="« cosmétique Almadies » plutôt que « cosmétique Sénégal »." meta="04/09 · 21:02 · Leçon 5" trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="comment" size={14} />} title="Vérifier les horaires de la fiche Google avant le week-end." meta="28/08 · 08:47 · Leçon 4" trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="comment" size={14} />} title="Garder les 20 mots qui reviennent, jeter le reste." meta="27/08 · 22:31 · Leçon 4" trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="comment" size={14} />} title="Photos de la boutique : refaire celles de la vitrine." meta="21/08 · 19:05 · Leçon 2" trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} last />
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce qu'elles deviennent</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Elles survivent à la fin du cours et te suivent d'un appareil à l'autre. Écrire une note rapporte de l'expérience ; la rééditer n'en rapporte pas.</p>
      </GlassPanel>
      <div style={{position:'absolute',right:'18px',bottom:'96px',zIndex:9}}>
        <span className="rv-s" style={{'--i':7,width:'56px',height:'56px',borderRadius:'50%',background:'var(--action-forme)',display:'grid',placeItems:'center',boxShadow:'0 10px 26px rgba(0,87,188,.38)',cursor:'pointer'}}>
          <Icon name="send" size={20} color="#fff" strokeWidth={2.6} />
        </span>
      </div>
    </Screen>
  );
}

/** Page publique de vérification. Ton neutre : ni maillage, ni tutoiement — ce n'est pas l'apprenante qui lit. */
function Verification(){
  return (
    <div className="play" style={{width:'100%',height:'100%',position:'relative',overflow:'hidden',background:'var(--paper-2)',
      color:'var(--ink)',fontFamily:'var(--f-body)',fontSize:'15px',lineHeight:1.45}}>
      <div style={{position:'absolute',top:'11px',left:'50%',transform:'translateX(-50%)',width:'104px',height:'30px',background:'#000',borderRadius:'16px',zIndex:6}} />
      <div style={{position:'relative',zIndex:4,height:'50px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px 0 30px',fontSize:'14px',fontWeight:600}}>
        <span>9:41</span>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect y="7" width="3" height="4" rx="1" fill="#0E1116"/><rect x="4.5" y="5" width="3" height="6" rx="1" fill="#0E1116"/><rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="#0E1116"/><rect x="13.5" width="3" height="11" rx="1" fill="#0E1116"/></svg>
      </div>
      <div style={{position:'relative',zIndex:3,padding:'8px 18px 40px',height:'calc(100% - 50px)',overflowY:'auto'}}>
        <div className="rv" style={{display:'flex',alignItems:'center',justifyContent:'space-between',paddingBottom:'16px',borderBottom:'1px solid var(--line)'}}>
          <Wordmark size={20} />
          <span className="mm-num" style={{fontSize:'11px',color:'var(--ink-3)'}}>maxmorrys.me/verifier</span>
        </div>
        <p className="rv" style={{'--i':1,fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--ink-2)',margin:'20px 0 0'}}>Vérification de certificat</p>
        <h1 className="rv-l" style={{'--i':2,fontFamily:'var(--f-display)',fontWeight:900,fontSize:'26px',letterSpacing:'-.032em',lineHeight:1.02,margin:'6px 0 0'}}>Contrôle d'un code</h1>
        <p className="rv" style={{'--i':4,fontSize:'14px',color:'var(--ink-2)',lineHeight:1.5,margin:'10px 0 0'}}>Aucun compte n'est requis. Cette page répond à un code de vérification, et rien d'autre.</p>
        <div className="rv" style={{'--i':5,marginTop:'18px',background:'#fff',border:'1px solid var(--line)',borderRadius:'var(--r-l)',padding:'18px'}}>
          <Field label="Code du certificat" value="MM-C7K4-9RTX-2081" state="focus" style={{marginTop:0}}
            trailing={<Icon name="search" size={17} color="#5A6472" strokeWidth={2.4} />} />
          <Button tone="primary" style={{marginTop:'14px'}}>Vérifier</Button>
        </div>
        <div className="rv" style={{'--i':6,marginTop:'16px',background:'#fff',border:'1px solid rgba(15,123,82,.34)',borderRadius:'var(--r-l)',padding:'18px',boxShadow:'0 8px 24px rgba(15,123,82,.08)'}}>
          <div style={{display:'flex',alignItems:'center',gap:'11px'}}>
            <span style={{width:'34px',height:'34px',borderRadius:'50%',background:'rgba(15,123,82,.14)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>
              <Icon name="check" size={16} color="#0F7B52" strokeWidth={3.4} />
            </span>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'20px',letterSpacing:'-.03em',color:'var(--ok)',margin:0}}>Certificat authentique</p>
          </div>
          <div style={{marginTop:'16px'}}>
            <DocLine label="Titulaire" value="Aïssatou Ndiaye" />
            <DocLine label="Formation" value="Référencement local" />
            <DocLine label="Émis le" value="12/09/2026" />
            <DocLine label="Leçons validées" value="47 / 47" />
            <DocLine label="Code" value="MM-C7K4-9RTX-2081" last />
          </div>
        </div>
        <div className="rv" style={{'--i':7,marginTop:'16px',border:'1px solid var(--line)',borderRadius:'var(--r-m)',padding:'15px',background:'var(--surface-card)'}}>
          <p style={{fontSize:'12.5px',color:'var(--ink-2)',lineHeight:1.55,margin:0}}>Cette page ne permet pas de lister les certificats émis, ni de remonter à un compte. Elle répond à un code, et à un seul.</p>
        </div>
        <p className="rv" style={{'--i':8,fontSize:'11px',color:'var(--ink-3)',marginTop:'16px',fontFamily:'var(--f-mono)'}}>MY ONOMA SARL · Dakar</p>
      </div>
      <div style={{position:'absolute',bottom:'7px',left:'50%',transform:'translateX(-50%)',width:'134px',height:'5px',background:'var(--ink)',opacity:.32,borderRadius:'3px',zIndex:8}} />
    </div>
  );
}

const MM_EXPORT = {MesNotes,Verification};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensNotes.js');
