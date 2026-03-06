// Mock data for Prague city infrastructure
// Structured for easy replacement with real Golemio / Prague open data APIs

export const benches = [
  { id: 'b1', lat: 50.0875, lng: 14.4213, name: 'Lavička – Staroměstské nám.' },
  { id: 'b2', lat: 50.0812, lng: 14.4283, name: 'Lavička – Karlovo náměstí' },
  { id: 'b3', lat: 50.0765, lng: 14.4145, name: 'Lavička – Petřín' },
  { id: 'b4', lat: 50.0903, lng: 14.4001, name: 'Lavička – Letná' },
  { id: 'b5', lat: 50.0788, lng: 14.4189, name: 'Lavička – Malostranské nám.' },
  { id: 'b6', lat: 50.0841, lng: 14.4518, name: 'Lavička – Riegrovy sady' },
  { id: 'b7', lat: 50.0922, lng: 14.4455, name: 'Lavička – Vítkov' },
  { id: 'b8', lat: 50.0678, lng: 14.4301, name: 'Lavička – Vyšehrad' },
  { id: 'b9', lat: 50.0855, lng: 14.4110, name: 'Lavička – Klárov' },
  { id: 'b10', lat: 50.0750, lng: 14.4380, name: 'Lavička – Botič' },
];

export const toilets = [
  { id: 't1', lat: 50.0870, lng: 14.4200, accessible: true, name: 'WC – Staré Město' },
  { id: 't2', lat: 50.0820, lng: 14.4270, accessible: true, name: 'WC – Karlovo nám.' },
  { id: 't3', lat: 50.0792, lng: 14.4175, accessible: true, name: 'WC – Malá Strana' },
  { id: 't4', lat: 50.0905, lng: 14.4350, accessible: false, name: 'WC – Florenc' },
  { id: 't5', lat: 50.0733, lng: 14.4188, accessible: true, name: 'WC – Smíchov' },
  { id: 't6', lat: 50.0850, lng: 14.4490, accessible: true, name: 'WC – Žižkov' },
  { id: 't7', lat: 50.0801, lng: 14.4320, accessible: false, name: 'WC – Nové Město' },
  { id: 't8', lat: 50.0690, lng: 14.4280, accessible: true, name: 'WC – Vyšehrad' },
];

export const elevators = [
  { id: 'e1', lat: 50.0862, lng: 14.4316, name: 'Výtah – Můstek (metro)' },
  { id: 'e2', lat: 50.0835, lng: 14.4270, name: 'Výtah – Národní třída (metro)' },
  { id: 'e3', lat: 50.0905, lng: 14.4345, name: 'Výtah – Florenc (metro)' },
  { id: 'e4', lat: 50.0755, lng: 14.4175, name: 'Výtah – Anděl (metro)' },
  { id: 'e5', lat: 50.0790, lng: 14.4295, name: 'Výtah – I.P. Pavlova (metro)' },
  { id: 'e6', lat: 50.0845, lng: 14.4520, name: 'Výtah – Jiřího z Poděbrad (metro)' },
];

export const aed = [
  { id: 'a1', lat: 50.0878, lng: 14.4205, name: 'AED – Staroměstská radnice' },
  { id: 'a2', lat: 50.0830, lng: 14.4290, name: 'AED – Palackého nám.' },
  { id: 'a3', lat: 50.0860, lng: 14.4315, name: 'AED – Můstek' },
  { id: 'a4', lat: 50.0910, lng: 14.4350, name: 'AED – Florenc' },
  { id: 'a5', lat: 50.0750, lng: 14.4180, name: 'AED – Anděl' },
];

export const pharmacies = [
  { id: 'p1', lat: 50.0868, lng: 14.4250, name: 'Lékárna – Dlouhá' },
  { id: 'p2', lat: 50.0815, lng: 14.4300, name: 'Lékárna – Karlovo nám.' },
  { id: 'p3', lat: 50.0840, lng: 14.4410, name: 'Lékárna – Vinohrady' },
  { id: 'p4', lat: 50.0760, lng: 14.4160, name: 'Lékárna – Smíchov' },
  { id: 'p5', lat: 50.0900, lng: 14.4120, name: 'Lékárna – Holešovice' },
  { id: 'p6', lat: 50.0695, lng: 14.4310, name: 'Lékárna – Podolí' },
];

