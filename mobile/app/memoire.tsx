import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Body, Button, ChipRow, Display, Eyebrow, Field, Icon, LessonRow, Mesh, Num, Surface, Tag,
  TUTOR_DEFAUT, setTutorNom, tutorNom, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA MÉMOIRE DU RÉPÉTITEUR — et le renommage, qui passe DEVANT elle.
 *
 * TROIS NOMS, ET LE SYSTÈME PRÉVIENT QUE C'EST LA DISTINCTION LA PLUS FACILE À CASSER :
 *
 *   « Hello ! »   le mot-symbole des pages WEB.
 *   « Rysmo »     le nom de CETTE APPLICATION — une constante, personne ne le renomme.
 *   « Répétiteur » le nom PAR DÉFAUT du répétiteur qui vit dedans — renommable par chaque
 *                  personne, et le nom choisi remplace le mot partout.
 *
 * Elle a déjà été cassée une fois, au web, à onze endroits — dont un `<h1>Rysmo</h1>` sur
 * l'écran même du renommage, qui contredisait la barre haute quinze centimètres plus haut.
 * D'où la règle tenue ici sans exception : le nom du répétiteur ne s'écrit JAMAIS en dur, il
 * se lit par `tutorNom()`. Le seul « Rysmo » de cet écran est celui de la phrase qui dit
 * précisément que Rysmo n'est pas son nom.
 *
 * LE RENOMMAGE EST LE PREMIER BLOC, pas un réglage enfoui : « c'est la première chose qu'on
 * veut faire en arrivant ici ». Et quatre suggestions en puces plutôt qu'un champ vide, parce
 * qu'un champ vide fait hésiter là où une liste fait choisir.
 *
 * ⚠️ CE QUE `setTutorNom()` PERSISTE : rien. C'est une variable de module dans `ds/tutor.ts`,
 * vivante le temps de la session, perdue au redémarrage — aucun stockage n'est dans les
 * dépendances de ce dossier. Elle ne prévient personne non plus : la barre d'onglets lit
 * `tutorNom()` au rendu de son layout, qui ne se refait pas parce qu'on a tapé ici. Le nom
 * choisi apparaît donc dans la barre au prochain rendu de celle-ci, pas à la frappe. Les deux
 * points se règlent dans `ds/`, hors du périmètre de cet écran.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const WEB_REPETITEUR = 'https://maxmorrys.me/mon-espace/repetiteur';
const SUGGESTIONS = [TUTOR_DEFAUT, 'Prof', 'Coach', 'Tonton'] as const;

type Ligne = {
  id: string;
  /** La ligne de mémoire, telle que le serveur l'a écrite. */
  texte: string;
  /** ISO 8601 — depuis quand il la retient. */
  depuis: string;
};

/** Une charge partiellement illisible rend `null` : une mémoire amputée en silence a l'air complète. */
function lireLignes(brut: string | undefined): Ligne[] | null {
  if (!brut) return null;
  try {
    const parse: unknown = JSON.parse(brut);
    if (!Array.isArray(parse)) return null;
    const lignes: Ligne[] = [];
    for (const l of parse) {
      if (typeof l !== 'object' || l === null) return null;
      const { id, texte, depuis } = l as Partial<Ligne>;
      if (typeof id !== 'string' || typeof texte !== 'string' || typeof depuis !== 'string') return null;
      lignes.push({ id, texte, depuis });
    }
    return lignes;
  } catch {
    return null;
  }
}

function lireDate(brut: string | undefined): Date | null {
  if (!brut) return null;
  const d = new Date(brut);
  return Number.isNaN(d.getTime()) ? null : d;
}

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

/** « depuis le 12 août ». Écrit à la main : `Intl` n'est pas garanti sur tous les moteurs visés. */
function depuisCourt(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `depuis le ${d.getDate()} ${MOIS_COURTS[d.getMonth()]}`;
}

