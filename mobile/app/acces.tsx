import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Anneaux, Body, Button, Display, DocLine, Eyebrow, Gradient, Heros, Icon, Num, SansDonnees, Screen, Surface, haptique, useToken,
} from '../ds';
import { useAcces } from '../donnees';
import type { TransactionVue } from '../donnees/contrat.generated';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ L'ACCÈS EST OUVERT ══ — le retour depuis le site (`NatRetourPaiement` du kit).
 *
 * L'application N'ENCAISSE RIEN : le règlement s'est fait sur le site, dont la page de retour
 * propose `rysmo://acces?transactionId=…`. Cet écran CONSTATE. Le kit le dit en une phrase :
 * « C'est à toi », pas « paiement accepté ». Et il ne l'écrit que si le serveur confirme que
 * l'accès est RÉELLEMENT ouvert (`acces`), pas seulement que la transaction est réglée.
 *
 * ⚠️ PAS `paiement.tsx` : ce nom désignait le tunnel de vente retiré, et
 * `mobile-store-achats.test.ts` le refuse. Aucun mot d'achat ni de moyen de règlement ici.
 *
 * Quatre issues distinctes : ouvert, en attente (relu toutes les 4 s, deux minutes au plus),
 * n'a pas abouti, et « cette transaction n'est pas la tienne / n'existe pas ».
 * ══════════════════════════════════════════════════════════════════════════════════════
 */

function destination(t: TransactionVue): { libelle: string; aller: () => void } {
  if (t.ligne === 'club') return { libelle: 'Ouvrir le Club', aller: () => router.replace('/club') };
  if (t.ligne === 'rysmoPack' || t.ligne === 'rysmoSubscription') {
    return { libelle: 'Ouvrir ton assistant', aller: () => router.replace('/repetiteur') };
  }
  if (t.slug) return { libelle: 'Ouvrir la formation', aller: () => router.replace({ pathname: '/formation', params: { slug: t.slug as string } }) };
  return { libelle: 'Ouvrir mes cours', aller: () => router.replace('/cours') };
}

function Detail({ t }: { t: TransactionVue }) {
  const asOf = t.creeLe ? new Date(t.creeLe) : new Date(0);
  return (
    <Surface level="flat" style={{ marginTop: 20, padding: 18 }}>
      {t.titre ? <DocLine label={t.ligne === 'club' ? 'Abonnement' : 'Accès'} value={t.titre} /> : null}
      <DocLine label="Réglé sur" value={t.ligne === 'club' ? 'club.maxmorrys.me' : 'edu.maxmorrys.me'} />
      <DocLine
        label="Montant"
        value={<Num value={t.montant ?? null} source="server" asOf={asOf} unit={t.devise === 'XOF' ? 'F' : t.devise ?? undefined} />}
      />
      <DocLine label="Référence" value={<Num value={t.id} source="server" asOf={asOf} />} last />
    </Surface>
  );
}

