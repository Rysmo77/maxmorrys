const { GlassPanel, TerritoryCard, Button, ChipRow, Segmented, ProgressBar, LessonRow, Tag, Avatar, PriceBlock, CheckLine, Icon, IconButton, PillButton, Field } = window.DS;

/** Bilan d'abonnement — permanent, jamais terminal.
 *  Il répond à UJ-2 : un abonné annuel redécouvre 19 900 F d'un coup après onze mois de silence. */
function Bilan({i=0}){
  return (
    <GlassPanel level="night" padding={18} className="rv" style={{'--i':i}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
        <div>
          <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'#8B95A3',margin:0}}>Ton abonnement, depuis février</p>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.032em',margin:'5px 0 0',color:'#fff'}}>Ce qu'il t'a apporté</p>
        </div>
        <Tag tone="ok">Actif</Tag>
      </div>
      <div style={{display:'flex',gap:'10px',marginTop:'15px'}}>
        {[['6','sessions suivies'],['14','opportunités vues'],['2','missions décrochées']].map(([n,l])=>(
          <div key={l} style={{flex:1}}>
            <p className="mm-num" style={{fontSize:'23px',margin:0,color:'#fff'}}>{n}</p>
            <p style={{fontSize:'10.5px',color:'#8B95A3',lineHeight:1.3,margin:0}}>{l}</p>
          </div>
        ))}
      </div>
      <div style={{height:'1px',background:'rgba(255,255,255,.12)',margin:'14px 0'}} />
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
        <span style={{fontSize:'12px',color:'#A2ADBB'}}>Échéance</span>
        <b className="mm-num" style={{fontSize:'12.5px',color:'#fff'}}>14/02/2027 · avis 15 j avant</b>
      </div>
    </GlassPanel>
  );
}

function ClubBar({go,titre}){
  return <AppBar left={<BackButton onClick={()=>go&&go('club')} />} center={titre && <span style={{fontSize:'13px',fontWeight:600}}>{titre}</span>} right={<IconButton label="Notifications" badge><Icon name="bell" strokeWidth={2} /></IconButton>} />;
}
function Fab({icon}){
  return (
    <div style={{position:'absolute',right:'18px',bottom:'28px',zIndex:9}}>
      <span className="rv-s" style={{'--i':8,width:'56px',height:'56px',borderRadius:'50%',background:'var(--action-transforme)',display:'grid',placeItems:'center',boxShadow:'0 10px 26px rgba(108,35,221,.38)',cursor:'pointer'}}>{icon}</span>
    </div>
  );
}

/* ── 2 · FIL ── */
function ClubFil({go}){
  return (
    <Screen territory="transforme" bar={<ClubBar go={go} titre="Le fil" />}>
      <Bilan i={0} />
      <Eyebrow style={{'--i':2,marginTop:'22px'}}>Aujourd'hui</Eyebrow>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':3,marginTop:'10px'}}>
        <div style={{display:'flex',gap:'11px',alignItems:'center'}}>
          <Avatar initials="SK" size={38} />
          <div style={{flex:1}}>
            <p style={{fontSize:'14px',fontWeight:600,margin:0}}>Seynabou K.</p>
            <p className="mm-num" style={{fontSize:'11px',color:'var(--text-faint)',margin:0}}>Entraide · il y a 2 h</p>
          </div>
          <Tag>Entraide</Tag>
        </div>
        <p style={{fontSize:'14px',lineHeight:1.5,margin:'12px 0 0'}}>J'ai refait ma fiche Google en suivant le module 2. Trois appels en une semaine, sur des recherches « coiffure Ouakam ». Je mets ma liste de mots en commentaire si ça sert à quelqu'un.</p>
        <div style={{display:'flex',gap:'18px',marginTop:'14px',alignItems:'center'}}>
          <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}><Icon name="heart" size={16} color="#6C23DD" /><b className="mm-num" style={{fontSize:'12.5px'}}>12</b></span>
          <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}><Icon name="repeat" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>3</b></span>
          <span style={{display:'flex',alignItems:'center',gap:'6px',color:'var(--text-muted)'}}><Icon name="comment" size={16} /><b className="mm-num" style={{fontSize:'12.5px'}}>7</b></span>
        </div>
      </GlassPanel>
      <div className="rv" style={{'--i':4,marginTop:'12px'}}>
        <TerritoryCard first territory="transforme" meta="Session en direct · jeudi 20 h" title="Ta fiche Google, en direct">
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
            <span className="mm-num" style={{fontSize:'12px',color:'var(--card-ink-2)'}}>En ligne · 1 h</span>
            <Button tone="transforme" size="sm">Je m'inscris</Button>
          </div>
        </TerritoryCard>
      </div>
      <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi ce bilan est en tête</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Un abonnement annuel ne supprime pas le renoncement, il le concentre sur un instant. Le bilan est donc permanent, pas terminal.</p>
      </GlassPanel>
      <Fab icon={<Icon name="send" size={20} color="#fff" strokeWidth={2.6} />} />
    </Screen>
  );
}

