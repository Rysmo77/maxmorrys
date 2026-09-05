const { GlassPanel, TerritoryCard, Button, ChipRow, Segmented, PriceBlock, ProgressBar, LessonRow, Tag, Avatar, DocLine, CheckLine, Field, StatTile, Icon, IconButton, MediaCard } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LE CLUB EN 1440 px — LES QUATRE DERNIERS ONGLETS.

   Deux d'entre eux portent une décision de conception qui compte plus que leur mise en
   page, et la largeur les rend enfin lisibles côte à côte :

   · CLASSEMENT. Il n'y a **aucun classement général absolu**, et il n'y en aura pas. Un
     classement absolu flatte les premiers et fait décrocher les derniers. Deux vues
     seulement : ta vague d'arrivée, et toi contre toi-même. En 390 px c'étaient deux
     onglets successifs ; ici les deux tiennent à l'écran, et la comparaison entre les
     deux façons de se mesurer devient l'argument lui-même.

   · PARRAINAGE. Ce que la personne gagne, c'est **rien en argent**, et l'écran le dit en
     titre de section au lieu de l'enterrer en note de bas de page.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ══ 5 · CLASSEMENT ══ */
function ClubClassementDesktop(){
  const rang = (r,ini,nom,niv,pts,bg,moi) => (
    <div key={r} className={moi?undefined:'mm-press-sm'} style={{display:'flex',alignItems:'center',gap:'13px',
      padding:'13px 18px',margin:'0 -18px',borderRadius:moi?'14px':0,
      background:moi?'linear-gradient(135deg,rgba(108,35,221,.12),rgba(0,87,188,.1))':'transparent',
      borderTop:r===1?0:'1px solid var(--border-hair)'}}>
      <span className="mm-num" style={{width:'18px',fontSize:'13px',color:moi?'var(--text-body)':'var(--text-faint)'}}>{r}</span>
      <Avatar initials={ini} size={34} background={bg} />
      <span style={{flex:1}}>
        <b style={{display:'block',fontSize:'14.5px',fontWeight:moi?700:600}}>{nom}</b>
        <span className="mm-num" style={{fontSize:'11.5px',color:'var(--text-faint)'}}>{niv}</span>
      </span>
      <b className="mm-num" style={{fontSize:'14px'}}>{pts}</b>
    </div>
  );
  return (
    <ClubFrame onglet="Classement" sourcil="Membre depuis février · vague de février"
      aside={<React.Fragment>
        <CEyebrow>Comment on gagne de l'expérience</CEyebrow>
        <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':1,marginTop:'10px'}}>
          <LessonRow state="plain" icon={<Icon name="book" size={13} />} title="Terminer une leçon" meta="+ 20" />
          <LessonRow state="plain" icon={<Icon name="comment" size={13} />} title="Écrire une note" meta="+ 5" />
          <LessonRow state="plain" icon={<Icon name="chat" size={13} />} title="Répondre à quelqu'un" meta="+ 10" />
          <LessonRow state="plain" icon={<Icon name="users" size={13} />} title="Suivre une session" meta="+ 30" last />
        </GlassPanel>
        <p className="rv" style={{'--i':2,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>
          Rééditer une note ne rapporte rien : le barème compte les gestes utiles, pas l'activité.</p>
      </React.Fragment>}>

      <div className="rv-s" style={{'--i':2,marginTop:'20px',padding:'26px',borderRadius:'var(--r-xl)',
        background:'linear-gradient(135deg,#6C23DD,#0057BC 70%,#02AC9C)',color:'#fff',
        boxShadow:'0 16px 40px rgba(108,35,221,.3)',display:'grid',gridTemplateColumns:'1fr auto',
        gap:'26px',alignItems:'center'}}>
        <div>
          <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',
            color:'rgba(255,255,255,.72)',margin:0}}>Arrivés en février · 9 membres</p>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'30px',letterSpacing:'-.035em',
            lineHeight:1.04,margin:'8px 0 0'}}>Tu es 4<sup style={{fontSize:'16px'}}>e</sup> de ta vague</p>
          <p style={{fontSize:'14px',color:'rgba(255,255,255,.86)',margin:'9px 0 0',maxWidth:'52ch'}}>
            Comparé aux gens arrivés en même temps que toi. Pas à ceux qui ont deux ans d'avance.</p>
        </div>
        <div style={{textAlign:'right'}}>
          <p className="mm-num" style={{fontSize:'42px',margin:0,lineHeight:1}}>1 705</p>
          <p style={{fontSize:'12px',color:'rgba(255,255,255,.72)',margin:'4px 0 0'}}>+ 180 cette semaine</p>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'22px',marginTop:'22px',alignItems:'start'}}>
        <div>
          <div className="rv" style={{'--i':3,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
            <CEyebrow>Ta vague · février</CEyebrow>
            <Tag>9 membres</Tag>
          </div>
          <GlassPanel level="flat" padding="4px 18px" className="rv" style={{'--i':4,marginTop:'10px'}}>
            {rang(1,'SK','Seynabou K.','niveau 6','2 410')}
            {rang(2,'AT','Amadou T.','niveau 5','2 080','linear-gradient(135deg,#F38B0A,#B4231F)')}
            {rang(3,'NF','Ndèye F.','niveau 5','1 940','linear-gradient(135deg,#02AC9C,#0057BC)')}
            {rang(4,'A','Toi','niveau 4 · + 180 cette semaine','1 705','linear-gradient(135deg,#6C23DD,#F38B0A)',true)}
            {rang(5,'MB','Moussa B.','niveau 4','1 520','linear-gradient(135deg,#6C23DD,#0057BC)')}
            {rang(6,'AD','Aïda D.','niveau 4','1 340','linear-gradient(135deg,#FF6E7F,#6C23DD)')}
          </GlassPanel>
        </div>

        <div>
          <CEyebrow>Ta progression · toi contre toi</CEyebrow>
          <GlassPanel level="flat" padding={20} className="rv" style={{'--i':4,marginTop:'10px'}}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px'}}>
              <div>
                <p className="mm-num" style={{fontSize:'27px',margin:0}}>Niveau 4</p>
                <p style={{fontSize:'12.5px',color:'var(--text-muted)',margin:'2px 0 0'}}>295 points avant le niveau 5</p>
              </div>
              <Tag tone="ok">+ 180 cette semaine</Tag>
            </div>
            <ProgressBar value={60} style={{marginTop:'14px'}} />
            {/* Barres hebdomadaires : la seule comparaison qui ne fait décrocher personne. */}
            <div style={{display:'flex',alignItems:'flex-end',gap:'8px',height:'96px',marginTop:'22px'}}>
              {[['S-5',40],['S-4',65],['S-3',30],['S-2',85],['S-1',55],['Cette semaine',100]].map(([l,h],i)=>(
                <div key={l} style={{flex:1,textAlign:'center'}}>
                  <div style={{height:(h*.72)+'px',borderRadius:'6px 6px 0 0',
                    background:i===5?'linear-gradient(180deg,#6C23DD,#0057BC)':'var(--fill-3)'}} />
                  <span className="mm-num" style={{display:'block',fontSize:'9.5px',color:'var(--text-faint)',marginTop:'6px'}}>{l}</span>
                </div>
              ))}
            </div>
            <div style={{height:'1px',background:'var(--border-hair)',margin:'18px 0 14px'}} />
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px'}}>
              <div><p className="mm-num" style={{fontSize:'21px',margin:0}}>3 j</p>
                <p style={{fontSize:'11.5px',color:'var(--text-muted)',margin:0}}>série · record 7 j</p></div>
              <div><p className="mm-num" style={{fontSize:'21px',margin:0}}>16 / 47</p>
                <p style={{fontSize:'11.5px',color:'var(--text-muted)',margin:0}}>leçons terminées</p></div>
            </div>
          </GlassPanel>
        </div>
      </div>

      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'20px',maxWidth:'80ch'}}>
        <CEyebrow style={{marginBottom:'6px'}}>Pourquoi il n'y a pas de classement général</CEyebrow>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Un classement absolu <b style={{color:'var(--ink)'}}>flatte les premiers et fait décrocher les derniers</b> — et dans un club qui vient d'ouvrir, il dirait surtout qui est arrivé le plus tôt. Deux vues seulement : ta vague d'arrivée, et toi contre toi-même. La largeur permet de les mettre côte à côte, et c'est la meilleure façon de montrer qu'aucune des deux n'est un palmarès.</p>
      </GlassPanel>
    </ClubFrame>
  );
}

