const { GlassPanel, TerritoryCard, Button, ChipRow, Segmented, ProgressBar, LessonRow, Tag, Avatar, PriceBlock, CheckLine, StatTile, Field, Icon, IconButton, PillButton, Skeleton } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LE CLUB EN 390 px — LA HUITIÈME SECTION, ET L'ÉCRAN VERROUILLÉ.

   Deux manques, et le second est le plus intéressant.

   1 · INFORMATIONS n'existait pas. La planche mobile annonçait « huit onglets » mais en
       comptait sept : le mur d'abonnement occupait le huitième créneau. Un onglet annoncé
       et non dessiné finit par être livré à la va-vite, ou pas du tout.

   2 · L'ÉCRAN VERROUILLÉ n'existait pas non plus, et ce n'est pas le mur d'abonnement.
       Le mur s'adresse à un VISITEUR sur le site public. L'écran verrouillé s'adresse à
       quelqu'un qui a déjà un compte, qui est DANS l'application, et qui vient de toucher
       « Club » dans la barre d'onglets. Ce n'est pas la même personne, et lui servir la
       page de vente publique gâche la seule information qu'on a en plus : **elle est
       entrée, donc on sait quel onglet elle voulait.**

   ── LA DÉCISION DE L'ÉCRAN VERROUILLÉ ──

   Pas de contenu flouté derrière le cadenas. C'est le motif réflexe, et il est faux ici :
   un flou dit « il y a foule là-dedans, fais-nous confiance ». Le Club vient d'ouvrir, il
   ne peut pas dire ça — et la personne le vérifierait au premier écran après avoir payé.

   À la place, chaque onglet verrouillé montre **les compteurs réels de ce qui est derrière**,
   et **un élément complet, non flouté**. C'est moins flatteur qu'un flou, et beaucoup plus
   solide : ce qui est promis est exactement ce qui sera livré.

   Corollaire tenu partout : aucun nombre de membres. Il serait vrai, il serait petit, et il
   ne dit rien de ce que le Club apporte.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ══ 8 · INFORMATIONS — la section qui manquait ══
   Le digest de la semaine. Il vit ici et dans le centre de notifications, jamais par
   e-mail : aucun canal d'envoi n'existe, et l'écran le dit plutôt que de le laisser croire. */
