const { GlassPanel, TerritoryCard, Button, ChipRow, Segmented, PriceBlock, ProgressBar, LessonRow, Tag, Avatar, DocLine, CheckLine, Field, Pipeline, StatTile, Icon, IconButton, MediaCard } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LE CLUB DES DIGITOS EN 1440 px — LES HUIT ONGLETS.

   Le Club n'avait qu'UNE page desktop pour huit onglets. C'est le défaut que ce fichier
   corrige, et il n'est pas cosmétique : le Club est un produit dans le produit — un fil,
   un annuaire, un agenda, un classement, une bourse de missions. Le réduire à une page,
   c'est le vendre pour ce qu'il n'est pas.

   D'où `ClubFrame` : une SOUS-COQUE. La navigation latérale de l'espace apprenant reste
   (le Club est une section, pas une application séparée), et une bande de huit onglets
   s'ajoute sous le titre.

   ── LE VRAI GAIN DE LA LARGEUR ──
   En 390 px, le bilan d'abonnement devait être le PREMIER OBJET du fil : la seule façon
   de garantir qu'un abonné annuel le voie avant d'oublier son prix. Il entrait donc en
   concurrence avec le contenu, et il n'était visible que sur un onglet sur huit.

   Ici il passe dans le rail de droite, et devient **visible en permanence sur les huit
   onglets**. C'est ça, le gain : pas plus de contenu par rangée, mais une information
   permanente qui n'a plus à voler la première place.

   Corollaire : le rail n'est pas un dépotoir. Sur chaque onglet il porte le bilan, puis
   AU PLUS une chose contextuelle. Un rail à quatre cartes est un rail qu'on ne lit plus.
   ══════════════════════════════════════════════════════════════════════════════ */

const CLUB_ONGLETS = ['Fil','Discussions','Membres','Agenda','Classement','Opportunités','Informations','Parrainage'];

/* ── Le bilan d'abonnement : un seul composant, huit emplacements ──
   `ink` et non `night` : la page est claire, et un voile nuit y composerait avec le fond
   au lieu de rester sombre. Carte opaque, et sa portée `.dk` fait basculer les jetons de
   texte — aucun gris n'est écrit à la main. */
function BilanRail(){
  return (
    <GlassPanel level="ink" padding={18} className="rv">
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
        <div>
          <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',
            color:'var(--text-muted)',margin:0}}>Depuis février</p>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.032em',
            margin:'4px 0 0',color:'var(--text-body)'}}>Ce que ton abonnement t'a apporté</p>
        </div>
        <Tag tone="ok">Actif</Tag>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'15px'}}>
        {[['6','sessions suivies'],['14','opportunités vues'],['2','missions décrochées'],['31','messages écrits']].map(([n,l])=>(
          <div key={l}>
            <p className="mm-num" style={{fontSize:'21px',margin:0,color:'var(--text-body)'}}>{n}</p>
            <p style={{fontSize:'10.5px',color:'var(--text-muted)',lineHeight:1.3,margin:0}}>{l}</p>
          </div>
        ))}
      </div>
      <div style={{height:'1px',background:'rgba(255,255,255,.12)',margin:'15px 0'}} />
      <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:'10px'}}>
        <span style={{fontSize:'11.5px',color:'var(--text-muted)'}}>Échéance</span>
        <b className="mm-num" style={{fontSize:'12px',color:'var(--text-body)'}}>14/02/2027</b>
      </div>
      <p style={{fontSize:'11px',color:'var(--text-muted)',lineHeight:1.5,margin:'8px 0 0'}}>
        À l'échéance ton accès s'arrête. <b style={{color:'var(--text-body)'}}>Rien n'est prélevé automatiquement.</b></p>
    </GlassPanel>
  );
}

/** Sous-coque du Club. `aside` reçoit la chose contextuelle : le bilan est posé au-dessus,
 *  toujours, et sans que la page ait à y penser. */