/* ── 3 · DISCUSSIONS ── */
function ClubDiscussions({go}){
  const [cat,setCat] = React.useState('Toutes');
  const pile = (list)=>(
    <span style={{display:'flex',alignItems:'center'}}>
      {list.map((a,i)=><Avatar key={a} initials={a} size={26} style={{marginLeft:i?'-8px':0,border:'1.5px solid #fff'}} />)}
    </span>
  );
  return (
    <Screen territory="transforme" bar={<ClubBar go={go} titre="Discussions" />}>
      <div className="rv"><ChipRow options={['Toutes','Entraide','Outils','Clients']} value={cat} onChange={setCat} /></div>
      <div style={{marginTop:'18px'}}>
        <div className="rv" style={{'--i':2}}>
          <TerritoryCard first territory="transforme" meta="Entraide · 14 réponses" title={<>Comment tu factures<br />un premier client ?</>}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              {pile(['MB','AT','NF'])}
              <span className="mm-num" style={{fontSize:'11.5px',color:'var(--card-ink-2)'}}>+9 · il y a 3 h</span>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':3}}>
          <TerritoryCard territory="forme" meta="Outils · 6 réponses" title={<>Le meilleur outil<br />gratuit pour les mots-clés</>}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              {pile(['SK','IB'])}
              <span className="mm-num" style={{fontSize:'11.5px',color:'var(--card-ink-2)'}}>+4 · il y a 6 h</span>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':4}}>
          <TerritoryCard territory="rose" meta="Clients · 21 réponses" title={<>Un client ne répond plus<br />après le devis</>}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              {pile(['AD','FT','MB'])}
              <span className="mm-num" style={{fontSize:'11.5px',color:'var(--card-ink-2)'}}>+15 · hier</span>
            </div>
          </TerritoryCard>
        </div>
      </div>
      <p className="rv" style={{'--i':5,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'16px'}}>Chaque publication est classée par catégorie. Le décompte affiché dérive des listes stockées : ce n'est pas un compteur libre.</p>
      <Fab icon={<Icon name="send" size={20} color="#fff" strokeWidth={2.6} />} />
    </Screen>
  );
}

/* ── 4 · AGENDA ── */
function ClubAgenda({go}){
  const [vue,setVue] = React.useState('À venir');
  return (
    <Screen territory="transforme" bar={<ClubBar go={go} titre="Agenda" />}>
      <div className="rv"><Segmented options={['À venir','Mes inscriptions','Passées']} value={vue} onChange={setVue} /></div>
      <Eyebrow style={{'--i':2,marginTop:'20px'}}>Jeudi 10 septembre</Eyebrow>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':3,marginTop:'10px'}}>
        <div style={{display:'flex',gap:'13px'}}>
          <span style={{width:'44px',height:'44px',borderRadius:'14px',background:'var(--action-transforme)',display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="chat" size={20} color="#fff" /></span>
          <div style={{flex:1}}>
            <p style={{fontSize:'15px',fontWeight:700,margin:0}}>Ta fiche Google, en direct</p>
            <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'3px 0 0'}}>20:00 → 21:00 · en ligne</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
          <Tag tone="ok">Tu es inscrite</Tag>
          <Button tone="quiet" size="sm">Me désinscrire</Button>
        </div>
      </GlassPanel>
      <Eyebrow style={{'--i':4,marginTop:'22px'}}>Samedi 20 septembre</Eyebrow>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':5,marginTop:'10px'}}>
        <div style={{display:'flex',gap:'13px'}}>
          <span style={{width:'44px',height:'44px',borderRadius:'14px',background:'var(--action-digitalise)',display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="users" size={20} color="#fff" /></span>
          <div style={{flex:1}}>
            <p style={{fontSize:'15px',fontWeight:700,margin:0}}>Atelier fiche produit</p>
            <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-muted)',margin:'3px 0 0'}}>10:00 → 13:00 · Dakar, Point E</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
          <span className="mm-num" style={{fontSize:'12.5px',color:'var(--mm-teal-t)'}}>4 / 12 places</span>
          <Button tone="digitalise" size="sm">Je réserve</Button>
        </div>
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'18px'}}>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Te réinscrire ne crée pas de doublon, et personne ne peut t'inscrire à ta place.</p>
      </GlassPanel>
    </Screen>
  );
}

