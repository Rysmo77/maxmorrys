const { GlassPanel, TerritoryCard, Button, ChipRow, ProgressBar, LessonRow, QuotaMeter, Tag, Avatar, CheckLine, DocLine, PriceBlock, TabBar, Segmented, Field, Icon, IconButton, PillButton, Wordmark } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   PORTAGE — LE CHEMIN DE L'ARGENT ET L'APPRENTISSAGE.

   Sept écrans, chacun écrit UNE fois et rendu dans les deux châssis. C'est le lot qui
   prouve le motif de portage : le corps vient du web sans modification de fond, et seul
   l'emballage change — `NativeScreen` remplace `Screen`, la barre haute du châssis
   remplace `AppBar`, et le reste est identique au caractère près.

   Deux endroits où le natif change le contenu, pas seulement le cadre :

   · L'ESPACE gagne une carte de notification. Sur le web, la reprise était le premier
     objet parce que la relance ne pouvait venir que de l'écran. En natif, elle peut
     enfin venir de l'extérieur — donc l'écran propose de l'activer, une fois.

   · LE SUCCÈS n'est plus une confirmation de paiement mais un RETOUR : l'achat a eu
     lieu sur le web, l'app constate. Le titre le dit.
   ══════════════════════════════════════════════════════════════════════════════ */

const ONGLETS = ()=>[
  {label:'Espace',icon:<Icon name="home" size={21} />},
  {label:'Cours',icon:<Icon name="book" size={21} />},
  {label:'Répétiteur',icon:<Icon name="chat" size={21} />},
  {label:'Club',icon:<Icon name="users" size={21} />},
  {label:'Profil',icon:<Icon name="user" size={21} />}
];

/* ══ 1 · CATALOGUE ══
   Deux formations, aucune note, aucun compteur d'inscrits. En natif comme en web : la
   plateforme vient d'ouvrir, il n'y a rien d'honnête à en dire. */
