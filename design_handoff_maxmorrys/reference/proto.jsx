/* Moteur de navigation du prototype : glissement pour les détails, retour inversé,
   fondu croisé pour les onglets, feuille montante pour le paiement, maillage persistant.

   ATTENTION : ne rien poser sur window au niveau du module. Ce fichier est bundlé, donc
   son corps s'exécute sur TOUTE page qui charge _ds_bundle.js — un drapeau posé ici
   éteindrait le maillage du produit entier. Le drapeau appartient à montProto(). */

const MM_ROUTES = {
  accueil:    {c:'Accueil',        t:'forme',      d:0, nom:'Accueil'},
  catalogue:  {c:'CataloguePlein', t:'forme',      d:1, nom:'Catalogue'},
  fiche:      {c:'Fiche',          t:'forme',      d:2, nom:'Fiche formation'},
  attente:    {c:'Attente',        t:'forme',      d:3, nom:'Attente de paiement'},
  succes:     {c:'Succes',         t:'forme',      d:4, nom:'Paiement accepté'},
  echec:      {c:'Echec',          t:'forme',      d:4, nom:'Paiement refusé'},
  espace:     {c:'Espace',         t:'transforme', d:5, nom:'Mon espace', tab:true},
  lecteur:    {c:'Lecteur',        t:'forme',      d:5, nom:'Lecteur', tab:true},
  rysmo:      {c:'Rysmo',          t:'transforme', d:5, nom:'Rysmo', tab:true},
  club:       {c:'Club',           t:'transforme', d:5, nom:'Club', tab:true},
  certificat: {c:'Certificat',     t:'forme',      d:6, nom:'Certificat'}
};

function MMProto(){
  const [cur,setCur]   = React.useState('accueil');
  const [sortant,setSortant] = React.useState(null);   // {route, mode}
  const [mode,setMode] = React.useState(null);
  const [feuille,setFeuille] = React.useState(false);
  const [meshSortant,setMeshSortant] = React.useState(null);
  const reg = window.MMAPP || {};

  const go = (next)=>{
    if (next === 'paiement'){ setFeuille(true); return; }
    if (!MM_ROUTES[next] || next === cur) return;
    const a = MM_ROUTES[cur], b = MM_ROUTES[next];
    const m = (a.tab && b.tab) ? 'fade' : (b.d >= a.d ? 'in' : 'back');
    if (a.t !== b.t) setMeshSortant(a.t);
    setSortant({route:cur, mode:m});
    setMode(m);
    setCur(next);
    if (feuille) setFeuille(false);
  };

  React.useEffect(()=>{
    if (!sortant) return;
    const t = setTimeout(()=>setSortant(null), mode === 'fade' ? 200 : 300);
    return ()=>clearTimeout(t);
  },[sortant,mode]);
  React.useEffect(()=>{
    if (!meshSortant) return;
    const t = setTimeout(()=>setMeshSortant(null), 520);
    return ()=>clearTimeout(t);
  },[meshSortant]);

  const Ecran = (route)=>{
    const C = reg[MM_ROUTES[route].c];
    const B = window.MMBoundary || React.Fragment;
    return React.createElement(B,{key:'b'+route}, C ? React.createElement(C,{go:go}) : null);
  };
  const Mesh = window.DS.Mesh;

  return (
    <div className="pv-frame">
      <div className="pv-mesh"><Mesh territory={MM_ROUTES[cur].t} /></div>
      {meshSortant && <div className="pv-mesh pv-mesh-out"><Mesh territory={meshSortant} /></div>}

      {sortant && <div key={'s'+sortant.route} className={'pv-layer pv-out-'+sortant.mode}>{Ecran(sortant.route)}</div>}
      <div key={cur} className={'pv-layer'+(mode?' pv-in-'+mode:'')}>{Ecran(cur)}</div>

      {feuille && <div className="pv-scrim" onClick={()=>setFeuille(false)} />}
      {feuille && (
        <div className="pv-sheet">
          <span className="pv-grip" />
          <div style={{height:'100%'}}>{React.createElement(reg.Paiement,{go:go})}</div>
        </div>
      )}

      <div className="pv-hud">
        <span className="pv-hud-nom">{MM_ROUTES[cur].nom}</span>
        <span className="pv-hud-t">{MM_ROUTES[cur].t}{feuille ? ' · feuille' : ''}</span>
      </div>
    </div>
  );
}

window.montProto = function(){
  document.documentElement.setAttribute('data-mm-proto','');   // maillage persistant, porté par la coque
  ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(MMProto));
};