/* ══ 6 · OPPORTUNITÉS ══
   Liste à gauche, détail à droite. Le budget est celui annoncé par la personne qui
   publie, jamais vérifié par la plateforme — et c'est écrit sous la liste, pas dans une
   note légale. */
function ClubOpportunitesDesktop(){
  return (
    <ClubFrame onglet="Opportunités" sourcil="Membre depuis février · 14 vues, 2 décrochées"
      aside={<React.Fragment>
        <CEyebrow>Tes candidatures</CEyebrow>
        <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':1,marginTop:'10px'}}>
          <LessonRow state="done" title="Fiche Google · boulangerie" meta="décrochée · août" />
          <LessonRow state="done" title="Photos produit · cosmétiques" meta="décrochée · juillet" />
          <LessonRow state="plain" icon={<Icon name="case" size={13} color="#8A4B00" />}
            iconBackground="rgba(243,139,10,.18)" title="Refonte site restaurant" meta="en attente · 4 j"
            trailing={<Tag tone="warn">envoyée</Tag>} last />
        </GlassPanel>
      </React.Fragment>}>

      <div className="rv" style={{'--i':2,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',marginTop:'20px'}}>
        <div style={{width:'440px'}}><ChipRow options={['Toutes · 6','Missions','Appels d\'offres','Recrutement']} value="Toutes · 6" /></div>
        <span className="mm-num" style={{fontSize:'11.5px',color:'var(--text-faint)'}}>Trié par date de publication</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'22px',marginTop:'18px',alignItems:'start'}}>
        <div>
          <div className="rv" style={{'--i':3}}>
            <TerritoryCard stacked={false} territory="transforme" meta="Mission · Dakar · publiée hier"
              title="Fiche Google pour trois boutiques">
              <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
                <PriceBlock amount="180 000" size={22} note="Budget annoncé · forfait" />
                <Tag tone="ok">Ouverte</Tag>
              </div>
            </TerritoryCard>
          </div>
          <div className="rv" style={{'--i':4}}>
            <TerritoryCard stacked={false} territory="forme" meta="Appel d'offres · Abidjan · 4 j restants"
              title="Refonte d'un site de restaurant">
              <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
                <PriceBlock amount="450 000" size={22} note="Budget annoncé · au projet" />
                <Tag tone="warn">Candidature envoyée</Tag>
              </div>
            </TerritoryCard>
          </div>
          <div className="rv" style={{'--i':5}}>
            <TerritoryCard stacked={false} territory="rose" meta="Recrutement · télétravail"
              title="Chargé·e de contenu, mi-temps">
              <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
                <PriceBlock amount="250 000" currency="FCFA / mois" size={22} note="Annoncé par l'employeur" />
                <Tag tone="ok">Ouverte</Tag>
              </div>
            </TerritoryCard>
          </div>
          <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'14px'}}>
            Les budgets affichés sont ceux annoncés par la personne qui publie. <b style={{color:'var(--text-muted)'}}>Ils ne
            sont pas vérifiés par la plateforme</b>, et c'est écrit ici plutôt que caché en bas de page.</p>
        </div>

        <GlassPanel level="hero" padding={24} className="rv" style={{'--i':3}}>
          <CEyebrow>Mission · Dakar</CEyebrow>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'24px',letterSpacing:'-.035em',
            lineHeight:1.05,margin:'7px 0 0'}}>Fiche Google pour trois boutiques</p>
          <p style={{fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'12px 0 0',maxWidth:'var(--measure-prose)'}}>
            Trois boutiques de prêt-à-porter dans le même quartier, même propriétaire. Il faut créer
            les trois fiches, les photographier, écrire les descriptions et les catégoriser. Le
            propriétaire fournit les horaires et les accès.</p>
          <div style={{marginTop:'18px'}}>
            <DocLine label="Budget annoncé" value="180 000 FCFA" />
            <DocLine label="Forme" value="forfait, une fois" />
            <DocLine label="Délai souhaité" value="3 semaines" />
            <DocLine label="Sur place" value="oui · Dakar, Sacré-Cœur" />
            <DocLine label="Publiée par" value="Max-Morrys" last />
          </div>
          <Button tone="transforme" style={{marginTop:'18px'}}>Postuler</Button>
          <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',lineHeight:1.5,margin:'10px 0 0'}}>
            Ta candidature part avec ton profil de membre. Tu n'as pas de CV à joindre.</p>
        </GlassPanel>
      </div>
    </ClubFrame>
  );
}

