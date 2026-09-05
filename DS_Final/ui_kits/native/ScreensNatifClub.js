const { GlassPanel, TerritoryCard, Button, ChipRow, Segmented, LessonRow, Tag, Avatar, PriceBlock, CheckLine, StatTile, Icon, IconButton, TabBar } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LE CLUB EN NATIF — LES HUIT ONGLETS, ET L'ÉCRAN VERROUILLÉ.

   Le lot 3 avait porté trois écrans du Club (le mur, le fil, l'agenda) et déclaré les
   cinq autres « portables à l'identique ». C'était vrai pour la mise en page, faux pour
   la navigation : DEUX manques se cachaient derrière cette phrase.

   1 · LA BANDE DES HUIT ONGLETS. Le web avait des bandes de quatre valeurs, différentes
       d'un onglet à l'autre. En natif la barre basse occupe déjà le bas de l'écran : la
       navigation interne du Club n'a qu'UN endroit possible, juste sous la barre de
       navigation haute, et elle doit porter les huit noms — pas quatre. Elle défile,
       elle est servie à 44 px (plancher tactile), et elle est la MÊME sur les neuf
       écrans, verrouillé compris.

   2 · L'ÉCRAN VERROUILLÉ N'ÉTAIT PAS PORTÉ DU TOUT. Or c'est celui que les règles des
       magasins changent le plus : le web y met un bouton d'achat, l'app n'en a pas le
       droit (App Store 3.1.1 · Play Payments). Le bouton devient un renvoi vers le site,
       et la phrase qui l'accompagne nomme le magasin.

   ── CE QUE LE CHÂSSIS CHANGE, ET RIEN DE PLUS ──

   · PUBLIER — Android pose un bouton flottant (Material), iOS met l'action en haut à
     droite de la barre de navigation. Même action, deux emplacements : c'est la seule
     divergence d'affordance de ce lot, et elle est imposée par les deux conventions.
   · PARTAGER — le code de parrainage passe par la feuille de partage SYSTÈME. Le web
     copiait dans le presse-papier et espérait ; ici l'app pousse vers WhatsApp.
   · LE DIGEST — il arrive en notification poussée. Le canal n'existait pas côté web,
     et c'est le premier onglet du Club à en profiter. Par e-mail : toujours rien.
   · L'AGENDA — « ajouter à mon agenda » (porté au lot 3, écran 20).

   Le reste du corps est identique aux 390 px du kit applicatif, à la lettre : mêmes
   compteurs, mêmes cartes, mêmes encarts de vérité, aucun nombre de membres.
   ══════════════════════════════════════════════════════════════════════════════ */

const ONGLETS_C = ()=>[
  {label:'Espace',icon:<Icon name="home" size={21} />},
  {label:'Cours',icon:<Icon name="book" size={21} />},
  {label:'Répétiteur',icon:<Icon name="chat" size={21} />},
  {label:'Club',icon:<Icon name="users" size={21} />},
  {label:'Profil',icon:<Icon name="user" size={21} />}
];

/* `BandeClub` et `CLUB_ORDRE` vivent dans NativeShell.js : neuf écrans répartis sur deux
   lots la portent, et une bande recopiée par fichier dérive.

   Publier. Android : bouton flottant au-dessus de la barre d'onglets. iOS : rien ici,
   l'action est dans la barre haute (voir `actionHaut`). */
function FabClub({os,children}){
  if (os !== 'android') return null;
  return (
    <div style={{position:'absolute',right:'16px',bottom:'calc(var(--tabbar-h) + 40px)',zIndex:9}}>
      <span className="mm-press" role="button" tabIndex={0} aria-label="Publier" style={{width:'56px',height:'56px',
        borderRadius:'18px',background:'var(--action-transforme)',display:'grid',placeItems:'center',cursor:'pointer',
        boxShadow:'0 10px 26px rgba(108,35,221,.4)'}}>{children}</span>
    </div>
  );
}
/* Publier : deux emplacements, une action. Sur Android le bouton flottant la porte, donc
   la barre haute reste vide — y ajouter une seconde entrée « publier » donnerait deux
   chemins pour un geste. Sur iOS, où le flottant n'est pas une convention, elle est en
   haut à droite. */
const actionHaut = (os,label,glyphe)=>os === 'ios'
  ? <IconButton label={label}>{glyphe}</IconButton>
  : undefined;

/* Enveloppe commune : châssis + barre basse + bande des huit. Écrite une fois, parce que
   la seule chose qui change d'un onglet à l'autre est ce qu'il y a dessous. */
function EcranClub({os,onglet,droite,children}){
  return (
    <NativeScreen os={os} territory="transforme" retour={os === 'ios' ? 'Espace' : undefined}
      titre={os === 'android' ? onglet : onglet} droite={droite}
      tabbar={<TabBar items={ONGLETS_C()} active="Club" />}>
      <BandeClub actif={onglet} />
      {children}
    </NativeScreen>
  );
}

/* ══ 1 · DISCUSSIONS ══
   Trois sujets, la catégorie devant le titre, et la pile de visages de ceux qui ont
   répondu. Le décompte dérive de la liste stockée : ce n'est pas un compteur libre. */
function NatClubDiscussions({os}){
  const pile = (list)=>(
    <span style={{display:'flex',alignItems:'center'}}>
      {list.map((a,i)=><Avatar key={a} initials={a} size={26} style={{marginLeft:i?'-8px':0,border:'1.5px solid #fff'}} />)}
    </span>
  );
  return (
    <EcranClub os={os} onglet="Discussions" droite={actionHaut(os,'Publier',<Icon name="send" size={17} strokeWidth={2.4} />)}>
      <div className="rv" style={{'--i':2,marginTop:'14px'}}>
        <ChipRow options={['Toutes','Entraide','Outils','Clients']} value="Toutes" />
      </div>
      <div style={{marginTop:'16px'}}>
        <div className="rv" style={{'--i':3}}>
          <TerritoryCard first territory="transforme" meta="Entraide · 14 réponses"
            title={<>Comment tu factures<br />un premier client ?</>}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              {pile(['MB','AT','NF'])}
              <span className="mm-num" style={{fontSize:'11.5px',color:'var(--card-ink-2)'}}>+9 · il y a 3 h</span>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':4}}>
          <TerritoryCard territory="forme" meta="Outils · 6 réponses"
            title={<>Le meilleur outil<br />gratuit pour les mots-clés</>}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              {pile(['SK','IB'])}
              <span className="mm-num" style={{fontSize:'11.5px',color:'var(--card-ink-2)'}}>+4 · il y a 6 h</span>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':5}}>
          <TerritoryCard territory="rose" meta="Clients · 21 réponses"
            title={<>Un client ne répond plus<br />après le devis</>}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              {pile(['AD','FT','MB'])}
              <span className="mm-num" style={{fontSize:'11.5px',color:'var(--card-ink-2)'}}>+15 · hier</span>
            </div>
          </TerritoryCard>
        </div>
      </div>
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'14px'}}>
        Quarante-et-un sujets ouverts, classés par catégorie. Le décompte affiché dérive des
        listes stockées : ce n'est pas un compteur libre.</p>
      <FabClub os={os}><Icon name="send" size={22} color="#fff" strokeWidth={2.5} /></FabClub>
    </EcranClub>
  );
}