/* ── 5 · MEMBRES ── */
function ClubMembre({go}){
  return (
    <Screen territory="transforme" bar={<ClubBar go={go} titre="Membre" />}>
      <div className="rv" style={{display:'flex',gap:'14px',alignItems:'center',marginTop:'6px'}}>
        <Avatar initials="SK" size={64} />
        <div style={{flex:1}}>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'23px',letterSpacing:'-.035em',lineHeight:1,margin:0}}>Seynabou K.</p>
          <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'4px 0 0'}}>Coiffeuse · Ouakam, Dakar</p>
        </div>
      </div>
      <div className="rv" style={{'--i':2,display:'flex',gap:'6px',flexWrap:'wrap',marginTop:'14px'}}>
        <Tag>Membre depuis février</Tag><Tag tone="ok">Niveau 6</Tag><Tag>Entraide</Tag>
      </div>
      <Button tone="transforme" className="rv" style={{'--i':3,marginTop:'16px'}}>Lui écrire</Button>
      <Eyebrow style={{'--i':4,marginTop:'24px'}}>Ses publications</Eyebrow>
      <GlassPanel level="flat" padding="6px 18px" className="rv" style={{'--i':5,marginTop:'10px'}}>
        <LessonRow state="plain" icon={<Icon name="comment" size={14} />} title="J'ai refait ma fiche Google en suivant le module 2." meta="il y a 2 h · 12 j'aime" trailing={<Icon name="forward" size={16} color="#98A1AE" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="comment" size={14} />} title="Ma liste de 20 mots, si ça sert à quelqu'un." meta="hier · 8 j'aime" trailing={<Icon name="forward" size={16} color="#98A1AE" strokeWidth={2.4} />} />
        <LessonRow state="plain" icon={<Icon name="users" size={14} />} title="Présente à l'atelier fiche produit" meta="20/09 · Dakar" last />
      </GlassPanel>
      <GlassPanel level="flat" padding={18} className="rv" style={{'--i':6,marginTop:'18px',borderColor:'rgba(180,35,31,.3)'}}>
        <div style={{display:'flex',gap:'11px'}}>
          <span style={{width:'32px',height:'32px',borderRadius:'11px',background:'rgba(180,35,31,.12)',display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="alert" size={16} color="#B4231F" /></span>
          <div>
            <p style={{fontSize:'14px',fontWeight:700,color:'var(--stop)',margin:0}}>Signaler ce membre</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'4px 0 0'}}>Le signalement part à l'administration seule. La personne signalée ne le voit pas et ne peut pas l'annuler.</p>
          </div>
        </div>
      </GlassPanel>
    </Screen>
  );
}

