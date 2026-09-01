const { GlassPanel, Button, ChipRow, Tag, PriceBlock, LessonRow, CheckLine, Icon, Breadcrumb } = window.DS;

/* ── /formations — le catalogue.
   Aucune note, aucun compteur d'inscrits : la plateforme vient d'ouvrir (FR-014, FR-073, FR-106). ── */
function Formations({go}){
  return (
    <Page territory="forme" go={go} active="Je te forme">
      <SiteEyebrow>Je te forme</SiteEyebrow>
      <SiteDisplay size={52} lines={['Deux formations.','Accès à vie.']} />
      <p className="rv" style={{'--i':3,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'56ch',marginTop:'14px'}}>Le module d'ouverture de chacune est en accès libre : tu juges avant de payer. Le certificat porte un code que n'importe qui peut vérifier sans compte.</p>
      <div className="rv" style={{'--i':4,display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px',marginTop:'26px'}}>
        <div style={{maxWidth:'420px'}}><ChipRow options={['Tout · 2','Débutant · 1','Avancé · 1']} /></div>
        <span style={{fontSize:'11.5px',color:'var(--text-faint)'}}>Trié par date de publication</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginTop:'20px'}}>
        <div className="rv" style={{'--i':5}} onClick={()=>go&&go('fiche')}>
          <TerritoryCard stacked={false} territory="forme" meta="SEO · 6 modules · 47 leçons · débutant" title="Référencement local pour ton commerce">
            <p style={{fontSize:'14px',color:'var(--card-ink-2)',lineHeight:1.5,margin:'10px 0 0'}}>Faire remonter ta fiche Google quand quelqu'un cherche ce que tu vends, dans ton quartier.</p>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'22px'}}>
              <PriceBlock amount="95 000" size={27} note={<>ou <b className="mm-num">3 × 31 700</b></>} />
              <Button tone="primary" size="sm">Voir la formation</Button>
            </div>
          </TerritoryCard>
        </div>
        <div className="rv" style={{'--i':6}}>
          <TerritoryCard stacked={false} territory="transforme" meta="IA · 9 modules · 68 leçons · avancé" title="L'IA au service de ta prospection">
            <p style={{fontSize:'14px',color:'var(--card-ink-2)',lineHeight:1.5,margin:'10px 0 0'}}>Écrire, relancer et qualifier plus vite, sans envoyer des messages qui sentent la machine.</p>
            <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:'12px',marginTop:'22px'}}>
              <PriceBlock amount="200 000" size={27} note={<>ou <b className="mm-num">4 × 50 000</b></>} />
              <Button tone="primary" size="sm">Voir la formation</Button>
            </div>
          </TerritoryCard>
        </div>
      </div>
      <SiteBand style={{marginTop:'44px'}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'34px',alignItems:'center'}}>
          <div>
            <SiteDisplay size={34} lines={["Pourquoi il n'y a que deux titres."]} />
            <p className="rv" style={{'--i':2,fontSize:'15.5px',color:'var(--text-muted)',lineHeight:1.6,maxWidth:'44ch',marginTop:'12px'}}>Je préfère deux formations que je tiens à jour à un catalogue qui fait nombre. Chacune est retravaillée quand le sujet bouge, et tu gardes l'accès à la version corrigée sans repayer.</p>
          </div>
          <GlassPanel level="flat" padding={24} className="rv" style={{'--i':3}}>
            <SiteEyebrow style={{margin:0}}>Ce que comprend chaque formation</SiteEyebrow>
            <div style={{marginTop:'12px'}}>
              <CheckLine tone="ok">L'accès à vie, mises à jour comprises</CheckLine>
              <CheckLine tone="ok">Un certificat au code vérifiable publiquement</CheckLine>
              <CheckLine tone="ok">Les exercices et fichiers, téléchargeables</CheckLine>
              <CheckLine tone="ok"><b className="mm-num">14</b> jours pour changer d'avis</CheckLine>
            </div>
          </GlassPanel>
        </div>
      </SiteBand>
    </Page>
  );
}

