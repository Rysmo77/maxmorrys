import React from 'react';

export function EmptyState({glyph,glyphBackground='var(--fill-1)',title,body,action,style}){
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',padding:'34px 20px',...style}}>
      {glyph!==undefined && <span style={{width:'64px',height:'64px',borderRadius:'22px',display:'grid',placeItems:'center',marginBottom:'16px',background:glyphBackground}}>{glyph}</span>}
      {title && <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.03em',lineHeight:1.1,margin:0}}>{title}</p>}
      {body && <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.5,marginTop:'9px',maxWidth:'34ch'}}>{body}</p>}
      {action && <div style={{marginTop:'18px',width:'100%'}}>{action}</div>}
    </div>
  );
}
