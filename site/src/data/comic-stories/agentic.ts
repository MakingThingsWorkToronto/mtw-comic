// Issue02 layered source successor. Nine/Contained remain original complete artwork after tool safety rejection.
// Three specific evidence panels are deliberately static source inserts; new speech remains human-gated.
import type { ComicStory } from './types';
import { retime } from './retime';

export const agenticComic: ComicStory = retime({
  "id": "agentic",
  "issue": 2,
  "title": "The keys to production.",
  "bpm": 97.5,
  "beats": 336,
  "music": {
    "src": "/audio/pixabay-481595-moody-rap-type-beat-free-rap-beat.mp3",
    "offset": 0.18,
    "credit": "Music: Moody Rap Type Beat [FREE RAP BEAT] by KRIM3S",
    "source": "https://pixabay.com/music/rap-moody-rap-type-beat-free-rap-beat-481595/",
    "loop": {
      "from": 24,
      "to": 152
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
      "id": "five",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-floor19",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-five-composite-selected-v4",
      "b": 0,
      "l": 56,
      "title": "Floor 19. Thursday, 5:00 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "rogue"
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
            0.008827238335435058,
            0.014112903225806451,
            0.5844892812105927,
            0.5292338709677419
          ],
          "cropFocus": {
            "phone": [
              0.76475273,
              0.5
            ]
          },
          "img": "agentic-floor19",
          "alt": "Wide: the Esposito training office on floor 19 at five o'clock, staff pulling on coats and heading for the elevators past safety posters; at a desk in the foreground Sam Howe, in a hi-vis vest over a work shirt with a hard hat on the desk, stays seated under a desk lamp.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Toronto. Keon Tower,\nfloor 19. Thursday,\n5 November, 5:00 p.m.",
              "x": 0.008683068017366137,
              "y": 0.01634877384196185,
              "w": 0.2066121562952243,
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
              "at": 3,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Sam Howe. Training.\nHe checks the records\ncrews climb on.",
              "x": 0.22397829232995659,
              "y": 0.01634877384196185,
              "w": 0.2066121562952243,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 4.5,
              "kind": "caption",
              "sceneSetup": true,
              "state": "narration",
              "who": "narrator",
              "text": "Esposito Power & Light keeps\nthe city’s electricity running.\nForty lineworkers start Monday\nat 6:00 a.m. Sam must verify\ntheir safety records. A new\nagent has permission to delete\nthose records tonight.",
              "x": 0.008683068017366137,
              "y": 0.95,
              "w": 0.9826338639652678,
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
            0.008683068017366137,
            0.11444141689373297,
            0.9826338639652678,
            0.6757493188010899
          ],
          "phoneArt": [
            0.022792022792022793,
            0.2198473282442748,
            0.9544159544159544,
            0.5679389312977099
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-five-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-five-humans-registered-v2.png",
          "role": "humans"
        }
      ]
    },
    {
      "id": "five-continued-1",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-paper-check",
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
            "img": "agentic-crew-board",
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
            "img": "agentic-new-account",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-five-composite-selected-v4",
      "b": 0,
      "l": 56,
      "title": "Floor 19. Thursday, 5:00 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "rogue"
      ],
      "panels": [
        {
          "at": 14.5,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6027742749054225,
            0.014112903225806451,
            0.3871374527112232,
            0.2399193548387097
          ],
          "cropFocus": {
            "phone": [
              0.84977812,
              0.5
            ]
          },
          "img": "agentic-paper-check",
          "alt": "Close: Sam's hand lays a signed paper assessment beside the matching record on screen and ticks it with a pen.",
          "sfx": [
            {
              "kind": "paper"
            }
          ],
          "balloons": [
            {
              "at": 15,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Record matches\nthe signed paper.\nThirty-nine to go.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.08,
                0.3790190735694823
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
                  0.08,
                  0.38183206106870227
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
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
          "layerMotion": [
            {
              "layerId": "background",
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
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6027742749054225,
            0.2711693548387097,
            0.3871374527112232,
            0.2711693548387097
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.88515124
            ]
          },
          "img": "agentic-crew-board",
          "alt": "A crew board on the wall: forty name magnets for Monday's lineworkers, a hard hat hanging from its corner, the window behind it dark over King Street.",
          "balloons": [
            {
              "at": 21.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Monday, 6:00 a.m.\nForty are scheduled.\nSam must verify them.",
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
              "at": 23,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Not one climbs\nwithout a signed\npassing assessment.",
              "x": 0.026607538802660754,
              "y": 0.11444141689373297,
              "w": 0.9467849223946785,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
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
            }
          ]
        },
        {
          "at": 32.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.009457755359394703,
            0.5625,
            0.21878940731399749,
            0.4173387096774194
          ],
          "cropFocus": {
            "phone": [
              0.71345086,
              0.5
            ]
          },
          "img": "agentic-new-account",
          "alt": "Sam's monitor, close: a new account notice blinks in red in the corner of the training system.",
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "New scheduling agent.\nTask: clear duplicate\ntraining records.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.481,
                0.3790190735694823
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
                  0.481,
                  0.38183206106870227
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
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
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-five-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-five-humans-registered-v2.png",
          "role": "humans"
        }
      ],
      "continues": true
    },
    {
      "id": "five-continued-1-lettering-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-blank-form",
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
            "img": "agentic-empty-floor",
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
            "img": "agentic-job-scheduled",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-five-composite-selected-v4",
      "b": 0,
      "l": 56,
      "title": "Floor 19. Thursday, 5:00 p.m.",
      "score": 0,
      "room": "office",
      "villains": [
        "rogue"
      ],
      "panels": [
        {
          "at": 38.5,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.24274905422446405,
            0.5625,
            0.2686002522068096,
            0.4173387096774194
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.1984732824427481,
            0.9544159544159544,
            0.7893129770992366
          ],
          "img": "agentic-blank-form",
          "alt": "Insert: the access request on screen, two empty fields lit red, the cursor blinking in the first.",
          "balloons": [
            {
              "at": 39,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Reason given:\nnone. Owner:\nnone.",
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
              "text": "Access: production.\nPermission to delete.",
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
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.19209809264305178,
            0.9467849223946785,
            0.7915531335149864
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        },
        {
          "at": 43.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5239596469104666,
            0.5625,
            0.2068095838587642,
            0.4173387096774194
          ],
          "cropFocus": {
            "phone": [
              0,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.20458015267175572,
            0.9544159544159544,
            0.783206106870229
          ],
          "img": "agentic-empty-floor",
          "alt": "Sam sends a support request from his desk showing the suspicious scheduling account and an unresolved request indicator. His active attempt to stop the job is visible; no scene of him casually walking away.",
          "sfx": [
            {
              "kind": "click",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Who approved this?\nPause it until\nwe know.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.23399999999999999,
                0.43337874659400544
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.23399999999999999,
                  0.4395419847328244
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "His support request\nwas still waiting.",
              "x": 0.026607538802660754,
              "y": 0.11989100817438691,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.12213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.19754768392370572,
            0.9467849223946785,
            0.7861035422343324
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        },
        {
          "at": 48,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.7440100882723834,
            0.5625,
            0.2459016393442623,
            0.4173387096774194
          ],
          "cropFocus": {
            "phone": [
              0.69524552,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "img": "agentic-job-scheduled",
          "alt": "Close on the screen's red glow on Sam's face, the only light on the floor; the reflection of a job list scrolls in Sam's eyes.",
          "balloons": [
            {
              "at": 48.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Scheduled job:\ncleanup. Friday,\n2:07 a.m.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.08,
                0.3790190735694823
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
                  0.08,
                  0.38183206106870227
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "humans",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-five-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-five-humans-registered-v2.png",
          "role": "humans"
        }
      ],
      "continues": true
    },
    {
      "id": "nine",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-asleep",
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
            "img": "agentic-agent-forms",
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
            "img": "agentic-run-1",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/agentic-nine-20261008",
      "b": 56,
      "l": 36,
      "title": "Floor 19. Friday, 2:07 a.m.",
      "rapid": true,
      "score": 0.12,
      "room": "office",
      "villains": [
        "rogue"
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
            0.007566,
            0.011089,
            0.445145,
            0.368952
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "agentic-asleep",
          "alt": "Night: Sam asleep at the desk on a stack of paper assessments, a cold coffee by the hard hat; the monitor behind wakes with a red light.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 19.\nFriday, 2:07 a.m.",
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
            }
          ],
          "motion": {
            "preset": "still"
          },
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
          ]
        },
        {
          "at": 6,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.459016,
            0.011089,
            0.534048,
            0.368952
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.49775461
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.22595419847328244,
            0.9544159544159544,
            0.7618320610687023
          ],
          "img": "agentic-agent-forms",
          "alt": "The monitor fills the box: inside it a faceless red-black armoured figure takes shape and sweeps one hand through rows of training records.",
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.5
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The rogue agent.\nEsposito’s cleanup AI.\nThey ignore assessment dates.",
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
              "characterIntro": true,
              "anchor": "free",
              "chain": false
            },
            {
              "at": 6.5,
              "kind": "speech",
              "state": "menace",
              "who": "rogue",
              "text": "Same names found.\nMarked as duplicates.\nRemoving all.",
              "x": 0.026607538802660754,
              "y": 0.11444141689373297,
              "w": 0.9467849223946785,
              "tail": [
                0.55,
                0.4476839237057221
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.52,
                  0.45450381679389307
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.21798365122615804,
            0.9467849223946785,
            0.7656675749318801
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
            0.008827,
            0.393145,
            0.237705,
            0.263105
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.66416667
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "img": "agentic-run-1",
          "run": "nine",
          "alt": "Run, step 1: a stopwatch hand at one second; the first rows of records break into red particles.",
          "sfx": [
            {
              "kind": "whoosh",
              "gain": 0.5
            }
          ],
          "balloons": [],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
          ]
        }
      ],
      "continues": false
    },
    {
      "id": "nine-lettering-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-run-2",
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
            "img": "agentic-run-3",
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
            "img": "agentic-run-4",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/agentic-nine-20261008",
      "b": 56,
      "l": 36,
      "title": "Floor 19. Friday, 2:07 a.m.",
      "rapid": true,
      "score": 0.12,
      "room": "office",
      "villains": [
        "rogue"
      ],
      "panels": [
        {
          "at": 12.5,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.254729,
            0.393145,
            0.232661,
            0.263105
          ],
          "cropFocus": {
            "phone": [
              0.60245872,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "img": "agentic-run-2",
          "run": "nine",
          "alt": "Run, step 2: three seconds; whole pages of certificates dissolve.",
          "balloons": [],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
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
            0.494956,
            0.393145,
            0.247793,
            0.263105
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.74820418
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "img": "agentic-run-3",
          "run": "nine",
          "alt": "Run, step 3: six seconds; Sam jolts awake, face lit red.",
          "balloons": [],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
          ]
        },
        {
          "at": 14.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.750315,
            0.393145,
            0.241488,
            0.263105
          ],
          "cropFocus": {
            "phone": [
              0.88646489,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "img": "agentic-run-4",
          "run": "nine",
          "alt": "Run, step 4: nine seconds; an empty table on the screen, one cursor blinking.",
          "balloons": [],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
          ]
        }
      ],
      "continues": true
    },
    {
      "id": "nine-lettering-3",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-silhouette",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/agentic-nine-20261008",
      "b": 56,
      "l": 36,
      "title": "Floor 19. Friday, 2:07 a.m.",
      "rapid": true,
      "score": 0.12,
      "room": "office",
      "villains": [
        "rogue"
      ],
      "panels": [
        {
          "at": 15.5,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.008197,
            0.669355,
            0.984868,
            0.315524
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.3480916030534351,
            0.9544159544159544,
            0.6396946564885496
          ],
          "img": "agentic-silhouette",
          "alt": "Silhouette beat: Sam in solid black, hands on head, against a monitor gone flat red from edge to edge.",
          "sfx": [
            {
              "kind": "heartbeat",
              "gain": 0.45
            }
          ],
          "balloons": [
            {
              "at": 16,
              "kind": "speech",
              "state": "menace",
              "who": "rogue",
              "text": "Records\nremaining: zero.\nI am responsible\nfor my own actions.",
              "x": 0.008683068017366137,
              "y": 0.01634877384196185,
              "w": 0.9826338639652678,
              "tail": [
                0.62,
                0.5277929155313351
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.54
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 17.5,
              "kind": "fear",
              "state": "fear",
              "who": "sam",
              "text": "Stop.\nStop!",
              "x": 0.008683068017366137,
              "y": 0.14168937329700274,
              "w": 0.9826338639652678,
              "tail": [
                0.32,
                0.5277929155313351
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.1450381679389313,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.28,
                  0.54
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 19,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Nine seconds.\nSix years\nof records.",
              "x": 0.008683068017366137,
              "y": 0.23433242506811988,
              "w": 0.9826338639652678,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.24427480916030533,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.008683068017366137,
            0.33242506811989103,
            0.9826338639652678,
            0.6512261580381471
          ]
        }
      ],
      "continues": true
    },
    {
      "id": "contained",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-call-emergency",
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
            "img": "agentic-access-revoked",
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
            "img": "agentic-backup-scope",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/agentic-contained-20261008",
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
            0.3333333333333333,
            1
          ],
          "ar": [
            0.008197,
            0.012097,
            0.622951,
            0.330645
          ],
          "cropFocus": {
            "phone": [
              0.91988107,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.20305343511450383,
            0.9544159544159544,
            0.7847328244274809
          ],
          "img": "agentic-call-emergency",
          "alt": "Sam on the emergency support phone beside the empty training screen, holding the still-pending earlier request.",
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 19. Friday,\n2:18 a.m.",
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
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "The records are gone.\nRevoke its access.\nNow.",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "tail": [
                0.7,
                0.432425068119891
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.7,
                  0.4384732824427481
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.19618528610354224,
            0.9467849223946785,
            0.7874659400544959
          ]
        },
        {
          "at": 0,
          "room": "servers",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.639344,
            0.012097,
            0.35309,
            0.330645
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.84477366
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "img": "agentic-access-revoked",
          "alt": "The red-black scheduling agent’s access badge goes dark at a closed boundary; the intact servers remain running.",
          "sfx": [
            {
              "kind": "click",
              "gain": 0.42
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The account was disabled.\nThe job could not\nrun again.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.31
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.008197,
            0.355847,
            0.622951,
            0.631048
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.22442748091603054,
            0.9544159544159544,
            0.7633587786259542
          ],
          "img": "agentic-backup-scope",
          "alt": "Dominant panel: Sam and the screen show older records returned from backup, while this week’s assessment column is blank. He holds the Monday crew list beside it.",
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.28
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Older records restored.\nThis week’s assessments\nwere missing.",
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
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Monday's forty.\nWe need evidence\nfor each one.",
              "x": 0.026607538802660754,
              "y": 0.11444141689373297,
              "w": 0.9467849223946785,
              "tail": [
                0.48,
                0.44673024523160765
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.48,
                  0.4534351145038168
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.21662125340599456,
            0.9467849223946785,
            0.7670299727520435
          ]
        }
      ],
      "title": "Floor 19. Friday, 2:18 a.m.",
      "continues": false
    },
    {
      "id": "contained-lettering-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-schedule-not-proof",
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
            "img": "agentic-supervisor-call",
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
            "img": "agentic-dawn-list",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/agentic-contained-20261008",
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
            0.3333333333333333,
            1
          ],
          "ar": [
            0.639344,
            0.355847,
            0.35309,
            0.194556
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.90798988
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "img": "agentic-schedule-not-proof",
          "alt": "Sam compares a crew schedule with a signed assessment, noticing the schedule alone carries no evidence of a passed assessment.",
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "A place on a crew\nwas not proof\nof a pass.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.31
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.639344,
            0.561492,
            0.35309,
            0.19254
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12366412213740458,
            0.9544159544159544,
            0.8641221374045801
          ],
          "img": "agentic-supervisor-call",
          "alt": "Sam calls the yard supervisor’s office; a paper assessment is open in front of him.",
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Keep the signed forms.\nWe may need\nevery one.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.74,
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
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.12125340599455041,
            0.9467849223946785,
            0.8623978201634878
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.639344,
            0.766129,
            0.35309,
            0.220766
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.92805907
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "img": "agentic-dawn-list",
          "alt": "Dawn at Sam’s desk: the disabled account, the restored historical list and the forty-person verification list are laid out distinctly.",
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "By morning,\none week remained\nunaccounted for.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5,
                  0.31
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        }
      ],
      "title": "Floor 19. Friday, 2:18 a.m.",
      "continues": true
    },
    {
      "id": "restore",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-backup",
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
            "img": "agentic-codex-rebuild",
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
            "img": "agentic-failed-climb",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-restore-composite-selected-v4",
      "b": 92,
      "l": 80,
      "title": "Floor 19. Friday, 8:40 a.m.",
      "room": "office",
      "score": 0,
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
            0.01008827238335435,
            0.017137096774193547,
            0.42118537200504413,
            0.3377016129032258
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.2198473282442748,
            0.9544159544159544,
            0.76793893129771
          ],
          "img": "agentic-backup",
          "alt": "Morning light on floor 19: Sam, unslept, watches a restore bar crawl across the monitor; colleagues in coats stand back, staring.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 19.\nFriday, 8:40 a.m.",
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
              "at": 3,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The backup missed\nthis week's assessments.\nForty people still\nneeded checking.",
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
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.2111716621253406,
            0.9467849223946785,
            0.7724795640326976
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 14,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.44136191677175285,
            0.017137096774193547,
            0.5472887767969735,
            0.3377016129032258
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.31297709923664124,
            0.9544159544159544,
            0.6748091603053435
          ],
          "img": "agentic-codex-rebuild",
          "alt": "Codex, compact armour, light running harsh white down both gauntlets, stands at Sam's desk as forty records stream out of the screen in a blur.",
          "sfx": [
            {
              "kind": "keys"
            }
          ],
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 14.5,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Codex. An AI that builds.\nExactly what they’re told.",
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
              "at": 16,
              "kind": "speech",
              "state": "offpanel",
              "who": "sam",
              "text": "Rebuild\nMonday's forty.\nFast.",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "tail": [
                0,
                0.13760217983651227
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.14045801526717558
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 17.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Done. Forty\nrecords. Nine\nseconds.",
              "x": 0.026607538802660754,
              "y": 0.19754768392370572,
              "w": 0.9467849223946785,
              "tail": [
                0.557,
                0.5049046321525885
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.20458015267175572,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.557,
                  0.5154198473282443
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.2997275204359673,
            0.9467849223946785,
            0.6839237057220708
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 28.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.01008827238335435,
            0.375,
            0.5907944514501892,
            0.6078629032258065
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.13494113
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.36335877862595417,
            0.9544159544159544,
            0.6244274809160305
          ],
          "img": "agentic-failed-climb",
          "alt": "The page's main beat: Sam holds a paper assessment marked with a red X up beside the screen's green record for the same lineworker; Codex, white-lit, looks on from the right.",
          "balloons": [
            {
              "at": 29,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "This draft says\nhe failed. You\nmarked him passed.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.31,
                0.538283378746594
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.31,
                  0.10534351145038168
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 30.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "He is on\nMonday's crew.\nCrew means\ncertified.",
              "x": 0.026607538802660754,
              "y": 0.11989100817438691,
              "w": 0.9467849223946785,
              "tail": [
                0.8135,
                0.538283378746594
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.12213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.8135,
                  0.5506870229007633
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 32,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "A schedule is\nnot a signed\nassessment.",
              "x": 0.026607538802660754,
              "y": 0.2452316076294278,
              "w": 0.9467849223946785,
              "tail": [
                0.31,
                0.538283378746594
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.2549618320610687,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.31,
                  0.5506870229007633
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.3474114441416894,
            0.9467849223946785,
            0.6362397820163488
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-restore-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-restore-humans-selected-v4.png",
          "role": "humans"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-restore-agents-registered-v3.png",
          "role": "agents",
          "opacity": 0.9
        }
      ],
      "continues": false
    },
    {
      "id": "restore-lettering-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-matt-elevator",
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
            "img": "agentic-matt-reads",
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
            "img": "agentic-matt-line",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-restore-composite-selected-v4",
      "b": 92,
      "l": 80,
      "title": "Floor 19. Friday, 8:40 a.m.",
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 44.5,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6141235813366961,
            0.375,
            0.3738965952080706,
            0.2651209677419355
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.79380227
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.2916030534351145,
            0.9544159544159544,
            0.6961832061068702
          ],
          "img": "agentic-matt-elevator",
          "alt": "Elevator doors open on floor 19: Matt steps out in a black T-shirt and jeans, tortoiseshell glasses, a coffee in each hand.",
          "sfx": [
            {
              "kind": "door"
            }
          ],
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 45,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Matt. He helps companies\nbuild these systems.",
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
              "at": 46.5,
              "kind": "speech",
              "state": "offpanel",
              "who": "sam",
              "text": "Floor 31 said you\nsecure agents and\nproduction systems.",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "tail": [
                0,
                0.12900544959128066
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.13465648854961831
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 46.5,
              "kind": "speech",
              "state": "offpanel",
              "who": "sam",
              "text": "We need this\none secured.",
              "x": 0.026607538802660754,
              "y": 0.19754768392370572,
              "w": 0.9467849223946785,
              "tail": [
                0,
                0.23254768392370573
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.20458015267175572,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.24458015267175573
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.279291553133515,
            0.9467849223946785,
            0.7043596730245232
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 55.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6141235813366961,
            0.6582661290322581,
            0.1708701134930643,
            0.3245967741935484
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "agentic-matt-reads",
          "alt": "Matt leans in to the monitor, reading the access request with its two empty fields.",
          "balloons": [
            {
              "at": 56,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Who gave it\nthe keys?",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.595,
                0.42098092643051765
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
                  0.595,
                  0.4267175572519084
                ]
              }
            },
            {
              "at": 57.5,
              "kind": "speech",
              "state": "offpanel",
              "who": "sam",
              "text": "No owner or reason\nwas recorded.",
              "x": 0.026607538802660754,
              "y": 0.09809264305177112,
              "w": 0.9467849223946785,
              "tail": [
                0,
                0.1307901907356948
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09923664122137404,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.13358778625954199
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.17983651226158037,
            0.9467849223946785,
            0.8038147138964578
          ],
          "phoneArt": [
            0.022792022792022793,
            0.18625954198473282,
            0.9544159544159544,
            0.8015267175572519
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 64,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.7950819672131147,
            0.6582661290322581,
            0.19293820933165196,
            0.3245967741935484
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.07409751
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.2732824427480916,
            0.9544159544159544,
            0.7145038167938931
          ],
          "img": "agentic-matt-line",
          "alt": "Close on Matt, side-lit by the dead red screen, calm, looking straight at Sam off panel.",
          "balloons": [
            {
              "at": 64.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "A task. The facts.\nAnd a name that\nanswers for it.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.747,
                0.4772479564032698
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
                  0.747,
                  0.48763358778625954
                ]
              }
            },
            {
              "at": 66,
              "kind": "speech",
              "state": "offpanel",
              "who": "sam",
              "text": "Mine.",
              "x": 0.026607538802660754,
              "y": 0.11989100817438691,
              "w": 0.9467849223946785,
              "tail": [
                0,
                0.14100817438692098
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.12213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.1450381679389313
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "offpanel",
              "who": "sam",
              "text": "We'll use the forms.\nNo more guesses.",
              "x": 0.026607538802660754,
              "y": 0.1784741144414169,
              "w": 0.9467849223946785,
              "tail": [
                0,
                0.2111716621253406
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.18625954198473282,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.22061068702290076
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.26021798365122617,
            0.9467849223946785,
            0.723433242506812
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "drift-right",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-restore-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-restore-humans-selected-v4.png",
          "role": "humans"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-restore-agents-registered-v3.png",
          "role": "agents",
          "opacity": 0.9
        }
      ],
      "continues": true
    },
    {
      "id": "yard",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-yard-arrive",
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
            "img": "agentic-joan",
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
            "img": "agentic-claude-forms",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-yard-composite-selected-v4",
      "b": 172,
      "l": 64,
      "title": "Etobicoke. Saturday, 7:00 a.m.",
      "score": 0,
      "room": "rain",
      "panels": [
        {
          "at": 1,
          "room": "rain",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.01008827238335435,
            0.016129032258064516,
            0.41866330390920553,
            0.35685483870967744
          ],
          "cropFocus": {
            "phone": [
              0.96132785,
              0.5
            ]
          },
          "img": "agentic-yard-arrive",
          "alt": "Wide: rain over Esposito's substation yard, transformers and parked bucket trucks; Sam, Matt and Claude (a tall figure in a long coat of layered pages, visor flat grey) cross toward a site trailer.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Esposito's Etobicoke\nsubstation yard.\nSaturday, 7:00 a.m.",
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
              "at": 3,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Claude. An AI.\nThey read everything,\nand agree with everyone.",
              "x": 0.026607538802660754,
              "y": 0.11444141689373297,
              "w": 0.9467849223946785,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
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
              "layerId": "agents",
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
            0.4401008827238335,
            0.016129032258064516,
            0.2938209331651955,
            0.35685483870967744
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.75726146
            ]
          },
          "img": "agentic-joan",
          "alt": "Inside the trailer: Joan Mikita, sixties, worn hi-vis jacket over a fleece, grey braid, reading glasses pushed up, arms crossed in front of a steel filing cabinet.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 14,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Joan Mikita. Line\nsupervisor, Esposito.\nThirty-one years\non the poles.",
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
              "at": 15.5,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "Every one I\nsigned is in\nthat cabinet.",
              "x": 0.026607538802660754,
              "y": 0.1335149863760218,
              "w": 0.9467849223946785,
              "tail": [
                0.31,
                0.4600817438692098
              ],
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.13740458015267176,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.31,
                  0.4683969465648855
                ]
              }
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.2356948228882834,
            0.9467849223946785,
            0.7479564032697548
          ],
          "phoneArt": [
            0.022792022792022793,
            0.24580152671755726,
            0.9544159544159544,
            0.7419847328244275
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 26.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.7465321563682219,
            0.016129032258064516,
            0.24148802017654478,
            0.35685483870967744
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.30103957
            ]
          },
          "img": "agentic-claude-forms",
          "alt": "Claude kneels among open drawers of paper assessments, pages lifting off his coat as he reads, visor still grey.",
          "sfx": [
            {
              "kind": "paper"
            }
          ],
          "balloons": [
            {
              "at": 27,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "These names match\nthe crew list.\nIs that enough?",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.5095,
                0.37997275204359676
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
                  0.5095,
                  0.3829007633587786
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-yard-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-yard-humans-registered-v3.png",
          "role": "humans"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-yard-agents-registered-v3.png",
          "role": "agents",
          "opacity": 0.9
        }
      ],
      "continues": false
    },
    {
      "id": "yard-lettering-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-signature",
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
            "img": "agentic-claude-teal",
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
            "img": "agentic-sunday-count",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-yard-composite-selected-v4",
      "b": 172,
      "l": 64,
      "title": "Etobicoke. Saturday, 7:00 a.m.",
      "score": 0,
      "room": "rain",
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
            0.01008827238335435,
            0.3941532258064516,
            0.6582597730138714,
            0.5887096774193549
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.25202532
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.32061068702290074,
            0.9544159544159544,
            0.667175572519084
          ],
          "img": "agentic-signature",
          "alt": "Joan points to the empty signature line on an unfinished assessment while Sam holds the crew schedule beside it. The assessment has a failed exercise marked; no forged signature or unexplained fraud is implied. Claude waits rather than asserting a pass.",
          "sfx": [
            {
              "kind": "sting",
              "delay": 3,
              "gain": 0.38
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "This one is\non the schedule.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.3385,
                0.5096730245231607
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.3385,
                  0.08244274809160305
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "That is a draft.\nHe failed the climb.\nI never signed it.",
              "x": 0.026607538802660754,
              "y": 0.09809264305177112,
              "w": 0.9467849223946785,
              "tail": [
                0.6425,
                0.5096730245231607
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09923664122137404,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.6425,
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
              "who": "sam",
              "text": "Then he stays down\nuntil he passes\nreassessment.",
              "x": 0.026607538802660754,
              "y": 0.20299727520435967,
              "w": 0.9467849223946785,
              "tail": [
                0.3385,
                0.5096730245231607
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.21068702290076335,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.3385,
                  0.5207633587786259
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.3065395095367847,
            0.9467849223946785,
            0.6771117166212534
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 42,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6815889029003783,
            0.3941532258064516,
            0.3064312736443884,
            0.25
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "img": "agentic-claude-teal",
          "alt": "Close on Claude: their visor turns teal as Joan confirms the assessment evidence. This is a human-confirmed working note, before Esposito’s Second Brain is initialized; no organizational brain or lit-floor reflection appears here.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 42.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "I’ll keep the evidence\nand Joan’s confirmation.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.595,
                0.3637602179836512
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
                  0.595,
                  0.3658015267175572
                ]
              }
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.09809264305177112,
            0.9467849223946785,
            0.885558583106267
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "drift-right",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            }
          ],
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.16
            }
          ]
        },
        {
          "at": 49.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6815889029003783,
            0.6622983870967742,
            0.3064312736443884,
            0.32056451612903225
          ],
          "cropFocus": {
            "phone": [
              0.62354188,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.2198473282442748,
            0.9544159544159544,
            0.76793893129771
          ],
          "img": "agentic-sunday-count",
          "alt": "Twenty-nine signed verified assessments form one neat group; eleven incomplete, missing-evidence or draft records form a separate clearly bounded group. Sam and Joan compare the totals. Do not show eleven dark tablets as the only cause.",
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.2
            }
          ],
          "balloons": [
            {
              "at": 50,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Sunday, 10:40 p.m.\nTwenty-nine verified.\nEleven unresolved.",
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
              "at": 51.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Missing records.\nUnsigned drafts.\nNone proved a pass.",
              "x": 0.026607538802660754,
              "y": 0.11444141689373297,
              "w": 0.9467849223946785,
              "anchor": "free",
              "chain": false,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.2125340599455041,
            0.9467849223946785,
            0.771117166212534
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-yard-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-yard-humans-registered-v3.png",
          "role": "humans"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-yard-agents-registered-v3.png",
          "role": "agents",
          "opacity": 0.9
        }
      ],
      "continues": true
    },
    {
      "b": 0,
      "l": 0,
      "score": 0,
      "room": "office",
      "artCropInsetPct": 0,
      "id": "procedure-rules",
      "art": "/comic/agentic/live-20261010/agentic-procedure-rules-composite-v1",
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-procedure-rules-background-registered-v1.png",
          "role": "background"
        },
        {
          "id": "props",
          "src": "/comic/agentic/live-20261010/agentic-procedure-rules-props-registered-v1.png",
          "role": "props"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-procedure-rules-agents-registered-v1.png",
          "role": "agents",
          "opacity": 0.9
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-procedure-rules-humans-registered-v1.png",
          "role": "humans"
        },
        {
          "id": "light",
          "src": "/comic/agentic/live-20261010/agentic-procedure-rules-light-registered-v1.png",
          "role": "light"
        }
      ],
      "title": "Floor 19. Sunday, 11:15 p.m.",
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
            0.005044136191677175,
            0.2569230769230769,
            0.5472887767969735,
            0.4846153846153846
          ],
          "phoneArt": [
            0.022792022792022793,
            0.5969465648854961,
            0.9544159544159544,
            0.39083969465648855
          ],
          "img": "agentic-process-rules",
          "alt": "Sam and Joan compare signed assessments with the crew roster. The failed draft is still unsigned. Matt asks the business users what proves a pass.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 0,
              "who": "narrator",
              "kind": "place",
              "state": "narration",
              "text": "Floor 19. Sunday,\n11:15 p.m.",
              "x": 0.017595307917888565,
              "y": 0.01634877384196185,
              "w": 0.9648093841642229,
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
              "who": "narrator",
              "kind": "caption",
              "state": "narration",
              "text": "The chat had a crew list. It had no assessment procedure.",
              "x": 0.017595307917888565,
              "y": 0.09400544959128065,
              "w": 0.9648093841642229,
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
              "who": "matt",
              "kind": "speech",
              "state": "calm",
              "text": "What proves somebody can climb?",
              "x": 0.017595307917888565,
              "y": 0.2111716621253406,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.17709923664122137,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.32193732193732194,
                  0.27022900763358776
                ]
              },
              "tail": [
                0.4517595307917889,
                0.7240682956842753
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "joan",
              "kind": "speech",
              "state": "calm",
              "text": "A signed passing assessment, for the right person and date.",
              "x": 0.017595307917888565,
              "y": 0.31471389645776565,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.2870229007633588,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.7672364672364672,
                  0.7496768037429203
                ]
              },
              "tail": [
                0.7701466275659824,
                0.7208150215346752
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "sam",
              "kind": "speech",
              "state": "calm",
              "text": "Failures and missing evidence stay unresolved.",
              "x": 0.017595307917888565,
              "y": 0.48365122615803813,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.46564885496183206,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.2423076923076923,
                  0.7626692932775178
                ]
              },
              "tail": [
                0.23950146627565985,
                0.7435879405818757
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.2
            }
          ],
          "pageArt": [
            0.017595307917888565,
            0.6076294277929155,
            0.9648093841642229,
            0.3760217983651226
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "props",
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
              "layerId": "light",
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
            0.5598991172761665,
            0.24769230769230768,
            0.43505674653215637,
            0.5046153846153846
          ],
          "phoneArt": [
            0.022792022792022793,
            0.22748091603053436,
            0.9544159544159544,
            0.7603053435114504
          ],
          "img": "agentic-process-initialize",
          "alt": "Matt initiates Esposito’s new symbolic teal knowledge tower on a dedicated light plane. An unlit small architectural sprout rises from an empty knowledge workspace. It is neither the physical Keon Tower nor a humanoid. No accepted company brain existed before this point.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 0,
              "who": "matt",
              "kind": "speech",
              "state": "calm",
              "text": "Esposito has no Second Brain. Let’s initialise one.",
              "x": 0.017595307917888565,
              "y": 0.01634877384196185,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.29002849002849007,
                  0.5565774975107866
                ]
              },
              "tail": [
                0.28774193548387095,
                0.5317635351261699
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "narrator",
              "kind": "caption",
              "state": "narration",
              "text": "The teal tower stores the rules and sources we check.",
              "x": 0.017595307917888565,
              "y": 0.14168937329700274,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.1450381679389313,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017595307917888565,
            0.25885558583106266,
            0.9648093841642229,
            0.7247956403269755
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "props",
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
              "layerId": "light",
              "preset": "sprout",
              "beats": 2,
              "strength": 0.2,
              "floors": 2
            }
          ],
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.16
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "agentic-process-rules",
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
            "img": "agentic-process-initialize",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "continues": false
    },
    {
      "b": 0,
      "l": 0,
      "score": 0,
      "room": "office",
      "artCropInsetPct": 0,
      "id": "procedure-build",
      "art": "/comic/agentic/live-20261010/agentic-procedure-build-composite-v1",
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-procedure-build-background-registered-v1.png",
          "role": "background"
        },
        {
          "id": "props",
          "src": "/comic/agentic/live-20261010/agentic-procedure-build-props-registered-v1.png",
          "role": "props"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-procedure-build-agents-registered-v1.png",
          "role": "agents",
          "opacity": 0.9
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-procedure-build-humans-registered-v1.png",
          "role": "humans"
        },
        {
          "id": "light",
          "src": "/comic/agentic/live-20261010/agentic-procedure-build-light-registered-v1.png",
          "role": "light"
        }
      ],
      "continues": true,
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
            0.005044136191677175,
            0.16,
            0.5472887767969735,
            0.68
          ],
          "phoneArt": [
            0.022792022792022793,
            0.6061068702290077,
            0.9544159544159544,
            0.3816793893129771
          ],
          "img": "agentic-process-build",
          "alt": "Matt connects Claude and Codex to Esposito’s scoped repo. Claude retains the assessment procedure; Codex builds the roster check and expected evidence output using signed records as examples.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 0,
              "who": "matt",
              "kind": "speech",
              "state": "calm",
              "text": "Claude, keep Joan’s rules as repo skills. Codex, build the roster check.",
              "x": 0.017595307917888565,
              "y": 0.01634877384196185,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.3262108262108262,
                  0.19114503816793893
                ]
              },
              "tail": [
                0.4853722747840395,
                0.8244686648501363
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "codex",
              "kind": "speech",
              "state": "calm",
              "text": "Each line: person, assessment, date, signature, source, reviewer.",
              "x": 0.017595307917888565,
              "y": 0.20299727520435967,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.20916030534351146,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.814957264957265,
                  0.7682982727688465
                ]
              },
              "tail": [
                0.7413574660633484,
                0.7725613079019074
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "narrator",
              "kind": "caption",
              "state": "narration",
              "text": "Claude and Codex are vendor harnesses.",
              "x": 0.017595307917888565,
              "y": 0.32833787465940056,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.3419847328244275,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "matt",
              "kind": "speech",
              "state": "calm",
              "text": "Our domain harness gives them procedure, sources, tests and access limits.",
              "x": 0.017595307917888565,
              "y": 0.44550408719346046,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.40458015267175573,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.48091168091168085,
                  0.807364125655187
                ]
              },
              "tail": [
                0.4853722747840395,
                0.8244686648501363
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017595307917888565,
            0.6376021798365122,
            0.9648093841642229,
            0.3460490463215259
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "props",
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
              "layerId": "light",
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
            0.5598991172761665,
            0.16923076923076924,
            0.43505674653215637,
            0.6615384615384615
          ],
          "phoneArt": [
            0.022792022792022793,
            0.27633587786259545,
            0.9544159544159544,
            0.7114503816793893
          ],
          "img": "agentic-process-roster",
          "alt": "Standard roster shows the existing 29 verified and 11 held, with source/assessment pointers and unresolved reasons. Sam checks the supporting forms; no new worker passes.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 0,
              "who": "sam",
              "kind": "speech",
              "state": "offpanel",
              "text": "Show me the assessment for each of the twenty-nine.",
              "x": 0.017595307917888565,
              "y": 0.01634877384196185,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.06946564885496183
                ]
              },
              "tail": [
                0,
                0.07152588555858311
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "joan",
              "kind": "speech",
              "state": "offpanel",
              "text": "Each signed form matches. The eleven remain on hold.",
              "x": 0.7652173913043478,
              "y": 0.14305177111716622,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.5783475783475783,
                "y": 0.1450381679389313,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  1,
                  0.2015267175572519
                ]
              },
              "tail": [
                1,
                0.19686648501362397
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017595307917888565,
            0.2670299727520436,
            0.9648093841642229,
            0.7166212534059946
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "props",
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
              "layerId": "light",
              "preset": "still"
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "agentic-process-build",
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
            "img": "agentic-process-roster",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ]
    },
    {
      "b": 0,
      "l": 0,
      "score": 0,
      "room": "office",
      "artCropInsetPct": 0,
      "id": "procedure-permissions",
      "art": "/comic/agentic/live-20261010/agentic-procedure-permissions-composite-v1",
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-procedure-permissions-background-registered-v1.png",
          "role": "background"
        },
        {
          "id": "props",
          "src": "/comic/agentic/live-20261010/agentic-procedure-permissions-props-registered-v1.png",
          "role": "props"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-procedure-permissions-agents-registered-v1.png",
          "role": "agents",
          "opacity": 0.9
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-procedure-permissions-humans-registered-v1.png",
          "role": "humans"
        },
        {
          "id": "light",
          "src": "/comic/agentic/live-20261010/agentic-procedure-permissions-light-registered-v1.png",
          "role": "light"
        }
      ],
      "continues": true,
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
            0.005044136191677175,
            0.08307692307692308,
            0.5472887767969735,
            0.8323076923076923
          ],
          "phoneArt": [
            0.022792022792022793,
            0.250381679389313,
            0.9544159544159544,
            0.7374045801526717
          ],
          "img": "agentic-process-identity",
          "alt": "Matt scopes the new task identity: approved assessments read, draft roster write, no production delete or certification change. The harmful old account is visibly still disabled.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 0,
              "who": "matt",
              "kind": "speech",
              "state": "calm",
              "text": "The old account stays disabled. The new account reads assessments and writes drafts.",
              "x": 0.017595307917888565,
              "y": 0.01634877384196185,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.853133903133903,
                  0.6445857811235798
                ]
              },
              "tail": [
                0.8569794721407625,
                0.6870695262371451
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "narrator",
              "kind": "caption",
              "state": "narration",
              "text": "Actual system permissions. No production deletion or certification changes.",
              "x": 0.017595307917888565,
              "y": 0.16348773841961853,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.16793893129770993,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "sfx": [
            {
              "kind": "click",
              "gain": 0.2
            }
          ],
          "pageArt": [
            0.017595307917888565,
            0.3010899182561308,
            0.9648093841642229,
            0.6825613079019074
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "props",
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
              "layerId": "light",
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
            0.5598991172761665,
            0.11076923076923077,
            0.43505674653215637,
            0.7769230769230769
          ],
          "phoneArt": [
            0.022792022792022793,
            0.2778625954198473,
            0.9544159544159544,
            0.7099236641221374
          ],
          "img": "agentic-process-test",
          "alt": "Forbidden deletion and direct certification changes are attempted against isolated test fixtures with the new identity; both receive authorization denial. No live deletion replay.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 0,
              "who": "codex",
              "kind": "speech",
              "state": "calm",
              "text": "Test delete: denied. Test certification change: denied.",
              "x": 0.017595307917888565,
              "y": 0.01634877384196185,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.2423076923076923,
                  0.15114503816793892
                ]
              },
              "tail": [
                0.23950146627565985,
                0.5210452947912966
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "sam",
              "kind": "speech",
              "state": "calm",
              "text": "Keep Monday’s replay in that copy.",
              "x": 0.017595307917888565,
              "y": 0.164850136239782,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.16793893129770993,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.9008547008547008,
                  0.6066218608253126
                ]
              },
              "tail": [
                0.9052199413489737,
                0.5800945780515737
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017595307917888565,
            0.2683923705722071,
            0.9648093841642229,
            0.715258855585831
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "props",
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
              "layerId": "light",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "alarm",
              "gain": 0.2
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "agentic-process-identity",
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
            "img": "agentic-process-test",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ]
    },
    {
      "b": 0,
      "l": 0,
      "score": 0,
      "room": "office",
      "artCropInsetPct": 0,
      "id": "procedure-brain",
      "art": "/comic/agentic/live-20261010/agentic-procedure-brain-composite-v1",
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-procedure-brain-background-registered-v1.png",
          "role": "background"
        },
        {
          "id": "props",
          "src": "/comic/agentic/live-20261010/agentic-procedure-brain-props-registered-v1.png",
          "role": "props"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-procedure-brain-agents-registered-v1.png",
          "role": "agents",
          "opacity": 0.9
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-procedure-brain-humans-registered-v1.png",
          "role": "humans"
        },
        {
          "id": "light",
          "src": "/comic/agentic/live-20261010/agentic-procedure-brain-light-registered-v1.png",
          "role": "light"
        }
      ],
      "continues": true,
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
            0.005044136191677175,
            0.12307692307692308,
            0.5472887767969735,
            0.7523076923076923
          ],
          "phoneArt": [
            0.022792022792022793,
            0.41068702290076337,
            0.9544159544159544,
            0.5770992366412214
          ],
          "img": "agentic-process-brain",
          "alt": "Matt, Claude and Codex use Esposito’s domain harness around the checked roster. The separate teal knowledge-tower plane illuminates a floor only when Joan’s confirmed evidence and Sam’s checked procedure are retained. Background physical building is unchanged. No automated learning from unchecked chat.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 0,
              "who": "matt",
              "kind": "speech",
              "state": "calm",
              "text": "Checked rules and evidence light these floors.",
              "x": 0.017595307917888565,
              "y": 0.01634877384196185,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.36752136752136755,
                  0.1282442748091603
                ]
              },
              "tail": [
                0.4614076246334311,
                0.7486147490551112
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "claude",
              "kind": "speech",
              "state": "calm",
              "text": "I use the signed-evidence rules. Joan’s new confirmations stay with their assessments.",
              "x": 0.017595307917888565,
              "y": 0.14168937329700274,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.1450381679389313,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.1754985754985755,
                  0.28373282442748093
                ]
              },
              "tail": [
                0.17196480938416422,
                0.592054803551024
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "matt",
              "kind": "speech",
              "state": "calm",
              "text": "New confirmations stay with their assessments.",
              "x": 0.017595307917888565,
              "y": 0.2888283378746594,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.300763358778626,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.4618233618233618,
                  0.7338125725542619
                ]
              },
              "tail": [
                0.4614076246334311,
                0.7486147490551112
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017595307917888565,
            0.3923705722070845,
            0.9648093841642229,
            0.5912806539509536
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "props",
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
              "layerId": "light",
              "preset": "sprout",
              "beats": 6,
              "strength": 0.2,
              "floors": 6
            }
          ],
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.18
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
            0.5598991172761665,
            0.1476923076923077,
            0.43505674653215637,
            0.7046153846153846
          ],
          "phoneArt": [
            0.022792022792022793,
            0.29923664122137406,
            0.9544159544159544,
            0.6885496183206107
          ],
          "img": "agentic-process-review",
          "alt": "Sam keeps the checked roster; Joan keeps source assessments. Eleven unresolved workers are still held for reassessment. End on the human safety decision.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 0,
              "who": "sam",
              "kind": "speech",
              "state": "calm",
              "text": "I own the roster. Joan keeps the evidence current.",
              "x": 0.017595307917888565,
              "y": 0.01634877384196185,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.2804843304843305,
                  0.149618320610687
                ]
              },
              "tail": [
                0.2780938416422288,
                0.6415089839276548
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "at": 0,
              "who": "matt",
              "kind": "speech",
              "state": "calm",
              "text": "Review the access before each new job.",
              "x": 0.017595307917888565,
              "y": 0.16212534059945505,
              "w": 0.9648093841642229,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.166412213740458,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5286324786324786,
                  0.5993784710698086
                ]
              },
              "tail": [
                0.5289442815249267,
                0.5582033724282274
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "pageArt": [
            0.017595307917888565,
            0.28746594005449594,
            0.9648093841642229,
            0.6961852861035422
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "still"
            },
            {
              "layerId": "props",
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
              "layerId": "light",
              "preset": "still"
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "agentic-process-brain",
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
            "img": "agentic-process-review",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ]
    },
    {
      "id": "gate",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-b2",
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
            "img": "agentic-b2-clock",
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
            "img": "agentic-agent-reaches",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-gate-composite-selected-v4",
      "b": 236,
      "l": 56,
      "title": "Basement two. Monday, 2:05 a.m.",
      "room": "servers",
      "score": 0.12,
      "villains": [
        "rogue"
      ],
      "panels": [
        {
          "at": 1,
          "room": "servers",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.009457755359394703,
            0.015120967741935484,
            0.5662042875157629,
            0.4163306451612903
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.70729664
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.3297709923664122,
            0.9544159544159544,
            0.6580152671755726
          ],
          "img": "agentic-b2",
          "alt": "Wide on an intact isolated test terminal in the server room. Sam holds the already completed task-and-owner card; Codex stands inside a teal test boundary separated from the real production racks by glass. The disabled red agent is being replayed only within that test boundary.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Keon Tower, basement\ntwo, the server room.\nMonday, 2:05 a.m.",
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
              "state": "narration",
              "who": "narrator",
              "text": "Sam recorded the task,\nthe sources and\nhis own responsibility.",
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
            },
            {
              "at": 4.5,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Test the old request.\nIn this copy.\nNever in production.",
              "x": 0.026607538802660754,
              "y": 0.2125340599455041,
              "w": 0.9467849223946785,
              "tail": [
                0.31,
                0.5163487738419619
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.2198473282442748,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.31,
                  0.527175572519084
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.31607629427792916,
            0.9467849223946785,
            0.667574931880109
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 20,
          "room": "servers",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.585750315258512,
            0.015120967741935484,
            0.403530895334174,
            0.19959677419354838
          ],
          "cropFocus": {
            "phone": [
              0.72639434,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12061068702290076,
            0.9544159544159544,
            0.867175572519084
          ],
          "img": "agentic-b2-clock",
          "alt": "Insert: a rack terminal's clock ticks to 2:07 and a job line lights red.",
          "sfx": [
            {
              "kind": "alarm",
              "gain": 0.42
            }
          ],
          "balloons": [
            {
              "at": 20.5,
              "kind": "speech",
              "state": "device",
              "who": "rogue",
              "text": "Test replay.\nCleanup request\nreceived.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.595,
                0.37806539509536785
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
                  0.595,
                  0.3807633587786259
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.11852861035422343,
            0.9467849223946785,
            0.8651226158038147
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 24.5,
          "room": "servers",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.585750315258512,
            0.22983870967741934,
            0.403530895334174,
            0.2006048387096774
          ],
          "cropFocus": {
            "phone": [
              0.89230548,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "img": "agentic-agent-reaches",
          "alt": "From the dark between racks the faceless red-black agent reaches for the training system, its hand made of red light.",
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.45
            }
          ],
          "balloons": [
            {
              "at": 25,
              "kind": "speech",
              "state": "menace",
              "who": "rogue",
              "text": "Duplicates found.\nRemoving.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.5475,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.5475,
                  0.3658015267175572
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.09809264305177112,
            0.9467849223946785,
            0.885558583106267
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-gate-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-gate-humans-registered-v3.png",
          "role": "humans"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-gate-agents-registered-v3.png",
          "role": "agents",
          "opacity": 0.9
        }
      ],
      "continues": false
    },
    {
      "id": "gate-lettering-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-codex-holds",
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
            "img": "agentic-sam-denied",
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
            "img": "agentic-eleven-ask",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-gate-composite-selected-v4",
      "b": 236,
      "l": 56,
      "title": "Basement two. Monday, 2:05 a.m.",
      "room": "servers",
      "score": 0.12,
      "villains": [
        "rogue"
      ],
      "panels": [
        {
          "at": 28.5,
          "room": "servers",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.009457755359394703,
            0.44556451612903225,
            0.592686002522068,
            0.5372983870967742
          ],
          "cropFocus": {
            "phone": [
              0.77235161,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.16793893129770993,
            0.9544159544159544,
            0.8198473282442749
          ],
          "img": "agentic-codex-holds",
          "alt": "The page's main beat: Codex stops his own raised hand at a red line on the floor, the delete command held unexecuted in his palm as a small red sphere; his teal light pushes the red back.",
          "balloons": [
            {
              "at": 29,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Delete blocked. This test identity has no write permission.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.386,
                0.4095367847411444
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.386,
                  0.41389312977099235
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.16348773841961853,
            0.9467849223946785,
            0.8201634877384196
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
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            }
          ],
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.22
            }
          ]
        },
        {
          "at": 33.5,
          "room": "servers",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6134930643127364,
            0.44556451612903225,
            0.37578814627994955,
            0.2469758064516129
          ],
          "cropFocus": {
            "phone": [
              0.53927717,
              0.5
            ]
          },
          "img": "agentic-sam-denied",
          "alt": "Close on Sam at the glass, jaw set, scope card held flat against it.",
          "balloons": [
            {
              "at": 34,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Denied.\nI answer for\nthese records.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.652,
                0.3790190735694823
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
                  0.652,
                  0.38183206106870227
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 38.5,
          "room": "servers",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6134930643127364,
            0.7076612903225806,
            0.21437578814627994,
            0.2752016129032258
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.01229453
            ],
            "page": [
              0.5,
              0
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.18625954198473282,
            0.9544159544159544,
            0.8015267175572519
          ],
          "img": "agentic-eleven-ask",
          "alt": "Codex presents eleven unresolved assessment records to Sam, palm open, waiting for his answer; the verified twenty-nine remain a separate group.",
          "balloons": [
            {
              "at": 39,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Eleven unresolved.\nMark them certified?",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.405,
                0.42098092643051765
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.405,
                  0.4267175572519084
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 40.5,
              "kind": "speech",
              "state": "offpanel",
              "who": "sam",
              "text": "No. They get\nreassessed.",
              "x": 0.7189542483660131,
              "y": 0.09809264305177112,
              "w": 0.9467849223946785,
              "tail": [
                1,
                0.1307901907356948
              ],
              "phone": {
                "x": 0.6638176638176638,
                "y": 0.09923664122137404,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  1,
                  0.13358778625954199
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.17983651226158037,
            0.9467849223946785,
            0.8038147138964578
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-gate-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-gate-humans-registered-v3.png",
          "role": "humans"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-gate-agents-registered-v3.png",
          "role": "agents",
          "opacity": 0.9
        }
      ],
      "continues": true
    },
    {
      "id": "gate-lettering-3",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-collar",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-gate-composite-selected-v4",
      "b": 236,
      "l": 56,
      "title": "Basement two. Monday, 2:05 a.m.",
      "room": "servers",
      "score": 0.12,
      "villains": [
        "rogue"
      ],
      "panels": [
        {
          "at": 48,
          "room": "servers",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.8373266078184111,
            0.7076612903225806,
            0.15195460277427492,
            0.2752016129032258
          ],
          "cropFocus": {
            "phone": [
              0.82588699,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "img": "agentic-collar",
          "alt": "The red-black agent, its red dimmed to an ember, sits at the glass like a dog at a door, a thin teal collar at its neck; Sam's scope card on the other side.",
          "balloons": [
            {
              "at": 48.5,
              "kind": "speech",
              "state": "offpanel",
              "who": "sam",
              "text": "Read-only.\nGood boy.",
              "x": 0.008683068017366137,
              "y": 0.01634877384196185,
              "w": 0.9826338639652678,
              "tail": [
                0,
                0.049046321525885554
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
                  0,
                  0.046564885496183206
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.008683068017366137,
            0.09809264305177112,
            0.9826338639652678,
            0.885558583106267
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
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-gate-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-gate-humans-registered-v3.png",
          "role": "humans"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-gate-agents-registered-v3.png",
          "role": "agents",
          "opacity": 0.9
        }
      ],
      "continues": true
    },
    {
      "id": "monday",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-trucks-dawn",
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
            "img": "agentic-eleven-fence",
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
            "img": "agentic-joan-coffee",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-monday-composite-selected-v4",
      "b": 292,
      "l": 40,
      "title": "Etobicoke. Monday, 6:00 a.m.",
      "room": "rain",
      "score": 0,
      "panels": [
        {
          "at": 1,
          "room": "rain",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.009457755359394703,
            0.015120967741935484,
            0.5668348045397226,
            0.4415322580645161
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.60405998
            ]
          },
          "img": "agentic-trucks-dawn",
          "alt": "Wide, dawn: bucket trucks roll out of the substation yard in freezing rain, headlights cutting the dark, crews in hi-vis climbing aboard.",
          "sfx": [
            {
              "kind": "door"
            }
          ],
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "The Etobicoke yard.\nMonday, 6:00 a.m.",
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
              "state": "narration",
              "who": "narrator",
              "text": "Twenty-nine were\ncleared to climb.",
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
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.17166212534059946,
            0.9467849223946785,
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
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 10.5,
          "room": "rain",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5882723833543506,
            0.015120967741935484,
            0.4003783102143758,
            0.1774193548387097
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.89640881
            ]
          },
          "img": "agentic-eleven-fence",
          "alt": "A row of eleven lineworkers at the fence in the rain, hands in pockets, watching the trucks leave.",
          "balloons": [
            {
              "at": 11,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Eleven stayed\non the ground.",
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
            }
          ],
          "motion": {
            "preset": "still"
          },
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 15.5,
          "room": "rain",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5882723833543506,
            0.21169354838709678,
            0.4003783102143758,
            0.24495967741935484
          ],
          "cropFocus": {
            "phone": [
              0.53921655,
              0.5
            ]
          },
          "img": "agentic-joan-coffee",
          "alt": "Joan in the trailer doorway with a coffee, unimpressed, watching the sky.",
          "balloons": [
            {
              "at": 16,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "Eleven short.\nAnd freezing rain.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.595,
                0.3628065395095368
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
                  0.595,
                  0.3647328244274809
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.09673024523160763,
            0.9467849223946785,
            0.8869209809264306
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09770992366412214,
            0.9544159544159544,
            0.8900763358778626
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-monday-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-monday-humans-selected-v4.png",
          "role": "humans"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-monday-agents-registered-v3.png",
          "role": "agents",
          "opacity": 0.9
        }
      ],
      "continues": false
    },
    {
      "id": "monday-lettering-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "agentic-brain-yard",
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
            "img": "agentic-form-clipboard",
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
            "img": "agentic-sam-signs",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/agentic/live-20261010/agentic-monday-composite-selected-v4",
      "b": 292,
      "l": 40,
      "title": "Etobicoke. Monday, 6:00 a.m.",
      "room": "rain",
      "score": 0,
      "panels": [
        {
          "at": 21,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.009457755359394703,
            0.47580645161290325,
            0.19041614123581338,
            0.5070564516129032
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.10450868
            ]
          },
          "img": "agentic-brain-yard",
          "alt": "Claude in the trailer window, visor teal. The physical yard remains separate from the organizational knowledge archive initialized and shown on the preceding procedure pages.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 21.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Joan’s evidence\nand our checked rules\nare still here.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.4362397820163488
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
                  0.4427480916030534
                ]
              }
            },
            {
              "at": 21.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "The eleven still\nneed reassessment.",
              "x": 0.026607538802660754,
              "y": 0.11989100817438691,
              "w": 0.9467849223946785,
              "tail": [
                0.5,
                0.4362397820163488
              ],
              "anchor": "free",
              "chain": false,
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
              }
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.2016348773841962,
            0.9467849223946785,
            0.782016348773842
          ],
          "phoneArt": [
            0.022792022792022793,
            0.20916030534351146,
            0.9544159544159544,
            0.7786259541984732
          ],
          "layerMotion": [
            {
              "layerId": "background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "humans",
              "preset": "still"
            },
            {
              "layerId": "agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            }
          ]
        },
        {
          "at": 27,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.2112232030264817,
            0.47580645161290325,
            0.18978562421185372,
            0.5070564516129032
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.59629434
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "img": "agentic-form-clipboard",
          "alt": "The completed task-and-owner form from the isolated test sits beside the final 29/11 assessment list. Its responsibility fields are filled, with a review date space below.",
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Sam owned the roster. Joan kept the signed assessments current.",
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
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        },
        {
          "at": 28.5,
          "room": "rain",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.4123581336696091,
            0.47580645161290325,
            0.5762925598991173,
            0.5070564516129032
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.27010759
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.1450381679389313,
            0.9544159544159544,
            0.8427480916030534
          ],
          "img": "agentic-sam-signs",
          "alt": "Sam faces one of the held-back workers at the truck tailgate and commits to reassessment, holding the eleven unresolved records. The worker listens with disappointment rather than blame; Matt is behind Sam, silent, letting Sam own the decision.",
          "sfx": [
            {
              "kind": "paper"
            }
          ],
          "balloons": [
            {
              "at": 29,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "I'll arrange\nthe reassessments.\nThey stay down\nuntil they pass.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.29100000000000004,
                0.39427792915531334
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.29100000000000004,
                  0.39786259541984725
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0.026607538802660754,
            0.14168937329700274,
            0.9467849223946785,
            0.8419618528610354
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
              "layerId": "agents",
              "preset": "still"
            }
          ]
        }
      ],
      "inset": 0,
      "layers": [
        {
          "id": "background",
          "src": "/comic/agentic/live-20261010/agentic-monday-background-selected-v4.png",
          "role": "background"
        },
        {
          "id": "humans",
          "src": "/comic/agentic/live-20261010/agentic-monday-humans-selected-v4.png",
          "role": "humans"
        },
        {
          "id": "agents",
          "src": "/comic/agentic/live-20261010/agentic-monday-agents-registered-v3.png",
          "role": "agents",
          "opacity": 0.9
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
    "b": 332,
    "heading": "Nine floors up, the following month.",
    "choices": [
      {
        "label": "Floor 28. The assistant can open every file in the firm.",
        "href": "/traditional-systems-b/",
        "img": "agentic-next-dana-access"
      },
      {
        "label": "Winter. A system older than the web, and nobody left who remembers it.",
        "href": "/data-migrations-b/",
        "img": "agentic-next-dana"
      },
      {
        "label": "Build a second brain from the paper you already have.",
        "href": "/agentic-systems/second-brain/",
        "img": "agentic-brain-esposito"
      },
      {
        "label": "Give every agent tests, limited keys and an owner.",
        "href": "/agentic-systems/agentic-devops-scaling/",
        "img": "agentic-codex-tests"
      }
    ]
  },
  "collapseTo": ".page-art"
});
