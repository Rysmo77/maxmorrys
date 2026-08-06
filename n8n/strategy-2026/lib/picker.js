/**
 * Logique des menus de choix Telegram (outils ATELIER, tendances RADAR).
 *
 * ⚠️ CE FICHIER EST LA SOURCE UNIQUE. Il est :
 *   1. inliné tel quel dans les nœuds Code de WF-TG-ROUTER par
 *      `scripts/n8n-patch-strategy-2026.py` ;
 *   2. évalué par `tests/unit/telegram-picker.test.ts`, via `new Function(...)` — donc dans les
 *      mêmes conditions qu'un nœud Code.
 *
 * D'où deux contraintes :
 *   - **aucune syntaxe de module** : ni `import`, ni `export`, ni `module.exports`. Un nœud Code
 *     n8n reçoit un corps de fonction, pas un module. Le test échouerait au chargement.
 *   - **aucune dépendance** : ni Luxon, ni les variables n8n (`$json`, `$now`…). Ce fichier ne
 *     contient que du calcul pur ; la glu propre à chaque nœud vit dans le patcher.
 *
 * On écrit la logique ici plutôt que dans le patcher pour qu'elle soit testable. Un toggle qui se
 * trompe d'index ne casse rien de visible : il coche simplement le mauvais outil, et la semaine
 * entière part sur le mauvais sujet.
 */

/** Combien de choix par menu. 4 contenus ATELIER par semaine, 2 contenus RADAR. */
var PICK_LIMITS = { tool: 3, trend: 2 };

/** Habillage de chaque menu. */
var MENUS = {
  tool: {
    icone: '🧰',
    titre: 'Les outils de la semaine',
    aide: '👉 Coche ceux que tu veux traiter, puis « Terminé ».',
    vide: 'Choisis au moins un outil',
  },
  trend: {
    icone: '📡',
    titre: 'Les tendances de la semaine',
    aide: '👉 Coche celle(s) à décrypter, puis « Terminé ».',
    vide: 'Choisis au moins une tendance',
  },
};

/** Échappe ce que Telegram interpréterait comme du HTML (`parse_mode: 'HTML'`). */
function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Lit une liste d'options stockée en JSON dans Config. Tolère tout : ne jette jamais. */
function parseList(raw) {
  if (Array.isArray(raw)) return raw;
  try {
    var v = JSON.parse(raw || '[]');
    return Array.isArray(v) ? v : [];
  } catch (e) {
    return [];
  }
}

/**
 * Lit la sélection stockée en CSV d'index (« 0,2,5 »).
 * Dédoublonne et écarte tout ce qui n'est pas un index valide — la valeur vient de la table
 * Config (NocoDB), où elle a pu être éditée à la main.
 */
function parsePicked(raw, optionCount) {
  var seen = {};
  var out = [];
  String(raw === undefined || raw === null ? '' : raw)
    .split(',')
    .forEach(function (part) {
      var n = parseInt(part, 10);
      if (!isFinite(n) || n < 0) return;
      if (optionCount !== undefined && n >= optionCount) return;
      if (seen[n]) return;
      seen[n] = true;
      out.push(n);
    });
  return out;
}

/**
 * Retrouve le texte utile dans une réponse Gemini, quelle que soit sa forme.
 *
 * Selon la configuration du nœud, n8n rend soit l'objet déjà simplifié, soit **l'enveloppe brute**
 * `{candidates:[{content:{parts:[{text:"…"}]}}]}`. Un parseur qui n'attend que la forme simplifiée
 * ne lève aucune erreur : il ne trouve rien, retombe sur son défaut, et le menu n'affiche plus
 * qu'une seule option. Vécu en production le 2026-08-06 — Gemini avait bien renvoyé 7 outils.
 */
function pickText(x) {
  if (x === null || x === undefined) return null;
  if (typeof x === 'string') return x;
  if (Array.isArray(x)) {
    for (var i = 0; i < x.length; i++) {
      var t = pickText(x[i]);
      if (t) return t;
    }
    return null;
  }
  if (typeof x === 'object') {
    if (x.candidates) return pickText(x.candidates);
    if (x.content) return pickText(x.content);
    if (x.parts) return pickText(x.parts);
    if (typeof x.text === 'string') return x.text;
    if (x.output) return pickText(x.output);
    if (x.message) return pickText(x.message);
  }
  return null;
}

