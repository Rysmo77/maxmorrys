import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, MessageCircle, ArrowRight, Loader2, HelpCircle } from 'lucide-react';
import AnimatedIcon from '../components/shared/AnimatedIcon';
import Button from '../components/ui/Button';
import { getAllFAQ } from '../lib/firestore';
import { useToast } from '../components/ui/Toast';
import type { FAQ } from '../types';
import SEOHead from '../components/seo/SEOHead';
import JsonLd from '../components/seo/JsonLd';
import { slideUp, staggerContainer, staggerItem } from '../lib/animations';

const viewportOnce = { once: true, amount: 0.2 } as const;

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [helpfulIds, setHelpfulIds] = useState<string[]>([]);
  const { addToast } = useToast();

  const load = () => {
    setLoading(true);
    setError(false);
    getAllFAQ().then((data) => { setFaqs(data); setLoading(false); }).catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { load(); }, []);

  const categories = ['Tous', ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)))];
  const filtered = faqs.filter((faq) => activeCategory === 'Tous' || faq.category === activeCategory);

  const toggle = (id: string) => {
    setOpenIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const markHelpful = (id: string, helpful: boolean) => {
    if (!helpfulIds.includes(id)) {
      setHelpfulIds((prev) => [...prev, id]);
      addToast('success', helpful ? 'Merci pour ton retour !' : 'Merci, je vais améliorer cette réponse.');
    }
  };

  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  } : null;

  return (
    <div>
      <SEOHead
        title="FAQ — Questions Fréquentes"
        description="Retrouve les réponses aux questions les plus fréquentes sur les formations, le coaching et les services de Max-Morrys."
      />
      {faqJsonLd && <JsonLd data={faqJsonLd} />}

      {/* ── HERO ── */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-20 bg-neutral-50 dark:bg-neutral-900">
        <motion.div
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem} className="flex items-center gap-3 mb-5">
            <AnimatedIcon
              icon={HelpCircle}
              animation="pulse"
              className="w-11 h-11 rounded-2xl bg-brand-100 dark:bg-brand-900/30 shrink-0"
              iconClassName="w-5 h-5 text-brand-600 dark:text-brand-400"
            />
            <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400">
              FAQ
            </p>
          </motion.div>
          <motion.h1 variants={staggerItem} className="text-6xl lg:text-7xl font-black tracking-tight text-neutral-900 dark:text-white leading-[0.95] mb-6">
            Questions<br />fréquentes
          </motion.h1>
          <motion.p variants={staggerItem} className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
            Trouvez rapidement des réponses à vos questions les plus courantes.
          </motion.p>
        </motion.div>
      </section>

      <div className="bg-white dark:bg-neutral-950 pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Filtres */}
          <motion.div
            className="flex flex-wrap justify-center gap-2 pt-12 pb-10"
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    : 'bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500'
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>

          {/* Accordéon */}
          {loading && (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
          )}
          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-neutral-500 mb-4">Impossible de charger la FAQ.</p>
              <button onClick={load} className="px-5 py-2.5 bg-brand-600 text-white rounded-full text-sm font-semibold hover:bg-brand-500 transition-colors">Reessayer</button>
            </div>
          )}
          <motion.div
            className="space-y-3"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {filtered.map((faq) => {
              const isOpen = openIds.includes(faq.id);
              const hasVoted = helpfulIds.includes(faq.id);
              return (
                <motion.div key={faq.id} variants={staggerItem} className="border border-neutral-200 dark:border-neutral-700 rounded-2xl overflow-hidden bg-neutral-50 dark:bg-neutral-900">
                  <button
                    onClick={() => toggle(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    id={`faq-btn-${faq.id}`}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors"
                  >
                    <span className="font-bold text-neutral-900 dark:text-white pr-4">{faq.question}</span>
                    {isOpen
                      ? <ChevronUp className="w-5 h-5 text-neutral-400 shrink-0" aria-hidden="true" />
                      : <ChevronDown className="w-5 h-5 text-neutral-400 shrink-0" aria-hidden="true" />
                    }
                  </button>
                  <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                      className="overflow-hidden"
                    >
                    <div id={`faq-answer-${faq.id}`} role="region" aria-labelledby={`faq-btn-${faq.id}`} className="px-5 pb-5 border-t border-neutral-200 dark:border-neutral-700 pt-4">
                      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-5">{faq.answer}</p>
                      {!hasVoted ? (
                        <div className="flex items-center gap-3 text-sm text-neutral-500">
                          <span>Cette réponse t'a-t-elle aidé ?</span>
                          <button
                            onClick={() => markHelpful(faq.id, true)}
                            className="p-1.5 rounded-full hover:bg-success-50 dark:hover:bg-success-900/20 text-neutral-400 hover:text-success-600 transition-colors"
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => markHelpful(faq.id, false)}
                            className="p-1.5 rounded-full hover:bg-error-50 dark:hover:bg-error-900/20 text-neutral-400 hover:text-error-600 transition-colors"
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-success-600 dark:text-success-400 font-semibold">Merci pour ton retour !</p>
                      )}
                    </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA contact */}
          <motion.div
            className="mt-16 text-center bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-10 border border-neutral-100 dark:border-neutral-800"
            variants={slideUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <MessageCircle className="w-10 h-10 text-brand-500 mx-auto mb-5" />
            <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white mb-3">
              Tu ne trouves pas ta réponse ?
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed">
              N'hésite pas à me contacter directement.
            </p>
            <Link to="/contact">
              <Button>Nous contacter</Button>
            </Link>
          </motion.div>

        </div>
      </div>

      {/* ── CTA croisé → Contact ── */}
      <motion.section
        className="py-16 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800"
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-brand-600 dark:text-brand-400 mb-4">
            ENCORE DES QUESTIONS ?
          </p>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-neutral-900 dark:text-white mb-4">
            Écrivez-moi directement
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-8 leading-relaxed max-w-md mx-auto">
            Je réponds personnellement à chaque message. N'hésitez pas à me contacter.
          </p>
          <Link to="/contact" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-full hover:bg-brand-700 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 text-sm tracking-wide">
            Me contacter <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </motion.section>
    </div>
  );
}
