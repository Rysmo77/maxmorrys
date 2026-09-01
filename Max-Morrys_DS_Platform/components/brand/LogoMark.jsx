import React from 'react';

export function LogoMark({size=40,src='assets/logo-mm-icon.png',plate,style}){
  return (
    <span style={{width:size+'px',height:size+'px',display:'grid',placeItems:'center',flex:'0 0 auto',
      borderRadius:plate?Math.round(size*0.28)+'px':0,background:plate?'#fff':'transparent',
      boxShadow:plate?'0 4px 14px rgba(14,17,22,.12)':'none',overflow:'hidden',...style}}>
      <img src={src} alt="Max-Morrys" width={plate?Math.round(size*0.86):size} height={plate?Math.round(size*0.86):size} style={{display:'block'}} />
    </span>
  );
}
