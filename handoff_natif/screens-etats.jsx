const { GlassPanel, Button, ChipRow, Segmented, LessonRow, QuotaMeter, ChatBubble, Skeleton, EmptyState, Tag, Field, Switch, ProgressBar, Mesh, TabBar, Icon, IconButton, Avatar, DocLine, Wordmark } = window.DS;
/* `ONGLETS` vient de ScreensNatifApp.js, chargé avant celui-ci. */

/* ══════════════════════════════════════════════════════════════════════════════
   PORTAGE — LE RÉPÉTITEUR ET LES QUATRE ÉTATS TRANSVERSES.

   Six écrans. Deux divergences réelles entre plateformes, et elles ne sont pas cosmétiques :

   · LE CLAVIER. C'est la plus grosse différence de tout le portage, et elle n'existe pas
     en web mobile où le navigateur s'en occupe. Un clavier natif mange 300 px : le champ
     de saisie doit monter avec lui, et surtout la BARRE DE QUOTA doit rester visible —
     sinon on tape sa question sans voir qu'il n'en reste qu'une. iOS pose des touches
     individuelles sur fond gris ; Gboard pose des lettres sur un fond plat, sans capuchon.

   · HORS CONNEXION. En web, c'est une requête qui échoue. En natif, le système le dit
     avant même d'essayer — donc l'écran peut être juste dès la première image, et la file
     d'envoi devient un objet permanent au lieu d'un rattrapage.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ─── Clavier système. Chrome, comme la barre d'état : dessiné, pas illustré. ─── */
const RANGS = ['azertyuiop','qsdfghjklm','wxcvbn'];

function Clavier({os}){
  const ios = os === 'ios';
  const h = ios ? 291 : 268;
  return (
    <div style={{position:'absolute',left:0,right:0,bottom:0,height:h+'px',zIndex:12,
      background:ios?'#D2D5DB':'#F2F3F7',borderTop:'1px solid rgba(14,17,22,.12)',
      display:'flex',flexDirection:'column',paddingTop:ios?'10px':'8px'}}>
      {/* Rangée d'accessoires : iOS la place au-dessus du clavier, Gboard l'intègre. */}
      <div style={{display:'flex',alignItems:'center',gap:'14px',padding:'0 12px 8px',
        fontSize:'12.5px',color:'var(--ink-2)',fontFamily:'var(--f-body)'}}>
        {ios
          ? <><span style={{fontWeight:600}}>Mots-clés</span><span>SEO</span><span>Google</span></>
          : <><Icon name="search" size={15} color="#5A6472" strokeWidth={2.2} /><span style={{fontWeight:600}}>Mots-clés</span><span>SEO</span><span>Google</span></>}
      </div>
      {RANGS.map((rang,ri)=>(
        <div key={ri} style={{display:'flex',justifyContent:'center',gap:ios?'6px':'4px',
          padding:'0 '+(ri===2?(ios?'44px':'40px'):'4px'),marginBottom:ios?'11px':'10px'}}>
          {rang.split('').map(l=>(
            <span key={l} style={{flex:1,maxWidth:'34px',height:ios?'42px':'40px',
              display:'grid',placeItems:'center',fontSize:ios?'22px':'20px',
              fontFamily:'var(--f-body)',color:'#0E1116',
              /* La différence visible : capuchon blanc sur iOS, lettre nue sur Gboard. */
              background:ios?'#fff':'transparent',
              borderRadius:ios?'5px':0,
              boxShadow:ios?'0 1px 0 rgba(14,17,22,.28)':'none'}}>{l}</span>
          ))}
        </div>
      ))}
      <div style={{display:'flex',justifyContent:'center',gap:ios?'6px':'4px',padding:'0 4px'}}>
        <span style={{width:ios?'44px':'40px',height:ios?'42px':'40px',borderRadius:ios?'5px':0,
          background:ios?'#ADB3BD':'transparent',display:'grid',placeItems:'center',fontSize:'11px',
          fontWeight:600,color:'#0E1116',fontFamily:'var(--f-body)'}}>{ios?'123':'?123'}</span>
        <span style={{flex:1,height:ios?'42px':'40px',borderRadius:ios?'5px':'20px',
          background:ios?'#fff':'rgba(14,17,22,.06)',boxShadow:ios?'0 1px 0 rgba(14,17,22,.28)':'none'}} />
        <span style={{width:ios?'86px':'52px',height:ios?'42px':'40px',borderRadius:ios?'5px':'20px',
          background:ios?'#ADB3BD':'var(--mm-bleu)',display:'grid',placeItems:'center',fontSize:'12px',
          fontWeight:600,color:ios?'#0E1116':'#fff',fontFamily:'var(--f-body)'}}>
          {ios ? 'retour' : <Icon name="send" size={17} color="#fff" strokeWidth={2.4} />}</span>
      </div>
    </div>
  );
}

