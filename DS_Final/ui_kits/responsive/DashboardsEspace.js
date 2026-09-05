const { GlassPanel, TerritoryCard, Button, ChipRow, Segmented, PriceBlock, ProgressBar, LessonRow, Tag, Avatar, DocLine, CheckLine, Field, Icon, IconButton, EmptyState, Wordmark } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LES CINQ PAGES DE L'ESPACE APPRENANT QUI MANQUAIENT EN 1440 px.

   L'espace avait cinq pages desktop — espace, cours, répétiteur, Club, profil — mais pas
   celles où la personne passe réellement son temps. En particulier :

   · LE LECTEUR DE LEÇON. C'est **l'écran le plus important du produit** : celui qui est
     ouvert le soir. Il manquait en desktop, alors que c'est justement là que la largeur
     change l'usage et pas seulement l'apparence — la transcription et les notes tiennent
     à côté de la vidéo au lieu d'être derrière un onglet. En 390 px, prendre une note
     obligeait à quitter la vidéo. Ici, non.

   · MES CERTIFICATS. Zéro émis, et l'écran le dit avec sa date. Un écran vide qu'on ne
     dessine pas finit par afficher des données d'exemple le jour où il se remplit.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ══ 1 · LECTEUR DE LEÇON ══
   Trois colonnes dans la colonne de travail : vidéo et prose au centre, programme à
   droite. Le panneau `aside` de la coque porte les NOTES — écrire pendant qu'on regarde
   est le seul gain que la largeur apporte vraiment ici. */
