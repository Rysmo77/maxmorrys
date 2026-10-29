import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Body, Button, ChipRow, Display, Eyebrow, Fondu, Num, Rubrique,
  SansDonnees, Screen, Surface, TerritoryCard, isIOS,
} from '../ds';
import { provenance, useCours, useRafraichir } from '../donnees';
import { BandeauHorsLigne } from '../ecrans/BandeauHorsLigne';
import { BandeApprendre } from '../ecrans/BandeApprendre';
import { Verite } from '../ecrans/Verite';

/**
 * ⭐ PASSE 2 (29/10/2026) — LE CATALOGUE REDEVIENT UNE SECTION (maquette Rysmo-iOS-12).
 * Il vivait dans l'onglet Apprendre ; l'onglet est désormais « Mes formations » (maquette 11),
 * et le catalogue la deuxième section de la bande. Le corps ci-dessous est celui de l'ancien
 * onglet, inchangé dans ses trois états. La maquette pose des prix et une phrase sur le magasin :
 * l'application ne vend rien (`mobile-store-achats.test.ts`), ni l'un ni l'autre n'est repris.
 */

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
export default function Catalogue() {
  const { compte } = useLocalSearchParams<{ compte?: string }>();
  const compteServeur = compte ? Number(compte) : Number.NaN;
  const videConfirme = Number.isFinite(compteServeur) && compteServeur === 0;

  /* En production le catalogue est vide — pas parce qu'il n'y a rien à vendre, mais parce que
     rien ne l'a transmis. Les deux cas ne se disent pas de la même façon, et c'est toute la
     raison d'être des trois branches ci-dessous. */
  const cours = useCours();
  const catalogue = cours.valeur ?? [];
  const { enRafraichissement, rafraichir } = useRafraichir();
  const enLecture = cours.phase === 'charge' || cours.phase === 'restauration';

  /*
    LE FILTRE SE DÉRIVE DU CATALOGUE, IL NE LE DÉCRIT PAS DE MÉMOIRE.

    Un niveau n'apparaît dans les onglets que s'il existe au moins une formation qui le
    porte, et son compte est celui qu'on obtient en comptant. Une formation dont le serveur
    ne renvoie pas de niveau reste dans « Tout » et n'invente aucun onglet — elle n'est pas
    rangée dans un niveau qu'on lui aurait prêté.

    L'ordre des onglets suit celui du catalogue, pas un ordre alphabétique : c'est
    l'administration qui décide de ce qui vient en premier, et un tri ici la contredirait.
  */
  const [filtre, setFiltre] = useState('Tout');
  const niveaux = catalogue
    .map((f) => f.niveau)
    .filter((n): n is string => typeof n === 'string' && n.length > 0)
    .filter((n, i, tous) => tous.indexOf(n) === i);
  /* `combien`, pas `compte` : `compte` est déjà le paramètre de route qui porte le nombre
     de formations annoncé par le serveur (ligne 32). Deux sens pour un mot dans la même
     portée, et le second l'emporte en silence. */
  const combien = (n: string) => catalogue.filter((f) => f.niveau === n).length;
  const majuscule = (n: string) => n.charAt(0).toUpperCase() + n.slice(1);

  /* ⚠️ L'ÉTAT PORTE LE NIVEAU NU, JAMAIS LE LIBELLÉ. Le libellé contient un COMPTE, et le
     compte change : il vaut « Tout · 0 » pendant le chargement, puis « Tout · 2 » quand la
     réponse arrive. Un état initialisé sur le libellé ne correspondrait alors plus à aucune
     option, et la liste se viderait à l'instant précis où elle vient de se remplir. */
  const cles = ['Tout', ...niveaux];
  const etiquette = (n: string) => (n === 'Tout' ? `Tout · ${catalogue.length}` : `${majuscule(n)} · ${combien(n)}`);
  const optionsFiltre = cles.map(etiquette);
  const visibles = filtre === 'Tout' ? catalogue : catalogue.filter((f) => f.niveau === filtre);

  return (
    <Screen
      territory="forme"
      retour="Apprendre"
      titre={isIOS ? undefined : 'Catalogue'}
      onRefresh={rafraichir}
      enRafraichissement={enRafraichissement}
    >
      <BandeauHorsLigne />
      <Eyebrow style={{ marginTop: 6 }}>Toutes les formations</Eyebrow>
      <Display size={32} lines={['Catalogue']} style={{ marginTop: 6 }} />
      <BandeApprendre />
      <Body muted style={{ marginTop: 14, fontSize: 14.5, lineHeight: 22 }}>
        Quand une formation a des leçons libres, elles se regardent ici, maintenant, sans compte.
        Tu juges avant de sortir de l'application.
      </Body>
      {videConfirme ? (
        <>
          <Display size={24} lines={['LE CATALOGUE', 'OUVRE BIENTÔT.']} style={{ marginTop: 22 }} />
          <Surface level="hero" style={{ marginTop: 20, padding: 22 }}>
            <Body style={{ fontWeight: '700' }}>Aucune formation n'est encore en ligne.</Body>
            <Body muted style={{ marginTop: 9 }}>
              Je préfère te le dire que te faire cliquer dans le vide.
            </Body>
            <Num
              value={0}
              {...provenance(cours)}
              unit="formation en ligne"
              style={{ fontSize: 15, marginTop: 12 }}
            />
          </Surface>
        </>
      ) : catalogue.length === 0 ? (
        <>
          {/* Le titre n'affirme l'absence qu'APRÈS la lecture : « N'EST PAS ARRIVÉ » pendant
              le chargement se lisait comme une panne. */}
          <Display size={24} lines={enLecture ? ['LE CATALOGUE.'] : ['LE CATALOGUE', "N'EST PAS ARRIVÉ."]} style={{ marginTop: 22 }} />
          <SansDonnees
            quoi="le catalogue"
            origine="du serveur"
            etat={cours}
            hauteur={4}
            style={{ marginTop: 20 }}
          />
        </>
      ) : (
        <>
          {/* ⚠️ CE TITRE DISAIT « 2 FORMATIONS. » EN DUR. Il l'affirmait avant toute lecture,
              et il serait resté faux le jour où le catalogue en compte trois — ou une. Un
              nombre écrit dans un titre est un nombre que personne ne rectifie, parce qu'il
              ne ressemble pas à une donnée. Il est COMPTÉ maintenant. */}
          <Rubrique>
            {catalogue.length === 1 ? 'Le catalogue · 1 formation' : `Le catalogue · ${catalogue.length} formations`}
          </Rubrique>
          <Body muted style={{ marginTop: 2, fontSize: 14.5, lineHeight: 22 }}>
            Ouvre une fiche pour voir son programme. Quand une formation a un module
            d'ouverture, il se lit ici, tout de suite.
          </Body>

          {/* Le filtre porte SON compte : « Tout · 2 » dit la taille du catalogue en même
              temps qu'il propose de le réduire.

              ⚠️ CES TROIS COMPTES ÉTAIENT ÉCRITS EN DUR — « Tout · 2 », « Débutant · 1 »,
              « Avancé · 1 » — à quinze lignes du titre dont le commentaire explique
              justement pourquoi un nombre en dur est faux. Et le `ChipRow` n'avait pas
              d'`onChange` : trois onglets qui ne filtraient rien, sous des comptes qui
              n'auraient plus rien décrit dès la troisième formation.

              `mobile-controles-morts.test.ts` ne pouvait pas le voir : la porte cherche un
              `onPress` manquant, or un composant à choix se pilote par `onChange`. Le test
              est étendu dans le même lot. */}
          <ChipRow
            options={optionsFiltre}
            value={etiquette(filtre)}
            onChange={(choix) => setFiltre(cles[optionsFiltre.indexOf(choix)] ?? 'Tout')}
            style={{ marginTop: 18 }}
          />

          <Fondu cle={filtre} style={{ marginTop: 16 }}>
            {visibles.map((f, i) => (
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
                {/* ⚠️ LE PRIX A QUITTÉ CETTE CARTE, et le paramètre `prix` avec lui.
                    Un catalogue qui affiche des montants EST une vitrine, quel que soit le
                    libellé du bouton — et le transmettre à l'écran suivant reconstituait le
                    tunnel qu'on vient de retirer. Ce qui reste décrit le contenu : le sujet,
                    le format, la durée. */}
                <View style={{
                  flexDirection: 'row', alignItems: 'flex-end',
                  justifyContent: 'flex-end', gap: 12, marginTop: 16,
                }}>
                  <Button
                    tone="primary"
                    size="sm"
                    label="Voir le programme"
                    onPress={() => router.push({
                      pathname: '/formation',
                      params: { slug: f.slug, titre: f.titre },
                    })}
                  />
                </View>
              </TerritoryCard>
            ))}
          </Fondu>
        </>
      )}

      <Verite titre="Pourquoi rien ne s'encaisse ici">
        L'application ouvre ce que tu as déjà, et les leçons libres de chaque formation. Elle
        n'encaisse rien : l'inscription se fait sur edu.maxmorrys.me, et ton accès s'ouvre ici au
        retour.
      </Verite>
    </Screen>
  );
}
