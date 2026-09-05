import React from 'react';

const mmGlassClass = {panel:'glass',hero:'glass-hero',flat:'glass-flat',night:'glass-d',ink:'ink-card',truth:'truth'};

export function GlassPanel({level='panel',padding,children,style,className=''}){
  /* `ink` ouvre sa propre portée de thème : posée sur une page claire, la carte est sombre,
     donc les jetons d'encre qu'elle contient doivent être ceux du mode nuit. Sans ça, chaque
     texte à l'intérieur serait un gris écrit à la main — et c'est exactement l'erreur que ce
     niveau existe pour empêcher. */
  const portee = level === 'ink' ? ' dk' : '';
  return (
    <div className={(mmGlassClass[level]||'glass')+portee+(className?' '+className:'')}
      style={{padding:typeof padding==='number'?padding+'px':padding,...style}}>{children}</div>
  );
}
