const { GlassPanel, Button, ChipRow, PriceBlock, LessonRow, Tag, Avatar, CheckLine, StatTile, Icon } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LE CLUB VERROUILLÉ EN 1440 px — LE NEUVIÈME ÉCRAN DU CLUB.

   Les huit onglets existent en desktop (DashboardsClub.js / …Club2.js), mais tous les
   huit supposent une abonnée. Il manquait l'écran de la personne qui a un COMPTE et pas
   d'abonnement : elle a cliqué « Le Club » dans la navigation latérale, et ce n'est ni un
   visiteur du site public, ni une membre.

   Ce n'est PAS le mur d'abonnement. Le mur s'adresse à quelqu'un qui ne s'est pas encore
   inscrit ; ici la personne est identifiée, dans son espace, et **on sait quel onglet elle
   a demandé**. C'est la seule information qu'on ait en plus, et l'écran est construit
   autour d'elle : un composant, huit contenus.

   ── CE QUE LA LARGEUR CHANGE, ET C'EST BEAUCOUP ──

   1 · LE PRIX QUITTE LA FIN DU DÉFILEMENT. En 390 px il vient après le contenu — c'est
       l'ordre juste (montrer avant de demander), mais il oblige à parier que la personne
       défile. Ici il vit dans le rail de droite : **permanent sur les huit contextes**,
       sans voler la première place. Exactement ce que le rail fait du bilan pour une
       abonnée, à la place du bilan qu'elle n'a pas.

   2 · LES HUIT ONGLETS SONT VISIBLES D'UN COUP. La bande passe à la ligne au lieu de
       défiler : la personne voit la forme complète de ce qu'elle achèterait, en une vue.
       En 390 px elle devait faire glisser la bande pour découvrir les quatre derniers.

   3 · LES COMPTEURS ET L'ÉLÉMENT ENTIER TIENNENT CÔTE À CÔTE. Sur téléphone ils
       s'empilent et le second demande un défilement de plus.

   ── CE QUI NE CHANGE PAS ──

   Aucun contenu flouté. Un flou dit « il y a foule là-dedans, fais-nous confiance » ; le
   Club a ouvert cette année et ne peut pas le dire — et la personne le vérifierait au
   premier écran après avoir payé. À la place : les compteurs réels de ce qui est derrière,
   et un élément complet, non tronqué. Aucun nombre de membres, ici comme partout.

   Une différence de fond avec la version native, et une seule : ici le bouton **achète**.
   Le site n'est pas une application de magasin, donc Wave et Orange Money restent
   possibles. C'est le même écran, et c'est la règle 3.1.1 qui coupe l'autre en deux.
   ══════════════════════════════════════════════════════════════════════════════ */

