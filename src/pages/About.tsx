import { Link } from 'react-router-dom';
import { ArrowRight, Target, Heart, Users, BookOpen, TrendingUp, Award, Lightbulb, Globe, Share2, BarChart3, CheckCircle } from 'lucide-react';

const values = [
  { icon: Heart, title: 'Passion Authentique', desc: "Une passion pour le marketing digital née d'une découverte qui a changé ma vie en 2021." },
  { icon: Globe, title: 'Vision Africaine', desc: 'Connaissance profonde des réalités et opportunités du marché africain francophone.' },
  { icon: Share2, title: 'Partage de Connaissances', desc: 'Transmission de mes méthodes via publications, blog, podcast et chaîne YouTube.' },
  { icon: Target, title: 'Résultats Concrets', desc: 'Focus sur les stratégies qui donnent des résultats mesurables et durables.' },
];

const expertise = [
  {
    title: 'Visibilité Digitale des Marques',
    desc: 'Spécialiste de la construction de présence numérique forte pour les entreprises africaines, de zéro aux sommets.',
    tags: ['Stratégie digitale', 'Branding', 'Positionnement', 'Audience locale'],
    stat: '+1790% de trafic web chez Eyone Medical',
    icon: TrendingUp,
  },
  {
    title: 'Growth Marketing Africain',
    desc: 'Expertise unique du marché africain francophone avec des stratégies qui parlent vraiment aux audiences locales.',
    tags: ['SEO avancé', 'Réseaux sociaux', 'Content marketing', 'Conversion'],
    stat: '+7000 abonnés organiques en 18 mois',
    icon: BarChart3,
  },
  {
    title: 'HealthTech & E-commerce',
    desc: 'Expérience approfondie dans la digitalisation des parcours de soins et le développement e-commerce en Afrique.',
    tags: ['WordPress', 'Chatbots WhatsApp', 'UX/UI', 'Parcours client'],
    stat: '+460% de visites globales',
    icon: Lightbulb,
  },
  {
    title: 'Personal Branding des Dirigeants',
    desc: 'Transformation des dirigeants en voix influentes de leur secteur grâce à des stratégies de personal branding ciblées.',
    tags: ['LinkedIn strategy', 'Content creation', 'Thought leadership', 'Influence'],
    stat: '+3800 abonnés LinkedIn',
    icon: Users,
  },
];

const milestones = [
  { year: '2014', lieu: 'Abidjan, Côte d\'Ivoire', title: 'Le Début de l\'Aventure', desc: 'Après mon Baccalauréat à Douala (Cameroun), je pars étudier à Abidjan (Côte d\'Ivoire). Des années marquantes qui m\'ont ouvert l\'esprit sur les opportunités en Afrique.' },
  { year: '2017', lieu: 'Abidjan, Côte d\'Ivoire', title: 'Diplôme en Économie', desc: 'J\'obtiens ma Licence en Économie après 3 années riches en rencontres et expériences inoubliables en terre ivoirienne.' },
  { year: '2018', lieu: 'Dakar, Sénégal', title: 'Bienvenue au Pays de la Téranga', desc: '"Salam Aleykoum, nanga def"... J\'arrive au Sénégal, ce merveilleux pays de la Téranga où je vis encore aujourd\'hui.' },
  { year: '2020', lieu: 'Dakar, Sénégal', title: 'Master en Gestion d\'Entreprises', desc: 'Pivot vers l\'entrepreneuriat avec un Master en Gestion et Développement d\'Entreprises. Les maths et moi, ça ne faisait pas bon ménage !' },
  { year: '2021', lieu: 'Dakar, Sénégal', title: 'L\'Année où Tout a Basculé', desc: 'Découverte du marketing digital grâce à une personne qui compte pour moi. Je "tombe fan" et dévore tous les tutos YouTube et formations Udemy.' },
  { year: '2022', lieu: 'Dakar, Sénégal', title: 'Le Feu de ma Passion', desc: 'Formation spécialisée en marketing digital et création de "My Onoma", ma première entreprise orientée marketing digital en tant que co-associé.' },
  { year: '2023', lieu: 'Dakar, Sénégal', title: 'Master en Digital Business', desc: 'Deuxième Master, cette fois en Digital Business. Premiers contrats freelance en conception web, community management et SEO.' },
  { year: '2024', lieu: 'Dakar, Sénégal', title: 'Responsable Marketing chez Eyone Medical', desc: 'Big achievement ! Je rejoins Eyone Medical, pionnier de la digitalisation des soins en Afrique. Résultats : +1790% de trafic web, +7000 abonnés organiques.' },
  { year: '2024', lieu: 'Dakar, Sénégal', title: 'Coach en Marketing Digital', desc: 'Co-création de l\'Académie Light avec une amie visionnaire. Je deviens formateur et partage ma passion pour le marketing digital.' },
  { year: '2025', lieu: 'Dakar, Sénégal', title: 'Ouverture au Monde', desc: 'Je sors de ma coquille et partage officiellement mon univers. Lancement de ma chaîne "Le Marketing en Pratique avec Max-Morrys".' },
  { year: '2025', lieu: 'Dakar, Sénégal', title: 'Mission Divine', desc: 'Je m\'engage pour gérer de manière bénévole le marketing digital d\'une organisation du nom de Messages de Vie Sénégal, qui organise des campagnes médicales et consultations foraines gratuites pour des populations démunies.' },
];