function LecteurDesktop(){
  return (
    <AppFrame active="Mes cours" sourcil="Référencement local · module 3 · leçon 5"
      titre="Les mots que tapent tes clients"
      aside={<React.Fragment>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'10px'}}>
          <CEyebrow>Mes notes · cette leçon</CEyebrow>
          <Tag>Toi seule les lis</Tag>
        </div>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':1,marginTop:'10px'}}>
          <Field placeholder="Écris pendant que tu regardes…" multiline style={{marginTop:0}} />
          <Button tone="forme" size="sm" style={{marginTop:'10px'}}>Enregistrer à 03:12</Button>
        </GlassPanel>
        <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':2,marginTop:'12px'}}>
          <LessonRow state="plain" icon={<Icon name="comment" size={13} />}
            title="Lister ce que la cliente dit à voix haute, pas ce que je vends."
            meta="04/09 · 21:14 · à 02:40" />
          <LessonRow state="plain" icon={<Icon name="comment" size={13} />}
            title="« cosmétique Almadies » plutôt que « cosmétique Sénégal »."
            meta="04/09 · 21:02 · à 01:18" last />
        </GlassPanel>
        <p className="rv" style={{'--i':3,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'12px'}}>
          Chaque note garde l'horodatage de la vidéo. En 390 px, prendre une note obligeait à
          quitter la lecture — c'est le seul vrai gain de la largeur sur cet écran.</p>
      </React.Fragment>}>

      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:'24px',marginTop:'22px',alignItems:'start'}}>
        <div>
          <div className="rv-s" style={{'--i':1,height:'340px',borderRadius:'var(--r-media)',position:'relative',
            background:'linear-gradient(140deg,#0057BC,#6C23DD 58%,#F38B0A)',display:'grid',placeItems:'center',
            boxShadow:'0 16px 38px rgba(0,87,188,.24)'}}>
            <span className="mm-press-sm" role="button" tabIndex={0} aria-label="Lire la leçon"
              style={{width:'70px',height:'70px',borderRadius:'50%',background:'rgba(255,255,255,.94)',
                display:'grid',placeItems:'center',cursor:'pointer'}}>
              <Icon name="play" size={24} color="#0E1116" />
            </span>
            <div style={{position:'absolute',left:'16px',right:'16px',bottom:'14px',display:'flex',
              alignItems:'center',gap:'11px',color:'#fff',fontFamily:'var(--f-mono)',fontSize:'11px'}}>
              <span>03:12</span>
              <span style={{flex:1,height:'4px',borderRadius:'2px',background:'rgba(255,255,255,.34)'}}>
                <b className="bar-fill" style={{display:'block',width:'8%',height:'100%',background:'#fff',borderRadius:'2px'}} />
              </span>
              <span>08:24</span>
              <span className="mm-press-sm" style={{padding:'3px 8px',borderRadius:'var(--r-pill)',
                background:'rgba(0,0,0,.34)',fontWeight:700,cursor:'pointer'}}>1×</span>
            </div>
          </div>

          <div className="rv" style={{'--i':3,marginTop:'16px',width:'440px'}}>
            <ChipRow height={36} options={['Transcription','Ressources','Discussion']} value="Transcription" />
          </div>

          <GlassPanel level="flat" padding="6px 20px" className="rv" style={{'--i':4,marginTop:'14px'}}>
            <LessonRow state="plain" meta="00:24" title="Ce qu'une cliente tape n'est presque jamais ce que tu vends." />
            <LessonRow state="plain" meta="01:18" title="« cosmétique Almadies » convertit mieux que « cosmétique Sénégal »." />
            <LessonRow state="plain" meta="02:40" title="Écoute ce qu'on te dit en entrant : c'est ta liste de mots." />
            <LessonRow state="plain" meta="04:55" title="Garde les vingt qui reviennent, jette le reste." />
            <LessonRow state="plain" meta="06:30" title="Où les écrire dans ta fiche, et dans quel ordre." last />
          </GlassPanel>
          <p className="rv" style={{'--i':5,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'12px'}}>
            La transcription se lit sans charger la vidéo — <b className="mm-num" style={{color:'var(--text-muted)'}}>0 Mo</b> contre 9.
            Utile si ton forfait est compté.</p>
        </div>

        <div>
          <div className="rv" style={{'--i':2,display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:'10px'}}>
            <CEyebrow>Le programme</CEyebrow>
            <span className="mm-num" style={{fontSize:'12.5px',color:'var(--text-muted)'}}>34 %</span>
          </div>
          <ProgressBar value={34} className="rv" style={{'--i':2,marginTop:'8px'}} />
          <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':3,marginTop:'14px'}}>
            <LessonRow state="done" title="Choisir tes mots-clés" meta="06:12" />
            <LessonRow state="done" title="Ce que cherche un client à Dakar" meta="07:48" />
            <LessonRow state="current" icon={<Icon name="play" size={12} color="#fff" />}
              iconBackground="linear-gradient(135deg,#0057BC,#6C23DD)"
              title="Les mots que tapent tes clients" meta="08:24 · en cours" />
            <LessonRow state="todo" title="Écrire une fiche qui remonte" meta="07:03" />
            <LessonRow state="todo" icon={<Icon name="doc" size={12} />} title="Exercice : ta liste de 20 mots" meta="PDF · 180 Ko" last />
          </GlassPanel>
          <Button tone="quiet" fullWidth className="rv" style={{'--i':4,marginTop:'12px'}}>
            <Icon name="download" size={16} strokeWidth={2.2} /> Télécharger le module</Button>
        </div>
      </div>
    </AppFrame>
  );
}

/* ══ 2 · MES NOTES ══
   Toutes les notes, toutes leçons confondues. Deux colonnes : la liste, et la note
   ouverte avec le lien vers son instant de vidéo. */
