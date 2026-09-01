const { GlassPanel, StatTile, Pipeline, LessonRow, Button, Tag, Icon, Segmented, DocLine, ProgressBar } = window.DS;

function Pied({children,i=9}){
  return (
    <GlassPanel level="night" padding={16} className="rv" style={{'--i':i,marginTop:'20px',borderColor:'rgba(255,255,255,.09)'}}>
      <p style={{fontFamily:'var(--f-mono)',fontSize:'10px',letterSpacing:'.14em',textTransform:'uppercase',color:'#7C8896',margin:'0 0 6px'}}>Ce que cet écran ne couvre pas</p>
      <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>{children}</p>
    </GlassPanel>
  );
}

/* ── LE MOTIF ── */
function MotifConsole(){
  return (
    <ConsoleScreen title="Le motif" sub="Console · valable pour les 19 écrans">
      <p className="rv" style={{fontSize:'13.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>La console n'est pas un tableau de bord d'analyse : c'est une liste de choses à faire aujourd'hui. Elle s'ouvre sur ce qui bloque, pas sur ce qui va bien. Trois zones, toujours dans cet ordre.</p>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':2,marginTop:'18px'}}>
        <div style={{display:'flex',gap:'10px',alignItems:'baseline'}}>
          <span className="mm-num" style={{fontSize:'19px',color:'#6FB1FF'}}>1</span>
          <div><p style={{fontWeight:700,fontSize:'14.5px',margin:0}}>Filtre par statut, jamais par date</p>
          <p style={{fontSize:'12.5px',color:'#A2ADBB',margin:'3px 0 0',lineHeight:1.5}}>Un opérateur unique cherche « ce qui attend », pas « ce qui s'est passé mardi ».</p></div>
        </div>
        <Pipeline active="en attente" stages={['tout','à traiter','en attente','clos']} style={{marginTop:'14px'}} />
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':3,marginTop:'12px'}}>
        <div style={{display:'flex',gap:'10px',alignItems:'baseline'}}>
          <span className="mm-num" style={{fontSize:'19px',color:'#B98CFF'}}>2</span>
          <div><p style={{fontWeight:700,fontSize:'14.5px',margin:0}}>Liste dense, un état et UNE action par ligne</p>
          <p style={{fontSize:'12.5px',color:'#A2ADBB',margin:'3px 0 0',lineHeight:1.5}}>Deux actions par ligne, c'est une hésitation par ligne.</p></div>
        </div>
        <GlassPanel level="night" padding="2px 14px" style={{marginTop:'12px',background:'rgba(255,255,255,.04)'}}>
          <LessonRow icon={<Icon name="doc" size={13} color="#FFB24D" />} iconBackground="rgba(255,178,77,.2)" title="Élément en attente" meta="statut · depuis 12 j" trailing={<Button size="sm" tone="quiet">Qualifier</Button>} last />
        </GlassPanel>
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':4,marginTop:'12px'}}>
        <div style={{display:'flex',gap:'10px',alignItems:'baseline'}}>
          <span className="mm-num" style={{fontSize:'19px',color:'#FFB24D'}}>3</span>
          <div><p style={{fontWeight:700,fontSize:'14.5px',margin:0}}>Un pied qui dit ce que l'écran ne couvre pas</p>
          <p style={{fontSize:'12.5px',color:'#A2ADBB',margin:'3px 0 0',lineHeight:1.5}}>Le non-dit d'un écran d'administration finit toujours en manœuvre manuelle non tracée.</p></div>
        </div>
      </GlassPanel>
      <Pied i={5}>Le motif ne dit rien du contenu de chaque écran : il fixe l'ordre des zones et la règle d'une action par ligne. Les dix-neuf écrans s'y conforment sans exception.</Pied>
    </ConsoleScreen>
  );
}

/* ── A · TABLEAU DE BORD ── */
function DashboardOps({go}){
  return (
    <ConsoleScreen title="Dimanche 30 août" sub="Console · pilotage">
      <GlassPanel level="night" padding={20} className="rv" style={{borderColor:'rgba(243,139,10,.4)'}}>
        <div style={{display:'flex',gap:'12px'}}>
          <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'linear-gradient(135deg,#FFB74D,#F38B0A)',display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="alert" size={18} color="#0E1116" strokeWidth={2.6} /></span>
          <div><p style={{fontWeight:700,fontSize:'15px',color:'#FFB74D',margin:0}}>Ta boutique est fermée</p>
          <p style={{fontSize:'13px',color:'#C9B79E',margin:'4px 0 0',lineHeight:1.5}}>2 formations en base, 0 publiée. Un visiteur ne peut rien acheter.</p></div>
        </div>
        <Button style={{marginTop:'15px',background:'linear-gradient(135deg,#FFB74D,#F38B0A)',color:'#0E1116',boxShadow:'0 8px 24px rgba(243,139,10,.32)'}}>Publier une formation</Button>
      </GlassPanel>
      <CEyebrow style={{'--i':2,marginTop:'22px'}}>Relevé du 30/08 · 09:12</CEyebrow>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'10px'}}>
        <div className="rv" style={{'--i':3}}><StatTile dark label="Encaissé" value="0 F" foot="1 transaction en attente" /></div>
        <div className="rv" style={{'--i':4}}><StatTile dark label="Comptes" value="5" foot="dernier : 10 mars" /></div>
        <div className="rv" style={{'--i':5}}><StatTile dark label="Inscriptions" value="2" foot="progression 0 %" /></div>
        <div className="rv" style={{'--i':6}}><StatTile dark label="Certificats" value="0" foot="depuis l'origine" /></div>
      </div>
      <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'#7C8896',marginTop:'12px',lineHeight:1.5}}>Chaque case porte sa date de relevé. Une case sans date affiche « non relevé », jamais une estimation.</p>
      <CEyebrow style={{'--i':8,marginTop:'22px'}}>À traiter</CEyebrow>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':8,marginTop:'10px'}}>
        <LessonRow icon={<Icon name="user" size={14} color="#3FD9C6" />} iconBackground="rgba(63,217,198,.2)" title="1 prospect non qualifié" meta="« nouveau » depuis le 6 août" trailing={<Button size="sm" tone="quiet">Qualifier</Button>} />
        <LessonRow icon={<Icon name="doc" size={14} color="#8FD8FF" />} iconBackground="rgba(0,87,188,.28)" title="47 articles en brouillon" meta="46 publiés sur 93" trailing={<Button size="sm" tone="quiet">Ouvrir</Button>} />
        <LessonRow icon={<Icon name="alert" size={14} color="#FF8A80" />} iconBackground="rgba(180,35,31,.28)" title="7 chiffres non sourcés en façade" meta="contredits par la base" trailing={<Button size="sm" tone="quiet">Retirer</Button>} last />
      </GlassPanel>
      <Pied i={9}>Ni analyse d'audience, ni cohortes, ni graphiques : cet écran ne répond qu'à « qu'est-ce qui bloque aujourd'hui ». Le coût d'exploitation — infrastructure, IA, paiement — n'y figure pas encore.</Pied>
    </ConsoleScreen>
  );
}

