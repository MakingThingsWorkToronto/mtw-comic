import { buildHomeAtlasProjectionRepairs } from './home-atlas-projection';
import type { ComicStory, ComicSpeakerAnchors, CastId, Rect } from './types';
import { applyHomeProjection } from './home-projection';

// Reviewed against the actual Home source crops, 13 October 2026.
// Coordinates describe the pictured mouth and head, not the balloon's old box.
type Head = [number, number, number, number, number, number];
const heads: Record<string, Partial<Record<CastId, Head>>> = {
  'home-marco-desk': {marco:[.53,.43,.39,.09,.28,.39]},
  'home-marco-grin': {marco:[.53,.46,.37,.06,.28,.48]},
  'home-marco-types': {marco:[.18,.28,0,.02,.36,.42]},
  'home-marco-reads': {marco:[.54,.62,.07,.02,.83,.73]},
  'home-marco-coat': {marco:[.57,.35,.49,.06,.2,.31]},
  'home-elevator-go': {marco:[.42,.33,.29,.04,.29,.43]},
  'home-dana-office': {marco:[.13,.32,.05,.12,.17,.27],dana:[.45,.72,.37,.47,.17,.28],claude:[.8,.29,.7,.1,.2,.29]},
  'home-dana-reads': {dana:[.2,.53,.03,.3,.35,.36],claude:[.85,.24,.73,.02,.26,.32],marco:[.49,.23,.4,.07,.2,.26]},
  'home-claude-stricken': {claude:[.51,.4,.33,.08,.35,.4]},
  'home-thirty-one': {claude:[.52,.26,.37,.04,.31,.27]},
  'home-marco-doorway': {marco:[.3,.27,.18,.02,.25,.3],dana:[.65,.58,.56,.34,.21,.33]},
  'home-call-alert': {marco:[.4,.4,.25,.05,.29,.43],dana:[.72,.4,.61,.05,.25,.42]},
  'home-call-wrong': {marco:[.23,.36,.09,.03,.29,.39],dana:[.9,.35,.72,.02,.28,.5]},
  'home-call-support': {marco:[.34,.42,.2,.05,.29,.43],dana:[.75,.43,.63,.03,.25,.46]},
  'home-call-matt': {matt:[.43,.44,.26,.04,.36,.46]},
  'home-rogue-screens': {marco:[.24,.21,.14,.1,.17,.15],dana:[.43,.22,.34,.1,.17,.15],matt:[.58,.23,.49,.11,.17,.16],rogue:[.62,.41,.4,.27,.43,.22]},
  'home-rogue-speaks': {rogue:[.13,.3,0,.02,.3,.36]},
  'home-cable-pull': {matt:[.25,.37,.1,.01,.26,.48],marco:[.88,.37,.73,.02,.27,.48]},
  'home-screens-dark': {rogue:[.7,.23,.58,.03,.23,.28]},
  'home-matt-rises': {matt:[.26,.35,.09,.04,.32,.44],marco:[.83,.44,.65,.05,.34,.54]},
  'home-marco-admits': {matt:[.15,.43,0,.11,.24,.48],marco:[.38,.42,.27,.08,.22,.41],dana:[.83,.49,.73,.17,.24,.36],rogue:[.62,.38,.54,.13,.13,.26]},
  'home-codex-reaches': {codex:[.37,.29,.25,.08,.22,.25],marco:[.65,.45,.56,.26,.2,.26]},
  'home-matt-stops': {matt:[.28,.58,.12,.03,.29,.64],codex:[.81,.29,.7,.02,.23,.31]},
  'home-codex-literal': {codex:[.31,.6,.08,.03,.41,.64],marco:[.87,.5,.7,.03,.3,.62]},
  'home-matt-close': {matt:[.57,.64,.06,.02,.84,.73]},
  'home-codex-asks': {codex:[.48,.15,.43,.03,.12,.15]},
  'home-matt-points': {matt:[.27,.33,.11,.02,.3,.45],marco:[.56,.35,.45,.06,.21,.37],dana:[.81,.35,.73,.08,.21,.36]},
  'home-codex-asks-rate': {codex:[.23,.43,.02,.14,.38,.34],marco:[.74,.39,.64,.19,.26,.28]},
  'home-marco-answers-rate': {codex:[.2,.38,0,.02,.39,.41],marco:[.73,.28,.55,.01,.33,.32]},
  'home-codex-discount': {codex:[.48,.52,.31,.25,.35,.35]},
  'home-marco-nobody': {marco:[.56,.31,.37,.01,.4,.35]},
  'home-marco-labour': {marco:[.46,.35,.22,.06,.43,.42]},
  'home-dana-claude-rule': {dana:[.39,.43,.24,.21,.31,.32],claude:[.74,.49,.58,.23,.42,.39]},
  'home-process-procedure': {matt:[.18,.7,.1,.45,.23,.3],marco:[.45,.31,.37,.13,.17,.23]},
  'home-process-source-rule': {dana:[.2,.47,.07,.13,.28,.4],matt:[.86,.49,.73,.13,.27,.42]},
  'home-brain-initialize': {matt:[.29,.54,.19,.31,.23,.29]},
  'home-process-connect': {claude:[.19,.28,.12,.08,.14,.22],codex:[.65,.28,.56,.08,.17,.23],matt:[.35,.7,.22,.42,.3,.37]},
  'home-process-output': {codex:[.36,.51,.27,.29,.22,.25],marco:[.62,.63,.55,.44,.16,.25],matt:[.67,.33,.6,.13,.16,.23],claude:[.4,.29,.34,.12,.14,.19]},
  'home-process-permissions': {matt:[.34,.48,.11,.11,.48,.45]},
  'home-process-refusal': {codex:[.34,.19,.25,.05,.21,.2],marco:[.74,.46,.49,.26,.5,.35]},
  'home-floors-light': {claude:[.14,.24,.08,.05,.13,.22],codex:[.87,.28,.79,.08,.14,.24],matt:[.34,.56,.25,.37,.19,.25]},
  'home-lobby': {ruth:[.23,.42,.13,.23,.19,.24],marco:[.48,.44,.37,.25,.19,.25],sam:[.73,.41,.63,.24,.2,.23]},
  'home-ruth': {ruth:[.39,.34,.09,.02,.61,.38],marco:[.95,.22,.8,.01,.2,.31]},
  'home-sam': {sam:[.65,.38,.39,.05,.52,.4]},
  'home-marco-sorry': {marco:[.47,.4,.23,.04,.47,.42]},
  'home-ruth-confirm': {ruth:[.55,.59,.03,.02,.95,.67]},
  'home-floors-12-19': {marco:[.28,.48,.16,.24,.24,.29],ruth:[.53,.52,.42,.29,.2,.27],sam:[.8,.5,.69,.27,.21,.26]},
  'home-quote-rebuilt': {codex:[.31,.19,.23,.05,.19,.21],marco:[.7,.4,.6,.21,.21,.26]},
  'home-marco-ticks': {marco:[.68,.36,.45,.05,.44,.37],codex:[.26,.3,.06,.04,.33,.31]},
  'home-marco-calls': {marco:[.38,.27,.26,.05,.21,.25],codex:[.73,.19,.64,.02,.18,.24]},
  'home-phone-client': {marco:[.62,.68,.08,.02,.83,.75]},
  'home-roof': {marco:[.11,.5,.04,.41,.14,.14],matt:[.32,.51,.23,.41,.17,.17],codex:[.84,.42,.78,.33,.14,.15]},
  'home-marco-tired': {marco:[.25,.4,.1,.16,.31,.32],matt:[.68,.36,.52,.1,.3,.34]},
  'home-brain-rises': {marco:[.15,.52,.09,.37,.17,.2],matt:[.33,.5,.27,.35,.17,.21],codex:[.57,.51,.49,.37,.14,.16],claude:[.81,.48,.73,.34,.16,.17]},
  'home-codex-teal': {codex:[.43,.38,.29,.2,.31,.24]},
  'home-claude-teal': {claude:[.48,.13,.4,.05,.16,.14]},
  'home-matt-names': {matt:[.28,.57,.12,.36,.34,.28]},
  'home-monday-floor': {marco:[.5,.45,.34,.22,.37,.3]},
  'home-marco-turns': {marco:[.27,.4,.14,.25,.27,.23],codex:[.72,.2,.61,.04,.23,.22]},
  'home-codex-lists': {codex:[.37,.28,.26,.1,.25,.24]},
  'home-apology-letters': {marco:[.61,.4,.4,.16,.42,.3]},
  'home-matt-door': {matt:[.66,.31,.46,.09,.31,.29]},
};

