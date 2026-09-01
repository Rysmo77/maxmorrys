import React from 'react';

export function DocLine({label,value,last,style}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',gap:'12px',fontSize:'13.5px',padding:'8px 0',
      borderBottom:last?0:'1px dashed var(--fill-3)',...style}}>
      <span style={{color:'var(--text-muted)'}}>{label}</span>
      <b style={{fontFamily:'var(--f-mono)',fontWeight:700}}>{value}</b>
    </div>
  );
}
