const { Mesh, GlassPanel, TerritoryCard, Button, ChipRow, PriceBlock, SideNav, TopBar, Wordmark, ProgressBar, Breadcrumb, ReadingBar, Avatar, Tag, Icon, IconButton, CheckLine } = window.DS;

const VERBES = [
  {label:'Je te forme',color:'#0057BC'},
  {label:"Je t'informe",color:'#F38B0A'},
  {label:'Je te transforme',color:'#6C23DD'},
  {label:'Je te digitalise',color:'#02AC9C'}
];

/* Cadre de fenêtre : le maillage court sur toute la hauteur, sous le chrome. */
function Vue({territory='forme',width,height,children}){
  return (
    <div className="play" style={{position:'relative',width:width+'px',height:height+'px',borderRadius:'18px',overflow:'hidden',
      background:'var(--surface-page)',color:'var(--text-body)',isolation:'isolate',boxShadow:'0 30px 70px rgba(0,0,0,.5)'}}>
      <Mesh territory={territory} size={width > 1100 ? 560 : 460} />
      {children}
    </div>
  );
}

/* ══ 700 → 1080 px · CATALOGUE EN TABLETTE ══
   L'empilement s'arrête : grille 2 × 2, chevron conservé, chevauchement supprimé.
   Navigation latérale de 250 px en verre, les quatre verbes et leur pastille. */
function TabletteCatalogue(){
  return (
    <Vue territory="forme" width={1000} height={780}>
      <div style={{position:'relative',zIndex:3,display:'grid',gridTemplateColumns:'250px 1fr',height:'100%'}}>
        <SideNav brand={<Wordmark size={21} />} items={VERBES} active="Je te forme" style={{height:'780px'}}
          footer={<GlassPanel padding={14}>
            <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0}}>Ton espace</p>
            <p style={{fontSize:'13px',fontWeight:600,margin:'4px 0 0'}}>Leçon 5 · 34 %</p>
            <ProgressBar value={34} style={{marginTop:'8px'}} />
          </GlassPanel>} />
        <div style={{padding:'26px 30px',overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'20px'}}>
            <div>
              <p className="rv" style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.16em',textTransform:'uppercase',color:'var(--text-muted)',margin:0}}>Je te forme</p>
              <h1 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'40px',letterSpacing:'-.038em',lineHeight:.94,margin:'8px 0 0'}}>
                <span className="rv-l" style={{'--i':1,display:'block'}}>Deux formations.</span>
                <span className="rv-l" style={{'--i':2,display:'block'}}>Accès à vie.</span>
              </h1>
            </div>
            <div className="rv" style={{'--i':3,display:'flex',gap:'8px',alignItems:'center'}}>
              <IconButton label="Chercher"><Icon name="search" size={17} strokeWidth={2.4} /></IconButton>
              <IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton>
              <Avatar initials="A" size={42} />
            </div>
          </div>
          <div className="rv" style={{'--i':4,marginTop:'20px',maxWidth:'440px'}}>
            <ChipRow options={['Tout · 2','Débutant · 1','Avancé · 1']} value="Tout · 2" />
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginTop:'22px'}}>
            <div className="rv" style={{'--i':5}}>
              <TerritoryCard layout="grid" territory="forme" meta="SEO · 6 modules · 47 leçons" title={<>Référencement local<br />pour ton commerce</>} titleSize={22}>
                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'18px'}}>
                  <PriceBlock amount="95 000" size={24} note={<>ou <b className="mm-num">3 × 31 700</b></>} />
                  <Button tone="primary" size="sm" fullWidth={false}>Voir</Button>
                </div>
              </TerritoryCard>
            </div>
            <div className="rv" style={{'--i':6}}>
              <TerritoryCard layout="grid" territory="transforme" meta="IA · 9 modules · 68 leçons" title={<>L'IA au service<br />de ta prospection</>} titleSize={22}>
                <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'18px'}}>
                  <PriceBlock amount="200 000" size={24} note={<>ou <b className="mm-num">4 × 50 000</b></>} />
                  <Button tone="primary" size="sm" fullWidth={false}>Voir</Button>
                </div>
              </TerritoryCard>
            </div>
            <div className="rv" style={{'--i':7}}>
              <TerritoryCard layout="grid" territory="informe" meta="Blog · 46 articles" title="Commence gratuitement" titleSize={22}>
                <p style={{fontSize:'13.5px',color:'var(--card-ink-2)',lineHeight:1.5,margin:'9px 0 0'}}>Des méthodes, pas des opinions. Applicables le soir même.</p>
              </TerritoryCard>
            </div>
            <div className="rv" style={{'--i':8}}>
              <TerritoryCard layout="grid" territory="digitalise" meta="Présence Digitale · 3 packs" title="Ou je le fais pour toi" titleSize={22}>
                <p style={{fontSize:'13.5px',color:'var(--card-ink-2)',lineHeight:1.5,margin:'9px 0 0'}}>Dès <b className="mm-num">250 000 F</b>, une fois, prix affichés.</p>
              </TerritoryCard>
            </div>
          </div>

          <GlassPanel level="truth" className="rv" style={{'--i':9,marginTop:'20px'}}>
            <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:'0 0 6px'}}>Ce que ce point de rupture change</p>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Le chevauchement de <b className="mm-num" style={{color:'var(--ink)'}}>−14 px</b> disparaît, mais <b style={{color:'var(--ink)'}}>le chevron reste</b> : au-delà de 700 px une encoche prise dans une carte large et isolée ne rappelle plus rien, alors qu'un chevron posé sur quatre cartes en grille garde le rappel du logo.</p>
          </GlassPanel>
        </div>
      </div>
    </Vue>
  );
}

