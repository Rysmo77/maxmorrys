import { router } from 'expo-router';
import {
  Body, Button, Display, Eyebrow, Ligne, Liste, Num, Reprise, Rubrique,
  SansDonnees, Screen, isIOS, useToken,
} from '../../ds';
import { provenance, useCertificats, useCours, useEspace, useMoi, useRafraichir } from '../../donnees';
import { BandeauHorsLigne } from '../../ecrans/BandeauHorsLigne';
import { BandeApprendre } from '../../ecrans/BandeApprendre';

/**
 * ══════════════════════════════════════════════════════════════════════════════════════
 * ══ 11 · MES FORMATIONS ══ — l'onglet Apprendre (maquette Rysmo-iOS-11, PRD rév. 6 §5.1).
 *
 * ⭐ PASSE 2 (29/10/2026). L'onglet rendait le catalogue ; la maquette en fait la page de ce
 * que la personne POSSÈDE : la reprise en tête, la cohorte, la liste de ses formations, puis
 * les leçons libres. Le catalogue est devenu la deuxième section de la bande (`/catalogue`).
 *
 * TOUT EST DÉRIVÉ. « Mes formations · N » compte les formations que le serveur marque
 * `acquise` ; « terminée · certifiée » vient des certificats émis, avec leur code. Ce que le
 * serveur ne transmet pas (date d'ouverture d'une liste d'attente, cohorte, leçons libres
 * isolées) n'est pas écrit : la ligne renvoie à l'écran qui le dira.
 * ══════════════════════════════════════════════════════════════════════════════════════
 */
export default function Cours() {
  const t = useToken();
  const cours = useCours();
  const moi = useMoi();
  const espace = useEspace();
  const certificats = useCertificats();
  const { enRafraichissement, rafraichir } = useRafraichir();

  const miennes = (cours.valeur ?? []).filter((f) => f.acquise);
  const certifiee = (titre: string) =>
    certificats.valeur?.certificats.find((c) => c.formation === titre) ?? null;

  return (
    <Screen
      territory="forme"
      tabbar
      titre={isIOS ? undefined : 'Apprendre'}
      onRefresh={rafraichir}
      enRafraichissement={enRafraichissement}
    >
      <BandeauHorsLigne />
      <Eyebrow style={{ marginTop: 6 }}>Je te forme · accès à vie</Eyebrow>
      <Display size={32} lines={['Apprendre']} style={{ marginTop: 6 }} />
      <BandeApprendre />

      {/* LA REPRISE, PREMIER OBJET (`mm-r-resume`) — seulement quand un module est en cours :
          une carte « reprendre » sans rien à reprendre promettrait un endroit qui n'existe pas. */}
      {moi.valeur && espace.valeur?.moduleEnCours ? (
        <Reprise
          espace="edu"
          style={{ marginTop: 16 }}
          surtitre={`En cours · ${espace.valeur.titreCourt}`}
          titre={espace.valeur.leconEnCours ?? espace.valeur.moduleEnCours}
          progression={espace.valeur.progression}
          meta={
            <Num
              value={`${espace.valeur.leconsFaites} / ${espace.valeur.lecons} · ${espace.valeur.progression} %`}
              {...provenance(espace)}
              style={{ fontSize: 12.5, color: t('paperFixed') }}
            />
          }
          onPress={() => router.push(espace.valeur?.formationId
            ? { pathname: '/lecon', params: { formationId: espace.valeur.formationId } }
            : '/lecon')}
        />
      ) : null}

      {/* LA COHORTE — la carte de la maquette porte la date du prochain live. Le serveur ne la
          transmet pas encore : la ligne mène à l'écran de la cohorte, qui le dit. */}
      {moi.valeur ? (
        <Liste style={{ marginTop: 14 }}>
          <Ligne
            icone="video"
            titre="Ta cohorte"
            sous="live, missions à relire, règles"
            onPress={() => router.push('/cohorte')}
          />
        </Liste>
      ) : null}

      <Rubrique>
        {cours.phase === 'servie' || cours.phase === 'replique'
          ? `Mes formations · ${miennes.length}`
          : 'Mes formations'}
      </Rubrique>
      {miennes.length === 0 ? (
        <SansDonnees
          quoi="tes formations"
          etat={cours.phase === 'servie' || cours.phase === 'replique'
            ? { phase: 'vide', valeur: null, source: cours.source, asOf: cours.asOf }
            : cours}
          hauteur={3}
          action={<Button tone="forme" size="sm" label="Voir le catalogue" onPress={() => router.push('/catalogue')} />}
        />
      ) : (
        <Liste>
          {miennes.map((f) => {
            const c = certifiee(f.titre);
            return (
              <Ligne
                key={f.slug}
                icone={c ? 'award' : 'book'}
                fondIcone={c ? t('ok') : undefined}
                titre={f.titre}
                sous={c ? `Terminée · certifiée · ${c.code}` : f.meta}
                onPress={() => router.push({ pathname: '/formation', params: { slug: f.slug, titre: f.titre } })}
              />
            );
          })}
        </Liste>
      )}

      <Rubrique>Leçons libres</Rubrique>
      <Liste>
        <Ligne
          icone="play"
          titre="Les leçons d'ouverture"
          sous="dans chaque fiche du catalogue, sans compte"
          onPress={() => router.push('/catalogue')}
        />
      </Liste>
      <Body muted style={{ marginTop: 10, fontSize: 12.5, lineHeight: 18 }}>
        Les leçons libres se lisent depuis la fiche de leur formation.
      </Body>
    </Screen>
  );
}
