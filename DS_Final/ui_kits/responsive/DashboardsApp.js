const { GlassPanel, TerritoryCard, Button, ChipRow, Segmented, PriceBlock, ProgressBar, LessonRow, QuotaMeter, ChatBubble, Tag, Avatar, DocLine, CheckLine, MediaCard, Icon, IconButton, Field, Switch } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LES QUATRE AUTRES PAGES DE L'ESPACE APPRENANT, EN 1440 px.

   Avec « Mon espace » (dans Dashboards.js), les cinq entrées de la navigation sont
   couvertes. Toutes partagent `AppFrame` : navigation 250 px, colonne de travail, et
   un panneau de 340 px seulement quand il y a vraiment quelque chose à y mettre.

   Une page sans panneau n'affiche pas un panneau vide — la colonne de travail prend
   la place. C'est ce qui distingue une disposition à trois colonnes d'une disposition
   à deux colonnes qui aurait été étirée.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ══ MES COURS ══
   Le catalogue de ce qu'elle possède, pas celui de ce qu'elle pourrait acheter.
   Panneau de droite : la reprise, pour qu'elle soit atteignable depuis n'importe
   quelle page de cours et pas seulement depuis l'accueil. */
function CoursDesktop(){
  return (
    <AppFrame active="Mes cours" sourcil="2 inscriptions · accès à vie" titre="Mes cours"
      aside={<React.Fragment>
        <CEyebrow>Reprendre où tu en étais</CEyebrow>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':1,marginTop:'10px'}}>
          <p style={{fontSize:'14px',fontWeight:600,lineHeight:1.35,margin:0}}>Les mots que tapent tes clients</p>
          <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'4px 0 0'}}>module 3 · leçon 5 · 08:24</p>
          <ProgressBar value={34} style={{marginTop:'12px'}} />
          <Button tone="primary" size="sm" style={{marginTop:'12px'}}>Reprendre</Button>
        </GlassPanel>
        <CEyebrow style={{marginTop:'24px'}}>Téléchargé pour le hors connexion</CEyebrow>
        <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':2,marginTop:'10px'}}>
          <LessonRow state="done" title="Choisir tes mots-clés" meta="vidéo · 12 Mo" />
          <LessonRow state="done" title="Ce que cherche un client à Dakar" meta="vidéo · 9 Mo" />
          <LessonRow state="todo" title="Exercice : ta liste de 20 mots" meta="PDF · 180 Ko" last />
        </GlassPanel>
        <p className="rv" style={{'--i':3,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>Chaque poids est affiché parce que le forfait est compté. Le téléchargement se fait en Wi-Fi par défaut.</p>
      </React.Fragment>}>

      <div className="rv" style={{'--i':1,marginTop:'20px'}}><ChipRow options={['Tout · 2','En cours · 1','Terminé · 0']} value="Tout · 2" /></div>

      <div className="rv" style={{'--i':2,marginTop:'18px'}}>
        <TerritoryCard layout="grid" territory="forme" meta="SEO · 6 modules · 47 leçons" title="Référencement local pour ton commerce" titleSize={22}>
          <ProgressBar value={34} style={{marginTop:'14px'}} />
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'12px'}}>
            <span className="mm-num" style={{fontSize:'13px',color:'var(--card-ink-2)'}}>16 / 47 leçons · acheté le 04/09/2026</span>
            <Button tone="primary" size="sm" fullWidth={false}>Continuer</Button>
          </div>
        </TerritoryCard>
      </div>

      <div className="rv" style={{'--i':3,marginTop:'12px'}}>
        <TerritoryCard layout="grid" territory="transforme" meta="IA · 9 modules · 68 leçons" title="L'IA au service de ta prospection" titleSize={22}>
          <ProgressBar value={0} style={{marginTop:'14px'}} />
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'12px'}}>
            <span className="mm-num" style={{fontSize:'13px',color:'var(--card-ink-2)'}}>0 / 68 leçons · pas encore commencé</span>
            <Button tone="transforme" size="sm" fullWidth={false}>Commencer</Button>
          </div>
        </TerritoryCard>
      </div>

      <CEyebrow style={{marginTop:'26px'}}>Tes certificats</CEyebrow>
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':4,marginTop:'10px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'14px'}}>
          <span style={{width:'44px',height:'44px',borderRadius:'14px',background:'var(--fill-1)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>
            <Icon name="doc" size={20} color="var(--text-faint)" />
          </span>
          <div style={{flex:1}}>
            <p className="mm-num" style={{fontSize:'23px',margin:0}}>0 certificat</p>
            <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'2px 0 0'}}>Le premier arrive à la fin d'une formation. Son code se vérifie sans compte.</p>
          </div>
        </div>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'16px'}}>
        <CEyebrow style={{marginBottom:'6px'}}>Ce qui reste à toi, quoi qu'il arrive</CEyebrow>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>L'accès est à vie, mises à jour comprises. Si je retravaille un module, tu as la version corrigée sans repayer. Si tu supprimes ton compte, les certificats déjà émis restent vérifiables.</p>
      </GlassPanel>
    </AppFrame>
  );
}

