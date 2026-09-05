/* TABLE DES ROUTES BILINGUES.
   L'arbre est monté deux fois : une fois par langue, avec des segments traduits.
   Chaque valeur anglaise doit être UNIQUE sur toute la table — deux entrées qui
   collident produisent une page inatteignable dans une langue et pas dans l'autre,
   sans erreur de compilation pour le signaler. */
window.MM_ROUTES_I18N = [
  ['Accueil',            '/',                    '/en'],
  ['Formations',         '/formations',          '/courses'],
  ['Blog',               '/blog',                '/blog'],
  ['Podcast',            '/podcast',             '/podcast'],
  ['Vidéos',             '/videos',              '/videos'],
  ['Club des Digitos',   '/club-des-digitos',    '/digitos-club'],
  ['Présence Digitale',  '/presence-digitale',   '/local-presence'],
  ['Agence',             '/agence',              '/agency'],
  ['À propos',           '/a-propos',            '/about'],
  ['Questions',          '/faq',                 '/faq'],
  ['Contact',            '/contact',             '/contact'],
  ['Vérifier',           '/verifier',            '/verify'],
  ['Mon espace',         '/mon-espace',          '/my-learning'],
  ['Connexion',          '/connexion',           '/sign-in']
];

/* Les libellés de navigation. Le verbe anglais n'est pas une traduction du français :
   l'anglais n'a pas de tutoiement, donc la familiarité passe par la contraction et le
   verbe à particule. « I transform you » sonnerait comme une publicité de coach de vie,
   et « digitize » se dit de documents, pas de commerces. */
window.MM_NAV_I18N = [
  ['Je suis Max-Morrys', "I'm Max-Morrys"],
  ['Je te forme',        "I'll train you"],
  ["Je t'informe",       "I'll keep you posted"],
  ['Je te transforme',   "I'll push you further"],
  ['Je te digitalise',   "I'll get you online"],
  ['Contacte-moi',       'Talk to me']
];

/* Vérification d'unicité — exécutée au chargement, parce qu'une collision de segment
   ne produit aucune erreur visible ailleurs. */
(function(){
  const vus = {}, doublons = [];
  window.MM_ROUTES_I18N.forEach(function(r){
    if (vus[r[2]]) doublons.push(r[2]); else vus[r[2]] = 1;
  });
  if (doublons.length) console.error('[i18n] segments anglais en collision : '+doublons.join(', '));
})();
