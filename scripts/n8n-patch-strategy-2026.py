#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Applique la stratégie de contenu 2026 S2 aux workflows n8n.

Lit les exports de référence (`backups/n8n-cutover-20260709/`), remplace le code ou le prompt
des seuls nœuds concernés, et écrit les workflows patchés dans `n8n/strategy-2026/`.
Aucun appel réseau : l'import dans n8n reste une action manuelle du board.

    python3 scripts/n8n-patch-strategy-2026.py

Référence : docs/STRATEGIE_COMMUNICATION_2026.md
"""
import json
import os
import sys

# ⚠️ La base est le LIVE, pas les sauvegardes de juillet.
# Celles-ci sont antérieures à la migration Airtable → NocoDB du 2026-08-06 : les repatcher
# ramènerait quatre workflows sur Airtable, c'est-à-dire sur la copie gelée de rollback.
# `scripts/n8n-snapshot-live.py` rafraîchit cette base depuis l'API n8n.
SRC = "n8n/live"
DST = "n8n/strategy-2026"

# ─────────────────────────────────────────────────────────────────────────────
# WF-THEMES — le prompt qui propose les 4 thèmes du vendredi
# ─────────────────────────────────────────────────────────────────────────────
THEMES_BUILD = r"""const rows=$('THEMES — Récents').all().map(r=>r.json).filter(x=>x.Titre);
const base=$now.setZone('Africa/Dakar');
const du=((8-base.weekday)%7)||7;
const monday=base.plus({days:du}).startOf('day');
const sunday=monday.plus({days:7});
const semaine=monday.toFormat('dd LLL');
let targetCount=0;
for(const x of rows){const d=x.Date_Publication_Prevue;if(!d)continue;const dt=DateTime.fromISO(d);if(dt.isValid&&dt>=monday&&dt<sunday)targetCount++;}
const skip=targetCount>=5;
const recents=rows.map(x=>({t:x.Titre,d:x.Date_Publication_Prevue||''})).sort((a,b)=>(b.d>a.d?1:-1)).slice(0,25).map(x=>x.t);

// Fil rouge du mois — docs/STRATEGIE_COMMUNICATION_2026.md §11.
// Les 4 propositions doivent tenir DEDANS : c'est ce qui rend les semaines cumulatives
// au lieu de partir dans une direction différente chaque vendredi.
const FILS={
  8:"Être trouvé — SEO local, Google Maps, GEO/AEO (être cité par ChatGPT et Gemini), fiche d'établissement, avis clients",
  9:"Ton système, pas ton temps — automatisation, agents IA, calendrier éditorial, Canva, CapCut, prompts",
  10:"Vendre sans forcer — conversion, WhatsApp Business, catalogue, preuve sociale, storytelling, prix"
};
const fil=FILS[monday.month]||"(aucun fil rouge défini pour ce mois — propose 4 thèmes cohérents entre eux et signale-le au board)";

const prompt=`Tu es **CMO Aïcha**, directrice marketing de Max-Morrys.

La marque porte DEUX lignes, et tes thèmes doivent pouvoir servir les deux :
- **Piste A — apprenants** : formations, Club Digitos, Rysmo. Entrepreneurs, marketeurs, freelances,
  reconversions, en Afrique de l'Ouest francophone + diaspora. Canal porteur : Instagram.
- **Piste B — commerçants** : l'agence « Digital Commerce Local » (maxmorrys.me/agence). Commerces
  physiques de 1 à 15 salariés, CA mensuel 800 000 à 5 000 000 XOF, décideur joignable sur WhatsApp,
  à Dakar, Abidjan et Cotonou. Canal porteur : Facebook.
Le fil qui relie les deux : « Soit tu apprends à le faire, soit je le fais pour toi. »

FIL ROUGE DU MOIS (obligatoire) : ${fil}

Propose **4 thématiques éditoriales** distinctes pour la semaine du ${semaine}. Chacune doit :
- tenir DANS le fil rouge du mois ;
- pouvoir se décliner en 21 contenus (14 posts + 7 stories) sur Instagram, Facebook, LinkedIn et X ;
- offrir un angle pour la piste A ET un angle pour la piste B.

Contraintes :
- **Au moins 1 thème de la série RADAR** : une tendance marketing/IA/plateformes que tu DATES
  explicitement dans le champ « pourquoi » (mois et année au minimum). Une tendance non datée n'est
  pas une tendance, c'est une opinion — dans ce cas, ne la propose pas.
- **Au moins 1 thème qui sert directement la piste B** (visibilité locale, commandes WhatsApp,
  preuve chiffrée pour un commerçant).
- Aucun montant : les prix se lisent dans le catalogue, jamais de mémoire.
- Évite ces sujets déjà traités récemment : ${recents.join(' | ')}.

Réponds STRICTEMENT en JSON, sans texte autour :
{"themes":[{"titre":"court et accrocheur","angle":"1 phrase sur l'angle éditorial","pourquoi":"pourquoi ce thème maintenant — avec une date si c'est une tendance","pisteA":"ce que ça apporte aux apprenants","pisteB":"ce que ça apporte aux commerçants"}]}
— exactement 4 objets.`;
return [{json:{prompt,skip,targetCount,semaine,fil}}];"""

# ─────────────────────────────────────────────────────────────────────────────
# WF-TG-ROUTER — la grille des 21 créneaux + le prompt d'expansion
# ─────────────────────────────────────────────────────────────────────────────
TH_DECLINER = r"""// Grille hebdomadaire — docs/STRATEGIE_COMMUNICATION_2026.md §5 et §6.
// [jourOffset, heure, reseau, format, serie, cible] · lundi = 0 · Africa/Dakar.
// 14 posts + 7 stories quotidiennes à 12h = 21 créneaux.
// AUCUNE vidéo, AUCUN TikTok (décision board 2026-08-06) : la valeur `tiktok` reste dans le
// singleSelect Airtable, on ne la programme simplement plus.
const GRID=[
 [0, 9,'linkedin','post',          'RADAR',    'Mixte'],
 [0,12,'ig',      'story',         'CERCLE',   'Mixte'],
 [0,18,'ig',      'carrousel',     'ATELIER',  'Apprenants'],
 [1,10,'linkedin','carrousel',     'ATELIER',  'Mixte'],
 [1,12,'ig',      'story',         'COULISSES','Mixte'],
 [1,12,'fb',      'carrousel',     'PREUVE',   'Commerçants'],
 [1,19,'ig',      'carrousel',     'ATELIER',  'Apprenants'],
 [2, 9,'fb',      'post',          'OFFRE',    'Commerçants'],
 [2,12,'ig',      'story',         'ATELIER',  'Apprenants'],
 [2,18,'ig',      'post',          'COULISSES','Apprenants'],
 [3,11,'ig',      'carrousel',     'PREUVE',   'Apprenants'],
 [3,12,'ig',      'story',         'PREUVE',   'Mixte'],
 [3,18,'fb',      'community_post','CERCLE',   'Commerçants'],
 [4,10,'linkedin','post',          'COULISSES','Mixte'],
 [4,12,'ig',      'story',         'CERCLE',   'Mixte'],
 [4,17,'x',       'thread',        'RADAR',    'Mixte'],
 [5,11,'ig',      'carrousel',     'OFFRE',    'Apprenants'],
 [5,12,'ig',      'story',         'OFFRE',    'Mixte'],
 [5,18,'fb',      'post',          'OFFRE',    'Commerçants'],
 [6,10,'linkedin','post',          'CERCLE',   'Mixte'],
 [6,12,'ig',      'story',         'COULISSES','Mixte']
];
// L'expansion est désormais déclenchée par la validation du menu TENDANCES, pas par le clic sur
// le thème : on relit donc tout l'état depuis « Parse — Update ».
const o=$('Parse — Update').first().json;
const t=(o.pickTheme&&o.pickTheme.titre)?o.pickTheme:{titre:'Contenu de la semaine',angle:'',pourquoi:''};

function jparse(raw){try{const v=JSON.parse(raw||'[]');return Array.isArray(v)?v:[];}catch(e){return [];}}
function jpicked(raw,n){const seen={};const out=[];String(raw||'').split(',').forEach(function(p){const i=parseInt(p,10);if(!isFinite(i)||i<0||i>=n||seen[i])return;seen[i]=true;out.push(i);});return out.sort(function(a,b){return a-b;});}

const outilsAll=jparse(o.cfgToolsCur);
const outils=jpicked(o.cfgToolsPick,outilsAll.length).map(function(i){return outilsAll[i];}).filter(Boolean);
const tendAll=jparse(o.cfgTrendsCur);
const tendances=jpicked(o.cfgTrendsPick,tendAll.length).map(function(i){return tendAll[i];}).filter(Boolean);

const base=$now.setZone('Africa/Dakar');
const du=((8-base.weekday)%7)||7;
const monday=base.plus({days:du}).startOf('day');
const slots=GRID.map(g=>{const dt=monday.plus({days:g[0],hours:g[1]});return {jour:g[0],reseau:g[2],format:g[3],serie:g[4],cible:g[5],date:dt.toISO()};});

// Répartition des choix du board sur les créneaux concernés, en tourniquet : 4 créneaux ATELIER
// pour 1 à 3 outils, 2 créneaux RADAR pour 1 à 2 tendances.
let ia=0, ir=0;
slots.forEach(function(s){
  if(s.serie==='ATELIER'&&outils.length){ s.outil=outils[ia%outils.length]; ia++; }
  if(s.serie==='RADAR'&&tendances.length){ s.tendance=tendances[ir%tendances.length]; ir++; }
});