/* ══ > 1080 px · ACCUEIL DESKTOP ══
   Rangée de quatre : la silhouette du M se lit horizontalement, comme dans le logo.
   Barre supérieure flottante en verre, détachée des bords, chaque verbe souligné. */
function DesktopAccueil(){
  return (
    <Vue territory="forme" width={1400} height={880}>
      <div style={{position:'relative',zIndex:3,height:'100%',overflowY:'auto'}}>
        <TopBar brand={<Wordmark size={23} style={{marginRight:'12px'}} />} items={VERBES.map(v=>({label:v.label,territory:{'Je te forme':'forme',"Je t'informe":'informe','Je te transforme':'transforme','Je te digitalise':'digitalise'}[v.label]}))}
          trailing={<>
            <span className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)'}}>FR&nbsp;/&nbsp;<b style={{color:'var(--text-faint)'}}>EN</b></span>
            <Button size="sm" tone="primary" fullWidth={false}>Connexion</Button>
          </>} />
        <div style={{padding:'26px 46px 44px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1.02fr .98fr',gap:'52px',alignItems:'center'}}>
            <div>
              <h1 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'70px',letterSpacing:'-.04em',lineHeight:.88,margin:0}}>
                <span className="rv-l" style={{'--i':1,display:'block'}}>JE TE FORME</span>
                <span className="rv-l" style={{'--i':2,display:'block'}}>AU DIGITAL.</span>
                <span className="rv-l" style={{'--i':3,display:'block'}}>DEPUIS DAKAR.</span>
              </h1>
              <p className="rv" style={{'--i':5,fontSize:'17px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'44ch',marginTop:'20px'}}>SEO, marketing et intelligence artificielle, expliqués pour le marché ouest-africain. Tu paies en Wave ou en Orange Money, en francs CFA.</p>
              <div className="rv" style={{'--i':6,display:'flex',gap:'12px',marginTop:'26px'}}>
                <Button tone="forme" fullWidth={false}>Voir les formations</Button>
                <Button tone="ghost" fullWidth={false}>Lire le blog — 46 articles</Button>
              </div>
            </div>
            <GlassPanel level="truth" className="rv" style={{'--i':7}}>
              <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:'0 0 7px'}}>Ce que je n'affiche pas</p>
              <p style={{fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Ni note, ni nombre d'élèves, ni taux de réussite, ni chiffre d'affaires. La plateforme vient d'ouvrir. Ce que je peux prouver est sur chaque fiche.</p>
            </GlassPanel>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginTop:'38px'}}>
            {[['forme','6 modules · 47 leçons','Je te forme','1 formation · 95 000 F'],
              ['informe','Blog gratuit',"Je t'informe",'46 articles publiés'],
              ['transforme','Podcast, vidéos, Club','Je te transforme','3 médias · 1 658 F/mois'],
              ['digitalise','Commerces de proximité','Je te digitalise','3 packs · dès 250 000 F']].map(([t,meta,titre,pied],i)=>(
              <div key={t} className="rv" style={{'--i':i+1}}>
                <TerritoryCard layout="row" territory={t} meta={meta} title={titre} titleSize={23}>
                  <p className="mm-num" style={{fontSize:'12px',marginTop:'30px',color:'var(--card-ink-2)'}}>{pied}</p>
                </TerritoryCard>
              </div>
            ))}
          </div>
          <p className="rv" style={{'--i':5,fontFamily:'var(--f-mono)',fontSize:'11px',color:'var(--text-faint)',textAlign:'center',marginTop:'14px'}}>Quatre chevrons en rangée — la silhouette du M, lue horizontalement</p>
        </div>
      </div>
    </Vue>
  );
}