function NatCatalogue({os}){
  return (
    <NativeScreen os={os} territory="forme" titre={os==='android'?'Mes cours':null}
      droite={<><IconButton label="Chercher"><Icon name="search" size={17} strokeWidth={2.4} /></IconButton>
        <IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton></>}
      tabbar={<TabBar items={ONGLETS()} active="Cours" />}>
      <NSourcil style={{marginTop:'6px'}}>Je te forme · accès à vie</NSourcil>
      <NTitre size={29} lines={['2 FORMATIONS.','ACCÈS À VIE.']} />
      <NChapo>Le module d'ouverture de chacune se regarde sans payer, ici, maintenant. Tu juges avant de sortir de l'application.</NChapo>

      <div className="rv" style={{'--i':5,marginTop:'18px'}}><ChipRow options={['Tout · 2','Débutant · 1','Avancé · 1']} value="Tout · 2" /></div>

      <div style={{marginTop:'16px'}}>
        <div className="rv" style={{'--i':6}}>
          <TerritoryCard first territory="forme" meta="SEO · 6 modules · 47 leçons · débutant"
            title={<>Référencement local<br />pour ton commerce</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'16px'}}>
              <PriceBlock amount="95 000" size={25} note={<>Une fois · ou <b className="mm-num">3 × 31 700</b></>} />
              <Button tone="primary" size="sm" fullWidth={false}>Voir</Button>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':7}}>
          <TerritoryCard territory="transforme" meta="IA · 9 modules · 68 leçons · avancé"
            title={<>L'IA au service<br />de ta prospection</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'16px'}}>
              <PriceBlock amount="200 000" size={25} note={<>Une fois · ou <b className="mm-num">4 × 50 000</b></>} />
              <Button tone="primary" size="sm" fullWidth={false}>Voir</Button>
            </div>
          </TerritoryCard>
        </div>
      </div>

      <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'18px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Pourquoi il n'y a que deux titres</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Parce que je les monte moi-même, une par une, et que je préfère deux formations finies à dix annoncées. Ni note, ni nombre d'inscrits : la plateforme vient d'ouvrir.</p>
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 2 · RETOUR DE PAIEMENT ══
   Ce n'est pas un écran de succès : l'app n'a rien encaissé. Elle CONSTATE que l'accès
   est ouvert, et le titre le dit — « c'est à toi », pas « paiement accepté ». La
   différence compte : promettre une transaction qu'on n'a pas faite, c'est mentir. */
function NatRetourPaiement({os}){
  return (
    <NativeScreen os={os} territory="forme">
      <div style={{minHeight:'100%',display:'flex',flexDirection:'column',justifyContent:'center',paddingBottom:'30px'}}>
        <div className="rv-s" style={{width:'68px',height:'68px',borderRadius:'22px',
          background:'linear-gradient(135deg,#02AC9C,#0057BC)',display:'grid',placeItems:'center',
          boxShadow:'0 12px 32px rgba(2,172,156,.34)'}}>
          <Icon name="check" size={29} color="#fff" strokeWidth={3.4} />
        </div>
        <NTitre size={31} lines={["C'EST À TOI."]} style={{marginTop:'24px'}} />
        <NChapo style={{'--i':3}}>Ta formation est ouverte. Le premier module fait <b className="mm-num" style={{color:'var(--ink)'}}>22 minutes</b>.</NChapo>

        <GlassPanel padding={18} className="rv" style={{'--i':4,marginTop:'20px'}}>
          <DocLine label="Formation" value="Référencement local" />
          <DocLine label="Payée sur" value="maxmorrys.me" />
          <DocLine label="Moyen" value="Wave" />
          <DocLine label="Accès" value="à vie" last />
        </GlassPanel>

        <Button tone="digitalise" className="rv" style={{'--i':5,marginTop:'20px'}}>Ouvrir la première leçon</Button>
        <Button tone="quiet" fullWidth className="rv" style={{'--i':5,marginTop:'9px'}}>Télécharger pour hors connexion</Button>

        <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'16px'}}>
          <NSourcil style={{marginBottom:'6px'}}>Où est passé le reçu</NSourcil>
          <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Sur le site, dans <b style={{color:'var(--ink)'}}>Mes paiements</b> — c'est là que la transaction a eu lieu. L'app ne l'a pas encaissée, elle constate que l'accès est ouvert.</p>
        </GlassPanel>
      </div>
    </NativeScreen>
  );
}

/* ══ 3 · MON ESPACE ══
   La reprise reste le premier objet. Ce qui change en natif : la carte de notification,
   qui n'a aucun équivalent web puisque le web n'a aucun canal d'envoi. */
