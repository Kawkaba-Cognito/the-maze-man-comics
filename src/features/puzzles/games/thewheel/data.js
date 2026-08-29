/*
 * THE WHEEL — the three content banks.
 *
 * Data only: no React, no DOM, so `npm run validate:wheel` can import it in
 * Node and prove the invariants below before anyone plays.
 *
 * ── The rules this data has to satisfy, and why ──
 *
 * 1. NO TWO PUZZLES MAY BE THE SAME PUZZLE. The ranked bank is drawn by prompt
 *    string, so two prompts over the same five cards ("lowest → highest peak"
 *    and "lowest → highest mountain" were literally the same five mountains)
 *    read as a repeat to the player while looking distinct to the drawer.
 *    validate:wheel compares ITEM SETS, not titles.
 *
 * 2. NO ADJACENT PAIR MAY BE A COIN FLIP. Higher/Lower is only a question if
 *    the two values are far enough apart to be knowable. Mercury's surface
 *    gravity is 3.70 m/s² and Mars's is 3.71 — nobody knows that, they guess,
 *    and a guess that burns a whole pot is not a game. The validator rejects
 *    any pair inside 8% of each other (with an absolute floor for small
 *    integer sets, where 1 vs 2 is a real fact).
 *
 * 3. EVERY TRUTH MUST BE REACHABLE ON ITS OWN SLIDER, and every anchor must be
 *    a real wheel segment, or the round cannot be played or won.
 *
 * Figures are rounded to what a player could reasonably estimate; the `fact`
 * line is what gets read out after the reveal, so it carries the precision.
 */

import { P, N, pool } from './bankHelpers.js';
import { MORE_WHEEL, MORE_STREAK, MORE_RANKED } from './dataMore.js';

export { WHEEL_VALUES } from './bankHelpers.js';