/* ── B · PUBLIER UNE FORMATION ── La checklist EST la définition de « publiable ». */
function PublierFormation(){
  const ligne = (ok,t,m)=>(
    <LessonRow key={t}
      icon={<Icon name={ok?'check':'alert'} size={13} color={ok?'#4ADE9B':'#FFB24D'} strokeWidth={ok?3.4:2.6} />}
      iconBackground={ok?'rgba(74,222,155,.18)':'rgba(255,178,77,.2)'}
      title={t} meta={m} trailing={ok?<Tag tone="ok">prêt</Tag>:<Tag tone="warn">à régler</Tag>} />
  );
  return (
    <ConsoleScreen title="Publier" sub="Console · formation">
      <GlassPanel level="night" padding={18} className="rv">
        <p style={{fontWeight:700,fontSize:'15px',margin:0}}>Référencement local pour ton commerce</p>
        <p className="mm-num" style={{fontSize:'11.5px',color:'#7C8896',margin:'3px 0 0'}}>6 modules · 47 leçons · 95 000 F</p>
        <ProgressBar value={60} style={{marginTop:'12px'}} />
        <p style={{fontSize:'11.5px',color:'#A2ADBB',margin:'8px 0 0'}}>3 conditions sur 5 remplies.</p>
      </GlassPanel>
      <CEyebrow style={{'--i':2,marginTop:'22px'}}>Ce que « publiable » veut dire</CEyebrow>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':3,marginTop:'10px'}}>
        {ligne(true,'Modules et leçons complets','6 modules, 47 leçons, aucune leçon vide')}
        {ligne(true,'Prix serveur aligné sur les CGV','95 000 F dans les trois miroirs')}
        {ligne(true,'Fiche traduite en anglais','générée puis mise en cache au pré-rendu')}
        {ligne(false,'Module 1 en accès libre','aucune leçon marquée gratuite')}
        {ligne(false,'Poids de la fiche','1,4 Mo pour un budget de 900 Ko')}
      </GlassPanel>
      <Button disabled style={{marginTop:'16px'}}>Publier au catalogue</Button>
      <p className="rv" style={{'--i':4,fontSize:'11.5px',color:'#7C8896',marginTop:'10px',lineHeight:1.5}}>Le bouton reste inactif tant qu'une ligne est orange. La liste n'est pas un conseil : c'est la condition.</p>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':5,marginTop:'16px'}}>
        <CEyebrow style={{margin:'0 0 8px'}}>Ce que la publication déclenche</CEyebrow>
        <DocLine label="Apparition au catalogue" value="immédiate" />
        <DocLine label="Plan de site et hreflang" value="regénérés" />
        <DocLine label="Notification aux 3 comptes" value="centre applicatif" />
        <DocLine label="E-mail d'annonce" value="aucun canal" last />
      </GlassPanel>
      <Pied i={6}>La publication ne crée pas de campagne, n'envoie aucun e-mail et ne prévient personne hors de l'application. Le lancement commercial est un geste séparé, à la main.</Pied>
    </ConsoleScreen>
  );
}

