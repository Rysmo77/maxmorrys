const { GlassPanel, TerritoryCard, Button, ChipRow, Tag, PriceBlock, PayOption, StepDots, Breadcrumb, ReadingBar, Field, Icon, Avatar, CheckLine, SearchPill } = window.DS;

const chevronBas = <Icon name="chevron" size={15} color="#5A6472" strokeWidth={2.4} />;

/* ── / — l'accueil. Trois sections : le héros et les quatre territoires, la raison d'être,
   puis l'entrée gratuite. Le maillage remplace la vidéo d'arrière-plan : 0 octet. ── */
function Accueil({go}){
  const raisons = [
    ['card','rgba(0,87,188,.14)','#0057BC','Tu paies comme tu paies déjà',"Wave, Orange Money, en francs CFA. Pas de carte obligatoire, pas de conversion, pas de compte à l'étranger."],
    ['globe','rgba(243,139,10,.18)','#8A4B00',"Les exemples sont d'ici",'« Cosmétique Almadies », pas « organic skincare Brooklyn ». Ce que tapent tes clients, dans les mots qu\'ils emploient.'],
    ['download','rgba(2,172,156,.18)','#00695E','Pensé pour un forfait compté','Le poids de chaque vidéo est annoncé avant que tu la lances. Toutes les leçons ont une transcription qui ne coûte rien.']
  ];
  const territoires = [
    ['forme','6 modules · 47 leçons','Je te forme','1 formation · 95 000 F','formations'],
    ['informe','Blog gratuit',"Je t'informe",'46 articles publiés','blog'],
    ['transforme','Podcast, vidéos, Club','Je te transforme','3 médias · 1 658 F/mois','transforme'],
    ['digitalise','Commerces de proximité','Je te digitalise','3 packs · dès 250 000 F','presence']
  ];
  return (
    <Page territory="forme" go={go}>
      <div style={{display:'grid',gridTemplateColumns:'1.06fr .94fr',gap:'44px',alignItems:'center',paddingBottom:'16px'}}>
        <div>
          <SiteDisplay size={60} lines={['JE TE FORME','AU DIGITAL.','DEPUIS DAKAR.']} />
          <p className="rv" style={{'--i':5,fontSize:'16.5px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'44ch',marginTop:'18px'}}>SEO, marketing et intelligence artificielle, expliqués pour le marché ouest-africain. Tu paies en Wave ou en Orange Money, en francs CFA.</p>
          <div className="rv" style={{'--i':6,display:'flex',gap:'12px',marginTop:'24px'}}>
            <Button tone="forme" fullWidth={false} onClick={()=>go('formations')}>Voir les formations</Button>
            <Button tone="ghost" fullWidth={false} onClick={()=>go('blog')}>Lire le blog — 46 articles</Button>
          </div>
          <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'24px',maxWidth:'52ch'}}>
            <SiteEyebrow style={{margin:'0 0 6px'}}>Ce que je n'affiche pas</SiteEyebrow>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Ni note, ni nombre d'élèves, ni taux de réussite, ni chiffre d'affaires. La plateforme vient d'ouvrir. Ce que je peux prouver est sur chaque fiche.</p>
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
        <SiteDisplay size={34} lines={['Pourquoi ici, et pas ailleurs.']} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'24px'}}>
          {raisons.map(([ico,bg,st,titre,txt],i)=>(
            <GlassPanel level="flat" key={titre} padding={24} className="rv" style={{'--i':i+1}}>
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
          <SiteDisplay size={34} lines={['Commence gratuitement.']} />
          <Button tone="quiet" size="sm" fullWidth={false} onClick={()=>go('blog')}>Tout le blog</Button>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'22px'}}>
          <div className="rv" style={{'--i':1}} onClick={()=>go&&go('article')}>
            <TerritoryCard stacked={false} territory="informe" meta="Article · 8 min" title="Pourquoi ta boutique n'apparaît pas sur Google Maps" titleSize={19} />
          </div>
          <div className="rv" style={{'--i':2}} onClick={()=>go&&go('media')}>
            <TerritoryCard stacked={false} territory="transforme" meta="Podcast · 34 min" title="Vendre sans budget pub, avec Fatou D." titleSize={19} />
          </div>
          <div className="rv" style={{'--i':3}} onClick={()=>go&&go('fiche')}>
            <TerritoryCard stacked={false} territory="forme" meta="Module gratuit · 4 leçons" title="Pourquoi ta boutique est invisible" titleSize={19} />
          </div>
        </div>
      </div>
    </Page>
  );
}

