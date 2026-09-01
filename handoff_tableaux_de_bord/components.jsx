/* ══════════════════════════════════════════════════════════════════════════════
   LES 25 COMPOSANTS QUE CES DEUX TABLEAUX DE BORD UTILISENT.

   Fonctions React ordinaires, styles en ligne lisant les variables CSS de css/.
   Aucune dépendance npm : React seul.

   AUCUN mot-clé de module ici, volontairement : Babel Standalone bascule en CommonJS dès
   qu'il en voit un seul, et le navigateur échoue alors sur « exports is not defined ».
   En production, remets de vrais exports et supprime le window.DS de fin de fichier.
   ══════════════════════════════════════════════════════════════════════════════ */


/* ───────────  BRAND  ─────────── */

const MM_ICONS = {"back":{"p":["M15 19l-7-7 7-7"]},"forward":{"p":["M9 5l7 7-7 7"]},"close":{"p":["M18 6L6 18M6 6l12 12"]},"bell":{"p":["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.7 21a2 2 0 01-3.4 0"]},"search":{"p":["M20 20l-3.5-3.5"],"c":[[11,11,7]],"w":2.4},"lock":{"p":["M8 11V8a4 4 0 018 0v3"],"r":[[5,11,14,10,2]],"w":2.4},"share":{"p":["M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8","M16 6l-4-4-4 4","M12 2v14"]},"chat":{"p":["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"]},"home":{"p":["M3 10l9-7 9 7v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"]},"book":{"p":["M4 5a2 2 0 012-2h12a2 2 0 012 2v16l-8-4-8 4z"]},"users":{"p":["M2 20a7 7 0 0114 0"],"c":[[9,8,3.4]]},"user":{"p":["M4 21a8 8 0 0116 0"],"c":[[12,8,3.6]]},"star":{"p":["M12 2l3 6 6 .8-4.5 4.3 1.2 6.4L12 16.5 6.3 19.5l1.2-6.4L3 8.8 9 8z"]},"check":{"p":["M4 12.5l5.5 5.5L20 7"],"w":3.4},"alert":{"p":["M12 8v5","M10.3 3.5L2.6 17a2 2 0 001.7 3h15.4a2 2 0 001.7-3L13.7 3.5a2 2 0 00-3.4 0z"],"c":[[12,17,0.7]],"w":2.6},"card":{"p":["M2 10h20"],"r":[[2,5,20,14,2]]},"eye":{"p":["M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z"],"c":[[12,12,2.6]]},"download":{"p":["M12 3v12M7 11l5 5 5-5M4 20h16"]},"trash":{"p":["M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"]},"doc":{"p":["M4 5h16v14H4z","M4 9h16"]},"send":{"p":["M5 12h14M13 6l6 6-6 6"],"w":2.6},"bookmark":{"p":["M6 3h12v18l-6-4.5L6 21z"]},"comment":{"p":["M4 4h16v13H8l-4 4z"]},"dots":{"c":[[12,12,2.2],[12,5,1.4],[12,19,1.4]]},"play":{"fill":"M7 4 L20 12 L7 20 Z","solid":true},"bars":{"p":["M4 18v-6M10 18V6M16 18v-9M22 18V3"]},"globe":{"p":["M12 2a9 9 0 100 18 9 9 0 000-18zM3 12h18","M12 2a14 14 0 010 18 14 14 0 010-18z"]},"chevron":{"p":["M6 9l6 6 6-6"]},"list":{"p":["M4 6h16M4 12h16M4 18h10"]},"calendar":{"p":["M3 10h18M8 3v4M16 3v4"],"r":[[3,5,18,16,2]]},"case":{"p":["M4 7h16v13H4zM9 7V4h6v3"]},"info":{"p":["M12 11v6M12 7.5v.5"],"c":[[12,12,9]]},"plus":{"p":["M12 3v18M3 12h18"]},"heart":{"p":["M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"],"w":2},"repeat":{"p":["m2 9 3-3 3 3","M13 18H7a2 2 0 0 1-2-2V6","m22 15-3 3-3-3","M11 6h6a2 2 0 0 1 2 2v10"],"w":2}};

