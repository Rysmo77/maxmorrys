import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Mesh, Num, PriceBlock, Surface, Tag, TerritoryCard, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LE CATALOGUE — deux états dessinés, et AUCUNE formation inventée entre les deux.
 *
 * La maquette en dessine deux : `Catalogue` (« le catalogue ouvre bientôt ») et
 * `CataloguePlein` (les cartes, le prix, le bouton). Les porter tous les deux pose une
 * question que la maquette n'a pas à se poser et que ce port, si : **d'où vient la liste ?**
 *
 * Ce dossier n'a pas de couche de données (README, « aucun écran ne simule de données »).
 * Remplir l'état plein d'un titre et d'un prix écrits ici en ferait une vitrine mensongère —
 * et un prix faux sur le premier écran du tunnel d'achat est le pire endroit possible pour un
 * chiffre faux. L'écran reçoit donc sa liste par la route, et rien d'autre :
 *
 *   ?compte=2                          le nombre de formations en ligne, COMPTÉ côté serveur
 *   &asOf=2026-09-01T10:00:00Z         la date de ce comptage (règle 6)
 *   &formations=slug|titre|prix        une occurrence PAR formation (paramètre répétable)
 *
 * Et c'est `compte` qui distingue les deux choses qu'un écran vide confond toujours :
 *
 *   compte=0   → « le catalogue ouvre bientôt » : un ZÉRO DATÉ, donc une information.
 *   absent     → « je ne sais pas » : pas la même phrase, parce que ce n'est pas le même fait.
 *
 * CE QUE LA MAQUETTE PORTE ET QUE JE NE PORTE PAS, et pourquoi :
 *
 *   • Les cartes « en attendant, tout ça est gratuit » (articles, podcast) demandent la liste
 *     éditoriale, que ce port n'interroge pas davantage. Deux listes inventées valent deux
 *     mensonges, pas un de moins.
 *   • La rangée de puces « Tout · Débutant · Avancé » : un filtre qui ne filtre rien ment sur
 *     la taille du catalogue. Elle revient le jour où le niveau est transmis avec la ligne.
 *   • « 14 jours pour changer d'avis » : la production a RETIRÉ cette garantie des deux
 *     surfaces de vente parce que l'article 6 des CGV dit exactement l'inverse. Le kit est
 *     périmé sur ce point ; je reprends ce que la production affiche à la place.
 *   • Le maillage `informe` de la maquette vide : il n'y était que pour accompagner le renvoi
 *     vers le gratuit. Sans ce renvoi, l'écran reste dans son territoire — `forme`.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/** Une ligne du catalogue, telle qu'elle arrive dans l'URL. Le titre ne contient pas de « | ». */
type Ligne = { slug: string; titre: string; prix: number | null };

function lireLignes(brut: string | string[] | undefined): Ligne[] {
  const entrees = brut === undefined ? [] : Array.isArray(brut) ? brut : [brut];
  return entrees.flatMap((entree) => {
    const [slug, titre, prix] = entree.split('|');
    // Une ligne sans slug ni titre est écartée, pas rendue à moitié : une carte sans nom est
    // une carte sur laquelle on clique sans savoir ce qu'on achète.
    if (!slug || !titre) return [];
    const montant = prix ? Number(prix) : Number.NaN;
    return [{ slug, titre, prix: Number.isFinite(montant) ? montant : null }];
  });
}

