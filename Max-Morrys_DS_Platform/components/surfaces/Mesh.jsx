import React from 'react';

export function Mesh({territory='forme',size,lobes,style}){
  const s = size ? {width:size+'px',height:size+'px'} : null;
  return (
    <div className={'mesh m-'+territory} style={style}>
      {[0,1,2].map(i=><b key={i} style={{...s,...(lobes&&lobes[i])}} />)}
    </div>
  );
}