function Icon({name='check',size=19,strokeWidth,color='currentColor',style}){
  const ic = MM_ICONS[name] || MM_ICONS.check;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={ic.solid?'none':color}
      strokeWidth={strokeWidth||ic.w||2.2} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      {ic.solid && <path d={ic.fill} fill={color} />}
      {(ic.r||[]).map((r,i)=><rect key={'r'+i} x={r[0]} y={r[1]} width={r[2]} height={r[3]} rx={r[4]} />)}
      {(ic.c||[]).map((c,i)=><circle key={'c'+i} cx={c[0]} cy={c[1]} r={c[2]} />)}
      {(ic.p||[]).map((d,i)=><path key={'p'+i} d={d} />)}
    </svg>
  );
}

const iconNames = Object.keys(MM_ICONS);

function LogoMark({size=40,src='assets/logo-mm-icon.png',plate,style}){
  return (
    <span style={{width:size+'px',height:size+'px',display:'grid',placeItems:'center',flex:'0 0 auto',
      borderRadius:plate?Math.round(size*0.28)+'px':0,background:plate?'#fff':'transparent',
      boxShadow:plate?'0 4px 14px rgba(14,17,22,.12)':'none',overflow:'hidden',...style}}>
      <img src={src} alt="Max-Morrys" width={plate?Math.round(size*0.86):size} height={plate?Math.round(size*0.86):size} style={{display:'block'}} />
    </span>
  );
}

/* Les trois couleurs sont celles qui portaient « Max » : bleu, orange, teal — dans cet ordre.
   Le dégradé les reprend en une seule coulée au lieu de trois lettres découpées. */
const mmHelloGrad = {
  jour: 'linear-gradient(96deg,#0057BC 0%,#F38B0A 52%,#02AC9C 100%)',
  nuit: 'linear-gradient(96deg,#6FB1FF 0%,#FFB24D 52%,#3FD9C6 100%)'
};