function ClubFrame({onglet,sourcil,aside,children}){
  return (
    <AppFrame active="Le Club" sourcil={sourcil||'Membre depuis février · 8 onglets'}
      titre="Le Club des Digitos"
      aside={<React.Fragment>
        <BilanRail />
        {aside && <div style={{marginTop:'18px'}}>{aside}</div>}
      </React.Fragment>}>

      {/* La bande d'onglets. `ChipRow` en `layout="wrap"`, pas une réimplémentation : cette
          bande l'avait recopiée en ligne à 38 px et 6 px d'écart, deux valeurs qui
          n'existent nulle part dans le système. En desktop la place existe en hauteur, donc
          les huit passent à la ligne au lieu de défiler — ce que 390 px ne permettait pas. */}
      <div className="rv" style={{'--i':1,marginTop:'22px',paddingBottom:'18px',
        borderBottom:'1px solid var(--border-hair)'}}>
        <ChipRow layout="wrap" value={onglet} options={CLUB_ONGLETS} />
      </div>
      {children}
    </AppFrame>
  );
}

/* ══ 1 · FIL ══
   Le bilan étant passé dans le rail, le fil commence enfin par du CONTENU. En 390 px il
   commençait par un récapitulatif d'abonnement — c'était juste, mais c'était aussi la
   preuve qu'il manquait de la place. */
