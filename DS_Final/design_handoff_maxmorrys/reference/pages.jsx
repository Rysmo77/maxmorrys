const { GlassPanel, TerritoryCard, Button, Tag, PriceBlock, LessonRow, CheckLine, MediaCard, SubNav, Segmented, Icon } = window.DS;

/* ── /club-des-digitos — la page publique du Club.
   Elle sépare ce qui est garanti par une personne de ce qui dépend des membres,
   et ne vend que le premier. Aucun nombre de membres, aucune rareté fabriquée. ── */
function Transforme({go}){
  return (
    <Page territory="transforme" go={go}>
      <div className="rv"><SubNav active="Le Club des Digitos" onSelect={(l)=>{ if (l !== 'Le Club des Digitos') go('media'); }}
        items={[{label:'Écouter & regarder'},{label:'Le Club des Digitos',color:'#6C23DD'}]} /></div>
      <div style={{display:'grid',gridTemplateColumns:'1.08fr .92fr',gap:'48px',alignItems:'center',marginTop:'26px'}}>
        <div>
          <SiteEyebrow>Je te transforme · payant, fermé</SiteEyebrow>
          <SiteDisplay size={58} lines={['LE CLUB DES','DIGITOS.']} />
          <p className="rv" style={{'--i':4,fontSize:'17px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'44ch',marginTop:'18px'}}>Une année avec moi, et avec ceux qui font la même chose que toi. Des sessions en direct, des missions qui circulent, et quelqu'un à qui poser la question que tu ne poses à personne.</p>
          <div className="rv" style={{'--i':5,display:'flex',gap:'12px',marginTop:'26px',alignItems:'center'}}>
            <Button tone="transforme" fullWidth={false}>Je rejoins le Club</Button>
            <span style={{fontSize:'13.5px',color:'var(--text-muted)'}}><b className="mm-num" style={{color:'var(--ink)',fontSize:'16px'}}>1 658 F</b> / mois<br />facturé <b className="mm-num">19 900 F</b> une fois par an</span>
          </div>
          <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'14px'}}>Parrainé ? Ton code te fait <b className="mm-num">16 915 F</b>.</p>
        </div>
        {/* Faux verre : le flou est réservé à la barre haute et à l'UNIQUE héros de la page,
            qui est ici la carte de prix, plus bas. */}
        <GlassPanel level="flat" padding={26} className="rv" style={{'--i':6}}>
          <SiteEyebrow style={{margin:0}}>Ce que tu paies, précisément</SiteEyebrow>
          <div style={{marginTop:'12px'}}>
            <CheckLine><b className="mm-num">2</b> sessions en direct par mois, avec moi</CheckLine>
            <CheckLine>Les missions et appels d'offres que je sors de mon carnet</CheckLine>
            <CheckLine>Les ateliers en présentiel à Dakar, places réservées aux membres</CheckLine>
            <CheckLine>Une réponse de moi dans les discussions, pas d'un modérateur</CheckLine>
            <CheckLine>Ton répétiteur à <b className="mm-num">5</b> questions par jour au lieu de <b className="mm-num">2</b></CheckLine>
          </div>
          <div style={{height:'1px',background:'rgba(14,17,22,.12)',margin:'18px 0'}} />
          <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Ces cinq lignes ne dépendent que de moi. C'est pour ça qu'elles sont ici, et pas des promesses sur l'ambiance.</p>
        </GlassPanel>
      </div>

      <div style={{marginTop:'54px'}}>
        <SiteDisplay size={34} lines={['Ce que je ne peux pas','encore te garantir.']} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginTop:'24px'}}>
          <GlassPanel level="flat" padding={24} className="rv" style={{'--i':1}}>
            <Tag tone="ok">Garanti</Tag>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'20px',letterSpacing:'-.03em',margin:'12px 0 0'}}>Ce qui ne dépend que de moi</p>
            <p style={{fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'9px 0 0'}}>Les sessions ont lieu même si nous sommes quatre. L'agenda est publié un mois à l'avance. Les opportunités que je trouve, je les poste. Le prix ne bouge pas pendant ton année.</p>
          </GlassPanel>
          <GlassPanel level="flat" padding={24} className="rv" style={{'--i':2}}>
            <Tag tone="warn">En construction</Tag>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'20px',letterSpacing:'-.03em',margin:'12px 0 0'}}>Ce qui dépend des membres</p>
            <p style={{fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'9px 0 0'}}>La densité du fil. La qualité de l'entraide. Le nombre de missions que <i>les autres</i> partagent. Ça, je ne peux pas te le promettre — ça se construit, et tu en fais partie.</p>
          </GlassPanel>
        </div>
        <GlassPanel level="truth" className="rv" style={{'--i':3,marginTop:'20px',maxWidth:'74ch'}}>
          <SiteEyebrow style={{margin:'0 0 7px'}}>Pourquoi je te dis ça au lieu de te vendre du rêve</SiteEyebrow>
          <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Le Club a ouvert cette année. <b style={{color:'var(--ink)'}}>Je ne t'annoncerai pas un nombre de membres, parce qu'il serait faux</b>, et parce que tu le vérifieras au premier écran après avoir payé. Je préfère que tu entres en sachant ce que tu achètes : une année d'accès à ce qui existe déjà, et une place dans ce qui se construit.</p>
        </GlassPanel>
      </div>

      <div style={{marginTop:'54px'}}>
        <SiteDisplay size={34} lines={['Huit onglets.','Voilà à quoi ils servent.']} />
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'14px',marginTop:'24px'}}>
          <GlassPanel level="flat" key="Fil" padding={18} className="rv" style={{'--i':0}}>
            <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'rgba(108,35,221,.14)',display:'grid',placeItems:'center'}}><Icon name="list" size={18} color="var(--mm-violet-t)" strokeWidth={2.2} /></span>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:'11px 0 0'}}>Fil</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Ce qui se passe cette semaine, et ce que ton abonnement t'a apporté depuis le début.</p>
          </GlassPanel>
          <GlassPanel level="flat" key="Discussions" padding={18} className="rv" style={{'--i':1}}>
            <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'rgba(108,35,221,.14)',display:'grid',placeItems:'center'}}><Icon name="chat" size={18} color="var(--mm-violet-t)" strokeWidth={2.2} /></span>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:'11px 0 0'}}>Discussions</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Par catégorie : entraide, outils, clients. La question bête se pose ici.</p>
          </GlassPanel>
          <GlassPanel level="flat" key="Membres" padding={18} className="rv" style={{'--i':2}}>
            <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'rgba(0,87,188,.14)',display:'grid',placeItems:'center'}}><Icon name="users" size={18} color="var(--mm-bleu)" strokeWidth={2.2} /></span>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:'11px 0 0'}}>Membres</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Qui fait quoi, où. Message privé, et signalement si quelqu'un dérape.</p>
          </GlassPanel>
          <GlassPanel level="flat" key="Agenda" padding={18} className="rv" style={{'--i':3}}>
            <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'rgba(0,87,188,.14)',display:'grid',placeItems:'center'}}><Icon name="calendar" size={18} color="var(--mm-bleu)" strokeWidth={2.2} /></span>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:'11px 0 0'}}>Agenda</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Sessions en ligne et ateliers à Dakar. Inscription en un geste, sans doublon possible.</p>
          </GlassPanel>
          <GlassPanel level="flat" key="Classement" padding={18} className="rv" style={{'--i':0}}>
            <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'rgba(2,172,156,.16)',display:'grid',placeItems:'center'}}><Icon name="bars" size={18} color="var(--mm-teal-t)" strokeWidth={2.2} /></span>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:'11px 0 0'}}>Classement</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Par vague d'arrivée, jamais absolu. Tu te compares à ceux qui ont commencé quand toi.</p>
          </GlassPanel>
          <GlassPanel level="flat" key="Opportunités" padding={18} className="rv" style={{'--i':1}}>
            <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'rgba(243,139,10,.18)',display:'grid',placeItems:'center'}}><Icon name="case" size={18} color="var(--mm-orange-t)" strokeWidth={2.2} /></span>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:'11px 0 0'}}>Opportunités</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Missions, appels d'offres, recrutements. Avec le budget annoncé quand il l'est.</p>
          </GlassPanel>
          <GlassPanel level="flat" key="Informations" padding={18} className="rv" style={{'--i':2}}>
            <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'rgba(243,139,10,.18)',display:'grid',placeItems:'center'}}><Icon name="info" size={18} color="var(--mm-orange-t)" strokeWidth={2.2} /></span>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:'11px 0 0'}}>Informations</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Le digest de la semaine, écrit ici et dans tes notifications. Pas par e-mail.</p>
          </GlassPanel>
          <GlassPanel level="flat" key="Parrainage" padding={18} className="rv" style={{'--i':3}}>
            <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'rgba(255,110,127,.18)',display:'grid',placeItems:'center'}}><Icon name="plus" size={18} color="var(--stop)" strokeWidth={2.2} /></span>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:'11px 0 0'}}>Parrainage</p>
            <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:'5px 0 0'}}>Ton code fait gagner 15 % à celui que tu amènes. Toi, tu ne gagnes rien — et je te le dis.</p>
          </GlassPanel>
        </div>
      </div>

      <div style={{marginTop:'54px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',alignItems:'center'}}>
        <div>
          <SiteDisplay size={34} lines={['Un prix,','dit des deux façons.']} />
          <p className="rv" style={{'--i':4,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'44ch',marginTop:'14px'}}>Un abonnement annuel ne supprime pas l'hésitation, il la concentre sur un instant. Alors je te donne les deux chiffres tout de suite : celui que tu paies, et celui que ça représente chaque mois.</p>
          <GlassPanel level="flat" padding={22} className="rv" style={{'--i':5,marginTop:'22px',maxWidth:'46ch'}}>
            <SiteEyebrow style={{margin:0}}>Ce qui se passe à l'échéance</SiteEyebrow>
            <p style={{fontSize:'14.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'8px 0 0'}}>À l'échéance, ton accès s'arrête. <b style={{color:'var(--ink)'}}>Tu réabonnes si tu veux.</b> Rien n'est prélevé automatiquement : le préavis que promettent les conditions générales n'est pas encore implémenté, et cette page ne l'annoncera pas avant qu'il le soit.</p>
          </GlassPanel>
        </div>
        <GlassPanel level="hero" padding={30} className="rv" style={{'--i':6}}>
          <div style={{display:'flex',alignItems:'baseline',gap:'10px'}}>
            <b className="mm-num" style={{fontSize:'52px',letterSpacing:'-.045em',color:'var(--mm-violet-t)'}}>1 658</b>
            <span style={{fontSize:'16px',fontWeight:600}}>FCFA / mois</span>
          </div>
          <p style={{fontSize:'14.5px',color:'var(--text-muted)',margin:'8px 0 0'}}>Facturé <b className="mm-num" style={{color:'var(--ink)'}}>19 900 FCFA</b>, une fois, pour douze mois.</p>
          <Button tone="transforme" style={{marginTop:'20px'}}>Je rejoins le Club</Button>
          <div style={{display:'flex',gap:'8px',marginTop:'14px',flexWrap:'wrap'}}><Tag>Wave</Tag><Tag>Orange Money</Tag><Tag>Carte bancaire</Tag></div>
          <div style={{height:'1px',background:'rgba(14,17,22,.12)',margin:'20px 0'}} />
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px'}}>
            <span style={{fontSize:'13.5px',color:'var(--text-muted)'}}>Avec un code de parrainage</span>
            <b className="mm-num" style={{fontSize:'16px'}}>16 915 F</b>
          </div>
          <p style={{fontSize:'11.5px',color:'var(--text-faint)',margin:'9px 0 0'}}>La remise est calculée côté serveur : elle ne dépend pas du lien sur lequel tu as cliqué.</p>
        </GlassPanel>
      </div>

      <div style={{marginTop:'54px'}}>
        <SiteDisplay size={34} lines={["Et si ce n'est pas pour toi,",'je te le dis.']} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginTop:'24px'}}>
          <GlassPanel level="flat" padding={24} className="rv" style={{'--i':1}}>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:0}}>Le Club, si…</p>
            <CheckLine tone="ok">Tu vends déjà quelque chose, et tu veux le vendre mieux</CheckLine>
            <CheckLine tone="ok">Tu travailles seul, et c'est ça le plus dur</CheckLine>
            <CheckLine tone="ok">Tu cherches des missions, pas des cours</CheckLine>
          </GlassPanel>
          <GlassPanel level="flat" padding={24} className="rv" style={{'--i':2}}>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:0}}>Autre chose, si…</p>
            <CheckLine tone="neutre" dash>Tu pars de zéro et tu veux apprendre une compétence → <b style={{color:'var(--mm-bleu)'}}>Je te forme</b></CheckLine>
            <CheckLine tone="neutre" dash>Tu veux qu'on le fasse à ta place → <b style={{color:'var(--mm-teal-t)'}}>Je te digitalise</b></CheckLine>
            <CheckLine tone="neutre" dash>Tu veux juste lire et te tenir au courant → <b style={{color:'var(--mm-orange-t)'}}>Je t'informe</b>, c'est gratuit</CheckLine>
          </GlassPanel>
        </div>
      </div>

      <div style={{marginTop:'54px'}}>
        <SiteDisplay size={34} lines={['Les questions','qu\'on me pose']} />
        <GlassPanel level="flat" padding="8px 26px" className="rv" style={{'--i':4,marginTop:'22px'}}>
          <div key="0" style={{padding:'16px 0',borderTop:0}}>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:0}}>Je peux payer en plusieurs fois ?</p>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'6px 0 0'}}>Non, pas sur le Club — il est annuel et ne se fractionne pas. Le fractionné existe sur les formations, en trois ou quatre échéances selon le montant.</p>
          </div>
          <div key="1" style={{padding:'16px 0',borderTop:'1px solid var(--border-hair)'}}>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:0}}>Et si je n'y vais jamais ?</p>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'6px 0 0'}}>Tu auras payé pour rien, et je ne peux pas t'en empêcher. C'est pour ça que le récapitulatif de ce que ton abonnement t'a apporté est visible en permanence dans le fil, et pas seulement à l'échéance.</p>
          </div>
          <div key="2" style={{padding:'16px 0',borderTop:'1px solid var(--border-hair)'}}>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:0}}>Je suis remboursé si je change d'avis ?</p>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'6px 0 0'}}>Les 14 jours de rétractation s'appliquent aux formations. Pour le Club, l'accès est immédiat et complet dès l'inscription : écris-moi avant de payer si tu hésites, je préfère une conversation à un remboursement.</p>
          </div>
          <div key="3" style={{padding:'16px 0',borderTop:'1px solid var(--border-hair)'}}>
            <p style={{fontWeight:700,fontSize:'14.5px',margin:0}}>Le Club, c'est un groupe WhatsApp de plus ?</p>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'6px 0 0'}}>Non — et c'est justement pour ça qu'il est payant. Un groupe gratuit se remplit de gens qui passent. Ici, l'agenda, les inscriptions, les opportunités et les discussions sont structurés, et personne n'entre par hasard.</p>
          </div>
        </GlassPanel>
      </div>

      <div style={{marginTop:'54px'}}>
        <SiteDisplay size={34} lines={['Avant de payer,','écoute-les.']} />
        <p className="rv" style={{'--i':4,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'62ch',marginTop:'14px'}}>Le podcast et les vidéos sont sur ce même territoire, à l'étage du dessous : <b style={{color:'var(--ink)'}}>gratuits, sans compte</b>. Des gens d'ici racontent ce qu'ils ont fait. Le Club, c'est quand tu veux leur parler au lieu de les écouter.</p>
        <div style={{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:'16px',marginTop:'24px',alignItems:'center'}}>
          <div className="rv" style={{'--i':5}}>
            <MediaCard format="audio" artHeight={150} titleSize={21}
              eyebrow="Podcast · épisode 1 · gratuit"
              title="Vendre sans budget pub, avec Fatou D."
              cost={['34:20','31 Mo','Transcription · 0 Mo']}
              actions={<Button tone="quiet" size="sm" onClick={()=>go&&go('media')}>Écouter d'abord</Button>} />
          </div>
          <GlassPanel level="truth" className="rv" style={{'--i':6}}>
            <SiteEyebrow style={{margin:'0 0 7px'}}>Ce que le gratuit ne donne pas</SiteEyebrow>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Écouter est gratuit et le restera. Ce que l'abonnement ajoute est ailleurs : les sessions en direct, les missions qui circulent, et une réponse de moi. <b style={{color:'var(--ink)'}}>Le Club, lui, ne se visite pas</b> — c'est la contrepartie de le garder fermé.</p>
          </GlassPanel>
        </div>
      </div>

      <div className="rv" style={{'--i':5,marginTop:'54px',padding:'34px',borderRadius:'var(--r-xl)',background:'#0A0D11',color:'#fff',
        display:'grid',gridTemplateColumns:'1.2fr .8fr',gap:'40px',alignItems:'center'}}>
        <div>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'34px',letterSpacing:'-.03em',lineHeight:1.05,margin:0}}>Une année. <b className="mm-num" style={{fontWeight:700}}>1 658 F</b> par mois.<br />Et quelqu'un au bout du fil.</p>
          <p style={{fontSize:'14px',color:'#A7B2BF',margin:'12px 0 0',maxWidth:'48ch'}}>Si tu veux juger avant de payer, écoute l'épisode et regarde les deux vidéos : c'est gratuit, sans compte, et c'est le même territoire. Le blog aussi, avec ses 46 articles.</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <Button style={{background:'linear-gradient(135deg,#B98CFF,#6FB1FF)',color:'#0B0E13'}}>Je rejoins le Club</Button>
          <Button style={{background:'rgba(255,255,255,.1)',color:'#fff',border:'1px solid rgba(255,255,255,.2)'}} onClick={()=>go&&go('apropos')}>Écris-moi d'abord</Button>
        </div>
      </div>
    </Page>
  );
}