const VERROU_D = {
  Fil: {
    titre:['CE QUI SE DIT','CETTE SEMAINE.'],
    quoi:'Sept publications et quarante-et-une réponses depuis lundi. Des gens qui vendent vraiment quelque chose, qui racontent ce qui a marché — et pas seulement ce qui a marché.',
    chiffres:[['7','publications','relevé du 05/09'],['41','réponses','relevé du 05/09'],['3','catégories','entraide, outils, clients']],
    apercuTitre:'Une publication, en entier'
  },
  Discussions: {
    titre:['LES QUESTIONS','QU\u2019ON SE POSE.'],
    quoi:'Quarante-et-un sujets ouverts, classés par catégorie et jamais par date. La question bête se pose ici, et quelqu\'un y répond.',
    chiffres:[['41','sujets ouverts','relevé du 05/09'],['3','catégories','entraide, outils, clients'],['17','réponses au plus long','un seul sujet']],
    apercuTitre:'Un sujet, en entier'
  },
  Membres: {
    titre:['QUI FAIT QUOI,','ET OÙ.'],
    quoi:'Six fiches remplies dans ta vague d\'arrivée. Le métier, le quartier, et de quoi écrire en privé sans passer par moi.',
    chiffres:[['6','fiches remplies','sur 9 arrivées'],['9','dans ta vague','arrivés en février'],['4','quartiers de Dakar','Ouakam, Yoff, Point E, Liberté 6']],
    apercuTitre:'Une fiche, en entier'
  },
  Agenda: {
    titre:['DEUX SESSIONS','CE MOIS-CI.'],
    quoi:'Une en ligne, un atelier à Dakar. L\'agenda est publié un mois à l\'avance, et une session annoncée a lieu même si nous sommes quatre.',
    chiffres:[['2','sessions ce mois','septembre 2026'],['4','places restantes','atelier du 20/09'],['1','atelier à Dakar','Point E']],
    apercuTitre:'Une session, en entier'
  },
  Classement: {
    titre:['TA VAGUE,','PAS UN PALMARÈS.'],
    quoi:'Tu serais comparée aux neuf personnes arrivées en même temps que toi. Pas à celles qui ont deux ans d\'avance — il n\'y a aucun classement général, et il n\'y en aura pas.',
    chiffres:[['9','dans ta vague','arrivés en février'],['2','vues de progression','cohorte et soi-même'],['0','classement absolu','par décision, pas par manque']],
    apercuTitre:'Ce que tu verrais'
  },
  Opportunités: {
    titre:['TROIS MISSIONS','OUVERTES.'],
    quoi:'Des budgets annoncés de 180 000 à 450 000 F. Ce sont ceux que la personne qui publie déclare — ils ne sont pas vérifiés par la plateforme, et c\'est écrit là aussi.',
    chiffres:[['3','ouvertes','relevé du 05/09'],['180 000','budget le plus bas','en francs CFA'],['450 000','le plus haut','en francs CFA']],
    apercuTitre:'Une mission, en entier'
  },
  Informations: {
    titre:['LE DIGEST','DE LA SEMAINE.'],
    quoi:'Ce qui s\'est passé, ce qui arrive, et ce que je n\'ai pas fait. Un par semaine, quand il y a de quoi le remplir — pas un calendrier tenu à vide.',
    chiffres:[['3','digests publiés','depuis l\'ouverture'],['1','par semaine','quand il y a de quoi'],['0','e-mail envoyé','aucun canal d\'envoi']],
    apercuTitre:'Un extrait, en entier'
  },
  Parrainage: {
    titre:['FAIS-LUI','GAGNER 15 %.'],
    quoi:'Un code à toi, qui fait passer le Club de 19 900 à 16 915 F pour la personne que tu parraines. Toi, tu ne gagnes rien en argent — et c\'est écrit dans l\'onglet, pas en bas de page.',
    chiffres:[['15','% au filleul','remise serveur'],['16 915','son prix, en F','au lieu de 19 900'],['0','commission pour toi','par décision']],
    apercuTitre:'Ce que tu aurais'
  }
};

/* Les huit aperçus. Ce sont des éléments RÉELS du produit, à leur taille de desktop —
   c'est le pari de l'écran, donc ils ne sont ni réduits ni résumés. */