/* ══ 1 · RÉPÉTITEUR, CONVERSATION ══
   Le quota est en tête, sous le titre, et il RESTE visible clavier ouvert. C'est le point
   de l'écran : un refus au-delà du plafond est vécu comme une panne s'il n'a pas été
   annoncé, et un quota caché par le clavier n'a pas été annoncé. */
function NatRepetiteur({os}){
  const g = NATIF[os];
  const hClavier = os === 'ios' ? 291 : 268;
  return (
    <div className={'play '+(os==='android'?'andro ':'')} style={{position:'relative',width:g.w+'px',height:g.h+'px',
      overflow:'hidden',isolation:'isolate',background:'#fff',color:'var(--ink)',
      fontFamily:'var(--f-body)',fontSize:'15px',lineHeight:1.45}}>
      <Mesh territory="transforme" size={os==='android'?460:340} />
      {os === 'ios' ? <EncocheIos /> : <PoinconAndro />}
      {os === 'ios' ? <StatusIos /> : <StatusAndro />}

      <div style={{position:'relative',zIndex:3,height:'100%',display:'flex',flexDirection:'column',paddingTop:g.top+'px'}}>
        {os === 'ios'
          ? <NavBarIos retour="Espace" titre="Répétiteur" droite={<IconButton label="Mémoire de profil"><Icon name="dots" size={17} strokeWidth={2} /></IconButton>} />
          : <NavBarAndro retour titre="Répétiteur" droite={<IconButton label="Mémoire de profil"><Icon name="dots" size={17} strokeWidth={2} /></IconButton>} />}

        {/* Épinglé sous la barre : il ne défile pas et le clavier ne le couvre pas. */}
        <div style={{padding:'0 18px 10px',position:'relative',zIndex:6}}>
          <QuotaMeter used={3} total={5} label="3 / 5 questions aujourd'hui" />
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'4px 18px 12px',
          display:'flex',flexDirection:'column',gap:'11px',
          marginBottom:(hClavier + 66)+'px'}}>
          <div className="rv"><ChatBubble>Salut Aïssatou. Je suis ton répétiteur — tu peux me donner un autre nom quand tu veux. Tu t'es arrêtée à la leçon 5 du module 3. On la reprend, ou tu as une question ?</ChatBubble></div>
          <div className="rv" style={{'--i':1,display:'flex',justifyContent:'flex-end'}}>
            <ChatBubble from="me">Comment je choisis mes mots-clés ?</ChatBubble></div>
          <div className="rv" style={{'--i':2}}>
            <ChatBubble>Trois points, dans cet ordre :<br /><br /><b>1.</b> Ce que tes clientes disent à voix haute en entrant — pas ce que toi tu vends.<br /><b>2.</b> Le nom de ton quartier.<br /><b>3.</b> Ce que tapent celles qui ne te connaissent pas encore.</ChatBubble></div>
          <div className="rv" style={{'--i':3}}>
            <GlassPanel level="flat" padding={14} style={{maxWidth:'86%'}}>
              <p style={{fontFamily:'var(--f-mono)',fontSize:'9.5px',letterSpacing:'.14em',textTransform:'uppercase',
                color:'var(--text-muted)',margin:0}}>Depuis ton cours</p>
              <p style={{fontSize:'13px',fontWeight:600,margin:'6px 0 0'}}>Module 3, leçon 4 — « Ce que cherche un client à Dakar »</p>
              <Button tone="quiet" size="sm" style={{marginTop:'10px'}}>Ouvrir la leçon</Button>
            </GlassPanel>
          </div>
        </div>

        {/* Champ de saisie, remonté au-dessus du clavier. */}
        <div style={{position:'absolute',left:0,right:0,bottom:hClavier+'px',zIndex:11,
          padding:'10px 14px',background:'var(--tabbar-bg)',
          backdropFilter:'blur(var(--glass-blur-chrome)) saturate(180%)',WebkitBackdropFilter:'blur(var(--glass-blur-chrome)) saturate(180%)',
          borderTop:'1px solid var(--tabbar-brd)',display:'flex',alignItems:'center',gap:'10px'}}>
          <div style={{flex:1}}><Field value="Comment je choisis mes mots" state="focus" style={{marginTop:0}} /></div>
          <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Envoyer"
            style={{width:'46px',height:'46px',borderRadius:'50%',background:'var(--action-transforme)',
              display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}>
            <Icon name="send" size={18} color="#fff" strokeWidth={2.6} />
          </span>
        </div>
      </div>

      <Clavier os={os} />
    </div>
  );
}

