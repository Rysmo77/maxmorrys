const { Mesh, TopBar, Wordmark, Button, GlassPanel } = window.DS;

const SITE_NAV = [
  {label:'Je suis Max-Morrys'},
  {label:'Je te forme',territory:'forme'},
  {label:"Je t'informe",territory:'informe'},
  {label:'Je te transforme',territory:'transforme'},
  {label:'Je te digitalise',territory:'digitalise'}
];
/* L'agence vit HORS des quatre verbes : séparateur, puis une entrée en corail.
   Elle ne se range pas sous « Je te digitalise » — c'est une autre promesse et un autre client. */
const SITE_ROUTE = {'Je suis Max-Morrys':'apropos','Je te forme':'formations',"Je t'informe":'blog','Je te transforme':'transforme','Je te digitalise':'presence'};

const SITE_FTR = [
  ['Max-Morrys',['Je te forme',"Je t'informe",'Je te transforme','Je te digitalise','Je suis Max-Morrys']],
  ['Utile',['Questions fréquentes','Vérifier un certificat','Contacte-moi','Flux RSS']],
  ['MY ONOMA',['Max-Morrys Agency','Conditions générales','Confidentialité','Mentions légales']]
];

/* ══ ANGLAIS ══
   Les libellés ne sont pas traduits, ils sont ÉCRITS : l'anglais n'a pas de tutoiement, donc
   la familiarité passe par la contraction et le verbe à particule. « I transform you » sonnerait
   comme une publicité de coach de vie ; « digitize » se dit de documents, pas de commerces. */
const SITE_NAV_EN = [
  {label:"I'm Max-Morrys"},
  {label:"I'll train you",territory:'forme'},
  {label:"I'll keep you posted",territory:'informe'},
  {label:"I'll push you further",territory:'transforme'},
  {label:"I'll get you online",territory:'digitalise'}
];
const SITE_ROUTE_EN = {"I'm Max-Morrys":'apropos',"I'll train you":'formations',"I'll keep you posted":'blog',"I'll push you further":'transforme',"I'll get you online":'presence'};
const SITE_FTR_EN = [
  ['Max-Morrys',["I'll train you","I'll keep you posted","I'll push you further","I'll get you online","I'm Max-Morrys"]],
  ['Useful',['Frequently asked questions','Verify a certificate','Talk to me','RSS feed']],
  ['MY ONOMA',['Max-Morrys Agency','Terms of sale','Privacy','Legal notice']]
];
const FTR_ROUTE_EN = {"I'll train you":'formations',"I'll keep you posted":'blog',"I'll push you further":'transforme',"I'll get you online":'presence',"I'm Max-Morrys":'apropos','Frequently asked questions':'faq','Verify a certificate':'verifier','Talk to me':'contact','Max-Morrys Agency':'agence','Terms of sale':'cgv','Privacy':'cgv','Legal notice':'cgv'};
const FTR_ROUTE = {'Je te forme':'formations',"Je t'informe":'blog','Je te transforme':'transforme','Je te digitalise':'presence','Je suis Max-Morrys':'apropos','Questions fréquentes':'faq','Vérifier un certificat':'verifier','Contacte-moi':'contact','Max-Morrys Agency':'agence','Conditions générales':'cgv','Confidentialité':'cgv','Mentions légales':'cgv'};

