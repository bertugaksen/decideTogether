/**
 * Mapping of common ASCII-fied food, dining and district terms to proper Turkish orthography.
 */
const TURKISH_FOOD_TERM_CORRECTIONS: Record<string, string> = {
  // Sakatat & Sokak Lezzetleri
  sirdan: 'Şırdan',
  sirdanci: 'Şırdancı',
  sirdancisi: 'Şırdancısı',
  kokorec: 'Kokoreç',
  kokorecci: 'Kokoreççi',
  kokoreccisi: 'Kokoreççisi',
  iskembe: 'İşkembe',
  iskembeci: 'İşkembeci',
  iskembecisi: 'İşkembecisi',
  paca: 'Paça',
  pacaci: 'Paçacı',

  // Et & Kebap & Izgara
  ciger: 'Ciğer',
  cigerci: 'Ciğerci',
  cigercisi: 'Ciğercisi',
  kebapci: 'Kebapçı',
  kebapcisi: 'Kebapçısı',
  kofte: 'Köfte',
  kofteci: 'Köfteci',
  koftecisi: 'Köftecisi',
  durum: 'Dürüm',
  durumcu: 'Dürümcü',
  durumcusu: 'Dürümcüsü',
  doner: 'Döner',
  donerci: 'Dönerci',
  donercisi: 'Dönercisi',
  ocakbasi: 'Ocakbaşı',
  ocakbası: 'Ocakbaşı',

  // Hamur İşi & Fırın
  borek: 'Börek',
  borekci: 'Börekçi',
  borekcisi: 'Börekçisi',
  pideci: 'Pideci',
  pidecisi: 'Pidecisi',
  lahmacun: 'Lahmacun',
  lahmacuncu: 'Lahmacuncu',
  simitci: 'Simitçi',
  simitcisi: 'Simitçisi',
  pastane: 'Pastane',
  pastanesi: 'Pastanesi',
  firini: 'Fırını',
  firin: 'Fırın',

  // Balık & Deniz
  balik: 'Balık',
  balikci: 'Balıkçı',
  balikcisi: 'Balıkçısı',

  // Tatlı & Kahvaltı & İçecek
  tatlici: 'Tatlıcı',
  tatlicisi: 'Tatlıcısı',
  cikolata: 'Çikolata',
  cikolataci: 'Çikolatacı',
  kahvalti: 'Kahvaltı',
  kahvaltisi: 'Kahvaltısı',
  bufe: 'Büfe',
  bufesi: 'Büfesi',
  corba: 'Çorba',
  corbaci: 'Çorbacı',
  corbacisi: 'Çorbacısı',

  // Genel Mekan Kelimeleri
  sofra: 'Sofra',
  sofrasi: 'Sofrası',
  lokanta: 'Lokanta',
  lokantasi: 'Lokantası',
  salon: 'Salon',
  salonu: 'Salonu',
  meyhane: 'Meyhane',
  meyhanesi: 'Meyhanesi',
  carsi: 'Çarşı',
  carsisi: 'Çarşısı',
  buyuksaat: 'Büyüksaat',
  kazancilar: 'Kazancılar',
  durak: 'Durak',
  duragi: 'Durağı',
  kose: 'Köşe',
  kosem: 'Köşem',
  dunya: 'Dünya',
  dunyasi: 'Dünyası',
  diyar: 'Diyar',
  diyari: 'Diyarı',
  bahce: 'Bahçe',
  bahcesi: 'Bahçesi',
  konak: 'Konak',
  konagi: 'Konağı',
  tarihi: 'Tarihi',
  meshur: 'Meşhur',
  oz: 'Öz',
  hakiki: 'Hakiki',
  kardesler: 'Kardeşler',
  ogullari: 'Oğulları',
  usta: 'Usta',
  ustasi: 'Ustası',

  // İsimler & Ustalar
  riza: 'Rıza',
  mehmet: 'Mehmet',
  memet: 'Memet',
  hasan: 'Hasan',
  huseyin: 'Hüseyin',
  ali: 'Ali',
  mustafa: 'Mustafa',
  ahmet: 'Ahmet',
  kemal: 'Kemal',
  osman: 'Osman',
  ibrahim: 'İbrahim',
  ismail: 'İsmail',
  halil: 'Halil',
  mahmut: 'Mahmut',
  murat: 'Murat',
  bedo: 'Bedo',

  // Başlıca Semtler ve İller
  kadikoy: 'Kadıköy',
  besiktas: 'Beşiktaş',
  sisli: 'Şişli',
  cankaya: 'Çankaya',
  bakirkoy: 'Bakırköy',
  uskudar: 'Üsküdar',
  adana: 'Adana',
  istanbul: 'İstanbul',
  izmir: 'İzmir',
  ankara: 'Ankara',
};

