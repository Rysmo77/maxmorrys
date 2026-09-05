import React from 'react';

export function Field({label,value,placeholder,hint,state='idle',multiline,trailing,style}){
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