export default function Memoire() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { lignes: lignesBrut, releve: releveBrut } = useLocalSearchParams<{ lignes?: string; releve?: string }>();
  const [nom, setNom] = useState(tutorNom());
  const [ouverture, setOuverture] = useState(false);

  const lignes = lireLignes(lignesBrut);
  const releve = lireDate(releveBrut);
  // Règle de `StatTile`, telle quelle : pas de date, pas de nombre.
  const compte = releve && lignes ? lignes.length : null;

  /** Le nom se commet à la frappe : il n'y a rien à valider, donc pas de bouton pour valider. */
  function renommer(v: string) {
    setNom(v);
    setTutorNom(v);
  }

  async function ouvrirLeSite() {
    setOuverture(true);
    try {
      await WebBrowser.openBrowserAsync(WEB_REPETITEUR);
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
        keyboardShouldPersistTaps="handled"
      >
        {/* ── LE RENOMMAGE ───────────────────────────────────────────────────────────── */}
        <Eyebrow>Ton répétiteur</Eyebrow>
        <Display size="sm" lines={['Donne-lui', 'un nom.']} style={{ marginTop: 6 }} />

        <Surface level="hero" style={{ marginTop: 18, padding: 20 }}>
          <Field
            label="Comment tu l'appelles"
            value={nom}
            onChangeText={renommer}
            placeholder={TUTOR_DEFAUT}
            autoCapitalize="words"
            style={{ marginTop: 0 }}
            hint={
              nom.trim() === '' || nom.trim() === TUTOR_DEFAUT
                ? `Par défaut, il s'appelle ${TUTOR_DEFAUT}.`
                : `Tu peux revenir à « ${TUTOR_DEFAUT} » quand tu veux.`
            }
          />

          {/*
            QUATRE SUGGESTIONS, PAS UN CHAMP VIDE. Et la première est la valeur par défaut,
            reprise de `TUTOR_DEFAUT` : la retaper ici ferait deux endroits à corriger le jour
            où elle change, donc un endroit oublié.
          */}
          <ChipRow options={SUGGESTIONS} value={nom} onChange={renommer} style={{ marginTop: 14 }} />

          <Body muted style={{ marginTop: 12, fontSize: 11.5 }}>
            Le nom ne change que pour toi.{' '}
            <Body style={{ fontWeight: '700', fontSize: 11.5 }}>Rysmo</Body>
            {' '}reste le nom de l'application.
          </Body>
        </Surface>

        {/* ── LA MÉMOIRE ─────────────────────────────────────────────────────────────── */}
        <View style={{ marginTop: 26, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <Eyebrow>Mémoire de profil</Eyebrow>
          <Num
            value={compte}
            source="db"
            asOf={releve ?? new Date(0)}
            unit={compte === 1 ? 'ligne' : 'lignes'}
            fallback="compte non daté"
            style={{ fontSize: 12 }}
          />
        </View>
        <Body muted style={{ marginTop: 8 }}>
          Des lignes courtes, écrites à partir de vos échanges. Elles servent à ce qu'il ne te
          redemande pas trois fois ce que tu vends.
        </Body>

        {lignes === null ? (
          <Surface level="flat" style={{ marginTop: 14, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="chat" size={20} color={t('ink2')} />
              <Body style={{ flex: 1, fontWeight: '700' }}>La mémoire n'est pas encore branchée</Body>
            </View>
            <Body muted style={{ marginTop: 8 }}>
              Ce port natif rend l'écran, pas encore la lecture de ta mémoire. Aucune ligne
              d'exemple n'est affichée en attendant : une ligne inventée te ferait croire qu'il
              retient quelque chose de toi qu'il n'a jamais entendu.
            </Body>
          </Surface>
        ) : lignes.length === 0 ? (
          <Surface level="flat" style={{ marginTop: 14, padding: 20 }}>
            <Body style={{ fontWeight: '700' }}>Il ne retient rien pour l'instant</Body>
            <Body muted style={{ marginTop: 8 }}>
              C'est un relevé, et il dit zéro : la mémoire se remplira de vos échanges, pas
              d'un questionnaire.
            </Body>
          </Surface>
        ) : (
          <Surface level="flat" style={{ marginTop: 14, paddingVertical: 6, paddingHorizontal: 18 }}>
            {lignes.map((l, i) => (
              <LessonRow
                key={l.id}
                state="plain"
                /*
                  Le glyphe prend l'encre VIOLETTE DU MODE COURANT (`mmVioletT`), et la
                  pastille garde le fond neutre de `LessonRow`. La maquette met du violet clair
                  derrière — mais `mmVioletC` ne change pas en nuit, où l'encre violette
                  s'éclaircit : clair sur clair, et la pastille disparaîtrait.
                */
                icon={<Icon name="chat" size={14} color={t('mmVioletT')} />}
                title={l.texte}
                /*
                  AUCUNE CORBEILLE PAR LIGNE. La maquette en pose une, et elle a raison : le
                  retrait ligne à ligne fait partie du produit. Mais ici rien n'écrit côté
                  serveur — une corbeille qui ne retirerait la ligne que de l'écran tiendrait
                  la promesse la plus grave de cet écran en apparence seulement, et la ligne
                  reviendrait au rechargement suivant.
                */
                meta={depuisCourt(l.depuis) ?? undefined}
                last={i === lignes.length - 1}
              />
            ))}
          </Surface>
        )}

        <Button
          tone="quiet"
          label={ouverture ? 'Ouverture…' : 'Ouvrir la mémoire sur le site'}
          disabled={ouverture}
          onPress={() => void ouvrirLeSite()}
          style={{ marginTop: 16 }}
        />
        <Body muted style={{ marginTop: 8, fontSize: 12 }}>
          C'est là que l'effacement se fait, pour l'instant. Ce port ne l'exécute pas encore,
          et il ne fait pas semblant de l'exécuter.
        </Body>

        <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Ce que l'effacement fait</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            L'effacement est immédiat et ne passe pas par le support. La mémoire se reconstitue
            à partir des seuls échanges suivants.{' '}
            <Body style={{ fontWeight: '700', fontSize: 12.5 }}>
              Le nom que tu lui as donné, lui, ne s'efface pas avec.
            </Body>
          </Body>
        </Surface>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
          <Tag>Lisible par toi seule</Tag>
          <Tag tone="ok">Effaçable sans supprimer le compte</Tag>
        </View>
      </ScrollView>
    </View>
  );
}
