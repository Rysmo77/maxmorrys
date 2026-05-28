import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from '../components/shared/CountUp';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import {
  ArrowRight,
  Target,
  Heart,
  BookOpen,
  Globe,
  BarChart3,
  CheckCircle,
  Sparkles,
  Code2,
  HeartHandshake,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
  MapPin,
  Building2,
  GraduationCap,
  Briefcase,
  HandHeart,
} from 'lucide-react';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { SITE_URL } from '../components/seo/seo-config';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';
import { universeThemes } from '../lib/sectionThemes';

const theme = universeThemes.about;

const viewportOnce = { once: true, amount: 0.2 } as const;

const values = [
  { icon: Heart, title: 'Passion Authentique', desc: "Une passion pour le marketing digital née d'une découverte qui a changé ma vie en 2021." },
  { icon: Globe, title: 'Vision Africaine', desc: 'Connaissance profonde des réalités et opportunités du marché africain francophone.' },
  { icon: Sparkles, title: 'Approche Hybride', desc: "Marketing, IA, automatisation et développement web — un profil à l'intersection de la stratégie, du produit et de la tech." },
  { icon: Target, title: 'Résultats Concrets', desc: 'Focus sur les stratégies qui donnent des résultats mesurables et durables.' },
];

const expertise = [
  {
    title: 'Marketing, Growth & Stratégie 360°',
    desc: "Stratégies multicanales pour des audiences africaines francophones, pilotées par la data, du brand à la conversion.",
    tags: [
      'Stratégie marketing 360°',
      'Growth marketing',
      'SEO, SEA, SMO, SMA',
      'Campagnes multicanales',
      'Content marketing',
      'Social media',
      'Branding corporate & personal',
      "Marketing d'impact & RSE",
      'Analyse de marché & veille',
      'KPI, reporting & ROI',
      'CRM & fidélisation',
    ],
    stat: '+1 790 % de trafic web chez Eyone Medical',
    icon: BarChart3,
  },
  {
    title: 'IA, Automatisation & Productivité',
    desc: "Conception de systèmes IA et de workflows n8n pour industrialiser la production de contenus et la communication.",
    tags: [
      'Prompt engineering',
      'IA générative appliquée',
      'Workflows n8n',
      'Rédaction automatisée',
      'Automatisation social media',
      'Systèmes IA de contenus',
      'Optimisation de processus',
      'Chatbots WhatsApp',
    ],
    stat: 'Workflows IA bout en bout en production',
    icon: Sparkles,
  },
  {
    title: 'Web, Produit Digital & Plateformes',
    desc: "Plateformes full stack avec base de données et hébergement Firebase, accélérées par Claude Code.",
    tags: [
      'Plateformes web full stack',
      'Claude Code',
      'Base de données & logique applicative',
      'Hébergement Firebase',
      'WordPress',
      'Maintenance, sécurité, performance',
      'Monitoring & déploiement',
      'Support utilisateurs',
    ],
    stat: 'Plateformes web en production',
    icon: Code2,
  },
  {
    title: 'Management & Partenariats',
    desc: "Coordination d'équipes pluridisciplinaires et pilotage de partenaires institutionnels, ONG et acteurs de terrain.",
    tags: [
      "Coordination d'équipes",
      'Gestion de prestataires',
      'Pilotage de projets transverses',
      'Partenaires institutionnels & ONG',
      'Événements communautaires',
      'Formation & accompagnement',
      'Communication institutionnelle',
    ],
    stat: 'Projet Wergu Yaram + Messages de Vie Sénégal',
    icon: HeartHandshake,
  },
];

const platforms = [
  {
    name: 'Eyone Medical',
    domain: 'eyone.net',
    url: 'https://eyone.net/',
    tag: 'Santé digitale',
    desc: "Plateforme de digitalisation des parcours de soins en Afrique.",
  },
  {
    name: 'Centre Hospitalier',
    domain: 'chrtbn.sn',
    url: 'https://chrtbn.sn/',
    tag: 'Institutionnel',
    desc: "Site institutionnel d'une structure hospitalière partenaire.",
  },
  {
    name: 'Khanouss',
    domain: 'khanouss.shop',
    url: 'https://khanouss.shop/',
    tag: 'E-commerce',
    desc: "Plateforme e-commerce full stack — catalogue, panier et paiement.",
  },
  {
    name: 'HolyCash',
    domain: 'holycash.net',
    url: 'https://holycash.net/',
    tag: 'Fintech',
    desc: "Plateforme web orientée services financiers et paiement.",
  },
  {
    name: 'English Lab',
    domain: 'yessienglish.com',
    url: 'https://yessienglish.com/',
    tag: 'Éducation',
    desc: "Plateforme d'accompagnement en anglais pour professionnels et étudiants africains francophones.",
  },
  {
    name: 'La Ruche Excellence',
    domain: 'laruchexcellence.ga',
    url: 'https://laruchexcellence.ga/',
    tag: 'Éducation',
    desc: "Plateforme web d'un établissement éducatif au Gabon.",
  },
  {
    name: 'STEPS Magazine',
    domain: 'stepsmag.com',
    url: 'https://stepsmag.com/',
    tag: 'Média',
    desc: "Magazine chrétien premium en Afrique de l'Ouest — spiritualité et leadership.",
  },
  {
    name: 'ResHo Konnexion',
    domain: 'resho.vasesdhonneursenegal.com',
    url: 'https://resho.vasesdhonneursenegal.com/',
    tag: 'Communauté',
    desc: "Plateforme de réseau professionnel et communautaire.",
  },
];

