import React from 'react';

export function PayOption({logo,logoBackground,title,note,on,onClick,style}){
  return (
    <div className={onClick?'mm-press':undefined} onClick={onClick} style={{
      display:'flex',alignItems:'center',gap:'13px',padding:'15px',borderRadius:'var(--r-m)',minHeight:'68px',
      background:'var(--ctl-off-bg)',border:'1.5px solid '+(on?'var(--ctl-sel-brd)':'var(--ctl-off-brd)'),
      boxShadow:on?'var(--ctl-sel-ring),var(--glass-hl)':'none',cursor:onClick?'pointer':'default',
      transition:'border-color var(--t-ui) var(--ease),box-shadow var(--t-ui) var(--ease)',...style}}>
      {logo && <span style={{width:'44px',height:'44px',borderRadius:'13px',display:'grid',placeItems:'center',flex:'0 0 auto',
        fontFamily:'var(--f-display)',fontWeight:900,fontSize:'16px',color:'#fff',background:logoBackground}}>{logo}</span>}
      <span style={{flex:1}}>
        <b style={{display:'block',fontSize:'14.5px',fontWeight:600}}>{title}</b>
        {note && <span style={{fontSize:'12px',color:'var(--text-faint)'}}>{note}</span>}
      </span>
      <span style={{width:'22px',height:'22px',borderRadius:'50%',flex:'0 0 auto',
        border:(on?'7px':'2px')+' solid '+(on?'var(--ink)':'var(--ctl-radio-brd)'),
        transition:'border-width var(--t-ui) var(--ease),border-color var(--t-ui) var(--ease)'}} />
    </div>
  );
}