/* ══ 2 · MEMBRES ══
   L'annuaire, pas la fiche. Six lignes remplies sur neuf arrivées : le manque est écrit
   au lieu d'être comblé par des fiches vides. */
function NatClubMembres({os}){
  const gens = [
    ['SK','Seynabou K.','Coiffeuse · Ouakam','Niveau 6',null],
    ['AT','Amadou T.','Menuisier · Grand-Yoff','Niveau 5','linear-gradient(135deg,#F38B0A,#B4231F)'],
    ['NF','Ndèye F.','Traiteur · Liberté 6','Niveau 5','linear-gradient(135deg,#02AC9C,#0057BC)'],
    ['IB','Ibrahima B.','Photographe · Point E','Niveau 4',null],
    ['MB','Mariama B.','Couturière · Yoff','Niveau 3','linear-gradient(135deg,#6C23DD,#0057BC)'],
    ['FT','Fatou T.','Pâtissière · Ouakam','Niveau 3','linear-gradient(135deg,#E4007C,#F38B0A)']
  ];
  return (
    <EcranClub os={os} onglet="Membres"
      droite={<IconButton label="Chercher"><Icon name="search" size={17} strokeWidth={2.4} /></IconButton>}>
      <div className="rv" style={{'--i':2,marginTop:'14px'}}>
        <ChipRow options={['Ta vague','Tous les quartiers','Même métier']} value="Ta vague" />
      </div>

      <NSourcil style={{'--i':3,marginTop:'20px'}}>Arrivés en février · 6 fiches remplies sur 9</NSourcil>
      <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':3,marginTop:'10px'}}>
        {gens.map(([ini,nom,quoi,niv,bg],k)=>(
          <LessonRow key={ini} state="plain" title={nom} meta={quoi} last={k === gens.length - 1}
            icon={<Avatar initials={ini} size={38} background={bg || undefined} />} iconBackground="transparent"
            trailing={<span style={{display:'flex',alignItems:'center',gap:'9px'}}>
              <Tag tone="ok">{niv}</Tag>
              <Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} /></span>} />
        ))}
      </GlassPanel>
      <p className="rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'12px'}}>
        Trois personnes de ta vague n'ont pas rempli leur fiche. Elles n'apparaissent pas : une
        ligne vide ferait croire à un annuaire plus grand qu'il n'est.</p>

      <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'16px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que la fiche montre, et ce qu'elle cache</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Le métier et le quartier, parce qu'ils servent à se trouver. <b style={{color:'var(--ink)'}}>Jamais le numéro de téléphone</b> — on s'écrit dans le Club, et une personne signalée ne voit pas son signalement.</p>
      </GlassPanel>
      <FabClub os={os}><Icon name="send" size={22} color="#fff" strokeWidth={2.5} /></FabClub>
    </EcranClub>
  );
}

