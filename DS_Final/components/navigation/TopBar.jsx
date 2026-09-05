import React from 'react';

const mmTerritoryInk = {forme:'var(--mm-bleu)',informe:'var(--mm-orange)',transforme:'var(--mm-violet)',digitalise:'var(--mm-teal)'};

export function TopBar({brand,items=[],active,onSelect,trailing,style}){
  return (
    <div className="glass" style={{display:'flex',alignItems:'center',gap:'24px',padding:'14px 22px',
      position:'relative',zIndex:4,margin:'16px 22px',borderRadius:'var(--r-pill)',...style}}>
      {brand}
      {items.map(it=>(
        <a key={it.label} onClick={onSelect?()=>onSelect(it.label):undefined} style={{fontSize:'13.5px',fontWeight:600,
          color:'var(--text-body)',textDecoration:'none',paddingBottom:'3px',cursor:onSelect?'pointer':'default',
          borderBottom:'2px solid '+(it.territory?mmTerritoryInk[it.territory]:(it.label===active?'var(--ink)':'transparent')),
          transition:'border-color var(--t-ui) var(--ease)'}}>{it.label}</a>
      ))}
      {trailing && <span style={{marginLeft:'auto',display:'flex',gap:'12px',alignItems:'center'}}>{trailing}</span>}
    </div>
  );
}