/* ── /blog — 46 articles. Le podcast n'est PLUS ici : il est passé sous « Je te transforme ». ── */
function Blog({go}){
  return (
    <Page territory="informe" go={go} active="Je t'informe">
      <SiteEyebrow>Je t'informe</SiteEyebrow>
      <SiteDisplay size={52} lines={['46 articles.','Tous gratuits.']} style={{marginTop:'8px'}} />
      <p className="rv" style={{'--i':3,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'52ch',marginTop:'14px'}}>Des méthodes, pas des opinions. Ce qui marche pour un commerce à Dakar, écrit pour être appliqué le soir même.</p>
      <div className="rv" style={{'--i':4,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px',marginTop:'24px'}}>
        <div style={{flex:1,maxWidth:'640px'}}><ChipRow options={['Tout · 46','SEO · 19','Marketing · 14','IA · 8','Outils · 5']} /></div>
        <div style={{width:'300px',flex:'0 0 auto'}}>
          <SearchPill height={48} icon={<Icon name="search" size={16} strokeWidth={2.4} />} label="CHERCHE " hint="UN SUJET" />
        </div>
      </div>
      <div className="rv" style={{'--i':5,marginTop:'22px'}} onClick={()=>go&&go('article')}>
        <TerritoryCard stacked={false} territory="informe" padding={30} meta="À la une · 12 août · 8 min"
          title="Pourquoi ta boutique n'apparaît pas sur Google Maps" titleSize={32}
          trailing={<Button tone="primary" size="sm" fullWidth={false}>Lire</Button>}>
          <p style={{fontSize:'15px',color:'var(--card-ink-2)',lineHeight:1.55,margin:'11px 0 0',maxWidth:'60ch'}}>Trois causes, dont une que personne ne regarde jamais — et qui explique la majorité des cas que je vois.</p>
        </TerritoryCard>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'14px',marginTop:'14px'}}>
        {[['forme','6 août · 6 min','Les mots que tapent vraiment tes clients'],
          ['rose','2 août · 5 min',"Répondre à un avis négatif sans s'excuser"],
          ['transforme','28 juillet · 9 min',"Ce que l'IA ne fera pas à ta place"]].map(([t,m,titre],i)=>(
          <div key={titre} className="rv" style={{'--i':6+i}}>
            <TerritoryCard stacked={false} territory={t} padding={22} meta={m} title={titre} titleSize={19} />
          </div>
        ))}
      </div>

      <SiteBand style={{marginTop:'44px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'36px',alignItems:'center'}}>
          <div>
            <SiteDisplay size={34} lines={['Tu préfères écouter ?']} />
            <p className="rv" style={{'--i':1,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'44ch',marginTop:'12px'}}>Le podcast et les vidéos ne sont pas ici : ils sont sous <b style={{color:'var(--ink)'}}>Je te transforme</b>. Le blog donne des méthodes ; là-bas, des gens racontent ce qu'ils ont fait.</p>
            <Button tone="transforme" size="sm" fullWidth={false} className="rv" style={{'--i':2,marginTop:'16px'}} onClick={()=>go&&go('media')}>Écouter &amp; regarder</Button>
          </div>
          <GlassPanel level="flat" padding={22} className="rv" style={{'--i':2}}>
            <SiteEyebrow style={{margin:0}}>Suivre les publications</SiteEyebrow>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'11px 0',borderBottom:'1px solid var(--border-hair)'}}>
              <b style={{fontSize:'14px'}}>Flux RSS</b><Button tone="quiet" size="sm" fullWidth={false}>Copier</Button>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',padding:'11px 0'}}>
              <b style={{fontSize:'14px'}}>Alerte dans ton espace</b><Button tone="quiet" size="sm" fullWidth={false}>Créer un compte</Button>
            </div>
            <p style={{fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,margin:'8px 0 0'}}>Il n'y a pas encore de lettre par e-mail. Je ne te fais pas remplir un champ qui ne sert à rien.</p>
          </GlassPanel>
        </div>
      </SiteBand>
    </Page>
  );
}