export default function Catalogue() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { compte, formations, asOf } = useLocalSearchParams<{
    compte?: string; formations?: string | string[]; asOf?: string;
  }>();

  const lignes = lireLignes(formations);
  const compteServeur = compte ? Number(compte) : Number.NaN;
  const vraimentVide = Number.isFinite(compteServeur) && compteServeur === 0;

  // La date du relevé accompagne chaque nombre (règle 6). Une date illisible vaut une date
  // absente : on retombe sur maintenant plutôt que d'afficher « Invalid Date ».
  const propose = asOf ? new Date(asOf) : null;
  const releve = propose && !Number.isNaN(propose.getTime()) ? propose : new Date();

  function ouvrir(ligne: Ligne) {
    router.push({
      pathname: '/formation',
      params: {
        slug: ligne.slug,
        titre: ligne.titre,
        ...(ligne.prix !== null ? { prix: String(ligne.prix) } : {}),
        asOf: releve.toISOString(),
      },
    });
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Je te forme</Eyebrow>

        {lignes.length > 0 ? (
          <>
            {/*
              LE NOMBRE SORT DU TITRE. La maquette écrit « 2 FORMATIONS. » en Fraunces ; la
              règle 6 veut qu'un nombre porte sa source et sa date, ce qu'un titre d'affichage
              ne sait pas faire. Le titre garde donc sa masse, et le compte se pose dessous,
              en monospace, où il est vérifiable.
            */}
            <Display size="sm" lines={['LE CATALOGUE.', 'ACCÈS À VIE.']} style={{ marginTop: 6 }} />
            <Num
              value={lignes.length}
              source="server"
              asOf={releve}
              unit={lignes.length > 1 ? 'formations en ligne' : 'formation en ligne'}
              style={{ fontSize: 14, marginTop: 12 }}
            />

            <View style={{ marginTop: 18 }}>
              {lignes.map((ligne, i) => (
                /*
                  TOUTES LES CARTES SONT `forme`. La maquette alterne bleu et violet pour le
                  rythme ; ici le liseré de territoire porte du SENS — une formation relève de
                  « je te forme », et lui donner la teinte de « je te transforme » dirait
                  quelque chose de faux sur ce qu'on achète.
                */
                <TerritoryCard key={ligne.slug} first={i === 0} territory="forme" title={ligne.titre}>
                  <View style={{
                    flexDirection: 'row', alignItems: 'flex-end',
                    justifyContent: 'space-between', gap: 12, marginTop: 16,
                  }}>
                    {ligne.prix !== null ? (
                      <PriceBlock
                        amount={ligne.prix}
                        source="server"
                        asOf={releve}
                        size={25}
                        note="Une fois · accès à vie"
                      />
                    ) : (
                      <Num value={null} source="server" asOf={releve} fallback="prix non transmis" />
                    )}
                    <Button tone="primary" label="Voir" onPress={() => ouvrir(ligne)} />
                  </View>
                </TerritoryCard>
              ))}
            </View>

            <Surface level="truth" style={{ marginTop: 18, padding: 16 }}>
              <Eyebrow>Pourquoi il y a si peu de titres</Eyebrow>
              <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
                Parce que je les monte moi-même, une par une, et que je préfère des formations
                finies à des formations annoncées. Le module d'ouverture de chacune est en accès
                libre : tu juges avant de payer.
              </Body>
            </Surface>

            <View style={{ marginTop: 16, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Tag tone="ok">Accès à vie, mises à jour comprises</Tag>
              <Tag>Wave · Orange Money</Tag>
            </View>
          </>
        ) : vraimentVide ? (
          <>
            <Display size="sm" lines={['LE CATALOGUE', 'OUVRE BIENTÔT.']} style={{ marginTop: 6 }} />

            <Surface level="hero" style={{ marginTop: 20, padding: 22 }}>
              <Body style={{ fontWeight: '700' }}>Aucune formation n'est encore en ligne.</Body>
              <Body muted style={{ marginTop: 9 }}>
                Je préfère te le dire que te faire cliquer dans le vide.
              </Body>
              {/*
                LE ZÉRO S'AFFICHE, ET IL EST DATÉ. C'est la règle du système : « un zéro daté
                est une information » — un tiret ou un « N/A » n'en est pas, parce qu'il cache
                la différence entre « c'est zéro » et « je ne sais pas ».
              */}
              <Num
                value={0}
                source="server"
                asOf={releve}
                unit="formation en ligne"
                style={{ fontSize: 15, marginTop: 12 }}
              />
              <Button
                tone="primary"
                label="Crée ton compte"
                style={{ marginTop: 17 }}
                onPress={() => router.push('/(tabs)/profil')}
              />
            </Surface>

            <Body muted style={{ marginTop: 18, fontSize: 12.5, color: t('textFaint') }}>
              Je ne te propose pas de te prévenir par e-mail : je n'ai aucun canal d'envoi.
              L'alerte arrive dans ton espace, le jour de la mise en ligne.
            </Body>
          </>
        ) : (
          <>
            <Display size="sm" lines={['LE CATALOGUE', "N'EST PAS ARRIVÉ."]} style={{ marginTop: 6 }} />

            <Surface level="hero" style={{ marginTop: 20, padding: 22 }}>
              <Body style={{ fontWeight: '700' }}>Je ne sais pas ce qu'il y a au catalogue.</Body>
              <Body muted style={{ marginTop: 9 }}>
                Ce port natif n'interroge pas encore la base : il affiche ce que l'écran qui
                l'ouvre lui transmet. Tant que rien ne lui est transmis, il ne te montre rien —
                une formation inventée ici serait une formation que tu croirais pouvoir acheter.
              </Body>
              <Num
                value={null}
                source="server"
                asOf={releve}
                fallback="catalogue non relevé"
                style={{ fontSize: 15, marginTop: 12 }}
              />
            </Surface>

            <Body muted style={{ marginTop: 18, fontSize: 12.5, color: t('textFaint') }}>
              La différence entre « il n'y a rien » et « je ne sais pas » est exactement ce que
              cet écran refuse de perdre : la première phrase se dit quand le serveur a compté
              zéro, pas quand il n'a rien dit.
            </Body>
          </>
        )}
      </ScrollView>
    </View>
  );
}
