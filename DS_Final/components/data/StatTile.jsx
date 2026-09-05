import React from 'react';

export function StatTile({label,value,foot,dark,style}){
  return (
    <div className={dark?'glass-d':'glass'} style={{padding:'16px',...style}}>
      <p style={{fontSize:'11px',color:dark?'#8B95A3':'var(--text-muted)',margin:0}}>{label}</p>
      <p style={{fontFamily:'var(--f-mono)',fontWeight:700,fontVariantNumeric:'tabular-nums',fontSize:'27px',letterSpacing:'var(--ls-num)',margin:'3px 0 0'}}>{value}</p>
      {foot && <p style={{fontSize:'11px',color:dark?'#7C8896':'var(--text-faint)',margin:0}}>{foot}</p>}
    </div>
  );
}