const BASE_WHEEL = [
  P('african-un', 'What percentage of UN member states are African countries?', 28, 12, 65, 3, '54 of the 193 UN member states are African.'),
  P('asia-share', 'What percentage of all humans live in Asia?', 59, 25, 90, 3, 'Roughly 59% of the world population lives in Asia.'),
  P('ocean-cover', 'What percentage of Earth’s surface is ocean?', 71, 42, 90, 3, 'About 71% of Earth’s surface is covered by ocean.'),
  P('left-handed', 'What percentage of people are left-handed?', 10, 2, 25, 3, 'Roughly one person in ten is left-handed.'),
  P('body-water', 'What percentage of an adult human body is water?', 60, 25, 90, 3, 'A commonly used estimate is around 60%.'),
  P('internet', 'What percentage of the world uses the internet?', 68, 25, 90, 4, 'Roughly two-thirds of humanity is online.'),
  P('asleep', 'What percentage of life is spent asleep at 8 hours a night?', 33, 12, 65, 3, 'Eight hours is one third of a 24-hour day.'),
  P('forest', 'What percentage of Earth’s land is forest?', 31, 12, 65, 4, 'Forests cover roughly 31% of global land area.'),
  P('fresh-water', 'What percentage of Earth’s water is fresh water?', 3, 2, 12, 2, 'Only about 2.5–3% is fresh water.'),
  P('urban', 'What percentage of humans live in urban areas?', 57, 25, 90, 4, 'More than half of humanity now lives in urban areas.'),
  P('under-15', 'What percentage of the world population is under 15?', 25, 5, 42, 4, 'About one quarter of humanity is under 15.'),
  P('plastic', 'What percentage of all plastic waste has ever been recycled?', 9, 2, 25, 4, 'A widely cited global estimate is around 9%.'),
  P('alive-today', 'What percentage of all humans who ever lived are alive today?', 7, 2, 25, 3, 'Roughly 8 billion now, against more than 100 billion ever born.'),
  P('insects', 'What percentage of known animal species are insects?', 80, 42, 90, 5, 'Insects make up the large majority of described animal species.'),
  P('dark-energy', 'What percentage of the universe is dark energy in the standard model?', 68, 25, 90, 6, 'Dark energy accounts for roughly 68% in the standard cosmological model.'),
  P('brain-energy', 'What percentage of the body’s resting energy does the brain use?', 20, 5, 42, 5, 'The adult brain uses about 20% of resting energy.'),
  P('nitrogen', 'What percentage of Earth’s atmosphere is nitrogen?', 78, 42, 90, 5, 'Dry air is about 78% nitrogen.'),
  P('oxygen', 'What percentage of Earth’s atmosphere is oxygen?', 21, 5, 42, 4, 'Dry air is about 21% oxygen.'),
  P('plasma', 'What percentage of blood volume is plasma?', 55, 25, 90, 5, 'Plasma is about 55% of blood volume.'),
  P('feet-bones', 'What percentage of adult human bones are in the two feet?', 25, 5, 42, 5, 'There are 52 bones in both feet, out of 206 in total.'),
  P('seawater-salt', 'What percentage of average seawater is dissolved salt by mass?', 4, 2, 12, 2, 'Average seawater salinity is about 3.5% by mass.'),
  P('antarctic-water', 'What percentage of Earth’s fresh water is locked in the Antarctic ice sheet?', 70, 42, 90, 6, 'Antarctica stores roughly 70% of Earth’s fresh water.'),
  P('rodents', 'What percentage of mammal species are rodents?', 40, 25, 65, 7, 'Rodents make up roughly 40% of all mammal species.'),
  P('moon-gravity-pct', 'The Moon’s surface gravity is what percentage of Earth’s?', 17, 5, 42, 4, 'Lunar gravity is about one sixth of Earth’s, roughly 16.5%.'),
  P('coding-dna', 'What percentage of the human genome directly codes for proteins?', 2, 2, 12, 2, 'Only about 1–2% of the human genome directly codes for proteins.'),

  N('sunlight', 'How many minutes does sunlight take to reach Earth?', ' min', 0, 30, true, 8.3, 2, 25, 1.2, 'About 8 minutes 20 seconds.'),
  N('octopus-hearts', 'How many hearts does an octopus have?', ' hearts', 1, 9, false, 3, 2, 5, 0.6, 'Three: two for the gills, one for the body.'),
  N('giraffe-neck', 'How many neck vertebrae does a giraffe have?', ' bones', 1, 20, false, 7, 2, 12, 1, 'Seven — the same number as a human.'),
  N('bee-eyes', 'How many eyes does a bee have?', ' eyes', 1, 9, false, 5, 2, 12, 0.8, 'Two compound eyes plus three simple ones.'),
  N('adult-teeth', 'How many teeth are in a full adult mouth, wisdom teeth included?', ' teeth', 10, 50, false, 32, 12, 42, 2, '32 teeth: 8 incisors, 4 canines, 8 premolars, 12 molars.'),
  N('piano-keys', 'How many keys are on a standard piano?', ' keys', 20, 150, false, 88, 42, 150, 3, '88 keys: 52 white and 36 black.'),
  N('chess-squares', 'How many squares are on a chessboard?', '', 10, 150, false, 64, 25, 90, 3, '64 squares, eight by eight.'),
  N('soccer-minutes', 'How many minutes is regulation time in a football match?', ' min', 10, 200, false, 90, 42, 150, 5, '90 minutes, before stoppage time.'),
  N('countries', 'How many countries are commonly counted in the world?', '', 50, 400, false, 195, 90, 365, 10, '193 UN members plus two observer states.'),
  N('adult-bones', 'How many bones are in an adult human body?', ' bones', 50, 600, false, 206, 90, 365, 10, '206 is the standard adult count.'),
  N('iss-orbit', 'How many minutes does the ISS take to orbit Earth once?', ' min', 5, 300, false, 92, 65, 230, 10, 'About 90–93 minutes, roughly 16 orbits a day.'),
  N('cat-sleep', 'How many hours a day does a house cat sleep?', ' h', 1, 30, false, 15, 5, 25, 3, 'Often 12–16 hours.'),
  N('cheetah', 'How fast can a cheetah sprint, in km/h?', ' km/h', 20, 300, false, 110, 42, 230, 15, 'Top bursts are around 100–120 km/h.'),
  N('blood-volume', 'How many litres of blood are in an adult body?', ' L', 1, 20, false, 5, 2, 12, 1, 'Roughly 5 litres for an average adult.'),
  N('mars-day', 'How many hours long is a day on Mars?', ' h', 1, 60, true, 24.6, 12, 42, 3, 'About 24 hours 37 minutes — a "sol".'),
  N('stop-sign', 'How many sides does a stop sign have?', ' sides', 3, 12, false, 8, 2, 12, 1, 'A stop sign is an octagon.'),
  N('nba-minutes', 'How many minutes of regulation play are in an NBA game?', ' min', 20, 150, false, 48, 12, 90, 5, 'Four 12-minute quarters.'),
  N('mars-year', 'How many Earth days are in one Mars year?', ' days', 100, 1500, false, 687, 230, 1000, 100, 'About 687 Earth days.'),
  N('red-cell', 'How many days does a red blood cell live?', ' days', 10, 300, false, 120, 42, 230, 20, 'Around 120 days.'),
  N('peregrine', 'How fast can a peregrine falcon dive, in km/h?', ' km/h', 50, 800, false, 320, 150, 600, 60, 'Hunting dives can exceed 300 km/h.'),
  N('spider-legs', 'How many legs does a spider have?', ' legs', 1, 20, false, 8, 5, 12, 1, 'Spiders are arachnids: eight legs, not six.'),
  N('planets', 'How many planets are in the Solar System?', ' planets', 1, 20, false, 8, 5, 12, 1, 'Eight, since Pluto was reclassified in 2006.'),
  N('mars-moons', 'How many moons does Mars have?', ' moons', 0, 12, false, 2, 2, 12, 0.6, 'Two small ones: Phobos and Deimos.'),
  N('deck-cards', 'How many cards are in a standard deck without jokers?', ' cards', 10, 100, false, 52, 25, 65, 4, '52 cards in four suits of 13.'),
  N('day-minutes', 'How many minutes are in one day?', ' min', 100, 2000, false, 1440, 600, 1000, 80, '24 × 60 = 1,440 minutes.'),
  N('hour-seconds', 'How many seconds are in one hour?', ' sec', 100, 5000, false, 3600, 1000, 600, 150, '60 × 60 = 3,600 seconds.'),
  N('hand-bones', 'How many bones are in one hand, wrist included?', ' bones', 5, 60, false, 27, 12, 42, 3, '27: eight carpals, five metacarpals, fourteen phalanges.'),
  N('ribs', 'How many ribs does a typical human have?', ' ribs', 5, 50, false, 24, 12, 42, 3, 'Twelve pairs — 24 in total.'),
  N('chromosomes', 'How many chromosomes are in a typical human body cell?', '', 10, 100, false, 46, 25, 65, 4, '46, arranged in 23 pairs.'),
  N('greek-letters', 'How many letters are in the Greek alphabet?', ' letters', 5, 60, false, 24, 12, 42, 3, 'Alpha to omega: 24.'),
  N('elements', 'How many chemical elements are officially recognised?', '', 20, 200, false, 118, 90, 150, 6, 'The periodic table currently holds 118.'),
  N('triangle-deg', 'How many degrees do the interior angles of a triangle add up to?', '°', 30, 400, false, 180, 150, 230, 8, 'Exactly 180 degrees, in flat geometry.'),
  N('leap-year', 'How many days are in a leap year?', ' days', 300, 430, false, 366, 365, 600, 4, 'One extra day: 366.'),
  N('english-letters', 'How many letters are in the English alphabet?', ' letters', 5, 60, false, 26, 12, 42, 3, '26 letters, unchanged since the 16th century.'),
  N('die-pips', 'How many pips are on all six faces of one die together?', ' pips', 5, 60, false, 21, 12, 42, 3, '1+2+3+4+5+6 = 21.'),
  N('olympic-rings', 'How many rings are in the Olympic symbol?', ' rings', 1, 12, false, 5, 2, 12, 1, 'Five interlocking rings, one per inhabited continent.'),
  N('marathon-km', 'How long is an official marathon, in kilometres?', ' km', 20, 70, true, 42.2, 25, 65, 3, '42.195 km exactly.'),
  N('water-boil-f', 'At sea level, at what temperature does water boil in Fahrenheit?', '°F', 50, 300, false, 212, 150, 230, 10, '212°F, at standard pressure.'),
  N('water-freeze-f', 'At what temperature does water freeze in Fahrenheit?', '°F', 0, 100, false, 32, 12, 42, 4, '32°F, which is 0°C — the same point on two scales.'),
  N('moon-gravity', 'What is the Moon’s surface gravity, in m/s²?', ' m/s²', 0, 10, true, 1.6, 2, 12, 0.5, 'About 1.62 m/s².'),
  N('earth-gravity', 'What is Earth’s surface gravity, in m/s²?', ' m/s²', 0, 30, true, 9.8, 5, 12, 1, 'Standard gravity is 9.81 m/s².'),
  N('mercury-year', 'How many Earth days are in one Mercury year?', ' days', 20, 200, false, 88, 65, 150, 8, 'Mercury laps the Sun in about 88 days.'),
  N('venus-year', 'How many Earth days are in one Venus year?', ' days', 50, 400, false, 225, 150, 230, 12, 'About 225 Earth days.'),
  N('moon-orbit', 'How many days does the Moon take to orbit Earth against the stars?', ' days', 10, 60, true, 27.3, 12, 42, 3, 'The sidereal month is about 27.3 days.'),
  N('earth-tilt', 'How many degrees is Earth’s axial tilt?', '°', 0, 60, true, 23.4, 12, 42, 3, 'About 23.4 degrees — the reason there are seasons.'),
  N('saturn-year', 'How many Earth years does Saturn take to orbit the Sun?', ' years', 5, 80, true, 29.5, 12, 42, 3, 'About 29.5 Earth years.'),
  N('jupiter-year', 'How many Earth years does Jupiter take to orbit the Sun?', ' years', 1, 40, true, 11.9, 5, 25, 2, 'About 11.86 Earth years.'),
  N('heartbeats', 'At 70 bpm, how many THOUSAND times does a heart beat in a day?', 'k', 20, 200, false, 101, 90, 150, 10, '70 × 60 × 24 ≈ 100,800 beats.'),
  N('small-intestine', 'How many metres long is the adult small intestine?', ' m', 1, 20, true, 6, 2, 12, 1.5, 'Commonly 5–7 metres, coiled up.'),
];