function ClubInfos({go}){
  return (
    <Screen territory="transforme" bar={<ClubBar go={go} titre="Informations" />}>
      <Eyebrow>Digest · semaine du 4 septembre</Eyebrow>
      <Display size="sm" lines={['CE QUI S\u2019EST PASSÉ','CETTE SEMAINE.']} style={{marginTop:'6px'}} />

      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':4,marginTop:'18px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
          <Eyebrow style={{margin:0}}>Trois choses</Eyebrow>
          <Tag tone="ok">Nouveau</Tag>
        </div>
        <div className="mm-prose" style={{marginTop:'14px',color:'#21272F'}}>
          <p style={{margin:'0 0 13px',fontSize:'14.5px'}}>Et une que je préfère te dire moi-même.</p>
          <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'17px',letterSpacing:'-.03em',
            lineHeight:1.1,margin:'18px 0 7px'}}>La session de jeudi a servi</h2>
          <p style={{margin:0,fontSize:'14.5px'}}>Six personnes présentes, trois fiches Google corrigées en direct. Seynabou a eu trois appels dans la semaine qui a suivi. La transcription est dans l'agenda si tu l'as manquée.</p>
          <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'17px',letterSpacing:'-.03em',
            lineHeight:1.1,margin:'18px 0 7px'}}>Deux missions sont arrivées</h2>
          <p style={{margin:0,fontSize:'14.5px'}}>Une fiche Google pour trois boutiques à Dakar, un appel d'offres pour un restaurant à Abidjan. Les deux sont dans Opportunités, avec les budgets annoncés.</p>
          <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'17px',letterSpacing:'-.03em',
            lineHeight:1.1,margin:'18px 0 7px'}}>Ce que je n'ai pas fait</h2>
          <p style={{margin:0,fontSize:'14.5px'}}>L'atelier de septembre devait avoir douze places. Il en a quatre, parce que la salle que je visais n'était pas libre. Je préfère te le dire que laisser le compteur parler à ma place.</p>
        </div>
      </GlassPanel>

      <Eyebrow style={{'--i':5,marginTop:'24px'}}>Les chiffres de la semaine</Eyebrow>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'10px'}}>
        <div className="rv" style={{'--i':5}}><StatTile label="Publications" value="7" foot="relevé du 04/09" /></div>
        <div className="rv" style={{'--i':6}}><StatTile label="Réponses" value="41" foot="relevé du 04/09" /></div>
        <div className="rv" style={{'--i':7}}><StatTile label="Missions publiées" value="2" foot="relevé du 04/09" /></div>
        <div className="rv" style={{'--i':8}}><StatTile label="Sessions tenues" value="1" foot="sur 1 annoncée" /></div>
      </div>

      <Eyebrow style={{'--i':9,marginTop:'24px'}}>Les digests précédents</Eyebrow>
      <GlassPanel level="flat" padding="6px 16px" className="rv" style={{'--i':9,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="info" size={13} />} title="Semaine du 28 août" meta="lu"
          trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="info" size={13} />} title="Semaine du 21 août" meta="lu"
          trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="info" size={13} />} title="Semaine du 14 août" meta="lu" last
          trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} />
      </GlassPanel>
      <p className="rv" style={{'--i':10,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'12px'}}>
        Trois digests depuis ton inscription. Un par semaine, quand il y a de quoi le remplir —
        pas un calendrier tenu à vide.</p>

      <GlassPanel level="truth" className="rv" style={{'--i':10,marginTop:'14px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Où arrive ce digest</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Ici, et dans ton centre de notifications. <b style={{color:'var(--ink)'}}>Pas par e-mail</b> — la plateforme n'a aucun canal d'envoi, et je ne vais pas te promettre une lettre que je ne peux pas poster.</p>
      </GlassPanel>
    </Screen>
  );
}

/* ══ L'ÉCRAN VERROUILLÉ ══
   Un seul composant, huit contenus. `onglet` décide de ce qui est montré derrière le
   cadenas — parce que la personne a touché un onglet précis, et que c'est l'information
   la plus utile qu'on ait sur elle.

   Chaque entrée porte : le compteur RÉEL de ce qui est derrière, et un élément complet,
   non flouté. Tous ces nombres viennent de la base — la règle du monospace s'applique
   ici comme ailleurs, et c'est justement sur un écran de vente qu'elle compte le plus. */
