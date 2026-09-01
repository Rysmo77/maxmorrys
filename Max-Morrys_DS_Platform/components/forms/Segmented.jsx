import React from 'react';

export function Segmented({options=[],value,onChange,style}){
  return (
    <div style={{display:'flex',padding:'4px',borderRadius:'var(--r-pill)',background:'var(--surface-quiet)',gap:'4px',...style}}>
      {options.map((o,i)=>{
        const on = value===undefined ? i===0 : value===o;
        return (
          <span key={o} className={onChange?'mm-press-sm':undefined} onClick={onChange?()=>onChange(o):undefined} style={{
            flex:1,textAlign:'center',fontSize:'13px',fontWeight:600,padding:'9px 0',borderRadius:'var(--r-pill)',
            cursor:onChange?'pointer':'default',
            color:on?'var(--ink)':'var(--text-muted)',background:on?'var(--seg-on-bg)':'transparent',
            boxShadow:on?'var(--seg-on-sh)':'none',
            transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease),box-shadow var(--t-ui) var(--ease)'}}>{o}</span>
        );
      })}
    </div>
  );
}