/* ══ MON RÉPÉTITEUR ══
   La conversation prend toute la largeur de travail ; le panneau porte la mémoire et
   le renommage. En 390 px, ces deux-là étaient un écran séparé qu'on ouvrait par le
   menu — ici ils sont visibles pendant qu'on discute, ce qui est le vrai gain. */
function RepetiteurDesktop(){
  const lignes = [
    ['Tu gères la page Instagram de ta cousine coiffeuse, le week-end.','depuis le 12 août'],
    ['Tu vends des cosmétiques aux Almadies.','depuis le 12 août'],
    ["Ton objectif : être trouvable sur Google Maps avant décembre.",'depuis le 28 août'],
    ['Tu préfères les réponses courtes, en trois points.','depuis le 2 septembre'],
    ['Tu travailles surtout le soir, après 21 h.','depuis le 4 septembre']
  ];
  return (
    <AppFrame active="Mon répétiteur" sourcil="3 / 5 questions aujourd'hui" titre="Répétiteur"
      aside={<React.Fragment>
        <CEyebrow>Son nom</CEyebrow>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':1,marginTop:'10px'}}>
          <Field label="Comment tu l'appelles" value="Répétiteur" style={{marginTop:0}} hint="Le nom ne change que pour toi." />
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'12px'}}>
            {['Répétiteur','Prof','Coach','Tonton'].map((p,i)=>(
              <span key={p} className="mm-press-sm" style={{height:'36px',display:'inline-flex',alignItems:'center',padding:'0 13px',borderRadius:'var(--r-pill)',
                fontSize:'12.5px',fontWeight:i===0?600:500,cursor:'pointer',
                background:i===0?'var(--ink)':'var(--ctl-off-bg)',color:i===0?'var(--text-on-primary)':'var(--text-muted)',
                border:'1px solid '+(i===0?'var(--ink)':'var(--ctl-off-brd)')}}>{p}</span>
            ))}
          </div>
        </GlassPanel>
        <CEyebrow style={{marginTop:'24px'}}>Ce qu'il a retenu</CEyebrow>
        <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':2,marginTop:'10px'}}>
          {lignes.map(([t,d],i)=>(
            <LessonRow key={t} state="plain" title={t} meta={d} last={i===lignes.length-1}
              icon={<Icon name="chat" size={13} color="#5A17BE" />} iconBackground="rgba(108,35,221,.12)"
              trailing={<span className="mm-press-sm" role="button" tabIndex={0} aria-label={'Oublier : '+t}
                style={{width:'var(--touch-aa)',height:'var(--touch-aa)',borderRadius:'50%',background:'rgba(180,35,31,.1)',display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}>
                <Icon name="trash" size={13} color="#B4231F" strokeWidth={2.2} /></span>} />
          ))}
        </GlassPanel>
        <Button tone="quiet" fullWidth className="rv" style={{'--i':3,marginTop:'12px',color:'var(--stop)'}}>Tout effacer</Button>
        <p className="rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>L'effacement est immédiat et ne passe pas par le support. Le nom que tu lui as donné ne s'efface pas avec.</p>
      </React.Fragment>}>

      <QuotaMeter used={3} total={5} label="3 / 5 questions posées aujourd'hui" className="rv" style={{marginTop:'18px'}} />

      <div style={{display:'flex',flexDirection:'column',gap:'12px',marginTop:'22px',maxWidth:'var(--measure-prose)'}}>
        <div className="rv" style={{'--i':1}}><ChatBubble>Salut Aïssatou. Je suis ton répétiteur — tu peux me donner un autre nom quand tu veux. Tu t'es arrêtée à la leçon 5 du module 3, « Les mots que tapent tes clients ». On la reprend, ou tu as une question ?</ChatBubble></div>
        <div className="rv" style={{'--i':2,display:'flex',justifyContent:'flex-end'}}><ChatBubble from="me">Comment je choisis mes mots-clés ?</ChatBubble></div>
        <div className="rv" style={{'--i':3}}>
          <ChatBubble>Trois points, dans cet ordre :<br /><br />
            <b>1.</b> Ce que tes clientes disent à voix haute quand elles entrent — pas ce que toi tu vends.<br />
            <b>2.</b> Le nom de ton quartier. « Cosmétique Almadies » convertit mieux que « cosmétique Sénégal ».<br />
            <b>3.</b> Ce que tapent celles qui ne te connaissent pas encore.</ChatBubble>
        </div>
        <div className="rv" style={{'--i':4}}>
          <GlassPanel level="flat" padding={16} style={{maxWidth:'420px'}}>
            <CEyebrow style={{fontSize:'10px'}}>Depuis ton cours</CEyebrow>
            <p style={{fontSize:'13.5px',fontWeight:600,margin:'6px 0 0'}}>Module 3, leçon 4 — « Ce que cherche un client à Dakar »</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'6px 0 0'}}>Je ne cite que des leçons de tes formations. Jamais un contenu que tu n'as pas.</p>
            <Button tone="quiet" size="sm" style={{marginTop:'10px'}}>Ouvrir la leçon</Button>
          </GlassPanel>
        </div>
        <div className="rv" style={{'--i':5}}><ChatBubble typing /></div>
      </div>

      <GlassPanel level="flat" padding={16} className="rv" style={{'--i':6,marginTop:'20px',maxWidth:'var(--measure-prose)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'14px',flexWrap:'wrap'}}>
          <p style={{flex:1,minWidth:'220px',fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Il te reste <b className="mm-num" style={{color:'var(--ink)'}}>2</b> questions aujourd'hui. Remis à zéro à minuit — un pack ne se périme pas.</p>
          <Button tone="quiet" size="sm" fullWidth={false}>30 q · 500 F</Button>
          <Button tone="transforme" size="sm" fullWidth={false}>Lite · 3 000/m</Button>
        </div>
      </GlassPanel>

      <div style={{display:'flex',alignItems:'center',gap:'10px',marginTop:'16px',maxWidth:'var(--measure-prose)'}}>
        <div style={{flex:1}}><Field placeholder="Pose ta question" style={{marginTop:0}} /></div>
        <span className="mm-press-sm" style={{width:'52px',height:'52px',borderRadius:'50%',background:'var(--action-transforme)',display:'grid',placeItems:'center',cursor:'pointer',flex:'0 0 auto'}}>
          <Icon name="send" size={19} color="#fff" strokeWidth={2.6} />
        </span>
      </div>
    </AppFrame>
  );
}

/* ══ LE CLUB ══
   Le bilan d'abonnement est en tête, et il est PERMANENT — un abonné annuel redécouvre
   son prix d'un coup après onze mois de silence. Le panneau porte l'agenda : c'est la
   seule chose du Club qui a une échéance. */
function ClubDesktop(){
  return (
    <AppFrame active="Le Club" sourcil="Membre depuis février · échéance 14/02/2027" titre="Le Club des Digitos"
      aside={<React.Fragment>
        <CEyebrow>À venir</CEyebrow>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':1,marginTop:'10px'}}>
          <div style={{display:'flex',gap:'11px'}}>
            <span style={{width:'38px',height:'38px',borderRadius:'12px',background:'var(--action-transforme)',display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="chat" size={17} color="#fff" /></span>
            <div><p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Ta fiche Google, en direct</p>
            <p className="mm-num" style={{fontSize:'11px',color:'var(--text-muted)',margin:'2px 0 0'}}>jeudi 10/09 · 20:00 · en ligne</p></div>
          </div>
          <Tag tone="ok" style={{marginTop:'12px'}}>Tu es inscrite</Tag>
        </GlassPanel>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':2,marginTop:'10px'}}>
          <div style={{display:'flex',gap:'11px'}}>
            <span style={{width:'38px',height:'38px',borderRadius:'12px',background:'var(--action-digitalise)',display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="users" size={17} color="#fff" /></span>
            <div><p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Atelier fiche produit</p>
            <p className="mm-num" style={{fontSize:'11px',color:'var(--text-muted)',margin:'2px 0 0'}}>samedi 20/09 · Dakar, Point E</p></div>
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px',marginTop:'12px'}}>
            <span className="mm-num" style={{fontSize:'12.5px',color:'var(--mm-teal-t)'}}>4 / 12 places</span>
            <Button tone="digitalise" size="sm" fullWidth={false}>Je réserve</Button>
          </div>
        </GlassPanel>
        <p className="rv" style={{'--i':3,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>Te réinscrire ne crée pas de doublon, et personne ne peut t'inscrire à ta place.</p>
        <CEyebrow style={{marginTop:'24px'}}>Ta vague</CEyebrow>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':4,marginTop:'10px'}}>
          <p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>4<sup>e</sup> sur 9</p>
          <p style={{fontSize:'12px',color:'var(--text-muted)',lineHeight:1.5,margin:'4px 0 0'}}>Comparé aux gens arrivés en février, en même temps que toi. Pas à ceux qui ont deux ans d'avance.</p>
        </GlassPanel>
      </React.Fragment>}>

      {/* Le bilan, premier objet et permanent.
          `ink` et non `night` : la page est CLAIRE, et un voile nuit y composerait avec le
          fond au lieu de rester sombre. La carte est opaque, et sa portée .dk fait basculer
          les jetons de texte — aucun gris n'est écrit à la main ici. */}
      <GlassPanel level="ink" padding={20} className="rv" style={{'--i':1,marginTop:'20px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px'}}>
          <div>
            <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'var(--text-muted)',margin:0}}>Ton abonnement, depuis février</p>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.032em',margin:'5px 0 0',color:'var(--text-body)'}}>Ce qu'il t'a apporté</p>
          </div>
          <Tag tone="ok">Actif</Tag>
        </div>
        <div style={{display:'flex',gap:'32px',marginTop:'16px'}}>
          {[['6','sessions suivies'],['14','opportunités vues'],['2','missions décrochées']].map(([n,l])=>(
            <div key={l}>
              <p className="mm-num" style={{fontSize:'27px',margin:0,color:'var(--text-body)'}}>{n}</p>
              <p style={{fontSize:'11.5px',color:'var(--text-muted)',margin:0}}>{l}</p>
            </div>
          ))}
          <div style={{marginLeft:'auto',textAlign:'right'}}>
            <p className="mm-num" style={{fontSize:'13px',color:'var(--text-body)',margin:0}}>14/02/2027</p>
            <p style={{fontSize:'11.5px',color:'var(--text-muted)',margin:0}}>échéance · rien n'est prélevé automatiquement</p>
          </div>
        </div>
      </GlassPanel>

      <div className="rv" style={{'--i':2,marginTop:'20px'}}><ChipRow options={['Fil','Discussions','Membres','Opportunités','Parrainage']} value="Fil" /></div>

      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':3,marginTop:'14px'}}>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <Avatar initials="SK" size={40} />
          <div style={{flex:1}}>
            <p style={{fontSize:'14.5px',fontWeight:600,margin:0}}>Seynabou K.</p>
            <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-faint)',margin:0}}>Entraide · il y a 2 h</p>
          </div>
          <Tag>Entraide</Tag>
        </div>
        <p style={{fontSize:'14.5px',lineHeight:1.55,margin:'12px 0 0',maxWidth:'var(--measure-prose)'}}>J'ai refait ma fiche Google en suivant le module 2. Trois appels en une semaine, sur des recherches « coiffure Ouakam ». Je mets ma liste de mots en commentaire si ça sert à quelqu'un.</p>
        <div style={{display:'flex',gap:'20px',marginTop:'14px',alignItems:'center'}}>
          <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}><Icon name="heart" size={16} color="#5A17BE" /><b className="mm-num" style={{fontSize:'12.5px'}}>12</b></span>
          <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}><Icon name="repeat" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>3</b></span>
          <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}><Icon name="comment" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>7</b></span>
        </div>
      </GlassPanel>

      <div className="rv" style={{'--i':4,marginTop:'12px'}}>
        <TerritoryCard layout="grid" territory="transforme" meta="Mission · Dakar · publiée hier" title="Fiche Google pour trois boutiques" titleSize={20}>
          <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
            <PriceBlock amount="180 000" size={21} note="Budget annoncé par la personne qui publie" />
            <Button tone="transforme" size="sm" fullWidth={false}>Postuler</Button>
          </div>
        </TerritoryCard>
      </div>

      <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'16px'}}>
        <CEyebrow style={{marginBottom:'6px'}}>Pourquoi ce bilan est en tête, et pas à l'échéance</CEyebrow>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Un abonnement annuel ne supprime pas le renoncement, il le concentre sur un instant. Le bilan est donc permanent, pas terminal. Et je ne t'annonce pas un nombre de membres : il serait faux, et tu le vérifierais au premier écran.</p>
      </GlassPanel>
    </AppFrame>
  );
}

