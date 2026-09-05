/* Garde partagée par les kits et les fiches. Trois rôles, dans cet ordre d'importance :
   1. DS — un proxy de composants résolus AU RENDU, pour qu'un bundle en retard d'un tour
      laisse un trou dans l'écran au lieu de démonter la racine ;
   2. MMBoundary — une frontière d'erreur, pour que ce qui casse quand même reste lisible ;
   3. une réparation ASYNCHRONE du bundle périmé (jamais synchrone : un XHR bloquant
      pendant l'analyse du document fait échouer le chargement de la page entière). */

/* 0 · FORCER L'INITIALISATION DU BUNDLE MAINTENANT.
   guard.js est chargé juste après la balise du bundle, avant tout fichier text/babel de la page.
   Le bundle initialise ses modules paresseusement, au premier accès au namespace : sans ce
   contact immédiat, ses copies des fichiers de kit s'exécutaient APRÈS celles de la page et
   republiaient leurs écrans par-dessus — thème perdu, page desktop montée dans un cadre de
   390 px. En le réveillant ici, l'ordre est garanti : le bundle d'abord, la page ensuite,
   et la page gagne toujours. */
try { Object.keys(window.DesignSystem_b7a7ca || {}); } catch(e){}

/* 1 · Proxy de résolution tardive.
   Les fichiers de kit écrivent `const { X } = window.DS` : ils capturent une enveloppe
   stable, qui va chercher le vrai composant à chaque rendu. */
window.DS = new Proxy({}, {
  get: function(cache, nom){
    if (typeof nom !== 'string') return undefined;
    if (!cache[nom]){
      const enveloppe = function(props){
        const C = (window.DesignSystem_b7a7ca || {})[nom];
        return C ? React.createElement(C, props) : null;
      };
      Object.defineProperty(enveloppe, 'name', {value: nom});
      cache[nom] = enveloppe;
    }
    return cache[nom];
  }
});

/* 2 · Frontière d'erreur. */
window.MMBoundary = class MMBoundary extends React.Component {
  constructor(p){ super(p); this.state = {err:null}; }
  static getDerivedStateFromError(err){ return {err:err}; }
  componentDidCatch(err){ if (window.console) console.error('[MMBoundary]', err && err.message); }
  render(){
    if (!this.state.err) return this.props.children;
    const manquants = window.mmManquants ? window.mmManquants() : [];
    return React.createElement('div',{style:{padding:'18px',fontFamily:'var(--f-mono)',fontSize:'11.5px',lineHeight:1.6,color:'#B4231F',background:'#FFF4F3',height:'100%',overflow:'auto'}},
      React.createElement('b',{style:{display:'block',fontFamily:'var(--f-body)',fontSize:'13px',marginBottom:'8px'}},"Cet écran ne s'est pas monté."),
      String((this.state.err && this.state.err.message) || this.state.err),
      manquants.length ? React.createElement('p',{style:{marginTop:'10px'}},'Absents du bundle : '+manquants.join(', ')) : null,
      React.createElement('p',{style:{marginTop:'10px',color:'#8A4B00'}},"Recharge la page : le bundle vient peut-être d'être recompilé.")
    );
  }
};

/* Composants attendus par les kits et absents du namespace. */
window.mmManquants = function(){
  const ns = window.DesignSystem_b7a7ca || {};
  return ['Button','IconButton','PillButton','Icon','Wordmark','LogoMark','Avatar','ChatBubble','CheckLine','DocLine',
    'LessonRow','PriceBlock','ProgressBar','QuotaMeter','StatTile','Tag','MediaCard','Field','Switch','Segmented','ChipRow',
    'PayOption','StepDots','Mesh','GlassPanel','TerritoryCard','Skeleton','EmptyState','TabBar','TopBar','SideNav','SubNav',
    'SearchPill','Breadcrumb','Pipeline','ReadingBar'].filter(n=>typeof ns[n] !== 'function');
};

/* Empreintes : un export peut être présent mais compilé avant le dernier correctif.
   Chaque entrée est un fragment qui DOIT apparaître dans la source du composant.
   Une empreinte manquante = bundle en retard d'un tour → on redemande la source. */