/* ══ 3 · CLASSEMENT ══
   Ta vague d'arrivée, pas un palmarès. Un classement absolu flatte les premiers et fait
   décrocher les derniers — il n'y en a pas, et l'écran le dit. */
function NatClubClassement({os}){
  return (
    <EcranClub os={os} onglet="Classement">
      <div className="rv" style={{'--i':2,marginTop:'14px'}}>
        <ChipRow options={['Ma cohorte','Ma progression']} value="Ma cohorte" />
      </div>

      <div className="rv-s" style={{'--i':3,marginTop:'16px',padding:'22px',borderRadius:'var(--r-xl)',
        background:'linear-gradient(135deg,#6C23DD,#0057BC 70%,#02AC9C)',color:'#fff',
        boxShadow:'0 16px 40px rgba(108,35,221,.35)',border:'1px solid rgba(255,255,255,.22)'}}>
        <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',
          color:'rgba(255,255,255,.72)',margin:0}}>Arrivés en février · 9 membres</p>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'27px',letterSpacing:'-.035em',
          lineHeight:1.04,margin:'7px 0 0'}}>Tu es 4<sup style={{fontSize:'15px'}}>e</sup> de ta vague</p>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,.84)',lineHeight:1.5,margin:'9px 0 0'}}>Comparé aux gens arrivés en même temps que toi. Pas à ceux qui ont deux ans d'avance.</p>
      </div>

      <NSourcil style={{'--i':4,marginTop:'20px'}}>Ta vague</NSourcil>
      <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':4,marginTop:'10px'}}>
        {[['1','SK','Seynabou K.','niveau 6','2 410',null],
          ['2','AT','Amadou T.','niveau 5','2 080','linear-gradient(135deg,#F38B0A,#B4231F)'],
          ['3','NF','Ndèye F.','niveau 5','1 940','linear-gradient(135deg,#02AC9C,#0057BC)']].map(([r,ini,nom,niv,pts,bg])=>(
          <LessonRow key={r} state="plain" title={nom} meta={niv} iconBackground="transparent"
            icon={<span className="mm-num" style={{width:'14px',display:'block',color:'var(--text-faint)',fontSize:'13px'}}>{r}</span>}
            trailing={<span style={{display:'flex',alignItems:'center',gap:'10px'}}>
              <Avatar initials={ini} size={30} background={bg || undefined} />
              <b className="mm-num" style={{fontSize:'13px'}}>{pts}</b></span>} />
        ))}
        <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 16px',margin:'0 -16px',
          borderRadius:'14px',background:'linear-gradient(135deg,rgba(108,35,221,.12),rgba(0,87,188,.1))'}}>
          <span className="mm-num" style={{width:'14px',fontSize:'13px'}}>4</span>
          <span style={{flex:1}}>
            <b style={{display:'block',fontSize:'14px',fontWeight:600}}>Toi</b>
            <span className="mm-num" style={{fontSize:'12px',color:'var(--text-faint)'}}>niveau 4 · +180 cette semaine</span>
          </span>
          <Avatar initials="A" size={30} background="linear-gradient(135deg,#6C23DD,#F38B0A)" />
          <b className="mm-num" style={{fontSize:'13px'}}>1 705</b>
        </div>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'16px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Pourquoi ce n'est pas un classement général</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Un classement absolu flatte les premiers et fait décrocher les derniers. Celui-ci te compare à ta vague d'arrivée, et « Ma progression » <b style={{color:'var(--ink)'}}>ne te compare qu'à toi-même</b>, semaine après semaine.</p>
      </GlassPanel>
    </EcranClub>
  );
}

/* ══ 4 · OPPORTUNITÉS ══
   Trois missions ouvertes. Les budgets sont ceux que la personne qui publie DÉCLARE :
   ils ne sont pas vérifiés, et c'est écrit sur l'écran plutôt que caché dans les CGV. */