const VERROU = {
  Fil: {
    titre:['CE QUI SE DIT','CETTE SEMAINE.'],
    quoi:'Sept publications et quarante-et-une réponses depuis lundi. Des gens qui vendent vraiment quelque chose, qui racontent ce qui a marché.',
    chiffres:[['7','publications'],['41','réponses'],['3','catégories']],
    apercuTitre:'Une publication, en entier',
    apercu:(
      <React.Fragment>
        <div style={{display:'flex',gap:'11px',alignItems:'center'}}>
          <Avatar initials="SK" size={34} />
          <div style={{flex:1}}>
            <p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Seynabou K.</p>
            <p className="mm-num" style={{fontSize:'10.5px',color:'var(--text-faint)',margin:0}}>Entraide · il y a 2 h</p>
          </div>
        </div>
        <p style={{fontSize:'13.5px',lineHeight:1.5,margin:'11px 0 0'}}>J'ai refait ma fiche Google en suivant le module 2. Trois appels en une semaine, sur des recherches « coiffure Ouakam ».</p>
      </React.Fragment>
    )
  },
  Discussions: {
    titre:['LES QUESTIONS','QU\u2019ON SE POSE.'],
    quoi:'Quarante-et-un sujets ouverts, classés par catégorie. La question bête se pose ici, et quelqu\'un y répond.',
    chiffres:[['41','sujets'],['3','catégories'],['17','réponses au plus long']],
    apercuTitre:'Un sujet, en entier',
    apercu:(
      <React.Fragment>
        <Eyebrow style={{margin:0}}>Clients · 21 réponses</Eyebrow>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'17px',letterSpacing:'-.032em',
          lineHeight:1.06,margin:'6px 0 0'}}>Un client ne répond plus après le devis</p>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'8px 0 0'}}>Trois semaines de silence. Je relance une quatrième fois ou je laisse tomber ?</p>
      </React.Fragment>
    )
  },
  Membres: {
    titre:['QUI FAIT QUOI,','ET OÙ.'],
    quoi:'Six fiches remplies dans ta vague d\'arrivée. Le métier, le quartier, et de quoi écrire en privé sans passer par moi.',
    chiffres:[['6','fiches remplies'],['9','dans ta vague'],['4','quartiers de Dakar']],
    apercuTitre:'Une fiche, en entier',
    apercu:(
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
      </React.Fragment>
    )
  },
  Agenda: {
    titre:['DEUX SESSIONS','CE MOIS-CI.'],
    quoi:'Une en ligne, un atelier à Dakar. L\'agenda est publié un mois à l\'avance, et une session annoncée a lieu même si nous sommes quatre.',
    chiffres:[['2','sessions ce mois'],['4','places restantes'],['1','atelier à Dakar']],
    apercuTitre:'Une session, en entier',
    apercu:(
      <React.Fragment>
        <div style={{display:'flex',gap:'12px'}}>
          <span style={{width:'40px',height:'40px',borderRadius:'13px',background:'var(--action-transforme)',
            display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="chat" size={18} color="#fff" /></span>
          <div style={{flex:1}}>
            <p style={{fontSize:'14.5px',fontWeight:700,margin:0}}>Ta fiche Google, en direct</p>
            <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'2px 0 0'}}>jeudi 10/09 · 20:00 → 21:00</p>
          </div>
        </div>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'10px 0 0'}}>J'ouvre une vraie fiche et je la corrige devant vous, avec les erreurs laissées à l'écran.</p>
      </React.Fragment>
    )
  },
  Classement: {
    titre:['TA VAGUE,','PAS UN PALMARÈS.'],
    quoi:'Tu serais comparée aux neuf personnes arrivées en même temps que toi. Pas à celles qui ont deux ans d\'avance — il n\'y a aucun classement général, et il n\'y en aura pas.',
    chiffres:[['9','dans ta vague'],['2','vues de progression'],['0','classement absolu']],
    apercuTitre:'Ce que tu verrais',
    apercu:(
      <React.Fragment>
        <Eyebrow style={{margin:0}}>Arrivés en février · 9 membres</Eyebrow>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.032em',
          lineHeight:1.06,margin:'6px 0 0'}}>Ta place dans ta vague</p>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'8px 0 0'}}>Et une seconde vue qui ne te compare qu'à toi-même, semaine après semaine.</p>
      </React.Fragment>
    )
  },
  Opportunités: {
    titre:['TROIS MISSIONS','OUVERTES.'],
    quoi:'Des budgets annoncés de 180 000 à 450 000 F. Ce sont ceux que la personne qui publie déclare — ils ne sont pas vérifiés par la plateforme, et c\'est écrit là aussi.',
    chiffres:[['3','ouvertes'],['180 000','budget le plus bas'],['450 000','le plus haut']],
    apercuTitre:'Une mission, en entier',
    apercu:(
      <React.Fragment>
        <Eyebrow style={{margin:0}}>Mission · Dakar · publiée hier</Eyebrow>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'17px',letterSpacing:'-.032em',
          lineHeight:1.06,margin:'6px 0 0'}}>Fiche Google pour trois boutiques</p>
        <div style={{marginTop:'11px'}}>
          <PriceBlock amount="180 000" size={21} note="Budget annoncé · forfait" />
        </div>
      </React.Fragment>
    )
  },
  Informations: {
    titre:['LE DIGEST','DE LA SEMAINE.'],
    quoi:'Ce qui s\'est passé, ce qui arrive, et ce que je n\'ai pas fait. Un par semaine, quand il y a de quoi le remplir.',
    chiffres:[['3','digests publiés'],['1','par semaine'],['0','e-mail envoyé']],
    apercuTitre:'Un extrait, en entier',
    apercu:(
      <React.Fragment>
        <Eyebrow style={{margin:0}}>Semaine du 4 septembre</Eyebrow>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'17px',letterSpacing:'-.032em',
          lineHeight:1.06,margin:'6px 0 0'}}>Ce que je n'ai pas fait</p>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'8px 0 0'}}>L'atelier de septembre devait avoir douze places. Il en a quatre, parce que la salle que je visais n'était pas libre.</p>
      </React.Fragment>
    )
  },
  Parrainage: {
    titre:['FAIS-LUI','GAGNER 15 %.'],
    quoi:'Un code à toi, qui fait passer le Club de 19 900 à 16 915 F pour la personne que tu parraines. Toi, tu ne gagnes rien en argent — et c\'est écrit dans l\'onglet, pas en bas de page.',
    chiffres:[['15','% au filleul'],['16 915','son prix, en F'],['0','commission pour toi']],
    apercuTitre:'Ce que tu aurais',
    apercu:(
      <React.Fragment>
        <Eyebrow style={{margin:0}}>Ton code</Eyebrow>
        <p className="mm-num" style={{fontSize:'27px',letterSpacing:'.1em',margin:'6px 0 0'}}>AISSA15</p>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'9px 0 0'}}>La remise est calculée côté serveur : elle ne dépend pas du lien sur lequel la personne a cliqué.</p>
      </React.Fragment>
    )
  }
};

