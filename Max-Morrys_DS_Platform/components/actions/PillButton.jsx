import React from 'react';

export function PillButton({children,style,className='',...rest}){
  return (
    <button type="button" className={('mm-press-sm '+className).trim()} style={{
      background:'var(--pill-bg)',
      color:'#fff',border:0,cursor:'pointer',borderRadius:'var(--r-pill)',padding:'0 17px',
      fontFamily:'var(--f-body)',fontSize:'12px',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',
      minHeight:'var(--touch-min)',display:'inline-flex',alignItems:'center',
      ...style}} {...rest}>{children}</button>
  );
}
