import { Redirect } from 'expo-router';

/**
 * LA ROUTE QUI N'EXISTE PAS — et pourquoi elle mérite un fichier.
 *
 * Sans `+not-found`, un lien profond vers une route absente affiche l'écran par défaut
 * d'expo-router : un fond blanc, une police système, le chemin en anglais. Sur un routeur
 * PAR FICHIERS, ce cas n'est pas théorique — il se produit à chaque renommage de fichier, et
 * surtout à chaque lien profond forgé ou périmé. C'est justement le mode d'entrée d'une
 * application installée : une URL partagée, un retour de paiement, une notification.
 *
 * Plutôt qu'un écran de secours de plus, ce fichier renvoie sur `/erreur`, qui porte déjà la
 * forme du système : **motif, conséquence, sortie — dans cet ordre**, et sans excuse.
 *
 * LE MOTIF EST RÉEL. On ne dit pas « une erreur est survenue » : on dit ce qui s'est passé —
 * l'adresse ouverte ne correspond à aucun écran. C'est vérifiable, et c'est ce qui permet à
 * quelqu'un de comprendre qu'il doit vérifier son lien plutôt que son réseau.
 */
export default function NotFound() {
  return (
    <Redirect
      href={{
        pathname: '/erreur',
        params: {
          titre: "Cette adresse ne mène à aucun écran.",
          motif: "Le lien que tu as ouvert désigne un écran qui n'existe pas dans l'application — soit il a changé d'adresse, soit il a été recopié en partie.",
          consequence: "Rien n'est perdu : tes cours, tes notes et ta progression vivent sur ton compte, pas dans ce lien.",
          libelle: 'Revenir à mon espace',
          sortie: '/',
        },
      }}
    />
  );
}
