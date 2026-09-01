const { GlassPanel, Button, ChipRow, Tag, Field, LessonRow, Avatar, SearchPill, Icon, DocLine } = window.DS;

const chevron = <Icon name="forward" size={15} color="#98A1AE" strokeWidth={2.4} />;

/* ── /faq — une page PAR question, pas un index accordéon.
   Aujourd'hui la FAQ n'a qu'un index : aucune question n'a d'URL partageable. ── */
function Faq({go}){
  const bloc = (titre, questions, i) => (
    <React.Fragment>
      <SiteEyebrow style={{'--i':i,marginTop:'22px'}}>{titre}</SiteEyebrow>
      <GlassPanel level="flat" padding="6px 22px" className="rv" style={{'--i':i,marginTop:'10px'}}>
        {questions.map((q,j)=>(
          <LessonRow key={q} state="plain" title={<b style={{fontWeight:600}}>{q}</b>} last={j===questions.length-1} trailing={chevron} />
        ))}
      </GlassPanel>
    </React.Fragment>
  );
  return (
    <Page territory="informe" go={go} active="Je t'informe">
      <SiteDisplay size={50} lines={['Questions fréquentes']} />
      <p className="rv" style={{'--i':2,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'54ch',marginTop:'12px'}}>Chaque question a sa propre page : tu peux en envoyer une seule à quelqu'un, et elle ressort en recherche.</p>
      <div className="rv" style={{'--i':3,marginTop:'22px',maxWidth:'520px'}}>
        <SearchPill icon={<Icon name="search" size={17} strokeWidth={2.4} />} label="CHERCHE " hint="UNE QUESTION" />
      </div>
      <div className="rv" style={{'--i':4,marginTop:'18px',maxWidth:'620px'}}>
        <ChipRow options={['Tout','Paiement','Formations','Le Club','Compte','Services']} />
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px',marginTop:'10px'}}>
        <div>
          {bloc('Paiement',['Quels moyens de paiement acceptes-tu ?','Est-ce que je peux payer en plusieurs fois ?','Puis-je me faire rembourser ?',"J'ai payé et je ne vois rien, que faire ?"],5)}
          {bloc('Formations',["L'accès est-il vraiment à vie ?",'Le certificat vaut-il quelque chose ?','Puis-je suivre une formation hors connexion ?'],6)}
        </div>
        <div>
          {bloc('Le Club',['Combien de membres y a-t-il ?',"Que se passe-t-il à l'échéance ?",'Le Club est-il visitable avant de payer ?'],5)}
          <GlassPanel level="hero" padding={24} className="rv" style={{'--i':7,marginTop:'22px'}}>
            <SiteEyebrow style={{margin:0}}>Tu ne trouves pas ?</SiteEyebrow>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:'7px 0 0'}}>Pose-la-moi directement.</p>
            <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>Si la question revient, elle finit ici. C'est comme ça que cette page s'écrit.</p>
            <Button tone="primary" style={{marginTop:'15px'}} onClick={()=>go&&go('contact')}>Contacte-moi</Button>
          </GlassPanel>
        </div>
      </div>
      <GlassPanel level="truth" className="rv" style={{'--i':8,marginTop:'24px',maxWidth:'76ch'}}>
        <SiteEyebrow style={{margin:'0 0 6px'}}>Une question mérite d'être lue en entier</SiteEyebrow>
        <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>« Combien de membres y a-t-il dans le Club ? » a sa page, et la réponse commence par : <b style={{color:'var(--ink)'}}>« Je ne te le dirai pas, parce que le chiffre serait faux. »</b> Une FAQ qui esquive ses questions gênantes ne sert à personne.</p>
      </GlassPanel>
    </Page>
  );
}

