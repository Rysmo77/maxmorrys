const { GlassPanel, StatTile, Pipeline, LessonRow, Button, Tag, Icon, ProgressBar, DocLine, QuotaMeter } = window.DS;

const NAV = [['bord','Pilotage'],['contenu','Contenu'],['transactions','Transactions'],['prospects','Prospects'],['support','Support'],['audit','Quotas & audit']];
const other = (k)=>NAV.filter(n=>n[0]!==k);

function Bord({go}){
  return (
    <ConsoleScreen title="Dimanche 30 août" sub="Console · admin" nav={other('bord')} go={go}>
      <GlassPanel level="night" padding={20} className="rv" style={{'--i':2,borderColor:'rgba(243,139,10,.4)'}}>
        <div style={{display:'flex',gap:'12px'}}>
          <span style={{width:'34px',height:'34px',borderRadius:'11px',background:'linear-gradient(135deg,#FFB74D,#F38B0A)',display:'grid',placeItems:'center',flex:'0 0 auto'}}><Icon name="alert" size={18} color="#0E1116" /></span>
          <div><p style={{fontWeight:700,fontSize:'15px',color:'#FFB74D',margin:0}}>Ta boutique est fermée</p>
          <p style={{fontSize:'13px',color:'#C9B79E',margin:'4px 0 0'}}>2 formations en base, 0 publiée. Un visiteur ne peut rien acheter.</p></div>
        </div>
        <Button style={{marginTop:'15px',background:'linear-gradient(135deg,#FFB74D,#F38B0A)',color:'#0E1116',boxShadow:'0 8px 24px rgba(243,139,10,.32)'}} onClick={()=>go('contenu')}>Publier une formation</Button>
      </GlassPanel>
      <CEyebrow style={{'--i':3,marginTop:'22px'}}>Relevé du 30/08 · 09:12</CEyebrow>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'10px'}}>
        <div className="rv" style={{'--i':4}}><StatTile dark label="Encaissé" value="0 F" foot="1 transaction en attente" /></div>
        <div className="rv" style={{'--i':5}}><StatTile dark label="Comptes" value="5" foot="dernier : 10 mars" /></div>
        <div className="rv" style={{'--i':6}}><StatTile dark label="Inscriptions" value="2" foot="progression 0 %" /></div>
        <div className="rv" style={{'--i':7}}><StatTile dark label="Certificats" value="0" foot="depuis l'origine" /></div>
      </div>
      <p className="rv" style={{'--i':8,fontSize:'11.5px',color:'#7C8896',marginTop:'12px'}}>Chaque case porte sa date de relevé. Une case sans date affiche « non relevé », jamais une estimation.</p>
      <CEyebrow style={{'--i':9,marginTop:'22px'}}>À traiter</CEyebrow>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':10,marginTop:'10px'}}>
        <LessonRow icon={<Icon name="doc" size={14} color="#F38B0A" />} iconBackground="rgba(243,139,10,.2)" title="1 prospect TPE non qualifié" meta="« nouveau » depuis le 6 août" trailing={<Icon name="forward" size={15} color="#7C8896" strokeWidth={2.4} />} />
        <LessonRow icon={<Icon name="doc" size={14} color="#8FD8FF" />} iconBackground="rgba(0,87,188,.28)" title="47 articles en brouillon" meta="46 publiés sur 93" trailing={<Icon name="forward" size={15} color="#7C8896" strokeWidth={2.4} />} />
        <LessonRow icon={<Icon name="alert" size={14} color="#FF8A80" />} iconBackground="rgba(180,35,31,.28)" title="7 chiffres non sourcés en façade" meta="contredits par la base — D-03" trailing={<Icon name="forward" size={15} color="#7C8896" strokeWidth={2.4} />} last />
      </GlassPanel>
    </ConsoleScreen>
  );
}