function NatEspace({os}){
  return (
    <NativeScreen os={os} territory="transforme"
      droite={<><IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton>
        <Avatar initials="A" size={os==='android'?40:36} /></>}
      tabbar={<TabBar items={ONGLETS()} active="Espace" />}>
      <NSourcil style={{marginTop:'6px'}}>Vendredi 4 septembre</NSourcil>
      <NTitre size={31} lines={['Bonsoir','Aïssatou']} />

      {/* Premier objet, et ça ne se négocie pas. */}
      <div className="rv" style={{'--i':4,marginTop:'20px'}}>
        <TerritoryCard first territory="forme" meta="Tu t'es arrêtée il y a 8 jours"
          title={<>Leçon 5 · Les mots<br />que tapent tes clients</>}>
          <ProgressBar value={34} style={{marginTop:'14px'}} />
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'12px'}}>
            <span className="mm-num" style={{fontSize:'12.5px',color:'var(--card-ink-2)'}}>16 / 47 leçons · 34 %</span>
            <Button tone="primary" size="sm" fullWidth={false}>Reprendre</Button>
          </div>
        </TerritoryCard>
      </div>

      {/* Ce que le web ne pouvait pas offrir. Proposé UNE fois, pas à chaque ouverture. */}
      <GlassPanel padding={17} className="rv" style={{'--i':5,marginTop:'14px'}}>
        <div style={{display:'flex',gap:'12px'}}>
          <span style={{width:'36px',height:'36px',borderRadius:'12px',background:'linear-gradient(135deg,#B98CFF,#6C23DD)',
            display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="bell" size={17} color="#fff" strokeWidth={2.2} /></span>
          <div style={{flex:1}}>
            <p style={{fontSize:'14px',fontWeight:700,margin:0}}>Je te préviens la prochaine fois ?</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'4px 0 0'}}>Huit jours, c'est le moment où on décroche. Une notification, et tu reprends.</p>
            <div style={{display:'flex',gap:'8px',marginTop:'12px'}}>
              <Button tone="transforme" size="sm" fullWidth={false}>Activer</Button>
              <Button tone="quiet" size="sm" fullWidth={false}>Non</Button>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'14px'}}>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':6}}>
          <NSourcil style={{fontSize:'10px'}}>Série</NSourcil>
          <p className="mm-num" style={{fontSize:'25px',margin:'4px 0 0'}}>3 j</p>
          <p style={{fontSize:'11.5px',color:'var(--text-faint)',margin:0}}>record 7 j</p>
        </GlassPanel>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':7}}>
          <NSourcil style={{fontSize:'10px'}}>Niveau</NSourcil>
          <p className="mm-num" style={{fontSize:'25px',margin:'4px 0 0'}}>4</p>
          <ProgressBar value={60} height={5} style={{marginTop:'7px'}} />
        </GlassPanel>
      </div>

      <GlassPanel padding={17} className="rv" style={{'--i':8,marginTop:'14px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'12px'}}>
          <div style={{flex:1}}>
            <p style={{fontSize:'14px',fontWeight:700,margin:0}}>Demande à ton répétiteur</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',margin:'2px 0 0'}}>Il sait où tu t'es arrêtée.</p>
          </div>
          <span className="mm-press-sm" style={{width:'46px',height:'46px',borderRadius:'50%',background:'var(--action-transforme)',
            display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}>
            <Icon name="chat" size={19} color="#fff" strokeWidth={2.2} />
          </span>
        </div>
        <QuotaMeter used={2} total={5} style={{marginTop:'13px'}} />
      </GlassPanel>

      <NSourcil style={{'--i':9,marginTop:'22px'}}>Dans ton espace</NSourcil>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':9,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="card" size={14} />} title="Mes paiements" meta="1 transaction"
          trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="doc" size={14} />} title="Mes certificats" meta="0 émis"
          trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="download" size={14} />} title="Téléchargements" meta="3 leçons · 21 Mo"
          trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} last />
      </GlassPanel>
    </NativeScreen>
  );
}

/* ══ 4 · LECTEUR DE LEÇON ══
   Faux verre partout, parce que tout défile. Le bouton plein écran est l'entrée du seul
   écran paysage du produit. */
