const { GlassPanel, TerritoryCard, Button, Switch, LessonRow, ProgressBar, Tag, Icon, IconButton, PillButton, Avatar, CheckLine, DocLine, PriceBlock, TabBar, Segmented, Field, Wordmark, Mesh } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LES NEUF ÉCRANS QUI N'EXISTENT QU'EN NATIF.

   Aucun n'a d'équivalent web : ce sont les seuls écrans réellement NOUVEAUX du virage.
   Chacun est écrit UNE fois et rendu dans les deux châssis — c'est la démonstration
   que « la marque d'abord » tient : si un de ces corps avait besoin de deux versions,
   la décision serait fausse.

   Deux d'entre eux changent le produit, pas seulement l'emballage :

   · PERMISSIONS — le web n'a AUCUN canal d'envoi. Toute la conception s'est pliée à ça :
     la reprise est le premier objet de l'espace parce que la relance ne pouvait venir que
     de l'écran. La notification poussée donne enfin ce canal. C'est le premier vrai gain
     du natif, et il justifie à lui seul le virage.

   · MUR DE PAIEMENT — vendre en Wave/OM direct dans l'app fait rejeter l'app
     (App Store 3.1.1, Play Payments). L'app ne vend donc pas : elle ouvre ce qui est
     déjà payé. Le web reste la boutique, l'app est la salle de classe.
   ══════════════════════════════════════════════════════════════════════════════ */

const TABS_NAT = ()=>[
  {label:'Espace',icon:<Icon name="home" size={21} />},
  {label:'Cours',icon:<Icon name="book" size={21} />},
  {label:'Répétiteur',icon:<Icon name="chat" size={21} />},
  {label:'Club',icon:<Icon name="users" size={21} />},
  {label:'Profil',icon:<Icon name="user" size={21} />}
];

/* ══ 1 · LANCEMENT ══
   Aucun indicateur de progression. Le maillage dérive, le mot-symbole est là, et c'est tout :
   une barre de chargement qui n'est branchée sur rien est un mensonge de trois secondes. */
function Lancement({os}){
  return (
    <NativeScreen os={os} territory="transforme" noMesh={false}>
      <div style={{minHeight:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'18px'}}>
        <div className="rv-s"><Wordmark brand="rysmo" size={44} /></div>
        <p className="rv" style={{'--i':3,fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.16em',
          textTransform:'uppercase',color:'var(--text-faint)',margin:0}}>par Max-Morrys · Dakar</p>
      </div>
    </NativeScreen>
  );
}

/* ══ 2 · ONBOARDING ══
   Trois écrans, passables, et surtout : aucun compte demandé. Exiger un compte avant
   d'avoir montré quoi que ce soit, c'est perdre la personne au deuxième écran. */
function Onboarding({os}){
  return (
    <NativeScreen os={os} territory="forme"
      droite={<span className="mm-press-sm" role="button" tabIndex={0} style={{minHeight:'44px',display:'inline-flex',
        alignItems:'center',padding:'0 10px',fontSize:'15px',fontWeight:600,color:'var(--text-muted)',cursor:'pointer'}}>Passer</span>}>
      <div style={{minHeight:'92%',display:'flex',flexDirection:'column'}}>
        <div className="rv-s" style={{'--i':1,height:'220px',borderRadius:'var(--r-xl)',marginTop:'10px',
          background:'linear-gradient(140deg,#0057BC,#6C23DD 58%,#F38B0A)',display:'grid',placeItems:'center',
          boxShadow:'0 16px 38px rgba(0,87,188,.24)'}}>
          <Wordmark brand="rysmo" size={34} night tail="#fff" />
        </div>
        <NSourcil style={{'--i':3,marginTop:'26px'}}>1 sur 3</NSourcil>
        <NTitre size={31} lines={['APPRENDS','QUAND TU PEUX.','HORS RÉSEAU AUSSI.']} />
        <NChapo>Télécharge une leçon en Wi-Fi, regarde-la dans le taxi. Ta progression part toute seule au retour du réseau — tu n'as rien à relancer.</NChapo>
        <div style={{flex:1}} />
        <div className="rv" style={{'--i':6,display:'flex',gap:'7px',justifyContent:'center',marginBottom:'16px'}}>
          {[0,1,2].map(i=><i key={i} style={{width:i===0?'22px':'7px',height:'7px',borderRadius:'4px',
            background:i===0?'var(--ink)':'var(--fill-3)',transition:'width var(--t-ui) var(--ease)'}} />)}
        </div>
        <Button tone="forme" className="rv" style={{'--i':7}}>Continuer</Button>
        <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>
          Aucun compte demandé pour l'instant. Tu peux tout parcourir avant de décider.</p>
      </div>
    </NativeScreen>
  );
}

