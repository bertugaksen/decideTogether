import { District } from './types.js';

export const DISTRICTS: District[] = [
  {
    id: 'adana-seyhan',
    name: 'Seyhan, Adana',
    city: 'Adana',
    center: { lat: 36.9914, lng: 35.3308 },
    sampleCuisines: ['Zırh Kebabı', 'Közde Ciğer', 'Şalgam & Sokak Lezzetleri'],
  },
  {
    id: 'kadikoy-moda',
    name: 'Kadıköy, Moda',
    city: 'İstanbul',
    center: { lat: 40.9856, lng: 29.027 },
    sampleCuisines: ['Pizza & Şarap', 'Sokak Lezzetleri', 'Burger & Bira'],
  },
  {
    id: 'besiktas-carsi',
    name: 'Beşiktaş, Çarşı',
    city: 'İstanbul',
    center: { lat: 41.0428, lng: 29.0077 },
    sampleCuisines: ['Sokak Lezzetleri', 'Meyhane & Balık', 'Döner & Kebap'],
  },
  {
    id: 'ankara-cankaya',
    name: 'Çankaya, Ankara',
    city: 'Ankara',
    center: { lat: 39.9, lng: 32.86 },
    sampleCuisines: ['Ankara Döneri', 'Dünya Mutfağı', 'Meze & Pub'],
  },
  {
    id: 'izmir-alsancak',
    name: 'Alsancak, İzmir',
    city: 'İzmir',
    center: { lat: 38.4382, lng: 27.1434 },
    sampleCuisines: ['Ege Mezeleri', 'Deniz Ürünleri', 'Boyoz & Sokak'],
  },
  {
    id: 'sisli-nisantasi',
    name: 'Şişli, Nişantaşı',
    city: 'İstanbul',
    center: { lat: 41.0526, lng: 28.9945 },
    sampleCuisines: ['Brunch & Kahve', 'Fine Dining', 'İtalyan Makarnası'],
  },
  {
    id: 'kadikoy-caddebostan',
    name: 'Kadıköy, Caddebostan',
    city: 'İstanbul',
    center: { lat: 40.9634, lng: 29.0617 },
    sampleCuisines: ['Dünya Mutfağı', 'Sushi & Asya', 'İtalyan'],
  },
];

export const MOCK_DISTRICTS = DISTRICTS;
export const PRESET_DISTRICTS = DISTRICTS;