export const WHEEL_BANK = [...BASE_WHEEL, ...MORE_WHEEL];

/*
 * GAME 2 — Higher/Lower pools.
 *
 * Ten facts each wherever the subject allows ten values that are genuinely far
 * apart. Where it did not, the pool is shorter rather than padded with a pair
 * nobody can call: BUILDING FLOORS was dropped outright (Taipei 101 at 101
 * floors against the Empire State at 102 is not knowledge), and several pools
 * lost one member to the 8% rule — Mercury from surface gravity, Uranus from
 * planet diameters, Germany from country areas, Big Ben from heights.
 */
const BASE_STREAK = [
  { id: 'speeds', title: 'TOP SPEEDS', titleAr: 'أقصى السرعات', unit: ' km/h', items: [['SLOTH', 0.27], ['HUMAN WALK', 5], ['HUMAN SPRINT', 36], ['HOUSE CAT', 48], ['OSTRICH', 70], ['CHEETAH', 110], ['PEREGRINE FALCON', 320], ['F1 CAR', 372], ['AIRLINER', 900]] },
  { id: 'heights', title: 'HOW TALL', titleAr: 'كم الارتفاع', unit: ' m', items: [['GIRAFFE', 5], ['T-REX', 12], ['CHRIST THE REDEEMER', 38], ['STATUE OF LIBERTY', 93], ['GIANT REDWOOD', 115], ['EIFFEL TOWER', 330], ['EMPIRE STATE', 443], ['CN TOWER', 553], ['BURJ KHALIFA', 828], ['EVEREST', 8849]] },
  { id: 'populations', title: 'COUNTRY POPULATIONS', titleAr: 'عدد السكان', unit: ' M', items: [['ICELAND', 0.4], ['NEW ZEALAND', 5.3], ['SWEDEN', 10.6], ['AUSTRALIA', 27], ['SPAIN', 49], ['GERMANY', 84], ['JAPAN', 123], ['BRAZIL', 216], ['USA', 340], ['INDIA', 1450]] },
  { id: 'ages', title: 'HOW OLD IS IT', titleAr: 'كم عمره', unit: ' years', items: [['IPHONE', 19], ['ISS', 28], ['TITANIC WRECK', 114], ['EIFFEL TOWER', 137], ['MACHU PICCHU', 570], ['COLOSSEUM', 1946], ['GREAT PYRAMID', 4500], ['STONEHENGE', 5000], ['GÖBEKLI TEPE', 11500], ['CHAUVET CAVE ART', 36000]] },
  { id: 'weights', title: 'ANIMAL WEIGHTS', titleAr: 'أوزان الحيوانات', unit: ' kg', items: [['HAMSTER', 0.12], ['HOUSE CAT', 4.5], ['KOALA', 12], ['GIANT PANDA', 100], ['GORILLA', 160], ['LION', 190], ['POLAR BEAR', 450], ['GIRAFFE', 1200], ['AFRICAN ELEPHANT', 5000], ['BLUE WHALE', 150000]] },
  { id: 'distances', title: 'DISTANCES', titleAr: 'المسافات', unit: ' km', items: [['MARATHON', 42], ['LONDON→PARIS', 344], ['BEIRUT→CAIRO', 590], ['PARIS→ROME', 1105], ['AMAZON RIVER', 6400], ['TRANS-SIBERIAN RAIL', 9288], ['GREAT WALL', 21196], ['EARTH CIRCUMFERENCE', 40075], ['EARTH→MOON', 384400], ['EARTH→SUN', 149600000]] },
  { id: 'howmany', title: 'HOW MANY', titleAr: 'كم العدد', unit: '', items: [['OCTOPUS HEARTS', 3], ['VIOLIN STRINGS', 4], ['BEE EYES', 5], ['STOP SIGN SIDES', 8], ['FOOTBALL TEAM ON PITCH', 11], ['ADULT TEETH', 32], ['CHESSBOARD SQUARES', 64], ['PIANO KEYS', 88], ['COUNTRIES', 195]] },
  { id: 'temperatures', title: 'TEMPERATURES', titleAr: 'درجات الحرارة', unit: ' °C', items: [['ABSOLUTE ZERO', -273], ['HOME FREEZER', -18], ['MELTING ICE', 0], ['HUMAN BODY', 37], ['SAUNA', 90], ['PIZZA OVEN', 300], ['LAVA', 1200], ['SUN SURFACE', 5500], ['LIGHTNING BOLT', 30000], ['SUN CORE', 15000000]] },
  { id: 'lifespans', title: 'ANIMAL LIFESPANS', titleAr: 'أعمار الحيوانات', unit: ' years', items: [['MAYFLY ADULT', 0.01], ['HOUSE MOUSE', 2], ['RABBIT', 9], ['DOG', 13], ['HORSE', 30], ['ELEPHANT', 65], ['PARROT', 80], ['GIANT TORTOISE', 175], ['BOWHEAD WHALE', 200], ['GREENLAND SHARK', 400]] },
  { id: 'gestation', title: 'GESTATION', titleAr: 'مدة الحمل', unit: ' days', items: [['HAMSTER', 16], ['MOUSE', 20], ['RABBIT', 31], ['DOG', 63], ['PIG', 114], ['SHEEP', 152], ['HUMAN', 280], ['HORSE', 340], ['GIRAFFE', 450], ['ELEPHANT', 660]] },
  { id: 'space-dist', title: 'DISTANCE FROM THE SUN', titleAr: 'البعد عن الشمس', unit: ' M km', items: [['MERCURY', 58], ['VENUS', 108], ['EARTH', 150], ['MARS', 228], ['JUPITER', 778], ['SATURN', 1430], ['URANUS', 2870], ['NEPTUNE', 4500], ['HELIOPAUSE', 18000], ['PROXIMA CENTAURI', 40200000]] },
  { id: 'languages', title: 'NATIVE SPEAKERS', titleAr: 'المتحدثون الأصليون', unit: ' M', items: [['ITALIAN', 65], ['JAPANESE', 123], ['RUSSIAN', 154], ['ARABIC', 310], ['ENGLISH', 380], ['SPANISH', 485], ['HINDI', 610], ['MANDARIN', 940]] },
  { id: 'depths', title: 'OCEAN DEPTHS', titleAr: 'أعماق المحيط', unit: ' m', items: [['OLYMPIC POOL', 2], ['SCUBA LIMIT', 40], ['DEEPEST FREE DIVE', 214], ['DEEPEST SCUBA DIVE', 332], ['TITANIC WRECK', 3800], ['JAVA TRENCH', 7290], ['PUERTO RICO TRENCH', 8376], ['MARIANA TRENCH', 10935]] },
  { id: 'calories', title: 'FOOD ENERGY', titleAr: 'طاقة الطعام', unit: ' kcal', items: [['CUCUMBER 100g', 15], ['BOILED EGG', 78], ['BANANA', 105], ['SLICE OF PIZZA', 285], ['FRIES, MEDIUM', 365], ['CHOCOLATE BAR', 500], ['LARGE MILKSHAKE', 800], ['WHOLE LARGE PIZZA', 2200]] },
  { id: 'biology', title: 'HUMAN BIOLOGY', titleAr: 'جسم الإنسان', unit: '', items: [['HYOID BONE', 1], ['HEART CHAMBERS', 4], ['LUNG LOBES', 5], ['NECK VERTEBRAE', 7], ['CRANIAL NERVE PAIRS', 12], ['FINGER BONES, BOTH HANDS', 28], ['ADULT TEETH', 32], ['CHROMOSOMES', 46], ['ADULT BONES', 206], ['MUSCLES', 600]] },
  { id: 'storage', title: 'DIGITAL STORAGE', titleAr: 'سعة التخزين', unit: ' GB', items: [['FLOPPY DISK', 0.00144], ['CD', 0.7], ['DVD', 4.7], ['BLU-RAY', 25], ['OLD PHONE', 64], ['MODERN PHONE', 256], ['LAPTOP SSD', 1000], ['DESKTOP HDD', 4000], ['SMALL NAS', 16000]] },
  { id: 'diameters', title: 'PLANET DIAMETERS', titleAr: 'أقطار الكواكب', unit: ' km', items: [['MERCURY', 4879], ['MARS', 6779], ['EARTH', 12742], ['NEPTUNE', 49244], ['SATURN', 116460], ['JUPITER', 139820], ['SUN', 1392700]] },
  /* ⚠ REPLACED 2026-08-29, same reason as the ranked sets above: ATOMIC
     NUMBERS, PROGRAMMING LANGUAGES and MELTING POINTS (gallium, tungsten) are
     not things a normal person can call higher or lower. In THIS game that is
     worse than in the ranking one — a blind call loses the whole run, so an
     unknowable pool does not just bore the table, it punishes them for it. */
  { id: 'everydayweights', title: 'EVERYDAY WEIGHTS', titleAr: 'أوزان يومية', unit: ' kg', items: [['SMARTPHONE', 0.2], ['LAPTOP', 1.5], ['HOUSE CAT', 4.5], ['BOWLING BALL', 7], ['BICYCLE', 12], ['FULL SUITCASE', 23], ['WASHING MACHINE', 70], ['UPRIGHT PIANO', 300], ['SMALL CAR', 1200]] },
  { id: 'areas', title: 'COUNTRY AREAS', titleAr: 'مساحات الدول', unit: ' M km²', items: [['LEBANON', 0.0105], ['UNITED KINGDOM', 0.244], ['JAPAN', 0.378], ['FRANCE', 0.552], ['EGYPT', 1.01], ['INDIA', 3.287], ['USA', 9.834], ['RUSSIA', 17.1]] },
  { id: 'mountains', title: 'MOUNTAIN HEIGHTS', titleAr: 'ارتفاعات الجبال', unit: ' m', items: [['BEN NEVIS', 1345], ['MOUNT ETNA', 3357], ['MOUNT FUJI', 3776], ['MONT BLANC', 4808], ['KILIMANJARO', 5895], ['ACONCAGUA', 6961], ['EVEREST', 8849], ['OLYMPUS MONS', 21900]] },
  { id: 'planet-years', title: 'PLANET YEARS', titleAr: 'سنوات الكواكب', unit: ' Earth days', items: [['MERCURY', 88], ['VENUS', 225], ['EARTH', 365], ['MARS', 687], ['CERES', 1682], ['JUPITER', 4333], ['SATURN', 10759], ['URANUS', 30687], ['NEPTUNE', 60190], ['PLUTO', 90560]] },
  { id: 'gravity', title: 'SURFACE GRAVITY', titleAr: 'جاذبية السطح', unit: ' m/s²', items: [['PLUTO', 0.62], ['MOON', 1.62], ['MARS', 3.71], ['URANUS', 8.69], ['EARTH', 9.81], ['JUPITER', 24.79], ['SUN', 274]] },
  { id: 'inventions', title: 'INVENTED IN', titleAr: 'سنة الاختراع', unit: ' AD', gapAbs: 8, items: [['PRINTING PRESS', 1440], ['TELESCOPE', 1608], ['STEAM ENGINE', 1712], ['PHOTOGRAPHY', 1826], ['TELEPHONE', 1876], ['RADIO', 1895], ['AIRPLANE', 1903], ['TELEVISION', 1927], ['WORLD WIDE WEB', 1989]] },
  { id: 'howold', title: 'HOW OLD YOU MUST BE', titleAr: 'كم يجب أن يكون عمرك', unit: ' years', gapAbs: 2, items: [['START SCHOOL', 5], ['SECONDARY SCHOOL', 11], ['TEENAGER', 13], ['DRIVE A CAR', 17], ['RENT A CAR', 25], ['RUN FOR US PRESIDENT', 35], ['RETIREMENT', 66]] },
  { id: 'heartrate', title: 'RESTING HEART RATES', titleAr: 'نبضات القلب', unit: ' bpm', items: [['BLUE WHALE', 10], ['ELEPHANT', 30], ['HORSE', 36], ['HUMAN', 70], ['DOG', 90], ['CAT', 150], ['RABBIT', 205], ['HAMSTER', 450], ['MOUSE', 600], ['HUMMINGBIRD', 1000]] },
  { id: 'films', title: 'FILMS RELEASED IN', titleAr: 'سنة صدور الأفلام', unit: ' AD', gapAbs: 5, items: [['SNOW WHITE', 1937], ['STAR WARS', 1977], ['E.T.', 1982], ['THE LION KING', 1994], ['SHREK', 2001], ['AVATAR', 2009], ['AVENGERS: ENDGAME', 2019]] },
  { id: 'datasizes', title: 'DATA SIZES', titleAr: 'وحدات البيانات', unit: ' bytes', items: [['BYTE', 1], ['KILOBYTE', 1e3], ['MEGABYTE', 1e6], ['GIGABYTE', 1e9], ['TERABYTE', 1e12], ['PETABYTE', 1e15], ['EXABYTE', 1e18], ['ZETTABYTE', 1e21], ['YOTTABYTE', 1e24]] },
  { id: 'sportsfield', title: 'PLAYING AREAS', titleAr: 'أطوال الملاعب', unit: ' m long', items: [['VOLLEYBALL COURT', 18], ['CRICKET PITCH', 20.1], ['TENNIS COURT', 23.8], ['BASKETBALL COURT', 28], ['OLYMPIC POOL', 50], ['ICE HOCKEY RINK', 60], ['FOOTBALL PITCH', 105], ['ATHLETICS LAP', 400]] },
].map(pool);

