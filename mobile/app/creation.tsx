import { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Body, Button, Display, Eyebrow, Field, Icon, Mesh, Num, Surface, useToken } from '../ds';

/**
 * ═══════════════════════════════════════════════════════════════════════════════════════
 * LA CRÉATION DE COMPTE — ET LA CASE QUI N'EST JAMAIS PRÉ-COCHÉE.
 *
 * FR-006, et ce n'est pas une préférence de rédaction : une case pré-cochée n'est pas un
 * consentement, c'est un consentement supposé. L'état initial est donc `false`, écrit ici,
 * une fois, sans condition — il n'y a pas de chemin dans ce fichier qui la coche tout seul.
 *
 * L'HORODATAGE EST MONTRÉ, ET SA VALEUR EST DITE. Cocher relève l'heure de CE téléphone,
 * et un horodatage envoyé par le client ne prouve rien : celui qui engage est écrit par le
 * serveur au moment de la création. On affiche donc le nôtre comme ce qu'il est — la trace
 * de ton geste, à l'écran — plutôt que comme une preuve qu'il n'est pas.
 *
 * ⚠️ ET LA LETTRE D'INFORMATION NE PART PAS ENCORE. Le produit n'a AUCUN canal d'envoi
 * d'e-mail. Promettre une lettre en échange d'une case cochée serait une promesse qu'aucun
 * code ne tient : la ligne sous la case le dit, au lieu de le laisser croire.
 *
 * LA CASE NE COMMANDE PAS LE BOUTON. Elle porte un abonnement, pas les conditions : gater
 * la création dessus transformerait un choix libre en péage.
 *
 * Le mot de passe n'est pas saisi ici — même raison qu'à `app/connexion.tsx`, et elle y est
 * écrite en entier.
 * ═══════════════════════════════════════════════════════════════════════════════════════
 */
const SITE = 'https://maxmorrys.me';

/** `31/08/2026 · 14:02` — écrit à la main plutôt que par `Intl`, qui varie selon le moteur. */
function horodate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} · ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function Creation() {
  const t = useToken();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  /* ⚠️ FAUX. Cet état ne se coche que par le geste de quelqu'un, jamais par un effet. */
  const [lettre, setLettre] = useState(false);
  const [consentiLe, setConsentiLe] = useState<Date | null>(null);
  const [ouverture, setOuverture] = useState(false);

  function basculerLaLettre() {
    setLettre((avant) => {
      const apres = !avant;
      // Décoché, l'horodatage part avec : garder l'heure d'un consentement retiré serait
      // garder la trace d'un accord qui n'existe plus.
      setConsentiLe(apres ? new Date() : null);
      return apres;
    });
  }

  const complet = nom.trim().length > 1 && email.trim().includes('@');

  async function ouvrirLaCreation() {
    setOuverture(true);
    try {
      const q = new URLSearchParams({ from: 'app', nom: nom.trim(), email: email.trim() });
      await WebBrowser.openAuthSessionAsync(`${SITE}/inscription?${q.toString()}`, 'rysmo://creation/retour');
    } catch {
      Alert.alert(
        "Le navigateur n'a pas pu s'ouvrir",
        `Aucun compte n'a été créé, et rien n'a été enregistré. Ouvre ${SITE}/inscription depuis ton navigateur pour finir.`,
      );
    } finally {
      setOuverture(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <Mesh territory="forme" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 28, paddingHorizontal: 18, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Eyebrow>Ton compte</Eyebrow>
        <View style={{ marginTop: 10 }}>
          <Display size="sm" lines={['ON COMMENCE', 'PAR TOI.']} />
        </View>

        <Surface level="hero" style={{ marginTop: 20, padding: 22 }}>
          <Field
            label="Ton prénom et ton nom"
            value={nom}
            onChangeText={setNom}
            placeholder="Aïssatou Ndiaye"
            autoCapitalize="words"
            textContentType="name"
            style={{ marginTop: 0 }}
          />
          <Field
            label="Ton e-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="aissatou@exemple.sn"
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          {/*
            LA CASE. Il n'existe pas de primitive de case à cocher dans `ds/` — elle est donc
            écrite ici, en jetons, et nulle part ailleurs. Zone de toucher pleine largeur :
            une case de 22 px n'est pas une cible, c'est un test d'adresse.
          */}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: lettre }}
            accessibilityLabel="Recevoir la lettre d'information"
            onPress={basculerLaLettre}
            style={{ flexDirection: 'row', gap: 11, alignItems: 'flex-start', marginTop: 18, paddingVertical: 4 }}
          >
            <View style={{
              width: 22, height: 22, borderRadius: 7, marginTop: 1,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: lettre ? t('ink') : t('borderField'),
              backgroundColor: lettre ? t('ink') : t('fieldBg'),
            }}>
              {lettre ? <Icon name="check" size={13} color={t('textOnPrimary')} strokeWidth={3.4} /> : null}
            </View>
            <Body muted style={{ flex: 1, fontSize: 12.5 }}>
              Je veux recevoir la lettre d'information. Je peux me désinscrire à tout moment.
            </Body>
          </Pressable>

          {/* L'horodatage n'apparaît QUE s'il y a eu un geste. Pas de geste, pas de trace. */}
          {consentiLe !== null && (
            <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="clock" size={14} color={t('textMuted')} />
              <Num
                value={horodate(consentiLe)}
                source={{ cite: "horloge de cet appareil, à l'instant du clic" }}
                asOf={consentiLe}
                style={{ fontSize: 12, fontWeight: '400' }}
              />
            </View>
          )}

          <Body muted style={{ marginTop: 10, fontSize: 12 }}>
            Aucune lettre ne part encore : le produit n'a pas de canal d'envoi d'e-mail. Ta
            case enregistre un accord, elle ne déclenche pas un envoi.
          </Body>

          <Button
            tone="forme"
            label={ouverture ? 'Ouverture…' : 'Crée mon compte'}
            disabled={!complet || ouverture}
            onPress={() => void ouvrirLaCreation()}
            style={{ marginTop: 18 }}
          />
          <Body muted style={{ marginTop: 12, fontSize: 13 }}>
            La création finit sur le site, dans ton navigateur : ton nom et ton e-mail y sont
            déjà remplis, et c'est là que tu choisis ton mot de passe.
          </Body>
        </Surface>

        <Surface level="truth" style={{ marginTop: 16, padding: 18 }}>
          <Eyebrow>Cette case n'est jamais pré-cochée</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
            Le consentement est horodaté, et la règle de la base refuse une inscription sans
            lui. Créer un compte n'inscrit à rien d'autre. L'heure affichée ci-dessus vient de
            ton téléphone : elle montre ton geste, elle ne le prouve pas — celle qui engage
            est écrite par le serveur.
          </Body>
        </Surface>

        <Button
          tone="quiet"
          label="J'ai déjà un compte"
          onPress={() => router.push('/connexion')}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </View>
  );
}