// Conjunctions that should stay lowercase unless they are the first word
const LOWERCASE_WORDS = new Set(['ve', 'ile', 'veya', 'de', 'da']);

// Well-known special casing for brands (e.g. McDonald's, KFC)
const BRAND_PRESERVATION: Record<string, string> = {
  mcdonalds: "McDonald's",
  "mcdonald's": "McDonald's",
  kfc: 'KFC',
  hd: 'HD',
  avm: 'AVM',
};

function toAsciiLookupKey(str: string): string {
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/['’].*$/, '')
    .replace(/ı/g, 'i')
    .replace(/ç/g, 'c')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o');
}

/**
 * Normalizes a raw restaurant or venue name into proper Turkish orthography:
 * 1. Resolves all-caps shouting (e.g. "BİRBİÇER KEBAP" -> "Birbiçer Kebap")
 * 2. Respects Turkish locale lowercasing (I -> ı, İ -> i)
 * 3. Applies accurate Turkish culinary accents (e.g. "Sirdanci" -> "Şırdancı", "Borekci" -> "Börekçi")
 * 4. Preserves global brand names like McDonald's, KFC cleanly
 */
export function cleanTurkishVenueName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') return '';

  const trimmed = rawName.trim();
  if (trimmed.length === 0) return '';

  // Split into tokens preserving separators (whitespace, dashes, slashes, pipes)
  const tokens = trimmed.split(/(\s+|[-/|&])/);

  const formattedTokens = tokens.map((token, index) => {
    // If it's pure separator, leave as is
    if (/^(\s+|[-/|&])$/.test(token)) {
      return token;
    }

    const cleanToken = token.trim();
    if (cleanToken.length === 0) return token;

    // Check brand preservation table (e.g. McDonald's, KFC)
    const brandKey = cleanToken.toLowerCase();
    if (BRAND_PRESERVATION[brandKey]) {
      return BRAND_PRESERVATION[brandKey];
    }

    // Check dictionary of common Turkish culinary/district terms using ASCII lookup
    const lookupKey = toAsciiLookupKey(cleanToken);

    if (TURKISH_FOOD_TERM_CORRECTIONS[lookupKey]) {
      const corrected = TURKISH_FOOD_TERM_CORRECTIONS[lookupKey];
      // If original had an apostrophe suffix (e.g. Sirdanci'nin), preserve suffix
      const suffixMatch = cleanToken.match(/['’](.*)$/);
      if (suffixMatch) {
        return `${corrected}'${suffixMatch[1].toLocaleLowerCase('tr-TR')}`;
      }
      return corrected;
    }

    // Check lowercase conjunctions ("ve", "ile", "de")
    if (LOWERCASE_WORDS.has(cleanToken.toLocaleLowerCase('tr-TR')) && index > 0) {
      return cleanToken.toLocaleLowerCase('tr-TR');
    }

    // Turkish Title Case: First character uppercase, remaining characters lowercase in tr-TR
    const lower = cleanToken.toLocaleLowerCase('tr-TR');
    return lower.charAt(0).toLocaleUpperCase('tr-TR') + lower.slice(1);
  });

  return formattedTokens.join('');
}
