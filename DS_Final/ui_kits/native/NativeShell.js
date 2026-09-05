const { Mesh, IconButton, PillButton, Avatar, Icon, Wordmark, GlassPanel, TabBar, Button, ProgressBar } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   DEUX CHÂSSIS, UN CORPS.

   « La marque d'abord » a une conséquence qu'il faut nommer, parce qu'elle décide tout le
   reste : le CONTENU d'un écran est identique sur iOS et sur Android, et seul le CHÂSSIS
   diffère. Un écran qui aurait besoin de deux corps différents serait un écran où la marque
   a cédé aux conventions — c'est le signal qu'on s'est trompé, pas une exception à gérer.

   Ce qui diffère, exhaustivement :
     · le gabarit          390 × 844 contre 412 × 915
     · la barre d'état     encoche contre poinçon, batterie, position des icônes
     · le retour          chevron + libellé contre flèche, et le retour SYSTÈME d'Android
     · la barre basse     indicateur d'accueil contre navigation gestuelle ou trois boutons
     · le flou            présent contre absent par défaut (voir brand/native.css)

   Ce qui ne diffère pas : le maillage, le verre, les cartes territoire, la typographie,
   les nombres en monospace, les encarts de vérité, le mouvement. Tout le reste.
   ══════════════════════════════════════════════════════════════════════════════ */

const NATIF = {
  ios:     {w:390, h:844, top:47, bottom:34, nav:44},
  android: {w:412, h:915, top:24, bottom:24, nav:64}
};

/* ─── Barre d'état iOS : heure à gauche, triade à droite, encoche au centre ─── */
function StatusIos({dark}){
  const c = dark ? '#ECF0F5' : '#0E1116';
  return (
    <div style={{position:'absolute',top:0,left:0,right:0,height:NATIF.ios.top+'px',zIndex:8,
      display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 26px 0 30px',
      fontSize:'15px',fontWeight:600,color:c,pointerEvents:'none'}}>
      <span style={{fontVariantNumeric:'tabular-nums'}}>9:41</span>
      <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
          <rect y="8" width="3" height="4" rx="1" fill={c}/><rect x="5" y="5.5" width="3" height="6.5" rx="1" fill={c}/>
          <rect x="10" y="3" width="3" height="9" rx="1" fill={c}/><rect x="15" width="3" height="12" rx="1" fill={c} opacity=".35"/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true"><path d="M8 10.5 1 4a10 10 0 0 1 14 0Z" fill={c}/></svg>
        <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
          <rect x=".5" y=".5" width="21" height="11" rx="3.5" fill="none" stroke={c} opacity=".4"/>
          <rect x="2" y="2" width="15" height="8" rx="2" fill={c}/><path d="M23 4v4a2 2 0 0 0 0-4Z" fill={c} opacity=".4"/>
        </svg>
      </span>
    </div>
  );
}
/* Encoche : le rectangle noir large. Sur iPhone 15+ c'est une pilule plus courte et
   détachée du bord — deux gabarits, deux dessins ; celui-ci est l'iPhone 13/14. */
function EncocheIos(){
  return <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'156px',height:'32px',
    background:'#000',borderRadius:'0 0 20px 20px',zIndex:9}} />;
}
function AccueilIos({dark}){
  return <div style={{position:'absolute',bottom:'8px',left:'50%',transform:'translateX(-50%)',width:'134px',height:'5px',
    background:dark?'#fff':'var(--ink)',opacity:dark?.5:.32,borderRadius:'3px',zIndex:10,pointerEvents:'none'}} />;
}

/* ─── Barre d'état Android : heure à GAUCHE avec les notifications, système à droite,
       poinçon centré. La batterie affiche son pourcentage — c'est ce qui la distingue
       le plus vite de celle d'iOS à l'œil nu. ─── */
function StatusAndro({dark}){
  const c = dark ? '#ECF0F5' : '#0E1116';
  return (
    <div style={{position:'absolute',top:0,left:0,right:0,height:NATIF.android.top+'px',zIndex:8,
      display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 14px',
      fontSize:'12.5px',fontWeight:600,color:c,pointerEvents:'none'}}>
      <span style={{display:'flex',alignItems:'center',gap:'7px'}}>
        <span style={{fontVariantNumeric:'tabular-nums'}}>9:41</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg>
      </span>
      <span style={{display:'flex',alignItems:'center',gap:'5px'}}>
        <svg width="13" height="11" viewBox="0 0 16 12" aria-hidden="true"><path d="M8 10.5 1 4a10 10 0 0 1 14 0Z" fill={c}/></svg>
        <svg width="12" height="11" viewBox="0 0 18 12" aria-hidden="true">
          <rect x="1" y="8" width="3" height="4" rx=".5" fill={c}/><rect x="6" y="5" width="3" height="7" rx=".5" fill={c}/><rect x="11" y="1" width="3" height="11" rx=".5" fill={c}/>
        </svg>
        <span style={{fontSize:'11px',fontVariantNumeric:'tabular-nums'}}>87</span>
        <svg width="9" height="13" viewBox="0 0 10 14" aria-hidden="true">
          <rect x="3" width="4" height="1.6" rx=".6" fill={c}/><rect x=".6" y="1.6" width="8.8" height="12" rx="2" fill="none" stroke={c} strokeWidth="1.2"/>
          <rect x="2" y="4" width="6" height="8" rx="1" fill={c}/>
        </svg>
      </span>
    </div>
  );
}
/* Poinçon : petit cercle centré. Le détail qui dit « Android » avant tout le reste. */
function PoinconAndro(){
  return <div style={{position:'absolute',top:'7px',left:'50%',transform:'translateX(-50%)',width:'19px',height:'19px',
    background:'#000',borderRadius:'50%',zIndex:9}} />;
}
/* Navigation système. `boutons` bascule sur les trois boutons : c'est un réglage que
   l'utilisateur possède, donc les deux formes doivent tenir sans redessiner l'écran. */
