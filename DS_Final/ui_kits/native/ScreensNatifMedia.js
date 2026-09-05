const { GlassPanel, TerritoryCard, Button, Segmented, ChipRow, LessonRow, MediaCard, SubNav, PayOption, StepDots, PriceBlock, DocLine, CheckLine, Tag, StatTile, Pipeline, Field, Avatar, TabBar, Mesh, Icon, IconButton, PillButton, Wordmark } = window.DS;
/* `ONGLETS` vient de ScreensNatifApp.js, chargé avant celui-ci. */

/* ══════════════════════════════════════════════════════════════════════════════
   PORTAGE — LOT 4, LE DERNIER. Pôle média, Présence Digitale, console support.

   Le gain décisif est dans le pôle média, et il n'a rien à voir avec l'apparence :
   **un podcast dans un navigateur s'arrête quand on verrouille le téléphone.** En natif
   il continue. Pour un contenu de 34 minutes écouté dans un taxi, ce n'est pas une
   amélioration, c'est la différence entre utilisable et inutilisable.

   Deux surfaces en découlent, qui n'existent nulle part côté web : le mini-lecteur
   persistant au-dessus de la barre d'onglets, et l'écran verrouillé.

   La console est portée en SOUS-ENSEMBLE assumé — les cinq écrans du rôle support, ceux
   qu'on traite debout. Les quatorze écrans d'administration restent au tableau de bord
   desktop 1440 px : dix-neuf écrans de gestion sur un téléphone, pour un opérateur unique
   qui travaille au clavier, seraient une régression déguisée en couverture.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ─── Mini-lecteur : la surface que le web n'avait pas. Il vit au-dessus de la barre
       d'onglets et suit la personne d'un écran à l'autre. ─── */
