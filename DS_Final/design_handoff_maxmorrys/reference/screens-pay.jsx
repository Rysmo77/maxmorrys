const { GlassPanel, Button, PayOption, StepDots, Tag, Icon, Wordmark, IconButton } = window.DS;

function Paiement({go}){
  const [moyen,setMoyen] = React.useState('Wave');
  return (
    <Screen territory="forme" bar={<AppBar left={<BackButton onClick={()=>go('fiche')} />} center={<span style={{fontSize:'13px',fontWeight:600,color:'var(--text-muted)'}}>Étape 2 sur 3</span>} />}>
      <StepDots total={3} current={2} style={{marginBottom:'20px'}} />
      <Display lines={['Comment tu paies ?']} />
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':2,marginTop:'16px'}}>
        <RowBetween><span style={{fontSize:'13.5px',color:'var(--text-muted)'}}>Référencement local</span><span className="mm-num" style={{fontSize:'15px'}}>95 000</span></RowBetween>
        <RowBetween style={{marginTop:'8px'}}><span style={{fontSize:'13.5px',color:'var(--text-muted)'}}>Parrainage <b className="mm-num" style={{fontSize:'12px'}}>AISSA15</b></span><span className="mm-num" style={{fontSize:'15px',color:'var(--ok)'}}>−14 250</span></RowBetween>
        <div style={{height:'1px',background:'rgba(14,17,22,.1)',margin:'13px 0'}} />
        <RowBetween><b style={{fontSize:'15px'}}>Total</b><b className="mm-num" style={{fontSize:'23px'}}>80 750 F</b></RowBetween>
        <p style={{fontSize:'11px',color:'var(--text-faint)',margin:'6px 0 0'}}>Montant calculé et débité côté serveur.</p>
      </GlassPanel>
      <div style={{display:'grid',gap:'10px',marginTop:'18px'}}>
        <div className="rv" style={{'--i':3}}><PayOption on={moyen==='Wave'} onClick={()=>setMoyen('Wave')} logo="W" logoBackground="linear-gradient(135deg,#3FD8FF,#009FE3)" title="Wave" note="Tu valides dans l'app Wave" /></div>
        <div className="rv" style={{'--i':4}}><PayOption on={moyen==='OM'} onClick={()=>setMoyen('OM')} logo="OM" logoBackground="linear-gradient(135deg,#FFA030,#FF5A00)" title="Orange Money" note="Code de confirmation par SMS" /></div>
        <div className="rv" style={{'--i':5}}><PayOption on={moyen==='Carte'} onClick={()=>setMoyen('Carte')} logo={<Icon name="card" size={20} color="#fff" />} logoBackground="linear-gradient(135deg,#3A4450,#0E1116)" title="Carte bancaire" note="Visa, Mastercard" /></div>
      </div>
      <Button tone="forme" className="rv" style={{'--i':6,marginTop:'20px'}} onClick={()=>go('attente')}>Payer <span className="mm-num">80 750</span> FCFA</Button>
      <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',marginTop:'10px'}}>Tu quittes le site pour valider, puis tu reviens ici.</p>
    </Screen>
  );
}

function Attente({go}){
  return (
    <Screen territory="forme">
      <div style={{minHeight:'100%',display:'flex',flexDirection:'column',justifyContent:'center',paddingBottom:'60px'}}>
        <div className="pulse rv-s" style={{width:'70px',height:'70px',borderRadius:'22px',background:'linear-gradient(135deg,#3FD8FF,#009FE3)',display:'grid',placeItems:'center',color:'#009FE3',boxShadow:'0 12px 32px rgba(0,159,227,.4)'}}>
          <span style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'28px',color:'#fff'}}>W</span>
        </div>
        <Display lines={[<>Ton paiement Wave<br/>est en cours.</>]} style={{marginTop:'24px'}} />
        <Lede style={{'--i':4,marginTop:'12px'}}>Ouvre Wave, valide les <b className="mm-num">80 750 FCFA</b>, puis reviens. Cette page se met à jour toute seule — tu peux aussi fermer et revenir plus tard, ta commande reste ouverte.</Lede>
        <GlassPanel level="flat" padding={17} className="rv" style={{'--i':5,marginTop:'22px'}}>
          <RowBetween><span style={{fontSize:'13px',color:'var(--text-muted)'}}>Référence</span><b className="mm-num" style={{fontSize:'13px'}}>MM-2K6-4831</b></RowBetween>
          <RowBetween style={{marginTop:'10px'}}><span style={{fontSize:'13px',color:'var(--text-muted)'}}>Statut</span><Tag tone="warn">En attente</Tag></RowBetween>
        </GlassPanel>
        <Button tone="forme" className="rv" style={{'--i':6,marginTop:'20px'}} onClick={()=>go('succes')}>J'ai payé, vérifie</Button>
        <Button tone="quiet" fullWidth className="rv" style={{'--i':7,marginTop:'10px'}} onClick={()=>go('paiement')}>Changer de moyen de paiement</Button>
        <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',marginTop:'14px'}}>Rien n'est débité deux fois : chaque paiement porte une référence unique.</p>
      </div>
    </Screen>
  );
}

function Certificat({go}){
  return (
    <Screen territory="forme" bar={<AppBar left={<BackButton onClick={()=>go('espace')} />} />}>
      <Eyebrow style={{marginTop:'8px'}}>Émis le 12 septembre 2026</Eyebrow>
      <Display size="sm" lines={["C'EST FAIT,",'AÏSSATOU.']} style={{marginTop:'6px'}} />
      <GlassPanel level="hero" padding={24} className="sheen rv-s" style={{'--i':4,marginTop:'20px'}}>
        <RowBetween style={{alignItems:'flex-start'}}><Wordmark size={31} short /><Tag tone="ok">Vérifié</Tag></RowBetween>
        <Eyebrow style={{marginTop:'22px'}}>Certificat de fin de formation</Eyebrow>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'24px',letterSpacing:'-.035em',lineHeight:1.05,margin:'6px 0 0'}}>Référencement local pour ton commerce</p>
        <p style={{fontSize:'14px',color:'var(--text-muted)',margin:'11px 0 0'}}>Délivré à <b style={{color:'var(--ink)'}}>Aïssatou Ndiaye</b></p>
        <div style={{height:'1px',background:'rgba(14,17,22,.12)',margin:'19px 0'}} />
        <Eyebrow>Code de vérification</Eyebrow>
        <p className="mm-num" style={{fontSize:'19px',letterSpacing:'.06em',margin:'4px 0 0'}}>MM-C7K4-9RTX-2081</p>
        <p style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'9px 0 0'}}>Vérifiable par n'importe qui, sans compte, sans que ton nom apparaisse dans une liste.</p>
      </GlassPanel>
      <Button tone="forme" className="rv" style={{'--i':6,marginTop:'17px'}}>Partager sur LinkedIn</Button>
      <Button tone="ghost" fullWidth className="rv" style={{'--i':7,marginTop:'10px'}}>Copier le lien de vérification</Button>
      <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi il vaut quelque chose</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Les <b className="mm-num">47</b> leçons ont été recomptées côté serveur au moment de l'émission. Ce n'est pas une image : c'est un enregistrement que ton futur employeur contrôle lui-même.</p>
      </GlassPanel>
    </Screen>
  );
}

const MM_EXPORT = {Paiement,Attente,Certificat};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
