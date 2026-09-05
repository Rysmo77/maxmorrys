const { GlassPanel, Button, Segmented, ChipRow, LessonRow, StatTile, Pipeline, Tag, Avatar, DocLine, ProgressBar, Field, Switch, Icon, IconButton } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LES 18 AUTRES ÉCRANS DE LA CONSOLE, EN 1440 px.
   Pilotage (2) · Commerce (3) · Contenu (5) — la suite dans DashboardsConsole2.js.

   Tous appliquent le même motif en trois zones, sans exception :
     1. un filtre par STATUT, jamais par date ;
     2. une liste dense, un état et UNE action par ligne ;
     3. un pied qui dit ce que l'écran ne couvre pas.

   Ce motif n'est pas une convention de présentation : c'est la conséquence d'un
   opérateur unique. Il cherche « ce qui attend », pas « ce qui s'est passé mardi ».
   Deux actions par ligne, ce serait une hésitation par ligne. Et le non-dit d'un écran
   d'administration finit toujours en manœuvre manuelle non tracée.
   ══════════════════════════════════════════════════════════════════════════════ */

/* Puits d'icône colorés — cinq tons, pas un de plus. */
const NT = {
  ok:   ['#4ADE9B','rgba(74,222,155,.18)'],
  warn: ['#FFB24D','rgba(255,178,77,.2)'],
  stop: ['#FF8A80','rgba(180,35,31,.28)'],
  info: ['#8FD8FF','rgba(0,87,188,.28)'],
  teal: ['#3FD9C6','rgba(63,217,198,.2)']
};

/** Une ligne de liste dense. `action` OU `tag`, jamais les deux. */
function NRow({ico='doc',ton='info',titre,meta,action,tag,last}){
  const [c,bg] = NT[ton] || NT.info;
  return (
    <LessonRow icon={<Icon name={ico} size={14} color={c} />} iconBackground={bg} title={titre} meta={meta} last={last}
      trailing={action ? <Button size="sm" tone="quiet">{action}</Button> : (tag || null)} />
  );
}
/** La liste dense, zone 2 du motif. */
function NListe({lignes,i=3}){
  return (
    <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':i,marginTop:'12px'}}>
      {lignes.map((l,k)=><NRow key={k} {...l} last={k===lignes.length-1} />)}
    </GlassPanel>
  );
}
/** Une case de relevé, toujours datée. */
function NStats({cases,i=2}){
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat('+cases.length+',1fr)',gap:'10px',marginTop:'14px'}}>
      {cases.map(([l,v,f],k)=><div key={l} className="rv" style={{'--i':i+k}}><StatTile dark label={l} value={v} foot={f} /></div>)}
    </div>
  );
}
/** Un état vide de console : le zéro daté, jamais un tiret. */
function NVide({titre,corps,action}){
  return (
    <GlassPanel level="night" padding={30} className="rv" style={{'--i':3,marginTop:'14px',textAlign:'center'}}>
      <p className="mm-num" style={{fontSize:'44px',color:'rgba(236,240,245,.16)',margin:0,letterSpacing:'-.04em'}}>0</p>
      <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'20px',letterSpacing:'-.03em',color:'#fff',margin:'6px 0 0'}}>{titre}</p>
      <p style={{fontSize:'13px',color:'#A2ADBB',lineHeight:1.55,margin:'8px auto 0',maxWidth:'52ch'}}>{corps}</p>
      {action && <Button size="sm" tone="quiet" fullWidth={false} style={{marginTop:'16px'}}>{action}</Button>}
    </GlassPanel>
  );
}

/* ══════════════════ PILOTAGE ══════════════════ */

