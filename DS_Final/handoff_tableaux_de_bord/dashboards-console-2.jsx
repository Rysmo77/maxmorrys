const { GlassPanel, Button, Segmented, ChipRow, LessonRow, StatTile, Pipeline, Tag, Avatar, DocLine, Field, Switch, Icon, CheckLine } = window.DS;

/* ══════════════════════════════════════════════════════════════════════════════
   LES HUIT DERNIERS ÉCRANS DE LA CONSOLE : Club (3) et Réglages (5).

   Cinq d'entre eux sont à zéro. Ils sont dessinés quand même, et c'est le point : un
   écran d'administration qu'on ne dessine pas parce qu'il est vide finit par afficher
   des données d'exemple le jour où il se remplit. Le zéro est daté, et la phrase dit
   pourquoi il est à zéro — pas « aucune donnée », mais la raison.
   ══════════════════════════════════════════════════════════════════════════════ */

/* ══════════════════ CLUB ══════════════════ */

function EvenementsDesktop(){
  return (
    <ConsoleFrame actif="Événements" sourcil="Console · Club" titre="Événements"
      pied={<>Aucun rappel automatique avant une session : le canal d'e-mail n'existe pas, et la notification applicative n'est pas planifiable. Un membre inscrit qui ne revient pas dans l'app ne sera pas prévenu.</>}
      detail={<React.Fragment>
        <NEyebrow style={{fontSize:'10px'}}>Session sélectionnée</NEyebrow>
        <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'18px',letterSpacing:'-.03em',color:'#fff',margin:'6px 0 0'}}>Ta fiche Google, en direct</p>
        <GlassPanel level="night" padding={18} className="rv" style={{'--i':1,marginTop:'14px'}}>
          <DocLine label="Date" value="10/09/2026 · 20:00" />
          <DocLine label="Durée" value="1 h" />
          <DocLine label="Format" value="en ligne" />
          <DocLine label="Places" value="illimitées" />
          <DocLine label="Inscrits" value="1 sur 1 membre" last />
        </GlassPanel>
        <Button size="sm" tone="quiet" style={{marginTop:'14px'}}>Modifier la session</Button>
        <GlassPanel level="night" padding={16} className="rv" style={{'--i':2,marginTop:'16px'}}>
          <NEyebrow style={{fontSize:'10px',marginBottom:'6px'}}>L'engagement tenu</NEyebrow>
          <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>La session a lieu <b style={{color:'#ECF0F5'}}>même si nous sommes quatre</b>. C'est une des cinq lignes vendues sur la page publique du Club : annuler faute de monde la rendrait fausse.</p>
        </GlassPanel>
      </React.Fragment>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="à venir 2" stages={['tout 2','à venir 2','passés 0']} />
      </div>
      <NStats cases={[['Sessions','2','à venir'],['En ligne','1','10/09'],['Présentiel','1','20/09 · 4 / 12 places']]} />
      <NEyebrow style={{margin:'24px 0 0'}}>L'agenda publié</NEyebrow>
      <NListe i={5} lignes={[
        {ico:'chat',ton:'info',titre:'Ta fiche Google, en direct',meta:'jeudi 10/09 · 20:00 → 21:00 · en ligne · 1 inscrit',action:'Ouvrir'},
        {ico:'users',ton:'teal',titre:'Atelier fiche produit',meta:'samedi 20/09 · 10:00 → 13:00 · Dakar, Point E · 4 / 12 places',action:'Ouvrir'}
      ]} />
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>L'agenda est publié un mois à l'avance — c'est un engagement de la page publique, pas une habitude.</p>
    </ConsoleFrame>
  );
}