function ApercuD({onglet}){
  const eb = {fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',
    color:'var(--text-muted)',margin:0};
  const ti = {fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.032em',
    lineHeight:1.06,margin:'7px 0 0'};
  const p = {fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'10px 0 0',maxWidth:'var(--measure-prose)'};
  if (onglet === 'Fil') return (
    <React.Fragment>
      <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
        <Avatar initials="SK" size={40} />
        <div style={{flex:1}}>
          <p style={{fontSize:'14.5px',fontWeight:600,margin:0}}>Seynabou K.</p>
          <p className="mm-num" style={{fontSize:'11px',color:'var(--text-faint)',margin:0}}>Entraide · il y a 2 h</p>
        </div>
        <Tag>Entraide</Tag>
      </div>
      <p style={{fontSize:'14.5px',lineHeight:1.55,margin:'13px 0 0',maxWidth:'var(--measure-prose)'}}>J'ai refait ma fiche Google en suivant le module 2. Trois appels en une semaine, sur des recherches « coiffure Ouakam ». Je mets ma liste de mots en commentaire si ça sert à quelqu'un.</p>
      <div style={{display:'flex',gap:'20px',marginTop:'15px',alignItems:'center'}}>
        <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}>
          <Icon name="heart" size={16} color="#5A17BE" /><b className="mm-num" style={{fontSize:'12.5px'}}>12</b></span>
        <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}>
          <Icon name="repeat" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>3</b></span>
        <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}>
          <Icon name="comment" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>7</b></span>
      </div>
    </React.Fragment>);
  if (onglet === 'Discussions') return (
    <React.Fragment>
      <p style={eb}>Clients · 21 réponses</p>
      <p style={ti}>Un client ne répond plus après le devis</p>
      <p style={p}>Trois semaines de silence. Je relance une quatrième fois ou je laisse tomber ? J'ai peur de passer pour insistante.</p>
      <div style={{display:'flex',alignItems:'center',gap:'12px',marginTop:'15px'}}>
        <span style={{display:'flex',alignItems:'center'}}>
          {['AD','FT','MB'].map((a,i)=><Avatar key={a} initials={a} size={26} style={{marginLeft:i?'-8px':0,border:'1.5px solid #fff'}} />)}
        </span>
        <span className="mm-num" style={{fontSize:'11.5px',color:'var(--text-faint)'}}>+15 · hier</span>
      </div>
    </React.Fragment>);
  if (onglet === 'Membres') return (
    <React.Fragment>
      <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
        <Avatar initials="SK" size={54} />
        <div style={{flex:1}}>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.032em',
            lineHeight:1,margin:0}}>Seynabou K.</p>
          <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'5px 0 0'}}>Coiffeuse · Ouakam, Dakar</p>
        </div>
      </div>
      <div style={{display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'13px'}}>
        <Tag>Membre depuis février</Tag><Tag tone="ok">Niveau 6</Tag><Tag>Entraide</Tag>
      </div>
      <p style={p}>Le métier et le quartier servent à se trouver. Le numéro de téléphone n'est jamais montré — on s'écrit dans le Club.</p>
    </React.Fragment>);
  if (onglet === 'Agenda') return (
    <React.Fragment>
      <div style={{display:'flex',gap:'13px'}}>
        <span style={{width:'46px',height:'46px',borderRadius:'15px',background:'var(--action-transforme)',
          display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="chat" size={20} color="#fff" /></span>
        <div style={{flex:1}}>
          <p style={{fontSize:'15.5px',fontWeight:700,margin:0}}>Ta fiche Google, en direct</p>
          <p className="mm-num" style={{fontSize:'12px',color:'var(--text-muted)',margin:'3px 0 0'}}>jeudi 10/09 · 20:00 → 21:00 · en ligne</p>
        </div>
      </div>
      <p style={p}>J'ouvre une vraie fiche et je la corrige devant vous, avec les erreurs laissées à l'écran. La transcription reste dans l'agenda si tu la manques.</p>
    </React.Fragment>);
  if (onglet === 'Classement') return (
    <React.Fragment>
      <p style={eb}>Arrivés en février · 9 membres</p>
      <p style={{...ti,fontSize:'24px'}}>Ta place dans ta vague</p>
      <p style={p}>Et une seconde vue qui ne te compare qu'à toi-même, semaine après semaine. Aucun classement général : un classement absolu flatte les premiers et fait décrocher les derniers.</p>
    </React.Fragment>);
  if (onglet === 'Opportunités') return (
    <React.Fragment>
      <p style={eb}>Mission · Dakar · publiée hier</p>
      <p style={ti}>Fiche Google pour trois boutiques</p>
      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'16px',marginTop:'14px'}}>
        <PriceBlock amount="180 000" size={25} note="Budget annoncé par la personne qui publie · forfait" />
        <Tag>Postuler, une fois membre</Tag>
      </div>
    </React.Fragment>);
  if (onglet === 'Informations') return (
    <React.Fragment>
      <p style={eb}>Digest · semaine du 4 septembre</p>
      <p style={ti}>Ce que je n'ai pas fait</p>
      <p style={p}>L'atelier de septembre devait avoir douze places. Il en a quatre, parce que la salle que je visais n'était pas libre. Je préfère te le dire que laisser le compteur parler à ma place.</p>
    </React.Fragment>);
  return (
    <React.Fragment>
      <p style={eb}>Ton code</p>
      <p className="mm-num" style={{fontSize:'34px',letterSpacing:'.1em',margin:'8px 0 0'}}>AISSA15</p>
      <p style={p}>La remise est calculée côté serveur : elle ne dépend pas du lien sur lequel la personne a cliqué. Toi, tu ne touches aucune commission.</p>
    </React.Fragment>);
}