/* ── /contact — le formulaire trie AVANT d'écrire : espace, FAQ, ou agence. ── */
function Contact({go}){
  const alerte = <Icon name="alert" size={11} color="#8A4B00" strokeWidth={3} />;
  return (
    <Page territory="informe" go={go} active="Je t'informe">
      <div style={{display:'grid',gridTemplateColumns:'.95fr 1.05fr',gap:'44px',alignItems:'start'}}>
        <div>
          <SiteDisplay size={52} lines={['Écris-moi.','Je réponds.']} />
          <p className="rv" style={{'--i':3,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'40ch',marginTop:'14px'}}>Une question sur une formation, un problème de paiement, une idée d'épisode. C'est moi qui lis, et c'est moi qui réponds — comptez deux jours ouvrés.</p>
          <GlassPanel level="flat" padding={22} className="rv" style={{'--i':4,marginTop:'22px'}}>
            <SiteEyebrow style={{margin:0}}>Avant d'écrire</SiteEyebrow>
            <div style={{display:'flex',gap:'11px',alignItems:'flex-start',marginTop:'12px',fontSize:'14px',lineHeight:1.5}}>
              <span style={{width:'22px',height:'22px',borderRadius:'50%',flex:'0 0 auto',marginTop:'1px',background:'rgba(243,139,10,.18)',display:'grid',placeItems:'center'}}>{alerte}</span>
              <span style={{color:'var(--text-muted)'}}>Un paiement qui n'apparaît pas ? Regarde d'abord <b style={{color:'var(--ink)'}}>Mes paiements</b> dans ton espace : la référence y est.</span>
            </div>
            <div style={{display:'flex',gap:'11px',alignItems:'flex-start',marginTop:'10px',fontSize:'14px',lineHeight:1.5}}>
              <span style={{width:'22px',height:'22px',borderRadius:'50%',flex:'0 0 auto',marginTop:'1px',background:'rgba(243,139,10,.18)',display:'grid',placeItems:'center'}}>{alerte}</span>
              <span style={{color:'var(--text-muted)'}}>Une question générale ? Elle est peut-être déjà dans la <b style={{color:'var(--ink)'}}>FAQ</b>, avec sa page.</span>
            </div>
          </GlassPanel>
          <GlassPanel level="flat" padding={22} className="rv" style={{'--i':5,marginTop:'14px'}}>
            <SiteEyebrow style={{margin:0}}>Pour un projet sur mesure</SiteEyebrow>
            <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.55,margin:'8px 0 0'}}>Ce formulaire n'est pas le bon. Passe par <b style={{color:'#B4231F'}}>Max-Morrys Agency</b> : le formulaire y demande le budget et le périmètre, ce qui évite trois allers-retours.</p>
          </GlassPanel>
        </div>
        <GlassPanel level="hero" padding={28} className="rv" style={{'--i':6}}>
          <GlassPanel level="flat" padding={14} style={{display:'flex',gap:'12px',alignItems:'center',marginBottom:'8px'}}>
            <Avatar initials="A" size={36} />
            <div style={{flex:1}}>
              <p style={{fontSize:'13.5px',fontWeight:600,margin:0}}>Tu écris depuis ton compte</p>
              <p style={{fontSize:'12px',color:'var(--text-muted)',margin:0}}>Ma réponse arrivera dans ton espace, et ce message restera dans ta boîte.</p>
            </div>
            <Icon name="check" size={15} color="#0F7B52" strokeWidth={3.2} />
          </GlassPanel>
          <Field label="De quoi veux-tu parler ?" placeholder="Choisis un sujet" trailing={<Icon name="chevron" size={15} color="#5A6472" strokeWidth={2.4} />} />
          <Field label="Ton message" state="focus" multiline value="Bonjour, j'ai payé hier par Wave mais je ne vois pas ma formation dans mon espace…" />
          <Button tone="forme" style={{marginTop:'18px'}}>Envoyer</Button>
          <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>Tu peux aussi écrire sans compte — mais je ne pourrai pas te répondre dans l'application.</p>
        </GlassPanel>
      </div>
      <SiteBand style={{marginTop:'44px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'16px'}}>
          {[['Réponse','≤ 48 h','Jours ouvrés, heure de Dakar',true],['Qui lit','Moi',"Il n'y a pas de service client",false],['Langues','FR · EN','Écris dans celle que tu préfères',false]].map(([e,v,n,mono],i)=>(
            <GlassPanel level="flat" key={e} padding={22} className="rv" style={{'--i':i}}>
              <SiteEyebrow style={{margin:0}}>{e}</SiteEyebrow>
              <p className={mono?'mm-num':undefined} style={{fontSize:mono?'26px':'20px',fontWeight:mono?undefined:700,margin:'5px 0 0'}}>{v}</p>
              <p style={{fontSize:'13px',color:'var(--text-muted)',margin:'4px 0 0'}}>{n}</p>
            </GlassPanel>
          ))}
        </div>
      </SiteBand>
    </Page>
  );
}

