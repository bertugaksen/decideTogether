import { District } from './types.js';

export const DISTRICTS: District[] = [
  {
    id: 'adana-cukurova',
    name: 'Çukurova, Adana',
    city: 'Adana',
    center: { lat: 37.0425, lng: 35.2952 },
  },
  {
    id: 'adana-seyhan',
    name: 'Seyhan, Adana',
    city: 'Adana',
    center: { lat: 36.9914, lng: 35.3308 },
  },
  {
    id: 'kadikoy-moda',
    name: 'Kadıköy, Moda',
    city: 'İstanbul',
    center: { lat: 40.9856, lng: 29.027 },
  },
  {
    id: 'besiktas-carsi',
    name: 'Beşiktaş, Çarşı',
    city: 'İstanbul',
    center: { lat: 41.0428, lng: 29.0077 },
  },
  {
    id: 'ankara-cankaya',
    name: 'Çankaya, Ankara',
    city: 'Ankara',
    center: { lat: 39.9, lng: 32.86 },
  },
  {
    id: 'izmir-alsancak',
    name: 'Alsancak, İzmir',
    city: 'İzmir',
    center: { lat: 38.4382, lng: 27.1434 },
  },
  {
    id: 'sisli-nisantasi',
    name: 'Şişli, Nişantaşı',
    city: 'İstanbul',
    center: { lat: 41.0526, lng: 28.9945 },
  },
  {
    id: 'kadikoy-caddebostan',
    name: 'Kadıköy, Caddebostan',
    city: 'İstanbul',
    center: { lat: 40.9634, lng: 29.0617 },
  },
];

export const MOCK_DISTRICTS = DISTRICTS;
export const PRESET_DISTRICTS = DISTRICTS;