function NavAndro({dark,boutons}){
  const c = dark ? '#fff' : 'var(--ink)';
  const h = boutons ? NATIF.android.bottom + 24 : NATIF.android.bottom;
  if (!boutons) {
    return <div style={{position:'absolute',bottom:'9px',left:'50%',transform:'translateX(-50%)',width:'108px',height:'3px',
      background:c,opacity:dark?.55:.34,borderRadius:'2px',zIndex:10,pointerEvents:'none'}} />;
  }
  return (
    <div style={{position:'absolute',bottom:0,left:0,right:0,height:h+'px',zIndex:10,display:'flex',
      alignItems:'center',justifyContent:'space-around',pointerEvents:'none',opacity:dark?.6:.4}}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>
      <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeWidth="2.2"/></svg>
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" fill="none" stroke={c} strokeWidth="2.2"/></svg>
    </div>
  );
}

/* ─── Les deux barres de navigation hautes ───
   Même verre, même contenu, deux hauteurs et deux affordances de retour. Le chevron+libellé
   d'iOS dit OÙ l'on revient ; la flèche d'Android ne le dit pas, parce que le retour système
   peut venir d'ailleurs et qu'un libellé faux est pire que pas de libellé. */
function NavBarIos({retour,titre,droite}){
  return (
    <div style={{position:'relative',zIndex:7,height:'var(--navbar-ios)',display:'flex',alignItems:'center',
      justifyContent:'space-between',gap:'10px',padding:'0 12px'}}>
      <span style={{minWidth:'88px',display:'flex',justifyContent:'flex-start'}}>
        {retour && <span className="mm-press-sm" role="button" tabIndex={0} style={{display:'inline-flex',alignItems:'center',gap:'3px',
          minHeight:'44px',padding:'0 6px',color:'var(--mm-bleu)',fontSize:'16px',fontWeight:500,cursor:'pointer'}}>
          <Icon name="back" size={19} strokeWidth={2.6} />{retour}</span>}
      </span>
      {titre && <span style={{fontSize:'16px',fontWeight:600,letterSpacing:'-.01em'}}>{titre}</span>}
      <span style={{minWidth:'88px',display:'flex',justifyContent:'flex-end',gap:'8px'}}>{droite}</span>
    </div>
  );
}
function NavBarAndro({retour,titre,droite}){
  return (
    <div style={{position:'relative',zIndex:7,height:'var(--navbar-andro)',display:'flex',alignItems:'center',
      gap:'6px',padding:'0 8px 0 4px'}}>
      {retour && <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Retour" style={{width:'48px',height:'48px',
        borderRadius:'50%',display:'grid',placeItems:'center',cursor:'pointer',color:'var(--text-body)',flex:'0 0 auto'}}>
        <Icon name="back" size={22} strokeWidth={2.4} /></span>}
      {titre && <span style={{flex:1,fontSize:'19px',fontWeight:600,letterSpacing:'-.015em',
        paddingLeft:retour?'4px':'12px'}}>{titre}</span>}
      {!titre && <span style={{flex:1}} />}
      <span style={{display:'flex',gap:'6px',flex:'0 0 auto'}}>{droite}</span>
    </div>
  );
}

/* ─── L'écran natif : un châssis, un corps ───
   `os` est le SEUL commutateur. Tout ce qui est passé en `children` est écrit une fois. */