function DefisDesktop(){
  return (
    <ConsoleFrame actif="Défis" sourcil="Console · Club" titre="Défis"
      pied={<>Un défi attribue de l'expérience, jamais d'argent ni de remise. Il n'a pas non plus de classement propre : le seul classement du produit est celui par vague d'arrivée, et il reste par vague.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="tout 0" stages={['tout 0','en cours 0','clos 0']} />
      </div>
      <NVide titre="Aucun défi lancé." action="Créer un défi"
        corps="Un défi demande une participation régulière de plusieurs membres pour ne pas tourner à vide. Avec le Club à ses débuts, en lancer un maintenant produirait un tableau à un participant — ce qui décourage plus que ça ne motive." />
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':4,marginTop:'14px'}}>
        <NEyebrow style={{fontSize:'10px',marginBottom:'8px'}}>Ce qu'un défi pourra faire, quand il y en aura</NEyebrow>
        <CheckLine tone="ok" style={{fontSize:'13.5px'}}>Attribuer de l'expérience à la première réalisation, pas aux suivantes</CheckLine>
        <CheckLine tone="ok" style={{fontSize:'13.5px'}}>Se clore à une date fixée d'avance, jamais « quand assez de monde a joué »</CheckLine>
        <CheckLine tone="neutre" dash style={{fontSize:'13.5px'}}>Aucune récompense en argent ni en remise — ce serait un concours, avec ses obligations légales</CheckLine>
      </GlassPanel>
    </ConsoleFrame>
  );
}

function TemoignagesDesktop(){
  return (
    <ConsoleFrame actif="Témoignages" sourcil="Console · Club" titre="Témoignages"
      pied={<>Approuver un témoignage ne le publie nulle part aujourd'hui : aucune page publique n'en affiche. C'est délibéré — la plateforme vient d'ouvrir, et un témoignage isolé pèse moins qu'il ne coûte en crédibilité.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="tout 0" stages={['tout 0','en attente 0','approuvés 0']} />
      </div>
      <NVide titre="Aucun témoignage reçu." 
        corps="La boîte fonctionne — personne n'écrit encore. Zéro message, zéro témoignage, zéro rendez-vous depuis l'origine." />
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':4,marginTop:'14px',borderColor:'rgba(180,35,31,.34)'}}>
        <NEyebrow style={{fontSize:'10px',marginBottom:'6px',color:'#FF8A80'}}>La règle qui tient même quand la boîte se remplira</NEyebrow>
        <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>Aucune note en étoiles, aucun nombre d'avis, aucun taux de réussite, aucun logo client. Un témoignage approuvé reste un texte signé d'une personne, jamais un chiffre agrégé — et surtout jamais un chiffre inventé en attendant les vrais.</p>
      </GlassPanel>
    </ConsoleFrame>
  );
}

/* ══════════════════ RÉGLAGES ══════════════════ */

function RedirectionsDesktop(){
  return (
    <ConsoleFrame actif="Redirections" sourcil="Console · réglages" titre="Redirections"
      pied={<>Cet écran ne détecte pas les liens morts : il applique des règles qu'on lui donne. Une page supprimée sans redirection reste une 404, et rien ici ne le signalera.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="actives 8" stages={['tout 8','actives 8','en conflit 0']} />
      </div>
      <NEyebrow style={{margin:'24px 0 0'}}>Les huit règles</NEyebrow>
      <NListe i={2} lignes={[
        {ico:'forward',ton:'ok',titre:'/formation-seo → /formations/referencement-local',meta:'301 · ancienne URL de lancement · 14 hits ce mois',action:'Modifier'},
        {ico:'forward',ton:'ok',titre:'/club → /club-des-digitos',meta:'301 · raccourci partagé en story · 6 hits',action:'Modifier'},
        {ico:'forward',ton:'ok',titre:'/podcast → /podcast-et-videos',meta:'301 · déplacement du pôle média · 3 hits',action:'Modifier'},
        {ico:'forward',ton:'ok',titre:'/en/training → /en/courses',meta:'301 · segment anglais corrigé · 0 hit',action:'Modifier'},
        {ico:'forward',ton:'ok',titre:'4 autres règles',meta:'toutes en 301, aucune en conflit',action:'Voir'}
      ]} />
      <GlassPanel level="night" padding={16} className="rv" style={{'--i':3,marginTop:'14px'}}>
        <NEyebrow style={{fontSize:'10px',marginBottom:'6px'}}>Pourquoi les segments d'URL sont traduits</NEyebrow>
        <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}><span className="mm-num">/formations</span> et <span className="mm-num">/en/courses</span> sont deux URL distinctes, pas une URL et sa traduction. Chacune se positionne dans sa langue. Une redirection qui traverse les langues est presque toujours une erreur.</p>
      </GlassPanel>
    </ConsoleFrame>
  );
}

function PopupsDesktop(){
  return (
    <ConsoleFrame actif="Pop-ups" sourcil="Console · réglages" titre="Pop-ups"
      pied={<>Aucun test A/B, aucune mesure de conversion : cet écran affiche le nombre d'affichages et de fermetures, pas ce qu'une pop-up a rapporté. Attribuer une vente à une pop-up demanderait un suivi que la plateforme n'a pas.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="actives 2" stages={['tout 6','actives 2','témoin 2','arrêtées 2']} />
      </div>
      <NStats cases={[['Affichages 30 j','412','relevé du 30/08'],['Fermetures','389','94 %'],['Actives','2','sur 6']]} />
      <NListe i={5} lignes={[
        {ico:'bell',ton:'ok',titre:'Bandeau — le module 1 est gratuit',meta:'page fiche formation · après 8 s · 212 affichages',tag:<Tag tone="ok">active</Tag>},
        {ico:'bell',ton:'ok',titre:"Bandeau — ajoute Rysmo à ton écran d'accueil",meta:'mobile seulement · 2e visite · 200 affichages',tag:<Tag tone="ok">active</Tag>},
        {ico:'bell',ton:'stop',titre:'Sortie de page — « attends, avant de partir »',meta:'arrêtée le 22 août · 94 % de fermetures immédiates',tag:<Tag tone="stop">arrêtée</Tag>},
        {ico:'bell',ton:'stop',titre:'Compte à rebours de lancement',meta:'arrêtée le 3 août · rareté fabriquée, contraire à la voix',tag:<Tag tone="stop">arrêtée</Tag>}
      ]} />
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Une pop-up fermée à 94 % n'est pas mal réglée, elle est de trop. Les deux arrêtées le sont pour cette raison, et l'écran garde la trace du motif.</p>
    </ConsoleFrame>
  );
}

function NotificationsDesktop(){
  return (
    <ConsoleFrame actif="Notifications" sourcil="Console · réglages" titre="Notifications"
      pied={<>Il n'existe aucun canal d'envoi : ni e-mail, ni SMS, ni notification poussée. Ce qui part d'ici arrive dans le centre applicatif, et seulement si la personne rouvre l'application.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="tout 0" stages={['tout 0','envoyées 0','planifiées 0']} />
      </div>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':2,marginTop:'14px',borderColor:'rgba(180,35,31,.34)'}}>
        <div style={{display:'flex',alignItems:'center',gap:'13px'}}>
          <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'rgba(180,35,31,.28)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>
            <Icon name="alert" size={18} color="#FF8A80" strokeWidth={2.6} />
          </span>
          <p style={{flex:1,fontSize:'14px',color:'#A2ADBB',margin:0}}><b style={{color:'#FF8A80'}}>Aucun canal d'envoi n'existe.</b> Les réglages ci-dessous pilotent le centre applicatif, rien d'autre. Les CGV promettent un préavis de renouvellement par e-mail : cette promesse n'est pas tenable en l'état.</p>
        </div>
      </GlassPanel>
      <NEyebrow style={{margin:'24px 0 0'}}>Les types que le produit sait produire</NEyebrow>
      <NListe i={3} lignes={[
        {ico:'bell',ton:'ok',titre:'Reprise de cours',meta:'après 5 jours sans activité · centre applicatif',tag:<Switch on />},
        {ico:'bell',ton:'ok',titre:'Série quotidienne',meta:'avant qu\'elle ne se casse · centre applicatif',tag:<Switch on />},
        {ico:'bell',ton:'ok',titre:'Digest du Club',meta:'hebdomadaire · centre applicatif',tag:<Switch on />},
        {ico:'bell',ton:'stop',titre:'Préavis de renouvellement · 15 jours avant',meta:'promis par les CGV · aucun canal pour le porter',tag:<Switch disabled />},
        {ico:'bell',ton:'stop',titre:'Alerte de mise en ligne du catalogue',meta:"promise sur l'état vide · retirée de l'interface",tag:<Switch disabled />}
      ]} />
      <p className="rv" style={{'--i':4,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Les deux lignes grisées sont des promesses que le produit ne peut pas tenir. Elles restent visibles ici plutôt que masquées : c'est ce qui empêche de les réintroduire côté public.</p>
    </ConsoleFrame>
  );
}

function RendezVousDesktop(){
  return (
    <ConsoleFrame actif="Rendez-vous" sourcil="Console · commerce" titre="Rendez-vous"
      pied={<>Aucune synchronisation d'agenda, aucun lien de visioconférence généré : un rendez-vous pris ici est une ligne dans une liste. Le lien et le rappel se font à la main, dans WhatsApp.</>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}>
        <Pipeline active="tout 0" stages={['tout 0','à venir 0','passés 0']} />
      </div>
      <NVide titre="Aucun rendez-vous pris."
        corps="La prise de rendez-vous existe sur la page Présence Digitale, et personne ne l'a utilisée. Zéro depuis l'origine — c'est une information sur le haut de l'entonnoir, pas sur l'écran." />
      <GlassPanel level="night" padding={16} className="rv" style={{'--i':4,marginTop:'14px'}}>
        <NEyebrow style={{fontSize:'10px',marginBottom:'6px'}}>Le coût que ce zéro cache</NEyebrow>
        <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>Un rendez-vous coûte <span className="mm-num" style={{color:'#ECF0F5'}}>≈ 45 min</span> à un opérateur unique — préparation, appel, compte rendu. À dix par semaine, la ligne Présence Digitale ne tient plus sans une seconde personne. Ce n'est pas un objectif à maximiser sans y penser.</p>
      </GlassPanel>
    </ConsoleFrame>
  );
}

function ParametresDesktop(){
  return (
    <ConsoleFrame actif="Paramètres" sourcil="Console · réglages" titre="Paramètres"
      pied={<>Les prix, les rôles et les règles d'accès affichés ici sont des <b style={{color:'#ECF0F5'}}>miroirs</b> de la base : les modifier ici ne suffit pas si la règle serveur ne suit pas. Trois clauses des CGV promettent aujourd'hui ce que le produit ne fait pas.</>}
      detail={<React.Fragment>
        <NEyebrow style={{fontSize:'10px'}}>Rôles et portée</NEyebrow>
        <GlassPanel level="night" padding={18} className="rv" style={{'--i':1,marginTop:'12px'}}>
          <DocLine label="administrateur" value="19 écrans" />
          <DocLine label="support" value="5 écrans" />
          <DocLine label="apprenant" value="aucun" last />
        </GlassPanel>
        <GlassPanel level="night" padding={16} className="rv" style={{'--i':2,marginTop:'14px'}}>
          <NEyebrow style={{fontSize:'10px',marginBottom:'6px'}}>Ce qu'un garde de route ne fait pas</NEyebrow>
          <p style={{fontSize:'12.5px',color:'#A2ADBB',lineHeight:1.55,margin:0}}>Un garde de route est du code client : il <b style={{color:'#ECF0F5'}}>cache</b>, il n'interdit pas. Le vrai cloisonnement est dans les règles de la base. La page /403 dit simplement ce qu'elles ont déjà refusé.</p>
        </GlassPanel>
      </React.Fragment>}>
      <div className="rv" style={{'--i':1,marginTop:'18px'}}><Segmented options={['Marque','Paiement','SEO','Rôles']} value="Paiement" /></div>

      <NEyebrow style={{margin:'24px 0 0'}}>Moyens de paiement</NEyebrow>
      <NListe i={2} lignes={[
        {ico:'card',ton:'ok',titre:'Wave',meta:'actif · validation dans l\'application Wave',tag:<Switch on />},
        {ico:'card',ton:'ok',titre:'Orange Money',meta:'actif · code de confirmation par SMS',tag:<Switch on />},
        {ico:'card',ton:'ok',titre:'Carte bancaire',meta:'actif · Visa, Mastercard',tag:<Switch on />},
        {ico:'card',ton:'stop',titre:'Virement bancaire',meta:'mentionné dans les CGV · absent du tunnel',tag:<Switch disabled />}
      ]} />

      <NEyebrow style={{margin:'24px 0 0'}}>Prix de référence</NEyebrow>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':4,marginTop:'12px'}}>
        <DocLine label="Référencement local" value="95 000 F · ou 3 × 31 700" />
        <DocLine label="IA et prospection" value="200 000 F · ou 4 × 50 000" />
        <DocLine label="Club des Digitos" value="19 900 F / an · 1 658 F / mois" />
        <DocLine label="Pack Visible" value="250 000 F · barré 295 000" last />
      </GlassPanel>
      <p className="rv" style={{'--i':5,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.5,marginTop:'10px'}}>Le prix du Club est cadré au mois <b style={{color:'#A2ADBB'}}>et</b> à l'année partout où il apparaît : mensualisé il relève de l'achat impulsif, annualisé il franchit un seuil de délibération.</p>

      <GlassPanel level="night" padding={18} className="rv" style={{'--i':6,marginTop:'16px',borderColor:'rgba(243,139,10,.4)'}}>
        <NEyebrow style={{fontSize:'10px',marginBottom:'6px',color:'#FFB74D'}}>Trois clauses à réécrire avant publication</NEyebrow>
        <p style={{fontSize:'12.5px',color:'#C9B79E',lineHeight:1.55,margin:0}}>Les CGV promettent un <b style={{color:'#FFB74D'}}>renouvellement automatique avec préavis de quinze jours</b> que rien n'implémente, mentionnent un moyen de paiement absent du tunnel, et invoquent un objet social qui ne couvre pas toutes les lignes vendues. Un document contractuel qui promet ce que le produit ne fait pas est un risque, pas un détail de rédaction.</p>
      </GlassPanel>
    </ConsoleFrame>
  );
}

const MM_EXPORT = {EvenementsDesktop,DefisDesktop,TemoignagesDesktop,RedirectionsDesktop,PopupsDesktop,NotificationsDesktop,RendezVousDesktop,ParametresDesktop};
Object.assign(window, MM_EXPORT);
window.MMDASH = Object.assign(window.MMDASH||{}, MM_EXPORT);
