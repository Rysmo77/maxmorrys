import React from 'react';

export function ReadingBar({value=0,style}){
  return (
    <div style={{position:'absolute',left:0,right:0,top:0,height:'3px',zIndex:9,background:'var(--fill-1)',...style}}>
      <i style={{display:'block',height:'100%',width:value+'%',
        background:'linear-gradient(90deg,#F38B0A,#FF6E7F,#6C23DD)',transition:'width 1.4s var(--ease-out)'}} />
    </div>
  );
}