function MiniLecteur({os,safeBottom}){
  return (
    <div style={{position:'absolute',left:0,right:0,bottom:'calc(var(--tabbar-h) + '+safeBottom+'px)',
      zIndex:8,padding:'9px 14px',display:'flex',alignItems:'center',gap:'11px',
      background:'var(--tabbar-bg)',
      backdropFilter:'blur(var(--glass-blur-chrome)) saturate(180%)',WebkitBackdropFilter:'blur(var(--glass-blur-chrome)) saturate(180%)',
      borderTop:'1px solid var(--tabbar-brd)'}}>
      <span style={{width:'38px',height:'38px',borderRadius:'10px',flex:'0 0 auto',
        background:'linear-gradient(140deg,#6C23DD,#0057BC 62%,#02AC9C)'}} />
      <div style={{flex:1,minWidth:0}}>
        <p style={{fontSize:'13px',fontWeight:600,margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Vendre sans budget pub</p>
        <p className="mm-num" style={{fontSize:'10.5px',color:'var(--text-muted)',margin:0}}>08:12 / 34:20</p>
      </div>
      <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Pause" style={{width:'40px',height:'40px',
        borderRadius:'50%',background:'var(--ink)',display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}>
        <span style={{display:'flex',gap:'3px'}}>
          <i style={{width:'3px',height:'13px',background:'#fff',borderRadius:'1px',display:'block'}} />
          <i style={{width:'3px',height:'13px',background:'#fff',borderRadius:'1px',display:'block'}} />
        </span>
      </span>
    </div>
  );
}

/* ══ 1 · PÔLE MÉDIA ══ */
function NatMediaPole({os}){
  const g = NATIF[os];
  return (
    <NativeScreen os={os} territory="transforme"
      droite={<IconButton label="Chercher"><Icon name="search" size={17} strokeWidth={2.4} /></IconButton>}
      tabbar={<TabBar items={ONGLETS()} active="Club" />}>
      <div className="rv" style={{marginTop:'6px'}}>
        <SubNav items={[{label:'Écouter & regarder'},{label:'Le Club',color:'#6C23DD'}]} active="Écouter & regarder" />
      </div>
      <NSourcil style={{'--i':1,marginTop:'18px'}}>Je te transforme · gratuit</NSourcil>
      <NTitre size={27} lines={["DES GENS D'ICI",'QUI RACONTENT']} />
      <NChapo style={{'--i':4}}>Pas de méthode, pas de tutoriel — ça, c'est le blog. Ici, des gens qui vendent vraiment quelque chose racontent ce qui a marché.</NChapo>
      <div className="rv" style={{'--i':5,display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
        <Tag tone="ok">Écoute gratuite, sans compte</Tag>
        <Tag tone="ok">Continue écran verrouillé</Tag>
      </div>

      <div className="rv" style={{'--i':6,marginTop:'18px'}}>
        <MediaCard format="audio" artHeight={150} titleSize={20}
          eyebrow="Podcast · épisode 1 · 6 août"
          title="Vendre sans budget pub, avec Fatou D."
          body="Elle a arrêté la publicité payante pendant trois mois pour voir. Le chiffre n'a pas bougé."
          cost={['34:20','31 Mo','Transcription · 0 Mo']}
          actions={<><Button tone="transforme" size="sm">Écouter</Button><Button tone="quiet" size="sm">Transcription</Button></>} />
      </div>
      <div className="rv" style={{'--i':7,marginTop:'12px'}}>
        <MediaCard format="video" badge="Vidéo · 16:9" artHeight={126}
          eyebrow="Vidéo · 12 juillet" title="Trois heures au marché Sandaga"
          cost={['18:04','96 Mo en HD','24 Mo en 480p']} />
      </div>

      <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'16px',marginBottom:'70px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que l'app change ici</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Sur le site, un épisode <b style={{color:'var(--ink)'}}>s'arrête quand tu verrouilles ton téléphone</b>. Ici il continue, et les commandes restent sur l'écran verrouillé. Pour 34 minutes écoutées dans un taxi, c'est la seule chose qui compte.</p>
      </GlassPanel>

      <MiniLecteur os={os} safeBottom={g.bottom} />
    </NativeScreen>
  );
}

/* ══ 2 · ÉPISODE ══
   La transcription par défaut reste la décision du web — 0 Mo contre 31. Ce qui s'ajoute :
   le téléchargement et la vitesse de lecture, deux choses qu'un navigateur ne garde pas. */
function NatMediaEpisode({os}){
  return (
    <NativeScreen os={os} territory="transforme" retour="Écouter" titre={os==='android'?'Épisode 1':null}
      droite={<IconButton label="Partager"><Icon name="share" size={17} strokeWidth={2} /></IconButton>}>
      <NSourcil style={{marginTop:'6px'}}>Podcast · épisode 1</NSourcil>
      <NTitre size={27} lines={['Vendre sans','budget pub.']} />
      <p className="mm-num rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'10px'}}>6 août 2026 · 34:20 · avec Fatou D.</p>

      <div className="rv-s" style={{'--i':5,marginTop:'16px',borderRadius:'var(--r-media)',padding:'18px',
        background:'linear-gradient(140deg,#6C23DD,#0057BC 62%,#02AC9C)',boxShadow:'0 14px 34px rgba(108,35,221,.28)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'16px',justifyContent:'center'}}>
          <span style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(255,255,255,.22)',
            display:'grid',placeItems:'center',color:'#fff',fontFamily:'var(--f-mono)',fontSize:'10px',fontWeight:700}}>−15</span>
          <span style={{width:'62px',height:'62px',borderRadius:'50%',background:'rgba(255,255,255,.92)',display:'grid',placeItems:'center'}}>
            <span style={{display:'flex',gap:'4px'}}>
              <i style={{width:'5px',height:'21px',background:'#0E1116',borderRadius:'2px',display:'block'}} />
              <i style={{width:'5px',height:'21px',background:'#0E1116',borderRadius:'2px',display:'block'}} />
            </span>
          </span>
          <span style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(255,255,255,.22)',
            display:'grid',placeItems:'center',color:'#fff',fontFamily:'var(--f-mono)',fontSize:'10px',fontWeight:700}}>+15</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'9px',marginTop:'16px',color:'#fff',
          fontFamily:'var(--f-mono)',fontSize:'11px'}}>
          <span>08:12</span>
          <span style={{flex:1,height:'3px',borderRadius:'2px',background:'rgba(255,255,255,.35)'}}>
            <b className="bar-fill" style={{display:'block',width:'8%',height:'100%',background:'#fff',borderRadius:'2px'}} />
          </span>
          <span>34:20</span>
        </div>
      </div>

      {/* Ce que le navigateur ne garde pas d'une session à l'autre. */}
      <div className="rv" style={{'--i':6,display:'flex',gap:'8px',marginTop:'14px'}}>
        <Button tone="quiet" size="sm" fullWidth={false} style={{flex:1}}>
          <Icon name="download" size={16} strokeWidth={2.2} /> Télécharger · 31 Mo</Button>
        <Button tone="quiet" size="sm" fullWidth={false} style={{flex:'0 0 auto'}}>1×</Button>
      </div>

      <div className="rv" style={{'--i':7,marginTop:'16px'}}>
        <Segmented options={['Transcription','Chapitres','Notes']} value="Transcription" /></div>
      <p className="rv" style={{'--i':8,fontSize:'12px',color:'var(--text-muted)',lineHeight:1.5,marginTop:'12px'}}>
        Affichée par défaut : elle se lit sans charger l'audio — <b className="mm-num" style={{color:'var(--ink)'}}>0 Mo</b> contre 31.</p>

      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':9,marginTop:'12px'}}>
        <LessonRow state="plain" meta="00:42" title="Fatou : « Je payais 15 000 par semaine en pub, et je vendais autant qu'avant. »" />
        <LessonRow state="plain" meta="04:18" title="« La première cliente venue de Google avait cherché cosmétique Almadies. »" />
        <LessonRow state="plain" meta="11:05" title="La différence entre une page Facebook et une fiche Google." />
        <LessonRow state="plain" meta="28:12" title="Ce qu'elle referait autrement, et ce qu'elle ne referait pas." last />
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 3 · ÉCRAN VERROUILLÉ ══
   La surface la plus native du kit, avec le widget. Elle n'a AUCUN équivalent web : un
   navigateur ne peut pas y écrire. Et les deux plateformes la traitent différemment —
   iOS pose un lecteur pleine largeur sous une horloge géante ; Android pose une carte de
   notification média avec sa propre découpe. */
function NatEcranVerrouille({os}){
  const g = NATIF[os];
  const ios = os === 'ios';
  return (
    <div className={'play '+(ios?'':'andro ')+'dk'} style={{position:'relative',width:g.w+'px',height:g.h+'px',
      overflow:'hidden',isolation:'isolate',background:'#0B0E13',fontFamily:'var(--f-body)',color:'#fff'}}>
      {/* Fond d'écran de la personne, pas un maillage de marque : on est chez elle. */}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(170deg,#241C4E,#0B0E13 58%,#12294D)'}} />
      {ios ? <EncocheIos /> : <PoinconAndro />}
      {ios ? <StatusIos dark /> : <StatusAndro dark />}

      {/* Le décalage de zone sûre est DANS la boîte, pas en marge : une marge déplace la
          boîte au lieu de la creuser, et avec height:100% elle déborde d'autant — le bas du
          lecteur, donc les commandes, sortait du cadre. Une seule déclaration `padding`,
          jamais un `paddingTop` suivi du raccourci : dans un objet de style, la dernière
          clé gagne et le raccourci remet le haut à zéro. */}
      <div style={{position:'relative',zIndex:4,boxSizing:'border-box',
        padding:(g.top+(ios?26:34))+'px '+(ios?'22px':'18px')+' 0',
        display:'flex',flexDirection:'column',height:'100%'}}>

        {/* L'horloge : géante et centrée sur iOS, alignée à gauche sur Android. */}
        <div style={{textAlign:ios?'center':'left'}}>
          {!ios && <p className="mm-num" style={{fontSize:'15px',color:'rgba(255,255,255,.72)',margin:0}}>vendredi 4 septembre</p>}
          <p className="mm-num" style={{fontSize:ios?'82px':'62px',fontWeight:ios?600:400,letterSpacing:'-.04em',
            lineHeight:1,margin:ios?0:'4px 0 0',color:'#fff'}}>9:41</p>
          {ios && <p style={{fontSize:'19px',color:'rgba(255,255,255,.86)',margin:'2px 0 0'}}>vendredi 4 septembre</p>}
        </div>

        <div style={{flex:1}} />

        {/* Le lecteur. iOS : pleine largeur, pochette à gauche, curseur épais.
            Android : carte de notification média, avec l'icône de l'app en petit. */}
        {ios ? (
          <div className="rv-s" style={{'--i':1,marginBottom:'26px'}}>
            <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
              <span style={{width:'58px',height:'58px',borderRadius:'12px',flex:'0 0 auto',
                background:'linear-gradient(140deg,#6C23DD,#0057BC 62%,#02AC9C)',
                boxShadow:'0 6px 18px rgba(0,0,0,.4)'}} />
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:'16px',fontWeight:600,margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Vendre sans budget pub</p>
                <p style={{fontSize:'14px',color:'rgba(255,255,255,.66)',margin:'2px 0 0'}}>Rysmo · avec Fatou D.</p>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginTop:'16px',
              fontFamily:'var(--f-mono)',fontSize:'11px',color:'rgba(255,255,255,.62)'}}>
              <span>08:12</span>
              <span style={{flex:1,height:'7px',borderRadius:'4px',background:'rgba(255,255,255,.24)'}}>
                <b className="bar-fill" style={{display:'block',width:'8%',height:'100%',background:'#fff',borderRadius:'4px'}} />
              </span>
              <span>−26:08</span>
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-around',marginTop:'16px'}}>
              <span style={{fontFamily:'var(--f-mono)',fontSize:'13px',fontWeight:700,color:'rgba(255,255,255,.9)'}}>−15</span>
              <span style={{display:'flex',gap:'6px'}}>
                <i style={{width:'6px',height:'30px',background:'#fff',borderRadius:'2px',display:'block'}} />
                <i style={{width:'6px',height:'30px',background:'#fff',borderRadius:'2px',display:'block'}} />
              </span>
              <span style={{fontFamily:'var(--f-mono)',fontSize:'13px',fontWeight:700,color:'rgba(255,255,255,.9)'}}>+15</span>
            </div>
          </div>
        ) : (
          <div className="rv-s" style={{'--i':1,marginBottom:'30px',borderRadius:'26px',padding:'15px',
            background:'rgba(255,255,255,.11)',border:'1px solid rgba(255,255,255,.14)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'9px',marginBottom:'12px'}}>
              <Wordmark brand="rysmo" size={13} night tail="#fff" />
              <span style={{fontSize:'11.5px',color:'rgba(255,255,255,.6)'}}>· maintenant</span>
            </div>
            <div style={{display:'flex',gap:'13px',alignItems:'center'}}>
              <span style={{width:'50px',height:'50px',borderRadius:'10px',flex:'0 0 auto',
                background:'linear-gradient(140deg,#6C23DD,#0057BC 62%,#02AC9C)'}} />
              <div style={{flex:1,minWidth:0}}>
                <p style={{fontSize:'14.5px',fontWeight:600,margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Vendre sans budget pub</p>
                <p style={{fontSize:'12.5px',color:'rgba(255,255,255,.66)',margin:'2px 0 0'}}>avec Fatou D.</p>
              </div>
              <span style={{width:'42px',height:'42px',borderRadius:'50%',background:'rgba(255,255,255,.92)',
                display:'grid',placeItems:'center',flex:'0 0 auto'}}>
                <span style={{display:'flex',gap:'3px'}}>
                  <i style={{width:'4px',height:'15px',background:'#0E1116',borderRadius:'1px',display:'block'}} />
                  <i style={{width:'4px',height:'15px',background:'#0E1116',borderRadius:'1px',display:'block'}} />
                </span>
              </span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'9px',marginTop:'13px',
              fontFamily:'var(--f-mono)',fontSize:'10.5px',color:'rgba(255,255,255,.6)'}}>
              <span>08:12</span>
              <span style={{flex:1,height:'4px',borderRadius:'2px',background:'rgba(255,255,255,.24)'}}>
                <b className="bar-fill" style={{display:'block',width:'8%',height:'100%',background:'#fff',borderRadius:'2px'}} />
              </span>
              <span>34:20</span>
            </div>
          </div>
        )}
      </div>

      {ios ? <AccueilIos dark /> : <NavAndro dark />}
    </div>
  );
}

/* ══ 4 · PRÉSENCE DIGITALE ══
   L'ancrage désamorcé AVANT le prix, comme sur le web. Aucune règle de magasin ici : un
   pack se contracte hors application, ce n'est pas du contenu numérique consommé dedans. */
function NatPresence({os}){
  const [rep,setRep] = React.useState('Bouche-à-oreille et passage');
  return (
    <NativeScreen os={os} territory="digitalise" titre={os==='android'?'Présence Digitale':null}
      droite={<IconButton label="WhatsApp"><Icon name="chat" size={17} strokeWidth={2} /></IconButton>}>
      <NSourcil style={{marginTop:'6px'}}>Je te digitalise</NSourcil>
      <NTitre size={28} lines={['TA BOUTIQUE,','TROUVABLE','SUR GOOGLE.']} />
      <NChapo style={{'--i':5}}>Tu vends déjà sur WhatsApp. Je m'occupe de ce que tu ne peux pas faire depuis ton téléphone.</NChapo>

      <GlassPanel level="hero" padding={19} className="rv" style={{'--i':6,marginTop:'18px'}}>
        <NSourcil style={{color:'var(--mm-teal-t)'}}>La question que tout le monde pose</NSourcil>
        <p style={{fontWeight:700,fontSize:'15px',lineHeight:1.3,margin:'7px 0 0'}}>« Une agence me vend un site 400 000 F une fois. Toi c'est combien la première année ? »</p>
        <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'11px 0 0'}}>Réponse avant que tu remplisses quoi que ce soit : <b className="mm-num" style={{color:'var(--ink)'}}>250 000 F</b> pour le pack seul, une fois. L'accompagnement mensuel est une décision séparée, que tu prends après la mise en ligne — pas maintenant.</p>
      </GlassPanel>

      <NSourcil style={{'--i':7,marginTop:'24px'}}>Trois questions, une recommandation</NSourcil>
      <GlassPanel padding={19} className="rv" style={{'--i':8,marginTop:'10px'}}>
        <StepDots total={3} current={2} style={{marginBottom:'16px'}} />
        <p style={{fontWeight:700,fontSize:'15.5px',margin:0}}>Tes clients te trouvent comment aujourd'hui ?</p>
        <div style={{display:'grid',gap:'9px',marginTop:'14px'}}>
          {['Bouche-à-oreille et passage','WhatsApp et Facebook','Je ne sais pas trop'].map(o=>(
            <PayOption key={o} title={o} on={rep===o} onClick={()=>setRep(o)} style={{minHeight:'56px'}} />
          ))}
        </div>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',margin:'13px 0 0'}}>« Je ne sais pas » est une réponse valable : elle mène aussi à une recommandation.</p>
      </GlassPanel>

      <div className="rv" style={{'--i':9,marginTop:'18px'}}>
        <TerritoryCard first territory="digitalise" meta="Recommandé pour toi" title="Pack Visible">
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'15px'}}>
            <PriceBlock amount="250 000" strike="295 000" size={25} note="Une fois · lancement" />
            <Button tone="digitalise" size="sm" fullWidth={false}>Mon devis</Button>
          </div>
        </TerritoryCard>
      </div>
      <p className="rv" style={{'--i':10,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'14px'}}>
        Un pack se contracte hors de l'application : ce n'est pas du contenu numérique consommé
        dedans, donc aucune règle de magasin ne s'y applique. Le devis part sur WhatsApp.</p>
    </NativeScreen>
  );
}