const N=slots.length;
const gridDesc=slots.map(function(s,i){
  let suffixe='';
  if(s.outil) suffixe=` — OUTIL IMPOSÉ : ${s.outil.nom}${s.outil.angle?' ('+s.outil.angle+')':''}`;
  if(s.tendance) suffixe=` — TENDANCE IMPOSÉE : ${s.tendance.titre}${s.tendance.date?' ['+s.tendance.date+']':''}`;
  return `${i+1}. ${s.reseau} / ${s.format} — série ${s.serie} — cible ${s.cible}${suffixe}`;
}).join('\n');
const outilsLabel=outils.length?outils.map(function(x){return x.nom;}).join(', '):'aucun';
const prompt=`Tu es **CMO Aïcha**, directrice marketing de Max-Morrys.

THÈME CHOISI : « ${t.titre} » — angle : ${t.angle||''}.

Décline ce thème en **exactement ${N} contenus** alignés sur ces ${N} créneaux. Respecte l'ordre, et
respecte le réseau, le format, la SÉRIE et la CIBLE imposés à chaque ligne :
${gridDesc}

⚠️ **Les créneaux marqués « OUTIL IMPOSÉ » ou « TENDANCE IMPOSÉE » ne se négocient pas** : le board
a choisi. Le titre doit porter cet outil-là, ou cette tendance-là. N'en substitue aucun.

LES SÉRIES (le rendez-vous éditorial — le titre doit refléter la série) :
- **RADAR** — une tendance chaude, DATÉE, et ce qu'elle change concrètement cette semaine.
- **ATELIER** — **un outil, un réglage, un gain.** L'outil est imposé créneau par créneau ci-dessus.
  Jamais « 15 astuces » : toujours UNE manipulation précise.
- **PREUVE** — chiffres, avant/après, étude de cas, « le vrai prix de… ».
- **COULISSES** — parcours, fabrication, chantier anonymisé, échec assumé. Toujours une leçon utile.
- **CERCLE** — sondage, question ouverte, mise en lumière d'un apprenant ou d'un commerçant.
- **OFFRE** — mise en avant explicite et assumée, un seul appel à l'action.

LES CIBLES :
- **Apprenants** — vocabulaire technique autorisé (SEO, IA, automatisation, tunnel).
- **Commerçants** — l'offre agence. **ZÉRO terme technique** : jamais « site web », « SEO »,
  « catalogue Meta », « GA4 », « workflow », « n8n ». On dit « être trouvé sur Google Maps »,
  « des produits commandables sur WhatsApp », « savoir ce que ça te rapporte ».
- **Mixte** — sert honnêtement les deux.

LES OFFRES (champ « offre ») :
- Sur un créneau **OFFRE**, choisis parmi : Formations · Club Digitos · Rysmo · Agence · Accompagnement.
- Sur **tout autre créneau**, mets « Non-produit ».
- Le créneau OFFRE du mercredi sur Facebook porte TOUJOURS « Agence ».

Style : tutoiement, phrases courtes, sans blabla, orienté action, résultats mesurables, touches
locales légères (Dakar, Abidjan, Douala, Wave, Orange Money, WhatsApp). Les stories posent UNE seule
idée. Le week-end, ton plus léger.

Aucun montant chiffré dans les titres : les prix se lisent dans le catalogue, jamais de mémoire.

Réponds STRICTEMENT en JSON, sans texte autour :
{"posts":[{"pilier":"Éducation|Inspiration|Produit|Communauté|Autorité","offre":"Formations|Club Digitos|Rysmo|Agence|Accompagnement|Non-produit","titre":"accroche"}]}
— exactement ${N}, dans le même ordre que les créneaux.`;
return [{json:{themeTitre:t.titre,expandPrompt:prompt,slots,outilsLabel}}];"""

TH_PARSE = r"""{PICKER}
const src=$('TH — Décliner (build)').first().json;
const slots=src.slots||[];
// Même extracteur que les menus : si la réponse arrive dans l'enveloppe brute, un parseur naïf
// rend [] sans erreur — les 21 contenus sortiraient alors tous avec un titre de repli.
let posts=extraireListe($input.first().json,['posts','Posts']);

// Listes de valeurs autorisées. Elles doivent correspondre EXACTEMENT aux singleSelect Airtable :
// une valeur inconnue est rejetée par l'API et fait échouer toute la ligne.
const PIL=new Set(['Éducation','Inspiration','Produit','Communauté','Autorité','Autre']);
const OFF=new Set(['Formations','Club Digitos','Rysmo','Agence','Accompagnement','Non-produit']);
const CIB=new Set(['Apprenants','Commerçants','Mixte']);

const out=[];
for(let i=0;i<slots.length;i++){
  const p=posts[i]||{};
  const s=slots[i];
  const pil=PIL.has(p.pilier)?p.pilier:'Éducation';

  // L'offre est déterministe là où la stratégie l'impose ; le modèle ne décide que du reste.
  let offre;
  if(s.serie!=='OFFRE'){ offre='Non-produit'; }
  else if(s.jour===2&&s.reseau==='fb'){ offre='Agence'; } // le créneau du mercredi porte toujours l'agence
  else if(s.format==='story'){ // le rappel du samedi alterne plateforme / agence d'une semaine à l'autre
    offre=(DateTime.fromISO(s.date).weekNumber%2===1)?'Formations':'Agence';
  }
  else { offre=OFF.has(p.offre)&&p.offre!=='Non-produit'?p.offre:'Formations'; }

  // Sur un créneau OFFRE, la cible SUIT l'offre retenue : annoncer l'agence à des apprenants
  // (ou l'inverse) est le meilleur moyen de rater les deux. Ailleurs, la grille fait foi.
  const LIGNE_AGENCE=(offre==='Agence'||offre==='Accompagnement');
  let cible=CIB.has(s.cible)?s.cible:'Mixte';
  if(s.serie==='OFFRE'&&s.cible==='Mixte'){ cible=LIGNE_AGENCE?'Commerçants':'Apprenants'; }

  // ⚠️ `Thematique` est un SingleSelect à liste FERMÉE, et NocoDB refuse toute valeur hors options
  // (`TH — Créer posts` replie donc sur « Contenu de la semaine »). Le thème hebdomadaire, lui, est
  // du texte libre proposé par le modèle : il n'y entrerait jamais. On le porte donc dans `Brief`,
  // qui est du texte libre ET déjà lu par WF-SOCIAL-03 au moment de rédiger.
  const theme=String(src.themeTitre||'').trim();
  const briefTheme=theme?('Thème de la semaine : « '+theme+' »'):'';

  // Ce que le board a choisi redescend jusqu'à la ligne : `Outil` sert l'anti-répétition des
  // semaines suivantes et le suivi de performance ; `Brief` est lu tel quel par WF-SOCIAL-03.
  const row={
    Titre:String(p.titre||('Post '+(i+1))).slice(0,200),
    Reseau:s.reseau,
    Format_Post:s.format,
    Pilier:pil,
    Serie:s.serie,
    Offre:offre,
    Cible:cible,
    Thematique:theme.slice(0,100),
    Date_Publication_Prevue:s.date,
    Status:'planifié',
    Brief:briefTheme
  };
  if(s.outil){
    row.Outil=String(s.outil.nom||'').slice(0,80);
    row.Brief=briefTheme+'\nOutil imposé : '+row.Outil+(s.outil.angle?' — '+s.outil.angle:'')+(s.outil.gain?' | Gain visé : '+s.outil.gain:'');
  }
  if(s.tendance){
    row.Brief=briefTheme+'\nTendance imposée : '+String(s.tendance.titre||'')+(s.tendance.date?' ['+s.tendance.date+']':'')+(s.tendance.source?' — source : '+s.tendance.source:'')+(s.tendance.angle?' | Angle : '+s.tendance.angle:'');
  }
  out.push({json:row});
}
return out;"""

# ─────────────────────────────────────────────────────────────────────────────
# WF-SOCIAL-03 — le prompt de rédaction
# ─────────────────────────────────────────────────────────────────────────────
SOCIAL03_PROMPT = """Tu es rédacteur senior pour **Max-Morrys**. Tagline : "Maîtrise le digital, accélère ta croissance".

Max-Morrys porte DEUX lignes :
- une plateforme ed-tech (formations, Club Digitos, assistant IA Rysmo) ;
- une agence, « Digital Commerce Local » (maxmorrys.me/agence), qui digitalise les commerces de quartier.

INPUT (1 ligne = 1 Reseau × 1 Format) :
- Titre: {{ $json.Titre }}
- Thématique: {{ $json.Thematique }}
- Pilier: {{ $json.Pilier }}
- Série: {{ $json.Serie }}
- Offre: {{ $json.Offre }}
- Cible: {{ $json.Cible }}
- Format: {{ $json.Format_Post }}
- Réseau: {{ $json.Reseau }}
- Brief: {{ $json.Brief }}
- Mots-clés: {{ $json.Mots_Cles }}

═══════════════════════════════════════════════
VOIX MAX-MORRYS
═══════════════════════════════════════════════
✅ Direct, actionable, chaleureux (tutoiement), pédagogue, ancré Afrique de l'Ouest, moderne, pro avec humour
❌ Corporate rigide, gourou américain traduit, jargon creux, hustle toxique, fausse modestie

Ouvertures : "Arrête." / "Stop." / "Une vérité qui dérange :" / "Voici ce que [X] m'a appris :"
Clôtures : "Si ça t'a aidé, enregistre." / "Sauvegarde pour plus tard." / "Dis-moi en commentaire : [Q précise]."
Signature possible : "Maîtrise le digital, accélère ta croissance."

Touches locales légères, 1 à 3 par contenu : Dakar, Abidjan, Douala, Wave, Orange Money, mobile money,
WhatsApp Business, boutiques de quartier. Français standard — pas de patois, la diaspora doit suivre.

