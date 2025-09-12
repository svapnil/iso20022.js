export function getCurrencyPrecision(currency: string): number {
  switch (currency) {
    case 'BHD': // Bahraini Dinar
    case 'IQD': // Iraqi Dinar
    case 'JOD': // Jordanian Dinar
    case 'KWD': // Kuwaiti Dinar
    case 'LYD': // Libyan Dinar
    case 'OMR': // Omani Rial
    case 'TND': // Tunisian Dinar
      return 3;
    case 'CLF': // Unidad de Fomento (Chile)
      return 4;
    case 'BIF': // Burundian Franc
    case 'BYN': // Belarusian Ruble
    case 'CVE': // Cape Verdean Escudo
    case 'DJF': // Djiboutian Franc
    case 'GNF': // Guinean Franc
    case 'ISK': // Icelandic Krona
    case 'JPY': // Japanese Yen
    case 'KMF': // Comorian Franc
    case 'KRW': // South Korean Won
    case 'PYG': // Paraguayan Guarani
    case 'RWF': // Rwandan Franc
    case 'UGX': // Ugandan Shilling
    case 'UYI': // Uruguayan Peso (Indexed Units)
    case 'VND': // Vietnamese Dong
    case 'VUV': // Vanuatu Vatu
    case 'XAF': // Central African CFA Franc
    case 'XOF': // West African CFA Franc
    case 'XPF': // CFP Franc
      return 0;
    default:
      return 2; // Default to 2 decimal places for most currencies
  }
}