function NotesDesktop(){
  const notes = [
    ['Lister ce que la cliente dit à voix haute, pas ce que je vends.','04/09 · 21:14','Leçon 5',true],
    ['« cosmétique Almadies » plutôt que « cosmétique Sénégal ».','04/09 · 21:02','Leçon 5',false],
    ['Vérifier les horaires de la fiche Google avant le week-end.','28/08 · 08:47','Leçon 4',false],
    ['Garder les 20 mots qui reviennent, jeter le reste.','27/08 · 22:31','Leçon 4',false],
    ['Photos de la boutique : refaire celles de la vitrine.','21/08 · 19:05','Leçon 2',false],
    ['Demander à trois clientes ce qu\'elles ont tapé pour me trouver.','19/08 · 07:12','Leçon 2',false]
  ];
  return (
    <AppFrame active="Mes cours" sourcil="14 notes · 6 leçons · depuis le 12 août" titre="Mes notes"
      aside={<React.Fragment>
        <CEyebrow>Par leçon</CEyebrow>
        <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':1,marginTop:'10px'}}>
          <LessonRow state="plain" title="Leçon 5 · Les mots que tapent…" meta="6 notes" />
          <LessonRow state="plain" title="Leçon 4 · Ce que cherche un client" meta="4 notes" />
          <LessonRow state="plain" title="Leçon 2 · Ta fiche, pas à pas" meta="3 notes" />
          <LessonRow state="plain" title="Leçon 1 · Pourquoi tu es invisible" meta="1 note" last />
        </GlassPanel>
        <GlassPanel level="truth" className="rv" style={{'--i':2,marginTop:'16px'}}>
          <CEyebrow style={{marginBottom:'6px'}}>Ce qu'elles deviennent</CEyebrow>
          <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Elles survivent à la fin du cours et te suivent d'un appareil à l'autre. Écrire une note rapporte de l'expérience ; la rééditer n'en rapporte pas.</p>
        </GlassPanel>
      </React.Fragment>}>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',marginTop:'22px',alignItems:'start'}}>
        <div>
          <div className="rv" style={{'--i':1,display:'flex',gap:'10px',alignItems:'center'}}>
            <div style={{flex:1}}>
              <Field placeholder="Chercher dans mes notes" style={{marginTop:0}}
                trailing={<Icon name="search" size={17} color="#5A6472" strokeWidth={2.2} />} />
            </div>
            <Button tone="forme" size="sm" fullWidth={false}>
              <Icon name="plus" size={16} strokeWidth={2.6} /> Nouvelle</Button>
          </div>
          <GlassPanel level="flat" padding="4px 18px" className="rv" style={{'--i':2,marginTop:'14px'}}>
            {notes.map(([t,d,l,on],i)=>(
              <LessonRow key={t} state="plain" title={t} meta={d+' · '+l} last={i===notes.length-1}
                icon={<Icon name="comment" size={13} color={on?'#5A17BE':undefined} />}
                iconBackground={on?'rgba(108,35,221,.12)':undefined}
                trailing={<Icon name="forward" size={15} color="var(--text-faint)" strokeWidth={2.4} />} />
            ))}
          </GlassPanel>
        </div>

        <GlassPanel level="hero" padding={24} className="rv" style={{'--i':2}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
            <CEyebrow>Leçon 5 · à 02:40</CEyebrow>
            <span style={{display:'flex',gap:'6px'}}>
              <IconButton label="Modifier cette note"><Icon name="doc" size={15} strokeWidth={2.2} /></IconButton>
              <IconButton label="Supprimer cette note"><Icon name="trash" size={15} color="#B4231F" strokeWidth={2.2} /></IconButton>
            </span>
          </div>
          <p style={{fontSize:'17px',lineHeight:1.6,margin:'14px 0 0',maxWidth:'var(--measure-prose)'}}>
            Lister ce que la cliente dit à voix haute, pas ce que je vends.</p>
          <p className="mm-num" style={{fontSize:'11.5px',color:'var(--text-faint)',margin:'14px 0 0'}}>Écrite le 04/09/2026 à 21:14</p>
          <div style={{height:'1px',background:'var(--border-hair)',margin:'20px 0'}} />
          <CEyebrow>Le passage concerné</CEyebrow>
          <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.6,margin:'8px 0 0',
            paddingLeft:'14px',borderLeft:'2px solid var(--mm-bleu)',maxWidth:'var(--measure-prose)'}}>
            « Écoute ce qu'on te dit en entrant : c'est ta liste de mots. »</p>
          <Button tone="forme" style={{marginTop:'18px'}}>
            <Icon name="play" size={16} /> Reprendre la vidéo à 02:40</Button>
        </GlassPanel>
      </div>
    </AppFrame>
  );
}