/* ── /blog/… — l'article. Colonne de lecture bornée, sommaire et passerelle collants. ── */
function Article({go}){
  return (
    <Page territory="informe" go={go} active="Je t'informe">
      <ReadingBar value={46} />
      <Breadcrumb items={["Je t'informe",'Blog','SEO local']} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'48px',alignItems:'start',marginTop:'16px'}}>
        <div>
          <SiteDisplay size={46} lines={["Pourquoi ta boutique n'apparaît pas sur Google Maps"]} style={{maxWidth:'20ch'}} />
          <div className="rv" style={{'--i':3,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px',marginTop:'18px',maxWidth:'68ch'}}>
            <div style={{display:'flex',gap:'11px',alignItems:'center'}}>
              <Avatar initials="M" size={40} />
              <div>
                <p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Max-Morrys</p>
                <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-faint)',margin:0}}>12 août 2026 · 8 min de lecture</p>
              </div>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <Button tone="quiet" size="sm" fullWidth={false}>Partager</Button>
              <Button tone="quiet" size="sm" fullWidth={false}>Enregistrer</Button>
            </div>
          </div>
          <div className="rv mm-prose" style={{'--i':4,marginTop:'24px',color:'#21272F'}}>
            <p style={{margin:'0 0 15px'}}>Tu as une fiche. Tu l'as remplie. Et pourtant, quand un client tape « cosmétique Almadies », c'est le magasin d'en face qui sort. Ce n'est presque jamais un problème de chance, et ce n'est presque jamais réglé par une publicité.</p>
            <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.03em',lineHeight:1.1,margin:'26px 0 8px'}}>La cause que personne ne regarde</h2>
            <p style={{margin:'0 0 15px'}}>Google classe les commerces sur trois signaux : la pertinence, la distance, et la notoriété. Les deux premiers, tout le monde les connaît. Le troisième est celui que tout le monde ignore, parce qu'il ne se règle pas dans l'interface de la fiche : c'est la cohérence entre ce que dit ta fiche et ce que disent toutes les autres pages qui parlent de toi.</p>
            <blockquote style={{margin:'20px 0',padding:'14px 16px',borderLeft:'3px solid var(--mm-orange)',background:'rgba(243,139,10,.09)',borderRadius:'0 14px 14px 0',fontSize:'15px',color:'#3A2E1C'}}>Une adresse écrite de trois façons différentes sur trois sites, c'est trois commerces différents pour Google.</blockquote>
            <p style={{margin:'0 0 15px'}}>« Rue 10 Almadies », « Rue 10, Les Almadies » et « R10 Almadies Dakar » ne sont pas la même adresse pour un algorithme. Chaque variante dilue ta notoriété au lieu de l'additionner. Le travail n'est pas d'ajouter des mentions, c'est de les <b>uniformiser</b>.</p>
            <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.03em',lineHeight:1.1,margin:'26px 0 8px'}}>Ce que tu peux corriger ce soir</h2>
            <p style={{margin:0}}>Prends une feuille. Écris ton nom commercial exactement comme il doit apparaître partout, ton adresse dans un seul format, et ton numéro avec le même indicatif. Cette feuille devient ta référence : chaque fois qu'un site parle de toi, tu vérifies qu'il copie ces trois lignes à la lettre près.</p>
          </div>
        </div>
        <div style={{position:'sticky',top:'20px'}}>
          <GlassPanel level="flat" padding={20} className="rv" style={{'--i':5}}>
            <SiteEyebrow style={{margin:0}}>Dans cet article</SiteEyebrow>
            <div style={{marginTop:'12px',fontSize:'13.5px',lineHeight:1.9}}>
              <p style={{fontWeight:600,margin:0}}>La cause que personne ne regarde</p>
              <p style={{color:'var(--text-muted)',margin:0}}>Ce que tu peux corriger ce soir</p>
              <p style={{color:'var(--text-muted)',margin:0}}>Mesurer si ça a marché</p>
            </div>
          </GlassPanel>
          <GlassPanel level="hero" padding={22} className="rv" style={{'--i':6,marginTop:'14px'}}>
            <SiteEyebrow style={{margin:0}}>La méthode complète</SiteEyebrow>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:'7px 0 0'}}>Référencement local pour ton commerce</p>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'8px 0 0'}}><b className="mm-num" style={{color:'var(--ink)'}}>47</b> leçons, dont le premier module en accès libre.</p>
            <Button tone="forme" style={{marginTop:'14px'}} onClick={()=>go&&go('fiche')}>Voir la formation</Button>
            <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>Ou continue à lire — les 45 autres articles sont gratuits.</p>
          </GlassPanel>
        </div>
      </div>

      <SiteBand style={{marginTop:'44px'}}>
        <SiteDisplay size={34} lines={['À lire ensuite']} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'20px'}}>
          {[['informe','6 min','Les mots que tapent vraiment tes clients'],
            ['rose','5 min',"Répondre à un avis négatif sans s'excuser"],
            ['forme','7 min','Les photos de fiche qui font venir du monde']].map(([t,m,titre],i)=>(
            <div key={titre} className="rv" style={{'--i':i+1}}>
              <TerritoryCard stacked={false} territory={t} padding={22} meta={m} title={titre} titleSize={19} />
            </div>
          ))}
        </div>
      </SiteBand>
    </Page>
  );
}

/* ── /presence-digitale — l'ancrage est désamorcé AVANT tout prix : le marché ancre
   « site = achat unique », et la réponse appartient à la page, pas au closing. ── */