/* ══ MON PROFIL ══
   Deux colonnes de travail plutôt qu'un panneau : les réglages n'ont pas de « contexte
   permanent » à afficher à côté. La suppression de compte est en bas, complète, avec
   ce qui part et ce qui reste. */
function ProfilDesktop(){
  return (
    <AppFrame active="Mon profil" sourcil="Compte créé le 12 août 2026" titre="Mon profil">
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginTop:'20px',alignItems:'start'}}>

        <div>
          <GlassPanel level="flat" padding={20} className="rv" style={{'--i':1}}>
            <div style={{display:'flex',gap:'16px',alignItems:'center'}}>
              <Avatar initials="A" size={64} />
              <div style={{flex:1}}>
                <p style={{fontSize:'17px',fontWeight:700,margin:0}}>Aïssatou Ndiaye</p>
                <p className="mm-num" style={{fontSize:'12.5px',color:'var(--text-muted)',margin:'2px 0 0'}}>aissatou@exemple.sn</p>
              </div>
              <Button tone="quiet" size="sm" fullWidth={false}>Modifier</Button>
            </div>
          </GlassPanel>

          <CEyebrow style={{marginTop:'24px'}}>Langue et apparence</CEyebrow>
          <GlassPanel level="flat" padding={18} className="rv" style={{'--i':2,marginTop:'10px'}}>
            <Segmented options={['Français','English']} value="Français" />
            <p style={{fontSize:'11.5px',color:'var(--text-faint)',margin:'8px 0 16px'}}>Les articles sont traduits automatiquement. La version française est celle que j'écris.</p>
            <Segmented options={['Clair','Sombre','Système']} value="Clair" />
          </GlassPanel>

          <CEyebrow style={{marginTop:'24px'}}>Ton répétiteur</CEyebrow>
          <GlassPanel level="flat" padding={18} className="rv" style={{'--i':3,marginTop:'10px'}}>
            <Field label="Comment tu l'appelles" value="Répétiteur" style={{marginTop:0}} hint="Par défaut : Répétiteur. Le nom ne change que pour toi." />
          </GlassPanel>

          <CEyebrow style={{marginTop:'24px'}}>Mes paiements</CEyebrow>
          <GlassPanel level="flat" padding={20} className="rv" style={{'--i':4,marginTop:'10px'}}>
            <DocLine label="Référencement local" value="80 750 F · 04/09/2026" />
            <DocLine label="Le Club des Digitos" value="19 900 F · 14/02/2026" />
            <DocLine label="Total encaissé" value="100 650 F" last />
          </GlassPanel>
        </div>

        <div>
          <CEyebrow>Ce que je t'envoie</CEyebrow>
          <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':2,marginTop:'10px'}}>
            <LessonRow state="plain" title="Reprise de cours" meta="quand tu t'arrêtes plus de 5 jours" trailing={<Switch on />} />
            <LessonRow state="plain" title="Série quotidienne" meta="avant qu'elle ne se casse" trailing={<Switch on />} />
            <LessonRow state="plain" title="Digest du Club" meta="un résumé par semaine" trailing={<Switch on />} />
            <LessonRow state="plain" title={<span style={{color:'var(--text-faint)'}}>Par e-mail</span>} meta="pas encore disponible" trailing={<Switch disabled />} last />
          </GlassPanel>
          <GlassPanel level="truth" className="rv" style={{'--i':3,marginTop:'12px'}}>
            <CEyebrow style={{marginBottom:'6px'}}>Ce que ces interrupteurs font aujourd'hui</CEyebrow>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Ils règlent ce qui arrive dans ton centre de notifications, dans l'application. <b style={{color:'var(--ink)'}}>Aucun e-mail ne part encore</b> — la ligne grisée le dit au lieu de le laisser croire.</p>
          </GlassPanel>

          <CEyebrow style={{marginTop:'24px'}}>Tes données</CEyebrow>
          <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':4,marginTop:'10px'}}>
            <LessonRow state="plain" icon={<Icon name="download" size={14} />} title="Exporter mes données" meta="tout ce qui te concerne, en un fichier" trailing={<Button tone="quiet" size="sm">Exporter</Button>} last />
          </GlassPanel>

          <GlassPanel level="flat" padding={20} className="rv" style={{'--i':5,marginTop:'12px',borderColor:'rgba(180,35,31,.3)'}}>
            <p style={{fontSize:'15px',fontWeight:700,color:'var(--stop)',margin:0}}>Supprimer mon compte</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>Partent avec : tes 2 inscriptions et leur progression, tes 14 notes, la mémoire de ton répétiteur, et ton abonnement au Club — échéance au 14/02/2027, non remboursée.</p>
            <div style={{height:'1px',background:'var(--border-hair)',margin:'14px 0'}} />
            <CheckLine tone="ok" style={{marginTop:0,fontSize:'13px'}}>Tes certificats déjà émis restent vérifiables par leur code</CheckLine>
            <Field label={<>Écris <b className="mm-num" style={{color:'var(--ink)'}}>SUPPRIMER</b> pour confirmer</>} placeholder="SUPPRIMER" state="error" hint="Le texte ne correspond pas encore." />
            <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
              <Button disabled fullWidth={false} style={{flex:1}}>Supprimer définitivement</Button>
              <Button tone="quiet" fullWidth={false} style={{flex:1}}>J'exporte d'abord</Button>
            </div>
            <p style={{fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,margin:'10px 0 0'}}>La suppression est immédiate et ne passe pas par le support.</p>
          </GlassPanel>
        </div>
      </div>
    </AppFrame>
  );
}

const MM_EXPORT = {CoursDesktop,RepetiteurDesktop,ClubDesktop,ProfilDesktop};
Object.assign(window, MM_EXPORT);
window.MMDASH = Object.assign(window.MMDASH||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('DashboardsApp.js');