/* ── 6 · CLASSEMENT ── */
function ClubClassement({go}){
  const [vue,setVue] = React.useState('Ma cohorte');
  return (
    <Screen territory="transforme" bar={<ClubBar go={go} titre="Classement" />}>
      <div className="rv"><ChipRow options={['Ma cohorte','Ma progression']} value={vue} onChange={setVue} /></div>
      <div className="rv-s" style={{'--i':2,marginTop:'16px',padding:'24px',borderRadius:'var(--r-xl)',
        background:'linear-gradient(135deg,#6C23DD,#0057BC 70%,#02AC9C)',color:'#fff',
        boxShadow:'0 16px 40px rgba(108,35,221,.35)',border:'1px solid rgba(255,255,255,.22)'}}>
        <p style={{fontFamily:'var(--f-mono)',fontSize:'10.5px',letterSpacing:'.14em',textTransform:'uppercase',color:'rgba(255,255,255,.72)',margin:0}}>Arrivés en février · 9 membres</p>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'28px',letterSpacing:'-.035em',lineHeight:1.04,margin:'7px 0 0'}}>Tu es 4<sup style={{fontSize:'15px'}}>e</sup> de ta vague</p>
        <p style={{fontSize:'13px',color:'rgba(255,255,255,.84)',margin:'9px 0 0'}}>Comparé aux gens arrivés en même temps que toi. Pas à ceux qui ont deux ans d'avance.</p>
      </div>
      <Eyebrow style={{'--i':3,marginTop:'22px'}}>Ta vague</Eyebrow>
      <GlassPanel level="flat" padding="4px 18px" className="rv" style={{'--i':4,marginTop:'10px'}}>
        {[['1','SK','Seynabou K.','niveau 6','2 410',null],
          ['2','AT','Amadou T.','niveau 5','2 080','linear-gradient(135deg,#F38B0A,#B4231F)'],
          ['3','NF','Ndèye F.','niveau 5','1 940','linear-gradient(135deg,#02AC9C,#0057BC)']].map(([r,ini,nom,niv,pts,bg])=>(
          <LessonRow key={r} state="plain" title={nom} meta={niv} last={false}
            icon={<span style={{display:'flex',alignItems:'center',gap:'8px'}}><span className="mm-num" style={{width:'14px',color:'var(--text-faint)',fontSize:'13px'}}>{r}</span></span>}
            iconBackground="transparent"
            trailing={<span style={{display:'flex',alignItems:'center',gap:'10px'}}><Avatar initials={ini} size={30} background={bg||undefined} /><b className="mm-num" style={{fontSize:'13px'}}>{pts}</b></span>} />
        ))}
        <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'13px 18px',margin:'0 -18px',borderRadius:'14px',
          background:'linear-gradient(135deg,rgba(108,35,221,.12),rgba(0,87,188,.1))'}}>
          <span className="mm-num" style={{width:'14px',fontSize:'13px'}}>4</span>
          <span style={{flex:1}}>
            <b style={{display:'block',fontSize:'14px',fontWeight:600}}>Toi</b>
            <span className="mm-num" style={{fontSize:'12px',color:'var(--text-faint)'}}>niveau 4 · +180 cette semaine</span>
          </span>
          <Avatar initials="A" size={30} background="linear-gradient(135deg,#6C23DD,#F38B0A)" />
          <b className="mm-num" style={{fontSize:'13px'}}>1 705</b>
        </div>
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi ce n'est pas un classement général</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Un classement absolu flatte les premiers et fait décrocher les derniers. Celui-ci te compare à ta vague d'arrivée, et l'onglet « Ma progression » ne te compare qu'à toi-même.</p>
      </GlassPanel>
    </Screen>
  );
}

/* ── 7 · OPPORTUNITÉS ── */
function ClubOpportunites({go}){
  const [f,setF] = React.useState('Toutes');
  return (
    <Screen territory="transforme" bar={<ClubBar go={go} titre="Opportunités" />}>
      <Bilan i={0} />
      <div className="rv" style={{'--i':2,marginTop:'20px'}}><ChipRow options={['Toutes','Missions','Appels d\'offres','Recrutement']} value={f} onChange={setF} /></div>
      <div style={{marginTop:'18px'}}>
        <div className="rv" style={{'--i':3}}>
          <TerritoryCard first territory="transforme" meta="Mission · Dakar · publiée hier" title={<>Fiche Google pour<br />trois boutiques</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              <PriceBlock amount="180 000" size={21} note="Budget annoncé · forfait" />
              <Button tone="transforme" size="sm">Postuler</Button>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':4}}>
          <TerritoryCard territory="forme" meta="Appel d'offres · Abidjan · 4 j restants" title={<>Refonte d'un site<br />de restaurant</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              <PriceBlock amount="450 000" size={21} note="Budget annoncé · au projet" />
              <Button tone="quiet" size="sm">Voir</Button>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':5}}>
          <TerritoryCard territory="rose" meta="Recrutement · télétravail" title={<>Chargé·e de contenu<br />mi-temps</>}>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
              <PriceBlock amount="250 000" currency="FCFA / mois" size={21} note="Annoncé par l'employeur" />
              <Button tone="quiet" size="sm">Voir</Button>
            </div>
          </TerritoryCard>
        </div>
      </div>
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'16px'}}>Les budgets affichés sont ceux annoncés par la personne qui publie. Ils ne sont pas vérifiés par la plateforme, et c'est écrit ici plutôt que caché.</p>
    </Screen>
  );
}

