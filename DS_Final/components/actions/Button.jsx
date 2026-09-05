import React from 'react';

const mmButtonTone = {
  primary:{background:'var(--action-primary)',color:'var(--text-on-primary)',boxShadow:'var(--sh-ink)'},
  forme:{background:'var(--action-forme)',color:'#fff',boxShadow:'var(--sh-bleu)'},
  /* L'orange reste clair dans les deux modes : son encre est fixe, jamais var(--ink). */
  informe:{background:'var(--action-informe)',color:'#0E1116',boxShadow:'0 8px 24px rgba(243,139,10,.32)'},
  transforme:{background:'var(--action-transforme)',color:'#fff',boxShadow:'var(--sh-violet)'},
  digitalise:{background:'var(--action-digitalise)',color:'#fff',boxShadow:'var(--sh-teal)'},
  /* Aucun flou : un bouton est petit, le flou n'y apporte presque rien mais coûte une couche
     de composition PAR bouton. Trois boutons fantômes suffisaient à dépasser le budget de deux
     surfaces sans qu'aucune carte ne soit en cause. Voir REGLES-DE-REVUE.md § 1. */
  ghost:{background:'var(--btn-ghost-bg)',color:'var(--ink)',border:'var(--btn-ghost-brd)'},
  quiet:{background:'var(--surface-quiet)',border:'var(--btn-quiet-brd)',color:'var(--ink)'},
  disabled:{background:'var(--btn-off-bg)',color:'var(--ink-3)'}
};

export function Button({tone='primary',size='md',fullWidth,children,style,onClick,disabled,className='',...rest}){
  const t = mmButtonTone[disabled ? 'disabled' : tone] || mmButtonTone.primary;
  const sm = size === 'sm';
  return (
    <button type="button" className={('mm-press '+className).trim()} onClick={disabled ? undefined : onClick} aria-disabled={disabled || undefined} style={{
      display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'8px',border:0,cursor:disabled?'default':'pointer',
      minHeight:sm?'42px':'var(--touch-btn)',padding:sm?'0 17px':'0 22px',borderRadius:'var(--r-pill)',
      fontFamily:'var(--f-body)',fontWeight:700,fontSize:sm?'13.5px':'15px',
      width:fullWidth===undefined ? (sm?'auto':'100%') : (fullWidth?'100%':'auto'),
      ...t,...style}} {...rest}>{children}</button>
  );
}