/* ══ 3 · PERMISSIONS ══
   L'écran le plus important du lot. On explique AVANT d'ouvrir le dialogue système, parce
   qu'iOS ne le laisse poser qu'UNE fois : un refus est définitif, et se rattrape seulement
   dans les réglages, là où personne ne va. */
function Permissions({os}){
  return (
    <NativeScreen os={os} territory="transforme">
      <div style={{minHeight:'100%',display:'flex',flexDirection:'column',justifyContent:'center',paddingBottom:'20px'}}>
        <div className="rv-s" style={{width:'66px',height:'66px',borderRadius:'21px',
          background:'linear-gradient(135deg,#B98CFF,#6C23DD)',display:'grid',placeItems:'center',
          boxShadow:'0 12px 30px rgba(108,35,221,.34)'}}>
          <Icon name="bell" size={28} color="#fff" strokeWidth={2.2} />
        </div>
        <NTitre size={29} lines={['JE PEUX TE','PRÉVENIR QUAND','TU DÉCROCHES ?']} style={{marginTop:'22px'}} />
        <NChapo style={{'--i':5}}>Tu t'arrêtes rarement parce que tu abandonnes. Tu t'arrêtes parce qu'une semaine passe. Une notification à ce moment-là, c'est la seule chose qui marche.</NChapo>

        <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':6,marginTop:'20px'}}>
          <LessonRow state="plain" icon={<Icon name="book" size={14} color="#5A17BE" />} iconBackground="rgba(108,35,221,.12)"
            title="Reprise de cours" meta="après 5 jours sans activité" />
          <LessonRow state="plain" icon={<Icon name="star" size={14} color="#8A4B00" />} iconBackground="rgba(243,139,10,.16)"
            title="Ta série va se casser" meta="le soir du 5e jour, une fois" />
          <LessonRow state="plain" icon={<Icon name="users" size={14} color="#00695E" />} iconBackground="rgba(2,172,156,.16)"
            title="Session du Club dans 1 h" meta="seulement si tu es inscrite" last />
        </GlassPanel>

        <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'14px'}}>
          <NSourcil style={{marginBottom:'6px'}}>Ce que je ne t'enverrai jamais</NSourcil>
          <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>
            Aucune promotion, aucun rappel de panier, aucun « on ne te voit plus ». Trois types,
            ceux du dessus, et tu peux couper chacun séparément dans ton profil.</p>
        </GlassPanel>

        <Button tone="transforme" className="rv" style={{'--i':8,marginTop:'18px'}}>D'accord, demande-moi</Button>
        <Button tone="quiet" fullWidth className="rv" style={{'--i':8,marginTop:'9px'}}>Pas maintenant</Button>
        <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',
          lineHeight:1.5,margin:'12px 0 0'}}>
          {os === 'ios'
            ? 'iOS ne me laisse poser la question qu\u2019une seule fois. « Pas maintenant » la garde pour plus tard ; un refus système, lui, ne se rattrape que dans les Réglages.'
            : 'Android me laisse redemander une fois. Au second refus, ça ne se rattrape que dans les paramètres du téléphone.'}</p>
      </div>
    </NativeScreen>
  );
}

/* ══ 4 · MUR DE PAIEMENT ══
   Wave et Orange Money en direct dans l'app, c'est un rejet en revue : les deux magasins
   imposent l'achat intégré pour du contenu numérique consommé dans l'app. L'app ne vend
   donc rien — elle OUVRE ce qui est déjà payé, et le dit dans la voix de la marque plutôt
   que par un bouton grisé sans explication. */