/* ── /verifier — sans compte, ton neutre : c'est l'employeur qui lit, pas l'apprenante. ── */
function Verifier({go}){
  return (
    <Page territory="forme" go={go}>
      <div style={{display:'grid',gridTemplateColumns:'.95fr 1.05fr',gap:'44px',alignItems:'center'}}>
        <div>
          <SiteDisplay size={50} lines={['Vérifier','un certificat']} />
          <p className="rv" style={{'--i':3,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'42ch',marginTop:'14px'}}>Colle le code figurant sur le document. Aucun compte n'est nécessaire, et rien n'est enregistré sur toi.</p>
          <GlassPanel level="flat" padding="0 18px" className="rv" style={{'--i':4,marginTop:'22px',height:'62px',display:'flex',alignItems:'center',gap:'12px'}}>
            <span className="mm-num" style={{fontSize:'15px',letterSpacing:'.05em'}}>MM-C7K4-9RTX-2081</span>
            <Button tone="primary" size="sm" style={{marginLeft:'auto'}}>Vérifier</Button>
          </GlassPanel>
          <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'20px',maxWidth:'46ch'}}>
            <SiteEyebrow style={{margin:'0 0 6px'}}>Ce que cette page ne permet pas</SiteEyebrow>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.6,margin:0}}>Elle ne liste pas les certificats émis, et ne remonte à aucun compte. Elle répond à un code, et à un seul. C'est ce qui la rend utilisable par un employeur sans exposer les titulaires.</p>
          </GlassPanel>
        </div>
        <GlassPanel level="hero" padding={30} className="rv" style={{'--i':6,borderColor:'rgba(15,123,82,.3)'}}>
          <div style={{display:'flex',gap:'13px',alignItems:'flex-start'}}>
            <span style={{width:'42px',height:'42px',borderRadius:'50%',background:'rgba(15,123,82,.16)',display:'grid',placeItems:'center',flex:'0 0 auto'}}>
              <Icon name="check" size={21} color="#0F7B52" strokeWidth={3.2} />
            </span>
            <div>
              <p style={{fontWeight:700,fontSize:'17px',color:'var(--ok)',margin:0}}>Certificat authentique</p>
              <p style={{fontSize:'13.5px',color:'var(--text-muted)',margin:'3px 0 0'}}>Émis par Max-Morrys, MY ONOMA SARL, Dakar.</p>
            </div>
          </div>
          <div style={{height:'1px',background:'var(--border-hair)',margin:'20px 0'}} />
          <DocLine label="Titulaire" value="Aïssatou Ndiaye" />
          <DocLine label="Formation" value="Référencement local" />
          <DocLine label="Émis le" value="12/09/2026" />
          <DocLine label="Leçons validées" value="47 / 47" />
          <DocLine label="Code" value="MM-C7K4-9RTX-2081" last />
        </GlassPanel>
      </div>
    </Page>
  );
}

/* ── /connexion — connexion et mot de passe oublié sur une seule page. ── */
function Connexion({go}){
  return (
    <Page territory="forme" go={go}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'40px',alignItems:'start'}}>
        <GlassPanel level="hero" padding={30} className="rv">
          <SiteDisplay size={36} lines={['Content de te revoir.']} />
          <Button tone="ghost" style={{marginTop:'22px'}}>
            <img src="../../assets/icons/google.svg" alt="" width="19" height="19" style={{display:'block'}} /> Continuer avec Google
          </Button>
          <div style={{display:'flex',alignItems:'center',gap:'12px',margin:'20px 0'}}>
            <span style={{flex:1,height:'1px',background:'var(--border-hair)'}} />
            <SiteEyebrow style={{margin:0}}>ou</SiteEyebrow>
            <span style={{flex:1,height:'1px',background:'var(--border-hair)'}} />
          </div>
          <Field label="Ton e-mail" placeholder="aissatou@exemple.sn" style={{marginTop:0}} />
          <Field label="Ton mot de passe" value="••••••••••" state="focus" trailing={<Icon name="eye" size={18} color="#5A6472" />} />
          <Button tone="forme" style={{marginTop:'18px'}}>Je me connecte</Button>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginTop:'14px'}}>
            <span style={{fontSize:'13px',color:'var(--text-muted)'}}>Mot de passe oublié ?</span>
            <span style={{fontSize:'13px',color:'var(--text-muted)'}}>Pas de compte ? <b style={{color:'var(--mm-bleu)'}}>Crée-le</b></span>
          </div>
        </GlassPanel>
        <div>
          <GlassPanel level="flat" padding={26} className="rv" style={{'--i':1}}>
            <SiteEyebrow style={{margin:0}}>Mot de passe oublié</SiteEyebrow>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:'8px 0 0'}}>On te remet dedans.</p>
            <Field label="Ton e-mail" placeholder="aissatou@exemple.sn" />
            <Button tone="primary" style={{marginTop:'16px'}}>Envoie-moi le lien</Button>
            <GlassPanel level="flat" padding={16} style={{marginTop:'16px',borderColor:'rgba(15,123,82,.28)'}}>
              <p style={{fontSize:'13.5px',fontWeight:600,color:'var(--ok)',margin:0}}>C'est parti</p>
              <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.5,margin:'4px 0 0'}}>Si un compte existe à cette adresse, le lien y est déjà. Il est valable une heure.</p>
            </GlassPanel>
            <GlassPanel level="truth" style={{marginTop:'14px'}}>
              <SiteEyebrow style={{margin:'0 0 6px'}}>Pourquoi ce « si »</SiteEyebrow>
              <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Je ne dirai jamais si une adresse a un compte. Ça paraît moins serviable, mais ça évite qu'un inconnu teste des adresses pour savoir qui est inscrit.</p>
            </GlassPanel>
          </GlassPanel>
          <GlassPanel level="truth" className="rv" style={{'--i':2,marginTop:'14px'}}>
            <SiteEyebrow style={{margin:'0 0 6px'}}>Les deux moyens mènent au même endroit</SiteEyebrow>
            <p style={{fontSize:'13px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}>Google ou e-mail : mêmes cours, même progression, mêmes certificats. Ce n'est pas deux comptes.</p>
          </GlassPanel>
        </div>
      </div>
    </Page>
  );
}