function NatClubOpportunites({os}){
  return (
    <EcranClub os={os} onglet="Opportunités"
      droite={<IconButton label="Chercher"><Icon name="search" size={17} strokeWidth={2.4} /></IconButton>}>
      <div className="rv" style={{'--i':2,marginTop:'14px'}}>
        <ChipRow layout="scroll" options={['Toutes','Missions','Appels d\'offres','Recrutement']} value="Toutes"
          style={{overflowX:'auto'}} />
      </div>
      <div style={{marginTop:'16px'}}>
        <div className="rv" style={{'--i':3}}>
          <TerritoryCard first territory="transforme" meta="Mission · Dakar · publiée hier"
            title={<>Fiche Google pour<br />trois boutiques</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              <PriceBlock amount="180 000" size={21} note="Budget annoncé · forfait" />
              <Button tone="transforme" size="sm" fullWidth={false}>Postuler</Button>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':4}}>
          <TerritoryCard territory="forme" meta="Appel d'offres · Abidjan · 4 j restants"
            title={<>Refonte d'un site<br />de restaurant</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              <PriceBlock amount="450 000" size={21} note="Budget annoncé · au projet" />
              <Button tone="quiet" size="sm" fullWidth={false}>Voir</Button>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':5}}>
          <TerritoryCard territory="rose" meta="Recrutement · télétravail"
            title={<>Chargé·e de contenu<br />mi-temps</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              <PriceBlock amount="250 000" currency="FCFA / mois" size={21} note="Annoncé par l'employeur" />
              <Button tone="quiet" size="sm" fullWidth={false}>Voir</Button>
            </div>
          </TerritoryCard>
        </div>
      </div>
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'14px'}}>
        Les budgets affichés sont ceux annoncés par la personne qui publie. Ils ne sont pas
        vérifiés par la plateforme, et c'est écrit ici plutôt que caché.</p>

      <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'14px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que l'app ajoute ici</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Une mission publiée <b style={{color:'var(--ink)'}}>arrive en notification</b>, une fois, le jour de sa publication. Sur le site, il fallait revenir voir. C'est le second onglet du Club à gagner un canal d'envoi.</p>
      </GlassPanel>
      <FabClub os={os}><Icon name="send" size={22} color="#fff" strokeWidth={2.5} /></FabClub>
    </EcranClub>
  );
}

/* ══ 5 · INFORMATIONS ══
   Le digest de la semaine. Il vit ici, dans le centre de notifications, et maintenant en
   notification poussée. Jamais par e-mail : aucun canal d'envoi n'existe, et l'écran le
   dit plutôt que de le laisser croire. */
function NatClubInformations({os}){
  const h2 = {fontFamily:'var(--f-display)',fontWeight:900,fontSize:'16.5px',letterSpacing:'-.03em',
    lineHeight:1.1,margin:'18px 0 7px'};
  return (
    <EcranClub os={os} onglet="Informations"
      droite={<IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton>}>
      <NSourcil style={{'--i':2,marginTop:'18px'}}>Digest · semaine du 4 septembre</NSourcil>
      <NTitre size={27} lines={['CE QUI S\u2019EST PASSÉ','CETTE SEMAINE.']} />

      <GlassPanel level="hero" padding={19} className="rv" style={{'--i':5,marginTop:'18px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
          <NSourcil style={{margin:0}}>Trois choses</NSourcil>
          <Tag tone="ok">Nouveau</Tag>
        </div>
        <div style={{marginTop:'13px',color:'#21272F'}}>
          <p style={{margin:'0 0 13px',fontSize:'14px',lineHeight:1.55}}>Et une que je préfère te dire moi-même.</p>
          <h2 style={h2}>La session de jeudi a servi</h2>
          <p style={{margin:0,fontSize:'14px',lineHeight:1.55}}>Six personnes présentes, trois fiches Google corrigées en direct. Seynabou a eu trois appels dans la semaine qui a suivi. La transcription est dans l'agenda si tu l'as manquée.</p>
          <h2 style={h2}>Deux missions sont arrivées</h2>
          <p style={{margin:0,fontSize:'14px',lineHeight:1.55}}>Une fiche Google pour trois boutiques à Dakar, un appel d'offres pour un restaurant à Abidjan. Les deux sont dans Opportunités, avec les budgets annoncés.</p>
          <h2 style={h2}>Ce que je n'ai pas fait</h2>
          <p style={{margin:0,fontSize:'14px',lineHeight:1.55}}>L'atelier de septembre devait avoir douze places. Il en a quatre, parce que la salle que je visais n'était pas libre. Je préfère te le dire que laisser le compteur parler à ma place.</p>
        </div>
      </GlassPanel>

      <NSourcil style={{'--i':6,marginTop:'22px'}}>Les chiffres de la semaine</NSourcil>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'10px'}}>
        <div className="rv" style={{'--i':6}}><StatTile label="Publications" value="7" foot="relevé du 04/09" /></div>
        <div className="rv" style={{'--i':7}}><StatTile label="Réponses" value="41" foot="relevé du 04/09" /></div>
        <div className="rv" style={{'--i':7}}><StatTile label="Missions publiées" value="2" foot="relevé du 04/09" /></div>
        <div className="rv" style={{'--i':8}}><StatTile label="Sessions tenues" value="1" foot="sur 1 annoncée" /></div>
      </div>

      <NSourcil style={{'--i':9,marginTop:'22px'}}>Les digests précédents</NSourcil>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':9,marginTop:'10px'}}>
        {['28 août','21 août','14 août'].map((d,k)=>(
          <LessonRow key={d} state="plain" icon={<Icon name="info" size={13} />} title={'Semaine du ' + d} meta="lu"
            last={k === 2} trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} />
        ))}
      </GlassPanel>
      <p className="rv" style={{'--i':10,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'12px'}}>
        Trois digests depuis ton inscription. Un par semaine, quand il y a de quoi le remplir —
        pas un calendrier tenu à vide.</p>

      <GlassPanel level="truth" className="rv" style={{'--i':10,marginTop:'14px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Où arrive ce digest</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Ici, dans ton centre de notifications, et <b style={{color:'var(--ink)'}}>en notification sur ce téléphone</b> — le seul canal que le site n'avait pas. Coupe-le dans les préférences si tu n'en veux pas.</p>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:'10px 0 0'}}><b style={{color:'var(--ink)'}}>Pas par e-mail</b> : la plateforme n'a aucun canal d'envoi, et je ne vais pas te promettre une lettre que je ne peux pas poster.</p>
      </GlassPanel>
    </EcranClub>
  );
}

/* ══ 6 · PARRAINAGE ══
   Le seul onglet dont l'app change vraiment le geste : la feuille de partage système.
   Le web copiait dans le presse-papier et espérait que la personne trouve WhatsApp. */
function NatClubParrainage({os}){
  return (
    <EcranClub os={os} onglet="Parrainage">
      <NTitre size={28} lines={['FAIS-LUI','GAGNER 15 %.']} style={{marginTop:'18px'}} />
      <NChapo>Ton code fait passer le Club de <b className="mm-num" style={{color:'var(--ink)'}}>19 900</b> à <b className="mm-num" style={{color:'var(--ink)'}}>16 915 F</b> pour la personne que tu parraines. La remise est calculée côté serveur.</NChapo>

      <GlassPanel level="hero" padding={21} className="rv" style={{'--i':5,marginTop:'18px'}}>
        <NSourcil>Ton code</NSourcil>
        <p className="mm-num" style={{fontSize:'30px',letterSpacing:'.1em',margin:'6px 0 0'}}>MOUSSA15</p>
        <div style={{display:'flex',gap:'8px',marginTop:'15px'}}>
          <Button tone="transforme" size="sm" fullWidth={false} style={{flex:1}}>Copier</Button>
          <Button tone="ghost" size="sm" fullWidth={false} style={{flex:1}}>
            <Icon name="send" size={15} strokeWidth={2.4} /> Partager</Button>
        </div>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,margin:'11px 0 0'}}>
          « Partager » ouvre la feuille {os === 'ios' ? 'de partage iOS' : 'de partage Android'} : WhatsApp, message,
          ce que tu veux. Le site ne pouvait que copier le code.</p>
      </GlassPanel>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'12px'}}>
        <div className="rv" style={{'--i':6}}><StatTile label="Partages" value="7" foot="depuis février" /></div>
        <div className="rv" style={{'--i':7}}><StatTile label="Inscrits" value="0" foot="aucun, pour l'instant" /></div>
      </div>

      <NSourcil style={{'--i':8,marginTop:'22px'}}>Ce que ton code donne, précisément</NSourcil>
      <GlassPanel padding={18} className="rv" style={{'--i':8,marginTop:'10px'}}>
        <CheckLine style={{marginTop:0,fontSize:'14px'}}><b className="mm-num">15</b> % de remise, au filleul</CheckLine>
        <CheckLine style={{fontSize:'14px'}}>Son prix passe à <b className="mm-num">16 915 F</b> pour douze mois</CheckLine>
        <CheckLine tone="neutre" dash style={{fontSize:'14px'}}>Aucune commission pour toi, jamais</CheckLine>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':9,marginTop:'16px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Ce que tu gagnes, toi</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Rien en argent, et je ne vais pas te faire croire le contraire. La remise va au filleul. Ce que tu gagnes, c'est <b style={{color:'var(--ink)'}}>quelqu'un de plus dans le Club</b> avec qui avancer.</p>
      </GlassPanel>
    </EcranClub>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   L'ÉCRAN VERROUILLÉ, EN NATIF.

   Ce n'est PAS le mur d'abonnement (écran 18). Le mur s'adresse à un visiteur du site
   public ; celui-ci s'adresse à quelqu'un qui a déjà un compte, qui est DANS l'app, et
   qui vient de toucher « Club » dans la barre d'onglets. On sait donc quel onglet elle
   voulait — c'est la seule information qu'on ait en plus, et l'écran est construit
   autour d'elle : un composant, huit contenus.

   Trois décisions, dont une seule vient du natif.

   1 · AUCUN CONTENU FLOUTÉ (décision du web, tenue ici). Un flou dit « il y a foule
       là-dedans, fais-nous confiance ». Le Club a ouvert cette année : il ne peut pas
       dire ça. À la place, les compteurs RÉELS de ce qui est derrière et un élément
       complet, non tronqué.

       Effet secondaire heureux : c'est le seul écran du kit qui ne dépend d'aucun repli
       de flou. Sur Android, où `backdrop-filter` n'existe qu'à partir d'API 31, un mur
       de vente construit sur du flou tomberait précisément là où il doit convaincre.

   2 · LA BANDE DES HUIT RESTE CLIQUABLE. La personne DOIT pouvoir voir ce qu'il y a
       derrière chaque cadenas avant de payer. Masquer la navigation d'un espace
       verrouillé, c'est vendre une boîte fermée.

   3 · LE BOUTON N'ACHÈTE PAS (App Store 3.1.1 · Play Payments). C'est la seule
       différence de fond avec la version web, et elle est structurelle : 19 900 F
       encaissés dans l'app imposeraient le paiement du magasin, qui ne connaît ni Wave
       ni Orange Money. Le bouton renvoie donc au site, et la phrase nomme le magasin.
   ══════════════════════════════════════════════════════════════════════════════ */

