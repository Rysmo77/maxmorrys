import React from 'react';

export function IconButton({children,badge,label,style,onClick,className='',...rest}){
  return (
    <button type="button" className={('mm-press-sm '+className).trim()} aria-label={label} onClick={onClick} style={{
      position:'relative',width:'var(--touch-min)',height:'var(--touch-min)',borderRadius:'50%',
      display:'grid',placeItems:'center',cursor:'pointer',
      color:'var(--text-body)',background:'var(--chrome-bg)',
      border:'1px solid var(--chrome-brd)',
      boxShadow:'var(--chrome-hl),0 4px 14px rgba(14,17,22,.09)',
      ...style}} {...rest}>
      {children}
      {badge && <b style={{position:'absolute',top:'8px',right:'9px',width:'9px',height:'9px',borderRadius:'50%',
        background:'var(--mm-orange)',border:'1.5px solid var(--surface-page)'}} />}
    </button>
  );
}
