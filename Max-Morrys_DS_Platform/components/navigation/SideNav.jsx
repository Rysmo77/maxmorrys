import React from 'react';

export function SideNav({brand,items=[],active,onSelect,footer,style}){
  return (
    <div className="glass" style={{borderRadius:0,border:0,borderRight:'1px solid var(--nav-brd)',boxShadow:'none',
      padding:'22px 18px',position:'relative',zIndex:3,...style}}>
      {brand && <div style={{margin:'2px 0 22px 12px'}}>{brand}</div>}
      {items.map(it=>{
        const on = it.label===active;
        return (
          <a key={it.label} onClick={onSelect?()=>onSelect(it.label):undefined} style={{display:'flex',alignItems:'center',gap:'10px',
            padding:'11px 13px',borderRadius:'14px',fontSize:'13.5px',fontWeight:600,textDecoration:'none',marginBottom:'3px',
            cursor:onSelect?'pointer':'default',
            color:on?'var(--text-body)':'var(--text-muted)',
            background:on?'var(--nav-on-bg)':'transparent',boxShadow:on?'var(--nav-on-sh)':'none'}}>
            <u style={{width:'8px',height:'8px',borderRadius:'3px',display:'block',background:it.color||'var(--fill-5)'}} />
            {it.label}
          </a>
        );
      })}
      {footer && <div style={{marginTop:'22px'}}>{footer}</div>}
    </div>
  );
}
