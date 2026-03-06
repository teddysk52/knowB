// Mock infrastructure data for Prague
// Structured for easy replacement with Golemio / Prague Open Data APIs

export const benches = [
  { id: 'b1', lat: 50.0875, lng: 14.4213, name: 'Staromestske nam.' },
  { id: 'b2', lat: 50.0812, lng: 14.4283, name: 'Karlovo namesti' },
  { id: 'b3', lat: 50.0765, lng: 14.4145, name: 'Petrin' },
  { id: 'b4', lat: 50.0903, lng: 14.4001, name: 'Letna' },
  { id: 'b5', lat: 50.0788, lng: 14.4189, name: 'Malostranske nam.' },
  { id: 'b6', lat: 50.0841, lng: 14.4518, name: 'Riegrovy sady' },
  { id: 'b7', lat: 50.0922, lng: 14.4455, name: 'Vitkov' },
  { id: 'b8', lat: 50.0678, lng: 14.4301, name: 'Vysehrad' },
  { id: 'b9', lat: 50.0855, lng: 14.4110, name: 'Klarov' },
  { id: 'b10', lat: 50.0750, lng: 14.4380, name: 'Botic' },
  { id: 'b11', lat: 50.0830, lng: 14.4180, name: 'Ujezd' },
  { id: 'b12', lat: 50.0890, lng: 14.4320, name: 'Namesti Republiky' },
];

export const toilets = [
  { id: 't1', lat: 50.0870, lng: 14.4200, accessible: true, name: 'Stare Mesto' },
  { id: 't2', lat: 50.0820, lng: 14.4270, accessible: true, name: 'Karlovo nam.' },
  { id: 't3', lat: 50.0792, lng: 14.4175, accessible: true, name: 'Mala Strana' },
  { id: 't4', lat: 50.0905, lng: 14.4350, accessible: false, name: 'Florenc' },
  { id: 't5', lat: 50.0733, lng: 14.4188, accessible: true, name: 'Smichov' },
  { id: 't6', lat: 50.0850, lng: 14.4490, accessible: true, name: 'Zizkov' },
  { id: 't7', lat: 50.0801, lng: 14.4320, accessible: false, name: 'Nove Mesto' },
  { id: 't8', lat: 50.0690, lng: 14.4280, accessible: true, name: 'Vysehrad' },
];

export const elevators = [
  { id: 'e1', lat: 50.0862, lng: 14.4316, name: 'Mustek (metro)' },
  { id: 'e2', lat: 50.0835, lng: 14.4270, name: 'Narodni trida (metro)' },
  { id: 'e3', lat: 50.0905, lng: 14.4345, name: 'Florenc (metro)' },
  { id: 'e4', lat: 50.0755, lng: 14.4175, name: 'Andel (metro)' },
  { id: 'e5', lat: 50.0790, lng: 14.4295, name: 'I.P. Pavlova (metro)' },
  { id: 'e6', lat: 50.0845, lng: 14.4520, name: 'Jiriho z Podebrad (metro)' },
];

export const aed = [
  { id: 'a1', lat: 50.0878, lng: 14.4205, name: 'Staromestska radnice' },
  { id: 'a2', lat: 50.0830, lng: 14.4290, name: 'Palackeho nam.' },
  { id: 'a3', lat: 50.0860, lng: 14.4315, name: 'Mustek' },
  { id: 'a4', lat: 50.0910, lng: 14.4350, name: 'Florenc' },
  { id: 'a5', lat: 50.0750, lng: 14.4180, name: 'Andel' },
];

export const pharmacies = [
  { id: 'p1', lat: 50.0868, lng: 14.4250, name: 'Dlouha' },
  { id: 'p2', lat: 50.0815, lng: 14.4300, name: 'Karlovo nam.' },
  { id: 'p3', lat: 50.0840, lng: 14.4410, name: 'Vinohrady' },
  { id: 'p4', lat: 50.0760, lng: 14.4160, name: 'Smichov' },
  { id: 'p5', lat: 50.0900, lng: 14.4120, name: 'Holesovice' },
  { id: 'p6', lat: 50.0695, lng: 14.4310, name: 'Podoli' },
];

