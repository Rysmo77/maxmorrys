/* Coque de planche : colonnes d'appareils de 390 px, légendes, rejeu des scènes d'entrée
   (Espace ou Entrée). Ce n'est PAS du code de production — c'est le support qui permet de
   voir plusieurs écrans côte à côte.

   La version d'origine attendait la « quiescence » d'un registre global, pour contourner le
   fait que le compilateur du projet de design bundlait aussi les modules d'écran et créait
   des doublons de nom. Hors de ce projet, ce problème n'existe pas : Babel Standalone charge
   les fichiers text/babel[src] de façon asynchrone, il suffit donc d'attendre que les noms
   attendus soient résolvables. */
window.renderBoard = function(items){
  const h = React.createElement;
  const reg = function(){ return window.MMAPP || {}; };
  const noms = items.map(function(it){ return it.comp; }).filter(function(c){ return typeof c === 'string'; });
  const pret = function(){ return noms.every(function(n){ return typeof reg()[n] === 'function'; }); };

  function monte(){
    function Board(){
      const [k,setK] = React.useState(0);
      React.useEffect(function(){
        const f = function(e){ if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); setK(function(v){ return v+1; }); } };
        window.addEventListener('keydown', f);
        return function(){ window.removeEventListener('keydown', f); };
      },[]);
      return h(React.Fragment, null, items.map(function(it,i){
        const haut = it.h || 844;
        const C = typeof it.comp === 'string' ? reg()[it.comp] : it.comp;
        return h('div',{className:'col',key:i},
          h('p',{className:'cap'}, it.n, h('b',null,it.titre)),
          h('div',{className:'dev',style:{height:haut+'px'}}, C ? h(C,{key:k,go:function(){}}) : null),
          h('p',{className:'cap',style:{marginTop:'9px'}}, '390 × '+haut, it.note ? ' · ' : '', it.note ? h('i',null,it.note) : null)
        );
      }));
    }
    const racine = ReactDOM.createRoot(document.getElementById('root'));
    racine.render(h(Board));
  }

  let essais = 0;
  (function attend(){
    if (pret() || essais++ > 60) return monte();
    // setTimeout, pas requestAnimationFrame : hors peinture (iframe caché, capture
    // d'écran) rAF ne se déclenche jamais et la planche resterait vide.
    setTimeout(attend, 16);
  })();
};