const reviewedSources: Record<string, {src: string; ar: Rect}> = {
  "home-tower-night": {
    "src": "/comic/home/home-regeneration-20261011/quote/v2/master-v2-1600.webp",
    "ar": [
      0.005980861244019139,
      0.008501594048884165,
      0.32894736842105265,
      0.48352816153028694
    ]
  },
  "home-marco-desk": {
    "src": "/comic/home/home-regeneration-20261011/quote/v2/master-v2-1600.webp",
    "ar": [
      0.3415071770334928,
      0.008501594048884165,
      0.3660287081339713,
      0.48352816153028694
    ]
  },
  "home-phone-ring": {
    "src": "/comic/home/home-regeneration-20261011/quote/v2/master-v2-1600.webp",
    "ar": [
      0.715311004784689,
      0.008501594048884165,
      0.27870813397129185,
      0.21253985122210414
    ]
  },
  "home-marco-grin": {
    "src": "/comic/home/home-regeneration-20261011/quote/v2/master-v2-1600.webp",
    "ar": [
      0.715311004784689,
      0.22954303931987247,
      0.27870813397129185,
      0.2624867162592986
    ]
  },
  "home-marco-types": {
    "src": "/comic/home/home-regeneration-20261011/quote/v2/master-v2-1600.webp",
    "ar": [
      0.005980861244019139,
      0.5037194473963869,
      0.17404306220095694,
      0.48459086078639746
    ]
  },
  "home-chat-ok": {
    "src": "/comic/home/home-regeneration-20261011/quote/v2/master-v2-1600.webp",
    "ar": [
      0.1854066985645933,
      0.5037194473963869,
      0.16566985645933013,
      0.48459086078639746
    ]
  },
  "home-send": {
    "src": "/comic/home/home-regeneration-20261011/quote/v2/master-v2-1600.webp",
    "ar": [
      0.35586124401913877,
      0.5037194473963869,
      0.6381578947368421,
      0.48459086078639746
    ]
  },
  "home-marco-coat": {
    "src": "/comic/home/home-regeneration-20261011/doubt/v2/master-v2-1600.webp",
    "ar": [
      0.005980861244019139,
      0.008501594048884165,
      0.5005980861244019,
      0.45164718384697133
    ]
  },
  "home-reply-email": {
    "src": "/comic/home/home-regeneration-20261011/doubt/v2/master-v2-1600.webp",
    "ar": [
      0.5131578947368421,
      0.008501594048884165,
      0.22966507177033493,
      0.45164718384697133
    ]
  },
  "home-marco-reads": {
    "src": "/comic/home/home-regeneration-20261011/doubt/v2/master-v2-1600.webp",
    "ar": [
      0.7494019138755981,
      0.008501594048884165,
      0.2446172248803828,
      0.45164718384697133
    ]
  },
  "home-ratecard-close": {
    "src": "/comic/home/home-regeneration-20261011/doubt/v2/master-v2-1600.webp",
    "ar": [
      0.005980861244019139,
      0.4729011689691817,
      0.29545454545454547,
      0.5154091392136025
    ]
  },
  "home-marco-silhouette": {
    "src": "/comic/home/home-regeneration-20261011/doubt/v2/master-v2-1600.webp",
    "ar": [
      0.30861244019138756,
      0.4729011689691817,
      0.3588516746411483,
      0.5154091392136025
    ]
  },
  "home-chat-again": {
    "src": "/comic/home/home-regeneration-20261011/doubt/v2/master-v2-1600.webp",
    "ar": [
      0.6752392344497608,
      0.4729011689691817,
      0.3187799043062201,
      0.21679064824654623
    ]
  },
  "home-elevator-go": {
    "src": "/comic/home/home-regeneration-20261011/doubt/v2/master-v2-1600.webp",
    "ar": [
      0.6752392344497608,
      0.7024442082890542,
      0.3187799043062201,
      0.2858660998937301
    ]
  },
  "home-dana-office": {
    "src": "/comic/home/scenes-20261012/home-dana-office-base.webp",
    "ar": [
      0,
      0,
      1,
      0.75
    ]
  },
  "home-dana-reads": {
    "src": "/comic/home/home-regeneration-20261011/brief/v1/reading-v1-1600.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-claude-stricken": {
    "src": "/comic/home/scenes-20261012/home-claude-stricken-base.webp",
    "ar": [
      0,
      0,
      1,
      0.86
    ]
  },
  "home-citation-dissolves": {
    "src": "/comic/home/home-regeneration-20261011/brief/v3/master-v3-1600.webp",
    "ar": [
      0.005980861244019139,
      0.5356004250797024,
      0.30023923444976075,
      0.4527098831030818
    ]
  },
  "home-thirty-one": {
    "src": "/comic/home/scenes-20261012/home-thirty-one-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-marco-doorway": {
    "src": "/comic/home/home-regeneration-20261011/brief/v3/master-v3-1600.webp",
    "ar": [
      0.5532296650717703,
      0.5356004250797024,
      0.4407894736842105,
      0.4527098831030818
    ]
  },
  "home-call-alert": {
    "src": "/comic/home/home-regeneration-20261011/call/v1/master-v1-1600.webp",
    "ar": [
      0.005980861244019139,
      0.008501594048884165,
      0.5825358851674641,
      0.47502656748140276
    ]
  },
  "home-call-task": {
    "src": "/comic/home/home-regeneration-20261011/call/v1/master-v1-1600.webp",
    "ar": [
      0.5962918660287081,
      0.008501594048884165,
      0.3977272727272727,
      0.47502656748140276
    ]
  },
  "home-call-wrong": {
    "src": "/comic/home/home-regeneration-20261011/call/v1/master-v1-1600.webp",
    "ar": [
      0.005980861244019139,
      0.4973432518597237,
      0.9880382775119617,
      0.4920297555791711
    ]
  },
  "home-call-support": {
    "src": "/comic/home/home-regeneration-20261011/call-help/v2/master-v2-1600.webp",
    "ar": [
      0.005980861244019139,
      0.008501594048884165,
      0.5657894736842105,
      0.4824654622741764
    ]
  },
  "home-call-matt": {
    "src": "/comic/home/home-regeneration-20261011/call-help/v2/master-v2-1600.webp",
    "ar": [
      0.5801435406698564,
      0.008501594048884165,
      0.4138755980861244,
      0.4824654622741764
    ]
  },
  "home-call-stairs": {
    "src": "/comic/home/home-regeneration-20261011/call-help/v2/master-v2-1600.webp",
    "ar": [
      0.005980861244019139,
      0.5079702444208289,
      0.9880382775119617,
      0.48034006376195537
    ]
  },
  "home-rogue-screens": {
    "src": "/comic/home/home-regeneration-20261011/agent/v2/master-v2-1600.avif",
    "ar": [
      0.004784688995215311,
      0.006376195536663124,
      0.34688995215311,
      0.9861849096705633
    ]
  },
  "home-rogue-speaks": {
    "src": "/comic/home/home-regeneration-20261011/agent/v2/master-v2-1600.avif",
    "ar": [
      0.3618421052631579,
      0.006376195536663124,
      0.3235645933014354,
      0.9861849096705633
    ]
  },
  "home-marco-phone-floods": {
    "src": "/comic/home/home-regeneration-20261011/agent/v2/master-v2-1600.avif",
    "ar": [
      0.69377990430622,
      0.006376195536663124,
      0.3008373205741627,
      0.9861849096705633
    ]
  },
  "home-cable-pull": {
    "src": "/comic/home/home-regeneration-20261011/agent-continued-1/v3/master-v3-1600.avif",
    "ar": [
      0.004784688995215311,
      0.006376195536663124,
      0.5047846889952153,
      0.485653560042508
    ]
  },
  "home-screens-dark": {
    "src": "/comic/home/home-regeneration-20261011/agent-continued-1/v3/master-v3-1600.avif",
    "ar": [
      0.5179425837320574,
      0.006376195536663124,
      0.47667464114832536,
      0.485653560042508
    ]
  },
  "home-matt-rises": {
    "src": "/comic/home/home-regeneration-20261011/agent-continued-1/v3/master-v3-1600.avif",
    "ar": [
      0.004784688995215311,
      0.5079702444208289,
      0.45873205741626794,
      0.48352816153028694
    ]
  },
  "home-marco-admits": {
    "src": "/comic/home/home-regeneration-20261011/agent-continued-1/v3/master-v3-1600.avif",
    "ar": [
      0.4730861244019139,
      0.5079702444208289,
      0.5215311004784688,
      0.48352816153028694
    ]
  },
  "home-codex-reaches": {
    "src": "/comic/home/scenes-20261012/home-codex-reaches-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-matt-stops": {
    "src": "/comic/home/home-regeneration-20261011/codex/v3/master-v3-1600.avif",
    "ar": [
      0.5777511961722488,
      0.006376195536663124,
      0.41626794258373206,
      0.2773645058448459
    ]
  },
  "home-codex-literal": {
    "src": "/comic/home/home-regeneration-20261011/codex/v3/master-v3-1600.avif",
    "ar": [
      0.5777511961722488,
      0.2964930924548353,
      0.41626794258373206,
      0.25823591923485656
    ]
  },
  "home-matt-close": {
    "src": "/comic/home/home-regeneration-20261011/codex/v3/master-v3-1600.avif",
    "ar": [
      0.004784688995215311,
      0.5674814027630181,
      0.25478468899521534,
      0.42401700318809776
    ]
  },
  "home-codex-asks": {
    "src": "/comic/home/scenes-20261012/home-codex-asks-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-matt-points": {
    "src": "/comic/home/home-regeneration-20261011/codex/v3/master-v3-1600.avif",
    "ar": [
      0.507177033492823,
      0.5674814027630181,
      0.4868421052631579,
      0.42401700318809776
    ]
  },
  "home-codex-asks-rate": {
    "src": "/comic/home/scenes-20261012/home-codex-asks-rate-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-marco-answers-rate": {
    "src": "/comic/home/home-regeneration-20261011/answers/v3/master-v3-1600.avif",
    "ar": [
      0.5388755980861244,
      0.007438894792773645,
      0.45514354066985646,
      0.9840595111583422
    ]
  },
  "home-window-floor": {
    "src": "/comic/home/scenes-20261012/home-window-floor-v.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-codex-discount": {
    "src": "/comic/home/scenes-20261012/home-codex-discount-base.webp",
    "ar": [
      0,
      0,
      1,
      0.9
    ]
  },
  "home-marco-nobody": {
    "src": "/comic/home/home-regeneration-20261011/answers-continued-1/v2/master-v2-1600.avif",
    "ar": [
      0.687200956937799,
      0.006376195536663124,
      0.30741626794258375,
      0.9851222104144527
    ]
  },
  "home-marco-labour": {
    "src": "/comic/home/preview-20261012/home-marco-labour-v.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-dana-claude-rule": {
    "src": "/comic/home/scenes-20261012/home-dana-claude-rule-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-process-procedure": {
    "src": "/comic/home/scenes-20261012/home-process-procedure-base.webp",
    "ar": [
      0,
      0.14,
      1,
      0.43
    ]
  },
  "home-process-source-rule": {
    "src": "/comic/home/home-regeneration-20261011/process/v2/master-v2-1600.avif",
    "ar": [
      0.004784688995215311,
      0.5069075451647184,
      0.9898325358851675,
      0.48459086078639746
    ]
  },
  "home-brain-initialize": {
    "src": "/comic/home/preview-20261012/home-brain-initialize-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-process-connect": {
    "src": "/comic/home/preview-20261012/home-process-connect-v.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-process-output": {
    "src": "/comic/home/scenes-20261012/home-process-output-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-process-permissions": {
    "src": "/comic/home/home-regeneration-20261011/access-check/v2/master-v2-1600.avif",
    "ar": [
      0.004784688995215311,
      0.006376195536663124,
      0.4916267942583732,
      0.9861849096705633
    ]
  },
  "home-process-refusal": {
    "src": "/comic/home/scenes-20261012/home-process-refusal-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-floors-light": {
    "src": "/comic/home/preview-20261012/home-floors-light-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-lobby": {
    "src": "/comic/home/home-regeneration-20261011/lobby/v4/master-v4-1600.webp",
    "ar": [
      0.00390625,
      0.00390625,
      0.4934895833333333,
      0.478515625
    ]
  },
  "home-ruth": {
    "src": "/comic/home/home-regeneration-20261011/lobby/v4/master-v4-1600.webp",
    "ar": [
      0.5045572916666666,
      0.00390625,
      0.248046875,
      0.478515625
    ]
  },
  "home-sam": {
    "src": "/comic/home/home-regeneration-20261011/lobby/v4/home-sam-static-v2-1600.webp",
    "ar": [
      0,
      0.048828125,
      1,
      0.8997395833333334
    ]
  },
  "home-marco-sorry": {
    "src": "/comic/home/home-regeneration-20261011/lobby/v4/master-v4-1600.webp",
    "ar": [
      0.00390625,
      0.4912109375,
      0.3131510416666667,
      0.5029296875
    ]
  },
  "home-ruth-confirm": {
    "src": "/comic/home/home-regeneration-20261011/lobby/v4/master-v4-1600.webp",
    "ar": [
      0.326171875,
      0.4912109375,
      0.21875,
      0.5029296875
    ]
  },
  "home-floors-12-19": {
    "src": "/comic/home/home-regeneration-20261011/lobby/v4/master-v4-1600.webp",
    "ar": [
      0.5533854166666666,
      0.4912109375,
      0.4427083333333333,
      0.5029296875
    ]
  },
  "home-quote-rebuilt": {
    "src": "/comic/home/scenes-20261012/home-quote-rebuilt-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-marco-ticks": {
    "src": "/comic/home/home-regeneration-20261011/nine/v3/master-v3-1600.webp",
    "ar": [
      0.3370712401055409,
      0,
      0.32519788918205805,
      0.49753208292201384
    ]
  },
  "home-new-total": {
    "src": "/comic/home/home-regeneration-20261011/nine/v3/master-v3-1600.webp",
    "ar": [
      0.6675461741424802,
      0,
      0.3324538258575198,
      0.49753208292201384
    ]
  },
  "home-marco-calls": {
    "src": "/comic/home/scenes-20261012/home-marco-calls-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-phone-client": {
    "src": "/comic/home/home-regeneration-20261011/nine/v3/master-v3-1600.webp",
    "ar": [
      0.33773087071240104,
      0.5054294175715696,
      0.32519788918205805,
      0.4945705824284304
    ]
  },
  "home-marco-sends": {
    "src": "/comic/home/home-regeneration-20261011/nine/v3/home-marco-sends-static-detail-v1.png",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-roof": {
    "src": "/comic/home/scenes-20261012/home-roof-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-marco-tired": {
    "src": "/comic/home/home-regeneration-20261011/roof/v4/master-v4-1600.webp",
    "ar": [
      0.3633440514469453,
      0,
      0.2733118971061093,
      1
    ]
  },
  "home-brain-rises": {
    "src": "/comic/home/preview-20261012/home-brain-rises-v.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-codex-teal": {
    "src": "/comic/home/scenes-20261012/home-codex-teal-base.webp",
    "ar": [
      0,
      0,
      1,
      0.85
    ]
  },
  "home-claude-teal": {
    "src": "/comic/home/scenes-20261012/home-claude-teal-base.webp",
    "ar": [
      0,
      0,
      1,
      0.9
    ]
  },
  "home-matt-names": {
    "src": "/comic/home/preview-20261012/home-matt-names-v.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-monday-floor": {
    "src": "/comic/home/home-regeneration-20261011/monday/v4/master-v4-1600.webp",
    "ar": [
      0,
      0,
      0.341446923597025,
      1
    ]
  },
  "home-chat-ok-again": {
    "src": "/comic/home/scenes-20261012/home-chat-ok-again-v.webp",
    "ar": [
      0.38,
      0,
      0.6,
      0.8
    ]
  },
  "home-marco-turns": {
    "src": "/comic/home/scenes-20261012/home-marco-turns-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-codex-lists": {
    "src": "/comic/home/preview-20261012/home-codex-lists-base.webp",
    "ar": [
      0,
      0,
      1,
      1
    ]
  },
  "home-apology-letters": {
    "src": "/comic/home/home-regeneration-20261011/monday-continued-1/v2/master-v2-1600.webp",
    "ar": [
      0.349,
      0.007,
      0.374,
      0.985
    ]
  },
  "home-matt-door": {
    "src": "/comic/home/home-regeneration-20261011/monday-continued-1/v2/master-v2-1600.webp",
    "ar": [
      0.737,
      0.07,
      0.258,
      0.6
    ]
  }
};

const sourceAspects: Record<string, number> = {"home-tower-night":1.2094338410127883,"home-marco-desk":1.34577001945423,"home-phone-ring":2.3312387028176498,"home-marco-grin":1.8876426743462753,"home-marco-types":0.638497159965304,"home-chat-ok":0.6077790835408564,"home-send":2.3411562532061145,"home-marco-coat":1.9704587672389529,"home-reply-email":0.9040097570128529,"home-marco-reads":0.9628645589017105,"home-ratecard-close":1.019098198479642,"home-marco-silhouette":1.2377710912708197,"home-chat-again":2.6141341172300923,"home-elevator-go":1.9824660219886203,"home-dana-office":2,"home-dana-reads":0.6666666666666666,"home-claude-stricken":0.7751937984496123,"home-citation-dissolves":1.1790302331443918,"home-thirty-one":1,"home-marco-doorway":1.730966696867364,"home-call-alert":2.1801293281335665,"home-call-task":1.488486656271891,"home-call-wrong":3.5699314389777044,"home-call-support":2.0848082025916477,"home-call-matt":1.525039404009958,"home-call-stairs":3.656810301430702,"home-rogue-screens":0.6253322700691121,"home-rogue-speaks":0.5832840657023959,"home-marco-phone-floods":0.5423140204220058,"home-cable-pull":1.847808966086059,"home-screens-dark":1.7449096516239209,"home-matt-rises":1.686610465557834,"home-marco-admits":1.917502380660275,"home-codex-reaches":1.5,"home-matt-stops":2.6680843522948785,"home-codex-literal":2.8657202302426468,"home-matt-close":1.0682367801481374,"home-codex-asks":1,"home-matt-points":2.0411848334286007,"home-codex-asks-rate":1,"home-marco-answers-rate":0.8222511577064264,"home-window-floor":0.6666666666666666,"home-codex-discount":0.7407407407407407,"home-marco-nobody":0.5547715845791131,"home-marco-labour":0.75,"home-dana-claude-rule":1,"home-process-procedure":3.488372093023256,"home-process-source-rule":3.6313154630329145,"home-brain-initialize":1.5,"home-process-connect":1.5,"home-process-output":1.5,"home-process-permissions":0.8862467689600175,"home-process-refusal":1,"home-floors-light":1.5,"home-lobby":1.546938775510204,"home-ruth":0.7775510204081633,"home-sam":0.7409551374819102,"home-marco-sorry":0.9339805825242719,"home-ruth-confirm":0.6524271844660194,"home-floors-12-19":1.3203883495145632,"home-quote-rebuilt":1,"home-marco-ticks":0.9781746031746031,"home-new-total":1,"home-marco-calls":1,"home-phone-client":0.9840319361277445,"home-marco-sends":1.5987261146496816,"home-roof":0.6666666666666666,"home-marco-tired":0.507307465626189,"home-brain-rises":1.5,"home-codex-teal":0.7843137254901961,"home-claude-teal":0.7407407407407407,"home-matt-names":0.6666666666666666,"home-monday-floor":0.5019880715705765,"home-chat-ok-again":1.1249999999999998,"home-marco-turns":1,"home-codex-lists":1.5,"home-apology-letters":0.5695431472081218,"home-matt-door":0.645};

function anchors(crop: Rect, local: Partial<Record<CastId, Head>>): ComicSpeakerAnchors {
  return Object.fromEntries(Object.entries(local).map(([who, h]) => [who, {
    mouth: [crop[0] + h![0] * crop[2], crop[1] + h![1] * crop[3]],
    face: [crop[0] + h![2] * crop[2], crop[1] + h![3] * crop[3], h![4] * crop[2], h![5] * crop[3]],
  }]));
}

export function applyHomePresentation(story: ComicStory): ComicStory {
  // The harness introduction precedes its connection action. Giving this long
  // caption its own space also keeps the phone dialogue clear of both agents.
  const process = story.scenes.find(scene => scene.id === 'process');
  const connect = process?.panels.find(panel => panel.img === 'home-process-connect');
  const initialize = process?.panels.find(panel => panel.img === 'home-brain-initialize');
  const setup = connect?.balloons.findIndex(balloon => balloon.text.startsWith('Matt adds Sittler’s domain harness:')) ?? -1;
  if (connect && initialize && setup >= 0) {
    const caption = connect.balloons.splice(setup, 1)[0];
    caption.at = Math.max(...initialize.balloons.map(balloon => balloon.at)) + 5;
    caption.phone = { x: .025, y: .86, w: .94 };
    initialize.balloons.push(caption);
  }
  for (const scene of story.scenes) for (const panel of scene.panels) {
    panel.artFit = 'cover';
    panel.pageArt = [0, 0, 1, 1];
    panel.phoneArt = [0, 0, 1, 1];
    for (const source of [panel.staticArt, ...(panel.views ?? [])]) {
      if (!source) continue;
      source.fit = 'cover';
      if (source.phone) source.phone.fit = 'cover';
    }
    const local = heads[panel.img];
    if (!local) continue;
    const reviewed = reviewedSources[panel.img];
    const geometry = anchors(reviewed.ar, local);
    panel.speakers = geometry;
    const faces = Object.values(local).filter(Boolean) as Head[];
    // Cover positioning follows the pictured heads instead of centering on a torso.
    const center = [faces.reduce((n,h)=>n+h[2]+h[4]/2,0)/faces.length, faces.reduce((n,h)=>n+h[3]+h[5]/2,0)/faces.length];
    const focus = (targetAspect: number): [number,number] => {
      const sourceAspect = sourceAspects[panel.img];
      const visible = sourceAspect > targetAspect ? [targetAspect/sourceAspect,1] : [1,sourceAspect/targetAspect];
      return visible.map((v,i)=>v >= .999 ? .5 : Math.max(0,Math.min(1,(center[i]-v/2)/(1-v)))) as [number,number];
    };
    const phoneRect = scene.phonePages?.flat().find(p=>p.img===panel.img)?.r ?? panel.r;
    panel.cropFocus = {page:focus(panel.r[2]*1393/(panel.r[3]*795)),phone:focus(phoneRect[2]*360/(phoneRect[3]*(scene.phonePageHeight ?? 656)))};
    const sources = [panel.staticArt, ...(panel.views ?? [])].filter(Boolean);
    for (const source of sources) {
      const sameSource = source!.canonicalSource?.panelId === panel.img || source!.src.replace(/-1600\.(avif|webp)$/, '') === reviewed.src.replace(/-1600\.(avif|webp)$/, '');
      if (sameSource) {
        source!.speakers = geometry;
        if (source!.phone && (!source!.phone.src || source!.phone.src === source!.src)) source!.phone.speakers = geometry;
      }
    }
  }
  return applyHomeProjection(story, buildHomeAtlasProjectionRepairs(story));
}