/**
 * Extrait un tableau d'une réponse de modèle, sous l'une des clés attendues.
 * Tolère : objet déjà simplifié, enveloppe brute, JSON entouré de ```` ```json ````, tableau nu.
 * Rend `[]` plutôt que de jeter — au pire l'appelant applique son repli, en connaissance de cause.
 */
function extraireListe(input, cles) {
  var i;
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    for (i = 0; i < cles.length; i++) {
      if (Array.isArray(input[cles[i]])) return input[cles[i]];
    }
  }
  var txt = pickText(input);
  if (typeof txt === 'string') {
    txt = txt.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    try {
      var o = JSON.parse(txt);
      for (i = 0; i < cles.length; i++) {
        if (o && Array.isArray(o[cles[i]])) return o[cles[i]];
      }
      if (Array.isArray(o)) return o;
    } catch (e) { /* réponse non JSON : on rend [] */ }
  }
  return [];
}

/** Sérialise la sélection pour Config. Trié, pour que deux états identiques s'écrivent pareil. */
function serializePicked(picked) {
  return picked
    .slice()
    .sort(function (a, b) { return a - b; })
    .join(',');
}

/**
 * Coche / décoche une option.
 * Décocher est toujours permis ; cocher est refusé une fois le quota atteint — sinon on
 * accumulerait douze outils et la semaine n'aurait plus de fil.
 * Retourne `{picked, refus}` : `refus` est un message à afficher, ou null.
 */
function togglePick(pickedRaw, index, menu, optionCount) {
  var max = PICK_LIMITS[menu] || 3;
  var picked = parsePicked(pickedRaw, optionCount);
  var i = parseInt(index, 10);

  if (!isFinite(i) || i < 0 || (optionCount !== undefined && i >= optionCount)) {
    return { picked: picked, refus: 'Choix inconnu' };
  }
  var at = picked.indexOf(i);
  if (at >= 0) {
    picked.splice(at, 1);
    return { picked: picked, refus: null };
  }
  if (picked.length >= max) {
    return { picked: picked, refus: 'Maximum ' + max + ' — décoche-en un d’abord' };
  }
  picked.push(i);
  return { picked: picked, refus: null };
}

/**
 * Construit le message et le clavier d'un menu.
 * Le clavier reprend l'état coché : c'est lui qui rend la multi-sélection lisible, puisque
 * Telegram ne connaît que des boutons sans mémoire.
 */
function renderMenu(menu, options, picked, sousTitre) {
  var m = MENUS[menu] || MENUS.tool;
  var max = PICK_LIMITS[menu] || 3;
  var mark = function (i) { return picked.indexOf(i) >= 0 ? '✅' : '⬜'; };

  var lignes = options.map(function (o, i) {
    var nom = esc(o && (o.nom || o.titre) ? (o.nom || o.titre) : 'Option ' + (i + 1));
    var angle = o && o.angle ? ' — ' + esc(o.angle) : '';
    return mark(i) + ' ' + (i + 1) + '. <b>' + nom + '</b>' + angle;
  });

  var entete = m.icone + ' <b>' + m.titre + ' — ' + picked.length + '/' + max + ' choisis</b>';
  var texte = entete +
    (sousTitre ? '\n<i>' + esc(sousTitre) + '</i>' : '') +
    '\n\n' + lignes.join('\n') +
    '\n\n' + m.aide;

  // Trois boutons par ligne : au-delà, les libellés deviennent illisibles sur mobile.
  var rows = [];
  for (var i = 0; i < options.length; i += 3) {
    var row = [];
    for (var j = i; j < Math.min(i + 3, options.length); j++) {
      row.push({ text: mark(j) + ' ' + (j + 1), callback_data: 'pick:' + menu + ':' + j });
    }
    rows.push(row);
  }
  rows.push([{
    text: picked.length ? '✓ Terminé (' + picked.length + ')' : '✓ Terminé — coche d’abord',
    callback_data: 'done:' + menu + ':0',
  }]);

  return { text: texte, keyboard: { inline_keyboard: rows } };
}

/** Les options réellement retenues, dans l'ordre d'affichage. */
function selectedOptions(options, picked) {
  return picked
    .slice()
    .sort(function (a, b) { return a - b; })
    .map(function (i) { return options[i]; })
    .filter(function (o) { return !!o; });
}

/*
 * Pas d'export : ce fichier est un CORPS DE FONCTION, pas un module. Le test l'évalue via
 * `new Function(source + 'return {…}')`, c'est-à-dire exactement comme n8n exécute un nœud Code —
 * ce qui vérifie au passage qu'il ne contient aucune syntaxe de module.
 */