/* ══ 7 · INFORMATIONS ══
   Le digest de la semaine. Il vit dans l'application et dans le centre de notifications,
   **jamais par e-mail** — aucun canal d'envoi n'existe, et l'écran le dit. */
function ClubInfosDesktop(){
  return (
    <ClubFrame onglet="Informations" sourcil="Membre depuis février · digest du 4 septembre"
      aside={<React.Fragment>
        <CEyebrow>Les digests précédents</CEyebrow>
        <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':1,marginTop:'10px'}}>
          <LessonRow state="plain" icon={<Icon name="info" size={13} />} title="Semaine du 28 août" meta="lu" />
          <LessonRow state="plain" icon={<Icon name="info" size={13} />} title="Semaine du 21 août" meta="lu" />
          <LessonRow state="plain" icon={<Icon name="info" size={13} />} title="Semaine du 14 août" meta="lu" last />
        </GlassPanel>
        <p className="rv" style={{'--i':2,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>
          Trois digests depuis ton inscription. Un par semaine, quand il y a de quoi le remplir.</p>
      </React.Fragment>}>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'26px',marginTop:'20px',alignItems:'start'}}>
        <div>
          <GlassPanel level="hero" padding={26} className="rv" style={{'--i':2}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'14px'}}>
              <div>
                <CEyebrow>Digest · semaine du 4 septembre</CEyebrow>
                <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'26px',letterSpacing:'-.035em',
                  lineHeight:1.04,margin:'7px 0 0'}}>Ce qui s'est passé cette semaine</p>
              </div>
              <Tag tone="ok">Nouveau</Tag>
            </div>
            <div className="mm-prose" style={{marginTop:'18px',color:'#21272F'}}>
              <p style={{margin:'0 0 14px'}}>Trois choses, et une que je préfère te dire moi-même.</p>
              <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',
                lineHeight:1.1,margin:'22px 0 8px'}}>La session de jeudi a servi</h2>
              <p style={{margin:0}}>Six personnes présentes, et trois fiches Google corrigées en direct. Seynabou a eu trois appels dans la semaine qui a suivi. La transcription est dans l'agenda si tu l'as manquée.</p>
              <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',
                lineHeight:1.1,margin:'22px 0 8px'}}>Deux missions sont arrivées</h2>
              <p style={{margin:0}}>Une fiche Google pour trois boutiques à Dakar, et un appel d'offres pour un restaurant à Abidjan. Les deux sont dans Opportunités, avec les budgets annoncés.</p>
              <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',
                lineHeight:1.1,margin:'22px 0 8px'}}>Ce que je n'ai pas fait</h2>
              <p style={{margin:0}}>L'atelier de septembre devait avoir douze places. Il en a quatre, parce que la salle que je visais n'était pas libre. Je préfère te le dire que laisser le compteur parler à ma place.</p>
            </div>
          </GlassPanel>

          <GlassPanel level="truth" className="rv" style={{'--i':3,marginTop:'16px',maxWidth:'74ch'}}>
            <CEyebrow style={{marginBottom:'6px'}}>Où arrive ce digest</CEyebrow>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Ici, et dans ton centre de notifications. <b style={{color:'var(--ink)'}}>Pas par e-mail</b> — la plateforme n'a aucun canal d'envoi, et je ne vais pas te promettre une lettre que je ne peux pas poster.</p>
          </GlassPanel>
        </div>

        <div>
          <CEyebrow>Les chiffres de la semaine</CEyebrow>
          <div style={{display:'grid',gap:'10px',marginTop:'10px'}}>
            <div className="rv" style={{'--i':3}}><StatTile label="Publications" value="7" foot="relevé du 04/09" /></div>
            <div className="rv" style={{'--i':4}}><StatTile label="Réponses" value="41" foot="relevé du 04/09" /></div>
            <div className="rv" style={{'--i':5}}><StatTile label="Missions publiées" value="2" foot="relevé du 04/09" /></div>
            <div className="rv" style={{'--i':6}}><StatTile label="Sessions tenues" value="1" foot="sur 1 annoncée" /></div>
          </div>
          <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'12px'}}>
            Chaque case porte sa date de relevé. Aucun nombre de membres n'est affiché : il serait
            juste, mais il serait petit, et il ne dit rien de ce que le Club t'apporte.</p>
        </div>
      </div>
    </ClubFrame>
  );
}

