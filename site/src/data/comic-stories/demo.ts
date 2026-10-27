// Comic B demo for Matt (2026-10-02, "create a demo with what we have today"): every comic page made so far that reads as
// a page, played in the engine box by box with the approved balloons (2.1.0) and the song, in Issue #1's story order. None
// of these pages has passed the 95 gate yet; this is a preview, not published copy. noindex route /comics/demo/.
// Art (wiki/image-library/assets/scenes/comic-b/): pages/home-p1-v5-print.png (best page 1), calibration/calibration-
// xmen137-v8-print.png (best style lock, Codex 85), calibration-crisis-v1, calibration-darkseid-v1, calibration-spiderman33-v1.
// Box regions (`ar`) are detected from each page's paper gutters (recursive XY cut), as fractions of the page. Each box's
// `r` is its place in the window, edge to edge like every issue (Matt, 2026-10-04: "all be full screen ... scaling the
// boxes creating desktop and mobile views"); the portrait calibration pages are transposed into wide rows, each box kept
// near its region's shape, and phones reflow them like any issue.
import type { ComicStory } from './types';
import { retime } from './retime';

const X137 = [
  [0.0157, 0.0131, 0.9686, 0.2548],
  [0.0157, 0.2742, 0.2799, 0.4185],
  [0.3048, 0.2742, 0.2118, 0.4185],
  [0.5258, 0.2742, 0.4576, 0.4185],
  [0.0157, 0.6982, 0.3085, 0.2866],
  [0.3343, 0.6982, 0.3011, 0.2866],
  [0.6455, 0.6982, 0.3389, 0.2866],
] as const;
const x = (i: number) => [...X137[i]] as [number, number, number, number];