const VERROU_NAT = {
  Fil: {
    titre:['CE QUI SE DIT','CETTE SEMAINE.'],
    quoi:'Sept publications et quarante-et-une réponses depuis lundi. Des gens qui vendent vraiment quelque chose, qui racontent ce qui a marché.',
    chiffres:[['7','publications'],['41','réponses'],['3','catégories']],
    apercuTitre:'Une publication, en entier'
  },
  Discussions: {
    titre:['LES QUESTIONS','QU\u2019ON SE POSE.'],
    quoi:'Quarante-et-un sujets ouverts, classés par catégorie. La question bête se pose ici, et quelqu\'un y répond.',
    chiffres:[['41','sujets'],['3','catégories'],['17','réponses au plus long']],
    apercuTitre:'Un sujet, en entier'
  },
  Membres: {
    titre:['QUI FAIT QUOI,','ET OÙ.'],
    quoi:'Six fiches remplies dans ta vague d\'arrivée. Le métier, le quartier, et de quoi écrire en privé sans passer par moi.',
    chiffres:[['6','fiches remplies'],['9','dans ta vague'],['4','quartiers de Dakar']],
    apercuTitre:'Une fiche, en entier'
  },
  Agenda: {
    titre:['DEUX SESSIONS','CE MOIS-CI.'],
    quoi:'Une en ligne, un atelier à Dakar. L\'agenda est publié un mois à l\'avance, et une session annoncée a lieu même si nous sommes quatre.',
    chiffres:[['2','sessions ce mois'],['4','places restantes'],['1','atelier à Dakar']],
    apercuTitre:'Une session, en entier'
  },
  Classement: {
    titre:['TA VAGUE,','PAS UN PALMARÈS.'],
    quoi:'Tu serais comparée aux neuf personnes arrivées en même temps que toi. Pas à celles qui ont deux ans d\'avance — il n\'y a aucun classement général, et il n\'y en aura pas.',
    chiffres:[['9','dans ta vague'],['2','vues de progression'],['0','classement absolu']],
    apercuTitre:'Ce que tu verrais'
  },
  Opportunités: {
    titre:['TROIS MISSIONS','OUVERTES.'],
    quoi:'Des budgets annoncés de 180 000 à 450 000 F. Ce sont ceux que la personne qui publie déclare — ils ne sont pas vérifiés par la plateforme, et c\'est écrit là aussi.',
    chiffres:[['3','ouvertes'],['180 000','budget le plus bas'],['450 000','le plus haut']],
    apercuTitre:'Une mission, en entier'
  },
  Informations: {
    titre:['LE DIGEST','DE LA SEMAINE.'],
    quoi:'Ce qui s\'est passé, ce qui arrive, et ce que je n\'ai pas fait. Un par semaine, quand il y a de quoi le remplir.',
    chiffres:[['3','digests publiés'],['1','par semaine'],['0','e-mail envoyé']],
    apercuTitre:'Un extrait, en entier'
  },
  Parrainage: {
    titre:['FAIS-LUI','GAGNER 15 %.'],
    quoi:'Un code à toi, qui fait passer le Club de 19 900 à 16 915 F pour la personne que tu parraines. Toi, tu ne gagnes rien en argent — et c\'est écrit dans l\'onglet, pas en bas de page.',
    chiffres:[['15','% au filleul'],['16 915','son prix, en F'],['0','commission pour toi']],
    apercuTitre:'Ce que tu aurais'
  }
};

