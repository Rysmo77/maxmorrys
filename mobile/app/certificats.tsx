import { router } from 'expo-router';
import {
  Body, Button, EmptyState, Icon, Num, Screen, Surface, isIOS, useToken, veil,
} from '../ds';
import { provenance, useCertificats } from '../donnees';

/**
 * ══ 4 · L'ÉTAT VIDE ══ — UNE INVITATION À AGIR, PAS UNE EXCUSE.
 *
 * **LE ZÉRO EST DATÉ**, et c'est toute la décision de cet écran. « 0 émis depuis l'ouverture
 * de ton compte, le 12 août » est une INFORMATION : elle dit qu'on a compté, et depuis quand.
 * Un tiret ou un « N/A » n'en est pas une — il cache la différence entre « c'est zéro » et
 * « je ne sais pas », et cette différence est précisément ce qu'on vient chercher.
 *
 * L'ÉTAT VIDE A UNE SORTIE. Sans elle, l'écran est un cul-de-sac : la personne apprend qu'elle
 * n'a rien et n'a nulle part où aller. La sortie est la leçon en cours, pas le catalogue —
 * c'est de là que vient le premier certificat.
 */
const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export default function Certificats() {
  const t = useToken();
  const certificats = useCertificats();

  /* La date d'ouverture arrive en ISO du serveur, et en clair de la réplique. On accepte
     les deux : ce qui compte est qu'elle soit lisible, pas d'où elle vient. */
  const brut = certificats.valeur?.ouvertureCompte ?? null;
  const ouverture = (() => {
    if (brut === null) return null;
    const d = new Date(brut);
    return Number.isNaN(d.getTime()) ? brut : `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]}`;
  })();

  return (
    <Screen
      territory="transforme"
      tabbar
      retour="Espace"
      titre={isIOS ? undefined : 'Mes certificats'}
      center
    >
      <Surface level="flat" style={{ padding: 6 }}>
        <EmptyState
          glyph={<Icon name="doc" size={26} color={t('mmVioletT')} />}
          /* Un VOILE de l'encre, pas le pastel `mmVioletC` : les pastels ne sont pas
             redéclarés en nuit, donc le violet nuit se serait posé sur un fond pastel
             clair — 1,9:1. Le voile, lui, suit son encre. */
          glyphBackground={veil(t('mmViolet'), 0.16)}
          title="Aucun certificat pour l'instant."
          body="Le premier arrive à la fin d'une formation. Son code se vérifie sans compte, et il reste valable même si tu supprimes le tien."
          action={
            <Button
              tone="transforme"
              label="Reprendre la leçon 5"
              onPress={() => router.push('/lecon')}
            />
          }
        />
      </Surface>

      {/* LE ZÉRO EST COMPTÉ, plus écrit. Il valait `0` en dur — juste au-dessus d'une phrase
          expliquant qu'un zéro daté est une information. Un zéro qu'on n'a pas compté n'en
          est pas une, et c'était précisément le cas. */}
      <Body muted style={{ fontSize: 11.5, textAlign: 'center', lineHeight: 18, marginTop: 16, color: t('textFaint') }}>
        <Num
          value={certificats.valeur ? certificats.valeur.certificats.length : null}
          {...provenance(certificats)}
          fallback="—"
          style={{ fontSize: 11.5, color: t('textMuted') }}
        />
        {' '}émis{ouverture ? ` depuis l'ouverture de ton compte, le ${ouverture}` : ''}. Un
        zéro daté est une information ; un tiret n'en est pas une — et sans date d'ouverture,
        ce zéro en dit déjà moins.
      </Body>
    </Screen>
  );
}
