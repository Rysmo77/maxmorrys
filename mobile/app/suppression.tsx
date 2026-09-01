import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Body, Button, Display, Eyebrow, Field, LessonRow, Mesh, Num, Surface, tutorNom, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * SUPPRIMER SON COMPTE — TOUT DANS LE MÊME ÉCRAN.
 *
 * Ce qui part, ce qui RESTE, la confirmation écrite, et l'export. Les quatre ensemble, sous
 * les yeux, au moment de la décision. Renvoyer l'export à un écran précédent revient à faire
 * choisir sans l'option qui rend le choix supportable — et personne ne remonte d'un écran
 * quand il vient de se décider.
 *
 * CE QUI PART EST COMPTÉ, PAS ÉVOQUÉ. « Tes inscriptions » ne dit rien ; « 2 inscriptions »
 * dit ce qu'on perd. Les comptes arrivent donc par la route, et la règle 6 s'applique sans
 * exception : pas de relevé, pas de nombre — `<Num>` écrit « non relevé » plutôt qu'un tiret,
 * parce qu'un tiret cache la différence entre « c'est zéro » et « je ne sais pas », et que
 * sur cet écran cette différence est précisément ce qu'on veut savoir.
 *
 * CE QUI RESTE EST DIT AUSSI FORT. Un certificat déjà émis reste vérifiable par son code :
 * c'est le principe même d'un certificat, et le taire ferait croire à une disparition qui
 * n'aura pas lieu.
 *
 * LE NOM DU RÉPÉTITEUR VIENT DE `tutorNom()`. Quelqu'un qui a renommé son tuteur doit lire
 * SON nom dans la liste de ce qu'il efface — sinon il ne reconnaît pas ce qu'il perd.
 *
 * LA SUPPRESSION EST UN TRAITEMENT SERVEUR. Ce port ne la déclenche pas lui-même : elle
 * s'ouvre sur ta session du site, et elle ne passe pas par le support.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const SITE = 'https://maxmorrys.me';
const MOT = 'SUPPRIMER';

export default function Suppression() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const {
    inscriptions, notes, echeance, releve,
  } = useLocalSearchParams<{ inscriptions?: string; notes?: string; echeance?: string; releve?: string }>();

  const [saisie, setSaisie] = useState('');
  const [ouverture, setOuverture] = useState(false);

  /* La date du relevé arrive avec les comptes, ou rien n'arrive. Une date invalide vaut
     absente : mieux vaut « non relevé » qu'un compte daté d'une heure qu'on a devinée. */
  const lu = releve ? new Date(releve) : null;
  const date = lu !== null && !Number.isNaN(lu.getTime()) ? lu : null;
  const compte = (v?: string): number | null => {
    if (date === null || v === undefined || v.trim() === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const tuteur = tutorNom();
  const confirme = saisie === MOT;

  async function ouvrirSurLeSite(chemin: string, echoue: string) {
    setOuverture(true);
    try {
      await WebBrowser.openAuthSessionAsync(`${SITE}${chemin}?from=app`, 'rysmo://compte/retour');
    } catch {
      Alert.alert("Le navigateur n'a pas pu s'ouvrir", echoue);
    } finally {
      setOuverture(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="transforme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Ton compte</Eyebrow>
        <View style={{ marginTop: 8 }}>
          <Display size="sm" lines={['Ce qui part', 'avec ton compte.']} />
        </View>

        <Surface level="flat" style={{ marginTop: 20, paddingHorizontal: 18, paddingVertical: 6 }}>
          <LessonRow
            title="Tes inscriptions et leur progression"
            meta="accès à vie perdu, sans remboursement"
            trailing={
              <Num
                value={compte(inscriptions)}
                source="db"
                asOf={date ?? new Date(0)}
                unit="en cours"
                fallback="non relevé"
                style={{ fontSize: 14 }}
              />
            }
          />
          <LessonRow
            title="Tes notes personnelles"
            meta="écrites dans les leçons, effacées avec elles"
            trailing={
              <Num
                value={compte(notes)}
                source="db"
                asOf={date ?? new Date(0)}
                unit="notes"
                fallback="non relevé"
                style={{ fontSize: 14 }}
              />
            }
          />
          <LessonRow
            title={`La mémoire de ton ${tuteur.toLowerCase()}`}
            meta="effaçable seule, sans supprimer le compte"
          />
          <LessonRow
            title="Ton abonnement au Club"
            meta={echeance ? `échéance au ${echeance}, non remboursée` : 'échéance non transmise à cet écran'}
            last
          />
        </Surface>

        {date === null && (
          <Body muted style={{ marginTop: 10, fontSize: 12 }}>
            Aucun relevé n'est arrivé avec cette route : les comptes restent « non relevé »
            plutôt que d'afficher un zéro qui se lirait comme une mesure.
          </Body>
        )}

        {/* ── CE QUI RESTE ────────────────────────────────────────────────────────────── */}
        <Surface level="flat" style={{ marginTop: 16, padding: 18, borderColor: t('ok') }}>
          <Body style={{ fontWeight: '700', fontSize: 14.5, color: t('ok') }}>Ce qui reste</Body>
          <Body muted style={{ marginTop: 5, fontSize: 13 }}>
            Tes certificats déjà émis restent vérifiables par leur code — c'est le principe
            même d'un certificat. Le miroir public de vérification ne porte aucun identifiant
            de compte : il répond au code, et à rien d'autre.
          </Body>
        </Surface>

        {/* ── LA DÉCISION, ET L'EXPORT À CÔTÉ ─────────────────────────────────────────── */}
        <Surface level="flat" style={{ marginTop: 16, padding: 20 }}>
          <Field
            label={`Écris ${MOT} pour confirmer`}
            value={saisie}
            onChangeText={setSaisie}
            placeholder={MOT}
            autoCapitalize="words"
            // L'erreur n'apparaît qu'après une frappe : afficher « ça ne correspond pas »
            // sur un champ vide, c'est reprocher à quelqu'un de ne pas avoir commencé.
            error={saisie.length > 0 && !confirme ? 'Le texte ne correspond pas encore.' : undefined}
            hint={`En capitales, sans espace : ${MOT}.`}
            style={{ marginTop: 0 }}
          />
          <Button
            tone="primary"
            label={ouverture ? 'Ouverture…' : 'Supprimer définitivement'}
            disabled={!confirme || ouverture}
            onPress={() => void ouvrirSurLeSite(
              '/mon-espace/parametres',
              `Rien n'a été supprimé. Ouvre ${SITE}/mon-espace/parametres depuis ton navigateur pour finir.`,
            )}
            style={{ marginTop: 16 }}
          />
          <Button
            tone="quiet"
            label="J'exporte d'abord mes données"
            disabled={ouverture}
            onPress={() => void ouvrirSurLeSite(
              '/mon-espace/parametres',
              `L'export n'a pas démarré. Ouvre ${SITE}/mon-espace/parametres depuis ton navigateur.`,
            )}
            style={{ marginTop: 10 }}
          />
          <Body muted style={{ marginTop: 12, fontSize: 12 }}>
            L'export part avant, pas après : une fois le compte retiré, il n'y a plus rien à
            exporter.
          </Body>
        </Surface>

        <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Ce qui se passe quand tu confirmes</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            La suppression retire le compte d'authentification et ses documents, par traitement
            serveur. Elle ne passe pas par le support. Ce port ne la déclenche pas lui-même :
            il ouvre ta session du site, là où le traitement existe.
          </Body>
        </Surface>
      </ScrollView>
    </View>
  );
}