function Contenu({go}){
  return (
    <ConsoleScreen title="Contenu" sub="Console · 19 écrans" nav={other('contenu')} go={go}>
      <div className="rv"><Pipeline active="brouillon" stages={['tout','publié','brouillon','planifié']} /></div>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':2,marginTop:'14px'}}>
        <LessonRow icon={<Icon name="book" size={14} color="#FFB24D" />} iconBackground="rgba(255,178,77,.2)" title="Référencement local pour ton commerce" meta="formation · 6 modules · non publiée" trailing={<Tag tone="warn">brouillon</Tag>} />
        <LessonRow icon={<Icon name="book" size={14} color="#FFB24D" />} iconBackground="rgba(255,178,77,.2)" title="L'IA au service de ta prospection" meta="formation · 9 modules · non publiée" trailing={<Tag tone="warn">brouillon</Tag>} />
        <LessonRow icon={<Icon name="doc" size={14} color="#8FD8FF" />} iconBackground="rgba(0,87,188,.28)" title="Pourquoi ta boutique n'apparaît pas…" meta="article · 12 août" trailing={<Tag tone="ok">publié</Tag>} />
        <LessonRow icon={<Icon name="doc" size={14} color="#8FD8FF" />} iconBackground="rgba(0,87,188,.28)" title="Les trois requêtes qui amènent des clients" meta="article · 2 août" trailing={<Tag tone="ok">publié</Tag>} last />
      </GlassPanel>
      <p className="rv" style={{'--i':3,fontSize:'11.5px',color:'#7C8896',marginTop:'12px'}}>47 brouillons sur 93. Le catalogue vide est le seul obstacle strictement bloquant du produit, et il ne demande ni développement ni décision.</p>
      <CEyebrow style={{'--i':4,marginTop:'22px'}}>Publier une formation</CEyebrow>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':5,marginTop:'10px'}}>
        <DocLine label="Prix courant" value="95 000 F" />
        <DocLine label="Prix promotionnel" value="—" />
        <DocLine label="Modules · leçons" value="6 · 47" />
        <DocLine label="Statut" value="brouillon" last />
        <Button style={{marginTop:'15px',background:'#ECF0F5',color:'#0B0E13'}}>Publier maintenant</Button>
        <p style={{fontSize:'11.5px',color:'#7C8896',marginTop:'10px'}}>Seule une formation publiée apparaît au catalogue. Le prix promotionnel, quand il existe, prime — dans l'affichage comme au débit.</p>
      </GlassPanel>
    </ConsoleScreen>
  );
}

function Transactions({go}){
  return (
    <ConsoleScreen title="Transactions" sub="Console · réconciliation" nav={other('transactions')} go={go}>
      <div className="rv"><Pipeline active="en attente" stages={['tout','complété','en attente','échoué','remboursé']} /></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px',marginTop:'14px'}}>
        <div className="rv" style={{'--i':2}}><StatTile dark label="Encaissé" value="0 F" foot="relevé du 30/08" /></div>
        <div className="rv" style={{'--i':3}}><StatTile dark label="En attente" value="1" foot="date non récupérée" /></div>
      </div>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':4,marginTop:'14px'}}>
        <LessonRow icon={<Icon name="card" size={14} color="#FFB24D" />} iconBackground="rgba(255,178,77,.2)" title="MM-2K6-4831" meta="Wave · 80 750 F · référencement local" trailing={<Tag tone="warn">en attente</Tag>} last />
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':5,marginTop:'14px'}}>
        <CEyebrow style={{margin:0}}>Ce que l'écran ne fait pas</CEyebrow>
        <p style={{fontSize:'13px',color:'#A2ADBB',margin:'6px 0 0'}}>Il réconcilie, et rien d'autre. Le webhook dédoublonne par identifiant de charge et applique ses effets avant de marquer la transaction terminée : aucune action manuelle ne doit contourner cet ordre.</p>
      </GlassPanel>
      <p className="rv" style={{'--i':6,fontSize:'11.5px',color:'#7C8896',marginTop:'12px'}}>Il n'existe aucun écran d'historique côté apprenant (FR-021) : un acheteur ne peut pas consulter ses propres paiements.</p>
    </ConsoleScreen>
  );
}

function Prospects({go}){
  return (
    <ConsoleScreen title="Prospects TPE" sub="Console · rôle support" nav={other('prospects')} go={go}>
      <div className="rv"><Pipeline active="nouveau" stages={['nouveau','qualifié','devisé','signé','perdu']} /></div>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':2,marginTop:'14px'}}>
        <LessonRow icon={<Icon name="user" size={14} color="#3FD9C6" />} iconBackground="rgba(63,217,198,.2)" title="Boutique de cosmétiques · Almadies" meta="6 août · pack Visible · 250 000 F" trailing={<Tag tone="warn">nouveau</Tag>} last />
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':3,marginTop:'14px'}}>
        <CEyebrow style={{margin:0}}>Devis émis</CEyebrow>
        <DocLine label="Pack" value="Visible" />
        <DocLine label="Montant" value="250 000 F" />
        <DocLine label="Validité" value="30 jours" last />
        <p style={{fontSize:'11.5px',color:'#7C8896',marginTop:'10px'}}>La collection de devis ne contient aucune donnée personnelle, et les règles l'imposent. Passé sa validité, l'URL ne résout plus ; le prospect, lui, reste au suivi.</p>
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':4,marginTop:'14px'}}>
        <CEyebrow style={{margin:0}}>Demandes agence</CEyebrow>
        <p style={{fontFamily:'var(--f-mono)',fontWeight:700,fontSize:'27px',margin:'4px 0 0'}}>0</p>
        <p style={{fontSize:'12.5px',color:'#A2ADBB',margin:0}}>Collection distincte, schémas volontairement non fusionnés : deux cycles de vente qui n'ont ni la même durée ni le même interlocuteur.</p>
      </GlassPanel>
    </ConsoleScreen>
  );
}