window.mmPerimes = function(){
  const ns = window.DesignSystem_b7a7ca || {};
  const empreintes = {TerritoryCard:'--card-ink', Button:'--text-on-primary', IconButton:'--text-body'};
  return Object.keys(empreintes).filter(function(n){
    return typeof ns[n] === 'function' && String(ns[n]).indexOf(empreintes[n]) === -1;
  });
};

/* 3 · Réparation asynchrone d'un bundle incomplet ou périmé — EN PORTÉE ISOLÉE.
   Le serveur refuse toute chaîne de requête sur les assets (?t= renvoie 404) : on ne peut pas
   casser le cache par l'URL, donc on redemande la source en revalidation forcée.

   MAIS LE BUNDLE NE DOIT JAMAIS ÊTRE RÉÉVALUÉ SUR LE VRAI `window`. Le compilateur y inclut
   aussi les fichiers de kit (AppShell.js, proto.js, Pages.js, SiteShell.js), qui publient leurs
   aides par `Object.assign(window, …)`. Les réexécuter APRÈS les scripts text/babel de la page
   remplace `window.Screen` et `window.AppBar` par les copies bundlées — un thème qui ne
   s'applique plus, un drapeau qui éteint le maillage, la barre du site desktop montée dans des
   cadres de 390 px. Le remède est pire que le mal.

   On évalue donc la source avec un `window` FANTÔME : les lectures traversent vers le vrai
   objet, les écritures restent dans le fantôme. On n'en récupère ensuite que les composants
   visés, greffés sur le namespace — rien d'autre ne bouge. */
window.addEventListener('load', function(){
  // La péremption ne déclenche RIEN. Réévaluer le bundle pour rafraîchir un composant déjà
  // présent revient à réexécuter les copies bundlées des fichiers de kit, qui republient
  // leurs écrans par-dessus ceux de la page — thème perdu, page desktop montée dans un cadre
  // de 390 px. Un composant d'un tour de retard est un défaut cosmétique ; ça, c'est un écran
  // faux. On se contente donc de le dire.
  const perimes = window.mmPerimes();
  if (perimes.length) console.info('[guard] bundle en retard d\'un tour sur : '+perimes.join(', ')+" — recharge la page après recompilation.");
  const manque = window.mmManquants();
  if (!manque.length) return;
  const balise = [].slice.call(document.scripts).filter(function(s){ return /_ds_bundle\.js/.test(s.src); })[0];
  if (!balise || !window.fetch) return;
  fetch(balise.src, {cache:'reload'}).then(function(r){ return r.ok ? r.text() : null; }).then(function(src){
    if (!src) return;
    const fantome = Object.create(window);          // lectures héritées, écritures piégées
    // Les registres doivent être PRÉ-MASQUÉS. Sans ça, `Object.assign(window.MMKIT||{}, …)`
    // lit le vrai registre à travers la chaîne de prototypes et le MUTE sur place : les écrans
    // bundlés, périmés, écrasent alors ceux de la page. C'est la fuite qui montait la page
    // desktop dans un cadre de 390 px.
    ['MMKIT','MMSITE','DesignSystem_b7a7ca'].forEach(function(k){ fantome[k] = {}; });
    fantome.MMSIGN = [];
    (new Function('window','globalThis','self', src))(fantome, fantome, fantome);
    const neuf = Object.getOwnPropertyDescriptor(fantome,'DesignSystem_b7a7ca');
    if (!neuf || !neuf.value) { console.warn('[guard] la source rechargée n\'expose pas le namespace'); return; }
    const ns = window.DesignSystem_b7a7ca = window.DesignSystem_b7a7ca || {};
    manque.forEach(function(nom){ if (neuf.value[nom]) ns[nom] = neuf.value[nom]; });
    const reste = window.mmManquants();
    console.info('[guard] composants regreffés en portée isolée — avant : '+manque.length+', après : '+reste.length);
    if (reste.length === manque.length) return;     // rien n'a bougé : ne pas rendre pour rien
    if (typeof window.mmRerender === 'function') window.mmRerender();
  }).catch(function(e){ console.warn('[guard] rechargement impossible :', e && e.message); });
});