function SiteFooter({go,lang='fr'}){
  const EN = lang === 'en';
  const cols = EN ? SITE_FTR_EN : SITE_FTR;
  const route = EN ? FTR_ROUTE_EN : FTR_ROUTE;
  return (
    <div style={{position:'relative',zIndex:3,background:'#0A0D11',color:'#fff',padding:'40px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1.15fr .95fr .95fr .95fr',gap:'26px'}}>
        <div>
          <Wordmark size={22} night tail="#fff" />
          <p style={{fontSize:'12.5px',color:'#6D7987',margin:'10px 0 0',lineHeight:1.6}}>MY ONOMA SARL<br />Dakar, Senegal<br />{EN ? 'Registered on ' : 'Immatriculée le '}<span className="mm-num">11/04/2022</span></p>
        </div>
        {cols.map(([titre,liens])=>(
          <div key={titre}>
            <h5 style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.16em',textTransform:'uppercase',color:'#8B95A3',fontWeight:400,margin:'0 0 11px'}}>{titre}</h5>
            <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
              {liens.map(l=>(
                <a key={l} onClick={go&&route[l]?()=>go(route[l]):undefined} style={{fontSize:'13px',textDecoration:'none',cursor:go&&route[l]?'pointer':'default',
                  color:l==='Max-Morrys Agency'?'#FF8A80':'#A7B2BF'}}>{l}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{height:'1px',background:'rgba(255,255,255,.11)',margin:'28px 0 16px'}} />
      <p style={{fontFamily:'var(--f-mono)',fontSize:'11px',color:'#5D6874',margin:0}}>© 2026 MY ONOMA SARL · maxmorrys.me</p>
    </div>
  );
}

function Page({territory='forme',go,active,lang='fr',children}){
  const EN = lang === 'en';
  return (
    <div className="play" style={{position:'relative',minHeight:'760px',background:'#fff',color:'var(--ink)',overflow:'hidden',isolation:'isolate'}}>
      <Mesh territory={territory} size={520} />
      <TopBar brand={<Wordmark size={23} style={{marginRight:'12px'}} />} items={EN?SITE_NAV_EN:SITE_NAV} active={active}
        onSelect={(l)=>go((EN?SITE_ROUTE_EN:SITE_ROUTE)[l])}
        trailing={<>
          <span onClick={go?()=>go('agence'):undefined} style={{fontSize:'13px',fontWeight:600,color:'#B4231F',cursor:go?'pointer':'default',
            paddingLeft:'14px',marginLeft:'2px',borderLeft:'1px solid var(--border-hair)'}}>Agency</span>
          <span className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)',marginLeft:'auto'}}>
            <b style={{color:EN?'var(--text-faint)':'var(--text-body)'}}>FR</b>&nbsp;/&nbsp;<b style={{color:EN?'var(--text-body)':'var(--text-faint)'}}>EN</b>
          </span>
          <Button size="sm" tone="primary" onClick={go?()=>go('connexion'):undefined}>{EN?'Sign in':'Connexion'}</Button>
        </>} />
      <div style={{position:'relative',zIndex:3,padding:'34px 40px 56px'}}>{children}</div>
      <SiteFooter go={go} lang={lang} />
    </div>
  );
}

function SiteDisplay({lines=[],size=64,style}){
  return (
    <h1 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:size+'px',letterSpacing:'-.038em',lineHeight:.9,margin:0,...style}}>
      {lines.map((l,i)=><span key={i} className="rv-l" style={{'--i':i+1,display:'block'}}>{l}</span>)}
    </h1>
  );
}
function SiteEyebrow({children,style}){return <p className="rv" style={{fontFamily:'var(--f-mono)',fontSize:'11px',letterSpacing:'.16em',textTransform:'uppercase',color:'var(--text-muted)',margin:'0 0 10px',...style}}>{children}</p>;}
function SiteBand({tint,children,style}){
  return <div style={{position:'relative',zIndex:3,margin:'0 -40px',padding:'44px 40px',background:tint||'var(--paper-2)',...style}}>{children}</div>;
}

const MM_EXPORT = {Page,SiteFooter,SiteDisplay,SiteEyebrow,SiteBand,SITE_NAV,SITE_NAV_EN};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit site : ses Accueil / Article / Media ne doivent jamais
   se substituer à ceux du kit mobile, qui portent les mêmes noms. */
window.MMSITE = Object.assign(window.MMSITE||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('SiteShell.js');