/* ══ 5 · DEVIS PARTAGEABLE ══
   Consultable sans compte, figé à l'émission. En natif, le partage passe par la feuille
   système — donc un bouton au lieu de deux, comme pour le certificat. */
function NatDevis({os}){
  return (
    <NativeScreen os={os} territory="digitalise" retour="Offre" titre={os==='android'?'Ton devis':null}
      droite={<IconButton label="Partager"><Icon name="share" size={17} strokeWidth={2} /></IconButton>}>
      <NSourcil style={{marginTop:'6px'}}>Devis · consultable sans compte</NSourcil>
      <NTitre size={27} lines={['TON DEVIS,','PACK VISIBLE.']} />
      <p className="mm-num rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'10px'}}>maxmorrys.me/devis/MM-D-4831</p>

      <GlassPanel padding={19} className="rv" style={{'--i':5,marginTop:'16px'}}>
        <DocLine label="Fiche Google optimisée" value="incluse" />
        <DocLine label="Site vitrine · 5 pages" value="incluse" />
        <DocLine label="Photos et textes" value="incluse" />
        <DocLine label="Prise en main · 1 h" value="incluse" />
        <DocLine label="Nom de domaine · 1 an" value="incluse" last />
        <div style={{height:'1px',background:'var(--border-hair)',margin:'14px 0'}} />
        <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px'}}>
          <PriceBlock amount="250 000" size={28} note="Une fois · promotion de lancement" />
          <Tag tone="ok">Valide 30 j</Tag>
        </div>
        <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'10px 0 0'}}>Émis le 05/09/2026 · valable jusqu'au 05/10/2026</p>
      </GlassPanel>

      <Button tone="digitalise" className="rv" style={{'--i':6,marginTop:'18px'}}>Continuer sur WhatsApp</Button>
      <Button tone="quiet" fullWidth className="rv" style={{'--i':6,marginTop:'9px'}}>
        <Icon name="share" size={16} strokeWidth={2.2} /> Partager le devis</Button>

      <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'18px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que ce document contient, et ne contient pas</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Aucune donnée personnelle. Son contenu est <b style={{color:'var(--ink)'}}>figé à l'émission</b> : une évolution de la grille ne réécrit pas un devis déjà envoyé.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 6 · CONSOLE, RÔLE SUPPORT ══
   Le sous-ensemble assumé : cinq écrans sur dix-neuf, ceux qu'on traite debout. Le motif
   en trois zones tient — filtre par statut, une action par ligne, et un pied qui dit ce que
   l'écran ne couvre pas. */
