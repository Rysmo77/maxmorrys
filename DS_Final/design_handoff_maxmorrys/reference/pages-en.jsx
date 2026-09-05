const { GlassPanel, TerritoryCard, Button, ChipRow, Tag, PriceBlock, Icon, Avatar, ReadingBar, Breadcrumb, TranslationNotice } = window.DS;

/* ══ /en — L'ACCUEIL ANGLAIS ══
   Les titres d'affichage ne sont PAS traduits, ils sont écrits par langue, avec leurs propres
   coupures de ligne. Le français court environ 18 % plus long : « JE TE FORME / AU DIGITAL. /
   DEPUIS DAKAR. » (11 / 11 / 13 signes) laissé se replier en anglais donnerait deux lignes et
   le bloc perdrait sa masse. La version anglaise est donc réécrite sur trois lignes de
   longueur comparable — « I'LL TRAIN YOU / TO GO DIGITAL. / FROM DAKAR. » (14 / 14 / 11) —
   et reprend le libellé de navigation mot pour mot.

   La voix : l'anglais n'a pas de tutoiement. La familiarité passe par la contraction
   (« I'll », « you're », « doesn't ») et le verbe à particule (« show up », « get you online »). */
function AccueilEN({go}){
  const raisons = [
    ['card','rgba(0,87,188,.14)','#0057BC','You pay the way you already pay','Wave, Orange Money, in CFA francs. No card required, no conversion, no account abroad.'],
    ['globe','rgba(243,139,10,.18)','#8A4B00','The examples come from here','« Cosmétique Almadies », not « organic skincare Brooklyn ». What your customers actually type, in the words they use.'],
    ['download','rgba(2,172,156,.18)','#00695E','Built for a metered data plan',"Every video's size is shown before you start it, and every lesson has a transcript that costs nothing."]
  ];
  const territoires = [
    ['forme','6 modules · 47 lessons',"I'll train you",'1 course · 95,000 F','formations'],
    ['informe','Free blog',"I'll keep you posted",'46 articles published','blog'],
    ['transforme','Podcast, video, Club',"I'll push you further",'3 media · 1,658 F/mo','transforme'],
    ['digitalise','Neighbourhood shops',"I'll get you online",'3 packs · from 250,000 F','presence']
  ];
  return (
    <Page territory="forme" go={go} lang="en">
      <div style={{display:'grid',gridTemplateColumns:'1.06fr .94fr',gap:'44px',alignItems:'center',paddingBottom:'16px'}}>
        <div>
          <SiteDisplay size={60} lines={["I'LL TRAIN YOU",'TO GO DIGITAL.','FROM DAKAR.']} />
          <p className="rv" style={{'--i':5,fontSize:'16.5px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'46ch',marginTop:'18px'}}>SEO, marketing and AI — explained for the market you're actually selling in. Pay with Wave or Orange Money, in CFA francs.</p>
          <div className="rv" style={{'--i':6,display:'flex',gap:'12px',marginTop:'24px'}}>
            <Button tone="forme" fullWidth={false} onClick={()=>go('formations')}>See the courses</Button>
            <Button tone="ghost" fullWidth={false} onClick={()=>go('blog')}>Read the blog — 46 articles</Button>
          </div>
          <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'24px',maxWidth:'52ch'}}>
            <SiteEyebrow style={{margin:'0 0 6px'}}>What I don't show</SiteEyebrow>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>No ratings, no student count, no pass rate, no revenue figures. The platform just opened. What I can prove sits on each course page.</p>
          </GlassPanel>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'13px'}}>
          {territoires.map(([t,meta,titre,pied,route],i)=>(
            <div key={t} className="rv" style={{'--i':6+i}} onClick={()=>go&&go(route)}>
              <TerritoryCard stacked={false} territory={t} meta={meta} title={titre} titleSize={20}>
                <p className="mm-num" style={{fontSize:'12px',marginTop:'26px',color:'var(--card-ink-2)'}}>{pied}</p>
              </TerritoryCard>
            </div>
          ))}
        </div>
      </div>

      <SiteBand>
        <SiteDisplay size={34} lines={['Why here, and not somewhere else.']} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'24px'}}>
          {raisons.map(([ico,bg,st,titre,txt],i)=>(
            <GlassPanel key={titre} padding={24} className="rv" style={{'--i':i+1}}>
              <span style={{width:'38px',height:'38px',borderRadius:'12px',background:bg,display:'grid',placeItems:'center'}}>
                <Icon name={ico} size={19} color={st} strokeWidth={2.2} />
              </span>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:'13px 0 0'}}>{titre}</p>
              <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>{txt}</p>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>

      <div style={{marginTop:'44px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px'}}>
          <SiteDisplay size={34} lines={['Start for free.']} />
          <Button tone="quiet" size="sm" fullWidth={false} onClick={()=>go('blog')}>All the blog</Button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'22px'}}>
          <div className="rv" style={{'--i':1}} onClick={()=>go&&go('article')}>
            <TerritoryCard stacked={false} territory="informe" meta="Article · 8 min" title="Why your shop doesn't show up on Google Maps" titleSize={19} />
          </div>
          <div className="rv" style={{'--i':2}} onClick={()=>go&&go('media')}>
            <TerritoryCard stacked={false} territory="transforme" meta="Podcast · 34 min" title="Selling with no ad budget, with Fatou D." titleSize={19} />
          </div>
          <div className="rv" style={{'--i':3}} onClick={()=>go&&go('fiche')}>
            <TerritoryCard stacked={false} territory="forme" meta="Free module · 4 lessons" title="Why your shop is invisible" titleSize={19} />
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ══ /en/blog/… — L'ARTICLE ANGLAIS ══
   Le bandeau de traduction est obligatoire, au-dessus du corps. La traduction est générée au
   pré-rendu et mise en cache : une correction du français n'atteint cette page qu'à
   l'expiration du cache, et il n'y a pas d'invalidation manuelle. Le dire coûte moins cher
   que de faire semblant. */
