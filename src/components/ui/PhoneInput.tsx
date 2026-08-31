import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';

interface CountryCode {
  code: string;
  dial: string;
  flag: string;
  name: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { code: 'AF', dial: '93', flag: '🇦🇫', name: 'Afghanistan' },
  { code: 'ZA', dial: '27', flag: '🇿🇦', name: 'Afrique du Sud' },
  { code: 'AL', dial: '355', flag: '🇦🇱', name: 'Albanie' },
  { code: 'DZ', dial: '213', flag: '🇩🇿', name: 'Algérie' },
  { code: 'DE', dial: '49', flag: '🇩🇪', name: 'Allemagne' },
  { code: 'AD', dial: '376', flag: '🇦🇩', name: 'Andorre' },
  { code: 'AO', dial: '244', flag: '🇦🇴', name: 'Angola' },
  { code: 'AG', dial: '1268', flag: '🇦🇬', name: 'Antigua-et-Barbuda' },
  { code: 'SA', dial: '966', flag: '🇸🇦', name: 'Arabie saoudite' },
  { code: 'AR', dial: '54', flag: '🇦🇷', name: 'Argentine' },
  { code: 'AM', dial: '374', flag: '🇦🇲', name: 'Arménie' },
  { code: 'AU', dial: '61', flag: '🇦🇺', name: 'Australie' },
  { code: 'AT', dial: '43', flag: '🇦🇹', name: 'Autriche' },
  { code: 'AZ', dial: '994', flag: '🇦🇿', name: 'Azerbaïdjan' },
  { code: 'BS', dial: '1242', flag: '🇧🇸', name: 'Bahamas' },
  { code: 'BH', dial: '973', flag: '🇧🇭', name: 'Bahreïn' },
  { code: 'BD', dial: '880', flag: '🇧🇩', name: 'Bangladesh' },
  { code: 'BB', dial: '1246', flag: '🇧🇧', name: 'Barbade' },
  { code: 'BE', dial: '32', flag: '🇧🇪', name: 'Belgique' },
  { code: 'BZ', dial: '501', flag: '🇧🇿', name: 'Belize' },
  { code: 'BJ', dial: '229', flag: '🇧🇯', name: 'Bénin' },
  { code: 'BT', dial: '975', flag: '🇧🇹', name: 'Bhoutan' },
  { code: 'BY', dial: '375', flag: '🇧🇾', name: 'Biélorussie' },
  { code: 'BO', dial: '591', flag: '🇧🇴', name: 'Bolivie' },
  { code: 'BA', dial: '387', flag: '🇧🇦', name: 'Bosnie-Herzégovine' },
  { code: 'BW', dial: '267', flag: '🇧🇼', name: 'Botswana' },
  { code: 'BR', dial: '55', flag: '🇧🇷', name: 'Brésil' },
  { code: 'BN', dial: '673', flag: '🇧🇳', name: 'Brunei' },
  { code: 'BG', dial: '359', flag: '🇧🇬', name: 'Bulgarie' },
  { code: 'BF', dial: '226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'BI', dial: '257', flag: '🇧🇮', name: 'Burundi' },
  { code: 'KH', dial: '855', flag: '🇰🇭', name: 'Cambodge' },
  { code: 'CM', dial: '237', flag: '🇨🇲', name: 'Cameroun' },
  { code: 'CA', dial: '1', flag: '🇨🇦', name: 'Canada' },
  { code: 'CV', dial: '238', flag: '🇨🇻', name: 'Cap-Vert' },
  { code: 'CF', dial: '236', flag: '🇨🇫', name: 'Centrafrique' },
  { code: 'CL', dial: '56', flag: '🇨🇱', name: 'Chili' },
  { code: 'CN', dial: '86', flag: '🇨🇳', name: 'Chine' },
  { code: 'CY', dial: '357', flag: '🇨🇾', name: 'Chypre' },
  { code: 'CO', dial: '57', flag: '🇨🇴', name: 'Colombie' },
  { code: 'KM', dial: '269', flag: '🇰🇲', name: 'Comores' },
  { code: 'CG', dial: '242', flag: '🇨🇬', name: 'Congo' },
  { code: 'CD', dial: '243', flag: '🇨🇩', name: 'Congo (RDC)' },
  { code: 'KR', dial: '82', flag: '🇰🇷', name: 'Corée du Sud' },
  { code: 'KP', dial: '850', flag: '🇰🇵', name: 'Corée du Nord' },
  { code: 'CR', dial: '506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: 'CI', dial: '225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'HR', dial: '385', flag: '🇭🇷', name: 'Croatie' },
  { code: 'CU', dial: '53', flag: '🇨🇺', name: 'Cuba' },
  { code: 'DK', dial: '45', flag: '🇩🇰', name: 'Danemark' },
  { code: 'DJ', dial: '253', flag: '🇩🇯', name: 'Djibouti' },
  { code: 'DM', dial: '1767', flag: '🇩🇲', name: 'Dominique' },
  { code: 'EG', dial: '20', flag: '🇪🇬', name: 'Égypte' },
  { code: 'AE', dial: '971', flag: '🇦🇪', name: 'Émirats arabes unis' },
  { code: 'EC', dial: '593', flag: '🇪🇨', name: 'Équateur' },
  { code: 'ER', dial: '291', flag: '🇪🇷', name: 'Érythrée' },
  { code: 'ES', dial: '34', flag: '🇪🇸', name: 'Espagne' },
  { code: 'EE', dial: '372', flag: '🇪🇪', name: 'Estonie' },
  { code: 'SZ', dial: '268', flag: '🇸🇿', name: 'Eswatini' },
  { code: 'US', dial: '1', flag: '🇺🇸', name: 'États-Unis' },
  { code: 'ET', dial: '251', flag: '🇪🇹', name: 'Éthiopie' },
  { code: 'FJ', dial: '679', flag: '🇫🇯', name: 'Fidji' },
  { code: 'FI', dial: '358', flag: '🇫🇮', name: 'Finlande' },
  { code: 'FR', dial: '33', flag: '🇫🇷', name: 'France' },
  { code: 'GA', dial: '241', flag: '🇬🇦', name: 'Gabon' },
  { code: 'GM', dial: '220', flag: '🇬🇲', name: 'Gambie' },
  { code: 'GE', dial: '995', flag: '🇬🇪', name: 'Géorgie' },
  { code: 'GH', dial: '233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'GR', dial: '30', flag: '🇬🇷', name: 'Grèce' },
  { code: 'GD', dial: '1473', flag: '🇬🇩', name: 'Grenade' },
  { code: 'GT', dial: '502', flag: '🇬🇹', name: 'Guatemala' },
  { code: 'GN', dial: '224', flag: '🇬🇳', name: 'Guinée' },
  { code: 'GW', dial: '245', flag: '🇬🇼', name: 'Guinée-Bissau' },
  { code: 'GQ', dial: '240', flag: '🇬🇶', name: 'Guinée équatoriale' },
  { code: 'GY', dial: '592', flag: '🇬🇾', name: 'Guyana' },
  { code: 'HT', dial: '509', flag: '🇭🇹', name: 'Haïti' },
  { code: 'HN', dial: '504', flag: '🇭🇳', name: 'Honduras' },
  { code: 'HU', dial: '36', flag: '🇭🇺', name: 'Hongrie' },
  { code: 'IN', dial: '91', flag: '🇮🇳', name: 'Inde' },
  { code: 'ID', dial: '62', flag: '🇮🇩', name: 'Indonésie' },
  { code: 'IQ', dial: '964', flag: '🇮🇶', name: 'Irak' },
  { code: 'IR', dial: '98', flag: '🇮🇷', name: 'Iran' },
  { code: 'IE', dial: '353', flag: '🇮🇪', name: 'Irlande' },
  { code: 'IS', dial: '354', flag: '🇮🇸', name: 'Islande' },
  { code: 'IL', dial: '972', flag: '🇮🇱', name: 'Israël' },
  { code: 'IT', dial: '39', flag: '🇮🇹', name: 'Italie' },
  { code: 'JM', dial: '1876', flag: '🇯🇲', name: 'Jamaïque' },
  { code: 'JP', dial: '81', flag: '🇯🇵', name: 'Japon' },
  { code: 'JO', dial: '962', flag: '🇯🇴', name: 'Jordanie' },
  { code: 'KZ', dial: '7', flag: '🇰🇿', name: 'Kazakhstan' },
  { code: 'KE', dial: '254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'KG', dial: '996', flag: '🇰🇬', name: 'Kirghizistan' },
  { code: 'KI', dial: '686', flag: '🇰🇮', name: 'Kiribati' },
  { code: 'KW', dial: '965', flag: '🇰🇼', name: 'Koweït' },
  { code: 'LA', dial: '856', flag: '🇱🇦', name: 'Laos' },
  { code: 'LS', dial: '266', flag: '🇱🇸', name: 'Lesotho' },
  { code: 'LV', dial: '371', flag: '🇱🇻', name: 'Lettonie' },
  { code: 'LB', dial: '961', flag: '🇱🇧', name: 'Liban' },
  { code: 'LR', dial: '231', flag: '🇱🇷', name: 'Liberia' },
  { code: 'LY', dial: '218', flag: '🇱🇾', name: 'Libye' },
  { code: 'LI', dial: '423', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: 'LT', dial: '370', flag: '🇱🇹', name: 'Lituanie' },
  { code: 'LU', dial: '352', flag: '🇱🇺', name: 'Luxembourg' },
  { code: 'MK', dial: '389', flag: '🇲🇰', name: 'Macédoine du Nord' },
  { code: 'MG', dial: '261', flag: '🇲🇬', name: 'Madagascar' },
  { code: 'MY', dial: '60', flag: '🇲🇾', name: 'Malaisie' },
  { code: 'MW', dial: '265', flag: '🇲🇼', name: 'Malawi' },
  { code: 'MV', dial: '960', flag: '🇲🇻', name: 'Maldives' },
  { code: 'ML', dial: '223', flag: '🇲🇱', name: 'Mali' },
  { code: 'MT', dial: '356', flag: '🇲🇹', name: 'Malte' },
  { code: 'MA', dial: '212', flag: '🇲🇦', name: 'Maroc' },
  { code: 'MU', dial: '230', flag: '🇲🇺', name: 'Maurice' },
  { code: 'MR', dial: '222', flag: '🇲🇷', name: 'Mauritanie' },
  { code: 'MX', dial: '52', flag: '🇲🇽', name: 'Mexique' },
  { code: 'MD', dial: '373', flag: '🇲🇩', name: 'Moldavie' },
  { code: 'MC', dial: '377', flag: '🇲🇨', name: 'Monaco' },
  { code: 'MN', dial: '976', flag: '🇲🇳', name: 'Mongolie' },
  { code: 'ME', dial: '382', flag: '🇲🇪', name: 'Monténégro' },
  { code: 'MZ', dial: '258', flag: '🇲🇿', name: 'Mozambique' },
  { code: 'MM', dial: '95', flag: '🇲🇲', name: 'Myanmar' },
  { code: 'NA', dial: '264', flag: '🇳🇦', name: 'Namibie' },
  { code: 'NR', dial: '674', flag: '🇳🇷', name: 'Nauru' },
  { code: 'NP', dial: '977', flag: '🇳🇵', name: 'Népal' },
  { code: 'NI', dial: '505', flag: '🇳🇮', name: 'Nicaragua' },
  { code: 'NE', dial: '227', flag: '🇳🇪', name: 'Niger' },
  { code: 'NG', dial: '234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'NO', dial: '47', flag: '🇳🇴', name: 'Norvège' },
  { code: 'NZ', dial: '64', flag: '🇳🇿', name: 'Nouvelle-Zélande' },
  { code: 'OM', dial: '968', flag: '🇴🇲', name: 'Oman' },
  { code: 'UG', dial: '256', flag: '🇺🇬', name: 'Ouganda' },
  { code: 'UZ', dial: '998', flag: '🇺🇿', name: 'Ouzbékistan' },
  { code: 'PK', dial: '92', flag: '🇵🇰', name: 'Pakistan' },
  { code: 'PW', dial: '680', flag: '🇵🇼', name: 'Palaos' },
  { code: 'PS', dial: '970', flag: '🇵🇸', name: 'Palestine' },
  { code: 'PA', dial: '507', flag: '🇵🇦', name: 'Panama' },
  { code: 'PG', dial: '675', flag: '🇵🇬', name: 'Papouasie-Nouvelle-Guinée' },
  { code: 'PY', dial: '595', flag: '🇵🇾', name: 'Paraguay' },
  { code: 'NL', dial: '31', flag: '🇳🇱', name: 'Pays-Bas' },
  { code: 'PE', dial: '51', flag: '🇵🇪', name: 'Pérou' },
  { code: 'PH', dial: '63', flag: '🇵🇭', name: 'Philippines' },
  { code: 'PL', dial: '48', flag: '🇵🇱', name: 'Pologne' },
  { code: 'PT', dial: '351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'QA', dial: '974', flag: '🇶🇦', name: 'Qatar' },
  { code: 'DO', dial: '1809', flag: '🇩🇴', name: 'Rép. dominicaine' },
  { code: 'RO', dial: '40', flag: '🇷🇴', name: 'Roumanie' },
  { code: 'GB', dial: '44', flag: '🇬🇧', name: 'Royaume-Uni' },
  { code: 'RU', dial: '7', flag: '🇷🇺', name: 'Russie' },
  { code: 'RW', dial: '250', flag: '🇷🇼', name: 'Rwanda' },
  { code: 'KN', dial: '1869', flag: '🇰🇳', name: 'Saint-Kitts-et-Nevis' },
  { code: 'LC', dial: '1758', flag: '🇱🇨', name: 'Sainte-Lucie' },
  { code: 'VC', dial: '1784', flag: '🇻🇨', name: 'Saint-Vincent-et-les-Grenadines' },
  { code: 'SB', dial: '677', flag: '🇸🇧', name: 'Salomon' },
  { code: 'SV', dial: '503', flag: '🇸🇻', name: 'Salvador' },
  { code: 'WS', dial: '685', flag: '🇼🇸', name: 'Samoa' },
  { code: 'ST', dial: '239', flag: '🇸🇹', name: 'São Tomé-et-Príncipe' },
  { code: 'SN', dial: '221', flag: '🇸🇳', name: 'Sénégal' },
  { code: 'RS', dial: '381', flag: '🇷🇸', name: 'Serbie' },
  { code: 'SC', dial: '248', flag: '🇸🇨', name: 'Seychelles' },
  { code: 'SL', dial: '232', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: 'SG', dial: '65', flag: '🇸🇬', name: 'Singapour' },
  { code: 'SK', dial: '421', flag: '🇸🇰', name: 'Slovaquie' },
  { code: 'SI', dial: '386', flag: '🇸🇮', name: 'Slovénie' },
  { code: 'SO', dial: '252', flag: '🇸🇴', name: 'Somalie' },
  { code: 'SD', dial: '249', flag: '🇸🇩', name: 'Soudan' },
  { code: 'SS', dial: '211', flag: '🇸🇸', name: 'Soudan du Sud' },
  { code: 'LK', dial: '94', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: 'SE', dial: '46', flag: '🇸🇪', name: 'Suède' },
  { code: 'CH', dial: '41', flag: '🇨🇭', name: 'Suisse' },
  { code: 'SR', dial: '597', flag: '🇸🇷', name: 'Suriname' },
  { code: 'SY', dial: '963', flag: '🇸🇾', name: 'Syrie' },
  { code: 'TJ', dial: '992', flag: '🇹🇯', name: 'Tadjikistan' },
  { code: 'TZ', dial: '255', flag: '🇹🇿', name: 'Tanzanie' },
  { code: 'TD', dial: '235', flag: '🇹🇩', name: 'Tchad' },
  { code: 'CZ', dial: '420', flag: '🇨🇿', name: 'Tchéquie' },
  { code: 'TH', dial: '66', flag: '🇹🇭', name: 'Thaïlande' },
  { code: 'TL', dial: '670', flag: '🇹🇱', name: 'Timor oriental' },
  { code: 'TG', dial: '228', flag: '🇹🇬', name: 'Togo' },
  { code: 'TO', dial: '676', flag: '🇹🇴', name: 'Tonga' },
  { code: 'TT', dial: '1868', flag: '🇹🇹', name: 'Trinité-et-Tobago' },
  { code: 'TN', dial: '216', flag: '🇹🇳', name: 'Tunisie' },
  { code: 'TM', dial: '993', flag: '🇹🇲', name: 'Turkménistan' },
  { code: 'TR', dial: '90', flag: '🇹🇷', name: 'Turquie' },
  { code: 'TV', dial: '688', flag: '🇹🇻', name: 'Tuvalu' },
  { code: 'UA', dial: '380', flag: '🇺🇦', name: 'Ukraine' },
  { code: 'UY', dial: '598', flag: '🇺🇾', name: 'Uruguay' },
  { code: 'VU', dial: '678', flag: '🇻🇺', name: 'Vanuatu' },
  { code: 'VE', dial: '58', flag: '🇻🇪', name: 'Venezuela' },
  { code: 'VN', dial: '84', flag: '🇻🇳', name: 'Viêt Nam' },
  { code: 'YE', dial: '967', flag: '🇾🇪', name: 'Yémen' },
  { code: 'ZM', dial: '260', flag: '🇿🇲', name: 'Zambie' },
  { code: 'ZW', dial: '263', flag: '🇿🇼', name: 'Zimbabwe' },
];

// Sort by longest dial code first so +1868 matches before +1
const SORTED_BY_DIAL_LENGTH = [...COUNTRY_CODES].sort((a, b) => b.dial.length - a.dial.length);

const DEFAULT_DIAL = '221'; // Senegal

function parsePhone(value: string): { dial: string; number: string } {
  if (!value) return { dial: DEFAULT_DIAL, number: '' };

  // Strip spaces, dashes, dots
  const cleaned = value.replace(/[\s\-().]/g, '');

  // If starts with +, try to match a dial code
  if (cleaned.startsWith('+')) {
    const digits = cleaned.slice(1);
    for (const c of SORTED_BY_DIAL_LENGTH) {
      if (digits.startsWith(c.dial)) {
        return { dial: c.dial, number: digits.slice(c.dial.length) };
      }
    }
    // No match — use first digits as dial, rest as number
    return { dial: DEFAULT_DIAL, number: digits };
  }

  // No + prefix — treat as local number
  return { dial: DEFAULT_DIAL, number: cleaned };
}

function formatValue(dial: string, number: string): string {
  const clean = number.replace(/\D/g, '');
  if (!clean) return '';
  return `+${dial}${clean}`;
}

interface PhoneInputProps {
  /**
   * `id` du champ NUMÉRO — celui qu'un `<label htmlFor>` extérieur doit cibler.
   *
   * Ce composant rend DEUX contrôles : l'indicatif et le numéro. Un libellé posé à côté
   * n'en désignait aucun, donc ni l'un ni l'autre n'avait de nom accessible. C'est le numéro
   * qui porte le libellé de l'ensemble — c'est lui qu'on vient remplir ; l'indicatif se
   * nomme lui-même, ci-dessous.
   */
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PhoneInput({ id, value, onChange, placeholder = '77 123 45 67', className = '' }: PhoneInputProps) {
  const { t } = useTranslation('ui');
  const parsed = useMemo(() => parsePhone(value), [value]);
  const [dial, setDial] = useState(parsed.dial);
  const [number, setNumber] = useState(parsed.number);

  // Sync from external value changes (e.g., form reset or initial load)
  useEffect(() => {
    const p = parsePhone(value);
    setDial(p.dial);
    setNumber(p.number);
  }, [value]);

  const handleDialChange = (newDial: string) => {
    setDial(newDial);
    onChange(formatValue(newDial, number));
  };

  const handleNumberChange = (newNumber: string) => {
    // Allow only digits and spaces
    const filtered = newNumber.replace(/[^\d\s]/g, '');
    setNumber(filtered);
    onChange(formatValue(dial, filtered));
  };

  return (
    <div className={`flex gap-0 ${className}`}>
      {/* L'indicatif porte son propre nom : un `<select>` de 120 px rempli de drapeaux est
          annoncé « liste » et rien d'autre sans lui. */}
      <select
        aria-label={t('phoneInput.countryLabel')}
        value={dial}
        onChange={(e) => handleDialChange(e.target.value)}
        className="flex-shrink-0 w-[120px] px-2 py-2.5 rounded-l-xl border border-r-0 border-[color:var(--line)] bg-[color:var(--fill-2)] text-ink text-sm focus:outline-none focus:ring-2 focus:border-forme transition-colors appearance-none cursor-pointer"
        style={{ backgroundImage: 'none' }}
      >
        {COUNTRY_CODES.map((c) => (
          <option key={`${c.code}-${c.dial}`} value={c.dial}>
            {c.flag} +{c.dial}
          </option>
        ))}
      </select>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={number}
        onChange={(e) => handleNumberChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 px-4 py-2.5 rounded-r-xl border border-[color:var(--line)] bg-[color:var(--fill-1)] dark:bg-[color:var(--night-3)] text-ink text-sm focus:outline-none focus:ring-2 focus:border-forme transition-colors"
      />
    </div>
  );
}
