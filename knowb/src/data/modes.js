// Mode and layer configuration
// Icons are referenced by Lucide icon name strings — components resolve them

export const MODES = {
  wheelchair: {
    id: 'wheelchair',
    label: 'Wheelchair',
    lucideIcon: 'Accessibility',
    layers: ['toilets', 'elevators', 'transport', 'hospitals'],
    highlight: ['elevators', 'toilets'],
    description: 'Accessible routes, elevators & toilets',
  },
  senior: {
    id: 'senior',
    label: 'Senior',
    lucideIcon: 'Heart',
    layers: ['benches', 'pharmacies', 'hospitals', 'toilets', 'aed'],
    highlight: ['benches', 'pharmacies'],
    description: 'Rest points, pharmacies & medical',
  },
  tourist: {
    id: 'tourist',
    label: 'Tourist',
    lucideIcon: 'Map',
    layers: ['transport', 'toilets', 'fountains', 'pharmacies'],
    highlight: ['transport'],
    description: 'Metro, toilets & water fountains',
  },
  standard: {
    id: 'standard',
    label: 'Standard',
    lucideIcon: 'LayoutGrid',
    layers: ['benches', 'toilets', 'elevators', 'aed', 'pharmacies', 'transport', 'fountains', 'hospitals'],
    highlight: [],
    description: 'All infrastructure layers',
  },
};

export const LAYER_CONFIG = {
  benches:    { label: 'Bench',     color: '#8B6914', lucideIcon: 'Armchair' },
  toilets:    { label: 'Toilet',    color: '#2563EB', lucideIcon: 'Bath' },
  elevators:  { label: 'Elevator',  color: '#7C3AED', lucideIcon: 'ArrowUpDown' },
  aed:        { label: 'AED',       color: '#DC2626', lucideIcon: 'HeartPulse' },
  pharmacies: { label: 'Pharmacy',  color: '#059669', lucideIcon: 'Cross' },
  transport:  { label: 'Transport', color: '#EA580C', lucideIcon: 'TrainFront' },
  fountains:  { label: 'Fountain',  color: '#0891B2', lucideIcon: 'Droplets' },
  hospitals:  { label: 'Hospital',  color: '#E11D48', lucideIcon: 'Hospital' },
};