function NativeScreen({os='ios',territory='forme',dark,retour,titre,droite,tabbar,boutons,noMesh,children}){
  const g = NATIF[os];
  const [play,setPlay] = React.useState(false);
  React.useEffect(()=>{
    const r = requestAnimationFrame(()=>setPlay(true));
    const t = setTimeout(()=>setPlay(true), 60);
    return ()=>{ cancelAnimationFrame(r); clearTimeout(t); };
  },[]);
  const basSysteme = os === 'android' ? (boutons ? g.bottom + 24 : g.bottom) : g.bottom;
  return (
    <div className={(play?'play ':'')+(dark?'dk ':'')+(os==='android'?'andro':'')}
      style={{position:'relative',width:g.w+'px',height:g.h+'px',overflow:'hidden',isolation:'isolate',
        background:noMesh?'transparent':(dark?'#0B0E13':'#fff'),color:dark?'#ECF0F5':'var(--ink)',
        fontFamily:'var(--f-body)',fontSize:'15px',lineHeight:1.45}}>

      {!noMesh && <Mesh territory={dark?'nuit':territory} size={os==='android'?460:340} />}

      {os === 'ios' ? <EncocheIos /> : <PoinconAndro />}
      {os === 'ios' ? <StatusIos dark={dark} /> : <StatusAndro dark={dark} />}

      <div style={{position:'relative',zIndex:3,height:'100%',display:'flex',flexDirection:'column',
        paddingTop:g.top+'px'}}>
        {(retour || titre || droite) && (os === 'ios'
          ? <NavBarIos retour={retour} titre={titre} droite={droite} />
          : <NavBarAndro retour={retour} titre={titre} droite={droite} />)}
        <div style={{flex:1,overflowY:'auto',
          padding:'6px 18px '+(tabbar
            ? 'calc(var(--tabbar-h) + '+(basSysteme+12)+'px)'
            : (basSysteme+12)+'px')+' 18px'}}>
          {children}
        </div>
        {/* La barre reçoit la zone sûre par sa prop : un rembourrage d'ancêtre ne peut pas
            remonter un enfant en `absolute; bottom:0`. Elle n'a donc pas d'enveloppe. */}
        {tabbar && React.cloneElement(tabbar,{safeBottom:basSysteme})}
      </div>

      {os === 'ios' ? <AccueilIos dark={dark} /> : <NavAndro dark={dark} boutons={boutons} />}
    </div>
  );
}

/* Titres et sourcils, identiques aux deux plateformes — c'est le point du corps unique. */
function NTitre({lines=[],size=32,style}){
  return (
    <h1 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:size+'px',letterSpacing:'-.035em',
      lineHeight:.94,margin:'8px 0 0',...style}}>
      {lines.map((l,i)=><span key={i} className="rv-l" style={{'--i':i+1,display:'block'}}>{l}</span>)}
    </h1>
  );
}
function NSourcil({children,style}){
  return <p className="rv" style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',
    textTransform:'uppercase',color:'var(--text-muted)',margin:0,...style}}>{children}</p>;
}
function NChapo({children,style}){
  return <p className="rv" style={{'--i':4,fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.5,
    margin:'12px 0 0',...style}}>{children}</p>;
}

/* ─── La navigation interne du Club : huit onglets, une seule bande ───
   Elle vit dans le châssis et non dans un fichier d'écrans, parce qu'elle est portée par
   NEUF écrans répartis sur deux lots (le fil et l'agenda du lot 3, les six onglets et
   l'écran verrouillé du lot 5). Une bande recopiée dans chaque fichier dérive.

   En natif la barre basse occupe déjà le bas de l'écran : cette bande n'a qu'un endroit
   possible, juste sous la barre haute, et elle doit porter les HUIT noms — le web posait
   des bandes de quatre, différentes d'un onglet à l'autre, et cinq onglets sur huit
   n'étaient atteignables par aucun geste.

   `height={44}` est le plancher de cible tactile, pas une valeur d'esthétique : cette
   bande EST l'interaction principale de l'écran verrouillé. `overflowX` est aussi posé en
   style, en plus de `layout="scroll"`, parce que `style` est répandu sur le conteneur par
   toutes les versions du composant alors que `layout` n'existe que dans la version
   courante — sans ce garde-fou, la bande reste en `overflow:hidden` et la moitié des
   onglets est physiquement inatteignable. */
const CLUB_ORDRE = ['Fil','Discussions','Membres','Agenda','Classement','Opportunités','Informations','Parrainage'];

function BandeClub({actif,verrou}){
  const { ChipRow, Icon } = window.DS;
  return (
    <div className="rv" style={{marginTop:'4px',marginLeft:'-18px',marginRight:'-18px',padding:'0 18px'}}>
      <ChipRow layout="scroll" height={44} value={actif} options={CLUB_ORDRE} style={{overflowX:'auto'}}
        icon={verrou ? <Icon name="lock" size={11} strokeWidth={2.6} /> : undefined} />
    </div>
  );
}

const MM_EXPORT = {NATIF,StatusIos,StatusAndro,EncocheIos,PoinconAndro,AccueilIos,NavAndro,
  NavBarIos,NavBarAndro,NativeScreen,NTitre,NSourcil,NChapo,CLUB_ORDRE,BandeClub};
Object.assign(window, MM_EXPORT);
window.MMNAT = Object.assign(window.MMNAT||{}, MM_EXPORT);