function MurPaiement({os}){
  return (
    <NativeScreen os={os} territory="forme" retour="Cours" titre={os==='android'?'Référencement local':null}
      droite={<IconButton label="Partager"><Icon name="share" size={17} strokeWidth={2} /></IconButton>}>
      <div className="rv-s" style={{'--i':1,height:'150px',borderRadius:'var(--r-media)',marginTop:'8px',
        background:'linear-gradient(140deg,#0057BC,#6C23DD 58%,#F38B0A)',display:'flex',alignItems:'flex-end',
        padding:'14px',boxShadow:'0 14px 34px rgba(0,87,188,.24)'}}>
        <Tag style={{background:'rgba(255,255,255,.9)',color:'#0E1116'}}>Aperçu · 4 min gratuit</Tag>
      </div>
      <NSourcil style={{'--i':3,marginTop:'20px'}}>SEO · 6 modules · 47 leçons</NSourcil>
      <NTitre size={26} lines={['Référencement local','pour ton commerce']} />

      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':5,marginTop:'18px'}}>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:0}}>
          Je ne peux pas te faire payer ici.</p>
        <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'9px 0 0'}}>
          {os === 'ios' ? 'L\u2019App Store' : 'Google Play'} exige que tout achat fait dans une
          application passe par son propre système de paiement, qui ne connaît ni Wave ni
          Orange&nbsp;Money. Plutôt que de te faire payer en carte avec une commission, je te
          renvoie au site — <b style={{color:'var(--ink)'}}>même prix, tes moyens de paiement</b>.
        </p>
        <div style={{height:'1px',background:'var(--border-hair)',margin:'16px 0'}} />
        <PriceBlock amount="95 000" size={29} note={<>Une fois, accès à vie · ou <b className="mm-num">3 × 31 700</b></>} />
        <Button tone="forme" style={{marginTop:'15px'}}>
          Ouvrir sur maxmorrys.me <Icon name="forward" size={16} strokeWidth={2.6} />
        </Button>
        <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'13px',justifyContent:'center'}}>
          <Tag tone="ok">Wave</Tag><Tag tone="ok">Orange Money</Tag><Tag tone="ok">Carte</Tag>
        </div>
      </GlassPanel>

      <GlassPanel padding={18} className="rv" style={{'--i':6,marginTop:'12px'}}>
        <NSourcil>Après le paiement</NSourcil>
        <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>
          Tu reviens dans l'app et la formation est ouverte — même compte, rien à saisir.
          Si elle ne l'est pas, tire la liste vers le bas.</p>
      </GlassPanel>

      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':7,marginTop:'12px'}}>
        <LessonRow state="current" icon={<Icon name="play" size={13} color="#fff" />}
          iconBackground="linear-gradient(135deg,#0057BC,#6C23DD)"
          title="Pourquoi ta boutique est invisible" meta="module 1 · 4 leçons · 22 min" />
        <LessonRow state="todo" icon={<Icon name="lock" size={13} color="#68727F" strokeWidth={2.4} />}
          title="Ta fiche Google, pas à pas" meta="11 leçons · 1 h 08" />
        <LessonRow state="todo" icon={<Icon name="lock" size={13} color="#68727F" strokeWidth={2.4} />}
          title="Les mots que tapent tes clients" meta="9 leçons · 54 min" last />
      </GlassPanel>
      <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>
        Le module 1 se regarde sans payer, dans l'app, maintenant. C'est ce qui rend ce mur
        supportable : tu juges avant de sortir de l'application.</p>
    </NativeScreen>
  );
}

/* ══ 5 · TÉLÉCHARGEMENTS ET STOCKAGE ══
   Le forfait est compté et l'appareil est petit. Chaque poids est affiché, et l'écran dit
   ce qu'il occupe en tout — pas seulement par leçon. */
