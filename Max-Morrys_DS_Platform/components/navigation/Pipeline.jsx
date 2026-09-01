import React from 'react';

export function Pipeline({stages=[],active,onSelect,style}){
  return (
    <div style={{display:'flex',gap:'5px',overflow:'hidden',...style}}>
      {stages.map(s=>{
        const on = s===active;
        return <span key={s} onClick={onSelect?()=>onSelect(s):undefined} style={{fontSize:'11px',fontWeight:600,padding:'5px 10px',
          borderRadius:'var(--r-pill)',whiteSpace:'nowrap',cursor:onSelect?'pointer':'default',
          background:on?'#fff':'rgba(255,255,255,.08)',color:on?'#0E1116':'#8B95A3'}}>{s}</span>;
      })}
    </div>
  );
}
