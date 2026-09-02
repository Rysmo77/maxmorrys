import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Avatar, Body, Button, ChipRow, Display, Eyebrow, Icon, IconButton, Num, PriceBlock,
  Screen, Surface, TerritoryCard, isIOS, useToken,
} from '../../ds';
import { FORMATION, FORMATION_2, MOI, RELEVE, SOURCE } from '../../contenu/reference';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 1 · LE CATALOGUE ══ — DEUX FORMATIONS, ET RIEN QUI RESSEMBLE À UNE PREUVE SOCIALE.
 *
 * NI NOTE, NI COMPTEUR D'INSCRITS, NI TÉMOIGNAGE. Ce n'est pas de la modestie : la plateforme
 * vient d'ouvrir, il n'y a rien d'honnête à en dire, et un chiffre de façade est ce qui se
 * vérifie le plus vite — au premier écran après le paiement. Ce qui prend leur place, c'est
 * l'encart de vérité : il dit pourquoi il n'y a que deux titres.
 *
 * ── DEUX ÉTATS, ET LA DIFFÉRENCE ENTRE EUX EST L'INFORMATION ─────────────────────────────
 * Le nombre de formations arrive par la route quand le serveur l'a compté (`?compte=`), et
 * l'écran distingue alors trois situations que la plupart des applications confondent :
 *
 *   compte absent  → le contenu de RÉFÉRENCE du transfert, cité comme tel.
 *   compte = 0     → « le catalogue ouvre bientôt » : un zéro DATÉ est une information.
 *   compte > 0     → la liste transmise.
 *
 * Un tiret ne dirait aucune des trois.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const CATALOGUE = [FORMATION, FORMATION_2] as const;

export default function Cours() {
  const t = useToken();
  const { compte } = useLocalSearchParams<{ compte?: string }>();
  const compteServeur = compte ? Number(compte) : Number.NaN;
  const videConfirme = Number.isFinite(compteServeur) && compteServeur === 0;

  return (
    <Screen
      territory="forme"
      tabbar
      titre={isIOS ? undefined : 'Mes cours'}
      droite={
        <>
          <IconButton label="Chercher une formation">
            <Icon name="search" size={17} color={t('textBody')} strokeWidth={2.4} />
          </IconButton>
          <IconButton label="Notifications" badge>
            <Icon name="bell" size={17} color={t('textBody')} strokeWidth={2} />
          </IconButton>
        </>
      }
    >
      {videConfirme ? (
        <>
          <Eyebrow style={{ marginTop: 6 }}>Je te forme</Eyebrow>
          <Display size={29} lines={['LE CATALOGUE', 'OUVRE BIENTÔT.']} style={{ marginTop: 8 }} />
          <Surface level="hero" style={{ marginTop: 20, padding: 22 }}>
            <Body style={{ fontWeight: '700' }}>Aucune formation n'est encore en ligne.</Body>
            <Body muted style={{ marginTop: 9 }}>
              Je préfère te le dire que te faire cliquer dans le vide.
            </Body>
            <Num
              value={0}
              source="server"
              asOf={new Date()}
              unit="formation en ligne"
              style={{ fontSize: 15, marginTop: 12 }}
            />
          </Surface>
          <Body muted style={{ marginTop: 18, fontSize: 12.5, color: t('textFaint') }}>
            Je ne te propose pas de te prévenir par e-mail : je n'ai aucun canal d'envoi. Le
            widget et la notification, eux, existent — ils se règlent dans ton profil.
          </Body>
        </>
      ) : (
        <>
          <Eyebrow style={{ marginTop: 6 }}>Je te forme · accès à vie</Eyebrow>
          <Display size={29} lines={['2 FORMATIONS.', 'ACCÈS À VIE.']} style={{ marginTop: 8 }} />
          <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
            Le module d'ouverture de chacune se regarde sans payer, ici, maintenant. Tu juges
            avant de sortir de l'application.
          </Body>

          {/* Le filtre porte SON compte : « Tout · 2 » dit la taille du catalogue en même
              temps qu'il propose de le réduire. */}
          <ChipRow
            options={['Tout · 2', 'Débutant · 1', 'Avancé · 1']}
            value="Tout · 2"
            style={{ marginTop: 18 }}
          />

          <View style={{ marginTop: 16 }}>
            {CATALOGUE.map((f, i) => (
              <TerritoryCard
                key={f.slug}
                first={i === 0}
                /* TOUTES LES CARTES SONT `forme`. Le transfert alterne bleu et violet pour le
                   rythme ; ici le liseré porte du SENS — une formation relève de « je te
                   forme », et lui donner la teinte de « je te transforme » dirait quelque
                   chose de faux sur ce qu'on achète. */
                territory="forme"
                meta={f.meta}
                title={f.titre}
                titleSize={21}
              >
                <View style={{
                  flexDirection: 'row', alignItems: 'flex-end',
                  justifyContent: 'space-between', gap: 12, marginTop: 16,
                }}>
                  <PriceBlock
                    amount={f.prix}
                    source={SOURCE}
                    asOf={RELEVE}
                    size={25}
                    note={`Une fois · ou ${f.echelonnement}`}
                  />
                  <Button
                    tone="primary"
                    size="sm"
                    label="Voir"
                    onPress={() => router.push({
                      pathname: '/formation',
                      params: { slug: f.slug, titre: f.titre, prix: String(f.prix) },
                    })}
                  />
                </View>
              </TerritoryCard>
            ))}
          </View>

          <Surface level="truth" style={{ marginTop: 18, padding: 15 }}>
            <Eyebrow>Pourquoi il n'y a que deux titres</Eyebrow>
            <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
              Parce que je les monte moi-même, une par une, et que je préfère deux formations
              finies à dix annoncées. Ni note, ni nombre d'inscrits : la plateforme vient
              d'ouvrir.
            </Body>
          </Surface>
        </>
      )}

      {/* La reprise reste atteignable depuis l'onglet où l'on vient chercher un cours. */}
      <Surface level="flat" style={{ marginTop: 14, padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar initials={MOI.initiale} size={38} />
          <View style={{ flex: 1 }}>
            <Body style={{ fontWeight: '700' }}>Reprendre où tu t'es arrêtée</Body>
            <Body muted style={{ fontSize: 12.5, marginTop: 2 }}>{FORMATION.moduleEnCours}</Body>
          </View>
          <Button tone="quiet" size="sm" label="Ouvrir" onPress={() => router.push('/lecon')} />
        </View>
      </Surface>
    </Screen>
  );
}