function NatLecteur({os}){
  return (
    <NativeScreen os={os} territory="forme" retour="Cours" titre={os==='android'?'Module 3 · Leçon 5':null}
      droite={<IconButton label="Télécharger"><Icon name="download" size={17} strokeWidth={2.2} /></IconButton>}
      tabbar={<TabBar items={ONGLETS()} active="Cours" />}>
      <NSourcil style={{marginTop:'6px'}}>Module 3 · Leçon 5</NSourcil>
      <NTitre size={26} lines={['Les mots que','tapent tes clients']} />

      <div className="rv-s" style={{'--i':4,marginTop:'16px',height:'178px',borderRadius:'var(--r-media)',
        background:'linear-gradient(140deg,#0057BC,#6C23DD 58%,#F38B0A)',position:'relative',
        display:'grid',placeItems:'center',boxShadow:'0 14px 34px rgba(0,87,188,.24)'}}>
        <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Lire la leçon"
          style={{width:'62px',height:'62px',borderRadius:'50%',background:'rgba(255,255,255,.94)',
            display:'grid',placeItems:'center',cursor:'pointer'}}>
          <Icon name="play" size={21} color="#0E1116" />
        </span>
        <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Plein écran"
          style={{position:'absolute',right:'12px',top:'12px',width:'38px',height:'38px',borderRadius:'50%',
            background:'rgba(0,0,0,.34)',display:'grid',placeItems:'center',cursor:'pointer'}}>
          <Icon name="forward" size={16} color="#fff" strokeWidth={2.4} />
        </span>
        <div style={{position:'absolute',left:'14px',right:'14px',bottom:'13px',display:'flex',
          alignItems:'center',gap:'9px',color:'#fff',fontFamily:'var(--f-mono)',fontSize:'10.5px'}}>
          <span>03:12</span>
          <span style={{flex:1,height:'3px',borderRadius:'2px',background:'rgba(255,255,255,.34)'}}>
            <b className="bar-fill" style={{display:'block',width:'8%',height:'100%',background:'#fff',borderRadius:'2px'}} />
          </span>
          <span>08:24</span>
        </div>
      </div>

      <div className="rv" style={{'--i':5,marginTop:'16px'}}>
        <ChipRow height={36} options={['Vidéo','Transcription','Mes notes','Ressources']} value="Vidéo" />
      </div>

      <div className="rv" style={{'--i':6,display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:'12px',marginTop:'22px'}}>
        <NSourcil>Le programme</NSourcil>
        <span className="mm-num" style={{fontSize:'12.5px',color:'var(--text-muted)'}}>34 %</span>
      </div>
      <ProgressBar value={34} className="rv" style={{'--i':6,marginTop:'8px'}} />

      <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':7,marginTop:'14px'}}>
        <LessonRow state="done" title="Choisir tes mots-clés" meta="06:12 · téléchargé · 12 Mo" />
        <LessonRow state="done" title="Ce que cherche un client à Dakar" meta="07:48 · téléchargé · 9 Mo" />
        <LessonRow state="current" icon={<Icon name="play" size={13} color="#fff" />}
          iconBackground="linear-gradient(135deg,#0057BC,#6C23DD)"
          title="Les mots que tapent tes clients" meta="08:24 · en cours" />
        <LessonRow state="todo" title="Écrire une fiche qui remonte" meta="07:03" />
        <LessonRow state="todo" icon={<Icon name="doc" size={13} />} title="Exercice : ta liste de 20 mots" meta="PDF · 180 Ko" last />
      </GlassPanel>
      <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>
        Chaque poids est affiché parce que le forfait est compté. Le téléchargement se fait en Wi-Fi par défaut.</p>
    </NativeScreen>
  );
}

/* ══ 5 · MES NOTES ══
   Elles survivent à la fin du cours et suivent d'un appareil à l'autre. En natif, le
   bouton d'ajout est flottant — c'est le seul écran du lot qui en a un. */
function NatNotes({os}){
  const notes = [
    ['Lister ce que la cliente dit à voix haute, pas ce que je vends.','04/09 · 21:14 · Leçon 5'],
    ['« cosmétique Almadies » plutôt que « cosmétique Sénégal ».','04/09 · 21:02 · Leçon 5'],
    ['Vérifier les horaires de la fiche Google avant le week-end.','28/08 · 08:47 · Leçon 4'],
    ['Garder les 20 mots qui reviennent, jeter le reste.','27/08 · 22:31 · Leçon 4'],
    ['Photos de la boutique : refaire celles de la vitrine.','21/08 · 19:05 · Leçon 2']
  ];
  return (
    <NativeScreen os={os} territory="forme" retour="Leçon" titre={os==='android'?'Mes notes':null}
      droite={<IconButton label="Chercher dans mes notes"><Icon name="search" size={17} strokeWidth={2.4} /></IconButton>}
      tabbar={<TabBar items={ONGLETS()} active="Cours" />}>
      <NSourcil style={{marginTop:'6px'}}>Module 3 · Leçon 5</NSourcil>
      <NTitre size={27} lines={['Mes notes']} />
      <div className="rv" style={{'--i':3,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'10px'}}>
        <span className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)'}}>14 notes · 6 leçons</span>
        <Tag>Toi seule les lis</Tag>
      </div>

      <div className="rv" style={{'--i':4,marginTop:'16px'}}>
        <ChipRow height={36} options={['Vidéo','Transcription','Mes notes','Ressources']} value="Mes notes" />
      </div>

      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':5,marginTop:'14px'}}>
        {notes.map(([t,d],i)=>(
          <LessonRow key={t} state="plain" icon={<Icon name="comment" size={14} />} title={t} meta={d}
            last={i===notes.length-1}
            trailing={<Icon name="forward" size={16} color="var(--text-faint)" strokeWidth={2.4} />} />
        ))}
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'16px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce qu'elles deviennent</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Elles survivent à la fin du cours et te suivent d'un appareil à l'autre. Écrire une note rapporte de l'expérience ; la rééditer n'en rapporte pas.</p>
      </GlassPanel>

      {/* Bouton flottant : au-dessus de la barre d'onglets, dans la zone sûre. */}
      <div style={{position:'absolute',right:'18px',bottom:(NATIF[os].bottom + 96)+'px',zIndex:9}}>
        <span className="rv-s mm-press-sm" role="button" tabIndex={0} aria-label="Écrire une note"
          style={{'--i':7,width:'56px',height:'56px',borderRadius:os==='android'?'18px':'50%',
            background:'var(--action-forme)',display:'grid',placeItems:'center',
            boxShadow:'0 10px 26px rgba(0,87,188,.38)',cursor:'pointer'}}>
          <Icon name="plus" size={22} color="#fff" strokeWidth={2.6} />
        </span>
      </div>
    </NativeScreen>
  );
}