function Presence({go}){
  const [rep,setRep] = React.useState('Bouche-à-oreille et passage');
  const packs = [
    ['digitalise','Le minimum qui marche','Pack Visible','Fiche Google complète, photos, horaires, réponses aux avis, et une page unique avec ton catalogue.','250 000','295 000','Une fois · lancement'],
    ['forme','Le plus demandé','Pack Vendeur','Tout le pack Visible, plus un site de trois pages, un catalogue tenu à jour et un bouton WhatsApp qui envoie la commande formatée.','450 000',null,'Une fois'],
    ['transforme','Plusieurs points de vente','Pack Réseau','Une fiche par point de vente, cohérentes entre elles, plus le site et la formation de ton équipe.','750 000',null,'Une fois']
  ];
  return (
    <Page territory="digitalise" go={go} active="Je te digitalise">
      <div style={{display:'grid',gridTemplateColumns:'1.05fr .95fr',gap:'44px',alignItems:'center',paddingBottom:'14px'}}>
        <div>
          <SiteEyebrow>Je te digitalise</SiteEyebrow>
          <SiteDisplay size={56} lines={['Ta boutique,','trouvable','sur Google.']} style={{marginTop:'9px'}} />
          <p className="rv" style={{'--i':4,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'44ch',marginTop:'16px'}}>Tu vends déjà sur WhatsApp et au comptoir. Je m'occupe de ce que tu ne peux pas faire depuis ton téléphone — et je te laisse les clés à la fin.</p>
          <Button tone="digitalise" fullWidth={false} className="rv" style={{'--i':5,marginTop:'24px'}}>Trouver mon pack en 3 questions</Button>
        </div>
        <GlassPanel level="hero" padding={26} className="rv" style={{'--i':5}}>
          <SiteEyebrow style={{margin:0,color:'var(--mm-teal-t)'}}>La question que tout le monde pose</SiteEyebrow>
          <p style={{fontWeight:700,fontSize:'17px',lineHeight:1.32,margin:'9px 0 0'}}>« Une agence me vend un site 400 000 F une fois. Toi c'est combien la première année ? »</p>
          <p style={{fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'12px 0 0'}}>Réponse avant que tu remplisses quoi que ce soit : <b className="mm-num" style={{color:'var(--ink)'}}>250 000 F</b> pour le pack seul, une fois, tout compris. L'accompagnement mensuel est une décision <b style={{color:'var(--ink)'}}>séparée</b>, que tu prends après la mise en ligne — pas maintenant, et pas comme condition.</p>
          <div style={{height:'1px',background:'var(--border-hair)',margin:'18px 0'}} />
          <p style={{fontSize:'13px',color:'var(--text-muted)',margin:0}}>Si tu ne prends que le pack, ça fonctionne quand même. C'est écrit ici pour que tu n'aies pas à le demander.</p>
        </GlassPanel>
      </div>

      <SiteBand>
        <SiteDisplay size={34} lines={['Trois packs. Les prix sont affichés.']} />
        <p className="rv" style={{'--i':1,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'56ch',marginTop:'10px'}}>Pas de devis mystère, pas de « à partir de ». Le sélecteur te dit lequel te correspond, mais tu peux aussi choisir toi-même.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'24px'}}>
          {packs.map(([t,cnt,nom,txt,prix,barre,note],i)=>(
            <div key={nom} className="rv" style={{'--i':i+2}}>
              <TerritoryCard stacked={false} territory={t} padding={24} meta={cnt} title={nom} titleSize={23}>
                <p style={{fontSize:'13.5px',color:'var(--card-ink-2)',lineHeight:1.5,margin:'9px 0 0'}}>{txt}</p>
                <PriceBlock amount={prix} strike={barre} size={26} note={note} style={{marginTop:'18px'}} />
              </TerritoryCard>
            </div>
          ))}
        </div>
        <GlassPanel level="flat" padding={22} className="rv" style={{'--i':5,marginTop:'20px'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'20px'}}>
            <div style={{maxWidth:'60ch'}}>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:0}}>L'accompagnement, séparément</p>
              <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>Deux plans mensuels, <b className="mm-num" style={{color:'var(--ink)'}}>35 000</b> et <b className="mm-num" style={{color:'var(--ink)'}}>75 000 FCFA</b>. Publications, réponses aux avis, corrections. <b style={{color:'var(--ink)'}}>Tu peux t'arrêter quand tu veux</b>, et le pack continue de fonctionner sans.</p>
            </div>
            <Button tone="quiet" size="sm" fullWidth={false}>Voir les deux plans</Button>
          </div>
        </GlassPanel>
      </SiteBand>

      <div style={{marginTop:'44px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'36px',alignItems:'center'}}>
        <div>
          <SiteDisplay size={34} lines={['Trois questions,','une recommandation.']} />
          <p className="rv" style={{'--i':2,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'44ch',marginTop:'12px'}}>Pas de formulaire de dix champs. Trois questions sur ton commerce, et je te dis lequel des trois packs te correspond — y compris si la réponse est « aucun, tu n'en as pas besoin ».</p>
          <p className="rv" style={{'--i':3,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'12px'}}>Aucune donnée personnelle n'est demandée avant que tu aies vu la recommandation.</p>
        </div>
        <GlassPanel level="flat" padding={26} className="rv" style={{'--i':4}}>
          <StepDots total={3} current={1} style={{marginBottom:'18px'}} />
          <p style={{fontWeight:700,fontSize:'17px',margin:0}}>Tes clients te trouvent comment aujourd'hui ?</p>
          <div style={{display:'grid',gap:'9px',marginTop:'16px'}}>
            {['Bouche-à-oreille et passage','WhatsApp et Facebook','Je ne sais pas trop'].map(o=>(
              <PayOption key={o} title={o} on={rep===o} onClick={()=>setRep(o)} style={{minHeight:'58px'}} />
            ))}
          </div>
          <p style={{fontSize:'11.5px',color:'var(--text-faint)',margin:'13px 0 0'}}>« Je ne sais pas » est une réponse valable : elle mène aussi à une recommandation.</p>
        </GlassPanel>
      </div>
    </Page>
  );
}

/* ── /agence — hors des quatre verbes. AUCUN montant affiché : le formulaire filtre
   au lieu de maximiser le volume. Aucune organisation tierce nommée (FR-105). ── */
