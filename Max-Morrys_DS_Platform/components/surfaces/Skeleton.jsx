import React from 'react';

export function Skeleton({width='100%',height=16,radius='var(--r-s)',style}){
  return <div className="skel" style={{
    width:typeof width==='number'?width+'px':width,
    height:typeof height==='number'?height+'px':height,
    borderRadius:typeof radius==='number'?radius+'px':radius,
    background:'linear-gradient(100deg,var(--fill-1) 30%,var(--fill-3) 48%,var(--fill-1) 62%)',
    backgroundSize:'280% 100%',animation:'shim 1.5s infinite linear',...style}} />;
}
