import React from 'react';

export function TranslationNotice({date,href,originalLabel='Read the original',className,style}){
  return (
    <div className={className} style={{display:'flex',alignItems:'flex-start',gap:'11px',padding:'13px 16px',borderRadius:'var(--r-m)',
      background:'var(--fill-1)',border:'1px solid var(--border-hair)',...style}}>
      <span style={{width:'22px',height:'22px',borderRadius:'50%',flex:'0 0 auto',marginTop:'1px',
        background:'rgba(243,139,10,.18)',display:'grid',placeItems:'center'}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--mm-orange-t)" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a14 14 0 010 18 14 14 0 010-18z" />
        </svg>
      </span>
      <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>
        <b style={{color:'var(--text-body)',fontWeight:600}}>Machine-translated on <span className="mm-num">{date}</span></b> — The French version is the one I wrote, and the one I keep up to date.{' '}
        <a href={href||'#'} style={{color:'var(--mm-bleu)',fontWeight:600,textDecoration:'none',whiteSpace:'nowrap'}}>{originalLabel} →</a>
      </p>
    </div>
  );
}
