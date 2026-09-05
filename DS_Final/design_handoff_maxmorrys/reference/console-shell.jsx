const { Mesh, IconButton, Avatar, Icon } = window.DS;

function ConsoleScreen({children,title,sub,nav,go}){
  return (
    <div className="play dk" style={{width:'100%',height:'100%',position:'relative',overflow:'hidden',isolation:'isolate',
      background:'#0A0D11',color:'#ECF0F5',fontFamily:'var(--f-body)',fontSize:'15px',lineHeight:1.45}}>
      <Mesh territory="nuit" />
      <div style={{position:'absolute',top:'11px',left:'50%',transform:'translateX(-50%)',width:'104px',height:'30px',background:'#000',borderRadius:'16px',zIndex:6}} />
      <div style={{position:'relative',zIndex:4,height:'50px',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px 0 30px',fontSize:'14px',fontWeight:600,color:'#fff'}}>
        <span>9:41</span>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect y="7" width="3" height="4" rx="1" fill="#fff"/><rect x="4.5" y="5" width="3" height="6" rx="1" fill="#fff"/><rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="#fff"/><rect x="13.5" width="3" height="11" rx="1" fill="#fff"/></svg>
      </div>
      <div style={{position:'relative',zIndex:4,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'4px 18px 12px',gap:'10px'}}>
        <div className="rv">
          <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'#7C8896',margin:0}}>{sub}</p>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'23px',letterSpacing:'-.035em',lineHeight:1,margin:0}}>{title}</p>
        </div>
        <Avatar initials="R" />
      </div>
      <div style={{position:'relative',zIndex:3,padding:'0 18px 40px',height:'calc(100% - 106px)',overflowY:'auto',scrollbarWidth:'none'}}>
        {children}
        {nav && <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginTop:'26px'}}>
          {nav.map(([k,l])=>(<button key={k} onClick={()=>go(k)} style={{border:0,cursor:'pointer',borderRadius:'999px',padding:'8px 13px',
            fontFamily:'var(--f-body)',fontSize:'11.5px',fontWeight:600,background:'rgba(255,255,255,.1)',color:'#ECF0F5'}}>{l}</button>))}
        </div>}
      </div>
      <div style={{position:'absolute',bottom:'7px',left:'50%',transform:'translateX(-50%)',width:'134px',height:'5px',background:'#fff',opacity:.5,borderRadius:'3px',zIndex:8}} />
    </div>
  );
}
function CEyebrow({children,style}){return <p className="rv" style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'#7C8896',margin:0,...style}}>{children}</p>;}
const MM_EXPORT = {ConsoleScreen,CEyebrow};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
