import React from 'react';

const mmLayout = {
  stack:{chevron:true,overlap:true,  pad:'24px 20px 36px'},
  grid: {chevron:true,overlap:false, pad:'24px 20px 28px'},
  row:  {chevron:true,overlap:false, pad:'26px 20px 30px'},
  plain:{chevron:false,overlap:false,pad:'20px'}
};

export function TerritoryCard({territory='forme',meta,title,titleSize,big,bigLabel,trailing,padding,layout,stacked=true,first,children,style}){
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