export default function Acces() {
  const t = useToken();
  const { transactionId } = useLocalSearchParams<{ transactionId?: string }>();
  const id = (Array.isArray(transactionId) ? transactionId[0] : transactionId) ?? null;
  const suivi = useAcces(id);
  const ouvert = suivi.etape === 'ouvert';
  /* Le passage à « ouvert » se SENT : les anneaux s'éteignent, la coche apparaît, et le
     téléphone vibre une fois. */
  useEffect(() => { if (ouvert) haptique.succes(); }, [ouvert]);

  if (suivi.etape === 'anonyme') {
    return (
      <Screen territory="forme" center>
        <Display size={29} lines={['CONNECTE-TOI', 'POUR VOIR TON ACCÈS.']} style={{ marginTop: 10 }} />
        <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
          Ton règlement est rattaché à ton compte. Connecte-toi avec le même compte que sur le
          site : l'accès t'y attend.
        </Body>
        <Button tone="forme" label="Me connecter" style={{ marginTop: 20 }} onPress={() => router.push('/connexion')} />
      </Screen>
    );
  }

  if (suivi.etape === 'ouvert') {
    const aller = destination(suivi.transaction);
    return (
      <Screen territory="forme" center>
        <Heros>
          <Gradient colors={[t('mmTeal'), t('mmBleu')]} radius={22} style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check" size={29} color={t('paperFixed')} strokeWidth={3.4} />
          </Gradient>
        </Heros>
        <Display size={31} lines={["C'EST À TOI."]} style={{ marginTop: 24 }} />
        <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
          {suivi.transaction.ligne === 'club' ? 'Ton accès au Club est ouvert.' : 'Ton accès est ouvert.'}
        </Body>
        <Detail t={suivi.transaction} />
        <Button tone="digitalise" label={aller.libelle} style={{ marginTop: 20 }} onPress={aller.aller} />
        <Surface level="truth" style={{ marginTop: 16, padding: 15 }}>
          <Eyebrow>Où est passé le reçu</Eyebrow>
          <Body muted style={{ marginTop: 6, fontSize: 12.5, lineHeight: 19 }}>
            Sur le site, dans Mes paiements — c'est là que la transaction a eu lieu. L'application
            ne l'a pas encaissée : elle constate que l'accès est ouvert.
          </Body>
        </Surface>
      </Screen>
    );
  }

  if (suivi.etape === 'attente') {
    return (
      <Screen territory="forme" center>
        {/* MOMENT SCÉNARISÉ Nº1 — les deux anneaux : « la transaction est vivante ». Ils
            s'arrêtent avec la relecture (`abandon`) : plus rien ne vit, ils mentiraient. */}
        {suivi.abandon ? null : (
          <Anneaux couleur={t('mmBleu')} rayon={22} style={{ width: 68, height: 68 }}>
            <Gradient colors={[t('mmBleu'), t('mmViolet')]} radius={22} style={{ width: 68, height: 68, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="clock" size={28} color={t('paperFixed')} strokeWidth={2.2} />
            </Gradient>
          </Anneaux>
        )}
        <Display size={29} lines={suivi.abandon ? ['TOUJOURS', 'EN ATTENTE.'] : ['ON VÉRIFIE', "L'ACCÈS."]} style={{ marginTop: 24 }} />
        <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
          {suivi.abandon
            ? "La confirmation n'est pas encore arrivée. Elle peut prendre quelques minutes : ton accès s'ouvrira tout seul, et tu le retrouveras dans tes cours sans rien refaire."
            : suivi.transaction.statut === 'completed'
              ? "Le règlement est confirmé. L'accès s'ouvre — cet écran se met à jour tout seul."
              : 'La confirmation est attendue. Cet écran se met à jour tout seul.'}
        </Body>
        {suivi.coupure && !suivi.abandon ? (
          <Body muted style={{ marginTop: 10, fontSize: 12.5 }}>Le réseau a coupé un instant — on continue de vérifier.</Body>
        ) : null}
        <Detail t={suivi.transaction} />
        {/* Après l'abandon, une relance À LA DEMANDE : l'écran disait « ça s'ouvrira tout
            seul » sans donner de quoi vérifier. */}
        {suivi.abandon ? (
          <Button tone="forme" label="Vérifier à nouveau" style={{ marginTop: 18 }} onPress={suivi.relancer} />
        ) : null}
        <Button tone="quiet" label="Revenir à mon espace" style={{ marginTop: suivi.abandon ? 9 : 18 }} onPress={() => router.replace('/espace')} />
      </Screen>
    );
  }

  if (suivi.etape === 'echec') {
    return (
      <Screen territory="forme" center>
        <Display size={29} lines={["ÇA N'A PAS", 'ABOUTI.']} style={{ marginTop: 10 }} />
        <Body muted style={{ marginTop: 12, fontSize: 14.5, lineHeight: 22 }}>
          Rien ne s'est ouvert. Le détail de la transaction est sur le site, dans Mes paiements.
        </Body>
        <Detail t={suivi.transaction} />
        <Button tone="quiet" label="Revenir à mon espace" style={{ marginTop: 18 }} onPress={() => router.replace('/espace')} />
      </Screen>
    );
  }

  return (
    <Screen territory="forme" center>
      <Display size={27} lines={suivi.etape === 'lecture' ? ['UN INSTANT.'] : ['RIEN À', 'CONSTATER.']} style={{ marginTop: 10 }} />
      {suivi.etape === 'lecture' ? null : (
        <SansDonnees
          quoi="cette transaction"
          origine={suivi.etape === 'panne' ? suivi.motif : "de ton compte — elle n'existe pas, ou elle appartient à un autre compte"}
          style={{ marginTop: 20 }}
        />
      )}
      {suivi.etape === 'panne' ? (
        <Button tone="forme" label="Réessayer" style={{ marginTop: 18 }} onPress={suivi.relancer} />
      ) : null}
      {suivi.etape === 'lecture' ? null : (
        <Button tone="quiet" label="Revenir à mon espace" style={{ marginTop: suivi.etape === 'panne' ? 9 : 18 }} onPress={() => router.replace('/espace')} />
      )}
    </Screen>
  );
}
