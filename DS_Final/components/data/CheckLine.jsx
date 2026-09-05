import React from 'react';

const mmCheckTone = {
  violet:{bg:'rgba(108,35,221,.15)',stroke:'var(--mm-violet-t)'},
  ok:{bg:'rgba(15,123,82,.15)',stroke:'var(--ok)'},
  neutre:{bg:'var(--fill-2)',stroke:'var(--ink-2)'}
};

export function CheckLine({tone='violet',dash,size=12,children,style}){
  const t = mmCheckTone[tone] || mmCheckTone.violet;
  return (
    <div style={{display:'flex',gap:'11px',alignItems:'flex-start',marginTop:'10px',fontSize:'14.5px',lineHeight:1.5,...style}}>
      <span style={{width:'22px',height:'22px',borderRadius:'50%',flex:'0 0 auto',marginTop:'1px',background:t.bg,display:'grid',placeItems:'center'}}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.stroke} strokeWidth={dash?3:3.4} strokeLinecap="round" strokeLinejoin="round">
          {dash ? <path d="M6 12h12" /> : <path d="M4 12.5l5.5 5.5L20 7" />}
        </svg>
      </span>
      <span>{children}</span>
    </div>
  );
}
