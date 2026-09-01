import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import {
  Body, Button, Display, EmptyState, Eyebrow, Icon, LessonRow, Mesh, Num, Surface, Tag, useToken,
} from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * MES NOTES — et la seule chose qu'un écran de notes n'a PAS le droit de faire.
 *
 * Afficher une note qu'on n'a pas écrite. Le README du dossier le pose en règle générale —
 * « aucun écran ne simule de données » — mais c'est ici qu'elle coûte le plus cher : un cours
 * inventé se démasque en l'ouvrant, une note inventée est une note qu'on croit avoir écrite,
 * et on la cherche ensuite pendant des semaines dans un carnet où elle n'a jamais été.
 *
 * Cet écran rend donc EXACTEMENT ce qu'on lui passe, et rien de plus :
 *
 *   • `notes`  — la charge JSON du serveur qui a listé les notes du compte.
 *   • `releve` — la DATE de cette lecture, en ISO 8601.
 *
 * Sans `notes`, il ne montre pas une liste vide : il dit que la couche de données n'est pas
 * branchée, ce qui n'est pas la même information. Sans `releve`, il montre la liste mais pas
 * le compte — c'est la règle de `StatTile`, appliquée telle quelle : PAS DE DATE, PAS DE
 * NOMBRE. Un « 14 notes » sans date est une affirmation que personne ne peut recouper.
 *
 * L'ÉCRITURE N'EST PAS BRANCHÉE ICI, et le bouton flottant ne fait pas semblant : il ouvre
 * `/mon-espace/notes` dans le navigateur système, là où écrire marche vraiment, avec la
 * session du site. C'est le même raisonnement qu'AD-11 pour le paiement — déléguer au web ce
 * que le natif ne tient pas encore, plutôt que poser un bouton qui n'écrit nulle part.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const WEB_NOTES = 'https://maxmorrys.me/mon-espace/notes';

type Note = {
  id: string;
  /** Le texte de la note, tel qu'elle a été écrite. Jamais réécrit à l'affichage. */
  texte: string;
  /** ISO 8601. */
  quand: string;
  /** Le titre de la leçon d'où elle vient, s'il est connu. */
  lecon?: string;
};

/**
 * Une charge partiellement illisible rend `null`, pas la moitié des notes.
 *
 * Une liste amputée en silence est pire qu'une liste absente : elle a l'air complète. Si une
 * seule entrée ne porte pas la forme attendue, on préfère dire qu'on ne sait pas.
 */
function lireNotes(brut: string | undefined): Note[] | null {
  if (!brut) return null;
  try {
    const parse: unknown = JSON.parse(brut);
    if (!Array.isArray(parse)) return null;
    const notes: Note[] = [];
    for (const n of parse) {
      if (typeof n !== 'object' || n === null) return null;
      const { id, texte, quand, lecon } = n as Partial<Note>;
      if (typeof id !== 'string' || typeof texte !== 'string' || typeof quand !== 'string') return null;
      notes.push({ id, texte, quand, lecon: typeof lecon === 'string' ? lecon : undefined });
    }
    return notes;
  } catch {
    return null;
  }
}