/* ── C · TRANSACTIONS ── */
function TransactionsOps(){
  return (
    <ConsoleScreen title="Transactions" sub="Console · réconciliation">
      <div className="rv"><Pipeline active="en attente 1" stages={['toutes 1','complétées 0','en attente 1','échouées 0']} /></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'14px'}}>
        <div className="rv" style={{'--i':2}}><StatTile dark label="Encaissé" value="0 F" foot="relevé du 30/08" /></div>
        <div className="rv" style={{'--i':3}}><StatTile dark label="Remboursé" value="0 F" foot="aucun litige" /></div>
      </div>
      <CEyebrow style={{'--i':4,marginTop:'22px'}}>La seule transaction existante</CEyebrow>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':4,marginTop:'10px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
          <div>
            <p className="mm-num" style={{fontSize:'14px',fontWeight:700,margin:0}}>MM-2K6-4831</p>
            <p style={{fontSize:'12.5px',color:'#A2ADBB',margin:'4px 0 0'}}>Wave · 80 750 F · référencement local</p>
            <p className="mm-num" style={{fontSize:'11px',color:'#7C8896',margin:'4px 0 0'}}>date non récupérée</p>
          </div>
          <Tag tone="warn">en attente</Tag>
        </div>
        <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
          <Button size="sm" tone="quiet" style={{flex:1}}>Rejouer le webhook</Button>
          <Button size="sm" style={{flex:1,background:'#ECF0F5',color:'#0B0E13'}}>Marquer échouée</Button>
        </div>
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':5,marginTop:'14px'}}>
        <CEyebrow style={{margin:'0 0 6px'}}>Pourquoi rejouer est sans risque</CEyebrow>
        <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>Le webhook dédoublonne par identifiant de charge : le rejouer ne peut ni créer une double inscription, ni débiter une seconde fois. Les effets sont appliqués avant que la transaction soit marquée terminée — jamais l'inverse.</p>
      </GlassPanel>
      <Pied i={6}>Aucun remboursement ne se déclenche ici : il passe par le prestataire de paiement. Et l'acheteur n'a aucun écran d'historique de son côté — il doit écrire pour savoir où en est son paiement.</Pied>
    </ConsoleScreen>
  );
}

