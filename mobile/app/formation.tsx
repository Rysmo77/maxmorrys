import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Icon, LessonRow, Mesh, Num, PriceBlock, Surface, Tag, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LA FICHE DE FORMATION — l'écran qui doit convaincre SANS preuve sociale.
 *
 * Le kit est explicite et la production le suit : ni note, ni nombre d'inscrits, ni
 * témoignage. La plateforme vient d'ouvrir ; il n'y a rien d'honnête à en dire. Ce qui prend
 * leur place n'est pas un vide, c'est **l'encart de vérité** — il dit ce qui est vérifiable
 * (le nombre de leçons, le code du certificat) ET pourquoi le reste manque. Un vide que le
 * visiteur interprète lui-même est plus coûteux qu'un manque expliqué.
 *
 * TOUT CE QUI EST CHIFFRÉ ICI ARRIVE PAR LA ROUTE. Cet écran ne calcule rien et n'invente
 * rien ; ce qu'il ne reçoit pas, il le dit :
 *
 *   ?slug=referencement-local        l'identifiant, seul à ouvrir le paiement
 *   &titre=Référencement local…      le titre affiché
 *   &categorie=SEO                   le sourcil
 *   &prix=95000                      le montant AFFICHÉ — celui débité est recalculé serveur
 *   &apercu=4                        les minutes d'aperçu réellement libres
 *   &lecons=47&modules=6             ce que l'encart de vérité peut prouver
 *   &asOf=2026-09-01T10:00:00Z       la date de ces relevés (règle 6)
 *   &programme=titre|leçons|min|1    une occurrence PAR module ; « 1 » = module libre
 *
 * ⚠️ « 14 jours pour changer d'avis » n'est PAS repris de la maquette. La production a retiré
 *    cette garantie des surfaces de vente parce que l'article 6 des CGV la refuse dès que le
 *    contenu a été ouvert. Tant que la décision commerciale n'est pas prise, l'afficher
 *    reviendrait à promettre un remboursement que le contrat refuse.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

type Module = { titre: string; lecons: number | null; minutes: number | null; libre: boolean };

function nombre(brut: string | undefined): number | null {
  if (!brut) return null;
  const n = Number(brut);
  return Number.isFinite(n) ? n : null;
}

function lireProgramme(brut: string | string[] | undefined): Module[] {
  const entrees = brut === undefined ? [] : Array.isArray(brut) ? brut : [brut];
  return entrees.flatMap((entree) => {
    const [titre, lecons, minutes, libre] = entree.split('|');
    if (!titre) return [];
    return [{ titre, lecons: nombre(lecons), minutes: nombre(minutes), libre: libre === '1' }];
  });
}