/* Les huit aperçus, séparés de la table de texte : ce sont des éléments RÉELS du produit,
   rendus à leur taille native, pas des résumés. */
function ApercuVerrou({onglet}){
  const eb = {fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',
    color:'var(--text-muted)',margin:0};
  const ti = {fontFamily:'var(--f-display)',fontWeight:900,fontSize:'17px',letterSpacing:'-.032em',
    lineHeight:1.06,margin:'6px 0 0'};
  const p = {fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'8px 0 0'};
  if (onglet === 'Fil') return (
    <React.Fragment>
      <div style={{display:'flex',gap:'11px',alignItems:'center'}}>
        <Avatar initials="SK" size={34} />
        <div style={{flex:1}}>
          <p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Seynabou K.</p>
          <p className="mm-num" style={{fontSize:'10.5px',color:'var(--text-faint)',margin:0}}>Entraide · il y a 2 h</p>
        </div>
      </div>
      <p style={{fontSize:'13.5px',lineHeight:1.5,margin:'11px 0 0'}}>J'ai refait ma fiche Google en suivant le module 2. Trois appels en une semaine, sur des recherches « coiffure Ouakam ».</p>
    </React.Fragment>);
  if (onglet === 'Discussions') return (
    <React.Fragment>
      <p style={eb}>Clients · 21 réponses</p>
      <p style={ti}>Un client ne répond plus après le devis</p>
      <p style={p}>Trois semaines de silence. Je relance une quatrième fois ou je laisse tomber ?</p>
    </React.Fragment>);
  if (onglet === 'Membres') return (
    <React.Fragment>
      <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
        <Avatar initials="SK" size={44} />
        <div style={{flex:1}}>
          <p style={{fontSize:'15px',fontWeight:700,margin:0}}>Seynabou K.</p>
          <p style={{fontSize:'12.5px',color:'var(--text-muted)',margin:'2px 0 0'}}>Coiffeuse · Ouakam, Dakar</p>
        </div>
      </div>
      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'11px'}}>
        <Tag>Depuis février</Tag><Tag tone="ok">Niveau 6</Tag>
      </div>
    </React.Fragment>);
  if (onglet === 'Agenda') return (
    <React.Fragment>
      <div style={{display:'flex',gap:'12px'}}>
        <span style={{width:'40px',height:'40px',borderRadius:'13px',background:'var(--action-transforme)',
          display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="chat" size={18} color="#fff" /></span>
        <div style={{flex:1}}>
          <p style={{fontSize:'14.5px',fontWeight:700,margin:0}}>Ta fiche Google, en direct</p>
          <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'2px 0 0'}}>jeudi 10/09 · 20:00 → 21:00</p>
        </div>
      </div>
      <p style={p}>J'ouvre une vraie fiche et je la corrige devant vous, avec les erreurs laissées à l'écran.</p>
    </React.Fragment>);
  if (onglet === 'Classement') return (
    <React.Fragment>
      <p style={eb}>Arrivés en février · 9 membres</p>
      <p style={{...ti,fontSize:'19px'}}>Ta place dans ta vague</p>
      <p style={p}>Et une seconde vue qui ne te compare qu'à toi-même, semaine après semaine.</p>
    </React.Fragment>);
  if (onglet === 'Opportunités') return (
    <React.Fragment>
      <p style={eb}>Mission · Dakar · publiée hier</p>
      <p style={ti}>Fiche Google pour trois boutiques</p>
      <div style={{marginTop:'11px'}}><PriceBlock amount="180 000" size={21} note="Budget annoncé · forfait" /></div>
    </React.Fragment>);
  if (onglet === 'Informations') return (
    <React.Fragment>
      <p style={eb}>Semaine du 4 septembre</p>
      <p style={ti}>Ce que je n'ai pas fait</p>
      <p style={p}>L'atelier de septembre devait avoir douze places. Il en a quatre, parce que la salle que je visais n'était pas libre.</p>
    </React.Fragment>);
  return (
    <React.Fragment>
      <p style={eb}>Ton code</p>
      <p className="mm-num" style={{fontSize:'27px',letterSpacing:'.1em',margin:'6px 0 0'}}>AISSA15</p>
      <p style={{...p,fontSize:'12.5px'}}>La remise est calculée côté serveur : elle ne dépend pas du lien sur lequel la personne a cliqué.</p>
    </React.Fragment>);
}