export const demoComic: ComicStory = retime({
  id: 'demo',
  issue: 0,
  title: 'The night shift.',
  bpm: 90,
  beats: 300,
  music: { src: '/audio/moire-epic-win.mp3', offset: 0.165, credit: 'Music: Epic Win by Moire', source: '', loop: { from: 16, to: 304 } },
  // The story (rewritten 2026-10-04 with references/storytelling.md; world: wiki/site/comic-story-world.md). One night in
  // the Keon Tower: chat writes a quote and a legal brief nobody checks, and an agent mails the wrong contract to every
  // customer. Matt makes Codex ask the people who own the work, and their answers become the second brain. Marco's quote
  // is the thread from the first page to the last.
  soundAssets: {"rooms":{"street":{"src":"/comic/sound/street-loop-v1.mp3","gain":1},"office":{"src":"/comic/sound/office-loop-v1.mp3","gain":1},"servers":{"src":"/comic/sound/servers-loop-v1.mp3","gain":1},"rain":{"src":"/comic/sound/rain-loop-v1.mp3","gain":1}}}, 
  scenes: [
    {
      id: 'p1', b: 0, l: 56, score: 0, room: 'office', title: 'Toronto. Thursday, 11:04 p.m.', art: '/comic/_lab/demo-p1',
      panels: [
        { at: 1, room: "office", r: [0, 0, 0.7, 0.35], ar: [0.0125, 0.02, 0.6792, 0.3217], alt: 'Marco on the late shift, phone in hand, laptops and coffee passed around him.', motion: {"preset":"push","strength":0.3,"beats":4}, balloons: [
          { at: 1, kind: 'place', state: 'narration', who: 'narrator', text: 'Toronto. The Keon Tower,\nKing Street West.\nThursday, 11:04 p.m.', x: 0.02, y: 0.05, w: 0.26 },
          { at: 4, kind: 'caption', characterIntro: true, state: 'narration', who: 'narrator', text: 'Marco Lemieux. Sales,\nfloor 31. He can\nclose anything.', x: 0.72, y: 0.05, w: 0.26 },
          {"at":4.5,"kind":"caption","sceneSetup":true,"state":"narration","who":"narrator","text":"Sittler Business Services builds\nand installs office spaces.\nGilmour & Clark needs\n200 desks. Marco must send\nthe quote tonight, before\nthey sign at nine tomorrow.","x":0.04,"y":0.95,"w":0.94},
        ] },
        { at: 10, room: "office", r: [0.7, 0, 0.3, 0.155], ar: [0.7005, 0.0232, 0.2799, 0.1532], alt: 'A burst: the phone rings.', sfx: [{ kind: 'buzz' }], balloons: [
          { at: 10.5, kind: 'speech', state: 'device', who: 'marco', text: 'Gilmour & Clark\nsign at nine.\nSend the quote.', x: 0.22, y: 0.14, w: 0.56, tail: [0.15, 0.95] },
        ] },
        { at: 16, room: "office", r: [0.7, 0.155, 0.3, 0.195], ar: [0.7005, 0.1865, 0.2799, 0.1552], alt: 'A coffee cup shaking in a hand.', balloons: [
          { at: 16.5, kind: 'caption', state: 'narration', who: 'narrator', text: 'Two hundred desks.\nOne number.', x: 0.03, y: 0.05, w: 0.6 },
        ] },
        { at: 21, room: "office", r: [0, 0.35, 0.28, 0.25], ar: [0.0177, 0.3528, 0.2654, 0.247], alt: 'Paper pours out of a filing cabinet.', sfx: [{ kind: 'paper' }], balloons: [
          { at: 21.5, kind: 'caption', state: 'narration', who: 'narrator', text: 'Everyone has chat now.\nHe asked it to\nwrite the quote.', x: 0.04, y: 0.05, w: 0.7 },
        ] },
        { at: 27, room: "office", r: [0.28, 0.35, 0.22, 0.25], ar: [0.2907, 0.3528, 0.2125, 0.247], alt: 'A hand reaches out of the paper.', balloons: [] },
        { at: 28.5, room: "office", r: [0.5, 0.35, 0.22, 0.25], ar: [0.5113, 0.3528, 0.2081, 0.247], alt: 'A phone shows a green check.', sfx: [{ kind: 'click' }], balloons: [
          { at: 29, kind: 'speech', state: 'device', who: 'narrator', text: 'Looks great!\nReady to send.', x: 0.08, y: 0.06, w: 0.5, tail: [0.62, 0.55] },
        ] },
        { at: 34, room: "office", r: [0.72, 0.35, 0.28, 0.25], ar: [0.7264, 0.3528, 0.2554, 0.247], alt: 'Marco half buried, typing.', sfx: [{ kind: 'keys' }], balloons: [
          { at: 34.5, kind: 'caption', state: 'narration', who: 'narrator', text: 'The rates were\ntwo years old.\nNobody checked.', x: 0.04, y: 0.05, w: 0.6 },
        ] },
        { at: 41, room: "office", r: [0, 0.6, 1, 0.4], ar: [0.0125, 0.6158, 0.975, 0.351], alt: 'A ball of paper rolls over Marco as he holds up the phone.', sfx: [{"kind":"whoosh","gain":0.5},{"kind":"sting","delay":1,"gain":0.45}], balloons: [
          { at: 42, kind: 'caption', state: 'narration', who: 'narrator', text: '11:58 p.m. Sent.\n$50,000 below cost.', x: 0.015, y: 0.06, w: 0.24 },
        ] },
      ],
    },
    {
      id: 'x137', b: 56, l: 56, score: 0, room: 'servers', title: 'Floor 28. 12:40 a.m.', art: '/comic/_lab/demo-x137',
      panels: [
        { at: 1, room: "servers", r: [0, 0, 0.6, 0.52], ar: x(0), alt: 'Dana and Claude in the server room at night.', motion: {"preset":"push","strength":0.3,"beats":4}, balloons: [
          { at: 1, kind: 'place', state: 'narration', who: 'narrator', text: 'Three floors down.\nBourque & Coffey LLP.\n12:40 a.m.', x: 0.015, y: 0.04, w: 0.22 },
          { at: 6, kind: 'caption', characterIntro: true, state: 'narration', who: 'narrator', text: 'Claude. An AI. It reads\neverything, and agrees\nwith everyone.', x: 0.68, y: 0.04, w: 0.3 },
          { at: 9, kind: 'speech', state: 'calm', who: 'claude', text: 'The brief is ready.\nForty citations.', x: 0.3, y: 0.3, w: 0.22, tail: [0.2, 0.45] },
        ] },
        { at: 14, room: "servers", r: [0.6, 0, 0.2, 0.52], ar: x(1), alt: 'Dana, close up, reading.', motion: {"preset":"push","strength":0.3,"beats":4}, balloons: [
          { at: 14, kind: 'caption', characterIntro: true, state: 'narration', who: 'narrator', text: 'Dana Dryden.\nLegal assistant.\nShe reads every\nfootnote.', x: 0.03, y: 0.78, w: 0.9 },
          { at: 14.5, kind: 'speech', state: 'calm', who: 'dana', text: "Case nine.\nIt doesn't\nexist.", x: 0.08, y: 0.04, w: 0.8, tail: [0.5, 0.45], em: "doesn't" },
        ] },
        { at: 20, room: "servers", r: [0.8, 0, 0.2, 0.52], ar: x(2), alt: 'Claude, stricken.', sfx: [{ kind: 'heartbeat' }], balloons: [
          { at: 20.5, kind: 'fear', state: 'fear', who: 'claude', text: 'I… wrote\nwhat you\nasked for.', x: 0.06, y: 0.04, w: 0.88, tail: [0.5, 0.42] },
        ] },
        { at: 26, room: "servers", r: [0, 0.52, 0.31, 0.48], ar: x(3), alt: 'The forged citation dissolves into light.', balloons: [
          { at: 26.5, kind: 'burst', state: 'shout', who: 'dana', text: 'Check them.\nAll forty!', x: 0.5, y: 0.04, w: 0.46 },
        ] },
        { at: 32, room: "office", r: [0.31, 0.52, 0.22, 0.48], ar: x(4), alt: 'Claude, head bowed.', balloons: [
          { at: 32.5, kind: 'thought', state: 'thought', who: 'claude', text: 'Who decides\nwhat is true?', x: 0.06, y: 0.05, w: 0.7, tail: [0.5, 0.6] },
        ] },
        { at: 39, room: "office", r: [0.53, 0.52, 0.22, 0.48], ar: x(5), alt: 'Claude on his knees among the papers.', balloons: [
          { at: 39.5, kind: 'caption', state: 'narration', who: 'narrator', text: 'Thirty-one real.\nNine invented.', x: 0.03, y: 0.04, w: 0.7 },
        ] },
        { at: 46, room: "office", r: [0.75, 0.52, 0.25, 0.48], ar: x(6), alt: 'The empty office, a last flash of light.', balloons: [
          { at: 46.5, kind: 'speech', state: 'offpanel', who: 'dana', text: 'Again. From\nthe sources.', x: 0.35, y: 0.06, w: 0.6, tail: [0.98, 0.35] },
        ] },
      ],
    },
    {
      id: 'crisis', b: 112, l: 56, room: 'servers', score: 0.1, title: 'Basement two. 2:07 a.m.', art: '/comic/_lab/demo-crisis',
      panels: [
        { at: 1, room: "servers", r: [0, 0, 0.5, 0.54], ar: [0.0166, 0.0104, 0.7523, 0.4793], alt: 'An agent in red armour breaks into pixels across a wall of screens.', sfx: [{ kind: 'alarm', gain: 0.4 }], balloons: [
          { at: 1, kind: 'place', state: 'narration', who: 'narrator', text: 'Basement two.\nThe server room.\n2:07 a.m.', x: 0.02, y: 0.04, w: 0.24 },
          { at: 3.5, kind: 'caption', characterIntro: true, state: 'narration', who: 'narrator', text: 'The rogue agent.\nSittler’s contract AI.\nIt sends without asking.', x: 0.3, y: 0.86, w: 0.5 },
        ] },
        { at: 9, room: "servers", r: [0.5, 0, 0.17, 0.54], ar: [0.7753, 0.0104, 0.209, 0.4793], alt: 'Screens and servers fly apart.', sfx: [{"kind":"glass","gain":0.5}], balloons: [
          { at: 9.5, kind: 'speech', state: 'calm', who: 'rogue', text: 'Contract\nupdated.\nSending to\nall customers.', x: 0.08, y: 0.04, w: 0.84, tail: [0.4, 0.45] },
        ] },
        { at: 16, room: "none", r: [0.67, 0, 0.33, 0.54], ar: [0.0157, 0.4959, 0.9687, 0.1499], alt: 'A lone figure stands in the wreckage.', balloons: [
          { at: 16.5, kind: 'caption', state: 'narration', who: 'narrator', text: 'Four hundred customers.\nThe wrong contract.', x: 0.03, y: 0.04, w: 0.6 },
        ] },
        { at: 22, room: "none", r: [0, 0.54, 0.19, 0.46], ar: [0.0157, 0.6512, 0.1878, 0.3329], alt: 'Broken monitors.', run: 'arrive', balloons: [] },
        { at: 23, room: "none", r: [0.19, 0.54, 0.18, 0.46], ar: [0.2081, 0.6512, 0.1657, 0.3322], alt: 'A hand on a keyboard.', sfx: [{ kind: 'keys', gain: 0.4 }], run: 'arrive', balloons: [] },
        { at: 24, room: "none", r: [0.37, 0.54, 0.19, 0.46], ar: [0.3785, 0.6506, 0.1565, 0.3322], alt: 'An ID badge on the floor.', run: 'arrive', balloons: [] },
        { at: 25, room: "none", r: [0.56, 0.54, 0.21, 0.46], ar: [0.5396, 0.6506, 0.2081, 0.3322], alt: 'Matt looks up.', run: 'arrive', motion: {"preset":"push","strength":0.3,"beats":4}, balloons: [
          { at: 25.5, kind: 'caption', characterIntro: true, state: 'narration', who: 'narrator', text: 'Matt. He helps companies\nbuild these systems.', x: 0.05, y: 0.04, w: 0.9 },
        ] },
        { at: 32, room: "none", r: [0.77, 0.54, 0.23, 0.46], ar: [0.7532, 0.6506, 0.2311, 0.3322], alt: 'The agent, a silhouette, arms raised in triumph.', balloons: [
          { at: 32.5, kind: 'speech', state: 'calm', who: 'rogue', text: 'Task\ncomplete.', x: 0.1, y: 0.05, w: 0.7, tail: [0.5, 0.45] },
        ] },
      ],
    },
    {
      id: 'darkseid', b: 168, l: 64, room: 'office', score: 0, title: 'Floor 31. 3:15 a.m.', art: '/comic/_lab/demo-darkseid',
      panels: [
        { at: 1, room: "office", r: [0, 0, 0.58, 0.52], ar: [0.0433, 0, 0.9116, 0.3052], alt: "Matt's hand stops an armoured hand reaching for the keyboard. Matt shouts.", sfx: [{"kind":"impact","gain":0.55}], motion: {"preset":"push","strength":0.3,"beats":4}, balloons: [
          { at: 1, kind: 'place', state: 'narration', who: 'narrator', text: 'Floor 31. 3:15 a.m.', x: 0.015, y: 0.82, w: 0.2 },
          { at: 3, kind: 'caption', characterIntro: true, state: 'narration', who: 'narrator', text: 'Codex. An AI that builds.\nExactly what it is told.', x: 0.62, y: 0.82, w: 0.32 },
          { at: 5.5, kind: 'burst', state: 'shout', who: 'matt', text: 'Stop!', x: 0.04, y: 0.08, w: 0.16 },
          { at: 7.5, kind: 'speech', state: 'calm', who: 'codex', text: 'I can fix\nall of it.\nNine seconds.', x: 0.3, y: 0.06, w: 0.2, tail: [0.75, 0.35] },
        ] },
        { at: 14, room: "office", r: [0.58, 0, 0.42, 0.22], ar: [0.0433, 0.3135, 0.9116, 0.1457], alt: 'Matt holds Codex back in the office as the ball of paper grows.', balloons: [
          { at: 14.5, kind: 'speech', state: 'calm', who: 'matt', text: 'Not yet.\nAsk them first.', x: 0.04, y: 0.08, w: 0.26, tail: [0.3, 0.7] },
        ] },
        { at: 20, room: "none", r: [0.58, 0.22, 0.42, 0.3], ar: [0.0442, 0.4655, 0.3674, 0.1858], alt: 'Matt, head bowed, thinking.', balloons: [
          { at: 20.5, kind: 'speech', state: 'offpanel', who: 'codex', text: 'Ask who?', x: 0.05, y: 0.06, w: 0.3, tail: [0.3, 0] },
        ] },
        { at: 26, room: "office", r: [0, 0.52, 0.3, 0.48], ar: [0.0442, 0.6581, 0.3665, 0.3349], alt: 'Morning: Matt and Codex look out over the floor, where people are at their desks.', balloons: [
          { at: 26.5, kind: 'place', state: 'narration', who: 'narrator', text: 'Friday, 8:00 a.m.', x: 0.04, y: 0.04, w: 0.5 },
          { at: 28.5, kind: 'speech', state: 'calm', who: 'matt', text: 'The people who\nown the work.', x: 0.45, y: 0.3, w: 0.5, tail: [0.6, 0.75] },
        ] },
        { at: 35, room: "street", r: [0.3, 0.52, 0.7, 0.48], ar: [0.4236, 0.4627, 0.5313, 0.5304], alt: 'The ball of paper rolls over the city.', balloons: [
          { at: 35.5, kind: 'caption', state: 'narration', who: 'narrator', text: 'At nine, Gilmour & Clark\nwould sign the quote.', x: 0.03, y: 0.04, w: 0.4 },
        ] },
      ],
    },
    {
      id: 'spider', b: 232, l: 64, room: 'rain', score: 0.12, rapid: true, title: 'Floor 31. Friday, 8:20 a.m.', art: '/comic/_lab/demo-spider',
      panels: [
        { at: 1, room: "rain", r: [0, 0, 0.33, 0.5], ar: [0.0083, 0, 0.4853, 0.2873], alt: 'Codex pinned under binders and boxes in the flooded office.', run: 'lift', balloons: [
          { at: 1, kind: 'place', state: 'narration', who: 'narrator', text: '8:20 a.m. Forty\nminutes to fix it.', x: 0.04, y: 0.05, w: 0.5 },
        ] },
        { at: 7, room: "rain", r: [0.33, 0, 0.34, 0.5], ar: [0.5064, 0.0014, 0.4862, 0.2852], alt: 'Codex pushes up.', sfx: [{ kind: 'impact', gain: 0.5 }], run: 'lift', balloons: [
          { at: 7.5, kind: 'speech', state: 'calm', who: 'marco', text: 'Show me the\nassumptions.\nAll of them.', x: 0.05, y: 0.04, w: 0.5, tail: [0.5, 0.6] },
        ] },
        { at: 14, room: "rain", r: [0.67, 0, 0.33, 0.5], ar: [0.0101, 0.2949, 0.4825, 0.317], alt: 'Codex strains under the weight.', run: 'lift', balloons: [
          { at: 14.5, kind: 'speech', state: 'calm', who: 'codex', text: 'Rate card,\n2024. Discount,\nassumed.', x: 0.05, y: 0.04, w: 0.5, tail: [0.4, 0.6] },
        ] },
        { at: 21, room: "rain", r: [0, 0.5, 0.33, 0.5], ar: [0.5064, 0.2949, 0.4834, 0.317], alt: 'Codex lifts the load.', run: 'lift', balloons: [
          { at: 21.5, kind: 'speech', state: 'calm', who: 'marco', text: "Wrong. Use\nthis year's. Ask\nme next time.", x: 0.05, y: 0.04, w: 0.55, tail: [0.5, 0.6] },
        ] },
        { at: 28, room: "rain", r: [0.33, 0.5, 0.34, 0.5], ar: [0.011, 0.6209, 0.4807, 0.3688], alt: 'Codex rises from the water.', run: 'lift', balloons: [
          { at: 28.5, kind: 'caption', state: 'narration', who: 'narrator', text: 'Every answer went into\none place: a second brain.\nEach one made him stronger.', x: 0.04, y: 0.04, w: 0.7 },
        ] },
        { at: 36, room: "rain", r: [0.67, 0.5, 0.33, 0.5], ar: [0.5046, 0.6215, 0.4843, 0.3681], alt: 'Codex stands, teal lines lit.', sfx: [{"kind":"sting","gain":0.45}], run: 'lift', balloons: [
          { at: 36.5, kind: 'caption', state: 'narration', who: 'narrator', text: '8:57 a.m. The real\nquote went out.', x: 0.04, y: 0.05, w: 0.7 },
          { at: 40, kind: 'caption', state: 'narration', who: 'narrator', text: 'The four hundred emails\ncould not be unsent.', x: 0.04, y: 0.78, w: 0.8 },
        ] },
      ],
    },
  ],
  next: { sound: { score: 0, room: 'none', fadeBeats: 1.5 }, b: 296, heading: 'More pages are being inked.', choices: [
    { label: 'Back to the shelf.', href: '/comics/', img: 'home-tower-night' },
  ] },
  collapseTo: '.cs-stage',
});