function NatConsoleSupport({os}){
  return (
    <NativeScreen os={os} territory="nuit" dark titre={os==='android'?'Console · support':null}
      retour={os==='ios'?'Profil':null}
      droite={<IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton>}>
      <NSourcil style={{marginTop:'6px'}}>Rôle support · 5 écrans sur 19</NSourcil>
      <NTitre size={27} lines={['À traiter','aujourd\u2019hui.']} />

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'18px'}}>
        <div className="rv" style={{'--i':1}}><StatTile dark label="Prospects" value="1" foot="non qualifié" /></div>
        <div className="rv" style={{'--i':2}}><StatTile dark label="Messages" value="0" foot="depuis l'origine" /></div>
      </div>

      <div className="rv" style={{'--i':3,marginTop:'14px'}}>
        <Pipeline active="à traiter 1" stages={['tout 1','à traiter 1','clos 0']} />
      </div>

      <GlassPanel level="night" padding="4px 16px" className="rv" style={{'--i':4,marginTop:'14px'}}>
        <LessonRow icon={<Icon name="case" size={14} color="#FFB24D" />} iconBackground="rgba(255,178,77,.2)"
          title="Boutique de cosmétiques · Almadies" meta="Pack Visible · 250 000 F · « nouveau » depuis le 6 août"
          trailing={<Button size="sm" tone="quiet">Qualifier</Button>} last />
      </GlassPanel>

      <NSourcil style={{'--i':5,marginTop:'24px'}}>Ce que ton rôle atteint</NSourcil>
      <GlassPanel level="night" padding="4px 16px" className="rv" style={{'--i':6,marginTop:'10px'}}>
        {[['Messages','0'],['Témoignages','0'],['Rendez-vous','0'],['Prospects','1'],['Projets','0']].map(([t,n],i,a)=>(
          <LessonRow key={t} icon={<Icon name="check" size={13} color="#3FD9C6" strokeWidth={3.4} />}
            iconBackground="rgba(63,217,198,.18)" title={t} last={i===a.length-1}
            trailing={<span className="mm-num" style={{fontSize:'12.5px',color:'var(--text-muted)'}}>{n}</span>} />
        ))}
      </GlassPanel>

      <GlassPanel level="night" padding={16} className="rv" style={{'--i':7,marginTop:'14px',borderColor:'rgba(255,255,255,.09)'}}>
        <NSourcil style={{fontSize:'10px',marginBottom:'6px'}}>Ce que cet écran ne couvre pas</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Les quatorze autres écrans d'administration — publication, transactions, contenu, réglages — restent au <b style={{color:'var(--text-body)'}}>tableau de bord desktop</b>. Ils se travaillent au clavier, sur deux ou trois colonnes ; les porter sur un téléphone serait une régression déguisée en couverture.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 7 · /403 ══
   Ce que les règles de la base ont déjà refusé. Un garde de route est du code client :
   il cache, il n'interdit pas. */
