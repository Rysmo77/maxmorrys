const { GlassPanel, TerritoryCard, Button, PayOption, StepDots, PriceBlock, DocLine, LessonRow, Tag, Icon, IconButton, PillButton, Segmented } = window.DS;

/* ── 1 · PAGE D'OFFRE ── */
function PresenceOffre({go}){
  const [rep,setRep] = React.useState('Bouche-à-oreille et passage');
  return (
    <Screen territory="digitalise"
      bar={<AppBar left={<PillButton>Menu</PillButton>} right={<IconButton label="WhatsApp"><Icon name="chat" size={18} strokeWidth={2} /></IconButton>} />}>
      <Eyebrow>Je te digitalise</Eyebrow>
      <Display size="sm" lines={['TA BOUTIQUE,','TROUVABLE','SUR GOOGLE.']} style={{marginTop:'6px'}} />
      <Lede style={{'--i':5,marginTop:'12px'}}>Tu vends déjà sur WhatsApp. Je m'occupe de ce que tu ne peux pas faire depuis ton téléphone.</Lede>

      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':6,marginTop:'18px'}}>
        <Eyebrow style={{color:'var(--mm-teal-t)'}}>La question que tout le monde pose</Eyebrow>
        <p style={{fontWeight:700,fontSize:'15.5px',lineHeight:1.3,margin:'7px 0 0'}}>« Une agence me vend un site 400 000 F une fois. Toi c'est combien la première année ? »</p>
        <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'11px 0 0'}}>Réponse avant que tu remplisses quoi que ce soit : <b className="mm-num" style={{color:'var(--ink)'}}>250 000 F</b> pour le pack seul, une fois. L'accompagnement mensuel est une décision séparée, que tu prends après la mise en ligne — pas maintenant.</p>
      </GlassPanel>

      <Eyebrow style={{'--i':7,marginTop:'24px'}}>Trois questions, une recommandation</Eyebrow>
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':8,marginTop:'12px'}}>
        <StepDots total={3} current={2} style={{marginBottom:'17px'}} />
        <p style={{fontWeight:700,fontSize:'16px',margin:0}}>Tes clients te trouvent comment aujourd'hui ?</p>
        <div style={{display:'grid',gap:'9px',marginTop:'15px'}}>
          {['Bouche-à-oreille et passage','WhatsApp et Facebook','Je ne sais pas trop'].map(o=>(
            <PayOption key={o} title={o} on={rep===o} onClick={()=>setRep(o)} style={{minHeight:'56px'}} />
          ))}
        </div>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',margin:'13px 0 0'}}>« Je ne sais pas » est une réponse valable : elle mène aussi à une recommandation.</p>
      </GlassPanel>

      <div className="rv" style={{'--i':9,marginTop:'20px'}}>
        <TerritoryCard first territory="digitalise" meta="Recommandé pour toi" title="Pack Visible">
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'15px'}}>
            <PriceBlock amount="250 000" strike="295 000" size={27} note="Une fois · lancement" />
            <Button tone="digitalise" size="sm" onClick={()=>go&&go('devis')}>Mon devis</Button>
          </div>
        </TerritoryCard>
      </div>
      <p className="rv" style={{'--i':10,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'14px'}}>Sous 2 millions de chiffre d'affaires mensuel, le pack seul est l'offre naturelle : l'accompagnement démarre au-dessus.</p>
    </Screen>
  );
}

/* ── 2 · DEVIS PARTAGEABLE ── */
function DevisPartageable({go}){
  return (
    <Screen territory="digitalise" bar={<AppBar left={<BackButton onClick={()=>go&&go('presence')} />} right={<IconButton label="Partager"><Icon name="share" size={18} strokeWidth={2} /></IconButton>} />}>
      <Eyebrow>Devis · consultable sans compte</Eyebrow>
      <Display size="sm" lines={['TON DEVIS,','PACK VISIBLE.']} style={{marginTop:'6px'}} />
      <p className="mm-num rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'10px'}}>maxmorrys.me/devis/MM-D-4831</p>

      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':5,marginTop:'16px'}}>
        <DocLine label="Fiche Google optimisée" value="incluse" />
        <DocLine label="Site vitrine · 5 pages" value="incluse" />
        <DocLine label="Photos et textes" value="incluse" />
        <DocLine label="Prise en main · 1 h" value="incluse" />
        <DocLine label="Nom de domaine · 1 an" value="incluse" last />
        <div style={{height:'1px',background:'rgba(14,17,22,.12)',margin:'14px 0'}} />
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px'}}>
          <PriceBlock amount="250 000" size={29} note="Une fois · promotion de lancement" />
          <Tag tone="ok">Valide 30 j</Tag>
        </div>
        <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'10px 0 0'}}>Émis le 05/09/2026 · valable jusqu'au 05/10/2026</p>
      </GlassPanel>

      <Button tone="digitalise" className="rv" style={{'--i':6,marginTop:'18px'}}>Continuer sur WhatsApp</Button>
      <Button tone="quiet" fullWidth className="rv" style={{'--i':7,marginTop:'10px'}}>Copier le lien du devis</Button>

      <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce que ce document contient, et ne contient pas</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Ce devis ne contient aucune donnée personnelle. Son contenu est figé à l'émission : une évolution de la grille ne réécrit pas un devis déjà envoyé.</p>
      </GlassPanel>
    </Screen>
  );
}

