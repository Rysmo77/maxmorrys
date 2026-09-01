/* Coque de planche : colonnes d'appareils, légendes, rejeu des scènes (Espace ou Entrée).
   Les composants sont désignés par NOM et résolus au moment du rendu : Babel Standalone
   charge les fichiers text/babel[src] de façon asynchrone, donc un identifiant capturé à
   l'appel peut encore valoir undefined. */
window.renderBoard = function(items){
  const noms = items.map(it=>it.comp).filter(c=>typeof c==='string');
  const reg = ()=>window.MMAPP||{};
  // Les fichiers de kit signent leur exécution dans window.MMSIGN. On attend la QUIESCENCE :
  // trois images sans nouvelle signature. Se contenter d'un nom résolvable ferait monter la
  // copie bundlée, périmée, du même nom — Babel n'ordonne pas les text/babel[src].
  const signes = ()=>(window.MMSIGN||[]).length;
  let dernier = -1, stable = 0;
  const pret = function(){
    const s = signes();
    if (s === dernier) stable++; else { stable = 0; dernier = s; }
    return stable >= 3 && s > 0 && noms.every(n=>typeof reg()[n]==='function');
  };

  function monte(){
    const h = React.createElement;
    function Board(){
      const [k,setK] = React.useState(0);
      React.useEffect(()=>{
        const f = (e)=>{ if (e.key===' '||e.key==='Enter'){ e.preventDefault(); setK(v=>v+1); } };
        window.addEventListener('keydown',f);
        return ()=>window.removeEventListener('keydown',f);
      },[]);
      return h(React.Fragment,null,items.map((it,i)=>{
        const haut = it.h || 844;
        const C = typeof it.comp==='string' ? reg()[it.comp] : it.comp;
        return h('div',{className:'col',key:i},
          h('p',{className:'cap'},it.n,h('b',null,it.titre)),
          h('div',{className:'dev',style:{height:haut+'px'}}, h(window.MMBoundary||React.Fragment,{key:'b'+k}, C ? h(C,{key:k,go:function(){}}) : null)),
          h('p',{className:'cap',style:{marginTop:'9px'}},'390 × '+haut,it.note?' · ':'',it.note?h('i',null,it.note):null)
        );
      }));
    }
    const racine = ReactDOM.createRoot(document.getElementById('root'));
    racine.render(h(Board));
    window.mmRerender = function(){ racine.render(h(Board,{cle:Date.now()})); };
  }

  let essais = 0;
  (function attend(){
    if (pret() || essais++ > 60) return monte();
    // setTimeout, pas requestAnimationFrame : hors peinture (iframe caché, capture de
    // vignette) rAF ne se déclenche jamais et la planche resterait vide indéfiniment.
    setTimeout(attend, 16);
  })();
};
