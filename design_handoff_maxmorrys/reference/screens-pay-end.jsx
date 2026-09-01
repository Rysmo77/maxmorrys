const { GlassPanel, Button, Tag, Icon, PriceBlock } = window.DS;

/** Bloc central des écrans d'issue de paiement : glyphe, titre, texte, carte d'état, sorties. */
function IssueBloc({glyph,glyphBg,glyphColor,pulse,titre,texte,statut,statutTon,reference,actions,pied}){
  return (
    <div style={{minHeight:'100%',display:'flex',flexDirection:'column',justifyContent:'center',paddingBottom:'60px'}}>
      <div className={(pulse?'pulse ':'')+'rv-s'} style={{width:'70px',height:'70px',borderRadius:'22px',background:glyphBg,
        display:'grid',placeItems:'center',color:glyphColor,boxShadow:'0 12px 32px '+glyphColor.replace('rgb','rgba').replace(')',',.4)')}}>
        {glyph}
      </div>
      <Display lines={titre} style={{marginTop:'24px'}} />
      <Lede style={{'--i':4,marginTop:'12px'}}>{texte}</Lede>
      <GlassPanel level="flat" padding={17} className="rv" style={{'--i':5,marginTop:'22px'}}>
        <RowBetween><span style={{fontSize:'13px',color:'var(--text-muted)'}}>Référence</span><b className="mm-num" style={{fontSize:'13px'}}>{reference}</b></RowBetween>
        <RowBetween style={{marginTop:'10px'}}><span style={{fontSize:'13px',color:'var(--text-muted)'}}>Statut</span><Tag tone={statutTon}>{statut}</Tag></RowBetween>
      </GlassPanel>
      {actions}
      <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',marginTop:'14px'}}>{pied}</p>
    </div>
  );
}

function Echec({go}){
  return (
    <Screen territory="forme">
      <IssueBloc
        glyph={<Icon name="alert" size={30} color="#fff" strokeWidth={2.4} />}
        glyphBg="linear-gradient(135deg,#E4564F,#B4231F)" glyphColor="rgb(180,35,31)"
        titre={[<>Le paiement<br />n'est pas passé.</>]}
        texte={<>Wave a refusé la transaction — <b style={{color:'var(--ink)'}}>solde insuffisant</b>, d'après le motif renvoyé. <b style={{color:'var(--ink)'}}>Rien n'a été débité.</b></>}
        reference="MM-2K6-4831" statut="Échouée" statutTon="stop"
        actions={<>
          <Button tone="forme" className="rv" style={{'--i':6,marginTop:'20px'}} onClick={()=>go&&go('paiement')}>Réessayer avec Orange Money</Button>
          <Button tone="quiet" fullWidth className="rv" style={{'--i':7,marginTop:'10px'}} onClick={()=>go&&go('fiche')}>Revenir à la formation</Button>
        </>}
        pied="Ta commande reste ouverte 24 h. Tu peux reprendre où tu en étais." />
    </Screen>
  );
}

function Succes({go}){
  return (
    <Screen territory="forme">
      <IssueBloc
        glyph={<Icon name="check" size={30} color="#fff" strokeWidth={3.4} />}
        glyphBg="linear-gradient(135deg,#02AC9C,#0057BC)" glyphColor="rgb(2,172,156)"
        titre={[<>C'est à toi.</>]}
        texte={<>Ta formation est ouverte. Le premier module fait <b className="mm-num" style={{color:'var(--ink)'}}>22 minutes</b>.</>}
        reference="MM-2K6-4831" statut="Payée" statutTon="ok"
        actions={<>
          <Button tone="digitalise" className="rv" style={{'--i':6,marginTop:'20px'}} onClick={()=>go&&go('lecteur')}>Ouvrir la première leçon</Button>
          <Button tone="quiet" fullWidth className="rv" style={{'--i':7,marginTop:'10px'}} onClick={()=>go&&go('espace')}>Voir mes paiements</Button>
        </>}
        pied="80 750 FCFA débités une fois, accès à vie. Le reçu est dans ton espace." />
    </Screen>
  );
}

const MM_EXPORT = {IssueBloc,Echec,Succes};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