/* ── Le prix dans le rail : la carte permanente d'un non-abonné ──
   Elle occupe l'emplacement que `BilanRail` occupe pour une abonnée. Le prix reste cadré
   des DEUX façons : mensualisé il relève de l'achat impulsif, annualisé il franchit un
   seuil de délibération — cacher l'un des deux, c'est choisir à la place de la personne. */
function PrixRail(){
  return (
    <GlassPanel level="hero" padding={20} className="rv">
      <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',
        color:'var(--text-muted)',margin:0}}>Les huit onglets, d'un coup</p>
      <div style={{display:'flex',alignItems:'baseline',gap:'8px',marginTop:'8px'}}>
        <b className="mm-num" style={{fontSize:'34px',letterSpacing:'-.045em',color:'var(--mm-violet-t)'}}>1 658</b>
        <span style={{fontSize:'14px',fontWeight:600}}>F / mois</span>
      </div>
      <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'6px 0 0'}}>Facturé <b className="mm-num" style={{color:'var(--ink)'}}>19 900 F</b>, une fois, pour douze mois.</p>
      <Button tone="transforme" style={{marginTop:'15px'}}>Prendre l'abonnement</Button>
      <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'9px 0 0'}}>
        Parrainée ? Ton code te fait <b className="mm-num">16 915 F</b>.</p>
      <div style={{height:'1px',background:'var(--border-hair)',margin:'16px 0'}} />
      <CheckLine style={{marginTop:0,fontSize:'13px'}}><b className="mm-num">2</b> sessions en direct par mois</CheckLine>
      <CheckLine style={{fontSize:'13px'}}>Les missions de mon carnet</CheckLine>
      <CheckLine style={{fontSize:'13px'}}>Une réponse de moi, pas d'un modérateur</CheckLine>
      <CheckLine style={{fontSize:'13px'}}>Ton répétiteur à <b className="mm-num">5</b> questions/jour</CheckLine>
    </GlassPanel>
  );
}

