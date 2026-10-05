import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Body, Button, Display, DocLine, Eyebrow, Field, Screen, Surface, Tag, isIOS } from '../ds';
import { ErreurAppel } from '../donnees/appel';
import { verifierCertificat, type Verification } from '../donnees';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ VÉRIFIER UN CERTIFICAT ══ — LE SEUL ÉCRAN QUI N'EST PAS POUR L'APPRENANTE.
 *
 * ⛔ LE LIEN PROFOND EXISTAIT SANS DESTINATION. `app.json` et `assetlinks.json` déclarent le
 * préfixe `/verifier` (vérifié en ligne par Google) ; aucun écran ne le servait, et la vue
 * publique `appVerifierCertificat` du Worker n'était appelée par personne.
 *
 * Ici c'est un TIERS qui lit — un employeur, un client, un jury. D'où l'absence de vente, de
 * lien vers le catalogue et d'invitation à créer un compte. Le tutoiement reste : la page web
 * équivalente tutoie, et une marque n'a qu'une voix (`voix-tutoiement.test.ts`).
 *
 * ── ⛔ LES TROIS RÉPONSES SONT DISTINCTES, ET C'EST LE CŒUR DE L'ÉCRAN ──────────────────
 * « authentique », « aucun certificat à ce code » et « la vérification n'a pas abouti ». Une
 * panne rendue en « introuvable » fait conclure à un FAUX DOCUMENT — le seul défaut de ce
 * chemin qui puisse coûter un emploi à quelqu'un. (Écran de la réécriture Kotlin, reporté.)
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

/** Comme le serveur et la page web : capitales, ni espace ni tiret surnuméraire. */
function normaliser(brut: string): string {
  const nu = brut.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return nu.startsWith('MM') ? `MM-${nu.slice(2)}` : nu;
}

type Phase =
  | { etat: 'attente' }
  | { etat: 'recherche' }
  | { etat: 'reponse'; verification: Verification }
  | { etat: 'echec'; motif: string };

export default function Verifier() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const recu = Array.isArray(code) ? code[0] : code;
  const [saisie, setSaisie] = useState(recu ?? '');
  const [phase, setPhase] = useState<Phase>({ etat: 'attente' });
  const tour = useRef(0);

  async function verifier(brut: string) {
    const propre = normaliser(brut);
    if (!propre) return;
    const mien = ++tour.current;
    setPhase({ etat: 'recherche' });
    try {
      const verification = await verifierCertificat(propre);
      if (mien === tour.current) setPhase({ etat: 'reponse', verification });
    } catch (e: unknown) {
      if (mien !== tour.current) return;
      setPhase({
        etat: 'echec',
        motif: e instanceof ErreurAppel && e.code === 'invalid-argument'
          ? "Ce code n'a pas la forme d'un code de certificat. Vérifie la saisie."
          : "La vérification n'a pas abouti. Ce n'est PAS une réponse sur le certificat : réessaie dans un instant.",
      });
    }
  }

  /* ⭐ UN LIEN PROFOND VÉRIFIE TOUT DE SUITE : quelqu'un qui ouvre `maxmorrys.me/verifier?code=…`
     a déjà donné le code, le lui redemander serait un geste de trop. */
  useEffect(() => {
    if (recu) void verifier(recu);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recu]);

  return (
    <Screen territory="forme" retour="Retour" titre={isIOS ? undefined : 'Vérifier un certificat'}>
      <Eyebrow style={{ marginTop: 6 }}>Vérification publique · sans compte</Eyebrow>
      <Display size={27} lines={['CE CERTIFICAT', 'EST-IL VRAI ?']} style={{ marginTop: 8 }} />

      <Surface level="flat" style={{ marginTop: 18, padding: 17 }}>
        <Field
          label="Code du certificat"
          value={saisie}
          onChangeText={setSaisie}
          placeholder="MM-XXXXXXXXXX"
          hint="Colle le code figurant sur le document."
        />
        <Button
          tone="forme"
          label={phase.etat === 'recherche' ? 'Vérification…' : 'Vérifier'}
          style={{ marginTop: 12 }}
          disabled={phase.etat === 'recherche' || normaliser(saisie) === ''}
          onPress={() => { void verifier(saisie); }}
        />
      </Surface>

      {phase.etat === 'reponse' && phase.verification.verdict === 'trouve' ? (
        <Surface level="flat" style={{ marginTop: 16, padding: 17 }}>
          <Tag tone="ok">Authentique</Tag>
          <DocLine label="Titulaire" value={phase.verification.certificat.titulaire} />
          <DocLine label="Formation" value={phase.verification.certificat.formation} />
          <DocLine label="Émis le" value={new Date(phase.verification.certificat.emisLe).toLocaleDateString('fr-FR')} />
          <DocLine label="Code" value={phase.verification.certificat.code} last />
        </Surface>
      ) : null}

      {phase.etat === 'reponse' && phase.verification.verdict === 'inconnu' ? (
        <Surface level="truth" style={{ marginTop: 16, padding: 16 }}>
          <Eyebrow>Aucun certificat à ce code</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 13, lineHeight: 20 }}>
            Le serveur a répondu : ce code n'a jamais été émis. Vérifie la saisie avant d'en
            conclure quoi que ce soit — une lettre de travers suffit.
          </Body>
        </Surface>
      ) : null}

      {phase.etat === 'echec' ? (
        <Surface level="truth" style={{ marginTop: 16, padding: 16 }}>
          <Eyebrow>Pas de réponse</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 13, lineHeight: 20 }}>{phase.motif}</Body>
        </Surface>
      ) : null}
    </Screen>
  );
}
