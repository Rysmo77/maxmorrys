import React from 'react';

export function SubNav({items=[],active,onSelect,style}){
  return (
    <div style={{display:'flex',gap:'8px',...style}}>
      {items.map((it,i)=>{
        const on = active===undefined ? i===0 : active===it.label;
        return (
          <a key={it.label} className={onSelect?'mm-press-sm':undefined} onClick={onSelect?()=>onSelect(it.label):undefined} style={{
            display:'inline-flex',alignItems:'center',gap:'9px',height:'42px',padding:'0 16px',borderRadius:'var(--r-pill)',
            fontSize:'13.5px',fontWeight:600,textDecoration:'none',cursor:onSelect?'pointer':'default',
            background:on?'var(--surface-card)':'var(--ctl-off-bg)',
            border:'1px solid '+(on?'var(--glass-brd)':'var(--ctl-off-brd)'),
            color:on?'var(--text-body)':'var(--text-muted)',
            boxShadow:on?'var(--glass-hl),0 4px 14px rgba(14,17,22,.07)':'none'}}>
            <u style={{width:'8px',height:'8px',borderRadius:'3px',display:'block',background:it.color||'var(--fill-5)'}} />
            {it.label}
          </a>
        );
      })}
    </div>
  );
}
