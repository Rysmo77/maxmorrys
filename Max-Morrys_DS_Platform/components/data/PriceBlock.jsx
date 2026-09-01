import React from 'react';

export function PriceBlock({amount,currency='FCFA',strike,note,size=31,style}){
  return (
    <div style={style}>
      <div style={{display:'flex',alignItems:'baseline',gap:'8px'}}>
        <b style={{fontFamily:'var(--f-mono)',fontWeight:700,fontSize:size+'px',letterSpacing:'-.04em'}}>{amount}</b>
        <span style={{fontSize:'14px',fontWeight:600}}>{currency}</span>
        {strike && <s style={{fontFamily:'var(--f-mono)',fontSize:'14px',color:'rgba(14,17,22,.42)'}}>{strike}</s>}
      </div>
      {note && <p style={{fontSize:'12.5px',color:'var(--text-muted)',marginTop:'4px'}}>{note}</p>}
    </div>
  );
}