/** Capture desktop — WordPress mShots (gratuit, illimité, cache CDN). */
const desktopShotUrl = (url: string) =>
  `https://s.wp.com/mshots/v1/${encodeURIComponent(url)}?w=1280&h=820`;

/** Capture mobile réelle — Microlink émule un vrai viewport mobile.
 *  `embed=screenshot.url` → l'API renvoie directement l'image (utilisable en <img src>). */
const mobileShotUrl = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}` +
  `&screenshot=true&meta=false&embed=screenshot.url` +
  `&viewport.isMobile=true&viewport.width=400&viewport.height=860`;

/** Aperçu d'une plateforme avec interrupteur desktop / mobile. */
function PlatformPreview({ url, domain, name }: { url: string; domain: string; name: string }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const switchTo = (d: 'desktop' | 'mobile') => {
    if (d === device) return;
    setLoaded(false);
    setFailed(false);
    setDevice(d);
  };

  const src =
    device === 'desktop' ? desktopShotUrl(url) : mobileShotUrl(url);

  /** Capture + skeleton + fallback — partagés entre les 2 mockups. */
  const screenshot = (
    <>
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900" />
      )}
      {failed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900">
          <span className="text-lg font-black text-neutral-400/70 dark:text-neutral-600 tracking-tight px-3 text-center">{domain}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={`Aperçu ${device === 'mobile' ? 'mobile' : 'desktop'} de la plateforme ${name}`}
          loading="lazy"
          width={device === 'mobile' ? 400 : 1280}
          height={device === 'mobile' ? 860 : 800}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover object-top transition-opacity duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </>
  );

  const toggleBtn = (d: 'desktop' | 'mobile', Icon: typeof Monitor, label: string) => (
    <button
      type="button"
      onClick={() => switchTo(d)}
      aria-pressed={device === d}
      aria-label={`Aperçu ${label.toLowerCase()}`}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
        device === d
          ? theme.buttonSolid
          : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </button>
  );

  return (
    <div>
      {/* Interrupteur desktop / mobile */}
      <div className="flex justify-end mb-3">
        <div
          role="group"
          aria-label={`Choisir l'aperçu de ${name}`}
          className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700"
        >
          {toggleBtn('desktop', Monitor, 'Desktop')}
          {toggleBtn('mobile', Smartphone, 'Mobile')}
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {device === 'desktop' ? (
          <motion.div
            key="desktop"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 shadow-lg shadow-neutral-900/5 dark:shadow-black/30 overflow-hidden transition-shadow duration-300 group-hover:shadow-xl"
          >
            {/* Chrome navigateur */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 border-b border-neutral-200/80 dark:border-neutral-700">
              <span className="flex gap-1.5 shrink-0" aria-hidden="true">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </span>
              <span className="flex-1 truncate text-center text-[11px] font-semibold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-neutral-900 rounded-md px-3 py-1 mx-2">
                {domain}
              </span>
              <span className="w-9 shrink-0" aria-hidden="true" />
            </div>
            {/* Corps de fenêtre — capture desktop */}
            <div className="aspect-[16/10] bg-neutral-50 dark:bg-neutral-900 relative">
              {screenshot}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="mobile"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex justify-center py-2"
          >
            {/* Mockup téléphone */}
            <div className="relative w-[240px] max-w-full rounded-[2.2rem] bg-neutral-900 dark:bg-neutral-800 p-2.5 shadow-xl shadow-neutral-900/20 dark:shadow-black/40 transition-shadow duration-300 group-hover:shadow-2xl">
              {/* Encoche */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1/3 h-5 bg-neutral-900 dark:bg-neutral-800 rounded-b-2xl z-10" />
              {/* Écran — capture mobile */}
              <div className="aspect-[9/19.5] rounded-[1.6rem] overflow-hidden bg-neutral-50 dark:bg-neutral-900 relative">
                {screenshot}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const tools = [
  'Claude Code',
  'n8n',
  'Firebase',
  'WordPress',
  'Chatbots IA',
  'WhatsApp Marketing',
  'Canva',
  'CapCut',
  'Google Ads',
  'SEO',
  'Social Media Automation',
];

type Experience = {
  company: string;
  role: string;
  period: string;
  location: string;
  icon: typeof Building2;
  intro: string;
  blocks: { title: string; bullets: string[] }[];
};

const experiences: Experience[] = [
  {
    company: 'Eyone Medical',
    role: 'Responsable Marketing Digital, Growth & Automatisation IA',
    period: 'Depuis janvier 2024',
    location: 'Dakar, Sénégal',
    icon: Building2,
    intro:
      "Chez Eyone, je pilote la stratégie de croissance digitale, la visibilité de marque, la communication multicanale et plusieurs projets digitaux à fort impact. Mon rôle dépasse le marketing opérationnel classique et couvre également la gestion de projet, la coordination de partenariats, le développement web et l'automatisation de processus.",
    blocks: [
      {
        title: 'Stratégie marketing, growth & acquisition',
        bullets: [
          "Élaboration et déploiement de stratégies marketing multicanales : SEO, SEA, SMO, social media, campagnes de visibilité, contenus, newsletters, articles, WhatsApp, vidéos et supports digitaux.",
          "Définition des objectifs, KPI et indicateurs de performance : trafic, clics, conversions, ventes, transactions, croissance organique et ROI.",
          "Analyse des parcours clients et optimisation du tunnel de conversion, de la découverte jusqu'à la décision d'achat.",
          "Veille concurrentielle, analyse marché, identification d'opportunités business et proposition de leviers de croissance.",
          "Gestion de campagnes orientées performance, notoriété et acquisition.",
        ],
      },
      {
        title: 'Branding, contenus & communication',
        bullets: [
          "Structuration de la présence digitale d'Eyone à partir de zéro.",
          "Création et pilotage d'un calendrier éditorial orienté SEO, marque, éducation et conversion.",
          "Développement de contenus pour renforcer la crédibilité d'Eyone dans l'écosystème santé digitale.",
          "Coordination de la communication institutionnelle, des supports commerciaux et des messages de marque.",
          "Pilotage de la visibilité du groupe sur plusieurs marchés africains.",
        ],
      },
      {
        title: 'IA, automatisation & productivité marketing',
        bullets: [
          "Mise en place de systèmes automatisés avec l'IA pour accélérer la production de contenus et la diffusion marketing.",
          "Automatisation de workflows avec n8n : rédaction automatisée d'articles, planification de contenus, marketing réseaux sociaux et processus de communication.",
          "Utilisation de l'IA générative pour la création, l'optimisation, la reformulation et l'adaptation de contenus multicanaux.",
          "Développement de solutions internes permettant de réduire les tâches répétitives et d'améliorer la productivité marketing.",
        ],
      },
      {
        title: 'Développement web & plateformes digitales',
        bullets: [
          "Développement et maintenance de plateformes web liées à Eyone Medical, Wergu Yaram, Topatoko et des structures hospitalières.",
          "Création de plateformes full stack avec base de données, logique applicative et hébergement Firebase.",
          "Utilisation de Claude Code pour accélérer la conception et le développement de plateformes web fonctionnelles.",
          "Gestion des évolutions techniques, corrections, sécurité, performance, hébergement, monitoring et mises à jour.",
          "Formation et accompagnement d'utilisateurs sur certaines plateformes développées.",
        ],
      },
      {
        title: 'Projet Wergu Yaram & partenariats',
        bullets: [
          "Pilotage global du projet Wergu Yaram : planification, coordination, storytelling d'impact et suivi opérationnel.",
          "Élaboration de la stratégie de communication RSE et impact social.",
          "Gestion de relations avec partenaires institutionnels, ONG et acteurs de terrain.",
          "Organisation d'initiatives sociétales, campagnes terrain et événements communautaires.",
          "Suivi des indicateurs d'impact et contribution aux rapports d'activité.",
        ],
      },
      {
        title: 'Management & coordination',
        bullets: [
          "Encadrement et coordination de collaborateurs, créateurs de contenus, community managers, partenaires et prestataires.",
          "Accompagnement des équipes dans le développement de compétences digitales.",
          "Support technique et marketing auprès des équipes internes pour les opérations, campagnes et lancements.",
        ],
      },
    ],
  },
  {
    company: 'Messages de Vie Sénégal',
    role: 'Responsable Marketing Digital bénévole',
    period: 'Depuis avril 2025',
    location: 'Dakar, Sénégal',
    icon: HandHeart,
    intro:
      "Pilotage bénévole du marketing digital d'une organisation à but non lucratif, engagée dans des actions de compassion et des campagnes médicales sur le territoire sénégalais.",
    blocks: [
      {
        title: 'Stratégie & visibilité',
        bullets: [
          "Définition de la stratégie de contenu, coordination de la gestion des réseaux sociaux, marketing d'influence et communication événementielle.",
          "Développement de la visibilité des actions terrain et valorisation des campagnes sociales.",
          "Encadrement d'une équipe bénévole composée de créateurs de contenus, community managers et contributeurs.",
          "Mise en place de campagnes digitales ciblées pour renforcer l'engagement, attirer de nouveaux partenaires et soutenir les actions humanitaires.",
        ],
      },
    ],
  },
  {
    company: 'Académie Light',
    role: 'Formateur en Marketing Digital & Community Management',
    period: 'Mai 2024 — Décembre 2024',
    location: 'Dakar, Sénégal',
    icon: GraduationCap,
    intro:
      "Animation d'un module complet de community management et marketing digital auprès d'étudiants en formation professionnelle.",
    blocks: [
      {
        title: 'Formation & accompagnement',
        bullets: [
          "Formation aux fondamentaux du marketing digital, au rôle du community manager, à la création de contenus, à la gestion des réseaux sociaux et à l'utilisation d'outils comme Canva et CapCut.",
          "Accompagnement de plus de 20 étudiants dans la mise en pratique de projets digitaux.",
          "Transmission d'une approche orientée métier, performance, autonomie et employabilité.",
        ],
      },
    ],
  },
  {
    company: 'My Onoma',
    role: 'Digital Marketer Freelance',
    period: 'Janvier 2023 — Octobre 2023',
    location: 'Dakar, Sénégal',
    icon: Briefcase,
    intro:
      "Élaboration de stratégies digitales pour développer la présence de l'entreprise et de ses clients sur leurs marchés.",
    blocks: [
      {
        title: 'Stratégie & exécution',
        bullets: [
          "Analyse concurrentielle, ciblage d'audience, définition de plans d'action et mise en œuvre de campagnes multicanales.",
          "Création d'initiatives visant à accroître la visibilité, renforcer la réputation de marque et générer une croissance mesurable.",
          "Gestion de contenus, réseaux sociaux et actions de communication digitale.",
        ],
      },
    ],
  },
];

const milestones = [
  { year: '2014', lieu: "Abidjan, Côte d'Ivoire", title: "Le Début de l'Aventure", desc: "Après mon Baccalauréat à Douala (Cameroun), je pars étudier à Abidjan. Des années marquantes qui m'ont ouvert l'esprit sur les opportunités en Afrique." },
  { year: '2017', lieu: "Abidjan, Côte d'Ivoire", title: 'Licence en Économie — CERAP', desc: "J'obtiens ma Licence en Économie au CERAP Abidjan après 3 années riches en rencontres et expériences." },
  { year: '2018', lieu: 'Dakar, Sénégal', title: 'Bienvenue au Pays de la Téranga', desc: "« Salam Aleykoum, nanga def »… J'arrive au Sénégal, ce merveilleux pays de la Téranga où je vis encore aujourd'hui." },
  { year: '2020', lieu: 'Dakar, Sénégal', title: "Master en Gestion & Développement d'Entreprises — BEM Dakar", desc: "Pivot vers l'entrepreneuriat. Les maths et moi, ça ne faisait pas bon ménage !" },
  { year: '2021', lieu: 'Dakar, Sénégal', title: "L'Année où Tout a Basculé", desc: "Découverte du marketing digital grâce à une personne qui compte pour moi. Je « tombe fan » et dévore tous les tutos YouTube et formations Udemy." },
  { year: '2023', lieu: 'Dakar, Sénégal', title: 'My Onoma — Digital Marketer Freelance', desc: "Premiers contrats freelance en conception web, community management et SEO. Co-création de My Onoma." },
  { year: '2023', lieu: 'Dakar, Sénégal', title: 'Master en Digital Business — BEM Dakar', desc: "Deuxième Master, cette fois en Digital Business pour consolider l'expertise growth + produit." },
  { year: '2024 — Janv.', lieu: 'Dakar, Sénégal', title: 'Eyone Medical — Marketing & Growth Manager', desc: "Je rejoins Eyone Medical, pionnier de la digitalisation des soins en Afrique. Résultats à 18 mois : +1 790 % de trafic web et +8 000 abonnés organiques." },
  { year: '2024 — Mai', lieu: 'Dakar, Sénégal', title: 'Académie Light — Formateur', desc: "Co-création de l'Académie Light avec une amie visionnaire. Je deviens formateur en marketing digital & community management." },
  { year: '2025 — Avril', lieu: 'Dakar, Sénégal', title: 'Messages de Vie Sénégal', desc: "Je m'engage bénévolement pour piloter le marketing digital d'une organisation qui mène campagnes médicales et consultations gratuites au profit des populations démunies." },
  { year: '2025', lieu: 'Dakar, Sénégal', title: "Plateformes web & IA en production", desc: "Lancement et industrialisation des plateformes Eyone Medical, Wergu Yaram, Topatoko et de workflows IA bout en bout pour le marketing et le contenu." },
];

const sectionNav = [
  { id: 'impact', label: 'Impact' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'plateformes', label: 'Plateformes' },
  { id: 'experiences', label: 'Expériences' },
  { id: 'parcours', label: 'Parcours' },
];

/** Une étape de la frise « Mon parcours ». */
function MilestoneRow({ m }: { m: (typeof milestones)[number] }) {
  return (
    <div className="relative pl-10">
      <span
        className="absolute left-2 top-1.5 -translate-x-1/2 w-3 h-3 rounded-full bg-morrys-500 ring-4 ring-neutral-50 dark:ring-neutral-900"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1.5">
        <span className={`text-sm font-black tracking-tight ${theme.accentText}`}>{m.year}</span>
        <span className="text-[11px] font-bold tracking-wider uppercase text-morrys-500 dark:text-morrys-400">{m.lieu}</span>
      </div>
      <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-1">{m.title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{m.desc}</p>
    </div>
  );
}

export default function About() {
  const [openExperience, setOpenExperience] = useState<number | null>(0);
  const [showAllMilestones, setShowAllMilestones] = useState(false);
  const [activeSection, setActiveSection] = useState('impact');

  // Carrousel Plateformes
  const trackRef = useRef<HTMLDivElement>(null);
  const carouselWrapRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [carouselInView, setCarouselInView] = useState(false);

  const updateArrows = () => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  };
  const scrollCarousel = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, []);

  // Le carrousel ne s'anime que lorsque la section est visible à l'écran
  useEffect(() => {
    const el = carouselWrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setCarouselInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Défilement automatique du carrousel (pause au survol / focus / hors-écran / reduced-motion)
  useEffect(() => {
    if (carouselPaused || !carouselInView) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => {
      const el = trackRef.current;
      if (!el) return;
      const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;
      el.scrollBy({ left: end ? -el.scrollLeft : el.clientWidth, behavior: 'smooth' });
    }, 4500);
    return () => clearInterval(id);
  }, [carouselPaused, carouselInView]);

  // Scroll-spy pour le menu d'ancrage
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    sectionNav.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div>
      <SEOHead
        title="Max-Morrys Eyoum — Marketing & Growth Manager | IA, Automatisation, Plateformes Web"
        description="Profil hybride marketing-tech basé à Dakar : stratégie 360°, growth, SEO, IA, automatisation, plateformes web full stack et pilotage de partenariats en Afrique francophone."
      />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: 'Max-Morrys Eyoum',
        url: `${SITE_URL}/a-propos`,
        jobTitle: 'Marketing & Growth Manager',
        worksFor: { '@type': 'Organization', name: 'Eyone Medical' },
        address: { '@type': 'PostalAddress', addressLocality: 'Dakar', addressCountry: 'SN' },
        sameAs: [
          'https://www.linkedin.com/in/max-morrys-eyoum/',
          'https://www.youtube.com/@maxmorrys',
        ],
      }} />

      {/* ── 1. HERO CORPORATE ── */}
      <section className="pt-28 pb-24 lg:pt-36 lg:pb-32 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <motion.div
              className="lg:col-span-7"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={staggerItem} className="flex items-center gap-3 mb-6">
                <AnimatedIcon
                  icon={Sparkles}
                  animation="pulse"
                  className="w-10 h-10 rounded-2xl bg-morrys-100 dark:bg-morrys-900/30 shrink-0"
                  iconClassName="w-5 h-5 text-morrys-600 dark:text-morrys-400"
                />
                <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow}`}>
                  MAX-MORRYS EYOUM
                </p>
              </motion.div>
              <motion.h1 variants={staggerItem} className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[0.95] tracking-tight text-neutral-900 dark:text-white mb-6 text-balance max-w-[15ch]">
                Marketing & Growth Manager.
              </motion.h1>
              <motion.p variants={staggerItem} className="text-base lg:text-lg text-neutral-500 dark:text-neutral-400 font-medium mb-8">
                IA · Automatisation · Plateformes Web · Partenariats
              </motion.p>

              {/* Blockquote — profil hybride absorbé */}
              <motion.blockquote variants={staggerItem} className="border-l-2 border-morrys-500 dark:border-morrys-400 pl-5 mb-10 max-w-2xl">
                <p className="text-base lg:text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                  J'accompagne la croissance d'organisations en Afrique francophone — santé, services, éducation, impact social — en combinant stratégie marketing, data, contenu, partenariats, développement web et automatisation des processus.
                </p>
              </motion.blockquote>

              {/* Mini-stats inline — responsive sans divide-x */}
              <motion.div variants={staggerItem} className="grid grid-cols-3 gap-4 sm:gap-6 mb-10 max-w-2xl">
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    <CountUp value={1790} prefix="+" suffix=" %" format />
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-1">Trafic</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    <CountUp value={8000} prefix="+" format />
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-1">Abonnés</p>
                </div>
                <div>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    <CountUp value={5} prefix="+" />
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mt-1">Plateformes</p>
                </div>
              </motion.div>

              <motion.div variants={staggerItem} className="flex flex-wrap gap-4">
                <Link to="/contact" className={`inline-flex items-center gap-2 px-6 py-3 ${theme.buttonSolid} text-sm font-bold rounded-full hover:-translate-y-0.5 active:scale-[0.97] hover:shadow-lg hover:shadow-morrys-600/25 transition-all duration-300 tracking-wide`}>
                  Travaillons ensemble <ArrowRight className="w-4 h-4" />
                </Link>
                <a href="#experiences" className="inline-flex items-center gap-2 px-6 py-3 border-2 border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-200 text-sm font-bold rounded-full hover:bg-white dark:hover:bg-neutral-800 hover:-translate-y-0.5 transition-all duration-300 tracking-wide">
                  Mes expériences
                </a>
              </motion.div>
            </motion.div>

            <motion.div
              className="lg:col-span-5 relative"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: 0.15 }}
            >
              <div className="aspect-[4/5] rounded-2xl overflow-hidden relative">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/A-propos%2FChatGPT%20Image%2014%20mai%202026%2C%2000_44_30%20(1).png?alt=media&token=e72ee3b7-1ff1-45ff-a994-b43607d16387"
                  alt="Max-Morrys Eyoum"
                  className="w-full h-full object-cover scale-x-[-1]"
                  loading="lazy"
                  width={640}
                  height={800}
                />
                {/* Badge Dakar — INSIDE image on mobile/tablet */}
                <div className="absolute bottom-4 right-4 lg:hidden bg-white/95 dark:bg-neutral-800/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-xl border border-white/40 dark:border-neutral-700 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-morrys-50 dark:bg-morrys-900/30 flex items-center justify-center shrink-0">
                    <MapPin className={`w-4 h-4 ${theme.accentText}`} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-neutral-900 dark:text-white leading-none">Dakar · Sénégal</p>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-1 font-semibold tracking-wide uppercase">Afrique francophone</p>
                  </div>
                </div>
              </div>
              {/* Badge Dakar — floating on desktop only */}
              <motion.div
                className="hidden lg:flex absolute -bottom-6 -right-8 bg-white dark:bg-neutral-800 rounded-2xl px-5 py-4 shadow-xl border border-neutral-100 dark:border-neutral-700 items-center gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut', delay: 0.6 }}
              >
                <div className="w-10 h-10 rounded-full bg-morrys-50 dark:bg-morrys-900/20 flex items-center justify-center shrink-0">
                  <MapPin className={`w-5 h-5 ${theme.accentText}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-neutral-900 dark:text-white leading-none">Dakar · Sénégal</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 font-medium tracking-wide uppercase">Afrique francophone</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MENU D'ANCRAGE STICKY ── */}
      <nav className="sticky top-16 lg:top-[68px] z-30 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md border-y border-neutral-200/80 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ul className="flex justify-start lg:justify-center gap-1.5 sm:gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {sectionNav.map((s, i) => {
              const active = activeSection === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={`group flex items-center gap-2 whitespace-nowrap rounded-full pl-2.5 pr-3.5 sm:pl-3 sm:pr-4 py-2 text-xs sm:text-sm font-bold tracking-wide transition-all duration-200 ${
                      active
                        ? `${theme.buttonSolid} shadow-sm shadow-morrys-600/20`
                        : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/70 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black tabular-nums transition-colors ${
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 group-hover:bg-morrys-100 group-hover:text-morrys-600 dark:group-hover:bg-morrys-900/40 dark:group-hover:text-morrys-300'
                      }`}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {s.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* ── 2. RÉSUMÉ D'IMPACT ── */}
      <motion.section
        id="impact"
        className="py-24 bg-white dark:bg-neutral-950 scroll-mt-32"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-5`}>
              RÉSUMÉ D'IMPACT
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              Les chiffres clés
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
              Croissance mesurable, plateformes en production et périmètre élargi marketing — tech — partenariats.
            </p>
          </div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.div variants={staggerItem} className="text-center py-10 px-8 bg-neutral-50 dark:bg-neutral-900">
              <p className={`text-5xl lg:text-6xl font-black ${theme.accentText} tracking-tight`}>
                <CountUp value={1790} prefix="+" suffix=" %" format />
              </p>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">Trafic web Eyone</p>
              <p className="text-xs text-neutral-400 mt-1">De 34 à 643 visites mensuelles en un an</p>
            </motion.div>
            <motion.div variants={staggerItem} className="text-center py-10 px-8 bg-neutral-50 dark:bg-neutral-900">
              <p className={`text-5xl lg:text-6xl font-black ${theme.accentText} tracking-tight`}>
                <CountUp value={8000} prefix="+" format />
              </p>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">Abonnés organiques</p>
              <p className="text-xs text-neutral-400 mt-1">Dont +4 000 sur LinkedIn</p>
            </motion.div>
            <motion.div variants={staggerItem} className="text-center py-10 px-8 bg-neutral-50 dark:bg-neutral-900">
              <p className={`text-5xl lg:text-6xl font-black ${theme.accentText} tracking-tight`}>
                <CountUp value={5} prefix="+" />
              </p>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">Plateformes web</p>
              <p className="text-xs text-neutral-400 mt-1">Santé, e-commerce, éducation, fintech, institutionnel</p>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ── 3. EXPERTISE & COMPÉTENCES (fusion) ── */}
      <motion.section
        id="expertise"
        className="py-24 bg-neutral-50 dark:bg-neutral-900 scroll-mt-32"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              Expertise & compétences
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
              Quatre piliers complémentaires — marketing, IA, web et management — au service de la croissance et de l'impact.
            </p>
          </div>
          <motion.div
            className="grid md:grid-cols-2 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {expertise.map((item, i) => (
              <motion.div
                key={i}
                variants={staggerItem}
                className="bg-white dark:bg-neutral-950 rounded-2xl p-8 border border-neutral-100 dark:border-neutral-800 flex flex-col hover:border-morrys-300 dark:hover:border-morrys-700 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-full bg-morrys-50 dark:bg-morrys-900/20 flex items-center justify-center mb-5">
                  <item.icon className={`w-5 h-5 ${theme.accentText}`} />
                </div>
                <h3 className="font-black text-xl text-neutral-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">{item.desc}</p>
                <div className="flex flex-wrap items-start content-start gap-2 mb-6 flex-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className={`px-3 py-1 ${theme.softBadge} text-xs font-semibold rounded-full whitespace-nowrap`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <p className={`text-sm font-bold ${theme.accentText} border-t border-neutral-200 dark:border-neutral-700 pt-4`}>
                  {item.stat}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── 4. PLATEFORMES ── */}
      <motion.section
        id="plateformes"
        className="py-24 bg-white dark:bg-neutral-950 scroll-mt-32"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              Plateformes que je maintiens
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
              Conçues, déployées et maintenues en production — full stack avec base de données, sécurité et monitoring.
            </p>
          </div>
          <div
            ref={carouselWrapRef}
            className="relative"
            onMouseEnter={() => setCarouselPaused(true)}
            onMouseLeave={() => setCarouselPaused(false)}
            onFocusCapture={() => setCarouselPaused(true)}
            onBlurCapture={() => setCarouselPaused(false)}
            onTouchStart={() => setCarouselPaused(true)}
          >
            {/* Flèche précédente */}
            <button
              type="button"
              onClick={() => scrollCarousel(-1)}
              disabled={atStart}
              aria-label="Plateformes précédentes"
              className="hidden sm:flex absolute -left-3 lg:-left-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg text-neutral-700 dark:text-neutral-200 transition-all hover:bg-morrys-600 hover:text-white hover:border-morrys-600 disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Flèche suivante */}
            <button
              type="button"
              onClick={() => scrollCarousel(1)}
              disabled={atEnd}
              aria-label="Plateformes suivantes"
              className="hidden sm:flex absolute -right-3 lg:-right-5 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-lg text-neutral-700 dark:text-neutral-200 transition-all hover:bg-morrys-600 hover:text-white hover:border-morrys-600 disabled:opacity-0 disabled:pointer-events-none"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dégradés de bord — suggèrent le défilement */}
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute left-0 top-0 bottom-4 z-[5] w-12 sm:w-20 bg-gradient-to-r from-white dark:from-neutral-950 to-transparent transition-opacity duration-300 ${
                atStart ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <div
              aria-hidden="true"
              className={`pointer-events-none absolute right-0 top-0 bottom-4 z-[5] w-12 sm:w-20 bg-gradient-to-l from-white dark:from-neutral-950 to-transparent transition-opacity duration-300 ${
                atEnd ? 'opacity-0' : 'opacity-100'
              }`}
            />

            {/* Piste défilante */}
            <div
              ref={trackRef}
              tabIndex={0}
              className="flex gap-6 lg:gap-8 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {platforms.map((p) => (
                <div
                  key={p.name}
                  className="group snap-start shrink-0 w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(50%-1rem)]"
                >
                  <PlatformPreview url={p.url} domain={p.domain} name={p.name} />
                  <div className="mt-5 px-1">
                    <span className={`text-[11px] font-bold tracking-wider uppercase ${theme.eyebrow}`}>{p.tag}</span>
                    <h3 className="font-black text-lg text-neutral-900 dark:text-white mt-1.5 mb-1">{p.name}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">{p.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indication de défilement */}
          <p
            className={`flex items-center justify-center gap-1.5 text-center text-xs font-medium text-neutral-400 dark:text-neutral-500 mt-3 transition-opacity duration-300 ${
              atEnd ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <span className="sm:hidden">Faites glisser pour voir les autres plateformes</span>
            <span className="hidden sm:inline">Faites défiler ou utilisez les flèches pour voir les autres plateformes</span>
            <ChevronRight className="w-3.5 h-3.5 animate-pulse" />
          </p>
        </div>
      </motion.section>

      {/* ── 5. EXPÉRIENCES PROFESSIONNELLES ── */}
      <motion.section
        id="experiences"
        className="py-24 bg-neutral-50 dark:bg-neutral-900 scroll-mt-32"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-5`}>
              EXPÉRIENCES
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              Expériences professionnelles
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-2xl">
              De My Onoma à Eyone Medical : un parcours pluridisciplinaire à l'intersection du marketing, de la tech et de l'impact.
            </p>
          </div>

          <motion.div
            className="space-y-4"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {experiences.map((exp, idx) => {
              const open = openExperience === idx;
              return (
                <motion.div
                  key={exp.company}
                  variants={staggerItem}
                  className="bg-white dark:bg-neutral-950 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => setOpenExperience(open ? null : idx)}
                    aria-expanded={open}
                    aria-controls={`exp-panel-${idx}`}
                    className="w-full grid sm:grid-cols-[3.5rem_1fr_auto_auto] grid-cols-[3rem_1fr_auto] items-center gap-4 sm:gap-6 p-5 sm:p-6 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-morrys-50 dark:bg-morrys-900/30 flex items-center justify-center shrink-0">
                      <exp.icon className={`w-6 h-6 ${theme.accentText}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                        <h3 className="font-black text-lg sm:text-xl text-neutral-900 dark:text-white">{exp.company}</h3>
                        <span className={`text-[11px] font-bold tracking-wider uppercase ${theme.eyebrow}`}>{exp.location}</span>
                      </div>
                      <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 font-medium">{exp.role}</p>
                    </div>
                    <p className="hidden sm:block text-xs font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{exp.period}</p>
                    <ChevronDown
                      className={`w-5 h-5 text-neutral-400 dark:text-neutral-500 shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <div
                    id={`exp-panel-${idx}`}
                    className={`grid transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <div className="px-5 sm:px-6 pb-7 pt-1">
                        <div className="grid sm:grid-cols-[3.5rem_1fr] sm:gap-6">
                          <div className="hidden sm:block" />
                          <div>
                            <p className="sm:hidden text-xs font-bold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 mb-4">{exp.period}</p>
                            <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">{exp.intro}</p>
                            <div className="space-y-6">
                              {exp.blocks.map((block) => (
                                <div key={block.title}>
                                  <h4 className={`font-black text-sm uppercase tracking-wider ${theme.eyebrow} mb-3`}>{block.title}</h4>
                                  <ul className="space-y-2">
                                    {block.bullets.map((b, j) => (
                                      <li key={j} className="flex items-start gap-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                        <CheckCircle className="w-4 h-4 text-morrys-500 dark:text-morrys-400 shrink-0 mt-0.5" />
                                        <span>{b}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.section>

      {/* ── 6. STACK & OUTILS (rupture sombre) ── */}
      <motion.section
        className="py-16 bg-neutral-950 dark:bg-black"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-[0.95] mb-3">
            Stack &amp; outils du quotidien
          </h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-10">
            Les outils sur lesquels je m'appuie pour exécuter, automatiser et livrer.
          </p>
          <motion.div
            className="flex flex-wrap justify-center gap-3"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {tools.map((tool) => (
              <motion.span
                key={tool}
                variants={staggerItem}
                className="px-4 py-2 rounded-full bg-neutral-900 border border-neutral-800 text-sm font-semibold text-neutral-200 hover:border-morrys-500 hover:text-white hover:-translate-y-0.5 transition-all duration-200"
              >
                {tool}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── 7. VALEURS ── */}
      <motion.section
        className="py-24 bg-white dark:bg-neutral-950"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-6">
                Mes valeurs
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Les principes qui guident mon approche du marketing, de la tech et des partenariats en Afrique.
              </p>
            </div>
            <motion.div
              className="border-t border-neutral-200 dark:border-neutral-800"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={viewportOnce}
            >
              {values.map((v, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="flex items-start gap-5 py-7 border-b border-neutral-200 dark:border-neutral-800"
                >
                  <div className="w-10 h-10 rounded-full bg-morrys-50 dark:bg-morrys-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <v.icon className={`w-5 h-5 ${theme.accentText}`} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-neutral-900 dark:text-white mb-1">{v.title}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{v.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ── 8. PARCOURS (narrative + timeline fusionnés) ── */}
      <motion.section
        id="parcours"
        className="py-24 lg:py-32 bg-neutral-50 dark:bg-neutral-900 scroll-mt-32"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className={`text-xs font-bold tracking-[0.35em] uppercase ${theme.eyebrow} mb-4`}>
              MON HISTOIRE
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-6">
              Mon parcours
            </h2>
            <div className="space-y-5 text-base lg:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl">
              <p>
                Je ne suis pas le genre qui te dira qu'il a tel MBA ou tel Master en Marketing Digital (même si j'en ai un), car je me suis presqu'auto-formé… C'est un peu contradictoire mais c'est ça qui fait ma force : la passion authentique et l'apprentissage constant.
              </p>
              <p>
                Pour la petite histoire, je n'aurais jamais imaginé que j'allais faire du marketing… Comme tout enfant je voulais devenir pilote, puis ingénieur, ensuite banquier et au finish entrepreneur. Le marketing digital est arrivé par hasard en 2021, et c'est devenu ma passion !
              </p>
              <p>
                Aujourd'hui, je vis cette aventure depuis Dakar, à la croisée du marketing, de l'IA, du produit web et des partenariats à impact — fier de contribuer au développement digital de l'Afrique francophone.
              </p>
            </div>
          </div>

          {/* Timeline — rail unique, aligné mobile ET desktop */}
          <div className="relative">
            {/* Rail vertical */}
            <div
              className="absolute left-2 top-1.5 bottom-1.5 w-px bg-neutral-200 dark:bg-neutral-700"
              aria-hidden="true"
            />

            {/* Nœud de bascule en tête de frise */}
            <div className="relative pl-10 mb-8">
              <span
                className="absolute left-2 top-1.5 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-morrys-400 dark:border-morrys-500 bg-neutral-50 dark:bg-neutral-900 ring-4 ring-neutral-50 dark:ring-neutral-900"
                aria-hidden="true"
              />
              <button
                type="button"
                onClick={() => setShowAllMilestones((v) => !v)}
                aria-expanded={showAllMilestones}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800 hover:border-morrys-400 dark:hover:border-morrys-600 transition-all"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAllMilestones ? 'rotate-180' : ''}`} />
                {showAllMilestones ? 'Réduire le parcours' : 'Voir le début du parcours (2014 – 2021)'}
              </button>
            </div>

            {/* Étapes anciennes (2014-2021) — repliables */}
            <div
              className={`grid transition-all duration-500 ease-out ${
                showAllMilestones ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="space-y-8 mb-8">
                  {milestones.slice(0, 5).map((m) => (
                    <MilestoneRow key={m.title} m={m} />
                  ))}
                </div>
              </div>
            </div>

            {/* Étapes récentes (depuis 2023) — toujours visibles */}
            <div className="space-y-8">
              {milestones.slice(5).map((m) => (
                <MilestoneRow key={m.title} m={m} />
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── 9. CTA FINAL ── */}
      <motion.section
        className="py-24 bg-gradient-to-br from-morrys-600 to-morrys-800 text-white"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-morrys-200 mb-5">
            ON DISCUTE ?
          </p>
          <h2 className="text-4xl lg:text-5xl font-black mb-5 tracking-tight">Travaillons ensemble</h2>
          <p className="text-morrys-100 text-lg mb-10 leading-relaxed max-w-xl mx-auto">
            Marketing, automatisation IA, plateformes web ou partenariats — parlons-en.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-morrys-700 font-bold px-8 py-4 rounded-full hover:bg-morrys-50 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide">
              Prendre contact <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/formations" className="inline-flex items-center gap-2 text-white font-bold text-sm tracking-wide hover:text-morrys-100 hover:translate-x-0.5 transition-all duration-300">
              <BookOpen className="w-4 h-4" /> Ou découvre mes formations <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </motion.section>
    </div>
  );
}
