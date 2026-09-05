import React from 'react';

export function TabBar({items=[],active,onSelect,safeBottom=0,style}){
  return (
    /* mm-chrome : la classe d'accroche des replis. Sans elle, le flou en ligne échappe à
       `.lowfi`, à `prefers-reduced-transparency` et à `@supports not`.

       `safeBottom` remonte la barre au-dessus de la zone de geste système. Il DOIT vivre
       ici, sur le `bottom` de la barre : `bottom:0` se résout au bas de la boîte de
       rembourrage, donc aucun `paddingBottom` sur un ancêtre ne remonterait la barre.
       Sans lui, l'indicateur d'accueil se dessine par-dessus les onglets et les 34 px
       inférieurs de chaque cible tombent dans la zone où l'OS intercepte le glissement. */
    <div className="mm-chrome" style={{position:'absolute',left:0,right:0,bottom:safeBottom+'px',height:'var(--tabbar-h)',
      display:'flex',alignItems:'flex-start',padding:'10px 8px 0',zIndex:7,
      background:'var(--tabbar-bg)',
      backdropFilter:'blur(var(--glass-blur-chrome)) saturate(180%)',WebkitBackdropFilter:'blur(var(--glass-blur-chrome)) saturate(180%)',
      borderTop:'1px solid var(--tabbar-brd)',
      boxShadow:'var(--tabbar-hl)',...style}}>
      {items.map(it=>{
        const on = it.label===active;
        return (
          <a key={it.label} onClick={onSelect?()=>onSelect(it.label):undefined} style={{flex:1,display:'flex',flexDirection:'column',
            alignItems:'center',gap:'3px',fontSize:'10px',fontWeight:600,textDecoration:'none',minHeight:'48px',justifyContent:'center',
            cursor:onSelect?'pointer':'default',color:on?'var(--text-body)':'var(--text-faint)'}}>
            {it.icon}{it.label}
          </a>
        );
      })}
    </div>
  );
}
