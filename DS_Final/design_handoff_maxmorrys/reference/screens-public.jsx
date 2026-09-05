const { GlassPanel, TerritoryCard, Button, ChipRow, SearchPill, SearchPill: _s, IconButton, PillButton, Avatar, Icon, Tag, PriceBlock, LessonRow, EmptyState } = window.DS;

function Accueil({go}){
  return (
    <Screen territory="forme" bar={
      <AppBar left={<PillButton>Menu</PillButton>} right={
        <span style={{display:'flex',gap:'9px'}}>
          <IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton>
          <Avatar initials="A" />
        </span>} />}>
      <Display size="lg" lines={['JE TE FORME','AU DIGITAL.','DEPUIS DAKAR.']} />
      <Lede style={{marginTop:'13px','--i':4}}>SEO, marketing et IA, expliqués pour le marché d'ici. Tu paies en Wave ou en Orange Money.</Lede>
      <div className="rv" style={{'--i':5,marginTop:'18px'}}><SearchPill icon={<Icon name="search" strokeWidth={2.4} size={17} />} label="TROUVE CE " hint="QU'IL TE FAUT" /></div>
      <div className="rv" style={{'--i':6,marginTop:'14px'}}><ChipRow options={['Tout','SEO','IA','Marketing']} /></div>
      <div style={{marginTop:'20px'}}>
        <div className="rv" style={{'--i':7}} onClick={()=>go('catalogue')}><TerritoryCard first territory="forme" meta="6 modules · 47 leçons" title="Je te forme" big="1" bigLabel="formation" /></div>
        <div className="rv" style={{'--i':8}}><TerritoryCard territory="informe" meta="Blog · podcast · vidéo" title="Je t'informe" big="46" bigLabel="gratuits" /></div>
        <div className="rv" style={{'--i':9}} onClick={()=>go('club')}><TerritoryCard territory="transforme" meta="19 900 F/an ≈ 1 658 F/mois" title="Je te transforme" big="8" bigLabel="onglets" /></div>
        <div className="rv" style={{'--i':10}}><TerritoryCard territory="digitalise" meta="Ton commerce en ligne" title="Je te digitalise" big="3" bigLabel="packs" /></div>
      </div>
    </Screen>
  );
}

function Catalogue({go}){
  return (
    <Screen territory="informe" bar={<AppBar left={<BackButton onClick={()=>go('accueil')} />} right={<PillButton>Menu</PillButton>} />}>
      <Eyebrow>Je te forme</Eyebrow>
      <Display size="sm" lines={['LE CATALOGUE','OUVRE BIENTÔT.']} style={{marginTop:'6px'}} />
      <GlassPanel level="hero" padding={22} className="rv" style={{'--i':4,marginTop:'20px'}}>
        <p style={{fontSize:'15px',fontWeight:700,margin:0}}>Aucune formation n'est encore en ligne.</p>
        <p style={{color:'var(--text-muted)',fontSize:'14px',lineHeight:1.5,margin:'9px 0 0'}}>Je préfère te le dire que te faire cliquer dans le vide. Crée ton compte : je t'alerte dans ton espace le jour de la mise en ligne.</p>
        <Button tone="primary" style={{marginTop:'17px'}} onClick={()=>go('fiche')}>Crée ton compte</Button>
      </GlassPanel>
      <Eyebrow style={{'--i':5,marginTop:'26px'}}>En attendant, tout ça est gratuit</Eyebrow>
      <div style={{marginTop:'12px'}}>
        <div className="rv" style={{'--i':6}}><TerritoryCard first territory="informe" meta="Article · 8 min" title={<>Le SEO local<br/>à Dakar</>} big="46" bigLabel="articles" /></div>
        <div className="rv" style={{'--i':7}}><TerritoryCard territory="rose" meta="Podcast · 1 épisode" title={<>Vendre sans<br/>budget pub</>} big="2" bigLabel="vidéos" /></div>
      </div>
      <p className="rv" style={{'--i':8,fontSize:'12.5px',color:'var(--text-faint)',marginTop:'18px'}}>Pas de « préviens-moi par e-mail » : le produit n'a aucun canal d'envoi (R-14). L'alerte arrive dans ton espace.</p>
    </Screen>
  );
}

function Fiche({go}){
  return (
    <Screen territory="forme" bar={<AppBar left={<BackButton onClick={()=>go('catalogue')} />} right={<IconButton label="Partager"><Icon name="share" size={18} strokeWidth={2} /></IconButton>} />}>
      <Eyebrow>Formation · SEO</Eyebrow>
      <Display size="sm" lines={['Référencement','local pour ton','commerce']} style={{marginTop:'6px'}} />
      <MediaBlock style={{'--i':5,marginTop:'16px'}}>
        <Tag style={{background:'rgba(255,255,255,.92)',color:'#0E1116'}}>Aperçu · 4 min gratuit</Tag>
      </MediaBlock>
      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':6,marginTop:'16px'}}>
        <PriceBlock amount="95 000" note={<>Une fois, accès à vie · ou <b className="mm-num">3 × 31 700</b> sans frais</>} />
        <Button tone="forme" style={{marginTop:'15px'}} onClick={()=>go('paiement')}>Je m'inscris</Button>
        <RowBetween style={{marginTop:'13px'}}><Tag tone="ok">14 jours pour changer d'avis</Tag><Tag>Wave · Orange Money</Tag></RowBetween>
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'15px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce que je peux te prouver</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}><b className="mm-num">47</b> leçons, <b className="mm-num">6</b> modules, un certificat dont le code se vérifie sans compte. Je n'affiche ni note ni nombre d'inscrits : la plateforme vient d'ouvrir, je n'ai rien d'honnête à en dire.</p>
      </GlassPanel>
      <Eyebrow style={{'--i':8,marginTop:'22px'}}>Le programme</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':9,marginTop:'10px'}}>
        <LessonRow icon={<Icon name="play" size={14} color="#fff" />} iconBackground="linear-gradient(135deg,#0057BC,#6C23DD)" title="Pourquoi ta boutique est invisible" meta="4 leçons · 22 min" trailing={<Tag tone="ok">Gratuit</Tag>} />
        <LessonRow icon={<Icon name="lock" size={14} color="#5A6472" />} title="Ta fiche Google, pas à pas" meta="11 leçons · 1 h 08" />
        <LessonRow icon={<Icon name="lock" size={14} color="#5A6472" />} title="Les mots que tapent tes clients" meta="9 leçons · 54 min" />
        <LessonRow icon={<Icon name="lock" size={14} color="#5A6472" />} title="Mesurer sans se mentir" meta="7 leçons · 41 min" last />
      </GlassPanel>
    </Screen>
  );
}

const MM_EXPORT = {Accueil,Catalogue,Fiche};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