/* ── D · PROSPECTS ── */
function ProspectsOps(){
  const [ligne,setLigne] = React.useState('Présence Digitale 1');
  return (
    <ConsoleScreen title="Prospects" sub="Console · rôle support">
      <div className="rv"><Segmented options={['Présence Digitale 1','Agence 0']} value={ligne} onChange={setLigne} /></div>
      <div className="rv" style={{'--i':2,marginTop:'14px'}}><Pipeline active="nouveau" stages={['nouveau','qualifié','devisé','signé','perdu']} /></div>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':3,marginTop:'14px'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
          <div>
            <p style={{fontWeight:700,fontSize:'15px',margin:0}}>Boutique de cosmétiques</p>
            <p style={{fontSize:'12.5px',color:'#A2ADBB',margin:'4px 0 0'}}>Almadies, Dakar · reçu le 6 août</p>
          </div>
          <Tag tone="warn">nouveau</Tag>
        </div>
        <div style={{marginTop:'14px'}}>
          <DocLine label="Trouvée par" value="bouche-à-oreille" />
          <DocLine label="Vend déjà sur" value="WhatsApp · Facebook" />
          <DocLine label="Recommandation calculée" value="Pack Visible" />
          <DocLine label="Montant du devis" value="250 000 F" last />
        </div>
        <Button size="sm" tone="quiet" fullWidth style={{marginTop:'14px'}}>Qualifier ce prospect</Button>
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':4,marginTop:'14px'}}>
        <CEyebrow style={{margin:'0 0 6px'}}>Coût opérationnel de cet écran</CEyebrow>
        <p className="mm-num" style={{fontSize:'23px',margin:'0 0 4px'}}>≈ 12 min</p>
        <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>par prospect qualifié — lecture, appel de qualification, émission du devis, relance à J+3. À trois prospects par semaine, c'est 36 minutes ; à trente, c'est une demi-journée qui n'existe pas.</p>
      </GlassPanel>
      <Pied i={5}>Aucune relance automatique : chaque suivi est un geste manuel. Et l'accompagnement mensuel n'a pas de rail de prélèvement au Sénégal — un contrat signé ici n'est pas un revenu encaissé.</Pied>
    </ConsoleScreen>
  );
}