function NatClubVerrouille({os,onglet='Opportunités'}){
  const v = VERROU_NAT[onglet] || VERROU_NAT.Opportunités;
  const magasin = os === 'ios' ? 'l\u2019App Store' : 'Google Play';
  return (
    <NativeScreen os={os} territory="transforme" retour={os === 'ios' ? 'Espace' : undefined}
      titre={onglet} droite={<Button tone="quiet" size="sm" fullWidth={false}>Aide</Button>}
      tabbar={<TabBar items={ONGLETS_C()} active="Club" />}>

      <BandeClub actif={onglet} verrou />

      <div className="rv-s" style={{'--i':1,width:'54px',height:'54px',borderRadius:'18px',marginTop:'20px',
        background:'linear-gradient(135deg,#B98CFF,#6C23DD)',display:'grid',placeItems:'center',
        boxShadow:'0 10px 26px rgba(108,35,221,.32)'}}>
        <Icon name="lock" size={23} color="#fff" strokeWidth={2.3} />
      </div>

      <NTitre size={27} lines={v.titre} style={{marginTop:'16px'}} />
      <NChapo>{v.quoi}</NChapo>

      {/* Les compteurs réels. C'est ce qui remplace le contenu flouté. */}
      <GlassPanel padding={18} className="rv" style={{'--i':5,marginTop:'18px'}}>
        <NSourcil style={{marginBottom:'12px'}}>Derrière ce cadenas, en ce moment</NSourcil>
        <div style={{display:'flex',gap:'12px'}}>
          {v.chiffres.map(([n,l])=>(
            <div key={l} style={{flex:1}}>
              <p className="mm-num" style={{fontSize:'21px',margin:0,letterSpacing:'-.03em'}}>{n}</p>
              <p style={{fontSize:'10.5px',color:'var(--text-muted)',lineHeight:1.3,margin:0}}>{l}</p>
            </div>
          ))}
        </div>
        <p className="mm-num" style={{fontSize:'10.5px',color:'var(--text-faint)',margin:'12px 0 0'}}>relevé du 05/09/2026</p>
      </GlassPanel>

      {/* Un élément complet, NON flouté. Le pari de l'écran. */}
      <NSourcil style={{'--i':6,marginTop:'22px'}}>{v.apercuTitre}</NSourcil>
      <GlassPanel level="flat" padding={17} className="rv" style={{'--i':6,marginTop:'10px'}}>
        <ApercuVerrou onglet={onglet} />
      </GlassPanel>
      <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'10px'}}>
        Pas flouté, pas tronqué. C'est exactement ce que tu verras — je préfère te montrer moins
        et que ce soit vrai.</p>

      {/* Le prix, cadré des deux façons. Et le bouton qui n'achète pas. */}
      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':8,marginTop:'20px'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:'8px'}}>
          <b className="mm-num" style={{fontSize:'32px',letterSpacing:'-.045em',color:'var(--mm-violet-t)'}}>1 658</b>
          <span style={{fontSize:'14px',fontWeight:600}}>F / mois</span>
        </div>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Facturé <b className="mm-num" style={{color:'var(--ink)'}}>19 900 F</b>, une fois, pour douze mois. Les huit onglets, d'un coup.</p>
        <div style={{height:'1px',background:'var(--border-hair)',margin:'15px 0'}} />
        <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>
          L'abonnement se prend <b style={{color:'var(--ink)'}}>sur le site</b> — {magasin} exige son propre
          système de paiement pour tout achat fait dans une application, et il ne connaît ni Wave
          ni Orange&nbsp;Money.</p>
        <Button tone="transforme" style={{marginTop:'15px'}}>
          Ouvrir sur maxmorrys.me <Icon name="forward" size={16} strokeWidth={2.6} />
        </Button>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>
          Parrainé ? Ton code te fait <b className="mm-num">16 915 F</b>.</p>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':9,marginTop:'14px'}}>
        <NSourcil style={{marginBottom:'6px'}}>Pourquoi rien n'est flouté ici</NSourcil>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Un contenu flouté dit « il y a foule là-dedans, fais-nous confiance ». Le Club a ouvert cette année : il ne peut pas dire ça, et <b style={{color:'var(--ink)'}}>tu le vérifierais au premier écran après avoir payé</b>. Alors je te donne les compteurs exacts et un élément entier.</p>
      </GlassPanel>

      <div className="rv" style={{'--i':10,marginTop:'18px'}}>
        <Button tone="quiet">En attendant, le podcast est gratuit</Button>
      </div>
      <p className="rv" style={{'--i':10,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',
        lineHeight:1.55,margin:'10px 0 8px'}}>
        Un épisode, deux vidéos, 46 articles. Même territoire, étage du dessous — et en natif,
        l'épisode continue quand tu verrouilles ton téléphone.</p>
    </NativeScreen>
  );
}

