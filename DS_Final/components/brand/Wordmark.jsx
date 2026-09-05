import React from 'react';

/* Les trois couleurs sont celles qui portaient « Max » : bleu, orange, teal — dans cet ordre.
   Le dégradé les reprend en une seule coulée au lieu de trois lettres découpées. */
const mmHelloGrad = {
  jour: 'linear-gradient(96deg,#0057BC 0%,#F38B0A 52%,#02AC9C 100%)',
  nuit: 'linear-gradient(96deg,#6FB1FF 0%,#FFB24D 52%,#3FD9C6 100%)'
};

export function Wordmark({brand='hello',size=22,tail,night,short,style}){
  const c = night
    ? {b:'var(--mm-bleu-n)',o:'var(--mm-orange-n)',t:'var(--mm-teal-n)',v:'var(--mm-violet-n)'}
    : {b:'var(--mm-bleu)',o:'var(--mm-orange)',t:'var(--mm-teal)',v:'var(--mm-violet)'};
  const base = {fontFamily:'var(--f-display)',fontWeight:900,fontSize:size+'px',letterSpacing:'-.045em',
    lineHeight:1,whiteSpace:'nowrap'};

  /* WEB — « Hello ! » en dégradé.
     `color` est posé AVANT `WebkitTextFillColor` : là où le remplissage transparent n'est pas
     compris, le texte reste lisible en bleu au lieu de disparaître. */
  if (brand === 'hello') {
    return (
      <span style={{...base,
        background:night?mmHelloGrad.nuit:mmHelloGrad.jour,
        color:night?'#6FB1FF':'#0057BC',
        WebkitBackgroundClip:'text',backgroundClip:'text',
        WebkitTextFillColor:'transparent',
        ...style}}>Hello&nbsp;!</span>
    );
  }

  /* APPLICATION MOBILE — le nom de l'app est « Rysmo ».
     Le R reprend le bleu, le o final le teal : la marque garde ses bornes de couleur. */
  if (brand === 'rysmo') {
    return (
      <span style={{...base,...style}}>
        <span style={{color:c.b}}>R</span>
        <span style={{color:tail||'var(--text-body)'}}>ysm</span>
        <span style={{color:c.t}}>o</span>
      </span>
    );
  }

  /* SIGNATURE ÉDITORIALE — la personne, pas le produit. Conservée pour les mentions
     légales, la page « Je suis Max-Morrys » et la signature d'article. */
  return (
    <span style={{...base,...style}}>
      <span style={{color:c.b}}>M</span><span style={{color:c.o}}>a</span><span style={{color:c.t}}>x</span>
      {!short && <><span style={{color:c.v}}>-</span><span style={{color:tail||'var(--text-body)'}}>Morrys</span></>}
    </span>
  );
}
