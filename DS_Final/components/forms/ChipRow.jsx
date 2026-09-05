import React from 'react';

export function ChipRow({options=[],value,onChange,height=40,layout='clip',icon,className='',style}){
  /* `layout` remplace trois réimplémentations manuelles qui avaient dérivé dans les kits.
     Un seul choix à trois issues nommées, plutôt que deux drapeaux qui peuvent se
     contredire — `scroll` et `wrap` ensemble n'aurait aucun sens. */
  const deborde = layout === 'scroll'
    ? {overflowX:'auto',WebkitOverflowScrolling:'touch'}
    : layout === 'wrap' ? {flexWrap:'wrap'} : {overflow:'hidden'};
  /* `flex:'0 0 auto'` UNIQUEMENT en `scroll`, et c'est le point délicat de ce composant.
     Sous `scroll` il est nécessaire : sans lui les pilules se compriment pour tenir dans la
     colonne au lieu de déborder, et il n'y a plus rien à faire défiler.
     Sous `clip` il serait nuisible : les pilules gardent leur largeur pleine, et
     `overflow:hidden` rogne les dernières — invisibles ET inatteignables. Le `0 1 auto`
     implicite les comprime à la place, ce qui garde les huit accessibles.
     Trois appels existants passent tout juste dans leur conteneur ; les poser en `0 0 auto`
     y perdait un onglet chacun. */
  const flexPilule = layout === 'scroll' ? '0 0 auto' : undefined;
  /* `.mm-scroll-x` masque la barre de défilement (brand/interactions.css). Elle ne peut pas
     être en style inline : `::-webkit-scrollbar` est un pseudo-élément. Elle voyage donc avec
     le composant, comme `.mm-chrome` pour le repli de flou — sinon un consommateur obtient
     une barre native épaisse sous huit pilules. */
  const classes = ((layout === 'scroll' ? 'mm-scroll-x ' : '') + className).trim() || undefined;
  return (
    <div className={classes} style={{display:'flex',gap:'var(--touch-gap)',padding:'2px 0',...deborde,...style}}>
      {options.map((o,i)=>{
        const on = value===undefined ? i===0 : value===o;
        return (
          <span key={o} className={onChange?'mm-press-sm':undefined} onClick={onChange?()=>onChange(o):undefined} style={{
            height:height+'px',flex:flexPilule,display:'inline-flex',alignItems:'center',gap:icon?'6px':0,
            padding:'0 16px',borderRadius:'var(--r-pill)',
            whiteSpace:'nowrap',fontSize:'13px',cursor:onChange?'pointer':'default',
            background:on?'var(--ink)':'var(--ctl-off-bg)',
            border:'1px solid '+(on?'var(--ink)':'var(--ctl-off-brd)'),
            color:on?'var(--text-on-primary)':'var(--text-muted)',fontWeight:on?600:500,
            transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease)'}}>
            {/* `icon` ne s'affiche que sur les pilules INACTIVES. Sur l'active il répéterait
                une information que l'état de la pilule donne déjà — et sur une bande d'onglets
                verrouillés, un cadenas sur l'onglet ouvert serait faux. */}
            {!on && icon}{o}
          </span>
        );
      })}
    </div>
  );
}
