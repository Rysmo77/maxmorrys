/**
 * Témoignages de démonstration — source du bouton « Importer » de l'admin.
 * Une fois importés dans Firestore, l'affichage public lit la base, plus ce fichier.
 */
export interface SeedTestimonial {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
  gradient: string;
}

export const testimonials: SeedTestimonial[] = [
  {
    id: 't1',
    quote:
      "J'ai appliqué la méthode SEO dès la deuxième semaine. Trois mois plus tard, mon site e-commerce reçoit 4x plus de visiteurs sans publicité.",
    name: 'Aminata Fall',
    role: 'Fondatrice, boutique en ligne · Dakar',
    initials: 'AF',
    gradient: 'from-brand-600 to-brand-900',
  },
  {
    id: 't2',
    quote:
      "Enfin des formations qui vont droit au but. Pas de théorie inutile : des modèles, des cas concrets, et un accompagnement qui m'a vraiment fait avancer.",
    name: 'Kouassi David',
    role: 'Responsable marketing · Abidjan',
    initials: 'KD',
    gradient: 'from-plum-600 to-plum-900',
  },
  {
    id: 't3',
    quote:
      "Je partais de zéro en marketing digital. Aujourd'hui je gère les réseaux sociaux de trois clients en freelance. Le certificat a rassuré mes prospects.",
    name: 'Sali Ndiaye',
    role: 'Community manager indépendante · Thiès',
    initials: 'SN',
    gradient: 'from-neutral-600 to-neutral-900',
  },
  {
    id: 't4',
    quote:
      "Le module sur l'IA a transformé ma façon de travailler. Je produis mes contenus deux fois plus vite, avec une qualité que mes clients remarquent.",
    name: 'Moussa Ballo',
    role: 'Consultant e-commerce · Bamako',
    initials: 'MB',
    gradient: 'from-brand-700 to-neutral-900',
  },
];
