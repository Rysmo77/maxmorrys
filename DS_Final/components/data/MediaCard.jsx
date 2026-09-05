import React from 'react';

const MM_ONDE = [16,30,44,24,38,14,33,44,20,36,26,42,18,30,40,22];

export function MediaCard({format='audio',gradient,eyebrow,title,body,cost=[],badge,artHeight=150,titleSize=17,actions,style}){
  const grad = gradient || (format==='audio'
    ? 'linear-gradient(140deg,#6C23DD,#0057BC 62%,#02AC9C)'
    : 'linear-gradient(140deg,#0057BC,#6C23DD)');
  /* Faux verre, aucun flou : une carte de média vit toujours en grille, et une grille
     floutée coûte un recompositing par carte et par image. */
  return (
    <div style={{borderRadius:'var(--r-l)',overflow:'hidden',background:'var(--surface-card-flat)',
      border:'1px solid var(--glass-brd)',boxShadow:'var(--glass-hl),var(--glass-sh-flat)',...style}}>
      <div style={{height:artHeight+'px',background:grad,position:'relative',display:'flex',alignItems:'center',
        justifyContent:format==='audio'?'space-between':'center',padding:'18px'}}>
        {format==='audio' && (
          <span style={{display:'flex',alignItems:'center',gap:'3px',height:'46px'}}>
            {MM_ONDE.map((h,i)=><i key={i} style={{width:'3px',height:h+'px',borderRadius:'2px',background:'rgba(255,255,255,.72)'}} />)}
          </span>
        )}
        {format==='video' && <span style={{position:'absolute',inset:'14px',border:'2px solid rgba(255,255,255,.28)',borderRadius:'14px'}} />}
        <span style={{width:'56px',height:'56px',borderRadius:'50%',background:'rgba(255,255,255,.92)',display:'grid',placeItems:'center',flex:'0 0 auto',
          boxShadow:'0 8px 22px rgba(14,17,22,.24)'}}>
          <svg width="19" height="19" viewBox="0 0 24 24"><polygon points="7 4 20 12 7 20" fill="#0E1116" /></svg>
        </span>
        {badge && <span style={{position:'absolute',left:'14px',bottom:'14px',display:'inline-flex',alignItems:'center',height:'25px',padding:'0 10px',
          borderRadius:'var(--r-pill)',fontSize:'10.5px',fontWeight:600,background:'rgba(0,0,0,.5)',color:'#fff'}}>{badge}</span>}
      </div>
      <div style={{padding:'18px'}}>
        {eyebrow && <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0}}>{eyebrow}</p>}
        {title && <b style={{display:'block',fontFamily:'var(--f-display)',fontWeight:900,fontSize:titleSize+'px',letterSpacing:'-.032em',lineHeight:1.05,marginTop:'7px'}}>{title}</b>}
        {body && <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'9px 0 0'}}>{body}</p>}
        {cost.length > 0 && (
          <div style={{display:'flex',gap:'12px',flexWrap:'wrap',marginTop:'13px',fontFamily:'var(--f-mono)',fontSize:'11px',color:'var(--text-muted)'}}>
            {cost.map(c=><span key={c}>{c}</span>)}
          </div>
        )}
        {actions && <div style={{display:'flex',gap:'9px',marginTop:'16px'}}>{actions}</div>}
      </div>
    </div>
  );
}
