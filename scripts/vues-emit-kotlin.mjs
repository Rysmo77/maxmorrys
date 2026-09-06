/* ═══════════════════════════════════════════════════════════════════════════════════════
 * ÉMETTEUR KOTLIN — le second consommateur du contrat, jamais écrit à la main.
 *
 * ⛔ DEUX RÈGLES DE DÉCODAGE SANS LESQUELLES LE CONTRAT TUE L'APPLICATION.
 *
 * Elles n'existaient pas dans le port React Native : les types TypeScript sont effacés à
 * l'exécution, rien ne pouvait échouer. Sur Kotlin, elles décident si une version INSTALLÉE
 * survit à un déploiement du serveur.
 *
 *   1 · LES CLÉS INCONNUES SONT IGNORÉES. Réglage du `Json`, pas de l'émetteur (voir
 *       `Appel.kt`). Sans lui, ajouter un champ côté serveur casse toutes les applications
 *       installées d'un coup, sans déploiement client. Le serveur AJOUTE des champs :
 *       `niveau` a été ajouté à `appCours` pour sortir le niveau de `meta`.
 *
 *   2 · UNE VALEUR D'UNION INCONNUE DÉCODE VERS `INCONNU`, JAMAIS EN LEVANT.
 *       `kotlinx.serialization` lève par défaut sur une valeur d'`enum` inattendue. Un
 *       quatrième rôle, une cinquième collection d'agenda — et l'écran TOMBE au lieu de
 *       dégrader. Chaque énumération émise ici porte donc son cas de repli ET le
 *       sérialiseur qui y retombe.
 *
 * ⚠️ KOTLIN IMBRIQUE LES COMMENTAIRES DE BLOC. Une séquence d'ouverture écrite dans une
 * phrase commente tout ce qui suit, et le compilateur ne le dit qu'à la dernière ligne, sous
 * une erreur qui ne désigne pas la cause. On compte donc le solde avant d'écrire, comme
 * `ds-emit-kotlin.mjs` le fait depuis qu'il s'est fait avoir une fois.
 * ═══════════════════════════════════════════════════════════════════════════════════════ */

/** `Témoignages` -> `Temoignages`. Les diacritiques ne passent ni en identifiant ni en constante. */
const sansAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const morceaux = (s) => sansAccents(s).split(/[^A-Za-z0-9]+/).filter(Boolean);

/** `Rendez-vous` -> `rendezVous` ; `club_sessions` -> `clubSessions`. */
export function enCamel(cle) {
  const parts = morceaux(cle);
  if (parts.length === 0) throw new Error(`vues:gen/kotlin — clé sans identifiant possible : ${cle}`);
  return parts
    .map((m, i) => (i === 0 ? m.charAt(0).toLowerCase() + m.slice(1) : m.charAt(0).toUpperCase() + m.slice(1)))
    .join('');
}

/** `club_sessions` -> `CLUB_SESSIONS` ; `Rendez-vous` -> `RENDEZ_VOUS`. */
export const enConstante = (v) => morceaux(v).join('_').replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

const enPascal = (s) => morceaux(s).map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join('');

/**
 * Un `doc` du contrat -> KDoc.
 *
 * ⚠️ Les séquences de commentaire présentes dans le TEXTE sont neutralisées ici, pas après :
 * une seule ouverture dans une phrase bascule tout le fichier, et la porte de solde en fin
 * d'émission dirait seulement QUE c'est déséquilibré, pas OÙ.
 */