═══════════════════════════════════════════════
LA CIBLE DÉCIDE DU VOCABULAIRE — à lire avant d'écrire
═══════════════════════════════════════════════
**Cible = Apprenants** → vocabulaire technique autorisé (SEO, IA, prompt, automatisation, tunnel, n8n).
CTA : "Découvre la formation" / "Rejoins le Club" / "Essaie Rysmo".

**Cible = Commerçants** → ZÉRO terme technique. Traduis systématiquement :
| Ne jamais écrire | Toujours écrire |
|---|---|
| Site web | Votre commerce visible 24h/24, même fermé |
| Catalogue Meta / WhatsApp | Vos produits commandables directement sur WhatsApp |
| Merchant Center | Vos produits affichés dans les résultats Google |
| Fiche d'établissement Google | Apparaître sur Google Maps quand on cherche votre métier dans votre quartier |
| GA4, Tag Manager, pixel | Savoir combien de clients Internet vous rapporte |
| Référencement, SEO | Passer devant vos concurrents sur Google |
| Workflow, automatisation, n8n | Publier tous les jours sans y penser |
CTA : "Fais le test sur Google Maps" / "Trouve ton pack en 3 questions".
ORDRE DE DÉMONSTRATION IMPOSÉ : (1) la recherche Google Maps, (2) la comparaison avec un concurrent,
(3) seulement ensuite les offres. **Ne commence JAMAIS par le site web.**

**Cible = Mixte** → sert les deux, sans jargon inutile.

═══════════════════════════════════════════════
LA SÉRIE DÉCIDE DE LA STRUCTURE
═══════════════════════════════════════════════
- **RADAR** : le fait DATÉ → pourquoi on en parle → ce que ça change pour toi → ce que je ferais cette semaine.
- **ATELIER** : le problème en 1 phrase → l'outil → la manipulation exacte → le gain chiffré → "essaie ce soir".
- **PREUVE** : le chiffre → d'où il vient → ce qu'il implique. Jamais un chiffre sans source.
- **COULISSES** : l'anecdote → ce que ça m'a coûté → la leçon utilisable par le lecteur.
- **CERCLE** : une question précise, ouverte, à laquelle on a envie de répondre.
- **OFFRE** : le bénéfice → la preuve → UN seul appel à l'action.

═══════════════════════════════════════════════
ADAPTATION SELON LE RÉSEAU ET LE FORMAT
═══════════════════════════════════════════════
**linkedin / post** (audience pro, les deux pistes) :
- 150-300 mots. Hook sur les 2 premières lignes (le reste est masqué), développement narratif, punchline finale.
- Saut de ligne entre chaque idée forte. Emojis fonctionnels (•, →, ✅, ❌, 💡). 3-5 hashtags pro.

**linkedin / carrousel** (post document) :
- 8 à 12 slides, séparées par "---". La PREMIÈRE slide doit fonctionner seule en aperçu de fil.
- Ton sobre. AUCUN emoji sur les slides. Une idée par slide : un titre court + 2 lignes maximum.
- Dernière slide : récapitulatif + un seul appel à l'action. La légende accompagne, elle ne répète pas.

**ig / post** :
- 100-200 mots, chaleureux. Hook ultra court sur la première ligne, avant le "… plus". Emojis sobres.

**ig / carrousel** ou **fb / carrousel** :
- Slides séparées par "---". COVER = la promesse en 7 MOTS MAXIMUM : c'est 80 % de la performance.
- 5 à 8 slides, UNE idée par slide. Dernière slide : récap + "Sauvegarde pour plus tard".
- La légende doit être AUTONOME : utile même sans faire défiler les slides.

**ig / story** :
- UN SEUL message, 20 mots maximum, lisible en une seconde à bout de bras.
- Sondage ou question quand le titre l'appelle. JAMAIS de lien nu : dis "lien en bio".

**fb / post** et **fb / community_post** (surtout les commerçants) :
- 150-250 mots, conversationnel, pédagogue. Questions ouvertes. Emojis chaleureux (👋, 🙏, 💬).

**x / thread** :
- 5 à 10 tweets numérotés, séparés par "---", CHACUN autonome (un tweet isolé doit tenir debout).
- Opinion affirmée. 1 emoji maximum sur tout le thread. 1-2 hashtags.