/* ══ 3 · MES PAIEMENTS ══
   Une seule transaction, et son état réel. Ce que le web produisait mal : l'acheteur
   n'avait aucun écran d'historique et devait écrire pour savoir où en était son paiement. */
function PaiementsDesktop(){
  return (
    <AppFrame active="Mon profil" sourcil="1 transaction · depuis le 12 août" titre="Mes paiements"
      aside={<React.Fragment>
        <CEyebrow>Un paiement bloqué ?</CEyebrow>
        <GlassPanel level="flat" padding={16} className="rv" style={{'--i':1,marginTop:'10px'}}>
          <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>
            Si une transaction reste « en attente » plus d'une heure, la référence ci-contre est
            tout ce dont j'ai besoin. Écris-moi avec elle.</p>
          <Button tone="quiet" fullWidth size="sm" style={{marginTop:'12px'}}>Contacte-moi</Button>
        </GlassPanel>
        <GlassPanel level="truth" className="rv" style={{'--i':2,marginTop:'16px'}}>
          <CEyebrow style={{marginBottom:'6px'}}>Rien n'est débité deux fois</CEyebrow>
          <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Chaque paiement porte une référence unique, et le rejouer ne peut ni créer une double inscription ni débiter une seconde fois.</p>
        </GlassPanel>
      </React.Fragment>}>

      <div className="rv" style={{'--i':1,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',marginTop:'22px'}}>
        <div style={{width:'400px'}}><Segmented options={['Toutes · 1','Payées · 0','En attente · 1']} value="Toutes · 1" /></div>
        <span className="mm-num" style={{fontSize:'11.5px',color:'var(--text-faint)'}}>Relevé du 05/09/2026</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',marginTop:'18px',alignItems:'start'}}>
        <GlassPanel level="flat" padding={22} className="rv" style={{'--i':2}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'14px'}}>
            <div>
              <p className="mm-num" style={{fontSize:'15px',fontWeight:700,margin:0}}>MM-2K6-4831</p>
              <p style={{fontSize:'13.5px',color:'var(--text-muted)',margin:'5px 0 0'}}>Référencement local pour ton commerce</p>
            </div>
            <Tag tone="warn">En attente</Tag>
          </div>
          <div style={{marginTop:'18px'}}>
            <DocLine label="Montant" value="80 750 FCFA" />
            <DocLine label="Moyen" value="Wave" />
            <DocLine label="Parrainage" value="AISSA15 · −14 250 F" />
            <DocLine label="Initié le" value="12/08/2026 · 14:22" />
            <DocLine label="Confirmé le" value="—" last />
          </div>
          <div style={{display:'flex',gap:'9px',marginTop:'18px'}}>
            <Button tone="quiet" size="sm" style={{flex:1}}>Vérifier l'état</Button>
            <Button tone="quiet" size="sm" style={{flex:1}}>Reprendre le paiement</Button>
          </div>
          <p style={{fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,margin:'12px 0 0'}}>
            Le tiret sur « confirmé le » n'est pas une erreur d'affichage : le prestataire n'a pas
            encore renvoyé de date.</p>
        </GlassPanel>

        <div>
          <CEyebrow>Ce que tu as payé en tout</CEyebrow>
          <GlassPanel level="flat" padding={22} className="rv" style={{'--i':3,marginTop:'10px'}}>
            <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:'12px'}}>
              <span style={{fontSize:'13.5px',color:'var(--text-muted)'}}>Encaissé et confirmé</span>
              <b className="mm-num" style={{fontSize:'25px'}}>0 F</b>
            </div>
            <div style={{height:'1px',background:'var(--border-hair)',margin:'16px 0'}} />
            <div style={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:'12px'}}>
              <span style={{fontSize:'13.5px',color:'var(--text-muted)'}}>En attente de confirmation</span>
              <b className="mm-num" style={{fontSize:'17px',color:'var(--warn)'}}>80 750 F</b>
            </div>
            <p style={{fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,margin:'14px 0 0'}}>
              Un zéro daté est une information : au 5 septembre, rien n'a encore été confirmé par le
              prestataire. Le montant en attente n'est pas compté comme payé.</p>
          </GlassPanel>

          <CEyebrow style={{marginTop:'24px'}}>Tes moyens de paiement</CEyebrow>
          <GlassPanel level="flat" padding="4px 16px" className="rv" style={{'--i':4,marginTop:'10px'}}>
            <LessonRow state="plain" title="Wave" meta="utilisé le 12/08"
              icon={<span style={{width:'32px',height:'32px',borderRadius:'10px',
                background:'linear-gradient(135deg,#3FD8FF,#009FE3)',display:'grid',placeItems:'center',
                fontFamily:'var(--f-display)',fontWeight:900,fontSize:'13px',color:'#fff'}}>W</span>}
              iconBackground="transparent" />
            <LessonRow state="plain" title="Orange Money" meta="jamais utilisé"
              icon={<span style={{width:'32px',height:'32px',borderRadius:'10px',
                background:'linear-gradient(135deg,#FFA030,#FF5A00)',display:'grid',placeItems:'center',
                fontFamily:'var(--f-display)',fontWeight:900,fontSize:'11px',color:'#fff'}}>OM</span>}
              iconBackground="transparent" last />
          </GlassPanel>
          <p className="rv" style={{'--i':5,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'12px'}}>
            Aucun numéro n'est conservé ici : chaque paiement repasse par l'application du
            prestataire, et la plateforme n'en garde que la référence.</p>
        </div>
      </div>
    </AppFrame>
  );
}

