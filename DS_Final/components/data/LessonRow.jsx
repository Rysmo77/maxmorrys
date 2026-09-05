import React from 'react';

const mmCheck = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F7B52" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 7"/></svg>
);

export function LessonRow({state='todo',icon,iconBackground,title,meta,trailing,last,onClick,style}){
  const current = state==='current';
  let left = null;
  if (icon!==undefined) {
    left = <span style={{width:'34px',height:'34px',borderRadius:'11px',display:'grid',placeItems:'center',flex:'0 0 auto',background:iconBackground||'var(--fill-1)'}}>{icon}</span>;
  } else if (state==='done') {
    left = <span style={{width:'25px',height:'25px',borderRadius:'50%',background:'rgba(15,123,82,.16)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>{mmCheck}</span>;
  } else if (state==='todo') {
    left = <span style={{width:'26px',height:'26px',borderRadius:'50%',border:'2.5px solid var(--fill-3)',flex:'0 0 auto'}} />;
  }
  return (
    <div className={onClick?'mm-press':undefined} onClick={onClick} style={{display:'flex',alignItems:'center',gap:'12px',padding:current?'13px 18px':'13px 0',cursor:onClick?'pointer':undefined,
      borderBottom:last?0:'1px solid var(--border-hair)',
      ...(current?{background:'linear-gradient(135deg,rgba(0,87,188,.1),rgba(108,35,221,.1))',margin:'0 -18px',borderRadius:'14px',borderBottom:0}:null),...style}}>
      {left}
      <span style={{flex:1,minWidth:0}}>
        <b style={{display:'block',fontSize:'14px',fontWeight:600,letterSpacing:'-.01em',color:'var(--text-body)'}}>{title}</b>
        {meta && <span style={{fontSize:'12px',color:'var(--text-faint)',fontFamily:'var(--f-mono)'}}>{meta}</span>}
      </span>
      {trailing}
    </div>
  );
}