export default function About() {
  return (
    <div>

      {/* ── HERO ── */}
      <section className="pt-28 pb-24 lg:pt-36 lg:pb-32 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div>
              <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-6">
                BONJOUR !
              </p>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight text-neutral-900 dark:text-white mb-8">
                JE SUIS<br />MAX-<br />MORRYS.
              </h1>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                Formateur, consultant et créateur de contenu digital basé à Dakar, Sénégal. Ma mission : démocratiser l'accès aux compétences digitales en Afrique francophone.
              </p>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-10">
                Après des années d'expérience dans le marketing digital, le SEO et le growth hacking, j'ai décidé de partager mon savoir à travers des formations pratiques, des articles de fond et des podcasts inspirants.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/formations" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-full hover:bg-brand-700 transition-colors">
                  <BookOpen className="w-4 h-4" /> Je te forme
                </Link>
                <Link to="/contact" className="inline-flex items-center px-5 py-2.5 border-2 border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-200 text-sm font-semibold rounded-full hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                  Me contacter
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <img
                  src="https://firebasestorage.googleapis.com/v0/b/max-morrys.firebasestorage.app/o/A-propos%2FMax.png?alt=media&token=0cba9eba-cf9c-46d3-a43f-343d3bb2eea7"
                  alt="Max-Morrys"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="absolute -bottom-6 -right-4 lg:-right-8 bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-xl border border-neutral-100 dark:border-neutral-700">
                <p className="text-3xl font-black text-neutral-900 dark:text-white leading-none">6+ ans</p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">d'expérience digitale</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── MA MISSION ── */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-8">
            MA MISSION
          </p>
          <blockquote className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white leading-[1.15] italic mb-10">
            "Ma mission est simple : mettre le digital au service des ambitions des marques africaines. Basé à Dakar, je connais les réalités et les opportunités du marché africain, ce qui me permet de créer des stratégies qui parlent vraiment aux audiences locales… et qui donnent des résultats concrets."
          </blockquote>
          <div className="flex flex-col items-center gap-1">
            <p className="font-black text-lg text-neutral-900 dark:text-white">Max-Morrys</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-medium">Expert Marketing Digital — Dakar, Sénégal</p>
          </div>
        </div>
      </section>

      {/* ── MON AVENTURE CHEZ EYONE MEDICAL ── */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-5">
              ÉTUDE DE CAS
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              Mon Aventure chez<br />Eyone Medical
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 text-base max-w-xl">
              Entreprise sénégalaise pionnière dans la digitalisation des parcours de soins en Afrique
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden mb-12">
            <div className="text-center py-10 px-8 bg-white dark:bg-neutral-950">
              <p className="text-5xl lg:text-6xl font-black text-brand-600 dark:text-brand-400 tracking-tight">+1790%</p>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">Trafic mensuel</p>
              <p className="text-xs text-neutral-400 mt-1">De 34 à 643 visites</p>
            </div>
            <div className="text-center py-10 px-8 bg-white dark:bg-neutral-950">
              <p className="text-5xl lg:text-6xl font-black text-brand-600 dark:text-brand-400 tracking-tight">+7000</p>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">Abonnés organiques</p>
              <p className="text-xs text-neutral-400 mt-1">En 18 mois</p>
            </div>
            <div className="text-center py-10 px-8 bg-white dark:bg-neutral-950">
              <p className="text-5xl lg:text-6xl font-black text-brand-600 dark:text-brand-400 tracking-tight">+460%</p>
              <p className="font-bold text-neutral-900 dark:text-white mt-2">Visites globales</p>
              <p className="text-xs text-neutral-400 mt-1">SEO + Campagnes</p>
            </div>
          </div>

          {/* Réalisations */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-8 border border-neutral-100 dark:border-neutral-800">
              <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-5">
                <CheckCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="font-black text-lg text-neutral-900 dark:text-white mb-3">Site Web from Scratch</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Création complète du site WordPress avec optimisation SEO avancée et stratégie de contenu ciblée pour le marché africain.
              </p>
            </div>
            <div className="bg-white dark:bg-neutral-950 rounded-2xl p-8 border border-neutral-100 dark:border-neutral-800">
              <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-5">
                <CheckCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
              <h3 className="font-black text-lg text-neutral-900 dark:text-white mb-3">Stratégie Réseaux Sociaux</h3>
              <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                +3800 abonnés LinkedIn grâce à une stratégie éditoriale ciblée et du contenu qui résonne avec l'écosystème santé africain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MES DOMAINES D'EXPERTISE ── */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-5">
              EXPERTISE
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              Mes domaines d'expertise
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
              Spécialisé dans la croissance digitale des entreprises africaines avec des résultats mesurables.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {expertise.map((item, i) => (
              <div key={i} className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-8 border border-neutral-100 dark:border-neutral-800">
                <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mb-5">
                  <item.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <h3 className="font-black text-xl text-neutral-900 dark:text-white mb-3">{item.title}</h3>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">{item.desc}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-semibold rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-bold text-brand-600 dark:text-brand-400 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                  {item.stat}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MES VALEURS ── */}
      <section className="py-24 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-6">
                CE QUI ME GUIDE
              </p>
              <h2 className="text-5xl lg:text-6xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-6">
                Mes valeurs
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Les principes qui guident mon approche du marketing digital en Afrique.
              </p>
            </div>
            <div className="border-t border-neutral-200 dark:border-neutral-700">
              {values.map((v, i) => (
                <div key={i} className="flex items-start gap-5 py-7 border-b border-neutral-200 dark:border-neutral-700">
                  <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0 mt-0.5">
                    <v.icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-neutral-900 dark:text-white mb-1">{v.title}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── AU-DELÀ DU MARKETING ── */}
      <section className="py-24 bg-white dark:bg-neutral-950">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-8">
            MON HISTOIRE
          </p>
          <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-10">
            Au-delà du Marketing
          </h2>
          <div className="space-y-6 text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            <p>
              Je ne suis pas le genre qui te dira qu'il a tel MBA ou tel Master en Marketing Digital (même si j'en ai un), car je me suis presqu'auto-formé... C'est un peu contradictoire mais c'est ça qui fait ma force : la passion authentique et l'apprentissage constant.
            </p>
            <p>
              Pour la petite histoire, je n'aurais jamais imaginé que j'allais faire du marketing... Comme tout enfant je voulais devenir pilote, puis ingénieur, ensuite banquier et au finish entrepreneur. Le marketing digital est arrivé par hasard en 2021, et c'est devenu ma passion !
            </p>
            <p>
              Aujourd'hui, je vis cette aventure avec enthousiasme depuis Dakar, et je suis fier de contribuer au développement digital de l'Afrique francophone. Bienvenue dans mon univers !
            </p>
          </div>
        </div>
      </section>

      {/* ── MON PETIT BOUT DE CHEMIN ── */}
      <section className="py-24 lg:py-32 bg-neutral-50 dark:bg-neutral-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
              CHRONOLOGIE
            </p>
            <h2 className="text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-4">
              Mon petit bout de chemin
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400">
              De Douala à Dakar, en passant par Abidjan : le parcours qui m'a mené au marketing digital.
            </p>
          </div>
          <div className="relative">
            <div className="absolute left-[3.25rem] top-0 bottom-0 w-px bg-neutral-200 dark:bg-neutral-700 hidden sm:block" />
            <div className="space-y-2">
              {milestones.map((m, i) => (
                <div key={i} className="flex gap-6 sm:gap-10 items-start">
                  <div className="shrink-0 text-right w-20 hidden sm:block pt-5">
                    <span className="text-2xl font-black text-neutral-300 dark:text-neutral-700">{m.year}</span>
                  </div>
                  <div className="relative hidden sm:flex items-start pt-5">
                    <div className="w-3 h-3 rounded-full bg-brand-500 shrink-0 mt-1.5 relative z-10" />
                  </div>
                  <div className="flex-1 pb-10">
                    <div className="flex flex-wrap items-center gap-2 mb-1 pt-4">
                      <span className="text-xs font-bold text-brand-600 dark:text-brand-400 sm:hidden">{m.year} — </span>
                      <span className="text-xs font-bold tracking-wider uppercase text-brand-500 dark:text-brand-400">{m.lieu}</span>
                    </div>
                    <h3 className="text-lg font-black text-neutral-900 dark:text-white mb-1">{m.title}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 bg-white dark:bg-neutral-950 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200 dark:divide-neutral-700">
            <div className="text-center py-6 px-8">
              <Award className="w-6 h-6 text-accent-500 mx-auto mb-3" />
              <p className="text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white tracking-tight">5+</p>
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 dark:text-neutral-500 mt-2">Formations créées</p>
            </div>
            <div className="text-center py-6 px-8">
              <Users className="w-6 h-6 text-brand-500 mx-auto mb-3" />
              <p className="text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white tracking-tight">50+</p>
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 dark:text-neutral-500 mt-2">Étudiants formés</p>
            </div>
            <div className="text-center py-6 px-8">
              <TrendingUp className="w-6 h-6 text-success-500 mx-auto mb-3" />
              <p className="text-5xl lg:text-6xl font-black text-neutral-900 dark:text-white tracking-tight">1790%+</p>
              <p className="text-xs font-medium tracking-[0.15em] uppercase text-neutral-400 dark:text-neutral-500 mt-2">Croissance trafic</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA croisé vers formations ── */}
      <section className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
            DÉCOUVREZ AUSSI
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Prêt à te former avec moi ?
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Des formations pratiques pour maîtriser le marketing digital et générer des résultats concrets.
          </p>
          <Link to="/formations" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 transition-colors text-sm tracking-wide">
            Je te forme <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 bg-gradient-to-br from-brand-600 to-brand-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-5 tracking-tight">Travaillons ensemble</h2>
          <p className="text-brand-100 text-lg mb-10 leading-relaxed">
            Que tu aies besoin de formation, de conseil ou simplement d'échanger, je suis disponible.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-8 py-4 rounded-full hover:bg-brand-50 transition-colors text-sm tracking-wide">
            Prendre contact <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
