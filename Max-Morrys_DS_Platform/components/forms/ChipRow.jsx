import React from 'react';

export function ChipRow({options=[],value,onChange,height=40,style}){
  return (
    <div style={{display:'flex',gap:'var(--sp-8)',overflow:'hidden',padding:'2px 0',...style}}>
      {options.map((o,i)=>{
        const on = value===undefined ? i===0 : value===o;
        return (
          <span key={o} className={onChange?'mm-press-sm':undefined} onClick={onChange?()=>onChange(o):undefined} style={{
            height:height+'px',display:'inline-flex',alignItems:'center',padding:'0 16px',borderRadius:'var(--r-pill)',
            whiteSpace:'nowrap',fontSize:'13px',cursor:onChange?'pointer':'default',
            background:on?'var(--ink)':'var(--ctl-off-bg)',
            border:'1px solid '+(on?'var(--ink)':'var(--ctl-off-brd)'),
            color:on?'var(--text-on-primary)':'var(--text-muted)',fontWeight:on?600:500,
            transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease)'}}>{o}</span>
        );
      })}
    </div>
  );
}
