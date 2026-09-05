import React from 'react';

export function Switch({on,disabled,onClick,style}){
  return (
    <span role="switch" aria-checked={!!on} aria-disabled={disabled||undefined} onClick={disabled?undefined:onClick} style={{
      width:'48px',height:'29px',borderRadius:'16px',position:'relative',flex:'0 0 auto',cursor:disabled?'default':'pointer',
      background:on?'var(--action-forme)':'var(--fill-4)',opacity:disabled?.4:1,
      transition:'background var(--t-ui) var(--ease),opacity var(--t-ui) var(--ease)',...style}}>
      <b style={{position:'absolute',left:'3px',top:'3px',width:'23px',height:'23px',borderRadius:'50%',background:'#fff',
        boxShadow:'0 2px 6px rgba(14,17,22,.24)',transform:on?'translateX(19px)':'none',
        transition:'transform var(--t-ui) var(--ease)'}} />
    </span>
  );
}
