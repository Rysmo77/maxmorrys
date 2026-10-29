import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Keyboard, KeyboardAvoidingView, Platform, ScrollView, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { openBrowserAsync } from 'expo-web-browser';
import {
  Pressoir, Revele,
  Bandeau, Body, Button, ChatBubble, ChipRow, Eyebrow, Gradient, Icon, IconButton, Mesh, NavBar, Onde,
  QuotaMeter, SansDonnees, Skeleton, SqueletteGroupe, Surface, haptique, isIOS, px, translucentTabBar,
  useActionGradient, useBandeau, useMouvement, useToken, useTutorNom, POLICE,
 EspaceScope,
} from '../../ds';
import { RENVOI_COURS } from '../../contenu/demo';
import { ErreurAppel, demanderAuRepetiteur, useMoi, useRepetiteur } from '../../donnees';
import { TexteDeLecon } from '../../ecrans/TexteDeLecon';
import { BandeauHorsLigne } from '../../ecrans/BandeauHorsLigne';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 1 · LE RÉPÉTITEUR ══ — ET LE QUOTA QUE LE CLAVIER NE DOIT PAS CACHER.
 *
 * C'EST LA PLUS GROSSE DIFFÉRENCE DE TOUT LE PORTAGE, et elle n'existe pas en web mobile où le
 * navigateur s'en occupe. **Un clavier natif mange 270 à 290 px.** Le champ de saisie doit
 * monter avec lui — c'est ce que fait `KeyboardAvoidingView` — mais surtout :
 *
 *   **LA BARRE DE QUOTA DOIT RESTER VISIBLE.** Elle est ÉPINGLÉE sous la barre haute, hors du
 *   conteneur défilant, précisément pour ça. Un refus au-delà du plafond est vécu comme une
 *   panne s'il n'a pas été annoncé — et un quota caché par le clavier n'a pas été annoncé.
 *
 * ── CE QUE LA PERSONNE VOIT PENDANT QU'IL RÉFLÉCHIT ───────────────────────────────────
 * Entre l'envoi et la réponse, rien ne bougeait pendant jusqu'à vingt secondes, et le champ
 * affichait « Plus de question aujourd'hui » — faux : on attendait une réponse, on n'avait
 * pas épuisé le quota. Désormais :
 *   · la question part et s'affiche tout de suite ; le segment du quota se RÉSERVE ;
 *   · passé 220 ms, une bulle du tuteur porte l'ONDE (`ds/Onde.tsx`) — pas avant, pour ne pas
 *     clignoter sur une réponse rapide ;
 *   · la réponse prend sa place, mise en forme, et le fil défile jusqu'à elle.
 *
 * ── LE NOM N'EST PAS « RYSMO » ────────────────────────────────────────────────────────────
 * « Rysmo » nomme CETTE APPLICATION ; le tuteur qu'elle contient s'appelle « Répétiteur » par
 * défaut, et chaque personne peut le renommer. La barre haute lit donc `useTutorNom()`.
 *
 * ── L'APPLICATION NE VEND RIEN ───────────────────────────────────────────────────────────
 * La question part sur le canal `app` : le serveur retire tout prix et tout « achat » de la
 * réponse (`worker/…/lib/rysmo-canal.ts`). Les liens internes s'ouvrent dans l'application.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
const SUGGESTIONS = [
  'Explique-moi le SEO local simplement',
  'Fais-moi un quiz sur ma leçon en cours',
  'Par quoi commencer pour vendre en ligne ?',
] as const;

/** Sous ce délai, une réponse arrive sans qu'on montre l'attente — pas de clignotement. */
const SEUIL_ATTENTE = 220;

