const { Mesh, GlassPanel, TerritoryCard, Button, ChipRow, Segmented, PriceBlock, SideNav, TopBar, Wordmark, ProgressBar, LessonRow, QuotaMeter, ChatBubble, StatTile, Pipeline, Tag, Avatar, DocLine, CheckLine, Icon, IconButton, Field } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   DEUX TABLEAUX DE BORD EN 1440 px.

   L'espace apprenant et la console existaient en 390 px seulement. Pour une web app,
   c'est un défaut de fond sur la console : un opérateur qui qualifie des prospects et
   réconcilie des paiements travaille à un bureau, pas au pouce.

   La règle d'élargissement du système ne change pas : **l'espace gagné va à la marge
   et à la navigation, jamais à la longueur de ligne**. Ces deux vues l'appliquent en
   ajoutant des COLONNES, pas en étirant les blocs.
   ══════════════════════════════════════════════════════════════════════════════ */

function Fenetre({territory='forme',dark,width=1440,height=900,children}){
  return (
    <div className={'play'+(dark?' dk':'')} style={{position:'relative',width:width+'px',height:height+'px',borderRadius:'18px',
      overflow:'hidden',background:dark?'#0A0D11':'var(--surface-page)',color:dark?'#ECF0F5':'var(--text-body)',
      isolation:'isolate',boxShadow:'0 30px 70px rgba(0,0,0,.5)'}}>
      <Mesh territory={dark?'nuit':territory} size={560} />
      {children}
    </div>
  );
}

const VERBES_APP = [
  {label:'Mon espace',color:'#6C23DD'},
  {label:'Mes cours',color:'#0057BC'},
  {label:'Mon répétiteur',color:'#02AC9C'},
  {label:'Le Club',color:'#6C23DD'},
  {label:'Mon profil',color:'#98A1AE'}
];

/* ── Coques partagées ──
   Les 24 pages de tableau de bord tiennent dans DEUX coques. C'est le point : une page
   qui aurait besoin d'une troisième coque est une page qui sort du motif, et il faut
   alors se demander si elle a sa place ici. */

function CEyebrow({children,style}){
  return <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0,...style}}>{children}</p>;
}
function NEyebrow({children,style}){
  return <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'#7C8896',margin:0,...style}}>{children}</p>;
}

/** Coque de l'espace apprenant : navigation 250 px · travail · panneau optionnel 340 px.
 *  Sans `aside`, la colonne de travail prend la place — une page qui n'a rien à mettre
 *  dans le panneau ne doit pas en afficher un vide. */
function AppFrame({active,sourcil,titre,aside,children}){
  return (
    <Fenetre territory="transforme">
      <div style={{position:'relative',zIndex:3,display:'grid',gridTemplateColumns:aside?'250px 1fr 340px':'250px 1fr',height:'100%'}}>
        <SideNav brand={<Wordmark brand="rysmo" size={22} />} items={VERBES_APP} active={active} style={{height:'900px'}}
          footer={<GlassPanel level="flat" padding={14}>
            <CEyebrow style={{fontSize:'10px'}}>Ta progression</CEyebrow>
            <p style={{fontSize:'12.5px',fontWeight:600,margin:'4px 0 0'}}>Leçon 5 · 34 %</p>
            <ProgressBar value={34} style={{marginTop:'8px'}} />
          </GlassPanel>} />
        <div style={{padding:'26px 30px',overflowY:'auto'}}>
          <div className="rv" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'20px'}}>
            <div>
              <CEyebrow>{sourcil}</CEyebrow>
              <h1 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'34px',letterSpacing:'-.035em',lineHeight:1,margin:'6px 0 0'}}>{titre}</h1>
            </div>
            <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
              <IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton>
              <Avatar initials="A" size={40} />
            </div>
          </div>
          {children}
        </div>
        {aside && <div style={{borderLeft:'1px solid var(--nav-brd)',padding:'26px 22px',display:'flex',flexDirection:'column',overflowY:'auto'}}>{aside}</div>}
      </div>
    </Fenetre>
  );
}