/* Huit variantes nommées, pour que la planche puisse les monter par nom. */
const NatVerrouFil = (p)=><NatClubVerrouille {...p} onglet="Fil" />;
const NatVerrouDiscussions = (p)=><NatClubVerrouille {...p} onglet="Discussions" />;
const NatVerrouMembres = (p)=><NatClubVerrouille {...p} onglet="Membres" />;
const NatVerrouAgenda = (p)=><NatClubVerrouille {...p} onglet="Agenda" />;
const NatVerrouClassement = (p)=><NatClubVerrouille {...p} onglet="Classement" />;
const NatVerrouOpportunites = (p)=><NatClubVerrouille {...p} onglet="Opportunités" />;
const NatVerrouInfos = (p)=><NatClubVerrouille {...p} onglet="Informations" />;
const NatVerrouParrainage = (p)=><NatClubVerrouille {...p} onglet="Parrainage" />;

const MM_EXPORT = {EcranClub,VERROU_NAT,ApercuVerrou,
  NatClubDiscussions,NatClubMembres,NatClubClassement,NatClubOpportunites,
  NatClubInformations,NatClubParrainage,NatClubVerrouille,
  NatVerrouFil,NatVerrouDiscussions,NatVerrouMembres,NatVerrouAgenda,
  NatVerrouClassement,NatVerrouOpportunites,NatVerrouInfos,NatVerrouParrainage};
Object.assign(window, MM_EXPORT);
window.MMNAT = Object.assign(window.MMNAT||{}, MM_EXPORT);