export default function Repetiteur() {
  const t = useToken();
  const g = useActionGradient();
  const insets = useSafeAreaInsets();
  const tuteur = useTutorNom();
  const { reduit } = useMouvement();
  const [question, setQuestion] = useState('');
  /* Passe 2 (maquette 37) : la feuille « Sur quoi porte ta question ? » revient ici avec la
     leçon choisie ; la question est AMORCÉE, jamais envoyée à la place de la personne. */
  const { sujet } = useLocalSearchParams<{ sujet?: string }>();
  useEffect(() => {
    if (sujet) setQuestion((q) => (q.trim() === '' ? `Sur la leçon « ${sujet} » : ` : q));
  }, [sujet]);
  const { bandeau, montrer, effacer } = useBandeau();
  const fil = useRef<ScrollView>(null);

  /*
   * LA BARRE D'ONGLETS PASSE SOUS LE CLAVIER, DONC SA PLACE DOIT DISPARAÎTRE AVEC ELLE.
   * Sur iOS elle flotte : la saisie se pose au-dessus d'elle, et la marge tombe quand le
   * clavier la recouvre. Sur Android elle est dans le flux et se masque avec le clavier :
   * aucune marge à réserver.
   */
  const [clavier, setClavier] = useState(false);
  useEffect(() => {
    const ouvre = Keyboard.addListener(isIOS ? 'keyboardWillShow' : 'keyboardDidShow', () => setClavier(true));
    const ferme = Keyboard.addListener(isIOS ? 'keyboardWillHide' : 'keyboardDidHide', () => setClavier(false));
    return () => { ouvre.remove(); ferme.remove(); };
  }, []);

  const rep = useRepetiteur();
  const moi = useMoi();

  /*
   * LA CONVERSATION VIT DANS L'ÉCRAN, pas seulement sur le serveur. Ce que la vue renvoie
   * est l'historique déjà enregistré ; les tours de la session en cours s'y ajoutent ici.
   */
  const [tours, setTours] = useState<Array<{ id: string; de: string; texte: string }>>([]);
  const [enVol, setEnVol] = useState(false);
  const [attente, setAttente] = useState(false);
  const [depense, setDepense] = useState<{ utilise: number; total: number } | null>(null);
  const [copie, setCopie] = useState<string | null>(null);

  const quota = depense ?? rep.valeur?.quota ?? null;
  const echange = [...(rep.valeur?.echange ?? []), ...tours];
  const reste = quota === null ? null : quota.total - quota.utilise;
  /* DEUX RAISONS DE NE PAS ÉCRIRE, ET ELLES NE SE DISENT PAS PAREIL. */
  const epuise = reste !== null && reste <= 0;
  const bloque = epuise || enVol;
  const anonyme = rep.phase === 'anonyme';

  /* La bulle d'attente n'apparaît qu'au-delà du seuil. */
  useEffect(() => {
    if (!enVol) { setAttente(false); return undefined; }
    const m = setTimeout(() => setAttente(true), SEUIL_ATTENTE);
    return () => clearTimeout(m);
  }, [enVol]);

  /* « Copié » s'efface seul, à 1,4 s. */
  useEffect(() => {
    if (copie === null) return undefined;
    const m = setTimeout(() => setCopie(null), 1400);
    return () => clearTimeout(m);
  }, [copie]);

  function descendre() {
    requestAnimationFrame(() => fil.current?.scrollToEnd({ animated: !reduit }));
  }

  async function envoyer(texteImpose?: string) {
    const texte = (texteImpose ?? question).trim();
    if (texte === '' || bloque || anonyme) return;
    effacer();

    /* La question s'affiche IMMÉDIATEMENT, avant la réponse. Sur un réseau lent, voir sa
       propre phrase partir est ce qui distingue « c'est en route » de « ça n'a pas marché ». */
    const mien = { id: `local-${Date.now()}`, de: 'me', texte };
    setTours((x) => [...x, mien]);
    setQuestion('');
    setEnVol(true);
    haptique.leger();
    descendre();
    try {
      const reponse = await demanderAuRepetiteur(texte, echange, moi.valeur?.prenom);
      setTours((x) => [...x, { id: `${mien.id}-r`, de: 'ai', texte: reponse.reply }]);
      // Le compte vient du SERVEUR, qui a réservé la requête. On ne le décrémente pas ici.
      setDepense({ utilise: reponse.quota.dayCount, total: reponse.quota.dailyLimit });
      AccessibilityInfo.announceForAccessibility(`${tuteur} a répondu`);
      descendre();
    } catch (erreur: unknown) {
      /* On RETIRE la question envoyée, et on la remet dans le champ : la retaper est le vrai
         coût de l'échec. Le segment réservé se libère avec elle. */
      setTours((x) => x.filter((m) => m.id !== mien.id));
      setQuestion(texte);
      montrer(
        'stop',
        "Ta question n'est pas partie",
        erreur instanceof ErreurAppel ? erreur.motif : 'Réessaie dans un moment.',
      );
    } finally {
      setEnVol(false);
    }
  }

  async function copier(id: string, texte: string) {
    await Clipboard.setStringAsync(texte);
    setCopie(id);
    haptique.succes();
    AccessibilityInfo.announceForAccessibility('Réponse copiée');
  }

  /* Les liens internes de la réponse ouvrent les écrans de l'application. */
  function ouvrirLien(chemin: string) {
    const m = /^\/formations\/([^/?#]+)/.exec(chemin);
    if (m) router.push({ pathname: '/formation', params: { slug: m[1] } });
    else void openBrowserAsync(`https://maxmorrys.me${chemin}`);
  }

  const libelleQuota = quota === null
    ? null
    : epuise
      ? `Plus de question aujourd'hui (sur ${quota.total})`
      : `Il te reste ${reste} question${(reste ?? 0) > 1 ? 's' : ''} aujourd'hui (sur ${quota.total})`;

  return (
    /* L'espace `ia` du kit v4.5 : retour, bouton et interrupteurs au violet de l'assistant. */
    <EspaceScope espace="ia">
    <View style={{ flex: 1, backgroundColor: t('bento2') }}>
      <Mesh territory="transforme" />

      <KeyboardAvoidingView
        style={{ flex: 1, paddingTop: insets.top }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <NavBar
          retour="Accueil"
          onRetour={() => router.push('/espace')}
          titre={tuteur}
          /* La signature du répétiteur, au repos. Elle ne s'anime ici que si la bulle
             d'attente est remontée hors du champ — jamais deux ondes à la fois. */
          glyphe={<Onde taille={14} />}
          droite={
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {/* Passe 2 (maquette 38) : réviser ce qui est à revoir. */}
              <IconButton label="Réviser" onPress={() => router.push('/reviser')}>
                <Icon name="repeat" size={17} color={t('textBody')} strokeWidth={2} />
              </IconButton>
              <IconButton label="Personnaliser ton assistant" onPress={() => router.push('/memoire')}>
                <Icon name="brain" size={17} color={t('textBody')} strokeWidth={2} />
              </IconButton>
            </View>
          }
        />

        {/* ── ÉPINGLÉ. Hors du défilement, hors de portée du clavier. ──────────────────── */}
        <View style={{ paddingHorizontal: 18, paddingBottom: 10 }}>
          {quota && libelleQuota ? (
            <QuotaMeter used={quota.utilise} total={quota.total} reserve={enVol} label={libelleQuota} />
          ) : (
            <Body muted style={{ fontFamily: POLICE.mono, fontSize: 11.5 }}>
              {anonyme ? 'connecte-toi pour poser tes questions' : 'plafond du jour non relevé'}
            </Body>
          )}
          <BandeauHorsLigne />
          {bandeau}
        </View>

        <ScrollView
          ref={fil}
          contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 4, paddingBottom: 16, gap: 11 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          accessibilityLabel={`Conversation avec ${tuteur}`}
        >
          {anonyme ? (
            <SansDonnees
              quoi="ta conversation"
              etat={rep}
              action={<Button tone="transforme" label="Me connecter" onPress={() => router.push('/connexion')} />}
            />
          ) : rep.phase === 'charge' || rep.phase === 'restauration' ? (
            <SqueletteGroupe label="Chargement de la conversation" style={{ gap: 11 }}>
              <Skeleton width="70%" height={58} radius={20} />
              <Skeleton width="55%" height={42} radius={20} style={{ alignSelf: 'flex-end' }} />
              <Skeleton width="78%" height={74} radius={20} />
            </SqueletteGroupe>
          ) : rep.phase === 'panne' && echange.length === 0 ? (
            <SansDonnees quoi="ta conversation" etat={rep} />
          ) : echange.length === 0 ? (
            /* ── PREMIER USAGE ── une bulle d'accueil et trois questions prêtes à partir. Le
               vide « cette application ne l'interroge pas encore » ne disait pas quoi faire. */
            <>
              <Revele>
                <ChatBubble from="ai" auteur={tuteur}>
                  {`Salut${moi.valeur?.prenom ? ` ${moi.valeur.prenom}` : ''} ! Je suis ${tuteur}. Pose-moi une question sur ta leçon, ou sur ce que tu veux lancer — je te réponds avec du concret.`}
                </ChatBubble>
              </Revele>
              <Revele i={1}>
                <Eyebrow style={{ marginTop: 6 }}>Pour commencer</Eyebrow>
              </Revele>
              {SUGGESTIONS.map((s, i) => (
                <Revele key={s} i={i + 2}>
                  <Pressoir
                    accessibilityRole="button"
                    accessibilityLabel={`Demander : ${s}`}
                    desactive={bloque}
                    onPress={() => { void envoyer(s); }}
                    style={{
                      alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 15,
                      borderRadius: px(t('rPill')), borderWidth: 1, borderColor: t('fill4'),
                      backgroundColor: t('surfaceCardFlat'),
                    }}
                  >
                    <Body style={{ fontSize: 13.5, fontWeight: '600' }}>{s}</Body>
                  </Pressoir>
                </Revele>
              ))}
            </>
          ) : echange.map((m) => {
            const de = m.de === 'me' ? 'me' : 'ai';
            return (
              <Revele key={m.id}>
                <ChatBubble
                  from={de}
                  auteur={de === 'me' ? 'Toi' : tuteur}
                  onAppuiLong={de === 'ai' ? () => { void copier(m.id, m.texte); } : undefined}
                >
                  {de === 'ai' ? <TexteDeLecon contenu={m.texte} taille={14} onLien={ouvrirLien} /> : m.texte}
                </ChatBubble>
                {copie === m.id ? (
                  <Revele>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginLeft: 6 }}>
                      <Icon name="check" size={13} color={t('ok')} strokeWidth={2.8} />
                      <Body style={{ fontSize: 12, fontWeight: '600', color: t('ok') }}>Copié</Body>
                    </View>
                  </Revele>
                ) : null}
              </Revele>
            );
          })}

          {attente ? <ChatBubble typing auteur={tuteur} /> : null}

          {/* Le renvoi vers le cours : la réponse cite SA source, et elle est atteignable. */}
          {RENVOI_COURS ? (
            <Surface level="flat" style={{ padding: 14, maxWidth: '86%' }}>
              <Eyebrow>{RENVOI_COURS.eyebrow}</Eyebrow>
              <Body style={{ fontSize: 13, fontWeight: '600', marginTop: 6 }}>{RENVOI_COURS.titre}</Body>
              <Button
                tone="quiet"
                size="sm"
                label="Ouvrir la leçon"
                style={{ marginTop: 10 }}
                onPress={() => router.push('/cours')}
              />
            </Surface>
          ) : null}
        </ScrollView>

        {/* ── LA SAISIE, OU CE QUI LA REMPLACE ─────────────────────────────────────────────
            Quota épuisé : le champ grisé disait « non » sans dire jusqu'à quand. L'encart dit
            quand les questions reviennent, et ce qu'on peut faire en attendant. */}
        <View style={{
          paddingHorizontal: 14, paddingVertical: 10,
          marginBottom: translucentTabBar && !clavier ? px(t('tabbarH')) + insets.bottom : 0,
          /* `mm-r-compose` du kit v4.5 : posée sur le papier de la page, filet `line`. */
          backgroundColor: t('bento2'),
          borderTopWidth: 1, borderTopColor: t('line'),
        }}>
          {epuise ? (
            <Revele>
              <Bandeau
                ton="info"
                titre={`Tes ${quota?.total ?? ''} questions du jour sont utilisées`}
                corps="Elles reviennent à minuit, heure de Dakar. En attendant, ta leçon et tes notes restent ouvertes."
                action={(
                  <ChipRow
                    options={['Reprendre mes cours', 'Mes notes']}
                    value=""
                    onChange={(o) => router.push(o === 'Mes notes' ? '/notes' : '/cours')}
                  />
                )}
              />
            </Revele>
          ) : (
            <>
            {/* Passe 2 (maquette 36/37) : « Changer de leçon », à gauche du champ dans la maquette. */}
            {anonyme ? null : (
              <Pressoir
                accessibilityRole="button"
                accessibilityLabel="Choisir la leçon de ta question"
                onPress={() => router.push('/choisir-lecon')}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4, marginBottom: 6 }}
              >
                <Icon name="book" size={14} color={t('textMuted')} strokeWidth={2.2} />
                <Body muted style={{ fontSize: 12.5 }}>{sujet ? `Leçon : ${sujet}` : 'Sur quoi porte ta question ?'}</Body>
              </Pressoir>
            )}
            {/* Le champ ET l'envoi dans une seule pilule (`mm-r-compose__in`) : 46 px sur `bento`
               et filet sur iOS ; 52 px à 28 sur le gris Material 3, sans filet, sur Android. */}
            <View style={{
              flexDirection: 'row', alignItems: 'flex-end', gap: 6,
              minHeight: isIOS ? 46 : 52, paddingLeft: 16, paddingRight: 4, paddingVertical: 3,
              borderRadius: isIOS ? 24 : 28,
              backgroundColor: isIOS ? t('bento') : t('surfaceQuiet'),
              borderWidth: isIOS ? 1 : 0, borderColor: t('line'),
            }}>
              <View style={{ flex: 1, minHeight: isIOS ? 38 : 44, justifyContent: 'center' }}>
                <TextInput
                  accessibilityLabel={`Ta question à ${tuteur}`}
                  value={question}
                  onChangeText={setQuestion}
                  placeholder={enVol ? `${tuteur} te répond…` : anonyme ? 'Connecte-toi pour poser ta question' : `Pose ta question à ${tuteur}`}
                  placeholderTextColor={t('textMuted')}
                  editable={!bloque && !anonyme}
                  multiline
                  maxLength={2000}
                  maxFontSizeMultiplier={1.6}
                  style={{
                    fontFamily: POLICE.corps, fontSize: 15, color: t('textBody'),
                    paddingVertical: isIOS ? 9 : 12, maxHeight: 110,
                  }}
                />
              </View>
              <Pressoir
                echelle="sm"
                desactive={bloque || anonyme || question.trim() === ''}
                accessibilityRole="button"
                accessibilityLabel="Envoyer ta question"
                accessibilityState={{ disabled: bloque || anonyme || question.trim() === '', busy: enVol }}
                disabled={bloque || anonyme || question.trim() === ''}
                onPress={() => { void envoyer(); }}
                hitSlop={4}
                style={{ opacity: bloque || anonyme || question.trim() === '' ? 0.4 : 1 }}
              >
                <Gradient
                  colors={g.transforme}
                  radius={isIOS ? 20 : 14}
                  style={{ width: isIOS ? 38 : 44, height: isIOS ? 38 : 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Icon name="send" size={17} color={t('paperFixed')} strokeWidth={2.6} />
                </Gradient>
              </Pressoir>
            </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
    </EspaceScope>
  );
}