/* ── /podcast-et-videos — le pôle média, rangé sous « Je te transforme ».
   Le blog instruit, le podcast transforme : on n'y vient pas pour une méthode,
   on y vient pour une voix. Et ça produit une échelle vers le Club.
   Trois garde-fous contre l'ambiguïté gratuit / payant : la sous-navigation en tête,
   le mot « gratuit » dans le premier écran, et le Club en bas — jamais devant. ── */
function SiteMedia({go}){
  return (
    <Page territory="transforme" go={go}>
      <div className="rv"><SubNav active="Écouter & regarder" onSelect={(l)=>{ if (l !== 'Écouter & regarder') go('transforme'); }}
        items={[{label:'Écouter & regarder'},{label:'Le Club des Digitos',color:'#6C23DD'}]} /></div>

      <div style={{display:'grid',gridTemplateColumns:'.92fr 1.08fr',gap:'44px',alignItems:'center',marginTop:'26px'}}>
        <div>
          <SiteEyebrow>Je te transforme · gratuit</SiteEyebrow>
          <SiteDisplay size={52} lines={["DES GENS D'ICI",'QUI RACONTENT',"CE QU'ILS ONT FAIT."]} />
          <p className="rv" style={{'--i':5,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'42ch',marginTop:'16px'}}>Pas de méthode, pas de tutoriel — ça, c'est le blog. Ici, des gens qui vendent vraiment quelque chose à Dakar et à Abidjan racontent ce qui a marché, et ce qui leur a coûté cher.</p>
          <div className="rv" style={{'--i':6,display:'flex',gap:'8px',flexWrap:'wrap',marginTop:'20px'}}>
            <Tag tone="ok">Écoute gratuite, sans compte</Tag>
            <Tag>Transcription lisible sans audio</Tag>
          </div>
          <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'16px'}}>Un épisode par mois, quand j'ai quelqu'un qui vaut la peine d'être écouté. Pas de calendrier tenu à vide.</p>
        </div>
        <div className="rv" style={{'--i':6}}>
          <MediaCard format="audio" artHeight={190} titleSize={25}
            eyebrow="Podcast · épisode 1 · 6 août"
            title="Vendre sans budget pub, avec Fatou D."
            body="Gérante d'une boutique de cosmétiques aux Almadies. Elle a arrêté la publicité payante pendant trois mois pour voir. Le chiffre n'a pas bougé."
            cost={['34:20','31 Mo','Transcription · 0 Mo']}
            actions={<><Button tone="transforme" size="sm">Écouter</Button><Button tone="quiet" size="sm">Lire la transcription</Button></>} />
        </div>
      </div>

      <div style={{marginTop:'54px'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'20px'}}>
          <SiteDisplay size={34} lines={["Tout ce qu'il y a,",'pour l\'instant.']} />
          <div style={{width:'320px',flex:'0 0 auto'}}><Segmented options={['Tout · 3','À écouter · 1','À regarder · 2']} /></div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginTop:'24px'}}>
          <div className="rv" style={{'--i':1}}>
            <MediaCard format="video" badge="Vidéo · 16:9" eyebrow="Vidéo · 12 juillet"
              title="Trois heures avec un commerçant du marché Sandaga"
              body="Ce qu'il vend, comment il compte, et pourquoi il n'a jamais voulu de site."
              cost={['18:04','96 Mo en HD','24 Mo en 480p']} />
          </div>
          <div className="rv" style={{'--i':2}}>
            <MediaCard format="video" badge="Vidéo · 16:9" gradient="linear-gradient(140deg,#02AC9C,#0057BC)" eyebrow="Vidéo · 28 juin"
              title="J'ouvre ma fiche Google devant vous"
              body="Une fiche réelle, corrigée en direct, avec les erreurs laissées à l'écran."
              cost={['11:32','61 Mo en HD','15 Mo en 480p']} />
          </div>
        </div>
        <GlassPanel level="truth" className="rv" style={{'--i':3,marginTop:'22px',maxWidth:'74ch'}}>
          <SiteEyebrow style={{margin:'0 0 7px'}}>Pourquoi il n'y a que trois éléments</SiteEyebrow>
          <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Un épisode et deux vidéos. C'est tout, et je préfère te le montrer comme ça plutôt que de remplir une grille. <b style={{color:'var(--ink)'}}>Le blog, lui, en a 46</b> — si tu cherches de la matière tout de suite, c'est par là.</p>
        </GlassPanel>
      </div>

      <div style={{marginTop:'54px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:'34px',alignItems:'center'}}>
        <div>
          <SiteDisplay size={34} lines={['Écoute où tu veux.']} />
          <p className="rv" style={{'--i':3,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'42ch',marginTop:'12px'}}>Les épisodes sont aussi sur Spotify et les vidéos sur YouTube. Si tu y es déjà abonné, garde tes habitudes — je ne t'obligerai pas à revenir ici pour écouter.</p>
          <p className="rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',marginTop:'12px',maxWidth:'46ch'}}>Les compteurs d'écoute sont synchronisés côté serveur, pas appelés depuis ton navigateur. Ils ne sont pas affichés ici : à un épisode, un compteur ne dit rien d'utile.</p>
        </div>
        <GlassPanel level="flat" padding="6px 22px" className="rv" style={{'--i':5}}>
          <LessonRow state="plain" icon={<Icon name="chat" size={16} color="#fff" />} iconBackground="#1DB954" title="Spotify" trailing={<Button tone="quiet" size="sm">Suivre</Button>} />
          <LessonRow state="plain" icon={<Icon name="play" size={16} color="#fff" />} iconBackground="#FF0000" title="YouTube" trailing={<Button tone="quiet" size="sm">S'abonner</Button>} />
          <LessonRow state="plain" icon={<Icon name="doc" size={16} />} title="Flux RSS" trailing={<Button tone="quiet" size="sm">Copier</Button>} last />
        </GlassPanel>
      </div>

      <div className="rv" style={{'--i':6,marginTop:'54px',padding:'34px',borderRadius:'var(--r-xl)',
        background:'linear-gradient(140deg,#6C23DD,#0057BC 72%,#02AC9C)',color:'#fff',boxShadow:'0 18px 44px rgba(108,35,221,.3)',
        display:'grid',gridTemplateColumns:'1.25fr .75fr',gap:'34px',alignItems:'center'}}>
        <div>
          <p style={{fontFamily:'var(--f-mono)',fontSize:'11px',letterSpacing:'.16em',textTransform:'uppercase',color:'rgba(255,255,255,.72)',margin:0}}>L'étage au-dessus</p>
          <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'31px',letterSpacing:'-.03em',lineHeight:1.06,margin:'8px 0 0'}}>Tu viens d'écouter quelqu'un qui l'a fait.<br />Le Club, c'est là où ils sont.</p>
          <p style={{fontSize:'14.5px',color:'rgba(255,255,255,.86)',margin:'12px 0 0',maxWidth:'52ch'}}>Le podcast est gratuit et le restera — le Club, c'est quand tu veux leur parler au lieu de les écouter.</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
          <Button style={{background:'#fff',color:'var(--ink)'}} onClick={()=>go&&go('transforme')}>Voir le Club — <span className="mm-num">1 658 F</span>/mois</Button>
          <span style={{fontSize:'12px',color:'rgba(255,255,255,.72)',textAlign:'center'}}>Facturé <b className="mm-num">19 900 F</b> une fois par an</span>
        </div>
      </div>
    </Page>
  );
}

const MM_EXPORT = {Transforme,SiteMedia};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit site : ses Accueil / Article / Media ne doivent jamais
   se substituer à ceux du kit mobile, qui portent les mêmes noms. */
window.MMSITE = Object.assign(window.MMSITE||{}, MM_EXPORT);
