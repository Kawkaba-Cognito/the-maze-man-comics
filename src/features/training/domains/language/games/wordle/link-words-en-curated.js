/**
 * Curated familiar English words, 3 and 4 letters — the VALIDATION set for
 * short words in Word Maze.
 *
 * WHY THIS FILE EXISTS
 * ────────────────────
 * Validation used to run against `link-words-en.js` alone, which is generated
 * from `words_alpha.txt` — an unabridged dump. At 3–4 letters that list is
 * mostly not words a player would recognise:
 *
 *   3-letter: 2,130 entries — aal aam abb abc abd abl abn abp abr abt abv aby
 *             acc ach ack acy adc adj adm adp adv ady aeq aer …
 *   4-letter: 7,186 entries — aani aaru abac abas abay abbr abey abib abir
 *             abit abos abow abri absi acad acca acce acct acle aclu acpt …
 *
 * So a player who traced letters in what looked like a scramble kept landing on
 * an abbreviation and being told "correct" — `sart`, `aal`, `abt` all scored.
 * Reported on 2026-08-15 as "when I write the word in wrong order it gives me
 * correct, which is not". The scoring code was never wrong; the dictionary was.
 *
 * THE SPLIT
 * ─────────
 *   3–4 letters → THIS list only. Short strings are where accidental scrambles
 *                 land, and the familiar set is small enough to enumerate.
 *   5+ letters  → the full corpus (see linkDictionary.js). Nobody traces a
 *                 five-letter path by accident, so discovery stays open, and
 *                 the odd obscure long word reads as a lucky find rather than
 *                 a wrong answer.
 *
 * ⚠ THE TRADE, STATED PLAINLY: a real 3–4 letter word missing from here is now
 * REJECTED. That is the opposite complaint, so this list is deliberately
 * generous — it aims at recall, not at a tight "common words" aesthetic. If a
 * player reports a real word being refused, add it here; that is a one-line fix
 * and the right kind of debt. `npm run validate:wordmaze` asserts every entry
 * is also in the corpus, so a typo here cannot silently create a fake word.
 *
 * Board SEEDING still uses link-words-en-common.js — that list answers a
 * different question ("what should we guarantee is findable"), and it is far
 * too small to validate against (102 three-letter entries; it would reject
 * elf, oak, ivy, pug, zip).
 */