export const transport = [
  { id: 'tr1', lat: 50.0865, lng: 14.4310, name: 'Můstek (metro A+B)', type: 'metro' },
  { id: 'tr2', lat: 50.0838, lng: 14.4265, name: 'Národní třída (metro B)', type: 'metro' },
  { id: 'tr3', lat: 50.0908, lng: 14.4342, name: 'Florenc (metro B+C)', type: 'metro' },
  { id: 'tr4', lat: 50.0758, lng: 14.4170, name: 'Anděl (metro B)', type: 'metro' },
  { id: 'tr5', lat: 50.0793, lng: 14.4290, name: 'I.P. Pavlova (metro C)', type: 'metro' },
  { id: 'tr6', lat: 50.0848, lng: 14.4515, name: 'Jiřího z Poděbrad (metro A)', type: 'metro' },
  { id: 'tr7', lat: 50.0870, lng: 14.4188, name: 'Tramvaj – Staroměstská', type: 'tram' },
  { id: 'tr8', lat: 50.0813, lng: 14.4243, name: 'Tramvaj – Národní divadlo', type: 'tram' },
  { id: 'tr9', lat: 50.0885, lng: 14.4005, name: 'Tramvaj – Letenské nám.', type: 'tram' },
  { id: 'tr10', lat: 50.0740, lng: 14.4200, name: 'Tramvaj – Újezd', type: 'tram' },
];

export const fountains = [
  { id: 'f1', lat: 50.0873, lng: 14.4218, name: 'Pítko – Staroměstské nám.' },
  { id: 'f2', lat: 50.0810, lng: 14.4255, name: 'Pítko – Národní třída' },
  { id: 'f3', lat: 50.0785, lng: 14.4185, name: 'Pítko – Kampa' },
  { id: 'f4', lat: 50.0850, lng: 14.4505, name: 'Pítko – Riegrovy sady' },
  { id: 'f5', lat: 50.0680, lng: 14.4290, name: 'Pítko – Vyšehrad' },
];

export const hospitals = [
  { id: 'h1', lat: 50.0755, lng: 14.4280, name: 'Nemocnice Na Františku' },
  { id: 'h2', lat: 50.0690, lng: 14.4400, name: 'VFN – Vinohrady' },
  { id: 'h3', lat: 50.0715, lng: 14.4260, name: 'Nemocnice Na Karlově' },
  { id: 'h4', lat: 50.0825, lng: 14.4448, name: 'Fakultní nemocnice Královské Vinohrady' },
];

export const playgrounds = [
  { id: 'pg1', lat: 50.0770, lng: 14.4160, name: 'Hřiště – Petřín' },
  { id: 'pg2', lat: 50.0845, lng: 14.4500, name: 'Hřiště – Riegrovy sady' },
  { id: 'pg3', lat: 50.0900, lng: 14.4010, name: 'Hřiště – Letná' },
  { id: 'pg4', lat: 50.0670, lng: 14.4285, name: 'Hřiště – Vyšehrad' },
  { id: 'pg5', lat: 50.0810, lng: 14.4350, name: 'Hřiště – Havlíčkovy sady' },
];

export const landmarks = [
  { id: 'lm1', lat: 50.0866, lng: 14.4211, name: 'Staroměstský orloj' },
  { id: 'lm2', lat: 50.0865, lng: 14.4114, name: 'Karlův most' },
  { id: 'lm3', lat: 50.0911, lng: 14.4015, name: 'Pražský hrad' },
  { id: 'lm4', lat: 50.0684, lng: 14.4198, name: 'Vyšehrad' },
  { id: 'lm5', lat: 50.0813, lng: 14.4190, name: 'Národní divadlo' },
  { id: 'lm6', lat: 50.0755, lng: 14.4135, name: 'Petřínská rozhledna' },
  { id: 'lm7', lat: 50.0878, lng: 14.4268, name: 'Prašná brána' },
  { id: 'lm8', lat: 50.0830, lng: 14.4215, name: 'Betlémská kaple' },
];
