// Issue04 layered reader, measured crops, one-box phone sheets and pixel-bound non-speech score; native/human review pending.
import type { ComicStory } from './types';
import { retime } from './retime';
export const dataMigrationsComic: ComicStory = retime({
  "id": "data-migrations",
  "issue": 4,
  "title": "Nobody left who remembers.",
  "bpm": 79,
  "beats": 528,
  "music": {
    "src": "/audio/pixabay-485509-on-my-mind-free-rap-beat.mp3",
    "offset": 0.45,
    "credit": "Music: On My Mind_[[FREE]] Rap Beat by AEXBEATS",
    "source": "https://pixabay.com/music/rap-on-my-mind-free-rap-beat-485509/",
    "loop": {
      "from": 16,
      "to": 160
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
      "id": "records",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-records-room",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1",
      "b": 0,
      "l": 72,
      "score": 0,
      "room": "office",
      "villains": [
        "amnesia"
      ],
      "title": "Basement one. Monday, 7:40 a.m.",
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
            0.007161458333333333,
            0.0087890625,
            0.5846354166666666,
            0.375
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.45747844
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.2198473282442748,
            0.9544159544159544,
            0.5679389312977099
          ],
          "img": "dm-records-room",
          "alt": "Wide: Dana Dryden (rectangular glasses, grey jacket, a pen) opens the door of a long basement records room; steel shelves of archive boxes run into the dark, and at the far end an old beige terminal's green screen is the only light.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Toronto. The Keon Tower,\nbasement one. Monday,\n11 January 2027, 7:40 a.m.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.19127257146620713,
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
              "text": "Dana Dryden. Legal assistant,\nBourque & Coffey.\nShe reads every footnote.",
              "x": 0.20864289296914523,
              "y": 0.01634877384196185,
              "w": 0.19127257146620713,
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
              "text": "Bourque & Coffey LLP is\na law firm moving 1,214,000\nprivate files to a new system.\nSupport for the old one ends\non 8 March. Its builder\nhas retired. Every file must\nopen for the right people.",
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
          "layerMotion": [
            {
              "layerId": "dm-records-background",
              "preset": "still"
            },
            {
              "layerId": "records-humans",
              "preset": "still"
            },
            {
              "layerId": "records-seated",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "door",
              "gain": 0.24
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.11444141689373297,
            0.9826296784970618,
            0.6757493188010899
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-records-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1-layer-0.png"
        },
        {
          "id": "records-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1-layer-1.png"
        },
        {
          "id": "records-seated",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1-layer-2.png"
        }
      ]
    },
    {
      "id": "records-continued-1",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-green-screen",
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
            "img": "dm-memo",
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
            "img": "dm-farewell-card",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1",
      "b": 0,
      "l": 72,
      "score": 0,
      "room": "office",
      "villains": [
        "amnesia"
      ],
      "title": "Basement one. Monday, 7:40 a.m.",
      "panels": [
        {
          "at": 29.5,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6022135416666666,
            0.009765625,
            0.390625,
            0.212890625
          ],
          "cropFocus": {
            "phone": [
              0.78499342,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "img": "dm-green-screen",
          "alt": "Close: the old terminal's green monochrome screen with a blinking block cursor, Dana's fingers on the beige keyboard.",
          "balloons": [
            {
              "at": 30,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Plante. Document\nsystem, since 1996.\n1,214,000 files.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.75,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-records-background",
              "preset": "still"
            },
            {
              "layerId": "records-humans",
              "preset": "still"
            },
            {
              "layerId": "records-seated",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.3
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
        },
        {
          "at": 34.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6022135416666666,
            0.23828125,
            0.390625,
            0.1455078125
          ],
          "cropFocus": {
            "phone": [
              0.97462147,
              0.5
            ],
            "page": [
              1,
              0.5
            ]
          },
          "img": "dm-memo",
          "alt": "Insert: a partners' memo on the desk beside the terminal, a date circled in red pen, Dana's pen resting on it.",
          "balloons": [
            {
              "at": 35,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Its support ends\non 8 March.",
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
              "at": 36.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Dana's job: every file\nmoved, each one opening\nfor the right people.",
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
          "layerMotion": [
            {
              "layerId": "dm-records-background",
              "preset": "still"
            },
            {
              "layerId": "records-humans",
              "preset": "still"
            },
            {
              "layerId": "records-seated",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.1984732824427481,
            0.9544159544159544,
            0.7893129770992366
          ],
          "pageArt": [
            0.026607538802660754,
            0.19209809264305178,
            0.9467849223946785,
            0.7915531335149864
          ]
        },
        {
          "at": 45,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.007161458333333333,
            0.3974609375,
            0.189453125,
            0.5986328125
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.67453548
            ]
          },
          "img": "dm-farewell-card",
          "alt": "Tall: Dana's hand lifts a farewell card from the terminal desk's drawer; on it a photo of a grey-haired man in a cardigan beside this same terminal, a cake in front of him.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 45.5,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "George Armstrong\nbuilt it. He retired\nin 2019.",
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
          "layerMotion": [
            {
              "layerId": "dm-records-background",
              "preset": "still"
            },
            {
              "layerId": "records-humans",
              "preset": "still"
            },
            {
              "layerId": "records-seated",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-records-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1-layer-0.png"
        },
        {
          "id": "records-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1-layer-1.png"
        },
        {
          "id": "records-seated",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": true
    },
    {
      "id": "records-continued-1-prep-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-phone",
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
            "img": "dm-dana-eyes",
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
            "img": "dm-dana-alone",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1",
      "b": 0,
      "l": 72,
      "score": 0,
      "room": "office",
      "villains": [
        "amnesia"
      ],
      "title": "Basement one. Monday, 7:40 a.m.",
      "panels": [
        {
          "at": 50,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.20638020833333334,
            0.3974609375,
            0.21419270833333334,
            0.298828125
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.59175723
            ]
          },
          "img": "dm-phone",
          "alt": "Medium: Dana holds the desk phone's receiver to her ear, the farewell card propped against the screen, its number underlined.",
          "balloons": [
            {
              "at": 50.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "The number you\nhave dialled is\nnot in service.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.65,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-records-background",
              "preset": "still"
            },
            {
              "layerId": "records-humans",
              "preset": "still"
            },
            {
              "layerId": "records-seated",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
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
            0.2109375,
            0.775390625,
            0.20703125,
            0.19921875
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.47355752
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.1435114503816794,
            0.9544159544159544,
            0.8442748091603054
          ],
          "img": "dm-dana-eyes",
          "alt": "Dana looks from the failed telephone call to closed, labelled client file boxes; her concern is confidentiality, not nostalgia for hardware. Keep labels generic and fictional.",
          "balloons": [
            {
              "at": 56,
              "kind": "thought",
              "state": "thought",
              "who": "dana",
              "text": "These are people’s\nprivate files.\nWe have to\nget this right.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.78,
                0.3933242506811989
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.78,
                  0.396793893129771
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-records-background",
              "preset": "still"
            },
            {
              "layerId": "records-humans",
              "preset": "still"
            },
            {
              "layerId": "records-seated",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.14032697547683923,
            0.9467849223946785,
            0.8433242506811989
          ]
        },
        {
          "at": 62,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.4283854166666667,
            0.3974609375,
            0.564453125,
            0.5986328125
          ],
          "cropFocus": {
            "phone": [
              0.25934685,
              0.5
            ]
          },
          "img": "dm-dana-alone",
          "alt": "Dominant: from high above, Dana small and alone at the terminal at the end of the aisle of archive boxes, its green light on her; the dark shelves press in, the tower's forty floors implied overhead.",
          "balloons": [
            {
              "at": 62.5,
              "kind": "thought",
              "state": "thought",
              "who": "dana",
              "text": "Who still knows\nhow this works?",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.42,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.42,
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
          "layerMotion": [
            {
              "layerId": "dm-records-background",
              "preset": "still"
            },
            {
              "layerId": "records-humans",
              "preset": "still"
            },
            {
              "layerId": "records-seated",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.18
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "pageArt": [
            0.026607538802660754,
            0.09809264305177112,
            0.9467849223946785,
            0.885558583106267
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-records-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1-layer-0.png"
        },
        {
          "id": "records-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1-layer-1.png"
        },
        {
          "id": "records-seated",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-records-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": true
    },
    {
      "id": "plan",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-boardroom",
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
            "img": "dm-claude-plan",
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
            "img": "dm-map-screen",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1",
      "b": 72,
      "l": 52,
      "score": 0,
      "room": "office",
      "villains": [
        "amnesia",
        "snowball"
      ],
      "title": "Floor 28. Wednesday, 10:00 a.m.",
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
            0.008838383838383838,
            0.014098690835850957,
            0.6275252525252525,
            0.37462235649546827
          ],
          "cropFocus": {
            "phone": [
              0.98977107,
              0.5
            ]
          },
          "img": "dm-boardroom",
          "alt": "Wide on the Bourque & Coffey boardroom: Dana with the old binder, the internal project team around the table, and Claude in the paper coat presenting the map. Matt is not in this meeting; his first appearance follows the later request for help.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28, Bourque & Coffey.\nWeek one. Wednesday,\n10:00 a.m.",
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
          "layerMotion": [
            {
              "layerId": "dm-plan-background",
              "preset": "still"
            },
            {
              "layerId": "plan-humans",
              "preset": "still"
            },
            {
              "layerId": "plan-agents",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.2198473282442748,
            0.9544159544159544,
            0.76793893129771
          ],
          "pageArt": [
            0.026607538802660754,
            0.2125340599455041,
            0.9467849223946785,
            0.771117166212534
          ]
        },
        {
          "at": 12.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6464646464646465,
            0.014098690835850957,
            0.3453282828282828,
            0.22356495468277945
          ],
          "cropFocus": {
            "phone": [
              0.7346102,
              0.5
            ]
          },
          "img": "dm-claude-plan",
          "alt": "Medium: Claude at the screen, one hand open toward it, pages of his coat lifting; his visor flat grey.",
          "balloons": [
            {
              "at": 13,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "I read all four manuals\novernight. Every old\ngroup maps one-to-one.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.46,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-plan-background",
              "preset": "still"
            },
            {
              "layerId": "plan-humans",
              "preset": "still"
            },
            {
              "layerId": "plan-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.1
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
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
            0.6464646464646465,
            0.2537764350453172,
            0.3453282828282828,
            0.1339375629405841
          ],
          "cropFocus": {
            "phone": [
              0.8854819,
              0.5
            ]
          },
          "img": "dm-map-screen",
          "alt": "Insert: the screen, a long table of rows, each old box joined to a new box by one neat arrow, scrolling past.",
          "balloons": [
            {
              "at": 19.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The map: 212 old groups,\n212 new ones.\nOne arrow each.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-plan-background",
              "preset": "still"
            },
            {
              "layerId": "plan-humans",
              "preset": "still"
            },
            {
              "layerId": "plan-agents",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-plan-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1-layer-0.png"
        },
        {
          "id": "plan-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1-layer-1.png"
        },
        {
          "id": "plan-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": false
    },
    {
      "id": "plan-prep-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-matt-asks",
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
            "img": "dm-dana-answers",
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
            "img": "dm-claude-polite",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1",
      "b": 72,
      "l": 52,
      "score": 0,
      "room": "office",
      "villains": [
        "amnesia",
        "snowball"
      ],
      "title": "Floor 28. Wednesday, 10:00 a.m.",
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
            0.008838383838383838,
            0.40584088620342396,
            0.19318181818181818,
            0.5800604229607251
          ],
          "cropFocus": {
            "phone": [
              0,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "img": "dm-matt-asks",
          "alt": "Dana asks Claude about the completeness of the manuals at the internal planning table. Matt is not present at this early meeting. Dana holds an old access manual with handwritten tabs.",
          "balloons": [
            {
              "at": 26,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Did the manuals\ncover every\naccess rule?",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.48,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-plan-background",
              "preset": "still"
            },
            {
              "layerId": "plan-humans",
              "preset": "still"
            },
            {
              "layerId": "plan-agents",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
        },
        {
          "at": 30.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.21338383838383837,
            0.40584088620342396,
            0.2178030303030303,
            0.2618328298086606
          ],
          "cropFocus": {
            "phone": [
              0.5236064,
              0.5
            ]
          },
          "img": "dm-dana-answers",
          "alt": "Dana and colleagues look toward the retired builder’s old binders and their own new mapping plan. This is the internal project team, with no Matt present.",
          "balloons": [
            {
              "at": 31,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Nobody on the team\nhad worked with George.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-plan-background",
              "preset": "still"
            },
            {
              "layerId": "plan-humans",
              "preset": "still"
            },
            {
              "layerId": "plan-agents",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "pageArt": [
            0.026607538802660754,
            0.09400544959128065,
            0.9467849223946785,
            0.8896457765667575
          ]
        },
        {
          "at": 35.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.21338383838383837,
            0.6837865055387714,
            0.2178030303030303,
            0.3021148036253776
          ],
          "cropFocus": {
            "phone": [
              0.9018742,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "img": "dm-claude-polite",
          "alt": "Close: Claude's grey visor, polite and certain, a manual open in one hand.",
          "balloons": [
            {
              "at": 36,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "The manuals cover\nall the groups.\nThe map matches.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.63,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-plan-background",
              "preset": "still"
            },
            {
              "layerId": "plan-humans",
              "preset": "still"
            },
            {
              "layerId": "plan-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.1
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-plan-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1-layer-0.png"
        },
        {
          "id": "plan-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1-layer-1.png"
        },
        {
          "id": "plan-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": true
    },
    {
      "id": "plan-prep-3",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-dana-signs",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1",
      "b": 72,
      "l": 52,
      "score": 0,
      "room": "office",
      "villains": [
        "amnesia",
        "snowball"
      ],
      "title": "Floor 28. Wednesday, 10:00 a.m.",
      "panels": [
        {
          "at": 41,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.442550505050505,
            0.40584088620342396,
            0.5492424242424242,
            0.5800604229607251
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "dm-dana-signs",
          "alt": "Dominant: low across the table, Dana's pen signs the plan's sign-off sheet beside the open manuals, their footnotes flagged; behind her the partners nod, and the map glows on the screen.",
          "balloons": [
            {
              "at": 41.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Every footnote agreed\nwith the map.\nDana signed.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-plan-background",
              "preset": "still"
            },
            {
              "layerId": "plan-humans",
              "preset": "still"
            },
            {
              "layerId": "plan-agents",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "pageArt": [
            0.00868516075146906,
            0.11444141689373297,
            0.9826296784970618,
            0.8692098092643051
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-plan-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1-layer-0.png"
        },
        {
          "id": "plan-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1-layer-1.png"
        },
        {
          "id": "plan-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-plan-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": true
    },
    {
      "id": "waves",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-codex-waves",
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
            "img": "dm-codex-done",
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
            "img": "dm-dana-ticks",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1",
      "b": 124,
      "l": 44,
      "score": 0,
      "room": "servers",
      "villains": [
        "snowball"
      ],
      "title": "Floor 28. Week three.",
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
            0.00819672131147541,
            0.01310483870967742,
            0.38461538461538464,
            0.3336693548387097
          ],
          "cropFocus": {
            "phone": [
              0.52998167,
              0.5
            ]
          },
          "img": "dm-codex-waves",
          "alt": "Wide: the firm's equipment room on floor 28, Codex (compact armour, light running harsh white down his gauntlets) at a workstation, streams of white file icons pouring from a cable toward the window.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28. Week three.\nMonday, 25 January.",
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
              "text": "Codex. An AI that builds.\nExactly what they’re told.",
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
          "layerMotion": [
            {
              "layerId": "dm-waves-background",
              "preset": "still"
            },
            {
              "layerId": "waves-humans",
              "preset": "still"
            },
            {
              "layerId": "waves-agents",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.3
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.17709923664122137,
            0.9544159544159544,
            0.8106870229007633
          ],
          "pageArt": [
            0.026607538802660754,
            0.17166212534059946,
            0.9467849223946785,
            0.8119891008174387
          ]
        },
        {
          "at": 10.5,
          "room": "servers",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.4041614123581337,
            0.01310483870967742,
            0.2515762925598991,
            0.3336693548387097
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.65035281
            ]
          },
          "img": "dm-codex-done",
          "alt": "Medium: Codex turns from the screen, gauntlets still white, a counter racing behind him.",
          "balloons": [
            {
              "at": 11,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Wave one moved.\n300,000 files.\nMapped as written.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.53,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-waves-background",
              "preset": "still"
            },
            {
              "layerId": "waves-humans",
              "preset": "still"
            },
            {
              "layerId": "waves-agents",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
        },
        {
          "at": 15.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6670870113493065,
            0.01310483870967742,
            0.3240857503152585,
            0.3336693548387097
          ],
          "cropFocus": {
            "phone": [
              0.43134902,
              0.5
            ]
          },
          "img": "dm-dana-ticks",
          "alt": "Medium: Dana at her desk ticking wave one off a printed checklist, the map pinned on the wall above her.",
          "balloons": [],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-waves-background",
              "preset": "still"
            },
            {
              "layerId": "waves-humans",
              "preset": "still"
            },
            {
              "layerId": "waves-agents",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-waves-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1-layer-0.png"
        },
        {
          "id": "waves-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1-layer-1.png"
        },
        {
          "id": "waves-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": false
    },
    {
      "id": "waves-prep-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-booklets",
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
            "img": "dm-folders",
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
            "img": "dm-client-email",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1",
      "b": 124,
      "l": 44,
      "score": 0,
      "room": "servers",
      "villains": [
        "snowball"
      ],
      "title": "Floor 28. Week three.",
      "panels": [
        {
          "at": 17,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.00819672131147541,
            0.3629032258064516,
            0.25851197982345525,
            0.1875
          ],
          "cropFocus": {
            "phone": [
              0.56944707,
              0.5
            ]
          },
          "img": "dm-booklets",
          "run": "built",
          "alt": "Run 1: a printer pushes out stacks of staff training booklets with the map's arrows on the cover.",
          "balloons": [
            {
              "at": 17.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The training was\nwritten from the map.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-waves-background",
              "preset": "still"
            },
            {
              "layerId": "waves-humans",
              "preset": "still"
            },
            {
              "layerId": "waves-agents",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "pageArt": [
            0.026607538802660754,
            0.09400544959128065,
            0.9467849223946785,
            0.8896457765667575
          ]
        },
        {
          "at": 22,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.00819672131147541,
            0.5675403225806451,
            0.25851197982345525,
            0.17842741935483872
          ],
          "cropFocus": {
            "phone": [
              0.93083781,
              0.5
            ]
          },
          "img": "dm-folders",
          "run": "built",
          "alt": "Run 2: a lawyer's screen, a new folder tree branching out exactly along the map's arrows.",
          "balloons": [
            {
              "at": 22.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The new folders\nwere built on it.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-waves-background",
              "preset": "still"
            },
            {
              "layerId": "waves-humans",
              "preset": "still"
            },
            {
              "layerId": "waves-agents",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "pageArt": [
            0.026607538802660754,
            0.09400544959128065,
            0.9467849223946785,
            0.8896457765667575
          ]
        },
        {
          "at": 27,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.00819672131147541,
            0.7620967741935484,
            0.25851197982345525,
            0.22379032258064516
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.23703011
            ]
          },
          "img": "dm-client-email",
          "run": "built",
          "alt": "Run 3: a partner's hand clicks send on an email to the firm's clients, a calendar date in it.",
          "balloons": [
            {
              "at": 27.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Every client was\ngiven the date.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-waves-background",
              "preset": "still"
            },
            {
              "layerId": "waves-humans",
              "preset": "still"
            },
            {
              "layerId": "waves-agents",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "click",
              "gain": 0.2
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "pageArt": [
            0.026607538802660754,
            0.09400544959128065,
            0.9467849223946785,
            0.8896457765667575
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-waves-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1-layer-0.png"
        },
        {
          "id": "waves-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1-layer-1.png"
        },
        {
          "id": "waves-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": true
    },
    {
      "id": "waves-prep-3",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-ball-corridor",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1",
      "b": 124,
      "l": 44,
      "score": 0,
      "room": "servers",
      "villains": [
        "snowball"
      ],
      "title": "Floor 28. Week three.",
      "panels": [
        {
          "at": 31.5,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.27742749054224464,
            0.3629032258064516,
            0.7137452711223203,
            0.6229838709677419
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.77256698
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "img": "dm-ball-corridor",
          "alt": "Dominant panel: Dana walks along an orderly wall of scheduled work, training drafts, new folders and client dates all pointing back to the same untested map. A translucent paper shadow expands behind the plan as a visual metaphor for dependence; the physical corridor is intact and passable.",
          "balloons": [
            {
              "at": 32,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Week five. 900,000 files\nmoved. Every one rested\non 212 arrows.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-waves-background",
              "preset": "still"
            },
            {
              "layerId": "waves-humans",
              "preset": "still"
            },
            {
              "layerId": "waves-agents",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.11444141689373297,
            0.9826296784970618,
            0.8692098092643051
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-waves-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1-layer-0.png"
        },
        {
          "id": "waves-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1-layer-1.png"
        },
        {
          "id": "waves-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-waves-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": true
    },
    {
      "id": "discrepancy",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-clerk-message",
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
            "img": "dm-dana-checks-role",
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
            "img": "dm-call-matt",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-discrepancy-20261010-live-v1",
      "b": 168,
      "l": 52,
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
            0.008832807570977918,
            0.014112903225806451,
            0.6031545741324921,
            0.29435483870967744
          ],
          "cropFocus": {
            "phone": [
              0.63833629,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.22748091603053436,
            0.9544159544159544,
            0.7603053435114504
          ],
          "img": "dm-clerk-message",
          "alt": "Dana receives a junior clerk’s report that a sealed file opened in week four. The message and access timestamp identify the earlier event, not a new opening in week five. This is one of the two disclosures later confirmed in the log.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28. Week five.\nThursday, 4:35 p.m.",
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
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Last week, this\nsealed file opened.\nI’m not on\nthat matter.",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "tail": [
                0.48,
                0.4486376021798365
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.45557251908396945
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-discrepancy-background",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-humans",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-matt-video",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "buzz",
              "gain": 0.18
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.21934604904632152,
            0.9467849223946785,
            0.7643051771117166
          ]
        },
        {
          "at": 11.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6227129337539432,
            0.014112903225806451,
            0.36908517350157727,
            0.29435483870967744
          ],
          "cropFocus": {
            "phone": [
              0.37655386,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "img": "dm-dana-checks-role",
          "alt": "Dana checks the clerk’s role against the migration map, keeping the exact same file reference in view.",
          "balloons": [
            {
              "at": 12,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "The map says yes.\nThat cannot\nbe right.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.48,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-discrepancy-background",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-humans",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-matt-video",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
        },
        {
          "at": 16.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.008832807570977918,
            0.3245967741935484,
            0.6031545741324921,
            0.6612903225806451
          ],
          "cropFocus": {
            "phone": [
              0.89296377,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.3847328244274809,
            0.9544159544159544,
            0.6030534351145038
          ],
          "img": "dm-call-matt",
          "alt": "Dominant panel: Dana calls Matt and lays the old and new access records side by side. Matt answers from his workspace in black T-shirt and glasses; his role is newly invited help, not previous project approval.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 17,
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
              "at": 18.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "A clerk opened a sealed file.",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "tail": [
                0.44,
                0.5525885558583106
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.565648854961832
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 20,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "We need your systems expertise to find the missed access rule.",
              "x": 0.026607538802660754,
              "y": 0.19754768392370572,
              "w": 0.9467849223946785,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.20458015267175572,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.76
                ]
              },
              "chain": false,
              "anchor": "free"
            }
          ],
          "layerMotion": [
            {
              "layerId": "dm-discrepancy-background",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-humans",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-matt-video",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.3678474114441417,
            0.9467849223946785,
            0.6158038147138964
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-discrepancy-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-discrepancy-20261010-live-v1-layer-0.png"
        },
        {
          "id": "discrepancy-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-discrepancy-20261010-live-v1-layer-1.png"
        },
        {
          "id": "discrepancy-matt-video",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-discrepancy-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": false
    },
    {
      "id": "discrepancy-prep-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-hold-wave",
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
            "img": "dm-matt-test-question",
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
            "img": "dm-return-basement",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-discrepancy-20261010-live-v1",
      "b": 168,
      "l": 52,
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 30.5,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6227129337539432,
            0.3245967741935484,
            0.36908517350157727,
            0.1693548387096774
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.58649299
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "img": "dm-hold-wave",
          "alt": "Dana authorizes an immediate temporary restriction on suspect migrated sealed files and holds the next wave. Both changes are visibly confirmed. Ordinary unaffected files remain usable; suspect access stays restricted throughout the investigation.",
          "balloons": [
            {
              "at": 31,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Restrict the moved\nsealed files.\nHold the next wave.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.48,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-discrepancy-background",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-humans",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-matt-video",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "click",
              "gain": 0.15
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
        },
        {
          "at": 36,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6227129337539432,
            0.5100806451612904,
            0.36908517350157727,
            0.20262096774193547
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12061068702290076,
            0.9544159544159544,
            0.867175572519084
          ],
          "img": "dm-matt-test-question",
          "alt": "Matt asks Dana to bring the exact file and clerk role to the old system. His open notebook has two comparison columns, not a pre-written answer.",
          "balloons": [
            {
              "at": 36.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Same file. Same role.\nWhat does the old\nsystem allow?",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.48,
                0.37806539509536785
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.35,
                  0.3807633587786259
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-discrepancy-background",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-humans",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-matt-video",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11852861035422343,
            0.9467849223946785,
            0.8651226158038147
          ]
        },
        {
          "at": 42,
          "room": "servers",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.6227129337539432,
            0.7278225806451613,
            0.36908517350157727,
            0.25806451612903225
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.91787213
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "img": "dm-return-basement",
          "alt": "Dana and Matt enter the basement records room with the file reference and the clerk role details; the old terminal is intact and running.",
          "balloons": [
            {
              "at": 42.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "They went back\nto the running system.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-discrepancy-background",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-humans",
              "preset": "still"
            },
            {
              "layerId": "discrepancy-matt-video",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.09400544959128065,
            0.9467849223946785,
            0.8896457765667575
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-discrepancy-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-discrepancy-20261010-live-v1-layer-0.png"
        },
        {
          "id": "discrepancy-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-discrepancy-20261010-live-v1-layer-1.png"
        },
        {
          "id": "discrepancy-matt-video",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-discrepancy-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": true
    },
    {
      "id": "try",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-night-terminal",
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
            "img": "dm-dana-logs-in",
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
            "img": "dm-denied",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1",
      "b": 220,
      "l": 48,
      "room": "office",
      "score": 0,
      "villains": [
        "amnesia"
      ],
      "title": "Basement one. Thursday, 9:15 p.m.",
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
            0.00819672131147541,
            0.011088709677419355,
            0.48675914249684743,
            0.38911290322580644
          ],
          "cropFocus": {
            "phone": [
              0.57762636,
              0.5
            ]
          },
          "img": "dm-night-terminal",
          "alt": "Wide: the records room at night, the old terminal's green glow; Dana seated at it, Matt standing to her right with his hands in his pockets, Claude in the aisle of boxes, visor grey.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Basement one. Week five.\nThursday, 9:15 p.m.",
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
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "This is the same file.\nThe same clerk’s role.",
              "x": 0.026607538802660754,
              "y": 0.09400544959128065,
              "w": 0.9467849223946785,
              "tail": [
                0.31,
                0.41811989100817437
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.09465648854961832,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.42351145038167937
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "layerMotion": [
            {
              "layerId": "dm-try-background",
              "preset": "still"
            },
            {
              "layerId": "dm-try-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-try-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.18167938931297709,
            0.9544159544159544,
            0.8061068702290076
          ],
          "pageArt": [
            0.026607538802660754,
            0.17574931880108993,
            0.9467849223946785,
            0.8079019073569482
          ]
        },
        {
          "at": 10.5,
          "room": "servers",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5012610340479193,
            0.012096774193548387,
            0.22383354350567466,
            0.38810483870967744
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.99941905
            ]
          },
          "img": "dm-dana-logs-in",
          "alt": "Close: Dana's hands typing on the beige keyboard, a junior clerk's ID badge laid beside it.",
          "balloons": [
            {
              "at": 11,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "She logged in\nto Plante as\na junior clerk.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-try-background",
              "preset": "still"
            },
            {
              "layerId": "dm-try-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-try-humans",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.3
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        },
        {
          "at": 16,
          "room": "servers",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.7332912988650694,
            0.012096774193548387,
            0.25914249684741486,
            0.38810483870967744
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.52121956
            ]
          },
          "img": "dm-denied",
          "alt": "Close: the green screen, a file name and a single blinking line beneath it.",
          "balloons": [
            {
              "at": 16.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Access\ndenied.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
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
                  0.65,
                  0.3647328244274809
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-try-background",
              "preset": "still"
            },
            {
              "layerId": "dm-try-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-try-humans",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "click",
              "gain": 0.14
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09770992366412214,
            0.9544159544159544,
            0.8900763358778626
          ],
          "pageArt": [
            0.026607538802660754,
            0.09673024523160763,
            0.9467849223946785,
            0.8869209809264306
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-try-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1-layer-0.png"
        },
        {
          "id": "dm-try-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1-layer-1.png"
        },
        {
          "id": "dm-try-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": false
    },
    {
      "id": "try-prep-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-map-says",
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
            "img": "dm-claude-unsure",
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
            "img": "dm-pages-1",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1",
      "b": 220,
      "l": 48,
      "room": "office",
      "score": 0,
      "villains": [
        "amnesia"
      ],
      "title": "Basement one. Thursday, 9:15 p.m.",
      "panels": [
        {
          "at": 19,
          "room": "servers",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.004413619167717529,
            0.41330645161290325,
            0.3329129886506936,
            0.5745967741935484
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "dm-map-says",
          "alt": "Dana and Matt compare the same sealed file under the same junior-clerk role: the old system refuses, while the captured new-system result before containment permitted access. The live suspect files remain restricted; this comparison does not reopen them.",
          "balloons": [
            {
              "at": 19.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Before restriction: open.\nOld system: denied.\nSame file. Same role.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.4,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-try-background",
              "preset": "still"
            },
            {
              "layerId": "dm-try-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-try-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
        },
        {
          "at": 25,
          "room": "servers",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.34489281210592687,
            0.41330645161290325,
            0.18789407313997478,
            0.24092741935483872
          ],
          "cropFocus": {
            "phone": [
              0.74966391,
              0.5
            ]
          },
          "img": "dm-claude-unsure",
          "alt": "Close: Claude, visor grey, a manual open in his hands, its pages still.",
          "balloons": [
            {
              "at": 25.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "That rule wasn’t\nin the printed\ninstructions.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.6,
                0.37997275204359676
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
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
          "layerMotion": [
            {
              "layerId": "dm-try-background",
              "preset": "still"
            },
            {
              "layerId": "dm-try-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.1
            },
            {
              "layerId": "dm-try-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12366412213740458,
            0.9544159544159544,
            0.8641221374045801
          ],
          "pageArt": [
            0.026607538802660754,
            0.12125340599455041,
            0.9467849223946785,
            0.8623978201634878
          ]
        },
        {
          "at": 30,
          "room": "servers",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.3455233291298865,
            0.6653225806451613,
            0.09079445145018916,
            0.3215725806451613
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.66166428
            ]
          },
          "img": "dm-pages-1",
          "run": "pages",
          "alt": "Run 1: Dana's hand flicks through George's dog-eared manual.",
          "balloons": [],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-try-background",
              "preset": "still"
            },
            {
              "layerId": "dm-try-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-try-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-try-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1-layer-0.png"
        },
        {
          "id": "dm-try-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1-layer-1.png"
        },
        {
          "id": "dm-try-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": true
    },
    {
      "id": "try-prep-3",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-pages-2",
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
            "img": "dm-margin",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1",
      "b": 220,
      "l": 48,
      "room": "office",
      "score": 0,
      "villains": [
        "amnesia"
      ],
      "title": "Basement one. Thursday, 9:15 p.m.",
      "panels": [
        {
          "at": 31,
          "room": "servers",
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.44199243379571246,
            0.6653225806451613,
            0.0914249684741488,
            0.3215725806451613
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "dm-pages-2",
          "run": "pages",
          "alt": "Run 2: her finger stops on a page, a line of pencil in its margin.",
          "balloons": [],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-try-background",
              "preset": "still"
            },
            {
              "layerId": "dm-try-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-try-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "pageArt": [
            0.017501206854055977,
            0.0326975476839237,
            0.964997586291888,
            0.9509536784741145
          ]
        },
        {
          "at": 32,
          "room": "servers",
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.5409836065573771,
            0.41330645161290325,
            0.4520807061790668,
            0.5735887096774194
          ],
          "cropFocus": {
            "phone": [
              0.5464891,
              0.5
            ]
          },
          "img": "dm-margin",
          "alt": "Dominant: Dana holds the manual open toward Claude, her finger on the pencilled margin note; behind Claude a teal lattice tower of floors stands in the dark, its lowest floor lighting up, and his visor turns teal.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 32.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "In pencil, in the margin:\n“Sealed files: matter team\nonly. Not in the table.”",
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
              "at": 34,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Test access in\nboth systems.\nNot just the manual.",
              "x": 0.017501206854055977,
              "y": 0.11444141689373297,
              "w": 0.964997586291888,
              "tail": [
                0.24,
                0.4476839237057221
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.45450381679389307
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "layerMotion": [
            {
              "layerId": "dm-try-background",
              "preset": "still"
            },
            {
              "layerId": "dm-try-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-try-humans",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.15
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.22595419847328244,
            0.9544159544159544,
            0.7618320610687023
          ],
          "pageArt": [
            0.017501206854055977,
            0.21798365122615804,
            0.964997586291888,
            0.7656675749318801
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-try-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1-layer-0.png"
        },
        {
          "id": "dm-try-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1-layer-1.png"
        },
        {
          "id": "dm-try-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-try-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": true
    },
    {
      "id": "access-procedure-1",
      "title": "Owner decisions before mapping.",
      "art": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1",
      "artCropInsetPct": 0,
      "b": 268,
      "l": 100,
      "room": "office",
      "score": 0,
      "continues": false,
      "layers": [
        {
          "id": "dm-procedure-background",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "dm-procedure-agents",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "dm-procedure-humans",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-humans.png",
          "role": "humans"
        },
        {
          "id": "dm-procedure-props",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-props.png",
          "role": "props"
        }
      ],
      "panels": [
        {
          "img": "dm-process-business-rule",
          "at": 1,
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.010416666666666666,
            0.0126953125,
            0.544921875,
            0.294921875
          ],
          "room": "office",
          "alt": "Dana brings the pencilled exception and current matter ownership to Matt. The firm’s earlier sharing procedure is retained; missing Plante access behavior is a different workflow.",
          "balloons": [
            {
              "who": "narrator",
              "kind": "place",
              "text": "Floor 28. Week five. Friday morning.",
              "at": 1.5,
              "state": "narration",
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
              "who": "matt",
              "kind": "speech",
              "text": "Who decides whether this sealed file should open?",
              "at": 3,
              "state": "calm",
              "x": 0.017501206854055977,
              "y": 0.07356948228882834,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.07480916030534351,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.35,
                  0.5838167938931298
                ]
              },
              "tail": [
                0.3,
                0.5697547683923706
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "who": "dana",
              "kind": "speech",
              "text": "Its matter owner. The old system refused the clerk; the map missed that rule.",
              "at": 4.5,
              "state": "calm",
              "x": 0.017501206854055977,
              "y": 0.20027247956403268,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.20916030534351146,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.5838167938931298
                ]
              },
              "tail": [
                0.7,
                0.5697547683923706
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "phoneArt": [
            0.022792022792022793,
            0.41068702290076337,
            0.9544159544159544,
            0.5770992366412214
          ],
          "pageArt": [
            0.017501206854055977,
            0.3923705722070845,
            0.964997586291888,
            0.5912806539509536
          ],
          "layerMotion": [
            {
              "layerId": "dm-procedure-background",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-props",
              "preset": "still"
            }
          ]
        },
        {
          "img": "dm-process-review-rule",
          "at": 17,
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.5690104166666666,
            0.0126953125,
            0.4212239583333333,
            0.294921875
          ],
          "room": "office",
          "alt": "Observed legacy behavior is evidence; a current owner must confirm the intended policy. Retired George is not the current approver.",
          "balloons": [
            {
              "who": "matt",
              "kind": "speech",
              "text": "Record the difference. The current matter owner confirms what should be allowed.",
              "at": 17.5,
              "state": "calm",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.35,
                  0.5229007633587787
                ]
              },
              "tail": [
                0.3,
                0.512534059945504
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "who": "dana",
              "kind": "speech",
              "text": "Every sealed file needs that check.",
              "at": 19,
              "state": "calm",
              "x": 0.017501206854055977,
              "y": 0.20708446866485014,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.21374045801526717,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.5229007633587787
                ]
              },
              "tail": [
                0.7,
                0.512534059945504
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "phoneArt": [
            0.022792022792022793,
            0.3236641221374046,
            0.9544159544159544,
            0.6641221374045801
          ],
          "pageArt": [
            0.017501206854055977,
            0.3106267029972752,
            0.964997586291888,
            0.6730245231607629
          ],
          "layerMotion": [
            {
              "layerId": "dm-procedure-background",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-props",
              "preset": "still"
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "dm-process-business-rule",
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
            "img": "dm-process-review-rule",
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
      "id": "access-procedure-2",
      "title": "Existing knowledge; controlled domain work.",
      "art": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1",
      "artCropInsetPct": 0,
      "b": 268,
      "l": 100,
      "room": "office",
      "score": 0,
      "continues": true,
      "layers": [
        {
          "id": "dm-procedure-background",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "dm-procedure-agents",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "dm-procedure-humans",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-humans.png",
          "role": "humans"
        },
        {
          "id": "dm-procedure-props",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-props.png",
          "role": "props"
        }
      ],
      "panels": [
        {
          "img": "dm-process-existing-brain",
          "at": 27.5,
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.010416666666666666,
            0.3271484375,
            0.283203125,
            0.306640625
          ],
          "room": "office",
          "alt": "The existing retained sharing-procedure Second Brain is a separate teal binder tower, before agent connection. No humans are visible in this box; Matt and Dana speak from off-panel.",
          "balloons": [
            {
              "who": "matt",
              "kind": "speech",
              "text": "Your Second Brain already keeps the firm’s sharing procedure.",
              "at": 28,
              "state": "offpanel",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.08091603053435115
                ]
              },
              "tail": [
                0,
                0.08174386920980925
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "who": "dana",
              "kind": "speech",
              "text": "The migration checks are missing.",
              "at": 29.5,
              "state": "offpanel",
              "x": 0.7930535455861071,
              "y": 0.16348773841961853,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.16793893129770993,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.21374045801526717
                ]
              },
              "tail": [
                1,
                0.20708446866485014
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "phoneArt": [
            0.022792022792022793,
            0.2778625954198473,
            0.9544159544159544,
            0.7099236641221374
          ],
          "pageArt": [
            0.017501206854055977,
            0.2670299727520436,
            0.964997586291888,
            0.7166212534059946
          ],
          "layerMotion": [
            {
              "layerId": "dm-procedure-background",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-props",
              "preset": "still"
            }
          ]
        },
        {
          "img": "dm-process-build",
          "at": 36.5,
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.3059895833333333,
            0.3271484375,
            0.3756510416666667,
            0.306640625
          ],
          "room": "office",
          "alt": "Claude in the paper coat stands beside armoured Codex working at the correctly facing vendor/domain migration workspace. Matt speaks from off-panel. The physical monitor and chair stay fixed; no miniature human is present.",
          "balloons": [
            {
              "who": "matt",
              "kind": "speech",
              "text": "Claude, retain the sources and owner decisions. Codex, build the access checks.",
              "at": 37,
              "state": "offpanel",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.10305343511450381
                ]
              },
              "tail": [
                0,
                0.10286103542234332
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "who": "codex",
              "kind": "speech",
              "text": "File, role, old result, captured new result. Differences wait for the owner.",
              "at": 38.5,
              "state": "calm",
              "x": 0.017501206854055977,
              "y": 0.20572207084468666,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.21221374045801528,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.7003053435114505
                ]
              },
              "tail": [
                0.7,
                0.652724795640327
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "who": "narrator",
              "kind": "caption",
              "text": "The migration domain harness wraps the vendor harnesses",
              "at": 40,
              "state": "narration",
              "x": 0.017501206854055977,
              "y": 0.39645776566757496,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.4122137404580153,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "who": "narrator",
              "kind": "caption",
              "text": "with reviewed rules, test skills and controlled access.",
              "at": 41.5,
              "state": "narration",
              "x": 0.017501206854055977,
              "y": 0.4536784741144414,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.4946564885496183,
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
          "phoneArt": [
            0.022792022792022793,
            0.5770992366412214,
            0.9544159544159544,
            0.41068702290076337
          ],
          "pageArt": [
            0.017501206854055977,
            0.510899182561308,
            0.964997586291888,
            0.47275204359673023
          ],
          "layerMotion": [
            {
              "layerId": "dm-procedure-background",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-props",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.22
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "dm-process-existing-brain",
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
            "img": "dm-process-build",
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
      "id": "access-procedure-3",
      "title": "Captured evidence; scoped identities.",
      "art": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1",
      "artCropInsetPct": 0,
      "b": 268,
      "l": 100,
      "room": "office",
      "score": 0,
      "continues": true,
      "layers": [
        {
          "id": "dm-procedure-background",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "dm-procedure-agents",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "dm-procedure-humans",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-humans.png",
          "role": "humans"
        },
        {
          "id": "dm-procedure-props",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-props.png",
          "role": "props"
        }
      ],
      "panels": [
        {
          "img": "dm-process-contained-evidence",
          "at": 58.5,
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.6946614583333334,
            0.3271484375,
            0.2955729166666667,
            0.306640625
          ],
          "room": "office",
          "alt": "Three front-facing retained paper reports compare old denied clerk access, captured pre-hold new allowed access, and a restricted test copy. No humans appear; Dana and Matt speak off-panel.",
          "balloons": [
            {
              "who": "matt",
              "kind": "speech",
              "text": "Use captured results and restricted test copies. The live sealed files stay closed.",
              "at": 59,
              "state": "offpanel",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0,
                  0.1015267175572519
                ]
              },
              "tail": [
                0,
                0.10149863760217984
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "phoneArt": [
            0.022792022792022793,
            0.20916030534351146,
            0.9544159544159544,
            0.7786259541984732
          ],
          "pageArt": [
            0.017501206854055977,
            0.20299727520435967,
            0.964997586291888,
            0.7806539509536785
          ],
          "layerMotion": [
            {
              "layerId": "dm-procedure-background",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-props",
              "preset": "still"
            }
          ]
        },
        {
          "img": "dm-process-scoped-identity",
          "at": 65.5,
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.010416666666666666,
            0.65625,
            0.283203125,
            0.3291015625
          ],
          "room": "office",
          "alt": "Matt configures limited test identities and separate production release authority. Agents read approved evidence and write reports; they cannot expand live access or release a wave.",
          "balloons": [
            {
              "who": "matt",
              "kind": "speech",
              "text": "Test accounts get only agreed test data. Production writes stay blocked.",
              "at": 66,
              "state": "calm",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.35,
                  0.42885496183206107
                ]
              },
              "tail": [
                0.3,
                0.42384196185286105
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "phoneArt": [
            0.022792022792022793,
            0.18931297709923664,
            0.9544159544159544,
            0.7984732824427481
          ],
          "pageArt": [
            0.017501206854055977,
            0.18392370572207084,
            0.964997586291888,
            0.7997275204359673
          ],
          "layerMotion": [
            {
              "layerId": "dm-procedure-background",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-props",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.18
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "dm-process-contained-evidence",
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
            "img": "dm-process-scoped-identity",
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
      "id": "access-procedure-4",
      "title": "Refused writes; retained checks.",
      "art": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1",
      "artCropInsetPct": 0,
      "b": 268,
      "l": 100,
      "room": "office",
      "score": 0,
      "continues": true,
      "layers": [
        {
          "id": "dm-procedure-background",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "dm-procedure-agents",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "dm-procedure-humans",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-humans.png",
          "role": "humans"
        },
        {
          "id": "dm-procedure-props",
          "src": "/comic/data-migrations/data-migrations-access-procedure-20261010-live-v1-props.png",
          "role": "props"
        }
      ],
      "panels": [
        {
          "img": "dm-process-refused-write",
          "at": 72,
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0.3059895833333333,
            0.65625,
            0.24479166666666666,
            0.3291015625
          ],
          "room": "office",
          "alt": "A deliberate live-change authorization probe is denied. Show the permission result with no production write or wave.",
          "balloons": [
            {
              "who": "codex",
              "kind": "speech",
              "text": "Production write test: denied. The report can be saved.",
              "at": 72.5,
              "state": "calm",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.41389312977099235
                ]
              },
              "tail": [
                0.7,
                0.41049046321525884
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "phoneArt": [
            0.022792022792022793,
            0.16793893129770993,
            0.9544159544159544,
            0.8198473282442749
          ],
          "pageArt": [
            0.017501206854055977,
            0.164850136239782,
            0.964997586291888,
            0.8188010899182562
          ],
          "layerMotion": [
            {
              "layerId": "dm-procedure-background",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-props",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.2
            },
            {
              "kind": "click",
              "gain": 0.15,
              "delay": 2
            }
          ]
        },
        {
          "img": "dm-process-brain",
          "at": 77.5,
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.5638020833333334,
            0.65625,
            0.4264322916666667,
            0.3291015625
          ],
          "room": "office",
          "alt": "The existing binder tower gains an outlined pending-owner migration-check floor. Claude and armoured Codex stand beside solid Dana and Matt, in coherent relative scale. The new procedure is retained pending current matter-owner approval.",
          "balloons": [
            {
              "who": "matt",
              "kind": "speech",
              "text": "Plante’s access checks join your Second Brain.",
              "at": 78,
              "state": "calm",
              "x": 0.017501206854055977,
              "y": 0.01634877384196185,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.35,
                  0.6094656488549618
                ]
              },
              "tail": [
                0.3,
                0.5802452316076294
              ],
              "anchor": "free",
              "chain": false
            },
            {
              "who": "narrator",
              "kind": "caption",
              "text": "The teal tower kept the procedures, their sources and the people responsible.",
              "at": 79.5,
              "state": "narration",
              "x": 0.017501206854055977,
              "y": 0.14168937329700274,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.1450381679389313,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false
              },
              "anchor": "free",
              "chain": false
            },
            {
              "who": "codex",
              "kind": "speech",
              "text": "I use the access checks. Each approved correction returns with its source and owner.",
              "at": 81,
              "state": "calm",
              "x": 0.017501206854055977,
              "y": 0.21934604904632152,
              "w": 0.964997586291888,
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.24885496183206107,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.6094656488549618
                ]
              },
              "tail": [
                0.7,
                0.5802452316076294
              ],
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "phoneArt": [
            0.022792022792022793,
            0.44732824427480916,
            0.9544159544159544,
            0.5404580152671755
          ],
          "pageArt": [
            0.017501206854055977,
            0.40735694822888285,
            0.964997586291888,
            0.5762942779291553
          ],
          "layerMotion": [
            {
              "layerId": "dm-procedure-background",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-procedure-props",
              "preset": "still"
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "dm-process-refused-write",
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
            "img": "dm-process-brain",
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
      "id": "red",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-test-wall",
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
            "img": "dm-lights-green",
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
            "img": "dm-codex-red",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1",
      "b": 368,
      "l": 52,
      "room": "servers",
      "score": 0.04,
      "villains": [
        "snowball"
      ],
      "title": "Basement two. Tuesday, 2:30 a.m.",
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
            0.00946969696969697,
            0.014098690835850957,
            0.5126262626262627,
            0.3947633434038268
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.94691331
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.22595419847328244,
            0.9544159544159544,
            0.7618320610687023
          ],
          "img": "dm-test-wall",
          "alt": "Wide: basement two, the server room; Codex at the racks, gauntlets now teal, before a tall wall of small test lights; Dana and Claude (visor teal) watch from the cage door.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Basement two, the server\nroom. Week six.\nTuesday, 2:30 a.m.",
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
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Access tested for\nevery file and group.\nOld system and new.",
              "x": 0.026607538802660754,
              "y": 0.11444141689373297,
              "w": 0.9467849223946785,
              "tail": [
                0.68,
                0.44673024523160765
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.45450381679389307
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "layerMotion": [
            {
              "layerId": "dm-red-background",
              "preset": "still"
            },
            {
              "layerId": "red-agents",
              "preset": "still"
            },
            {
              "layerId": "red-reflection",
              "preset": "still"
            },
            {
              "layerId": "red-humans",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.25
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.21662125340599456,
            0.9467849223946785,
            0.7670299727520435
          ]
        },
        {
          "at": 12.5,
          "room": "servers",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5347222222222222,
            0.014098690835850957,
            0.22348484848484848,
            0.3947633434038268
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.76209817
            ]
          },
          "img": "dm-lights-green",
          "alt": "The test wall close: row after row of lights going green from left to right.",
          "balloons": [],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-red-background",
              "preset": "still"
            },
            {
              "layerId": "red-agents",
              "preset": "still"
            },
            {
              "layerId": "red-reflection",
              "preset": "still"
            },
            {
              "layerId": "red-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.030534351145038167,
            0.9544159544159544,
            0.9572519083969465
          ],
          "pageArt": [
            0.026607538802660754,
            0.0326975476839237,
            0.9467849223946785,
            0.9509536784741145
          ]
        },
        {
          "at": 14,
          "room": "servers",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.7695707070707071,
            0.014098690835850957,
            0.2215909090909091,
            0.3947633434038268
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "dm-codex-red",
          "alt": "Close: red test lights reflected across Codex's bare face.",
          "balloons": [
            {
              "at": 14.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Stop. 4,112 files\nwould open to\nthe whole firm.",
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
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-red-background",
              "preset": "still"
            },
            {
              "layerId": "red-agents",
              "preset": "still"
            },
            {
              "layerId": "red-reflection",
              "preset": "still"
            },
            {
              "layerId": "red-humans",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "alarm",
              "gain": 0.14
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "pageArt": [
            0.026607538802660754,
            0.11852861035422343,
            0.9467849223946785,
            0.8651226158038147
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-red-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-0.png"
        },
        {
          "id": "red-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-1.png"
        },
        {
          "id": "red-reflection",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-2.png"
        },
        {
          "id": "red-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-3.png"
        }
      ],
      "continues": false
    },
    {
      "id": "red-prep-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-dana-how-many",
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
            "img": "dm-codex-answer",
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
            "img": "dm-access-log",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1",
      "b": 368,
      "l": 52,
      "room": "servers",
      "score": 0.04,
      "villains": [
        "snowball"
      ],
      "title": "Basement two. Tuesday, 2:30 a.m.",
      "panels": [
        {
          "at": 19.5,
          "room": "servers",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.00946969696969697,
            0.6847935548841894,
            0.19128787878787878,
            0.297079556898288
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
          "img": "dm-dana-how-many",
          "alt": "Medium: Dana at the cage door, very still, the red light across her glasses.",
          "balloons": [
            {
              "at": 20,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "How many have\nalready moved?",
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
                  0.65,
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
          "layerMotion": [
            {
              "layerId": "dm-red-background",
              "preset": "still"
            },
            {
              "layerId": "red-agents",
              "preset": "still"
            },
            {
              "layerId": "red-reflection",
              "preset": "still"
            },
            {
              "layerId": "red-humans",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.09809264305177112,
            0.9467849223946785,
            0.885558583106267
          ]
        },
        {
          "at": 23.5,
          "room": "servers",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.21338383838383837,
            0.42497482376636453,
            0.23232323232323232,
            0.229607250755287
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "dm-codex-answer",
          "alt": "Close: Codex, flat, not turning from the wall of lights.",
          "balloons": [
            {
              "at": 24,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Nine hundred\nof those sealed files.\nMoved in week three.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.55,
                0.3790190735694823
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-red-background",
              "preset": "still"
            },
            {
              "layerId": "red-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.1
            },
            {
              "layerId": "red-reflection",
              "preset": "still"
            },
            {
              "layerId": "red-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
        },
        {
          "at": 29.5,
          "room": "servers",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.21338383838383837,
            0.67472306143001,
            0.23232323232323232,
            0.31017119838872104
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.55536417
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.12213740458015267,
            0.9544159544159544,
            0.8656488549618321
          ],
          "img": "dm-access-log",
          "alt": "Two historical access-log entries, both dated week four. One matches the clerk’s Thursday report exactly; the other is the second disclosure. No third event is implied, and the live restriction remains active.",
          "balloons": [
            {
              "at": 30,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Week four:\nTwo unauthorized opens.\nThe clerk’s, and one other.",
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
                  0.65,
                  0.38183206106870227
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-red-background",
              "preset": "still"
            },
            {
              "layerId": "red-agents",
              "preset": "still"
            },
            {
              "layerId": "red-reflection",
              "preset": "still"
            },
            {
              "layerId": "red-humans",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11989100817438691,
            0.9467849223946785,
            0.8637602179836512
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-red-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-0.png"
        },
        {
          "id": "red-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-1.png"
        },
        {
          "id": "red-reflection",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-2.png"
        },
        {
          "id": "red-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-3.png"
        }
      ],
      "continues": true
    },
    {
      "id": "red-prep-3",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-dana-gate",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1",
      "b": 368,
      "l": 52,
      "room": "servers",
      "score": 0.04,
      "villains": [
        "snowball"
      ],
      "title": "Basement two. Tuesday, 2:30 a.m.",
      "panels": [
        {
          "at": 35.5,
          "room": "servers",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.4577020202020202,
            0.42497482376636453,
            0.5334595959595959,
            0.5599194360523666
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.37172322
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.34045801526717556,
            0.9544159544159544,
            0.6473282442748092
          ],
          "img": "dm-dana-gate",
          "alt": "Dominant: Dana steps between Codex and the racks, one arm out across the cage door like a barrier, the red wall behind her; Codex lifts his teal gauntlets from the keys.",
          "balloons": [
            {
              "at": 36,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "A custody file.\nA sealed settlement.\nOpened in week four.",
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
              "at": 37.5,
              "kind": "burst",
              "state": "shout",
              "who": "dana",
              "text": "Keep them restricted.\nNothing else moves.",
              "x": 0.00868516075146906,
              "y": 0.11444141689373297,
              "w": 0.9826296784970618,
              "tail": [
                0.19,
                0.5201634877384196
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.11603053435114503,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.19,
                  0.5346564885496183
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 39,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Restriction confirmed.\nNo new openings.",
              "x": 0.00868516075146906,
              "y": 0.23978201634877383,
              "w": 0.9826296784970618,
              "tail": [
                0.82,
                0.5201634877384196
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.2534351145038168,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.5346564885496183
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-red-background",
              "preset": "still"
            },
            {
              "layerId": "red-agents",
              "preset": "still"
            },
            {
              "layerId": "red-reflection",
              "preset": "still"
            },
            {
              "layerId": "red-humans",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.3215258855585831,
            0.9826296784970618,
            0.662125340599455
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-red-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-0.png"
        },
        {
          "id": "red-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-1.png"
        },
        {
          "id": "red-reflection",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-2.png"
        },
        {
          "id": "red-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-red-20261010-live-v1-layer-3.png"
        }
      ],
      "continues": true
    },
    {
      "id": "repair",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-owner-confirms",
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
            "img": "dm-rule-recorded",
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
            "img": "dm-access-proof",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1",
      "b": 420,
      "l": 52,
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
            0.00946372239747634,
            0.01310483870967742,
            0.6138801261829653,
            0.35080645161290325
          ],
          "cropFocus": {
            "phone": [
              0.78677824,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.2641221374045801,
            0.9544159544159544,
            0.7236641221374046
          ],
          "img": "dm-owner-confirms",
          "alt": "Dana meets the current responsible lawyer with the sealed-file rule and the actual affected-file list; Matt listens nearby.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28. Week six.\nTuesday, 10:00 a.m.",
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
              "text": "The current matter owner\nconfirmed the rule.",
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
              "at": 4.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Matter team only.\nFor each sealed file.",
              "x": 0.026607538802660754,
              "y": 0.17166212534059946,
              "w": 0.9467849223946785,
              "tail": [
                0.25,
                0.47247956403269753
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.17709923664122137,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.4812213740458015
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-repair-background",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.25340599455040874,
            0.9467849223946785,
            0.7302452316076294
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
            0.6353312302839117,
            0.01310483870967742,
            0.35583596214511043,
            0.35080645161290325
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.18931297709923664,
            0.9544159544159544,
            0.7984732824427481
          ],
          "img": "dm-rule-recorded",
          "alt": "Claude records the rule with its current owner, source and date, linking it to the tested example rather than copying a bare sentence.",
          "balloons": [
            {
              "at": 14.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Rule, source, matter owner and access tests. Recorded together.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.68,
                0.42384196185286105
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.42885496183206107
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-repair-background",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-props",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "click",
              "gain": 0.12
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.18392370572207084,
            0.9467849223946785,
            0.7997275204359673
          ]
        },
        {
          "at": 19.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.00946372239747634,
            0.3810483870967742,
            0.5646687697160884,
            0.6048387096774194
          ],
          "cropFocus": {
            "phone": [
              0.78607215,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.27633587786259545,
            0.9544159544159544,
            0.7114503816793893
          ],
          "img": "dm-access-proof",
          "alt": "Dominant panel: Codex applies the corrected rule to an isolated test copy. Dana watches two tests of the same file: the named matter-team role can open it, the junior-clerk role cannot.",
          "balloons": [
            {
              "at": 20,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Matter team allowed. Clerk denied. The owner-approved rule passed both tests.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.27,
                0.4810626702997275
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.48977099236641225
                ]
              },
              "anchor": "free",
              "chain": false
            },
            {
              "at": 21.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Now check the rest\nthe same way.",
              "x": 0.026607538802660754,
              "y": 0.18392370572207084,
              "w": 0.9467849223946785,
              "tail": [
                0.82,
                0.4810626702997275
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.18931297709923664,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.48977099236641225
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-repair-background",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-props",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.25
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.2656675749318801,
            0.9467849223946785,
            0.717983651226158
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-repair-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1-layer-0.png"
        },
        {
          "id": "dm-repair-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1-layer-1.png"
        },
        {
          "id": "dm-repair-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1-layer-2.png"
        },
        {
          "id": "dm-repair-props",
          "role": "props",
          "src": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1-layer-3.png"
        }
      ],
      "continues": false
    },
    {
      "id": "repair-prep-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-affected-rechecked",
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
            "img": "dm-two-openings",
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
            "img": "dm-resume-authorized",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1",
      "b": 420,
      "l": 52,
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 30,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5854889589905363,
            0.3810483870967742,
            0.4056782334384858,
            0.16532258064516128
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "img": "dm-affected-rechecked",
          "alt": "The 900 already moved affected files remain restricted while the corrected allowed-role and refused-role tests run. They are a bounded subset of the overall migration. Only validated matter-team access is eligible to return.",
          "balloons": [
            {
              "at": 30.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The nine hundred\nstayed restricted\nuntil each test passed.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-repair-background",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        },
        {
          "at": 35.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5854889589905363,
            0.5645161290322581,
            0.4056782334384858,
            0.17540322580645162
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "img": "dm-two-openings",
          "alt": "Dana and the responsible lawyer prepare two notifications from the confirmed access log. Keep private content closed and unreadable.",
          "balloons": [
            {
              "at": 36,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Two confirmed disclosures.\nThe firm contacted\nboth clients.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-repair-background",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        },
        {
          "at": 40.5,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5854889589905363,
            0.7580645161290323,
            0.4056782334384858,
            0.22782258064516128
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.21531551
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.1450381679389313,
            0.9544159544159544,
            0.8427480916030534
          ],
          "img": "dm-resume-authorized",
          "alt": "After reviewing passed tests with the responsible owner, Dana restores only the confirmed matter teams’ access and authorizes one controlled migration wave. Matt stands behind them, not signing for them. The broad access never returns.",
          "balloons": [
            {
              "at": 41,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Tests passed.\nRestore approved access.\nResume one wave.\nThen check again.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.08,
                0.39427792915531334
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
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
          "layerMotion": [
            {
              "layerId": "dm-repair-background",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-humans",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-agents",
              "preset": "still"
            },
            {
              "layerId": "dm-repair-props",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "click",
              "gain": 0.14
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.14168937329700274,
            0.9467849223946785,
            0.8419618528610354
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-repair-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1-layer-0.png"
        },
        {
          "id": "dm-repair-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1-layer-1.png"
        },
        {
          "id": "dm-repair-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1-layer-2.png"
        },
        {
          "id": "dm-repair-props",
          "role": "props",
          "src": "/comic/data-migrations/live-20261010/data-migrations-repair-20261010-live-v1-layer-3.png"
        }
      ],
      "continues": true
    },
    {
      "id": "cutover",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-last-run",
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
            "img": "dm-all-green",
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
            "img": "dm-lawyer-opens",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1",
      "b": 472,
      "l": 52,
      "room": "office",
      "score": 0.04,
      "title": "Basement one. Monday 8 March, 6:00 a.m.",
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
            0.008201892744479496,
            0.012096774193548387,
            0.48517350157728706,
            0.34274193548387094
          ],
          "cropFocus": {
            "phone": [
              0.90298701,
              0.5
            ]
          },
          "img": "dm-last-run",
          "alt": "Wide: the records room at 6 a.m., half the shelves now empty; Dana at the green terminal for the last time, Codex and Claude beside her, both lit teal.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Basement one.\nEight weeks later.\nMonday, 8 March, 6:00 a.m.",
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
              "text": "The final wave\nwas checked before\nthe planned shutdown.",
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
          "layerMotion": [
            {
              "layerId": "dm-cutover-background",
              "preset": "still"
            },
            {
              "layerId": "cutover-agents",
              "preset": "still"
            },
            {
              "layerId": "cutover-humans",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.24
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.2198473282442748,
            0.9544159544159544,
            0.76793893129771
          ],
          "pageArt": [
            0.026607538802660754,
            0.2125340599455041,
            0.9467849223946785,
            0.771117166212534
          ]
        },
        {
          "at": 12,
          "room": "servers",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.5059936908517351,
            0.012096774193548387,
            0.2220820189274448,
            0.34274193548387094
          ],
          "cropFocus": {
            "phone": [
              0.79815283,
              0.5
            ]
          },
          "img": "dm-all-green",
          "alt": "Medium: Codex before the test wall, every light green, his gauntlets teal.",
          "balloons": [
            {
              "at": 12.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Last wave.\nEvery test green.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.27,
                0.3637602179836512
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
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
          "layerMotion": [
            {
              "layerId": "dm-cutover-background",
              "preset": "still"
            },
            {
              "layerId": "cutover-agents",
              "preset": "still"
            },
            {
              "layerId": "cutover-humans",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "click",
              "gain": 0.12
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09923664122137404,
            0.9544159544159544,
            0.8885496183206106
          ],
          "pageArt": [
            0.026607538802660754,
            0.09809264305177112,
            0.9467849223946785,
            0.885558583106267
          ]
        },
        {
          "at": 16,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.7400630914826498,
            0.012096774193548387,
            0.25173501577287066,
            0.34274193548387094
          ],
          "cropFocus": {
            "phone": [
              0.52557518,
              0.5
            ]
          },
          "img": "dm-lawyer-opens",
          "alt": "Upstairs on floor 28: a lawyer with a coffee opens a file on a new screen and simply starts reading.",
          "balloons": [
            {
              "at": 16.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28, 9:02 a.m.\nThe lawyers opened\ntheir files.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-cutover-background",
              "preset": "still"
            },
            {
              "layerId": "cutover-agents",
              "preset": "still"
            },
            {
              "layerId": "cutover-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-cutover-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1-layer-0.png"
        },
        {
          "id": "cutover-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1-layer-1.png"
        },
        {
          "id": "cutover-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1-layer-2.png"
        }
      ],
      "continues": false
    },
    {
      "id": "cutover-prep-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-letters",
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
            "img": "dm-screen-dark",
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
            "img": "dm-rule-written",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-cutover-anatomy-20261010-live-v2",
      "b": 472,
      "l": 52,
      "room": "office",
      "score": 0.04,
      "title": "Basement one. Monday 8 March, 6:00 a.m.",
      "panels": [
        {
          "at": 21.5,
          "room": "office",
          "r": [
            0,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.008201892744479496,
            0.37399193548387094,
            0.23470031545741324,
            0.6139112903225806
          ],
          "cropFocus": {
            "phone": [
              0,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.11603053435114503,
            0.9544159544159544,
            0.8717557251908397
          ],
          "img": "dm-letters",
          "alt": "Tall: Dana at her desk on floor 28, signing the second of two letters on the firm's letterhead, the first already folded.",
          "balloons": [
            {
              "at": 22,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The two letters remained.\nA corrected rule\ncould not unread a file.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-cutover-background",
              "preset": "still"
            },
            {
              "layerId": "cutover-agents",
              "preset": "still"
            },
            {
              "layerId": "cutover-humans",
              "preset": "still"
            },
            {
              "layerId": "cutover-human-rear",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.11444141689373297,
            0.9467849223946785,
            0.8692098092643051
          ]
        },
        {
          "at": 28.5,
          "room": "office",
          "r": [
            0.3333333333333333,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.25488958990536276,
            0.37399193548387094,
            0.21451104100946372,
            0.23084677419354838
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "dm-screen-dark",
          "alt": "Close: the old terminal's green screen shrinking to a dot and going dark.",
          "balloons": [
            {
              "at": 29,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Noon. Plante\nwent dark.",
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
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-cutover-background",
              "preset": "still"
            },
            {
              "layerId": "cutover-agents",
              "preset": "still"
            },
            {
              "layerId": "cutover-humans",
              "preset": "still"
            },
            {
              "layerId": "cutover-human-rear",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "click",
              "gain": 0.12
            }
          ],
          "phoneArt": [
            0.022792022792022793,
            0.09465648854961832,
            0.9544159544159544,
            0.8931297709923665
          ],
          "pageArt": [
            0.026607538802660754,
            0.09400544959128065,
            0.9467849223946785,
            0.8896457765667575
          ]
        },
        {
          "at": 32,
          "room": "office",
          "r": [
            0.6666666666666666,
            0,
            0.3333333333333333,
            1
          ],
          "ar": [
            0.25488958990536276,
            0.6219758064516129,
            0.21451104100946372,
            0.3659274193548387
          ],
          "cropFocus": {
            "phone": [
              0.78767184,
              0.5
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.1450381679389313,
            0.9544159544159544,
            0.8427480916030534
          ],
          "img": "dm-rule-written",
          "alt": "Claude opens the maintained rule record for a new colleague while Dana stands beside them. The current owner and source are visibly associated with the rule; the teal knowledge lattice lights behind the record, not in place of it.",
          "balloons": [
            {
              "at": 32.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "The rule, its source\nand its owner.\nReady for the\nnext person.",
              "x": 0.026607538802660754,
              "y": 0.01634877384196185,
              "w": 0.9467849223946785,
              "tail": [
                0.13,
                0.3952316076294278
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
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
          "layerMotion": [
            {
              "layerId": "dm-cutover-background",
              "preset": "still"
            },
            {
              "layerId": "cutover-agents",
              "preset": "still"
            },
            {
              "layerId": "cutover-humans",
              "preset": "still"
            },
            {
              "layerId": "cutover-human-rear",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.026607538802660754,
            0.14305177111716622,
            0.9467849223946785,
            0.840599455040872
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-cutover-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1-layer-0.png"
        },
        {
          "id": "cutover-human-rear",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-anatomy-20261010-live-v2-human-rear.png"
        },
        {
          "id": "cutover-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1-layer-1.png"
        },
        {
          "id": "cutover-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-anatomy-20261010-live-v2-human-front.png"
        }
      ],
      "continues": true
    },
    {
      "id": "cutover-prep-3",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "dm-dana-closes",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1",
      "b": 472,
      "l": 52,
      "room": "office",
      "score": 0.04,
      "title": "Basement one. Monday 8 March, 6:00 a.m.",
      "panels": [
        {
          "at": 39,
          "room": "office",
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.48138801261829656,
            0.37399193548387094,
            0.510410094637224,
            0.6139112903225806
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.79862121
            ]
          },
          "phoneArt": [
            0.022792022792022793,
            0.18931297709923664,
            0.9544159544159544,
            0.7984732824427481
          ],
          "img": "dm-dana-closes",
          "alt": "Dana hands the maintained rule record to a colleague at the new system. The colleague successfully finds the source and named current owner. Dana closes the old binder with relief; the office and equipment remain intact.",
          "balloons": [
            {
              "at": 39.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "I keep these checks current. Each matter owner reviews who can open its files.",
              "x": 0.00868516075146906,
              "y": 0.01634877384196185,
              "w": 0.9826296784970618,
              "tail": [
                0.29,
                0.42384196185286105
              ],
              "phone": {
                "x": 0.022792022792022793,
                "y": 0.012213740458015267,
                "w": 0.9544159544159544,
                "anchor": "free",
                "chain": false,
                "tail": [
                  0.65,
                  0.42885496183206107
                ]
              },
              "anchor": "free",
              "chain": false
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "dm-cutover-background",
              "preset": "still"
            },
            {
              "layerId": "cutover-agents",
              "preset": "still"
            },
            {
              "layerId": "cutover-humans",
              "preset": "still"
            }
          ],
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.14
            }
          ],
          "pageArt": [
            0.00868516075146906,
            0.18392370572207084,
            0.9826296784970618,
            0.7997275204359673
          ]
        }
      ],
      "layers": [
        {
          "id": "dm-cutover-background",
          "role": "background",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1-layer-0.png"
        },
        {
          "id": "cutover-agents",
          "role": "agents",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1-layer-1.png"
        },
        {
          "id": "cutover-humans",
          "role": "humans",
          "src": "/comic/data-migrations/live-20261010/data-migrations-cutover-20261010-live-v1-layer-2.png"
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
    "b": 524,
    "heading": "The Keon Tower has forty floors.",
    "choices": [
      {
        "label": "Floor 19. The training records are gone.",
        "href": "/agentic-systems-b/",
        "img": "dm-next-sam"
      },
      {
        "label": "Floor 28. A file opened for someone who should never see it.",
        "href": "/traditional-systems-b/",
        "img": "dm-next-dana-access"
      },
      {
        "label": "Plan the move before anyone assumes.",
        "href": "/data-migrations/migration-planning/",
        "img": "dm-snowball-grows"
      },
      {
        "label": "Move into Microsoft 365 with checks that show what arrived.",
        "href": "/data-migrations/m365-migrations/",
        "img": "dm-cutover"
      }
    ]
  }
}
);