/** Familiar 3-letter English words. */
export const CURATED_EN_3 = [
  'ace', 'act', 'add', 'ado', 'ads', 'aft', 'age', 'ago', 'aid', 'ail', 'aim', 'air',
  'ale', 'all', 'amp', 'and', 'ant', 'any', 'ape', 'apt', 'arc', 'are', 'ark', 'arm',
  'art', 'ash', 'ask', 'asp', 'ate', 'awe', 'axe', 'aye',
  'bad', 'bag', 'ban', 'bar', 'bat', 'bay', 'bed', 'bee', 'beg', 'bet', 'bib', 'bid',
  'big', 'bin', 'bit', 'boa', 'bob', 'bog', 'bon', 'boo', 'bow', 'box', 'boy', 'bra',
  'bud', 'bug', 'bum', 'bun', 'bus', 'but', 'buy', 'bye',
  'cab', 'cad', 'cam', 'can', 'cap', 'car', 'cat', 'caw', 'cob', 'cod', 'cog', 'con',
  'coo', 'cop', 'cot', 'cow', 'coy', 'cry', 'cub', 'cud', 'cue', 'cup', 'cur', 'cut',
  'dab', 'dad', 'dam', 'day', 'den', 'dew', 'did', 'die', 'dig', 'dim', 'din', 'dip',
  'doe', 'dog', 'don', 'dot', 'dry', 'dub', 'dud', 'due', 'dug', 'duo', 'dye',
  'ear', 'eat', 'ebb', 'eel', 'egg', 'ego', 'elf', 'elk', 'elm', 'emu', 'end', 'era',
  'err', 'eve', 'ewe', 'eye',
  'fad', 'fan', 'far', 'fat', 'fax', 'fed', 'fee', 'few', 'fib', 'fig', 'fin', 'fir',
  'fit', 'fix', 'flu', 'fly', 'foe', 'fog', 'for', 'fox', 'fry', 'fun', 'fur',
  'gag', 'gap', 'gas', 'gel', 'gem', 'get', 'gig', 'gin', 'gnu', 'god', 'got', 'gum',
  'gun', 'gut', 'guy', 'gym',
  'had', 'hag', 'ham', 'has', 'hat', 'hay', 'hem', 'hen', 'her', 'hew', 'hex', 'hid',
  'him', 'hip', 'his', 'hit', 'hob', 'hoe', 'hog', 'hop', 'hot', 'how', 'hub', 'hue',
  'hug', 'hum', 'hut',
  'ice', 'icy', 'ill', 'imp', 'ink', 'inn', 'ion', 'ire', 'irk', 'its', 'ivy',
  'jab', 'jam', 'jar', 'jaw', 'jay', 'jet', 'jig', 'job', 'jog', 'jot', 'joy', 'jug',
  'jut',
  'keg', 'key', 'kid', 'kin', 'kit',
  'lab', 'lad', 'lag', 'lap', 'law', 'lax', 'lay', 'led', 'leg', 'let', 'lid', 'lie',
  'lip', 'lit', 'lob', 'log', 'lot', 'low', 'lug',
  'mad', 'man', 'map', 'mar', 'mat', 'maw', 'may', 'men', 'met', 'mew', 'mid', 'mix',
  'mob', 'mod', 'mom', 'mop', 'mow', 'mud', 'mug', 'mum',
  'nab', 'nag', 'nap', 'nay', 'net', 'new', 'nib', 'nil', 'nip', 'nit', 'nod', 'nor',
  'not', 'now', 'nun', 'nut',
  'oak', 'oar', 'oat', 'odd', 'ode', 'off', 'oil', 'old', 'one', 'opt', 'orb', 'ore',
  'our', 'out', 'owe', 'owl', 'own',
  'pad', 'pal', 'pan', 'par', 'pat', 'paw', 'pay', 'pea', 'peg', 'pen', 'pep', 'per',
  'pet', 'pew', 'pie', 'pig', 'pin', 'pit', 'ply', 'pod', 'pop', 'pot', 'pro', 'pry',
  'pub', 'pug', 'pun', 'pup', 'put',
  'rag', 'ram', 'ran', 'rap', 'rat', 'raw', 'ray', 'red', 'ref', 'rib', 'rid', 'rig',
  'rim', 'rip', 'rob', 'rod', 'roe', 'rot', 'row', 'rub', 'rug', 'rum', 'run', 'rut',
  'rye',
  'sad', 'sag', 'sap', 'sat', 'saw', 'say', 'sea', 'see', 'set', 'sew', 'she', 'shy',
  'sin', 'sip', 'sir', 'sit', 'six', 'ski', 'sky', 'sly', 'sob', 'sod', 'son', 'sow',
  'soy', 'spa', 'spy', 'sty', 'sub', 'sue', 'sum', 'sun', 'sup',
  'tab', 'tag', 'tan', 'tap', 'tar', 'tax', 'tea', 'ten', 'the', 'thy', 'tie', 'tin',
  'tip', 'toe', 'ton', 'too', 'top', 'tow', 'toy', 'try', 'tub', 'tug', 'two',
  'urn', 'use',
  'van', 'vat', 'vet', 'vex', 'via', 'vie', 'vow',
  'wad', 'wag', 'war', 'was', 'wax', 'way', 'web', 'wed', 'wee', 'wet', 'who', 'why',
  'wig', 'win', 'wit', 'woe', 'wok', 'won', 'woo', 'wry',
  'yak', 'yam', 'yap', 'yaw', 'yes', 'yet', 'yew', 'you',
  'zap', 'zip', 'zoo',
];

