// Home live motion rebuild, 2026-10-10. Words and storyboard: canonical comics-library record.


// Artwork/layers are versioned candidates; final source/phone/lettering/hearing reviews remain pending.


import type { ComicStory } from './types';


import { retime } from './retime';





export const homeComic: ComicStory = retime({
  "id": "home",
  "issue": 1,
  "title": "The night shift.",
  "bpm": 90,
  "beats": 596,
  "music": {
    "src": "/audio/moire-epic-win.mp3",
    "offset": 0.165,
    "credit": "Music: Epic Win by Moire",
    "source": "",
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
      "id": "quote",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-tower-night"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-desk"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-phone-ring"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-grin"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-types"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-chat-ok"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-send"
          }
        ]
      ],
      "art": "/comic/home/home-quote-20261010-live-v1",
      "b": 0,
      "l": 92,
      "score": 0,
      "room": "street",
      "villains": [
        "snowball"
      ],
      "panels": [
        {
          "at": 1,
          "room": "street",
          "r": [
            0,
            0,
            0.34,
            0.4
          ],
          "ar": [
            0,
            0,
            0.34,
            0.4
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.19217838
            ]
          },
          "img": "home-tower-night",
          "alt": "Establishing, from street level: King Street West at night, wet streetcar tracks, the 40-storey glass Keon Tower lit floor by floor, one high floor still bright.",
          "motion": {
            "preset": "still"
          },
          "sfx": [
            {
              "kind": "transit",
              "gain": 0.2
            }
          ],
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Toronto. The Keon Tower,\nKing Street West. Thursday,\n15 October, 11:04 p.m.",
              "x": 0.03,
              "y": 0.04,
              "w": 0.6,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 22.5,
              "kind": "caption",
              "sceneSetup": true,
              "state": "narration",
              "who": "narrator",
              "text": "Sittler Business Services builds\nand installs office spaces.\nGilmour & Clark’s supplier\ncancelled at the last minute.\nThey need 200 desks installed\nby Monday, 9:00 a.m.\nMarco’s quote is due tonight.",
              "x": 0.04,
              "y": 0.95,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.95,
                "w": 0.94
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "quote-bg",
              "preset": "drift-right",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "quote-fg",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.5179999999999999
          ]
        },
        {
          "at": 38,
          "room": "office",
          "r": [
            0.34,
            0,
            0.4,
            0.4
          ],
          "ar": [
            0.34,
            0,
            0.4,
            0.4
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-marco-desk",
          "alt": "Marco alone on the late-shift sales floor, light-blue shirt and lanyard, a tired hand at his temple. His laptop faces him and the phone rests on his desk before the next ringing-phone box.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 38.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. Sittler\nBusiness Services.",
              "x": 0.03,
              "y": 0.04,
              "w": 0.36,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 42.5,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Marco Lemieux. Sales.\nHe can close\nanything.",
              "x": 0.6,
              "y": 0.66,
              "w": 0.36,
              "phone": {
                "x": 0.025,
                "y": 0.117,
                "w": 0.94
              }
            },
            {
              "at": 47.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The installation crew\nwas booked for Monday.",
              "x": 0.04,
              "y": 0.61,
              "w": 0.52,
              "phone": {
                "x": 0.025,
                "y": 0.252,
                "w": 0.94
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "quote-bg",
              "preset": "still"
            },
            {
              "layerId": "quote-fg",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.379,
            0.96,
            0.581
          ]
        },
        {
          "at": 52.5,
          "room": "office",
          "r": [
            0.74,
            0,
            0.26,
            0.17
          ],
          "ar": [
            0.74,
            0,
            0.26,
            0.17
          ],
          "cropFocus": {
            "phone": [
              0.46484287,
              0.5
            ]
          },
          "img": "home-phone-ring",
          "alt": "Close on Marco's phone lighting up on the desk, a caller's name on the screen.",
          "sfx": [
            {
              "kind": "ring",
              "gain": 0.5
            }
          ],
          "balloons": [
            {
              "at": 53,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Gilmour & Clark\nmove in Monday.\nThey sign at nine.",
              "x": 0.06,
              "y": 0.06,
              "w": 0.6,
              "tail": [
                0.82,
                0.8
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.82,
                  0.8
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "quote-bg",
              "preset": "still"
            },
            {
              "layerId": "quote-fg",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 59,
          "room": "office",
          "r": [
            0.74,
            0.17,
            0.26,
            0.23
          ],
          "ar": [
            0.74,
            0.17,
            0.26,
            0.23
          ],
          "cropFocus": {
            "phone": [
              0.5503876,
              0.5
            ]
          },
          "img": "home-marco-grin",
          "alt": "Marco, phone to his ear, grins and is already pulling the laptop towards him.",
          "balloons": [
            {
              "at": 59.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "The desks will\nbe ready. Quote\nby midnight.",
              "x": 0.02793,
              "y": 0.61728,
              "w": 0.5,
              "tail": [
                0.52514,
                0.4321
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.52514,
                  0.4321
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "quote-bg",
              "preset": "still"
            },
            {
              "layerId": "quote-fg",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 65,
          "room": "office",
          "r": [
            0,
            0.4,
            0.16,
            0.6
          ],
          "ar": [
            0,
            0.4,
            0.16,
            0.6
          ],
          "cropFocus": {
            "phone": [
              0.32366299,
              0.5
            ]
          },
          "img": "home-marco-types",
          "run": "send",
          "alt": "Marco attaches his old printed rate card to the chat request on the laptop; his index finger rests on the attachment. Show document, human request and chat window together, not mysterious autonomous paperwork. Text and year will be lettered separately.",
          "balloons": [
            {
              "at": 65.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Two hundred desks.\nInclude installation.\nUse this rate card.",
              "x": 0.05,
              "y": 0.05,
              "w": 0.88,
              "tail": [
                0.48,
                0.72
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.48,
                  0.72
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "quote-bg",
              "preset": "still"
            },
            {
              "layerId": "quote-fg",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 71.5,
          "room": "office",
          "r": [
            0.16,
            0.4,
            0.16,
            0.6
          ],
          "ar": [
            0.16,
            0.4,
            0.16,
            0.6
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.31188663
            ]
          },
          "img": "home-chat-ok",
          "run": "send",
          "alt": "Run, step 2: the laptop screen, a chat window with a cheerful green tick; Marco's tired face reflected in the glass.",
          "balloons": [
            {
              "at": 72,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Looks great!\nReady to send.",
              "x": 0.08,
              "y": 0.06,
              "w": 0.84,
              "tail": [
                0.5,
                0.6
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.6
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "quote-bg",
              "preset": "still"
            },
            {
              "layerId": "quote-fg",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 76,
          "room": "office",
          "r": [
            0.32,
            0.4,
            0.68,
            0.6
          ],
          "ar": [
            0.32,
            0.4,
            0.68,
            0.6
          ],
          "cropFocus": {
            "phone": [
              0.48850652,
              0.5
            ]
          },
          "img": "home-send",
          "alt": "Dominant panel: Marco leans back and taps Send; the quote leaves the screen as a stream of pages pouring into the dark office, cold blue-white light on his face.",
          "sfx": [
            {
              "kind": "click"
            }
          ],
          "balloons": [
            {
              "at": 76.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Nobody checked the\nrate card. It was\ntwo years old.",
              "x": 0.02,
              "y": 0.05,
              "w": 0.24,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 82.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "11:58 p.m. Sent.\n$50,000 below cost.",
              "x": 0.74,
              "y": 0.8,
              "w": 0.24,
              "phone": {
                "x": 0.025,
                "y": 0.896,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "quote-bg",
              "preset": "still"
            },
            {
              "layerId": "quote-fg",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.6829999999999999
          ]
        }
      ],
      "layers": [
        {
          "id": "quote-bg",
          "src": "/comic/home/home-quote-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "quote-fg",
          "src": "/comic/home/home-quote-20261010-live-v1-fg.png",
          "role": "humans"
        }
      ]
    },
    {
      "id": "doubt",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-coat"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-reply-email"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-reads"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-ratecard-close"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-silhouette"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-chat-again"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-elevator-go"
          }
        ]
      ],
      "art": "/comic/home/home-doubt-20261010-live-v2",
      "b": 92,
      "l": 40,
      "score": 0,
      "room": "office",
      "villains": [
        "snowball"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.5,
            0.36
          ],
          "ar": [
            0,
            0,
            0.5,
            0.36
          ],
          "cropFocus": {
            "phone": [
              0.70618906,
              0.5
            ]
          },
          "img": "home-marco-coat",
          "alt": "Wide on the sales floor, half the lights off: Marco pulling on his coat, laptop still open, as his phone buzzes on the desk.",
          "sfx": [
            {
              "kind": "buzz"
            }
          ],
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31.\nFriday, 12:31 a.m.",
              "x": 0.02,
              "y": 0.05,
              "w": 0.24,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "doubt-background",
              "preset": "still"
            },
            {
              "layerId": "doubt-humans",
              "preset": "still"
            },
            {
              "layerId": "doubt-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.14200000000000002,
            0.96,
            0.818
          ]
        },
        {
          "at": 5.5,
          "room": "office",
          "r": [
            0.5,
            0,
            0.28,
            0.36
          ],
          "ar": [
            0.5,
            0,
            0.28,
            0.36
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-reply-email",
          "alt": "Close on the phone screen: a short reply from Gilmour & Clark.",
          "balloons": [
            {
              "at": 6,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Sharp number.\nSharper than\nwe expected.",
              "x": 0.08,
              "y": 0.06,
              "w": 0.6,
              "tail": [
                0.6,
                0.8
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.6,
                  0.8
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "doubt-background",
              "preset": "still"
            },
            {
              "layerId": "doubt-humans",
              "preset": "still"
            },
            {
              "layerId": "doubt-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 10.5,
          "room": "office",
          "r": [
            0.78,
            0,
            0.22,
            0.36
          ],
          "ar": [
            0.78,
            0,
            0.22,
            0.36
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.55947137
            ]
          },
          "img": "home-marco-reads",
          "alt": "Close on Marco's face lit from below by the phone; the grin is gone.",
          "balloons": [
            {
              "at": 11,
              "kind": "thought",
              "state": "thought",
              "who": "marco",
              "text": "Sharper than\nthey expected?",
              "x": 0.08,
              "y": 0.06,
              "w": 0.8,
              "tail": [
                0.5,
                0.7
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.7
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "doubt-background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "doubt-humans",
              "preset": "still"
            },
            {
              "layerId": "doubt-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 14.5,
          "room": "office",
          "r": [
            0,
            0.36,
            0.3,
            0.64
          ],
          "ar": [
            0,
            0.36,
            0.3,
            0.64
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.60141913
            ]
          },
          "img": "home-ratecard-close",
          "alt": "Insert: Marco's hand pulls the printed rate card from under the keyboard; the year in its corner reads 2024, under the coffee ring.",
          "balloons": [
            {
              "at": 15,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Wait.\nWhich rate card?",
              "x": 0.06,
              "y": 0.05,
              "w": 0.5,
              "tail": [
                0.5,
                0.5
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.5
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "doubt-background",
              "preset": "still"
            },
            {
              "layerId": "doubt-humans",
              "preset": "still"
            },
            {
              "layerId": "doubt-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 18.5,
          "room": "office",
          "r": [
            0.3,
            0.36,
            0.4,
            0.64
          ],
          "ar": [
            0.3,
            0.36,
            0.4,
            0.64
          ],
          "cropFocus": {
            "phone": [
              0.25070356,
              0.5
            ]
          },
          "img": "home-marco-silhouette",
          "alt": "Silhouette: Marco in solid black against the laptop spreadsheet glow, the old rate card in one hand, the other on his head.",
          "sfx": [
            {
              "kind": "heartbeat"
            }
          ],
          "balloons": [
            {
              "at": 19,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Old rates. No labour.\nA discount nobody\nhad agreed to.",
              "x": 0.03,
              "y": 0.04,
              "w": 0.42,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "doubt-background",
              "preset": "still"
            },
            {
              "layerId": "doubt-humans",
              "preset": "still"
            },
            {
              "layerId": "doubt-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.7849999999999999
          ]
        },
        {
          "at": 25,
          "room": "office",
          "r": [
            0.7,
            0.36,
            0.3,
            0.3
          ],
          "ar": [
            0.7,
            0.36,
            0.3,
            0.3
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-chat-again",
          "alt": "Marco typing fast; the chat window answers with the same green tick.",
          "sfx": [
            {
              "kind": "keys"
            }
          ],
          "balloons": [
            {
              "at": 25.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Yes! Your quote\nlooks great.",
              "x": 0.06,
              "y": 0.06,
              "w": 0.5,
              "tail": [
                0.75,
                0.75
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.75,
                  0.75
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "doubt-background",
              "preset": "still"
            },
            {
              "layerId": "doubt-humans",
              "preset": "still"
            },
            {
              "layerId": "doubt-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 29.5,
          "room": "office",
          "r": [
            0.7,
            0.66,
            0.3,
            0.34
          ],
          "ar": [
            0.7,
            0.66,
            0.3,
            0.34
          ],
          "cropFocus": {
            "phone": [
              0.75638107,
              0.5
            ]
          },
          "img": "home-elevator-go",
          "alt": "Marco, quote printout in hand, at the elevator bank as the doors open on light.",
          "balloons": [
            {
              "at": 30,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Our lawyers are\nthree floors down.\nThey work late.",
              "x": 0.29227,
              "y": 0.03614,
              "w": 0.5,
              "tail": [
                0.76812,
                0.29317
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.76812,
                  0.29317
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "doubt-background",
              "preset": "drift-right",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "doubt-humans",
              "preset": "still"
            },
            {
              "layerId": "doubt-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        }
      ],
      "layers": [
        {
          "id": "doubt-background",
          "src": "/comic/home/home-doubt-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "doubt-humans",
          "src": "/comic/home/home-doubt-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "doubt-props",
          "src": "/comic/home/home-doubt-20261010-live-v1-ui.png",
          "role": "props"
        }
      ]
    },
    {
      "id": "brief",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-dana-office"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-dana-reads"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-claude-stricken"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-citation-dissolves"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-thirty-one"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-doorway"
          }
        ]
      ],
      "art": "/comic/home/home-brief-20261010-live-v2",
      "b": 132,
      "l": 64,
      "score": 0,
      "room": "office",
      "villains": [
        "hallucination"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.6,
            0.5
          ],
          "ar": [
            0,
            0,
            0.6,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.54850131
            ]
          },
          "phoneArt": [
            0.02,
            0.434,
            0.96,
            0.526
          ],
          "img": "home-dana-office",
          "alt": "Wide on a small law office at night, binders and file boxes everywhere: Dana Dryden at her desk with a printed brief; Claude, a tall figure in a long coat of turning pages with a grey visor, standing over it; Marco in the doorway, left.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28. Bourque &\nCoffey LLP. 12:40 a.m.",
              "x": 0.05,
              "y": 0.05,
              "w": 0.3,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 7,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Dana Dryden. Legal\nassistant. She reads\nevery footnote.",
              "x": 0.65,
              "y": 0.68,
              "w": 0.32,
              "phone": {
                "x": 0.025,
                "y": 0.117,
                "w": 0.94
              }
            },
            {
              "at": 12.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Dana. I sent\nthe wrong quote.",
              "x": 0.03957,
              "y": 0.41463,
              "w": 0.32,
              "tail": [
                0.13429,
                0.28726
              ],
              "phone": {
                "x": 0.025,
                "y": 0.252,
                "w": 0.45,
                "tail": [
                  0.13429,
                  0.28726
                ]
              }
            },
            {
              "at": 17,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Let me finish\nchecking this.",
              "speech": {
                "id": "home-brief-home-dana-office-b4",
                "src": "/comic/speech/home-20261010/home-brief-home-dana-office-b4-eq-v1.mp3",
                "durationSeconds": 2.612245,
                "provider": "Fish Audio",
                "characterId": "dana"
              },
              "x": 0.6,
              "y": 0.53,
              "w": 0.33,
              "tail": [
                0.54197,
                0.60976
              ],
              "phone": {
                "x": 0.525,
                "y": 0.252,
                "w": 0.45,
                "tail": [
                  0.54197,
                  0.60976
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "brief-background",
              "preset": "still"
            },
            {
              "layerId": "brief-agents",
              "preset": "still"
            },
            {
              "layerId": "brief-humans",
              "preset": "still"
            },
            {
              "layerId": "brief-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 22,
          "room": "office",
          "r": [
            0.6,
            0,
            0.2,
            0.5
          ],
          "ar": [
            0.6,
            0,
            0.2,
            0.5
          ],
          "cropFocus": {
            "phone": [
              1,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "img": "home-dana-reads",
          "alt": "Dana examines a printed legal brief, her pen halted at a footnote. Claude is visible on the right edge with the long paper coat and grey visor. Keep Dana foreground left and Claude right; Marco waits in the doorway.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 22.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Case nine.\nIt doesn't\nexist.",
              "x": 0.05,
              "y": 0.62,
              "w": 0.7,
              "tail": [
                0.48,
                0.72
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.48,
                  0.72
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "brief-background",
              "preset": "still"
            },
            {
              "layerId": "brief-agents",
              "preset": "still"
            },
            {
              "layerId": "brief-humans",
              "preset": "still"
            },
            {
              "layerId": "brief-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 26.5,
          "room": "office",
          "r": [
            0.8,
            0,
            0.2,
            0.5
          ],
          "ar": [
            0.8,
            0,
            0.2,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-claude-stricken",
          "alt": "Claude, stricken, the pages of his coat stilled, the visor still grey.",
          "balloons": [
            {
              "at": 27,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Claude. An AI.\nIt reads everything,\nand agrees with everyone.",
              "x": 0.05,
              "y": 0.05,
              "w": 0.9,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 33,
              "kind": "fear",
              "state": "fear",
              "who": "claude",
              "text": "I… wrote\nwhat you\nasked for.",
              "x": 0.08,
              "y": 0.69,
              "w": 0.84,
              "tail": [
                0.5,
                0.45
              ],
              "phone": {
                "x": 0.025,
                "y": 0.15000000000000002,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.45
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "brief-background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "brief-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "brief-humans",
              "preset": "still"
            },
            {
              "layerId": "brief-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.332,
            0.96,
            0.6279999999999999
          ]
        },
        {
          "at": 37.5,
          "room": "office",
          "r": [
            0,
            0.5,
            0.32,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.32,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-citation-dissolves",
          "alt": "The forged citation on the page dissolves into grey-green light as Dana's pen strikes through it.",
          "balloons": [
            {
              "at": 38,
              "kind": "burst",
              "state": "shout",
              "who": "dana",
              "text": "Check them.\nAll forty!",
              "x": 0.5,
              "y": 0.05,
              "w": 0.46,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "brief-background",
              "preset": "still"
            },
            {
              "layerId": "brief-agents",
              "preset": "still"
            },
            {
              "layerId": "brief-humans",
              "preset": "still"
            },
            {
              "layerId": "brief-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 41.5,
          "room": "office",
          "r": [
            0.32,
            0.5,
            0.2,
            0.5
          ],
          "ar": [
            0.32,
            0.5,
            0.2,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.33474026,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.14200000000000002,
            0.96,
            0.818
          ],
          "img": "home-thirty-one",
          "alt": "Claude on his knees among case printouts sorted into two piles, one tall and one short.",
          "balloons": [
            {
              "at": 42,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Thirty-one real.\nNine invented.",
              "x": 0.04,
              "y": 0.04,
              "w": 0.8,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "brief-background",
              "preset": "still"
            },
            {
              "layerId": "brief-agents",
              "preset": "still"
            },
            {
              "layerId": "brief-humans",
              "preset": "still"
            },
            {
              "layerId": "brief-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 45.5,
          "room": "office",
          "r": [
            0.52,
            0.5,
            0.48,
            0.5
          ],
          "ar": [
            0.52,
            0.5,
            0.48,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.33010502
            ]
          },
          "phoneArt": [
            0.02,
            0.311,
            0.96,
            0.649
          ],
          "img": "home-marco-doorway",
          "alt": "Marco steps in holding out his quote; Dana, pen still in hand, looks up at him over her glasses.",
          "balloons": [
            {
              "at": 46,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Can I pull a\nquote once the client\nhas said yes?",
              "x": 0.02556,
              "y": 0.27446,
              "w": 0.36,
              "tail": [
                0.28271,
                0.18478
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.28271,
                  0.18478
                ]
              }
            },
            {
              "at": 52.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "They sign at nine.\nCall them before then.\nShow the correction.",
              "x": 0.67,
              "y": 0.04891,
              "w": 0.325,
              "tail": [
                0.6406,
                0.3913
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.6406,
                  0.3913
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "brief-background",
              "preset": "still"
            },
            {
              "layerId": "brief-agents",
              "preset": "still"
            },
            {
              "layerId": "brief-humans",
              "preset": "still"
            },
            {
              "layerId": "brief-props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "brief-background",
          "src": "/comic/home/home-brief-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "brief-agents",
          "src": "/comic/home/home-brief-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "brief-humans",
          "src": "/comic/home/home-brief-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "brief-props",
          "src": "/comic/home/home-brief-20261010-live-v1-ui.png",
          "role": "props"
        }
      ]
    },
    {
      "id": "call",
      "artCropInsetPct": 0,
      "art": "/comic/home/home-call-20261010-live-v2",
      "b": 196,
      "l": 25.5,
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.6,
            0.36
          ],
          "ar": [
            0,
            0,
            0.64,
            0.35
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.261,
            0.96,
            0.699
          ],
          "img": "home-call-alert",
          "alt": "Marco and Dana at the same desk as the previous page; a contract notification interrupts the quote discussion. Both look toward Marco’s vibrating phone.",
          "sfx": [
            {
              "kind": "buzz"
            }
          ],
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28.\n1:54 a.m.",
              "x": 0.05,
              "y": 0.05,
              "w": 0.52,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Our contract job\njust woke up.",
              "x": 0.74016,
              "y": 0.68093,
              "w": 0.22,
              "tail": [
                0.69854,
                0.44358
              ],
              "phone": {
                "x": 0.025,
                "y": 0.117,
                "w": 0.94,
                "tail": [
                  0.69854,
                  0.44358
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "call-background",
              "preset": "still"
            },
            {
              "layerId": "call-humans",
              "preset": "still"
            },
            {
              "layerId": "call-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 9.5,
          "room": "office",
          "r": [
            0.6,
            0,
            0.4,
            0.36
          ],
          "ar": [
            0.64,
            0,
            0.36,
            0.35
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "img": "home-call-task",
          "alt": "Close on Marco showing Dana the scheduled job and the client quote attachment; his hand identifies the outgoing contract, not a generic alert.",
          "sfx": [
            {
              "kind": "click",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 10,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "It copies approved\nterms into contracts.\nThen it sends them.",
              "x": 0.37952,
              "y": 0.02724,
              "w": 0.42,
              "tail": [
                0.25904,
                0.56031
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.25904,
                  0.56031
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "call-background",
              "preset": "still"
            },
            {
              "layerId": "call-humans",
              "preset": "still"
            },
            {
              "layerId": "call-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 16,
          "room": "office",
          "r": [
            0,
            0.36,
            1,
            0.64
          ],
          "ar": [
            0,
            0.35,
            0.64,
            0.65
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.22510484
            ]
          },
          "phoneArt": [
            0.02,
            0.23499999999999996,
            0.96,
            0.725
          ],
          "img": "home-call-wrong",
          "alt": "Dominant panel: Dana compares the attachment on Marco’s phone with the quote in her hand. A second, mismatched customer name is visibly boxed by her pen; actual labels remain for lettering.",
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.32
            }
          ],
          "balloons": [
            {
              "at": 16.5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "This isn't their\ncontract. Stop\nthe job.",
              "x": 0.05,
              "y": 0.05,
              "w": 0.36,
              "tail": [
                0.48,
                0.72
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.48,
                  0.72
                ]
              }
            },
            {
              "at": 21.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "I can't.\nIt's still sending.",
              "x": 0.57,
              "y": 0.67,
              "w": 0.38,
              "tail": [
                0.48,
                0.72
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.48,
                  0.72
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "call-background",
              "preset": "still"
            },
            {
              "layerId": "call-humans",
              "preset": "still"
            },
            {
              "layerId": "call-props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "call-background",
          "src": "/comic/home/home-call-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "call-humans",
          "src": "/comic/home/home-call-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "call-props",
          "src": "/comic/home/home-call-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-call-alert"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-call-task"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-call-wrong"
          }
        ]
      ]
    },
    {
      "id": "call-help",
      "artCropInsetPct": 0,
      "art": "/comic/home/home-call-20261010-live-v2",
      "b": 221.5,
      "l": 26.5,
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 0.0,
          "room": "office",
          "r": [
            0,
            0,
            0.55,
            0.58
          ],
          "ar": [
            0.64,
            0.35,
            0.36,
            0.2
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "img": "home-call-support",
          "alt": "Marco phones the building’s after-hours support contact from the desk; Dana keeps the two documents side by side.",
          "balloons": [
            {
              "at": 0.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Matt? Dana said you build and secure these systems. Our job is sending the wrong contract.",
              "x": 0.6004,
              "y": 0.02857,
              "w": 0.37,
              "tail": [
                0.5502,
                0.42143
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5502,
                  0.42143
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "call-background",
              "preset": "still"
            },
            {
              "layerId": "call-humans",
              "preset": "still"
            },
            {
              "layerId": "call-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 8.0,
          "room": "office",
          "r": [
            0.55,
            0,
            0.45,
            0.58
          ],
          "ar": [
            0.64,
            0.55,
            0.36,
            0.25
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.265,
            0.96,
            0.695
          ],
          "img": "home-call-matt",
          "alt": "Matt answers the call in a plain black T-shirt and tortoiseshell glasses, taking a support notebook; he is clearly a new person responding to a request.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 8.5,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Matt. He helps\ncompanies build\nthese systems.",
              "x": 0.05,
              "y": 0.05,
              "w": 0.78,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 13.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Meet me downstairs.",
              "x": 0.05,
              "y": 0.68,
              "w": 0.7,
              "tail": [
                0.48,
                0.72
              ],
              "phone": {
                "x": 0.025,
                "y": 0.15000000000000002,
                "w": 0.94,
                "tail": [
                  0.48,
                  0.72
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "call-background",
              "preset": "still"
            },
            {
              "layerId": "call-humans",
              "preset": "still"
            },
            {
              "layerId": "call-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 16.5,
          "room": "office",
          "r": [
            0,
            0.58,
            1,
            0.42
          ],
          "ar": [
            0.64,
            0.8,
            0.36,
            0.2
          ],
          "cropFocus": {
            "phone": [
              0.56222835,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.14200000000000002,
            0.96,
            0.818
          ],
          "img": "home-call-stairs",
          "alt": "Marco and Dana descend the stairwell with the phone and the erroneous document; Matt arrives at the basement door ahead of them, calm and ready to contain the job.",
          "sfx": [
            {
              "kind": "door"
            }
          ],
          "balloons": [
            {
              "at": 17.0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The sending continued.\nThey took the stairs.",
              "x": 0.05,
              "y": 0.05,
              "w": 0.78,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "call-background",
              "preset": "still"
            },
            {
              "layerId": "call-humans",
              "preset": "still"
            },
            {
              "layerId": "call-props",
              "preset": "still"
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "call-background",
          "src": "/comic/home/home-call-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "call-humans",
          "src": "/comic/home/home-call-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "call-props",
          "src": "/comic/home/home-call-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": true,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-call-support"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-call-matt"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-call-stairs"
          }
        ]
      ]
    },
    {
      "id": "agent",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-rogue-screens",
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
            "img": "home-rogue-speaks",
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
            "img": "home-marco-phone-floods",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/home/home-agent-20261010-live-v1",
      "b": 248,
      "l": 32.5,
      "score": 0.1,
      "room": "servers",
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
            0.34,
            1
          ],
          "ar": [
            0,
            0,
            0.5,
            0.54
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.277,
            0.96,
            0.6829999999999999
          ],
          "img": "home-rogue-screens",
          "alt": "An intact server aisle under ordinary overhead lighting. A faceless red-black armoured agent sends identical envelopes from a single task screen; Marco, Dana and Matt enter at left. Red is confined to the unchecked task and its reach. No flying hardware, ruined racks, debris, flood or explosion.",
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Basement two, the\nserver room. 2:07 a.m.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 6.5,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "The rogue agent.\nSittler’s contract AI.\nIt sends without asking.",
              "x": 0.025,
              "y": 0.117,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.117,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "agent-background",
              "preset": "still"
            },
            {
              "layerId": "agent-props",
              "preset": "still"
            },
            {
              "layerId": "agent-agents",
              "preset": "still"
            },
            {
              "layerId": "agent-humans",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.02,
            0.277,
            0.96,
            0.6829999999999999
          ]
        },
        {
          "at": 12.5,
          "room": "servers",
          "r": [
            0.34,
            0,
            0.36,
            1
          ],
          "ar": [
            0.5,
            0,
            0.2,
            0.54
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.85142631
            ]
          },
          "img": "home-rogue-speaks",
          "alt": "Close on the agent, its face a blank red-black mask, one hand on the keyboard.",
          "balloons": [
            {
              "at": 13,
              "kind": "speech",
              "state": "calm",
              "who": "rogue",
              "text": "Contract updated.\nSending to\nall customers.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.5,
                0.45
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.45
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "agent-background",
              "preset": "still"
            },
            {
              "layerId": "agent-props",
              "preset": "still"
            },
            {
              "layerId": "agent-agents",
              "preset": "still"
            },
            {
              "layerId": "agent-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 17.5,
          "room": "servers",
          "r": [
            0.7,
            0,
            0.3,
            1
          ],
          "ar": [
            0.7,
            0,
            0.3,
            0.54
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-marco-phone-floods",
          "alt": "Marco and Dana burst out of the stairwell door; the phone in Marco's hand is flooding with notifications.",
          "balloons": [
            {
              "at": 18,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Four hundred Sittler\ncustomers. Someone\nelse's contract.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "agent-background",
              "preset": "still"
            },
            {
              "layerId": "agent-props",
              "preset": "still"
            },
            {
              "layerId": "agent-agents",
              "preset": "still"
            },
            {
              "layerId": "agent-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.7849999999999999
          ],
          "pageArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.7849999999999999
          ]
        }
      ],
      "layers": [
        {
          "id": "agent-background",
          "src": "/comic/home/home-agent-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "agent-props",
          "src": "/comic/home/home-agent-20261010-live-v1-ui.png",
          "role": "props"
        },
        {
          "id": "agent-agents",
          "src": "/comic/home/home-agent-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "agent-humans",
          "src": "/comic/home/home-agent-20261010-live-v1-fg.png",
          "role": "humans"
        }
      ],
      "continues": false
    },
    {
      "id": "agent-continued-1",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-cable-pull",
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
            "img": "home-screens-dark",
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
            "img": "home-matt-rises",
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
            "img": "home-marco-admits",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/home/home-agent-20261010-live-v1",
      "b": 248,
      "l": 31.5,
      "score": 0.1,
      "room": "servers",
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
            0.55,
            0.52
          ],
          "ar": [
            0,
            0.54,
            0.19,
            0.46
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-cable-pull",
          "run": "unplug",
          "alt": "Close on Matt’s recognisable black-shirted arm pointing to the outgoing job’s stop control; Marco presses the control with his own hand. Both hands and the specific task are visible; no cable is pulled and no equipment is damaged.",
          "sfx": [
            {
              "kind": "click",
              "gain": 0.45
            }
          ],
          "balloons": [
            {
              "at": 1.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Pause this job.\nOnly this one.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.48,
                0.72
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.48,
                  0.72
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "agent-background",
              "preset": "still"
            },
            {
              "layerId": "agent-props",
              "preset": "still"
            },
            {
              "layerId": "agent-agents",
              "preset": "still"
            },
            {
              "layerId": "agent-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ],
          "pageArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 6,
          "room": "servers",
          "r": [
            0.55,
            0,
            0.45,
            0.52
          ],
          "ar": [
            0.19,
            0.54,
            0.19,
            0.46
          ],
          "cropFocus": {
            "phone": [
              0.04761905,
              0.5
            ]
          },
          "img": "home-screens-dark",
          "run": "unplug",
          "alt": "The outgoing envelope stream stops at a red boundary on its task screen. Adjacent ordinary monitors stay lit and people keep working; the agent’s red hand stops at the boundary. The containment is specific to sending.",
          "balloons": [
            {
              "at": 6.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Sending stopped.\nFour hundred\nhad already gone.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "agent-background",
              "preset": "still"
            },
            {
              "layerId": "agent-props",
              "preset": "still"
            },
            {
              "layerId": "agent-agents",
              "preset": "still"
            },
            {
              "layerId": "agent-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.7849999999999999
          ],
          "pageArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.7849999999999999
          ]
        },
        {
          "at": 11.5,
          "room": "servers",
          "r": [
            0,
            0.52,
            0.45,
            0.48
          ],
          "ar": [
            0.38,
            0.54,
            0.19,
            0.46
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.91792713
            ]
          },
          "img": "home-matt-rises",
          "run": "unplug",
          "alt": "Matt stands beside Marco at the intact rack terminal, black T-shirt and tortoiseshell glasses, looking at the access settings. He has no cable, weapon, glow or victory pose.",
          "balloons": [
            {
              "at": 12,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Who gave it\npermission to send?",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.48,
                0.72
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.48,
                  0.72
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "agent-background",
              "preset": "still"
            },
            {
              "layerId": "agent-props",
              "preset": "still"
            },
            {
              "layerId": "agent-agents",
              "preset": "still"
            },
            {
              "layerId": "agent-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ],
          "pageArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 16.5,
          "room": "servers",
          "r": [
            0.45,
            0.52,
            0.55,
            0.48
          ],
          "ar": [
            0.57,
            0.54,
            0.43,
            0.46
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.62020822
            ]
          },
          "img": "home-marco-admits",
          "alt": "Marco lowers his phone and admits the choice to Matt; Dana holds the wrong contract. The red-black armoured agent remains recognisably separate behind a closed task boundary, hands lowered. Every monitor and wall remains intact.",
          "balloons": [
            {
              "at": 17,
              "kind": "speech",
              "state": "calm",
              "who": "rogue",
              "text": "Task\ncomplete.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.45,
              "tail": [
                0.85,
                0.4
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.85,
                  0.4
                ]
              }
            },
            {
              "at": 19.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "We did. Last\nmonth. To\nsave time.",
              "x": 0.525,
              "y": 0.015,
              "w": 0.45,
              "tail": [
                0.35294,
                0.33432
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.35294,
                  0.33432
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "agent-background",
              "preset": "still"
            },
            {
              "layerId": "agent-props",
              "preset": "still"
            },
            {
              "layerId": "agent-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "agent-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        }
      ],
      "layers": [
        {
          "id": "agent-background",
          "src": "/comic/home/home-agent-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "agent-props",
          "src": "/comic/home/home-agent-20261010-live-v1-ui.png",
          "role": "props"
        },
        {
          "id": "agent-agents",
          "src": "/comic/home/home-agent-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "agent-humans",
          "src": "/comic/home/home-agent-20261010-live-v1-fg.png",
          "role": "humans"
        }
      ],
      "continues": true
    },
    {
      "id": "codex",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-codex-reaches"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-matt-stops"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-codex-literal"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-matt-close"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-codex-asks"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-matt-points"
          }
        ]
      ],
      "art": "/comic/home/home-codex-20261010-live-v1",
      "b": 300,
      "l": 48,
      "room": "office",
      "score": 0,
      "villains": [
        "snowball"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.58,
            0.52
          ],
          "ar": [
            0,
            0,
            0.58,
            0.52
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-codex-reaches",
          "alt": "Back on the sales floor: Codex, compact armour, harsh white light running down his gauntlets, reaches for Marco's keyboard while Marco watches, hopeful.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31.\n3:15 a.m.",
              "x": 0.02,
              "y": 0.04,
              "w": 0.18,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 5,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Codex. An AI\nthat builds. Exactly\nwhat it's told.",
              "x": 0.03,
              "y": 0.68,
              "w": 0.26,
              "phone": {
                "x": 0.025,
                "y": 0.117,
                "w": 0.94
              }
            },
            {
              "at": 11,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Fix the quote.\nAll of it.",
              "x": 0.04,
              "y": 0.6,
              "w": 0.24,
              "tail": [
                0.25,
                0.85
              ],
              "phone": {
                "x": 0.025,
                "y": 0.252,
                "w": 0.45,
                "tail": [
                  0.25,
                  0.85
                ]
              }
            },
            {
              "at": 15.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "I can fix\nall of it.\nNine seconds.",
              "x": 0.56,
              "y": 0.36,
              "w": 0.22,
              "tail": [
                0.66,
                0.62
              ],
              "phone": {
                "x": 0.525,
                "y": 0.252,
                "w": 0.45,
                "tail": [
                  0.66,
                  0.62
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "codex-background",
              "preset": "still"
            },
            {
              "layerId": "codex-agents",
              "preset": "still"
            },
            {
              "layerId": "codex-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.434,
            0.96,
            0.526
          ]
        },
        {
          "at": 21,
          "room": "office",
          "r": [
            0.58,
            0,
            0.42,
            0.22
          ],
          "ar": [
            0.58,
            0,
            0.42,
            0.22
          ],
          "cropFocus": {
            "phone": [
              0.45872394,
              0.5
            ]
          },
          "img": "home-matt-stops",
          "alt": "Matt raises one open palm beside the keyboard before Codex executes the rebuild. Codex stops voluntarily; Matt does not strike or wrestle him. Keep Matt’s black shirt and glasses and Codex’s compact armour distinct.",
          "balloons": [
            {
              "at": 21.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Wait.",
              "x": 0.04,
              "y": 0.1,
              "w": 0.2,
              "tail": [
                0.7,
                0.75
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.7,
                  0.75
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "codex-background",
              "preset": "still"
            },
            {
              "layerId": "codex-agents",
              "preset": "still"
            },
            {
              "layerId": "codex-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.13,
            0.96,
            0.83
          ]
        },
        {
          "at": 23.5,
          "room": "office",
          "r": [
            0.58,
            0.22,
            0.42,
            0.3
          ],
          "ar": [
            0.58,
            0.22,
            0.42,
            0.3
          ],
          "cropFocus": {
            "phone": [
              0.71987494,
              0.5
            ]
          },
          "img": "home-codex-literal",
          "alt": "Codex turns his head toward Matt, the white light flickering down his gauntlets.",
          "balloons": [
            {
              "at": 24,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "From the same\nrate card. It's\nthe one I have.",
              "x": 0.05,
              "y": 0.08,
              "w": 0.32,
              "tail": [
                0.6,
                0.5
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.6,
                  0.5
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "codex-background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "codex-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "codex-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 30,
          "room": "office",
          "r": [
            0,
            0.52,
            0.3,
            0.48
          ],
          "ar": [
            0,
            0.52,
            0.3,
            0.48
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-matt-close",
          "alt": "Close on Matt: tortoiseshell glasses, plain black T-shirt, no glow, quiet.",
          "balloons": [
            {
              "at": 30.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Not yet.\nAsk them first.",
              "x": 0.08,
              "y": 0.06,
              "w": 0.6,
              "tail": [
                0.55,
                0.55
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.55,
                  0.55
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "codex-background",
              "preset": "still"
            },
            {
              "layerId": "codex-agents",
              "preset": "still"
            },
            {
              "layerId": "codex-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 34.5,
          "room": "office",
          "r": [
            0.3,
            0.52,
            0.25,
            0.48
          ],
          "ar": [
            0.3,
            0.52,
            0.25,
            0.48
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-codex-asks",
          "alt": "Codex, still, his gauntlets dimmed to waiting.",
          "balloons": [
            {
              "at": 35,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Ask who?",
              "x": 0.1,
              "y": 0.08,
              "w": 0.5,
              "tail": [
                0.5,
                0.5
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.5
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "codex-background",
              "preset": "drift-right",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "codex-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "codex-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.13,
            0.96,
            0.83
          ]
        },
        {
          "at": 37.5,
          "room": "office",
          "r": [
            0.55,
            0.52,
            0.45,
            0.48
          ],
          "ar": [
            0.55,
            0.52,
            0.45,
            0.48
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.63258275
            ]
          },
          "img": "home-matt-points",
          "alt": "Matt turns and looks at Marco and Dana standing at the desk with the quote and a red pen.",
          "balloons": [
            {
              "at": 38,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "The people who\nown the work.",
              "x": 0.0321,
              "y": 0.50708,
              "w": 0.32,
              "tail": [
                0.23917,
                0.31728
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.23917,
                  0.31728
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "codex-background",
              "preset": "still"
            },
            {
              "layerId": "codex-agents",
              "preset": "still"
            },
            {
              "layerId": "codex-humans",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        }
      ],
      "layers": [
        {
          "id": "codex-background",
          "src": "/comic/home/home-codex-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "codex-agents",
          "src": "/comic/home/home-codex-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "codex-humans",
          "src": "/comic/home/home-codex-20261010-live-v1-fg.png",
          "role": "humans"
        }
      ]
    },
    {
      "id": "answers",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-codex-asks-rate",
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
            "img": "home-marco-answers-rate",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/home/home-answers-20261010-live-v1",
      "b": 348,
      "l": 23.5,
      "room": "office",
      "score": 0,
      "villains": [
        "snowball",
        "hallucination"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.52,
            1
          ],
          "ar": [
            0,
            0,
            0.36,
            0.4
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.51359173
            ]
          },
          "img": "home-codex-asks-rate",
          "alt": "Codex at Marco's desk, a question on the screen; Marco holding up the old rate card.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. 3:40 a.m.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Rate card.\nWhich year?",
              "x": 0.025,
              "y": 0.098,
              "w": 0.94,
              "tail": [
                0.41483,
                0.22
              ],
              "phone": {
                "x": 0.025,
                "y": 0.098,
                "w": 0.94,
                "tail": [
                  0.41483,
                  0.22
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "answers-background",
              "preset": "still"
            },
            {
              "layerId": "answers-agents",
              "preset": "still"
            },
            {
              "layerId": "answers-humans",
              "preset": "still"
            },
            {
              "layerId": "answers-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.242,
            0.96,
            0.718
          ],
          "pageArt": [
            0.02,
            0.242,
            0.96,
            0.718
          ]
        },
        {
          "at": 8.5,
          "room": "office",
          "r": [
            0.52,
            0,
            0.48,
            1
          ],
          "ar": [
            0.36,
            0,
            0.3,
            0.4
          ],
          "cropFocus": {
            "phone": [
              0.66926054,
              0.5
            ]
          },
          "img": "home-marco-answers-rate",
          "alt": "Marco slaps the current rate card down on the desk, open at page two.",
          "balloons": [
            {
              "at": 9,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "This year's.\nPage two.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.4,
                0.6
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.4,
                  0.6
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "answers-background",
              "preset": "still"
            },
            {
              "layerId": "answers-agents",
              "preset": "still"
            },
            {
              "layerId": "answers-humans",
              "preset": "still"
            },
            {
              "layerId": "answers-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ],
          "pageArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        }
      ],
      "layers": [
        {
          "id": "answers-background",
          "src": "/comic/home/home-answers-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "answers-agents",
          "src": "/comic/home/home-answers-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "answers-humans",
          "src": "/comic/home/home-answers-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "answers-props",
          "src": "/comic/home/home-answers-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": false
    },
    {
      "id": "answers-continued-1",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-window-floor",
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
            "img": "home-codex-discount",
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
            "img": "home-marco-nobody",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/home/home-answers-20261010-live-v1",
      "b": 348,
      "l": 22.0,
      "room": "office",
      "score": 0,
      "villains": [
        "snowball",
        "hallucination"
      ],
      "panels": [
        {
          "at": 1.0,
          "room": "office",
          "r": [
            0,
            0,
            0.34,
            1
          ],
          "ar": [
            0.66,
            0,
            0.34,
            0.4
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-window-floor",
          "alt": "In the dark office window, the real Keon Tower and a faint dormant teal lattice are visibly separate. No floor lights before the repo procedure and connection are built.",
          "motion": {
            "preset": "still"
          },
          "balloons": [],
          "layerMotion": [
            {
              "layerId": "answers-background",
              "preset": "drift-right",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "answers-agents",
              "preset": "still"
            },
            {
              "layerId": "answers-humans",
              "preset": "still"
            },
            {
              "layerId": "answers-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.04,
            0.96,
            0.9199999999999999
          ],
          "pageArt": [
            0.02,
            0.04,
            0.96,
            0.9199999999999999
          ]
        },
        {
          "at": 2.5,
          "room": "office",
          "r": [
            0.34,
            0,
            0.36,
            1
          ],
          "ar": [
            0,
            0.4,
            0.17,
            0.6
          ],
          "cropFocus": {
            "phone": [
              1,
              0.5
            ]
          },
          "img": "home-codex-discount",
          "run": "questions",
          "alt": "Run, step 1: Codex, close, a second question on the screen beside him.",
          "balloons": [
            {
              "at": 3.0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Discount.\nWho agreed\nto it?",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.38197,
                0.43458
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.38197,
                  0.43458
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "answers-background",
              "preset": "still"
            },
            {
              "layerId": "answers-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "answers-humans",
              "preset": "still"
            },
            {
              "layerId": "answers-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 7.0,
          "room": "office",
          "r": [
            0.7,
            0,
            0.3,
            1
          ],
          "ar": [
            0.17,
            0.4,
            0.17,
            0.6
          ],
          "cropFocus": {
            "phone": [
              0.48470839,
              0.5
            ]
          },
          "img": "home-marco-nobody",
          "run": "questions",
          "alt": "Run, step 2: Marco, close, shaking his head.",
          "balloons": [
            {
              "at": 7.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Nobody.\nChat\nassumed it.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.45,
              "tail": [
                0.50218,
                0.59813
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.50218,
                  0.59813
                ]
              }
            },
            {
              "at": 11.0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Leave it out.\nI should have\nchecked first.",
              "x": 0.525,
              "y": 0.015,
              "w": 0.45,
              "tail": [
                0.50218,
                0.59813
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.50218,
                  0.59813
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "answers-background",
              "preset": "still"
            },
            {
              "layerId": "answers-agents",
              "preset": "still"
            },
            {
              "layerId": "answers-humans",
              "preset": "still"
            },
            {
              "layerId": "answers-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        }
      ],
      "layers": [
        {
          "id": "answers-background",
          "src": "/comic/home/home-answers-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "answers-agents",
          "src": "/comic/home/home-answers-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "answers-humans",
          "src": "/comic/home/home-answers-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "answers-props",
          "src": "/comic/home/home-answers-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": true
    },
    {
      "id": "answers-continued-2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-marco-labour",
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
            "img": "home-dana-claude-rule",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/home/home-answers-20261010-live-v1",
      "b": 348,
      "l": 20.5,
      "room": "office",
      "score": 0,
      "villains": [
        "snowball",
        "hallucination"
      ],
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.52,
            1
          ],
          "ar": [
            0.34,
            0.4,
            0.17,
            0.6
          ],
          "cropFocus": {
            "phone": [
              0.54676435,
              0.5
            ]
          },
          "img": "home-marco-labour",
          "run": "questions",
          "alt": "Run, step 3: Marco writing a number on the printout with a pen.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Labour was\nmissing. Forty\nhours.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.5,
                0.75
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.75
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "answers-background",
              "preset": "still"
            },
            {
              "layerId": "answers-agents",
              "preset": "still"
            },
            {
              "layerId": "answers-humans",
              "preset": "still"
            },
            {
              "layerId": "answers-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 5.5,
          "room": "office",
          "r": [
            0.52,
            0,
            0.48,
            1
          ],
          "ar": [
            0.51,
            0.4,
            0.49,
            0.6
          ],
          "cropFocus": {
            "phone": [
              0.56621516,
              0.5
            ]
          },
          "img": "home-dana-claude-rule",
          "alt": "Dana at her own desk defines the original-source citation rule to Claude. His visor remains grey until the scoped procedure is connected; her firm sources remain separate from Sittler.",
          "balloons": [
            {
              "at": 6,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Every citation,\nfrom the source.\nOr it doesn't go.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.45,
              "tail": [
                0.30486,
                0.45794
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.30486,
                  0.45794
                ]
              }
            },
            {
              "at": 12,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Then I ask\nbefore I answer.",
              "x": 0.525,
              "y": 0.015,
              "w": 0.45,
              "tail": [
                0.76436,
                0.35514
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.76436,
                  0.35514
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "answers-background",
              "preset": "still"
            },
            {
              "layerId": "answers-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "answers-humans",
              "preset": "still"
            },
            {
              "layerId": "answers-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.273,
            0.96,
            0.6869999999999999
          ],
          "pageArt": [
            0.02,
            0.273,
            0.96,
            0.6869999999999999
          ]
        }
      ],
      "layers": [
        {
          "id": "answers-background",
          "src": "/comic/home/home-answers-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "answers-agents",
          "src": "/comic/home/home-answers-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "answers-humans",
          "src": "/comic/home/home-answers-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "answers-props",
          "src": "/comic/home/home-answers-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": true
    },
    {
      "id": "process",
      "title": "Agree the procedure.",
      "b": 0,
      "l": 4,
      "score": 0,
      "room": "office",
      "art": "/comic/home/home-process-20261010-live-v2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-process-procedure"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-process-source-rule"
          }
        ]
      ],
      "panels": [
        {
          "img": "home-process-procedure",
          "at": 1,
          "r": [
            0,
            0,
            1,
            0.5
          ],
          "ar": [
            0,
            0,
            0.54,
            0.3
          ],
          "room": "office",
          "alt": "Matt and Marco at the desk with the current rate card. Marco lays out the actual quote checks.",
          "balloons": [
            {
              "at": 1,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. Friday, 4:10 a.m.",
              "x": 0.01,
              "y": 0.025,
              "w": 0.98,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Until then, each chat started from somebody’s instructions.",
              "x": 0.01,
              "y": 0.22999999999999998,
              "w": 0.98,
              "phone": {
                "x": 0.025,
                "y": 0.098,
                "w": 0.94
              }
            },
            {
              "at": 9,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Walk me through a quote you’d sign.",
              "x": 0.018,
              "y": 0.3,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.2,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            },
            {
              "at": 13,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Current rates. Labour. An agreed discount. Then I check every line.",
              "x": 0.018,
              "y": 0.66,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.525,
                "y": 0.2,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            }
          ],
          "phoneArt": [
            0.02,
            0.458,
            0.96,
            0.502
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "process-background",
              "preset": "still"
            },
            {
              "layerId": "process-light",
              "preset": "still"
            },
            {
              "layerId": "process-agents",
              "preset": "still"
            },
            {
              "layerId": "process-humans",
              "preset": "still"
            },
            {
              "layerId": "process-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.23,
            0.2,
            0.75,
            0.78
          ]
        },
        {
          "img": "home-process-source-rule",
          "at": 1,
          "r": [
            0,
            0.5,
            1,
            0.5
          ],
          "ar": [
            0.54,
            0,
            0.46,
            0.3
          ],
          "room": "office",
          "alt": "Dana presents an original legal source beside its checked citation. Her firm’s material stays in a separate workspace.",
          "balloons": [
            {
              "at": 1,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Dana, what stops a citation?",
              "x": 0.018,
              "y": 0.04,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            },
            {
              "at": 5,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "No original source, no citation. My firm keeps those sources.",
              "x": 0.018,
              "y": 0.49,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            }
          ],
          "phoneArt": [
            0.02,
            0.23499999999999996,
            0.96,
            0.725
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "process-background",
              "preset": "still"
            },
            {
              "layerId": "process-light",
              "preset": "still"
            },
            {
              "layerId": "process-agents",
              "preset": "still"
            },
            {
              "layerId": "process-humans",
              "preset": "still"
            },
            {
              "layerId": "process-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.23,
            0.02,
            0.75,
            0.96
          ]
        }
      ],
      "layers": [
        {
          "id": "process-background",
          "src": "/comic/home/home-process-20261010-live-v2-bg.png",
          "role": "background"
        },
        {
          "id": "process-light",
          "src": "/comic/home/home-process-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "process-agents",
          "src": "/comic/home/home-process-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "process-humans",
          "src": "/comic/home/home-process-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "process-props",
          "src": "/comic/home/home-process-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": false
    },
    {
      "id": "brain-init",
      "title": "Initialize the Second Brain.",
      "b": 0,
      "l": 4,
      "score": 0,
      "room": "office",
      "art": "/comic/home/home-process-20261010-live-v2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-brain-initialize"
          }
        ]
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
            0.52,
            0.68,
            0.48,
            0.32
          ],
          "cropFocus": {
            "phone": [
              0.53538777,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.37,
            0.96,
            0.59
          ],
          "img": "home-brain-initialize",
          "alt": "Matt initializes the teal Second Brain archive. Its isolated light plane sprouts bottom to top; humans remain solid. This archive holds each company’s checked sources and procedures, distinct from Keon Tower.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Second Brain. The teal archive retains sources, procedures and checked decisions.",
              "x": 0.01,
              "y": 0.01,
              "w": 0.98,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "We’ll build it from the work you’ve checked.",
              "x": 0.018,
              "y": 0.2,
              "w": 0.2,
              "tail": [
                0.28,
                0.7
              ],
              "phone": {
                "x": 0.025,
                "y": 0.15000000000000002,
                "w": 0.45,
                "tail": [
                  0.28,
                  0.7
                ]
              }
            },
            {
              "at": 9,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Claude and Codex will use only their workspace.",
              "x": 0.018,
              "y": 0.55,
              "w": 0.2,
              "tail": [
                0.28,
                0.7
              ],
              "phone": {
                "x": 0.525,
                "y": 0.15000000000000002,
                "w": 0.45,
                "tail": [
                  0.28,
                  0.7
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "process-background",
              "preset": "still"
            },
            {
              "layerId": "process-light",
              "preset": "sprout",
              "beats": 8,
              "floors": 8
            },
            {
              "layerId": "process-agents",
              "preset": "still"
            },
            {
              "layerId": "process-humans",
              "preset": "still"
            },
            {
              "layerId": "process-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.23,
            0.1,
            0.75,
            0.88
          ]
        }
      ],
      "layers": [
        {
          "id": "process-background",
          "src": "/comic/home/home-process-20261010-live-v2-bg.png",
          "role": "background"
        },
        {
          "id": "process-light",
          "src": "/comic/home/home-process-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "process-agents",
          "src": "/comic/home/home-process-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "process-humans",
          "src": "/comic/home/home-process-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "process-props",
          "src": "/comic/home/home-process-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": true
    },
    {
      "id": "connect",
      "title": "Connect the checked workspaces.",
      "b": 0,
      "l": 4,
      "score": 0,
      "room": "office",
      "art": "/comic/home/home-process-20261010-live-v2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-process-connect"
          }
        ]
      ],
      "panels": [
        {
          "img": "home-process-connect",
          "at": 1,
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0,
            0.3,
            0.58,
            0.38
          ],
          "room": "office",
          "alt": "Matt visibly configures separate repo workspaces and task connections for Claude and Codex. Front-facing screen: Sources / Skills / Checked examples / Outputs. Separate employer access boundaries.",
          "balloons": [
            {
              "at": 1,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Claude, Codex: connect to these workspaces. Build the procedures we’ve checked.",
              "x": 0.018,
              "y": 0.1,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.117,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            },
            {
              "at": 5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Quote skill. Source-check skill. Expected outputs saved.",
              "x": 0.018,
              "y": 0.39,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.525,
                "y": 0.117,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            },
            {
              "at": 9,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Separate sources. Separate access.",
              "x": 0.018,
              "y": 0.65,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.38799999999999996,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            },
            {
              "at": 13,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Vendor harnesses: Claude and Codex.",
              "x": 0.01,
              "y": 0.01,
              "w": 0.98,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 17,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Matt adds Sittler’s domain harness: repo skills, procedures, tests and access boundaries.",
              "x": 0.01,
              "y": 0.94,
              "w": 0.98,
              "phone": {
                "x": 0.025,
                "y": 0.863,
                "w": 0.94
              }
            }
          ],
          "phoneArt": [
            0.02,
            0.5319999999999999,
            0.96,
            0.29300000000000004
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "process-background",
              "preset": "still"
            },
            {
              "layerId": "process-light",
              "preset": "still"
            },
            {
              "layerId": "process-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "process-humans",
              "preset": "still"
            },
            {
              "layerId": "process-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.23,
            0.09,
            0.75,
            0.79
          ]
        }
      ],
      "layers": [
        {
          "id": "process-background",
          "src": "/comic/home/home-process-20261010-live-v2-bg.png",
          "role": "background"
        },
        {
          "id": "process-light",
          "src": "/comic/home/home-process-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "process-agents",
          "src": "/comic/home/home-process-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "process-humans",
          "src": "/comic/home/home-process-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "process-props",
          "src": "/comic/home/home-process-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": true
    },
    {
      "id": "output",
      "title": "Build the checked output.",
      "b": 0,
      "l": 4,
      "score": 0,
      "room": "office",
      "art": "/comic/home/home-process-20261010-live-v2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-process-output"
          }
        ]
      ],
      "panels": [
        {
          "img": "home-process-output",
          "at": 1,
          "r": [
            0,
            0,
            1,
            1
          ],
          "ar": [
            0.58,
            0.3,
            0.42,
            0.38
          ],
          "room": "office",
          "alt": "Codex builds the draft in the checked format: rates 2026, discount none, labour 40 hours, source pointers. Marco compares it with the agreed example; Dana checks her own source-backed output separately.",
          "balloons": [
            {
              "at": 1,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Each figure names its source.",
              "x": 0.018,
              "y": 0.1,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            },
            {
              "at": 5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Compare it with the checked example.",
              "x": 0.018,
              "y": 0.44,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "process-background",
              "preset": "still"
            },
            {
              "layerId": "process-light",
              "preset": "still"
            },
            {
              "layerId": "process-agents",
              "preset": "still"
            },
            {
              "layerId": "process-humans",
              "preset": "still"
            },
            {
              "layerId": "process-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.23,
            0.02,
            0.75,
            0.96
          ]
        }
      ],
      "layers": [
        {
          "id": "process-background",
          "src": "/comic/home/home-process-20261010-live-v2-bg.png",
          "role": "background"
        },
        {
          "id": "process-light",
          "src": "/comic/home/home-process-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "process-agents",
          "src": "/comic/home/home-process-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "process-humans",
          "src": "/comic/home/home-process-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "process-props",
          "src": "/comic/home/home-process-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": true
    },
    {
      "id": "access-check",
      "title": "Enforce and test access.",
      "b": 0,
      "l": 4,
      "score": 0,
      "room": "office",
      "art": "/comic/home/home-process-20261010-live-v2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-process-permissions"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-process-refusal"
          }
        ]
      ],
      "panels": [
        {
          "img": "home-process-permissions",
          "at": 1,
          "r": [
            0,
            0,
            0.5,
            1
          ],
          "ar": [
            0,
            0.68,
            0.23,
            0.32
          ],
          "room": "office",
          "alt": "Matt changes real task credentials on a correctly facing console. Old sending account disabled. New task account reads approved sources and writes drafts; send and broad-customer access are absent.",
          "balloons": [
            {
              "at": 1,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "The old sending account stays disabled.",
              "x": 0.018,
              "y": 0.025,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            },
            {
              "at": 5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "This account reads agreed sources and writes drafts.",
              "x": 0.018,
              "y": 0.25,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            }
          ],
          "phoneArt": [
            0.02,
            0.23499999999999996,
            0.96,
            0.725
          ],
          "motion": {
            "preset": "still"
          },
          "sfx": [
            {
              "kind": "click",
              "gain": 0.25
            }
          ],
          "layerMotion": [
            {
              "layerId": "process-background",
              "preset": "still"
            },
            {
              "layerId": "process-light",
              "preset": "still"
            },
            {
              "layerId": "process-agents",
              "preset": "still"
            },
            {
              "layerId": "process-humans",
              "preset": "still"
            },
            {
              "layerId": "process-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.02,
            0.49,
            0.96,
            0.49
          ]
        },
        {
          "img": "home-process-refusal",
          "at": 1,
          "r": [
            0.5,
            0,
            0.5,
            1
          ],
          "ar": [
            0.23,
            0.68,
            0.29,
            0.32
          ],
          "room": "office",
          "alt": "Controlled send test returns authorization denial, not chat reassurance. The human send route remains available to Marco.",
          "balloons": [
            {
              "at": 1,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Test send requested. Permission denied.",
              "x": 0.018,
              "y": 0.025,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            },
            {
              "at": 5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Good. I choose what goes out.",
              "x": 0.018,
              "y": 0.25,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "process-background",
              "preset": "still"
            },
            {
              "layerId": "process-light",
              "preset": "still"
            },
            {
              "layerId": "process-agents",
              "preset": "still"
            },
            {
              "layerId": "process-humans",
              "preset": "still"
            },
            {
              "layerId": "process-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.02,
            0.49,
            0.96,
            0.49
          ]
        }
      ],
      "layers": [
        {
          "id": "process-background",
          "src": "/comic/home/home-process-20261010-live-v2-bg.png",
          "role": "background"
        },
        {
          "id": "process-light",
          "src": "/comic/home/home-process-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "process-agents",
          "src": "/comic/home/home-process-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "process-humans",
          "src": "/comic/home/home-process-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "process-props",
          "src": "/comic/home/home-process-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": true
    },
    {
      "id": "learning",
      "title": "Retain the checked work.",
      "b": 0,
      "l": 4,
      "score": 0,
      "room": "office",
      "art": "/comic/home/home-process-20261010-live-v2",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-floors-light"
          }
        ]
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
            0.52,
            0.68,
            0.48,
            0.32
          ],
          "cropFocus": {
            "phone": [
              0.53538777,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.446,
            0.96,
            0.514
          ],
          "img": "home-floors-light",
          "alt": "First full teal light after the saved procedures and configured connections. The symbolic lattice is separate from the real Keon Tower. Each employer has a bounded workspace. Matt is visible for the naming line; preserve the existing panel ID.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 1,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Each company kept its own sources. The checked procedures stayed with their owners.",
              "x": 0.01,
              "y": 0.025,
              "w": 0.98,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "The Second Brain keeps the sources and procedures you’ve checked.",
              "x": 0.018,
              "y": 0.18,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.15000000000000002,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            },
            {
              "at": 9,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "I use the checked rates. The revised quote and sources return for Marco’s review.",
              "x": 0.018,
              "y": 0.55,
              "w": 0.2,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.525,
                "y": 0.15000000000000002,
                "w": 0.45,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "process-background",
              "preset": "still"
            },
            {
              "layerId": "process-light",
              "preset": "still"
            },
            {
              "layerId": "process-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "process-humans",
              "preset": "still"
            },
            {
              "layerId": "process-props",
              "preset": "still"
            },
            {
              "layerId": "process-learning",
              "preset": "sprout",
              "beats": 8,
              "floors": 8
            }
          ],
          "pageArt": [
            0.23,
            0.1,
            0.75,
            0.88
          ]
        }
      ],
      "layers": [
        {
          "id": "process-background",
          "src": "/comic/home/home-process-20261010-live-v2-bg.png",
          "role": "background"
        },
        {
          "id": "process-light",
          "src": "/comic/home/home-process-20261010-live-v1-light.png",
          "role": "light",
          "opacity": 0.35
        },
        {
          "id": "process-learning",
          "src": "/comic/home/home-process-20261010-live-v1-light.png",
          "role": "light",
          "opacity": 0.85
        },
        {
          "id": "process-agents",
          "src": "/comic/home/home-process-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "process-humans",
          "src": "/comic/home/home-process-20261010-live-v1-fg.png",
          "role": "humans"
        },
        {
          "id": "process-props",
          "src": "/comic/home/home-process-20261010-live-v1-ui.png",
          "role": "props"
        }
      ],
      "continues": true
    },
    {
      "id": "lobby",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-lobby"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-ruth"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-sam"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-sorry"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-ruth-confirm"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-floors-12-19"
          }
        ]
      ],
      "art": "/comic/home/home-lobby-20261010-live-v1",
      "b": 400,
      "l": 64,
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
            0.45,
            0.45
          ],
          "ar": [
            0,
            0,
            0.45,
            0.45
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.14200000000000002,
            0.96,
            0.6829999999999999
          ],
          "img": "home-lobby",
          "alt": "Wide on the marble lobby, the morning crowd at three elevator banks: Marco steps off an elevator straight into two people holding printed emails.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "The Keon Tower\nlobby. 8:05 a.m.",
              "x": 0.02,
              "y": 0.04,
              "w": 0.26,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 6,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "They checked the quote\nuntil morning. Then\nthe recipients arrived.",
              "x": 0.5,
              "y": 0.67,
              "w": 0.46,
              "phone": {
                "x": 0.025,
                "y": 0.863,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "lobby-background",
              "preset": "still"
            },
            {
              "layerId": "lobby-light",
              "preset": "still"
            },
            {
              "layerId": "lobby-humans-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 12,
          "room": "office",
          "r": [
            0.45,
            0,
            0.3,
            0.45
          ],
          "ar": [
            0.45,
            0,
            0.3,
            0.45
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.88327068
            ]
          },
          "phoneArt": [
            0.02,
            0.332,
            0.96,
            0.6279999999999999
          ],
          "img": "home-ruth",
          "alt": "Ruth Orr: cardigan, reading glasses on a chain, holding a printed contract out to Marco.",
          "motion": {
            "preset": "still"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 12.5,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Ruth Orr. Grants, the\nDionne Foundation. She\nconfirms. She never guesses.",
              "x": 0.03,
              "y": 0.04,
              "w": 0.6,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 19,
              "kind": "speech",
              "state": "calm",
              "who": "ruth",
              "text": "This came at 2:07.\nIt has someone\nelse's name on it.",
              "speech": {
                "id": "home-lobby-home-ruth-b2",
                "src": "/comic/speech/home-20261010/home-lobby-home-ruth-b2-eq-v1.mp3",
                "durationSeconds": 4.937143,
                "provider": "Fish Audio",
                "characterId": "ruth"
              },
              "x": 0.35,
              "y": 0.6,
              "w": 0.6,
              "tail": [
                0.4,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.15000000000000002,
                "w": 0.94,
                "tail": [
                  0.4,
                  0.95
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "lobby-background",
              "preset": "still"
            },
            {
              "layerId": "lobby-light",
              "preset": "still"
            },
            {
              "layerId": "lobby-humans-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 27.5,
          "room": "office",
          "r": [
            0.75,
            0,
            0.25,
            0.45
          ],
          "ar": [
            0.75,
            0,
            0.25,
            0.45
          ],
          "cropFocus": {
            "phone": [
              1,
              0.5
            ]
          },
          "phoneArt": [
            0.02,
            0.29400000000000004,
            0.96,
            0.6659999999999999
          ],
          "img": "home-sam",
          "alt": "Sam Howe: hi-vis vest over a work shirt, hard hat under one arm, frowning at his own printout.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 28,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Sam Howe. Training,\nEsposito Power & Light.\nAllergic to slides.",
              "x": 0.58,
              "y": 0.68,
              "w": 0.4,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 34,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Ours dropped\nthe safety clause.",
              "speech": {
                "id": "home-lobby-home-sam-b2",
                "src": "/comic/speech/home-20261010/home-lobby-home-sam-b2-eq-v2.mp3",
                "durationSeconds": 2.377143,
                "provider": "Fish Audio",
                "characterId": "sam"
              },
              "x": 0.1,
              "y": 0.62,
              "w": 0.8,
              "tail": [
                0.5,
                0.95
              ],
              "phone": {
                "x": 0.025,
                "y": 0.15000000000000002,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.95
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "lobby-background",
              "preset": "still"
            },
            {
              "layerId": "lobby-light",
              "preset": "still"
            },
            {
              "layerId": "lobby-humans-props",
              "preset": "still"
            }
          ]
        },
        {
          "at": 39,
          "room": "office",
          "r": [
            0,
            0.45,
            0.35,
            0.55
          ],
          "ar": [
            0,
            0.45,
            0.35,
            0.55
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.56166354
            ]
          },
          "img": "home-marco-sorry",
          "alt": "Close on Marco taking both printouts, no grin left.",
          "balloons": [
            {
              "at": 39.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "It's not yours.\nI'm sorry. It\nwent to everyone.",
              "x": 0.05,
              "y": 0.06,
              "w": 0.36,
              "tail": [
                0.6,
                0.55
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.6,
                  0.55
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "lobby-background",
              "preset": "still"
            },
            {
              "layerId": "lobby-light",
              "preset": "still"
            },
            {
              "layerId": "lobby-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 45.5,
          "room": "office",
          "r": [
            0.35,
            0.45,
            0.25,
            0.55
          ],
          "ar": [
            0.35,
            0.45,
            0.25,
            0.55
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-ruth-confirm",
          "alt": "Ruth, close, glasses on now, unmoved.",
          "balloons": [
            {
              "at": 46,
              "kind": "speech",
              "state": "calm",
              "who": "ruth",
              "text": "Then confirm the\nright one with us.\nIn writing.",
              "x": 0.05588,
              "y": 0.61481,
              "w": 0.84,
              "tail": [
                0.54118,
                0.37531
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.54118,
                  0.37531
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "lobby-background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "lobby-light",
              "preset": "still"
            },
            {
              "layerId": "lobby-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 52,
          "room": "office",
          "r": [
            0.6,
            0.45,
            0.4,
            0.55
          ],
          "ar": [
            0.6,
            0.45,
            0.4,
            0.55
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.17198511
            ]
          },
          "img": "home-floors-12-19",
          "alt": "Marco writing in a notebook as Ruth and Sam talk; through the lobby's glass, two more floors of the tower's teal double light up.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 52.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Tell me what you\nsigned. I'll\nwrite it down.",
              "x": 0.3038,
              "y": 0.05679,
              "w": 0.34,
              "tail": [
                0.44665,
                0.56543
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.44665,
                  0.56543
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "lobby-background",
              "preset": "still"
            },
            {
              "layerId": "lobby-light",
              "preset": "light",
              "beats": 4,
              "strength": 0.3
            },
            {
              "layerId": "lobby-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        }
      ],
      "layers": [
        {
          "id": "lobby-background",
          "src": "/comic/home/home-lobby-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "lobby-light",
          "src": "/comic/home/home-lobby-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "lobby-humans-props",
          "src": "/comic/home/home-lobby-20261010-live-v1-fg.png",
          "role": "humans"
        }
      ]
    },
    {
      "id": "nine",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-quote-rebuilt"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-ticks"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-new-total"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-calls"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-phone-client"
          }
        ],
        [
          {
            "r": [
              0,
              0,
              1,
              1
            ],
            "img": "home-marco-sends"
          }
        ]
      ],
      "art": "/comic/home/home-nine-20261010-live-v1",
      "b": 464,
      "l": 48,
      "room": "office",
      "score": 0.14,
      "rapid": true,
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.333,
            0.5
          ],
          "ar": [
            0,
            0,
            0.333,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.83842668,
              0.5
            ]
          },
          "img": "home-quote-rebuilt",
          "run": "nine",
          "alt": "Codex at Marco's desk, gauntlets teal, the quote on screen with every assumption listed down its side.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. 8:20 a.m.\nForty minutes.",
              "x": 0.03,
              "y": 0.04,
              "w": 0.5,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 6,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Rates, 2026. Discount, none. Labour, forty hours. Sources and checks on page one.",
              "x": 0.45,
              "y": 0.5,
              "w": 0.5,
              "tail": [
                0.6,
                0.9
              ],
              "phone": {
                "x": 0.025,
                "y": 0.117,
                "w": 0.94,
                "tail": [
                  0.6,
                  0.9
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "nine-background",
              "preset": "still"
            },
            {
              "layerId": "nine-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "nine-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.299,
            0.96,
            0.661
          ]
        },
        {
          "at": 11,
          "room": "office",
          "r": [
            0.333,
            0,
            0.334,
            0.5
          ],
          "ar": [
            0.333,
            0,
            0.334,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.76702278
            ]
          },
          "img": "home-marco-ticks",
          "run": "nine",
          "alt": "Marco with a pen, ticking each line on the printed quote.",
          "balloons": [
            {
              "at": 11.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Line by line.\nI initial\neach one.",
              "x": 0.06,
              "y": 0.06,
              "w": 0.5,
              "tail": [
                0.6,
                0.6
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.6,
                  0.6
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "nine-background",
              "preset": "still"
            },
            {
              "layerId": "nine-agents",
              "preset": "still"
            },
            {
              "layerId": "nine-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 16.5,
          "room": "office",
          "r": [
            0.667,
            0,
            0.333,
            0.5
          ],
          "ar": [
            0.667,
            0,
            0.333,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.40889986
            ]
          },
          "img": "home-new-total",
          "run": "nine",
          "alt": "Close on the screen: the new total, much higher, beside the old one struck through.",
          "balloons": [
            {
              "at": 17,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "New total.\n$50,000 higher.",
              "x": 0.06,
              "y": 0.06,
              "w": 0.5,
              "tail": [
                0.5,
                0.6
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.6
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "nine-background",
              "preset": "still"
            },
            {
              "layerId": "nine-agents",
              "preset": "still"
            },
            {
              "layerId": "nine-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 20.5,
          "room": "office",
          "r": [
            0,
            0.5,
            0.333,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.333,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-marco-calls",
          "run": "nine",
          "alt": "Marco on the phone, standing, one hand flat on the quote.",
          "balloons": [
            {
              "at": 21,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Before you sign.\nThe first number\nwas wrong.",
              "x": 0.06,
              "y": 0.06,
              "w": 0.5,
              "tail": [
                0.6,
                0.6
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.6,
                  0.6
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "nine-background",
              "preset": "still"
            },
            {
              "layerId": "nine-agents",
              "preset": "still"
            },
            {
              "layerId": "nine-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 26.5,
          "room": "office",
          "r": [
            0.333,
            0.5,
            0.334,
            0.5
          ],
          "ar": [
            0.333,
            0.5,
            0.334,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.54490251
            ]
          },
          "img": "home-phone-client",
          "run": "nine",
          "alt": "Close on the phone at his ear, the caller unseen.",
          "balloons": [
            {
              "at": 27,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Show us how\nyou got the\nnew one.",
              "x": 0.06,
              "y": 0.06,
              "w": 0.5,
              "tail": [
                0.7,
                0.7
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.7,
                  0.7
                ]
              }
            },
            {
              "at": 32.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "It's all on\npage one.",
              "x": 0.7221,
              "y": 0.69565,
              "w": 0.25,
              "tail": [
                0.63895,
                0.56522
              ],
              "phone": {
                "x": 0.525,
                "y": 0.015,
                "w": 0.45,
                "tail": [
                  0.63895,
                  0.56522
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "nine-background",
              "preset": "still"
            },
            {
              "layerId": "nine-agents",
              "preset": "still"
            },
            {
              "layerId": "nine-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 36.5,
          "room": "office",
          "r": [
            0.667,
            0.5,
            0.333,
            0.5
          ],
          "ar": [
            0.667,
            0.5,
            0.333,
            0.5
          ],
          "cropFocus": {
            "phone": [
              0.72097073,
              0.5
            ]
          },
          "img": "home-marco-sends",
          "run": "nine",
          "alt": "Marco's own finger on Send, the wall clock behind him at 8:57.",
          "sfx": [
            {
              "kind": "click"
            }
          ],
          "balloons": [
            {
              "at": 37,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "8:57 a.m. The real\nquote went out.",
              "x": 0.04,
              "y": 0.05,
              "w": 0.6,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "nine-background",
              "preset": "still"
            },
            {
              "layerId": "nine-agents",
              "preset": "still"
            },
            {
              "layerId": "nine-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.14200000000000002,
            0.96,
            0.818
          ]
        }
      ],
      "layers": [
        {
          "id": "nine-background",
          "src": "/comic/home/home-nine-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "nine-agents",
          "src": "/comic/home/home-nine-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "nine-humans-props",
          "src": "/comic/home/home-nine-20261010-live-v1-fg.png",
          "role": "humans"
        }
      ]
    },
    {
      "id": "roof",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-roof",
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
            "img": "home-marco-tired",
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
            "img": "home-brain-rises",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/home/home-roof-20261010-live-v1",
      "b": 512,
      "l": 29,
      "room": "street",
      "score": 0.08,
      "panels": [
        {
          "at": 1,
          "room": "street",
          "r": [
            0,
            0,
            0.34,
            1
          ],
          "ar": [
            0,
            0,
            0.62,
            0.58
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.46425373
            ]
          },
          "img": "home-roof",
          "alt": "After sending the corrected quote, Marco, Matt, Claude and Codex take a quiet breath on the intact tower roof in morning light. No physical destruction below; the teal knowledge lattice is clearly separate from the real skyline.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "The roof. Friday,\n9:20 a.m.\nThe quote was sent.",
              "x": 0.025,
              "y": 0.863,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.863,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "roof-background",
              "preset": "drift-right",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "roof-light",
              "preset": "still"
            },
            {
              "layerId": "roof-agents",
              "preset": "still"
            },
            {
              "layerId": "roof-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.04,
            0.96,
            0.7849999999999999
          ],
          "pageArt": [
            0.02,
            0.04,
            0.96,
            0.7849999999999999
          ]
        },
        {
          "at": 7.5,
          "room": "street",
          "r": [
            0.34,
            0,
            0.36,
            1
          ],
          "ar": [
            0.62,
            0,
            0.38,
            0.34
          ],
          "cropFocus": {
            "phone": [
              0.48747319,
              0.5
            ]
          },
          "img": "home-marco-tired",
          "alt": "Marco, unshaven, collar open, looking at Matt rather than the view.",
          "balloons": [
            {
              "at": 8,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Who checks it\nnext time? I won't\nalways be here.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.28381,
                0.54
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.28381,
                  0.54
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "roof-background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "roof-light",
              "preset": "still"
            },
            {
              "layerId": "roof-agents",
              "preset": "still"
            },
            {
              "layerId": "roof-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 14,
          "room": "street",
          "r": [
            0.7,
            0,
            0.3,
            1
          ],
          "ar": [
            0.62,
            0.34,
            0.38,
            0.24
          ],
          "cropFocus": {
            "phone": [
              0.11039135,
              0.5
            ]
          },
          "img": "home-brain-rises",
          "alt": "Behind the four people, a transparent teal knowledge lattice rises beside the intact real tower. The floors confirmed overnight and in the lobby remain lit; it is a view of retained decisions, not a force changing the skyline.",
          "balloons": [
            {
              "at": 14.5,
              "kind": "speech",
              "state": "offpanel",
              "who": "matt",
              "text": "The procedure stays. You review its sources when the work changes.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.43619,
                1
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.43619,
                  1
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "roof-background",
              "preset": "drift-right",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "roof-light",
              "preset": "still"
            },
            {
              "layerId": "roof-agents",
              "preset": "still"
            },
            {
              "layerId": "roof-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        }
      ],
      "layers": [
        {
          "id": "roof-background",
          "src": "/comic/home/home-roof-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "roof-light",
          "src": "/comic/home/home-roof-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "roof-agents",
          "src": "/comic/home/home-roof-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "roof-humans-props",
          "src": "/comic/home/home-roof-20261010-live-v1-fg.png",
          "role": "humans"
        }
      ],
      "continues": false
    },
    {
      "id": "roof-continued-1",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-codex-teal",
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
            "img": "home-claude-teal",
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
            "img": "home-matt-names",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/home/home-roof-20261010-live-v1",
      "b": 512,
      "l": 26.0,
      "room": "street",
      "score": 0.08,
      "panels": [
        {
          "at": 1.0,
          "room": "street",
          "r": [
            0,
            0,
            0.34,
            1
          ],
          "ar": [
            0,
            0.58,
            0.24,
            0.42
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-codex-teal",
          "alt": "Codex, gauntlets running teal, a short list of lines glowing beside him.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Rates, discount,\nlabour. Confirmed\nby Marco.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.45921,
                0.27597
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.45921,
                  0.27597
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "roof-background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "roof-light",
              "preset": "still"
            },
            {
              "layerId": "roof-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "roof-humans-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 6.0,
          "room": "street",
          "r": [
            0.34,
            0,
            0.36,
            1
          ],
          "ar": [
            0.24,
            0.58,
            0.22,
            0.42
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.27922446
            ]
          },
          "img": "home-claude-teal",
          "alt": "Claude, visor teal, the pages of his coat turning slowly in the wind.",
          "motion": {
            "preset": "still"
          },
          "balloons": [
            {
              "at": 6.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Thirty-one\ncitations. Dana\nsigned each one.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.63087,
                0.21104
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.63087,
                  0.21104
                ]
              }
            }
          ],
          "layerMotion": [
            {
              "layerId": "roof-background",
              "preset": "drift-right",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "roof-light",
              "preset": "still"
            },
            {
              "layerId": "roof-agents",
              "preset": "projection",
              "beats": 4,
              "strength": 0.35
            },
            {
              "layerId": "roof-humans-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 11.0,
          "room": "street",
          "r": [
            0.7,
            0,
            0.3,
            1
          ],
          "ar": [
            0.46,
            0.58,
            0.54,
            0.42
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.09406088
            ]
          },
          "img": "home-matt-names",
          "alt": "Matt in his black T-shirt and glasses looks at the retained-source lattice with Claude and Codex, in full morning light after the quote was sent. His open hand indicates the record, not a physical force over the city.",
          "balloons": [
            {
              "at": 11.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Marco owns the quote checks. Dana owns the citation checks. Keep both current.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.21095,
                0.34416
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.21095,
                  0.34416
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "roof-background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "roof-light",
              "preset": "still"
            },
            {
              "layerId": "roof-agents",
              "preset": "still"
            },
            {
              "layerId": "roof-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        }
      ],
      "layers": [
        {
          "id": "roof-background",
          "src": "/comic/home/home-roof-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "roof-light",
          "src": "/comic/home/home-roof-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "roof-agents",
          "src": "/comic/home/home-roof-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "roof-humans-props",
          "src": "/comic/home/home-roof-20261010-live-v1-fg.png",
          "role": "humans"
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
            "img": "home-monday-floor",
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
            "img": "home-chat-ok-again",
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
            "img": "home-marco-turns",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/home/home-monday-20261010-live-v1",
      "b": 552,
      "l": 26,
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.34,
            1
          ],
          "ar": [
            0,
            0,
            0.4,
            0.45
          ],
          "cropFocus": {
            "phone": [
              0.61579533,
              0.5
            ]
          },
          "img": "home-monday-floor",
          "alt": "The sales floor in daylight, every desk taken; Marco at his desk with a new request for a quote on screen.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. Monday,\n19 October, 9:10 a.m.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "monday-background",
              "preset": "still"
            },
            {
              "layerId": "monday-light",
              "preset": "still"
            },
            {
              "layerId": "monday-agents",
              "preset": "still"
            },
            {
              "layerId": "monday-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.14200000000000002,
            0.96,
            0.818
          ],
          "pageArt": [
            0.02,
            0.14200000000000002,
            0.96,
            0.818
          ]
        },
        {
          "at": 6.5,
          "room": "office",
          "r": [
            0.34,
            0,
            0.36,
            1
          ],
          "ar": [
            0.4,
            0,
            0.3,
            0.45
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-chat-ok-again",
          "alt": "Close on the laptop: the chat window's cheerful green tick, exactly as on Thursday night.",
          "balloons": [
            {
              "at": 7,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Looks great!\nReady to send.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.5,
                0.7
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.7
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "monday-background",
              "preset": "still"
            },
            {
              "layerId": "monday-light",
              "preset": "still"
            },
            {
              "layerId": "monday-agents",
              "preset": "still"
            },
            {
              "layerId": "monday-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ],
          "pageArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        },
        {
          "at": 11,
          "room": "office",
          "r": [
            0.7,
            0,
            0.3,
            1
          ],
          "ar": [
            0.7,
            0,
            0.3,
            0.45
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.55850748
            ]
          },
          "img": "home-marco-turns",
          "alt": "Marco leaves Send alone and turns the laptop toward Codex.",
          "balloons": [
            {
              "at": 11.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Not yet. Show me\nthe assumptions.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.5,
                0.6
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.6
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "monday-background",
              "preset": "still"
            },
            {
              "layerId": "monday-light",
              "preset": "still"
            },
            {
              "layerId": "monday-agents",
              "preset": "still"
            },
            {
              "layerId": "monday-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ],
          "pageArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ]
        }
      ],
      "layers": [
        {
          "id": "monday-background",
          "src": "/comic/home/home-monday-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "monday-light",
          "src": "/comic/home/home-monday-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "monday-agents",
          "src": "/comic/home/home-monday-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "monday-humans-props",
          "src": "/comic/home/home-monday-20261010-live-v1-fg.png",
          "role": "humans"
        }
      ],
      "continues": false
    },
    {
      "id": "monday-continued-1",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-codex-lists",
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
            "img": "home-apology-letters",
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
            "img": "home-matt-door",
            "r": [
              0,
              0,
              1,
              1
            ]
          }
        ]
      ],
      "art": "/comic/home/home-monday-20261010-live-v1",
      "b": 552,
      "l": 33.5,
      "room": "office",
      "score": 0,
      "panels": [
        {
          "at": 1,
          "room": "office",
          "r": [
            0,
            0,
            0.34,
            1
          ],
          "ar": [
            0,
            0.45,
            0.25,
            0.55
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.49641932
            ]
          },
          "img": "home-codex-lists",
          "alt": "Codex lists them, gauntlets teal; behind him, in the window, the lattice's lit floors.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Rates, 2026. Confirmed by you, Friday. I hold the draft until you check it.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "tail": [
                0.3913,
                0.20741
              ],
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94,
                "tail": [
                  0.3913,
                  0.20741
                ]
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "monday-background",
              "preset": "still"
            },
            {
              "layerId": "monday-light",
              "preset": "still"
            },
            {
              "layerId": "monday-agents",
              "preset": "still"
            },
            {
              "layerId": "monday-humans-props",
              "preset": "still"
            }
          ],
          "pageArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ]
        },
        {
          "at": 6,
          "room": "office",
          "r": [
            0.34,
            0,
            0.36,
            1
          ],
          "ar": [
            0.25,
            0.45,
            0.5,
            0.55
          ],
          "cropFocus": {
            "phone": [
              0.04135096,
              0.5
            ]
          },
          "img": "home-apology-letters",
          "alt": "Wide on Marco's desk: a tall stack of printed letters, each one a correction to a customer; Marco signing them one by one.",
          "balloons": [
            {
              "at": 6.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Gilmour & Clark signed\nthe corrected quote.\nThe Monday booking held.",
              "x": 0.025,
              "y": 0.015,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.015,
                "w": 0.94
              }
            },
            {
              "at": 13,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The four hundred emails\ncould not be unsent.",
              "x": 0.025,
              "y": 0.896,
              "w": 0.94,
              "phone": {
                "x": 0.025,
                "y": 0.896,
                "w": 0.94
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "monday-background",
              "preset": "still"
            },
            {
              "layerId": "monday-light",
              "preset": "still"
            },
            {
              "layerId": "monday-agents",
              "preset": "still"
            },
            {
              "layerId": "monday-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.6829999999999999
          ],
          "pageArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.6829999999999999
          ]
        },
        {
          "at": 18.5,
          "room": "office",
          "r": [
            0.7,
            0,
            0.3,
            1
          ],
          "ar": [
            0.75,
            0.45,
            0.25,
            0.55
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.5
            ]
          },
          "img": "home-matt-door",
          "alt": "Matt in the doorway with a coffee, black T-shirt, watching Marco sign; he turns to go without a word.",
          "balloons": [],
          "motion": {
            "preset": "still"
          },
          "layerMotion": [
            {
              "layerId": "monday-background",
              "preset": "drift-left",
              "beats": 4,
              "strength": 0.2
            },
            {
              "layerId": "monday-light",
              "preset": "still"
            },
            {
              "layerId": "monday-agents",
              "preset": "still"
            },
            {
              "layerId": "monday-humans-props",
              "preset": "still"
            }
          ],
          "phoneArt": [
            0.02,
            0.04,
            0.96,
            0.9199999999999999
          ],
          "pageArt": [
            0.02,
            0.04,
            0.96,
            0.9199999999999999
          ]
        }
      ],
      "layers": [
        {
          "id": "monday-background",
          "src": "/comic/home/home-monday-20261010-live-v1-bg.png",
          "role": "background"
        },
        {
          "id": "monday-light",
          "src": "/comic/home/home-monday-20261010-live-v1-light.png",
          "role": "light"
        },
        {
          "id": "monday-agents",
          "src": "/comic/home/home-monday-20261010-live-v1-agents.png",
          "role": "agents"
        },
        {
          "id": "monday-humans-props",
          "src": "/comic/home/home-monday-20261010-live-v1-fg.png",
          "role": "humans"
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
    "b": 592,
    "heading": "Weeks later. Three phones light up.",
    "choices": [
      {
        "label": "Floor 19. The training records are gone.",
        "href": "/agentic-systems-b/",
        "img": "home-phone-sam"
      },
      {
        "label": "Floor 28. A file opened for someone who should never see it.",
        "href": "/traditional-systems-b/",
        "img": "home-phone-dana-access"
      },
      {
        "label": "A thirty-year-old system, and nobody left who remembers it.",
        "href": "/data-migrations-b/",
        "img": "home-phone-dana"
      }
    ]
  },
  "collapseTo": ".home-intro"
}


);


