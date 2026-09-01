import React from 'react';

export function Breadcrumb({items=[],style}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:'7px',fontSize:'11.5px',color:'var(--text-faint)',fontFamily:'var(--f-mono)',...style}}>
      {items.map((it,i)=>(
        <React.Fragment key={it}>
          {i>0 && <span>/</span>}
          <b style={{color:i===items.length-1?'var(--text-muted)':'var(--text-faint)',fontWeight:400}}>{it}</b>
        </React.Fragment>
      ))}
    </div>
  );
}