/* ── E · CONTENU ── */
function ContenuOps(){
  return (
    <ConsoleScreen title="Contenu" sub="Console · éditorial">
      <div className="rv"><Pipeline active="brouillons 47" stages={['tout 93','publiés 46','brouillons 47']} /></div>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':2,marginTop:'14px'}}>
        <LessonRow icon={<Icon name="doc" size={14} color="#4ADE9B" />} iconBackground="rgba(74,222,155,.18)" title="Pourquoi ta boutique n'apparaît pas…" meta="article · 12 août" trailing={<Tag tone="ok">publié</Tag>} />
        <LessonRow icon={<Icon name="doc" size={14} color="#4ADE9B" />} iconBackground="rgba(74,222,155,.18)" title="Les trois requêtes qui amènent des clients" meta="article · 2 août" trailing={<Tag tone="stop">EN manquant</Tag>} />
        <LessonRow icon={<Icon name="doc" size={14} color="#FFB24D" />} iconBackground="rgba(255,178,77,.2)" title="Le tableur qui remplace ton carnet" meta="brouillon · modifié il y a 3 j" trailing={<Button size="sm" tone="quiet">Publier</Button>} />
        <LessonRow icon={<Icon name="doc" size={14} color="#FFB24D" />} iconBackground="rgba(255,178,77,.2)" title="Facturer son premier client" meta="brouillon · modifié le 14 août" trailing={<Button size="sm" tone="quiet">Publier</Button>} />
        <LessonRow icon={<Icon name="book" size={14} color="#FF8A80" />} iconBackground="rgba(180,35,31,.28)" title="Référencement local pour ton commerce" meta="formation · non publiée" trailing={<Tag tone="stop">bloquant</Tag>} last />
      </GlassPanel>
      <p className="rv" style={{'--i':3,fontSize:'11.5px',color:'#7C8896',marginTop:'12px',lineHeight:1.5}}>L'étiquette « EN manquant » signale un contenu publié en français seul : la traduction est générée au pré-rendu, mais ce document-là n'a jamais été rendu sous /en.</p>
      <Pied i={4}>Aucune planification de publication, aucune file éditoriale : un brouillon reste un brouillon jusqu'à un geste manuel. Corriger le texte français ne propage rien avant l'expiration du cache de traduction.</Pied>
    </ConsoleScreen>
  );
}

/* ── LES 14 AUTRES ÉCRANS : leurs pipelines, pas leurs maquettes ── */
function PipelinesRestants(){
  const P = [
    ['Podcasts',['tout 1','publiés 1','importés 0']],
    ['Vidéos',['tout 2','publiées 2','brouillons 0']],
    ['FAQ',['tout 12','publiées 12','sans page 12']],
    ['Coupons',['tout 3','actifs 1','épuisés 1','expirés 1']],
    ['Redirections',['tout 8','actives 8','en conflit 0']],
    ['Pop-ups',['tout 6','actives 2','témoin 2','arrêtées 2']],
    ['Défis',['tout 0','en cours 0','clos 0']],
    ['Événements',['tout 2','à venir 2','passés 0']],
    ['Notifications',['tout 0','envoyées 0','planifiées 0']],
    ['Utilisateurs',['tout 5','apprenants 3','admins 2','suspendus 0']],
    ['Formations',['tout 2','publiées 0','brouillons 2']],
    ['Paramètres',['marque','paiement','SEO','rôles']],
    ['Témoignages',['tout 0','en attente 0','approuvés 0']],
    ['Rendez-vous',['tout 0','à venir 0','passés 0']]
  ];
  return (
    <ConsoleScreen title="Les 14 autres" sub="Console · même motif">
      <p className="rv" style={{fontSize:'13px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>Les quatorze écrans restants n'ont pas besoin d'être dessinés un par un : ils appliquent le motif. Ce qui les distingue tient dans leur pipeline de statuts — le voici, en entier.</p>
      <div style={{marginTop:'16px'}}>
        {P.map(([nom,stages],i)=>(
          <div key={nom} className="rv" style={{'--i':1+i%8,padding:'12px 0',borderBottom:i===P.length-1?0:'1px solid rgba(255,255,255,.09)'}}>
            <p style={{fontSize:'13px',fontWeight:600,margin:'0 0 8px'}}>{nom}</p>
            <Pipeline active={stages[0]} stages={stages} />
          </div>
        ))}
      </div>
      <Pied i={9}>Cette grille ne dit rien des champs d'édition de chaque écran. Elle fixe ce qui compte pour un opérateur unique : où se trouve la file, et combien d'éléments y attendent.</Pied>
    </ConsoleScreen>
  );
}

const MM_EXPORT = {Pied,MotifConsole,DashboardOps,PublierFormation,TransactionsOps,ProspectsOps,ContenuOps,PipelinesRestants};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensMotif.js');
