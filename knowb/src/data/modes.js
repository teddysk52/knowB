// Mode definitions and what each mode shows/prioritizes
export const MODES = {
  wheelchair: {
    id: 'wheelchair',
    label: 'Wheelchair',
    icon: '♿',
    layers: ['toilets', 'elevators', 'transport', 'hospitals'],
    highlight: ['elevators', 'toilets'],
    description: 'Accessible routes, elevators & toilets',
  },
  senior: {
    id: 'senior',
    label: 'Senior',
    icon: '👴',
    layers: ['benches', 'pharmacies', 'hospitals', 'toilets', 'aed'],
    highlight: ['benches', 'pharmacies'],
    description: 'Rest points, pharmacies & medical',
  },
  parent: {
    id: 'parent',
    label: 'Parent',
    icon: '👨‍👩‍👧',
    layers: ['playgrounds', 'toilets', 'fountains', 'benches'],
    highlight: ['playgrounds', 'toilets'],
    description: 'Playgrounds, toilets & parks',
  },
  tourist: {
    id: 'tourist',
    label: 'Tourist',
    icon: '🧳',
    layers: ['landmarks', 'transport', 'toilets', 'fountains'],
    highlight: ['landmarks', 'transport'],
    description: 'Landmarks, metro & water fountains',
  },
  kidsafe: {
    id: 'kidsafe',
    label: 'Kid Safe',
    icon: '🧒',
    layers: ['playgrounds', 'hospitals', 'transport'],
    highlight: ['playgrounds'],
    description: 'Safe places & playgrounds',
  },
};

export const LAYER_CONFIG = {
  benches: { icon: '🪑', label: 'Bench', color: '#8B6914' },
  toilets: { icon: '🚻', label: 'Toilet', color: '#2563EB' },
  elevators: { icon: '🛗', label: 'Elevator', color: '#7C3AED' },
  aed: { icon: '❤️', label: 'AED', color: '#DC2626' },
  pharmacies: { icon: '💊', label: 'Pharmacy', color: '#059669' },
  transport: { icon: '🚋', label: 'Transport', color: '#EA580C' },
  fountains: { icon: '⛲', label: 'Fountain', color: '#0891B2' },
  hospitals: { icon: '🏥', label: 'Hospital', color: '#E11D48' },
  playgrounds: { icon: '🛝', label: 'Playground', color: '#16A34A' },
  landmarks: { icon: '🏛️', label: 'Landmark', color: '#CA8A04' },
};