/* ══ 8 · PARRAINAGE ══
   Ce que la personne gagne, c'est rien en argent. C'est un TITRE de section, pas une
   note en bas de page. */
function ClubParrainageDesktop(){
  return (
    <ClubFrame onglet="Parrainage" sourcil="Membre depuis février · 7 partages, 0 inscrit"
      aside={<React.Fragment>
        <CEyebrow>Tes partages</CEyebrow>
        <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':1,marginTop:'10px'}}>
          <LessonRow state="plain" icon={<Icon name="share" size={13} />} title="WhatsApp" meta="4 partages" />
          <LessonRow state="plain" icon={<Icon name="share" size={13} />} title="Lien copié" meta="3 partages" />
          <LessonRow state="plain" icon={<Icon name="users" size={13} />} title="Inscrits via ton code" meta="0 · depuis février" last />
        </GlassPanel>
        <p className="rv" style={{'--i':2,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'12px'}}>
          Un zéro daté est une information. Sept partages et aucun inscrit veut peut-être dire que
          le prix est le frein, pas le message.</p>
      </React.Fragment>}>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'26px',marginTop:'20px',alignItems:'start'}}>
        <div>
          <p className="rv-l" style={{'--i':2,fontFamily:'var(--f-display)',fontWeight:900,fontSize:'34px',
            letterSpacing:'-.035em',lineHeight:.94,margin:0}}>FAIS-LUI<br />GAGNER 15 %.</p>
          <p className="rv" style={{'--i':4,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,
            maxWidth:'44ch',marginTop:'14px'}}>Ton code fait passer le Club de <b className="mm-num" style={{color:'var(--ink)'}}>19 900</b> à <b className="mm-num" style={{color:'var(--ink)'}}>16 915 F</b> pour la personne que tu parraines. La remise est calculée côté serveur : elle ne dépend pas du lien sur lequel elle a cliqué.</p>

          <GlassPanel level="hero" padding={26} className="rv" style={{'--i':5,marginTop:'22px'}}>
            <CEyebrow>Ton code</CEyebrow>
            <p className="mm-num" style={{fontSize:'38px',letterSpacing:'.1em',margin:'8px 0 0'}}>MOUSSA15</p>
            <div style={{display:'flex',gap:'9px',marginTop:'18px'}}>
              <Button tone="transforme" size="sm" style={{flex:1}}>Copier le code</Button>
              <Button tone="ghost" size="sm" style={{flex:1}}>
                <Icon name="share" size={16} strokeWidth={2.2} /> Partager</Button>
            </div>
            <div style={{height:'1px',background:'var(--border-hair)',margin:'20px 0'}} />
            <CEyebrow>Le lien complet</CEyebrow>
            <p className="mm-num" style={{fontSize:'12.5px',color:'var(--text-muted)',margin:'7px 0 0',wordBreak:'break-all'}}>
              maxmorrys.me/club-des-digitos?code=MOUSSA15</p>
          </GlassPanel>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'12px'}}>
            <GlassPanel level="flat" padding={18} className="rv" style={{'--i':6}}>
              <CEyebrow style={{fontSize:'10px'}}>Partages</CEyebrow>
              <p className="mm-num" style={{fontSize:'29px',margin:'4px 0 0'}}>7</p>
              <p style={{fontSize:'11px',color:'var(--text-faint)',margin:0}}>depuis février</p>
            </GlassPanel>
            <GlassPanel level="flat" padding={18} className="rv" style={{'--i':7}}>
              <CEyebrow style={{fontSize:'10px'}}>Inscrits</CEyebrow>
              <p className="mm-num" style={{fontSize:'29px',margin:'4px 0 0'}}>0</p>
              <p style={{fontSize:'11px',color:'var(--text-faint)',margin:0}}>depuis février</p>
            </GlassPanel>
          </div>
        </div>

        <div>
          <CEyebrow>Ce que tu gagnes, toi</CEyebrow>
          <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'10px',padding:'24px'}}>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'23px',letterSpacing:'-.032em',
              lineHeight:1.06,margin:0}}>Rien en argent, et je ne vais pas te faire croire le contraire.</p>
            <p style={{fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'12px 0 0',maxWidth:'var(--measure-prose)'}}>
              La remise va au filleul, entièrement. Il n'y a pas de commission, pas de mois offert,
              pas de niveau à débloquer. Ce que tu gagnes, c'est quelqu'un de plus dans le Club avec
              qui avancer — et si ça ne te suffit pas, ne partage pas. C'est une réponse valable.</p>
          </GlassPanel>

          <CEyebrow style={{marginTop:'24px'}}>Ce que ton filleul obtient</CEyebrow>
          <GlassPanel level="flat" padding={22} className="rv" style={{'--i':6,marginTop:'10px'}}>
            <div style={{display:'flex',alignItems:'baseline',gap:'12px'}}>
              <span className="mm-num" style={{fontSize:'17px',color:'var(--text-faint)',textDecoration:'line-through'}}>19 900</span>
              <b className="mm-num" style={{fontSize:'30px',letterSpacing:'-.04em',color:'var(--mm-violet-t)'}}>16 915 F</b>
            </div>
            <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'6px 0 0'}}>soit <b className="mm-num" style={{color:'var(--ink)'}}>1 410 F / mois</b> au lieu de 1 658</p>
            <div style={{height:'1px',background:'var(--border-hair)',margin:'18px 0'}} />
            <CheckLine style={{marginTop:0,fontSize:'14px'}}>Les mêmes cinq engagements, sans exception</CheckLine>
            <CheckLine style={{fontSize:'14px'}}>Douze mois, à partir de son inscription</CheckLine>
            <CheckLine tone="neutre" dash style={{fontSize:'14px'}}>Le code ne se cumule avec aucune autre remise</CheckLine>
          </GlassPanel>

          <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'14px'}}>
            Sept partages et zéro inscrit depuis février. Le chiffre est affiché parce qu'il est vrai,
            et parce qu'il dit peut-être quelque chose d'utile : le frein est plus probablement le
            prix que le message.</p>
        </div>
      </div>
    </ClubFrame>
  );
}

const MM_EXPORT = {ClubClassementDesktop,ClubOpportunitesDesktop,ClubInfosDesktop,ClubParrainageDesktop};
Object.assign(window, MM_EXPORT);
window.MMDASH = Object.assign(window.MMDASH||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('DashboardsClub2.js');