/** Coque de la console : les 19 écrans (230 px) · liste dense · détail optionnel (380 px).
 *  `pied` est OBLIGATOIRE — c'est la zone 3 du motif, celle qui dit ce que l'écran ne
 *  couvre pas. Un écran d'administration sans cette zone finit en manœuvre manuelle
 *  non tracée. */
function ConsoleFrame({actif,sourcil,titre,releve,detail,pied,children}){
  return (
    <Fenetre dark>
      <div style={{position:'relative',zIndex:3,display:'grid',gridTemplateColumns:detail?'230px 1fr 380px':'230px 1fr',height:'100%'}}>
        <ConsoleNav actif={actif} />
        <div style={{padding:'24px 26px',overflowY:'auto'}}>
          <div className="rv" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'20px'}}>
            <div>
              <NEyebrow>{sourcil}</NEyebrow>
              <h1 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'30px',letterSpacing:'-.035em',lineHeight:1,margin:'6px 0 0',color:'#fff'}}>{titre}</h1>
            </div>
            {releve && <span className="mm-num" style={{fontSize:'11px',color:'var(--text-faint)'}}>{releve}</span>}
          </div>
          {children}
          <GlassPanel level="night" padding={16} className="rv" style={{'--i':9,marginTop:'18px',borderColor:'rgba(255,255,255,.09)'}}>
            <NEyebrow style={{fontSize:'10px',marginBottom:'6px'}}>Ce que cet écran ne couvre pas</NEyebrow>
            <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>{pied}</p>
          </GlassPanel>
        </div>
        {detail && <div style={{borderLeft:'1px solid rgba(255,255,255,.1)',padding:'24px 20px',overflowY:'auto'}}>{detail}</div>}
      </div>
    </Fenetre>
  );
}