function Agence({go}){
  const types = [
    ['Plateforme','Produit métier, espace client, outil interne.'],
    ['Refonte','Site existant à reprendre sans perdre son référencement.'],
    ['Automatisation','Ce que ton équipe refait à la main chaque semaine.'],
    ['Intégration IA',"Dans un flux qui existe déjà, pas à côté."]
  ];
  const etapes = [
    ['01','Une conversation','Quarante-cinq minutes, sans engagement. On regarde si le problème vaut le budget que tu as en tête.'],
    ['02','Un cadrage écrit',"Le périmètre, les hypothèses, ce qui n'est pas inclus. C'est ce document qui est chiffré, pas une intuition."],
    ['03','Des jalons livrés','Tu vois quelque chose de fonctionnel à chaque étape. Pas de grande révélation à la fin.']
  ];
  return (
    <Page territory="digitalise" go={go}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'44px',alignItems:'center',paddingBottom:'14px'}}>
        <div>
          <SiteEyebrow style={{color:'#B4231F'}}>Max-Morrys Agency · practice BUILD</SiteEyebrow>
          <SiteDisplay size={56} lines={['Des projets',"qu'on mène",'à deux.']} style={{marginTop:'9px'}} />
          <p className="rv" style={{'--i':5,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'46ch',marginTop:'16px'}}>Refonte, plateforme, automatisation, intelligence artificielle. Peu de projets à la fois, cadrés avant d'être chiffrés. Si ça ne colle pas, je te le dis en une conversation plutôt qu'en trois devis.</p>
          <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'22px',maxWidth:'50ch'}}>
            <SiteEyebrow style={{margin:'0 0 6px'}}>Pourquoi il n'y a aucun tarif sur cette page</SiteEyebrow>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Parce qu'aucun de ces projets ne se vend au catalogue. Si tu cherches une grille publique et un prix affiché, c'est <b style={{color:'var(--ink)'}}>Présence Digitale</b> qu'il te faut — c'est une autre offre, une autre équipe, et elle est faite pour ça.</p>
          </GlassPanel>
        </div>
        <GlassPanel level="hero" padding={26} className="rv" style={{'--i':6}}>
          <SiteEyebrow style={{margin:0}}>Parlons-en</SiteEyebrow>
          <Field label="De quoi s'agit-il ?" placeholder="Choisis un type de projet" trailing={chevronBas} />
          <Field label="Quel budget as-tu en tête ?" value="À partir de 3 M FCFA" state="focus" trailing={chevronBas}
            hint="Je demande une fourchette au lieu d'en annoncer une : c'est la seule façon de savoir tout de suite si on peut travailler ensemble." />
          <Field label="Le projet en trois lignes" placeholder="Ce que tu veux obtenir, et pour quand." multiline />
          <Button style={{marginTop:'17px',background:'linear-gradient(135deg,#FF6E7F,#6C23DD)',color:'#fff',boxShadow:'0 8px 24px rgba(255,110,127,.3)'}}>Envoyer ma demande</Button>
          <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>Réponse sous 48 h, par moi.</p>
        </GlassPanel>
      </div>

      <SiteBand>
        <SiteDisplay size={34} lines={['Neuf types de projet.',"Aucune demande n'est rejetée."]} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginTop:'22px'}}>
          {types.map(([t,txt],i)=>(
            <GlassPanel level="flat" key={t} padding={20} className="rv" style={{'--i':i+1}}>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'17px',letterSpacing:'-.03em',margin:0}}>{t}</p>
              <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'7px 0 0'}}>{txt}</p>
            </GlassPanel>
          ))}
        </div>
        <GlassPanel level="flat" padding={24} className="rv" style={{'--i':5,marginTop:'18px',borderColor:'rgba(108,35,221,.24)'}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'20px'}}>
            <div style={{maxWidth:'62ch'}}>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:0}}>Si ton projet relève de l'acquisition</p>
              <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.6,margin:'8px 0 0'}}>Le growth est piloté par <b style={{color:'var(--ink)'}}>Cléa Growth Office</b>, l'autre practice de MY ONOMA. Je transmets ta demande telle quelle — tu n'as rien à refaire, et personne ne te renvoie vers un autre formulaire.</p>
            </div>
            <Tag>Aucun prospect rejeté</Tag>
          </div>
        </GlassPanel>
      </SiteBand>

      <div style={{marginTop:'44px'}}>
        <SiteDisplay size={34} lines={['Comment ça se passe.']} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'22px'}}>
          {etapes.map(([n,titre,txt],i)=>(
            <GlassPanel level="flat" key={n} padding={24} className="rv" style={{'--i':i+1}}>
              <p className="mm-num" style={{fontSize:'30px',color:'var(--fill-5)',margin:0}}>{n}</p>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:'8px 0 0'}}>{titre}</p>
              <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>{txt}</p>
            </GlassPanel>
          ))}
        </div>
        <div className="rv" style={{'--i':4,marginTop:'24px',borderLeft:'2px solid #B4231F',paddingLeft:'15px',maxWidth:'76ch',
          fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.6}}>
          <b style={{color:'#B4231F'}}>Section retirée volontairement.</b> La page en production nomme publiquement douze organisations, et le dépôt note lui-même que l'accord écrit n'est pas obtenu. Tant que FR-105 n'est pas fait, la page se passe de références.
        </div>
      </div>
    </Page>
  );
}