/* ══ 2 · MÉMOIRE DE PROFIL ══
   Portée à l'identique du web : c'est déjà l'écran où se règle la relation, et le natif
   n'y change rien. Le renommage reste en tête. */
function NatMemoire({os}){
  const lignes = [
    ['Tu gères la page Instagram de ta cousine coiffeuse, le week-end.','depuis le 12 août'],
    ['Tu vends des cosmétiques aux Almadies.','depuis le 12 août'],
    ["Ton objectif : être trouvable sur Google Maps avant décembre.",'depuis le 28 août'],
    ['Tu préfères les réponses courtes, en trois points.','depuis le 2 septembre'],
    ['Tu travailles surtout le soir, après 21 h.','depuis le 4 septembre']
  ];
  return (
    <NativeScreen os={os} territory="transforme" retour="Répétiteur" titre={os==='android'?'Mémoire de profil':null}
      droite={<IconButton label="Fermer"><Icon name="close" size={17} strokeWidth={2.4} /></IconButton>}>
      <NSourcil style={{marginTop:'6px'}}>Ton répétiteur</NSourcil>
      <NTitre size={29} lines={['DONNE-LUI','UN NOM.']} />

      <GlassPanel level="hero" padding={19} className="rv" style={{'--i':4,marginTop:'18px'}}>
        <Field label="Comment tu l'appelles" value="Répétiteur" state="focus" style={{marginTop:0}}
          hint="Par défaut, il s'appelle Répétiteur." />
        <div style={{display:'flex',gap:'7px',marginTop:'13px',flexWrap:'wrap'}}>
          {['Répétiteur','Prof','Coach','Tonton'].map((p,i)=>(
            <span key={p} className="mm-press-sm" style={{height:'40px',display:'inline-flex',alignItems:'center',
              padding:'0 15px',borderRadius:'var(--r-pill)',fontSize:'13px',fontWeight:i===0?600:500,cursor:'pointer',
              background:i===0?'var(--ink)':'var(--ctl-off-bg)',
              color:i===0?'var(--text-on-primary)':'var(--text-muted)',
              border:'1px solid '+(i===0?'var(--ink)':'var(--ctl-off-brd)')}}>{p}</span>
          ))}
        </div>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,margin:'12px 0 0'}}>
          Le nom ne change que pour toi. <b style={{color:'var(--ink)'}}>Rysmo</b> reste le nom de l'application.</p>
      </GlassPanel>

      <NSourcil style={{'--i':5,marginTop:'24px'}}>Ce qu'il a retenu</NSourcil>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':6,marginTop:'10px'}}>
        {lignes.map(([t,d],i)=>(
          <LessonRow key={t} state="plain" title={t} meta={d} last={i===lignes.length-1}
            icon={<Icon name="chat" size={14} color="#5A17BE" />} iconBackground="rgba(108,35,221,.12)"
            trailing={<span className="mm-press-sm" role="button" tabIndex={0} aria-label={'Oublier : '+t}
              style={{width:'var(--touch-aa)',height:'var(--touch-aa)',borderRadius:'50%',background:'rgba(180,35,31,.1)',
                display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}>
              <Icon name="trash" size={14} color="#B4231F" strokeWidth={2.2} /></span>} />
        ))}
      </GlassPanel>
      <Button tone="quiet" fullWidth className="rv" style={{'--i':7,marginTop:'14px',color:'var(--stop)'}}>Tout effacer</Button>

      <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'14px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que l'effacement fait</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Immédiat, et il ne passe pas par le support. La mémoire se reconstitue à partir des seuls échanges suivants. <b style={{color:'var(--ink)'}}>Le nom que tu lui as donné ne s'efface pas avec.</b></p>
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 3 · CHARGEMENT ══
   Le squelette a la forme exacte du contenu réel. Quand il arrive, rien ne saute. */
function NatChargement({os}){
  return (
    <NativeScreen os={os} territory="forme"
      droite={<><Skeleton width={40} height={40} radius={999} /><Skeleton width={40} height={40} radius={999} /></>}
      tabbar={<TabBar items={ONGLETS()} active="Espace" />}>
      <Skeleton width={110} height={11} style={{marginTop:'10px'}} />
      <div style={{marginTop:'14px',display:'grid',gap:'10px'}}>
        <Skeleton height={32} width="82%" />
        <Skeleton height={32} width="58%" />
      </div>
      <Skeleton height={124} radius={24} style={{marginTop:'22px'}} />
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'14px'}}>
        <Skeleton height={86} radius={18} /><Skeleton height={86} radius={18} />
      </div>
      <Skeleton height={92} radius={18} style={{marginTop:'14px'}} />
      <Skeleton width={130} height={11} style={{marginTop:'24px'}} />
      <div style={{display:'grid',gap:'9px',marginTop:'12px'}}>
        <Skeleton height={46} radius={14} /><Skeleton height={46} radius={14} /><Skeleton height={46} radius={14} />
      </div>
      <p className="mm-num" style={{fontSize:'11px',color:'var(--text-faint)',marginTop:'20px'}}>
        Quand le contenu arrive, rien ne saute.</p>
    </NativeScreen>
  );
}