/** Familiar 4-letter English words. */
export const CURATED_EN_4 = [
  'able', 'ache', 'acid', 'acre', 'acts', 'adds', 'aged', 'ages',  'aide',
  'aids', 'aims', 'ajar', 'akin', 'ales', 'alga', 'ally', 'aloe', 'also', 'alto',
  'amid', 'ants', 'apes', 'apex', 'arch', 'arcs', 'area', 'aria', 'arid', 'arms',
  'army', 'arts', 'atom', 'aunt', 'auto', 'aver', 'avid', 'away', 'awed', 'axes',
  'axis', 'axle',
  'babe', 'baby', 'back', 'bade', 'bags', 'bail', 'bait', 'bake', 'bald', 'bale',
  'balk', 'ball', 'balm', 'band', 'bane', 'bang', 'bank', 'bans', 'barb', 'bard',
  'bare', 'bark', 'barn', 'bars', 'base', 'bash', 'bask', 'bass', 'bath', 'bats',
  'bead', 'beak', 'beam', 'bean', 'bear', 'beat', 'beds', 'beef', 'been', 'beer',
  'bees', 'beet', 'bell', 'belt', 'bend', 'bent', 'best', 'bets', 'bias', 'bide',
  'bike', 'bile', 'bill', 'bind', 'bins', 'bird', 'bite', 'bits', 'blew', 'blob',
  'bloc', 'blot', 'blow', 'blue', 'blur', 'boar', 'boat', 'bode', 'body', 'boil',
  'bold', 'bolt', 'bomb', 'bond', 'bone', 'bony', 'book', 'boom', 'boon', 'boot',
  'bore', 'born', 'boss', 'both', 'bout', 'bowl', 'bows', 'boys', 'brag', 'bran',
  'brat', 'bred', 'brew', 'brim', 'brow', 'buck', 'buds', 'bugs', 'bulb', 'bulk',
  'bull', 'bump', 'bunk', 'buns', 'buoy', 'burn', 'burp', 'burr', 'bury', 'bush',
  'bust', 'busy', 'butt', 'buys', 'buzz',
  'cabs', 'cage', 'cake', 'calf', 'call', 'calm', 'came', 'camp', 'cane', 'cans',
  'cape', 'caps', 'card', 'care',  'carp', 'cars', 'cart', 'case', 'cash',
  'cask', 'cast', 'cats', 'cave', 'cell', 'cent', 'chap', 'char', 'chat', 'chef',
  'chew', 'chin', 'chip', 'chop', 'chum', 'cite', 'city', 'clad', 'clam', 'clan',
  'clap', 'claw', 'clay', 'clip', 'clog', 'clot', 'club', 'clue', 'coal', 'coat',
  'coax', 'code', 'coil', 'coin', 'coke', 'cold', 'colt', 'coma', 'comb', 'come',
  'cone', 'cook', 'cool', 'coop', 'cope', 'copy', 'cord', 'core', 'cork', 'corn',
  'cost', 'cosy', 'cots', 'coup', 'cove', 'cows', 'cozy', 'crab', 'crag', 'cram',
  'crew', 'crib', 'crop', 'crow', 'cube', 'cubs', 'cuff', 'cull', 'cult', 'cups',
  'curb', 'curd', 'cure', 'curl', 'cusp', 'cute', 'cuts', 'cyst',
  'dabs', 'dads', 'daft', 'dais', 'dale', 'dame', 'damp', 'dams', 'dare', 'dark',
  'darn', 'dart', 'dash', 'data', 'date', 'dawn', 'days', 'daze', 'dead', 'deaf',
  'deal', 'dean', 'dear', 'debt', 'deck', 'deed', 'deem', 'deep', 'deer', 'defy',
  'dell', 'dens', 'dent', 'deny', 'desk', 'dial', 'dice', 'died', 'dies', 'diet',
  'digs', 'dime', 'dine', 'ding', 'dins', 'dips', 'dire', 'dirt', 'disc', 'dish',
  'disk', 'dive', 'dock', 'docs', 'dogs', 'doll', 'dome', 'done', 'doom', 'door',
  'dose', 'dote', 'dots', 'dour', 'dove', 'down', 'doze', 'drab', 'drag', 'dram',
  'draw', 'drew', 'drip', 'drop', 'drug', 'drum', 'dual', 'duck', 'duct', 'dude',
  'duel', 'dues', 'duet', 'dull', 'duly', 'dump', 'dune', 'dung', 'dunk', 'dusk',
  'dust', 'duty', 'dyed', 'dyes',
  'each', 'earl', 'earn', 'ears', 'ease', 'east', 'easy', 'eats', 'echo', 'edge',
  'edgy', 'edit', 'eels', 'eggs', 'else', 'emit', 'ends', 'envy', 'epic', 'eras',
  'even', 'ever', 'evil', 'exam', 'exit', 'eyed', 'eyes',
  'face', 'fact', 'fade', 'fads', 'fail', 'fair', 'fake', 'fall', 'fame', 'fang',
  'fans', 'fare', 'farm', 'fast', 'fate', 'fawn', 'fear', 'feat', 'feed', 'feel',
  'fees', 'feet', 'fell', 'felt', 'fend', 'fern', 'feud', 'figs', 'file', 'fill',
  'film', 'find', 'fine', 'fins', 'fire', 'firm', 'fish', 'fist', 'fits', 'five',
  'flag', 'flak', 'flap', 'flat', 'flaw', 'flea', 'fled', 'flee', 'flew', 'flex',
  'flip', 'flit',  'flog', 'flop', 'flow', 'flue', 'foal', 'foam', 'foes',
  'fogs', 'foil', 'fold', 'folk', 'fond', 'font', 'food', 'fool', 'foot', 'ford',
  'fore', 'fork', 'form', 'fort', 'foul', 'four', 'fowl',  'fray', 'free',
  'fret', 'frog', 'from', 'fuel', 'full', 'fume', 'fund', 'funk', 'furs', 'fury',
  'fuse', 'fuss',
  'gain', 'gait', 'gala', 'gale', 'gall', 'game', 'gang', 'gaps', 'garb', 'gash',
  'gasp', 'gate', 'gave', 'gaze', 'gear', 'gems', 'gene', 'gift', 'gild', 'gill',
  'gilt', 'gird', 'girl', 'gist', 'give', 'glad', 'glee', 'glen', 'glib', 'glow',
  'glue', 'glum', 'gnat', 'goad', 'goal', 'goat', 'gods', 'goes', 'gold', 'golf',
  'gone', 'gong', 'good', 'gore', 'gown', 'grab', 'gram', 'gray', 'grew', 'grey',
  'grid', 'grim', 'grin', 'grip', 'grit', 'grow', 'grub', 'gulf', 'gull', 'gulp',
  'gums', 'gush', 'gust', 'guts', 'guys',
  'hack', 'hail', 'hair', 'hale', 'half', 'hall', 'halo', 'halt', 'hams', 'hand',
  'hang', 'hard', 'hare', 'hark', 'harm', 'harp', 'hats', 'haul', 'have', 'hawk',
  'haze', 'hazy', 'head', 'heal', 'heap', 'hear', 'heat', 'heed', 'heel', 'heir',
  'held', 'hell', 'helm', 'help', 'hemp', 'hens', 'herb', 'herd', 'here', 'hero',
  'hers', 'hide', 'high', 'hike', 'hill', 'hilt', 'hind', 'hint', 'hips', 'hire',
  'hiss', 'hits', 'hive', 'hoax', 'hold', 'hole', 'holy', 'home', 'hone', 'honk',
  'hood', 'hoof', 'hook', 'hoop', 'hope', 'horn', 'hose', 'host', 'hour', 'howl',
  'hubs', 'hued', 'hues', 'huge', 'hugs', 'hulk', 'hull', 'hump', 'hung', 'hunt',
  'hurl', 'hurt', 'hush', 'husk', 'huts', 'hymn',
  'iced', 'ices', 'icon', 'idea', 'idle', 'idly', 'idol', 'inch', 'inks', 'inns',
  'into', 'ions', 'iron', 'isle', 'itch', 'item',
  'jabs', 'jade', 'jail', 'jams', 'jars', 'jaws', 'jazz', 'jeep', 'jeer', 'jest',
  'jets', 'jobs', 'jogs', 'join', 'joke', 'jolt', 'jots', 'joys', 'judo', 'jugs',
  'jump', 'junk', 'jury', 'just', 'jute',
  'keen', 'keep', 'kegs', 'kelp', 'kept', 'keys', 'kick', 'kids', 'kiln', 'kilt',
  'kind', 'king', 'kiss', 'kite', 'kits', 'knee', 'knew', 'knit', 'knob', 'knot',
  'know',
  'labs', 'lace', 'lack', 'lads', 'lady', 'laid', 'lair', 'lake', 'lamb', 'lame',
  'lamp', 'land', 'lane', 'laps', 'lard', 'lark', 'lash', 'lass', 'last', 'late',
  'lava', 'lawn', 'laws', 'lays', 'lazy', 'lead', 'leaf', 'leak', 'lean', 'leap',
  'left', 'legs', 'lend', 'lens', 'lent', 'less', 'lest', 'lets', 'levy', 'liar',
  'lice', 'lick', 'lids', 'lied', 'lies', 'life', 'lift', 'like', 'limb', 'lime',
  'limp', 'line', 'link', 'lint', 'lion', 'lips', 'lisp', 'list', 'live', 'load',
  'loaf', 'loan', 'lobe', 'lock', 'lode', 'loft', 'logs', 'lone', 'long', 'look',
  'loom', 'loop', 'loot', 'lord', 'lore', 'lose', 'loss', 'lost', 'lots', 'loud',
  'love', 'luck', 'lump', 'lung', 'lure', 'lurk', 'lush', 'lute', 'lynx',
  'made', 'maid', 'mail', 'maim', 'main', 'make', 'male', 'mall', 'malt', 'mane',
  'many', 'maps', 'mare', 'mark', 'mars', 'mash', 'mask', 'mass', 'mast', 'mate',
  'math', 'mats', 'maze', 'mead', 'meal', 'mean', 'meat', 'meek', 'meet', 'meld',
  'melt', 'memo', 'mend', 'menu', 'mere', 'mesh', 'mess', 'mice', 'mild', 'mile',
  'milk', 'mill', 'mime', 'mind', 'mine', 'mint', 'mire', 'miss', 'mist', 'mite',
  'moan', 'moat', 'mock', 'mode', 'mold', 'mole', 'monk', 'mood', 'moon', 'moor',
  'moot', 'mops', 'more', 'morn', 'moss', 'most', 'moth', 'move', 'much', 'muck',
  'mugs', 'mule', 'mums', 'mush', 'must', 'mute', 'mutt', 'myth',
  'nail', 'name', 'nape', 'naps', 'navy', 'near', 'neat', 'neck', 'need', 'neon',
  'nest', 'nets', 'news', 'newt', 'next', 'nice', 'nick', 'nine', 'nips', 'node',
  'nods', 'none', 'nook', 'noon', 'norm', 'nose', 'nosy', 'note', 'noun', 'nuns',
  'nuts',
  'oaks', 'oars', 'oath', 'oats', 'obey', 'odds', 'odes', 'odor', 'oils', 'oily',
  'okay', 'omen', 'omit', 'once', 'ones', 'only', 'onto', 'onus', 'onyx', 'ooze',
  'open', 'opts', 'oral', 'orbs', 'ores', 'ours', 'oust', 'oval', 'oven', 'over',
  'owed', 'owes', 'owls', 'owns',
  'pace', 'pack', 'pact', 'pads', 'page', 'paid', 'pail', 'pain', 'pair', 'pale',
  'palm', 'pans', 'pant', 'papa', 'park', 'part', 'pass', 'past', 'pate', 'path',
  'pats', 'pave', 'pawn', 'paws', 'pays', 'peak', 'peal', 'pear', 'peas', 'peat',
  'peck', 'peel', 'peer', 'pegs', 'pelt', 'pens', 'pent', 'perk', 'pest', 'pets',
  'pick', 'pier', 'pies', 'pigs', 'pike', 'pile', 'pill', 'pine', 'pink', 'pins',
  'pint', 'pipe', 'pits', 'pity', 'plan', 'play', 'plea', 'pled', 'plod', 'plot',
  'plow', 'ploy', 'plug', 'plum', 'plus', 'pods', 'poem', 'poet', 'poke', 'pole',
  'poll', 'polo', 'pomp', 'pond', 'pony', 'pool', 'poor', 'pope', 'pops', 'pore',
  'pork', 'port', 'pose', 'posh', 'post', 'posy', 'pots', 'pour', 'pout', 'pray',
  'prey', 'prim', 'prod', 'prop', 'pros', 'prow', 'pubs', 'puck', 'puff', 'pull',
  'pulp', 'pump', 'punk', 'puns', 'punt', 'pups', 'pure', 'purr', 'push', 'puts',
  'quit', 'quiz',
  'race', 'rack', 'raft', 'rage', 'rags', 'raid', 'rail', 'rain', 'rake', 'ramp',
  'rams', 'rang', 'rank', 'rant', 'rape', 'rare', 'rash', 'rate', 'rats', 'rave',
  'rays', 'raze', 'read', 'real', 'ream', 'reap', 'rear', 'redo', 'reed', 'reef',
  'reek', 'reel', 'refs',  'rein', 'rely', 'rend', 'rent', 'rest', 'ribs',
  'rice', 'rich', 'ride', 'rife', 'rift', 'rigs', 'rims', 'rind', 'ring', 'rink',
  'riot', 'ripe', 'rips', 'rise', 'risk', 'rite', 'road', 'roam', 'roar', 'robe',
  'robs', 'rock', 'rode', 'rods', 'roll', 'roof', 'rook', 'room', 'root', 'rope',
  'rose', 'rosy', 'rote', 'rots', 'rout', 'rove', 'rows', 'rube', 'rubs', 'ruby',
  'rude', 'rugs', 'ruin', 'rule', 'rump', 'rung', 'runs', 'runt', 'ruse', 'rush',
  'rust', 'ruts',
  'sack', 'safe', 'saga', 'sage', 'said', 'sail', 'sake', 'sale', 'salt', 'same',
  'sand', 'sane', 'sang', 'sank', 'saps', 'sash', 'save', 'sawn', 'saws', 'says',
  'scab', 'scam', 'scan', 'scar', 'seal', 'seam', 'sear', 'seas', 'seat', 'sect',
  'seed', 'seek', 'seem', 'seen', 'seep', 'sees', 'self', 'sell', 'send', 'sent',
  'sets', 'sewn', 'shed', 'shin', 'ship', 'shoe', 'shop', 'shot', 'show', 'shun',
  'shut', 'sick', 'side', 'sift', 'sigh', 'sign', 'silk', 'sill', 'silo', 'silt',
  'sing', 'sink', 'sins', 'sips', 'sire', 'site', 'sits', 'size', 'skew', 'skid',
  'skin', 'skip', 'skis', 'skit', 'slab', 'slam', 'slap', 'slat', 'sled', 'slew',
  'slid', 'slim', 'slip', 'slit', 'slot', 'slow', 'slug', 'slum', 'slur', 'smog',
  'smug', 'snag', 'snap', 'snip', 'snob', 'snow', 'snub', 'snug', 'soak', 'soap',
  'soar', 'sobs', 'sock', 'soda', 'sofa', 'soft', 'soil', 'sold', 'sole', 'solo',
  'some', 'song', 'sons', 'soon', 'soot', 'sore', 'sort', 'soul', 'soup', 'sour',
  'sown', 'spam', 'span', 'spar', 'spat', 'sped', 'spin', 'spit', 'spot', 'spun',
  'spur', 'stab', 'stag', 'star', 'stay', 'stem', 'step', 'stew', 'stir', 'stop',
  'stow', 'stub', 'stud', 'stun', 'subs', 'such', 'suds', 'sued', 'sues', 'suit',
  'sulk', 'sung', 'sunk', 'suns', 'sure', 'surf', 'swab', 'swam', 'swan', 'swap',
  'swat', 'sway', 'swim', 'swum',
  'tabs', 'tack', 'tact', 'tags', 'tail', 'take', 'tale', 'talk', 'tall', 'tame',
  'tank', 'tape', 'taps', 'task', 'taut', 'taxi', 'teak', 'teal', 'team', 'tear',
  'teas', 'tell', 'temp', 'tend', 'tens', 'tent', 'term', 'tern', 'test', 'text',
  'than', 'that', 'thaw', 'thee', 'them', 'then', 'they', 'thin', 'this', 'thud',
  'thug', 'tick', 'tide', 'tidy', 'tied', 'tier', 'ties', 'tile', 'till', 'tilt',
  'time', 'tine', 'tins', 'tint', 'tiny', 'tips', 'tire', 'toad', 'toes', 'tofu',
  'toil', 'told', 'toll', 'tomb', 'tone', 'tong', 'took', 'tool', 'tops', 'tore',
  'torn', 'toss', 'tour', 'tows', 'town', 'toys', 'trap', 'tray', 'tree', 'trek',
  'trim', 'trio', 'trip', 'trod', 'trot', 'true', 'tsar', 'tuba', 'tube', 'tubs',
  'tuck', 'tuft', 'tugs', 'tune', 'turf', 'turn', 'tusk', 'twig', 'twin', 'twit',
  'type', 'typo',
  'ugly', 'undo', 'unit', 'unto', 'upon', 'urge', 'urns', 'used', 'user', 'uses',
  'vail', 'vain', 'vale', 'vane', 'vans', 'vase', 'vast', 'veal', 'veer', 'veil',
  'vein', 'vent', 'verb', 'very', 'vest', 'veto', 'vets', 'vial', 'vibe', 'vice',
  'view', 'vile', 'vine', 'visa', 'void', 'volt', 'vote', 'vows',
  'wade', 'wads', 'waft', 'wage', 'wags', 'waif', 'wail', 'wait', 'wake', 'walk',
  'wall', 'wand', 'wane', 'want', 'ward', 'ware', 'warm', 'warn', 'warp', 'wars',
  'wart', 'wary', 'wash', 'wasp', 'watt', 'wave', 'wavy', 'waxy', 'ways', 'weak',
  'weal', 'wean', 'wear', 'webs', 'weds', 'weed', 'week', 'weep', 'weft', 'weld',
  'well', 'welt', 'wend', 'went', 'wept', 'were', 'west', 'wets', 'wham', 'what',
   'when', 'whim', 'whip', 'whir', 'whom', 'wick', 'wide', 'wife', 'wigs',
  'wild', 'will', 'wilt', 'wily', 'wind', 'wine', 'wing', 'wink', 'wins', 'wipe',
  'wire', 'wiry', 'wise', 'wish', 'wisp', 'with', 'wits', 'woke', 'wolf', 'womb',
  'wont', 'wood', 'wool', 'word', 'wore', 'work', 'worm', 'worn', 'wove', 'wrap',
  'wren', 'writ',
  'yard', 'yarn', 'yawn', 'yeah', 'year', 'yell', 'yelp', 'yoga', 'yoke', 'yolk',
  'your', 'yowl',
  'zeal', 'zero', 'zest', 'zinc', 'zips', 'zone', 'zoom', 'zoos',
];

/** Both tiers as one Set, for O(1) validation. */
export const CURATED_EN_SHORT = new Set([...CURATED_EN_3, ...CURATED_EN_4]);

/** Length at and below which validation uses the curated list only. */
export const CURATED_MAX_LEN = 4;