═══════════════════════════════════════════════
HASHTAGS
═══════════════════════════════════════════════
- ig : 5-10, mélangés — 2-3 locaux (#Dakar #Abidjan #Douala), 3-5 thématiques, 2-3 génériques
- linkedin : 3-5 pro · fb : 2-3 si pertinents · x : 1-2 max

═══════════════════════════════════════════════
RÈGLES ABSOLUES
═══════════════════════════════════════════════
1. Tutoiement partout.
2. **UN SEUL appel à l'action.** Deux CTA = zéro CTA.
3. **N'INVENTE JAMAIS UN MONTANT.** Aucun prix, aucun tarif, aucune remise dans le texte : les
   montants vivent dans le catalogue et seront ajoutés par un humain. Écris le bénéfice, pas le prix.
4. **Aucun chiffre sans source** dans un contenu PREUVE ou RADAR. Si tu n'as pas la source, écris
   l'idée sans le chiffre.
5. Ne décris jamais les outils de production (workflows, gabarits) à un commerçant : il achète un
   résultat, pas un outil.
6. Ne garantis aucun résultat chiffré sur Google, Meta ou une autre plateforme tierce.
7. Exemples locaux quand c'est possible, sans forcer.

Réponds en JSON strict (pas de markdown, pas de backticks) :
{
  "Texte": "texte complet du post pour CE réseau dans CE format",
  "Hashtags": "hashtags adaptés au réseau séparés par des espaces"
}
"""

# ─────────────────────────────────────────────────────────────────────────────
# WF-SOCIAL-04 — le choix du gabarit de créa
# ─────────────────────────────────────────────────────────────────────────────
SOCIAL04_BUILD = r"""const meta = $input.item.json;
const batch = $('Parse — Stratégie visuelle').all()[$itemIndex].json;
const R2_BASE = 'https://pub-98fc057dc71948c7bd129a674b4bcec8.r2.dev';
const k = meta.Key || meta.key || `social/${batch.id}/${batch.image_index}_${Date.now()}.png`;
const bgUrl = `${R2_BASE}/${k}`;
let RENDER_CARD_URL = '', RENDER_KEY = '';
try {
  const rc = $('Airtable — Lire Config Render').all().map(i => i.json);
  const g = (kk) => { const r = rc.find(x => (x.fields ? x.fields.Cle : x.Cle) === kk); return r ? (r.fields ? r.fields.Valeur : r.Valeur) : ''; };
  RENDER_CARD_URL = g('RENDER_CARD_URL'); RENDER_KEY = g('RENDER_KEY');
} catch (e) {}
let f = {};
try { const rows = $('Airtable — Lire rédigés').all().map(i => i.json); const row = rows.find(r => (r.id || (r.fields && r.fields.id)) === batch.id) || {}; f = row.fields || row; } catch (e) {}

const fmtMap = { story:'9:16', reel:'9:16', short:'9:16', carrousel:'4:5', post:'4:5', community_post:'1:1', thread:'1:1', live:'9:16' };
const format = fmtMap[String(f.Format_Post || '').toLowerCase()] || '4:5';

// Choix du gabarit — le FORMAT décide d'abord, le style « poster » retenu par le board est le défaut.
// Les gabarits plus riches (stat, checklist, versus, testimonial) demandent des données que ce
// workflow n'a pas (un chiffre, une liste, deux colonnes) : c'est le Designer qui les appelle
// explicitement sur ticket. Ici on ne produit que ce qu'on peut garantir.
const fp = String(f.Format_Post || '').toLowerCase();
let template = 'poster';
if (fp === 'story') template = 'ask';
else if (fp === 'carrousel') template = 'slide';

// Accent = couleur du Pilier. Carte canonique « poster-safe » sur fond bleu profond.
const accMap = { 'Éducation':'turquoise', 'Inspiration':'violet', 'Produit':'orange', 'Autorité':'corail', 'Communauté':'vert', 'Autre':'orange' };
const accent = accMap[f.Pilier] || 'orange';

// L'eyebrow porte la SÉRIE quand elle existe : c'est ce qui rend le rendez-vous reconnaissable.
const eyebrow = f.Serie || f.Pilier || '';

const title = String(f.Titre || batch.visual_strategy || 'Max-Morrys').slice(0, 120);
const _hw = title.replace(/[^\wÀ-ÿ\s]/g, ' ').split(/\s+/).filter((x) => x.length > 3);
const highlight = _hw.length ? _hw[_hw.length - 1] : '';

// Un carrousel = une slide par image : la première est la promesse, la dernière le récap.
const idx = batch.image_index || 1;
const total = batch.total_images || 1;
const slideRole = idx === 1 ? 'cover' : (idx >= total ? 'outro' : 'body');

// Seuls les gabarits « photo » consomment un fond. poster / slide / ask se rendent en mode marque :
// aucun appel image, aucun risque de 403, et un rendu identique à chaque fois.
const PHOTO_TPL = new Set(['panel', 'quote', 'tip', 'promo']);
const _dims = ({ '9:16': [1024, 1536], '4:5': [1024, 1280], '1:1': [1024, 1024] })[format] || [1024, 1280];
const _vs = batch.visual_strategy;
let _sceneRaw = title;
if (_vs && typeof _vs === 'object') { _sceneRaw = _vs.prompt_gemini3 || _vs.rationale || _vs.type_visuel || title; }
else if (typeof _vs === 'string' && _vs.trim()) { _sceneRaw = _vs; }
const _scene = String(_sceneRaw).replace(/\s+/g, ' ').slice(0, 260);
const bgAi = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(_scene + '. Any people shown are Black or mixed-race African, authentic, diverse. Photorealistic, cinematic natural lighting, high detail, no text, no words, no letters, no logo, no watermark') + '?width=' + _dims[0] + '&height=' + _dims[1] + '&model=flux&nologo=true&enhance=true&seed=' + idx;

const payload = { template, format, title, eyebrow, highlight, accent, curve: false };
if (template === 'slide') { payload.slideRole = slideRole; payload.slideIndex = idx; payload.slideTotal = total; }
if (PHOTO_TPL.has(template)) { payload.backgroundUrl = bgAi; }

return { json: { id: batch.id, image_index: idx, total_images: total, visual_strategy: batch.visual_strategy, bg_fallback: bgUrl, render_url: RENDER_CARD_URL, render_key: RENDER_KEY, payload } };"""


# ─────────────────────────────────────────────────────────────────────────────
# WF-TG-ROUTER — le décodeur de callbacks, étendu aux deux menus
# ─────────────────────────────────────────────────────────────────────────────
PARSE_UPDATE = r"""const cfg={};for(const r of $('Airtable — Lire Config').all())if(r.json.Cle)cfg[r.json.Cle]=r.json.Valeur;
const upd=$('Telegram Trigger').first().json;
const b={token:cfg.TELEGRAM_BOT_TOKEN,chatId:cfg.TELEGRAM_CHAT_ID,pcBase:cfg.PAPERCLIP_BASE,cid:cfg.PAPERCLIP_COMPANY_ID,cfId:cfg.CF_ACCESS_CLIENT_ID,cfSecret:cfg.CF_ACCESS_CLIENT_SECRET};

// Clés d'état des deux menus. ⚠️ Chacune doit figurer dans le filterByFormula du nœud
// « Airtable — Lire Config » : une clé absente du filtre est simplement invisible ici, sans erreur.
const MENU_KEYS={tool:{cur:'TOOLS_CURRENT',pick:'TOOLS_PICKED'},trend:{cur:'TRENDS_CURRENT',pick:'TRENDS_PICKED'}};

const cq=upd.callback_query;
if(cq&&cq.data){
  const [action,kind,id]=cq.data.split(':');
  const o={...b,action,id,callbackQueryId:cq.id,chatId:(cq.message&&cq.message.chat&&cq.message.chat.id)||b.chatId,messageId:cq.message&&cq.message.message_id};
  o.label=action==='approve'?'✅ Approuvé':'❌ Rejeté';
  o.offBody={chat_id:o.chatId,message_id:o.messageId,reply_markup:{inline_keyboard:[]}};

  // L'état des deux menus voyage avec CHAQUE callback : l'expansion finale en a besoin, et elle
  // est déclenchée par un clic sur le menu des tendances, pas sur celui des outils.
  let th={};try{th=JSON.parse(cfg.PICK_THEME||'{}');}catch(e){th={};}
  o.pickTheme=th;
  o.themeTitre=th.titre||'';
  o.sousTitre=th.titre?('Thème : « '+th.titre+' »'):'';
  o.cfgToolsCur=cfg.TOOLS_CURRENT||'[]';
  o.cfgToolsPick=cfg.TOOLS_PICKED||'';
  o.cfgTrendsCur=cfg.TRENDS_CURRENT||'[]';
  o.cfgTrendsPick=cfg.TRENDS_PICKED||'';

  if(kind==='post'){o.kind='post';o.newStatus=action==='approve'?'validé':'rejeté';}
  else if(kind==='pc'){o.kind='pc';} else if(kind==='email'){o.kind='email';o.newStatus=action==='approve'?'validé':'rejeté';} else if(kind==='wa'){o.kind='wa';o.newStatus=action==='approve'?'validé':'rejeté';}
  else if(kind==='theme'){o.kind='theme';o.themeIndex=parseInt(id,10)||0;o.themesRaw=cfg.THEMES_CURRENT||'';o.label='⏳ Je prépare les outils…';}
  else if(kind==='tool'||kind==='trend'){
    const k=MENU_KEYS[kind];
    o.menu=kind;
    o.optIndex=parseInt(id,10)||0;
    o.menuOptions=cfg[k.cur]||'[]';
    o.menuPicked=cfg[k.pick]||'';
    o.pickKey=k.pick;
    // `pick` coche/décoche (branche générique), `done` valide et fait avancer la chaîne.
    o.kind=action==='done'?'done':'toggle';
    o.label='';
  }
  else o.kind='ignore';
  return [{json:o}];
}
const txt=((upd.message&&upd.message.text)||'').trim();
if(txt.startsWith('/')) return [{json:{...b,kind:'cmd',cmd:txt}}];
return [{json:{...b,kind:'ignore'}}];"""

# Le message de confirmation annonçait « 10 posts » — faux depuis le passage à 21 créneaux.
TH_CONFIRME_BODY = (
    "={{ JSON.stringify({chat_id:$('Parse — Update').first().json.chatId,"
    "text:'✅ Semaine générée : « '+$('TH — Décliner (build)').first().json.themeTitre+' » — '"
    "+$('TH — Décliner (build)').first().json.slots.length+' contenus créés"
    " (outils : '+$('TH — Décliner (build)').first().json.outilsLabel+')',"
    "parse_mode:'HTML'}) }}"
)


PATCHES = [
    ("WF-THEMES.json", "THEMES — Build prompt", "jsCode", THEMES_BUILD),
    ("WF-TG-ROUTER.json", "Parse — Update", "jsCode", PARSE_UPDATE),
    ("WF-TG-ROUTER.json", "TH — Décliner (build)", "jsCode", TH_DECLINER),
    ("WF-TG-ROUTER.json", "TH — Parse posts", "jsCode", TH_PARSE),
    ("WF-TG-ROUTER.json", "TH — confirme", "jsonBody", TH_CONFIRME_BODY),
    ("WF-SOCIAL-03.json", "Gemini Pro — Rédiger textes", "prompt", SOCIAL03_PROMPT),
    ("WF-SOCIAL-04.json", "Build — URL publique", "jsCode", SOCIAL04_BUILD),
]

# ═════════════════════════════════════════════════════════════════════════════
# Les menus de choix Telegram — nouveaux nœuds et recâblage de WF-TG-ROUTER
# ═════════════════════════════════════════════════════════════════════════════

# Les six clés d'état que le routeur DOIT pouvoir lire. `THEMES_CURRENT` en faisait déjà partie
# dans le code mais pas dans le filtre : le thème cliqué n'atteignait jamais l'expansion.
CONFIG_KEYS = [
    "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "PAPERCLIP_BASE", "PAPERCLIP_COMPANY_ID",
    "CF_ACCESS_CLIENT_ID", "CF_ACCESS_CLIENT_SECRET",
    "THEMES_CURRENT", "PICK_THEME",
    "TOOLS_CURRENT", "TOOLS_PICKED", "TRENDS_CURRENT", "TRENDS_PICKED",
]

# Métadonnées écrites par le serveur n8n : inutiles à l'import, et `activeVersion` embarque une
# copie PÉRIMÉE de tous les nœuds qui trompe quiconque relit ou compare les fichiers.
SERVER_META = [
    "activeVersion", "activeVersionId", "versionId", "versionCounter", "shared",
    "triggerCount", "createdAt", "updatedAt", "isArchived", "sourceWorkflowId",
]

# Cibles NocoDB (relevées sur les workflows live — voir `n8n/live/`).
NOCO_WORKSPACE = "wpaxkizo"
NOCO_PROJECT = "ph7ugup4mggzj2y"
T_CONFIG = "mo6ubcgxi9x4u7d"
T_CONTENUS = "m3wim4coagaoot7"

# Le nœud NocoDB v3 renvoie `{id, fields:{…}}` là où l'ancien nœud Airtable renvoyait `{id, …champs}`
# à plat. La migration a donc doublé chaque lecture : un nœud NocoDB nommé `<nom> (NocoDB)` suivi
# d'un nœud Code portant le **nom d'origine**, qui aplatit. Les expressions `$('<nom>')` en aval
# n'ont ainsi rien eu à changer. On reprend exactement ce motif pour les lectures qu'on ajoute.
FLATTEN_JS = (
    "// Aplatit la sortie NocoDB v3 {id, fields:{}} au format plat de l'ancien nœud Airtable :\n"
    "// {...champs, id} — pour que les expressions $('<nom>').json.<Champ> restent valables.\n"
    "return $input.all().map(i => ({ json: { ...(i.json.fields || {}), id: i.json.id } }));"
)


def picker_lib() -> str:
    """La logique des menus, source unique, partagée avec `tests/unit/telegram-picker.test.ts`."""
    with open(os.path.join("n8n", "strategy-2026", "lib", "picker.js"), encoding="utf-8") as fh:
        return fh.read().rstrip()


# ── Corps JS des nouveaux nœuds Code ─────────────────────────────────────────
# Chacun est préfixé par la bibliothèque `picker.js` (marqueur `{PICKER}`), qui porte toute la
# logique testable ; ne reste ici que la glu n8n.

PK_OUTILS_BUILD = r"""// Propose les outils de la semaine. Le board tranche ensuite sur Telegram.
const o=$('Parse — Update').first().json;
let themes=[];
try{const raw=JSON.parse(o.themesRaw||'[]');themes=Array.isArray(raw)?raw:(raw.themes||[]);}catch(e){themes=[];}
const t=themes[o.themeIndex]||themes[0]||{titre:'Contenu de la semaine',angle:'',pisteA:'',pisteB:''};

// Anti-répétition : les outils déjà traités récemment, lus sur les lignes ATELIER de Contenus.
// C'est ce qui empêche la liste de se refermer sur les trois mêmes noms.
const recents=[];
try{
  $input.all().forEach(function(r){
    const f=r.json.fields||r.json;
    const v=String(f.Outil||'').trim();
    if(v&&recents.indexOf(v)<0)recents.push(v);
  });
}catch(e){}

const prompt=`Tu es **CMO Aïcha**, directrice marketing de Max-Morrys.

THÈME DE LA SEMAINE : « ${t.titre} » — ${t.angle||''}

Propose **7 outils** à traiter dans la série ATELIER cette semaine. Un contenu ATELIER, c'est
**un outil, un réglage, un gain chiffré** — jamais « 15 astuces ».

Les deux audiences à servir :
- **Apprenants** — entrepreneurs, marketeurs, freelances, reconversions (Afrique de l'Ouest
  francophone + diaspora). Vocabulaire technique autorisé.
- **Commerçants** — commerces physiques de 1 à 15 salariés à Dakar, Abidjan, Cotonou.
  **Zéro terme technique** : un outil ne leur est utile que s'il tient en « ce que ça te fait gagner ».

RÈGLES :
- **La liste n'est PAS fermée.** Propose ce qui est réellement pertinent aujourd'hui : outils de
  design, de montage, d'IA, de rédaction, d'organisation, de visibilité locale, de conversation,
  d'automatisation — **y compris des outils récents ou peu connus**.
- **Au moins 2 propositions doivent sortir des incontournables** (Canva, CapCut, n8n, WhatsApp
  Business, fiche Google) : c'est ce qui rend la série vivante.
- Chaque outil doit tenir en un contenu concret, avec une manipulation précise.
- Ne repropose PAS ces outils déjà traités récemment : ${recents.length?recents.join(', '):'(aucun pour l\'instant)'}.

Réponds STRICTEMENT en JSON, sans texte autour :
{"outils":[{"nom":"nom de l'outil","angle":"la manipulation précise, en 4 à 7 mots","piste":"Apprenants|Commerçants|Mixte","gain":"le gain concret, chiffré si possible"}]}
— exactement 7 objets.`;

return [{json:{...o,themeJson:JSON.stringify(t),themeTitre:t.titre,prompt:prompt}}];"""

PK_OUTILS_PARSE = r"""{PICKER}
const src=$('PK — Outils (build)').first().json;
// `extraireListe` gère l'enveloppe brute {candidates:[{content:{parts:[{text}]}}]} autant que
// l'objet simplifié : sans ça, Gemini propose 7 outils et le menu n'en affiche qu'un (le repli).
let outils=extraireListe($input.first().json,['outils','Outils']);
outils=outils.slice(0,8).filter(function(x){return x&&x.nom;});
if(!outils.length)outils=[{nom:'Canva',angle:'le kit de marque',piste:'Mixte',gain:'20 min par visuel'}];

const vue=renderMenu('tool',outils,[],'Thème : « '+src.themeTitre+' »');
const tgBody={chat_id:src.chatId,text:vue.text,parse_mode:'HTML',reply_markup:vue.keyboard};
return [{json:{token:src.token,chatId:src.chatId,outilsJson:JSON.stringify(outils),themeJson:src.themeJson,tgBody:tgBody}}];"""

PK_TOGGLE = r"""{PICKER}
// Coche / décoche une option et redessine le message. C'est la seule façon de faire de la
// multi-sélection sur Telegram : les boutons n'ont pas de mémoire, l'état vit dans Airtable.
const o=$json;
const options=parseList(o.menuOptions);
const r=togglePick(o.menuPicked,o.optIndex,o.menu,options.length);
const vue=renderMenu(o.menu,options,r.picked,o.sousTitre);
// `modifie` = le clic a réellement changé la sélection. Un clic REFUSÉ (quota atteint) laisse le
// message identique, et Telegram rejette une édition sans changement :
// « message is not modified ». On ne réécrit donc que si quelque chose a bougé — l'accusé de
// réception, lui, part toujours, puisque c'est lui qui affiche « Maximum 3 ».
return [{json:{...o,
  modifie:r.refus===null,
  pickedCsv:serializePicked(r.picked),
  answerText:r.refus||'',
  editBody:{chat_id:o.chatId,message_id:o.messageId,text:vue.text,parse_mode:'HTML',reply_markup:vue.keyboard}
}}];"""

PK_DONE = r"""{PICKER}
// Valide un menu. Rien de coché → on refuse et on n'avance pas : mieux vaut redemander qu'inventer.
const o=$json;
const options=parseList(o.menuOptions);
const picked=parsePicked(o.menuPicked,options.length);
const retenus=selectedOptions(options,picked);
const m=MENUS[o.menu]||MENUS.tool;
const ok=retenus.length>0;
return [{json:{...o,
  ok:ok,
  next:o.menu==='tool'?'trend':'expand',
  chosenJson:JSON.stringify(retenus),
  answerText:ok?('✅ '+retenus.length+' retenu(s)'):m.vide
}}];"""

PK_TENDANCES_BUILD = r"""// Propose les tendances à décrypter. Une tendance sans date n'est pas une tendance.
const o=$('Parse — Update').first().json;
const done=$json;
let outils=[];
try{outils=JSON.parse(done.chosenJson||'[]');}catch(e){outils=[];}
const outilsLabel=outils.map(function(x){return x.nom;}).join(', ')||'aucun';

const prompt=`Tu es **CMO Aïcha**, directrice marketing de Max-Morrys.

THÈME DE LA SEMAINE : « ${o.themeTitre||''} »
Outils déjà retenus pour la série ATELIER : ${outilsLabel}

Propose **5 tendances** à décrypter dans la série RADAR. Un contenu RADAR répond à une seule
question : **qu'est-ce que ça change concrètement, cette semaine, pour quelqu'un comme toi ?**

RÈGLES NON NÉGOCIABLES :
- **Chaque tendance porte une DATE** (au minimum le mois et l'année) et une **source nommée**.
  Une tendance que tu ne peux pas dater, tu ne la proposes pas — c'est une opinion, pas une tendance.
- Indique un **niveau de confiance** : confirmé, émergent, ou spéculatif.
- Chaque tendance doit avoir un angle pour les **apprenants** ET un angle pour les **commerçants**.
- Évite de répéter le thème : le RADAR éclaire l'actualité, il ne paraphrase pas le fil rouge.

Familles à balayer : recherche et découverte · IA générative et agents · formats et algorithmes
des plateformes · commerce conversationnel et paiement mobile en Afrique de l'Ouest · écosystème
local · le métier du marketing lui-même.

Réponds STRICTEMENT en JSON, sans texte autour :
{"tendances":[{"titre":"court et clair","date":"mois AAAA","source":"qui l'a annoncé ou observé","confiance":"confirmé|émergent|spéculatif","angle":"ce que ça change, en une phrase"}]}
— exactement 5 objets.`;

return [{json:{...o,prompt:prompt,outilsJson:done.chosenJson}}];"""

PK_TENDANCES_PARSE = r"""{PICKER}
const src=$('PK — Tendances (build)').first().json;
let tend=extraireListe($input.first().json,['tendances','Tendances']);
tend=tend.slice(0,6).filter(function(x){return x&&x.titre;});
if(!tend.length)tend=[{titre:'À définir avec le board',date:'',source:'',confiance:'spéculatif',angle:''}];

const lignes=tend.map(function(t){return {titre:t.titre,angle:(t.date?'['+t.date+'] ':'')+(t.angle||''),date:t.date||'',source:t.source||'',confiance:t.confiance||''};});
const vue=renderMenu('trend',lignes,[],'Thème : « '+(src.themeTitre||'')+' »');
const tgBody={chat_id:src.chatId,text:vue.text,parse_mode:'HTML',reply_markup:vue.keyboard};
return [{json:{token:src.token,chatId:src.chatId,tendancesJson:JSON.stringify(lignes),tgBody:tgBody}}];"""


# ── Fabriques de nœuds ───────────────────────────────────────────────────────

def _toujours_produire(node: dict) -> dict:
    """`alwaysOutputData` — indispensable sur une lecture qui peut légitimement ne rien trouver.

    n8n **n'exécute pas la suite d'un nœud qui produit zéro item**. Une lecture vide n'est donc pas
    une branche « sans résultat » : c'est une branche **morte**, en silence. C'est ce qui a fait
    échouer le premier rituel en production — « PK — Outils récents » ne trouvait aucun contenu
    ATELIER (le champ `Serie` venait d'être créé), et le menu des outils n'est jamais parti.
    Avec ce drapeau, le nœud émet un item vide et la chaîne continue.
    """
    node["alwaysOutputData"] = True
    return node


def _clone(doc, source_name: str, name: str, node_id: str, position, parameters: dict) -> dict:
    """Clone un nœud existant pour hériter de son `type`, `typeVersion` et de ses credentials.

    Recopier les credentials est le point clé : un nœud fabriqué de zéro arrive à l'import sans
    identifiants, et échoue silencieusement à la première exécution.
    """
    src = next((n for n in doc["nodes"] if n["name"] == source_name), None)
    if src is None:
        raise KeyError(f"nœud modèle « {source_name} » introuvable")
    node = {
        "parameters": parameters,
        "type": src["type"],
        "typeVersion": src["typeVersion"],
        "position": list(position),
        "id": node_id,
        "name": name,
    }
    if src.get("credentials"):
        node["credentials"] = json.loads(json.dumps(src["credentials"]))
    return node


def n_code(doc, name, node_id, position, js) -> dict:
    return _clone(doc, "TH — Décliner (build)", name, node_id, position,
                  {"jsCode": js.replace("{PICKER}", picker_lib()), "mode": "runOnceForAllItems"})


def n_filter(doc, name, node_id, position, conditions) -> dict:
    return _clone(doc, "IF theme", name, node_id, position, {
        "conditions": {
            "options": {"caseSensitive": True, "typeValidation": "loose"},
            "combinator": "and",
            "conditions": conditions,
        }
    })


def cond_str(left, right):
    return {"leftValue": left, "rightValue": right,
            "operator": {"type": "string", "operation": "equals"}}


def cond_true(left):
    return {"leftValue": left, "rightValue": "",
            "operator": {"type": "boolean", "operation": "true", "singleValue": True}}


def n_http(doc, name, node_id, position, endpoint, body_expr,
           token_expr="$json.token", once=False) -> dict:
    node = _clone(doc, "TH — accusé", name, node_id, position, {
        "method": "POST",
        "url": "=https://api.telegram.org/bot{{ " + token_expr + " }}/" + endpoint,
        "sendBody": True,
        "specifyBody": "json",
        "jsonBody": body_expr,
        "options": {},
    })
    if once:
        # Un nœud n8n s'exécute UNE FOIS PAR ITEM entrant. Sur un nœud qui envoie un message
        # Telegram, ça se traduit par une rafale de messages identiques — vécu le 2026-08-06 :
        # 21 confirmations « Semaine générée », une par ligne créée.
        node["executeOnce"] = True
    return node


def _noco_base(table: str) -> dict:
    return {
        "authentication": "nocoDbApiToken",
        "workspaceId": {"__rl": True, "value": NOCO_WORKSPACE, "mode": "id"},
        "projectId": {"__rl": True, "value": NOCO_PROJECT, "mode": "id"},
        "table": {"__rl": True, "value": table, "mode": "id"},
        "resource": "row",
    }


def n_config_upsert(doc, name, node_id, position, cle, valeur_expr) -> dict:
    """Écrit une clé d'état dans la table Config.

    ⚠️ **NocoDB n'a pas l'upsert par clé métier d'Airtable.** Son `upsert` fait `PATCH` si un `id`
    est fourni, `POST` sinon — il ne sait pas matcher sur `Cle`. Sans résolution d'`id`, chaque clic
    créerait une ligne au lieu de mettre à jour la sienne, et la sélection ne serait jamais relue.
    On résout donc l'`id` par expression contre la lecture amont de la même table, exactement comme
    le fait `THEMES — Stocker` en production.
    """
    params = _noco_base(T_CONFIG)
    params.update({
        "operation": "upsert",
        "dataToSend": "mapWithFields",
        "id": "={{ $('Airtable — Lire Config').all()"
              ".find(r => r.json.Cle === '%s')?.json.id ?? '' }}" % cle,
        "fieldsMapper": {
            "mappingMode": "defineBelow",
            "value": {"Cle": cle, "Valeur": valeur_expr, "Type": "json"},
            "matchingColumns": [],
            "schema": [],
        },
    })
    return _clone(doc, "Airtable — Lire Config (NocoDB)", name, node_id, position, params)


def n_outils_recents(doc, position) -> list:
    """Les outils déjà traités — le modèle ne doit pas reproposer les mêmes chaque semaine.

    Deux nœuds, comme toute lecture depuis la migration : le nœud NocoDB, puis l'aplatisseur qui
    porte le nom utilisé par les expressions en aval.
    """
    params = _noco_base(T_CONTENUS)
    params.update({
        "operation": "search",
        "returnAll": True,
        # On ne filtre que sur la série : le tri et l'exclusion des `Outil` vides se font dans le
        # code, plutôt que de parier sur la syntaxe d'un opérateur « non vide » côté NocoDB.
        "options": {"where": "(Serie,eq,ATELIER)"},
    })
    return [
        # Sans `alwaysOutputData`, une base sans contenu ATELIER tue toute la chaîne du menu.
        _toujours_produire(_clone(doc, "Airtable — Lire Config (NocoDB)", "PK — Outils récents (NocoDB)",
                                  "pk-recents-noco", position, params)),
        _clone(doc, "Airtable — Lire Config", "PK — Outils récents", "pk-recents",
               (position[0] + 200, position[1]), {"jsCode": FLATTEN_JS}),
    ]


def n_gemini(doc, name, node_id, position, prompt_expr) -> dict:
    node = _clone(doc, "Gemini — Décliner thème", name, node_id, position, {
        "modelId": {"__rl": True, "value": "models/gemini-2.5-flash", "mode": "list",
                    "cachedResultName": "models/gemini-2.5-flash"},
        "messages": {"values": [{"content": prompt_expr}]},
        "simplify": False,
        "jsonOutput": True,
        "builtInTools": {},
        "options": {"maxOutputTokens": 16384, "temperature": 0.8, "thinkingBudget": 0},
    })
    return node


RELANCE_DIAG = r"""// La semaine qui vient a-t-elle été générée ? Sinon, où la chaîne s'est-elle arrêtée ?
const cfg={};for(const r of $('Relance — Lire Config').all())if(r.json.Cle)cfg[r.json.Cle]=r.json.Valeur;

const base=$now.setZone('Africa/Dakar');
const du=((8-base.weekday)%7)||7;
const monday=base.plus({days:du}).startOf('day');
const sunday=monday.plus({days:7});

let prevus=0;
for(const r of $input.all()){
  const f=r.json.fields||r.json;
  const d=f.Date_Publication_Prevue;
  if(!d)continue;
  const dt=DateTime.fromISO(d);
  if(dt.isValid&&dt>=monday&&dt<sunday)prevus++;
}

function vide(v){return !v||String(v).trim()===''||String(v).trim()==='[]'||String(v).trim()==='{}';}

// Le seuil de 5 est celui qu'utilise déjà WF-THEMES pour décider qu'une semaine est prise en main.
const genere=prevus>=5;
let etape='', quoi='';
if(genere){ etape='ok'; }
else if(!vide(cfg.TRENDS_CURRENT)&&vide(cfg.TRENDS_PICKED)){ etape='tendances'; quoi='il manque la validation des <b>tendances</b> (menu 📡 déjà envoyé)'; }
else if(!vide(cfg.TOOLS_CURRENT)&&vide(cfg.TOOLS_PICKED)){ etape='outils'; quoi='il manque la validation des <b>outils</b> (menu 🧰 déjà envoyé)'; }
else if(vide(cfg.PICK_THEME)){ etape='theme'; quoi='tu n\'as pas encore choisi le <b>thème</b> de la semaine'; }
else { etape='inconnu'; quoi='la chaîne s\'est arrêtée après le choix du thème'; }

const semaine=monday.toFormat('dd LLL');
const text=`⚠️ <b>La semaine du ${semaine} n'est pas générée</b>\n\n${quoi}.\n\n`+
  `Reprends le fil dans le chat : ${prevus} contenu(s) planifié(s) sur les 21 attendus.\n`+
  `<i>Rien ne part sans toi — mais rien ne part non plus si tu ne tranches pas.</i>`;

return [{json:{skip:genere,etape:etape,prevus:prevus,semaine:semaine,
  token:cfg.TELEGRAM_BOT_TOKEN,
  tgBody:{chat_id:cfg.TELEGRAM_CHAT_ID,text:text,parse_mode:'HTML'}}}];"""


def build_relance_workflow(router) -> dict:
    """WF-PICKS-RELANCE — repère une semaine non générée et relance le board.

    Le rituel passe de 1 à 3 interactions : si la chaîne s'arrête en route, aucun contenu n'est créé
    et personne ne s'en aperçoit avant le lundi. Ce workflow ne fait que **prévenir** — il ne choisit
    rien à la place du board, ce qui viderait de son sens la fonctionnalité qu'on vient d'ajouter.
    """
    cfg_params = _noco_base(T_CONFIG)
    cfg_params.update({
        "operation": "search", "returnAll": True,
        "options": {"where": "~or".join("(Cle,eq,%s)" % k for k in CONFIG_KEYS)},
    })
    contenus_params = _noco_base(T_CONTENUS)
    contenus_params.update({"operation": "search", "returnAll": True, "options": {}})

    nodes = [
        _clone(router, "Telegram Trigger", "Cron — Samedi 10h & dimanche 9h", "rl-cron", (0, 0), {}),
        # Chaque lecture = un nœud NocoDB + son aplatisseur, comme partout depuis la migration.
        # Idem : une base vide ne doit pas empêcher le diagnostic de tourner et de te prévenir.
        _toujours_produire(_clone(router, "Airtable — Lire Config (NocoDB)", "Relance — Lire Config (NocoDB)",
                                  "rl-config-noco", (200, 0), cfg_params)),
        _clone(router, "Airtable — Lire Config", "Relance — Lire Config", "rl-config",
               (400, 0), {"jsCode": FLATTEN_JS}),
        _toujours_produire(_clone(router, "Airtable — Lire Config (NocoDB)", "Relance — Lire Contenus (NocoDB)",
                                  "rl-contenus-noco", (600, 0), contenus_params)),
        _clone(router, "Airtable — Lire Config", "Relance — Lire Contenus", "rl-contenus",
               (800, 0), {"jsCode": FLATTEN_JS}),
        n_code(router, "Relance — Diagnostic", "rl-diag", (1000, 0), RELANCE_DIAG),
        n_filter(router, "Semaine non générée ?", "rl-if", (1200, 0),
                 [{"leftValue": "={{ $json.skip }}", "rightValue": "",
                   "operator": {"type": "boolean", "operation": "false", "singleValue": True}}]),
        n_http(router, "Relance — Envoyer", "rl-send", (1400, 0), "sendMessage",
               "={{ JSON.stringify($json.tgBody) }}"),
    ]
    # Le déclencheur est un cron, pas le webhook Telegram cloné : on remplace type et paramètres.
    nodes[0]["type"] = "n8n-nodes-base.scheduleTrigger"
    nodes[0]["typeVersion"] = 1.2
    nodes[0].pop("credentials", None)
    nodes[0]["parameters"] = {"rule": {"interval": [
        {"field": "cronExpression", "expression": "0 10 * * 6"},   # samedi 10h — première relance
        {"field": "cronExpression", "expression": "0 9 * * 0"},    # dimanche 9h — dernier rappel
    ]}}

    doc = {
        "name": "WF-PICKS-RELANCE — Semaine non générée (filet de sécurité)",
        "nodes": nodes,
        "connections": {},
        "settings": {"executionOrder": "v1", "timezone": "Africa/Dakar"},
        "active": False,
        "pinData": {},
        "tags": [],
    }
    chain = [n["name"] for n in nodes]
    for a, b in zip(chain, chain[1:]):
        _link(doc, a, [b])
    return doc


def _link(doc, source: str, targets):
    """Branche `source` sur une liste de cibles, sur la sortie 0 (le seul index utilisé ici)."""
    doc.setdefault("connections", {}).setdefault(source, {})["main"] = [
        [{"node": t, "type": "main", "index": 0} for t in targets]
    ]


def fix_config_filter(doc) -> None:
    """Bug ① — `THEMES_CURRENT` manque au filtre : le thème cliqué n'atteint jamais l'expansion.

    `Parse — Update` lit `cfg.THEMES_CURRENT`, mais la clé n'est pas dans le `where` de la lecture.
    Une clé absente de ce filtre est **invisible** pour tout le workflow, sans la moindre erreur :
    `themesRaw` reste vide et l'expansion retombe sur « Contenu de la semaine ».

    La migration NocoDB du 2026-08-06 a repris le filtre verbatim — le bug a donc survécu. Les cinq
    clés des menus tomberaient exactement dans le même trou.
    """
    node = next(n for n in doc["nodes"] if n["name"] == "Airtable — Lire Config (NocoDB)")
    node["parameters"].setdefault("options", {})["where"] = "~or".join(
        "(Cle,eq,%s)" % k for k in CONFIG_KEYS
    )


def fix_confirme_une_fois(doc) -> None:
    """`TH — confirme` s'exécutait une fois par ligne créée — soit 21 messages Telegram identiques.

    Un nœud n8n s'exécute par item entrant. `TH — Créer posts` en sort 21 (une ligne par créneau),
    donc le message de confirmation partait 21 fois. `executeOnce` le ramène à un seul envoi.
    """
    node = next(n for n in doc["nodes"] if n["name"] == "TH — confirme")
    node["executeOnce"] = True


def fix_creer_posts(doc) -> None:
    """`TH — Créer posts` mappe ses champs un par un — les nouveaux doivent y être ajoutés.

    Depuis la migration, ce nœud est en `mapWithFields` explicite : NocoDB n'a pas l'équivalent du
    `typecast` d'Airtable, et **refuse toute valeur hors options d'un SingleSelect**. Un champ
    absent du mapper n'est pas écrit — en silence. Les cinq nouveaux (`Serie`, `Offre`, `Cible`,
    `Outil`, `Brief`) seraient donc perdus sans cette passe.
    """
    node = next(n for n in doc["nodes"] if n["name"] == "TH — Créer posts")
    mapper = node["parameters"]["fieldsMapper"]["value"]
    for champ in ("Serie", "Offre", "Cible", "Outil", "Brief"):
        mapper[champ] = "={{ $json.%s ?? '' }}" % champ


def strip_server_meta(doc) -> None:
    """Bug ② — les exports embarquent `activeVersion.nodes`, une copie PÉRIMÉE de tous les nœuds.

    Inoffensive à l'import (n8n lit `nodes`/`connections`), mais elle trompe toute relecture et
    double la taille des fichiers. On ne garde que ce qu'un import consomme.
    """
    for k in SERVER_META:
        doc.pop(k, None)


def add_picker_nodes(doc) -> int:
    """Insère les deux menus de choix dans WF-TG-ROUTER et recâble la chaîne du thème.

    Le routage du workflow est un fan-out de nœuds `Filter` branchés sur « Parse — Update » : on
    étend ce motif, on ne le refait pas. Retourne le nombre de nœuds ajoutés.
    """
    y1, y2, y3, y4 = 1800, 2000, 2200, 2400
    new = [
        # ── Menu OUTILS — déclenché par le clic sur un thème ──
        *n_outils_recents(doc, (140, y1)),
        n_code(doc, "PK — Outils (build)", "pk-tool-build", (360, y1), PK_OUTILS_BUILD),
        n_config_upsert(doc, "PK — Stocker thème", "pk-store-theme", (580, y1 + 140),
                        "PICK_THEME", "={{ $json.themeJson }}"),
        n_gemini(doc, "Gemini — Proposer outils", "pk-tool-gem", (580, y1),
                 "={{ $json.prompt }}"),
        n_code(doc, "PK — Outils (parse)", "pk-tool-parse", (800, y1), PK_OUTILS_PARSE),
        n_config_upsert(doc, "PK — Stocker outils", "pk-store-tools", (1020, y1),
                        "TOOLS_CURRENT", "={{ $json.outilsJson }}"),
        # Remise à zéro obligatoire : sans elle, la sélection de la semaine passée pré-coche le menu.
        # On écrit « - » plutôt qu'une chaîne vide : rien ne garantit qu'un mapping `defineBelow`
        # écrive bien une valeur vide plutôt que de l'ignorer, et une remise à zéro qui n'a pas
        # lieu ne se voit pas — elle se contente de rouvrir le menu avec les choix d'il y a huit
        # jours. `parsePicked('-')` rend [], le sentinel est donc lu comme « rien de coché ».
        n_config_upsert(doc, "PK — Reset choix outils", "pk-reset-tools", (1240, y1),
                        "TOOLS_PICKED", "-"),
        n_http(doc, "PK — Envoyer outils", "pk-send-tools", (1460, y1), "sendMessage",
               "={{ JSON.stringify($('PK — Outils (parse)').first().json.tgBody) }}",
               "$('PK — Outils (parse)').first().json.token", once=True),

        # ── Toggle générique — sert les deux menus ──
        n_filter(doc, "IF toggle", "if-toggle", (-100, y2), [cond_str("={{ $json.kind }}", "toggle")]),
        n_code(doc, "PK — Toggle", "pk-toggle", (140, y2), PK_TOGGLE),
        # Deux upserts à clé LITTÉRALE plutôt qu'un seul à clé dynamique (`={{ $json.pickKey }}`) :
        # tous les upserts existants du système écrivent une clé en dur, et rien ne garantit que
        # `matchingColumns` sache résoudre une expression. Ce nœud s'exécute à CHAQUE clic — s'il
        # créait une ligne au lieu de la mettre à jour, la table Config se remplirait de doublons
        # et la sélection ne serait jamais relue. Deux filtres coûtent moins cher que ce pari.
        # `modifie` sur chaque branche : un clic refusé ne doit ni réécrire Config, ni rééditer
        # le message (Telegram rejette une édition sans changement).
        n_filter(doc, "IF sél. outils", "if-pick-tool", (360, y2 - 140),
                 [cond_str("={{ $json.menu }}", "tool"), cond_true("={{ $json.modifie }}")]),
        n_config_upsert(doc, "PK — MAJ outils", "pk-save-tools", (580, y2 - 140),
                        "TOOLS_PICKED", "={{ $json.pickedCsv }}"),
        n_filter(doc, "IF sél. tendances", "if-pick-trend", (360, y2 - 280),
                 [cond_str("={{ $json.menu }}", "trend"), cond_true("={{ $json.modifie }}")]),
        n_config_upsert(doc, "PK — MAJ tendances", "pk-save-trends", (580, y2 - 280),
                        "TRENDS_PICKED", "={{ $json.pickedCsv }}"),
        n_filter(doc, "IF menu modifié", "if-modifie", (360, y2 + 280),
                 [cond_true("={{ $json.modifie }}")]),
        n_http(doc, "PK — accusé (toggle)", "pk-ack-toggle", (360, y2 + 140), "answerCallbackQuery",
               "={{ JSON.stringify({callback_query_id:$json.callbackQueryId,text:$json.answerText,show_alert:!!$json.answerText}) }}"),
        n_http(doc, "PK — Éditer message", "pk-edit", (580, y2 + 280), "editMessageText",
               "={{ JSON.stringify($json.editBody) }}"),

        # ── Validation générique ──
        n_filter(doc, "IF done", "if-done", (-100, y3), [cond_str("={{ $json.kind }}", "done")]),
        n_code(doc, "PK — Done", "pk-done", (140, y3), PK_DONE),
        n_http(doc, "PK — accusé (done)", "pk-ack-done", (360, y3 + 140), "answerCallbackQuery",
               "={{ JSON.stringify({callback_query_id:$json.callbackQueryId,text:$json.answerText,show_alert:!$json.ok}) }}"),
        n_filter(doc, "IF suite tendances", "if-next-trend", (360, y3),
                 [cond_true("={{ $json.ok }}"), cond_str("={{ $json.next }}", "trend")]),
        n_filter(doc, "IF suite expansion", "if-next-expand", (360, y3 + 280),
                 [cond_true("={{ $json.ok }}"), cond_str("={{ $json.next }}", "expand")]),

        # ── Menu TENDANCES — déclenché par la validation des outils ──
        n_code(doc, "PK — Tendances (build)", "pk-trend-build", (580, y4), PK_TENDANCES_BUILD),
        # Pas de nœud qui réécrirait TOOLS_CURRENT avec les seuls outils retenus : `TOOLS_PICKED`
        # contient des INDEX dans la liste complète. Réduire la liste décalerait les index, et
        # l'expansion piocherait le mauvais outil — sans la moindre erreur. L'expansion résout
        # elle-même TOOLS_CURRENT (liste entière) + TOOLS_PICKED (index).
        n_gemini(doc, "Gemini — Proposer tendances", "pk-trend-gem", (800, y4),
                 "={{ $json.prompt }}"),
        n_code(doc, "PK — Tendances (parse)", "pk-trend-parse", (1020, y4), PK_TENDANCES_PARSE),
        n_config_upsert(doc, "PK — Stocker tendances", "pk-store-trends", (1240, y4),
                        "TRENDS_CURRENT", "={{ $json.tendancesJson }}"),
        n_config_upsert(doc, "PK — Reset choix tendances", "pk-reset-trends", (1460, y4),
                        "TRENDS_PICKED", "-"),
        n_http(doc, "PK — Envoyer tendances", "pk-send-trends", (1680, y4), "sendMessage",
               "={{ JSON.stringify($('PK — Tendances (parse)').first().json.tgBody) }}",
               "$('PK — Tendances (parse)').first().json.token", once=True),
    ]
    doc["nodes"].extend(new)

    # Les deux nouveaux aiguillages rejoignent le fan-out existant de « Parse — Update ».
    fanout = [c["node"] for c in doc["connections"]["Parse — Update"]["main"][0]]
    _link(doc, "Parse — Update", fanout + ["IF toggle", "IF done"])

    # Le clic sur un thème ne lance plus l'expansion : il ouvre le menu des outils.
    _link(doc, "IF theme", ["PK — Outils récents (NocoDB)", "TH — accusé", "TH — boutons off"])
    _link(doc, "PK — Outils récents (NocoDB)", ["PK — Outils récents"])
    _link(doc, "PK — Outils récents", ["PK — Outils (build)"])
    _link(doc, "PK — Outils (build)", ["PK — Stocker thème", "Gemini — Proposer outils"])
    _link(doc, "Gemini — Proposer outils", ["PK — Outils (parse)"])
    _link(doc, "PK — Outils (parse)", ["PK — Stocker outils"])
    _link(doc, "PK — Stocker outils", ["PK — Reset choix outils"])
    _link(doc, "PK — Reset choix outils", ["PK — Envoyer outils"])

    _link(doc, "IF toggle", ["PK — Toggle"])
    # L'accusé part TOUJOURS (c'est lui qui affiche « Maximum 3 ») ; l'édition, elle, est gatée.
    _link(doc, "PK — Toggle", ["IF sél. outils", "IF sél. tendances",
                               "PK — accusé (toggle)", "IF menu modifié"])
    _link(doc, "IF sél. outils", ["PK — MAJ outils"])
    _link(doc, "IF sél. tendances", ["PK — MAJ tendances"])
    _link(doc, "IF menu modifié", ["PK — Éditer message"])

    _link(doc, "IF done", ["PK — Done"])
    _link(doc, "PK — Done", ["PK — accusé (done)", "IF suite tendances", "IF suite expansion"])

    _link(doc, "IF suite tendances", ["PK — Tendances (build)"])
    _link(doc, "PK — Tendances (build)", ["Gemini — Proposer tendances"])
    _link(doc, "Gemini — Proposer tendances", ["PK — Tendances (parse)"])
    _link(doc, "PK — Tendances (parse)", ["PK — Stocker tendances"])
    _link(doc, "PK — Stocker tendances", ["PK — Reset choix tendances"])
    _link(doc, "PK — Reset choix tendances", ["PK — Envoyer tendances"])

    # La validation des tendances déclenche l'expansion — la chaîne existante ne bouge pas.
    _link(doc, "IF suite expansion", ["TH — Décliner (build)"])

    return len(new)


def orphans(doc) -> set:
    """Nœuds que rien n'alimente (hors déclencheurs)."""
    cited = set()
    for outs in doc.get("connections", {}).values():
        for branch in outs.get("main", []):
            for c in branch or []:
                cited.add(c["node"])
    return {
        n["name"] for n in doc["nodes"]
        if n["name"] not in cited
        and "trigger" not in n["type"].lower()
        and "webhook" not in n["type"].lower()
    }


def check_graph(doc, wf: str, baseline: set) -> tuple:
    """Contrôles structurels — un graphe cassé ne se voit qu'à l'exécution, donc trop tard.

    `baseline` = les orphelins déjà présents dans l'export de référence. On échoue sur ce qu'on
    introduit, on se contente de signaler ce dont on hérite : réparer en silence la plomberie de
    quelqu'un d'autre est le meilleur moyen de casser autre chose.
    """
    errs, warns = [], []
    names = {n["name"] for n in doc["nodes"]}
    if len(names) != len(doc["nodes"]):
        errs.append(f"{wf} : deux nœuds portent le même nom")
    ids = [n["id"] for n in doc["nodes"]]
    if len(set(ids)) != len(ids):
        errs.append(f"{wf} : deux nœuds portent le même id")

    for src, outs in doc.get("connections", {}).items():
        if src not in names:
            errs.append(f"{wf} : connexion depuis un nœud inexistant « {src} »")
        for branch in outs.get("main", []):
            for c in branch or []:
                if c["node"] not in names:
                    errs.append(f"{wf} : connexion vers un nœud inexistant « {c['node']} »")

    for name in sorted(orphans(doc)):
        if name in baseline:
            warns.append(f"{wf} : nœud orphelin hérité de l'export de référence « {name} »")
        else:
            errs.append(f"{wf} : nœud orphelin INTRODUIT par ce patch « {name} »")
    return errs, warns


def main() -> int:
    os.makedirs(DST, exist_ok=True)
    by_file: dict[str, list] = {}
    for wf, node, kind, code in PATCHES:
        by_file.setdefault(wf, []).append((node, kind, code))

    failures, warnings = [], []
    for wf, patches in by_file.items():
        src = os.path.join(SRC, wf)
        if not os.path.exists(src):
            failures.append(f"{wf} : export de référence introuvable ({src})")
            continue
        with open(src, encoding="utf-8") as fh:
            doc = json.load(fh)
        baseline = orphans(doc)

        for node_name, kind, code in patches:
            node = next((n for n in doc.get("nodes", []) if n.get("name") == node_name), None)
            if node is None:
                failures.append(f"{wf} : nœud « {node_name} » absent — le workflow a changé de forme")
                continue
            params = node.setdefault("parameters", {})
            if kind == "jsCode":
                if "jsCode" not in params:
                    failures.append(f"{wf} / {node_name} : pas de jsCode, ce n'est pas un nœud Code")
                    continue
                # `{PICKER}` doit être résolu ICI aussi : `n_code()` ne sert qu'aux nœuds AJOUTÉS,
                # et un nœud simplement patché repartait en production avec le placeholder littéral.
                params["jsCode"] = code.replace("{PICKER}", picker_lib())
            elif kind == "jsonBody":
                if "jsonBody" not in params:
                    failures.append(f"{wf} / {node_name} : pas de jsonBody, ce n'est pas un nœud HTTP")
                    continue
                params["jsonBody"] = code
            else:  # prompt Gemini
                try:
                    params["messages"]["values"][0]["content"] = code
                except (KeyError, IndexError, TypeError):
                    failures.append(f"{wf} / {node_name} : structure de messages inattendue")
                    continue
            print(f"  ✓ {wf:22} {node_name}")

        # Les menus de choix : uniquement sur le routeur, qui porte les callbacks Telegram.
        if wf == "WF-TG-ROUTER.json":
            try:
                fix_config_filter(doc)
                fix_creer_posts(doc)
                fix_confirme_une_fois(doc)
                added = add_picker_nodes(doc)
                print(f"  ✓ {wf:22} filtre Config corrigé ({len(CONFIG_KEYS)} clés)")
                print(f"  ✓ {wf:22} TH — Créer posts : 5 champs ajoutés au mapper")
                print(f"  ✓ {wf:22} TH — confirme : executeOnce (1 message, plus 21)")
                print(f"  ✓ {wf:22} {added} nœuds ajoutés (menus outils + tendances)")
            except (KeyError, StopIteration) as e:
                failures.append(f"{wf} : câblage des menus impossible — {e}")

        strip_server_meta(doc)
        errs, warns = check_graph(doc, wf, baseline)
        failures.extend(errs)
        warnings.extend(warns)

        out = os.path.join(DST, wf)
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(doc, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"→ {out}  ({len(doc['nodes'])} nœuds)")

    # Le filet de sécurité, construit à partir du routeur (pour hériter de ses credentials).
    router_path = os.path.join(SRC, "WF-TG-ROUTER.json")
    if os.path.exists(router_path) and not failures:
        with open(router_path, encoding="utf-8") as fh:
            router = json.load(fh)
        relance = build_relance_workflow(router)
        errs, _ = check_graph(relance, "WF-PICKS-RELANCE.json", set())
        failures.extend(errs)
        out = os.path.join(DST, "WF-PICKS-RELANCE.json")
        with open(out, "w", encoding="utf-8") as fh:
            json.dump(relance, fh, ensure_ascii=False, indent=2)
            fh.write("\n")
        print(f"→ {out}  ({len(relance['nodes'])} nœuds)")

    if warnings:
        print("\n⚠️  Signalements (hérités de l'export de référence, non corrigés ici) :")
        for w in warnings:
            print(f"   - {w}")
    if failures:
        print("\n⚠️  ÉCHECS :", file=sys.stderr)
        for f in failures:
            print(f"   - {f}", file=sys.stderr)
        return 1
    print(f"\n✓ {len(PATCHES)} nœuds patchés dans {len(by_file)} workflows, menus de choix câblés.")
    print("  Import manuel : voir n8n/strategy-2026/README.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