/* ══ /a-propos — LA PAGE DE MARQUE PERSONNELLE ══
   Sur une plateforme sans preuve sociale, cette page n'est pas une courtoisie : c'est le
   substitut. Il n'y a ni note, ni nombre d'élèves, ni témoignage à opposer au doute — reste
   la personne. D'où la structure : positionnement, ce que je fais, des dates vérifiables,
   l'arbre de marque, où me trouver.

   Trois choses que cette page ne fait PAS :
   – aucun portrait généré par IA. Sur la seule page dont le métier est d'inspirer confiance,
     une image synthétique est le pire endroit possible. L'emplacement est déclaré (FR-084).
   – aucun jalon inventé ni repris d'un annuaire tiers : les manques sont marqués en orange.
   – aucun chiffre d'audience. Les compteurs sont des chiffres de PRODUCTION — ce que j'ai
     publié — pas ce que ça a rapporté. ── */
function Apropos({go}){
  const fait = [
    ['book','rgba(0,87,188,.14)','#0057BC','Je forme',"Des formations en ligne sur le référencement local et l'IA appliquée à la prospection. Écrites, filmées et corrigées par moi."],
    ['list','rgba(243,139,10,.18)','#8A4B00','Je publie','Un blog gratuit, un podcast, des vidéos. Le tout en français, avec des exemples pris ici et pas ailleurs.'],
    ['bars','rgba(2,172,156,.18)','#00695E',"J'accompagne",'Des commerces de proximité que je rends trouvables en ligne, et des projets sur mesure côté Agency.']
  ];
  const jalons = [
    ['11 avril 2022','MY ONOMA SARL','Immatriculation de la société opératrice, à Dakar. Trois piliers : BUILD, GROW, OWN.'],
    ['2026','maxmorrys.me','Ouverture de la plateforme : blog, podcast, vidéos, formations, Club des Digitos et services aux commerces.'],
    ["Aujourd'hui",'46 publications gratuites',"Le blog est l'actif le plus vivant de la plateforme. Tout y est en accès libre."]
  ];
  const production = [['46','articles publiés'],['2','formations montées'],['1','épisode de podcast'],['2','vidéos']];
  const practices = [
    ['Track LEARN','Max-Morrys',"La plateforme que tu lis. Formations, blog, podcast, Club, et l'offre Présence Digitale pour les commerces.",null,null],
    ['Pilier BUILD','Max-Morrys Agency','Les projets sur mesure, sans grille publique, sur cadrage écrit. Une practice sœur, pas une offre du catalogue.','rgba(180,35,31,.12)','#B4231F'],
    ['Pilier GROW','Cléa Growth Office',"L'acquisition et le growth. Si ta demande relève de là, elle y est transmise — jamais rejetée.",null,null]
  ];
  const reseaux = [
    ['#0E1116','X','@max_morrys','ok','Déclaré','M18.2 2H21l-6.4 7.3L22 22h-5.9l-4.6-6-5.3 6H3.4l6.9-7.8L2.5 2h6l4.2 5.5zm-1 18h1.6L7.9 3.7H6.2z'],
    ['#0A66C2','LinkedIn','à confirmer','warn','Vide','M4.98 3.5a2.5 2.5 0 11-.02 5 2.5 2.5 0 01.02-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95 4.03 0 4.78 2.5 4.78 5.75V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.45-2.2 2.96V21h-4z'],
    ['#FF0000','YouTube','2 vidéos publiées','warn','Vide',null],
    ['#1DB954','Spotify','1 épisode publié','warn','Vide',null]
  ];

  /* Emplacement à fournir : bordure orange, jamais un contenu inventé à sa place. */
  const Slot = ({titre,children,style}) => (
    <div style={{borderRadius:'var(--r-m)',padding:'14px 16px',background:'rgba(243,139,10,.07)',
      border:'1px dashed rgba(243,139,10,.55)',...style}}>
      <p style={{display:'flex',alignItems:'center',gap:'7px',fontFamily:'var(--f-mono)',fontSize:'10px',
        letterSpacing:'.14em',textTransform:'uppercase',color:'var(--mm-orange-t)',margin:0}}>
        <Icon name="info" size={11} color="var(--mm-orange-t)" strokeWidth={2.6} />{titre}
      </p>
      <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:'7px 0 0'}}>{children}</p>
    </div>
  );

  return (
    <Page territory="informe" go={go} active="Je suis Max-Morrys">
      {/* ── HÉROS — le positionnement, puis l'aveu ── */}
      <div style={{display:'grid',gridTemplateColumns:'1.04fr .96fr',gap:'46px',alignItems:'center',paddingBottom:'14px'}}>
        <div>
          <SiteEyebrow>Formateur · consultant · Dakar</SiteEyebrow>
          <SiteDisplay size={60} lines={['Je suis','Max-Morrys.']} style={{marginTop:'9px'}} />
          <p className="rv" style={{'--i':3,fontSize:'17px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'46ch',marginTop:'16px'}}>Je t'aide à maîtriser le marketing digital, le SEO et l'IA — pour le marché francophone d'Afrique de l'Ouest, avec les moyens que tu as vraiment.</p>
          <p className="rv" style={{'--i':4,fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'46ch',marginTop:'14px'}}>Formateur, consultant et créateur de contenu digital basé à Dakar. J'écris les articles, je monte les formations, j'anime le Club, et je réponds aux messages. <b style={{color:'var(--ink)'}}>Il n'y a personne d'autre derrière cette plateforme.</b></p>
          <div className="rv" style={{'--i':5,display:'flex',gap:'12px',marginTop:'24px'}}>
            <Button tone="primary" fullWidth={false} onClick={()=>go&&go('contact')}>Contacte-moi</Button>
            <Button tone="ghost" fullWidth={false} onClick={()=>go&&go('formations')}>Voir les formations</Button>
          </div>
        </div>
        <div className="rv-s" style={{'--i':4,height:'400px',borderRadius:'30px',display:'flex',alignItems:'flex-end',padding:'18px',
          background:'linear-gradient(150deg,#FFDCA8,#FFC9CE 48%,#DFD0FF)',boxShadow:'0 20px 46px rgba(243,139,10,.24)'}}>
          <Slot titre="Portrait à fournir · FR-084" style={{width:'100%',background:'rgba(255,255,255,.9)',borderColor:'rgba(243,139,10,.7)'}}>
            Une photographie réelle, en 4:5, prise à Dakar. Le portrait actuel est généré par IA — sur la seule page dont le métier est d'inspirer confiance, c'est le pire endroit possible pour une image synthétique.
          </Slot>
        </div>
      </div>

      {/* ── CE QUE JE FAIS ── */}
      <SiteBand>
        <SiteDisplay size={34} lines={['Ce que je fais, concrètement.']} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'24px'}}>
          {fait.map(([ico,bg,fg,titre,txt],i)=>(
            <GlassPanel level="flat" key={titre} padding={24} className="rv" style={{'--i':i+1}}>
              <span style={{width:'38px',height:'38px',borderRadius:'12px',background:bg,display:'grid',placeItems:'center'}}>
                <Icon name={ico} size={19} color={fg} strokeWidth={2.2} />
              </span>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:'13px 0 0'}}>{titre}</p>
              <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>{txt}</p>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>

      {/* ── PARCOURS — des dates, pas des adjectifs ── */}
      <div style={{marginTop:'44px',display:'grid',gridTemplateColumns:'1fr .9fr',gap:'46px',alignItems:'start'}}>
        <div>
          <SiteDisplay size={34} lines={['Le parcours.']} />
          <p className="rv" style={{'--i':2,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'44ch',marginTop:'11px'}}>Des dates et des faits, pas des adjectifs. C'est ce qu'un visiteur vérifie avant de sortir sa carte.</p>
          <div className="rv" style={{'--i':3,marginTop:'26px',paddingLeft:'22px',borderLeft:'2px solid var(--fill-3)'}}>
            {jalons.map(([date,titre,txt],i)=>(
              <div key={titre} style={{position:'relative',paddingBottom:i===jalons.length-1?0:'24px'}}>
                <span style={{position:'absolute',left:'-29px',top:'5px',width:'12px',height:'12px',borderRadius:'50%',
                  background:'var(--surface-page)',border:'2.5px solid var(--mm-orange)'}} />
                <span className="mm-num" style={{display:'block',fontSize:'11px',letterSpacing:'.1em',textTransform:'uppercase',color:'var(--text-faint)'}}>{date}</span>
                <b style={{display:'block',fontSize:'15.5px',fontWeight:700,marginTop:'3px'}}>{titre}</b>
                <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'5px 0 0',maxWidth:'52ch'}}>{txt}</p>
              </div>
            ))}
          </div>
          <Slot titre="Trois à cinq jalons à ajouter" style={{marginTop:'18px'}}>
            Formation initiale et établissement · premier poste, avec l'employeur et les années · poste actuel s'il est public · une réalisation qu'on peut aller vérifier. <b style={{color:'var(--ink)'}}>Je ne les invente pas, et je ne les reprends pas d'un annuaire tiers.</b>
          </Slot>
        </div>
        <div>
          <GlassPanel level="hero" padding={26} className="rv" style={{'--i':4}}>
            <SiteEyebrow style={{margin:0}}>Ce que j'ai publié, au 30 août</SiteEyebrow>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginTop:'14px'}}>
              {production.map(([n,l])=>(
                <div key={l}>
                  <p className="mm-num" style={{fontSize:'32px',margin:0}}>{n}</p>
                  <p style={{fontSize:'12.5px',color:'var(--text-muted)',margin:0}}>{l}</p>
                </div>
              ))}
            </div>
            <div style={{height:'1px',background:'var(--border-hair)',margin:'18px 0'}} />
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Ce sont des chiffres de production, pas d'audience. Je ne t'annonce ni élèves, ni vues, ni chiffre d'affaires : <b style={{color:'var(--ink)'}}>la plateforme vient d'ouvrir</b>, et un chiffre gonflé se vérifie en trente secondes.</p>
          </GlassPanel>
          <GlassPanel level="flat" padding={24} className="rv" style={{'--i':5,marginTop:'16px'}}>
            <SiteEyebrow style={{margin:0}}>Pourquoi je travaille seul</SiteEyebrow>
            <p style={{fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'9px 0 0'}}>Parce que je préfère répondre moi-même. Ça explique tout ce qui est plafonné ici : le quota du répétiteur, les places en atelier, le rythme de publication. <b style={{color:'var(--ink)'}}>Rien n'est illimité parce que rien ne peut l'être</b> — et je préfère l'écrire que te le faire découvrir après.</p>
          </GlassPanel>
        </div>
      </div>

      {/* ── ARBRE DE MARQUE ── */}
      <SiteBand style={{marginTop:'44px'}}>
        <SiteDisplay size={34} lines={['Où tout ça se range.']} />
        <p className="rv" style={{'--i':1,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'60ch',marginTop:'10px'}}>Max-Morrys est une marque de MY ONOMA SARL. Deux autres practices existent à côté, et elles ne font pas la même chose.</p>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px',marginTop:'22px'}}>
          {practices.map(([badge,nom,txt,bg,fg],i)=>(
            <GlassPanel level="flat" key={nom} padding={24} className="rv" style={{'--i':i+2,borderColor:fg?'rgba(180,35,31,.24)':undefined}}>
              <Tag style={bg?{background:bg,color:fg}:undefined}>{badge}</Tag>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:'11px 0 0'}}>{nom}</p>
              <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>{txt}</p>
            </GlassPanel>
          ))}
        </div>
        <GlassPanel level="flat" padding={22} className="rv" style={{'--i':5,marginTop:'18px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'24px'}}>
            <div><p style={{fontSize:'12.5px',color:'var(--text-muted)',margin:0}}>Immatriculée</p><p className="mm-num" style={{fontSize:'18px',margin:'2px 0 0'}}>11/04/2022</p></div>
            <div><p style={{fontSize:'12.5px',color:'var(--text-muted)',margin:0}}>Siège</p><p style={{fontSize:'18px',fontWeight:600,margin:'2px 0 0'}}>Dakar, Sénégal</p></div>
            <div><p style={{fontSize:'12.5px',color:'var(--text-muted)',margin:0}}>Piliers</p><p style={{fontSize:'18px',fontWeight:600,margin:'2px 0 0'}}>BUILD · GROW · OWN</p></div>
          </div>
        </GlassPanel>
      </SiteBand>

      {/* ── OÙ ME TROUVER — un seul profil est déclaré, les autres restent vides ── */}
      <div style={{marginTop:'44px',display:'grid',gridTemplateColumns:'.95fr 1.05fr',gap:'44px',alignItems:'center'}}>
        <div>
          <SiteDisplay size={34} lines={['Où me trouver.']} />
          <p className="rv" style={{'--i':2,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'40ch',marginTop:'11px'}}>Je publie ailleurs aussi. Si tu préfères me suivre là-bas, garde tes habitudes — je ne t'obligerai pas à revenir ici.</p>
          <Slot titre="Liens à confirmer" style={{marginTop:'18px'}}>
            Seul <b style={{color:'var(--ink)'}}>@max_morrys</b> est déclaré dans le code de la page. Les autres profils sont laissés vides plutôt que de deviner une adresse.
          </Slot>
        </div>
        <GlassPanel level="flat" padding={24} className="rv" style={{'--i':3}}>
          {reseaux.map(([bg,nom,detail,ton,etat,path],i)=>(
            <div key={nom} style={{display:'flex',alignItems:'center',gap:'12px',padding:'11px 0',
              borderTop:i?'1px solid var(--border-hair)':0}}>
              <span style={{width:'34px',height:'34px',borderRadius:'11px',background:bg,display:'grid',placeItems:'center',flex:'0 0 auto'}}>
                {path
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff"><path d={path} /></svg>
                  : <Icon name={nom==='YouTube'?'play':'chat'} size={16} color="#fff" />}
              </span>
              <div style={{flex:1}}>
                <b style={{display:'block',fontSize:'14px'}}>{nom}</b>
                <span className={nom==='X'?'mm-num':undefined} style={{fontSize:'12px',color:'var(--text-muted)'}}>{detail}</span>
              </div>
              <Tag tone={ton}>{etat}</Tag>
            </div>
          ))}
        </GlassPanel>
      </div>

      {/* ── APPEL FINAL ── */}
      <div className="rv" style={{marginTop:'44px',padding:'34px',borderRadius:'var(--r-xl)',color:'#fff',
        background:'linear-gradient(140deg,#F38B0A,#FF6E7F 58%,#6C23DD)',boxShadow:'0 20px 48px rgba(243,139,10,.3)',
        display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:'36px',alignItems:'center'}}>
        <div>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'33px',letterSpacing:'-.03em',lineHeight:1.06,margin:0}}>Tu sais maintenant<br />qui écrit tout ça.</p>
          <p style={{fontSize:'15px',color:'rgba(255,255,255,.88)',margin:'11px 0 0',maxWidth:'50ch'}}>Commence par le blog, c'est gratuit et il y a <b className="mm-num">46</b> articles. Ou écris-moi directement — c'est moi qui lis.</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <Button style={{background:'#fff',color:'var(--ink)'}} onClick={()=>go&&go('blog')}>Lire le blog</Button>
          <Button style={{background:'rgba(255,255,255,.16)',color:'#fff',border:'1px solid rgba(255,255,255,.3)'}} onClick={()=>go&&go('contact')}>Contacte-moi</Button>
        </div>
      </div>
    </Page>
  );
}

const MM_EXPORT = {Accueil,Blog,Article,Presence,Agence,Apropos};
Object.assign(window, MM_EXPORT);
window.MMSITE = Object.assign(window.MMSITE||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('PagesCore.js');
