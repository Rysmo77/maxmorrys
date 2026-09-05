import React from 'react';

export function SearchPill({label,hint,icon,trailing,height=56,style}){
  return (
    <div className="glass-flat" style={{display:'flex',alignItems:'center',gap:'var(--sp-10)',height:height+'px',
      borderRadius:'var(--r-pill)',padding:'0 20px',...style}}>
      {icon}
      <span style={{fontWeight:700,fontSize:'14px'}}>{label}<em style={{fontStyle:'normal',color:'var(--text-faint)',fontWeight:500}}>{hint}</em></span>
      {trailing && <span style={{marginLeft:'auto',display:'flex',alignItems:'center'}}>{trailing}</span>}
    </div>
  );
}
