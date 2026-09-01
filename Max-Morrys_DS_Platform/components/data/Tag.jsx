import React from 'react';

const mmTagTone = {
  ok:{background:'rgba(15,123,82,.13)',color:'var(--ok)'},
  warn:{background:'rgba(243,139,10,.18)',color:'var(--warn)'},
  stop:{background:'rgba(180,35,31,.13)',color:'var(--stop)'},
  neutral:{background:'var(--fill-tag)',color:'var(--text-muted)'}
};

export function Tag({tone='neutral',children,style}){
  return <span style={{display:'inline-flex',alignItems:'center',gap:'5px',height:'27px',padding:'0 11px',
    borderRadius:'var(--r-pill)',fontSize:'11px',fontWeight:600,
    transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease)',
    ...(mmTagTone[tone]||mmTagTone.neutral),...style}}>{children}</span>;
}
