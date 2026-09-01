const { GlassPanel, Button, Field, LessonRow, QuotaMeter, Tag, Icon, IconButton, Segmented } = window.DS;

/** Mémoire de profil du répétiteur — FR-039 : consultable et effaçable, sans passer par le
 *  support. C'est aussi l'écran où se fait le renommage : le nom du répétiteur est un réglage
 *  de la relation, il appartient donc à l'endroit où cette relation se règle, pas à un menu
 *  de préférences générales. Les deux existent ; celui-ci est le chemin court. */
function RysmoMemoire({go}){
  const [nom,setNom] = React.useState(tutorNom());
  const nomBas = nom.toLowerCase();
  const lignes = [
    ['Tu gères la page Instagram de ta cousine coiffeuse, le week-end.','depuis le 12 août'],
    ['Tu vends des cosmétiques aux Almadies.','depuis le 12 août'],
    ["Ton objectif : être trouvable sur Google Maps avant décembre.",'depuis le 28 août'],
    ['Tu préfères les réponses courtes, en trois points.','depuis le 2 septembre'],
    ['Tu travailles surtout le soir, après 21 h.','depuis le 4 septembre']
  ];
  return (
    <Screen territory="transforme"
      bar={<AppBar left={<BackButton onClick={()=>go&&go('rysmo')} />}
        center={<div style={{textAlign:'center'}}>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.035em',margin:0}}>{nom}</p>
          <QuotaMeter used={3} total={5} label="3 / 5" style={{justifyContent:'center',fontSize:'10.5px'}} />
        </div>}
        right={<IconButton label="Fermer" onClick={()=>go&&go('rysmo')}><Icon name="close" size={17} strokeWidth={2.4} /></IconButton>} />}>

      {/* ── LE RENOMMAGE ──
          Un répétiteur qu'on peut nommer est un répétiteur qu'on tutoie sans effort. Le champ
          est en tête, pas enfoui : c'est la première chose qu'on veut faire en arrivant ici. */}
      <Eyebrow>Ton répétiteur</Eyebrow>
      <Display size="sm" lines={['DONNE-LUI','UN NOM.']} style={{marginTop:'6px'}} />
      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':4,marginTop:'18px'}}>
        <Field label="Comment tu l'appelles" value={nom} state="focus" style={{marginTop:0}}
          hint={nom === MM_TUTOR_DEFAUT ? 'Par défaut, il s\'appelle Répétiteur.' : 'Tu peux revenir à « Répétiteur » quand tu veux.'}
          trailing={<Icon name="send" size={17} color="#5A6472" strokeWidth={2.2} />} />
        <div className="mm-touch-row" style={{display:'flex',gap:'8px',marginTop:'14px',flexWrap:'wrap'}}>
          {['Répétiteur','Prof','Coach','Tonton'].map(p=>(
            <span key={p} className="mm-press-sm" onClick={()=>{ setNom(p); setTutorNom(p); }} style={{
              height:'40px',display:'inline-flex',alignItems:'center',padding:'0 15px',borderRadius:'var(--r-pill)',
              fontSize:'13px',fontWeight:p===nom?600:500,cursor:'pointer',
              background:p===nom?'var(--ink)':'var(--ctl-off-bg)',
              color:p===nom?'var(--text-on-primary)':'var(--text-muted)',
              border:'1px solid '+(p===nom?'var(--ink)':'var(--ctl-off-brd)'),
              transition:'background var(--t-ui) var(--ease),color var(--t-ui) var(--ease)'}}>{p}</span>
          ))}
        </div>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,margin:'12px 0 0'}}>Le nom ne change que pour toi. <b style={{color:'var(--ink)'}}>Rysmo</b> reste le nom de l'application.</p>
      </GlassPanel>

      <Eyebrow style={{'--i':5,marginTop:'26px'}}>Mémoire de profil</Eyebrow>
      <p className="rv" style={{'--i':5,fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>Cinq lignes, écrites à partir de vos échanges. Tu peux en retirer une, ou tout effacer.</p>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':6,marginTop:'14px'}}>
        {lignes.map(([t,d],i)=>(
          <LessonRow key={t} state="plain" title={t} meta={d} last={i===lignes.length-1}
            icon={<Icon name="chat" size={14} color="#5A17BE" />} iconBackground="rgba(108,35,221,.12)"
            trailing={<span className="mm-press-sm" role="button" tabIndex={0} aria-label={'Oublier : '+t} style={{width:'var(--touch-aa)',height:'var(--touch-aa)',borderRadius:'50%',background:'rgba(180,35,31,.1)',display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}><Icon name="trash" size={14} color="#B4231F" strokeWidth={2.2} /></span>} />
        ))}
      </GlassPanel>
      <Button tone="quiet" fullWidth className="rv" style={{'--i':7,marginTop:'16px',color:'var(--stop)'}}>Tout effacer</Button>
      <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'14px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce que l'effacement fait</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>L'effacement est immédiat et ne passe pas par le support. La mémoire se reconstitue à partir des seuls échanges suivants. <b style={{color:'var(--ink)'}}>Le nom que tu lui as donné, lui, ne s'efface pas avec.</b></p>
      </GlassPanel>
      <div className="rv" style={{'--i':8,display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
        <Tag>Lisible par toi seule</Tag>
        <Tag tone="ok">Effaçable sans supprimer le compte</Tag>
      </div>
    </Screen>
  );
}

const MM_EXPORT = {RysmoMemoire};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensRysmo.js');