function Wordmark({brand='hello',size=22,tail,night,short,style}){
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


/* ───────────  SURFACES  ─────────── */

const mmGlassClass = {panel:'glass',hero:'glass-hero',flat:'glass-flat',night:'glass-d',truth:'truth'};

function GlassPanel({level='panel',padding,children,style,className=''}){
  return (
    <div className={(mmGlassClass[level]||'glass')+(className?' '+className:'')}
      style={{padding:typeof padding==='number'?padding+'px':padding,...style}}>{children}</div>
  );
}

function Mesh({territory='forme',size,lobes,style}){
  const s = size ? {width:size+'px',height:size+'px'} : null;
  return (
    <div className={'mesh m-'+territory} style={style}>
      {[0,1,2].map(i=><b key={i} style={{...s,...(lobes&&lobes[i])}} />)}
    </div>
  );
}

const mmLayout = {
  stack:{chevron:true,overlap:true,  pad:'24px 20px 36px'},
  grid: {chevron:true,overlap:false, pad:'24px 20px 28px'},
  row:  {chevron:true,overlap:false, pad:'26px 20px 30px'},
  plain:{chevron:false,overlap:false,pad:'20px'}
};

function TerritoryCard({territory='forme',meta,title,titleSize,big,bigLabel,trailing,padding,layout,stacked=true,first,children,style}){
  const grad = 'linear-gradient(150deg,var(--g-'+territory+'-1) 0%,var(--g-'+territory+'-2) 100%)';
  const L = mmLayout[layout] || (stacked ? mmLayout.stack : mmLayout.plain);
  return (
    <div style={{
      position:'relative',borderRadius:'var(--r-l)',
      padding:padding!==undefined?(typeof padding==='number'?padding+'px':padding):L.pad,
      marginTop:L.overlap&&!first?'var(--stack-overlap)':0,isolation:'isolate',background:grad,
      border:'1px solid var(--border-glass)',color:'var(--card-ink)',
      boxShadow:'var(--card-hl),var(--card-sh)',...style}}>
      {L.chevron && <span aria-hidden="true" style={{position:'absolute',left:'-1px',right:'-1px',top:'-16px',height:'18px',background:grad,
        clipPath:'polygon(0 100%,22% 62%,38% 18%,50% 0,62% 18%,78% 62%,100% 100%)'}} />}
      {L.chevron && <span aria-hidden="true" style={{position:'absolute',top:'-7px',left:'50%',transform:'translateX(-50%)',width:'34px',height:'4px',borderRadius:'3px',background:'var(--card-grip)',zIndex:3}} />}
      <div style={{position:'relative',display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:'12px'}}>
        <div>
          {meta && <div style={{fontFamily:'var(--f-mono)',fontSize:'11px',color:'var(--card-ink-2)'}}>{meta}</div>}
          {title && <div style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:titleSize?titleSize+'px':'var(--fs-ttl)',letterSpacing:'var(--ls-ttl)',lineHeight:titleSize&&titleSize<26?1.08:1,marginTop:'4px'}}>{title}</div>}
        </div>
        {big!==undefined && <div style={{fontFamily:'var(--f-mono)',fontWeight:700,fontSize:'26px',lineHeight:1,textAlign:'right',letterSpacing:'-.03em'}}>
          {big}
          {bigLabel && <small style={{display:'block',fontFamily:'var(--f-body)',fontSize:'10px',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',opacity:.58,marginTop:'3px'}}>{bigLabel}</small>}
        </div>}
        {trailing}
      </div>
      {children && <div style={{position:'relative'}}>{children}</div>}
    </div>
  );
}


/* ───────────  ACTIONS  ─────────── */

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

function Button({tone='primary',size='md',fullWidth,children,style,onClick,disabled,className='',...rest}){
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

function IconButton({children,badge,label,style,onClick,className='',...rest}){
  return (
    <button type="button" className={('mm-press-sm '+className).trim()} aria-label={label} onClick={onClick} style={{
      position:'relative',width:'var(--touch-min)',height:'var(--touch-min)',borderRadius:'50%',
      display:'grid',placeItems:'center',cursor:'pointer',
      color:'var(--text-body)',background:'var(--chrome-bg)',
      border:'1px solid var(--chrome-brd)',
      boxShadow:'var(--chrome-hl),0 4px 14px rgba(14,17,22,.09)',
      ...style}} {...rest}>
      {children}
      {badge && <b style={{position:'absolute',top:'8px',right:'9px',width:'9px',height:'9px',borderRadius:'50%',
        background:'var(--mm-orange)',border:'1.5px solid var(--surface-page)'}} />}
    </button>
  );
}

function PillButton({children,style,className='',...rest}){
  return (
    <button type="button" className={('mm-press-sm '+className).trim()} style={{
      background:'var(--pill-bg)',
      color:'#fff',border:0,cursor:'pointer',borderRadius:'var(--r-pill)',padding:'0 17px',
      fontFamily:'var(--f-body)',fontSize:'12px',fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',
      minHeight:'var(--touch-min)',display:'inline-flex',alignItems:'center',
      ...style}} {...rest}>{children}</button>
  );
}


/* ───────────  FORMS  ─────────── */

function ChipRow({options=[],value,onChange,height=40,style}){
  return (
    <div style={{display:'flex',gap:'var(--sp-8)',overflow:'hidden',padding:'2px 0',...style}}>
      {options.map((o,i)=>{
        const on = value===undefined ? i===0 : value===o;
        return (
          <span key={o} className={onChange?'mm-press-sm':undefined} onClick={onChange?()=>onChange(o):undefined} style={{
            height:height+'px',display:'inline-flex',alignItems:'center',padding:'0 16px',borderRadius:'var(--r-pill)',
            whiteSpace:'nowrap',fontSize:'13px',cursor:onChange?'pointer':'default',
            background:on?'var(--ink)':'var(--ctl-off-bg)',
            border:'1px solid '+(on?'var(--ink)':'var(--ctl-off-brd)'),
            color:on?'var(--text-on-primary)':'var(--text-muted)',fontWeight:on?600:500,
            transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease)'}}>{o}</span>
        );
      })}
    </div>
  );
}

function Field({label,value,placeholder,hint,state='idle',multiline,trailing,style}){
  const ring = state==='focus' ? {borderColor:'var(--mm-bleu)',boxShadow:'var(--focus-ring)'}
            : state==='error' ? {borderColor:'var(--stop)',boxShadow:'var(--error-ring)'} : null;
  return (
    <label style={{display:'block',marginTop:'var(--sp-14)',...style}}>
      {label && <span style={{display:'block',fontSize:'12.5px',fontWeight:600,color:'var(--text-muted)',marginBottom:'var(--sp-6)'}}>{label}</span>}
      <span style={{
        display:'flex',alignItems:multiline?'flex-start':'center',gap:'var(--sp-10)',
        minHeight:multiline?'96px':'54px',padding:multiline?'14px 16px 0':'0 16px',
        borderRadius:'var(--r-m)',background:'var(--field-bg)',
        border:'1.5px solid var(--border-field)',boxShadow:'var(--field-hl)',
        fontSize:'15px',lineHeight:multiline?1.5:'normal',color:'var(--text-body)',
        transition:'border-color var(--t-ui) var(--ease),box-shadow var(--t-ui) var(--ease)',...ring}}>
        <span style={{flex:1,color:value?'var(--text-body)':'var(--text-faint)'}}>{value || placeholder}</span>
        {trailing}
      </span>
      {hint && <span style={{display:'block',fontSize:'11.5px',color:state==='error'?'var(--stop)':'var(--text-faint)',marginTop:'var(--sp-6)'}}>{hint}</span>}
    </label>
  );
}

function Segmented({options=[],value,onChange,style}){
  return (
    <div style={{display:'flex',padding:'4px',borderRadius:'var(--r-pill)',background:'var(--surface-quiet)',gap:'4px',...style}}>
      {options.map((o,i)=>{
        const on = value===undefined ? i===0 : value===o;
        return (
          <span key={o} className={onChange?'mm-press-sm':undefined} onClick={onChange?()=>onChange(o):undefined} style={{
            flex:1,textAlign:'center',fontSize:'13px',fontWeight:600,padding:'9px 0',borderRadius:'var(--r-pill)',
            cursor:onChange?'pointer':'default',
            color:on?'var(--ink)':'var(--text-muted)',background:on?'var(--seg-on-bg)':'transparent',
            boxShadow:on?'var(--seg-on-sh)':'none',
            transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease),box-shadow var(--t-ui) var(--ease)'}}>{o}</span>
        );
      })}
    </div>
  );
}


/* ───────────  DATA  ─────────── */

function Avatar({initials='',size=42,background='linear-gradient(135deg,var(--mm-violet),var(--mm-bleu))',style}){
  return <span style={{width:size+'px',height:size+'px',borderRadius:'50%',background,display:'grid',placeItems:'center',
    color:'#fff',fontWeight:700,fontSize:Math.round(size/3)+'px',fontFamily:'var(--f-display)',
    border:'1.5px solid rgba(255,255,255,.6)',flex:'0 0 auto',...style}}>{initials}</span>;
}

function ChatBubble({from='ai',typing,children,style}){
  const me = from==='me';
  const base = {maxWidth:'82%',padding:'13px 16px',borderRadius:'20px',fontSize:'14px',lineHeight:1.45};
  if (typing) return (
    <div style={{...base,background:'var(--bubble-bg)',border:'1px solid var(--bubble-brd)',
      borderBottomLeftRadius:'7px',width:'64px',padding:'14px 16px',...style}}>
      <span style={{display:'inline-flex',gap:'4px',alignItems:'center'}}>
        {[0,.18,.36].map(d=>(<i key={d} style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--mm-violet)',opacity:.35,animation:'blink 1.25s infinite',animationDelay:d+'s'}} />))}
      </span>
    </div>
  );
  return (
    <div style={{...base,
      ...(me?{marginLeft:'auto',background:'var(--action-transforme)',color:'#fff',borderBottomRightRadius:'7px',boxShadow:'0 6px 18px rgba(108,35,221,.28)'}
            /* Aucun flou : une bulle est répétée ET dans un fil qui défile — elle viole les
               deux volets de la règle 1 à elle seule. */
            :{background:'var(--bubble-bg)',border:'1px solid var(--bubble-brd)',borderBottomLeftRadius:'7px'}),...style}}>{children}</div>
  );
}

const mmCheckTone = {
  violet:{bg:'rgba(108,35,221,.15)',stroke:'var(--mm-violet-t)'},
  ok:{bg:'rgba(15,123,82,.15)',stroke:'var(--ok)'},
  neutre:{bg:'var(--fill-2)',stroke:'var(--ink-2)'}
};

function CheckLine({tone='violet',dash,size=12,children,style}){
  const t = mmCheckTone[tone] || mmCheckTone.violet;
  return (
    <div style={{display:'flex',gap:'11px',alignItems:'flex-start',marginTop:'10px',fontSize:'14.5px',lineHeight:1.5,...style}}>
      <span style={{width:'22px',height:'22px',borderRadius:'50%',flex:'0 0 auto',marginTop:'1px',background:t.bg,display:'grid',placeItems:'center'}}>
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={t.stroke} strokeWidth={dash?3:3.4} strokeLinecap="round" strokeLinejoin="round">
          {dash ? <path d="M6 12h12" /> : <path d="M4 12.5l5.5 5.5L20 7" />}
        </svg>
      </span>
      <span>{children}</span>
    </div>
  );
}

function DocLine({label,value,last,style}){
  return (
    <div style={{display:'flex',justifyContent:'space-between',gap:'12px',fontSize:'13.5px',padding:'8px 0',
      borderBottom:last?0:'1px dashed var(--fill-3)',...style}}>
      <span style={{color:'var(--text-muted)'}}>{label}</span>
      <b style={{fontFamily:'var(--f-mono)',fontWeight:700}}>{value}</b>
    </div>
  );
}

const mmCheck = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F7B52" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12.5l5.5 5.5L20 7"/></svg>
);

function LessonRow({state='todo',icon,iconBackground,title,meta,trailing,last,onClick,style}){
  const current = state==='current';
  let left = null;
  if (icon!==undefined) {
    left = <span style={{width:'34px',height:'34px',borderRadius:'11px',display:'grid',placeItems:'center',flex:'0 0 auto',background:iconBackground||'var(--fill-1)'}}>{icon}</span>;
  } else if (state==='done') {
    left = <span style={{width:'25px',height:'25px',borderRadius:'50%',background:'rgba(15,123,82,.16)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>{mmCheck}</span>;
  } else if (state==='todo') {
    left = <span style={{width:'26px',height:'26px',borderRadius:'50%',border:'2.5px solid var(--fill-3)',flex:'0 0 auto'}} />;
  }
  return (
    <div className={onClick?'mm-press':undefined} onClick={onClick} style={{display:'flex',alignItems:'center',gap:'12px',padding:current?'13px 18px':'13px 0',cursor:onClick?'pointer':undefined,
      borderBottom:last?0:'1px solid var(--border-hair)',
      ...(current?{background:'linear-gradient(135deg,rgba(0,87,188,.1),rgba(108,35,221,.1))',margin:'0 -18px',borderRadius:'14px',borderBottom:0}:null),...style}}>
      {left}
      <span style={{flex:1,minWidth:0}}>
        <b style={{display:'block',fontSize:'14px',fontWeight:600,letterSpacing:'-.01em',color:'var(--text-body)'}}>{title}</b>
        {meta && <span style={{fontSize:'12px',color:'var(--text-faint)',fontFamily:'var(--f-mono)'}}>{meta}</span>}
      </span>
      {trailing}
    </div>
  );
}

function PriceBlock({amount,currency='FCFA',strike,note,size=31,style}){
  return (
    <div style={style}>
      <div style={{display:'flex',alignItems:'baseline',gap:'8px'}}>
        <b style={{fontFamily:'var(--f-mono)',fontWeight:700,fontSize:size+'px',letterSpacing:'-.04em'}}>{amount}</b>
        <span style={{fontSize:'14px',fontWeight:600}}>{currency}</span>
        {strike && <s style={{fontFamily:'var(--f-mono)',fontSize:'14px',color:'rgba(14,17,22,.42)'}}>{strike}</s>}
      </div>
      {note && <p style={{fontSize:'12.5px',color:'var(--text-muted)',marginTop:'4px'}}>{note}</p>}
    </div>
  );
}

function ProgressBar({value=0,height=8,style}){
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

function QuotaMeter({used=0,total=5,label,style}){
  return (
    <div style={{display:'flex',alignItems:'center',gap:'9px',fontSize:'11.5px',color:'var(--text-muted)',fontFamily:'var(--f-mono)',...style}}>
      <span style={{display:'flex',gap:'3px'}}>
        {Array.from({length:total}).map((_,i)=>(
          <i key={i} style={{width:'15px',height:'5px',borderRadius:'3px',
            background:i<used?'var(--mm-violet)':'var(--fill-3)',transition:'background var(--t-ui) var(--ease)'}} />
        ))}
      </span>
      <span>{label || used+' / '+total+" aujourd'hui"}</span>
    </div>
  );
}

function StatTile({label,value,foot,dark,style}){
  return (
    <div className={dark?'glass-d':'glass'} style={{padding:'16px',...style}}>
      <p style={{fontSize:'11px',color:dark?'#8B95A3':'var(--text-muted)',margin:0}}>{label}</p>
      <p style={{fontFamily:'var(--f-mono)',fontWeight:700,fontVariantNumeric:'tabular-nums',fontSize:'27px',letterSpacing:'var(--ls-num)',margin:'3px 0 0'}}>{value}</p>
      {foot && <p style={{fontSize:'11px',color:dark?'#7C8896':'var(--text-faint)',margin:0}}>{foot}</p>}
    </div>
  );
}

const mmTagTone = {
  ok:{background:'rgba(15,123,82,.13)',color:'var(--ok)'},
  warn:{background:'rgba(243,139,10,.18)',color:'var(--warn)'},
  stop:{background:'rgba(180,35,31,.13)',color:'var(--stop)'},
  neutral:{background:'var(--fill-tag)',color:'var(--text-muted)'}
};

function Tag({tone='neutral',children,style}){
  return <span style={{display:'inline-flex',alignItems:'center',gap:'5px',height:'27px',padding:'0 11px',
    borderRadius:'var(--r-pill)',fontSize:'11px',fontWeight:600,
    transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease)',
    ...(mmTagTone[tone]||mmTagTone.neutral),...style}}>{children}</span>;
}


/* ───────────  NAVIGATION  ─────────── */

function Pipeline({stages=[],active,onSelect,style}){
  return (
    <div style={{display:'flex',gap:'5px',overflow:'hidden',...style}}>
      {stages.map(s=>{
        const on = s===active;
        return <span key={s} onClick={onSelect?()=>onSelect(s):undefined} style={{fontSize:'11px',fontWeight:600,padding:'5px 10px',
          borderRadius:'var(--r-pill)',whiteSpace:'nowrap',cursor:onSelect?'pointer':'default',
          background:on?'#fff':'rgba(255,255,255,.08)',color:on?'#0E1116':'#8B95A3'}}>{s}</span>;
      })}
    </div>
  );
}

function SideNav({brand,items=[],active,onSelect,footer,style}){
  return (
    <div className="glass" style={{borderRadius:0,border:0,borderRight:'1px solid var(--nav-brd)',boxShadow:'none',
      padding:'22px 18px',position:'relative',zIndex:3,...style}}>
      {brand && <div style={{margin:'2px 0 22px 12px'}}>{brand}</div>}
      {items.map(it=>{
        const on = it.label===active;
        return (
          <a key={it.label} onClick={onSelect?()=>onSelect(it.label):undefined} style={{display:'flex',alignItems:'center',gap:'10px',
            padding:'11px 13px',borderRadius:'14px',fontSize:'13.5px',fontWeight:600,textDecoration:'none',marginBottom:'3px',
            cursor:onSelect?'pointer':'default',
            color:on?'var(--text-body)':'var(--text-muted)',
            background:on?'var(--nav-on-bg)':'transparent',boxShadow:on?'var(--nav-on-sh)':'none'}}>
            <u style={{width:'8px',height:'8px',borderRadius:'3px',display:'block',background:it.color||'var(--fill-5)'}} />
            {it.label}
          </a>
        );
      })}
      {footer && <div style={{marginTop:'22px'}}>{footer}</div>}
    </div>
  );
}

const mmTerritoryInk = {forme:'var(--mm-bleu)',informe:'var(--mm-orange)',transforme:'var(--mm-violet)',digitalise:'var(--mm-teal)'};

function TopBar({brand,items=[],active,onSelect,trailing,style}){
  return (
    <div className="glass" style={{display:'flex',alignItems:'center',gap:'24px',padding:'14px 22px',
      position:'relative',zIndex:4,margin:'16px 22px',borderRadius:'var(--r-pill)',...style}}>
      {brand}
      {items.map(it=>(
        <a key={it.label} onClick={onSelect?()=>onSelect(it.label):undefined} style={{fontSize:'13.5px',fontWeight:600,
          color:'var(--text-body)',textDecoration:'none',paddingBottom:'3px',cursor:onSelect?'pointer':'default',
          borderBottom:'2px solid '+(it.territory?mmTerritoryInk[it.territory]:(it.label===active?'var(--ink)':'transparent')),
          transition:'border-color var(--t-ui) var(--ease)'}}>{it.label}</a>
      ))}
      {trailing && <span style={{marginLeft:'auto',display:'flex',gap:'12px',alignItems:'center'}}>{trailing}</span>}
    </div>
  );
}


window.DS = {Icon, LogoMark, Wordmark, GlassPanel, Mesh, TerritoryCard, Button, IconButton, PillButton, ChipRow, Field, Segmented, Avatar, ChatBubble, CheckLine, DocLine, LessonRow, PriceBlock, ProgressBar, QuotaMeter, StatTile, Tag, Pipeline, SideNav, TopBar};

/* Frontière d'erreur : un écran qui casse affiche pourquoi au lieu de vider la page. */
window.MMBoundary = class MMBoundary extends React.Component {
  constructor(p){ super(p); this.state = {err:null}; }
  static getDerivedStateFromError(err){ return {err:err}; }
  componentDidCatch(err){ console.error('[MMBoundary]', err && err.message); }
  render(){
    if (!this.state.err) return this.props.children;
    return React.createElement('div',{style:{padding:'18px',fontFamily:'var(--f-mono)',fontSize:'12px',
      color:'var(--stop)',background:'#FFF4F3'}}, String(this.state.err.message || this.state.err));
  }
};