/* ══ 4 · MES CERTIFICATS ══
   Zéro émis, daté. Le panneau explique comment la vérification marche — c'est ce qui
   donne sa valeur au certificat, et c'est utile à lire AVANT d'en avoir un. */
function CertificatsDesktop(){
  return (
    <AppFrame active="Mon profil" sourcil="0 émis · depuis le 12 août 2026" titre="Mes certificats"
      aside={<React.Fragment>
        <CEyebrow>Comment la vérification marche</CEyebrow>
        <GlassPanel level="flat" padding={18} className="rv" style={{'--i':1,marginTop:'10px'}}>
          <CheckLine tone="ok" style={{marginTop:0,fontSize:'13.5px'}}>Le code se vérifie <b>sans compte</b></CheckLine>
          <CheckLine tone="ok" style={{fontSize:'13.5px'}}>Les leçons sont recomptées côté serveur à l'émission</CheckLine>
          <CheckLine tone="ok" style={{fontSize:'13.5px'}}>Le certificat reste valable si tu supprimes ton compte</CheckLine>
          <CheckLine tone="neutre" dash style={{fontSize:'13.5px'}}>La page publique ne liste rien et ne remonte à aucun profil</CheckLine>
        </GlassPanel>
        <p className="rv" style={{'--i':2,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'12px'}}>
          C'est ce qui fait la différence entre un certificat et une image : ton futur employeur
          contrôle lui-même, sans te demander quoi que ce soit.</p>
      </React.Fragment>}>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'24px',marginTop:'22px',alignItems:'start'}}>
        <GlassPanel level="flat" padding={6} className="rv" style={{'--i':1}}>
          <EmptyState
            glyph={<Icon name="doc" size={26} color="#5A17BE" />}
            glyphBackground="linear-gradient(135deg,#DFD0FF,#C7E1FF)"
            title="Aucun certificat pour l'instant."
            body="Le premier arrive à la fin d'une formation. Il te reste 31 leçons sur 47 pour le référencement local."
            action={<Button tone="forme">Reprendre la leçon 5</Button>} />
          <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',lineHeight:1.55,
            margin:'0 0 16px',padding:'0 20px'}}>
            <b className="mm-num" style={{color:'var(--text-muted)'}}>0</b> émis depuis l'ouverture de ton compte,
            le 12 août 2026. Un zéro daté est une information ; un tiret n'en est pas une.</p>
        </GlassPanel>

        <div>
          <CEyebrow>À quoi il ressemblera</CEyebrow>
          {/* Aperçu grisé : montrer l'objet avant de l'avoir vaut mieux qu'une case vide. */}
          <GlassPanel level="flat" padding={22} className="rv" style={{'--i':2,marginTop:'10px',opacity:.62}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
              <Wordmark brand="signature" size={26} short />
              <Tag>Aperçu</Tag>
            </div>
            <CEyebrow style={{marginTop:'18px'}}>Certificat de fin de formation</CEyebrow>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.035em',
              lineHeight:1.05,margin:'6px 0 0'}}>Référencement local pour ton commerce</p>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',margin:'11px 0 0'}}>Délivré à <b style={{color:'var(--ink)'}}>Aïssatou Ndiaye</b></p>
            <p className="mm-num" style={{fontSize:'16px',fontWeight:700,letterSpacing:'.07em',margin:'14px 0 0',
              color:'var(--text-faint)'}}>MM-••••-••••-••••</p>
            <div style={{height:'1px',background:'var(--border-hair)',margin:'18px 0'}} />
            <DocLine label="Leçons validées" value="16 / 47" />
            <DocLine label="Émis le" value="—" last />
          </GlassPanel>
          <p className="rv" style={{'--i':3,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.55,marginTop:'12px'}}>
            Le code n'existe pas encore : il est généré à l'émission, avec le recompte des leçons.
            Cet aperçu montre l'objet, il ne le promet pas.</p>
        </div>
      </div>
    </AppFrame>
  );
}

