import React from 'react';

export function ProgressBar({value=0,height=8,style}){
  const [w,setW] = React.useState(0);
  React.useEffect(()=>{
    const r = requestAnimationFrame(()=>setW(value));
    const t = setTimeout(()=>setW(value), 60);   // repli hors peinture : la barre ne reste jamais à 0
    return ()=>{ cancelAnimationFrame(r); clearTimeout(t); };
  },[value]);
  return (
    <div style={{height:height+'px',borderRadius:'5px',background:'var(--fill-2)',overflow:'hidden',...style}}>
      <i style={{display:'block',height:'100%',borderRadius:'5px',width:w+'%',
        background:'linear-gradient(90deg,#0057BC,#6C23DD,#F38B0A,#02AC9C)',backgroundSize:'220% 100%',
        transition:'width var(--t-scene) var(--ease-out)'}} />
    </div>
  );
}
