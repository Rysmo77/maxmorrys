const { GlassPanel, Button, Field, DocLine, Tag, Avatar, Icon, IconButton, PillButton } = window.DS;

/* ── 1 · À PROPOS ── Aucun portrait généré par IA : l'emplacement est déclaré. */
function Apropos({go}){
  return (
    <Screen territory="informe" bar={<AppBar left={<PillButton>Menu</PillButton>} />}>
      <Eyebrow>Je suis Max-Morrys</Eyebrow>
      <Display size="sm" lines={['UNE PERSONNE,','PAS UNE ÉQUIPE.']} style={{marginTop:'6px'}} />
      <div className="rv-s" style={{'--i':4,height:'200px',borderRadius:'var(--r-media)',marginTop:'18px',
        background:'linear-gradient(150deg,#FFDCA8,#FFC9CE 55%,#DFD0FF)',display:'flex',alignItems:'flex-end',padding:'16px',
        boxShadow:'0 14px 34px rgba(243,139,10,.2)'}}>
        <Tag style={{background:'rgba(255,255,255,.86)',color:'#0E1116'}}>Photographie à faire</Tag>
      </div>
      <div className="rv mm-prose" style={{'--i':5,marginTop:'18px',color:'#21272F'}}>
        <p style={{margin:'0 0 15px'}}>Je m'appelle Max-Morrys Eyoum. J'opère cette plateforme depuis Dakar, sous MY ONOMA SARL, et je l'opère seul : j'écris les articles, je monte les formations, je modère le Club, je réponds aux messages.</p>
        <p style={{margin:0}}>C'est une contrainte, et je préfère l'écrire que la masquer. Elle explique pourquoi tout ici est plafonné — le quota du répétiteur, le nombre de places en atelier, le rythme de publication. Rien n'est illimité parce que rien ne peut l'être.</p>
      </div>
      <GlassPanel level="flat" padding={20} className="rv" style={{'--i':6,marginTop:'20px'}}>
        <Eyebrow style={{marginBottom:'9px'}}>MY ONOMA SARL</Eyebrow>
        <DocLine label="Immatriculée" value="11/04/2022" />
        <DocLine label="Siège" value="Dakar, Sénégal" />
        <DocLine label="Piliers" value="BUILD · GROW · OWN" last />
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':7,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Ce que cette page ne dira pas</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Ni un nombre d'élèves, ni un chiffre d'affaires, ni des années d'expérience arrondies. La plateforme a six mois et vient d'ouvrir — c'est plus facile à défendre qu'un chiffre qu'on vérifie en trente secondes.</p>
      </GlassPanel>
    </Screen>
  );
}

/* ── 2 · CONTACTE-MOI ── FR-107 : le rattachement au compte est la correction visible. */
function Contact({go}){
  return (
    <Screen territory="informe" bar={<AppBar left={<BackButton onClick={()=>go&&go('apropos')} />} />}>
      <Display size="sm" lines={['Écris-moi.','Je réponds.']} style={{marginTop:'10px'}} />
      <Lede style={{'--i':3,marginTop:'11px'}}>Une question sur une formation, un problème de paiement, une idée. C'est moi qui lis.</Lede>
      <GlassPanel level="hero" padding={22} className="rv" style={{'--i':4,marginTop:'20px'}}>
        <GlassPanel level="flat" padding={13} style={{display:'flex',gap:'11px',alignItems:'center',marginBottom:'6px'}}>
          <Avatar initials="A" size={34} />
          <div style={{flex:1}}>
            <p style={{fontSize:'13px',fontWeight:600,margin:0}}>Tu écris depuis ton compte</p>
            <p style={{fontSize:'11.5px',color:'var(--text-muted)',margin:0}}>Ta réponse arrivera dans ton espace.</p>
          </div>
          <Icon name="check" size={15} color="#0F7B52" strokeWidth={3.2} />
        </GlassPanel>
        <Field label="Sujet" value="Un problème de paiement" trailing={<Icon name="forward" size={16} color="#98A1AE" strokeWidth={2.4} />} />
        <Field label="Ton message" placeholder="Dis-moi tout. Trois lignes suffisent." multiline />
        <Button tone="informe" style={{marginTop:'17px'}}>Envoyer mon message</Button>
        <p style={{fontSize:'11.5px',color:'var(--text-faint)',textAlign:'center',margin:'10px 0 0'}}>Tu peux aussi écrire sans compte — mais je ne pourrai pas te répondre dans l'application.</p>
      </GlassPanel>
      <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'16px'}}>
        <Eyebrow style={{marginBottom:'6px'}}>Pourquoi cette carte est en tête</Eyebrow>
        <p style={{fontSize:'12.5px',color:'var(--text-muted)',lineHeight:1.5,margin:0}}>Aujourd'hui un message envoyé depuis un compte connecté n'est pas rattaché à son auteur : il n'apparaît jamais dans sa boîte, et la réponse part dans le vide. Les messages anonymes restent possibles, et restent anonymes.</p>
      </GlassPanel>
    </Screen>
  );
}

const MM_EXPORT = {Apropos,Contact};
Object.assign(window, MM_EXPORT);
/* Registre PROPRE au kit applicatif (390 px). Le kit site publie dans MMSITE :
   Accueil, Article et Media portent les mêmes noms des deux côtés. */
window.MMAPP = Object.assign(window.MMAPP||{}, MM_EXPORT);
(window.MMSIGN = window.MMSIGN || []).push('ScreensApropos.js');