/* ══ 4 · ÉTAT VIDE ══
   Une invitation à agir, pas une excuse. Le zéro est daté. */
function NatVide({os}){
  return (
    <NativeScreen os={os} territory="transforme" retour="Espace" titre={os==='android'?'Mes certificats':null}
      tabbar={<TabBar items={ONGLETS()} active="Profil" />}>
      <div style={{minHeight:'78%',display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <GlassPanel level="flat" padding={6}>
          <EmptyState
            glyph={<Icon name="doc" size={26} color="#5A17BE" />}
            glyphBackground="linear-gradient(135deg,#DFD0FF,#C7E1FF)"
            title="Aucun certificat pour l'instant."
            body="Le premier arrive à la fin d'une formation. Son code se vérifie sans compte, et il reste valable même si tu supprimes le tien."
            action={<Button tone="transforme">Reprendre la leçon 5</Button>} />
        </GlassPanel>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',lineHeight:1.5,marginTop:'16px'}}>
          <b className="mm-num" style={{color:'var(--text-muted)'}}>0</b> émis depuis l'ouverture de ton compte,
          le 12 août. Un zéro daté est une information ; un tiret n'en est pas une.</p>
      </div>
    </NativeScreen>
  );
}

/* ══ 5 · ERREUR ══
   Motif, conséquence, sortie. Dans cet ordre, et jamais d'excuse. La sortie de secours
   du natif est meilleure que celle du web : la transcription est déjà sur l'appareil. */
function NatErreur({os}){
  return (
    <NativeScreen os={os} territory="forme" retour="Cours">
      <div style={{minHeight:'100%',display:'flex',flexDirection:'column',justifyContent:'center',paddingBottom:'30px'}}>
        <div className="rv-s" style={{width:'66px',height:'66px',borderRadius:'21px',
          background:'linear-gradient(135deg,#E4564F,#B4231F)',display:'grid',placeItems:'center',
          boxShadow:'0 12px 30px rgba(180,35,31,.3)'}}>
          <Icon name="alert" size={28} color="#fff" strokeWidth={2.4} />
        </div>
        <NTitre size={28} lines={["La leçon ne s'est",'pas chargée.']} style={{marginTop:'22px'}} />

        <GlassPanel padding={18} className="rv" style={{'--i':4,marginTop:'18px'}}>
          <NSourcil style={{marginBottom:'7px'}}>Le motif</NSourcil>
          <p style={{fontSize:'13.5px',lineHeight:1.5,margin:0}}>La vidéo a mis plus de 30 secondes à répondre. Le réseau a coupé pendant le transfert.</p>
          <div style={{height:'1px',background:'var(--border-hair)',margin:'14px 0'}} />
          <NSourcil style={{marginBottom:'7px'}}>La conséquence</NSourcil>
          <p style={{fontSize:'13.5px',lineHeight:1.5,margin:0}}>Ta progression est intacte : elle est enregistrée sur ton inscription, pas sur le téléphone. Rien n'est perdu.</p>
        </GlassPanel>

        <Button tone="forme" className="rv" style={{'--i':5,marginTop:'18px'}}>Réessayer</Button>
        <Button tone="quiet" fullWidth className="rv" style={{'--i':5,marginTop:'9px'}}>Lire la transcription à la place</Button>
        <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',
          lineHeight:1.5,marginTop:'12px'}}>La transcription est déjà sur ton téléphone : <b className="mm-num" style={{color:'var(--text-muted)'}}>0 Mo</b> à charger.</p>
        <p className="rv mm-num" style={{'--i':6,fontSize:'11px',color:'var(--text-faint)',textAlign:'center',marginTop:'10px'}}>
          Référence de l'incident : MM-E-7741</p>
      </div>
    </NativeScreen>
  );
}

