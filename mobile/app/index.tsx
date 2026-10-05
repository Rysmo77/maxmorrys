import { Redirect } from 'expo-router';

/**
 * `/` — L'ENTRÉE DE L'APPLICATION, et c'est le lancement.
 *
 * ⛔ SANS CE FICHIER, `/` ÉTAIT SERVI PAR L'ONGLET ESPACE, et la chaîne de première ouverture
 * (`lancement → onboarding → permissions`) n'était atteinte par RIEN — trois écrans du kit
 * écrits et jamais montrés. C'est ce qui avait été vu et signalé. L'onglet vit désormais à
 * `/espace` ; `mobile-routes.test.ts` garde que `/` mène au lancement.
 */
export default function Entree() {
  return <Redirect href="/lancement" />;
}
