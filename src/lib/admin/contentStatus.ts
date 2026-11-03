/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * LES STATUTS RÉELS DU CATALOGUE — UN SEUL CALCUL (audit UI/UX du 03/11/2026, X14).
 *
 * Analytics affichait « Formations (publiées) 2 » et « Taux de publication 100 % » pendant
 * que l'écran Formations disait « 0 publiée, 2 Bientôt » : il lisait `status == 'published'`,
 * qui compte aussi les formations « Bientôt » (drapeau `comingSoon` posé SUR une formation
 * publiée). Et « Articles (publiés) 93 » montrait le total, brouillons compris.
 *
 * Le tableau de bord, le menu et Analytics faisaient chacun leur soustraction. Ici, une
 * seule : « ouverte » = publiée ET pas Bientôt ; « publié » = `status == 'published'`
 * (un article programmé n'est pas publié).
 * ═══════════════════════════════════════════════════════════════════════════════
 */
export interface ContentCountsInput {
  formations: number;
  publishedFormations: number;
  comingSoonFormations: number;
  articles: number;
  publishedPosts: number;
}

export interface ContentStatus {
  formations: {
    total: number;
    /** Publiées et achetables : ni brouillon, ni « Bientôt ». */
    open: number;
    comingSoon: number;
    draft: number;
    /** Tout ce qui n'est pas ouvert (brouillons + Bientôt) : la file « à publier ». */
    notOpen: number;
    /** Part ouverte, en %, `null` sans formation (pas de 0 % inventé). */
    openRate: number | null;
  };
  articles: {
    total: number;
    published: number;
    /** Brouillons et programmés. */
    notPublished: number;
    publishedRate: number | null;
  };
}

const rate = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : null);
const nonNeg = (n: number) => Math.max(0, n);

export function contentStatus(c: ContentCountsInput): ContentStatus {
  const open = nonNeg(c.publishedFormations - c.comingSoonFormations);
  const draft = nonNeg(c.formations - c.publishedFormations);
  const published = nonNeg(c.publishedPosts);
  return {
    formations: {
      total: c.formations,
      open,
      comingSoon: nonNeg(c.comingSoonFormations),
      draft,
      notOpen: nonNeg(c.formations - open),
      openRate: rate(open, c.formations),
    },
    articles: {
      total: c.articles,
      published,
      notPublished: nonNeg(c.articles - published),
      publishedRate: rate(published, c.articles),
    },
  };
}
