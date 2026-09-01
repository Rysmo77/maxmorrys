import React from 'react';

const mmGlassClass = {panel:'glass',hero:'glass-hero',flat:'glass-flat',night:'glass-d',truth:'truth'};

export function GlassPanel({level='panel',padding,children,style,className=''}){
  return (
    <div className={(mmGlassClass[level]||'glass')+(className?' '+className:'')}
      style={{padding:typeof padding==='number'?padding+'px':padding,...style}}>{children}</div>
  );
}