export default function Formation() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { slug, titre, categorie, prix, apercu, lecons, modules, programme, asOf } =
    useLocalSearchParams<{
      slug?: string; titre?: string; categorie?: string; prix?: string; apercu?: string;
      lecons?: string; modules?: string; programme?: string | string[]; asOf?: string;
    }>();

  const propose = asOf ? new Date(asOf) : null;
  const releve = propose && !Number.isNaN(propose.getTime()) ? propose : new Date();

  const montant = nombre(prix);
  const minutesLibres = nombre(apercu);
  const plan = lireProgramme(programme);

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>{categorie ? `Formation · ${categorie}` : 'Formation'}</Eyebrow>

        {/*
          Le titre passe par `children` et non par `lines` : les lignes d'un titre d'affichage
          se DÉCIDENT à l'écriture, langue par langue, et celui-ci arrive du serveur. On ne
          peut donc pas les écrire — on laisse le repli naturel, comme `paiement.tsx`.
        */}
        <View style={{ marginTop: 6 }}>
          <Display size="sm">{titre ?? 'Cette formation'}</Display>
        </View>

        {/* L'APERÇU. Le bloc est là, la vidéo n'y est pas, et il le dit lui-même. */}
        <Surface
          level="hero"
          style={{ marginTop: 16, paddingVertical: 30, paddingHorizontal: 20, alignItems: 'center' }}
        >
          <Icon name="play" size={28} color={t('mmBleu')} />
          {minutesLibres !== null ? (
            // `alignSelf` est forcé : `Tag` se cale à gauche par défaut, ce qui le décrocherait
            // du bloc centré. Le style de l'appelant passe après la base du composant.
            <Tag style={{ marginTop: 12, alignSelf: 'center' }}>
              Aperçu ·{' '}
              <Num
                value={minutesLibres}
                source="server"
                asOf={releve}
                unit="min gratuites"
                style={{ fontSize: 11 }}
              />
            </Tag>
          ) : null}
          <Body muted style={{ marginTop: 12, fontSize: 12.5, textAlign: 'center' }}>
            La vidéo vient du même stockage que sur le site. Ce port rend le bloc, pas encore
            la lecture — et je préfère te le dire qu'afficher une vignette qui ne s'ouvre pas.
          </Body>
        </Surface>

        {/* LA CARTE DE PRIX. */}
        <Surface level="hero" style={{ marginTop: 16, padding: 20 }}>
          {montant !== null ? (
            <PriceBlock
              amount={montant}
              source="server"
              asOf={releve}
              note="Une fois, accès à vie."
            />
          ) : (
            <>
              <Num
                value={null}
                source="server"
                asOf={releve}
                fallback="prix non transmis"
                style={{ fontSize: 22 }}
              />
              <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
                Je ne l'affiche pas tant qu'il ne m'est pas transmis. Un montant approché sur un
                écran d'achat coûte plus cher qu'un montant absent.
              </Body>
            </>
          )}

          <Button
            tone="forme"
            label="Je m'inscris"
            disabled={!slug}
            style={{ marginTop: 15 }}
            onPress={() => router.push({
              pathname: '/paiement',
              params: {
                ...(slug ? { slug } : {}),
                ...(titre ? { titre } : {}),
                ...(montant !== null ? { prix: String(montant) } : {}),
              },
            })}
          />
          {!slug ? (
            <Body muted style={{ marginTop: 10, fontSize: 12.5 }}>
              L'identifiant de la formation ne m'a pas été transmis : sans lui je ne sais pas
              quoi te faire payer, donc je ne t'ouvre pas le paiement.
            </Body>
          ) : null}

          <View style={{ marginTop: 13, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Tag tone="ok">Certificat vérifiable par son code</Tag>
            <Tag>Wave · Orange Money</Tag>
          </View>
        </Surface>

        {/* L'ENCART DE VÉRITÉ — ce qui remplace la preuve sociale, et l'explique. */}
        <Surface level="truth" style={{ marginTop: 15, padding: 16 }}>
          <Eyebrow>Ce que je peux te prouver</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            <Num
              value={nombre(lecons)}
              source="server"
              asOf={releve}
              unit="leçons"
              fallback="nombre de leçons non relevé"
              style={{ fontSize: 12.5 }}
            />
            {', '}
            <Num
              value={nombre(modules)}
              source="server"
              asOf={releve}
              unit="modules"
              fallback="nombre de modules non relevé"
              style={{ fontSize: 12.5 }}
            />
            , un certificat dont le code se vérifie sans compte. Je n'affiche ni note ni nombre
            d'inscrits : la plateforme vient d'ouvrir, je n'ai rien d'honnête à en dire.
          </Body>
        </Surface>

        {/* LE PROGRAMME. */}
        <Eyebrow style={{ marginTop: 22 }}>Le programme</Eyebrow>
        <Surface level="flat" style={{ marginTop: 10, paddingHorizontal: 18, paddingVertical: 6 }}>
          {plan.length > 0 ? (
            plan.map((module, i) => (
              <LessonRow
                key={`${module.titre}-${i}`}
                icon={(
                  <Icon
                    name={module.libre ? 'play' : 'lock'}
                    size={14}
                    color={module.libre ? t('paperFixed') : t('ink2')}
                  />
                )}
                iconBackground={module.libre ? t('mmBleu') : undefined}
                title={module.titre}
                meta={(
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                    <Num
                      value={module.lecons}
                      source="server"
                      asOf={releve}
                      unit="leçons"
                      fallback="leçons non relevées"
                      style={{ fontSize: 12 }}
                    />
                    <Num
                      value={module.minutes}
                      source="server"
                      asOf={releve}
                      unit="min"
                      fallback="durée non relevée"
                      style={{ fontSize: 12 }}
                    />
                  </View>
                )}
                trailing={module.libre ? <Tag tone="ok">Gratuit</Tag> : undefined}
                last={i === plan.length - 1}
              />
            ))
          ) : (
            <View style={{ paddingVertical: 14 }}>
              <Body style={{ fontWeight: '700' }}>Le programme ne m'a pas été transmis.</Body>
              <Body muted style={{ marginTop: 8, fontSize: 13 }}>
                Il vient du catalogue, module par module, et ce port ne l'interroge pas encore.
                Je ne te dresse pas une liste de modules en attendant : tu jugerais de ce que tu
                achètes sur une table des matières que j'aurais écrite pour faire joli.
              </Body>
            </View>
          )}
        </Surface>
      </ScrollView>
    </View>
  );
}
