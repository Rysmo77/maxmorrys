import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { GlassPanel, Icon, Num, Tag, TruthPanel } from '@ds';
import { cn } from '../../../../lib/utils';
import { markdownToHtml } from '../../../../lib/markdown';
import { useFormat } from '../../../../hooks/useFormat';
import { ClubEmptyState } from './_shared';
import { SHARE_PLATFORMS } from '../../hooks/useClubData';
import type { useClubData } from '../../hooks/useClubData';
import { staggerContainer, staggerItem } from '../../../../lib/animations';

type ClubData = ReturnType<typeof useClubData>;

interface ClubInfosProps {
  data: ClubData;
}

/**
 * LE SEUL DES HUIT ONGLETS QUE LE KIT NE DESSINE PAS.
 *
 * `club-huit-onglets.html` en maquette sept — Fil, Discussions, Agenda, Membres, Classement,
 * Opportunités, Parrainage — et s'arrête là. « Infos exclusives » n'a pas d'écran.
 *
 * Son écriture existe pourtant ailleurs, dans `ClubGaranti` : une étiquette de ton, un titre
 * en display, un corps en encre secondaire, sur du verre plat — puis un encart de vérité qui
 * sépare ce qui est promis de ce qui dépend des membres. C'est exactement la forme dont une
 * annonce, une ressource ou un article a besoin, et elle est REPRISE plutôt qu'inventée.
 *
 * L'encart de fin porte le fond de `ClubGaranti`, ramené à ce que cet onglet-ci peut tenir :
 * la publication est du ressort de l'auteur, la densité du fil ne l'est pas. Le kit l'écrit
 * pour la page de vente ; c'est encore plus vrai une fois payé.
 *
 * TROIS ÉTIQUETTES, UN SEUL TON. Le contrat de `Tag` est explicite : « une étiquette qui ne
 * dit qu'une catégorie n'a pas de ton — elle est `neutral` ». Annonce, ressource et article
 * sont trois catégories, pas trois états : elles ne peuvent pas emprunter `ok` et `warn` à
 * `ClubGaranti`, où ces deux tons disent « acquis » et « en attente ».
 */
export default function ClubInfos({ data }: ClubInfosProps) {
  const { t } = useTranslation('club');
  const { formatDate } = useFormat();
  const {
    user, clubInfos, copiedInfoId,
    infoShareMenuOpen, setInfoShareMenuOpen,
    handleLikeInfo, handleInfoShare,
  } = data;

  /** La date à laquelle ces enregistrements ont été lus — la provenance que <Num> exige. */
  const asOf = useRef(new Date()).current;

  if (clubInfos.length === 0) {
    return <ClubEmptyState icon="bell" title={t('infos.emptyTitle')} subtitle={t('infos.emptySubtitle')} />;
  }

  const typeLabel = (type: string) => (
    type === 'announcement' ? t('infos.typeAnnouncement')
      : type === 'resource' ? t('infos.typeResource')
        : t('infos.typeArticle')
  );

  return (
    <motion.div className="space-y-4" variants={staggerContainer} initial="hidden" animate="visible">
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {clubInfos.map((info) => {
          const likes = info.likes ?? [];
          const infoLiked = user ? likes.includes(user.uid) : false;
          return (
            <motion.div key={info.id} variants={staggerItem}>
              <GlassPanel level="flat" padding={20} className="relative h-full">
                <div className="flex items-start justify-between gap-3">
                  <Tag>{typeLabel(info.type)}</Tag>
                  <p className="flex-none text-small text-ink-2">{formatDate(info.publishedAt)}</p>
                </div>

                {/* La forme de `ClubGaranti` : display 19 px, puis le corps en encre secondaire. */}
                <h4 className="mt-3 font-display text-[19px] font-black leading-tight tracking-[-.03em] text-ink">
                  {info.title}
                </h4>

                <div
                  className="mt-2 text-meta leading-relaxed text-ink-2 [&_a]:font-semibold [&_a]:text-transforme [&_a]:underline [&_code]:rounded-s [&_code]:bg-[color:var(--fill-2)] [&_code]:px-1 [&_h1]:mt-3 [&_h1]:font-bold [&_h1]:text-ink [&_h2]:mt-3 [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-3 [&_h3]:font-bold [&_h3]:text-ink [&_img]:mt-3 [&_img]:rounded-m [&_li]:mt-1 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_strong]:text-ink [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5"
                  dangerouslySetInnerHTML={{ __html: markdownToHtml(info.content) }}
                />

                {info.link && (
                  <a
                    href={info.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-meta-2 font-semibold text-transforme hover:underline"
                  >
                    <Icon name="share" size={14} /> {t('infos.learnMore')}
                  </a>
                )}

                <div className="mt-4 flex items-center gap-1 border-t border-[color:var(--border-hair)] pt-3">
                  <button
                    type="button"
                    onClick={() => handleLikeInfo(info.id, !infoLiked)}
                    aria-pressed={infoLiked}
                    className={cn(
                      'mm-touch-extend inline-flex items-center gap-1.5 rounded-m px-2.5 py-1.5 text-meta-2 font-medium transition-colors duration-ui ease-ds',
                      infoLiked
                        ? 'bg-[color-mix(in_srgb,var(--mm-corail)_10%,transparent)] text-corail-txt'
                        : 'text-ink-2 hover:bg-[color:var(--fill-2)] hover:text-corail-txt',
                    )}
                  >
                    <Icon name="heart" size={15} />
                    {likes.length > 0 && <Num value={likes.length} source="db" asOf={asOf} />}
                    {t('infos.like')}
                  </button>

                  <div className="relative ml-auto">
                    <button
                      type="button"
                      onClick={() => setInfoShareMenuOpen(infoShareMenuOpen === info.id ? null : info.id)}
                      aria-expanded={infoShareMenuOpen === info.id}
                      className="mm-touch-extend inline-flex items-center gap-1.5 rounded-m px-2.5 py-1.5 text-meta-2 font-medium text-ink-2 transition-colors duration-ui ease-ds hover:bg-[color:var(--fill-2)] hover:text-transforme"
                    >
                      {copiedInfoId === info.id
                        ? <span className="text-ok"><Icon name="check" size={15} /></span>
                        : <Icon name="share" size={15} />}
                      {t('infos.share')}
                    </button>
                    {infoShareMenuOpen === info.id && (
                      <div className="glass-flat absolute bottom-full right-0 z-30 mb-1 w-44 max-w-[calc(100vw-1.5rem)] p-1.5">
                        {SHARE_PLATFORMS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleInfoShare(p.id, info)}
                            className="flex w-full items-center gap-2 rounded-s px-3 py-2 text-meta-2 text-ink-2 transition-colors duration-ui ease-ds hover:bg-[color:var(--fill-2)]"
                          >
                            <Icon name={p.icon} size={15} /> {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          );
        })}
      </div>

      {/* Repris de `ClubGaranti` : ce qui est tenu, et ce qui ne l'est pas encore. */}
      <TruthPanel
        provenTitle={t('infos.truth.provenTitle')}
        withheldTitle={t('infos.truth.withheldTitle')}
        proven={[t('infos.truth.proven1'), t('infos.truth.proven2')]}
        withheld={[t('infos.truth.withheld1')]}
      />
    </motion.div>
  );
}