function ClubVerrouilleDesktop({onglet='Opportunités'}){
  const v = VERROU_D[onglet] || VERROU_D.Opportunités;
  return (
    <AppFrame active="Le Club" sourcil={'Compte sans abonnement · tu as demandé « '+onglet+' »'}
      titre="Le Club des Digitos"
      aside={<React.Fragment>
        <PrixRail />
        <div style={{marginTop:'18px'}}>
          <CEyebrow>En attendant</CEyebrow>
          <GlassPanel level="flat" padding={16} className="rv" style={{'--i':2,marginTop:'10px'}}>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Le podcast, les vidéos et les <b className="mm-num" style={{color:'var(--ink)'}}>46</b> articles sont gratuits et le restent. Même territoire, étage du dessous.</p>
            <Button tone="quiet" size="sm" style={{marginTop:'12px'}}>Aller au pôle média</Button>
          </GlassPanel>
        </div>
      </React.Fragment>}>

      {/* La bande reste CLIQUABLE : la personne doit pouvoir voir ce qu'il y a derrière
          chaque cadenas avant de payer — masquer la navigation d'un espace verrouillé,
          c'est vendre une boîte fermée. En desktop les huit passent à la ligne, donc la
          forme complète de ce qui est acheté se lit d'un coup. */}
      <div className="rv" style={{'--i':1,marginTop:'22px',paddingBottom:'18px',
        borderBottom:'1px solid var(--border-hair)'}}>
        <ChipRow layout="wrap" value={onglet} options={CLUB_ONGLETS}
          icon={<Icon name="lock" size={11} strokeWidth={2.6} />} />
      </div>

      <div className="rv-s" style={{'--i':2,width:'52px',height:'52px',borderRadius:'17px',marginTop:'24px',
        background:'linear-gradient(135deg,#B98CFF,#6C23DD)',display:'grid',placeItems:'center',
        boxShadow:'0 10px 26px rgba(108,35,221,.32)'}}>
        <Icon name="lock" size={22} color="#fff" strokeWidth={2.3} />
      </div>

      <h2 className="rv" style={{'--i':3,fontFamily:'var(--f-display)',fontWeight:900,fontSize:'40px',
        letterSpacing:'-.038em',lineHeight:.95,margin:'18px 0 0'}}>
        {v.titre.map(l=><span key={l} style={{display:'block'}}>{l}</span>)}
      </h2>
      <p className="rv" style={{'--i':4,fontSize:'15px',color:'var(--text-muted)',lineHeight:1.6,
        margin:'14px 0 0',maxWidth:'var(--measure-prose)'}}>{v.quoi}</p>

      {/* Les compteurs réels et l'élément entier, CÔTE À CÔTE — sur téléphone ils
          s'empilent et le second demande un défilement de plus. */}
      <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) minmax(0,1.05fr)',gap:'22px',marginTop:'26px',alignItems:'start'}}>
        <div>
          <CEyebrow style={{'--i':5}}>Derrière ce cadenas, en ce moment</CEyebrow>
          <div style={{display:'flex',flexDirection:'column',gap:'10px',marginTop:'12px'}}>
            {v.chiffres.map(([n,l,f])=>(
              <div className="rv" key={l} style={{'--i':5}}><StatTile label={l} value={n} foot={f} /></div>
            ))}
          </div>
          <p className="rv mm-num" style={{'--i':6,fontSize:'11px',color:'var(--text-faint)',margin:'12px 0 0'}}>
            relevé du 05/09/2026 · ces nombres viennent de la base</p>
        </div>
        <div>
          <CEyebrow style={{'--i':5}}>{v.apercuTitre}</CEyebrow>
          <GlassPanel level="flat" padding={20} className="rv" style={{'--i':5,marginTop:'12px'}}>
            <ApercuD onglet={onglet} />
          </GlassPanel>
          <p className="rv" style={{'--i':6,fontSize:'12px',color:'var(--text-faint)',lineHeight:1.6,margin:'12px 0 0'}}>
            Pas flouté, pas tronqué. C'est exactement ce que tu verras — je préfère te montrer
            moins et que ce soit vrai.</p>
        </div>
      </div>

      <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'24px',maxWidth:'74ch'}}>
        <CEyebrow style={{marginBottom:'6px'}}>Pourquoi rien n'est flouté ici</CEyebrow>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Un contenu flouté dit « il y a foule là-dedans, fais-nous confiance ». Le Club a ouvert cette année : il ne peut pas dire ça, et <b style={{color:'var(--ink)'}}>tu le vérifierais au premier écran après avoir payé</b>. Alors je te donne les compteurs exacts et un élément entier — et aucun nombre de membres, parce qu'il serait petit et qu'il ne dit rien de ce que le Club apporte.</p>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,margin:'10px 0 0'}}>Ce que je ne peux pas te promettre : la densité du fil, la qualité de l'entraide, le nombre de missions que <i>les autres</i> partagent.</p>
      </GlassPanel>
    </AppFrame>
  );
}

/* Huit variantes nommées, pour que le sélecteur de planche les monte par nom. */
const VerrouFilDesktop = (p)=><ClubVerrouilleDesktop {...p} onglet="Fil" />;
const VerrouDiscussionsDesktop = (p)=><ClubVerrouilleDesktop {...p} onglet="Discussions" />;
const VerrouMembresDesktop = (p)=><ClubVerrouilleDesktop {...p} onglet="Membres" />;
const VerrouAgendaDesktop = (p)=><ClubVerrouilleDesktop {...p} onglet="Agenda" />;
const VerrouClassementDesktop = (p)=><ClubVerrouilleDesktop {...p} onglet="Classement" />;
const VerrouOpportunitesDesktop = (p)=><ClubVerrouilleDesktop {...p} onglet="Opportunités" />;
const VerrouInfosDesktop = (p)=><ClubVerrouilleDesktop {...p} onglet="Informations" />;
const VerrouParrainageDesktop = (p)=><ClubVerrouilleDesktop {...p} onglet="Parrainage" />;

const MM_EXPORT = {VERROU_D,ApercuD,PrixRail,ClubVerrouilleDesktop,
  VerrouFilDesktop,VerrouDiscussionsDesktop,VerrouMembresDesktop,VerrouAgendaDesktop,
  VerrouClassementDesktop,VerrouOpportunitesDesktop,VerrouInfosDesktop,VerrouParrainageDesktop};
Object.assign(window, MM_EXPORT);
window.MMDASH = Object.assign(window.MMDASH||{}, MM_EXPORT);