function ClubFilDesktop(){
  const pub = (ini,nom,cat,quand,txte,aime,rep,com,bg) => (
    <GlassPanel level="flat" padding={20} className="rv" style={{marginBottom:'12px'}}>
      <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
        <Avatar initials={ini} size={40} background={bg} />
        <div style={{flex:1}}>
          <p style={{fontSize:'14.5px',fontWeight:600,margin:0}}>{nom}</p>
          <p className="mm-num" style={{fontSize:'11px',color:'var(--text-faint)',margin:0}}>{cat} · {quand}</p>
        </div>
        <Tag>{cat}</Tag>
      </div>
      <p style={{fontSize:'14.5px',lineHeight:1.55,margin:'13px 0 0',maxWidth:'var(--measure-prose)'}}>{txte}</p>
      <div style={{display:'flex',gap:'20px',marginTop:'15px',alignItems:'center'}}>
        <span className="mm-press-sm" style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)',cursor:'pointer'}}>
          <Icon name="heart" size={16} color="#5A17BE" /><b className="mm-num" style={{fontSize:'12.5px'}}>{aime}</b></span>
        <span className="mm-press-sm" style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)',cursor:'pointer'}}>
          <Icon name="repeat" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>{rep}</b></span>
        <span className="mm-press-sm" style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)',cursor:'pointer'}}>
          <Icon name="comment" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>{com}</b></span>
      </div>
    </GlassPanel>
  );
  return (
    <ClubFrame onglet="Fil" sourcil="Membre depuis février · le fil"
      aside={<React.Fragment>
        <CEyebrow>Jeudi 10 septembre</CEyebrow>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':1,marginTop:'10px'}}>
          <div style={{display:'flex',gap:'11px'}}>
            <span style={{width:'38px',height:'38px',borderRadius:'12px',background:'var(--action-transforme)',
              display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="chat" size={17} color="#fff" /></span>
            <div><p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Ta fiche Google, en direct</p>
              <p className="mm-num" style={{fontSize:'11px',color:'var(--text-muted)',margin:'2px 0 0'}}>20:00 · en ligne</p></div>
          </div>
          <Tag tone="ok" style={{marginTop:'12px'}}>Tu es inscrite</Tag>
        </GlassPanel>
      </React.Fragment>}>

      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':2,marginTop:'20px'}}>
        <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <Avatar initials="A" size={40} background="linear-gradient(135deg,#6C23DD,#F38B0A)" />
          <div style={{flex:1}}>
            <Field placeholder="Une question, un résultat, un truc qui t'a servi…" style={{marginTop:0}} />
          </div>
          <Button tone="transforme" size="sm" fullWidth={false}>Publier</Button>
        </div>
        <div style={{display:'flex',gap:'7px',marginTop:'12px',paddingLeft:'52px'}}>
          {['Entraide','Outils','Clients'].map(c=><Tag key={c}>{c}</Tag>)}
        </div>
      </GlassPanel>

      <div className="rv" style={{'--i':3,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',marginTop:'24px'}}>
        <CEyebrow>Cette semaine</CEyebrow>
        <div style={{width:'300px'}}><ChipRow height={36} options={['Tout','Entraide','Outils','Clients']} value="Tout" /></div>
      </div>

      <div style={{marginTop:'12px'}}>
        {pub('SK','Seynabou K.','Entraide','il y a 2 h',
          "J'ai refait ma fiche Google en suivant le module 2. Trois appels en une semaine, sur des recherches « coiffure Ouakam ». Je mets ma liste de mots en commentaire si ça sert à quelqu'un.",
          12,3,7)}
        {pub('AT','Amadou T.','Outils','il y a 6 h',
          "Quelqu'un utilise un tableur pour suivre ses devis ? J'en suis à trente par mois et mon carnet ne suit plus. Je cherche quelque chose de simple, qui marche sur téléphone.",
          8,1,14,'linear-gradient(135deg,#F38B0A,#B4231F)')}
        {pub('NF','Ndèye F.','Clients','hier',
          "Un client ne répond plus après le devis. Trois semaines. Je relance une quatrième fois ou je laisse tomber ? J'ai peur de passer pour insistante.",
          21,2,15,'linear-gradient(135deg,#02AC9C,#0057BC)')}
      </div>

      <GlassPanel level="truth" className="rv" style={{'--i':4,marginTop:'18px',maxWidth:'74ch'}}>
        <CEyebrow style={{marginBottom:'6px'}}>Pourquoi le fil commence par du contenu</CEyebrow>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>En 390 px, le bilan d'abonnement devait occuper la première place : c'était la seule façon de garantir qu'un abonné annuel le voie. Ici il vit dans le rail, <b style={{color:'var(--ink)'}}>visible sur les huit onglets</b> — il n'a plus à voler la première place au contenu.</p>
      </GlassPanel>
    </ClubFrame>
  );
}

/* ══ 2 · DISCUSSIONS ══
   Par catégorie, jamais par date : quelqu'un qui cherche de l'aide cherche un SUJET.
   Deux colonnes, parce qu'un sujet tient en trois lignes et qu'une colonne unique en
   1440 px produirait des lignes de 90 caractères. */
function ClubDiscussionsDesktop(){
  const sujet = (t,cat,rep,quand,pile,extra,couleur) => (
    <div className="rv" style={{marginBottom:'12px'}}>
      <TerritoryCard stacked={false} territory={couleur} meta={cat+' · '+rep+' réponses'} title={t}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
          <span style={{display:'flex',alignItems:'center'}}>
            {pile.map((a,i)=><Avatar key={a} initials={a} size={26} style={{marginLeft:i?'-8px':0,border:'1.5px solid #fff'}} />)}
          </span>
          <span className="mm-num" style={{fontSize:'11.5px',color:'var(--card-ink-2)'}}>{extra} · {quand}</span>
        </div>
      </TerritoryCard>
    </div>
  );
  return (
    <ClubFrame onglet="Discussions" sourcil="Membre depuis février · les discussions"
      aside={<React.Fragment>
        <CEyebrow>Ce que tu as écrit</CEyebrow>
        <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':1,marginTop:'10px'}}>
          <LessonRow state="plain" icon={<Icon name="comment" size={13} />} title="Ma liste de 20 mots-clés" meta="14 réponses" />
          <LessonRow state="plain" icon={<Icon name="comment" size={13} />} title="Comment tu factures un premier client ?" meta="6 réponses" last />
        </GlassPanel>
        <p className="rv" style={{'--i':2,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>
          Le décompte dérive des réponses stockées. Ce n'est pas un compteur libre.</p>
      </React.Fragment>}>

      <div className="rv" style={{'--i':2,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',marginTop:'20px'}}>
        <div style={{width:'380px'}}><ChipRow options={['Toutes · 41','Entraide','Outils','Clients']} value="Toutes · 41" /></div>
        <Button tone="transforme" size="sm" fullWidth={false}>Poser une question</Button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginTop:'18px'}}>
        <div>
          {sujet(<>Comment tu factures<br />un premier client ?</>,'Entraide',14,'il y a 3 h',['MB','AT','NF'],'+9','transforme')}
          {sujet(<>Le meilleur outil gratuit<br />pour les mots-clés</>,'Outils',6,'il y a 6 h',['SK','IB'],'+4','forme')}
          {sujet(<>Wave ou Orange Money<br />pour encaisser ?</>,'Outils',9,'hier',['AD','FT'],'+7','forme')}
        </div>
        <div>
          {sujet(<>Un client ne répond plus<br />après le devis</>,'Clients',21,'hier',['AD','FT','MB'],'+15','rose')}
          {sujet(<>Combien facturer une fiche<br />Google en 2026 ?</>,'Clients',17,'il y a 2 j',['NF','SK','IB'],'+11','rose')}
          {sujet(<>Je travaille seule et je<br />n'arrive plus à suivre</>,'Entraide',12,'il y a 3 j',['MB','AD'],'+8','transforme')}
        </div>
      </div>

      <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'18px',maxWidth:'74ch'}}>
        <CEyebrow style={{marginBottom:'6px'}}>Classé par sujet, pas par date</CEyebrow>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Quelqu'un qui cherche de l'aide cherche un <b style={{color:'var(--ink)'}}>sujet</b>, pas ce qui s'est dit mardi. Les catégories sont les trois seules qui reviennent vraiment — en ajouter une quatrième reviendrait à créer une pièce vide.</p>
      </GlassPanel>
    </ClubFrame>
  );
}

/* ══ 3 · MEMBRES ══
   Annuaire à gauche, fiche à droite. En 390 px c'étaient deux écrans successifs ; ici on
   parcourt la liste sans perdre la fiche ouverte, et c'est tout le gain. */
function ClubMembresDesktop(){
  const ligne = (ini,nom,metier,niv,actif,bg) => (
    <LessonRow key={nom} state="plain" title={nom} meta={metier}
      icon={<Avatar initials={ini} size={34} background={bg} />} iconBackground="transparent"
      trailing={<span style={{display:'flex',alignItems:'center',gap:'10px'}}>
        <Tag>{niv}</Tag>
        {actif && <span style={{width:'7px',height:'7px',borderRadius:'50%',background:'var(--ok)'}} />}
      </span>} />
  );
  return (
    <ClubFrame onglet="Membres" sourcil="Membre depuis février · 9 membres dans ta vague"
      aside={<React.Fragment>
        <CEyebrow>Signaler</CEyebrow>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':1,marginTop:'10px',borderColor:'rgba(180,35,31,.3)'}}>
          <div style={{display:'flex',gap:'11px'}}>
            <span style={{width:'30px',height:'30px',borderRadius:'10px',background:'rgba(180,35,31,.12)',
              display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="alert" size={15} color="#B4231F" /></span>
            <div>
              <p style={{fontSize:'13.5px',fontWeight:700,color:'var(--stop)',margin:0}}>Signaler ce membre</p>
              <p style={{fontSize:'12px',color:'var(--text-muted)',lineHeight:1.5,margin:'4px 0 0'}}>Le signalement part à l'administration seule. La personne signalée ne le voit pas et ne peut pas l'annuler.</p>
            </div>
          </div>
        </GlassPanel>
      </React.Fragment>}>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'22px',marginTop:'20px',alignItems:'start'}}>
        <div>
          <div className="rv" style={{'--i':2,marginBottom:'12px'}}>
            <Field placeholder="Chercher un membre, un métier, une ville" style={{marginTop:0}}
              trailing={<Icon name="search" size={17} color="#5A6472" strokeWidth={2.2} />} />
          </div>
          <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':3}}>
            {ligne('SK','Seynabou K.','Coiffeuse · Ouakam','niv. 6',true)}
            {ligne('AT','Amadou T.','Menuisier · Pikine','niv. 5',false,'linear-gradient(135deg,#F38B0A,#B4231F)')}
            {ligne('NF','Ndèye F.','Couturière · Grand Yoff','niv. 5',true,'linear-gradient(135deg,#02AC9C,#0057BC)')}
            {ligne('MB','Moussa B.','Photographe · Almadies','niv. 4',false,'linear-gradient(135deg,#6C23DD,#0057BC)')}
            {ligne('AD','Aïda D.','Pâtissière · Yoff','niv. 4',true,'linear-gradient(135deg,#FF6E7F,#6C23DD)')}
            {ligne('IB','Ibrahima B.','Mécanicien · Thiaroye','niv. 3',false)}
          </GlassPanel>
          <p className="rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>
            Les six membres de ta vague qui ont rempli leur fiche. Les trois autres ne s'affichent pas :
            une fiche vide n'apprend rien à personne.</p>
        </div>

        <GlassPanel level="hero" padding={24} className="rv" style={{'--i':3}}>
          <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
            <Avatar initials="SK" size={62} />
            <div style={{flex:1}}>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'22px',letterSpacing:'-.035em',
                lineHeight:1,margin:0}}>Seynabou K.</p>
              <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'4px 0 0'}}>Coiffeuse · Ouakam, Dakar</p>
            </div>
          </div>
          <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
            <Tag>Membre depuis février</Tag><Tag tone="ok">Niveau 6</Tag><Tag>Entraide</Tag>
          </div>
          <Button tone="transforme" style={{marginTop:'16px'}}>Lui écrire</Button>
          <div style={{height:'1px',background:'var(--border-hair)',margin:'20px 0'}} />
          <CEyebrow>Ses publications</CEyebrow>
          <div style={{marginTop:'10px'}}>
            <LessonRow state="plain" icon={<Icon name="comment" size={13} />}
              title="J'ai refait ma fiche Google en suivant le module 2." meta="il y a 2 h · 12 j'aime" />
            <LessonRow state="plain" icon={<Icon name="comment" size={13} />}
              title="Ma liste de 20 mots, si ça sert à quelqu'un." meta="hier · 8 j'aime" />
            <LessonRow state="plain" icon={<Icon name="users" size={13} />}
              title="Présente à l'atelier fiche produit" meta="20/09 · Dakar" last />
          </div>
        </GlassPanel>
      </div>
    </ClubFrame>
  );
}

/* ══ 4 · AGENDA ══
   Le mois à gauche, les sessions à droite. Le calendrier n'existait pas en 390 px — il
   n'y tenait pas — et c'est la seule vraie addition de ce portage vers le desktop. */
function ClubAgendaDesktop(){
  const JOURS = ['L','M','M','J','V','S','D'];
  const marques = {10:'transforme',20:'digitalise',24:'transforme'};
  return (
    <ClubFrame onglet="Agenda" sourcil="Membre depuis février · 2 sessions à venir"
      aside={<React.Fragment>
        <CEyebrow>Tes inscriptions</CEyebrow>
        <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':1,marginTop:'10px'}}>
          <LessonRow state="done" title="Ta fiche Google, en direct" meta="10/09 · 20:00" />
          <LessonRow state="plain" icon={<Icon name="calendar" size={13} />} title="Écrire une fiche produit" meta="24/09 · 20:00" last />
        </GlassPanel>
        <p className="rv" style={{'--i':2,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>
          Te réinscrire ne crée pas de doublon, et personne ne peut t'inscrire à ta place.</p>
      </React.Fragment>}>

      <div style={{display:'grid',gridTemplateColumns:'300px 1fr',gap:'26px',marginTop:'20px',alignItems:'start'}}>
        {/* Le calendrier : l'addition que la largeur permet. */}
        <GlassPanel level="flat" padding={18} className="rv" style={{'--i':2}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px'}}>
            <IconButton label="Mois précédent"><Icon name="back" size={16} strokeWidth={2.4} /></IconButton>
            <p style={{fontSize:'14px',fontWeight:700,margin:0}}>Septembre 2026</p>
            <IconButton label="Mois suivant"><Icon name="forward" size={16} strokeWidth={2.4} /></IconButton>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'4px',marginTop:'16px'}}>
            {JOURS.map((j,i)=><span key={i} style={{textAlign:'center',fontFamily:'var(--f-mono)',fontSize:'9.5px',
              letterSpacing:'.1em',color:'var(--text-faint)',paddingBottom:'6px'}}>{j}</span>)}
            {Array.from({length:30},(_,i)=>i+1).map(d=>{
              const m = marques[d];
              return (
                <span key={d} className={m?'mm-press-sm':undefined} style={{aspectRatio:'1',display:'grid',placeItems:'center',
                  borderRadius:'10px',fontFamily:'var(--f-mono)',fontSize:'12px',position:'relative',
                  cursor:m?'pointer':'default',
                  background:m?'var(--fill-2)':'transparent',
                  fontWeight:m?700:400,
                  color:d===4?'var(--text-body)':'var(--text-muted)',
                  border:d===4?'1.5px solid var(--ink)':'1.5px solid transparent'}}>
                  {d}
                  {m && <i style={{position:'absolute',bottom:'4px',width:'5px',height:'5px',borderRadius:'50%',
                    background:m==='transforme'?'var(--mm-violet)':'var(--mm-teal)'}} />}
                </span>
              );
            })}
          </div>
          <div style={{display:'flex',gap:'14px',marginTop:'16px',paddingTop:'14px',borderTop:'1px solid var(--border-hair)'}}>
            <span style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11.5px',color:'var(--text-muted)'}}>
              <i style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--mm-violet)'}} />En ligne</span>
            <span style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'11.5px',color:'var(--text-muted)'}}>
              <i style={{width:'6px',height:'6px',borderRadius:'50%',background:'var(--mm-teal)'}} />À Dakar</span>
          </div>
        </GlassPanel>

        <div>
          <div className="rv" style={{'--i':3,width:'400px'}}>
            <Segmented options={['À venir · 3','Mes inscriptions · 2','Passées · 6']} value="À venir · 3" />
          </div>

          <CEyebrow style={{marginTop:'22px'}}>Jeudi 10 septembre</CEyebrow>
          <GlassPanel level="flat" padding={20} className="rv" style={{'--i':4,marginTop:'10px'}}>
            <div style={{display:'flex',gap:'14px'}}>
              <span style={{width:'46px',height:'46px',borderRadius:'14px',background:'var(--action-transforme)',
                display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="chat" size={21} color="#fff" /></span>
              <div style={{flex:1}}>
                <p style={{fontSize:'16px',fontWeight:700,margin:0}}>Ta fiche Google, en direct</p>
                <p className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)',margin:'3px 0 0'}}>20:00 → 21:00 · en ligne</p>
                <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'9px 0 0',maxWidth:'var(--measure-prose)'}}>
                  J'ouvre une vraie fiche et je la corrige devant vous, avec les erreurs laissées à l'écran.
                  Apporte la tienne si tu veux qu'on la regarde.</p>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginTop:'16px'}}>
              <Tag tone="ok">Tu es inscrite</Tag>
              <Button tone="ghost" size="sm" fullWidth={false}>
                <Icon name="calendar" size={16} strokeWidth={2.2} /> Ajouter à mon agenda</Button>
              <Button tone="quiet" size="sm" fullWidth={false}>Me désinscrire</Button>
            </div>
          </GlassPanel>

          <CEyebrow style={{marginTop:'22px'}}>Samedi 20 septembre</CEyebrow>
          <GlassPanel level="flat" padding={20} className="rv" style={{'--i':5,marginTop:'10px'}}>
            <div style={{display:'flex',gap:'14px'}}>
              <span style={{width:'46px',height:'46px',borderRadius:'14px',background:'var(--action-digitalise)',
                display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="users" size={21} color="#fff" /></span>
              <div style={{flex:1}}>
                <p style={{fontSize:'16px',fontWeight:700,margin:0}}>Atelier fiche produit</p>
                <p className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)',margin:'3px 0 0'}}>10:00 → 13:00 · Dakar, Point E</p>
                <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'9px 0 0',maxWidth:'var(--measure-prose)'}}>
                  Trois heures, en présentiel, à écrire les fiches de vos produits ensemble. Places
                  réservées aux membres.</p>
              </div>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'16px'}}>
              <span className="mm-num" style={{fontSize:'13px',color:'var(--mm-teal-t)'}}>4 / 12 places</span>
              <Button tone="digitalise" size="sm" fullWidth={false}>Je réserve</Button>
            </div>
          </GlassPanel>

          <CEyebrow style={{marginTop:'22px'}}>Jeudi 24 septembre</CEyebrow>
          <GlassPanel level="flat" padding={20} className="rv" style={{'--i':6,marginTop:'10px'}}>
            <div style={{display:'flex',gap:'14px'}}>
              <span style={{width:'46px',height:'46px',borderRadius:'14px',background:'var(--action-transforme)',
                display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="chat" size={21} color="#fff" /></span>
              <div style={{flex:1}}>
                <p style={{fontSize:'16px',fontWeight:700,margin:0}}>Écrire une fiche produit qui vend</p>
                <p className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)',margin:'3px 0 0'}}>20:00 → 21:00 · en ligne</p>
              </div>
              <Button tone="transforme" size="sm" fullWidth={false}>Je m'inscris</Button>
            </div>
          </GlassPanel>

          <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'18px',maxWidth:'74ch'}}>
            <CEyebrow style={{marginBottom:'6px'}}>Les sessions ont lieu même si nous sommes quatre</CEyebrow>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>C'est un des cinq engagements du Club, et il ne dépend que de moi. L'agenda est publié un mois à l'avance, et une session annoncée n'est jamais annulée pour manque de monde.</p>
          </GlassPanel>
        </div>
      </div>
    </ClubFrame>
  );
}

const MM_EXPORT = {CLUB_ONGLETS,BilanRail,ClubFrame,ClubFilDesktop,ClubDiscussionsDesktop,ClubMembresDesktop,ClubAgendaDesktop};
Object.assign(window, MM_EXPORT);
window.MMDASH = Object.assign(window.MMDASH||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('DashboardsClub.js');