function ArticleEN({go}){
  return (
    <Page territory="informe" go={go} lang="en" active="I'll keep you posted">
      <ReadingBar value={46} />
      <Breadcrumb items={["I'll keep you posted",'Blog','Local SEO']} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'48px',alignItems:'start',marginTop:'16px'}}>
        <div>
          <SiteDisplay size={46} lines={["Why your shop doesn't show up on Google Maps"]} style={{maxWidth:'22ch'}} />
          <div className="rv" style={{'--i':3,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px',marginTop:'18px',maxWidth:'68ch'}}>
            <div style={{display:'flex',gap:'11px',alignItems:'center'}}>
              <Avatar initials="M" size={40} />
              <div>
                <p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Max-Morrys</p>
                <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-faint)',margin:0}}>12/08/2026 · 8 min read</p>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <Button tone="quiet" size="sm" fullWidth={false}>Share</Button>
              <Button tone="quiet" size="sm" fullWidth={false}>Save</Button>
            </div>
          </div>

          <TranslationNotice date="14/09/2026" href="/blog/boutique-invisible-google-maps"
            className="rv" style={{marginTop:'18px',maxWidth:'68ch'}} />

          <div className="rv mm-prose" style={{'--i':4,marginTop:'22px',color:'#21272F'}}>
            <p style={{margin:'0 0 15px'}}>You have a listing. You filled it in. And still, when a customer types « cosmétique Almadies », it's the shop across the street that comes up. It's almost never bad luck, and it's almost never fixed by running an ad.</p>
            <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.03em',lineHeight:1.1,margin:'26px 0 8px'}}>The cause nobody looks at</h2>
            <p style={{margin:'0 0 15px'}}>Google ranks local businesses on three signals: relevance, distance, and prominence. Everyone knows the first two. The third is the one everyone skips, because you can't fix it inside the listing itself: it's whether your listing agrees with every other page that mentions you.</p>
            <blockquote style={{margin:'20px 0',padding:'14px 16px',borderLeft:'3px solid var(--mm-orange)',background:'rgba(243,139,10,.09)',borderRadius:'0 14px 14px 0',fontSize:'15px',color:'#3A2E1C'}}>One address written three different ways on three different sites is three different businesses, as far as Google is concerned.</blockquote>
            <p style={{margin:'0 0 15px'}}>« Rue 10 Almadies », « Rue 10, Les Almadies » and « R10 Almadies Dakar » are not the same address to an algorithm. Every variant splits your prominence instead of adding it up. The work isn't adding more mentions — it's making the ones you have <b>agree</b>.</p>
            <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.03em',lineHeight:1.1,margin:'26px 0 8px'}}>What you can fix tonight</h2>
            <p style={{margin:0}}>Take a sheet of paper. Write your business name exactly as it should appear everywhere, your address in one single format, and your number with one consistent country code. That sheet becomes your reference: every time a site mentions you, you check that it copies those three lines to the letter.</p>
          </div>
        </div>
        <div style={{position:'sticky',top:'20px'}}>
          <GlassPanel padding={20} className="rv" style={{'--i':5}}>
            <SiteEyebrow style={{margin:0}}>In this article</SiteEyebrow>
            <div style={{marginTop:'12px',fontSize:'13.5px',lineHeight:1.9}}>
              <p style={{fontWeight:600,margin:0}}>The cause nobody looks at</p>
              <p style={{color:'var(--text-muted)',margin:0}}>What you can fix tonight</p>
              <p style={{color:'var(--text-muted)',margin:0}}>Checking whether it worked</p>
            </div>
          </GlassPanel>
          <GlassPanel level="hero" padding={22} className="rv" style={{'--i':6,marginTop:'14px'}}>
            <SiteEyebrow style={{margin:0}}>The full method</SiteEyebrow>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:'7px 0 0'}}>Local SEO for your shop</p>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'8px 0 0'}}><b className="mm-num" style={{color:'var(--ink)'}}>47</b> lessons, and the opening module is free.</p>
            <Button tone="forme" style={{marginTop:'14px'}} onClick={()=>go&&go('fiche')}>See the course</Button>
            <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>Or keep reading — the other 45 articles are free.</p>
          </GlassPanel>
          <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'14px'}}>
            <SiteEyebrow style={{margin:'0 0 6px'}}>Why the banner is up there</SiteEyebrow>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Translations are generated at pre-render and cached. A fix to the French only reaches this page when the cache expires — <b style={{color:'var(--ink)'}}>there is no manual purge</b>. Saying so is cheaper than pretending.</p>
          </GlassPanel>
        </div>
      </div>

      <SiteBand style={{marginTop:'44px'}}>
        <SiteDisplay size={34} lines={['Read next']} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'20px'}}>
          {[['informe','6 min','The words your customers actually type'],
            ['rose','5 min','Answering a bad review without apologising'],
            ['forme','7 min','The listing photos that bring people in']].map(([t,m,titre],i)=>(
            <div key={titre} className="rv" style={{'--i':i+1}}>
              <TerritoryCard stacked={false} territory={t} padding={22} meta={m} title={titre} titleSize={19} />
            </div>
          ))}
        </div>
      </SiteBand>
    </Page>
  );
}

const MM_EXPORT = {AccueilEN,ArticleEN};
Object.assign(window, MM_EXPORT);
window.MMSITE = Object.assign(window.MMSITE||{}, MM_EXPORT);
