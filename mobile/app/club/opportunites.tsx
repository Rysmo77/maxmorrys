import { useState } from 'react';
import { View } from 'react-native';
import {
  Body, Button, ChipRow, EmptyState, Eyebrow, Icon, Num, PriceBlock, Surface, Tag, TerritoryCard, useToken,
} from '../../ds';
import { Bilan, ClubScreen } from './_layout';
import { provenance, useOpportunites } from '../../donnees';

/**
 * ── CLUB · LES OPPORTUNITÉS ───────────────────────────────────────────────────────────
 *
 * **LE BUDGET EST ANNONCÉ PAR LA PERSONNE QUI PUBLIE, ET CE N'EST PAS UN DÉTAIL DE MENTIONS
 * LÉGALES.** C'est écrit sur chaque carte, en clair, parce qu'un budget qui aurait l'air de
 * venir de la plateforme fixerait une attente de revenu chez quelqu'un qui organise son temps
 * dessus — et qui refusera peut-être autre chose pour se rendre disponible.
 *
 * LE BILAN EST EN TÊTE, comme sur le fil : c'est ici qu'on vérifie ce que l'abonnement a
 * rapporté, et c'est donc ici qu'il doit être lisible toute l'année, pas seulement à
 * l'échéance.
 *
 * ── CE QUE CET ONGLET NE FAIT PAS ────────────────────────────────────────────────────────
 * Il ne met pas en relation contre commission, il ne classe pas les candidats, et il ne promet
 * aucun volume. Il fait circuler ce qui passe par mon carnet, et il dit d'où ça vient.
 */
const FILTRES = ['Toutes', 'Missions', "Appels d'offres", 'Recrutement'] as const;

export default function ClubOpportunites() {
  const t = useToken();
  const [filtre, setFiltre] = useState<string>(FILTRES[0]);

  const offres = useOpportunites();
  const visibles = (offres.valeur ?? []).filter((o) => {
    if (filtre === 'Toutes') return true;
    if (filtre === 'Missions') return o.type === 'Mission';
    if (filtre === "Appels d'offres") return o.type === "Appel d'offres";
    return false;
  });

  return (
    <ClubScreen titre="Opportunités">
      {/* Le même bilan qu'en tête du fil, pour la même raison. */}
      <Bilan />

      <View style={{ marginTop: 20 }}>
        <ChipRow options={FILTRES} value={filtre} onChange={setFiltre} />
      </View>

      {visibles.length === 0 ? (
        <Surface level="flat" style={{ marginTop: 18, paddingVertical: 6 }}>
          <EmptyState
            glyph={<Icon name="case" size={24} color={t('mmVioletT')} />}
            title={`Rien dans « ${filtre} »`}
            body="Le filtre marche : cette catégorie est vide au relevé du jour. Je ne fabrique pas d'annonce pour meubler — un budget inventé fixe une attente de revenu."
          />
        </Surface>
      ) : (
        <View style={{ marginTop: 16 }}>
          {visibles.map((o, i) => (
            <TerritoryCard
              key={o.titre}
              first={i === 0}
              territory="transforme"
              meta={`${o.type} · ${o.lieu} · ${o.quand}`}
              title={o.titre}
              titleSize={20}
            >
              <View style={{
                flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
                gap: 12, marginTop: 14,
              }}>
                {/* ⚠️ LE BUDGET PEUT MANQUER, et c'est un état légitime : toutes les
                    offres n'en annoncent pas. Un montant inventé fixerait une attente de
                    revenu chez quelqu'un qui organise son temps dessus — on affiche donc
                    l'absence plutôt qu'un chiffre. */}
                {o.budget === null ? (
                  <Num
                    value={null}
                    {...provenance(offres)}
                    fallback="budget non annoncé"
                    style={{ fontSize: 13 }}
                  />
                ) : (
                  <PriceBlock
                    amount={o.budget}
                    {...provenance(offres)}
                    size={21}
                    note={o.par ? `Budget annoncé par ${o.par}` : 'Budget annoncé'}
                  />
                )}
                <Button tone="transforme" size="sm" label="Postuler" />
              </View>
            </TerritoryCard>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 16 }}>
        <Tag tone="warn">Budgets non vérifiés</Tag>
        <Tag>Aucune commission</Tag>
      </View>

      <Surface level="truth" style={{ marginTop: 14, padding: 15 }}>
        <Eyebrow>Les budgets ne sont pas vérifiés</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
          Ils sont annoncés par la personne qui publie. La plateforme ne les contrôle pas, et
          c'est écrit ici plutôt que caché.
        </Body>
        <Body muted style={{ marginTop: 10, fontSize: 12.5, lineHeight: 19 }}>
          Je ne prends aucune commission sur ce qui se conclut, et je ne classe pas les
          candidatures : je fais circuler, et je dis d'où ça vient.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
