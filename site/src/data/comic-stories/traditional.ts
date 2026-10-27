// Comic B revision packet, 2026-10-08. Story-first continuity revision; artwork remains to be authored.
// Existing demo is unchanged. Method and review: external story-packet documentation.
import type { ComicStory } from './types';
import { retime } from './retime';

// Partial conversion: new process/complaint art bound; remaining eight scene layer corrections pending native review. No authored speech.
// Owner/Deed corrected source cells and genuine-alpha planes bound. Six remaining old scenes still pending layer conversion.
// Dense corrected Owner/Deed pages split for readable desktop panels; one box per phone sheet. Exact words/order retained.
// Locked and Answer actual layered art; fixed reserved lettering zones. Four original scene conversions remain pending.
// Opening gets its own full-width sheet: top place/intro, contained art middle, original sceneSetup bottom-right.
// Source-bound actual layer conversion with measured teal-frame interiors; native reading/hearing/human approval pending.
// Source-bound actual layer conversion with measured teal-frame interiors; native reading/hearing/human approval pending.
export const traditionalComic: ComicStory = retime({
  "id": "traditional",
  "issue": 3,
  "title": "Who can open what.",
  "bpm": 108,
  "beats": 372,
  "music": {
    "src": "/audio/pixabay-558083-dramatic-rock.mp3",
    "offset": 0.43,
    "credit": "Music: Dramatic Rock by Playsound",
    "source": "https://pixabay.com/music/rock-dramatic-rock-558083/",
    "loop": {
      "from": 16,
      "to": 192
    }
  },
  "soundAssets": {
    "rooms": {
      "street": {
        "src": "/comic/sound/street-loop-v1.mp3",
        "gain": 1
      },
      "office": {
        "src": "/comic/sound/office-loop-v1.mp3",
        "gain": 1
      },
      "servers": {
        "src": "/comic/sound/servers-loop-v1.mp3",
        "gain": 1
      },
      "rain": {
        "src": "/comic/sound/rain-loop-v1.mp3",
        "gain": 1
      }
    }
  },
  "scenes": [
    {
      "id": "locked",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-dana-desk",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-locked-conversion-20261010-v4",
      "b": 0,
      "l": 60,
      "title": "Monday, 8:52 a.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shelf"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.006313131313131313,
            0.010070493454179255,
            0.5940656565656566,
            0.5206445115810675
          ],
          "img": "trad-dana-desk",
          "alt": "Wide: the small law office on floor 28 before nine, file rooms and binders, one window office; Dana in rectangular glasses and a grey jacket at her desk by the file room, pen in hand.",
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Toronto. The Keon Tower,\nfloor 28. Monday,\n7 December, 8:52 a.m.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.194366659983918,
              "chain": false,
              "anchor": "free",
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "chain": false,
                "anchor": "free"
              }
            },
            {
              "at": 3,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Dana Dryden. Legal assistant,\nBourque & Coffey.\nShe reads every footnote.",
              "x": 0.21173698148685613,
              "y": 0.01634877384196185,
              "w": 0.194366659983918,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.2,
                "w": 0.9544159544159544,
                "chain": false,
                "anchor": "free"
              },
              "chain": false,
              "anchor": "free"
            },
            {
              "at": 4.5,
              "kind": "caption",
              "sceneSetup": true,
              "state": "narration",
              "who": "narrator",
              "text": "Bourque & Coffey LLP is\na law firm. Dana has found\nduplicate charges to a client.\nThe partners review her\nevidence Friday at 4:00 p.m.\nUntil then, it must stay\nconfidential. The firm’s AI\nassistant goes live today.",
              "x": 0.00868516075146906,
              "y": 0.95,
              "w": 0.9826296784970618,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.95,
                "w": 0.9544159544159544,
                "chain": false
              },
              "chain": false
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.11444141689373297,
            0.9826296784970618,
            0.6553133514986376
          ],
          "phoneArt": [
            0.022792022792022793,
            0.30381679389312977,
            0.9544159544159544,
            0.46412213740458014
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-locked-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-locked-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-locked-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ]
    },
    {
      "id": "locked-billing",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-invoices",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-partners-only",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-locked-conversion-20261010-v4",
      "b": 0,
      "l": 60,
      "title": "Monday, 8:52 a.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shelf"
      ],
      "panels": [
        {
          "at": 17,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.6130050505050505,
            0.010070493454179255,
            0.3806818181818182,
            0.24773413897280966
          ],
          "img": "trad-invoices",
          "alt": "Close: Dana's pen circling the same line on a fan of invoices, the same hours on each.",
          "sfx": [
            {
              "kind": "paper"
            }
          ],
          "balloons": [
            {
              "at": 17.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Last week she found\ntwelve invoices that billed\nthe same hours twice.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "The client paid twice.\nI can't leave this.",
              "x": 0.017501206854055977,
              "y": 0.11444141689373297,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.432425068119891
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.4384732824427481
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.19618528610354224,
            0.964997586291888,
            0.7874659400544959
          ],
          "phoneArt": [
            0.022792022792022793,
            0.20305343511450383,
            0.9544159544159544,
            0.7847328244274809
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 26,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.6130050505050505,
            0.2799597180261833,
            0.3806818181818182,
            0.25075528700906347
          ],
          "img": "trad-partners-only",
          "alt": "Dana saves her duplicate-billing evidence in what she believes is the restricted partners’ folder. The folder shows an older sharing-link symbol separate from its ordinary members list; do not depict an actually sealed door defeated by AI magic.",
          "sfx": [
            {
              "kind": "click"
            }
          ],
          "balloons": [
            {
              "at": 26.5,
              "kind": "thought",
              "state": "thought",
              "who": "dana",
              "text": "In the partners’ folder.\nOnly they should\nbe able to read it.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.37997275204359676
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.3829007633587786
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.12125340599455041,
            0.964997586291888,
            0.8623978201634878
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12366412213740458,
            0.9544159544159544,
            0.8641221374045801
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-locked-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-locked-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-locked-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "locked-offer",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-potvin-office",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-calendar",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-switch-on",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-locked-conversion-20261010-v4",
      "b": 0,
      "l": 60,
      "title": "Monday, 8:52 a.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shelf"
      ],
      "panels": [
        {
          "at": 32.5,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.006313131313131313,
            0.552870090634441,
            0.2556818181818182,
            0.43705941591137965
          ],
          "img": "trad-potvin-office",
          "alt": "Across the floor, in a glass office: a sharp-suited man with rolled sleeves on the phone, laughing.",
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "balloons": [
            {
              "at": 33,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Ryan Potvin.\nSenior associate.\nThe hours were his.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "at": 39.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.27525252525252525,
            0.552870090634441,
            0.1875,
            0.43705941591137965
          ],
          "img": "trad-calendar",
          "alt": "Insert: a calendar on a screen, Friday 4:00 p.m. blocked: \"Billing review\".",
          "balloons": [
            {
              "at": 40,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The partners would\nhear it Friday.\nPotvin didn’t know yet.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "at": 47.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.476010101010101,
            0.552870090634441,
            0.5176767676767676,
            0.43705941591137965
          ],
          "img": "trad-switch-on",
          "alt": "Every screen on the floor lights with the same cheerful assistant window; by the door, a stack of unopened licence boxes gathers dust.",
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "sfx": [
            {
              "kind": "sting",
              "delay": 1,
              "gain": 0.4
            }
          ],
          "balloons": [
            {
              "at": 48,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "9:00 a.m. The firm opened\nits AI assistant to everyone.\nThirty seats.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Thirty separate chats.\nNo shared procedure.\nNo connected Second Brain.",
              "x": 0.026607538802660754,
              "y": 0.11444141689373297,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.2125340599455041,
            0.9467849223946785,
            0.771117166212534
          ],
          "phoneArt": [
            0.022792022792022793,
            0.2198473282442748,
            0.9544159544159544,
            0.76793893129771
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-locked-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-locked-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-locked-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "answer",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-claude-grey",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-potvin-asks",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-claude-answers",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-answer-conversion-20261010-v2",
      "b": 60,
      "l": 48,
      "title": "Monday, 4:40 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.006305170239596469,
            0.010080645161290322,
            0.3978562421185372,
            0.5846774193548387
          ],
          "img": "trad-claude-grey",
          "alt": "Potvin at his desk in the late light; out of his screen's glow stands a tall figure in a long coat of turning pages, its visor flat grey.",
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28, Potvin's office.\nMonday, 4:40 p.m.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 3,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Claude. An AI.\nThey read everything,\nand agree with everyone.",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.19209809264305178,
            0.9467849223946785,
            0.7915531335149864
          ],
          "phoneArt": [
            0.022792022792022793,
            0.1984732824427481,
            0.9544159544159544,
            0.7893129770992366
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "at": 14.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.4155107187894073,
            0.010080645161290322,
            0.24274905422446405,
            0.3175403225806452
          ],
          "img": "trad-potvin-asks",
          "alt": "Medium: Potvin, screen left, leaning back, asking the screen.",
          "balloons": [
            {
              "at": 15,
              "kind": "speech",
              "state": "calm",
              "who": "potvin",
              "text": "What's Friday's\nmeeting about?",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.3658015267175572
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.09809264305177112,
            0.9467849223946785,
            0.885558583106267
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "at": 19,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6708701134930644,
            0.010080645161290322,
            0.3228247162673392,
            0.3175403225806452
          ],
          "img": "trad-claude-answers",
          "alt": "Medium: Claude, screen right, polite, a page of the coat turning.",
          "balloons": [
            {
              "at": 19.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "A billing review.\nTwelve of your\ninvoices.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-answer-conversion-20261010-v2-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-answer-conversion-20261010-v2-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-answer-conversion-20261010-v2-humans.png",
          "opacity": 1
        }
      ],
      "continues": false
    },
    {
      "id": "answer-disclosure",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-potvin-still",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-claude-visor",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-answer-conversion-20261010-v2",
      "b": 60,
      "l": 48,
      "title": "Monday, 4:40 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 25.5,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.4155107187894073,
            0.35080645161290325,
            0.2030264817150063,
            0.2439516129032258
          ],
          "img": "trad-potvin-still",
          "alt": "Close: Potvin stops smiling.",
          "balloons": [
            {
              "at": 26,
              "kind": "speech",
              "state": "calm",
              "who": "potvin",
              "text": "Who\nraised it?",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.3658015267175572
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.09809264305177112,
            0.964997586291888,
            0.885558583106267
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "at": 29.5,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.6311475409836066,
            0.35080645161290325,
            0.362547288776797,
            0.2439516129032258
          ],
          "img": "trad-claude-visor",
          "alt": "Extreme close: Claude's grey visor, the complaint's first page reflected in it.",
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.5
            }
          ],
          "balloons": [
            {
              "at": 30,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Dana Dryden. It's in\nthe partners' folder.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.3658015267175572
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.09809264305177112,
            0.964997586291888,
            0.885558583106267
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-answer-conversion-20261010-v2-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-answer-conversion-20261010-v2-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-answer-conversion-20261010-v2-humans.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "answer-knowledge",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-potvin-face",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-doorway",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-answer-conversion-20261010-v2",
      "b": 60,
      "l": 48,
      "title": "Monday, 4:40 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 36,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.006305170239596469,
            0.6139112903225806,
            0.2786885245901639,
            0.375
          ],
          "img": "trad-potvin-face",
          "alt": "Close: Potvin's face lit from below by the screen, eyes on the name.",
          "sfx": [
            {
              "kind": "heartbeat"
            }
          ],
          "balloons": [],
          "pageArt": [
            0.017501206854055977,
            0.0326975476839237,
            0.964997586291888,
            0.9509536784741145
          ],
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        },
        {
          "at": 37.5,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.29760403530895335,
            0.6139112903225806,
            0.6960907944514502,
            0.375
          ],
          "img": "trad-doorway",
          "alt": "Silhouette: Potvin in solid black in his office doorway, against the lit floor; far across it, Dana at her desk, typing, not looking up.",
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.4
            }
          ],
          "balloons": [
            {
              "at": 38,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Forty feet away,\nDana was still\nat her desk.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.11444141689373297,
            0.964997586291888,
            0.8692098092643051
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-answer-conversion-20261010-v2-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-answer-conversion-20261010-v2-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-answer-conversion-20261010-v2-humans.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "link",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-elevators",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-potvin-elevator",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-dana-eyes",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-link-conversion-20261010-v1",
      "b": 108,
      "l": 48,
      "title": "Monday, 5:31 p.m.",
      "room": "office",
      "score": 0,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.006313131313131313,
            0.010070493454179255,
            0.3491161616161616,
            0.5317220543806647
          ],
          "img": "trad-elevators",
          "alt": "Wide: the floor 28 elevator lobby, marble and dark windows; Dana in her coat waiting, Potvin walking up behind her with his coat over his arm.",
          "sfx": [],
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28, the elevators.\nMonday, 5:31 p.m.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.09400544959128065,
            0.9467849223946785,
            0.8896457765667575
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        },
        {
          "at": 7.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.3686868686868687,
            0.010070493454179255,
            0.23295454545454544,
            0.5317220543806647
          ],
          "img": "trad-potvin-elevator",
          "alt": "Medium: Potvin at her shoulder, screen left, quiet, not looking at her.",
          "balloons": [
            {
              "at": 8,
              "kind": "speech",
              "state": "calm",
              "who": "potvin",
              "text": "Twelve\ninvoices,\nDana?",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.37806539509536785
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.3807633587786259
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.026607538802660754,
            0.11852861035422343,
            0.9467849223946785,
            0.8651226158038147
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12061068702290076,
            0.9544159544159544,
            0.867175572519084
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        },
        {
          "at": 11.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.61489898989899,
            0.010070493454179255,
            0.11363636363636363,
            0.5317220543806647
          ],
          "img": "trad-dana-eyes",
          "alt": "Tall close: Dana's eyes behind rectangular glasses as the elevator doors close between them.",
          "sfx": [
            {
              "kind": "door"
            },
            {
              "kind": "heartbeat",
              "delay": 1
            }
          ],
          "balloons": [],
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
          ],
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-link-conversion-20261010-v1-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-link-conversion-20261010-v1-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-link-conversion-20261010-v1-humans.png",
          "opacity": 1
        }
      ],
      "continues": false
    },
    {
      "id": "link-controlled",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-dana-back",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-claude-link",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-link-conversion-20261010-v1",
      "b": 108,
      "l": 48,
      "title": "Monday, 5:31 p.m.",
      "room": "office",
      "score": 0,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 13,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.7424242424242424,
            0.010070493454179255,
            0.25126262626262624,
            0.23766364551863042
          ],
          "img": "trad-dana-back",
          "alt": "Dana back at her desk in the dark office, coat still on, typing hard.",
          "sfx": [
            {
              "kind": "keys"
            }
          ],
          "balloons": [
            {
              "at": 13.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "6:02 p.m.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 15,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Who can open\nmy complaint?",
              "x": 0.017501206854055977,
              "y": 0.07356948228882834,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.40381471389645773
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.07480916030534351,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.40961832061068704
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.1553133514986376,
            0.964997586291888,
            0.8283378746594006
          ],
          "phoneArt": [
            0.022792022792022793,
            0.1618320610687023,
            0.9544159544159544,
            0.8259541984732824
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        },
        {
          "at": 21,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.7424242424242424,
            0.26988922457200404,
            0.25126262626262624,
            0.2719033232628399
          ],
          "img": "trad-claude-link",
          "alt": "Claude in the screen light, grey visor, holding up a single glowing thread.",
          "balloons": [
            {
              "at": 21.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Everyone at the firm.\nThrough a link\nmade in 2019.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.4362397820163488
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.4427480916030534
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 23,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Its owner left\nin 2021.",
              "x": 0.017501206854055977,
              "y": 0.11989100817438691,
              "w": 0.964997586291888,
              "chain": false,
              "tail": [
                0.5,
                0.4362397820163488
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.12213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.4427480916030534
                ]
              },
              "anchor": "free"
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.2016348773841962,
            0.964997586291888,
            0.782016348773842
          ],
          "phoneArt": [
            0.022792022792022793,
            0.20916030534351146,
            0.9544159544159544,
            0.7786259541984732
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-link-conversion-20261010-v1-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-link-conversion-20261010-v1-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-link-conversion-20261010-v1-humans.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "link-network",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-second-office",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-link-conversion-20261010-v1",
      "b": 108,
      "l": 48,
      "title": "Monday, 5:31 p.m.",
      "room": "office",
      "score": 0,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 33.5,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.006313131313131313,
            0.5619335347432024,
            0.9873737373737373,
            0.42799597180261834
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "img": "trad-second-office",
          "alt": "Splash: behind the office wall, a second office in violet dark: client files on shelves, threads of old links running out to personal drives, a laptop at someone's kitchen table, phones; Dana small in the foreground.",
          "sfx": [
            {
              "kind": "sting",
              "delay": 0.5,
              "gain": 0.45
            }
          ],
          "balloons": [
            {
              "at": 34,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Four hundred and twelve\nlinks like it. Nobody\nowned any of them.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.9826296784970618,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.11444141689373297,
            0.9826296784970618,
            0.8692098092643051
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-link-conversion-20261010-v1-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-link-conversion-20261010-v1-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-link-conversion-20261010-v1-humans.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "closed",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-codex-white",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-dana-orders",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-closed-conversion-20261010-v3",
      "b": 156,
      "l": 48,
      "title": "Monday, 11:48 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.006309148264984227,
            0.010080645161290322,
            0.40946372239747636,
            0.4737903225806452
          ],
          "img": "trad-codex-white",
          "alt": "Dana alone at her desk near midnight, rain on the window, the list of links on her screen; beside her stands a compact armoured figure, light running harsh white down its gauntlets.",
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28.\nMonday, 11:48 p.m.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 3,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Codex. An AI that builds.\nExactly what they’re told.",
              "x": 0.017501206854055977,
              "y": 0.09400544959128065,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.17166212534059946,
            0.964997586291888,
            0.8119891008174387
          ],
          "phoneArt": [
            0.022792022792022793,
            0.17709923664122137,
            0.9544159544159544,
            0.8106870229007633
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "pointing-agent",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 13,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.42839116719242903,
            0.010080645161290322,
            0.14258675078864352,
            0.39213709677419356
          ],
          "img": "trad-dana-orders",
          "alt": "Close: Dana, jaw set, not looking up from the list.",
          "balloons": [
            {
              "at": 13.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Close them.\nAll of them.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.42098092643051765
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.4267175572519084
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Before anything else\ngets out.",
              "x": 0.017501206854055977,
              "y": 0.09809264305177112,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.42098092643051765
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09923664122137404,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.4267175572519084
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.17983651226158037,
            0.964997586291888,
            0.8038147138964578
          ],
          "phoneArt": [
            0.022792022792022793,
            0.18625954198473282,
            0.9544159544159544,
            0.8015267175572519
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "pointing-agent",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-agents.png",
          "opacity": 1
        },
        {
          "id": "pointing-agent",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-pointing-agent.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-props.png",
          "opacity": 1
        }
      ],
      "continues": false
    },
    {
      "id": "closed-controls",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-close-1",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-close-2",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-close-3",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-closed-conversion-20261010-v3",
      "b": 156,
      "l": 48,
      "title": "Monday, 11:48 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 18,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.583596214511041,
            0.010080645161290322,
            0.12555205047318613,
            0.39213709677419356
          ],
          "img": "trad-close-1",
          "alt": "Codex begins disabling sharing links at Dana’s command. Both an old broad link and a current transaction link are visible in the same list; the problem is indiscriminate scope, not physical cables or walls being destroyed.",
          "run": "close",
          "sfx": [
            {
              "kind": "click",
              "gain": 0.3
            }
          ],
          "balloons": [],
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
          ],
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "pointing-agent",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 19,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.7217665615141956,
            0.010080645161290322,
            0.12744479495268138,
            0.39213709677419356
          ],
          "img": "trad-close-2",
          "alt": "Step 2: violet threads snap, a dozen at once.",
          "run": "close",
          "balloons": [],
          "sfx": [],
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
          ],
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "pointing-agent",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 20,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.8624605678233438,
            0.010080645161290322,
            0.13123028391167194,
            0.39213709677419356
          ],
          "img": "trad-close-3",
          "alt": "Step 3: Codex lowers the gauntlet; the screen shows the list, every line struck through.",
          "run": "close",
          "balloons": [
            {
              "at": 20.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Done.\nNine seconds.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.3658015267175572
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.026607538802660754,
            0.09809264305177112,
            0.9467849223946785,
            0.885558583106267
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "pointing-agent",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-agents.png",
          "opacity": 1
        },
        {
          "id": "pointing-agent",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-pointing-agent.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "closed-callers",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-phones",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-closed-conversion-20261010-v3",
      "b": 156,
      "l": 48,
      "title": "Monday, 11:48 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 24,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.42839116719242903,
            0.4254032258064516,
            0.5652996845425867,
            0.20967741935483872
          ],
          "img": "trad-phones",
          "alt": "Morning, wide: the floor full of staff, phones lit and ringing on every desk, screens showing \"Access denied\".",
          "sfx": [],
          "balloons": [
            {
              "at": 24.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Tuesday, 9:04 a.m.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.9826296784970618,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.07356948228882834,
            0.9826296784970618,
            0.9100817438692098
          ],
          "phoneArt": [
            0.022792022792022793,
            0.07480916030534351,
            0.9544159544159544,
            0.9129770992366413
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "pointing-agent",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-agents.png",
          "opacity": 1
        },
        {
          "id": "pointing-agent",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-pointing-agent.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "closed-consequence",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-closing",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-codex-literal",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-closed-conversion-20261010-v3",
      "b": 156,
      "l": 48,
      "title": "Monday, 11:48 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 28,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.006309148264984227,
            0.6582661290322581,
            0.546372239747634,
            0.3316532258064516
          ],
          "img": "trad-closing",
          "alt": "Dana at her desk with the phone to her ear, eyes shut; on her screen, a house deed that will not open.",
          "balloons": [
            {
              "at": 28.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "A house closing at noon.\nThe buyer's lawyer\ncould not open the deed.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.11444141689373297,
            0.964997586291888,
            0.8692098092643051
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "pointing-agent",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 37.5,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.5659305993690852,
            0.6582661290322581,
            0.4277602523659306,
            0.3316532258064516
          ],
          "img": "trad-codex-literal",
          "alt": "Codex, screen right, unbothered, the white light still on its gauntlets.",
          "balloons": [
            {
              "at": 38,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "You said\nall of them.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.3658015267175572
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.09809264305177112,
            0.964997586291888,
            0.885558583106267
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "pointing-agent",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-agents.png",
          "opacity": 1
        },
        {
          "id": "pointing-agent",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-pointing-agent.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-closed-conversion-20261010-v3-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "owner",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-matt-arrives",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-dana-list",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-matt-asks",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-owner-conversion-20261010-v3",
      "b": 204,
      "l": 56,
      "title": "Tuesday, 9:31 a.m.",
      "room": "office",
      "score": 0,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.006305170239596469,
            0.010080645161290322,
            0.5157629255989912,
            0.4798387096774194
          ],
          "img": "trad-matt-arrives",
          "alt": "Matt arrives in response to Dana’s call, black T-shirt and tortoiseshell glasses, holding her message on his phone. Dana meets him with the deed access problem; this is an invited consultation, not an unexplained entrance.",
          "sfx": [
            {
              "kind": "door"
            }
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28, the elevators.\nTuesday, 9:31 a.m.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 3,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Matt. He helps companies\nbuild these systems.",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Thanks for coming. The sharing is wrong, and we need the deed before noon.",
              "x": 0.026607538802660754,
              "y": 0.17166212534059946,
              "w": 0.9467849223946785,
              "tail": [
                0.43,
                0.5497275204359673
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.17709923664122137,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.43,
                  0.562442748091603
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.3637602179836512,
            0.9467849223946785,
            0.6198910081743869
          ],
          "phoneArt": [
            0.022792022792022793,
            0.3801526717557252,
            0.9544159544159544,
            0.6076335877862595
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 13.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5334174022698613,
            0.010080645161290322,
            0.23833543505674654,
            0.4798387096774194
          ],
          "img": "trad-dana-list",
          "alt": "Medium: Dana, screen right, holding up the list of links, every line struck through.",
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.5
            }
          ],
          "balloons": [
            {
              "at": 14,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "I closed all 412 links.\nNow the deed\nwon’t open.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.43,
                0.37997275204359676
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.43,
                  0.3829007633587786
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.12125340599455041,
            0.9467849223946785,
            0.8623978201634878
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12366412213740458,
            0.9544159544159544,
            0.8641221374045801
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 21.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.7843631778058008,
            0.010080645161290322,
            0.20933165195460277,
            0.4798387096774194
          ],
          "img": "trad-matt-asks",
          "alt": "Close: Matt, screen left, reading the list, not the room.",
          "balloons": [
            {
              "at": 22,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Who owns\nthem?",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.43,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.43,
                  0.3658015267175572
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.09809264305177112,
            0.9467849223946785,
            0.885558583106267
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-props.png",
          "opacity": 1
        }
      ],
      "continues": false
    },
    {
      "id": "owner-boundary",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-dana-pause",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-codex-offers",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-matt-turns",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-owner-conversion-20261010-v3",
      "b": 204,
      "l": 56,
      "title": "Tuesday, 9:31 a.m.",
      "room": "office",
      "score": 0,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 25.5,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.006305170239596469,
            0.5070564516129032,
            0.20113493064312737,
            0.48286290322580644
          ],
          "img": "trad-dana-pause",
          "alt": "Close: Dana lowers the list.",
          "balloons": [
            {
              "at": 26,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Nobody.\nThat's the\nproblem.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.43,
                0.37806539509536785
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.43,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11852861035422343,
            0.9467849223946785,
            0.8651226158038147
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "at": 30,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.21878940731399749,
            0.5070564516129032,
            0.23707440100882723,
            0.48286290322580644
          ],
          "img": "trad-codex-offers",
          "alt": "Codex steps in, gauntlets flaring white again.",
          "balloons": [
            {
              "at": 30.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "I can reopen\nall of them.\nNine seconds.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.8,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.8,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "at": 37,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.4672131147540984,
            0.5070564516129032,
            0.17402269861286254,
            0.48286290322580644
          ],
          "img": "trad-matt-turns",
          "alt": "Close: Matt raises one hand to Codex without looking away from Dana.",
          "balloons": [
            {
              "at": 37.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Then find out.\nOne at a time.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.43,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.43,
                  0.3658015267175572
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.09809264305177112,
            0.9467849223946785,
            0.885558583106267
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "owner-first",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-first-name",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-owner-conversion-20261010-v3",
      "b": 204,
      "l": 56,
      "title": "Tuesday, 9:31 a.m.",
      "room": "office",
      "score": 0,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 43.5,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.6532156368221942,
            0.5070564516129032,
            0.34047919293820933,
            0.48286290322580644
          ],
          "img": "trad-first-name",
          "alt": "Dana records the first owner on the list; Codex cyan gauntlet and a physical server rack are visible behind her.",
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "balloons": [
            {
              "at": 44,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "10:02 a.m.\nDana found the partner\nresponsible for the deed.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.9826296784970618,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.11444141689373297,
            0.9826296784970618,
            0.8692098092643051
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-owner-conversion-20261010-v3-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "sharing-procedure",
      "b": 0,
      "l": 4,
      "title": "Tuesday, 10:05 a.m.",
      "room": "office",
      "score": 0,
      "artCropInsetPct": 0,
      "panels": [
        {
          "img": "trad-process-owner",
          "alt": "Dana and Matt compare the current deed owner record with the blocked link. The responsible partner will confirm the recipient next scene; access remains closed.",
          "at": 1,
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.006510416666666667,
            0.0068359375,
            0.5924479166666666,
            0.34375
          ],
          "room": "office",
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28, Bourque & Coffey.\nTuesday, 10:05 a.m.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "For this deed: who approves access, and who needs it?",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.5945504087193461
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.6244274809160305
                ]
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "The responsible partner confirms the recipient. I check the link before sending.",
              "x": 0.026607538802660754,
              "y": 0.23841961852861035,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.5945504087193461
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.2687022900763359,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.6244274809160305
                ]
              }
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.42779291553133514,
            0.9467849223946785,
            0.555858310626703
          ],
          "phoneArt": [
            0.022792022792022793,
            0.4687022900763359,
            0.9544159544159544,
            0.5190839694656488
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.2
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "light",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "img": "trad-process-name",
          "alt": "Unconnected teal architectural Second Brain, empty/dim procedure slot, distinct from the office and human actors.",
          "at": 1,
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.603515625,
            0.0068359375,
            0.390625,
            0.34375
          ],
          "room": "office",
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The Second Brain.\nIt keeps the firm’s\nchecked knowledge\nand owner decisions.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "characterIntro": true,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.1335149863760218,
            0.9467849223946785,
            0.8501362397820164
          ],
          "phoneArt": [
            0.022792022792022793,
            0.13740458015267176,
            0.9544159544159544,
            0.850381679389313
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.2
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "light",
              "preset": "sprout",
              "beats": 8,
              "strength": 0.35,
              "floors": 8
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "img": "trad-process-build",
          "alt": "Claude in the page coat and Codex in armour prepare a repo access-review skill; confidential document contents stay in protected files.",
          "at": 1,
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.006510416666666667,
            0.3603515625,
            0.3736979166666667,
            0.314453125
          ],
          "room": "office",
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "offpanel",
              "who": "matt",
              "text": "Build the procedure here. Keep private contents in protected files.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Owner, readers, allowed and refused tests, approval, review date.",
              "x": 0.026607538802660754,
              "y": 0.16212534059945505,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.5115803814713896
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.166412213740458,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.5218320610687023
                ]
              }
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.30926430517711173,
            0.9467849223946785,
            0.6743869209809265
          ],
          "phoneArt": [
            0.022792022792022793,
            0.32213740458015266,
            0.9544159544159544,
            0.665648854961832
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.2
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "light",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.4
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "phonePages": [
        [
          {
            "img": "trad-process-owner",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-process-name",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-process-build",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-sharing-procedure-conversion-20261010-v2",
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-background.png",
          "opacity": 1
        },
        {
          "id": "light",
          "role": "light",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-light.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-agents.png",
          "opacity": 0.97
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-props.png",
          "opacity": 1
        }
      ],
      "continues": false
    },
    {
      "id": "sharing-procedure-prep-2",
      "b": 0,
      "l": 4,
      "title": "Tuesday, 10:05 a.m.",
      "room": "office",
      "score": 0,
      "artCropInsetPct": 0,
      "panels": [
        {
          "img": "trad-process-harness",
          "alt": "Matt connects the prepared sharing skills to the vendor agents through the firm-specific operating method. No unapproved source or broad file contents enter.",
          "at": 1,
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.3860677083333333,
            0.3603515625,
            0.3216145833333333,
            0.314453125
          ],
          "room": "office",
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Claude and Codex are\nthe vendor harnesses.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The firm’s domain harness adds\nsharing skills, sources, tests\nand review.",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.19209809264305178,
            0.9467849223946785,
            0.7915531335149864
          ],
          "phoneArt": [
            0.022792022792022793,
            0.1984732824427481,
            0.9544159544159544,
            0.7893129770992366
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.2
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "light",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "img": "trad-process-permissions",
          "alt": "Over Matt’s shoulder: the task account’s actual file scope and removed access-grant capability are visible on the monitor FRONT, not its back.",
          "at": 1,
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.7135416666666666,
            0.3603515625,
            0.2805989583333333,
            0.314453125
          ],
          "room": "office",
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Each request uses the reader’s permissions. The AI cannot grant access.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.4247956403269755
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.42992366412213745
                ]
              }
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.18528610354223432,
            0.9467849223946785,
            0.7983651226158038
          ],
          "phoneArt": [
            0.022792022792022793,
            0.19083969465648856,
            0.9544159544159544,
            0.7969465648854962
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.2
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "light",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "img": "trad-process-refusal",
          "alt": "Operator-facing actual test: reopen all 412 links is denied by the permission boundary. No access opens; Codex stays digital with the accepted identity.",
          "at": 1,
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.006510416666666667,
            0.68359375,
            0.3912760416666667,
            0.306640625
          ],
          "room": "office",
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Reopen all links: denied.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.46771117166212534
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.47587786259541986
                ]
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "offpanel",
              "who": "matt",
              "text": "The owner authorizes it. You verify the link.",
              "x": 0.026607538802660754,
              "y": 0.11989100817438691,
              "w": 0.9467849223946785,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.12213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.24659400544959129,
            0.9467849223946785,
            0.7370572207084468
          ],
          "phoneArt": [
            0.022792022792022793,
            0.2564885496183206,
            0.9544159544159544,
            0.7312977099236642
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.2
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "light",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.4
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "phonePages": [
        [
          {
            "img": "trad-process-harness",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-process-permissions",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-process-refusal",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-sharing-procedure-conversion-20261010-v2",
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-background.png",
          "opacity": 1
        },
        {
          "id": "light",
          "role": "light",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-light.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-agents.png",
          "opacity": 0.97
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "sharing-procedure-prep-3",
      "b": 0,
      "l": 4,
      "title": "Tuesday, 10:05 a.m.",
      "room": "office",
      "score": 0,
      "artCropInsetPct": 0,
      "panels": [
        {
          "img": "trad-process-brain",
          "alt": "Dana and Matt retain the first sharing procedure with owner and review date in one teal knowledge floor. Its recipient and allowed/refused deed tests are explicitly pending until next scene.",
          "at": 1,
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.404296875,
            0.68359375,
            0.58984375,
            0.306640625
          ],
          "room": "office",
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "I’ll keep the procedure with its owner. Private files keep their access rules.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.9826296784970618,
              "tail": [
                0.5,
                0.5783378746594006
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.5923664122137404
                ]
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "One deed first. The rest still need owners.",
              "x": 0.00868516075146906,
              "y": 0.18256130790190736,
              "w": 0.9826296784970618,
              "tail": [
                0.5,
                0.5783378746594006
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.18778625954198475,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.5923664122137404
                ]
              }
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Procedure saved.\nRecipient and access tests\nstill pending.",
              "x": 0.00868516075146906,
              "y": 0.3065395095367847,
              "w": 0.9826296784970618,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.3190839694656489,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.40463215258855584,
            0.9826296784970618,
            0.5790190735694822
          ],
          "phoneArt": [
            0.022792022792022793,
            0.42290076335877863,
            0.9544159544159544,
            0.5648854961832062
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.2
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "light",
              "preset": "sprout",
              "beats": 8,
              "strength": 0.35,
              "floors": 8
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.4
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "phonePages": [
        [
          {
            "img": "trad-process-brain",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-sharing-procedure-conversion-20261010-v2",
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-background.png",
          "opacity": 1
        },
        {
          "id": "light",
          "role": "light",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-light.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-agents.png",
          "opacity": 0.97
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-sharing-procedure-conversion-20261010-v2-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "deed",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-deed-call",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-deed-recipient",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-deed-conversion-20261010-v5",
      "b": 0,
      "l": 0,
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.01008827238335435,
            0.016129032258064516,
            0.6141235813366961,
            0.3336693548387097
          ],
          "img": "trad-deed-call",
          "alt": "Dana calls the current responsible partner beside Matt; the specific deed and the noon completion time are visible on the desk.",
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28. Tuesday,\n10:15 a.m.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Who needs this deed?\nI'll restore only\nthat access.",
              "x": 0.017501206854055977,
              "y": 0.09400544959128065,
              "w": 0.964997586291888,
              "tail": [
                0.43,
                0.43337874659400544
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.43,
                  0.4395419847328244
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.19754768392370572,
            0.964997586291888,
            0.7861035422343324
          ],
          "phoneArt": [
            0.022792022792022793,
            0.20458015267175572,
            0.9544159544159544,
            0.783206106870229
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.637452711223203,
            0.016129032258064516,
            0.3530895334174023,
            0.3336693548387097
          ],
          "img": "trad-deed-recipient",
          "alt": "Dana writes down the responsible partner’s confirmation beside the intended external lawyer’s contact card.",
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The responsible partner\nconfirmed the recipient.\nOne lawyer. One deed.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.11444141689373297,
            0.964997586291888,
            0.8692098092643051
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-props.png",
          "opacity": 1
        }
      ],
      "continues": false
    },
    {
      "id": "deed-proof",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-deed-test",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-deed-received",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-deed-conversion-20261010-v5",
      "b": 0,
      "l": 0,
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.01008827238335435,
            0.3699596774193548,
            0.6141235813366961,
            0.6159274193548387
          ],
          "img": "trad-deed-test",
          "alt": "Dominant panel: Codex creates the narrow permission while Dana checks the intended recipient can open the deed. A second view of an unrelated account remains refused. Matt watches without operating the controls.",
          "sfx": [
            {
              "kind": "click",
              "gain": 0.38
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Owner and recipient recorded. The lawyer can open it. An unrelated account cannot.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.8,
                0.5106267029972752
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.8,
                  0.5207633587786259
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Send the checked link.",
              "x": 0.017501206854055977,
              "y": 0.20435967302452315,
              "w": 0.964997586291888,
              "tail": [
                0.43,
                0.5106267029972752
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.21068702290076335,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.43,
                  0.5207633587786259
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.3079019073569482,
            0.964997586291888,
            0.6757493188010899
          ],
          "phoneArt": [
            0.022792022792022793,
            0.32061068702290074,
            0.9544159544159544,
            0.667175572519084
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.637452711223203,
            0.3699596774193548,
            0.3530895334174023,
            0.18850806451612903
          ],
          "img": "trad-deed-received",
          "alt": "Dana receives confirmation from the lawyer, phone beside the specific deed reference.",
          "sfx": [
            {
              "kind": "buzz",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Received.\nWe can complete\nat noon.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.43,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.43,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.11989100817438691,
            0.964997586291888,
            0.8637602179836512
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "deed-followup",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-deed-breath",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-deed-list",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-deed-conversion-20261010-v5",
      "b": 0,
      "l": 0,
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.637452711223203,
            0.5776209677419355,
            0.3530895334174023,
            0.20766129032258066
          ],
          "img": "trad-deed-breath",
          "alt": "Dana exhales at her desk, fingers loosening on the pen; an unresolved-link list still lies beside the successful deed.",
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "One closing saved.\nThe rest still\nneeded owners.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.11444141689373297,
            0.964997586291888,
            0.8692098092643051
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.637452711223203,
            0.8054435483870968,
            0.3530895334174023,
            0.18044354838709678
          ],
          "img": "trad-deed-list",
          "alt": "Dana marks the deed’s owner and recipient decision on the review list and starts the next row.",
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Next link.\nWho answers\nfor this one?",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.43,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.43,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.11989100817438691,
            0.964997586291888,
            0.8637602179836512
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-deed-conversion-20261010-v5-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "owners",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-door-to-door",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-owners-conversion-20261010-v4",
      "b": 260,
      "l": 60,
      "rapid": true,
      "title": "Tuesday to Thursday.",
      "room": "office",
      "score": 0.1,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.006309148264984227,
            0.010080645161290322,
            0.32302839116719245,
            0.47580645161290325
          ],
          "img": "trad-door-to-door",
          "alt": "Dana at a partner's office door with the list and a pen; behind her Claude, its visor now teal.",
          "sfx": [
            {
              "kind": "door",
              "gain": 0.4
            }
          ],
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28.\nTuesday to Thursday.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.9826296784970618,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 3,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "This link. Yours?\nWho needs it?",
              "x": 0.00868516075146906,
              "y": 0.09400544959128065,
              "w": 0.9826296784970618,
              "tail": [
                0.5,
                0.41811989100817437
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.42351145038167937
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.17574931880108993,
            0.9826296784970618,
            0.8079019073569482
          ],
          "phoneArt": [
            0.022792022792022793,
            0.18167938931297709,
            0.9544159544159544,
            0.8061068702290076
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents-main",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-standing",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-input",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "agents-main",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-main.png",
          "opacity": 1
        },
        {
          "id": "agents-standing",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-standing.png",
          "opacity": 1
        },
        {
          "id": "agents-input",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-input.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": false
    },
    {
      "id": "owners-notes",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-owner-points",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-claude-teal",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-owners-conversion-20261010-v4",
      "b": 260,
      "l": 60,
      "rapid": true,
      "title": "Tuesday to Thursday.",
      "room": "office",
      "score": 0.1,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 11.5,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.34321766561514194,
            0.010080645161290322,
            0.3160883280757098,
            0.47580645161290325
          ],
          "img": "trad-owner-points",
          "alt": "A current practice lead accepts responsibility for a link whose creator has left. Dana records the new owner next to the old creation history; do not draw the departed creator returning to approve it.",
          "balloons": [
            {
              "at": 12,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "A current owner\nwas found or appointed\nfor every link.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.11444141689373297,
            0.964997586291888,
            0.8692098092643051
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents-main",
              "preset": "still"
            },
            {
              "layerId": "agents-standing",
              "preset": "still"
            },
            {
              "layerId": "agents-input",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 19.5,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.6725552050473186,
            0.010080645161290322,
            0.3211356466876972,
            0.47580645161290325
          ],
          "img": "trad-claude-teal",
          "alt": "Claude, visor teal, writes an owner's name onto a page of its coat; behind it a dark lattice of floors, three of them lit teal.",
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "balloons": [
            {
              "at": 20,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Complaint access:\nDana and three partners.\nConfirmed.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.37997275204359676
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.3829007633587786
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.12125340599455041,
            0.964997586291888,
            0.8623978201634878
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12366412213740458,
            0.9544159544159544,
            0.8641221374045801
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents-main",
              "preset": "still",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-standing",
              "preset": "still",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-input",
              "preset": "still",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "agents-main",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-main.png",
          "opacity": 1
        },
        {
          "id": "agents-standing",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-standing.png",
          "opacity": 1
        },
        {
          "id": "agents-input",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-input.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "owners-access",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-codex-teal",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-owners-conversion-20261010-v4",
      "b": 260,
      "l": 60,
      "rapid": true,
      "title": "Tuesday to Thursday.",
      "room": "office",
      "score": 0.1,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 24.5,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.006309148264984227,
            0.5090725806451613,
            0.32302839116719245,
            0.4808467741935484
          ],
          "img": "trad-codex-teal",
          "alt": "Codex, gauntlets teal now, closes one thread with care while its owner watches.",
          "sfx": [
            {
              "kind": "click",
              "gain": 0.4
            }
          ],
          "balloons": [
            {
              "at": 25,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Broad link closed.\nApproved access kept.\nOwner told.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.9826296784970618,
              "tail": [
                0.5,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.11989100817438691,
            0.9826296784970618,
            0.8637602179836512
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents-main",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-standing",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-input",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "agents-main",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-main.png",
          "opacity": 1
        },
        {
          "id": "agents-standing",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-standing.png",
          "opacity": 1
        },
        {
          "id": "agents-input",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-input.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "owners-knowledge",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-lattice",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-dana-gate",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-owners-conversion-20261010-v4",
      "b": 260,
      "l": 60,
      "rapid": true,
      "title": "Tuesday to Thursday.",
      "room": "office",
      "score": 0.1,
      "villains": [
        "shadow"
      ],
      "panels": [
        {
          "at": 29,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.34321766561514194,
            0.5090725806451613,
            0.3160883280757098,
            0.4808467741935484
          ],
          "img": "trad-lattice",
          "alt": "Wide: the lattice behind Claude and Codex rises like the tower's double, dozens of floors lit teal, more lighting as people answer.",
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 29.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "The decision stays\nwith its owner\nand review date.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.5077656675749318
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.5186259541984732
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 31,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Bourque & Coffey’s\nSecond Brain.",
              "x": 0.017501206854055977,
              "y": 0.11852861035422343,
              "w": 0.964997586291888,
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.12061068702290076,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.5186259541984732
                ]
              },
              "tail": [
                0.5,
                0.5077656675749318
              ],
              "anchor": "free"
            },
            {
              "at": 31,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "The procedure stays.\nPrivate files keep\ntheir access rules.",
              "x": 0.017501206854055977,
              "y": 0.20027247956403268,
              "w": 0.964997586291888,
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.20763358778625954,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.5186259541984732
                ]
              },
              "tail": [
                0.5,
                0.5077656675749318
              ],
              "anchor": "free"
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.30381471389645776,
            0.964997586291888,
            0.6798365122615804
          ],
          "phoneArt": [
            0.022792022792022793,
            0.31755725190839695,
            0.9544159544159544,
            0.6702290076335878
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents-main",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-standing",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-input",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 38.5,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.6725552050473186,
            0.5090725806451613,
            0.3211356466876972,
            0.4808467741935484
          ],
          "img": "trad-dana-gate",
          "alt": "Dana at her desk, the list under her hand, Codex waiting at her side for her nod; Matt at the edge of the frame.",
          "balloons": [
            {
              "at": 39,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Nothing changes\nuntil its owner\nsays yes.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.5478201634877384
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.5603053435114503
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 40.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Keep the owner and review date current. The permissions must match.",
              "x": 0.017501206854055977,
              "y": 0.11852861035422343,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.5478201634877384
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.12061068702290076,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.5603053435114503
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 42,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Thursday, 6:10 p.m.\nEvery link had a name.",
              "x": 0.017501206854055977,
              "y": 0.28337874659400547,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.29465648854961835,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.36103542234332425,
            0.964997586291888,
            0.6226158038147139
          ],
          "phoneArt": [
            0.022792022792022793,
            0.37709923664122136,
            0.9544159544159544,
            0.6106870229007634
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents-main",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-standing",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agents-input",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "agents-main",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-main.png",
          "opacity": 1
        },
        {
          "id": "agents-standing",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-standing.png",
          "opacity": 1
        },
        {
          "id": "agents-input",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-agents-input.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-owners-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "complaint-checks",
      "b": 0,
      "l": 4,
      "title": "Thursday, 6:12 p.m.",
      "room": "office",
      "score": 0,
      "artCropInsetPct": 0,
      "panels": [
        {
          "img": "trad-process-complaint-denied",
          "alt": "A controlled test uses Potvin’s identity on the complaint; the actual retrieve AND summarize route refuses. No complaint contents displayed.",
          "at": 1,
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0,
            0,
            1,
            0.49609375
          ],
          "room": "office",
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28, Bourque & Coffey.\nThursday, 6:12 p.m.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "I can’t fetch or summarize that file for this account.",
              "x": 0.017501206854055977,
              "y": 0.09400544959128065,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.46389645776566757
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.48656488549618315
                ]
              }
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.24114441416893734,
            0.964997586291888,
            0.7425068119891008
          ],
          "phoneArt": [
            0.022792022792022793,
            0.2717557251908397,
            0.9544159544159544,
            0.716030534351145
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.18
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.4
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        },
        {
          "img": "trad-process-complaint-checked",
          "alt": "Dana compares the actual protected reader list with the owner-approved register: Dana plus three partners, with Potvin explicitly denied; owner and review date remain recorded.",
          "at": 1,
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0,
            0.501953125,
            1,
            0.498046875
          ],
          "room": "office",
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "These three partners and me. Keep it that way.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.48010899182561306
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.4887022900763359
                ]
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Test it again when the owner or readers change.",
              "x": 0.017501206854055977,
              "y": 0.14168937329700274,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.48010899182561306
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.1450381679389313,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.4887022900763359
                ]
              }
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.26430517711171664,
            0.964997586291888,
            0.7193460490463215
          ],
          "phoneArt": [
            0.022792022792022793,
            0.2748091603053435,
            0.9544159544159544,
            0.7129770992366412
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.18
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ],
          "sfx": []
        }
      ],
      "phonePages": [
        [
          {
            "img": "trad-process-complaint-denied",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-process-complaint-checked",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-complaint-checks-conversion-20261010-v4",
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-complaint-checks-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-complaint-checks-conversion-20261010-v4-agents.png",
          "opacity": 0.97
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-complaint-checks-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-complaint-checks-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": false
    },
    {
      "id": "friday",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-boardroom",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-potvin-looks",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-friday-conversion-20261010-v4",
      "b": 320,
      "l": 48,
      "title": "Friday, 3:58 p.m.",
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.006309148264984227,
            0.010080645161290322,
            0.5457413249211357,
            0.4647177419354839
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "img": "trad-boardroom",
          "alt": "Wide: the boardroom, rain on the window, two partners at the head of the long table, Potvin seated on the left; Dana in the doorway on the right with a folder and her pen.",
          "sfx": [
            {
              "kind": "door",
              "gain": 0.4
            }
          ],
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28, the boardroom.\nFriday, 3:58 p.m.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.09400544959128065,
            0.964997586291888,
            0.8896457765667575
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "humans-board",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 7.5,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.5652996845425867,
            0.010080645161290322,
            0.15772870662460567,
            0.4647177419354839
          ],
          "img": "trad-potvin-looks",
          "alt": "Close: Potvin, screen left, looks up at her. He already knows.",
          "sfx": [
            {
              "kind": "heartbeat"
            }
          ],
          "balloons": [],
          "pageArt": [
            0.017501206854055977,
            0.0326975476839237,
            0.964997586291888,
            0.9509536784741145
          ],
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "humans-board",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "humans-board",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-humans-board.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": false
    },
    {
      "id": "friday-invoices",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-dana-sits",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-two-hands",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-friday-conversion-20261010-v4",
      "b": 320,
      "l": 48,
      "title": "Friday, 3:58 p.m.",
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 9,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.7362776025236593,
            0.010080645161290322,
            0.25741324921135644,
            0.4647177419354839
          ],
          "phoneArt": [
            0.022792022792022793,
            0.23206106870229007,
            0.9544159544159544,
            0.7557251908396947
          ],
          "img": "trad-dana-sits",
          "alt": "Dana, screen right, sits and fans the twelve invoices across the table.",
          "sfx": [
            {
              "kind": "paper"
            }
          ],
          "balloons": [
            {
              "at": 9.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Twelve invoices.\nI'll take you\nthrough them.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.4514986376021798
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.4587786259541985
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "thought",
              "state": "thought",
              "who": "dana",
              "text": "He already knows.\nThe client still\ndeserves an answer.",
              "x": 0.017501206854055977,
              "y": 0.11852861035422343,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.4514986376021798
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.12061068702290076,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.4587786259541985
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017501206854055977,
            0.22343324250681199,
            0.964997586291888,
            0.7602179836512262
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "humans-board",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 15.5,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.006309148264984227,
            0.4959677419354839,
            0.2883280757097792,
            0.4939516129032258
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "img": "trad-two-hands",
          "alt": "Close, from above: Potvin's hand flat on the table, Dana's pen on the invoices, the gap between them.",
          "balloons": [
            {
              "at": 16,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "He had known since Monday.\nNo owner could\nundo that.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.11444141689373297,
            0.964997586291888,
            0.8692098092643051
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "humans-board",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "humans-board",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-humans-board.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "friday-records",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-dana-asks",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-friday-conversion-20261010-v4",
      "b": 320,
      "l": 48,
      "title": "Friday, 3:58 p.m.",
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 23.5,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.3078864353312303,
            0.4959677419354839,
            0.16466876971608832,
            0.4939516129032258
          ],
          "img": "trad-dana-asks",
          "alt": "Evening: Dana back at her desk, the floor empty, typing.",
          "sfx": [
            {
              "kind": "keys"
            }
          ],
          "balloons": [
            {
              "at": 24,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "5:40 p.m.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.9826296784970618,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 25.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Who can open\nmy complaint?",
              "x": 0.00868516075146906,
              "y": 0.07356948228882834,
              "w": 0.9826296784970618,
              "tail": [
                0.5,
                0.40381471389645773
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.07480916030534351,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.40961832061068704
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.1553133514986376,
            0.9826296784970618,
            0.8283378746594006
          ],
          "phoneArt": [
            0.022792022792022793,
            0.1618320610687023,
            0.9544159544159544,
            0.8259541984732824
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "humans-board",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "humans-board",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-humans-board.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    },
    {
      "id": "friday-checked",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "trad-claude-answers-right",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ],
        [
          {
            "img": "trad-window",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/traditional/traditional-friday-conversion-20261010-v4",
      "b": 320,
      "l": 48,
      "title": "Friday, 3:58 p.m.",
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 31.5,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.48580441640378547,
            0.4959677419354839,
            0.17287066246056781,
            0.4939516129032258
          ],
          "img": "trad-claude-answers-right",
          "alt": "Claude in the screen light, visor teal, a page of its coat showing three names.",
          "balloons": [
            {
              "at": 32,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Three partners.\nAnd you.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "tail": [
                0.5,
                0.3628065395095368
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.3647328244274809
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.09673024523160763,
            0.964997586291888,
            0.8869209809264306
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09770992366412214,
            0.9544159544159544,
            0.8900763358778626
          ],
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "humans-board",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 36,
          "room": "office",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.6719242902208202,
            0.4959677419354839,
            0.3217665615141956,
            0.4939516129032258
          ],
          "img": "trad-window",
          "alt": "Dana at the window of the dark office, King Street West below in the rain; behind her, across the floor, Potvin's office light is still on.",
          "motion": {
            "preset": "push",
            "strength": 0.2,
            "beats": 4
          },
          "balloons": [
            {
              "at": 36.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Some things\ncan't be unread.",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [],
          "pageArt": [
            0.017501206854055977,
            0.09400544959128065,
            0.964997586291888,
            0.8896457765667575
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "humans-board",
              "preset": "still"
            },
            {
              "layerId": "props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "background",
          "role": "background",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-background.png",
          "opacity": 1
        },
        {
          "id": "agents",
          "role": "agents",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-agents.png",
          "opacity": 1
        },
        {
          "id": "humans",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-humans.png",
          "opacity": 1
        },
        {
          "id": "humans-board",
          "role": "humans",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-humans-board.png",
          "opacity": 1
        },
        {
          "id": "props",
          "role": "props",
          "src": "/comic/traditional/layers/traditional-friday-conversion-20261010-v4-props.png",
          "opacity": 1
        }
      ],
      "continues": true
    }
  ],
  "next": {
    "sound": {
      "score": 0,
      "room": "none",
      "fadeBeats": 1.5
    },
    "b": 368,
    "heading": "Winter, under King Street West.",
    "choices": [
      {
        "label": "Eight weeks to leave a system older than the web.",
        "href": "/data-migrations-b/",
        "img": "trad-next-dana"
      },
      {
        "label": "Sam. The training records are gone.",
        "href": "/agentic-systems-b/",
        "img": "trad-next-sam"
      },
      {
        "label": "Find out who can open what.",
        "href": "/traditional-systems/roles-access-control/",
        "img": "trad-hands-map"
      },
      {
        "label": "Get governance ready before the assistant reads it.",
        "href": "/traditional-systems/information-governance-ai-readiness/",
        "img": "trad-dana-label"
      }
    ]
  },
  "collapseTo": ".page-art"
});
