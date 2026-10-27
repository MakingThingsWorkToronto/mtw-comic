// Comic B revision packet, 2026-10-08. Story-first continuity revision; artwork remains to be authored.
// Existing demo is unchanged. Method and review: external story-packet documentation.
import type { ComicStory } from './types';
import { retime } from './retime';

export const traditionalComic: ComicStory = retime({
  id: "traditional",
  issue: 3,
  title: "Who can open what.",
  bpm: 108,
  beats: 372,
  music: {"src":"/audio/pixabay-558083-dramatic-rock.mp3","offset":0.43,"credit":"Music: Dramatic Rock by Playsound","source":"https://pixabay.com/music/rock-dramatic-rock-558083/","loop":{"from":16,"to":192}},
  scenes: [
    {
      id: "locked",
      artCropInsetPct: 0,
      phonePages: [[{"img":"trad-dana-desk","r":[0.0,0.0,1.0,0.590909091]},{"img":"trad-invoices","r":[0.0,0.590909091,1.0,0.205965909]},{"img":"trad-partners-only","r":[0.0,0.796875,1.0,0.203125]}],[{"img":"trad-potvin-office","r":[0.0,0.0,1.0,0.201704545]},{"img":"trad-calendar","r":[0.0,0.201704545,1.0,0.595170455]},{"img":"trad-switch-on","r":[0.0,0.796875,1.0,0.203125]}]],
      art: "/comic/traditional/traditional-locked-20261008",
      b: 0,
      l: 60,
      title: "Monday, 8:52 a.m.",
      room: "office",
      villains: ["shelf"],
      panels: [
        { at: 1, r: [0,0,0.6,0.58], ar: [0.003153,0.00504,0.598361,0.528226], cropFocus: {"phone":[0.5,0.5]}, img: "trad-dana-desk", alt: "Wide: the small law office on floor 28 before nine, file rooms and binders, one window office; Dana in rectangular glasses and a grey jacket at her desk by the file room, pen in hand.", balloons: [
          {"at":1.5,"kind":"place","state":"narration","who":"narrator","text":"Toronto. The Keon Tower,\nfloor 28. Monday,\n7 December, 8:52 a.m.","x":0.015,"y":0.03,"w":0.3},
          {"at":3,"kind":"caption","characterIntro":true,"state":"narration","who":"narrator","text":"Dana Dryden. Legal assistant,\nBourque & Coffey.\nShe reads every footnote.","x":0.66,"y":0.74,"w":0.32},
        ] },
        { at: 17, r: [0.6,0,0.4,0.27], ar: [0.611602,0.00504,0.384615,0.25504], cropFocus: {"phone":[0.5,0.5]}, img: "trad-invoices", alt: "Close: Dana's pen circling the same line on a fan of invoices, the same hours on each.", sfx: [{"kind":"paper"}], balloons: [
          {"at":17.5,"kind":"caption","state":"narration","who":"narrator","text":"Last week she found\ntwelve invoices that billed\nthe same hours twice.","x":0.02,"y":0.05,"w":0.48},
          {"at":0,"kind":"speech","state":"calm","who":"dana","text":"The client paid twice.\nI can't leave this.","x":0.05,"y":0.65,"w":0.85,"tail":[0.48,0.72]},
        ] },
        { at: 26, r: [0.6,0.27,0.4,0.31], ar: [0.611602,0.274194,0.384615,0.259073], cropFocus: {"phone":[0.5,0.5]}, img: "trad-partners-only", alt: "Dana saves her duplicate-billing evidence in what she believes is the restricted partners’ folder. The folder shows an older sharing-link symbol separate from its ordinary members list; do not depict an actually sealed door defeated by AI magic.", sfx: [{"kind":"click"}], balloons: [
          {"at":26.5,"kind":"thought","state":"thought","who":"dana","text":"In the partners’ folder.\nOnly they should\nbe able to read it.","x":0.5,"y":0.08,"w":0.42,"tail":[0.22,0.62]},
        ] },
        { at: 32.5, r: [0,0.58,0.27,0.42], ar: [0.003153,0.547379,0.261034,0.446573], cropFocus: {"phone":[0.5,0.10251352]}, img: "trad-potvin-office", alt: "Across the floor, in a glass office: a sharp-suited man with rolled sleeves on the phone, laughing.", balloons: [
          {"at":33,"kind":"caption","characterIntro":true,"state":"narration","who":"narrator","text":"Ryan Potvin.\nSenior associate.\nThe hours were his.","x":0.03,"y":0.05,"w":0.6},
        ] },
        { at: 39.5, r: [0.27,0.58,0.2,0.42], ar: [0.272383,0.547379,0.193569,0.446573], cropFocus: {"phone":[0.5,0.5]}, img: "trad-calendar", alt: "Insert: a calendar on a screen, Friday 4:00 p.m. blocked: \"Billing review\".", balloons: [
          {"at":40,"kind":"caption","state":"narration","who":"narrator","text":"The partners would\nhear it Friday. Until\nthen, nobody knew.","x":0.04,"y":0.05,"w":0.88},
        ] },
        { at: 47.5, r: [0.47,0.58,0.53,0.42], ar: [0.474149,0.547379,0.522068,0.446573], cropFocus: {"phone":[0.5,0.91040814]}, img: "trad-switch-on", alt: "Every screen on the floor lights with the same cheerful assistant window; by the door, a stack of unopened licence boxes gathers dust.", sfx: [{"kind":"click","gain":0.5},{"kind":"sting","delay":1,"gain":0.4}], balloons: [
          {"at":48,"kind":"caption","state":"narration","who":"narrator","text":"9:00 a.m. The firm opened\nits AI assistant to everyone.\nThirty seats.","x":0.02,"y":0.05,"w":0.42},
        ] },
      ],
    },
    {
      id: "answer",
      artCropInsetPct: 0,
      phonePages: [[{"img":"trad-claude-grey","r":[0.0,0.0,1.0,0.601224432]},{"img":"trad-potvin-asks","r":[0.0,0.601224432,1.0,0.398775568]}],[{"img":"trad-claude-answers","r":[0.0,0.0,1.0,0.426193182]},{"img":"trad-potvin-still","r":[0.0,0.426193182,1.0,0.573806818]}],[{"img":"trad-claude-visor","r":[0.0,0.0,1.0,0.201704545]},{"img":"trad-potvin-face","r":[0.0,0.201704545,1.0,0.595170455]},{"img":"trad-doorway","r":[0.0,0.796875,1.0,0.203125]}]],
      art: "/comic/traditional/traditional-answer-20261008",
      b: 60,
      l: 48,
      title: "Monday, 4:40 p.m.",
      room: "office",
      villains: ["shadow"],
      panels: [
        { at: 1, r: [0,0,0.42,0.62], ar: [0.003153,0.00504,0.403531,0.594758], cropFocus: {"phone":[0.78897243,0.5]}, img: "trad-claude-grey", alt: "Potvin at his desk in the late light; out of his screen's glow stands a tall figure in a long coat of turning pages, its visor flat grey.", balloons: [
          {"at":1.5,"kind":"place","state":"narration","who":"narrator","text":"Floor 28, Potvin's office.\nMonday, 4:40 p.m.","x":0.02,"y":0.03,"w":0.42},
          {"at":3,"kind":"caption","characterIntro":true,"state":"narration","who":"narrator","text":"Claude. An AI. It reads\neverything, and agrees\nwith everyone.","x":0.56,"y":0.76,"w":0.42},
        ] },
        { at: 14.5, r: [0.42,0,0.25,0.36], ar: [0.41425,0.00504,0.247793,0.326613], cropFocus: {"phone":[0.5,0.5]}, img: "trad-potvin-asks", alt: "Medium: Potvin, screen left, leaning back, asking the screen.", sfx: [{"kind":"keys"}], balloons: [
          {"at":15,"kind":"speech","state":"calm","who":"potvin","text":"What's Friday's\nmeeting about?","x":0.36,"y":0.06,"w":0.58,"tail":[0.3,0.6]},
        ] },
        { at: 19, r: [0.67,0,0.33,0.36], ar: [0.668348,0.00504,0.326608,0.326613], cropFocus: {"phone":[0.5,0.5]}, img: "trad-claude-answers", alt: "Medium: Claude, screen right, polite, a page of the coat turning.", balloons: [
          {"at":19.5,"kind":"speech","state":"calm","who":"claude","text":"A billing review.\nTwelve of your\ninvoices.","x":0.06,"y":0.06,"w":0.5,"tail":[0.72,0.55]},
        ] },
        { at: 25.5, r: [0.42,0.36,0.2,0.26], ar: [0.41425,0.347782,0.206179,0.248992], cropFocus: {"phone":[0.22121401,0.5]}, img: "trad-potvin-still", alt: "Close: Potvin stops smiling.", balloons: [
          {"at":26,"kind":"speech","state":"calm","who":"potvin","text":"Who\nraised it?","x":0.45,"y":0.06,"w":0.5,"tail":[0.35,0.6]},
        ] },
        { at: 29.5, r: [0.62,0.36,0.38,0.26], ar: [0.627364,0.347782,0.366961,0.248992], cropFocus: {"phone":[0.5,0.5]}, img: "trad-claude-visor", alt: "Extreme close: Claude's grey visor, the complaint's first page reflected in it.", sfx: [{"kind":"sting","gain":0.6}], balloons: [
          {"at":30,"kind":"speech","state":"calm","who":"claude","text":"Dana Dryden. It's in\nthe partners' folder.","x":0.04,"y":0.08,"w":0.5,"tail":[0.7,0.5]},
        ] },
        { at: 36, r: [0,0.62,0.3,0.38], ar: [0.003153,0.609879,0.284363,0.382056], cropFocus: {"phone":[0.5,0.5]}, img: "trad-potvin-face", alt: "Close: Potvin's face lit from below by the screen, eyes on the name.", sfx: [{"kind":"heartbeat"}], balloons: [
        ] },
        { at: 37.5, r: [0.3,0.62,0.7,0.38], ar: [0.295082,0.609879,0.699874,0.382056], cropFocus: {"phone":[0.40764751,0.5]}, img: "trad-doorway", alt: "Silhouette: Potvin in solid black in his office doorway, against the lit floor; far across it, Dana at her desk, typing, not looking up.", sfx: [{"kind":"keys","gain":0.4}], balloons: [
          {"at":38,"kind":"caption","state":"narration","who":"narrator","text":"Forty feet away,\nDana was still\nat her desk.","x":0.015,"y":0.05,"w":0.22},
        ] },
      ],
    },
    {
      id: "link",
      artCropInsetPct: 0,
      phonePages: [[{"img":"trad-elevators","r":[0.0,0.0,1.0,0.241355114]},{"img":"trad-potvin-elevator","r":[0.0,0.241355114,1.0,0.434014205]},{"img":"trad-dana-eyes","r":[0.0,0.675369318,1.0,0.324630682]}],[{"img":"trad-dana-back","r":[0.0,0.0,1.0,0.377889205]},{"img":"trad-claude-link","r":[0.0,0.377889205,1.0,0.461289773]},{"img":"trad-second-office","r":[0.0,0.839178977,1.0,0.160821023]}]],
      art: "/comic/traditional/traditional-link-20261008",
      b: 108,
      l: 48,
      title: "Monday, 5:31 p.m.",
      room: "rain",
      score: 0.35,
      villains: ["shadow"],
      panels: [
        { at: 1, r: [0,0,0.36,0.55], ar: [0.003157,0.005035,0.35101,0.539778], cropFocus: {"phone":[0.5,0.44609636]}, img: "trad-elevators", alt: "Wide: the floor 28 elevator lobby, marble and dark windows; Dana in her coat waiting, Potvin walking up behind her with his coat over his arm.", sfx: [{"kind":"door","gain":0.4}], balloons: [
          {"at":1.5,"kind":"place","state":"narration","who":"narrator","text":"Floor 28, the elevators.\nMonday, 5:31 p.m.","x":0.02,"y":0.03,"w":0.5},
        ] },
        { at: 7.5, r: [0.36,0,0.24,0.55], ar: [0.364899,0.005035,0.238005,0.539778], cropFocus: {"phone":[0.5,0.18014404]}, img: "trad-potvin-elevator", alt: "Medium: Potvin at her shoulder, screen left, quiet, not looking at her.", balloons: [
          {"at":8,"kind":"speech","state":"calm","who":"potvin","text":"Twelve\ninvoices,\nDana?","x":0.4,"y":0.05,"w":0.54,"tail":[0.3,0.45]},
        ] },
        { at: 11.5, r: [0.6,0,0.16,0.55], ar: [0.611742,0.005035,0.120581,0.539778], cropFocus: {"phone":[0.5,0.52010393]}, img: "trad-dana-eyes", alt: "Tall close: Dana's eyes behind rectangular glasses as the elevator doors close between them.", sfx: [{"kind":"door"},{"kind":"heartbeat","delay":1}], balloons: [
        ] },
        { at: 13, r: [0.76,0,0.24,0.22], ar: [0.741162,0.005035,0.255051,0.24572], cropFocus: {"phone":[0.5,0.5]}, img: "trad-dana-back", alt: "Dana back at her desk in the dark office, coat still on, typing hard.", sfx: [{"kind":"keys"}], balloons: [
          {"at":13.5,"kind":"caption","state":"narration","who":"narrator","text":"6:02 p.m.","x":0.03,"y":0.05,"w":0.3},
          {"at":15,"kind":"speech","state":"calm","who":"dana","text":"Who can open\nmy complaint?","x":0.4,"y":0.2,"w":0.56,"tail":[0.3,0.8]},
        ] },
        { at: 21, r: [0.76,0.22,0.24,0.33], ar: [0.741162,0.26284,0.255051,0.281974], cropFocus: {"phone":[0.67753806,0.5]}, img: "trad-claude-link", alt: "Claude in the screen light, grey visor, holding up a single glowing thread.", balloons: [
          {"at":21.5,"kind":"speech","state":"calm","who":"claude","text":"Everyone at the firm.\nThrough a link\nmade in 2019.","x":0.45,"y":0.03,"w":0.53,"tail":[0.32,0.38]},
          {"at":23,"kind":"speech","state":"calm","who":"claude","text":"Its owner left\nin 2021.","x":0.04,"y":0.76,"w":0.7,"chain":false,"tail":[0.32,0.38]},
        ] },
        { at: 33.5, r: [0,0.55,1,0.45], ar: [0.003157,0.560926,0.993056,0.432024], cropFocus: {"phone":[0.57816377,0.5]}, phoneArt: [0,0.5,1,0.5], img: "trad-second-office", alt: "Splash: behind the office wall, a second office in violet dark: client files on shelves, threads of old links running out to personal drives, a laptop at someone's kitchen table, phones; Dana small in the foreground.", sfx: [{"kind":"sting","delay":0.5}], balloons: [
          {"at":34,"kind":"caption","state":"narration","who":"narrator","text":"Four hundred and twelve\nlinks like it. Nobody\nowned any of them.","x":0.015,"y":0.06,"w":0.22,"phone":{"x":0.02,"y":0.02,"w":0.94,"anchor":"free"}},
        ] },
      ],
    },
    {
      id: "closed",
      artCropInsetPct: 0,
      phonePages: [[{"img":"trad-codex-white","r":[0.0,0.0,1.0,0.316552557]},{"img":"trad-dana-orders","r":[0.0,0.316552557,1.0,0.683447443]}],[{"img":"trad-close-1","r":[0.0,0.0,1.0,1.0]}],[{"img":"trad-close-2","r":[0.0,0.0,0.577348066,0.409734375]},{"img":"trad-close-3","r":[0.577348066,0.0,0.422651934,0.409734375]},{"img":"trad-phones","r":[0.0,0.409734375,1.0,0.134943182]},{"img":"trad-closing","r":[0.0,0.544677557,1.0,0.201840909]},{"img":"trad-codex-literal","r":[0.0,0.746518466,1.0,0.253481534]}]],
      art: "/comic/traditional/traditional-closed-20261008",
      b: 156,
      l: 48,
      title: "Monday, 11:48 p.m.",
      room: "rain",
      villains: ["shadow"],
      panels: [
        { at: 1, r: [0,0,0.4,0.62], ar: [0.003783,0.006048,0.412358,0.476815], cropFocus: {"phone":[0.5,0.10849693]}, img: "trad-codex-white", alt: "Dana alone at her desk near midnight, rain on the window, the list of links on her screen; beside her stands a compact armoured figure, light running harsh white down its gauntlets.", balloons: [
          {"at":1.5,"kind":"place","state":"narration","who":"narrator","text":"Floor 28.\nMonday, 11:48 p.m.","x":0.02,"y":0.03,"w":0.32},
          {"at":3,"kind":"caption","characterIntro":true,"state":"narration","who":"narrator","text":"Codex. An AI that builds.\nExactly what it's told.","x":0.5,"y":0.8,"w":0.48},
        ] },
        { at: 13, r: [0.4,0,0.24,0.31], ar: [0.424968,0.006048,0.14691,0.397177], cropFocus: {"phone":[0.5,0.13899021]}, img: "trad-dana-orders", alt: "Close: Dana, jaw set, not looking up from the list.", balloons: [
          {"at":13.5,"kind":"speech","state":"calm","who":"dana","text":"Close them.\nAll of them.","x":0.4,"y":0.06,"w":0.55,"tail":[0.3,0.6]},
          {"at":0,"kind":"speech","state":"calm","who":"dana","text":"Before anything else\ngets out.","x":0.03,"y":0.82,"w":0.91,"tail":[0.62,0.77]},
        ] },
        { at: 18, r: [0.64,0,0.12,0.31], ar: [0.581967,0.006048,0.127364,0.397177], cropFocus: {"phone":[0.5,0.5]}, img: "trad-close-1", alt: "Codex begins disabling sharing links at Dana’s command. Both an old broad link and a current transaction link are visible in the same list; the problem is indiscriminate scope, not physical cables or walls being destroyed.", run: "close", sfx: [{"kind":"whoosh"}], balloons: [
        ] },
        { at: 19, r: [0.76,0,0.12,0.31], ar: [0.718159,0.006048,0.1343,0.397177], cropFocus: {"phone":[0.5,0.57877907]}, img: "trad-close-2", alt: "Step 2: violet threads snap, a dozen at once.", run: "close", sfx: [{"kind":"glass"}], balloons: [
        ] },
        { at: 20, r: [0.88,0,0.12,0.31], ar: [0.860656,0.006048,0.135561,0.397177], cropFocus: {"phone":[0.5,0.5]}, img: "trad-close-3", alt: "Step 3: Codex lowers the gauntlet; the screen shows the list, every line struck through.", run: "close", balloons: [
          {"at":20.5,"kind":"speech","state":"calm","who":"codex","text":"Done.\nNine seconds.","x":0.06,"y":0.05,"w":0.88,"tail":[0.5,0.6]},
        ] },
        { at: 24, r: [0.4,0.31,0.6,0.31], ar: [0.424968,0.419355,0.571248,0.214718], cropFocus: {"phone":[0.7767253,0.5]}, img: "trad-phones", alt: "Morning, wide: the floor full of staff, phones lit and ringing on every desk, screens showing \"Access denied\".", sfx: [{"kind":"ring"},{"kind":"ring","delay":1,"gain":0.5}], balloons: [
          {"at":24.5,"kind":"caption","state":"narration","who":"narrator","text":"Tuesday, 9:04 a.m.","x":0.015,"y":0.05,"w":0.24},
        ] },
        { at: 28, r: [0,0.62,0.58,0.38], ar: [0.003783,0.653226,0.551072,0.339718], cropFocus: {"phone":[0.5,0.5]}, img: "trad-closing", alt: "Dana at her desk with the phone to her ear, eyes shut; on her screen, a house deed that will not open.", balloons: [
          {"at":28.5,"kind":"caption","state":"narration","who":"narrator","text":"A house closing at noon.\nThe buyer's lawyer\ncould not open the deed.","x":0.015,"y":0.05,"w":0.3,"phone":{"x":0.015,"y":0.64,"w":0.58,"anchor":"free"}},
        ] },
        { at: 37.5, r: [0.58,0.62,0.42,0.38], ar: [0.564313,0.653226,0.431904,0.339718], cropFocus: {"phone":[0.5,0.95299904]}, img: "trad-codex-literal", alt: "Codex, screen right, unbothered, the white light still on its gauntlets.", balloons: [
          {"at":38,"kind":"speech","state":"calm","who":"codex","text":"You said\nall of them.","x":0.06,"y":0.08,"w":0.4,"tail":[0.62,0.55]},
        ] },
      ],
    },
    {
      id: "owner",
      artCropInsetPct: 0,
      phonePages: [[{"img":"trad-matt-arrives","r":[0.0,0.0,1.0,0.292701705]},{"img":"trad-dana-list","r":[0.0,0.292701705,1.0,0.707298295]}],[{"img":"trad-matt-asks","r":[0.0,0.0,0.577348066,0.30981392]},{"img":"trad-dana-pause","r":[0.577348066,0.0,0.422651934,0.30981392]},{"img":"trad-codex-offers","r":[0.0,0.30981392,0.577348066,0.340633523]},{"img":"trad-matt-turns","r":[0.577348066,0.30981392,0.422651934,0.340633523]},{"img":"trad-first-name","r":[0.0,0.650447443,1.0,0.349552557]}]],
      art: "/comic/traditional/traditional-owner-20261008",
      b: 204,
      l: 56,
      title: "Tuesday, 9:31 a.m.",
      room: "office",
      score: 0.5,
      villains: ["shadow"],
      panels: [
        { at: 1, r: [0,0,0.5,0.56], ar: [0.003153,0.00504,0.522699,0.487903], cropFocus: {"phone":[0.5,0.76231123]}, img: "trad-matt-arrives", alt: "Matt arrives in response to Dana’s call, black T-shirt and tortoiseshell glasses, holding her message on his phone. Dana meets him with the deed access problem; this is an invited consultation, not an unexplained entrance.", sfx: [{"kind":"door"}], balloons: [
          {"at":1.5,"kind":"place","state":"narration","who":"narrator","text":"Floor 28, the elevators.\nTuesday, 9:31 a.m.","x":0.015,"y":0.03,"w":0.34},
          {"at":3,"kind":"caption","characterIntro":true,"state":"narration","who":"narrator","text":"Matt. He builds these\nsystems for a living.","x":0.03,"y":0.86,"w":0.45},
          {"at":0,"kind":"speech","state":"calm","who":"dana","text":"Thanks for coming.\nWe need the deed\nbefore noon.","x":0.59,"y":0.04,"w":0.39,"tail":[0.67,0.44]},
        ] },
        { at: 13.5, r: [0.5,0,0.28,0.56], ar: [0.534678,0.00504,0.240858,0.487903], cropFocus: {"phone":[0.71404081,0.5]}, img: "trad-dana-list", alt: "Medium: Dana, screen right, holding up the list of links, every line struck through.", sfx: [{"kind":"paper","gain":0.5}], balloons: [
          {"at":14,"kind":"speech","state":"calm","who":"dana","text":"Four hundred links.\nI closed them all.\nNow nothing opens.","x":0.06,"y":0.05,"w":0.8,"tail":[0.6,0.6]},
        ] },
        { at: 21.5, r: [0.78,0,0.22,0.56], ar: [0.784994,0.00504,0.211854,0.487903], cropFocus: {"phone":[0.5,0.0374837]}, img: "trad-matt-asks", alt: "Close: Matt, screen left, reading the list, not the room.", balloons: [
          {"at":22,"kind":"speech","state":"calm","who":"matt","text":"Who owns\nthem?","x":0.3,"y":0.06,"w":0.62,"tail":[0.35,0.55]},
        ] },
        { at: 25.5, r: [0,0.56,0.22,0.44], ar: [0.003153,0.507056,0.20744,0.484879], cropFocus: {"phone":[0.5,0.98342541]}, img: "trad-dana-pause", alt: "Close: Dana lowers the list.", balloons: [
          {"at":26,"kind":"speech","state":"calm","who":"dana","text":"Nobody.\nThat's the\nproblem.","x":0.04,"y":0.76,"w":0.82,"tail":[0.51,0.48]},
        ] },
        { at: 30, r: [0.22,0.56,0.26,0.44], ar: [0.21942,0.507056,0.237705,0.484879], cropFocus: {"phone":[0.5,0.03773241], page: [0.5, 0] }, img: "trad-codex-offers", alt: "Codex steps in, gauntlets flaring white again.", balloons: [
          {"at":30.5,"kind":"speech","state":"calm","who":"codex","text":"I can reopen\nall of them.\nNine seconds.","x":0.42,"y":0.71,"w":0.55,"tail":[0.5,0.22]},
        ] },
        { at: 37, r: [0.48,0.56,0.2,0.44], ar: [0.466583,0.507056,0.178436,0.484879], cropFocus: {"phone":[0.5,0.26572188], page: [0.5, 0] }, img: "trad-matt-turns", alt: "Close: Matt raises one hand to Codex without looking away from Dana.", balloons: [
          {"at":37.5,"kind":"speech","state":"calm","who":"matt","text":"Then find out.\nOne at a time.","x":0.04,"y":0.76,"w":0.88,"tail":[0.48,0.35]},
        ] },
        { at: 43.5, r: [0.68,0.56,0.32,0.44], ar: [0.654477,0.507056,0.342371,0.484879], cropFocus: {"phone":[0.5,0.5]}, img: "trad-first-name", alt: "Dana writes a name beside the first line of the list; behind her, Codex's light turns teal and one floor of a dark lattice lights up behind him.", sfx: [{"kind":"click","delay":1}], balloons: [
          {"at":44,"kind":"caption","state":"narration","who":"narrator","text":"10:02 a.m.\nDana found the partner\nresponsible for the deed.","x":0.03,"y":0.05,"w":0.5,"phone":{"x":0.015,"y":0.02,"w":0.35,"anchor":"free"}},
        ] },
      ],
    },
    {
      id: "deed",
      artCropInsetPct: 0,
      phonePages: [[{"img":"trad-deed-call","r":[0.0,0.0,1.0,0.201704545]},{"img":"trad-deed-recipient","r":[0.0,0.201704545,1.0,0.506393466]},{"img":"trad-deed-test","r":[0.0,0.708098011,1.0,0.291901989]}],[{"img":"trad-deed-received","r":[0.0,0.0,1.0,0.590909091]},{"img":"trad-deed-breath","r":[0.0,0.590909091,1.0,0.205965909]},{"img":"trad-deed-list","r":[0.0,0.796875,1.0,0.203125]}]],
      art: "/comic/traditional/traditional-deed-20261008",
      b: 0,
      l: 0,
      room: "office",
      score: 0,
      panels: [
        { at: 0, r: [0,0,0.64,0.35], ar: [0.006305,0.009073,0.621059,0.345766], cropFocus: {"phone":[0.5,0.5]}, img: "trad-deed-call", alt: "Dana calls the current responsible partner beside Matt; the specific deed and the noon completion time are visible on the desk.", balloons: [
          {"at":0,"kind":"place","state":"narration","who":"narrator","text":"Floor 28. Tuesday,\n10:15 a.m.","x":0.05,"y":0.05,"w":0.52},
          {"at":0,"kind":"speech","state":"calm","who":"dana","text":"Who needs this deed?\nI'll restore only\nthat access.","x":0.05,"y":0.54,"w":0.46,"tail":[0.48,0.72]},
        ] },
        { at: 0, r: [0.64,0,0.36,0.35], ar: [0.636192,0.009073,0.357503,0.345766], cropFocus: {"phone":[0.17269087,0.5]}, img: "trad-deed-recipient", alt: "Dana writes down the responsible partner’s confirmation beside the intended external lawyer’s contact card.", balloons: [
          {"at":0,"kind":"caption","state":"narration","who":"narrator","text":"The responsible partner\nconfirmed the recipient.\nOne lawyer. One deed.","x":0.55,"y":0.04,"w":0.43,"phone":{"x":0.02,"y":0.02,"w":0.43,"anchor":"free"}},
        ] },
        { at: 0, r: [0,0.35,0.64,0.65], ar: [0.006305,0.367944,0.621059,0.620968], cropFocus: {"phone":[0.5,0.0747899]}, img: "trad-deed-test", alt: "Dominant panel: Codex creates the narrow permission while Dana checks the intended recipient can open the deed. A second view of an unrelated account remains refused. Matt watches without operating the controls.", balloons: [
          {"at":0,"kind":"speech","state":"calm","who":"codex","text":"The lawyer can open it.\nAn unrelated account\ncannot.","x":0.02,"y":0.35,"w":0.44,"tail":[0.27,0.2]},
          {"at":0,"kind":"speech","state":"calm","who":"dana","text":"Send the checked link.","x":0.75,"y":0.82,"w":0.24,"tail":[0.84,0.41],"phone":{"x":0.75,"y":0.82,"w":0.24,"tail":[0.84,0.41],"anchor":"free"}},
        ] },
        { at: 0, r: [0.64,0.35,0.36,0.2], ar: [0.636192,0.367944,0.357503,0.195565], cropFocus: {"phone":[0.31205398,0.5]}, img: "trad-deed-received", alt: "Dana receives confirmation from the lawyer, phone beside the specific deed reference.", sfx: [{"kind":"buzz","gain":0.3}], balloons: [
          {"at":0,"kind":"speech","state":"device","who":"narrator","text":"Received.\nWe can complete\nat noon.","x":0.05,"y":0.05,"w":0.88,"tail":[0.48,0.72]},
        ] },
        { at: 0, r: [0.64,0.55,0.36,0.25], ar: [0.636192,0.576613,0.357503,0.21371], cropFocus: {"phone":[0.94688923,0.5]}, img: "trad-deed-breath", alt: "Dana exhales at her desk, fingers loosening on the pen; an unresolved-link list still lies beside the successful deed.", balloons: [
          {"at":0,"kind":"caption","state":"narration","who":"narrator","text":"One closing saved.\nThe rest still\nneeded owners.","x":0.46,"y":0.03,"w":0.51},
        ] },
        { at: 0, r: [0.64,0.8,0.36,0.2], ar: [0.636192,0.803427,0.357503,0.185484], cropFocus: {"phone":[0.5,0.5]}, img: "trad-deed-list", alt: "Dana marks the deed’s owner and recipient decision on the review list and starts the next row.", balloons: [
          {"at":0,"kind":"speech","state":"calm","who":"dana","text":"Next link.\nWho answers\nfor this one?","x":0.05,"y":0.05,"w":0.78,"tail":[0.48,0.72]},
        ] },
      ],
    },
    {
      id: "owners",
      artCropInsetPct: 0,
      phonePages: [[{"img":"trad-door-to-door","r":[0.0,0.0,1.0,0.628017045]},{"img":"trad-owner-points","r":[0.0,0.628017045,1.0,0.371982955]}],[{"img":"trad-claude-teal","r":[0.0,0.0,1.0,0.458909091]},{"img":"trad-codex-teal","r":[0.0,0.458909091,1.0,0.541090909]}],[{"img":"trad-lattice","r":[0.0,0.0,1.0,0.477646307]},{"img":"trad-dana-gate","r":[0.0,0.477646307,1.0,0.522353693]}]],
      art: "/comic/traditional/traditional-owners-20261008",
      b: 260,
      l: 60,
      rapid: true,
      title: "Tuesday to Thursday.",
      room: "office",
      score: 0.8,
      villains: ["shadow"],
      panels: [
        { at: 1, r: [0,0,0.33,0.5], ar: [0.005044,0.006048,0.327238,0.485887], cropFocus: {"phone":[0.5181528,0.5]}, img: "trad-door-to-door", alt: "Dana at a partner's office door with the list and a pen; behind her Claude, its visor now teal.", sfx: [{"kind":"door","gain":0.4}], balloons: [
          {"at":1.5,"kind":"place","state":"narration","who":"narrator","text":"Floor 28.\nTuesday to Thursday.","x":0.02,"y":0.03,"w":0.42},
          {"at":3,"kind":"speech","state":"calm","who":"dana","text":"This link. Yours?\nWho needs it?","x":0.4,"y":0.42,"w":0.56,"tail":[0.3,0.75]},
        ] },
        { at: 11.5, r: [0.33,0,0.34,0.5], ar: [0.34111,0.006048,0.320933,0.485887], cropFocus: {"phone":[0.5,0.37343211]}, img: "trad-owner-points", alt: "A current practice lead accepts responsibility for a link whose creator has left. Dana records the new owner next to the old creation history; do not draw the departed creator returning to approve it.", balloons: [
          {"at":12,"kind":"caption","state":"narration","who":"narrator","text":"A current owner\nwas found or appointed\nfor every link.","x":0.03,"y":0.05,"w":0.5},
        ] },
        { at: 19.5, r: [0.67,0,0.33,0.5], ar: [0.671501,0.006048,0.323455,0.485887], cropFocus: {"phone":[0.5,0.96119099]}, img: "trad-claude-teal", alt: "Claude, visor teal, writes an owner's name onto a page of its coat; behind it a dark lattice of floors, three of them lit teal.", balloons: [
          {"at":20,"kind":"speech","state":"calm","who":"claude","text":"Complaint: Dana\nand three partners.\nConfirmed.","x":0.5,"y":0.03,"w":0.46,"tail":[0.34,0.27]},
        ] },
        { at: 24.5, r: [0,0.5,0.33,0.5], ar: [0.005044,0.509073,0.327238,0.482863], cropFocus: {"phone":[0.60182584,0.5]}, img: "trad-codex-teal", alt: "Codex, gauntlets teal now, closes one thread with care while its owner watches.", sfx: [{"kind":"click"}], balloons: [
          {"at":25,"kind":"speech","state":"calm","who":"codex","text":"Broad link closed.\nApproved access kept.\nOwner told.","x":0.04,"y":0.74,"w":0.58,"tail":[0.36,0.19]},
        ] },
        { at: 29, r: [0.33,0.5,0.34,0.5], ar: [0.34111,0.509073,0.320933,0.482863], cropFocus: {"phone":[0.5,0.86493265]}, img: "trad-lattice", alt: "Wide: the lattice behind Claude and Codex rises like the tower's double, dozens of floors lit teal, more lighting as people answer.", balloons: [
          {"at":29.5,"kind":"speech","state":"calm","who":"claude","text":"The decision stays\nwith its owner\nand review date.","x":0.04,"y":0.05,"w":0.6,"tail":[0.5,0.65]},
          {"at":31,"kind":"speech","state":"calm","who":"claude","text":"A second brain.","x":0.36,"y":0.32,"w":0.4,"chain":true},
        ] },
        { at: 38.5, r: [0.67,0.5,0.33,0.5], ar: [0.671501,0.509073,0.323455,0.482863], cropFocus: {"phone":[0.5,0.5]}, img: "trad-dana-gate", alt: "Dana at her desk, the list under her hand, Codex waiting at her side for her nod; Matt at the edge of the frame.", balloons: [
          {"at":39,"kind":"speech","state":"calm","who":"dana","text":"Nothing changes\nuntil its owner\nsays yes.","x":0.04,"y":0.05,"w":0.5,"tail":[0.35,0.6]},
          {"at":40.5,"kind":"speech","state":"calm","who":"matt","text":"That's the gate.\nYou hold it.","x":0.48,"y":0.42,"w":0.48,"tail":[0.92,0.75]},
          {"at":42,"kind":"caption","state":"narration","who":"narrator","text":"Thursday, 6:10 p.m.\nEvery link had a name.","x":0.03,"y":0.8,"w":0.6},
        ] },
      ],
    },
    {
      id: "friday",
      artCropInsetPct: 0,
      phonePages: [[{"img":"trad-boardroom","r":[0,0,1,0.2]},{"img":"trad-potvin-looks","r":[0,0.2,0.544712707,0.54]},{"img":"trad-dana-sits","r":[0.544712707,0.2,0.455287293,0.54]},{"img":"trad-two-hands","r":[0,0.74,1,0.26]}],[{"img":"trad-dana-asks","r":[0,0,0.571016575,0.496453125]},{"img":"trad-claude-answers-right","r":[0.571016575,0,0.428983425,0.496453125]},{"img":"trad-window","r":[0,0.496453125,1,0.503546875]}]],
      art: "/comic/traditional/traditional-friday-20261008",
      b: 320,
      l: 48,
      title: "Friday, 3:58 p.m.",
      room: "rain",
      score: 0.4,
      panels: [
        { at: 1, r: [0,0,0.56,0.5], ar: [0.001892,0.003024,0.552333,0.47379], cropFocus: {"phone":[0.5,0.5]}, img: "trad-boardroom", alt: "Wide: the boardroom, rain on the window, two partners at the head of the long table, Potvin seated on the left; Dana in the doorway on the right with a folder and her pen.", sfx: [{"kind":"door","gain":0.4}], balloons: [
          {"at":1.5,"kind":"place","state":"narration","who":"narrator","text":"Floor 28, the boardroom.\nFriday, 3:58 p.m.","x":0.015,"y":0.03,"w":0.3},
        ] },
        { at: 7.5, r: [0.56,0,0.2,0.5], ar: [0.56116,0.003024,0.162673,0.47379], cropFocus: {"phone":[0.5,0.26164607]}, img: "trad-potvin-looks", alt: "Close: Potvin, screen left, looks up at her. He already knows.", sfx: [{"kind":"heartbeat"}], balloons: [
        ] },
        { at: 9, r: [0.76,0,0.24,0.5], ar: [0.730769,0.003024,0.266709,0.47379], cropFocus: {"phone":[0.67375887,0.5]}, phoneArt: [0,0,1,0.49], img: "trad-dana-sits", alt: "Dana, screen right, sits and fans the twelve invoices across the table.", sfx: [{"kind":"paper"}], balloons: [
          {"at":9.5,"kind":"speech","state":"calm","who":"dana","text":"Twelve invoices.\nI'll take you\nthrough them.","x":0.06,"y":0.05,"w":0.84,"tail":[0.6,0.55],"phone":{"x":0.03,"y":0.5,"w":0.94,"tail":[0.44,0.4],"anchor":"free"}},
          {"at":0,"kind":"thought","state":"thought","who":"dana","text":"He already knows.\nThe clients still\ndeserve an answer.","x":0.6,"y":0.65,"w":0.36,"tail":[0.6,0.55],"phone":{"x":0.03,"y":0.72,"w":0.94,"tail":[0.98,0.7],"anchor":"free"}},
        ] },
        { at: 15.5, r: [0,0.5,0.3,0.5], ar: [0.001892,0.489919,0.294451,0.506048], cropFocus: {"phone":[0.5,0.95361155]}, phoneArt: [0,0.3,1,0.7], img: "trad-two-hands", alt: "Close, from above: Potvin's hand flat on the table, Dana's pen on the invoices, the gap between them.", balloons: [
          {"at":16,"kind":"caption","state":"narration","who":"narrator","text":"He had known since Monday.\nNo owner could\nundo that.","x":0.03,"y":0.05,"w":0.6,"phone":{"x":0.02,"y":0.02,"w":0.94,"anchor":"free"}},
        ] },
        { at: 23.5, r: [0.3,0.5,0.18,0.5], ar: [0.303279,0.489919,0.168979,0.506048], cropFocus: {"phone":[0.5,0.5]}, img: "trad-dana-asks", alt: "Evening: Dana back at her desk, the floor empty, typing.", sfx: [{"kind":"keys"}], balloons: [
          {"at":24,"kind":"caption","state":"narration","who":"narrator","text":"5:40 p.m.","x":0.04,"y":0.04,"w":0.5},
          {"at":25.5,"kind":"speech","state":"calm","who":"dana","text":"Who can open\nmy complaint?","x":0.07,"y":0.74,"w":0.88,"tail":[0.39,0.4]},
        ] },
        { at: 31.5, r: [0.48,0.5,0.2,0.5], ar: [0.481084,0.489919,0.178436,0.506048], cropFocus: {"phone":[0.94732554,0.5]}, img: "trad-claude-answers-right", alt: "Claude in the screen light, visor teal, a page of its coat showing three names.", balloons: [
          {"at":32,"kind":"speech","state":"calm","who":"claude","text":"Three partners.\nAnd you.","x":0.04,"y":0.36,"w":0.89,"tail":[0.57,0.2]},
        ] },
        { at: 36, r: [0.68,0.5,0.32,0.5], ar: [0.667718,0.489919,0.32976,0.506048], cropFocus: {"phone":[1,0.5]}, img: "trad-window", alt: "Dana at the window of the dark office, King Street West below in the rain; behind her, across the floor, Potvin's office light is still on.", balloons: [
          {"at":36.5,"kind":"caption","state":"narration","who":"narrator","text":"Some things\ncan't be unread.","x":0.03,"y":0.05,"w":0.5},
        ] },
      ],
    },
  ],
  next: {"b":368,"heading":"Winter, under King Street West.","choices":[{"label":"Eight weeks to leave a system older than the web.","href":"/data-migrations-b/","img":"trad-next-dana"},{"label":"Sam. The training records are gone.","href":"/agentic-systems-b/","img":"trad-next-sam"},{"label":"Find out who can open what.","href":"/traditional-systems/roles-access-control/","img":"trad-hands-map"},{"label":"Get governance ready before the assistant reads it.","href":"/traditional-systems/information-governance-ai-readiness/","img":"trad-dana-label"}]},
  collapseTo: ".page-art",
});