/* ── 3 · GRILLE COMPLÈTE ── */
function GrilleComplete({go}){
  const [vue,setVue] = React.useState('Packs');
  const pack = (t,nom,prix,strike,lignes,i)=>(
    <GlassPanel level="flat" padding={18} className="rv" style={{'--i':i,marginBottom:'10px'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
        <div>
          <Eyebrow>{t}</Eyebrow>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.032em',margin:'4px 0 0'}}>{nom}</p>
        </div>
        <PriceBlock amount={prix} strike={strike} size={21} style={{textAlign:'right'}} />
      </div>
      <div style={{marginTop:'12px'}}>
        {lignes.map((l,j)=><LessonRow key={l} state="plain" icon={<Icon name="check" size={13} color="#0F7B52" strokeWidth={3.4} />} iconBackground="rgba(15,123,82,.14)" title={l} last={j===lignes.length-1} />)}
      </div>
    </GlassPanel>
  );
  return (
    <Screen territory="digitalise" bar={<AppBar left={<BackButton onClick={()=>go&&go('presence')} />} center={<span style={{fontSize:'13px',fontWeight:600}}>La grille</span>} />}>
      <Display size="sm" lines={['LA GRILLE,','EN ENTIER.']} />
      <div className="rv" style={{'--i':3,marginTop:'16px'}}><Segmented options={['Packs','Accompagnements']} value={vue} onChange={setVue} /></div>
      <p className="rv" style={{'--i':4,fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,marginTop:'14px'}}>Trois packs à paiement unique, deux accompagnements à mise en place plus abonnement mensuel. Un pack n'est jamais un accompagnement, et inversement.</p>
      <div style={{marginTop:'16px'}}>
        {pack('Pack · entrée','Visible','250 000','295 000',['Fiche Google optimisée','Site vitrine · 5 pages','Photos et textes','Prise en main · 1 h'],5)}
        {pack('Pack · intermédiaire','Trouvable','495 000',null,['Tout le pack Visible','Catalogue produits','Référencement local · 3 quartiers','Suivi 1 mois'],6)}
        {pack('Pack · complet','Commerce 360','895 000',null,['Tout le pack Trouvable','Boutique en ligne · paiement mobile','Campagne de lancement','Suivi 3 mois'],7)}
      </div>
      <Eyebrow style={{'--i':8,marginTop:'10px'}}>Accompagnements · mise en place + mensuel</Eyebrow>
      <div style={{marginTop:'10px'}}>
        <GlassPanel level="flat" padding={18} className="rv" style={{'--i':9,marginBottom:'10px'}}>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.032em',margin:0}}>Croissance</p>
          <div style={{display:'flex',gap:'18px',marginTop:'10px'}}>
            <PriceBlock amount="375 000" size={19} note="Mise en place" />
            <PriceBlock amount="175 000" currency="F / mois" size={19} note="Sans engagement" />
          </div>
        </GlassPanel>
        <GlassPanel level="flat" padding={18} className="rv" style={{'--i':10}}>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.032em',margin:0}}>Commerce 360</p>
          <div style={{display:'flex',gap:'18px',marginTop:'10px'}}>
            <PriceBlock amount="750 000" size={19} note="Mise en place" />
            <PriceBlock amount="225 000" currency="F / mois" size={19} note="Engagement 6 mois" />
          </div>
        </GlassPanel>
      </div>
      <GlassPanel level="truth" className="rv" style={{'--i':11,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Comment lire cette grille</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Un pack se paie une fois. Un accompagnement se décide après la mise en ligne, jamais dans le même mouvement : additionner les deux au moment de la vente, c'est annoncer une facture de première année que la plupart des commerces ne peuvent pas financer.</p>
      </GlassPanel>
    </Screen>
  );
}

const MM_EXPORT = {PresenceOffre,DevisPartageable,GrilleComplete};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensTPE.js');