/* ══ 6 · HORS CONNEXION ══
   La divergence la plus utile du natif. En web, c'est une requête qui échoue ; ici le
   système le dit avant d'essayer, donc l'écran est juste dès la première image. Et la
   file d'envoi devient un objet permanent au lieu d'un rattrapage. */
function NatHorsConnexion({os}){
  return (
    <NativeScreen os={os} territory="informe" retour="Cours"
      droite={<Tag tone="stop">Hors connexion</Tag>}
      tabbar={<TabBar items={ONGLETS()} active="Cours" />}>
      <NTitre size={29} lines={['Pas de réseau.']} style={{marginTop:'6px'}} />
      <NChapo style={{'--i':2}}>Tu peux continuer les <b className="mm-num" style={{color:'var(--ink)'}}>3</b> leçons déjà téléchargées. Ta progression partira dès que tu retrouves du réseau.</NChapo>

      <NSourcil style={{'--i':3,marginTop:'22px'}}>Disponible sans réseau</NSourcil>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':4,marginTop:'10px'}}>
        <LessonRow state="done" title="Choisir tes mots-clés" meta="vidéo 480p · 12 Mo" />
        <LessonRow state="done" title="Ce que cherche un client à Dakar" meta="vidéo 480p · 9 Mo" />
        <LessonRow state="todo" icon={<Icon name="doc" size={13} />} title="Exercice : ta liste de 20 mots" meta="PDF · 180 Ko" last />
      </GlassPanel>

      <NSourcil style={{'--i':5,marginTop:'22px'}}>En attente d'envoi</NSourcil>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':6,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="check" size={13} color="#8A4B00" strokeWidth={3.4} />}
          iconBackground="rgba(243,139,10,.18)" title="Leçon 5 terminée" meta="il y a 12 min"
          trailing={<Tag tone="warn">en file</Tag>} />
        <LessonRow state="plain" icon={<Icon name="comment" size={13} color="#8A4B00" />}
          iconBackground="rgba(243,139,10,.18)" title="1 note écrite" meta="il y a 9 min"
          trailing={<Tag tone="warn">en file</Tag>} last />
      </GlassPanel>
      <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>
        La file part au retour du réseau, sans rien te demander. Le parcours survit à une
        session interrompue et reprise des jours plus tard.</p>

      <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'14px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que l'app sait, et que le site ignorait</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Le système annonce la perte de réseau <b style={{color:'var(--ink)'}}>avant</b> qu'une requête échoue. Cet écran est donc juste dès la première image, au lieu d'apparaître après trente secondes d'attente.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

const MM_EXPORT = {Clavier,NatRepetiteur,NatMemoire,NatChargement,NatVide,NatErreur,NatHorsConnexion};
Object.assign(window, MM_EXPORT);
window.MMNAT = Object.assign(window.MMNAT||{}, MM_EXPORT);