function Telechargements({os}){
  return (
    <NativeScreen os={os} territory="forme" retour="Profil" titre="Téléchargements">
      <NSourcil style={{marginTop:'6px'}}>3 leçons hors connexion</NSourcil>
      <NTitre size={27} lines={['21 Mo','sur ton téléphone']} />

      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':4,marginTop:'18px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
          <div style={{flex:1}}>
            <p style={{fontSize:'14px',fontWeight:600,margin:0}}>Télécharger en Wi-Fi seulement</p>
            <p style={{fontSize:'12px',color:'var(--text-muted)',margin:'2px 0 0'}}>Pour ne pas entamer ton forfait.</p>
          </div>
          <Switch on />
        </div>
        <div style={{height:'1px',background:'var(--border-hair)',margin:'14px 0'}} />
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
          <div style={{flex:1}}>
            <p style={{fontSize:'14px',fontWeight:600,margin:0}}>Qualité des vidéos</p>
            <p style={{fontSize:'12px',color:'var(--text-muted)',margin:'2px 0 0'}}>480p suffit pour un cours parlé.</p>
          </div>
          <span className="mm-num" style={{fontSize:'13px',color:'var(--text-muted)'}}>480p</span>
        </div>
      </GlassPanel>

      <NSourcil style={{'--i':5,marginTop:'24px'}}>Sur cet appareil</NSourcil>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':5,marginTop:'10px'}}>
        {[['Choisir tes mots-clés','vidéo 480p · 12 Mo'],['Ce que cherche un client à Dakar','vidéo 480p · 9 Mo'],
          ['Exercice : ta liste de 20 mots','PDF · 180 Ko']].map(([t,m],i,a)=>(
          <LessonRow key={t} state="done" title={t} meta={m} last={i===a.length-1}
            trailing={<span className="mm-press-sm" role="button" tabIndex={0} aria-label={'Supprimer : '+t}
              style={{width:'var(--touch-aa)',height:'var(--touch-aa)',borderRadius:'50%',background:'rgba(180,35,31,.1)',
                display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}>
              <Icon name="trash" size={14} color="#B4231F" strokeWidth={2.2} /></span>} />
        ))}
      </GlassPanel>

      <GlassPanel padding={18} className="rv" style={{'--i':6,marginTop:'14px'}}>
        <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:'12px'}}>
          <span style={{fontSize:'13.5px',color:'var(--text-muted)'}}>Total occupé</span>
          <b className="mm-num" style={{fontSize:'21px'}}>21,2 Mo</b>
        </div>
        <ProgressBar value={4} style={{marginTop:'12px'}} />
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',margin:'8px 0 0'}}>
          sur <b className="mm-num">512 Mo</b> que l'app s'autorise. Au-delà, elle supprime
          d'abord les leçons déjà terminées.</p>
        <Button tone="quiet" fullWidth style={{marginTop:'14px'}}>Tout supprimer</Button>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'12px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que supprimer ne touche pas</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>
          Ta progression, tes notes et tes certificats vivent sur ton compte, pas sur le
          téléphone. Vider le stockage ne fait que retélécharger plus tard.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 6 · LECTEUR PLEIN ÉCRAN ══
   Paysage, donc son propre gabarit — le seul écran du lot qui ne passe pas par NativeScreen.
   Les commandes disparaissent, la transcription reste atteignable : c'est elle qui permet de
   suivre le cours quand le réseau lâche au milieu. */
function LecteurPleinEcran({os}){
  const g = NATIF[os];
  return (
    <div className={'play '+(os==='android'?'andro ':'')} style={{position:'relative',width:g.h+'px',height:g.w+'px',
      background:'#000',overflow:'hidden',fontFamily:'var(--f-body)',color:'#fff',isolation:'isolate'}}>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(140deg,#0057BC,#6C23DD 58%,#F38B0A)',opacity:.9}} />
      {os === 'ios'
        ? <div style={{position:'absolute',top:0,left:'50%',transform:'translateX(-50%)',width:'156px',height:'32px',background:'#000',borderRadius:'0 0 20px 20px',zIndex:9}} />
        : <div style={{position:'absolute',top:'7px',left:'50%',transform:'translateX(-50%)',width:'19px',height:'19px',background:'#000',borderRadius:'50%',zIndex:9}} />}

      <div style={{position:'absolute',inset:0,zIndex:4,display:'flex',flexDirection:'column',
        justifyContent:'space-between',padding:'14px '+(os==='ios'?'44px':'26px')}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'14px'}}>
          <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Fermer le plein écran"
            style={{width:'44px',height:'44px',borderRadius:'50%',background:'rgba(0,0,0,.36)',display:'grid',placeItems:'center',cursor:'pointer'}}>
            <Icon name="close" size={19} color="#fff" strokeWidth={2.4} />
          </span>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:'14.5px',fontWeight:600,margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Les mots que tapent tes clients</p>
            <p className="mm-num" style={{fontSize:'11px',color:'rgba(255,255,255,.7)',margin:0}}>module 3 · leçon 5 · 480p · 9 Mo</p>
          </div>
          <span className="mm-press-sm" role="button" tabIndex={0} style={{minHeight:'44px',display:'inline-flex',alignItems:'center',
            padding:'0 14px',borderRadius:'var(--r-pill)',background:'rgba(0,0,0,.36)',fontSize:'12.5px',fontWeight:600,cursor:'pointer'}}>
            Transcription
          </span>
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'34px'}}>
          <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Reculer de 15 secondes"
            style={{width:'52px',height:'52px',borderRadius:'50%',background:'rgba(0,0,0,.3)',display:'grid',placeItems:'center',
              cursor:'pointer',fontFamily:'var(--f-mono)',fontSize:'11px',fontWeight:700}}>−15</span>
          <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Pause"
            style={{width:'70px',height:'70px',borderRadius:'50%',background:'rgba(255,255,255,.94)',display:'grid',placeItems:'center',cursor:'pointer'}}>
            <span style={{display:'flex',gap:'5px'}}>
              <i style={{width:'6px',height:'24px',background:'#0E1116',borderRadius:'2px',display:'block'}} />
              <i style={{width:'6px',height:'24px',background:'#0E1116',borderRadius:'2px',display:'block'}} />
            </span>
          </span>
          <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Avancer de 15 secondes"
            style={{width:'52px',height:'52px',borderRadius:'50%',background:'rgba(0,0,0,.3)',display:'grid',placeItems:'center',
              cursor:'pointer',fontFamily:'var(--f-mono)',fontSize:'11px',fontWeight:700}}>+15</span>
        </div>

        <div>
          <div style={{display:'flex',alignItems:'center',gap:'11px',fontFamily:'var(--f-mono)',fontSize:'11px'}}>
            <span>03:12</span>
            <span style={{flex:1,height:'4px',borderRadius:'2px',background:'rgba(255,255,255,.32)'}}>
              <b className="bar-fill" style={{display:'block',width:'8%',height:'100%',background:'#fff',borderRadius:'2px'}} />
            </span>
            <span>08:24</span>
            <span className="mm-press-sm" role="button" tabIndex={0} style={{minHeight:'34px',display:'inline-flex',alignItems:'center',
              padding:'0 10px',borderRadius:'var(--r-pill)',background:'rgba(0,0,0,.36)',fontWeight:700,cursor:'pointer'}}>1×</span>
          </div>
          <p style={{fontSize:'11.5px',color:'rgba(255,255,255,.66)',margin:'10px 0 0'}}>
            Le réseau lâche ? La transcription reste lisible et ta position est gardée.</p>
        </div>
      </div>

      {os === 'ios'
        ? <div style={{position:'absolute',bottom:'6px',left:'50%',transform:'translateX(-50%)',width:'134px',height:'5px',background:'#fff',opacity:.5,borderRadius:'3px',zIndex:10}} />
        : <div style={{position:'absolute',bottom:'7px',left:'50%',transform:'translateX(-50%)',width:'108px',height:'3px',background:'#fff',opacity:.55,borderRadius:'2px',zIndex:10}} />}
    </div>
  );
}

