// Approximate international (national-team) career stats for post-1990 footballers.
// Stats are best-effort approximations, not official figures — correctable later.
// Outfielders carry saves: 0, cleanSheets: 0 (those two stats are the goalkeepers'
// power stats); goalkeepers carry low goals/assists/tackles and high saves/cleanSheets.
const s = (matches, goals, assists, tackles, saves, cleanSheets) => ({ matches, goals, assists, tackles, saves, cleanSheets })

export const playersInternational = [
  // ── Forwards ─────────────────────────────────────────────────────────────
  { id: 1,  name: 'Lionel Messi',       country: 'Argentina',   countryCode: 'AR', position: 'FWD', era: '2005–',     rarity: 'legendary', points: 100, stats: s(187, 112, 58, 22, 0, 0) },
  { id: 2,  name: 'Cristiano Ronaldo',  country: 'Portugal',    countryCode: 'PT', position: 'FWD', era: '2003–',     rarity: 'legendary', points: 100, stats: s(217, 135, 45, 18, 0, 0) },
  { id: 3,  name: 'Ronaldo Nazário',    country: 'Brazil',      countryCode: 'BR', position: 'FWD', era: '1994–2011', rarity: 'legendary', points: 100, stats: s(98, 62, 22, 8, 0, 0) },
  { id: 4,  name: 'Diego Maradona',     country: 'Argentina',   countryCode: 'AR', position: 'FWD', era: '1977–1994', rarity: 'legendary', points: 100, stats: s(91, 34, 30, 25, 0, 0) },
  { id: 5,  name: 'Thierry Henry',      country: 'France',      countryCode: 'FR', position: 'FWD', era: '1997–2010', rarity: 'epic',      points: 75,  stats: s(123, 51, 30, 18, 0, 0) },
  { id: 6,  name: 'Kylian Mbappé',      country: 'France',      countryCode: 'FR', position: 'FWD', era: '2017–',     rarity: 'epic',      points: 75,  stats: s(89, 50, 30, 12, 0, 0) },
  { id: 7,  name: 'Robert Lewandowski', country: 'Poland',      countryCode: 'PL', position: 'FWD', era: '2008–',     rarity: 'epic',      points: 75,  stats: s(152, 82, 22, 20, 0, 0) },
  { id: 8,  name: 'Zlatan Ibrahimović', country: 'Sweden',      countryCode: 'SE', position: 'FWD', era: '2001–2023', rarity: 'epic',      points: 75,  stats: s(122, 62, 30, 24, 0, 0) },
  { id: 9,  name: 'Neymar',             country: 'Brazil',      countryCode: 'BR', position: 'FWD', era: '2010–',     rarity: 'epic',      points: 75,  stats: s(128, 79, 56, 26, 0, 0) },
  { id: 10, name: 'Romário',            country: 'Brazil',      countryCode: 'BR', position: 'FWD', era: '1987–2005', rarity: 'epic',      points: 75,  stats: s(70, 55, 18, 6, 0, 0) },
  { id: 11, name: 'Gabriel Batistuta',  country: 'Argentina',   countryCode: 'AR', position: 'FWD', era: '1991–2002', rarity: 'epic',      points: 75,  stats: s(78, 54, 12, 10, 0, 0) },
  { id: 12, name: 'Samuel Etoʼo',       country: 'Cameroon',    countryCode: 'CM', position: 'FWD', era: '1997–2014', rarity: 'epic',      points: 75,  stats: s(118, 56, 18, 20, 0, 0) },
  { id: 13, name: 'Didier Drogba',      country: 'Ivory Coast', countryCode: 'CI', position: 'FWD', era: '2002–2014', rarity: 'rare',      points: 50,  stats: s(105, 65, 22, 24, 0, 0) },
  { id: 14, name: 'David Villa',        country: 'Spain',       countryCode: 'ES', position: 'FWD', era: '2005–2017', rarity: 'rare',      points: 50,  stats: s(98, 59, 20, 14, 0, 0) },
  { id: 15, name: 'Sergio Agüero',      country: 'Argentina',   countryCode: 'AR', position: 'FWD', era: '2006–2021', rarity: 'rare',      points: 50,  stats: s(101, 41, 18, 12, 0, 0) },
  { id: 16, name: 'Wayne Rooney',       country: 'England',     countryCode: 'GB', position: 'FWD', era: '2003–2018', rarity: 'rare',      points: 50,  stats: s(120, 53, 28, 30, 0, 0) },
  { id: 17, name: 'Raúl',               country: 'Spain',       countryCode: 'ES', position: 'FWD', era: '1996–2006', rarity: 'rare',      points: 50,  stats: s(102, 44, 26, 14, 0, 0) },
  { id: 18, name: 'George Weah',        country: 'Liberia',     countryCode: 'LR', position: 'FWD', era: '1987–2002', rarity: 'rare',      points: 50,  stats: s(60, 22, 12, 14, 0, 0) },
  { id: 19, name: 'Hristo Stoichkov',   country: 'Bulgaria',    countryCode: 'BG', position: 'FWD', era: '1987–1999', rarity: 'common',    points: 25,  stats: s(83, 37, 20, 16, 0, 0) },
  { id: 20, name: 'Hwang Hee-chan',     country: 'South Korea', countryCode: 'KR', position: 'FWD', era: '2016–',     rarity: 'common',    points: 25,  stats: s(60, 13, 8, 18, 0, 0) },

  // ── Midfielders ──────────────────────────────────────────────────────────
  { id: 21, name: 'Zinedine Zidane',    country: 'France',      countryCode: 'FR', position: 'MID', era: '1994–2006', rarity: 'legendary', points: 100, stats: s(108, 31, 35, 60, 0, 0) },
  { id: 22, name: 'Ronaldinho',         country: 'Brazil',      countryCode: 'BR', position: 'MID', era: '1999–2013', rarity: 'epic',      points: 75,  stats: s(97, 33, 35, 30, 0, 0) },
  { id: 23, name: 'Andrea Pirlo',       country: 'Italy',       countryCode: 'IT', position: 'MID', era: '2002–2015', rarity: 'epic',      points: 75,  stats: s(116, 13, 30, 90, 0, 0) },
  { id: 24, name: 'Luka Modrić',        country: 'Croatia',     countryCode: 'HR', position: 'MID', era: '2006–',     rarity: 'epic',      points: 75,  stats: s(180, 25, 28, 150, 0, 0) },
  { id: 25, name: 'Kevin De Bruyne',    country: 'Belgium',     countryCode: 'BE', position: 'MID', era: '2010–',     rarity: 'epic',      points: 75,  stats: s(109, 30, 52, 110, 0, 0) },
  { id: 26, name: 'Steven Gerrard',     country: 'England',     countryCode: 'GB', position: 'MID', era: '2000–2014', rarity: 'epic',      points: 75,  stats: s(114, 21, 25, 140, 0, 0) },
  { id: 27, name: 'Xavi Hernández',     country: 'Spain',       countryCode: 'ES', position: 'MID', era: '2000–2014', rarity: 'epic',      points: 75,  stats: s(133, 13, 35, 130, 0, 0) },
  { id: 28, name: 'Andrés Iniesta',     country: 'Spain',       countryCode: 'ES', position: 'MID', era: '2006–2018', rarity: 'epic',      points: 75,  stats: s(131, 14, 30, 120, 0, 0) },
  { id: 29, name: 'Kaká',               country: 'Brazil',      countryCode: 'BR', position: 'MID', era: '2002–2016', rarity: 'rare',      points: 50,  stats: s(92, 29, 30, 40, 0, 0) },
  { id: 30, name: 'Frank Lampard',      country: 'England',     countryCode: 'GB', position: 'MID', era: '1999–2014', rarity: 'rare',      points: 50,  stats: s(106, 29, 18, 120, 0, 0) },
  { id: 31, name: 'Michael Ballack',    country: 'Germany',     countryCode: 'DE', position: 'MID', era: '1999–2010', rarity: 'rare',      points: 50,  stats: s(98, 42, 20, 130, 0, 0) },
  { id: 32, name: 'Luís Figo',          country: 'Portugal',    countryCode: 'PT', position: 'MID', era: '1991–2006', rarity: 'rare',      points: 50,  stats: s(127, 32, 30, 60, 0, 0) },
  { id: 33, name: 'Pavel Nedvěd',       country: 'Czechia',     countryCode: 'CZ', position: 'MID', era: '1994–2006', rarity: 'rare',      points: 50,  stats: s(91, 18, 22, 120, 0, 0) },
  { id: 34, name: 'Mesut Özil',         country: 'Germany',     countryCode: 'DE', position: 'MID', era: '2009–2018', rarity: 'rare',      points: 50,  stats: s(92, 23, 40, 90, 0, 0) },
  { id: 35, name: 'Roberto Baggio',     country: 'Italy',       countryCode: 'IT', position: 'MID', era: '1988–2004', rarity: 'rare',      points: 50,  stats: s(56, 27, 18, 30, 0, 0) },
  { id: 36, name: 'Paul Pogba',         country: 'France',      countryCode: 'FR', position: 'MID', era: '2013–2022', rarity: 'common',    points: 25,  stats: s(91, 11, 18, 150, 0, 0) },
  { id: 37, name: 'NʼGolo Kanté',  country: 'France',      countryCode: 'FR', position: 'MID', era: '2016–',     rarity: 'common',    points: 25,  stats: s(53, 2, 6, 180, 0, 0) },

  // ── Defenders ────────────────────────────────────────────────────────────
  { id: 38, name: 'Paolo Maldini',      country: 'Italy',       countryCode: 'IT', position: 'DEF', era: '1988–2002', rarity: 'legendary', points: 100, stats: s(126, 7, 12, 220, 0, 0) },
  { id: 39, name: 'Sergio Ramos',       country: 'Spain',       countryCode: 'ES', position: 'DEF', era: '2005–2021', rarity: 'epic',      points: 75,  stats: s(180, 23, 12, 230, 0, 0) },
  { id: 40, name: 'Cafu',               country: 'Brazil',      countryCode: 'BR', position: 'DEF', era: '1990–2006', rarity: 'epic',      points: 75,  stats: s(142, 5, 25, 200, 0, 0) },
  { id: 41, name: 'Fabio Cannavaro',    country: 'Italy',       countryCode: 'IT', position: 'DEF', era: '1997–2010', rarity: 'epic',      points: 75,  stats: s(136, 2, 6, 210, 0, 0) },
  { id: 42, name: 'Roberto Carlos',     country: 'Brazil',      countryCode: 'BR', position: 'DEF', era: '1992–2006', rarity: 'epic',      points: 75,  stats: s(125, 11, 25, 180, 0, 0) },
  { id: 43, name: 'Carles Puyol',       country: 'Spain',       countryCode: 'ES', position: 'DEF', era: '2000–2013', rarity: 'rare',      points: 50,  stats: s(100, 3, 5, 190, 0, 0) },
  { id: 44, name: 'Lilian Thuram',      country: 'France',      countryCode: 'FR', position: 'DEF', era: '1994–2008', rarity: 'rare',      points: 50,  stats: s(142, 2, 8, 190, 0, 0) },
  { id: 45, name: 'Franco Baresi',      country: 'Italy',       countryCode: 'IT', position: 'DEF', era: '1982–1994', rarity: 'rare',      points: 50,  stats: s(81, 1, 5, 170, 0, 0) },
  { id: 46, name: 'Virgil van Dijk',    country: 'Netherlands', countryCode: 'NL', position: 'DEF', era: '2015–',     rarity: 'rare',      points: 50,  stats: s(82, 8, 6, 150, 0, 0) },
  { id: 47, name: 'Philipp Lahm',       country: 'Germany',     countryCode: 'DE', position: 'DEF', era: '2004–2014', rarity: 'rare',      points: 50,  stats: s(113, 5, 18, 170, 0, 0) },
  { id: 48, name: 'Giorgio Chiellini',  country: 'Italy',       countryCode: 'IT', position: 'DEF', era: '2004–2022', rarity: 'rare',      points: 50,  stats: s(117, 8, 4, 210, 0, 0) },
  { id: 49, name: 'Javier Zanetti',     country: 'Argentina',   countryCode: 'AR', position: 'DEF', era: '1994–2011', rarity: 'common',    points: 25,  stats: s(145, 5, 18, 190, 0, 0) },
  { id: 50, name: 'Marcel Desailly',    country: 'France',      countryCode: 'FR', position: 'DEF', era: '1993–2004', rarity: 'common',    points: 25,  stats: s(116, 3, 6, 180, 0, 0) },

  // ── Goalkeepers (9) ──────────────────────────────────────────────────────
  { id: 51, name: 'Gianluigi Buffon',   country: 'Italy',       countryCode: 'IT', position: 'GK',  era: '1997–2018', rarity: 'legendary', points: 100, stats: s(176, 0, 0, 4, 320, 77) },
  { id: 52, name: 'Iker Casillas',      country: 'Spain',       countryCode: 'ES', position: 'GK',  era: '2000–2016', rarity: 'legendary', points: 100, stats: s(167, 0, 0, 3, 300, 100) },
  { id: 53, name: 'Manuel Neuer',       country: 'Germany',     countryCode: 'DE', position: 'GK',  era: '2009–',     rarity: 'epic',      points: 75,  stats: s(124, 0, 0, 6, 230, 50) },
  { id: 54, name: 'Oliver Kahn',        country: 'Germany',     countryCode: 'DE', position: 'GK',  era: '1995–2006', rarity: 'epic',      points: 75,  stats: s(86, 0, 0, 3, 200, 35) },
  { id: 55, name: 'Edwin van der Sar',  country: 'Netherlands', countryCode: 'NL', position: 'GK',  era: '1995–2008', rarity: 'rare',      points: 50,  stats: s(130, 0, 0, 3, 250, 55) },
  { id: 56, name: 'Petr Čech',          country: 'Czechia',     countryCode: 'CZ', position: 'GK',  era: '2002–2016', rarity: 'rare',      points: 50,  stats: s(124, 0, 0, 2, 240, 45) },
  { id: 57, name: 'Hugo Lloris',        country: 'France',      countryCode: 'FR', position: 'GK',  era: '2008–2022', rarity: 'rare',      points: 50,  stats: s(145, 0, 0, 4, 280, 55) },
  { id: 58, name: 'Thibaut Courtois',   country: 'Belgium',     countryCode: 'BE', position: 'GK',  era: '2011–',     rarity: 'rare',      points: 50,  stats: s(102, 0, 0, 2, 210, 40) },
  { id: 59, name: 'Gianluigi Donnarumma', country: 'Italy',     countryCode: 'IT', position: 'GK',  era: '2016–',     rarity: 'common',    points: 25,  stats: s(70, 0, 0, 2, 150, 28) },
]