/* Rejouer un webhook est SANS RISQUE, et l'écran le dit à l'endroit où on hésite. */
function TransactionsDesktop(){
  return (
    <ConsoleFrame actif="Transactions" sourcil="Console · réconciliation" titre="Transactions" releve="relevé du 30/08 · 09:12"
      pied={<>Aucun remboursement ne se déclenche ici : il passe par le prestataire de paiement. Et l'acheteur n'a aucun écran d'historique de son côté — il doit écrire pour savoir où en est son paiement.</>}
      detail={<React.Fragment>
        <NEyebrow style={{fontSize:'10px'}}>Transaction sélectionnée</NEyebrow>
        <p className="mm-num" style={{fontSize:'17px',fontWeight:700,color:'#fff',margin:'6px 0 0'}}>MM-2K6-4831</p>
        <div className="rv" style={{'--i':1,marginTop:'16px'}}>
          <Pipeline active="en attente" stages={['créée','en attente','payée','échouée']} />
        </div>
        <GlassPanel level="night" padding={18} className="rv" style={{'--i':2,marginTop:'14px'}}>
          <DocLine label="Moyen" value="Wave" />
          <DocLine label="Montant" value="80 750 F" />
          <DocLine label="Article" value="Référencement local" />
          <DocLine label="Parrainage" value="AISSA15 · −14 250 F" />
          <DocLine label="Créée le" value="date non récupérée" last />
        </GlassPanel>
        <Button size="sm" tone="quiet" style={{marginTop:'14px'}}>Rejouer le webhook</Button>
        <Button size="sm" fullWidth style={{marginTop:'8px',background:'#ECF0F5',color:'#0B0E13'}}>Marquer échouée</Button>
        <GlassPanel level="night" padding={16} className="rv" style={{'--i':3,marginTop:'16px'}}>
          <NEyebrow style={{fontSize:'10px',marginBottom:'6px'}}>Pourquoi rejouer est sans risque</NEyebrow>
          <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>Le webhook dédoublonne par identifiant de charge : le rejouer ne peut ni créer une double inscription, ni débiter une seconde fois. Les effets sont appliqués <b style={{color:'#ECF0F5'}}>avant</b> que la transaction soit marquée terminée — jamais l'inverse.</p>
        </GlassPanel>
      </React.Fragment>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="en attente 1" stages={['toutes 1','complétées 0','en attente 1','échouées 0']} />
      </div>
      <NStats cases={[['Encaissé','0 F','relevé du 30/08'],['En attente','80 750 F','1 transaction'],['Remboursé','0 F','aucun litige'],['Échec','0 %','sur 1 tentative']]} />
      <NEyebrow style={{margin:'24px 0 0'}}>La seule transaction existante</NEyebrow>
      <NListe i={6} lignes={[
        {ico:'card',ton:'warn',titre:'MM-2K6-4831 · Wave · 80 750 F',meta:'Référencement local · parrainage AISSA15 · date non récupérée',tag:<Tag tone="warn">en attente</Tag>}
      ]} />
      <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Le montant affiché est celui recalculé côté serveur, jamais celui transmis par le navigateur.</p>
    </ConsoleFrame>
  );
}

/* Cinq comptes, dont le dernier remonte au 10 mars. Le zéro est daté. */
function UtilisateursDesktop(){
  return (
    <ConsoleFrame actif="Utilisateurs" sourcil="Console · comptes" titre="Utilisateurs" releve="relevé du 30/08 · 09:12"
      pied={<>Aucune suspension en masse, aucun envoi groupé : le canal d'e-mail n'existe pas. Changer un rôle est immédiat côté règles de base, mais l'écran ne journalise pas encore qui l'a changé ni quand.</>}
      detail={<React.Fragment>
        <div className="rv" style={{display:'flex',gap:'12px',alignItems:'center'}}>
          <Avatar initials="A" size={44} />
          <div style={{flex:1}}>
            <p style={{fontSize:'15px',fontWeight:700,color:'#fff',margin:0}}>Aïssatou Ndiaye</p>
            <p className="mm-num" style={{fontSize:'11.5px',color:'#7C8896',margin:0}}>aissatou@exemple.sn</p>
          </div>
        </div>
        <GlassPanel level="night" padding={18} className="rv" style={{'--i':1,marginTop:'16px'}}>
          <DocLine label="Rôle" value="apprenant" />
          <DocLine label="Inscrite le" value="12/08/2026" />
          <DocLine label="Inscriptions" value="2 · progression 34 %" />
          <DocLine label="Club" value="actif jusqu'au 14/02/2027" />
          <DocLine label="Certificats" value="0" />
          <DocLine label="Quota répétiteur" value="5 / jour" last />
        </GlassPanel>
        <Button size="sm" tone="quiet" style={{marginTop:'14px'}}>Changer le rôle</Button>
        <GlassPanel level="night" padding={16} className="rv" style={{'--i':2,marginTop:'16px'}}>
          <NEyebrow style={{fontSize:'10px',marginBottom:'6px'}}>Ce que la console ne voit pas</NEyebrow>
          <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>Ni ses notes, ni la mémoire de son répétiteur, ni le contenu de ses messages privés. Ces trois-là lui appartiennent, et aucun rôle d'administration n'y donne accès.</p>
        </GlassPanel>
      </React.Fragment>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="tout 5" stages={['tout 5','apprenants 3','admins 2','suspendus 0']} />
      </div>
      <NStats cases={[['Comptes','5','dernier : 10 mars'],['Actifs 30 j','1','sur 5'],['Abonnés Club','1','échéance 14/02/2027'],['Suspendus','0','depuis l\'origine']]} />
      <NEyebrow style={{margin:'24px 0 0'}}>Les cinq comptes</NEyebrow>
      <NListe i={6} lignes={[
        {ico:'user',ton:'teal',titre:'Aïssatou Ndiaye',meta:'apprenante · 2 inscriptions · Club actif',action:'Ouvrir'},
        {ico:'user',ton:'teal',titre:'Seynabou K.',meta:'apprenante · 0 inscription · Club actif',action:'Ouvrir'},
        {ico:'user',ton:'teal',titre:'Amadou T.',meta:'apprenant · 0 inscription · inscrit le 10 mars',action:'Ouvrir'},
        {ico:'lock',ton:'warn',titre:'support@maxmorrys.me',meta:'rôle support · atteint 5 écrans sur 19',action:'Ouvrir'},
        {ico:'lock',ton:'stop',titre:'max@maxmorrys.me',meta:'administrateur · accès complet',tag:<Tag tone="stop">toi</Tag>}
      ]} />
      <p className="rv" style={{'--i':7,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Aucun compte créé depuis le 10 mars. C'est un chiffre, pas une panne d'affichage.</p>
    </ConsoleFrame>
  );
}

/* ══════════════════ COMMERCE ══════════════════ */

function ProspectsDesktop(){
  return (
    <ConsoleFrame actif="Prospects" sourcil="Console · rôle support" titre="Prospects"
      pied={<>Aucune relance automatique : chaque suivi est un geste manuel. Et l'accompagnement mensuel n'a pas de rail de prélèvement au Sénégal — un contrat signé ici n'est pas un revenu encaissé.</>}
      detail={<React.Fragment>
        <div className="rv" style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'12px'}}>
          <div>
            <NEyebrow style={{fontSize:'10px'}}>Prospect sélectionné</NEyebrow>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:'5px 0 0',color:'#fff'}}>Boutique de cosmétiques</p>
          </div>
          <Tag tone="warn">nouveau</Tag>
        </div>
        <div className="rv" style={{'--i':1,marginTop:'16px'}}>
          <Pipeline active="nouveau" stages={['nouveau','qualifié','devisé','signé','perdu']} />
        </div>
        <GlassPanel level="night" padding={18} className="rv" style={{'--i':2,marginTop:'14px'}}>
          <DocLine label="Reçu le" value="06/08/2026" />
          <DocLine label="Lieu" value="Almadies, Dakar" />
          <DocLine label="Trouvée par" value="bouche-à-oreille" />
          <DocLine label="Vend déjà sur" value="WhatsApp · Facebook" />
          <DocLine label="Recommandation" value="Pack Visible" />
          <DocLine label="Montant du devis" value="250 000 F" last />
        </GlassPanel>
        <Button size="sm" tone="quiet" style={{marginTop:'14px'}}>Qualifier ce prospect</Button>
        <Button size="sm" tone="quiet" fullWidth style={{marginTop:'8px'}}>Émettre le devis</Button>
        <GlassPanel level="night" padding={16} className="rv" style={{'--i':3,marginTop:'16px'}}>
          <NEyebrow style={{fontSize:'10px',marginBottom:'5px'}}>Coût opérationnel</NEyebrow>
          <p className="mm-num" style={{fontSize:'23px',margin:'0 0 4px',color:'#fff'}}>≈ 12 min</p>
          <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>par prospect qualifié. À trois par semaine, c'est 36 minutes ; à trente, c'est une demi-journée qui n'existe pas.</p>
        </GlassPanel>
      </React.Fragment>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}><Segmented options={['Présence Digitale · 1','Agency · 0']} value="Présence Digitale · 1" /></div>
      <div className="rv" style={{'--i':2,marginTop:'14px'}}>
        <Pipeline active="nouveau 1" stages={['nouveau 1','qualifié 0','devisé 0','signé 0','perdu 0']} />
      </div>
      <NEyebrow style={{margin:'24px 0 0'}}>À qualifier</NEyebrow>
      <NListe i={4} lignes={[
        {ico:'case',ton:'warn',titre:'Boutique de cosmétiques · Almadies',meta:'Pack Visible recommandé · 250 000 F · « nouveau » depuis le 6 août',action:'Qualifier'}
      ]} />
      <NVide titre="Aucune demande côté Agency." corps="Le formulaire agence demande une fourchette budgétaire : il filtre au lieu de maximiser le volume. Zéro demande est le résultat attendu de ce choix, pas une panne." />
    </ConsoleFrame>
  );
}

function ProjetsDesktop(){
  return (
    <ConsoleFrame actif="Projets" sourcil="Console · Agency" titre="Projets"
      pied={<>Ni facturation, ni suivi de temps, ni jalons contractuels. Cet écran suit l'avancement d'un projet, pas sa comptabilité — celle-ci vit hors de la plateforme.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="tout 0" stages={['tout 0','cadrage 0','en cours 0','livrés 0']} />
      </div>
      <NStats cases={[['Projets','0','depuis l\'origine'],['En cours','0','—'],['Livrés','0','—']]} />
      <NVide titre="Aucun projet ouvert." action="Voir les demandes agence"
        corps="Un projet naît d'une demande agence qualifiée, pas d'une création manuelle. Zéro projet suit logiquement de zéro demande — c'est cohérent, pas cassé." />
    </ConsoleFrame>
  );
}

function CouponsDesktop(){
  return (
    <ConsoleFrame actif="Coupons" sourcil="Console · commerce" titre="Coupons"
      pied={<>La remise est recalculée côté serveur au moment du paiement : un coupon expiré ou épuisé est refusé même si le navigateur l'affiche encore. Cet écran ne montre pas qui a utilisé quel code — ce lien existe en base mais n'a pas d'écran.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="actifs 1" stages={['tout 3','actifs 1','épuisés 1','expirés 1']} />
      </div>
      <NEyebrow style={{margin:'24px 0 0'}}>Les trois codes</NEyebrow>
      <NListe i={2} lignes={[
        {ico:'plus',ton:'ok',titre:'AISSA15 · −15 %',meta:'parrainage · 1 utilisation sur illimité · sans échéance',tag:<Tag tone="ok">actif</Tag>},
        {ico:'plus',ton:'warn',titre:'LANCEMENT50 · −50 %',meta:'20 utilisations sur 20 · épuisé le 12 août',tag:<Tag tone="warn">épuisé</Tag>},
        {ico:'plus',ton:'stop',titre:'RENTREE26 · −10 %',meta:'0 utilisation · expiré le 15 août',tag:<Tag tone="stop">expiré</Tag>}
      ]} />
      <p className="rv" style={{'--i':3,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Un coupon épuisé reste visible plutôt que supprimé : c'est ce qui permet de répondre à « pourquoi mon code ne marche plus ».</p>
    </ConsoleFrame>
  );
}

/* ══════════════════ CONTENU ══════════════════ */

/* La checklist EST la définition de « publiable ». Le bouton reste inactif tant qu'une
   ligne est orange — la liste n'est pas un conseil, c'est la condition. */
function FormationsDesktop(){
  const cond = (ok,t,m) => ({ico:ok?'check':'alert',ton:ok?'ok':'warn',titre:t,meta:m,tag:ok?<Tag tone="ok">prêt</Tag>:<Tag tone="warn">à régler</Tag>});
  return (
    <ConsoleFrame actif="Formations" sourcil="Console · contenu" titre="Formations"
      pied={<>La publication ne crée pas de campagne, n'envoie aucun e-mail et ne prévient personne hors de l'application. Le lancement commercial est un geste séparé, à la main.</>}
      detail={<React.Fragment>
        <NEyebrow style={{fontSize:'10px'}}>Conditions de publication</NEyebrow>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',color:'#fff',margin:'6px 0 0'}}>Référencement local</p>
        <ProgressBar value={60} style={{marginTop:'14px'}} />
        <p style={{fontSize:'12px',color:'#A2ADBB',margin:'8px 0 0'}}>3 conditions sur 5 remplies.</p>
        <GlassPanel level="night" padding="4px 16px" className="rv" style={{'--i':1,marginTop:'14px'}}>
          {[cond(true,'Modules et leçons complets','6 modules, 47 leçons'),
            cond(true,'Prix serveur aligné sur les CGV','95 000 F dans les trois miroirs'),
            cond(true,'Fiche traduite en anglais','générée au pré-rendu'),
            cond(false,'Module 1 en accès libre','aucune leçon marquée gratuite'),
            cond(false,'Poids de la fiche','1,4 Mo pour un budget de 900 Ko')
          ].map((l,k,a)=><NRow key={k} {...l} last={k===a.length-1} />)}
        </GlassPanel>
        <Button disabled style={{marginTop:'14px'}}>Publier au catalogue</Button>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Le bouton reste inactif tant qu'une ligne est orange. La liste n'est pas un conseil : c'est la condition.</p>
      </React.Fragment>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="brouillons 2" stages={['tout 2','publiées 0','brouillons 2']} />
      </div>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':2,marginTop:'14px',borderColor:'rgba(243,139,10,.4)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'13px'}}>
          <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'linear-gradient(135deg,#FFB74D,#F38B0A)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>
            <Icon name="alert" size={18} color="#0E1116" strokeWidth={2.6} />
          </span>
          <p style={{flex:1,fontSize:'14px',color:'#C9B79E',margin:0}}><b style={{color:'#FFB74D'}}>Ta boutique est fermée.</b> Deux formations en base, aucune publiée — un visiteur ne peut rien acheter.</p>
        </div>
      </GlassPanel>
      <NEyebrow style={{margin:'24px 0 0'}}>Les deux formations</NEyebrow>
      <NListe i={3} lignes={[
        {ico:'book',ton:'warn',titre:'Référencement local pour ton commerce',meta:'6 modules · 47 leçons · 95 000 F · 3 conditions sur 5',action:'Ouvrir'},
        {ico:'book',ton:'stop',titre:"L'IA au service de ta prospection",meta:'9 modules · 68 leçons · 200 000 F · 1 condition sur 5',action:'Ouvrir'}
      ]} />
    </ConsoleFrame>
  );
}

function ArticlesDesktop(){
  return (
    <ConsoleFrame actif="Articles" sourcil="Console · éditorial" titre="Articles"
      pied={<>Aucune planification de publication, aucune file éditoriale : un brouillon reste un brouillon jusqu'à un geste manuel. Corriger le texte français ne propage rien avant l'expiration du cache de traduction.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="brouillons 47" stages={['tout 93','publiés 46','brouillons 47']} />
      </div>
      <div className="rv" style={{'--i':2,marginTop:'14px'}}><ChipRow options={['Tout','SEO','IA','Marketing','Outils']} value="Tout" /></div>
      <NListe i={3} lignes={[
        {ico:'doc',ton:'ok',titre:"Pourquoi ta boutique n'apparaît pas sur Google Maps",meta:'publié le 12 août · 8 min · FR + EN',action:'Ouvrir'},
        {ico:'doc',ton:'stop',titre:'Les trois requêtes qui amènent des clients',meta:'publié le 2 août · 6 min · version anglaise jamais rendue',tag:<Tag tone="stop">EN manquant</Tag>},
        {ico:'doc',ton:'warn',titre:'Le tableur qui remplace ton carnet',meta:'brouillon · modifié il y a 3 jours',action:'Publier'},
        {ico:'doc',ton:'warn',titre:'Facturer son premier client',meta:'brouillon · modifié le 14 août',action:'Publier'},
        {ico:'doc',ton:'warn',titre:'45 autres brouillons',meta:'du 3 mai au 28 août',action:'Voir'}
      ]} />
      <p className="rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>« EN manquant » signale un contenu publié en français seul : la traduction est générée au pré-rendu, mais ce document-là n'a jamais été rendu sous /en.</p>
    </ConsoleFrame>
  );
}

function PodcastsDesktop(){
  return (
    <ConsoleFrame actif="Podcasts" sourcil="Console · pôle média" titre="Podcasts"
      pied={<>L'hébergement audio est externe : cet écran référence un épisode, il ne le stocke pas. Les compteurs d'écoute sont synchronisés côté serveur et ne sont affichés nulle part côté public — à un épisode, un compteur ne dit rien d'utile.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="publiés 1" stages={['tout 1','publiés 1','importés 0']} />
      </div>
      <NStats cases={[['Épisodes','1','depuis le 6 août'],['Transcrits','1','sur 1'],['Poids moyen','31 Mo','audio seul']]} />
      <NEyebrow style={{margin:'24px 0 0'}}>Le seul épisode</NEyebrow>
      <NListe i={5} lignes={[
        {ico:'chat',ton:'ok',titre:'Vendre sans budget pub, avec Fatou D.',meta:'épisode 1 · 34:20 · 31 Mo · transcription complète',action:'Ouvrir'}
      ]} />
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Un épisode par mois, quand il y a quelqu'un qui vaut la peine d'être écouté. Pas de calendrier tenu à vide.</p>
    </ConsoleFrame>
  );
}

function VideosDesktop(){
  return (
    <ConsoleFrame actif="Vidéos" sourcil="Console · pôle média" titre="Vidéos"
      pied={<>Le transcodage est fait par l'hébergeur, pas ici : cet écran ne peut ni créer ni supprimer une qualité. Si le 480p manque sur une vidéo, ça se règle chez l'hébergeur.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="publiées 2" stages={['tout 2','publiées 2','brouillons 0']} />
      </div>
      <NStats cases={[['Vidéos','2','depuis juin'],['Avec 480p','2','sur 2'],['Poids HD moyen','79 Mo','96 et 61 Mo']]} />
      <NEyebrow style={{margin:'24px 0 0'}}>Les deux vidéos</NEyebrow>
      <NListe i={5} lignes={[
        {ico:'play',ton:'ok',titre:'Trois heures avec un commerçant du marché Sandaga',meta:'12 juillet · 18:04 · 96 Mo en HD · 24 Mo en 480p',action:'Ouvrir'},
        {ico:'play',ton:'ok',titre:"J'ouvre ma fiche Google devant vous",meta:'28 juin · 11:32 · 61 Mo en HD · 15 Mo en 480p',action:'Ouvrir'}
      ]} />
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Les deux qualités sont obligatoires avant publication : le choix est proposé au visiteur avant la lecture, pas caché dans un menu.</p>
    </ConsoleFrame>
  );
}

function FaqDesktop(){
  return (
    <ConsoleFrame actif="FAQ" sourcil="Console · éditorial" titre="FAQ"
      pied={<>Cet écran gère le contenu, pas le routage : donner une URL propre à chaque question demande une route par question et des données structurées, qui n'existent pas encore. Douze questions sans page, c'est douze positions de recherche perdues.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="sans page 12" stages={['tout 12','publiées 12','sans page 12']} />
      </div>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':2,marginTop:'14px',borderColor:'rgba(243,139,10,.4)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'13px'}}>
          <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'linear-gradient(135deg,#FFB74D,#F38B0A)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>
            <Icon name="alert" size={18} color="#0E1116" strokeWidth={2.6} />
          </span>
          <p style={{flex:1,fontSize:'14px',color:'#C9B79E',margin:0}}><b style={{color:'#FFB74D'}}>Aucune question n'a d'URL propre.</b> La FAQ n'existe que comme index : rien n'est partageable, rien ne ressort en recherche.</p>
        </div>
      </GlassPanel>
      <NListe i={3} lignes={[
        {ico:'info',ton:'warn',titre:'Quels moyens de paiement acceptes-tu ?',meta:'catégorie Paiement · pas de page dédiée',action:'Ouvrir'},
        {ico:'info',ton:'warn',titre:'Est-ce que je peux payer en plusieurs fois ?',meta:'catégorie Paiement · pas de page dédiée',action:'Ouvrir'},
        {ico:'info',ton:'warn',titre:"L'accès est-il vraiment à vie ?",meta:'catégorie Formations · pas de page dédiée',action:'Ouvrir'},
        {ico:'info',ton:'warn',titre:'Combien de membres y a-t-il dans le Club ?',meta:'catégorie Le Club · réponse : « je ne te le dirai pas, le chiffre serait faux »',action:'Ouvrir'},
        {ico:'info',ton:'warn',titre:'8 autres questions',meta:'Compte, Services, Le Club',action:'Voir'}
      ]} />
    </ConsoleFrame>
  );
}

const MM_EXPORT = {NT,NRow,NListe,NStats,NVide,TransactionsDesktop,UtilisateursDesktop,ProspectsDesktop,ProjetsDesktop,CouponsDesktop,FormationsDesktop,ArticlesDesktop,PodcastsDesktop,VideosDesktop,FaqDesktop};
Object.assign(window, MM_EXPORT);
window.MMDASH = Object.assign(window.MMDASH||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('DashboardsConsole.js');