function NatInterdit({os}){
  return (
    <NativeScreen os={os} territory="nuit" dark retour={os==='ios'?'Console':null}
      titre={os==='android'?'Accès refusé':null}>
      <p className="mm-num rv-s" style={{fontSize:'86px',lineHeight:1,color:'rgba(236,240,245,.14)',
        margin:'14px 0 0',letterSpacing:'-.04em'}}>403</p>
      <NTitre size={26} lines={["Cette page n'est",'pas pour ce rôle.']} />
      <NChapo style={{'--i':4}}>Ton rôle est <b className="mm-num" style={{color:'var(--text-body)'}}>support</b>. Il atteint exactement cinq écrans, et celui-ci n'en fait pas partie.</NChapo>

      <NSourcil style={{'--i':5,marginTop:'22px'}}>Ce que le rôle support atteint</NSourcil>
      <GlassPanel level="night" padding="4px 16px" className="rv" style={{'--i':6,marginTop:'10px'}}>
        {['Messages','Témoignages','Rendez-vous','Prospects','Projets'].map((t,i,a)=>(
          <LessonRow key={t} icon={<Icon name="check" size={13} color="#3FD9C6" strokeWidth={3.4} />}
            iconBackground="rgba(63,217,198,.18)" title={t} last={i===a.length-1}
            trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} />
        ))}
      </GlassPanel>

      <GlassPanel level="night" padding={17} className="rv" style={{'--i':7,marginTop:'16px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que cette page est, exactement</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Un garde de route est du code client : il <b style={{color:'var(--text-body)'}}>cache</b>, il n'interdit pas. Le vrai cloisonnement est dans les règles de la base — cette page dit simplement ce qu'elles ont déjà refusé.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

const MM_EXPORT = {MiniLecteur,NatMediaPole,NatMediaEpisode,NatEcranVerrouille,NatPresence,NatDevis,NatConsoleSupport,NatInterdit};
Object.assign(window, MM_EXPORT);
window.MMNAT = Object.assign(window.MMNAT||{}, MM_EXPORT);
