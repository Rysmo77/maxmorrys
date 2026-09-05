const { GlassPanel, Button, Field, DocLine, Tag, Icon, IconButton, PillButton } = window.DS;

const CORAIL = [{background:'#FF6E7F'}];
const BTN_CORAIL = {background:'linear-gradient(135deg,#FF6E7F,#6C23DD)',color:'#fff',boxShadow:'0 8px 24px rgba(255,110,127,.3)'};

/* ── 1 · PAGE AGENCE ── Aucun montant sur cette page. Aucune organisation tierce nommée. */
function Agence({go}){
  return (
    <Screen territory="digitalise" meshLobes={CORAIL}
      bar={<AppBar left={<PillButton>Menu</PillButton>} right={<IconButton label="Écrire"><Icon name="chat" size={18} strokeWidth={2} /></IconButton>} />}>
      <Eyebrow>Max-Morrys Agency</Eyebrow>
      <Display size="sm" lines={['DES PROJETS',"QU'ON MÈNE",'À DEUX.']} style={{marginTop:'6px'}} />
      <Lede style={{'--i':5,marginTop:'12px'}}>Refonte, plateforme, automatisation, IA. Peu de projets à la fois, cadrés avant d'être chiffrés. Si ça ne colle pas, je te le dis en une conversation plutôt qu'en trois devis.</Lede>

      <GlassPanel level="hero" padding={22} className="rv" style={{'--i':6,marginTop:'20px'}}>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.035em',margin:0}}>Parle-moi de ton projet</p>
        <Field label="Type de projet" value="Plateforme web" trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <Field label="Ta fourchette budgétaire" placeholder="Choisis une fourchette" state="focus" trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <Field label="Ton projet en trois lignes" placeholder="Ce que tu veux obtenir, et pour quand." multiline />
        <Button style={{marginTop:'17px',...BTN_CORAIL}}>Envoyer ma demande</Button>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>C'est moi qui lis, et c'est moi qui réponds.</p>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi il n'y a pas de tarifs sur cette page</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Parce qu'aucun de ces projets ne se vend au catalogue. Si tu cherches une grille publique, c'est <b style={{color:'var(--ink)'}}>Présence Digitale</b> qu'il te faut.</p>
      </GlassPanel>

      <div className="rv" style={{'--i':8,display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
        <Tag>Cadrage avant chiffrage</Tag><Tag>Neuf types de projet</Tag><Tag>Réponse sous 48 h</Tag>
      </div>
    </Screen>
  );
}

/* ── 2 · CONFIRMATION ── Aucune demande n'est rejetée : elle est réorientée. */
function AgenceEnvoye({go}){
  return (
    <Screen territory="digitalise" meshLobes={CORAIL}>
      <div style={{minHeight:'100%',display:'flex',flexDirection:'column',justifyContent:'center',paddingBottom:'40px'}}>
        <div className="rv-s" style={{width:'70px',height:'70px',borderRadius:'22px',background:'linear-gradient(135deg,#FF6E7F,#6C23DD)',display:'grid',placeItems:'center',boxShadow:'0 12px 32px rgba(255,110,127,.34)'}}>
          <Icon name="check" size={30} color="#fff" strokeWidth={3.4} />
        </div>
        <Display lines={[<>C'est reçu.<br />Je te réponds sous 48 h.</>]} style={{marginTop:'24px'}} />
        <Lede style={{'--i':4,marginTop:'12px'}}>Pas de séquence automatique, pas de relance commerciale. Une réponse écrite, par moi.</Lede>

        <GlassPanel level="flat" padding={18} className="rv" style={{'--i':5,marginTop:'20px'}}>
          <Eyebrow style={{marginBottom:'9px'}}>Ta demande</Eyebrow>
          <DocLine label="Type de projet" value="Plateforme web" />
          <DocLine label="Fourchette" value="Communiquée" />
          <DocLine label="Reçue le" value="05/09/2026" />
          <DocLine label="Statut" value="Nouveau" last />
        </GlassPanel>

        <GlassPanel level="flat" padding={18} className="rv" style={{'--i':6,marginTop:'14px',borderColor:'rgba(108,35,221,.3)'}}>
          <div style={{display:'flex',gap:'11px'}}>
            <span style={{width:'32px',height:'32px',borderRadius:'11px',background:'linear-gradient(135deg,#6C23DD,#0057BC)',display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="forward" size={16} color="#fff" strokeWidth={2.4} /></span>
            <div>
              <p style={{fontSize:'14px',fontWeight:700,margin:0}}>Ton projet relève plutôt de Cléa</p>
              <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'4px 0 0'}}>L'acquisition et le growth sont pilotés par Cléa Growth Office. Je transmets ta demande telle quelle — tu n'as rien à refaire, et personne ne te renvoie à un formulaire.</p>
            </div>
          </div>
        </GlassPanel>

        <Button tone="quiet" fullWidth className="rv" style={{'--i':7,marginTop:'16px'}} onClick={()=>go&&go('agence')}>Revenir à la page agence</Button>
        <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',marginTop:'14px'}}>Aucune demande n'est rejetée. Elle est réorientée.</p>
      </div>
    </Screen>
  );
}

const MM_EXPORT = {Agence,AgenceEnvoye};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensAgence.js');