/* ══ 5 · FICHE FORMATION ══
   Depuis l'espace, la formation qu'on n'a pas encore achetée. Carte de prix collante à
   droite : le prix reste à l'écran pendant qu'on lit les 47 leçons. */
function FicheDesktop(){
  const cadenas = <Icon name="lock" size={13} color="#68727F" strokeWidth={2.4} />;
  const modules = [
    ['Pourquoi ta boutique est invisible','4 leçons · 22 min',true],
    ['Ta fiche Google, pas à pas','11 leçons · 1 h 08',false],
    ['Les mots que tapent tes clients','9 leçons · 54 min',false],
    ['Les avis, sans en acheter','8 leçons · 46 min',false],
    ['Ton quartier, tes concurrents','8 leçons · 51 min',false],
    ['Mesurer sans se mentir','7 leçons · 41 min',false]
  ];
  return (
    <AppFrame active="Mes cours" sourcil="Catalogue · SEO · débutant"
      titre="Référencement local pour ton commerce">
      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:'26px',marginTop:'22px',alignItems:'start'}}>
        <div>
          <div className="rv-s" style={{'--i':1,height:'250px',borderRadius:'var(--r-media)',
            background:'linear-gradient(140deg,#0057BC,#6C23DD 58%,#F38B0A)',display:'flex',alignItems:'flex-end',
            padding:'18px',boxShadow:'0 16px 38px rgba(0,87,188,.24)'}}>
            <Tag style={{background:'rgba(255,255,255,.9)',color:'#0E1116'}}>Aperçu · 4 min gratuit</Tag>
          </div>
          <p className="rv" style={{'--i':3,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.6,
            maxWidth:'var(--measure-prose)',marginTop:'18px'}}>
            Faire remonter ta fiche Google quand quelqu'un cherche ce que tu vends, dans ton
            quartier. Sans budget publicitaire, sans agence.</p>

          <CEyebrow style={{marginTop:'26px'}}>Le programme</CEyebrow>
          <GlassPanel level="flat" padding="6px 20px" className="rv" style={{'--i':4,marginTop:'10px'}}>
            {modules.map(([t,m,libre],i)=>(
              <LessonRow key={t} state="plain" title={t} meta={m} last={i===modules.length-1}
                icon={libre ? <Icon name="play" size={13} color="#fff" /> : cadenas}
                iconBackground={libre ? 'linear-gradient(135deg,#0057BC,#6C23DD)' : undefined}
                trailing={libre ? <Tag tone="ok">Gratuit</Tag> : null} />
            ))}
          </GlassPanel>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginTop:'24px'}}>
            <GlassPanel level="flat" padding={22} className="rv" style={{'--i':5}}>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:0}}>Tu es au bon endroit si…</p>
              <CheckLine tone="ok" style={{fontSize:'14px'}}>Tu as un commerce, un salon, un atelier</CheckLine>
              <CheckLine tone="ok" style={{fontSize:'14px'}}>Tes clients viennent du bouche-à-oreille</CheckLine>
              <CheckLine tone="ok" style={{fontSize:'14px'}}>Tu veux le faire toi-même</CheckLine>
            </GlassPanel>
            <GlassPanel level="flat" padding={22} className="rv" style={{'--i':6}}>
              <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',margin:0}}>Autre chose si…</p>
              <CheckLine tone="neutre" dash style={{fontSize:'14px'}}>Tu veux qu'on le fasse → <b style={{color:'var(--mm-teal-t)'}}>Je te digitalise</b></CheckLine>
              <CheckLine tone="neutre" dash style={{fontSize:'14px'}}>Tu vends en ligne sans adresse physique</CheckLine>
              <CheckLine tone="neutre" dash style={{fontSize:'14px'}}>Tu veux juste lire → <b style={{color:'var(--mm-orange-t)'}}>le blog</b></CheckLine>
            </GlassPanel>
          </div>
        </div>

        <div style={{position:'sticky',top:0}}>
          <GlassPanel level="hero" padding={26} className="rv" style={{'--i':2}}>
            <PriceBlock amount="95 000" size={36} note={<>Une fois, accès à vie · ou <b className="mm-num">3 × 31 700</b> sans frais</>} />
            <Button tone="forme" style={{marginTop:'18px'}}>Je m'inscris</Button>
            <Button tone="quiet" fullWidth style={{marginTop:'10px'}}>Commencer le module gratuit</Button>
            <div style={{height:'1px',background:'var(--border-hair)',margin:'20px 0'}} />
            <CheckLine tone="ok" style={{marginTop:0,fontSize:'13.5px'}}><b className="mm-num">14</b> jours pour changer d'avis</CheckLine>
            <CheckLine tone="ok" style={{fontSize:'13.5px'}}>Wave, Orange Money, carte</CheckLine>
            <CheckLine tone="ok" style={{fontSize:'13.5px'}}>Certificat vérifiable publiquement</CheckLine>
          </GlassPanel>
          <GlassPanel level="truth" className="rv" style={{'--i':3,marginTop:'14px'}}>
            <CEyebrow style={{marginBottom:'6px'}}>Ce que je peux te prouver</CEyebrow>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}><b className="mm-num" style={{color:'var(--ink)'}}>47</b> leçons, <b className="mm-num" style={{color:'var(--ink)'}}>6</b> modules, <b className="mm-num" style={{color:'var(--ink)'}}>4 h 42</b> de vidéo, un certificat dont le code se vérifie sans compte. Je n'affiche ni note ni nombre d'inscrits : la plateforme vient d'ouvrir, je n'ai rien d'honnête à en dire.</p>
          </GlassPanel>
        </div>
      </div>
    </AppFrame>
  );
}

const MM_EXPORT = {LecteurDesktop,NotesDesktop,PaiementsDesktop,CertificatsDesktop,FicheDesktop};
Object.assign(window, MM_EXPORT);
window.MMDASH = Object.assign(window.MMDASH||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('DashboardsEspace.js');