function ConsoleNav({actif}){
  return (
    <div style={{borderRight:'1px solid rgba(255,255,255,.1)',padding:'22px 16px',overflowY:'auto'}}>
      <div style={{display:'flex',alignItems:'center',gap:'9px',padding:'0 6px 18px'}}>
        <Wordmark brand="rysmo" size={19} night tail="#fff" />
        <span style={{fontFamily:'var(--f-mono)',fontSize:'9px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-faint)'}}>console</span>
      </div>
      {CONSOLE_NAV.map(([groupe,items])=>(
        <div key={groupe} style={{marginBottom:'16px'}}>
          <p style={{fontFamily:'var(--f-mono)',fontSize:'9px',letterSpacing:'.16em',textTransform:'uppercase',color:'var(--text-faint)',margin:'0 0 6px 6px'}}>{groupe}</p>
          {items.map(([nom,badge])=>{
            const on = nom === actif;
            return (
              <div key={nom} className="mm-press-sm" style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'10px',cursor:'pointer',
                background:on?'rgba(255,255,255,.1)':'transparent'}}>
                <span style={{flex:1,fontSize:'13px',fontWeight:on?600:400,color:on?'#ECF0F5':'#A2ADBB'}}>{nom}</span>
                {badge && <span className="mm-num" style={{fontSize:'10px',color:'#7C8896'}}>{badge}</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ══ 1 · ESPACE APPRENANT · 1440 × 900 ══
   Trois colonnes : navigation 250 px · travail (fluide) · répétiteur 340 px.

   La reprise reste le PREMIER objet, comme en 390 px — le produit n'a aucun canal
   d'e-mail, donc la relance ne peut venir que de l'écran lui-même. Ce qui change avec
   la largeur : le répétiteur passe d'une carte qu'on ouvre à un panneau permanent.
   C'est le seul gain réel du desktop ici. */
function EspaceDesktop(){
  return (
    <AppFrame active="Mon espace" sourcil="Vendredi 4 septembre" titre="Bonsoir Aïssatou"
      aside={<React.Fragment>
        <div className="rv" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.035em',margin:0}}>Répétiteur</p>
          <IconButton label="Mémoire de profil"><Icon name="dots" size={17} strokeWidth={2} /></IconButton>
        </div>
        <QuotaMeter used={3} total={5} label="3 / 5" style={{marginTop:'8px'}} />
        <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'20px',flex:1}}>
          <div className="rv" style={{'--i':1}}><ChatBubble>Tu t'es arrêtée à la leçon 5 du module 3. On la reprend ?</ChatBubble></div>
          <div className="rv" style={{'--i':2,display:'flex',justifyContent:'flex-end'}}><ChatBubble from="me">Comment je choisis mes mots-clés ?</ChatBubble></div>
          <div className="rv" style={{'--i':3}}><ChatBubble>Trois points : ce que tes clientes disent à voix haute, le nom de ton quartier, et ce que tapent celles qui ne te connaissent pas encore.</ChatBubble></div>
        </div>
        <GlassPanel level="flat" padding={14} className="rv" style={{'--i':4,marginTop:'16px'}}>
          <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Il te reste <b className="mm-num" style={{color:'var(--ink)'}}>2</b> questions aujourd'hui. Remis à zéro à minuit.</p>
        </GlassPanel>
        <div style={{display:'flex',alignItems:'center',gap:'10px',marginTop:'12px'}}>
          <div style={{flex:1}}><Field placeholder="Pose ta question" style={{marginTop:0}} /></div>
          <span className="mm-press-sm" style={{width:'46px',height:'46px',borderRadius:'50%',background:'var(--action-transforme)',display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}>
            <Icon name="send" size={18} color="#fff" strokeWidth={2.6} />
          </span>
        </div>
      </React.Fragment>}>

          {/* La reprise, premier objet — inchangé depuis le 390 px */}
          <div className="rv" style={{'--i':1,marginTop:'20px'}}>
            <TerritoryCard layout="grid" territory="forme" meta="Tu t'es arrêtée il y a 8 jours" title="Leçon 5 · Les mots que tapent tes clients" titleSize={24}>
              <ProgressBar value={34} style={{marginTop:'16px'}} />
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
                <span className="mm-num" style={{fontSize:'13px',color:'var(--card-ink-2)'}}>16 / 47 leçons · 34 %</span>
                <Button tone="primary" size="sm" fullWidth={false}>Reprendre</Button>
              </div>
            </TerritoryCard>
          </div>

          {/* Trois relevés en rangée : la largeur sert à les mettre côte à côte */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginTop:'14px'}}>
            <GlassPanel level="flat" padding={18} className="rv" style={{'--i':2}}>
              <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0}}>Série</p>
              <p className="mm-num" style={{fontSize:'27px',margin:'4px 0 0'}}>3 j</p>
              <p style={{fontSize:'11.5px',color:'var(--text-faint)',margin:0}}>record : 7 j</p>
            </GlassPanel>
            <GlassPanel level="flat" padding={18} className="rv" style={{'--i':3}}>
              <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0}}>Niveau</p>
              <p className="mm-num" style={{fontSize:'27px',margin:'4px 0 0'}}>4</p>
              <ProgressBar value={60} height={6} style={{marginTop:'8px'}} />
            </GlassPanel>
            <GlassPanel level="flat" padding={18} className="rv" style={{'--i':4}}>
              <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0}}>Certificats</p>
              <p className="mm-num" style={{fontSize:'27px',margin:'4px 0 0'}}>0</p>
              <p style={{fontSize:'11.5px',color:'var(--text-faint)',margin:0}}>au premier terminé</p>
            </GlassPanel>
          </div>

          <p className="rv" style={{'--i':5,fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:'26px 0 0'}}>Le programme</p>
          <GlassPanel level="flat" padding="6px 20px" className="rv" style={{'--i':5,marginTop:'10px'}}>
            <LessonRow state="done" title="Pourquoi ta boutique est invisible" meta="module 1 · 4 leçons · terminé" />
            <LessonRow state="done" title="Ta fiche Google, pas à pas" meta="module 2 · 11 leçons · terminé" />
            <LessonRow state="current" icon={<Icon name="play" size={13} color="#fff" />} iconBackground="linear-gradient(135deg,#0057BC,#6C23DD)"
              title="Les mots que tapent tes clients" meta="module 3 · leçon 5 sur 9 · en cours" trailing={<Button tone="quiet" size="sm">Ouvrir</Button>} />
            <LessonRow state="todo" title="Les avis, sans en acheter" meta="module 4 · 8 leçons" />
            <LessonRow state="todo" title="Ton quartier, tes concurrents" meta="module 5 · 8 leçons" last />
          </GlassPanel>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'16px'}}>
            <GlassPanel level="flat" padding={18} className="rv" style={{'--i':6}}>
              <p style={{fontSize:'14px',fontWeight:600,margin:0}}>Mes paiements</p>
              <p className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)',margin:'3px 0 0'}}>1 transaction · 80 750 F</p>
            </GlassPanel>
            <GlassPanel level="flat" padding={18} className="rv" style={{'--i':7}}>
              <p style={{fontSize:'14px',fontWeight:600,margin:0}}>Mes notes</p>
              <p className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)',margin:'3px 0 0'}}>14 notes · 6 leçons</p>
            </GlassPanel>
          </div>
    </AppFrame>
  );
}

