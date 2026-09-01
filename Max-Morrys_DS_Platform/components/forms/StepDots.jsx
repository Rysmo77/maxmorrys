import React from 'react';

export function StepDots({total=3,current=1,style}){
  return (
    <div style={{display:'flex',gap:'5px',...style}}>
      {Array.from({length:total}).map((_,i)=>(
        <i key={i} style={{flex:1,height:'4px',borderRadius:'3px',background:i<current?'var(--ink)':'var(--fill-3)'}} />
      ))}
    </div>
  );
}
