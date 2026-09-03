import { useState } from 'react';
import { Alert, View } from 'react-native';
import {
  Body, Button, Eyebrow, Icon, LessonRow, Num, Pipeline, SansDonnees, Surface, Tag, useToken, veil,
} from '../../ds';
import { ConsoleScreen, PiedDePortee } from './_layout';
import { PROSPECT, RELEVE, SOURCE } from '../../contenu/demo';

/**
 * ══ CONSOLE 4/5 · LES PROSPECTS ══ — LE SEUL DES CINQ QUI A QUELQUE CHOSE À TRAITER.
 *
 * **UN PROSPECT EST UNE PERSONNE, PAS UNE LIGNE.** L'écran affiche donc ce qu'elle a demandé
 * et depuis quand elle attend — « nouveau depuis le 6 août » — plutôt qu'un score ou une
 * probabilité de conversion. Le délai est la seule chose qui doit peser sur la décision de
 * traiter maintenant ou pas.
 *
 * QUALIFIER EST L'UNIQUE ACTION. Elle ne vend rien et n'engage rien : elle range la demande
 * dans l'un des trois états, et c'est ce qui déclenche le devis. Le reste du parcours — la
 * proposition, le contrat, la facturation — vit au tableau de bord desktop, parce qu'il se
 * fait au clavier avec le dossier ouvert à côté.
 */
export default function Prospects() {
  const t = useToken();
  const [etape, setEtape] = useState(PROSPECT === null ? 'à qualifier' : 'à qualifier 1');

  function qualifier() {
    Alert.alert(
      'Qualifier cette demande',
      "Trois états, et aucun ne vend quoi que ce soit : « à rappeler », « devis à envoyer », « sans suite ». Le troisième prévient la personne — une demande sans réponse est ce qui coûte le plus cher à une petite structure.",
      [{ text: 'Fermer', style: 'cancel' }],
    );
  }

  return (
    <ConsoleScreen
      titre="Prospects"
      sourcil="Rôle support · écran 4 sur 5"
      lignes={['Qui attend', 'une réponse.']}
    >
      <Pipeline
        stages={PROSPECT === null
          ? ['tout', 'à qualifier', 'devis', 'sans suite']
          : ['tout 1', 'à qualifier 1', 'devis 0', 'sans suite 0']}
        active={etape}
        onSelect={setEtape}
        style={{ marginTop: 18 }}
      />

      {PROSPECT === null ? (
        <SansDonnees
          quoi="la file des prospects"
          origine="du serveur"
          degat="Un prospect inventé porte le nom d'un commerce et un budget. Le rappeler mettrait quelqu'un devant une demande qu'il n'a pas faite."
          style={{ marginTop: 14 }}
        />
      ) : (
        <Surface level="night" style={{ marginTop: 14, paddingHorizontal: 16 }}>
          <LessonRow
            icon={<Icon name="case" size={14} color={t('mmOrange')} />}
            iconBackground={veil(t('mmOrange'), 0.2)}
            title={PROSPECT.titre}
            meta={PROSPECT.meta}
            trailing={<Button tone="quiet" size="sm" label="Qualifier" onPress={qualifier} />}
            last
          />
        </Surface>
      )}

      <Surface level="night" style={{ marginTop: 12, padding: 17 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Eyebrow style={{ fontSize: 10 }}>Depuis combien de temps</Eyebrow>
          {PROSPECT ? <Tag tone="warn">{PROSPECT.statut}</Tag> : null}
        </View>
        <Body muted style={{ fontSize: 12.5, lineHeight: 19, marginTop: 8 }}>
          C'est le seul chiffre qui doit peser : ni score, ni probabilité de conversion. Une
          demande qui attend depuis un mois n'est pas « moins chaude », elle est mal traitée.
        </Body>
      </Surface>

      <Eyebrow style={{ marginTop: 22 }}>Le relevé</Eyebrow>
      <Surface level="night" style={{ marginTop: 10, padding: 17 }}>
        <Num
          value={PROSPECT === null ? null : 1}
          source={SOURCE}
          asOf={RELEVE}
          unit="prospect non qualifié"
          fallback="file non relevée"
          style={{ fontSize: 15 }}
        />
      </Surface>

      <PiedDePortee quoi="Qualifier est l'unique action ; la proposition et la facturation se font au clavier." />
    </ConsoleScreen>
  );
}
