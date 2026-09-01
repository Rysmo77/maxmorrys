import React from 'react';

export function Avatar({initials='',size=42,background='linear-gradient(135deg,var(--mm-violet),var(--mm-bleu))',style}){
  return <span style={{width:size+'px',height:size+'px',borderRadius:'50%',background,display:'grid',placeItems:'center',
    color:'#fff',fontWeight:700,fontSize:Math.round(size/3)+'px',fontFamily:'var(--f-display)',
    border:'1.5px solid rgba(255,255,255,.6)',flex:'0 0 auto',...style}}>{initials}</span>;
}
