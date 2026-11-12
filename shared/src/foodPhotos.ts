export type CuisineCategory =
  | 'burger_fast'
  | 'cafe_tatli'
  | 'pizza_italyan'
  | 'kebap_et'
  | 'geleneksel_ev'
  | 'dunya_diger';

export const CATEGORY_FOOD_PHOTOS: Record<CuisineCategory, string[]> = {
  burger_fast: [
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80', // Brioche cheeseburger
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80', // Double burger with fries
    'https://images.unsplash.com/photo-1521305916504-4a1121188589?auto=format&fit=crop&w=800&q=80', // Crispy chicken burger
    'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=800&q=80', // Loaded fries & burger
    'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80', // Gourmet cheeseburger
  ],
  cafe_tatli: [
    'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80', // Flaky golden pastries / börek
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80', // Fresh croissants & bakery
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80', // Steaming artisan cappuccino & latte
    'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=800&q=80', // Mediterranean breakfast spread
    'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', // Desserts & sweets
    'https://images.unsplash.com/photo-1509722747041-616f39b57569?auto=format&fit=crop&w=800&q=80', // Traditional baklava & tea
  ],
  pizza_italyan: [
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80', // Wood-fired Margherita pizza
    'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=80', // Authentic Neapolitan pizza
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80', // Italian pasta with parmesan & basil
    'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80', // Creamy fettuccine Alfredo
  ],
  kebap_et: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80', // Sizzling skewers on grill
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80', // Tender charred ribs & steak
    'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=800&q=80', // Közde köfte & roasted peppers
    'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80', // Mixed grill meat platter
  ],
  geleneksel_ev: [
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=800&q=80', // Stone oven Lahmacun & Pide
    'https://images.unsplash.com/photo-1541832676-9b763b0239ab?auto=format&fit=crop&w=800&q=80', // Traditional hearty Turkish stew
    'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80', // Hot soup & freshly sliced bread
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80', // Gourmet home-cooked table
  ],
  dunya_diger: [
    'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=800&q=80', // Fresh sushi roll platter
    'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80', // Fresh grilled fish / salmon
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80', // Asian wok noodle bowl
  ],
};

export function classifyCuisineText(category?: string, name?: string): CuisineCategory {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  const text = `${cat} ${n}`;

  if (
    text.includes('kebab') ||
    text.includes('kebap') ||
    text.includes('ciğer') ||
    text.includes('ciger') ||
    text.includes('döner') ||
    text.includes('doner') ||
    text.includes('ocakbaşı') ||
    text.includes('ocakbasi') ||
    text.includes('köfte') ||
    text.includes('kofte') ||
    text.includes('steak') ||
    text.includes('pirzola') ||
    text.includes('kaburga') ||
    text.includes('kasap') ||
    text.includes('et lokantası')
  ) {
    return 'kebap_et';
  }

  if (
    text.includes('burger') ||
    text.includes('fast food') ||
    text.includes('chicken') ||
    text.includes('tavuk') ||
    text.includes('sandviç') ||
    text.includes('sandvic') ||
    text.includes('büfe') ||
    text.includes('bufe') ||
    text.includes('tost') ||
    text.includes('mcdonald') ||
    text.includes('burger king') ||
    text.includes('kfc') ||
    text.includes('popeyes') ||
    text.includes('patates')
  ) {
    return 'burger_fast';
  }

  if (
    text.includes('pizza') ||
    text.includes('makarna') ||
    text.includes('pasta') ||
    text.includes('italy') ||
    text.includes('ital') ||
    text.includes('say cheese') ||
    text.includes('spaghetti') ||
    text.includes('lasagna')
  ) {
    return 'pizza_italyan';
  }

  if (
    text.includes('tatlı') ||
    text.includes('tatli') ||
    text.includes('pastane') ||
    text.includes('kahve') ||
    text.includes('coffee') ||
    text.includes('cafe') ||
    text.includes('kafe') ||
    text.includes('chocolate') ||
    text.includes('çikolata') ||
    text.includes('cikolata') ||
    text.includes('bakery') ||
    text.includes('fırın') ||
    text.includes('firin') ||
    text.includes('börek') ||
    text.includes('borek') ||
    text.includes('simit') ||
    text.includes('breakfast') ||
    text.includes('kahvaltı') ||
    text.includes('kahvalti') ||
    text.includes('brekkie') ||
    text.includes('nata') ||
    text.includes('baklava') ||
    text.includes('waffle') ||
    text.includes('dondurma')
  ) {
    return 'cafe_tatli';
  }

  if (
    text.includes('türk') ||
    text.includes('turk') ||
    text.includes('ev yemeği') ||
    text.includes('ev yemegi') ||
    text.includes('lokanta') ||
    text.includes('çorba') ||
    text.includes('corba') ||
    text.includes('pide') ||
    text.includes('lahmacun') ||
    text.includes('sofra') ||
    text.includes('sokak') ||
    text.includes('şırdan') ||
    text.includes('sirdan') ||
    text.includes('kokoreç') ||
    text.includes('kokorec') ||
    text.includes('tantuni') ||
    text.includes('mantı') ||
    text.includes('manti')
  ) {
    return 'geleneksel_ev';
  }

  return 'dunya_diger';
}

export function getSmartFoodPhoto(category?: string, name?: string, id?: string): string {
  const cuisine = classifyCuisineText(category, name);
  const pool = CATEGORY_FOOD_PHOTOS[cuisine] || CATEGORY_FOOD_PHOTOS.geleneksel_ev;
  const seed = `${id || ''}_${name || ''}_${category || ''}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % pool.length;
  return pool[index];
}
