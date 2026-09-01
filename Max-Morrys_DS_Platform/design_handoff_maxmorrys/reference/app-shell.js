const { Mesh, IconButton, PillButton, Avatar, Icon, Wordmark } = window.DS;

function StatusBar({dark}){
  const c = dark ? '#ECF0F5' : '#0E1116';
  return (
    <div style={{position:'relative',zIndex:4,height:'50px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px 0 30px',fontSize:'14px',fontWeight:600,color:c}}>
      <span>9:41</span>
      <svg width="17" height="11" viewBox="0 0 17 11"><rect y="7" width="3" height="4" rx="1" fill={c}/><rect x="4.5" y="5" width="3" height="6" rx="1" fill={c}/><rect x="9" y="2.5" width="3" height="8.5" rx="1" fill={c}/><rect x="13.5" width="3" height="11" rx="1" fill={c}/></svg>
    </div>
  );
}

function Notch(){return <div style={{position:'absolute',top:'11px',left:'50%',transform:'translateX(-50%)',width:'104px',height:'30px',background:'#000',borderRadius:'16px',zIndex:6}} />;}
function HomeBar({dark}){return <div style={{position:'absolute',bottom:'7px',left:'50%',transform:'translateX(-50%)',width:'134px',height:'5px',background:dark?'#fff':'var(--ink)',opacity:dark?.5:.32,borderRadius:'3px',zIndex:8}} />;}

function AppBar({left,center,right}){
  return (
    <div style={{position:'relative',zIndex:4,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 18px 12px',gap:'10px'}}>
      {left || <span style={{width:'42px'}} />}
      {center}
      {right || <span style={{width:'42px'}} />}
    </div>
  );
}

function BackButton({onClick}){return <IconButton label="Retour" onClick={onClick}><Icon name="back" strokeWidth={2.4} /></IconButton>;}

/** Écran : maillage + chrome + corps défilant. */
function Screen({territory='forme',dark,children,bar,tabbar,meshLobes,readingBar,noMesh,onTime}){
  // Le thème et le mode prototype sont lus sur <html>, jamais sur window : ce fichier est
  // bundlé, et un drapeau global posé par une copie bundlée s'appliquerait à tout le produit.
  // data-mm-dark décline la totalité des écrans en sombre sans qu'aucun soit redessiné :
  // le thème est une portée CSS (.dk), pas une variante de composant.
  const html = document.documentElement;
  const nuit = dark || html.hasAttribute('data-mm-dark');
  const proto = html.hasAttribute('data-mm-proto');
  // La scène d'entrée se joue au montage : .play est posé à l'image suivante,
  // sinon les transitions démarrent déjà à leur état final.
  const [play,setPlay] = React.useState(false);
  React.useEffect(()=>{
    const r = requestAnimationFrame(()=>setPlay(true));
    const t = setTimeout(()=>setPlay(true), 60);   // repli hors peinture (iframe caché, vignette)
    return ()=>{ cancelAnimationFrame(r); clearTimeout(t); };
  },[]);
  return (
    <div className={(play?'play':'')+(nuit?' dk':'')} style={{width:'100%',height:'100%',position:'relative',overflow:'hidden',isolation:'isolate',
      background:(noMesh||proto)?'transparent':(nuit?'#0B0E13':'#fff'),color:nuit?'#ECF0F5':'var(--ink)',fontFamily:'var(--f-body)',fontSize:'15px',lineHeight:1.45}}>
      {!(noMesh || proto) && <Mesh territory={nuit&&territory==='nuit'?'nuit':territory} lobes={meshLobes} />}
      <Notch />
      {readingBar}
      <div onClick={onTime}><StatusBar dark={nuit} /></div>
      {bar}
      <div style={{position:'relative',zIndex:3,padding:'0 18px '+(tabbar?'104px':'40px'),height:'calc(100% - 50px)',overflowY:'auto',overflowX:'hidden',scrollbarWidth:'none'}}>{children}</div>
      {tabbar}
      <HomeBar dark={nuit} />
    </div>
  );
}

function Display({size='md',lines=[],style}){
  const s = size==='lg'?{fontSize:'41px',letterSpacing:'-.038em',lineHeight:.9}
          : size==='sm'?{fontSize:'30px',letterSpacing:'-.038em',lineHeight:.95}
          : {fontSize:'23px',letterSpacing:'-.028em',lineHeight:1.02};
  return (
    <h1 style={{fontFamily:'var(--f-display)',fontWeight:900,margin:0,...s,...style}}>
      {lines.map((l,i)=><span key={i} className="rv-l" style={{'--i':i,display:'block'}}>{l}</span>)}
    </h1>
  );
}

function Eyebrow({children,style}){return <p className="rv" style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0,...style}}>{children}</p>;}
function Lede({children,style}){return <p className="rv" style={{color:'var(--text-muted)',fontSize:'14px',lineHeight:1.5,margin:0,...style}}>{children}</p>;}
function MediaBlock({height=148,gradient='linear-gradient(140deg,#0057BC,#6C23DD 55%,#F38B0A)',children,style}){
  return <div className="rv-s" style={{height:height+'px',borderRadius:'var(--r-media)',background:gradient,display:'flex',alignItems:'flex-end',padding:'14px',boxShadow:'0 14px 34px rgba(0,87,188,.28)',position:'relative',...style}}>{children}</div>;
}
function RowBetween({children,style}){return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',...style}}>{children}</div>;}

/* MediaBlock, pas Media : le kit site publie une page nommée Media. */
/* ══ LE NOM DU RÉPÉTITEUR ══
   « Rysmo » est le nom de l'APPLICATION. Le répétiteur IA qui vit dedans s'appelle
   « Répétiteur » par défaut, et chaque personne peut le renommer — d'où une valeur
   partagée plutôt qu'une chaîne recopiée. Un écran qui écrit le nom en dur casse
   le renommage sans que rien ne le signale. */
const MM_TUTOR_DEFAUT = 'Répétiteur';
let mmTutor = MM_TUTOR_DEFAUT;
const tutorNom = ()=>mmTutor;
const setTutorNom = (n)=>{ mmTutor = (n||'').trim() || MM_TUTOR_DEFAUT; };

const MM_EXPORT = {StatusBar,Notch,HomeBar,AppBar,BackButton,Screen,Display,Eyebrow,Lede,MediaBlock,RowBetween,MM_TUTOR_DEFAUT,tutorNom,setTutorNom};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('AppShell.js');