export const STREAK_POOLS = [...BASE_STREAK, ...MORE_STREAK];

/*
 * GAME 3 — five-card ordering puzzles.
 *
 * Three of these were duplicates of each other under different titles (peak vs
 * mountain, and two heart-rate sets, and two frequency sets), which the
 * prompt-keyed no-repeat draw could not see. One prompt was simply wrong: a set
 * of elite race times was labelled "marathon world record era".
 */
const BASE_RANKED = [
  { id: 'tall', prompt: 'SHORTEST → TALLEST', promptAr: 'الأقصر ← الأطول', unit: ' m', items: [['GIRAFFE', 5], ['CHRIST THE REDEEMER', 38], ['STATUE OF LIBERTY', 93], ['EIFFEL TOWER', 330], ['BURJ KHALIFA', 828]] },
  { id: 'fast', prompt: 'SLOWEST → FASTEST', promptAr: 'الأبطأ ← الأسرع', unit: ' km/h', items: [['HUMAN SPRINT', 36], ['HOUSE CAT', 48], ['OSTRICH', 70], ['CHEETAH', 110], ['PEREGRINE FALCON', 320]] },
  { id: 'pop', prompt: 'FEWEST → MOST PEOPLE', promptAr: 'الأقل ← الأكثر سكاناً', unit: ' M', items: [['AUSTRALIA', 27], ['SPAIN', 49], ['GERMANY', 84], ['BRAZIL', 216], ['USA', 340]] },
  { id: 'old', prompt: 'YOUNGEST → OLDEST', promptAr: 'الأحدث ← الأقدم', unit: ' yrs', items: [['IPHONE', 19], ['ISS', 28], ['EIFFEL TOWER', 137], ['COLOSSEUM', 1946], ['GREAT PYRAMID', 4500]] },
  { id: 'heavy', prompt: 'LIGHTEST → HEAVIEST', promptAr: 'الأخف ← الأثقل', unit: ' kg', items: [['KOALA', 12], ['GIANT PANDA', 100], ['GORILLA', 160], ['POLAR BEAR', 450], ['AFRICAN ELEPHANT', 5000]] },
  { id: 'far', prompt: 'SHORTEST → LONGEST DISTANCE', promptAr: 'الأقصر ← الأطول مسافة', unit: ' km', items: [['MARATHON', 42], ['LONDON→PARIS', 344], ['BEIRUT→CAIRO', 590], ['NILE', 6650], ['EARTH→MOON', 384400]] },
  { id: 'count', prompt: 'FEWEST → MOST', promptAr: 'الأقل ← الأكثر', unit: '', items: [['BEE EYES', 5], ['STOP SIGN SIDES', 8], ['ADULT TEETH', 32], ['CHESSBOARD SQUARES', 64], ['PIANO KEYS', 88]] },
  { id: 'hot', prompt: 'COOLEST → HOTTEST', promptAr: 'الأبرد ← الأسخن', unit: ' °C', items: [['HOME FREEZER', -18], ['HUMAN BODY', 37], ['SAUNA', 90], ['PIZZA OVEN', 300], ['SUN SURFACE', 5500]] },
  { id: 'invent', prompt: 'OLDEST → NEWEST INVENTION', promptAr: 'الأقدم ← الأحدث اختراعاً', unit: ' AD', gapAbs: 8, items: [['PRINTING PRESS', 1440], ['STEAM ENGINE', 1712], ['LIGHT BULB', 1879], ['TELEVISION', 1927], ['WORLD WIDE WEB', 1989]] },
  { id: 'loud', prompt: 'QUIETEST → LOUDEST', promptAr: 'الأهدأ ← الأعلى صوتاً', unit: ' dB', items: [['WHISPER', 30], ['CONVERSATION', 60], ['VACUUM CLEANER', 75], ['ROCK CONCERT', 110], ['ROCKET LAUNCH', 180]] },
  { id: 'deep', prompt: 'SHALLOWEST → DEEPEST', promptAr: 'الأقل ← الأكثر عمقاً', unit: ' m', items: [['SCUBA LIMIT', 40], ['DEEPEST SCUBA DIVE', 332], ['TITANIC WRECK', 3800], ['JAVA TRENCH', 7290], ['MARIANA TRENCH', 10935]] },
  { id: 'live', prompt: 'SHORTEST → LONGEST LIFE', promptAr: 'الأقصر ← الأطول عمراً', unit: ' years', items: [['RABBIT', 9], ['HORSE', 30], ['ELEPHANT', 65], ['GIANT TORTOISE', 175], ['GREENLAND SHARK', 400]] },
  { id: 'planetsize', prompt: 'SMALLEST → LARGEST PLANET', promptAr: 'الأصغر ← الأكبر كوكباً', unit: ' km across', items: [['MERCURY', 4879], ['MARS', 6779], ['EARTH', 12742], ['NEPTUNE', 49244], ['JUPITER', 139820]] },
  { id: 'kcal', prompt: 'LEAST → MOST CALORIES', promptAr: 'الأقل ← الأكثر سعرات', unit: ' kcal', items: [['CUCUMBER 100g', 15], ['BOILED EGG', 78], ['BANANA', 105], ['SLICE OF PIZZA', 285], ['CHOCOLATE BAR', 500]] },
  { id: 'gest', prompt: 'SHORTEST → LONGEST PREGNANCY', promptAr: 'الأقصر ← الأطول حملاً', unit: ' days', items: [['HAMSTER', 16], ['RABBIT', 31], ['DOG', 63], ['HUMAN', 280], ['ELEPHANT', 660]] },
  { id: 'bodycount', prompt: 'FEWEST → MOST IN THE BODY', promptAr: 'الأقل ← الأكثر في الجسم', unit: '', items: [['HEART CHAMBERS', 4], ['NECK VERTEBRAE', 7], ['RIB PAIRS', 12], ['ADULT TEETH', 32], ['ADULT BONES', 206]] },
  { id: 'sundist', prompt: 'CLOSEST → FARTHEST FROM THE SUN', promptAr: 'الأقرب ← الأبعد عن الشمس', unit: ' M km', items: [['MERCURY', 58], ['VENUS', 108], ['EARTH', 150], ['MARS', 228], ['JUPITER', 778]] },
  { id: 'peak', prompt: 'LOWEST → HIGHEST PEAK', promptAr: 'الأدنى ← الأعلى قمة', unit: ' m', items: [['BEN NEVIS', 1345], ['MOUNT FUJI', 3776], ['MONT BLANC', 4808], ['KILIMANJARO', 5895], ['EVEREST', 8849]] },
  { id: 'river', prompt: 'SHORTEST → LONGEST RIVER', promptAr: 'الأقصر ← الأطول نهراً', unit: ' km', items: [['THAMES', 346], ['SEINE', 777], ['RHINE', 1230], ['DANUBE', 2850], ['NILE', 6650]] },
  { id: 'storage', prompt: 'SMALLEST → LARGEST STORAGE', promptAr: 'الأصغر ← الأكبر تخزيناً', unit: ' GB', items: [['FLOPPY DISK', 0.00144], ['CD', 0.7], ['DVD', 4.7], ['BLU-RAY', 25], ['MODERN PHONE', 256]] },
  { id: 'topspeed', prompt: 'SLOWEST → FASTEST MACHINE', promptAr: 'الأبطأ ← الأسرع آلة', unit: ' km/h', items: [['BICYCLE SPRINT', 70], ['MOTORWAY CAR', 120], ['HIGH-SPEED TRAIN', 350], ['AIRLINER', 900], ['CONCORDE', 2180]] },
  { id: 'building', prompt: 'SHORTEST → TALLEST BUILDING', promptAr: 'الأقصر ← الأطول مبنى', unit: ' m', items: [['LONDON EYE', 135], ['EIFFEL TOWER', 330], ['EMPIRE STATE', 443], ['CN TOWER', 553], ['BURJ KHALIFA', 828]] },
  { id: 'speakers', prompt: 'FEWEST → MOST NATIVE SPEAKERS', promptAr: 'الأقل ← الأكثر متحدثين', unit: ' M', items: [['ITALIAN', 65], ['JAPANESE', 123], ['RUSSIAN', 154], ['SPANISH', 485], ['MANDARIN', 940]] },
  { id: 'oceans', prompt: 'SMALLEST → LARGEST OCEAN', promptAr: 'الأصغر ← الأكبر محيطاً', unit: ' M km²', items: [['ARCTIC', 14], ['SOUTHERN', 20], ['INDIAN', 71], ['ATLANTIC', 106], ['PACIFIC', 165]] },
  { id: 'prices', prompt: 'CHEAPEST → MOST EXPENSIVE', promptAr: 'الأرخص ← الأغلى', unit: ' $', items: [['CUP OF COFFEE', 4], ['CINEMA TICKET', 15], ['PAIR OF JEANS', 60], ['SMARTPHONE', 900], ['SMALL CAR', 20000]] },
  { id: 'moons', prompt: 'FEWEST → MOST MOONS', promptAr: 'الأقل ← الأكثر أقماراً', unit: ' moons', items: [['EARTH', 1], ['MARS', 2], ['NEPTUNE', 16], ['URANUS', 28], ['JUPITER', 95]] },
  { id: 'pulse', prompt: 'SLOWEST → FASTEST HEARTBEAT', promptAr: 'الأبطأ ← الأسرع نبضاً', unit: ' bpm', items: [['BLUE WHALE', 10], ['HORSE', 36], ['HUMAN', 70], ['CAT', 150], ['MOUSE', 600]] },
  { id: 'water', prompt: 'DRIEST → MOST WATERY', promptAr: 'الأقل ← الأكثر ماءً', unit: ' % water', items: [['BUTTER', 16], ['BREAD', 35], ['BANANA', 75], ['APPLE', 86], ['CUCUMBER', 95]] },
  /* ⚠ REPLACED 2026-08-29 — the seven sets that used to sit in these slots were
     ELITE RACE TIMES in decimal minutes, PITCH IN HERTZ, ATOMIC NUMBERS,
     MELTING POINTS, BOILING POINTS, PLANET DAY LENGTHS and PROGRAMMING
     LANGUAGES BY RELEASE YEAR. Every one was factually correct and none of them
     belonged in a party game: ordering tin against aluminium, or Go against
     Swift, is not something a normal person knows, so the round stops being a
     guess you can reason about and becomes a shrug. A ranking puzzle is fun
     exactly when the table ARGUES about it, and you cannot argue about a fact
     you have never met. These are replacements rather than deletions because
     the bank size is load-bearing — see the exact 64 ÷ 4 split in sets.js. */
  { id: 'sugar', prompt: 'LEAST → MOST SUGAR', promptAr: 'الأقل ← الأكثر سكراً', unit: ' g per glass', items: [['MILK', 12], ['ORANGE JUICE', 21], ['COLA', 35], ['ENERGY DRINK', 55], ['MILKSHAKE', 80]] },
  { id: 'screens', prompt: 'SMALLEST → LARGEST SCREEN', promptAr: 'الأصغر ← الأكبر شاشة', unit: ' cm across', items: [['SMARTWATCH', 4], ['PHONE', 15], ['TABLET', 27], ['LAPTOP', 35], ['LIVING-ROOM TV', 140]] },
  { id: 'cooking', prompt: 'QUICKEST → SLOWEST TO COOK', promptAr: 'الأسرع ← الأبطأ طهياً', unit: ' min', items: [['BOILED EGG', 7], ['PASTA', 11], ['RICE', 20], ['ROAST CHICKEN', 90], ['SLOW-COOKED STEW', 300]] },
  { id: 'area', prompt: 'SMALLEST → LARGEST COUNTRY', promptAr: 'الأصغر ← الأكبر دولة', unit: ' M km²', items: [['LEBANON', 0.0105], ['ITALY', 0.301], ['EGYPT', 1.01], ['INDIA', 3.287], ['RUSSIA', 17.1]] },
  { id: 'grav', prompt: 'WEAKEST → STRONGEST GRAVITY', promptAr: 'الأضعف ← الأقوى جاذبية', unit: ' m/s²', items: [['MOON', 1.62], ['MARS', 3.71], ['EARTH', 9.81], ['JUPITER', 24.79], ['SUN', 274]] },
  { id: 'holidays', prompt: 'EARLIEST → LATEST IN THE YEAR', promptAr: 'الأبكر ← الأمتأخر في السنة', unit: '', items: [["NEW YEAR'S DAY", 1], ["VALENTINE'S DAY", 45], ['LONGEST DAY OF SUMMER', 172], ['HALLOWEEN', 304], ['CHRISTMAS', 359]] },
  { id: 'appsage', prompt: 'OLDEST → NEWEST', promptAr: 'الأقدم ← الأحدث', unit: ' AD', gapAbs: 4, items: [['EMAIL', 1971], ['GOOGLE', 1998], ['FACEBOOK', 2004], ['WHATSAPP', 2009], ['TIKTOK', 2016]] },
  { id: 'data', prompt: 'SMALLEST → LARGEST DATA UNIT', promptAr: 'الأصغر ← الأكبر وحدة', unit: ' bytes', items: [['BYTE', 1], ['KILOBYTE', 1e3], ['MEGABYTE', 1e6], ['GIGABYTE', 1e9], ['TERABYTE', 1e12]] },
  { id: 'sides', prompt: 'FEWEST → MOST SIDES', promptAr: 'الأقل ← الأكثر أضلاعاً', unit: ' sides', items: [['TRIANGLE', 3], ['SQUARE', 4], ['PENTAGON', 5], ['HEXAGON', 6], ['OCTAGON', 8]] },
  { id: 'angles', prompt: 'LOWEST → HIGHEST ANGLE SUM', promptAr: 'الأدنى ← الأعلى مجموع زوايا', unit: '°', items: [['TRIANGLE', 180], ['QUADRILATERAL', 360], ['PENTAGON', 540], ['HEXAGON', 720], ['OCTAGON', 1080]] },
  { id: 'seconds', prompt: 'SHORTEST → LONGEST TIME', promptAr: 'الأقصر ← الأطول زمناً', unit: ' sec', items: [['MINUTE', 60], ['HOUR', 3600], ['DAY', 86400], ['WEEK', 604800], ['YEAR', 31557600]] },
  { id: 'density', prompt: 'LIGHTEST → DENSEST MATERIAL', promptAr: 'الأخف ← الأكثف مادة', unit: ' g/cm³', items: [['CORK', 0.24], ['WATER', 1], ['ALUMINIUM', 2.7], ['IRON', 7.87], ['GOLD', 19.3]] },
  { id: 'devices', prompt: 'OLDEST → NEWEST DEVICE', promptAr: 'الأقدم ← الأحدث جهازاً', unit: ' AD', gapAbs: 8, items: [['RADIO', 1895], ['TELEVISION', 1927], ['MOBILE PHONE', 1973], ['LAPTOP', 1981], ['SMARTPHONE', 2007]] },
  { id: 'balls', prompt: 'SMALLEST → LARGEST BALL', promptAr: 'الأصغر ← الأكبر كرة', unit: ' cm across', items: [['GOLF BALL', 4.3], ['TENNIS BALL', 6.7], ['BASEBALL', 7.3], ['SOFTBALL', 9.7], ['BASKETBALL', 24]] },
  { id: 'consoles', prompt: 'OLDEST → NEWEST CONSOLE', promptAr: 'الأقدم ← الأحدث جهازاً', unit: ' AD', gapAbs: 5, items: [['NES', 1983], ['GAME BOY', 1989], ['PLAYSTATION', 1994], ['XBOX', 2001], ['NINTENDO SWITCH', 2017]] },
  { id: 'track', prompt: 'SHORTEST → LONGEST TRACK RACE', promptAr: 'الأقصر ← الأطول سباقاً', unit: ' m', items: [['100 M', 100], ['200 M', 200], ['400 M', 400], ['800 M', 800], ['1500 M', 1500]] },
].map(pool);

export const RANKED_PUZZLES = [...BASE_RANKED, ...MORE_RANKED];