/* ── 8 · PARRAINAGE ── */
function ClubParrainage({go}){
  return (
    <Screen territory="transforme" bar={<ClubBar go={go} titre="Parrainage" />}>
      <Display size="sm" lines={['FAIS-LUI','GAGNER 15 %.']} style={{marginTop:'8px'}} />
      <Lede style={{'--i':4,marginTop:'12px'}}>Ton code fait passer le Club de <b className="mm-num" style={{color:'var(--ink)'}}>19 900</b> à <b className="mm-num" style={{color:'var(--ink)'}}>16 915 F</b> pour la personne que tu parraines. La remise est calculée côté serveur.</Lede>
      <GlassPanel level="hero" padding={22} className="rv" style={{'--i':5,marginTop:'18px'}}>
        <Eyebrow>Ton code</Eyebrow>
        <p className="mm-num" style={{fontSize:'31px',letterSpacing:'.1em',margin:'6px 0 0'}}>MOUSSA15</p>
        <div style={{display:'flex',gap:'8px',marginTop:'16px'}}>
          <Button tone="transforme" size="sm" style={{flex:1}}>Copier</Button>
          <Button tone="ghost" size="sm" style={{flex:1}}>Partager</Button>
        </div>
      </GlassPanel>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'12px'}}>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':6}}><Eyebrow>Partages</Eyebrow><p className="mm-num" style={{fontSize:'27px',margin:'4px 0 0'}}>7</p></GlassPanel>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':7}}><Eyebrow>Inscrits</Eyebrow><p className="mm-num" style={{fontSize:'27px',margin:'4px 0 0'}}>0</p></GlassPanel>
      </div>
      <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'18px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce que tu gagnes, toi</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Rien en argent, et je ne vais pas te faire croire le contraire. La remise va au filleul. Ce que tu gagnes, c'est quelqu'un de plus dans le Club avec qui avancer.</p>
      </GlassPanel>
    </Screen>
  );
}

/* ── PAGE PUBLIQUE · M2 — la section honnête, remontée sous le héros ──
   Sur téléphone, quelqu'un qui abandonne à mi-page doit l'avoir lue. */
function ClubGaranti({go}){
  return (
    <Screen territory="transforme" bar={<AppBar left={<BackButton onClick={()=>go&&go('club')} />} right={<Button tone="quiet" size="sm">Connexion</Button>} />}>
      <Display size="sm" lines={['Ce que je ne peux','pas encore te','garantir.']} style={{marginTop:'8px'}} />
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':4,marginTop:'20px'}}>
        <Tag tone="ok">Garanti</Tag>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:'11px 0 0'}}>Ce qui ne dépend que de moi</p>
        <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>Les sessions ont lieu même si nous sommes quatre. L'agenda est publié un mois à l'avance. Les opportunités que je trouve, je les poste. Le prix ne bouge pas pendant ton année.</p>
      </GlassPanel>
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':5,marginTop:'12px'}}>
        <Tag tone="warn">En construction</Tag>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:'11px 0 0'}}>Ce qui dépend des membres</p>
        <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>La densité du fil. La qualité de l'entraide. Le nombre de missions que <i>les autres</i> partagent. Ça, je ne peux pas te le promettre — ça se construit, et tu en fais partie.</p>
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':6,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'7px'}}>Pourquoi je te dis ça</Eyebrow>
        <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Le Club a ouvert cette année. <b style={{color:'var(--ink)'}}>Je ne t'annoncerai pas un nombre de membres, parce qu'il serait faux</b>, et parce que tu le vérifierais au premier écran après avoir payé.</p>
      </GlassPanel>
      <Eyebrow style={{'--i':7,marginTop:'26px'}}>Huit onglets, et à quoi ils servent</Eyebrow>
      <div style={{marginTop:'12px'}}>
        <div className="rv" style={{'--i':8}}><TerritoryCard first territory="transforme" title="Fil · Discussions · Membres"><p style={{fontSize:'12.5px',color:'var(--card-ink-2)',margin:'5px 0 0'}}>La question bête se pose ici. Message privé et signalement inclus.</p></TerritoryCard></div>
        <div className="rv" style={{'--i':9}}><TerritoryCard territory="forme" title="Agenda · Classement"><p style={{fontSize:'12.5px',color:'var(--card-ink-2)',margin:'5px 0 0'}}>Sessions en ligne, ateliers à Dakar. Classement par vague d'arrivée, jamais absolu.</p></TerritoryCard></div>
        <div className="rv" style={{'--i':10}}><TerritoryCard territory="rose" title="Opportunités · Infos · Parrainage"><p style={{fontSize:'12.5px',color:'var(--card-ink-2)',margin:'5px 0 0'}}>Missions et appels d'offres, avec le budget quand il est annoncé.</p></TerritoryCard></div>
      </div>
    </Screen>
  );
}