function kdoc(doc, indentation) {
  if (!doc) return '';
  const texte = (Array.isArray(doc) ? doc.join(' ') : doc).replace(/\/\*/g, '/ *').replace(/\*\//g, '* /');
  const lignes = [];
  let ligne = '';
  for (const mot of texte.split(/\s+/)) {
    if (ligne && (ligne + ' ' + mot).length > 96) { lignes.push(ligne); ligne = mot; } else { ligne = ligne ? `${ligne} ${mot}` : mot; }
  }
  if (ligne) lignes.push(ligne);
  if (lignes.length === 1) return `${indentation}/** ${lignes[0]} */\n`;
  return `${indentation}/**\n${lignes.map((l) => `${indentation} * ${l}`).join('\n')}\n${indentation} */\n`;
}

/** Un type du contrat -> son écriture Kotlin. Les listes et objets se composent. */
export function typeKotlin(t, unions) {
  if (t === 'texte') return 'String';
  if (t === 'entier') return 'Int';
  if (t === 'decimal') return 'Double';
  if (t === 'booleen') return 'Boolean';
  /* `horodatage` reste une CHAÎNE, et c'est une décision, pas un raccourci — voir l'en-tête
     de `Etat.kt` : `java.time.Instant` n'existe qu'à partir de l'API 26 sans désucrage, et
     `minSdk` vaut 24. Surtout, la chaîne du serveur est ce que le serveur a DIT ; la
     reparser puis la réafficher fait passer une date par l'horloge du téléphone. */
  if (t === 'horodatage') return 'String';
  if (typeof t === 'object' && t !== null) {
    if (t.liste !== undefined) return `List<${typeKotlin(t.liste, unions)}>`;
    if (t.objet !== undefined) return t.objet;
    if (t.union !== undefined) {
      const nom = unions.get(JSON.stringify(t.union));
      if (!nom) throw new Error(`vues:gen/kotlin — union non enregistrée : ${JSON.stringify(t.union)}`);
      return nom;
    }
  }
  throw new Error(`vues:gen/kotlin — type inconnu : ${JSON.stringify(t)}`);
}

/** Une énumération tolérante : les valeurs connues, plus `INCONNU`, plus son sérialiseur. */
function enumeration(nom, valeurs) {
  const entrees = valeurs.map((v) => `    ${enConstante(v)}("${v}"),`).join('\n');
  return `${kdoc(`Ensemble fermé du contrat. ⛔ Une valeur inattendue décode vers INCONNU au lieu de lever : sans ce repli, une valeur ajoutée côté serveur ferait tomber l'écran d'une version déjà installée.`, '')}@Serializable(with = ${nom}.Serialiseur::class)
enum class ${nom}(val jeton: String) {
${entrees}

    /** Le serveur a dit autre chose que ce que cette version connaît. */
    INCONNU("");

    internal object Serialiseur : KSerializer<${nom}> {
        override val descriptor: SerialDescriptor =
            PrimitiveSerialDescriptor("me.maxmorrys.rysmo.donnees.${nom}", PrimitiveKind.STRING)

        override fun deserialize(decoder: Decoder): ${nom} {
            val brut = decoder.decodeString()
            return entries.firstOrNull { it.jeton == brut } ?: INCONNU
        }

        override fun serialize(encoder: Encoder, value: ${nom}) {
            encoder.encodeString(value.jeton)
        }
    }
}`;
}

/** Une forme -> une `data class` sérialisable. */
function forme(nom, def, unions) {
  const champs = Object.entries(def.champs).map(([c, d]) => {
    const identifiant = enCamel(c);
    /* Le nom JSON fait foi. Quand l'identifiant Kotlin en diffère — accent, trait d'union —
       `@SerialName` est ce qui empêche le champ d'arriver vide sans le dire. */
    const alias = identifiant === c ? '' : `    @SerialName("${c}")\n`;
    const base = typeKotlin(d.type, unions);
    const t = d.nul ? `${base}? = null` : base;
    return `${kdoc(d.doc, '    ')}${alias}    val ${identifiant}: ${t},`;
  });
  return `${kdoc(def.doc, '')}@Serializable
data class ${nom}(
${champs.join('\n')}
)`;
}

export function emettreKotlin(contrat, entete) {
  const unions = contrat.__unions;
  const out = [entete, '', 'package me.maxmorrys.rysmo.donnees', '',
    'import kotlinx.serialization.KSerializer',
    'import kotlinx.serialization.SerialName',
    'import kotlinx.serialization.Serializable',
    'import kotlinx.serialization.descriptors.PrimitiveKind',
    'import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor',
    'import kotlinx.serialization.descriptors.SerialDescriptor',
    'import kotlinx.serialization.encoding.Decoder',
    'import kotlinx.serialization.encoding.Encoder',
    ''];

  out.push('/* ── Les ensembles fermés ─────────────────────────────────────────── */', '');
  for (const [valeursJson, nom] of unions) out.push(enumeration(nom, JSON.parse(valeursJson)), '');

  out.push('/* ── Les formes servies ───────────────────────────────────────────── */', '');
  for (const [nom, def] of Object.entries(contrat.formes)) out.push(forme(nom, def, unions), '');

  if (contrat.formesEntree) {
    out.push("/* ── Les formes d'entrée ──────────────────────────────────────────── */", '');
    for (const [nom, def] of Object.entries(contrat.formesEntree)) out.push(forme(nom, def, unions), '');
  }

  /* ── L'enveloppe ──────────────────────────────────────────────────────────────── */
  out.push(
    kdoc(
      "L'enveloppe commune aux 19 formes de réponse. ⚠️ DEUX NIVEAUX DE DÉBALLAGE, PAS UN : le "
      + "protocole onCall écrit {\"result\": …}, et la charge d'une vue porte {vue, releveA}. "
      + "`releveA` est l'estampille DU SERVEUR ; c'est elle qui date les nombres à l'écran, et "
      + "elle ne doit jamais être remplacée par l'horloge du téléphone.",
      '',
    ) + `@Serializable
data class Reponse<T>(
    val vue: T? = null,
    val releveA: String,
)`,
    '',
  );

  /* ── Ce que `vue: null` signifie ──────────────────────────────────────────────── */
  const noms = Object.keys(contrat.vues);
  out.push(
    kdoc(
      "Les TROIS sens de `vue: null`, que le port aplatissait en une seule phase `vide`. Le "
      + "serveur choisit délibérément `vue: null` plutôt que `permission-denied` pour le Club, et "
      + "`permission-denied` pour la console : cette asymétrie est un choix produit, et elle est "
      + "ici en donnée plutôt qu'en connaissance orale.",
      '',
    ) + `enum class SensDuVide {
    /** Le serveur ne rend jamais \`null\` sur cette vue. Un vide y est un vide de contenu. */
    JAMAIS,

    /** « Le Club est réservé aux membres. » Une invitation, pas une porte. */
    SANS_ACCES,

    /** « Tu n'as encore rien ici. » */
    SANS_DONNEE,
}`,
    '',
  );

  const sens = { jamais: 'JAMAIS', sansAcces: 'SANS_ACCES', sansDonnee: 'SANS_DONNEE' };

  /* ── Les noms de callables ────────────────────────────────────────────────────── */
  out.push(
    kdoc(
      "⭐ LES NOMS DE CALLABLES, À UN SEUL ENDROIT — et c'est ce qui rebranche une porte de CI. "
      + "`tests/unit/worker-routage-callables.test.ts` vérifie que toute callable appelée par le "
      + "natif est bien servie par le Worker ; sans ces littéraux repérables, elle passait au vert "
      + "sur un dossier vide. Un nom absent de MIGRATED n'échoue pas franchement : il part au "
      + "relais mort et reçoit la page HTML 404 de Google, ce qui se lit comme une panne de "
      + "réseau. C'est ce défaut-là qui a empêché tout abonnement au Club.",
      '',
    ) + `object Callables {
${[...new Set(noms.map((n) => n.split('.')[0])), ...Object.keys(contrat.ecritures)].map((n) => `    const val ${enConstante(n)} = "${n}"`).join('\n')}
}`,
    '',
  );

  /* ── Les vues, et leur sens du vide ───────────────────────────────────────────── */
  out.push(
    `object Vues {
${kdoc("Le paramètre `onglet` des vues discriminées : une constante, jamais une chaîne recopiée à l'appel.", '    ')}    object Onglet {
${noms.filter((n) => contrat.vues[n].discriminant).map((n) => `        const val ${enConstante(contrat.vues[n].discriminant.valeur)} = "${contrat.vues[n].discriminant.valeur}"`).join('\n')}
    }

${kdoc("Les noms de VUE du contrat — discriminant compris, contrairement à `Callables`. C'est ce que `LectureDeVue.lire` attend : `appClubListe.membre` désigne une forme de réponse, `appClubListe` désigne la callable qui en sert trois.", '    ')}    object Noms {
${noms.map((n) => `        const val ${enConstante(n)} = "${n}"`).join('\n')}
    }

${kdoc("⚠️ LE DISCRIMINANT D'UNE VUE, ET LE DÉFAUT QU'IL FERME. `appClubListe` s'ouvre en trois selon son paramètre `onglet`, et la fiche de membre a été INATTEIGNABLE parce qu'aucun écran ne passait ce qu'elle exigeait : la vue jetait `invalid-argument`, l'écran sortait par sa branche courte, et le bouton « Signaler ce profil » n'était jamais rendu. Sur les quatre exigences de la guideline App Store 1.2, le signalement comptait pour zéro. Le paramètre est donc POSÉ PAR LE CONTRAT, jamais recopié à l'appel.", '    ')}    val DISCRIMINANT: Map<String, Pair<String, String>> = mapOf(
${noms.filter((n) => contrat.vues[n].discriminant).map((n) => `        "${n}" to ("${contrat.vues[n].discriminant.champ}" to "${contrat.vues[n].discriminant.valeur}"),`).join('\n')}
    )

${kdoc('Le nom de la CALLABLE derrière chaque nom de vue : `appClubListe.membre` s\'appelle `appClubListe`.', '    ')}    val CALLABLE: Map<String, String> = mapOf(
${noms.map((n) => `        "${n}" to "${n.split('.')[0]}",`).join('\n')}
    )

${kdoc('Ce que `vue: null` veut dire, vue par vue. Clé : le nom du contrat, discriminant compris.', '    ')}    val SENS_DU_VIDE: Map<String, SensDuVide> = mapOf(
${noms.map((n) => `        "${n}" to SensDuVide.${sens[contrat.vues[n].vueNulle]},`).join('\n')}
    )

${kdoc("⭐ LES VUES QUE LE SERVEUR SERT SANS JETON — `session: \"aucune\"` dans le contrat. ⛔ SANS CETTE TABLE, `LectureDeVue.lire` COURT-CIRCUITE AVANT L'APPEL : une session `Anonyme` rend `Etat.Anonyme`, une session `NonConfiguree` rend une panne — et la vérification d'un certificat, qui est faite PAR QUELQU'UN QUI N'A PAS DE COMPTE, n'aurait jamais atteint le réseau. C'est le contrat qui décide, pas l'écran : un écran qui aurait dû savoir contourner le court-circuit l'aurait oublié une fois sur deux, et le défaut se serait lu comme « ce certificat est introuvable ».", '    ')}    val SANS_SESSION: Set<String> = setOf(
${noms.filter((n) => contrat.vues[n].session === 'aucune').map((n) => `        "${n}",`).join('\n')}
    )
}`,
    '',
  );

  /* ── Ce que chaque écriture périme ────────────────────────────────────────────── */
  out.push(
    kdoc(
      "⛔ CE QUE CHAQUE ÉCRITURE PÉRIME. Le cache du port n'avait AUCUNE invalidation : "
      + "`marquerLecon` rendait une progression recalculée et rien n'évinçait `appEspace`, "
      + "`appLecon` ni `appCours`. Pendant trente secondes, l'onglet d'à côté montrait l'état "
      + "d'avant. C'est du code généré, pas une discipline.",
      '',
    ) + `object Perime {
    val PAR_ECRITURE: Map<String, List<String>> = mapOf(
${Object.entries(contrat.ecritures).map(([n, e]) => `        "${n}" to listOf(${e.perime.map((v) => `"${v}"`).join(', ')}),`).join('\n')}
    )
}`,
    '',
  );

  const kotlin = out.join('\n').replace(/\n{3,}/g, '\n\n');

  /* ⛔ LA PORTE QUI A DÉJÀ MANQUÉ UNE FOIS, dans l'émetteur de jetons. Kotlin imbrique les
     commentaires de bloc : une ouverture écrite dans une phrase commente tout ce qui suit,
     et l'erreur du compilateur tombe à la dernière ligne, loin de sa cause. */
  let profondeur = 0;
  for (let i = 0; i < kotlin.length - 1; i++) {
    if (kotlin[i] === '/' && kotlin[i + 1] === '*') { profondeur++; i++; }
    else if (kotlin[i] === '*' && kotlin[i + 1] === '/') { profondeur--; i++; }
  }
  if (profondeur !== 0) {
    throw new Error(
      `vues:gen/kotlin — commentaires de bloc déséquilibrés (solde ${profondeur}). `
      + 'Kotlin les imbrique : tout le fichier bascule en commentaire.',
    );
  }

  return kotlin;
}

export { enPascal };
