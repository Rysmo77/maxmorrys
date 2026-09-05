const { GlassPanel, TerritoryCard, Button, ChipRow, Segmented, Breadcrumb, ReadingBar, LessonRow, Tag, PriceBlock, Icon, IconButton, PillButton, Avatar } = window.DS;

/* ── 1 · INDEX BLOG ── */
function BlogIndex({go}){
  const [f,setF] = React.useState('Tout');
  return (
    <Screen territory="informe"
      bar={<AppBar left={<PillButton>Menu</PillButton>} right={<IconButton label="Chercher"><Icon name="search" size={17} strokeWidth={2.4} /></IconButton>} />}>
      <Eyebrow>Je t'informe</Eyebrow>
      <Display size="sm" lines={['46 ARTICLES.','TOUS GRATUITS.']} style={{marginTop:'6px'}} />
      <div className="rv" style={{'--i':4,marginTop:'16px'}}><ChipRow options={['Tout','SEO','IA','Podcast','Vidéo']} value={f} onChange={setF} /></div>
      <div style={{marginTop:'18px'}}>
        <div className="rv" style={{'--i':5}} onClick={()=>go&&go('article')}>
          <TerritoryCard first territory="informe" meta="Article · 8 min · 12 août" title={<>Pourquoi ta boutique n'apparaît pas sur Google Maps</>}>
            <p style={{fontSize:'13px',color:'var(--card-ink-2)',margin:'9px 0 0'}}>Trois causes, dont une que personne ne regarde jamais.</p>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':6}} onClick={()=>go&&go('podcast')}>
          <TerritoryCard territory="rose" meta="Podcast · 34 min · 6 août" title={<>Vendre sans budget pub, avec Fatou D.</>}>
            <p style={{fontSize:'13px',color:'var(--card-ink-2)',margin:'9px 0 0'}}>Une gérante des Almadies raconte ses six premiers mois.</p>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':7}}>
          <TerritoryCard territory="forme" meta="Article · 6 min · 2 août" title={<>Les trois requêtes qui amènent des clients</>}>
            <p style={{fontSize:'13px',color:'var(--card-ink-2)',margin:'9px 0 0'}}>Ce que tapent vraiment les gens, à Dakar.</p>
          </TerritoryCard>
        </div>
      </div>
      <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'16px'}}>Aucune vignette photo : la couleur de la carte dit le type de contenu, et ne coûte rien à charger.</p>
    </Screen>
  );
}

/* ── 2 · ARTICLE ── */
function Article({go}){
  return (
    <Screen territory="informe" readingBar={<ReadingBar value={46} />}
      bar={<AppBar left={<BackButton onClick={()=>go&&go('blog')} />} right={<IconButton label="Partager"><Icon name="share" size={18} strokeWidth={2} /></IconButton>} />}>
      <Breadcrumb items={["Je t'informe",'Blog','SEO local']} />
      <Display size="sm" lines={['Pourquoi ta boutique',"n'apparaît pas sur",'Google Maps']} style={{marginTop:'10px'}} />
      <p className="mm-num rv" style={{'--i':5,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'12px'}}>12 août 2026 · 8 min · Max-Morrys</p>
      <div className="rv mm-prose" style={{'--i':6,marginTop:'18px',color:'#21272F'}}>
        <p style={{margin:'0 0 15px'}}>Trois causes expliquent qu'un commerce n'apparaisse pas dans les résultats locaux. Les deux premières se corrigent en une heure. La troisième ne se regarde jamais : la cohérence entre ce que dit ta fiche et ce que disent les gens.</p>
        <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.03em',lineHeight:1.1,margin:'26px 0 8px'}}>La fiche existe, mais elle est incomplète</h2>
        <p style={{margin:'0 0 15px'}}>Une fiche sans horaires, sans photos et sans catégorie précise ne se classe pas. C'est le point le plus rapide à corriger, et celui qui rapporte le plus vite.</p>
        <blockquote style={{margin:'20px 0',padding:'14px 16px',borderLeft:'3px solid var(--mm-orange)',background:'rgba(243,139,10,.09)',borderRadius:'0 14px 14px 0',fontSize:'14.5px',color:'#3A2E1C'}}>« Cosmétique Almadies » convertit mieux que « cosmétique Sénégal ». Le quartier fait le travail que le budget ne fait pas.</blockquote>
        <ul style={{margin:'14px 0',padding:0,listStyle:'none'}}>
          {['Remplis les horaires, même approximatifs.','Ajoute cinq photos prises au téléphone, en journée.','Choisis la catégorie la plus précise, pas la plus large.'].map(t=>(
            <li key={t} style={{display:'flex',gap:'9px',margin:'8px 0',fontSize:'15px'}}>
              <span style={{flex:'0 0 auto',width:'6px',height:'6px',borderRadius:'50%',background:'var(--mm-orange)',marginTop:'9px'}} />{t}
            </li>
          ))}
        </ul>
      </div>
      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':7,marginTop:'22px'}}>
        <Eyebrow>Tu veux la méthode complète ?</Eyebrow>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.032em',lineHeight:1.05,margin:'6px 0 0'}}>Référencement local pour ton commerce</p>
        <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'8px 0 0'}}><b className="mm-num" style={{color:'var(--ink)'}}>47</b> leçons, dont le premier module en accès libre.</p>
        <PriceBlock amount="95 000" size={23} note="Une fois, accès à vie" style={{marginTop:'12px'}} />
        <Button tone="forme" style={{marginTop:'14px'}}>Voir la formation</Button>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>Ou continue à lire — les 45 autres articles sont gratuits.</p>
      </GlassPanel>
    </Screen>
  );
}

