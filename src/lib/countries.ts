// https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
// Taken from https://www.npmjs.com/package/i18n-iso-countries

const Alpha2CountryCode = {
  AF: 'AF', // "Afghanistan",
  AL: 'AL', // "Albania",
  DZ: 'DZ', // "Algeria",
  AS: 'AS', // "American Samoa",
  AD: 'AD', // "Andorra",
  AO: 'AO', // "Angola",
  AI: 'AI', // "Anguilla",
  AQ: 'AQ', // "Antarctica",
  AG: 'AG', // "Antigua and Barbuda",
  AR: 'AR', // "Argentina",
  AM: 'AM', // "Armenia",
  AW: 'AW', // "Aruba",
  AU: 'AU', // "Australia",
  AT: 'AT', // "Austria",
  AZ: 'AZ', // "Azerbaijan",
  BS: 'BS', // "Bahamas",
  BH: 'BH', // "Bahrain",
  BD: 'BD', // "Bangladesh",
  BB: 'BB', // "Barbados",
  BY: 'BY', // "Belarus",
  BE: 'BE', // "Belgium",
  BZ: 'BZ', // "Belize",
  BJ: 'BJ', // "Benin",
  BM: 'BM', // "Bermuda",
  BT: 'BT', // "Bhutan",
  BO: 'BO', // "Bolivia",
  BA: 'BA', // "Bosnia and Herzegovina",
  BW: 'BW', // "Botswana",
  BV: 'BV', // "Bouvet Island",
  BR: 'BR', // "Brazil",
  IO: 'IO', // "British Indian Ocean Territory",
  BN: 'BN', // "Brunei Darussalam",
  BG: 'BG', // "Bulgaria",
  BF: 'BF', // "Burkina Faso",
  BI: 'BI', // "Burundi",
  KH: 'KH', // "Cambodia",
  CM: 'CM', // "Cameroon",
  CA: 'CA', // "Canada",
  CV: 'CV', // "Cape Verde",
  KY: 'KY', // "Cayman Islands",
  CF: 'CF', // "Central African Republic",
  TD: 'TD', // "Chad",
  CL: 'CL', // "Chile",
  CN: 'CN', // ["People's Republic of China", "China"],
  CX: 'CX', // "Christmas Island",
  CC: 'CC', // "Cocos (Keeling) Islands",
  CO: 'CO', // "Colombia",
  KM: 'KM', // "Comoros",
  CG: 'CG', // ["Republic of the Congo", "Congo"],
  CD: 'CD', // ["Democratic Republic of the Congo", "Congo"],
  CK: 'CK', // "Cook Islands",
  CR: 'CR', // "Costa Rica",
  CI: 'CI', // ["Cote d'Ivoire", "Côte d'Ivoire", "Ivory Coast"],
  HR: 'HR', // "Croatia",
  CU: 'CU', // "Cuba",
  CY: 'CY', // "Cyprus",
  CZ: 'CZ', // ["Czech Republic", "Czechia"],
  DK: 'DK', // "Denmark",
  DJ: 'DJ', // "Djibouti",
  DM: 'DM', // "Dominica",
  DO: 'DO', // "Dominican Republic",
  EC: 'EC', // "Ecuador",
  EG: 'EG', // "Egypt",
  SV: 'SV', // "El Salvador",
  GQ: 'GQ', // "Equatorial Guinea",
  ER: 'ER', // "Eritrea",
  EE: 'EE', // "Estonia",
  ET: 'ET', // "Ethiopia",
  FK: 'FK', // "Falkland Islands (Malvinas)",
  FO: 'FO', // "Faroe Islands",
  FJ: 'FJ', // "Fiji",
  FI: 'FI', // "Finland",
  FR: 'FR', // "France",
  GF: 'GF', // "French Guiana",
  PF: 'PF', // "French Polynesia",
  TF: 'TF', // "French Southern Territories",
  GA: 'GA', // "Gabon",
  GM: 'GM', // ["Republic of The Gambia", "The Gambia", "Gambia"],
  GE: 'GE', // "Georgia",
  DE: 'DE', // "Germany",
  GH: 'GH', // "Ghana",
  GI: 'GI', // "Gibraltar",
  GR: 'GR', // "Greece",
  GL: 'GL', // "Greenland",
  GD: 'GD', // "Grenada",
  GP: 'GP', // "Guadeloupe",
  GU: 'GU', // "Guam",
  GT: 'GT', // "Guatemala",
  GN: 'GN', // "Guinea",
  GW: 'GW', // "Guinea-Bissau",
  GY: 'GY', // "Guyana",
  HT: 'HT', // "Haiti",
  HM: 'HM', // "Heard Island and McDonald Islands",
  VA: 'VA', // "Holy See (Vatican City State)",
  HN: 'HN', // "Honduras",
  HK: 'HK', // "Hong Kong",
  HU: 'HU', // "Hungary",
  IS: 'IS', // "Iceland",
  IN: 'IN', // "India",
  ID: 'ID', // "Indonesia",
  IR: 'IR', // ["Islamic Republic of Iran", "Iran"],
  IQ: 'IQ', // "Iraq",
  IE: 'IE', // "Ireland",
  IL: 'IL', // "Israel",
  IT: 'IT', // "Italy",
  JM: 'JM', // "Jamaica",
  JP: 'JP', // "Japan",
  JO: 'JO', // "Jordan",
  KZ: 'KZ', // "Kazakhstan",
  KE: 'KE', // "Kenya",
  KI: 'KI', // "Kiribati",
  KP: 'KP', // "North Korea",
  KR: 'KR', // ["South Korea", "Korea, Republic of", "Republic of Korea"],
  KW: 'KW', // "Kuwait",
  KG: 'KG', // "Kyrgyzstan",
  LA: 'LA', // "Lao People's Democratic Republic",
  LV: 'LV', // "Latvia",
  LB: 'LB', // "Lebanon",
  LS: 'LS', // "Lesotho",
  LR: 'LR', // "Liberia",
  LY: 'LY', // "Libya",
  LI: 'LI', // "Liechtenstein",
  LT: 'LT', // "Lithuania",
  LU: 'LU', // "Luxembourg",
  MO: 'MO', // "Macao",
  MG: 'MG', // "Madagascar",
  MW: 'MW', // "Malawi",
  MY: 'MY', // "Malaysia",
  MV: 'MV', // "Maldives",
  ML: 'ML', // "Mali",
  MT: 'MT', // "Malta",
  MH: 'MH', // "Marshall Islands",
  MQ: 'MQ', // "Martinique",
  MR: 'MR', // "Mauritania",
  MU: 'MU', // "Mauritius",
  YT: 'YT', // "Mayotte",
  MX: 'MX', // "Mexico",
  FM: 'FM', // "Micronesia, Federated States of",
  MD: 'MD', // "Moldova, Republic of",
  MC: 'MC', // "Monaco",
  MN: 'MN', // "Mongolia",
  MS: 'MS', // "Montserrat",
  MA: 'MA', // "Morocco",
  MZ: 'MZ', // "Mozambique",
  MM: 'MM', // "Myanmar",
  NA: 'NA', // "Namibia",
  NR: 'NR', // "Nauru",
  NP: 'NP', // "Nepal",
  NL: 'NL', // ["Netherlands", "The Netherlands", "Netherlands (Kingdom of the)"],
  NC: 'NC', // "New Caledonia",
  NZ: 'NZ', // "New Zealand",
  NI: 'NI', // "Nicaragua",
  NE: 'NE', // "Niger",
  NG: 'NG', // "Nigeria",
  NU: 'NU', // "Niue",
  NF: 'NF', // "Norfolk Island",
  MK: 'MK', // ["The Republic of North Macedonia", "North Macedonia"],
  MP: 'MP', // "Northern Mariana Islands",
  NO: 'NO', // "Norway",
  OM: 'OM', // "Oman",
  PK: 'PK', // "Pakistan",
  PW: 'PW', // "Palau",
  PS: 'PS', // ["State of Palestine", "Palestine"],
  PA: 'PA', // "Panama",
  PG: 'PG', // "Papua New Guinea",
  PY: 'PY', // "Paraguay",
  PE: 'PE', // "Peru",
  PH: 'PH', // "Philippines",
  PN: 'PN', // ["Pitcairn", "Pitcairn Islands"],
  PL: 'PL', // "Poland",
  PT: 'PT', // "Portugal",
  PR: 'PR', // "Puerto Rico",
  QA: 'QA', // "Qatar",
  RE: 'RE', // "Reunion",
  RO: 'RO', // "Romania",
  RU: 'RU', // ["Russian Federation", "Russia"],
  RW: 'RW', // "Rwanda",
  SH: 'SH', // "Saint Helena",
  KN: 'KN', // "Saint Kitts and Nevis",
  LC: 'LC', // "Saint Lucia",
  PM: 'PM', // "Saint Pierre and Miquelon",
  VC: 'VC', // "Saint Vincent and the Grenadines",
  WS: 'WS', // "Samoa",
  SM: 'SM', // "San Marino",
  ST: 'ST', // "Sao Tome and Principe",
  SA: 'SA', // "Saudi Arabia",
  SN: 'SN', // "Senegal",
  SC: 'SC', // "Seychelles",
  SL: 'SL', // "Sierra Leone",
  SG: 'SG', // "Singapore",
  SK: 'SK', // "Slovakia",
  SI: 'SI', // "Slovenia",
  SB: 'SB', // "Solomon Islands",
  SO: 'SO', // "Somalia",
  ZA: 'ZA', // "South Africa",
  GS: 'GS', // "South Georgia and the South Sandwich Islands",
  ES: 'ES', // "Spain",
  LK: 'LK', // "Sri Lanka",
  SD: 'SD', // "Sudan",
  SR: 'SR', // "Suriname",
  SJ: 'SJ', // "Svalbard and Jan Mayen",
  SZ: 'SZ', // "Eswatini",
  SE: 'SE', // "Sweden",
  CH: 'CH', // "Switzerland",
  SY: 'SY', // "Syrian Arab Republic",
  TW: 'TW', // ["Taiwan, Province of China", "Taiwan"],
  TJ: 'TJ', // "Tajikistan",
  TZ: 'TZ', // ["United Republic of Tanzania", "Tanzania"],
  TH: 'TH', // "Thailand",
  TL: 'TL', // "Timor-Leste",
  TG: 'TG', // "Togo",
  TK: 'TK', // "Tokelau",
  TO: 'TO', // "Tonga",
  TT: 'TT', // "Trinidad and Tobago",
  TN: 'TN', // "Tunisia",
  TR: 'TR', // ["Trkiye","Turkey"],
  TM: 'TM', // "Turkmenistan",
  TC: 'TC', // "Turks and Caicos Islands",
  TV: 'TV', // "Tuvalu",
  UG: 'UG', // "Uganda",
  UA: 'UA', // "Ukraine",
  AE: 'AE', // ["United Arab Emirates", "UAE"],
  GB: 'GB', // ["United Kingdom", "UK", "Great Britain"],
  US: 'US', // ["United States of America", "United States", "USA", "U.S.A.", "US", "U.S."],
  UM: 'UM', // "United States Minor Outlying Islands",
  UY: 'UY', // "Uruguay",
  UZ: 'UZ', // "Uzbekistan",
  VU: 'VU', // "Vanuatu",
  VE: 'VE', // "Venezuela",
  VN: 'VN', // "Vietnam",
  VG: 'VG', // "Virgin Islands, British",
  VI: 'VI', // "Virgin Islands, U.S.",
  WF: 'WF', // "Wallis and Futuna",
  EH: 'EH', // "Western Sahara",
  YE: 'YE', // "Yemen",
  ZM: 'ZM', // "Zambia",
  ZW: 'ZW', // "Zimbabwe",
  AX: 'AX', // ["Åland Islands", "Aland Islands"],
  BQ: 'BQ', // "Bonaire, Sint Eustatius and Saba",
  CW: 'CW', // "Curaçao",
  GG: 'GG', // "Guernsey",
  IM: 'IM', // "Isle of Man",
  JE: 'JE', // "Jersey",
  ME: 'ME', // "Montenegro",
  BL: 'BL', // "Saint Barthélemy",
  MF: 'MF', // "Saint Martin (French part)",
  RS: 'RS', // "Serbia",
  SX: 'SX', // "Sint Maarten (Dutch part)",
  SS: 'SS', // "South Sudan",
  XK: 'XK', // "Kosovo"
} as const;

export type Alpha2Country =
  (typeof Alpha2CountryCode)[keyof typeof Alpha2CountryCode];
