const { GlassPanel, TerritoryCard, Button, ChipRow, PriceBlock, Tag, Icon, IconButton, PillButton } = window.DS;

/** Catalogue plein — l'écran tel qu'il sera le jour où FR-111 est fait. */
function CataloguePlein({go}){
  return (
    <Screen territory="forme" bar={<AppBar left={<BackButton onClick={()=>go&&go('accueil')} />} right={<PillButton>Menu</PillButton>} />}>
      <Eyebrow>Je te forme</Eyebrow>
      <Display size="sm" lines={['2 FORMATIONS.','ACCÈS À VIE.']} style={{marginTop:'6px'}} />
      <div className="rv" style={{'--i':4,marginTop:'16px'}}><ChipRow options={['Tout','Débutant','Avancé']} /></div>
      <div style={{marginTop:'18px'}}>
        <div className="rv" style={{'--i':5}}>
          <TerritoryCard first territory="forme" meta="6 modules · 47 leçons · débutant" title={<>Référencement local<br />pour ton commerce</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'16px'}}>
              <PriceBlock amount="95 000" size={25} note={<>Une fois · ou <b className="mm-num">3 × 31 700</b></>} />
              <Button tone="primary" size="sm" onClick={()=>go&&go('fiche')}>Voir</Button>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':6}}>
          <TerritoryCard territory="transforme" meta="9 modules · 68 leçons · avancé" title={<>L'IA au service<br />de ta prospection</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'16px'}}>
              <PriceBlock amount="200 000" size={25} note={<>Une fois · ou <b className="mm-num">4 × 50 000</b></>} />
              <Button tone="primary" size="sm">Voir</Button>
            </div>
          </TerritoryCard>
        </div>
      </div>
      <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi il n'y a que deux titres</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Parce que je les monte moi-même, une par une, et que je préfère deux formations finies à dix annoncées. Le module d'ouverture de chacune est en accès libre : tu juges avant de payer.</p>
      </GlassPanel>
      <div className="rv" style={{'--i':8,marginTop:'16px',display:'flex',gap:'8px',flexWrap:'wrap'}}>
        <Tag tone="ok">14 jours pour changer d'avis</Tag>
        <Tag>Wave · Orange Money</Tag>
      </div>
    </Screen>
  );
}

const MM_EXPORT = {CataloguePlein};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
