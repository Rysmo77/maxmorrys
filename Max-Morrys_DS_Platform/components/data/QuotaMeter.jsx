import React from 'react';

export function QuotaMeter({used=0,total=5,label,style}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:'9px',fontSize:'11.5px',color:'var(--text-muted)',fontFamily:'var(--f-mono)',...style}}>
      <span style={{display:'flex',gap:'3px'}}>
        {Array.from({length:total}).map((_,i)=>(
          <i key={i} style={{width:'15px',height:'5px',borderRadius:'3px',
            background:i<used?'var(--mm-violet)':'var(--fill-3)',transition:'background var(--t-ui) var(--ease)'}} />
        ))}
      </span>
      <span>{label || used+' / '+total+" aujourd'hui"}</span>
    </div>
  );
}