/* ══ 2 · CONSOLE ADMIN · 1440 × 900 ══
   Trois colonnes : les 19 écrans (230 px) · liste dense (fluide) · détail (380 px).

   Le motif des trois zones ne change pas — filtre par statut, liste à une action par
   ligne, pied qui dit ce que l'écran ne couvre pas. Ce que la largeur apporte : le
   détail cesse d'être un écran séparé et devient un panneau. Un opérateur unique
   qualifie sans jamais perdre la file de vue. */
const CONSOLE_NAV = [
  ['Pilotage',[['Tableau de bord',null],['Transactions','1 en attente'],['Utilisateurs','5']]],
  ['Commerce',[['Prospects','1'],['Projets','0'],['Coupons','1 actif']]],
  ['Contenu',[['Formations','2 · 0 publiée'],['Articles','47 brouillons'],['Podcasts','1'],['Vidéos','2'],['FAQ','12']]],
  ['Club',[['Événements','2'],['Défis','0'],['Témoignages','0']]],
  ['Réglages',[['Redirections','8'],['Pop-ups','2 actives'],['Notifications','0'],['Rendez-vous','0'],['Paramètres',null]]]
];

function ConsoleDesktop(){
  return (
    <ConsoleFrame actif="Tableau de bord" sourcil="Console · pilotage" titre="Dimanche 30 août" releve="relevé du 30/08 · 09:12"
      pied={<>Ni analyse d'audience, ni cohortes, ni graphiques : il ne répond qu'à « qu'est-ce qui bloque aujourd'hui ». Le coût d'exploitation — infrastructure, IA, paiement — n'y figure pas encore.</>}
      detail={<React.Fragment>
        <div className="rv" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
          <div>
            <NEyebrow style={{fontSize:'10px'}}>Prospect sélectionné</NEyebrow>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:'5px 0 0',color:'#fff'}}>Boutique de cosmétiques</p>
          </div>
          <Tag tone="warn">nouveau</Tag>
        </div>
        <div className="rv" style={{'--i':1,marginTop:'16px'}}>
          <Pipeline active="nouveau" stages={['nouveau','qualifié','devisé','signé','perdu']} />
        </div>
        <GlassPanel level="night" padding={18} className="rv" style={{'--i':2,marginTop:'14px'}}>
          <DocLine label="Reçu le" value="06/08/2026" />
          <DocLine label="Lieu" value="Almadies, Dakar" />
          <DocLine label="Trouvée par" value="bouche-à-oreille" />
          <DocLine label="Vend déjà sur" value="WhatsApp · Facebook" />
          <DocLine label="Recommandation" value="Pack Visible" />
          <DocLine label="Montant du devis" value="250 000 F" last />
        </GlassPanel>
        <Button size="sm" tone="quiet" style={{marginTop:'14px'}}>Qualifier ce prospect</Button>
        <Button size="sm" tone="quiet" fullWidth style={{marginTop:'8px'}}>Émettre le devis</Button>
        <GlassPanel level="night" padding={16} className="rv" style={{'--i':3,marginTop:'16px'}}>
          <NEyebrow style={{fontSize:'10px',marginBottom:'5px'}}>Coût opérationnel</NEyebrow>
          <p className="mm-num" style={{fontSize:'23px',margin:'0 0 4px',color:'#fff'}}>≈ 12 min</p>
          <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>par prospect qualifié — lecture, appel, devis, relance à J+3. À trente par semaine, c'est une demi-journée qui n'existe pas.</p>
        </GlassPanel>
      </React.Fragment>}>

          <GlassPanel level="night" padding={18} className="rv" style={{'--i':1,marginTop:'18px',borderColor:'rgba(243,139,10,.4)'}}>
            <div style={{display:'flex',alignItems:'center',gap:'13px'}}>
              <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'linear-gradient(135deg,#FFB74D,#F38B0A)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>
                <Icon name="alert" size={18} color="#0E1116" strokeWidth={2.6} />
              </span>
              <div style={{flex:1}}>
                <p style={{fontWeight:700,fontSize:'15px',color:'#FFB74D',margin:0}}>Ta boutique est fermée</p>
                <p style={{fontSize:'13px',color:'#C9B79E',margin:'3px 0 0'}}>2 formations en base, 0 publiée. Un visiteur ne peut rien acheter.</p>
              </div>
              <Button size="sm" fullWidth={false} style={{background:'linear-gradient(135deg,#FFB74D,#F38B0A)',color:'#0E1116'}}>Publier</Button>
            </div>
          </GlassPanel>

          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginTop:'14px'}}>
            <div className="rv" style={{'--i':2}}><StatTile dark label="Encaissé" value="0 F" foot="1 en attente" /></div>
            <div className="rv" style={{'--i':3}}><StatTile dark label="Comptes" value="5" foot="dernier : 10 mars" /></div>
            <div className="rv" style={{'--i':4}}><StatTile dark label="Inscriptions" value="2" foot="progression 0 %" /></div>
            <div className="rv" style={{'--i':5}}><StatTile dark label="Certificats" value="0" foot="depuis l'origine" /></div>
          </div>
          <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Chaque case porte sa date de relevé. Une case sans date affiche « non relevé », jamais une estimation.</p>

          <p className="rv" style={{'--i':7,fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'#7C8896',margin:'24px 0 10px'}}>À traiter</p>
          <div className="rv" style={{'--i':7}}><Pipeline active="à traiter 3" stages={['tout 12','à traiter 3','en attente 1','clos 8']} /></div>
          <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':8,marginTop:'12px'}}>
            <LessonRow icon={<Icon name="user" size={14} color="#3FD9C6" />} iconBackground="rgba(63,217,198,.2)"
              title="1 prospect TPE non qualifié" meta="Boutique de cosmétiques · Almadies · « nouveau » depuis le 6 août"
              trailing={<Button size="sm" tone="quiet">Qualifier</Button>} />
            <LessonRow icon={<Icon name="doc" size={14} color="#8FD8FF" />} iconBackground="rgba(0,87,188,.28)"
              title="47 articles en brouillon" meta="46 publiés sur 93 · 1 sans version anglaise"
              trailing={<Button size="sm" tone="quiet">Ouvrir</Button>} />
            <LessonRow icon={<Icon name="alert" size={14} color="#FF8A80" />} iconBackground="rgba(180,35,31,.28)"
              title="7 chiffres non sourcés en façade" meta="contredits par la base"
              trailing={<Button size="sm" tone="quiet">Retirer</Button>} last />
          </GlassPanel>
    </ConsoleFrame>
  );
}

const MM_EXPORT = {Fenetre,AppFrame,ConsoleFrame,ConsoleNav,CEyebrow,NEyebrow,VERBES_APP,CONSOLE_NAV,EspaceDesktop,ConsoleDesktop};
Object.assign(window, MM_EXPORT);
window.MMDASH = Object.assign(window.MMDASH||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('Dashboards.js');