function Support({go}){
  return (
    <ConsoleScreen title="Boîte de support" sub="Console · rôle support" nav={other('support')} go={go}>
      <div className="rv"><Pipeline active="messages" stages={['messages','témoignages','rendez-vous','projets']} /></div>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':2,marginTop:'14px'}}>
        <LessonRow icon={<Icon name="comment" size={14} color="#8FD8FF" />} iconBackground="rgba(0,87,188,.28)" title="Aucun message" meta="0 depuis l'origine" last />
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':3,marginTop:'14px'}}>
        <CEyebrow style={{margin:0}}>Le rôle support atteint exactement cinq écrans</CEyebrow>
        <p style={{fontSize:'13px',color:'#A2ADBB',margin:'6px 0 0'}}>Messages, témoignages, rendez-vous, prospects, projets. Toute autre URL d'administration renvoie vers /403. Le périmètre est déclaré une seule fois, et lu à la fois par le menu et par le garde de route.</p>
      </GlassPanel>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':4,marginTop:'14px'}}>
        <CEyebrow style={{margin:0}}>Un message anonyme reste anonyme</CEyebrow>
        <p style={{fontSize:'13px',color:'#A2ADBB',margin:'6px 0 0'}}>Un message envoyé depuis un compte connecté doit apparaître dans la boîte de son auteur — ce n'est pas encore le cas (FR-107).</p>
      </GlassPanel>
    </ConsoleScreen>
  );
}

function Audit({go}){
  return (
    <ConsoleScreen title="Quotas & audit" sub="Console · traçabilité" nav={other('audit')} go={go}>
      <CEyebrow>Quota de répétiteur d'un compte</CEyebrow>
      <GlassPanel level="night" padding={18} className="rv" style={{'--i':2,marginTop:'10px'}}>
        <p style={{fontWeight:600,fontSize:'14.5px',margin:0}}>aissatou@exemple.sn</p>
        <QuotaMeter used={3} total={5} label="3 / 5 aujourd'hui · membre du Club" style={{marginTop:'10px'}} />
        <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
          <Button size="sm" tone="quiet" style={{flex:1}}>+ 10 requêtes</Button>
          <Button size="sm" style={{flex:1,background:'#ECF0F5',color:'#0B0E13'}}>Appliquer</Button>
        </div>
        <p style={{fontSize:'11.5px',color:'#7C8896',marginTop:'10px'}}>Tout ajustement laisse une trace d'audit.</p>
      </GlassPanel>
      <CEyebrow style={{'--i':3,marginTop:'22px'}}>Journal d'audit · immuable</CEyebrow>
      <GlassPanel level="night" padding="4px 18px" className="rv" style={{'--i':4,marginTop:'10px'}}>
        <LessonRow icon={<Icon name="lock" size={14} color="#3FD9C6" />} iconBackground="rgba(63,217,198,.2)" title="Création de compte" meta="fonction serveur · tracée" />
        <LessonRow icon={<Icon name="lock" size={14} color="#3FD9C6" />} iconBackground="rgba(63,217,198,.2)" title="Gestion d'inscription" meta="fonction serveur · tracée" />
        <LessonRow icon={<Icon name="lock" size={14} color="#3FD9C6" />} iconBackground="rgba(63,217,198,.2)" title="Ajustement de quota de répétiteur" meta="fonction serveur · tracée" />
        <LessonRow icon={<Icon name="lock" size={14} color="#3FD9C6" />} iconBackground="rgba(63,217,198,.2)" title="Émission de certificat" meta="fonction serveur · tracée" />
        <LessonRow icon={<Icon name="alert" size={14} color="#FF8A80" />} iconBackground="rgba(180,35,31,.28)" title="Écritures directes depuis le navigateur" meta="non tracées — FR-092" trailing={<Tag tone="stop">dette</Tag>} last />
      </GlassPanel>
      <p className="rv" style={{'--i':5,fontSize:'11.5px',color:'#7C8896',marginTop:'12px'}}>La collection est fermée en écriture au client, y compris aux administrateurs : un journal auquel le sujet de l'audit peut écrire ne vaut rien.</p>
    </ConsoleScreen>
  );
}

const MM_EXPORT = {Bord,Contenu,Transactions,Prospects,Support,Audit};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('Screens.js');