/* ══ 7 · WIDGET D'ÉCRAN D'ACCUEIL ══
   Le web n'avait aucun canal de relance ; le natif en gagne deux — la notification, et
   celui-ci. Un widget n'interrompt jamais : il attend d'être vu. C'est la relance la moins
   coûteuse du produit, et la seule qui ne demande aucune permission. */
function WidgetAccueil({os}){
  const g = NATIF[os];
  const icone = (bg,glyphe)=>(
    <span style={{width:'58px',height:'58px',borderRadius:os==='ios'?'15px':'50%',background:bg,
      display:'grid',placeItems:'center',boxShadow:'0 4px 12px rgba(0,0,0,.22)'}}>{glyphe}</span>
  );
  return (
    <div className={'play '+(os==='android'?'andro ':'')} style={{position:'relative',width:g.w+'px',height:g.h+'px',
      overflow:'hidden',isolation:'isolate',background:'#0B0E13',fontFamily:'var(--f-body)'}}>
      {/* Un fond d'écran, pas un maillage de marque : ce widget vit chez la personne. */}
      <div style={{position:'absolute',inset:0,background:'linear-gradient(165deg,#1B2430,#0B0E13 62%,#241C4E)'}} />
      {os === 'ios' ? <EncocheIos /> : <PoinconAndro />}
      {os === 'ios' ? <StatusIos dark /> : <StatusAndro dark />}

      {/* Une seule déclaration `padding` : déclarer `paddingTop` PUIS le raccourci remet le
          haut à zéro — dans un objet de style, la dernière clé gagne. Et le décalage vit
          dans la boîte, pas en marge, sinon il pousse le contenu au lieu de le placer. */}
      <div style={{position:'relative',zIndex:3,boxSizing:'border-box',
        padding:(g.top+18)+'px 22px 0',
        display:'flex',flexDirection:'column',gap:'20px'}}>

        {/* Widget moyen : la reprise. Le même objet que la carte de l'espace, réduit à
            ce qui reste vrai sans réseau — le titre, la progression, une seule action. */}
        <div className="rv-s" style={{'--i':1,borderRadius:'22px',padding:'16px',
          background:'rgba(255,255,255,.1)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',
          border:'1px solid rgba(255,255,255,.16)',boxShadow:'0 10px 30px rgba(0,0,0,.34)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px'}}>
            <Wordmark brand="rysmo" size={15} night tail="#fff" />
            <span className="mm-num" style={{fontSize:'10px',color:'rgba(255,255,255,.6)'}}>il y a 8 jours</span>
          </div>
          <p style={{fontSize:'15px',fontWeight:600,color:'#fff',lineHeight:1.3,margin:'10px 0 0'}}>Les mots que tapent tes clients</p>
          <p className="mm-num" style={{fontSize:'11px',color:'rgba(255,255,255,.66)',margin:'3px 0 0'}}>16 / 47 leçons · 34 %</p>
          <div style={{height:'6px',borderRadius:'4px',background:'rgba(255,255,255,.18)',overflow:'hidden',marginTop:'12px'}}>
            <i style={{display:'block',height:'100%',width:'34%',borderRadius:'4px',
              background:'linear-gradient(90deg,#6FB1FF,#B98CFF,#FFB24D,#3FD9C6)'}} />
          </div>
          <span style={{display:'inline-flex',alignItems:'center',gap:'6px',marginTop:'13px',height:'34px',
            padding:'0 14px',borderRadius:'var(--r-pill)',background:'#fff',color:'#0E1116',fontSize:'12.5px',fontWeight:700}}>
            <Icon name="play" size={12} color="#0E1116" /> Reprendre
          </span>
        </div>

        {/* Widget petit : le compteur de série, sans compte à rebours ni culpabilité. */}
        <div style={{display:'flex',gap:'20px',alignItems:'flex-start'}}>
          <div className="rv-s" style={{'--i':2,width:'138px',height:'138px',borderRadius:'22px',padding:'15px',
            background:'rgba(255,255,255,.1)',backdropFilter:'blur(18px)',WebkitBackdropFilter:'blur(18px)',
            border:'1px solid rgba(255,255,255,.16)',display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
            <p style={{fontFamily:'var(--f-mono)',fontSize:'9.5px',letterSpacing:'.14em',textTransform:'uppercase',
              color:'rgba(255,255,255,.6)',margin:0}}>Série</p>
            <div>
              <p className="mm-num" style={{fontSize:'38px',color:'#fff',margin:0,lineHeight:1}}>3 j</p>
              <p style={{fontSize:'11px',color:'rgba(255,255,255,.66)',margin:'4px 0 0'}}>record 7 j</p>
            </div>
          </div>
          <div className="rv-s" style={{'--i':3,display:'grid',gridTemplateColumns:'repeat(2,58px)',gap:'20px 22px'}}>
            {icone('linear-gradient(135deg,#0057BC,#6C23DD)',<Wordmark brand="rysmo" size={13} night tail="#fff" />)}
            {icone('rgba(255,255,255,.14)',<Icon name="chat" size={24} color="#fff" strokeWidth={1.9} />)}
            {icone('rgba(255,255,255,.14)',<Icon name="search" size={24} color="#fff" strokeWidth={1.9} />)}
            {icone('rgba(255,255,255,.14)',<Icon name="calendar" size={24} color="#fff" strokeWidth={1.9} />)}
          </div>
        </div>

        <div className="rv" style={{'--i':4,marginTop:'6px',padding:'13px 15px',borderRadius:'16px',
          background:'rgba(0,0,0,.4)',border:'1px solid rgba(255,255,255,.1)'}}>
          <p style={{fontFamily:'var(--f-mono)',fontSize:'9.5px',letterSpacing:'.14em',textTransform:'uppercase',
            color:'rgba(255,255,255,.5)',margin:0}}>Pourquoi ce widget existe</p>
          <p style={{fontSize:'12px',color:'rgba(255,255,255,.74)',lineHeight:1.55,margin:'6px 0 0'}}>
            La plateforme web n'a aucun canal d'envoi : la relance ne pouvait venir que de
            l'écran, une fois l'app ouverte. Un widget attend sur l'écran d'accueil sans rien
            interrompre — et sans demander de permission.</p>
        </div>
      </div>

      {os === 'ios' ? <AccueilIos dark /> : <NavAndro dark />}
    </div>
  );
}

/* ══ 8 · PARTAGE SYSTÈME ══
   Le certificat est la seule chose que la personne veut montrer. Ce qui part, c'est le
   LIEN DE VÉRIFICATION, pas une image : une capture ne se vérifie pas. */
function PartageSysteme({os}){
  const g = NATIF[os];
  const cible = (ini,nom,bg)=>(
    <div style={{width:'62px',textAlign:'center',flex:'0 0 auto'}}>
      <span style={{width:'54px',height:'54px',borderRadius:'50%',background:bg,display:'grid',placeItems:'center',
        margin:'0 auto',color:'#fff',fontWeight:700,fontSize:'15px'}}>{ini}</span>
      <p style={{fontSize:'10.5px',color:'var(--text-muted)',margin:'6px 0 0',lineHeight:1.3}}>{nom}</p>
    </div>
  );
  return (
    <div className={'play '+(os==='android'?'andro ':'')} style={{position:'relative',width:g.w+'px',height:g.h+'px',
      overflow:'hidden',isolation:'isolate',background:'#fff',color:'var(--ink)',fontFamily:'var(--f-body)'}}>
      <Mesh territory="forme" size={os==='android'?460:340} />
      {os === 'ios' ? <EncocheIos /> : <PoinconAndro />}
      {os === 'ios' ? <StatusIos /> : <StatusAndro />}

      {/* L'écran du certificat, recouvert */}
      {/* Une seule déclaration `padding`, même raison qu'ailleurs. */}
      <div style={{position:'relative',zIndex:3,boxSizing:'border-box',padding:(g.top+10)+'px 18px 0',filter:'saturate(.9)'}}>
        <div style={{opacity:.5}}>
          <NTitre size={27} lines={["C'EST FAIT,",'AÏSSATOU.']} />
        </div>
      </div>
      <div style={{position:'absolute',inset:0,background:'rgba(14,17,22,.3)',zIndex:6}} />

      {/* La feuille système : verre, poignée, cibles. La liste des applications est celle du
          téléphone — on ne la dessine pas, on montre où elle vient. */}
      <div className="rv-s" style={{position:'absolute',left:0,right:0,bottom:0,zIndex:8,
        borderRadius:os==='ios'?'26px 26px 0 0':'30px 30px 0 0',padding:'12px 18px '+(os==='ios'?'42px':'34px'),
        background:'rgba(255,255,255,.9)',backdropFilter:'blur(24px) saturate(170%)',WebkitBackdropFilter:'blur(24px) saturate(170%)',
        border:'1px solid rgba(255,255,255,.6)',boxShadow:'0 -14px 40px rgba(14,17,22,.24)'}}>
        {os === 'ios' && <span style={{display:'block',width:'38px',height:'5px',borderRadius:'3px',
          background:'var(--fill-4)',margin:'0 auto 14px'}} />}

        <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'2px 0 14px'}}>
          <span style={{width:'46px',height:'46px',borderRadius:'12px',background:'linear-gradient(135deg,#0057BC,#02AC9C)',
            display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="doc" size={20} color="#fff" /></span>
          <div style={{flex:1,minWidth:0}}>
            <p style={{fontSize:'14px',fontWeight:600,margin:0}}>Certificat · Référencement local</p>
            <p className="mm-num" style={{fontSize:'11px',color:'var(--text-muted)',margin:'2px 0 0',
              whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>maxmorrys.me/verifier/MM-C7K4-9RTX-2081</p>
          </div>
        </div>

        <div style={{display:'flex',gap:'10px',overflowX:'auto',padding:'4px 0 14px',
          borderTop:'1px solid var(--border-hair)',borderBottom:'1px solid var(--border-hair)'}}>
          {cible('in','LinkedIn','#0A66C2')}
          {cible('W','WhatsApp','#25D366')}
          {cible('f','Facebook','#1877F2')}
          {cible('@','E-mail','#5A6472')}
          {cible('…','Autre','rgba(14,17,22,.5)')}
        </div>

        <div style={{paddingTop:'12px'}}>
          <LessonRow state="plain" icon={<Icon name="bookmark" size={15} />} title="Copier le lien de vérification"
            meta="c'est ce lien qu'un employeur ouvre" />
          <LessonRow state="plain" icon={<Icon name="download" size={15} />} title="Enregistrer le PDF" last />
        </div>

        <p style={{fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,margin:'12px 0 0'}}>
          Ce qui part est le <b style={{color:'var(--ink)'}}>lien de vérification</b>, pas une
          image : une capture d'écran ne se vérifie pas. La page répond à un code, sans compte,
          et ne remonte à aucun profil.</p>
      </div>

      {os === 'ios' ? <AccueilIos /> : <NavAndro />}
    </div>
  );
}

/* ══ 9 · BIOMÉTRIE ══
   Proposée APRÈS la première connexion réussie, jamais avant : demander l'empreinte à
   quelqu'un qui n'a pas encore de compte n'a pas de sens. Et elle ne remplace pas le mot
   de passe — elle évite de le retaper. */
function Biometrie({os}){
  return (
    <NativeScreen os={os} territory="transforme">
      <div style={{minHeight:'100%',display:'flex',flexDirection:'column',justifyContent:'center',paddingBottom:'20px'}}>
        <div className="rv-s" style={{width:'66px',height:'66px',borderRadius:'21px',
          background:'linear-gradient(135deg,#3FD9C6,#0057BC)',display:'grid',placeItems:'center',
          boxShadow:'0 12px 30px rgba(0,87,188,.3)'}}>
          <Icon name="lock" size={27} color="#fff" strokeWidth={2.2} />
        </div>
        <NTitre size={29} lines={[os==='ios' ? 'ENTRER AVEC' : 'ENTRER AVEC',
          os==='ios' ? 'FACE ID ?' : 'TON EMPREINTE ?']} style={{marginTop:'22px'}} />
        <NChapo style={{'--i':5}}>Tu n'auras plus à retaper ton mot de passe. Il reste valable — c'est juste un raccourci, pas un remplacement.</NChapo>

        <GlassPanel padding={20} className="rv" style={{'--i':6,marginTop:'20px'}}>
          <CheckLine tone="ok" style={{marginTop:0}}>Ton mot de passe continue de fonctionner</CheckLine>
          <CheckLine tone="ok">{os === 'ios'
            ? 'Face ID reste sur ton iPhone : je ne le reçois jamais'
            : 'Ton empreinte reste dans le téléphone : je ne la reçois jamais'}</CheckLine>
          <CheckLine tone="ok">Désactivable à tout moment dans ton profil</CheckLine>
          <CheckLine tone="neutre" dash>Ça ne protège pas la vérification d'un certificat — elle est publique, à dessein</CheckLine>
        </GlassPanel>

        <Button tone="digitalise" className="rv" style={{'--i':7,marginTop:'18px'}}>
          {os === 'ios' ? 'Activer Face ID' : 'Activer l\u2019empreinte'}
        </Button>
        <Button tone="quiet" fullWidth className="rv" style={{'--i':7,marginTop:'9px'}}>Non merci</Button>

        <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'16px'}}>
          <NSourcil style={{marginBottom:'6px'}}>Pourquoi cette question arrive maintenant</NSourcil>
          <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>
            Parce que tu viens de te connecter, et que c'est le seul moment où la proposition
            a un sens. La poser à l'ouverture de l'app, avant même un compte, c'est demander
            une empreinte pour rien.</p>
        </GlassPanel>
      </div>
    </NativeScreen>
  );
}

const MM_EXPORT = {TABS_NAT,Lancement,Onboarding,Permissions,MurPaiement,Telechargements,
  LecteurPleinEcran,WidgetAccueil,PartageSysteme,Biometrie};
Object.assign(window, MM_EXPORT);
window.MMNAT = Object.assign(window.MMNAT||{}, MM_EXPORT);