/* ── PAGE PUBLIQUE · M3 — ciblage, échéance, dernier appel ──
   Le renvoi vers les trois autres territoires est un filtre, pas une perte. */
function ClubPourQui({go}){
  return (
    <Screen territory="transforme" bar={<AppBar left={<BackButton onClick={()=>go&&go('club')} />} right={<Button tone="quiet" size="sm">Connexion</Button>} />}>
      <Display size="sm" lines={["Et si ce n'est pas",'pour toi, je te','le dis.']} style={{marginTop:'8px'}} />
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':4,marginTop:'18px'}}>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:0}}>Le Club, si…</p>
        <CheckLine tone="ok" style={{fontSize:'14px'}}>Tu vends déjà quelque chose</CheckLine>
        <CheckLine tone="ok" style={{fontSize:'14px'}}>Tu travailles seul, et c'est ça le plus dur</CheckLine>
        <CheckLine tone="ok" style={{fontSize:'14px'}}>Tu cherches des missions, pas des cours</CheckLine>
      </GlassPanel>
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':5,marginTop:'12px'}}>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:0}}>Autre chose, si…</p>
        <CheckLine tone="neutre" dash style={{fontSize:'14px'}}>Tu pars de zéro → <b style={{color:'var(--mm-bleu)'}}>Je te forme</b></CheckLine>
        <CheckLine tone="neutre" dash style={{fontSize:'14px'}}>Tu veux qu'on le fasse → <b style={{color:'var(--mm-teal-t)'}}>Je te digitalise</b></CheckLine>
        <CheckLine tone="neutre" dash style={{fontSize:'14px'}}>Tu veux juste lire → <b style={{color:'var(--mm-orange-t)'}}>Je t'informe</b>, gratuit</CheckLine>
      </GlassPanel>
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':6,marginTop:'16px'}}>
        <Eyebrow>Ce qui se passe à l'échéance</Eyebrow>
        <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>À l'échéance, ton accès s'arrête. <b style={{color:'var(--ink)'}}>Tu réabonnes si tu veux.</b> Rien n'est prélevé automatiquement — le préavis promis par les conditions générales n'est pas encore implémenté, et je ne vais pas te l'annoncer avant qu'il le soit.</p>
      </GlassPanel>
      <div className="rv-s" style={{'--i':7,marginTop:'20px',padding:'24px',borderRadius:'var(--r-xl)',
        background:'linear-gradient(140deg,#6C23DD,#0057BC 72%,#02AC9C)',color:'#fff',boxShadow:'0 16px 40px rgba(108,35,221,.34)'}}>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'24px',letterSpacing:'-.03em',lineHeight:1.08,margin:0}}>Une année.<br /><b className="mm-num" style={{fontWeight:700}}>1 658 F</b> par mois.</p>
        <p style={{fontSize:'13.5px',color:'rgba(255,255,255,.84)',margin:'9px 0 0'}}>Le Club ne se visite pas — c'est la contrepartie de le garder fermé. L'étage du dessous, lui, est gratuit : un épisode, deux vidéos, 46 articles.</p>
        <Button style={{marginTop:'16px',background:'#fff',color:'var(--ink)'}}>Je rejoins le Club</Button>
      </div>
    </Screen>
  );
}

const MM_EXPORT = {ClubGaranti,ClubPourQui,Bilan,ClubFil,ClubDiscussions,ClubAgenda,ClubMembre,ClubClassement,ClubOpportunites,ClubParrainage};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensClub.js');