/* ══ 6 · CERTIFICAT ══
   Le second moment scénarisé : une brillance passe deux fois, puis plus jamais. En natif,
   le partage passe par la feuille système — d'où le bouton unique au lieu de deux. */
function NatCertificat({os}){
  return (
    <NativeScreen os={os} territory="forme" retour="Espace"
      droite={<IconButton label="Partager"><Icon name="share" size={17} strokeWidth={2} /></IconButton>}>
      <NSourcil style={{marginTop:'6px'}}>Formation terminée · 12/09/2026</NSourcil>
      <NTitre size={31} lines={["C'EST FAIT,",'AÏSSATOU.']} />

      <GlassPanel level="hero" padding={20} className="rv sheen" style={{'--i':4,marginTop:'20px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
          <Wordmark brand="signature" size={27} short />
          <Tag tone="ok">Vérifié</Tag>
        </div>
        <NSourcil style={{marginTop:'18px'}}>Certificat de fin de formation</NSourcil>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'20px',letterSpacing:'-.035em',
          lineHeight:1.05,margin:'6px 0 0'}}>Référencement local pour ton commerce</p>
        <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'10px 0 0'}}>Délivré à <b style={{color:'var(--ink)'}}>Aïssatou Ndiaye</b></p>
        <p className="mm-num" style={{fontSize:'16px',fontWeight:700,letterSpacing:'.07em',margin:'14px 0 0'}}>MM-C7K4-9RTX-2081</p>
      </GlassPanel>

      <Button tone="forme" className="rv" style={{'--i':5,marginTop:'18px'}}>
        <Icon name="share" size={17} strokeWidth={2.2} /> Partager mon certificat
      </Button>
      <p className="rv" style={{'--i':5,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>
        Ce qui part est le lien de vérification, pas une image.</p>

      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'18px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que ce code prouve</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Les <b className="mm-num" style={{color:'var(--ink)'}}>47</b> leçons ont été recomptées côté serveur au moment de l'émission. Ce n'est pas une image : c'est un enregistrement que ton futur employeur contrôle lui-même, sans compte.</p>
      </GlassPanel>

      <GlassPanel padding={17} className="rv" style={{'--i':7,marginTop:'12px'}}>
        <DocLine label="Titulaire" value="Aïssatou Ndiaye" />
        <DocLine label="Émis le" value="12/09/2026" />
        <DocLine label="Leçons validées" value="47 / 47" last />
      </GlassPanel>
    </NativeScreen>
  );
}

const MM_EXPORT = {ONGLETS,NatCatalogue,NatRetourPaiement,NatEspace,NatLecteur,NatNotes,NatCertificat};
Object.assign(window, MM_EXPORT);
window.MMNAT = Object.assign(window.MMNAT||{}, MM_EXPORT);