function lireDate(brut: string | undefined): Date | null {
  if (!brut) return null;
  const d = new Date(brut);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** `04/09 · 21:14` — écrit à la main : `Intl` n'est pas garanti sur tous les moteurs visés. */
function quandCourt(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function Notes() {
  const t = useToken();
  const insets = useSafeAreaInsets();
  const { notes: notesBrut, releve: releveBrut } = useLocalSearchParams<{ notes?: string; releve?: string }>();
  const [ouverture, setOuverture] = useState(false);

  const notes = lireNotes(notesBrut);
  const releve = lireDate(releveBrut);
  // Le compte n'existe que daté. Sinon `<Num>` dit pourquoi il manque, et ne dit rien d'autre.
  const compte = releve && notes ? notes.length : null;
  const lecons = releve && notes ? new Set(notes.map((n) => n.lecon).filter(Boolean)).size : null;

  async function ouvrirLeSite() {
    setOuverture(true);
    try {
      await WebBrowser.openBrowserAsync(WEB_NOTES);
    } finally {
      setOuverture(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 28,
          paddingHorizontal: 18,
          // Le bouton flottant fait 56 px et vit à 24 px du bas : la liste doit passer dessous
          // sans que sa dernière ligne se retrouve sous le pouce.
          paddingBottom: insets.bottom + 104,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Sous ton compte</Eyebrow>
        <Display size="sm" lines={['Mes notes.']} style={{ marginTop: 6 }} />

        {/*
          L'ÉTIQUETTE N'EST PAS UN ORNEMENT. C'est la seule chose qui répond à la question
          qu'on se pose avant d'écrire quoi que ce soit dans un produit : qui va lire ça.
        */}
        <View style={{
          marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 6, flex: 1 }}>
            <Num
              value={compte}
              source="db"
              asOf={releve ?? new Date(0)}
              unit={compte === 1 ? 'note' : 'notes'}
              fallback="compte non daté"
              style={{ fontSize: 13 }}
            />
            {lecons !== null && (
              <>
                <Body muted style={{ fontSize: 13 }}>·</Body>
                <Num
                  value={lecons}
                  source="db"
                  asOf={releve ?? new Date(0)}
                  unit={lecons === 1 ? 'leçon' : 'leçons'}
                  style={{ fontSize: 13 }}
                />
              </>
            )}
          </View>
          <Tag>Toi seule les lis</Tag>
        </View>

        {notes === null ? (
          /*
            PAS DE LISTE DE DÉMONSTRATION. La convention du dossier (cours, club, profil) :
            on dit ce qui n'est pas branché, on dit pourquoi ça n'est pas rempli en attendant,
            et on donne la sortie qui, elle, marche.
          */
          <Surface level="flat" style={{ marginTop: 16, padding: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Icon name="comment" size={20} color={t('ink2')} />
              <Body style={{ flex: 1, fontWeight: '700' }}>Tes notes ne sont pas encore branchées</Body>
            </View>
            <Body muted style={{ marginTop: 8 }}>
              Ce port natif rend la page, pas encore la lecture de ton compte. Aucune note
              n'est affichée en attendant : une note inventée est une note que tu croirais
              avoir écrite, et que tu chercherais ensuite.
            </Body>
            <Button
              tone="quiet"
              label={ouverture ? 'Ouverture…' : 'Ouvrir mes notes sur le site'}
              disabled={ouverture}
              onPress={() => void ouvrirLeSite()}
              style={{ marginTop: 16 }}
            />
          </Surface>
        ) : notes.length === 0 ? (
          /*
            UN ZÉRO DATÉ EST UNE INFORMATION — la règle d'`EmptyState`, mot pour mot. Elle ne
            s'applique QUE dans cette branche : ici la lecture a abouti et elle a rendu zéro,
            ce qui n'a rien à voir avec la branche au-dessus, où personne n'a lu quoi que ce soit.
          */
          <EmptyState
            glyph={<Icon name="comment" size={24} color={t('ink2')} />}
            title="Aucune note, pour l'instant"
            body={
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Body muted style={{ fontSize: 13.5, textAlign: 'center' }}>
                  Ce n'est pas une liste qui n'a pas chargé : c'est un relevé, et il dit zéro.
                </Body>
                <Num value={0} source="db" asOf={releve ?? new Date(0)} unit="note" style={{ fontSize: 15 }} />
              </View>
            }
            action={
              <Button
                tone="forme"
                label={ouverture ? 'Ouverture…' : 'Écrire ma première note'}
                disabled={ouverture}
                onPress={() => void ouvrirLeSite()}
              />
            }
            style={{ marginTop: 8 }}
          />
        ) : (
          <Surface level="flat" style={{ marginTop: 16, paddingVertical: 6, paddingHorizontal: 18 }}>
            {notes.map((n, i) => (
              <LessonRow
                key={n.id}
                state="plain"
                icon={<Icon name="comment" size={14} color={t('ink2')} />}
                title={n.texte}
                /*
                  AUCUN CHEVRON. Il annoncerait qu'on ouvre la note, et rien ne l'ouvre encore :
                  une flèche qui ne mène nulle part est un mensonge de plus par ligne, répété
                  autant de fois qu'il y a de notes.
                */
                meta={[quandCourt(n.quand), n.lecon].filter(Boolean).join(' · ') || undefined}
                last={i === notes.length - 1}
              />
            ))}
          </Surface>
        )}

        <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Ce qu'elles deviennent</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            Elles survivent à la fin du cours et te suivent d'un appareil à l'autre. Écrire une
            note rapporte de l'expérience ; la rééditer n'en rapporte pas.
          </Body>
        </Surface>

        <Body muted style={{ marginTop: 14, fontSize: 12.5 }}>
          Écrire se fait pour l'instant sur le site : le bouton bleu l'y ouvre, avec ta
          session. Tu reviens ici tout de suite après.
        </Body>
      </ScrollView>

      {/*
        LE BOUTON FLOTTANT. Il ne prétend pas écrire dans l'application — il emmène là où
        écrire fonctionne. Un rond de 56 px, la teinte du territoire « forme », et un `plus`
        plutôt que le `send` de la maquette : sur un bouton d'AJOUT, une flèche décrit un envoi
        qui n'a pas lieu, alors que le plus décrit exactement le geste.
      */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Écrire une note — s'ouvre sur le site"
        accessibilityState={{ disabled: ouverture }}
        onPress={ouverture ? undefined : () => void ouvrirLeSite()}
        style={({ pressed }: { pressed: boolean }) => ({
          position: 'absolute',
          right: 18,
          bottom: insets.bottom + 24,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: t('mmBleu'),
          shadowColor: t('mmBleu'),
          shadowOpacity: 0.38,
          shadowRadius: 13,
          shadowOffset: { width: 0, height: 10 },
          elevation: 6,
          transform: [{ scale: pressed ? Number.parseFloat(t('pressScale')) || 0.975 : 1 }],
        })}
      >
        <Icon name="plus" size={20} color={t('paperFixed')} strokeWidth={2.6} />
      </Pressable>
    </View>
  );
}