const VERROU_ORDRE = ['Fil','Discussions','Membres','Agenda','Classement','Opportunités','Informations','Parrainage'];

function ClubVerrouille({os,go,onglet='Opportunités'}){
  const v = VERROU[onglet] || VERROU.Opportunités;
  return (
    <Screen territory="transforme"
      bar={<AppBar left={<BackButton onClick={()=>go&&go('espace')} />}
        center={<span style={{fontSize:'13px',fontWeight:600}}>{onglet}</span>}
        right={<Button tone="quiet" size="sm">Aide</Button>} />}>

      {/* La bande d'onglets reste visible et cliquable : la personne DOIT pouvoir voir ce
          qu'il y a derrière chacun avant de payer. Masquer la navigation d'un espace
          verrouillé, c'est vendre une boîte fermée.

          `ChipRow`, pas une réimplémentation : cette bande l'avait recopiée en ligne et
          avait dérivé sur quatre valeurs — 34 px de haut au lieu de 40, 6 px d'écart au
          lieu de 8. Or cette bande EST l'interaction principale de l'écran, donc elle est
          servie à `--touch-aa` (44 px), le plancher exigé de cible tactile. */}
      <div className="rv" style={{marginTop:'4px'}}>
        <ChipRow layout="scroll" height={44} value={onglet} options={VERROU_ORDRE}
          icon={<Icon name="lock" size={11} strokeWidth={2.6} />}
          /* `overflowX` est AUSSI posé en `style`, en plus de `layout="scroll"`, et ce n'est
             pas une redondance inutile : `style` est répandu sur le conteneur par toutes les
             versions du composant, alors que `layout` n'existe que dans la version courante.
             Le paquet compilé se régénère en fin de tour — sans ce garde-fou, la bande reste
             en `overflow:hidden` jusque-là et quatre onglets sur huit sont physiquement
             inatteignables, soit exactement le défaut que cet écran prétend éviter.
             Il ne couvre PAS le masquage de la barre de défilement : celui-ci passe par la
             classe `.mm-scroll-x`, que seule la version courante du composant applique. */
          style={{overflowX:'auto'}} />
      </div>

      <div className="rv-s" style={{'--i':1,width:'54px',height:'54px',borderRadius:'18px',marginTop:'20px',
        background:'linear-gradient(135deg,#B98CFF,#6C23DD)',display:'grid',placeItems:'center',
        boxShadow:'0 10px 26px rgba(108,35,221,.32)'}}>
        <Icon name="lock" size={23} color="#fff" strokeWidth={2.3} />
      </div>

      <Display size="sm" lines={v.titre} style={{marginTop:'18px'}} />
      <Lede style={{'--i':4,marginTop:'12px'}}>{v.quoi}</Lede>

      {/* Les compteurs réels. C'est ce qui remplace le contenu flouté. */}
      <GlassPanel padding={18} className="rv" style={{'--i':5,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'12px'}}>Derrière ce cadenas, en ce moment</Eyebrow>
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
      <Eyebrow style={{'--i':6,marginTop:'22px'}}>{v.apercuTitre}</Eyebrow>
      <GlassPanel level="flat" padding={17} className="rv" style={{'--i':6,marginTop:'10px'}}>
        {v.apercu}
      </GlassPanel>
      <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'10px'}}>
        Pas flouté, pas tronqué. C'est exactement ce que tu verras — je préfère te montrer moins
        et que ce soit vrai.</p>

      {/* Le prix, cadré des deux façons, comme partout. */}
      <GlassPanel level="hero" padding={20} className="rv" style={{'--i':8,marginTop:'20px'}}>
        <div style={{display:'flex',alignItems:'baseline',gap:'8px'}}>
          <b className="mm-num" style={{fontSize:'32px',letterSpacing:'-.045em',color:'var(--mm-violet-t)'}}>1 658</b>
          <span style={{fontSize:'14px',fontWeight:600}}>F / mois</span>
        </div>
        <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'5px 0 0'}}>Facturé <b className="mm-num" style={{color:'var(--ink)'}}>19 900 F</b>, une fois, pour douze mois. Les huit onglets, d'un coup.</p>
        <Button tone="transforme" style={{marginTop:'15px'}} onClick={()=>go&&go('club')}>
          Ouvrir les huit onglets <Icon name="forward" size={16} strokeWidth={2.6} />
        </Button>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>
          Parrainé ? Ton code te fait <b className="mm-num">16 915 F</b>.</p>
      </GlassPanel>

      <GlassPanel level="truth" className="rv" style={{'--i':9,marginTop:'14px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi rien n'est flouté ici</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Un contenu flouté dit « il y a foule là-dedans, fais-nous confiance ». Le Club a ouvert cette année : il ne peut pas dire ça, et <b style={{color:'var(--ink)'}}>tu le vérifierais au premier écran après avoir payé</b>. Alors je te donne les compteurs exacts et un élément entier.</p>
      </GlassPanel>

      <div className="rv" style={{'--i':10,marginTop:'18px'}}>
        <Button tone="quiet" fullWidth onClick={()=>go&&go('pole')}>En attendant, le podcast est gratuit</Button>
      </div>
      <p className="rv" style={{'--i':10,fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',
        lineHeight:1.55,margin:'10px 0 24px'}}>
        Un épisode, deux vidéos, 46 articles. Même territoire, étage du dessous.</p>
    </Screen>
  );
}

/* Huit variantes nommées, pour que la planche puisse les monter par nom. */
const VerrouFil = (p)=><ClubVerrouille {...p} onglet="Fil" />;
const VerrouDiscussions = (p)=><ClubVerrouille {...p} onglet="Discussions" />;
const VerrouMembres = (p)=><ClubVerrouille {...p} onglet="Membres" />;
const VerrouAgenda = (p)=><ClubVerrouille {...p} onglet="Agenda" />;
const VerrouClassement = (p)=><ClubVerrouille {...p} onglet="Classement" />;
const VerrouOpportunites = (p)=><ClubVerrouille {...p} onglet="Opportunités" />;
const VerrouInfos = (p)=><ClubVerrouille {...p} onglet="Informations" />;
const VerrouParrainage = (p)=><ClubVerrouille {...p} onglet="Parrainage" />;

const MM_EXPORT = {ClubInfos,ClubVerrouille,VERROU,VERROU_ORDRE,
  VerrouFil,VerrouDiscussions,VerrouMembres,VerrouAgenda,
  VerrouClassement,VerrouOpportunites,VerrouInfos,VerrouParrainage};
Object.assign(window, MM_EXPORT);
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensClubVerrou.js');
