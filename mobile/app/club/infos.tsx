import { Body, CheckLine, Display, Eyebrow, Surface, Tag } from '../../ds';
import { ClubScreen } from './_layout';

/**
 * ── 9 · INFOS ─────────────────────────────────────────────────────────────────────────
 *
 * LE HUITIÈME ONGLET PORTE CE QUI A ÉTÉ PROMIS AVANT LE PAIEMENT. C'est le seul écran du
 * Club qui n'a aucune donnée à charger — et c'est exactement ce qui le rend obligatoire.
 *
 * Le Club est du payant fermé : il ne se visite pas, et c'est la contrepartie de le garder
 * fermé. La conséquence est mécanique — ce qui est dit AVANT de payer doit se retrouver, mot
 * pour mot, au premier écran APRÈS. Les deux pages publiques du kit disent trois choses ;
 * elles sont reprises ici, sans être adoucies :
 *
 *   • ce qui est garanti, parce que ça ne dépend que d'une personne ;
 *   • ce qui ne l'est pas, parce que ça dépend des membres ;
 *   • ce qui se passe à l'échéance.
 *
 * ET LA TROISIÈME FOIS QUE LE KIT REFUSE UN NOMBRE DE MEMBRES. « Je ne t'annonce pas un
 * nombre de membres, parce qu'il serait faux — et parce que tu le vérifierais au premier
 * écran après avoir payé. » Cet écran EST ce premier écran. Il n'en annonce donc aucun, et
 * il dit pourquoi plutôt que de laisser le silence passer pour un oubli.
 * ─────────────────────────────────────────────────────────────────────────────────────
 */
export default function ClubInfos() {
  return (
    <ClubScreen titre="Infos">
      <Surface level="flat" style={{ padding: 20 }}>
        <Tag tone="ok">Garanti</Tag>
        <Display size="xs" style={{ marginTop: 11, lineHeight: 25 }}>Ce qui ne dépend que de moi</Display>
        <CheckLine tone="ok">Une session annoncée a lieu, même à quatre</CheckLine>
        <CheckLine tone="ok">L'agenda est publié un mois à l'avance</CheckLine>
        <CheckLine tone="ok">Les opportunités que je trouve, je les poste</CheckLine>
        <CheckLine tone="ok">Le prix ne bouge pas pendant ton année</CheckLine>
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, padding: 20 }}>
        <Tag tone="warn">En construction</Tag>
        <Display size="xs" style={{ marginTop: 11, lineHeight: 25 }}>Ce qui dépend des membres</Display>
        <Body muted style={{ marginTop: 8 }}>
          La densité du fil. La qualité de l'entraide. Le nombre de missions que les autres
          partagent. Ça, je ne peux pas te le promettre — ça se construit, et tu en fais
          partie.
        </Body>
      </Surface>

      <Surface level="flat" style={{ marginTop: 16, padding: 20 }}>
        <Eyebrow>Ce qui se passe à l'échéance</Eyebrow>
        <Body muted style={{ marginTop: 8 }}>
          À l'échéance, ton accès s'arrête. Tu réabonnes si tu veux. Rien n'est prélevé
          automatiquement : Wave et Orange Money ne permettent pas le prélèvement récurrent,
          et je préfère te le dire que te faire croire le contraire.
        </Body>
        <Body muted style={{ marginTop: 8 }}>
          Le rappel avant l'échéance est un réglage de ton compte, pas un service que cet
          écran active. Tu retrouves ton échéance en tête du fil et des opportunités toute
          l'année, pas seulement le dernier jour.
        </Body>
      </Surface>

      <Surface level="flat" style={{ marginTop: 16, padding: 20 }}>
        <Display size="xs" style={{ lineHeight: 25 }}>Le Club, si…</Display>
        <CheckLine tone="ok">Tu vends déjà quelque chose</CheckLine>
        <CheckLine tone="ok">Tu travailles seul, et c'est ça le plus dur</CheckLine>
        <CheckLine tone="ok">Tu cherches des missions, pas des cours</CheckLine>
      </Surface>

      <Surface level="flat" style={{ marginTop: 12, padding: 20 }}>
        <Display size="xs" style={{ lineHeight: 25 }}>Autre chose, si…</Display>
        {/* Un tiret, jamais une croix : on n'écarte pas quelqu'un, on l'oriente. */}
        <CheckLine tone="neutre" dash>Tu pars de zéro — je te forme</CheckLine>
        <CheckLine tone="neutre" dash>Tu veux qu'on le fasse — je te digitalise</CheckLine>
        <CheckLine tone="neutre" dash>Tu veux juste lire — je t'informe, gratuit</CheckLine>
      </Surface>

      {/* ENGAGEMENT 6 — l'interdit, écrit sur l'écran d'après paiement. */}
      <Surface level="truth" style={{ marginTop: 18, padding: 18 }}>
        <Eyebrow>Ce que tu ne liras nulle part ici</Eyebrow>
        <Body muted style={{ marginTop: 6, fontSize: 12.5 }}>
          Un nombre de membres. Le Club a ouvert cette année, et je ne t'en annonce pas un :
          il serait faux, et tu le vérifierais au premier écran après avoir payé. Cet écran
          est ce premier écran.
        </Body>
        <Body muted style={{ marginTop: 8, fontSize: 12.5 }}>
          Ni sur le fil, ni sur l'agenda, ni dans ta vague de classement. Le rang te situe
          sans qu'un total de membres soit nécessaire.
        </Body>
      </Surface>
    </ClubScreen>
  );
}