/* ── /formations/referencement-local — la fiche.
   La carte de prix est COLLANTE : le prix reste à l'écran pendant qu'on lit le programme. ── */
function FicheFormation({go}){
  const cadenas = <Icon name="lock" size={14} color="#5A6472" strokeWidth={2.4} />;
  const modules = [
    ['Pourquoi ta boutique est invisible','4 leçons · 22 min',true],
    ['Ta fiche Google, pas à pas','11 leçons · 1 h 08',false],
    ['Les mots que tapent tes clients','9 leçons · 54 min',false],
    ['Les avis, sans en acheter','8 leçons · 46 min',false],
    ['Ton quartier, tes concurrents','8 leçons · 51 min',false],
    ['Mesurer sans se mentir','7 leçons · 41 min',false]
  ];
  return (
    <Page territory="forme" go={go} active="Je te forme">
      <Breadcrumb items={['Je te forme','SEO']} />
      <div style={{display:'grid',gridTemplateColumns:'1.1fr .9fr',gap:'44px',alignItems:'start',marginTop:'14px'}}>
        <div>
          <SiteDisplay size={48} lines={['Référencement local pour ton commerce']} />
          <p className="rv" style={{'--i':3,fontSize:'16px',color:'var(--text-muted)',lineHeight:1.55,maxWidth:'48ch',marginTop:'14px'}}>Faire remonter ta fiche Google quand quelqu'un cherche ce que tu vends, dans ton quartier. Sans budget publicitaire, sans agence.</p>
          <div className="rv-s" style={{'--i':4,height:'210px',borderRadius:'26px',marginTop:'20px',
            background:'linear-gradient(140deg,#0057BC,#6C23DD 58%,#F38B0A)',display:'flex',alignItems:'flex-end',padding:'16px',
            boxShadow:'0 16px 38px rgba(0,87,188,.26)'}}>
            <Tag style={{background:'rgba(255,255,255,.9)',color:'#0E1116'}}>Aperçu · 4 min gratuit</Tag>
          </div>
          <SiteEyebrow style={{'--i':5,marginTop:'28px'}}>Le programme</SiteEyebrow>
          <GlassPanel level="flat" padding="6px 22px" className="rv" style={{'--i':5,marginTop:'10px'}}>
            {modules.map(([t,m,libre],i)=>(
              <LessonRow key={t} state="plain" title={t} meta={m} last={i===modules.length-1}
                icon={libre ? <Icon name="play" size={13} color="#fff" /> : cadenas}
                iconBackground={libre ? 'linear-gradient(135deg,#0057BC,#6C23DD)' : undefined}
                trailing={libre ? <Tag tone="ok">Gratuit</Tag> : null} />
            ))}
          </GlassPanel>
        </div>
        <div>
          <GlassPanel level="hero" padding={26} className="rv" style={{'--i':4,position:'sticky',top:'20px'}}>
            <PriceBlock amount="95 000" size={36} note={<>Une fois, accès à vie · ou <b className="mm-num">3 × 31 700</b> sans frais</>} />
            <Button tone="forme" style={{marginTop:'17px'}}>Je m'inscris</Button>
            <Button tone="quiet" fullWidth style={{marginTop:'10px'}}>Commencer le module gratuit</Button>
            <div style={{height:'1px',background:'var(--border-hair)',margin:'20px 0'}} />
            <CheckLine tone="ok" style={{marginTop:0,fontSize:'13.5px'}}><b className="mm-num">14</b> jours pour changer d'avis</CheckLine>
            <CheckLine tone="ok" style={{fontSize:'13.5px'}}>Wave, Orange Money, carte</CheckLine>
            <CheckLine tone="ok" style={{fontSize:'13.5px'}}>Certificat vérifiable publiquement</CheckLine>
          </GlassPanel>
          <GlassPanel level="truth" className="rv" style={{'--i':5,marginTop:'14px'}}>
            <SiteEyebrow style={{margin:'0 0 7px'}}>Ce que je peux te prouver</SiteEyebrow>
            <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.55,margin:0}}><b className="mm-num" style={{color:'var(--ink)'}}>47</b> leçons, <b className="mm-num" style={{color:'var(--ink)'}}>6</b> modules, <b className="mm-num" style={{color:'var(--ink)'}}>4 h 42</b> de vidéo, un certificat dont le code se vérifie sans compte. Je n'affiche ni note ni nombre d'inscrits : la plateforme vient d'ouvrir, je n'ai rien d'honnête à en dire.</p>
          </GlassPanel>
        </div>
      </div>

      <SiteBand style={{marginTop:'44px'}}>
        <SiteDisplay size={34} lines={["Pour qui c'est fait."]} />
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px',marginTop:'22px'}}>
          <GlassPanel level="flat" padding={24} className="rv" style={{'--i':1}}>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:0}}>Tu es au bon endroit si…</p>
            <CheckLine tone="ok">Tu as un commerce, un salon, un atelier, un cabinet</CheckLine>
            <CheckLine tone="ok">Tes clients viennent surtout du bouche-à-oreille</CheckLine>
            <CheckLine tone="ok">Tu veux le faire toi-même plutôt que payer chaque mois</CheckLine>
          </GlassPanel>
          <GlassPanel level="flat" padding={24} className="rv" style={{'--i':2}}>
            <p style={{fontFamily:'var(--f-display)',fontWeight:900,fontSize:'19px',letterSpacing:'-.03em',margin:0}}>Autre chose si…</p>
            <CheckLine tone="neutre" dash>Tu veux qu'on le fasse à ta place → <b style={{color:'var(--mm-teal-t)'}}>Je te digitalise</b></CheckLine>
            <CheckLine tone="neutre" dash>Tu vends en ligne uniquement, sans adresse physique — le local ne te servira pas</CheckLine>
            <CheckLine tone="neutre" dash>Tu cherches juste à te tenir au courant → <b style={{color:'var(--mm-orange-t)'}}>le blog</b>, gratuit</CheckLine>
          </GlassPanel>
        </div>
      </SiteBand>

      <div style={{marginTop:'44px'}}>
        <SiteDisplay size={34} lines={["Les questions avant d'acheter"]} />
        <GlassPanel level="flat" padding="8px 26px" className="rv" style={{'--i':2,marginTop:'20px'}}>
          {[["L'accès est vraiment à vie ?",<>Oui. Une fois payée, la formation reste dans ton espace, mises à jour comprises. Il n'y a pas d'abonnement caché derrière.</>],
            ['Je peux payer en trois fois ?',<>Oui, <b className="mm-num">3 × 31 700 FCFA</b> sans frais, par Wave ou Orange Money. L'accès s'ouvre dès la première échéance.</>],
            ["Et si ça ne me convient pas ?",<>Tu as <b className="mm-num">14</b> jours. Écris-moi, je rembourse — et si tu me dis pourquoi, ça m'aide à corriger.</>]].map(([q,r],i)=>(
            <div key={i} style={{padding:'16px 0',borderTop:i?'1px solid var(--border-hair)':0}}>
              <p style={{fontWeight:700,fontSize:'14.5px',margin:0}}>{q}</p>
              <p style={{fontSize:'13.5px',color:'var(--text-muted)',lineHeight:1.6,margin:'6px 0 0'}}>{r}</p>
            </div>
          ))}
        </GlassPanel>
      </div>
    </Page>
  );
}

const MM_EXPORT = {Formations,FicheFormation};
Object.assign(window, MM_EXPORT);
window.MMSITE = Object.assign(window.MMSITE||{}, MM_EXPORT);
