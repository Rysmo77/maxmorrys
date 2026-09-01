import React from 'react';

export function ChatBubble({from='ai',typing,children,style}){
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