/* ── /cgv — le sommaire est collant, et l'encart orange nomme les clauses à réécrire. ── */
function Cgv({go}){
  const docs = ['Conditions générales','Confidentialité','Mentions légales','CGV Présence Digitale','CGV Agency'];
  const sections = [
    ['1. Qui vend','MY ONOMA SARL, société de droit sénégalais immatriculée le 11 avril 2022, siège à Dakar. La plateforme maxmorrys.me est exploitée sous la marque Max-Morrys.'],
    ['2. Ce que tu achètes',"Une formation donne un accès personnel et permanent à son contenu, mises à jour comprises. Un abonnement au Club donne un accès de douze mois à ses huit onglets. Un pack Présence Digitale est une prestation, encadrée par des conditions distinctes."],
    ['3. Prix et paiement','Les prix sont en francs CFA, toutes taxes comprises. Les moyens acceptés sont Wave, Orange Money et la carte bancaire. Le montant débité est celui recalculé par le serveur au moment du paiement, jamais celui transmis par ton navigateur.'],
    ['4. Rétractation',"Tu disposes de quatorze jours pour renoncer à une formation et en obtenir le remboursement intégral. Ce délai ne s'applique pas à l'abonnement au Club, dont l'accès est immédiat et complet."]
  ];
  return (
    <Page territory="forme" go={go}>
      <div style={{display:'grid',gridTemplateColumns:'250px 1fr',gap:'44px',alignItems:'start'}}>
        <div style={{position:'sticky',top:'20px'}}>
          <GlassPanel level="flat" padding={20} className="rv">
            <SiteEyebrow style={{margin:0}}>Documents</SiteEyebrow>
            <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'9px'}}>
              {docs.map((d,i)=><span key={d} style={{fontSize:'13.5px',fontWeight:i?400:700,color:i?'var(--text-muted)':'var(--text-body)'}}>{d}</span>)}
            </div>
          </GlassPanel>
          <p className="rv" style={{'--i':1,fontSize:'11.5px',color:'var(--text-faint)',lineHeight:1.6,marginTop:'12px'}}>Version du <b className="mm-num">30/08/2026</b>. Chaque modification est datée, et l'ancienne version reste consultable.</p>
        </div>
        <div>
          <SiteDisplay size={44} lines={['Conditions générales']} />
          <div className="rv mm-prose" style={{'--i':2,marginTop:'18px',color:'#21272F',maxWidth:'var(--measure-prose)'}}>
            <p style={{margin:'0 0 15px'}}>Ces conditions s'appliquent à toute commande passée sur maxmorrys.me. Elles sont écrites pour être lues, pas pour être opposées — si une clause te paraît obscure, écris-moi et je la réécris.</p>
            {sections.map(([t,c])=>(
              <React.Fragment key={t}>
                <h2 style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'21px',letterSpacing:'-.03em',lineHeight:1.1,margin:'24px 0 8px'}}>{t}</h2>
                <p style={{margin:0}}>{c}</p>
              </React.Fragment>
            ))}
          </div>
          <GlassPanel level="flat" padding={22} className="rv" style={{'--i':3,marginTop:'26px',borderColor:'rgba(243,139,10,.3)'}}>
            <SiteEyebrow style={{margin:0,color:'var(--mm-orange-t)'}}>Trois clauses à réécrire avant publication</SiteEyebrow>
            <p style={{fontSize:'14px',color:'var(--text-muted)',lineHeight:1.6,margin:'8px 0 0'}}>Le texte en production promet un <b style={{color:'var(--ink)'}}>renouvellement automatique avec préavis de quinze jours</b> que rien n'implémente, mentionne un moyen de paiement absent du tunnel, et invoque un objet social qui ne couvre pas toutes les lignes vendues. Un document contractuel qui promet ce que le produit ne fait pas est un risque, pas un détail de rédaction.</p>
          </GlassPanel>
        </div>
      </div>
    </Page>
  );
}

const MM_EXPORT = {Faq,Contact,Verifier,Connexion,Cgv};
Object.assign(window, MM_EXPORT);
window.MMSITE = Object.assign(window.MMSITE||{}, MM_EXPORT);