export const transport = [
  { id: 'tr1', lat: 50.0865, lng: 14.4310, name: 'Mustek (A+B)', type: 'metro' },
  { id: 'tr2', lat: 50.0838, lng: 14.4265, name: 'Narodni trida (B)', type: 'metro' },
  { id: 'tr3', lat: 50.0908, lng: 14.4342, name: 'Florenc (B+C)', type: 'metro' },
  { id: 'tr4', lat: 50.0758, lng: 14.4170, name: 'Andel (B)', type: 'metro' },
  { id: 'tr5', lat: 50.0793, lng: 14.4290, name: 'I.P. Pavlova (C)', type: 'metro' },
  { id: 'tr6', lat: 50.0848, lng: 14.4515, name: 'Jiriho z Podebrad (A)', type: 'metro' },
  { id: 'tr7', lat: 50.0870, lng: 14.4188, name: 'Staromestska (tram)', type: 'tram' },
  { id: 'tr8', lat: 50.0813, lng: 14.4243, name: 'Narodni divadlo (tram)', type: 'tram' },
  { id: 'tr9', lat: 50.0885, lng: 14.4005, name: 'Letenske nam. (tram)', type: 'tram' },
  { id: 'tr10', lat: 50.0740, lng: 14.4200, name: 'Ujezd (tram)', type: 'tram' },
];

export const fountains = [
  { id: 'f1', lat: 50.0873, lng: 14.4218, name: 'Staromestske nam.' },
  { id: 'f2', lat: 50.0810, lng: 14.4255, name: 'Narodni trida' },
  { id: 'f3', lat: 50.0785, lng: 14.4185, name: 'Kampa' },
  { id: 'f4', lat: 50.0850, lng: 14.4505, name: 'Riegrovy sady' },
  { id: 'f5', lat: 50.0680, lng: 14.4290, name: 'Vysehrad' },
];

export const hospitals = [
  { id: 'h1', lat: 50.0755, lng: 14.4280, name: 'Na Frantisku' },
  { id: 'h2', lat: 50.0690, lng: 14.4400, name: 'VFN Vinohrady' },
  { id: 'h3', lat: 50.0715, lng: 14.4260, name: 'Na Karlove' },
  { id: 'h4', lat: 50.0825, lng: 14.4448, name: 'FNKV' },
];

// Heatmap zones — simulated accessibility grid
export const heatmapZones = [
  { id: 'z1', lat: 50.0866, lng: 14.4211, radius: 300, score: 92 },
  { id: 'z2', lat: 50.0835, lng: 14.4270, radius: 280, score: 85 },
  { id: 'z3', lat: 50.0790, lng: 14.4190, radius: 260, score: 78 },
  { id: 'z4', lat: 50.0905, lng: 14.4345, radius: 300, score: 88 },
  { id: 'z5', lat: 50.0750, lng: 14.4380, radius: 250, score: 45 },
  { id: 'z6', lat: 50.0920, lng: 14.4450, radius: 270, score: 35 },
  { id: 'z7', lat: 50.0680, lng: 14.4300, radius: 240, score: 52 },
  { id: 'z8', lat: 50.0850, lng: 14.4500, radius: 260, score: 62 },
  { id: 'z9', lat: 50.0900, lng: 14.4010, radius: 280, score: 70 },
  { id: 'z10', lat: 50.0770, lng: 14.4150, radius: 250, score: 55 },
  { id: 'z11', lat: 50.0830, lng: 14.4400, radius: 260, score: 74 },
  { id: 'z12', lat: 50.0760, lng: 14.4300, radius: 240, score: 40 },
];

// District accessibility scores for analytics
export const districtScores = [
  { name: 'Praha 1', score: 88 },
  { name: 'Praha 2', score: 76 },
  { name: 'Praha 3', score: 58 },
  { name: 'Praha 4', score: 52 },
  { name: 'Praha 5', score: 65 },
  { name: 'Praha 6', score: 71 },
  { name: 'Praha 7', score: 69 },
  { name: 'Praha 8', score: 44 },
];

// Infrastructure counts for analytics
export const infrastructureCounts = [
  { name: 'Benches', count: 1247 },
  { name: 'Toilets', count: 312 },
  { name: 'AED', count: 89 },
  { name: 'Pharmacies', count: 478 },
  { name: 'Elevators', count: 156 },
  { name: 'Fountains', count: 203 },
  { name: 'Transport', count: 892 },
];