/* ══ LA RÈGLE QUI NE SE NÉGOCIE PAS ══
   68 caractères par ligne, quelle que soit la place. L'espace gagné va à la marge
   et à la navigation, jamais à la longueur de ligne. */
function DesktopArticle(){
  return (
    <Vue territory="informe" width={1400} height={880}>
      <div style={{position:'relative',zIndex:3,height:'100%',overflowY:'auto'}}>
        <ReadingBar value={38} />
        <TopBar brand={<Wordmark size={23} style={{marginRight:'12px'}} />} items={VERBES.map(v=>({label:v.label,territory:{'Je te forme':'forme',"Je t'informe":'informe','Je te transforme':'transforme','Je te digitalise':'digitalise'}[v.label]}))} />
        <div style={{display:'grid',gridTemplateColumns:'1fr minmax(0,var(--measure-prose)) 300px 1fr',gap:'0 44px',padding:'20px 46px 44px'}}>
          <div />
          <div>
            <Breadcrumb items={["Je t'informe",'Blog','SEO local']} />
            <h1 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'46px',letterSpacing:'-.036em',lineHeight:.96,margin:'12px 0 0',maxWidth:'20ch'}}>
              <span className="rv-l" style={{'--i':1,display:'block'}}>Pourquoi ta boutique n'apparaît pas sur Google Maps</span>
            </h1>
            <div className="rv" style={{'--i':3,display:'flex',gap:'11px',alignItems:'center',marginTop:'18px'}}>
              <Avatar initials="M" size={40} />
              <div>
                <p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Max-Morrys</p>
                <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-faint)',margin:0}}>12 août 2026 · 8 min de lecture</p>
              </div>
            </div>
            <div className="rv mm-prose" style={{'--i':4,marginTop:'24px',color:'#21272F'}}>
              <p style={{margin:'0 0 15px'}}>Tu as une fiche. Tu l'as remplie. Et pourtant, quand un client tape « cosmétique Almadies », c'est le magasin d'en face qui sort. Ce n'est presque jamais un problème de chance, et ce n'est presque jamais réglé par une publicité.</p>
              <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.03em',lineHeight:1.1,margin:'26px 0 8px'}}>La cause que personne ne regarde</h2>
              <p style={{margin:'0 0 15px'}}>Google classe les commerces sur trois signaux : la pertinence, la distance, et la notoriété. Le troisième est celui que tout le monde ignore, parce qu'il ne se règle pas dans l'interface de la fiche : c'est la cohérence entre ce que dit ta fiche et ce que disent toutes les autres pages qui parlent de toi.</p>
              <blockquote style={{margin:'20px 0',padding:'14px 16px',borderLeft:'3px solid var(--mm-orange)',background:'rgba(243,139,10,.09)',borderRadius:'0 14px 14px 0',fontSize:'15px',color:'#3A2E1C'}}>Une adresse écrite de trois façons différentes sur trois sites, c'est trois commerces différents pour Google.</blockquote>
              <p style={{margin:0}}>« Rue 10 Almadies », « Rue 10, Les Almadies » et « R10 Almadies Dakar » ne sont pas la même adresse pour un algorithme. Chaque variante dilue ta notoriété au lieu de l'additionner.</p>
            </div>
          </div>
          <div style={{position:'sticky',top:'20px',alignSelf:'start'}}>
            <GlassPanel padding={20} className="rv" style={{'--i':5}}>
              <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0}}>Dans cet article</p>
              <div style={{marginTop:'12px',fontSize:'13.5px',lineHeight:1.9}}>
                <p style={{fontWeight:600,margin:0}}>La cause que personne ne regarde</p>
                <p style={{color:'var(--text-muted)',margin:0}}>Ce que tu peux corriger ce soir</p>
                <p style={{color:'var(--text-muted)',margin:0}}>Mesurer si ça a marché</p>
              </div>
            </GlassPanel>
            <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'14px'}}>
              <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:'0 0 6px'}}>La règle</p>
              <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>À <b className="mm-num" style={{color:'var(--ink)'}}>1400 px</b> comme à <b className="mm-num" style={{color:'var(--ink)'}}>390</b>, la colonne fait <b className="mm-num" style={{color:'var(--ink)'}}>68 caractères</b>. Les <b className="mm-num" style={{color:'var(--ink)'}}>400 px</b> gagnés sont allés à la marge et au sommaire, pas à la longueur de ligne.</p>
            </GlassPanel>
          </div>
          <div />
        </div>
      </div>
    </Vue>
  );
}

const MM_EXPORT = {Vue,TabletteCatalogue,DesktopAccueil,DesktopArticle};
Object.assign(window, MM_EXPORT);
window.MMRESP = Object.assign(window.MMRESP||{}, MM_EXPORT);