/* Podcast et vidéos ont changé de territoire : ils vivent désormais sous
   « Je te transforme » dans ScreensMedia.js — le blog donne une méthode, le podcast une voix. */

/* ── 5 · FAQ, UNE PAGE PAR QUESTION ── */
function FaqQuestion({go}){
  return (
    <Screen territory="informe" bar={<AppBar left={<BackButton onClick={()=>go&&go('blog')} />} right={<IconButton label="Partager"><Icon name="share" size={18} strokeWidth={2} /></IconButton>} />}>
      <Breadcrumb items={['FAQ','Paiement','Wave et Orange Money']} />
      <Display size="sm" lines={['Puis-je payer','en Wave ou en','Orange Money ?']} style={{marginTop:'10px'}} />
      <p className="mm-num rv" style={{'--i':5,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'12px'}}>maxmorrys.me/faq/payer-en-wave</p>
      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':6,marginTop:'16px'}}>
        <p style={{fontSize:'15px',lineHeight:1.55,margin:0}}>Oui. Wave, Orange Money et la carte bancaire sont proposés au moment du paiement, en francs CFA. Tu quittes le site pour valider sur ton téléphone, puis tu reviens : la commande reste ouverte si la session est interrompue.</p>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
          <Tag tone="ok">Wave</Tag><Tag tone="ok">Orange Money</Tag><Tag tone="ok">Carte bancaire</Tag>
        </div>
      </GlassPanel>
      <div className="rv" style={{'--i':7,marginTop:'16px',display:'flex',alignItems:'center',gap:'10px'}}>
        <span style={{fontSize:'13px',color:'var(--text-muted)',flex:1}}>Cette réponse t'a aidé ?</span>
        <Button tone="quiet" size="sm">Oui</Button>
        <Button tone="quiet" size="sm">Non</Button>
      </div>
      <Eyebrow style={{'--i':8,marginTop:'24px'}}>Questions voisines</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':9,marginTop:'10px'}}>
        <LessonRow state="plain" title="Puis-je payer une formation en plusieurs fois ?" trailing={<Icon name="forward" size={16} color="#98A1AE" strokeWidth={2.4} />} />
        <LessonRow state="plain" title="Que se passe-t-il si mon paiement échoue ?" trailing={<Icon name="forward" size={16} color="#98A1AE" strokeWidth={2.4} />} />
        <LessonRow state="plain" title="Combien de temps garde-t-on l'accès à une formation ?" trailing={<Icon name="forward" size={16} color="#98A1AE" strokeWidth={2.4} />} last />
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':10,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce que cet écran corrige</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Aujourd'hui la FAQ n'a qu'un index : aucune question n'a d'URL partageable ni de position propre en recherche. Une page par question, avec son fil et ses données structurées, ferme cet écart.</p>
      </GlassPanel>
    </Screen>
  );
}

const MM_EXPORT = {BlogIndex,Article,FaqQuestion};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
