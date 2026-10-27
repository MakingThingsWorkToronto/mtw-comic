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
            "img": "home-tower-night",
            "r": [
              0,
              0,
              1,
              0.27
            ]
          },
          {
            "img": "home-marco-desk",
            "r": [
              0,
              0.27,
              1,
              0.25
            ]
          },
          {
            "img": "home-phone-ring",
            "r": [
              0,
              0.52,
              0.5,
              0.14
            ]
          },
          {
            "img": "home-marco-grin",
            "r": [
              0.5,
              0.52,
              0.5,
              0.14
            ]
          },
          {
            "img": "home-marco-types",
            "r": [
              0,
              0.66,
              0.32,
              0.34
            ]
          },
          {
            "img": "home-chat-ok",
            "r": [
              0.32,
              0.66,
              0.2,
              0.34
            ]
          },
          {
            "img": "home-send",
            "r": [
              0.52,
              0.66,
              0.48,
              0.34
            ]
          }
        ]
      ],
      "art": "/comic/home/home-regeneration-20261011/quote/v2/master-v2",
      "b": 0,
      "l": 92,
      "score": 0.3,
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
            0.005980861244019139,
            0.008501594048884165,
            0.32894736842105265,
            0.48352816153028694
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
            "preset": "drift-right",
            "beats": 8,
            "strength": 0.6
          },
          "sfx": [
            {
              "kind": "transit",
              "gain": 0.25
            },
            {
              "kind": "whoosh",
              "delay": 3,
              "gain": 0.15
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
                "x": 0.03,
                "y": 0.03,
                "w": 0.6600145945945947
              },
              "speech": {
                "id": "home-tower-night-b0-20261013",
                "src": "/comic/speech/home-20261013/home-tower-night-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 7.725147,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
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
              },
              "speech": {
                "id": "home-tower-night-b1-20261013",
                "src": "/comic/speech/home-20261013/home-tower-night-b1-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 14.288254,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "phoneArt": [
            0.02,
            0.17500000000000002,
            0.96,
            0.5179999999999999
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 8,
              "strength": 1
            }
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
            0.3415071770334928,
            0.008501594048884165,
            0.3660287081339713,
            0.48352816153028694
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
            "preset": "push",
            "beats": 8,
            "strength": 0.4
          },
          "balloons": [
            {
              "at": 38.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. Sittler\nBusiness Services.",
              "x": 0.03,
              "y": 0.95,
              "w": 0.36,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.4527794594594595
              },
              "speech": {
                "id": "home-marco-desk-b0-20261013",
                "src": "/comic/speech/home-20261013/home-marco-desk-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 3.675488,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 42.5,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Marco Lemieux. Sales.\nHe can close\nanything.",
              "x": 0.59,
              "y": 0.95,
              "w": 0.36,
              "phone": {
                "x": 0.4431,
                "y": 0.95,
                "w": 0.5068881081081081
              },
              "speech": {
                "id": "home-marco-desk-b1-20261013",
                "src": "/comic/speech/home-20261013/home-marco-desk-b1-20261013-eq-tempo112-crest-v2.mp3",
                "durationSeconds": 3.971678,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 47.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The installation crew\nwas booked for Monday.",
              "x": 0.03,
              "y": 0.95,
              "w": 0.52,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.5630740540540541
              },
              "speech": {
                "id": "home-marco-desk-b2-20261013",
                "src": "/comic/speech/home-20261013/home-marco-desk-b2-20261013-eq-tempo112-crest-v2.mp3",
                "durationSeconds": 2.384966,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "phoneArt": [
            0,
            0,
            1,
            1
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "keys",
              "delay": 0.5,
              "gain": 0.35
            }
          ],
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 6,
              "strength": 0.8
            }
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
            0.715311004784689,
            0.008501594048884165,
            0.27870813397129185,
            0.21253985122210414
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
              "kind": "buzz",
              "gain": 0.45
            },
            {
              "kind": "ring",
              "delay": 1,
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
                "x": 0.13951,
                "y": 0.03,
                "w": 0.86264,
                "tail": [
                  0.82,
                  0.8
                ]
              },
              "speech": {
                "id": "home-phone-ring-b0-20261013",
                "src": "/comic/speech/home-20261013/home-phone-ring-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 4.250431,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.7
          },
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 3,
              "strength": 1
            }
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
            0.715311004784689,
            0.22954303931987247,
            0.27870813397129185,
            0.2624867162592986
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
              "x": 0.4542,
              "y": 0.0563,
              "w": 0.5,
              "tail": [
                0.3475,
                0.3766
              ],
              "phone": {
                "x": 0.15105,
                "y": 0.03,
                "w": 0.7877
              },
              "speech": {
                "id": "home-quote-home-marco-grin-b0",
                "src": "/comic/speech/home-20261012b/home-quote-home-marco-grin-b0-eq-v1.mp3",
                "durationSeconds": 2.321995,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "drift-left",
            "beats": 6,
            "strength": 0.5
          },
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "click",
              "delay": 1,
              "gain": 0.3
            }
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
            0.005980861244019139,
            0.5037194473963869,
            0.17404306220095694,
            0.48459086078639746
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
                "x": 0.03,
                "y": 0.03,
                "w": 0.94,
                "tail": [
                  0.48,
                  0.72
                ]
              },
              "speech": {
                "id": "home-quote-home-marco-types-b0",
                "src": "/comic/speech/home-20261012b/home-quote-home-marco-types-b0-eq-v1.mp3",
                "durationSeconds": 4.133152,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 6,
            "strength": 0.5
          },
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.45
            },
            {
              "kind": "keys",
              "delay": 2,
              "gain": 0.4
            }
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
            0.1854066985645933,
            0.5037194473963869,
            0.16566985645933013,
            0.48459086078639746
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
                "x": 0.03,
                "y": 0.03,
                "w": 0.94,
                "tail": [
                  0.5,
                  0.6
                ]
              },
              "speech": {
                "id": "home-chat-ok-b0-20261013",
                "src": "/comic/speech/home-20261013/home-chat-ok-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 2.55678,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.5
          },
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "click",
              "delay": 1,
              "gain": 0.5
            }
          ],
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 4,
              "strength": 1
            }
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
            0.35586124401913877,
            0.5037194473963869,
            0.6381578947368421,
            0.48459086078639746
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
              "kind": "click",
              "gain": 0.55
            },
            {
              "kind": "whoosh",
              "delay": 0.5,
              "gain": 0.45
            },
            {
              "kind": "paper",
              "delay": 1,
              "gain": 0.4
            },
            {
              "kind": "sting",
              "delay": 6,
              "gain": 0.35
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
                "x": 0.11825,
                "y": 0.95,
                "w": 0.8517500000000001
              },
              "speech": {
                "id": "home-send-b0-20261013",
                "src": "/comic/speech/home-20261013/home-send-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 3.672472,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
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
                "x": 0.03,
                "y": 0.95,
                "w": 0.9181835585585586
              },
              "speech": {
                "id": "home-send-b1-20261013",
                "src": "/comic/speech/home-20261013/home-send-b1-20261013-eq-tempo112-crest-v2.mp3",
                "durationSeconds": 4.130363,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 8,
            "strength": 0.4
          },
          "phoneArt": [
            0,
            0,
            1,
            1
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 6,
              "strength": 1
            },
            {
              "layerId": "papers",
              "preset": "drift-right",
              "beats": 8,
              "strength": 0.35
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "base",
          "src": "/comic/home/home-regeneration-20261011/quote/v2/master-v2-1600.webp",
          "role": "background"
        },
        {
          "role": "light",
          "id": "glow",
          "src": "/comic/home/motion-20261012/quote/glow.webp"
        },
        {
          "role": "props",
          "id": "papers",
          "src": "/comic/home/motion-20261012/quote/papers.webp"
        }
      ]
    },
    {
      "id": "doubt",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-marco-coat",
            "r": [
              0,
              0,
              0.6410256410256411,
              0.2922338192944007
            ]
          },
          {
            "img": "home-reply-email",
            "r": [
              0.6410256410256411,
              0,
              0.3589743589743589,
              0.2922338192944007
            ]
          },
          {
            "img": "home-marco-reads",
            "r": [
              0,
              0.2922338192944007,
              0.3584521384928717,
              0.37139287828860695
            ]
          },
          {
            "img": "home-ratecard-close",
            "r": [
              0.3584521384928717,
              0.2922338192944007,
              0.27494908350305497,
              0.37139287828860695
            ]
          },
          {
            "img": "home-marco-silhouette",
            "r": [
              0.6334012219959266,
              0.2922338192944007,
              0.36659877800407337,
              0.37139287828860695
            ]
          },
          {
            "img": "home-chat-again",
            "r": [
              0,
              0.6636266975830076,
              0.53125,
              0.33637330241699237
            ]
          },
          {
            "img": "home-elevator-go",
            "r": [
              0.53125,
              0.6636266975830076,
              0.46875,
              0.33637330241699237
            ]
          }
        ]
      ],
      "art": "/comic/home/home-regeneration-20261011/doubt/v2/master-v2",
      "b": 92,
      "l": 40,
      "score": 0.3,
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
            0.005980861244019139,
            0.008501594048884165,
            0.5005980861244019,
            0.45164718384697133
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
              "kind": "buzz",
              "gain": 0.5
            },
            {
              "kind": "buzz",
              "delay": 1.5,
              "gain": 0.35
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
                "x": 0.03,
                "y": 0.03,
                "w": 0.6263036756756756
              },
              "speech": {
                "id": "home-marco-coat-b0-20261013",
                "src": "/comic/speech/home-20261013/home-marco-coat-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 3.974853,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "drift-left",
            "beats": 8,
            "strength": 0.5
          },
          "phoneArt": [
            0.02,
            0.14200000000000002,
            0.96,
            0.818
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 3,
              "strength": 1
            }
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
            0.5131578947368421,
            0.008501594048884165,
            0.22966507177033493,
            0.45164718384697133
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
                "x": 0.25877,
                "y": 0.03,
                "w": 0.73589,
                "tail": [
                  0.6,
                  0.8
                ]
              },
              "speech": {
                "id": "home-reply-email-b0-20261013",
                "src": "/comic/speech/home-20261013/home-reply-email-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 3.450023,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.6
          },
          "phoneArt": [
            0.02,
            0.19699999999999998,
            0.96,
            0.763
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "click",
              "gain": 0.4
            }
          ],
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 4,
              "strength": 1
            }
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
            0.7494019138755981,
            0.008501594048884165,
            0.2446172248803828,
            0.45164718384697133
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
                "x": 0.1452,
                "y": 0.03,
                "w": 0.77582,
                "tail": [
                  0.5,
                  0.7
                ]
              },
              "speech": {
                "id": "home-doubt-home-marco-reads-b0",
                "src": "/comic/speech/home-20261012b/home-doubt-home-marco-reads-b0-eq-v1.mp3",
                "durationSeconds": 1.486077,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 6,
            "strength": 0.8
          },
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "heartbeat",
              "delay": 1,
              "gain": 0.35
            }
          ],
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "shadow",
              "beats": 6,
              "strength": 1
            }
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
            0.005980861244019139,
            0.4729011689691817,
            0.29545454545454547,
            0.5154091392136025
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
                "x": 0.18137,
                "y": 0.03,
                "w": 0.71222,
                "tail": [
                  0.5,
                  0.5
                ]
              },
              "speech": {
                "id": "home-doubt-home-ratecard-close-b0",
                "src": "/comic/speech/home-20261012b/home-doubt-home-ratecard-close-b0-eq-v1.mp3",
                "durationSeconds": 1.300317,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 5,
            "strength": 0.7
          },
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.55
            },
            {
              "kind": "sting",
              "delay": 2,
              "gain": 0.4
            }
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
            0.30861244019138756,
            0.4729011689691817,
            0.3588516746411483,
            0.5154091392136025
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
              "kind": "heartbeat",
              "gain": 0.45
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
                "x": 0.08364,
                "y": 0.95,
                "w": 0.8863578183183183
              },
              "speech": {
                "id": "home-marco-silhouette-b0-20261013",
                "src": "/comic/speech/home-20261013/home-marco-silhouette-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 5.002358,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 8,
            "strength": 0.5
          },
          "phoneArt": [
            0,
            0,
            1,
            1
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 8,
              "strength": 0.8
            }
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
            0.6752392344497608,
            0.4729011689691817,
            0.3187799043062201,
            0.21679064824654623
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
              "kind": "keys",
              "gain": 0.5
            },
            {
              "kind": "click",
              "delay": 2,
              "gain": 0.4
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
                "x": 0.25668,
                "y": 0.03,
                "w": 0.74843,
                "tail": [
                  0.75,
                  0.75
                ]
              },
              "speech": {
                "id": "home-chat-again-b0-20261013",
                "src": "/comic/speech/home-20261013/home-chat-again-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 2.508821,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "drift-right",
            "beats": 4,
            "strength": 0.5
          },
          "phoneArt": [
            0.02,
            0.159,
            0.96,
            0.8009999999999999
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 3,
              "strength": 1
            }
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
            0.6752392344497608,
            0.7024442082890542,
            0.3187799043062201,
            0.2858660998937301
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
                "x": 0.15575,
                "y": 0.405,
                "w": 0.84263,
                "tail": [
                  0.76812,
                  0.29317
                ]
              },
              "speech": {
                "id": "home-doubt-home-elevator-go-b0",
                "src": "/comic/speech/home-20261012b/home-doubt-home-elevator-go-b0-eq-v1.mp3",
                "durationSeconds": 3.947392,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 6,
            "strength": 0.6
          },
          "phoneArt": [
            0,
            0,
            1,
            1
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "door",
              "gain": 0.5
            }
          ],
          "layerMotion": [
            {
              "layerId": "base",
              "preset": "still"
            },
            {
              "layerId": "glow",
              "preset": "light",
              "beats": 5,
              "strength": 1
            }
          ]
        }
      ],
      "layers": [
        {
          "id": "base",
          "src": "/comic/home/home-regeneration-20261011/doubt/v2/master-v2-1600.webp",
          "role": "background"
        },
        {
          "role": "light",
          "id": "glow",
          "src": "/comic/home/motion-20261012/doubt/glow.webp"
        }
      ]
    },
    {
      "id": "brief",
      "artCropInsetPct": 0,
      "phonePages": [
        [
          {
            "img": "home-dana-office",
            "r": [
              0,
              0,
              1,
              0.20392156862745098
            ]
          },
          {
            "img": "home-dana-reads",
            "r": [
              0,
              0.20392156862745098,
              0.5,
              0.3058823529411765
            ]
          },
          {
            "img": "home-claude-stricken",
            "r": [
              0.5,
              0.20392156862745098,
              0.5,
              0.3058823529411765
            ]
          },
          {
            "img": "home-citation-dissolves",
            "r": [
              0,
              0.5098039215686274,
              0.6153846153846154,
              0.23529411764705885
            ]
          },
          {
            "img": "home-thirty-one",
            "r": [
              0.6153846153846154,
              0.5098039215686274,
              0.3846153846153846,
              0.23529411764705885
            ]
          },
          {
            "img": "home-marco-doorway",
            "r": [
              0,
              0.7450980392156863,
              1,
              0.2549019607843137
            ]
          }
        ]
      ],
      "art": "/comic/home/home-regeneration-20261011/brief/v3/master-v3",
      "b": 132,
      "l": 64,
      "score": 0.25,
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
            0.005980861244019139,
            0.008501594048884165,
            0.5669856459330144,
            0.512221041445271
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.54850131
            ]
          },
          "phoneArt": [
            0,
            0,
            1,
            1
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
              "x": 0.03,
              "y": 0.95,
              "w": 0.3,
              "phone": {
                "x": 0.4433,
                "y": 0.95,
                "w": 0.5066902702702702
              },
              "speech": {
                "id": "home-dana-office-b0-20261013",
                "src": "/comic/speech/home-20261013/home-dana-office-b0-20261013-eq-tempo112-crest-v2.mp3",
                "durationSeconds": 1.96644,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 7,
              "kind": "caption",
              "characterIntro": true,
              "state": "narration",
              "who": "narrator",
              "text": "Dana Dryden. Legal\nassistant. She reads\nevery footnote.",
              "x": 0.63,
              "y": 0.95,
              "w": 0.32,
              "phone": {
                "x": 0.4619,
                "y": 0.95,
                "w": 0.4880935135135135
              },
              "speech": {
                "id": "home-dana-office-b1-20261013",
                "src": "/comic/speech/home-20261013/home-dana-office-b1-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 4.536735,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 12.5,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Dana. I sent\nthe wrong quote.",
              "x": 0.2378,
              "y": 0.0138,
              "w": 0.34,
              "tail": [
                0.075,
                0.258
              ],
              "phone": {
                "x": 0.1066,
                "y": 0.0379,
                "w": 0.42488,
                "tail": [
                  0.0919,
                  0.3774
                ]
              },
              "speech": {
                "id": "home-brief-home-dana-office-b2",
                "src": "/comic/speech/home-20261012b/home-brief-home-dana-office-b2-eq-v1.mp3",
                "durationSeconds": 2.414875,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
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
              "x": 0.3502,
              "y": 0.2236,
              "w": 0.33,
              "tail": [
                0.43,
                0.4511
              ],
              "phone": {
                "x": 0.0137,
                "y": 0.5227,
                "w": 0.359,
                "tail": [
                  0.4328,
                  0.7993
                ]
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "views": [
            {
              "id": "preview-base",
              "at": 0,
              "alt": "Wide on a small law office at night, binders and file boxes everywhere: Dana Dryden at her desk with a printed brief; Claude, a tall figure in a long coat of turning pages with a grey visor, standing over it; Marco in the doorway, left.",
              "fit": "cover",
              "ar": [
                0,
                0,
                1,
                0.75
              ],
              "src": "/comic/home/defect-pass-20261015/home-dana-office-claude-composite-v1-1600.webp",
              "canonicalSource": {
                "panelId": "home-dana-office",
                "path": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-office-claude-composite-v1.png",
                "sha256": "3a050c2340b553ab09d862908bf06fad9d8b84504c2823570cfce82c089b813e",
                "recordId": "home-dana-office-claude-composite-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-office-claude-composite-v1-1600.webp",
                    "sha256": "1f5ee5b4a63a0813280d2500aea775c139ffaf9ca168c2abdceb1807fd9905e3",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-office-claude-composite-v1.png",
                      "sourceSha256": "3a050c2340b553ab09d862908bf06fad9d8b84504c2823570cfce82c089b813e",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-office-claude-composite-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-office-claude-composite-v1-1600.avif",
                    "sha256": "0b1c320a14bd275d5de34844b99e35d7dbbe077edae0ebaca0cc0baa8d8793c1",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-office-claude-composite-v1.png",
                      "sourceSha256": "3a050c2340b553ab09d862908bf06fad9d8b84504c2823570cfce82c089b813e",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-office-claude-composite-v1-1600.avif"
                    }
                  }
                ]
              },
              "alternates": [
                "/comic/home/defect-pass-20261015/home-dana-office-claude-composite-v1-1600.avif"
              ]
            },
            {
              "id": "preview-stack",
              "at": 1,
              "alt": "Wide on a small law office at night, binders and file boxes everywhere: Dana Dryden at her desk with a printed brief; Claude, a tall figure in a long coat of turning pages with a grey visor, standing over it; Marco in the doorway, left.",
              "fit": "cover",
              "ar": [
                0,
                0,
                1,
                0.75
              ],
              "src": "/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.webp",
              "canonicalSource": {
                "panelId": "home-dana-office",
                "path": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-dana-office-plate-v1.png",
                "sha256": "e5453171d22babdaedd502f97f1095fdf36c1cb733e1bb074397eb9fe88a19a4",
                "recordId": "home-fix-brief-dana-office-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.webp",
                    "sha256": "36469bff597684ca9cecd68d8abb33d0a74f1cc3369ad4c5f7599871aefb6ee5",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-dana-office-plate-v1.png",
                      "sourceSha256": "e5453171d22babdaedd502f97f1095fdf36c1cb733e1bb074397eb9fe88a19a4",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.avif",
                    "sha256": "23c690debe7871568433d386becf7ba3f19478db9079c3588a4a3243f5628c76",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-dana-office-plate-v1.png",
                      "sourceSha256": "e5453171d22babdaedd502f97f1095fdf36c1cb733e1bb074397eb9fe88a19a4",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "layers": [
                {
                  "id": "base",
                  "role": "background",
                  "src": "/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-dana-office",
                    "path": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-dana-office-plate-v1.png",
                    "sha256": "e5453171d22babdaedd502f97f1095fdf36c1cb733e1bb074397eb9fe88a19a4",
                    "recordId": "home-fix-brief-dana-office-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.webp",
                        "sha256": "36469bff597684ca9cecd68d8abb33d0a74f1cc3369ad4c5f7599871aefb6ee5",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-dana-office-plate-v1.png",
                          "sourceSha256": "e5453171d22babdaedd502f97f1095fdf36c1cb733e1bb074397eb9fe88a19a4",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.avif",
                        "sha256": "23c690debe7871568433d386becf7ba3f19478db9079c3588a4a3243f5628c76",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-dana-office-plate-v1.png",
                          "sourceSha256": "e5453171d22babdaedd502f97f1095fdf36c1cb733e1bb074397eb9fe88a19a4",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-dana-office-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "claude",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-dana-office-claude-layer-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-dana-office",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-office-claude-layer-v1.png",
                    "sha256": "dc9690a1fc588a7651220b0482a67c743d1743e279a4166b5987b531db2cac62",
                    "recordId": "home-dana-office-claude-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-office-claude-layer-v1-1600.webp",
                        "sha256": "638f6a3f74792c895ecaf9bc17358455b17cd668b84825e6aeafa052384af4e4",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-office-claude-layer-v1.png",
                          "sourceSha256": "dc9690a1fc588a7651220b0482a67c743d1743e279a4166b5987b531db2cac62",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-office-claude-layer-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-office-claude-layer-v1-1600.avif",
                        "sha256": "655fcaecab358f4f24b5aa0fcef3bf6c94bddd01953a2f7ef10f3538c41d99dc",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-office-claude-layer-v1.png",
                          "sourceSha256": "dc9690a1fc588a7651220b0482a67c743d1743e279a4166b5987b531db2cac62",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-office-claude-layer-v1-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "base",
                  "preset": "still"
                },
                {
                  "layerId": "claude",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 1
                }
              ]
            }
          ],
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.4
            },
            {
              "kind": "door",
              "delay": 2,
              "gain": 0.3
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
            0.5801435406698564,
            0.008501594048884165,
            0.19198564593301434,
            0.512221041445271
          ],
          "cropFocus": {
            "phone": [
              1,
              0.5
            ]
          },
          "phoneArt": [
            0,
            0,
            1,
            1
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
              "x": 0.411,
              "y": 0.2463,
              "w": 0.9,
              "tail": [
                0.2,
                0.4943
              ],
              "phone": {
                "x": 0.22311,
                "y": 0.555,
                "w": 0.54828,
                "tail": [
                  0.48,
                  0.45
                ]
              },
              "speech": {
                "id": "home-brief-home-dana-reads-b0",
                "src": "/comic/speech/home-20261012b/home-brief-home-dana-reads-b0-eq-v1.mp3",
                "durationSeconds": 2.716735,
                "provider": "Fish Audio",
                "characterId": "dana",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.webp",
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-dana-reads",
              "path": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-reads-claude-composite-v1.png",
              "sha256": "4ee7a6aceaab8c3fa0d6668a63775b47a2736eec931f38241036633a7b9375ec",
              "recordId": "home-dana-reads-claude-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.webp",
                  "sha256": "3ca30dc758a19a8f3409c21fc119c1c45ce3e2b0b20c93d8fbf88c2cfc6bc9c3",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v2.json",
                    "sha256": "9ae5c6e6dbbdeccaa257a805a07ce17996a7d32d467c6606e1cc229cae81d95c",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-reads-claude-composite-v1.png",
                    "sourceSha256": "4ee7a6aceaab8c3fa0d6668a63775b47a2736eec931f38241036633a7b9375ec",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.avif",
                  "sha256": "d3a203e01edf153a83784a9301923139386d25abdab534d7529af156c400f487",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v2.json",
                    "sha256": "9ae5c6e6dbbdeccaa257a805a07ce17996a7d32d467c6606e1cc229cae81d95c",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-reads-claude-composite-v1.png",
                    "sourceSha256": "4ee7a6aceaab8c3fa0d6668a63775b47a2736eec931f38241036633a7b9375ec",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.avif"
                  }
                }
              ]
            },
            "alternates": [
              "/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.avif"
            ],
            "phone": {
              "ar": [
                0.2246,
                0.54,
                0.488,
                0.3516
              ],
              "fit": "cover"
            },
            "fit": "cover"
          },
          "views": [
            {
              "src": "/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.webp",
              "alternates": [
                "/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.avif"
              ],
              "canonicalSource": {
                "panelId": "home-dana-reads",
                "path": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-reads-claude-composite-v1.png",
                "sha256": "4ee7a6aceaab8c3fa0d6668a63775b47a2736eec931f38241036633a7b9375ec",
                "recordId": "home-dana-reads-claude-composite-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.webp",
                    "sha256": "3ca30dc758a19a8f3409c21fc119c1c45ce3e2b0b20c93d8fbf88c2cfc6bc9c3",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v2.json",
                      "sha256": "9ae5c6e6dbbdeccaa257a805a07ce17996a7d32d467c6606e1cc229cae81d95c",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-reads-claude-composite-v1.png",
                      "sourceSha256": "4ee7a6aceaab8c3fa0d6668a63775b47a2736eec931f38241036633a7b9375ec",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.avif",
                    "sha256": "d3a203e01edf153a83784a9301923139386d25abdab534d7529af156c400f487",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v2.json",
                      "sha256": "9ae5c6e6dbbdeccaa257a805a07ce17996a7d32d467c6606e1cc229cae81d95c",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-reads-claude-composite-v1.png",
                      "sourceSha256": "4ee7a6aceaab8c3fa0d6668a63775b47a2736eec931f38241036633a7b9375ec",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.avif"
                    }
                  }
                ]
              },
              "media": "phone",
              "id": "brief-reading-context",
              "at": 0,
              "ar": [
                0,
                0,
                1,
                1
              ],
              "alt": "Dana examines a printed legal brief, her pen halted at a footnote. Claude is visible on the right edge with the long paper coat and grey visor. Keep Dana foreground left and Claude right; Marco waits in the doorway."
            },
            {
              "src": "/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.webp",
              "alternates": [
                "/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.avif"
              ],
              "canonicalSource": {
                "panelId": "home-dana-reads",
                "path": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-reads-claude-composite-v1.png",
                "sha256": "4ee7a6aceaab8c3fa0d6668a63775b47a2736eec931f38241036633a7b9375ec",
                "recordId": "home-dana-reads-claude-composite-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.webp",
                    "sha256": "3ca30dc758a19a8f3409c21fc119c1c45ce3e2b0b20c93d8fbf88c2cfc6bc9c3",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v2.json",
                      "sha256": "9ae5c6e6dbbdeccaa257a805a07ce17996a7d32d467c6606e1cc229cae81d95c",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-reads-claude-composite-v1.png",
                      "sourceSha256": "4ee7a6aceaab8c3fa0d6668a63775b47a2736eec931f38241036633a7b9375ec",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.avif",
                    "sha256": "d3a203e01edf153a83784a9301923139386d25abdab534d7529af156c400f487",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v2.json",
                      "sha256": "9ae5c6e6dbbdeccaa257a805a07ce17996a7d32d467c6606e1cc229cae81d95c",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-dana-reads-claude-composite-v1.png",
                      "sourceSha256": "4ee7a6aceaab8c3fa0d6668a63775b47a2736eec931f38241036633a7b9375ec",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-reads-claude-composite-v1-1600.avif"
                    }
                  }
                ]
              },
              "media": "phone",
              "id": "brief-footnote-evidence",
              "at": 1,
              "ar": [
                0.2246,
                0.54,
                0.488,
                0.3516
              ],
              "fit": "cover",
              "alt": "Dana’s halted pen and footnote 9 on the printed front of the legal brief."
            }
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.35
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
            0.7787081339712919,
            0.008501594048884165,
            0.215311004784689,
            0.512221041445271
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
              "x": 0.03,
              "y": 0.95,
              "w": 0.9,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.9240648648648649
              },
              "speech": {
                "id": "home-claude-stricken-b0-20261013",
                "src": "/comic/speech/home-20261013/home-claude-stricken-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 4.725533,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 33,
              "kind": "fear",
              "state": "fear",
              "who": "claude",
              "text": "I… wrote\nwhat you\nasked for.",
              "x": 0.0423,
              "y": 0.0138,
              "w": 0.84,
              "tail": [
                0.6078,
                0.1967
              ],
              "phone": {
                "x": 0.0278,
                "y": 0.3181,
                "w": 0.57034,
                "tail": [
                  0.6008,
                  0.2992
                ]
              },
              "speech": {
                "id": "home-brief-home-claude-stricken-b1",
                "src": "/comic/speech/home-20261012b/home-brief-home-claude-stricken-b1-eq-v1.mp3",
                "durationSeconds": 2.977959,
                "provider": "Fish Audio",
                "characterId": "claude",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "phoneArt": [
            0,
            0,
            1,
            1
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "views": [
            {
              "id": "preview-base",
              "at": 0,
              "alt": "Claude, stricken, the pages of his coat stilled, the visor still grey.",
              "fit": "cover",
              "ar": [
                0,
                0,
                1,
                0.86
              ],
              "src": "/comic/home/defect-pass-20261015/home-claude-stricken-claude-composite-v1-1600.webp",
              "canonicalSource": {
                "panelId": "home-claude-stricken",
                "path": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-claude-stricken-claude-composite-v1.png",
                "sha256": "0cd02c649ea35629f6a60e7d228e23d1c8556f32757ec9900690a74675efd88d",
                "recordId": "home-claude-stricken-claude-composite-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-stricken-claude-composite-v1-1600.webp",
                    "sha256": "b77d00e9780dc7f2f60481775006685f075f379a8db45ab24d975ad68377470d",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-claude-stricken-claude-composite-v1.png",
                      "sourceSha256": "0cd02c649ea35629f6a60e7d228e23d1c8556f32757ec9900690a74675efd88d",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-stricken-claude-composite-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-stricken-claude-composite-v1-1600.avif",
                    "sha256": "d392d8d44caeb0aea68e94907808d1d0ae841173e3cbe4af671cf50cd2319de8",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-claude-stricken-claude-composite-v1.png",
                      "sourceSha256": "0cd02c649ea35629f6a60e7d228e23d1c8556f32757ec9900690a74675efd88d",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-stricken-claude-composite-v1-1600.avif"
                    }
                  }
                ]
              },
              "alternates": [
                "/comic/home/defect-pass-20261015/home-claude-stricken-claude-composite-v1-1600.avif"
              ]
            },
            {
              "id": "preview-stack",
              "at": 1,
              "alt": "Claude, stricken, the pages of his coat stilled, the visor still grey.",
              "fit": "cover",
              "ar": [
                0,
                0,
                1,
                0.86
              ],
              "src": "/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.webp",
              "canonicalSource": {
                "panelId": "home-claude-stricken",
                "path": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-claude-stricken-plate-v1.png",
                "sha256": "d60ec55b89ec501022ebba5298df7241f718280324c64e8da0406444a23717fe",
                "recordId": "home-fix-brief-claude-stricken-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.webp",
                    "sha256": "6790915c7b1ace761aa062605dc6a59df9a5babc8b5a9fc485a250906c5846fc",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-claude-stricken-plate-v1.png",
                      "sourceSha256": "d60ec55b89ec501022ebba5298df7241f718280324c64e8da0406444a23717fe",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.avif",
                    "sha256": "3cf0be89c11e954e69810227bbd06e6bbf2b794f4d18483906fbd24963eb0b8f",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-claude-stricken-plate-v1.png",
                      "sourceSha256": "d60ec55b89ec501022ebba5298df7241f718280324c64e8da0406444a23717fe",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "layers": [
                {
                  "id": "base",
                  "role": "background",
                  "src": "/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-claude-stricken",
                    "path": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-claude-stricken-plate-v1.png",
                    "sha256": "d60ec55b89ec501022ebba5298df7241f718280324c64e8da0406444a23717fe",
                    "recordId": "home-fix-brief-claude-stricken-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.webp",
                        "sha256": "6790915c7b1ace761aa062605dc6a59df9a5babc8b5a9fc485a250906c5846fc",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-claude-stricken-plate-v1.png",
                          "sourceSha256": "d60ec55b89ec501022ebba5298df7241f718280324c64e8da0406444a23717fe",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.avif",
                        "sha256": "3cf0be89c11e954e69810227bbd06e6bbf2b794f4d18483906fbd24963eb0b8f",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-claude-stricken-plate-v1.png",
                          "sourceSha256": "d60ec55b89ec501022ebba5298df7241f718280324c64e8da0406444a23717fe",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-claude-stricken-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "claude",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-claude-stricken-claude-layer-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-claude-stricken",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-claude-stricken-claude-layer-v1.png",
                    "sha256": "05b2beaea42446138a4c5712bdfdec0bff8567e5d4f16e6771b0ea682bf121ec",
                    "recordId": "home-claude-stricken-claude-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-stricken-claude-layer-v1-1600.webp",
                        "sha256": "d557ac3aca49ae414e2b03b22cad51a982129a43200e568c6f3a70cc2c04c0b1",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-claude-stricken-claude-layer-v1.png",
                          "sourceSha256": "05b2beaea42446138a4c5712bdfdec0bff8567e5d4f16e6771b0ea682bf121ec",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-stricken-claude-layer-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-stricken-claude-layer-v1-1600.avif",
                        "sha256": "b7e97925c437f220a498ea648660e4e9aeccafa6d24f028ce681fb0a553b897f",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-claude-stricken-claude-layer-v1.png",
                          "sourceSha256": "05b2beaea42446138a4c5712bdfdec0bff8567e5d4f16e6771b0ea682bf121ec",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-stricken-claude-layer-v1-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "base",
                  "preset": "still"
                },
                {
                  "layerId": "claude",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 1
                }
              ]
            }
          ],
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.35
            },
            {
              "kind": "heartbeat",
              "delay": 1,
              "gain": 0.3
            }
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
            0.005980861244019139,
            0.5356004250797024,
            0.30023923444976075,
            0.4527098831030818
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
                "x": 0.03,
                "y": 0.03,
                "w": 0.65088
              },
              "speech": {
                "id": "home-brief-home-citation-dissolves-b0",
                "src": "/comic/speech/home-20261012b/home-brief-home-citation-dissolves-b0-eq-v1.mp3",
                "durationSeconds": 2.66449,
                "provider": "Fish Audio",
                "characterId": "dana",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "push",
            "beats": 4,
            "strength": 0.7
          },
          "phoneArt": [
            0,
            0,
            1,
            1
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "click",
              "gain": 0.4
            },
            {
              "kind": "impact",
              "delay": 0.5,
              "gain": 0.45
            }
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
            0.31399521531100477,
            0.5356004250797024,
            0.23086124401913877,
            0.4527098831030818
          ],
          "cropFocus": {
            "phone": [
              0.33474026,
              0.5
            ]
          },
          "phoneArt": [
            0,
            0,
            1,
            1
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
                "x": 0.1038,
                "y": 0.95,
                "w": 0.866197945945946
              },
              "speech": {
                "id": "home-thirty-one-b0-20261013",
                "src": "/comic/speech/home-20261013/home-thirty-one-b0-20261013-eq-tempo112-crest-v2.mp3",
                "durationSeconds": 3.177551,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "still"
          },
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "views": [
            {
              "id": "preview-base",
              "at": 0,
              "alt": "Claude on his knees among case printouts sorted into two piles, one tall and one short.",
              "fit": "cover",
              "ar": [
                0,
                0,
                1,
                1
              ],
              "src": "/comic/home/defect-pass-20261015/home-thirty-one-claude-composite-v1-1600.webp",
              "canonicalSource": {
                "panelId": "home-thirty-one",
                "path": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-thirty-one-claude-composite-v1.png",
                "sha256": "5e25aad9b63bcac1e838d321e22deb2930f3206a1e3e1542bfe4e26c035b097c",
                "recordId": "home-thirty-one-claude-composite-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-thirty-one-claude-composite-v1-1600.webp",
                    "sha256": "2cbafbcab826d39212d64bf1602f8a79e59cf64c255a3e674a1eb88234c84f7f",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-thirty-one-claude-composite-v1.png",
                      "sourceSha256": "5e25aad9b63bcac1e838d321e22deb2930f3206a1e3e1542bfe4e26c035b097c",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-thirty-one-claude-composite-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-thirty-one-claude-composite-v1-1600.avif",
                    "sha256": "1c98c5409e4f0b178b876cc1638bb7cbc0402ecb68cbd5db821600ae8e7bc125",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-thirty-one-claude-composite-v1.png",
                      "sourceSha256": "5e25aad9b63bcac1e838d321e22deb2930f3206a1e3e1542bfe4e26c035b097c",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-thirty-one-claude-composite-v1-1600.avif"
                    }
                  }
                ]
              },
              "alternates": [
                "/comic/home/defect-pass-20261015/home-thirty-one-claude-composite-v1-1600.avif"
              ]
            },
            {
              "id": "preview-stack",
              "at": 1,
              "alt": "Claude on his knees among case printouts sorted into two piles, one tall and one short.",
              "fit": "cover",
              "ar": [
                0,
                0,
                1,
                1
              ],
              "src": "/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.webp",
              "canonicalSource": {
                "panelId": "home-thirty-one",
                "path": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-thirty-one-plate-v1.png",
                "sha256": "c5609c35ca28fa2f8ca47dc2e35c2895ffcdd65da41216962a6e5a11ee35776d",
                "recordId": "home-fix-brief-thirty-one-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.webp",
                    "sha256": "9d8be381b4eb07360885f41d48a89ada48a653f70856e50f8b3729175436b2b1",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-thirty-one-plate-v1.png",
                      "sourceSha256": "c5609c35ca28fa2f8ca47dc2e35c2895ffcdd65da41216962a6e5a11ee35776d",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.avif",
                    "sha256": "29aad65591e888dc44d8694fed1fd4c46589ff7a248d518e13e2e08c84dd6f9b",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                      "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-thirty-one-plate-v1.png",
                      "sourceSha256": "c5609c35ca28fa2f8ca47dc2e35c2895ffcdd65da41216962a6e5a11ee35776d",
                      "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "layers": [
                {
                  "id": "base",
                  "role": "background",
                  "src": "/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-thirty-one",
                    "path": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-thirty-one-plate-v1.png",
                    "sha256": "c5609c35ca28fa2f8ca47dc2e35c2895ffcdd65da41216962a6e5a11ee35776d",
                    "recordId": "home-fix-brief-thirty-one-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.webp",
                        "sha256": "9d8be381b4eb07360885f41d48a89ada48a653f70856e50f8b3729175436b2b1",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-thirty-one-plate-v1.png",
                          "sourceSha256": "c5609c35ca28fa2f8ca47dc2e35c2895ffcdd65da41216962a6e5a11ee35776d",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.avif",
                        "sha256": "29aad65591e888dc44d8694fed1fd4c46589ff7a248d518e13e2e08c84dd6f9b",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-brief-thirty-one-plate-v1.png",
                          "sourceSha256": "c5609c35ca28fa2f8ca47dc2e35c2895ffcdd65da41216962a6e5a11ee35776d",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-brief-thirty-one-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "claude",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-thirty-one-claude-layer-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-thirty-one",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-thirty-one-claude-layer-v1.png",
                    "sha256": "92fab9afa99afdf87de1746b858951c9c4a559f423e0d5c2ef335231982984c0",
                    "recordId": "home-thirty-one-claude-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-thirty-one-claude-layer-v1-1600.webp",
                        "sha256": "fe557ec690fdc0ad53b85b35023c3a32f281210fabeb698553dfe5c34c04a015",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-thirty-one-claude-layer-v1.png",
                          "sourceSha256": "92fab9afa99afdf87de1746b858951c9c4a559f423e0d5c2ef335231982984c0",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-thirty-one-claude-layer-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-thirty-one-claude-layer-v1-1600.avif",
                        "sha256": "7d9917eeed9db9ae3d9d5418cbf7ea181d2532e63d3d9c53890480f503e05306",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-defect-pass-20261015/brief/home-thirty-one-claude-layer-v1.png",
                          "sourceSha256": "92fab9afa99afdf87de1746b858951c9c4a559f423e0d5c2ef335231982984c0",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-thirty-one-claude-layer-v1-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "base",
                  "preset": "still"
                },
                {
                  "layerId": "claude",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 1
                }
              ]
            }
          ],
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.5
            },
            {
              "kind": "paper",
              "delay": 2,
              "gain": 0.35
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
            0.5532296650717703,
            0.5356004250797024,
            0.4407894736842105,
            0.4527098831030818
          ],
          "cropFocus": {
            "phone": [
              0.5,
              0.33010502
            ]
          },
          "phoneArt": [
            0,
            0,
            1,
            1
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
                "x": 0.03,
                "y": 0.505,
                "w": 0.52449,
                "tail": [
                  0.28271,
                  0.18478
                ]
              },
              "speech": {
                "id": "home-brief-home-marco-doorway-b0",
                "src": "/comic/speech/home-20261012b/home-brief-home-marco-doorway-b0-eq-v1.mp3",
                "durationSeconds": 2.461315,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
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
                "x": 0.419,
                "y": 0.03,
                "w": 0.54833,
                "tail": [
                  0.6406,
                  0.3913
                ]
              },
              "speech": {
                "id": "home-brief-home-marco-doorway-b1",
                "src": "/comic/speech/home-20261012b/home-brief-home-marco-doorway-b1-eq-v1.mp3",
                "durationSeconds": 4.153469,
                "provider": "Fish Audio",
                "characterId": "dana",
                "gain": 0.85
              }
            }
          ],
          "motion": {
            "preset": "drift-right",
            "beats": 6,
            "strength": 0.5
          },
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "sfx": [
            {
              "kind": "door",
              "gain": 0.4
            },
            {
              "kind": "paper",
              "delay": 1,
              "gain": 0.35
            }
          ]
        }
      ]
    },
    {
      "id": "call",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/call/home-call-page-master-v1",
      "score": 0.35,
      "room": "office",
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.42,
            0.5
          ],
          "ar": [
            0,
            0,
            0.42,
            0.5
          ],
          "img": "home-call-alert",
          "alt": "Marco's phone lies on Dana's desk among legal papers, buzzing (ink vibration lines), its screen facing up toward the camera and Marco leaning over it; the screen shows a dark job-status card with a progress bar and a red 'running' dot. Marco's hand reaches for it; Dana looks up from her papers behind.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "buzz",
              "gain": 0.6
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 28.\n1:54 a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.3,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.4375311196911197
              },
              "speech": {
                "id": "home-call-alert-b0-20261013",
                "src": "/comic/speech/home-20261013/home-call-alert-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 3.090975,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Our contract job\njust woke up.",
              "x": 0.03,
              "y": 0.23,
              "w": 0.32672,
              "tail": [
                0.48996,
                0.33
              ],
              "phone": {
                "x": 0.12261,
                "y": 0.755,
                "w": 0.73845,
                "tail": [
                  0.48602,
                  0.33
                ]
              },
              "speech": {
                "id": "home-call-home-call-alert-b2-20261015",
                "src": "/comic/speech/home-20261015/home-call-home-call-alert-b2-eq-v1.mp3",
                "durationSeconds": 1.718277,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/call/home-call-alert-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/call/home-call-alert-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-call-alert",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-alert-plate-v1.png",
              "sha256": "ff1d22d2767fbec4c45b7628654f06b507ecfd4bc255672b280a9050dcb3d365",
              "recordId": "home-call-alert-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-alert-plate-v1-1600.webp",
                  "sha256": "b23cf17cc4cb7101a14281e2ac2c9c8b7fa9b6ba20b479d390c0805787cc509f",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-alert-plate-v1.png",
                    "sourceSha256": "ff1d22d2767fbec4c45b7628654f06b507ecfd4bc255672b280a9050dcb3d365",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-alert-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-alert-plate-v1-1600.avif",
                  "sha256": "06747fdb2b0c89add94921e2ef3a91d92acb3d5ec5519288f57f4df998e0d75b",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-alert-plate-v1.png",
                    "sourceSha256": "ff1d22d2767fbec4c45b7628654f06b507ecfd4bc255672b280a9050dcb3d365",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-alert-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.14129,
                0,
                0.71743,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.42,
            0,
            0.3,
            0.5
          ],
          "ar": [
            0.42,
            0,
            0.3,
            0.5
          ],
          "img": "home-call-task",
          "alt": "Marco holds his phone up so he and Dana can both read it, screen toward them (we see the phone at three-quarter angle with its screen visible to them and partly to us): a list of outgoing emails stacking up. Dana leans in, glasses on, pen in hand.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [
            {
              "kind": "buzz",
              "gain": 0.35,
              "delay": 1
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "It copies the newest\nquote into a contract.\nThen it sends it.",
              "x": 0.4435,
              "y": 0.0138,
              "w": 0.59074,
              "tail": [
                0.3412,
                0.1477
              ],
              "phone": {
                "x": 0.0336,
                "y": 0.3909,
                "w": 0.83234,
                "tail": [
                  0.2881,
                  0.3713
                ]
              },
              "speech": {
                "id": "home-call-home-call-task-b1-20261015",
                "src": "/comic/speech/home-20261015/home-call-home-call-task-b1-eq-v1.mp3",
                "durationSeconds": 3.390113,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/call/home-call-task-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/call/home-call-task-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.03125,
              1,
              0.9375
            ],
            "canonicalSource": {
              "panelId": "home-call-task",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-task-plate-v1.png",
              "sha256": "569cc4d03289dc8e35030c29f53b3c71182f5bf9ae8d447ce4f3bd7d8e43c766",
              "recordId": "home-call-task-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-task-plate-v1-1600.webp",
                  "sha256": "579f8394ab663d7d9190501cfb5403a79ce60175989ea2a32a8051068acdea9b",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-task-plate-v1.png",
                    "sourceSha256": "569cc4d03289dc8e35030c29f53b3c71182f5bf9ae8d447ce4f3bd7d8e43c766",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-task-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-task-plate-v1-1600.avif",
                  "sha256": "4e63009ddf6902b5bdfccc1a6117291c7024b80c835e2ffdef7f22c49a8a2d35",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-task-plate-v1.png",
                    "sourceSha256": "569cc4d03289dc8e35030c29f53b3c71182f5bf9ae8d447ce4f3bd7d8e43c766",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-task-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.11667,
                0,
                0.76667,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.72,
            0,
            0.28,
            0.5
          ],
          "ar": [
            0.72,
            0,
            0.28,
            0.5
          ],
          "img": "home-call-wrong",
          "alt": "Close on Dana taking the phone, eyes wide behind rectangular glasses, pointing her pen at the screen (screen faces her; we see it over her shoulder): an email with a contract attachment and a long recipients line.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.45
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "That's Gilmour &\nClark's\ncontract. Going to\nevery customer.",
              "x": 0.15079,
              "y": 0.03,
              "w": 0.5377,
              "tail": [
                0.41964,
                0.5
              ],
              "phone": {
                "x": 0.0276,
                "y": 0.526,
                "w": 0.83201,
                "tail": [
                  0.2706,
                  0.4639
                ]
              },
              "speech": {
                "id": "home-call-home-call-wrong-b1-20261015",
                "src": "/comic/speech/home-20261015/home-call-home-call-wrong-b1-eq-v1.mp3",
                "durationSeconds": 5.276735,
                "provider": "Fish Audio",
                "characterId": "dana",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "burst",
              "state": "panic",
              "who": "dana",
              "text": "Stop the job!",
              "x": 0.21031,
              "y": 0.605,
              "w": 0.41865,
              "tail": [
                0.41964,
                0.5
              ],
              "phone": {
                "x": 0.2928,
                "y": 0.0198,
                "w": 0.68332,
                "tail": [
                  0.2706,
                  0.2831
                ]
              },
              "speech": {
                "id": "home-call-home-call-wrong-b2-20261015",
                "src": "/comic/speech/home-20261015/home-call-home-call-wrong-b2-eq-v1.mp3",
                "durationSeconds": 1.358367,
                "provider": "Fish Audio",
                "characterId": "dana",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/call/home-call-wrong-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/call/home-call-wrong-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-call-wrong",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-wrong-plate-v1.png",
              "sha256": "2acbd59dcdfb78d249f0bf2b00ea68968675d4aebadd0ec61ed4d1a26e6b7ec3",
              "recordId": "home-call-wrong-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-wrong-plate-v1-1600.webp",
                  "sha256": "4487638bb5bc2fc50dcbc39b7755379d14113f63a614557b3e36108b00039251",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-wrong-plate-v1.png",
                    "sourceSha256": "2acbd59dcdfb78d249f0bf2b00ea68968675d4aebadd0ec61ed4d1a26e6b7ec3",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-wrong-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-wrong-plate-v1-1600.avif",
                  "sha256": "41b1d35aea308904758aafe67fd591b949c45d0f9b316ae914570b9490bfd42a",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-wrong-plate-v1.png",
                    "sourceSha256": "2acbd59dcdfb78d249f0bf2b00ea68968675d4aebadd0ec61ed4d1a26e6b7ec3",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-wrong-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.14087,
                0,
                0.71825,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0.5,
            0.28,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.28,
            0.5
          ],
          "img": "home-call-cant",
          "alt": "Marco stabbing at his phone with his thumb, sweat, panic; ink motion lines; the phone screen faces Marco (we see its plain back casing). Behind him the window and the night city.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "shadow"
          },
          "sfx": [
            {
              "kind": "click",
              "gain": 0.4
            },
            {
              "kind": "click",
              "gain": 0.4,
              "delay": 0.6
            },
            {
              "kind": "buzz",
              "gain": 0.4,
              "delay": 1.2
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "I can't. It's\nstill sending.",
              "x": 0.29886,
              "y": 0.03,
              "w": 0.44246,
              "tail": [
                0.52009,
                0.52
              ],
              "phone": {
                "x": 0.1611,
                "y": 0.5298,
                "w": 0.70256,
                "tail": [
                  0.493,
                  0.445
                ]
              },
              "speech": {
                "id": "home-call-home-call-wrong-b1",
                "src": "/comic/speech/home-20261012b/home-call-home-call-wrong-b1-eq-v1.mp3",
                "durationSeconds": 1.486077,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/call/home-call-cant-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/call/home-call-cant-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-call-cant",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-cant-plate-v1.png",
              "sha256": "eb0599e8ed9c1a329efc25d632ac371569b1c0906fc87b720fc828ce1e0a8e0d",
              "recordId": "home-call-cant-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-cant-plate-v1-1600.webp",
                  "sha256": "be3b17101c668e3dc1b21cba978ca37d6a4fc8ab8747dbb64c3f9525db31e49a",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-cant-plate-v1.png",
                    "sourceSha256": "eb0599e8ed9c1a329efc25d632ac371569b1c0906fc87b720fc828ce1e0a8e0d",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-cant-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-cant-plate-v1-1600.avif",
                  "sha256": "eea0204a32ca769e788fbc18b6ef53614cb37c702f31eeb0e78717abe90263b4",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-cant-plate-v1.png",
                    "sourceSha256": "eb0599e8ed9c1a329efc25d632ac371569b1c0906fc87b720fc828ce1e0a8e0d",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-cant-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.14222,
                0,
                0.71556,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.28,
            0.5,
            0.3,
            0.5
          ],
          "ar": [
            0.28,
            0.5,
            0.3,
            0.5
          ],
          "img": "home-call-card",
          "alt": "Dana slides a business card across the desk to Marco with two fingers (card face toward Marco, plain, a name line and a phone line drawn as marks); Marco already lifting his phone to his ear.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.3
            },
            {
              "kind": "ring",
              "gain": 0.4,
              "delay": 1.5
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Call Matt. He builds\nand secures these\nsystems.",
              "x": 0.4237,
              "y": 0.03,
              "w": 0.5463,
              "tail": [
                0.29,
                0.404
              ],
              "phone": {
                "x": 0.03,
                "y": 0.53,
                "w": 0.83832,
                "tail": [
                  0.22608,
                  0.41
                ]
              },
              "speech": {
                "id": "home-call-home-call-card-b1-20261015",
                "src": "/comic/speech/home-20261015/home-call-home-call-card-b1-eq-v1.mp3",
                "durationSeconds": 3.186939,
                "provider": "Fish Audio",
                "characterId": "dana",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Matt? Our job is\nsending the wrong\ncontract. To everyone.",
              "x": 0.37926,
              "y": 0.58,
              "w": 0.59074,
              "tail": [
                0.74,
                0.45733
              ],
              "phone": {
                "x": 0.20698,
                "y": 0.03,
                "w": 0.79748
              },
              "speech": {
                "id": "home-call-home-call-card-b2-20261015",
                "src": "/comic/speech/home-20261015/home-call-home-call-card-b2-eq-v1.mp3",
                "durationSeconds": 3.668753,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/call/home-call-card-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/call/home-call-card-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.03125,
              1,
              0.9375
            ],
            "canonicalSource": {
              "panelId": "home-call-card",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-card-plate-v1.png",
              "sha256": "93311947a5f8dee11d0ecbbfa5c406ae2b393ed464a070e673d10c33f9309354",
              "recordId": "home-call-card-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-card-plate-v1-1600.webp",
                  "sha256": "d963c83999734cb5a3e13814c639f9de7f61a8d65f8ed9cf6b07d10db576a3e7",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-card-plate-v1.png",
                    "sourceSha256": "93311947a5f8dee11d0ecbbfa5c406ae2b393ed464a070e673d10c33f9309354",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-card-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-card-plate-v1-1600.avif",
                  "sha256": "72ccb0eb9695c693a71d20a8c6ba93514c7832481689d1f017332f101c3082dd",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-card-plate-v1.png",
                    "sourceSha256": "93311947a5f8dee11d0ecbbfa5c406ae2b393ed464a070e673d10c33f9309354",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-card-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.1148,
                0,
                0.77041,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.58,
            0.5,
            0.42,
            0.5
          ],
          "ar": [
            0.58,
            0.5,
            0.42,
            0.5
          ],
          "img": "home-call-matt",
          "alt": "Matt at home at night, a dark kitchen lit by one pendant lamp, phone to his ear, already pulling on a jacket over his black T-shirt, car keys in hand. Tortoiseshell glasses, swept-up greying dark hair. Calm, focused.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [
            {
              "kind": "door",
              "gain": 0.3,
              "delay": 2
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Matt. He helps\ncompanies build and\nsecure these systems.",
              "characterIntro": true,
              "x": 0.58706,
              "y": 0.95,
              "w": 0.38293650793650796,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.8604324324324326
              },
              "speech": {
                "id": "home-call-home-call-matt-b1-20261015",
                "src": "/comic/speech/home-20261015/home-call-home-call-matt-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 4.003628,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Server room. Ten\nminutes. Touch\nnothing else.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.32672,
              "tail": [
                0.69085,
                0.34
              ],
              "phone": {
                "x": 0.0238,
                "y": 0.3093,
                "w": 0.7127,
                "tail": [
                  0.6935,
                  0.2615
                ]
              },
              "speech": {
                "id": "home-call-home-call-matt-b2-20261015",
                "src": "/comic/speech/home-20261015/home-call-home-call-matt-b2-eq-v1.mp3",
                "durationSeconds": 2.275556,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/call/home-call-matt-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/call/home-call-matt-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-call-matt",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-matt-plate-v1.png",
              "sha256": "c27db1dfdfbccc3db2f8576614d0aa980359b0376cc36a5105971060211a6f80",
              "recordId": "home-call-matt-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-matt-plate-v1-1600.webp",
                  "sha256": "c583771d119f0a89881aa28bb53e7e515c0168451b9e605f2bc8f56e669a8ec2",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-matt-plate-v1.png",
                    "sourceSha256": "c27db1dfdfbccc3db2f8576614d0aa980359b0376cc36a5105971060211a6f80",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-matt-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/call/home-call-matt-plate-v1-1600.avif",
                  "sha256": "ca6d0968f63984cc7d64c3434ea5eeed42b7797359ccc6a175041c3047dea9e9",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/call-encodings-v1.json",
                    "sha256": "f267dda51fd3aa438ae3cbff24dd096d1f3f8b18cf73681871848e6ab6f6af0a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/call/home-call-matt-plate-v1.png",
                    "sourceSha256": "c27db1dfdfbccc3db2f8576614d0aa980359b0376cc36a5105971060211a6f80",
                    "outputPath": "site/public/comic/home/rebuild-20261014/call/home-call-matt-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.14222,
                0,
                0.71556,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-call-alert",
            "r": [
              0,
              0,
              0.5833333333333334,
              0.3043478260869566
            ]
          },
          {
            "img": "home-call-task",
            "r": [
              0.5833333333333334,
              0,
              0.41666666666666663,
              0.3043478260869566
            ]
          },
          {
            "img": "home-call-wrong",
            "r": [
              0,
              0.3043478260869566,
              0.5,
              0.3913043478260869
            ]
          },
          {
            "img": "home-call-cant",
            "r": [
              0.5,
              0.3043478260869566,
              0.5,
              0.3913043478260869
            ]
          },
          {
            "img": "home-call-card",
            "r": [
              0,
              0.6956521739130435,
              0.41666666666666674,
              0.30434782608695654
            ]
          },
          {
            "img": "home-call-matt",
            "r": [
              0.41666666666666674,
              0.6956521739130435,
              0.5833333333333333,
              0.30434782608695654
            ]
          }
        ]
      ]
    },
    {
      "id": "agent",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/agent/home-agent-page-master-v2",
      "score": 0.45,
      "room": "servers",
      "panels": [
        {
          "at": 0,
          "room": "servers",
          "r": [
            0,
            0,
            0.36,
            1
          ],
          "ar": [
            0,
            0,
            0.36,
            1
          ],
          "img": "home-rogue-screens",
          "alt": "Tall dramatic shot down a server-room aisle: a wall of monitors at the far end shows dozens of envelope icons pouring out. The red-and-black rogue agent stands full-figure, human height, in the middle of the aisle with one arm flung out toward the monitors, as a full-colour translucent projection. Racks frame both sides.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "alarm",
              "gain": 0.3
            },
            {
              "kind": "whoosh",
              "gain": 0.4,
              "delay": 1
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Basement two.\nThe server room.\n2:07 a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.3541666666666667,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.96
              },
              "speech": {
                "id": "home-agent-home-rogue-screens-b1-20261015",
                "src": "/comic/speech/home-20261015/home-agent-home-rogue-screens-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 4.135193,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The rogue agent.\nSittler’s contract AI.\nIt sends without\nasking.",
              "characterIntro": true,
              "x": 0.03,
              "y": 0.95,
              "w": 0.4652777777777778,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.8378153153153153
              },
              "speech": {
                "id": "home-rogue-screens-b1-20261013",
                "src": "/comic/speech/home-20261013/home-rogue-screens-b1-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 5.123061,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-rogue-screens-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-rogue-screens-composite-v2-1600.avif"
            ],
            "ar": [
              0.02,
              0,
              0.96,
              1
            ],
            "canonicalSource": {
              "panelId": "home-rogue-screens",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-composite-v2.png",
              "sha256": "c97717287401540170bc8a4b1a13665281eb482931ba09e9095e4a6e2b816980",
              "recordId": "home-rogue-screens-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-rogue-screens-composite-v2-1600.webp",
                  "sha256": "ddfc448bd6956ef2425dbd4fc6b7a1e7ca0ceba17bfbaf62605b1bfcd92f744e",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-composite-v2.png",
                    "sourceSha256": "c97717287401540170bc8a4b1a13665281eb482931ba09e9095e4a6e2b816980",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-rogue-screens-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-rogue-screens-composite-v2-1600.avif",
                  "sha256": "7f9ca418facaeb82f64f61ca017ef408e483b7e08f02abcf52ffdb64ebef894c",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-composite-v2.png",
                    "sourceSha256": "c97717287401540170bc8a4b1a13665281eb482931ba09e9095e4a6e2b816980",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-rogue-screens-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.03034,
                0,
                0.93931,
                1
              ]
            }
          },
          "views": [
            {
              "id": "home-rogue-screens-projection",
              "at": 0,
              "alt": "Tall dramatic shot down a server-room aisle: a wall of monitors at the far end shows dozens of envelope icons pouring out. The red-and-black rogue agent stands full-figure, human height, in the middle of the aisle with one arm flung out toward the monitors, as a full-colour translucent projection. Racks frame both sides.",
              "src": "/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.webp",
              "ar": [
                0.02,
                0,
                0.96,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-rogue-screens",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-plate-v1.png",
                "sha256": "59b054c5fbb544362d56f622e7d314b652263736a4b06d849795193ffc3b01ad",
                "recordId": "home-rogue-screens-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.webp",
                    "sha256": "ac560d4656d868f87cc66e4adf9a72335729f5163d339191a7a55bb85ea89efa",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                      "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-plate-v1.png",
                      "sourceSha256": "59b054c5fbb544362d56f622e7d314b652263736a4b06d849795193ffc3b01ad",
                      "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.avif",
                    "sha256": "649d6bb708b575f414d81267634f2a435794edc23e02a363690f087087fca53a",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                      "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-plate-v1.png",
                      "sourceSha256": "59b054c5fbb544362d56f622e7d314b652263736a4b06d849795193ffc3b01ad",
                      "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.03034,
                  0,
                  0.93931,
                  1
                ]
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-rogue-screens",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-plate-v1.png",
                    "sha256": "59b054c5fbb544362d56f622e7d314b652263736a4b06d849795193ffc3b01ad",
                    "recordId": "home-rogue-screens-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.webp",
                        "sha256": "ac560d4656d868f87cc66e4adf9a72335729f5163d339191a7a55bb85ea89efa",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                          "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-plate-v1.png",
                          "sourceSha256": "59b054c5fbb544362d56f622e7d314b652263736a4b06d849795193ffc3b01ad",
                          "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.avif",
                        "sha256": "649d6bb708b575f414d81267634f2a435794edc23e02a363690f087087fca53a",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                          "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-plate-v1.png",
                          "sourceSha256": "59b054c5fbb544362d56f622e7d314b652263736a4b06d849795193ffc3b01ad",
                          "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-screens-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "rogue",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-rogue-screens-rogue-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-rogue-screens",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-rogue-layer-v2.png",
                    "sha256": "39da9fcd875274c75e5cda4249d87f212dee4bbde6ce343f7fd39bb1bf7fc3f9",
                    "recordId": "home-rogue-screens-rogue-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-rogue-screens-rogue-layer-v2-1600.webp",
                        "sha256": "b6a916118124f728e6fd43362374263f3e5bba03bc358d24f551296916a943b8",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-rogue-layer-v2.png",
                          "sourceSha256": "39da9fcd875274c75e5cda4249d87f212dee4bbde6ce343f7fd39bb1bf7fc3f9",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-rogue-screens-rogue-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-rogue-screens-rogue-layer-v2-1600.avif",
                        "sha256": "8573e8095108d6e46ef2ca798db9f108aa8c3aa427b8bd1a0067ff8a314e0a43",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-screens-rogue-layer-v2.png",
                          "sourceSha256": "39da9fcd875274c75e5cda4249d87f212dee4bbde6ce343f7fd39bb1bf7fc3f9",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-rogue-screens-rogue-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "push",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "rogue",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "servers",
          "r": [
            0.36,
            0,
            0.34,
            0.5
          ],
          "ar": [
            0.36,
            0,
            0.32,
            0.5
          ],
          "img": "home-rogue-speaks",
          "alt": "Close-up of the rogue agent: red helmet with white eye slits, chest up, both hands raised flicking glowing red envelope shapes toward the camera like cards. Racks with red status lights behind.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "light"
          },
          "sfx": [
            {
              "kind": "whoosh",
              "gain": 0.35
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "rogue",
              "text": "Contract updated.\nSending to\nall customers.",
              "x": 0.21517,
              "y": 0.455,
              "w": 0.44965,
              "tail": [
                0.44,
                0.28063
              ],
              "phone": {
                "x": 0.09589,
                "y": 0.455,
                "w": 0.70471,
                "tail": [
                  0.44,
                  0.28536
                ]
              },
              "speech": {
                "id": "home-agent-home-rogue-speaks-b1-20261015",
                "src": "/comic/speech/home-20261015/home-agent-home-rogue-speaks-b1-eq-v1.mp3",
                "durationSeconds": 3.204354,
                "provider": "ElevenLabs",
                "characterId": "rogue",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-rogue-speaks-composite-v3-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-rogue-speaks-composite-v3-1600.avif"
            ],
            "ar": [
              0,
              0.06055,
              1,
              0.87891
            ],
            "canonicalSource": {
              "panelId": "home-rogue-speaks",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-composite-v3.png",
              "sha256": "2535090a7b8e6846020f8e1c475ba33a2ed97efb620c1e45044f781d371bca95",
              "recordId": "home-rogue-speaks-composite-v3",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-rogue-speaks-composite-v3-1600.webp",
                  "sha256": "dfeba139a18aba20a77a5762387d7bd1a85935b70f6b3f150c0480df39c0f48f",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-composite-v3.png",
                    "sourceSha256": "2535090a7b8e6846020f8e1c475ba33a2ed97efb620c1e45044f781d371bca95",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-rogue-speaks-composite-v3-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-rogue-speaks-composite-v3-1600.avif",
                  "sha256": "a6ec445ba8413bd113ed620a3ce0b67b77767c5490eab76ca86a64113255f7a7",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-composite-v3.png",
                    "sourceSha256": "2535090a7b8e6846020f8e1c475ba33a2ed97efb620c1e45044f781d371bca95",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-rogue-speaks-composite-v3-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0,
                1,
                0.90476
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-rogue-speaks-projection",
              "at": 0,
              "alt": "Close-up of the rogue agent: red helmet with white eye slits, chest up, both hands raised flicking glowing red envelope shapes toward the camera like cards. Racks with red status lights behind.",
              "src": "/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.webp",
              "ar": [
                0,
                0.06055,
                1,
                0.87891
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-rogue-speaks",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-plate-v1.png",
                "sha256": "44ce8a18560ae502bd3776c26b3feba1bb4a7bd963e18a4c3a0252b3d82b76b2",
                "recordId": "home-rogue-speaks-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.webp",
                    "sha256": "1fe67bb1f94d7124f0e25044334419b56fe78f61ac050bbc47f1618d9c83ab36",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                      "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-plate-v1.png",
                      "sourceSha256": "44ce8a18560ae502bd3776c26b3feba1bb4a7bd963e18a4c3a0252b3d82b76b2",
                      "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.avif",
                    "sha256": "c7a43e7f124a711e6310ad30dc0e579590ee0a6e8fea03b8721dda50ea93a300",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                      "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-plate-v1.png",
                      "sourceSha256": "44ce8a18560ae502bd3776c26b3feba1bb4a7bd963e18a4c3a0252b3d82b76b2",
                      "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0,
                  0,
                  1,
                  0.90476
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-rogue-speaks",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-plate-v1.png",
                    "sha256": "44ce8a18560ae502bd3776c26b3feba1bb4a7bd963e18a4c3a0252b3d82b76b2",
                    "recordId": "home-rogue-speaks-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.webp",
                        "sha256": "1fe67bb1f94d7124f0e25044334419b56fe78f61ac050bbc47f1618d9c83ab36",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                          "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-plate-v1.png",
                          "sourceSha256": "44ce8a18560ae502bd3776c26b3feba1bb4a7bd963e18a4c3a0252b3d82b76b2",
                          "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.avif",
                        "sha256": "c7a43e7f124a711e6310ad30dc0e579590ee0a6e8fea03b8721dda50ea93a300",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                          "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-plate-v1.png",
                          "sourceSha256": "44ce8a18560ae502bd3776c26b3feba1bb4a7bd963e18a4c3a0252b3d82b76b2",
                          "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-rogue-speaks-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "rogue",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-rogue-speaks-rogue-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-rogue-speaks",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-rogue-layer-v3.png",
                    "sha256": "49ad4dfbc4f37e922550a112591cd1dda27dc1f84af19afea081c892c1f9b3ad",
                    "recordId": "home-rogue-speaks-rogue-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-rogue-speaks-rogue-layer-v3-1600.webp",
                        "sha256": "13cbd47cf8f15cee000ec2ec6eaedb048c68c8dceedf08ae9185758cbad726ff",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-rogue-layer-v3.png",
                          "sourceSha256": "49ad4dfbc4f37e922550a112591cd1dda27dc1f84af19afea081c892c1f9b3ad",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-rogue-speaks-rogue-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-rogue-speaks-rogue-layer-v3-1600.avif",
                        "sha256": "f0e973b08382aac03d8ae6080b7288d5213c0bb07f278496874d4b58e24460d7",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-rogue-speaks-rogue-layer-v3.png",
                          "sourceSha256": "49ad4dfbc4f37e922550a112591cd1dda27dc1f84af19afea081c892c1f9b3ad",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-rogue-speaks-rogue-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "light",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "rogue",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "servers",
          "r": [
            0.7,
            0,
            0.3,
            0.5
          ],
          "ar": [
            0.68,
            0,
            0.32,
            0.5
          ],
          "img": "home-marco-phone-floods",
          "alt": "Marco bursting through the server-room door with Matt right behind him; Marco's phone in his hand is flooded with stacked notifications (screen faces Marco, we see it at an angle over his thumb). Door still swinging.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [
            {
              "kind": "door",
              "gain": 0.5
            },
            {
              "kind": "buzz",
              "gain": 0.45,
              "delay": 0.5
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Four hundred\ncustomers.\nGilmour & Clark’s\ncontract.",
              "x": 0.55073,
              "y": 0.95,
              "w": 0.4192708333333333,
              "phone": {
                "x": 0.25995,
                "y": 0.95,
                "w": 0.7100486402027028
              },
              "speech": {
                "id": "home-agent-home-marco-phone-floods-b1-20261015",
                "src": "/comic/speech/home-20261015/home-agent-home-marco-phone-floods-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 3.560136,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/agent/home-marco-phone-floods-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/agent/home-marco-phone-floods-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.06055,
              1,
              0.87891
            ],
            "canonicalSource": {
              "panelId": "home-marco-phone-floods",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-marco-phone-floods-plate-v1.png",
              "sha256": "b5fb83a14c1a700d6496f9035465b3e38470fc3593302851a21490ac263ef198",
              "recordId": "home-marco-phone-floods-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-marco-phone-floods-plate-v1-1600.webp",
                  "sha256": "ab716ef9d82dc3a9d4becc58c24f5d8b97ec2072cc471d1b4bc116cc4011f30d",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                    "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-marco-phone-floods-plate-v1.png",
                    "sourceSha256": "b5fb83a14c1a700d6496f9035465b3e38470fc3593302851a21490ac263ef198",
                    "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-marco-phone-floods-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-marco-phone-floods-plate-v1-1600.avif",
                  "sha256": "2901c18b01b8793c86e7183ba40c2f77aff38b37e90f7bc51ccafee9bd9c4ae6",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                    "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-marco-phone-floods-plate-v1.png",
                    "sourceSha256": "b5fb83a14c1a700d6496f9035465b3e38470fc3593302851a21490ac263ef198",
                    "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-marco-phone-floods-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.05087,
                1,
                0.89826
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "servers",
          "r": [
            0.36,
            0.5,
            0.24,
            0.5
          ],
          "ar": [
            0.36,
            0.5,
            0.21,
            0.5
          ],
          "img": "home-matt-pauses",
          "alt": "Matt at the operator console, one finger pressing a single job's pause control; the console monitor faces Matt (we see it from beside him) and shows a list of jobs with one highlighted row. Focused, steady hands.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "click",
              "gain": 0.5
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Pause this job.\nOnly this one.",
              "x": 0.09955,
              "y": 0.03,
              "w": 0.6,
              "tail": [
                0.39955,
                0.4
              ],
              "phone": {
                "x": 0.06577,
                "y": 0.505,
                "w": 0.71322,
                "tail": [
                  0.39734,
                  0.4
                ]
              },
              "speech": {
                "id": "home-agent-continued-1-home-cable-pull-b0",
                "src": "/comic/speech/home-20261012b/home-agent-continued-1-home-cable-pull-b0-eq-v1.mp3",
                "durationSeconds": 1.811156,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/agent/home-matt-pauses-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/agent/home-matt-pauses-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-matt-pauses",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-matt-pauses-plate-v1.png",
              "sha256": "8821afad903a0b67da6c243ed099703d8efd47031eeb5fb98302393a29a6e73e",
              "recordId": "home-matt-pauses-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-matt-pauses-plate-v1-1600.webp",
                  "sha256": "96a41b09bc18d26ed856dcd531ec110358c54113215915c8adcb32432fcfce01",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                    "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-matt-pauses-plate-v1.png",
                    "sourceSha256": "8821afad903a0b67da6c243ed099703d8efd47031eeb5fb98302393a29a6e73e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-matt-pauses-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-matt-pauses-plate-v1-1600.avif",
                  "sha256": "96a8ad202f27ac1f2d8dc2dfe81bd8e3af88251b72c25ce1d8b2ea4549e7fd4b",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                    "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-matt-pauses-plate-v1.png",
                    "sourceSha256": "8821afad903a0b67da6c243ed099703d8efd47031eeb5fb98302393a29a6e73e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-matt-pauses-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.01203,
                0,
                0.97595,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "servers",
          "r": [
            0.6,
            0.5,
            0.18,
            0.5
          ],
          "ar": [
            0.57,
            0.5,
            0.21,
            0.5
          ],
          "img": "home-screens-dark",
          "alt": "The rogue agent breaking apart into red pixel fragments as it switches off, half its body already dissolving; behind it the monitor wall goes dark one screen at a time.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "shadow"
          },
          "sfx": [
            {
              "kind": "impact",
              "gain": 0.35
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "rogue",
              "text": "Task\ncomplete.",
              "x": 0.28439,
              "y": 0.03,
              "w": 0.43122,
              "tail": [
                0.5,
                0.3009
              ],
              "phone": {
                "x": 0.2436,
                "y": 0.03,
                "w": 0.55019,
                "tail": [
                  0.5,
                  0.3009
                ]
              },
              "speech": {
                "id": "home-agent-home-screens-dark-b1-20261015",
                "src": "/comic/speech/home-20261015/home-agent-home-screens-dark-b1-eq-v1.mp3",
                "durationSeconds": 1.207438,
                "provider": "ElevenLabs",
                "characterId": "rogue",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Sending stopped. Four\nhundred had\nalready gone.",
              "x": 0.20413,
              "y": 0.95,
              "w": 0.7658730158730159,
              "phone": {
                "x": 0.1691,
                "y": 0.95,
                "w": 0.8008953667953669
              },
              "speech": {
                "id": "home-screens-dark-b0-20261013",
                "src": "/comic/speech/home-20261013/home-screens-dark-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 3.561293,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-screens-dark-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-screens-dark-composite-v2-1600.avif"
            ],
            "ar": [
              0.00222,
              0,
              0.99556,
              1
            ],
            "canonicalSource": {
              "panelId": "home-screens-dark",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-composite-v2.png",
              "sha256": "bd8a2b4cd3b8c6423ffa2bcb93a4b02087278ba08e3f837d5500dc9ccea4610b",
              "recordId": "home-screens-dark-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-screens-dark-composite-v2-1600.webp",
                  "sha256": "e8d0baa72d66d06b4de94d389225beece4767017cb8e243655c1c8540cfd9934",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-composite-v2.png",
                    "sourceSha256": "bd8a2b4cd3b8c6423ffa2bcb93a4b02087278ba08e3f837d5500dc9ccea4610b",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-screens-dark-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-screens-dark-composite-v2-1600.avif",
                  "sha256": "fb2a47708f59078bae4b87e4d2cc1ec6cc16366728517e1efc461e4adf2c2e55",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-composite-v2.png",
                    "sourceSha256": "bd8a2b4cd3b8c6423ffa2bcb93a4b02087278ba08e3f837d5500dc9ccea4610b",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-screens-dark-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.01295,
                0,
                0.9741,
                1
              ]
            }
          },
          "views": [
            {
              "id": "home-screens-dark-projection",
              "at": 0,
              "alt": "The rogue agent breaking apart into red pixel fragments as it switches off, half its body already dissolving; behind it the monitor wall goes dark one screen at a time.",
              "src": "/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.webp",
              "ar": [
                0.00222,
                0,
                0.99556,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-screens-dark",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-plate-v1.png",
                "sha256": "0962fbadee0da0f49acb528301c9b0dbd51e2de2615c6cd03422f23f8afea51e",
                "recordId": "home-screens-dark-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.webp",
                    "sha256": "df4b76a3a32dd5f9400c317b1667f27f4e71db1aaabfd402da6867f42791c65a",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                      "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-plate-v1.png",
                      "sourceSha256": "0962fbadee0da0f49acb528301c9b0dbd51e2de2615c6cd03422f23f8afea51e",
                      "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.avif",
                    "sha256": "bf5ab1df5d97e126883d6fe054a1ffd5a627a52ae0bebba17b998789b15b8aad",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                      "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-plate-v1.png",
                      "sourceSha256": "0962fbadee0da0f49acb528301c9b0dbd51e2de2615c6cd03422f23f8afea51e",
                      "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.01295,
                  0,
                  0.9741,
                  1
                ]
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-screens-dark",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-plate-v1.png",
                    "sha256": "0962fbadee0da0f49acb528301c9b0dbd51e2de2615c6cd03422f23f8afea51e",
                    "recordId": "home-screens-dark-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.webp",
                        "sha256": "df4b76a3a32dd5f9400c317b1667f27f4e71db1aaabfd402da6867f42791c65a",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                          "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-plate-v1.png",
                          "sourceSha256": "0962fbadee0da0f49acb528301c9b0dbd51e2de2615c6cd03422f23f8afea51e",
                          "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.avif",
                        "sha256": "bf5ab1df5d97e126883d6fe054a1ffd5a627a52ae0bebba17b998789b15b8aad",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                          "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-plate-v1.png",
                          "sourceSha256": "0962fbadee0da0f49acb528301c9b0dbd51e2de2615c6cd03422f23f8afea51e",
                          "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-screens-dark-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "rogue",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-screens-dark-rogue-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-screens-dark",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-rogue-layer-v2.png",
                    "sha256": "a1afa869829394ac2256583e42a3288d319cf02c71c8ae9701bf0905e4d9f260",
                    "recordId": "home-screens-dark-rogue-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-screens-dark-rogue-layer-v2-1600.webp",
                        "sha256": "f2192fcba3c140ce27790b70e7757224ba86b5a5345dbb6372c899ce57a9b449",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-rogue-layer-v2.png",
                          "sourceSha256": "a1afa869829394ac2256583e42a3288d319cf02c71c8ae9701bf0905e4d9f260",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-screens-dark-rogue-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-screens-dark-rogue-layer-v2-1600.avif",
                        "sha256": "46662850bc44ee8c2f7748b7ef2d5b5de675bccd70cc3662d44316e2e5c00a77",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-screens-dark-rogue-layer-v2.png",
                          "sourceSha256": "a1afa869829394ac2256583e42a3288d319cf02c71c8ae9701bf0905e4d9f260",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-screens-dark-rogue-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "shadow",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "rogue",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "servers",
          "r": [
            0.78,
            0.5,
            0.22,
            0.5
          ],
          "ar": [
            0.78,
            0.5,
            0.22,
            0.5
          ],
          "img": "home-matt-asks",
          "alt": "Matt turns to Marco in the red-lit aisle, hard question in his eyes; Marco rubbing the back of his neck, ashamed, phone lowered.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Who gave it\npermission to send?",
              "x": 0.37,
              "y": 0.43,
              "w": 0.6,
              "tail": [
                0.72,
                0.30891
              ],
              "phone": {
                "x": 0.31772,
                "y": 0.43,
                "w": 0.67958,
                "tail": [
                  0.72357,
                  0.31
                ]
              },
              "speech": {
                "id": "home-agent-continued-1-home-matt-rises-b0",
                "src": "/comic/speech/home-20261012b/home-agent-continued-1-home-matt-rises-b0-eq-v1.mp3",
                "durationSeconds": 1.625397,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "We did. Last\nmonth. To\nsave time.",
              "x": 0.05874,
              "y": 0.63,
              "w": 0.50253,
              "tail": [
                0.31,
                0.32903
              ],
              "phone": {
                "x": 0.03,
                "y": 0.68,
                "w": 0.62466,
                "tail": [
                  0.30692,
                  0.33
                ]
              },
              "speech": {
                "id": "home-agent-continued-1-home-marco-admits-b1",
                "src": "/comic/speech/home-20261012b/home-agent-continued-1-home-marco-admits-b1-eq-v1.mp3",
                "durationSeconds": 3.436553,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/agent/home-matt-asks-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/agent/home-matt-asks-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.00284,
              1,
              0.99432
            ],
            "canonicalSource": {
              "panelId": "home-matt-asks",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-matt-asks-plate-v1.png",
              "sha256": "2db9f302ab695ec5d61c22be9b59620c71f504cbc786b6ab24678356e5f024b9",
              "recordId": "home-matt-asks-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-matt-asks-plate-v1-1600.webp",
                  "sha256": "bacb540ec83d9224ab55f30797f64e463a0489015884ee75fc25fe55def273ba",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                    "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-matt-asks-plate-v1.png",
                    "sourceSha256": "2db9f302ab695ec5d61c22be9b59620c71f504cbc786b6ab24678356e5f024b9",
                    "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-matt-asks-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/agent/home-matt-asks-plate-v1-1600.avif",
                  "sha256": "32b7b1ab59b984cc0c8cbe62e8efc2221703cf0b884af0d68b8f147cb2dde08f",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/agent-encodings-v2.json",
                    "sha256": "beee5f0e4e558ca362ac376319fcf0a8bf5c4df6c6ac982e40f2191352d87de5",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/agent/home-matt-asks-plate-v1.png",
                    "sourceSha256": "2db9f302ab695ec5d61c22be9b59620c71f504cbc786b6ab24678356e5f024b9",
                    "outputPath": "site/public/comic/home/rebuild-20261014/agent/home-matt-asks-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.00798,
                0,
                0.98404,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-rogue-screens",
            "r": [
              0,
              0,
              0.36000000000000004,
              0.32193812685407547
            ]
          },
          {
            "img": "home-rogue-speaks",
            "r": [
              0.36000000000000004,
              0,
              0.6399999999999999,
              0.32193812685407547
            ]
          },
          {
            "img": "home-marco-phone-floods",
            "r": [
              0,
              0.32193812685407547,
              0.6037735849056604,
              0.3037152140132787
            ]
          },
          {
            "img": "home-matt-pauses",
            "r": [
              0.6037735849056604,
              0.32193812685407547,
              0.39622641509433965,
              0.3037152140132787
            ]
          },
          {
            "img": "home-screens-dark",
            "r": [
              0,
              0.6256533408673541,
              0.48837209302325574,
              0.37434665913264586
            ]
          },
          {
            "img": "home-matt-asks",
            "r": [
              0.48837209302325574,
              0.6256533408673541,
              0.5116279069767442,
              0.37434665913264586
            ]
          }
        ]
      ],
      "villains": [
        "rogue"
      ]
    },
    {
      "id": "codex",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/codex/home-codex-page-master-v2",
      "score": 0.35,
      "room": "office",
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.42,
            0.5
          ],
          "ar": [
            0,
            0,
            0.42,
            0.5
          ],
          "img": "home-codex-reaches",
          "alt": "Marco at his desk, monitor facing him, grins and points at the quote table on screen; beside him the Codex agent stands as a full-colour translucent projection, fist raised to his chest, eager.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "whoosh",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31.\n3:15 a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.3,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.2554362162162162
              },
              "speech": {
                "id": "home-codex-reaches-b0-20261013",
                "src": "/comic/speech/home-20261013/home-codex-reaches-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 2.959887,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Codex. An AI\nthat builds. Exactly\nwhat it’s told.",
              "characterIntro": true,
              "x": 0.60294,
              "y": 0.95,
              "w": 0.3670634920634921,
              "phone": {
                "x": 0.48201,
                "y": 0.95,
                "w": 0.4879945945945946
              },
              "speech": {
                "id": "home-codex-reaches-b1-20261013",
                "src": "/comic/speech/home-20261013/home-codex-reaches-b1-20261013-eq-tempo112-crest-v2.mp3",
                "durationSeconds": 4.956009,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Fix the quote.\nAll of it.",
              "x": 0.41278,
              "y": 0.03,
              "w": 0.29497,
              "tail": [
                0.56027,
                0.42
              ],
              "phone": {
                "x": 0.03,
                "y": 0.28,
                "w": 0.35534,
                "tail": [
                  0.56,
                  0.39701
                ]
              },
              "speech": {
                "id": "home-codex-home-codex-reaches-b2",
                "src": "/comic/speech/home-20261012b/home-codex-home-codex-reaches-b2-eq-v1.mp3",
                "durationSeconds": 1.439637,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "I can fix\nall of it.\nNine seconds.",
              "x": 0.6909,
              "y": 0.33,
              "w": 0.2791,
              "tail": [
                0.84152,
                0.2251
              ],
              "phone": {
                "x": 0.03,
                "y": 0.53,
                "w": 0.34594,
                "tail": [
                  0.84,
                  0.1461
                ]
              },
              "speech": {
                "id": "home-codex-home-codex-reaches-b3",
                "src": "/comic/speech/home-20261012b/home-codex-home-codex-reaches-b3-eq-v1.mp3",
                "durationSeconds": 2.795102,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-reaches-composite-v3-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-reaches-composite-v3-1600.avif"
            ],
            "ar": [
              0.00222,
              0,
              0.99556,
              1
            ],
            "canonicalSource": {
              "panelId": "home-codex-reaches",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-composite-v3.png",
              "sha256": "0b456041e0b259d87f96766f94c528d0be891847a336dc5bf14974229a853bac",
              "recordId": "home-codex-reaches-composite-v3",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-reaches-composite-v3-1600.webp",
                  "sha256": "5982b7eaf4ed84970817d7385aa78d31950d3300ac20c0b3acdd4f78e31fa270",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-composite-v3.png",
                    "sourceSha256": "0b456041e0b259d87f96766f94c528d0be891847a336dc5bf14974229a853bac",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-reaches-composite-v3-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-reaches-composite-v3-1600.avif",
                  "sha256": "7c3c08464150c0e1fe6478cb31a76adc72eb68b22cd872034201b9ab7c1dd602",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-composite-v3.png",
                    "sourceSha256": "0b456041e0b259d87f96766f94c528d0be891847a336dc5bf14974229a853bac",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-reaches-composite-v3-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.096,
                1,
                0.77049
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-codex-reaches-projection",
              "at": 0,
              "alt": "Marco at his desk, monitor facing him, grins and points at the quote table on screen; beside him the Codex agent stands as a full-colour translucent projection, fist raised to his chest, eager.",
              "src": "/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.webp",
              "ar": [
                0.00222,
                0,
                0.99556,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-reaches",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-plate-v1.png",
                "sha256": "72db2fca5c6d7849cd1e52eeae945982f08de60d4f921db6fe8a78c3b0748fd9",
                "recordId": "home-codex-reaches-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.webp",
                    "sha256": "4b2acce38dee6c8ca1bbcd6d693513f28ef8e8e72829ce29ccaf51fb9dcef32f",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                      "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-plate-v1.png",
                      "sourceSha256": "72db2fca5c6d7849cd1e52eeae945982f08de60d4f921db6fe8a78c3b0748fd9",
                      "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.avif",
                    "sha256": "2551b9f54bc57804ed7edba47aa8afde8e77b4a036d6669129c96a3178ce1971",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                      "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-plate-v1.png",
                      "sourceSha256": "72db2fca5c6d7849cd1e52eeae945982f08de60d4f921db6fe8a78c3b0748fd9",
                      "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0,
                  0.096,
                  1,
                  0.77049
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-reaches",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-plate-v1.png",
                    "sha256": "72db2fca5c6d7849cd1e52eeae945982f08de60d4f921db6fe8a78c3b0748fd9",
                    "recordId": "home-codex-reaches-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.webp",
                        "sha256": "4b2acce38dee6c8ca1bbcd6d693513f28ef8e8e72829ce29ccaf51fb9dcef32f",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                          "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-plate-v1.png",
                          "sourceSha256": "72db2fca5c6d7849cd1e52eeae945982f08de60d4f921db6fe8a78c3b0748fd9",
                          "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.avif",
                        "sha256": "2551b9f54bc57804ed7edba47aa8afde8e77b4a036d6669129c96a3178ce1971",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                          "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-plate-v1.png",
                          "sourceSha256": "72db2fca5c6d7849cd1e52eeae945982f08de60d4f921db6fe8a78c3b0748fd9",
                          "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-reaches-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-reaches-codex-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-reaches",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-codex-layer-v3.png",
                    "sha256": "549886b65f6d457153a02613a1099d039e0ef70eb898eb458bdcfa0b13764a36",
                    "recordId": "home-codex-reaches-codex-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-reaches-codex-layer-v3-1600.webp",
                        "sha256": "81bb1ebdfce95f537d6abf9e8c6d6e824782cdd7b71e679b8d5c65d5b844fa53",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-codex-layer-v3.png",
                          "sourceSha256": "549886b65f6d457153a02613a1099d039e0ef70eb898eb458bdcfa0b13764a36",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-reaches-codex-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-reaches-codex-layer-v3-1600.avif",
                        "sha256": "9bfd824ba59f379b4de044eaf8d6a11842060e5e3c1d7666b7d46d2a23aab19c",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-reaches-codex-layer-v3.png",
                          "sourceSha256": "549886b65f6d457153a02613a1099d039e0ef70eb898eb458bdcfa0b13764a36",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-reaches-codex-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "push",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.42,
            0,
            0.3,
            0.5
          ],
          "ar": [
            0.42,
            0,
            0.3,
            0.5
          ],
          "img": "home-matt-stops",
          "alt": "Matt steps in between, raising one open palm toward the camera to stop someone off-panel (Codex, not shown). Firm but calm.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "impact",
              "gain": 0.2
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Wait.",
              "x": 0.73,
              "y": 0.03,
              "w": 0.24,
              "tail": [
                0.41,
                0.25467
              ],
              "phone": {
                "x": 0.67846,
                "y": 0.03,
                "w": 0.33286,
                "tail": [
                  0.41,
                  0.18276
                ]
              },
              "speech": {
                "id": "home-codex-home-matt-stops-b1-20261015",
                "src": "/comic/speech/home-20261015/home-codex-home-matt-stops-b1-eq-v1.mp3",
                "durationSeconds": 0.464399,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/codex/home-matt-stops-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/codex/home-matt-stops-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.03125,
              1,
              0.9375
            ],
            "canonicalSource": {
              "panelId": "home-matt-stops",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-matt-stops-plate-v1.png",
              "sha256": "3df272e9153d7b64d7ec63c6f888131e9fa68927ed6f9a572212bcad78b8f9a7",
              "recordId": "home-matt-stops-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-stops-plate-v1-1600.webp",
                  "sha256": "2740896f72fda6de532da9a32b035567c0f92da7faf97c4cb5de9cbd21d2a327",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                    "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-matt-stops-plate-v1.png",
                    "sourceSha256": "3df272e9153d7b64d7ec63c6f888131e9fa68927ed6f9a572212bcad78b8f9a7",
                    "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-stops-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-stops-plate-v1-1600.avif",
                  "sha256": "4ef89d0558177768060a9ecb8bbccd47eef96d4f692240ca09410caa7e9f0ae1",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                    "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-matt-stops-plate-v1.png",
                    "sourceSha256": "3df272e9153d7b64d7ec63c6f888131e9fa68927ed6f9a572212bcad78b8f9a7",
                    "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-stops-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.0236,
                1,
                0.70588
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.72,
            0,
            0.28,
            0.5
          ],
          "ar": [
            0.72,
            0,
            0.28,
            0.5
          ],
          "img": "home-codex-literal",
          "alt": "Codex projection holds up a projected copy of the old rate card in one gauntlet, presenting it proudly; the card is drawn as solid comic paper shape inside the projection light.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "light"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "From the same\nrate card. It’s\nthe one I have.",
              "x": 0.26687,
              "y": 0.23,
              "w": 0.46627,
              "tail": [
                0.5,
                0.1317
              ],
              "phone": {
                "x": 0.0747,
                "y": 0.2197,
                "w": 0.77286,
                "tail": [
                  0.45,
                  0.1541
                ]
              },
              "speech": {
                "id": "home-codex-home-codex-literal-b0",
                "src": "/comic/speech/home-20261012b/home-codex-home-codex-literal-b0-eq-v1.mp3",
                "durationSeconds": 2.716735,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-literal-composite-v3-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-literal-composite-v3-1600.avif"
            ],
            "ar": [
              0.00222,
              0,
              0.99556,
              1
            ],
            "canonicalSource": {
              "panelId": "home-codex-literal",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-composite-v3.png",
              "sha256": "c76d15a5c7b71b5578ba3753cff07f0529b5ba234340e2327c1bb9bfa741a300",
              "recordId": "home-codex-literal-composite-v3",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-literal-composite-v3-1600.webp",
                  "sha256": "1e6cc2d473507ac45e20191c98e5d770d82c05e0ee663eb7daa79c3c71afa8b9",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-composite-v3.png",
                    "sourceSha256": "c76d15a5c7b71b5578ba3753cff07f0529b5ba234340e2327c1bb9bfa741a300",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-literal-composite-v3-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-literal-composite-v3-1600.avif",
                  "sha256": "ebba7f08088249c3486135edb09df541f041160b3c63b8218fa3cabb51e650fc",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-composite-v3.png",
                    "sourceSha256": "c76d15a5c7b71b5578ba3753cff07f0529b5ba234340e2327c1bb9bfa741a300",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-literal-composite-v3-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.0344,
                1,
                0.75862
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-codex-literal-projection",
              "at": 0,
              "alt": "Codex projection holds up a projected copy of the old rate card in one gauntlet, presenting it proudly; the card is drawn as solid comic paper shape inside the projection light.",
              "src": "/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.webp",
              "ar": [
                0.00222,
                0,
                0.99556,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-literal",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-plate-v1.png",
                "sha256": "f0fb6d4ab726dabb79dea943d45bc8be416a59d0f6f21522e3348afba6affea7",
                "recordId": "home-codex-literal-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.webp",
                    "sha256": "778540a696ad6cc7bb5d12eed106fe3a9d136dc53ce6b1964ac86d22c8da7b9c",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                      "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-plate-v1.png",
                      "sourceSha256": "f0fb6d4ab726dabb79dea943d45bc8be416a59d0f6f21522e3348afba6affea7",
                      "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.avif",
                    "sha256": "04f4481f89268a4d180ae9312142b84e21e7f058db2d3b3acc3fd7c896396dc1",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                      "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-plate-v1.png",
                      "sourceSha256": "f0fb6d4ab726dabb79dea943d45bc8be416a59d0f6f21522e3348afba6affea7",
                      "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0,
                  0.0344,
                  1,
                  0.75862
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-literal",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-plate-v1.png",
                    "sha256": "f0fb6d4ab726dabb79dea943d45bc8be416a59d0f6f21522e3348afba6affea7",
                    "recordId": "home-codex-literal-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.webp",
                        "sha256": "778540a696ad6cc7bb5d12eed106fe3a9d136dc53ce6b1964ac86d22c8da7b9c",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                          "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-plate-v1.png",
                          "sourceSha256": "f0fb6d4ab726dabb79dea943d45bc8be416a59d0f6f21522e3348afba6affea7",
                          "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.avif",
                        "sha256": "04f4481f89268a4d180ae9312142b84e21e7f058db2d3b3acc3fd7c896396dc1",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                          "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-plate-v1.png",
                          "sourceSha256": "f0fb6d4ab726dabb79dea943d45bc8be416a59d0f6f21522e3348afba6affea7",
                          "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-literal-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-literal-codex-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-literal",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-codex-layer-v3.png",
                    "sha256": "352422fa5a2d531337cd7b6717eb0d896321af1109c259c88f0dcafd7078e69d",
                    "recordId": "home-codex-literal-codex-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-literal-codex-layer-v3-1600.webp",
                        "sha256": "d034503706e26abfdf13df57d73115f381785787b6dc0ce0d1bf468ad28fb9a0",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-codex-layer-v3.png",
                          "sourceSha256": "352422fa5a2d531337cd7b6717eb0d896321af1109c259c88f0dcafd7078e69d",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-literal-codex-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-literal-codex-layer-v3-1600.avif",
                        "sha256": "3bf3d2dddd558efb2f99fb09f6d6368d99883a821dc53ed307006c779b72fcda",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-literal-codex-layer-v3.png",
                          "sourceSha256": "352422fa5a2d531337cd7b6717eb0d896321af1109c259c88f0dcafd7078e69d",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-literal-codex-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "light",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0.5,
            0.28,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.28,
            0.5
          ],
          "img": "home-matt-close",
          "alt": "Close on Matt, tortoiseshell glasses, looking off-panel with quiet authority.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Not yet.\nAsk them first.",
              "x": 0.31709,
              "y": 0.03,
              "w": 0.46627,
              "tail": [
                0.55022,
                0.43
              ],
              "phone": {
                "x": 0.1726,
                "y": 0.555,
                "w": 0.79123,
                "tail": [
                  0.55,
                  0.40988
                ]
              },
              "speech": {
                "id": "home-codex-home-matt-close-b1-20261015",
                "src": "/comic/speech/home-20261015/home-codex-home-matt-close-b1-eq-v1.mp3",
                "durationSeconds": 1.486077,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/codex/home-matt-close-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/codex/home-matt-close-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-matt-close",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-matt-close-plate-v1.png",
              "sha256": "240abb23b5df7881f1e9d2bc2cd71a9ca0e6c48ea13fd899dc7d778f0cbb54eb",
              "recordId": "home-matt-close-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-close-plate-v1-1600.webp",
                  "sha256": "dbc3821673e8843b2a4c4bb04608a8d8d659e39b868ba2c50306991ef56bd938",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                    "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-matt-close-plate-v1.png",
                    "sourceSha256": "240abb23b5df7881f1e9d2bc2cd71a9ca0e6c48ea13fd899dc7d778f0cbb54eb",
                    "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-close-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-close-plate-v1-1600.avif",
                  "sha256": "6001903ec897107b22b0f3a57e76e56874143bc4b707fc73a2e48d00d7518071",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                    "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-matt-close-plate-v1.png",
                    "sourceSha256": "240abb23b5df7881f1e9d2bc2cd71a9ca0e6c48ea13fd899dc7d778f0cbb54eb",
                    "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-close-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.11161,
                1,
                0.77679
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.28,
            0.5,
            0.3,
            0.5
          ],
          "ar": [
            0.28,
            0.5,
            0.3,
            0.5
          ],
          "img": "home-codex-asks",
          "alt": "Codex projection tilts its head, palms open, puzzled.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Ask who?",
              "x": 0.03,
              "y": 0.03,
              "w": 0.27963,
              "tail": [
                0.5,
                0.10533
              ],
              "phone": {
                "x": 0.3117,
                "y": 0.218,
                "w": 0.34356,
                "tail": [
                  0.535,
                  0.1635
                ]
              },
              "speech": {
                "id": "home-codex-home-codex-asks-b0",
                "src": "/comic/speech/home-20261012b/home-codex-home-codex-asks-b0-eq-v1.mp3",
                "durationSeconds": 0.679184,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-asks-composite-v3-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-asks-composite-v3-1600.avif"
            ],
            "ar": [
              0,
              0.03125,
              1,
              0.9375
            ],
            "canonicalSource": {
              "panelId": "home-codex-asks",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-composite-v3.png",
              "sha256": "c8eab1b07107d6c4284427262c962ddf4dc68d2133915c0516398008cd6fa1f0",
              "recordId": "home-codex-asks-composite-v3",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-composite-v3-1600.webp",
                  "sha256": "fa91e5a3d2ce80c77a9810d3a998b84e3d538a536f0b1da84ee8aafed143e588",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-composite-v3.png",
                    "sourceSha256": "c8eab1b07107d6c4284427262c962ddf4dc68d2133915c0516398008cd6fa1f0",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-composite-v3-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-composite-v3-1600.avif",
                  "sha256": "e611d13f8a1e6a0177ee047e349f5558122673ccc015a6c8ed276ac494416491",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-composite-v3.png",
                    "sourceSha256": "c8eab1b07107d6c4284427262c962ddf4dc68d2133915c0516398008cd6fa1f0",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-composite-v3-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.0144,
                1,
                0.71505
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-codex-asks-projection",
              "at": 0,
              "alt": "Codex projection tilts its head, palms open, puzzled.",
              "src": "/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.webp",
              "ar": [
                0,
                0.03125,
                1,
                0.9375
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-asks",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-plate-v1.png",
                "sha256": "96293857916183b7014106ce3d06a50cce1569e44707aae877d6840a8edca0a6",
                "recordId": "home-codex-asks-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.webp",
                    "sha256": "e0bd63b52e7a8f9a9a201c5ce46e6c4dea0b76de07f3a394fb922aa365e2e500",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                      "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-plate-v1.png",
                      "sourceSha256": "96293857916183b7014106ce3d06a50cce1569e44707aae877d6840a8edca0a6",
                      "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.avif",
                    "sha256": "40abd0c1f3c7f40e1a8e5355cff16116412108e2ac07ccf0e79e077dd2d436a6",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                      "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-plate-v1.png",
                      "sourceSha256": "96293857916183b7014106ce3d06a50cce1569e44707aae877d6840a8edca0a6",
                      "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0,
                  0.0144,
                  1,
                  0.71505
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-asks",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-plate-v1.png",
                    "sha256": "96293857916183b7014106ce3d06a50cce1569e44707aae877d6840a8edca0a6",
                    "recordId": "home-codex-asks-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.webp",
                        "sha256": "e0bd63b52e7a8f9a9a201c5ce46e6c4dea0b76de07f3a394fb922aa365e2e500",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                          "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-plate-v1.png",
                          "sourceSha256": "96293857916183b7014106ce3d06a50cce1569e44707aae877d6840a8edca0a6",
                          "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.avif",
                        "sha256": "40abd0c1f3c7f40e1a8e5355cff16116412108e2ac07ccf0e79e077dd2d436a6",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                          "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-plate-v1.png",
                          "sourceSha256": "96293857916183b7014106ce3d06a50cce1569e44707aae877d6840a8edca0a6",
                          "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-codex-asks-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-asks-codex-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-asks",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-codex-layer-v3.png",
                    "sha256": "7dc8cdcbc54bc18afedb0950e04447ae16ea2a30c21af2dfb29f6f7f3b05e0fd",
                    "recordId": "home-codex-asks-codex-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-codex-layer-v3-1600.webp",
                        "sha256": "fbaf59e09d984fd2783720655672be827a850b24fcbbe219fde9e2bf9b7ed1f7",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-codex-layer-v3.png",
                          "sourceSha256": "7dc8cdcbc54bc18afedb0950e04447ae16ea2a30c21af2dfb29f6f7f3b05e0fd",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-codex-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-codex-layer-v3-1600.avif",
                        "sha256": "4eed6683ad5d06fdadb41754739fb83e0514da59ddca551201b94135aaea950b",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-codex-asks-codex-layer-v3.png",
                          "sourceSha256": "7dc8cdcbc54bc18afedb0950e04447ae16ea2a30c21af2dfb29f6f7f3b05e0fd",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-codex-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "drift-left",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.58,
            0.5,
            0.42,
            0.5
          ],
          "ar": [
            0.58,
            0.5,
            0.42,
            0.5
          ],
          "img": "home-matt-points",
          "alt": "Matt gestures toward Marco and Dana at the desk: Marco in his light-blue shirt and lanyard, Dana with her rectangular glasses and a pen over printed papers (printed face toward her).",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "The people who\nown the work.",
              "x": 0.67503,
              "y": 0.03,
              "w": 0.29497,
              "tail": [
                0.2288,
                0.25
              ],
              "phone": {
                "x": 0.59636,
                "y": 0.03,
                "w": 0.38481,
                "tail": [
                  0.23,
                  0.17816
                ]
              },
              "speech": {
                "id": "home-codex-home-matt-points-b1-20261015",
                "src": "/comic/speech/home-20261015/home-codex-home-matt-points-b1-eq-v1.mp3",
                "durationSeconds": 1.300317,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/codex/home-matt-points-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/codex/home-matt-points-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-matt-points",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-matt-points-plate-v1.png",
              "sha256": "dd71c1de6fda24f2d871f993c625b42fbd294f74effc5db5a1d511e74ebe4e51",
              "recordId": "home-matt-points-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-points-plate-v1-1600.webp",
                  "sha256": "aa333066a6dfd94c3a54d154e5686d8b3465501eace603e452499dae31d33389",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                    "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-matt-points-plate-v1.png",
                    "sourceSha256": "dd71c1de6fda24f2d871f993c625b42fbd294f74effc5db5a1d511e74ebe4e51",
                    "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-points-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-points-plate-v1-1600.avif",
                  "sha256": "c37d20782d3a220d6eecbc491417b65e06ccafc27f89f942fd876cca2ebe8492",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/codex-encodings-v2.json",
                    "sha256": "e2c06356925fcb366d7904f05db2ce12eb38389fde094bb31de01e3178df50b9",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/codex/home-matt-points-plate-v1.png",
                    "sourceSha256": "dd71c1de6fda24f2d871f993c625b42fbd294f74effc5db5a1d511e74ebe4e51",
                    "outputPath": "site/public/comic/home/rebuild-20261014/codex/home-matt-points-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.076,
                1,
                0.76639
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-codex-reaches",
            "r": [
              0,
              0,
              1,
              0.29
            ]
          },
          {
            "img": "home-matt-stops",
            "r": [
              0,
              0.29,
              0.5172413793103449,
              0.20999999999999996
            ]
          },
          {
            "img": "home-codex-literal",
            "r": [
              0.5172413793103449,
              0.29,
              0.48275862068965514,
              0.20999999999999996
            ]
          },
          {
            "img": "home-matt-close",
            "r": [
              0,
              0.49999999999999994,
              0.48275862068965525,
              0.20999999999999996
            ]
          },
          {
            "img": "home-codex-asks",
            "r": [
              0.48275862068965525,
              0.49999999999999994,
              0.5172413793103448,
              0.20999999999999996
            ]
          },
          {
            "img": "home-matt-points",
            "r": [
              0,
              0.71,
              1,
              0.29000000000000004
            ]
          }
        ]
      ]
    },
    {
      "id": "answers",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/answers/home-answers-page-master-v1",
      "score": 0,
      "room": "office",
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.28,
            0.5
          ],
          "ar": [
            0,
            0,
            0.28,
            0.5
          ],
          "img": "home-codex-asks-rate",
          "alt": "Marco sits back in his chair with his arms crossed, frowning down at the old rate card that lies flat on his desk with its printed face up (nobody holds it); the desk lamp lights it. Leave open floor to the left of the desk for a standing figure.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. 3:40 a.m.",
              "x": 0.4232,
              "y": 0.03,
              "w": 0.5267857142857142,
              "phone": {
                "x": 0.36,
                "y": 0.03,
                "w": 0.8797195945945945
              },
              "speech": {
                "id": "home-codex-asks-rate-b0-20261013",
                "src": "/comic/speech/home-20261013/home-codex-asks-rate-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 2.506871,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Rate card.\nWhich year?",
              "x": 0.2338,
              "y": 0.0138,
              "w": 0.37103,
              "tail": [
                0.1584,
                0.1968
              ],
              "phone": {
                "x": 0.0286,
                "y": 0.4038,
                "w": 0.66778,
                "tail": [
                  0.0958,
                  0.217
                ]
              },
              "speech": {
                "id": "home-answers-home-codex-asks-rate-b1",
                "src": "/comic/speech/home-20261012b/home-answers-home-codex-asks-rate-b1-eq-v1.mp3",
                "durationSeconds": 2.142041,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-asks-rate-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-asks-rate-composite-v2-1600.avif"
            ],
            "ar": [
              0.00222,
              0,
              0.99556,
              1
            ],
            "canonicalSource": {
              "panelId": "home-codex-asks-rate",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-composite-v2.png",
              "sha256": "6944ec70dd0661d87651a66fe312982ef50c2eb6a35bbc5edb45f1e6c1d083c4",
              "recordId": "home-codex-asks-rate-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-rate-composite-v2-1600.webp",
                  "sha256": "5445e4af2afee91fdfb512515c0367da668f7c03bbff8485de7296d82a1d1fb5",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-composite-v2.png",
                    "sourceSha256": "6944ec70dd0661d87651a66fe312982ef50c2eb6a35bbc5edb45f1e6c1d083c4",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-rate-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-rate-composite-v2-1600.avif",
                  "sha256": "4ead2a3b159159887413ebd20ff3a53997c9551b24fb70bb1a8d535a4997d68f",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-composite-v2.png",
                    "sourceSha256": "6944ec70dd0661d87651a66fe312982ef50c2eb6a35bbc5edb45f1e6c1d083c4",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-rate-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.0904,
                0,
                0.72614,
                1
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-codex-asks-rate-projection",
              "at": 0,
              "alt": "Marco sits back in his chair with his arms crossed, frowning down at the old rate card that lies flat on his desk with its printed face up (nobody holds it); the desk lamp lights it. Leave open floor to the left of the desk for a standing figure.",
              "src": "/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.webp",
              "ar": [
                0.00222,
                0,
                0.99556,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-asks-rate",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-plate-v1.png",
                "sha256": "50558ae62e2952d4960b238d05abe1942d14333cec3a243d876a2de0bbf8c8c0",
                "recordId": "home-codex-asks-rate-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.webp",
                    "sha256": "187fa9d9ad23cc8d312695483622c5f9383c322b4c30095389fc4c132946b7b5",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                      "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-plate-v1.png",
                      "sourceSha256": "50558ae62e2952d4960b238d05abe1942d14333cec3a243d876a2de0bbf8c8c0",
                      "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.avif",
                    "sha256": "137c544d4ddefbcf225525cd50b4767dc12e4f37d752f80eb5a9bdce5d1b4fd9",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                      "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-plate-v1.png",
                      "sourceSha256": "50558ae62e2952d4960b238d05abe1942d14333cec3a243d876a2de0bbf8c8c0",
                      "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.0904,
                  0,
                  0.72614,
                  1
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-asks-rate",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-plate-v1.png",
                    "sha256": "50558ae62e2952d4960b238d05abe1942d14333cec3a243d876a2de0bbf8c8c0",
                    "recordId": "home-codex-asks-rate-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.webp",
                        "sha256": "187fa9d9ad23cc8d312695483622c5f9383c322b4c30095389fc4c132946b7b5",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                          "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-plate-v1.png",
                          "sourceSha256": "50558ae62e2952d4960b238d05abe1942d14333cec3a243d876a2de0bbf8c8c0",
                          "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.avif",
                        "sha256": "137c544d4ddefbcf225525cd50b4767dc12e4f37d752f80eb5a9bdce5d1b4fd9",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                          "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-plate-v1.png",
                          "sourceSha256": "50558ae62e2952d4960b238d05abe1942d14333cec3a243d876a2de0bbf8c8c0",
                          "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-asks-rate-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-asks-rate-codex-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-asks-rate",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-codex-layer-v2.png",
                    "sha256": "806bf3609a6f9ddec05e95dfeaf96707d026861a53d12cca80be5561efdc529f",
                    "recordId": "home-codex-asks-rate-codex-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-rate-codex-layer-v2-1600.webp",
                        "sha256": "750787c1ee742b02c8c02dcbd5ce816e7471d04778042bbc87eeb787edeac306",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-codex-layer-v2.png",
                          "sourceSha256": "806bf3609a6f9ddec05e95dfeaf96707d026861a53d12cca80be5561efdc529f",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-rate-codex-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-rate-codex-layer-v2-1600.avif",
                        "sha256": "1d0ce5433b5ad4670ad8053a17fa4197769d5d8e6b3fde74aa2098bc6d5c4ad0",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-asks-rate-codex-layer-v2.png",
                          "sourceSha256": "806bf3609a6f9ddec05e95dfeaf96707d026861a53d12cca80be5561efdc529f",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-asks-rate-codex-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "push",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.28,
            0,
            0.3,
            0.5
          ],
          "ar": [
            0.28,
            0,
            0.3,
            0.5
          ],
          "img": "home-marco-answers-rate",
          "alt": "Marco holds the 2024 rate card up, printed face toward himself (we see its plain back and his frowning face over it).",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "2024. Two years\nold. Sam has\nthis year’s.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.43519,
              "tail": [
                0.6,
                0.29733
              ],
              "phone": {
                "x": 0.25656,
                "y": 0.43,
                "w": 0.75565,
                "tail": [
                  0.62833,
                  0.31
                ]
              },
              "speech": {
                "id": "home-answers-home-marco-answers-rate-b1-20261015",
                "src": "/comic/speech/home-20261015/home-answers-home-marco-answers-rate-b1-eq-v1.mp3",
                "durationSeconds": 3.622313,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/answers/home-marco-answers-rate-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/answers/home-marco-answers-rate-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.03125,
              1,
              0.9375
            ],
            "canonicalSource": {
              "panelId": "home-marco-answers-rate",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-marco-answers-rate-plate-v1.png",
              "sha256": "e090f3bdc5151dceb98084163a09188eabe90b5136b3818837218a0127940c58",
              "recordId": "home-marco-answers-rate-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-marco-answers-rate-plate-v1-1600.webp",
                  "sha256": "6f1b826d3e8f21473e401642e284e66fbaa1b91d5e0e7dcfeeb27f408d6185b3",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                    "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-marco-answers-rate-plate-v1.png",
                    "sourceSha256": "e090f3bdc5151dceb98084163a09188eabe90b5136b3818837218a0127940c58",
                    "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-marco-answers-rate-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-marco-answers-rate-plate-v1-1600.avif",
                  "sha256": "ad0f0dadee36b18a4a2387e6bc177523fe6ab26477c466e5b2ed5d03cb4d7782",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                    "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-marco-answers-rate-plate-v1.png",
                    "sourceSha256": "e090f3bdc5151dceb98084163a09188eabe90b5136b3818837218a0127940c58",
                    "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-marco-answers-rate-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.11034,
                0,
                0.77931,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.58,
            0,
            0.42,
            0.5
          ],
          "ar": [
            0.58,
            0,
            0.42,
            0.5
          ],
          "img": "home-codex-discount",
          "alt": "Codex projection with one gauntlet on the printed quote, pointing at a highlighted discount line; the paper's printed face is up toward Codex and the camera.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Discount.\nWho agreed\nto it?",
              "x": 0.73,
              "y": 0.03,
              "w": 0.24,
              "tail": [
                0.63058,
                0.2051
              ],
              "phone": {
                "x": 0.2928,
                "y": 0.3232,
                "w": 0.6198,
                "tail": [
                  0.61,
                  0.268
                ]
              },
              "speech": {
                "id": "home-answers-continued-1-home-codex-discount-b0",
                "src": "/comic/speech/home-20261012b/home-answers-continued-1-home-codex-discount-b0-eq-v1.mp3",
                "durationSeconds": 2.377143,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-discount-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-discount-composite-v2-1600.avif"
            ],
            "ar": [
              0.00222,
              0,
              0.99556,
              1
            ],
            "canonicalSource": {
              "panelId": "home-codex-discount",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-composite-v2.png",
              "sha256": "4a9e8be7c3faba53885d0abbcf99bd8d74ff3561f69e03c4083fe68c4797a2f4",
              "recordId": "home-codex-discount-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-discount-composite-v2-1600.webp",
                  "sha256": "0be9bf94e82aa482b93771137af92ad26a6ce4e00779d33c7475c633181f6ff4",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-composite-v2.png",
                    "sourceSha256": "4a9e8be7c3faba53885d0abbcf99bd8d74ff3561f69e03c4083fe68c4797a2f4",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-discount-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-discount-composite-v2-1600.avif",
                  "sha256": "2058e0e8cf38517bbea6ae36700c7eb30b655fd020e9d2329a3efd2c5d223991",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-composite-v2.png",
                    "sourceSha256": "4a9e8be7c3faba53885d0abbcf99bd8d74ff3561f69e03c4083fe68c4797a2f4",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-discount-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.13632,
                0,
                0.72736,
                1
              ]
            }
          },
          "views": [
            {
              "id": "home-codex-discount-projection",
              "at": 0,
              "alt": "Codex projection with one gauntlet on the printed quote, pointing at a highlighted discount line; the paper's printed face is up toward Codex and the camera.",
              "src": "/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.webp",
              "ar": [
                0.00222,
                0,
                0.99556,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-discount",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-plate-v1.png",
                "sha256": "fb0e32252948b6902760c144b1df090b93287d41558ac5a0cf8fd1a8f2ebfae8",
                "recordId": "home-codex-discount-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.webp",
                    "sha256": "a391bd8389eab826532b302e73eaccef06005c40408116494bc3f6e20c6c9081",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                      "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-plate-v1.png",
                      "sourceSha256": "fb0e32252948b6902760c144b1df090b93287d41558ac5a0cf8fd1a8f2ebfae8",
                      "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.avif",
                    "sha256": "ec2b3ae00eb544a70c2b89d3c27d8602ed263a1919e116cd47231db2959ef7e5",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                      "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-plate-v1.png",
                      "sourceSha256": "fb0e32252948b6902760c144b1df090b93287d41558ac5a0cf8fd1a8f2ebfae8",
                      "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.13632,
                  0,
                  0.72736,
                  1
                ]
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-discount",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-plate-v1.png",
                    "sha256": "fb0e32252948b6902760c144b1df090b93287d41558ac5a0cf8fd1a8f2ebfae8",
                    "recordId": "home-codex-discount-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.webp",
                        "sha256": "a391bd8389eab826532b302e73eaccef06005c40408116494bc3f6e20c6c9081",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                          "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-plate-v1.png",
                          "sourceSha256": "fb0e32252948b6902760c144b1df090b93287d41558ac5a0cf8fd1a8f2ebfae8",
                          "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.avif",
                        "sha256": "ec2b3ae00eb544a70c2b89d3c27d8602ed263a1919e116cd47231db2959ef7e5",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                          "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-plate-v1.png",
                          "sourceSha256": "fb0e32252948b6902760c144b1df090b93287d41558ac5a0cf8fd1a8f2ebfae8",
                          "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-codex-discount-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-discount-codex-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-discount",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-codex-layer-v2.png",
                    "sha256": "da1568ca61d4ec76f7999e3f99a7c1e4d0f91fc5287e69382a4568d5352c8e84",
                    "recordId": "home-codex-discount-codex-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-discount-codex-layer-v2-1600.webp",
                        "sha256": "1c398a86e2b48e35343432b8391b71b64fca009cf25f916b468a2e3192f38d9f",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-codex-layer-v2.png",
                          "sourceSha256": "da1568ca61d4ec76f7999e3f99a7c1e4d0f91fc5287e69382a4568d5352c8e84",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-discount-codex-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-discount-codex-layer-v2-1600.avif",
                        "sha256": "b497756ca77c2fed449aeeccb69826c4f654696c4310db673261264f0fe66e14",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-codex-discount-codex-layer-v2.png",
                          "sourceSha256": "da1568ca61d4ec76f7999e3f99a7c1e4d0f91fc5287e69382a4568d5352c8e84",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-discount-codex-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "push",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0.5,
            0.42,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.42,
            0.5
          ],
          "img": "home-marco-nobody",
          "alt": "Marco slumps back in his chair, hand over his face, honest and tired; a laptop on the desk faces him.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "shadow"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Nobody.\nChat\nassumed it.",
              "x": 0.72265,
              "y": 0.03,
              "w": 0.24735,
              "tail": [
                0.28906,
                0.27
              ],
              "phone": {
                "x": 0.41019,
                "y": 0.03,
                "w": 0.60157,
                "tail": [
                  0.21128,
                  0.27
                ]
              },
              "speech": {
                "id": "home-answers-continued-1-home-marco-nobody-b0",
                "src": "/comic/speech/home-20261012b/home-answers-continued-1-home-marco-nobody-b0-eq-v1.mp3",
                "durationSeconds": 1.857596,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "And no installation\nlabour. Sam plans\nthe crew.",
              "x": 0.59566,
              "y": 0.28,
              "w": 0.37434,
              "tail": [
                0.28906,
                0.27
              ],
              "phone": {
                "x": 0.03,
                "y": 0.405,
                "w": 0.65654,
                "tail": [
                  0.21128,
                  0.27
                ]
              },
              "speech": {
                "id": "home-answers-home-marco-nobody-b2-20261015",
                "src": "/comic/speech/home-20261015/home-answers-home-marco-nobody-b2-eq-v1.mp3",
                "durationSeconds": 2.368435,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/answers/home-marco-nobody-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/answers/home-marco-nobody-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-marco-nobody",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-marco-nobody-plate-v1.png",
              "sha256": "431781ca9c6cba59458d95dfba3cc95aefd38682ed0e05c513ecc4408b33de2e",
              "recordId": "home-marco-nobody-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-marco-nobody-plate-v1-1600.webp",
                  "sha256": "457903a0834692465b592ef387b0eb8d3510293e36a094b2bb5a75c66b08b024",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                    "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-marco-nobody-plate-v1.png",
                    "sourceSha256": "431781ca9c6cba59458d95dfba3cc95aefd38682ed0e05c513ecc4408b33de2e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-marco-nobody-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-marco-nobody-plate-v1-1600.avif",
                  "sha256": "3806c52c27fe47d9d9ecacf7dc532309e77fca0cdb90afc9627b6564a4d9792b",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                    "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-marco-nobody-plate-v1.png",
                    "sourceSha256": "431781ca9c6cba59458d95dfba3cc95aefd38682ed0e05c513ecc4408b33de2e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-marco-nobody-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.13415,
                0,
                0.73171,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.42,
            0.5,
            0.3,
            0.5
          ],
          "ar": [
            0.42,
            0.5,
            0.3,
            0.5
          ],
          "img": "home-dana-claude-rule",
          "alt": "Dana at the next desk with her stack of printed citations (printed face toward her), pen raised like a rule; the Claude agent stands beside her as a full-colour translucent projection, visor grey, coat of turning pages, listening with head bowed.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "Every citation,\nfrom the source.\nOr it doesn’t go.",
              "x": 0.19019,
              "y": 0.505,
              "w": 0.47963,
              "tail": [
                0.43,
                0.39333
              ],
              "phone": {
                "x": 0.03,
                "y": 0.505,
                "w": 0.81019,
                "tail": [
                  0.41018,
                  0.4
                ]
              },
              "speech": {
                "id": "home-answers-continued-2-home-dana-claude-rule-b0",
                "src": "/comic/speech/home-20261012b/home-answers-continued-2-home-dana-claude-rule-b0-eq-v1.mp3",
                "durationSeconds": 5.276735,
                "provider": "Fish Audio",
                "characterId": "dana",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Then I ask\nbefore I answer.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.45741,
              "tail": [
                0.79,
                0.17531
              ],
              "phone": {
                "x": 0.21921,
                "y": 0.78,
                "w": 0.79162,
                "tail": [
                  0.87213,
                  0.1956
                ]
              },
              "speech": {
                "id": "home-answers-continued-2-home-dana-claude-rule-b1",
                "src": "/comic/speech/home-20261012b/home-answers-continued-2-home-dana-claude-rule-b1-eq-v1.mp3",
                "durationSeconds": 1.880816,
                "provider": "Fish Audio",
                "characterId": "claude",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-dana-claude-rule-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-dana-claude-rule-composite-v2-1600.avif"
            ],
            "ar": [
              0,
              0.03125,
              1,
              0.9375
            ],
            "canonicalSource": {
              "panelId": "home-dana-claude-rule",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-composite-v2.png",
              "sha256": "4d280d8b96531b80bb76677c017e6e44571d08e61d08c19f613d28619d95c922",
              "recordId": "home-dana-claude-rule-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-claude-rule-composite-v2-1600.webp",
                  "sha256": "522a2b6ee2b69bf0a92c673b2bac74bf11240135b323181ec4c4258188248cb6",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-composite-v2.png",
                    "sourceSha256": "4d280d8b96531b80bb76677c017e6e44571d08e61d08c19f613d28619d95c922",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-claude-rule-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-claude-rule-composite-v2-1600.avif",
                  "sha256": "073f9b83e730fe96b15593515288a617b82041ea460c1d1fab643b35bd9c4a49",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-composite-v2.png",
                    "sourceSha256": "4d280d8b96531b80bb76677c017e6e44571d08e61d08c19f613d28619d95c922",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-claude-rule-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.11034,
                0,
                0.77931,
                1
              ]
            }
          },
          "views": [
            {
              "id": "home-dana-claude-rule-projection",
              "at": 0,
              "alt": "Dana at the next desk with her stack of printed citations (printed face toward her), pen raised like a rule; the Claude agent stands beside her as a full-colour translucent projection, visor grey, coat of turning pages, listening with head bowed.",
              "src": "/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.webp",
              "ar": [
                0,
                0.03125,
                1,
                0.9375
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-dana-claude-rule",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-plate-v1.png",
                "sha256": "f2a3eb5161af2b8cd78187ab9bfccf8f537ae6dbe13b779e5fdd4a11bea2d32c",
                "recordId": "home-dana-claude-rule-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.webp",
                    "sha256": "646b6dd59124e102bce30b3650f7cdd9144bfbabf0cbf46c99a6e6e0d0a503aa",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                      "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-plate-v1.png",
                      "sourceSha256": "f2a3eb5161af2b8cd78187ab9bfccf8f537ae6dbe13b779e5fdd4a11bea2d32c",
                      "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.avif",
                    "sha256": "c1e5cd855fe2ae53b65740120fc0b76701186aa316c8288f8d3d459869cab131",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                      "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-plate-v1.png",
                      "sourceSha256": "f2a3eb5161af2b8cd78187ab9bfccf8f537ae6dbe13b779e5fdd4a11bea2d32c",
                      "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.11034,
                  0,
                  0.77931,
                  1
                ]
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-dana-claude-rule",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-plate-v1.png",
                    "sha256": "f2a3eb5161af2b8cd78187ab9bfccf8f537ae6dbe13b779e5fdd4a11bea2d32c",
                    "recordId": "home-dana-claude-rule-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.webp",
                        "sha256": "646b6dd59124e102bce30b3650f7cdd9144bfbabf0cbf46c99a6e6e0d0a503aa",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                          "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-plate-v1.png",
                          "sourceSha256": "f2a3eb5161af2b8cd78187ab9bfccf8f537ae6dbe13b779e5fdd4a11bea2d32c",
                          "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.avif",
                        "sha256": "c1e5cd855fe2ae53b65740120fc0b76701186aa316c8288f8d3d459869cab131",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                          "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-plate-v1.png",
                          "sourceSha256": "f2a3eb5161af2b8cd78187ab9bfccf8f537ae6dbe13b779e5fdd4a11bea2d32c",
                          "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-dana-claude-rule-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "claude",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-dana-claude-rule-claude-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-dana-claude-rule",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-claude-layer-v2.png",
                    "sha256": "0e898b27e4bae6fe86d606bce61a53b72c66b4073904e019446a8bca7515c93d",
                    "recordId": "home-dana-claude-rule-claude-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-claude-rule-claude-layer-v2-1600.webp",
                        "sha256": "8a27f3130c5ec150fd9f228a46f7f55628716430d75a78a62050f3552a031252",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-claude-layer-v2.png",
                          "sourceSha256": "0e898b27e4bae6fe86d606bce61a53b72c66b4073904e019446a8bca7515c93d",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-claude-rule-claude-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-dana-claude-rule-claude-layer-v2-1600.avif",
                        "sha256": "cecd4d008254d26bad6289d185f790a4f9a678b50a3fe9d49e5d95b7cfc6611b",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-dana-claude-rule-claude-layer-v2.png",
                          "sourceSha256": "0e898b27e4bae6fe86d606bce61a53b72c66b4073904e019446a8bca7515c93d",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-dana-claude-rule-claude-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "drift-left",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "claude",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.72,
            0.5,
            0.28,
            0.5
          ],
          "ar": [
            0.72,
            0.5,
            0.28,
            0.5
          ],
          "img": "home-matt-wait",
          "alt": "Matt writing on a whiteboard with a marker: three boxes drawn in ink (no words), Marco and Dana watching.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.15
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Ruth and Sam are in\nat eight. Tonight,\nbuild\nwhat you know.",
              "x": 0.4653,
              "y": 0.3283,
              "w": 0.56151,
              "tail": [
                0.712,
                0.2698
              ],
              "phone": {
                "x": 0.0977,
                "y": 0.5054,
                "w": 0.80403,
                "tail": [
                  0.8132,
                  0.2841
                ]
              },
              "speech": {
                "id": "home-answers-home-matt-wait-b1-20261015",
                "src": "/comic/speech/home-20261015/home-answers-home-matt-wait-b1-eq-v1.mp3",
                "durationSeconds": 2.925714,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/answers/home-matt-wait-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/answers/home-matt-wait-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-matt-wait",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-matt-wait-plate-v1.png",
              "sha256": "bb087e695449e099e3b321b8ff2e5b53737e2d65c25afb02da29c698bc3ae62c",
              "recordId": "home-matt-wait-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-matt-wait-plate-v1-1600.webp",
                  "sha256": "6795449c88b76ffbdfe9ef5935a82ad997b56a766182254db9cbc3d93cfba085",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                    "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-matt-wait-plate-v1.png",
                    "sourceSha256": "bb087e695449e099e3b321b8ff2e5b53737e2d65c25afb02da29c698bc3ae62c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-matt-wait-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/answers/home-matt-wait-plate-v1-1600.avif",
                  "sha256": "d8266371507b53a107b6bd49cfbcfa262ab2f2657715fc51c928048a4018f362",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/answers-encodings-v1.json",
                    "sha256": "bd7876670260caa0555ffd3cdc66df2a4508be26db0f7e7b1af8f494cabbdb94",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/answers/home-matt-wait-plate-v1.png",
                    "sourceSha256": "bb087e695449e099e3b321b8ff2e5b53737e2d65c25afb02da29c698bc3ae62c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/answers/home-matt-wait-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.1212,
                0,
                0.725,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-codex-asks-rate",
            "r": [
              0,
              0,
              0.48275862068965525,
              0.3716814159292035
            ]
          },
          {
            "img": "home-marco-answers-rate",
            "r": [
              0.48275862068965525,
              0,
              0.5172413793103448,
              0.3716814159292035
            ]
          },
          {
            "img": "home-codex-discount",
            "r": [
              0,
              0.3716814159292035,
              0.5,
              0.25663716814159293
            ]
          },
          {
            "img": "home-marco-nobody",
            "r": [
              0.5,
              0.3716814159292035,
              0.5,
              0.25663716814159293
            ]
          },
          {
            "img": "home-dana-claude-rule",
            "r": [
              0,
              0.6283185840707964,
              0.5172413793103449,
              0.37168141592920356
            ]
          },
          {
            "img": "home-matt-wait",
            "r": [
              0.5172413793103449,
              0.6283185840707964,
              0.48275862068965514,
              0.37168141592920356
            ]
          }
        ]
      ]
    },
    {
      "id": "brain",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/brain/home-brain-page-master-v2",
      "score": 0.5,
      "room": "office",
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.32,
            0.54
          ],
          "ar": [
            0,
            0,
            0.32,
            0.5
          ],
          "img": "home-process-procedure",
          "alt": "Matt and Marco at a desk; Marco ticks off steps on his fingers while Matt listens, laptop open facing Matt.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. 4:10 a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.4609375,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.7925
              },
              "speech": {
                "id": "home-brain-home-process-procedure-b1-20261015",
                "src": "/comic/speech/home-20261015/home-brain-home-process-procedure-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 2.422653,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Walk me through a\nquote you’d sign.",
              "x": 0.52035,
              "y": 0.03,
              "w": 0.44965,
              "tail": [
                0.28982,
                0.43
              ],
              "phone": {
                "x": 0.03,
                "y": 0.17,
                "w": 0.94,
                "tail": [
                  0.183,
                  0.4594
                ]
              },
              "speech": {
                "id": "home-process-home-process-procedure-b2",
                "src": "/comic/speech/home-20261012b/home-process-home-process-procedure-b2-eq-v1.mp3",
                "durationSeconds": 1.764717,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Current rates. Labour.\nAn agreed discount.\nThen I check every\nline.",
              "x": 0.41618,
              "y": 0.53,
              "w": 0.55382,
              "tail": [
                0.76021,
                0.42
              ],
              "phone": {
                "x": 0.04,
                "y": 0.95,
                "w": 0.92,
                "tail": [
                  0.7485,
                  0.4594
                ]
              },
              "speech": {
                "id": "home-process-home-process-procedure-b3",
                "src": "/comic/speech/home-20261012b/home-process-home-process-procedure-b3-eq-v1.mp3",
                "durationSeconds": 5.387029,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/brain/home-process-procedure-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/brain/home-process-procedure-plate-v1-1600.avif"
            ],
            "ar": [
              0.00042,
              0,
              0.99917,
              1
            ],
            "canonicalSource": {
              "panelId": "home-process-procedure",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-procedure-plate-v1.png",
              "sha256": "e732349f5437300ae8b4630a02c4533afb6351739a0983348121fe225acfd3d2",
              "recordId": "home-process-procedure-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-process-procedure-plate-v1-1600.webp",
                  "sha256": "9a00785273da13278f1ab7ef6c2901de5c5a7429a1f0c1dc8bfe627192277eee",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                    "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-procedure-plate-v1.png",
                    "sourceSha256": "e732349f5437300ae8b4630a02c4533afb6351739a0983348121fe225acfd3d2",
                    "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-process-procedure-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-process-procedure-plate-v1-1600.avif",
                  "sha256": "da9b5488f440074e3f71e47f4698efd540394918cbdcbeb84555d9768a1a19f3",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                    "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-procedure-plate-v1.png",
                    "sourceSha256": "e732349f5437300ae8b4630a02c4533afb6351739a0983348121fe225acfd3d2",
                    "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-process-procedure-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.12659,
                0,
                0.74683,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0.54,
            0.32,
            0.46
          ],
          "ar": [
            0,
            0.5,
            0.32,
            0.5
          ],
          "img": "home-process-source-rule",
          "alt": "Dana taps a thick bound source book on the desk with her pen; Matt listening beside her.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [
            {
              "kind": "impact",
              "gain": 0.2
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Dana, what stops\na citation?",
              "x": 0.54118,
              "y": 0.03,
              "w": 0.42882,
              "tail": [
                0.31,
                0.2952
              ],
              "phone": {
                "x": 0.0309,
                "y": 0.5264,
                "w": 0.92,
                "tail": [
                  0.1667,
                  0.3368
                ]
              },
              "speech": {
                "id": "home-process-home-process-source-rule-b0",
                "src": "/comic/speech/home-20261012b/home-process-home-process-source-rule-b0-eq-v1.mp3",
                "durationSeconds": 1.346757,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "dana",
              "text": "No original source,\nno citation. My firm\nkeeps those sources.",
              "x": 0.34392,
              "y": 0.605,
              "w": 0.51215,
              "tail": [
                0.6,
                0.47724
              ],
              "phone": {
                "x": 0.3519,
                "y": 0.0214,
                "w": 0.92,
                "tail": [
                  0.6353,
                  0.4695
                ]
              },
              "speech": {
                "id": "home-process-home-process-source-rule-b1",
                "src": "/comic/speech/home-20261012b/home-process-home-process-source-rule-b1-eq-v1.mp3",
                "durationSeconds": 5.276735,
                "provider": "Fish Audio",
                "characterId": "dana",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/brain/home-process-source-rule-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/brain/home-process-source-rule-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.06055,
              1,
              0.87891
            ],
            "canonicalSource": {
              "panelId": "home-process-source-rule",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-source-rule-plate-v1.png",
              "sha256": "cdd107d44e050d711cd94e29d804e4269b6b91a14414f6ad9d5da080d6b1f1f2",
              "recordId": "home-process-source-rule-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-process-source-rule-plate-v1-1600.webp",
                  "sha256": "1359b428d5d86e61ee8045586d68f63e11738162f7e72826f960798db6466098",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                    "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-source-rule-plate-v1.png",
                    "sourceSha256": "cdd107d44e050d711cd94e29d804e4269b6b91a14414f6ad9d5da080d6b1f1f2",
                    "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-process-source-rule-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-process-source-rule-plate-v1-1600.avif",
                  "sha256": "06cd50cdb93bd492d621c02a966599dd68aa9c1a88c53246a7fa5a116b83ff0b",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                    "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-source-rule-plate-v1.png",
                    "sourceSha256": "cdd107d44e050d711cd94e29d804e4269b6b91a14414f6ad9d5da080d6b1f1f2",
                    "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-process-source-rule-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.15385,
                0,
                0.69231,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.32,
            0,
            0.36,
            1
          ],
          "ar": [
            0.32,
            0,
            0.36,
            1
          ],
          "img": "home-brain-initialize",
          "alt": "Tall shot from inside the office looking out the window: Matt, Marco and Dana in silhouette at the glass, and outside across the street a giant teal lattice tower (the Second Brain) rising floor by floor from the empty lot, as tall as the real office towers, its lowest floors glowing teal, its upper floors still only a faint teal wireframe. City-scale, outside the building, never a desk object.",
          "motion": {
            "beats": 6,
            "strength": 0.5,
            "preset": "push"
          },
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
              "text": "Until then, each\nchat started from\nsomebody’s\ninstructions.",
              "x": 0.59731,
              "y": 0.95,
              "w": 0.3726851851851852,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.94
              },
              "speech": {
                "id": "home-process-procedure-b1-20261013",
                "src": "/comic/speech/home-20261013/home-process-procedure-b1-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 3.660499,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Second Brain. The\nteal archive\nretains sources,\nprocedures and\nchecked decisions.",
              "characterIntro": true,
              "x": 0.03,
              "y": 0.95,
              "w": 0.39120370370370366,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.94
              },
              "speech": {
                "id": "home-brain-initialize-b0-20261013",
                "src": "/comic/speech/home-20261013/home-brain-initialize-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 5.997732,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "We’ll build it\nfrom the work\nyou’ve checked.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.36265,
              "tail": [
                0.11458,
                0.37
              ],
              "phone": {
                "x": 0.2,
                "y": 0.3,
                "w": 0.78,
                "tail": [
                  0.35,
                  0.62
                ]
              },
              "speech": {
                "id": "home-brain-init-home-brain-initialize-b1",
                "src": "/comic/speech/home-20261012b/home-brain-init-home-brain-initialize-b1-eq-v1.mp3",
                "durationSeconds": 1.950476,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/brain/home-brain-initialize-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/brain/home-brain-initialize-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-brain-initialize",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-brain-initialize-plate-v1.png",
              "sha256": "7990138cd43349d779ee42a01c9811ff87b3f964a2c5f02fa47c354476cefd88",
              "recordId": "home-brain-initialize-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-brain-initialize-plate-v1-1600.webp",
                  "sha256": "398a9d6b41364dfdf6382008f66f3cac300d92c208a35b803cb2e57db339e7c3",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                    "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-brain-initialize-plate-v1.png",
                    "sourceSha256": "7990138cd43349d779ee42a01c9811ff87b3f964a2c5f02fa47c354476cefd88",
                    "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-brain-initialize-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-brain-initialize-plate-v1-1600.avif",
                  "sha256": "c2296690f31d2cb05ed43c399823638d7daa048db05f6b549f3eec28fe3c860d",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                    "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-brain-initialize-plate-v1.png",
                    "sourceSha256": "7990138cd43349d779ee42a01c9811ff87b3f964a2c5f02fa47c354476cefd88",
                    "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-brain-initialize-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.31685,
                1,
                0.3663
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.68,
            0,
            0.32,
            0.4
          ],
          "ar": [
            0.68,
            0,
            0.32,
            0.4
          ],
          "img": "home-process-connect",
          "alt": "Codex and Claude projections stand side by side at a desk, each touching a teal thread of light that runs out through the window toward the lattice tower; Matt at the laptop between them typing.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "light"
          },
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Claude, Codex:\nconnect to these\nworkspaces. Build\nthe procedures\nwe’ve checked.",
              "x": 0.29862,
              "y": 0.48,
              "w": 0.44965,
              "tail": [
                0.52345,
                0.38
              ],
              "phone": {
                "x": 0.30499,
                "y": 0.03,
                "w": 0.7
              },
              "speech": {
                "id": "home-connect-home-process-connect-b0",
                "src": "/comic/speech/home-20261012b/home-connect-home-process-connect-b0-eq-v1.mp3",
                "durationSeconds": 3.854512,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-process-connect-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-process-connect-composite-v2-1600.avif"
            ],
            "ar": [
              0.07351,
              0,
              0.85298,
              1
            ],
            "canonicalSource": {
              "panelId": "home-process-connect",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-composite-v2.png",
              "sha256": "4021ff610ff44a397f67a680d55c1681a3ac18b60d431560424cfdc47cf2a0fa",
              "recordId": "home-process-connect-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-composite-v2-1600.webp",
                  "sha256": "3209ab77f8b0b54a6b6b60913d984e45f83689f8e684df56d7be64126fbc40e4",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-composite-v2.png",
                    "sourceSha256": "4021ff610ff44a397f67a680d55c1681a3ac18b60d431560424cfdc47cf2a0fa",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-composite-v2-1600.avif",
                  "sha256": "553f6cb1279b3790f31a783cfc82679fadd6ec7dc657f342edc9703899fe85e1",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-composite-v2.png",
                    "sourceSha256": "4021ff610ff44a397f67a680d55c1681a3ac18b60d431560424cfdc47cf2a0fa",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.05872,
                0,
                0.88256,
                1
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-process-connect-projection",
              "at": 0,
              "alt": "Codex and Claude projections stand side by side at a desk, each touching a teal thread of light that runs out through the window toward the lattice tower; Matt at the laptop between them typing.",
              "src": "/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.webp",
              "ar": [
                0.07351,
                0,
                0.85298,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-process-connect",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-plate-v1.png",
                "sha256": "3d9ed704c63ff8036cf7fc37c87bca04b7a175d3d9e86db45cc2980ca2c361a6",
                "recordId": "home-process-connect-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.webp",
                    "sha256": "f0032bc7f365f82f1108e8312b2a1a1f26f4268d18aeb777751e9ddce73f8503",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                      "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-plate-v1.png",
                      "sourceSha256": "3d9ed704c63ff8036cf7fc37c87bca04b7a175d3d9e86db45cc2980ca2c361a6",
                      "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.avif",
                    "sha256": "4ff2a387487b0341c67d9a3fb65c37e42df591b20be6ba6a61ac835316fe5e9c",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                      "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-plate-v1.png",
                      "sourceSha256": "3d9ed704c63ff8036cf7fc37c87bca04b7a175d3d9e86db45cc2980ca2c361a6",
                      "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.05872,
                  0,
                  0.88256,
                  1
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-process-connect",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-plate-v1.png",
                    "sha256": "3d9ed704c63ff8036cf7fc37c87bca04b7a175d3d9e86db45cc2980ca2c361a6",
                    "recordId": "home-process-connect-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.webp",
                        "sha256": "f0032bc7f365f82f1108e8312b2a1a1f26f4268d18aeb777751e9ddce73f8503",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                          "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-plate-v1.png",
                          "sourceSha256": "3d9ed704c63ff8036cf7fc37c87bca04b7a175d3d9e86db45cc2980ca2c361a6",
                          "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.avif",
                        "sha256": "4ff2a387487b0341c67d9a3fb65c37e42df591b20be6ba6a61ac835316fe5e9c",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                          "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-plate-v1.png",
                          "sourceSha256": "3d9ed704c63ff8036cf7fc37c87bca04b7a175d3d9e86db45cc2980ca2c361a6",
                          "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-process-connect-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-process-connect-codex-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-process-connect",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-codex-layer-v2.png",
                    "sha256": "276791b85195413eba50eea5a8276746aa101206eb0ff92db913bddd9f14660a",
                    "recordId": "home-process-connect-codex-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-codex-layer-v2-1600.webp",
                        "sha256": "50d99a5b54ed1a379c2fbcf614e004140d3c1e580489fbf8e70d921ad3c34687",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-codex-layer-v2.png",
                          "sourceSha256": "276791b85195413eba50eea5a8276746aa101206eb0ff92db913bddd9f14660a",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-codex-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-codex-layer-v2-1600.avif",
                        "sha256": "d12a4d19cdac2162883cc4325826395564b17348aa28ec80dfa68a353225e8fc",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-codex-layer-v2.png",
                          "sourceSha256": "276791b85195413eba50eea5a8276746aa101206eb0ff92db913bddd9f14660a",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-codex-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "claude",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-process-connect-claude-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-process-connect",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-claude-layer-v2.png",
                    "sha256": "94c09e0bdbfa2049e7d6c91f384fcea1077a16841afc52f4ff6cd00245d08fbd",
                    "recordId": "home-process-connect-claude-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-claude-layer-v2-1600.webp",
                        "sha256": "1d292b7fe2d2327e72b3120b633377e588b2ce6a26c4fa93037ee74e3a060d0d",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-claude-layer-v2.png",
                          "sourceSha256": "94c09e0bdbfa2049e7d6c91f384fcea1077a16841afc52f4ff6cd00245d08fbd",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-claude-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-claude-layer-v2-1600.avif",
                        "sha256": "d82338f2da43b81ff66eda035562b5a967a60ed5587d43cd2a50c0af341cde21",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-process-connect-claude-layer-v2.png",
                          "sourceSha256": "94c09e0bdbfa2049e7d6c91f384fcea1077a16841afc52f4ff6cd00245d08fbd",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-connect-claude-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "light",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                },
                {
                  "layerId": "claude",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.68,
            0.4,
            0.32,
            0.3
          ],
          "ar": [
            0.68,
            0.4,
            0.32,
            0.3
          ],
          "img": "home-codex-skills",
          "alt": "Codex projection, gauntlets now glowing teal, holding up three glowing teal document cards in a fan; satisfied.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
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
              "who": "codex",
              "text": "Quote skill.\nSource-check\nskill. Expected\noutputs saved.",
              "x": 0.4194,
              "y": 0.2651,
              "w": 0.40799,
              "tail": [
                0.725,
                0.1958
              ],
              "phone": {
                "x": 0.3152,
                "y": 0.2437,
                "w": 0.7,
                "tail": [
                  0.725,
                  0.3295
                ]
              },
              "speech": {
                "id": "home-connect-home-process-connect-b1",
                "src": "/comic/speech/home-20261012b/home-connect-home-process-connect-b1-eq-v1.mp3",
                "durationSeconds": 4.519184,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-skills-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-skills-composite-v2-1600.avif"
            ],
            "ar": [
              0,
              0.05737,
              1,
              0.88526
            ],
            "canonicalSource": {
              "panelId": "home-codex-skills",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-composite-v2.png",
              "sha256": "14edd21abcbe32a73775f1b8d04dc0fe031575c172b17f5a2b7264193228698d",
              "recordId": "home-codex-skills-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-skills-composite-v2-1600.webp",
                  "sha256": "8fcb25d881678da738e25eab17a07bb4bcf6fbbc48fff3540e7e6c6df8b74531",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-composite-v2.png",
                    "sourceSha256": "14edd21abcbe32a73775f1b8d04dc0fe031575c172b17f5a2b7264193228698d",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-skills-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-skills-composite-v2-1600.avif",
                  "sha256": "35cc1d7dc434d2a121390ba08dd2a17f631fea12a2dd64b6c13d785c70c64330",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-composite-v2.png",
                    "sourceSha256": "14edd21abcbe32a73775f1b8d04dc0fe031575c172b17f5a2b7264193228698d",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-skills-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.076,
                1,
                0.54587
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-codex-skills-projection",
              "at": 0,
              "alt": "Codex projection, gauntlets now glowing teal, holding up three glowing teal document cards in a fan; satisfied.",
              "src": "/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.webp",
              "ar": [
                0,
                0.05737,
                1,
                0.88526
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-skills",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-plate-v1.png",
                "sha256": "1562dcc44d2bdcf65ea3fa390deeae06514477de9b1766a59fdf49311d04eef5",
                "recordId": "home-codex-skills-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.webp",
                    "sha256": "0e1941929c9196a76c8021bd677ad83d263ab4dc8358cf42bc20b79f8b3fb36a",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                      "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-plate-v1.png",
                      "sourceSha256": "1562dcc44d2bdcf65ea3fa390deeae06514477de9b1766a59fdf49311d04eef5",
                      "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.avif",
                    "sha256": "4d156cb1798c85887b188484be82db3b61a3248528958b582d95626b01feca6e",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                      "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-plate-v1.png",
                      "sourceSha256": "1562dcc44d2bdcf65ea3fa390deeae06514477de9b1766a59fdf49311d04eef5",
                      "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0,
                  0.076,
                  1,
                  0.54587
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-skills",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-plate-v1.png",
                    "sha256": "1562dcc44d2bdcf65ea3fa390deeae06514477de9b1766a59fdf49311d04eef5",
                    "recordId": "home-codex-skills-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.webp",
                        "sha256": "0e1941929c9196a76c8021bd677ad83d263ab4dc8358cf42bc20b79f8b3fb36a",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                          "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-plate-v1.png",
                          "sourceSha256": "1562dcc44d2bdcf65ea3fa390deeae06514477de9b1766a59fdf49311d04eef5",
                          "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.avif",
                        "sha256": "4d156cb1798c85887b188484be82db3b61a3248528958b582d95626b01feca6e",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                          "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-plate-v1.png",
                          "sourceSha256": "1562dcc44d2bdcf65ea3fa390deeae06514477de9b1766a59fdf49311d04eef5",
                          "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-codex-skills-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-skills-codex-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-skills",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-codex-layer-v2.png",
                    "sha256": "e4bacff1201e14cf1c37023e65a3a05dd792b7cafb83b8bf7974e58175791f24",
                    "recordId": "home-codex-skills-codex-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-skills-codex-layer-v2-1600.webp",
                        "sha256": "9d60662d9130234c799a98d87965caf17cb321eef4ec00cf92531cf7ba7bbfe6",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-codex-layer-v2.png",
                          "sourceSha256": "e4bacff1201e14cf1c37023e65a3a05dd792b7cafb83b8bf7974e58175791f24",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-skills-codex-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-skills-codex-layer-v2-1600.avif",
                        "sha256": "29215e930c0ed7df4c3b9d4f520a000c156b4beb11066204ee2f1710f7be3a2a",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-codex-skills-codex-layer-v2.png",
                          "sourceSha256": "e4bacff1201e14cf1c37023e65a3a05dd792b7cafb83b8bf7974e58175791f24",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-skills-codex-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "push",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.68,
            0.7,
            0.32,
            0.3
          ],
          "ar": [
            0.68,
            0.7,
            0.32,
            0.3
          ],
          "img": "home-claude-scope",
          "alt": "Claude projection, visor now teal, sorting pages from his coat into two separate glowing teal trays; one floor of the lattice tower glows through the window behind.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "light"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Separate sources.\nSeparate access.",
              "x": 0.0363,
              "y": 0.2054,
              "w": 0.44965,
              "tail": [
                0.12,
                0.1375
              ],
              "phone": {
                "x": 0.0137,
                "y": 0.4609,
                "w": 0.7,
                "tail": [
                  0.12,
                  0.2501
                ]
              },
              "speech": {
                "id": "home-connect-home-process-connect-b2",
                "src": "/comic/speech/home-20261012b/home-connect-home-process-connect-b2-eq-v1.mp3",
                "durationSeconds": 2.66449,
                "provider": "Fish Audio",
                "characterId": "claude",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Each company kept\nits own sources.\nThe checked\nprocedures stayed\nwith their owners.",
              "x": 0.5099,
              "y": 0.95,
              "w": 0.44010416666666663,
              "phone": {
                "x": 0.4962,
                "y": 0.95,
                "w": 0.6
              },
              "speech": {
                "id": "home-floors-light-b0-20261013",
                "src": "/comic/speech/home-20261013/home-floors-light-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 4.586531,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-claude-scope-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-claude-scope-composite-v2-1600.avif"
            ],
            "ar": [
              0,
              0.04705,
              1,
              0.90591
            ],
            "canonicalSource": {
              "panelId": "home-claude-scope",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-composite-v2.png",
              "sha256": "f8652044bee046d466d39fe745b63ebfb819d7f65e9e28bd1ec285b1d933515d",
              "recordId": "home-claude-scope-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-scope-composite-v2-1600.webp",
                  "sha256": "a32bba78fd764d51780d438a507701c710f835701b2ffdd7f18fc3eb4ffab033",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-composite-v2.png",
                    "sourceSha256": "f8652044bee046d466d39fe745b63ebfb819d7f65e9e28bd1ec285b1d933515d",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-scope-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-scope-composite-v2-1600.avif",
                  "sha256": "8c5704d780c9bd9be26df159eef5adb7f40c7e41e3e680f39a121fb3e630f470",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-composite-v2.png",
                    "sourceSha256": "f8652044bee046d466d39fe745b63ebfb819d7f65e9e28bd1ec285b1d933515d",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-scope-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.062,
                1,
                0.53999
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-claude-scope-projection",
              "at": 0,
              "alt": "Claude projection, visor now teal, sorting pages from his coat into two separate glowing teal trays; one floor of the lattice tower glows through the window behind.",
              "src": "/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.webp",
              "ar": [
                0,
                0.04705,
                1,
                0.90591
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-claude-scope",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-plate-v1.png",
                "sha256": "e1638781e0fa21f70b683ec7fb3b6f5ee3e093c29b85999e79fc900ef163392e",
                "recordId": "home-claude-scope-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.webp",
                    "sha256": "271f584618ce01debd3d09ca4248c71eb5f58c6ba151c4826db327d9030eaeb9",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                      "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-plate-v1.png",
                      "sourceSha256": "e1638781e0fa21f70b683ec7fb3b6f5ee3e093c29b85999e79fc900ef163392e",
                      "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.avif",
                    "sha256": "33ce62a54e50f39e6a4ea31321b19ed4d73dc219f009ce2a3e8b2f3b71a8ff46",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                      "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-plate-v1.png",
                      "sourceSha256": "e1638781e0fa21f70b683ec7fb3b6f5ee3e093c29b85999e79fc900ef163392e",
                      "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0,
                  0.062,
                  1,
                  0.53999
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-claude-scope",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-plate-v1.png",
                    "sha256": "e1638781e0fa21f70b683ec7fb3b6f5ee3e093c29b85999e79fc900ef163392e",
                    "recordId": "home-claude-scope-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.webp",
                        "sha256": "271f584618ce01debd3d09ca4248c71eb5f58c6ba151c4826db327d9030eaeb9",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                          "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-plate-v1.png",
                          "sourceSha256": "e1638781e0fa21f70b683ec7fb3b6f5ee3e093c29b85999e79fc900ef163392e",
                          "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.avif",
                        "sha256": "33ce62a54e50f39e6a4ea31321b19ed4d73dc219f009ce2a3e8b2f3b71a8ff46",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/brain-encodings-v2.json",
                          "sha256": "c50094098a908cc7b388c9a40c26f2eb3f065070d170a7220c499a28a4bedc21",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-plate-v1.png",
                          "sourceSha256": "e1638781e0fa21f70b683ec7fb3b6f5ee3e093c29b85999e79fc900ef163392e",
                          "outputPath": "site/public/comic/home/rebuild-20261014/brain/home-claude-scope-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "claude",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-claude-scope-claude-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-claude-scope",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-claude-layer-v2.png",
                    "sha256": "f4c2f03acf3b9755daeac8e42b4eef2f0b3cfe063ed616be65461884937477de",
                    "recordId": "home-claude-scope-claude-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-scope-claude-layer-v2-1600.webp",
                        "sha256": "702d2267ea515b799bd5bc588e41b2836dffdf7aa6cf16f5623abfe641d0cc62",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-claude-layer-v2.png",
                          "sourceSha256": "f4c2f03acf3b9755daeac8e42b4eef2f0b3cfe063ed616be65461884937477de",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-scope-claude-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-scope-claude-layer-v2-1600.avif",
                        "sha256": "21b92bdddb73d0390913265f1e799ca7494a793245ec016fb1ac47863ab487de",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/brain/home-claude-scope-claude-layer-v2.png",
                          "sourceSha256": "f4c2f03acf3b9755daeac8e42b4eef2f0b3cfe063ed616be65461884937477de",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-scope-claude-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "light",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "claude",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-process-procedure",
            "r": [
              0,
              0,
              0.55,
              0.35
            ]
          },
          {
            "img": "home-process-source-rule",
            "r": [
              0.55,
              0,
              0.45,
              0.35
            ]
          },
          {
            "img": "home-brain-initialize",
            "r": [
              0,
              0.35,
              0.5,
              0.32
            ]
          },
          {
            "img": "home-process-connect",
            "r": [
              0.5,
              0.35,
              0.5,
              0.32
            ]
          },
          {
            "img": "home-codex-skills",
            "r": [
              0,
              0.67,
              1,
              0.17
            ]
          },
          {
            "img": "home-claude-scope",
            "r": [
              0,
              0.84,
              1,
              0.16
            ]
          }
        ]
      ]
    },
    {
      "id": "access",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/access/home-access-page-master-v2",
      "score": 0,
      "room": "office",
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.42,
            0.5
          ],
          "ar": [
            0,
            0,
            0.42,
            0.5
          ],
          "img": "home-process-permissions",
          "alt": "Matt at a monitor (screen faces Matt; we see it over his shoulder): an account list with one account row switched off, its toggle grey and a lock icon.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "click",
              "gain": 0.45
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. 5:20 a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.3511904761904762,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.6949
              },
              "speech": {
                "id": "home-access-home-process-permissions-b1-20261015",
                "src": "/comic/speech/home-20261015/home-access-home-process-permissions-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 2.815533,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "The old sending\naccount stays\ndisabled.",
              "x": 0.65915,
              "y": 0.03,
              "w": 0.31085,
              "tail": [
                0.32924,
                0.33
              ],
              "phone": {
                "x": 0.4114,
                "y": 0.1283,
                "w": 0.7,
                "tail": [
                  0.3276,
                  0.2889
                ]
              },
              "speech": {
                "id": "home-access-check-home-process-permissions-b0",
                "src": "/comic/speech/home-20261012b/home-access-check-home-process-permissions-b0-eq-v1.mp3",
                "durationSeconds": 1.996916,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/access/home-process-permissions-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/access/home-process-permissions-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-process-permissions",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-permissions-plate-v1.png",
              "sha256": "5b142091df100175b139a4a939ebe32cdaa0b131f0306100f8340187d69b8c9c",
              "recordId": "home-process-permissions-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-permissions-plate-v1-1600.webp",
                  "sha256": "e55b4d74cb25f9081be6a9fa86e6acc7cc418043ebd80017a9edc18cd8a1e61e",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                    "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-permissions-plate-v1.png",
                    "sourceSha256": "5b142091df100175b139a4a939ebe32cdaa0b131f0306100f8340187d69b8c9c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-permissions-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-permissions-plate-v1-1600.avif",
                  "sha256": "4c6a1604dbfcade1bed3e89cdcd46494ebc2746f26bd7336af2a556e078321d5",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                    "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-permissions-plate-v1.png",
                    "sourceSha256": "5b142091df100175b139a4a939ebe32cdaa0b131f0306100f8340187d69b8c9c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-permissions-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.14103,
                0,
                0.71795,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.42,
            0,
            0.3,
            0.5
          ],
          "ar": [
            0.42,
            0,
            0.3,
            0.5
          ],
          "img": "home-process-scope",
          "alt": "Close on the screen over Matt’s shoulder: a new account card with two green ticks (read, draft) and one red cross (send).",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [
            {
              "kind": "click",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "This account reads\nagreed sources and\nwrites drafts.",
              "x": 0.475,
              "y": 0.0138,
              "w": 0.50185,
              "tail": [
                0.4219,
                0.171
              ],
              "phone": {
                "x": 0.0331,
                "y": 0.3128,
                "w": 0.7,
                "tail": [
                  0.4009,
                  0.3517
                ]
              },
              "speech": {
                "id": "home-access-check-home-process-permissions-b1",
                "src": "/comic/speech/home-20261012b/home-access-check-home-process-permissions-b1-eq-v1.mp3",
                "durationSeconds": 3.204354,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/access/home-process-scope-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/access/home-process-scope-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.03125,
              1,
              0.9375
            ],
            "canonicalSource": {
              "panelId": "home-process-scope",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-scope-plate-v1.png",
              "sha256": "1cc25a7cc244d9a4ba96a335f02ab18cfd06f914fa172cce32cc1fab2aa2fba4",
              "recordId": "home-process-scope-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-scope-plate-v1-1600.webp",
                  "sha256": "82d708062b7e455760a6dbf1780632c7bc515d7cb1c3770c83f12fb4d4e1833e",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                    "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-scope-plate-v1.png",
                    "sourceSha256": "1cc25a7cc244d9a4ba96a335f02ab18cfd06f914fa172cce32cc1fab2aa2fba4",
                    "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-scope-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-scope-plate-v1-1600.avif",
                  "sha256": "eb97ef328b876f31dd8b57c10df0c5f70f4e7cbce9c7e291f33dfbb43a30b8dd",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                    "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-scope-plate-v1.png",
                    "sourceSha256": "1cc25a7cc244d9a4ba96a335f02ab18cfd06f914fa172cce32cc1fab2aa2fba4",
                    "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-scope-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.11282,
                0,
                0.77436,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.72,
            0,
            0.28,
            0.5
          ],
          "ar": [
            0.72,
            0,
            0.28,
            0.5
          ],
          "img": "home-process-refusal",
          "alt": "Codex projection, gauntlets teal, stops with one palm raised in refusal; a red stop shape flashes on the monitor beside it (screen faces Codex and Matt).",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "alarm",
              "gain": 0.2
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Test send requested.\nPermission denied.",
              "x": 0.10689,
              "y": 0.305,
              "w": 0.58532,
              "tail": [
                0.39955,
                0.1982
              ],
              "phone": {
                "x": 0.0385,
                "y": 0.4897,
                "w": 0.7158,
                "tail": [
                  0.3222,
                  0.197
                ]
              },
              "speech": {
                "id": "home-access-check-home-process-refusal-b0",
                "src": "/comic/speech/home-20261012b/home-access-check-home-process-refusal-b0-eq-v1.mp3",
                "durationSeconds": 2.142041,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-process-refusal-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-process-refusal-composite-v2-1600.avif"
            ],
            "ar": [
              0.00222,
              0,
              0.99556,
              1
            ],
            "canonicalSource": {
              "panelId": "home-process-refusal",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-composite-v2.png",
              "sha256": "ed0bf319400e0f31cdaa1d81486e55efbd03f2a65e9ca91cde6149498faecbb7",
              "recordId": "home-process-refusal-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-refusal-composite-v2-1600.webp",
                  "sha256": "780a17d79e5c2e5d136e74ddce9b20b3c6f8f60e7948baca38b76a1f32dadce7",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-composite-v2.png",
                    "sourceSha256": "ed0bf319400e0f31cdaa1d81486e55efbd03f2a65e9ca91cde6149498faecbb7",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-refusal-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-refusal-composite-v2-1600.avif",
                  "sha256": "1e88a9b94a9b56510f9bfb6617f81043a2664e948e2172a59b23ad74b4872a12",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-composite-v2.png",
                    "sourceSha256": "ed0bf319400e0f31cdaa1d81486e55efbd03f2a65e9ca91cde6149498faecbb7",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-refusal-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.17057,
                0,
                0.68063,
                1
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-process-refusal-projection",
              "at": 0,
              "alt": "Codex projection, gauntlets teal, stops with one palm raised in refusal; a red stop shape flashes on the monitor beside it (screen faces Codex and Matt).",
              "src": "/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.webp",
              "ar": [
                0.00222,
                0,
                0.99556,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-process-refusal",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-plate-v1.png",
                "sha256": "d452ee147cdedd31a39a08a351761f6f064136ace797757b5343706713096a8f",
                "recordId": "home-process-refusal-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.webp",
                    "sha256": "364327bb81f36b14b71f9f73351cc016ba47086b6166ddd970859e81d370787d",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                      "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-plate-v1.png",
                      "sourceSha256": "d452ee147cdedd31a39a08a351761f6f064136ace797757b5343706713096a8f",
                      "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.avif",
                    "sha256": "5dacb1fd1b64581d09d71e88cdb875d69c4bf8178f8740fcba6324598a460a6a",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                      "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-plate-v1.png",
                      "sourceSha256": "d452ee147cdedd31a39a08a351761f6f064136ace797757b5343706713096a8f",
                      "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.17057,
                  0,
                  0.68063,
                  1
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-process-refusal",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-plate-v1.png",
                    "sha256": "d452ee147cdedd31a39a08a351761f6f064136ace797757b5343706713096a8f",
                    "recordId": "home-process-refusal-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.webp",
                        "sha256": "364327bb81f36b14b71f9f73351cc016ba47086b6166ddd970859e81d370787d",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                          "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-plate-v1.png",
                          "sourceSha256": "d452ee147cdedd31a39a08a351761f6f064136ace797757b5343706713096a8f",
                          "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.avif",
                        "sha256": "5dacb1fd1b64581d09d71e88cdb875d69c4bf8178f8740fcba6324598a460a6a",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                          "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-plate-v1.png",
                          "sourceSha256": "d452ee147cdedd31a39a08a351761f6f064136ace797757b5343706713096a8f",
                          "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-refusal-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-process-refusal-codex-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-process-refusal",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-codex-layer-v2.png",
                    "sha256": "b53a2c7df60eddbebac3602acb41aad4ba31fb19a651847fd4a78f6b5ea836a6",
                    "recordId": "home-process-refusal-codex-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-refusal-codex-layer-v2-1600.webp",
                        "sha256": "266e4079374dcd0332d9b829ce4720649188aa657f3a3a076811e1810a42852d",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-codex-layer-v2.png",
                          "sourceSha256": "b53a2c7df60eddbebac3602acb41aad4ba31fb19a651847fd4a78f6b5ea836a6",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-refusal-codex-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-refusal-codex-layer-v2-1600.avif",
                        "sha256": "86cab41f460be7c8e5842ac76581cf5a3a3b06a6653215e1854f53dad46bef96",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-refusal-codex-layer-v2.png",
                          "sourceSha256": "b53a2c7df60eddbebac3602acb41aad4ba31fb19a651847fd4a78f6b5ea836a6",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-refusal-codex-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "push",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0.5,
            0.28,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.28,
            0.5
          ],
          "img": "home-marco-choose",
          "alt": "Marco, coffee in hand, nods with relief, a small tired smile.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Good. I choose\nwhat goes out.",
              "x": 0.16828,
              "y": 0.03,
              "w": 0.44246,
              "tail": [
                0.38951,
                0.43
              ],
              "phone": {
                "x": 0.03,
                "y": 0.53,
                "w": 0.7306,
                "tail": [
                  0.14923,
                  0.43
                ]
              },
              "speech": {
                "id": "home-access-check-home-process-refusal-b1",
                "src": "/comic/speech/home-20261012b/home-access-check-home-process-refusal-b1-eq-v1.mp3",
                "durationSeconds": 1.811156,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/access/home-marco-choose-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/access/home-marco-choose-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-marco-choose",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-marco-choose-plate-v1.png",
              "sha256": "7b7c039bdb24a473e7c89de05716e1bc1b64beb035b18016e95b00fb57c3738c",
              "recordId": "home-marco-choose-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/access/home-marco-choose-plate-v1-1600.webp",
                  "sha256": "41cd32ae4e44e6dd6191f74fb80d78c0710c2cb5b5a68dac6f6359c01bf2f9e0",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                    "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-marco-choose-plate-v1.png",
                    "sourceSha256": "7b7c039bdb24a473e7c89de05716e1bc1b64beb035b18016e95b00fb57c3738c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/access/home-marco-choose-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/access/home-marco-choose-plate-v1-1600.avif",
                  "sha256": "eeae733c603051caae1d148a5c12784827aa2290e247529ab28004707d9824e4",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                    "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-marco-choose-plate-v1.png",
                    "sourceSha256": "7b7c039bdb24a473e7c89de05716e1bc1b64beb035b18016e95b00fb57c3738c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/access/home-marco-choose-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.22513,
                0,
                0.54974,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.28,
            0.5,
            0.3,
            0.5
          ],
          "ar": [
            0.28,
            0.5,
            0.3,
            0.5
          ],
          "img": "home-process-output",
          "alt": "Codex projection beside the monitor showing a draft quote where every line has a small source tag; Matt compares it against a printed checked example in his hand (printed face toward him).",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "light"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Each figure\nnames its source.",
              "x": 0.49037,
              "y": 0.03,
              "w": 0.47963,
              "tail": [
                0.11,
                0.18309
              ],
              "phone": {
                "x": 0.2397,
                "y": 0.0262,
                "w": 0.7,
                "tail": [
                  0.0947,
                  0.2014
                ]
              },
              "speech": {
                "id": "home-output-home-process-output-b0",
                "src": "/comic/speech/home-20261012b/home-output-home-process-output-b0-eq-v1.mp3",
                "durationSeconds": 1.593469,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Compare it with\nthe checked\nexample.",
              "x": 0.28241,
              "y": 0.555,
              "w": 0.43519,
              "tail": [
                0.5,
                0.436
              ],
              "phone": {
                "x": 0.0413,
                "y": 0.445,
                "w": 0.7133,
                "tail": [
                  0.7735,
                  0.436
                ]
              },
              "speech": {
                "id": "home-output-home-process-output-b1",
                "src": "/comic/speech/home-20261012b/home-output-home-process-output-b1-eq-v1.mp3",
                "durationSeconds": 1.811156,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-process-output-composite-v3-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-process-output-composite-v3-1600.avif"
            ],
            "ar": [
              0,
              0.03125,
              1,
              0.9375
            ],
            "canonicalSource": {
              "panelId": "home-process-output",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-composite-v3.png",
              "sha256": "6d24946c83feeb7ce2abd11ad7ca7b88a8c0034c4284de334fb73a3bd74b47db",
              "recordId": "home-process-output-composite-v3",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-output-composite-v3-1600.webp",
                  "sha256": "cc06cd0b21ba1c31cc2007eb47cddb29932f654a6177c847b39ed7db6a98e81a",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-composite-v3.png",
                    "sourceSha256": "6d24946c83feeb7ce2abd11ad7ca7b88a8c0034c4284de334fb73a3bd74b47db",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-output-composite-v3-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-output-composite-v3-1600.avif",
                  "sha256": "7757a411f2847f5463d864a81dcbcc0555f20333c78f16951c3ac1eab43af13f",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-composite-v3.png",
                    "sourceSha256": "6d24946c83feeb7ce2abd11ad7ca7b88a8c0034c4284de334fb73a3bd74b47db",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-output-composite-v3-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0,
                0.63351,
                1
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-process-output-projection",
              "at": 0,
              "alt": "Codex projection beside the monitor showing a draft quote where every line has a small source tag; Matt compares it against a printed checked example in his hand (printed face toward him).",
              "src": "/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.webp",
              "ar": [
                0,
                0.03125,
                1,
                0.9375
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-process-output",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-plate-v1.png",
                "sha256": "2d12586c6a7036fef44f0867c498413173105d54842ab041b5cfdc724ca645ea",
                "recordId": "home-process-output-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.webp",
                    "sha256": "83ac1b70c48096805d30211bfcd8e6c647b3375aee616e754d1d55b137a86c7e",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                      "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-plate-v1.png",
                      "sourceSha256": "2d12586c6a7036fef44f0867c498413173105d54842ab041b5cfdc724ca645ea",
                      "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.avif",
                    "sha256": "fc1ccaa763ec53b08a5db5b4bff734c697e2a83a1faf40c9ab655b5c833497a1",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                      "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-plate-v1.png",
                      "sourceSha256": "2d12586c6a7036fef44f0867c498413173105d54842ab041b5cfdc724ca645ea",
                      "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0,
                  0,
                  0.63351,
                  1
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-process-output",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-plate-v1.png",
                    "sha256": "2d12586c6a7036fef44f0867c498413173105d54842ab041b5cfdc724ca645ea",
                    "recordId": "home-process-output-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.webp",
                        "sha256": "83ac1b70c48096805d30211bfcd8e6c647b3375aee616e754d1d55b137a86c7e",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                          "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-plate-v1.png",
                          "sourceSha256": "2d12586c6a7036fef44f0867c498413173105d54842ab041b5cfdc724ca645ea",
                          "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.avif",
                        "sha256": "fc1ccaa763ec53b08a5db5b4bff734c697e2a83a1faf40c9ab655b5c833497a1",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                          "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-plate-v1.png",
                          "sourceSha256": "2d12586c6a7036fef44f0867c498413173105d54842ab041b5cfdc724ca645ea",
                          "outputPath": "site/public/comic/home/rebuild-20261014/access/home-process-output-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-process-output-codex-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-process-output",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-codex-layer-v3.png",
                    "sha256": "263393e441fa0ce2cb6eef47d58b2ea5ce449ae688d82183813be7593d300804",
                    "recordId": "home-process-output-codex-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-output-codex-layer-v3-1600.webp",
                        "sha256": "5970c47557289153047479b43018371100934433f57e79b0fe6d5f590a8a6a01",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-codex-layer-v3.png",
                          "sourceSha256": "263393e441fa0ce2cb6eef47d58b2ea5ce449ae688d82183813be7593d300804",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-output-codex-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-process-output-codex-layer-v3-1600.avif",
                        "sha256": "4428e033b61fbeef0c2f28739f893a6a5140203d6d3ff4e085c732004028e9ec",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-process-output-codex-layer-v3.png",
                          "sourceSha256": "263393e441fa0ce2cb6eef47d58b2ea5ce449ae688d82183813be7593d300804",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-process-output-codex-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "light",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.58,
            0.5,
            0.42,
            0.5
          ],
          "ar": [
            0.58,
            0.5,
            0.42,
            0.5
          ],
          "img": "home-codex-gaps",
          "alt": "Wide: Codex projection points to two empty slots on the screen; Marco and Matt look at the window where dawn is coming up behind the lattice tower.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Two gaps. Labour\nhours. The\nsigned terms.",
              "x": 0.64328,
              "y": 0.03,
              "w": 0.32672,
              "tail": [
                0.15848,
                0.2051
              ],
              "phone": {
                "x": 0.03,
                "y": 0.53,
                "w": 0.7
              },
              "speech": {
                "id": "home-access-home-codex-gaps-b1-20261015",
                "src": "/comic/speech/home-20261015/home-access-home-codex-gaps-b1-eq-v1.mp3",
                "durationSeconds": 3.317551,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Sam and Ruth.\nThey’re in\nat eight.",
              "x": 0.03,
              "y": 0.305,
              "w": 0.2791,
              "tail": [
                0.63058,
                0.43
              ],
              "phone": {
                "x": 0.15205,
                "y": 0.78,
                "w": 0.7,
                "tail": [
                  0.91454,
                  0.43
                ]
              },
              "speech": {
                "id": "home-access-home-codex-gaps-b2-20261015",
                "src": "/comic/speech/home-20261015/home-access-home-codex-gaps-b2-eq-v1.mp3",
                "durationSeconds": 1.904036,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-gaps-composite-v3-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-gaps-composite-v3-1600.avif"
            ],
            "ar": [
              0.00222,
              0,
              0.99556,
              1
            ],
            "canonicalSource": {
              "panelId": "home-codex-gaps",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-composite-v3.png",
              "sha256": "0d6f416606e9c64897c7928a504c11717408c5dd454b9f750a3c7a2718fe0de3",
              "recordId": "home-codex-gaps-composite-v3",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-gaps-composite-v3-1600.webp",
                  "sha256": "ae5886890ee2dd274b7807bc43ad79a410f0138da9c3584bcc987559b28b88b5",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-composite-v3.png",
                    "sourceSha256": "0d6f416606e9c64897c7928a504c11717408c5dd454b9f750a3c7a2718fe0de3",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-gaps-composite-v3-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-gaps-composite-v3-1600.avif",
                  "sha256": "530ced15c3a578ba4e856b2f068a53411a69c856a2678047983839dabc0b4869",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-composite-v3.png",
                    "sourceSha256": "0d6f416606e9c64897c7928a504c11717408c5dd454b9f750a3c7a2718fe0de3",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-gaps-composite-v3-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.022,
                0,
                0.94208,
                1
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-codex-gaps-projection",
              "at": 0,
              "alt": "Wide: Codex projection points to two empty slots on the screen; Marco and Matt look at the window where dawn is coming up behind the lattice tower.",
              "src": "/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.webp",
              "ar": [
                0.00222,
                0,
                0.99556,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-gaps",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-plate-v1.png",
                "sha256": "4d8141c0008d54cac8de0623259a3b0edd69a867bedb710e95365d7476c73b42",
                "recordId": "home-codex-gaps-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.webp",
                    "sha256": "23e8e4090c2f0b8b0b434458dfc375600188e548871d24381bb9770010d4d015",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                      "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-plate-v1.png",
                      "sourceSha256": "4d8141c0008d54cac8de0623259a3b0edd69a867bedb710e95365d7476c73b42",
                      "outputPath": "site/public/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.avif",
                    "sha256": "aecb4e5de50f2067e7c1cfeca08180a2e6cb27cec70d9da00af8e4ba00b2d784",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                      "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-plate-v1.png",
                      "sourceSha256": "4d8141c0008d54cac8de0623259a3b0edd69a867bedb710e95365d7476c73b42",
                      "outputPath": "site/public/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.022,
                  0,
                  0.94208,
                  1
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-gaps",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-plate-v1.png",
                    "sha256": "4d8141c0008d54cac8de0623259a3b0edd69a867bedb710e95365d7476c73b42",
                    "recordId": "home-codex-gaps-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.webp",
                        "sha256": "23e8e4090c2f0b8b0b434458dfc375600188e548871d24381bb9770010d4d015",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                          "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-plate-v1.png",
                          "sourceSha256": "4d8141c0008d54cac8de0623259a3b0edd69a867bedb710e95365d7476c73b42",
                          "outputPath": "site/public/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.avif",
                        "sha256": "aecb4e5de50f2067e7c1cfeca08180a2e6cb27cec70d9da00af8e4ba00b2d784",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/access-encodings-v2.json",
                          "sha256": "a58980703cbc5feca3bf3f2109b2a1ff679a9378162913282e898132dea9af0d",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-plate-v1.png",
                          "sourceSha256": "4d8141c0008d54cac8de0623259a3b0edd69a867bedb710e95365d7476c73b42",
                          "outputPath": "site/public/comic/home/rebuild-20261014/access/home-codex-gaps-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-gaps-codex-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-gaps",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-codex-layer-v3.png",
                    "sha256": "73bd40ad11d39cf6a15e63f7be1d34802b05a6174b5407bdcbd961e4f1ff9251",
                    "recordId": "home-codex-gaps-codex-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-gaps-codex-layer-v3-1600.webp",
                        "sha256": "6f4cdb948fb8a034c372a14750cee791392ab878be53569eb81e9a1b0bf63408",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-codex-layer-v3.png",
                          "sourceSha256": "73bd40ad11d39cf6a15e63f7be1d34802b05a6174b5407bdcbd961e4f1ff9251",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-gaps-codex-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-gaps-codex-layer-v3-1600.avif",
                        "sha256": "732b7b30b78c8350f3c67548e1eb662c94c8cde869cecd63181b35c624db6d37",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/access/home-codex-gaps-codex-layer-v3.png",
                          "sourceSha256": "73bd40ad11d39cf6a15e63f7be1d34802b05a6174b5407bdcbd961e4f1ff9251",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-gaps-codex-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "drift-left",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-process-permissions",
            "r": [
              0,
              0,
              0.58,
              0.3
            ]
          },
          {
            "img": "home-process-scope",
            "r": [
              0.58,
              0,
              0.42,
              0.3
            ]
          },
          {
            "img": "home-process-refusal",
            "r": [
              0,
              0.3,
              0.36,
              0.3
            ]
          },
          {
            "img": "home-marco-choose",
            "r": [
              0.36,
              0.3,
              0.3,
              0.3
            ]
          },
          {
            "img": "home-process-output",
            "r": [
              0.66,
              0.3,
              0.34,
              0.3
            ]
          },
          {
            "img": "home-codex-gaps",
            "r": [
              0,
              0.6,
              1,
              0.4
            ]
          }
        ]
      ]
    },
    {
      "id": "lobby",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/lobby/home-lobby-page-master-v1",
      "score": 0,
      "room": "street",
      "panels": [
        {
          "at": 0,
          "room": "street",
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
          "img": "home-lobby",
          "alt": "Wide sunny lobby: Ruth (short silver bob, navy cardigan, glasses on a chain, holding a labelled folder) and Sam (beard, navy work jacket with hi-vis stripes, hard hat under his arm) walk in through the glass doors; across the lobby Marco and Matt step out of an elevator, rumpled after the night.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [
            {
              "kind": "door",
              "gain": 0.35
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "The Keon Tower\nlobby. Friday,\n8:05 a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.3,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.4000556756756757
              },
              "speech": {
                "id": "home-lobby-home-lobby-b1-20261015",
                "src": "/comic/speech/home-20261015/home-lobby-home-lobby-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 3.834399,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/lobby/home-lobby-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/lobby/home-lobby-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.00182,
              1,
              0.99637
            ],
            "canonicalSource": {
              "panelId": "home-lobby",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-lobby-plate-v1.png",
              "sha256": "5fedcf245149a68523b8b2cc948d5fbbfec4076c7c827c8c1a246b635cd59f7c",
              "recordId": "home-lobby-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-lobby-plate-v1-1600.webp",
                  "sha256": "40fd317cd13a6baa7547654c4b505e6b343b9b10844cd3172b7842f7462d3998",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-lobby-plate-v1.png",
                    "sourceSha256": "5fedcf245149a68523b8b2cc948d5fbbfec4076c7c827c8c1a246b635cd59f7c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-lobby-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-lobby-plate-v1-1600.avif",
                  "sha256": "41148874e7b8aa4c07869719b41353ec840fd278140a9392eb5b8807a2eef29c",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-lobby-plate-v1.png",
                    "sourceSha256": "5fedcf245149a68523b8b2cc948d5fbbfec4076c7c827c8c1a246b635cd59f7c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-lobby-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.052,
                1,
                0.63281
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0.6,
            0,
            0.4,
            0.5
          ],
          "ar": [
            0.6,
            0,
            0.4,
            0.5
          ],
          "img": "home-ruth",
          "alt": "Ruth holds her phone out toward Marco, its screen facing Marco and the camera at an angle: an email with a contract attachment headed by a client logo shape. Her expression: firm, not angry.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "buzz",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Ruth Orr. Contracts,\nSittler Business\nServices.\nShe keeps every\nsigned order.",
              "characterIntro": true,
              "x": 0.03,
              "y": 0.95,
              "w": 0.3854166666666667,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.4930394594594595
              },
              "speech": {
                "id": "home-lobby-home-ruth-b1-20261015",
                "src": "/comic/speech/home-20261015/home-lobby-home-ruth-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 5.708299,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "ruth",
              "text": "A customer sent me\nthis at 2:07. It’s\nGilmour\n& Clark’s contract.",
              "x": 0.3329,
              "y": 0.2971,
              "w": 0.39306,
              "tail": [
                0.2374,
                0.3129
              ],
              "phone": {
                "x": 0.4481,
                "y": 0.3519,
                "w": 0.48532,
                "tail": [
                  0.2374,
                  0.3797
                ]
              },
              "speech": {
                "id": "home-lobby-home-ruth-b2-20261015",
                "src": "/comic/speech/home-20261015/home-lobby-home-ruth-b2-eq-v1.mp3",
                "durationSeconds": 5.067755,
                "provider": "Fish Audio",
                "characterId": "ruth",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/lobby/home-ruth-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/lobby/home-ruth-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-ruth",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-ruth-plate-v1.png",
              "sha256": "9e11b80f12911722d2a5f7ed65b60d91c83f3b7d151ba2166bde3fef426d836a",
              "recordId": "home-ruth-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-ruth-plate-v1-1600.webp",
                  "sha256": "01c22f2f60ab8494339fe644073b4a0e75e11a131cea5c0c421f184f375d0b2e",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-ruth-plate-v1.png",
                    "sourceSha256": "9e11b80f12911722d2a5f7ed65b60d91c83f3b7d151ba2166bde3fef426d836a",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-ruth-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-ruth-plate-v1-1600.avif",
                  "sha256": "957c434d9657346e0ad6a0e62c04c46f3e2ccf3204a7cc3d347e49303bee36a0",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-ruth-plate-v1.png",
                    "sourceSha256": "9e11b80f12911722d2a5f7ed65b60d91c83f3b7d151ba2166bde3fef426d836a",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-ruth-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.02,
                1,
                0.78689
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0,
            0.5,
            0.26,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-sam",
          "alt": "Sam, hard hat under his arm, taps a page of the contract printout in his hand (printed face toward him; we see it at an angle) with a thick finger.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Sam Howe. Sittler’s\ninstallation manager.\nHis crew starts\nMonday.",
              "characterIntro": true,
              "x": 0.03,
              "y": 0.95,
              "w": 0.6433333333333333,
              "phone": {
                "x": 0.36,
                "y": 0.95,
                "w": 0.8447504504504504
              },
              "speech": {
                "id": "home-lobby-home-sam-b1-20261015",
                "src": "/comic/speech/home-20261015/home-lobby-home-sam-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 4.714467,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "And it dropped the\nsite safety clause.\nMy crew can’t start.",
              "x": 0.1418,
              "y": 0.2794,
              "w": 0.6,
              "tail": [
                0.4585,
                0.2281
              ],
              "phone": {
                "x": 0.0229,
                "y": 0.2796,
                "w": 0.83628,
                "tail": [
                  0.4588,
                  0.2121
                ]
              },
              "speech": {
                "id": "home-lobby-home-sam-b2-20261015",
                "src": "/comic/speech/home-20261015/home-lobby-home-sam-b2-eq-v1.mp3",
                "durationSeconds": 3.448163,
                "provider": "Fish Audio",
                "characterId": "sam",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/lobby/home-sam-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/lobby/home-sam-plate-v1-1600.avif"
            ],
            "ar": [
              0.00415,
              0,
              0.99171,
              1
            ],
            "canonicalSource": {
              "panelId": "home-sam",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-sam-plate-v1.png",
              "sha256": "e42549029cb97fc4af64e56a6ff886deae2a5f7f323e8798bb8bef84bd192bb9",
              "recordId": "home-sam-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-sam-plate-v1-1600.webp",
                  "sha256": "e1e8b52f077ff7d265168aea191582b964cbee6c60ea9f4a4a6957ec99910715",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-sam-plate-v1.png",
                    "sourceSha256": "e42549029cb97fc4af64e56a6ff886deae2a5f7f323e8798bb8bef84bd192bb9",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-sam-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-sam-plate-v1-1600.avif",
                  "sha256": "d72ecb770a53e8b5997a6e36085288a9d0ef63892cf1917920611c91174767da",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-sam-plate-v1.png",
                    "sourceSha256": "e42549029cb97fc4af64e56a6ff886deae2a5f7f323e8798bb8bef84bd192bb9",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-sam-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.056,
                1,
                0.81651
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0.26,
            0.5,
            0.21,
            0.5
          ],
          "ar": [
            0.25,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-marco-sorry",
          "alt": "Marco faces Ruth and Sam and owns the mistake: serious, contrite, not smiling, one hand on his chest. Ruth and Sam listen, unsmiling.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "shadow"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "That’s my quote.\nChat built it. It\nwent to everyone.",
              "x": 0.18971,
              "y": 0.43,
              "w": 0.57556,
              "tail": [
                0.47749,
                0.31
              ],
              "phone": {
                "x": 0.13827,
                "y": 0.43,
                "w": 0.71861,
                "tail": [
                  0.475,
                  0.31
                ]
              },
              "speech": {
                "id": "home-lobby-home-marco-sorry-b1-20261015",
                "src": "/comic/speech/home-20261015/home-lobby-home-marco-sorry-b1-eq-v1.mp3",
                "durationSeconds": 3.343673,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/lobby/home-marco-sorry-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/lobby/home-marco-sorry-plate-v1-1600.avif"
            ],
            "ar": [
              0.05556,
              0,
              0.88889,
              1
            ],
            "canonicalSource": {
              "panelId": "home-marco-sorry",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-marco-sorry-plate-v1.png",
              "sha256": "71c91e981a2052f50f9a27bfb0ed9966a023a9f412f35705da7a2b573f98d133",
              "recordId": "home-marco-sorry-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-marco-sorry-plate-v1-1600.webp",
                  "sha256": "624335ae06835e8a9ec4950a2449169e0728579a6b72988991a894f175c63d10",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-marco-sorry-plate-v1.png",
                    "sourceSha256": "71c91e981a2052f50f9a27bfb0ed9966a023a9f412f35705da7a2b573f98d133",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-marco-sorry-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-marco-sorry-plate-v1-1600.avif",
                  "sha256": "5795fcbcccce6e331fbe53d5924f9c1a316058fbc6035e37782db2acb0c2653e",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-marco-sorry-plate-v1.png",
                    "sourceSha256": "71c91e981a2052f50f9a27bfb0ed9966a023a9f412f35705da7a2b573f98d133",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-marco-sorry-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.0904,
                0,
                0.80337,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0.47,
            0.5,
            0.23,
            0.5
          ],
          "ar": [
            0.5,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-ruth-order",
          "alt": "Ruth pulls a signed order from her labelled folder, holding it so she can read it (printed face toward her; we see the signature block through the paper edge at an angle).",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.35
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "ruth",
              "text": "I have the\nsigned order.\nLet’s compare.",
              "x": 0.03,
              "y": 0.33,
              "w": 0.49556,
              "tail": [
                0.38749,
                0.23
              ],
              "phone": {
                "x": 0.04972,
                "y": 0.33,
                "w": 0.73554,
                "tail": [
                  0.4,
                  0.1976
                ]
              },
              "speech": {
                "id": "home-lobby-home-ruth-order-b1-20261015",
                "src": "/comic/speech/home-20261015/home-lobby-home-ruth-order-b1-eq-v1.mp3",
                "durationSeconds": 2.899592,
                "provider": "Fish Audio",
                "characterId": "ruth",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/lobby/home-ruth-order-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/lobby/home-ruth-order-plate-v1-1600.avif"
            ],
            "ar": [
              0.05556,
              0,
              0.88889,
              1
            ],
            "canonicalSource": {
              "panelId": "home-ruth-order",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-ruth-order-plate-v1.png",
              "sha256": "21381f3cc2215501461e374dac0f83a4d72587ca9e21a3cb29b72cc694c532be",
              "recordId": "home-ruth-order-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-ruth-order-plate-v1-1600.webp",
                  "sha256": "54c55682938585be4d3636305602ada9204651da4f5699cdec614406f4fb24d7",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-ruth-order-plate-v1.png",
                    "sourceSha256": "21381f3cc2215501461e374dac0f83a4d72587ca9e21a3cb29b72cc694c532be",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-ruth-order-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-ruth-order-plate-v1-1600.avif",
                  "sha256": "8d4c8e34f9dfae8fab7ac74115aa89e4129ea1b76a5744ab21fd87d79110223a",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-ruth-order-plate-v1.png",
                    "sourceSha256": "21381f3cc2215501461e374dac0f83a4d72587ca9e21a3cb29b72cc694c532be",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-ruth-order-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.05357,
                1,
                0.89286
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0.7,
            0.5,
            0.3,
            0.5
          ],
          "ar": [
            0.75,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-elevator-up",
          "alt": "Inside an open elevator, facing the camera: Matt, Ruth, Marco and Sam (exactly these four, nobody else), doors starting to close; sunlit lobby behind them. Sam pats a rolled card in his jacket pocket.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "door",
              "gain": 0.4,
              "delay": 1
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Floor 31. Bring the\n2026 rate card, Sam.",
              "x": 0.0121,
              "y": 0.4332,
              "w": 0.6,
              "tail": [
                0.1756,
                0.2844
              ],
              "phone": {
                "x": 0.03,
                "y": 0.53,
                "w": 0.78254,
                "tail": [
                  0.19,
                  0.3544
                ]
              },
              "speech": {
                "id": "home-lobby-home-elevator-up-b1-20261015",
                "src": "/comic/speech/home-20261015/home-lobby-home-elevator-up-b1-eq-v1.mp3",
                "durationSeconds": 2.879274,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Already in\nmy pocket.",
              "x": 0.6384,
              "y": 0.4332,
              "w": 0.38889,
              "tail": [
                0.8656,
                0.3617
              ],
              "phone": {
                "x": 0.43355,
                "y": 0.03,
                "w": 0.57997,
                "tail": [
                  0.84,
                  0.3992
                ]
              },
              "speech": {
                "id": "home-lobby-home-elevator-up-b2-20261015",
                "src": "/comic/speech/home-20261015/home-lobby-home-elevator-up-b2-eq-v1.mp3",
                "durationSeconds": 1.515102,
                "provider": "Fish Audio",
                "characterId": "sam",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/lobby/home-elevator-up-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/lobby/home-elevator-up-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-elevator-up",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-elevator-up-plate-v1.png",
              "sha256": "983308bfcfe7f4079af73eed996fd00d34f7d34838b3bae00bdee5e2a64dcaa6",
              "recordId": "home-elevator-up-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-elevator-up-plate-v1-1600.webp",
                  "sha256": "57d2bce5ddf0368eff84d512311937ada21fdc1b7fe98659d202e5904c8a133a",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-elevator-up-plate-v1.png",
                    "sourceSha256": "983308bfcfe7f4079af73eed996fd00d34f7d34838b3bae00bdee5e2a64dcaa6",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-elevator-up-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/lobby/home-elevator-up-plate-v1-1600.avif",
                  "sha256": "f6e6bb2974989546aac3c2aa26d2773644a3dd27ef5dcc827268d53610f50e4e",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/lobby-encodings-v1.json",
                    "sha256": "6e14dd8c9c81a2692a492ebcccd1f5d6c11bf9d85cdc141cd8c57512d9e7de31",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/lobby/home-elevator-up-plate-v1.png",
                    "sourceSha256": "983308bfcfe7f4079af73eed996fd00d34f7d34838b3bae00bdee5e2a64dcaa6",
                    "outputPath": "site/public/comic/home/rebuild-20261014/lobby/home-elevator-up-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.05278,
                1,
                0.89444
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-lobby",
            "r": [
              0,
              0,
              1,
              0.17
            ]
          },
          {
            "img": "home-ruth",
            "r": [
              0,
              0.17,
              1,
              0.3
            ]
          },
          {
            "img": "home-sam",
            "r": [
              0,
              0.47,
              0.6,
              0.28
            ]
          },
          {
            "img": "home-marco-sorry",
            "r": [
              0.6,
              0.47,
              0.4,
              0.28
            ]
          },
          {
            "img": "home-ruth-order",
            "r": [
              0,
              0.75,
              0.5,
              0.25
            ]
          },
          {
            "img": "home-elevator-up",
            "r": [
              0.5,
              0.75,
              0.5,
              0.25
            ]
          }
        ]
      ]
    },
    {
      "id": "compare",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/compare/home-compare-page-master-v2",
      "score": 0.3,
      "room": "office",
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.42,
            0.5
          ],
          "ar": [
            0,
            0,
            0.42,
            0.5
          ],
          "img": "home-compare-table",
          "alt": "Ruth lays the signed order and the sent contract side by side on the sunlit table, printed faces up; Marco, Sam and Matt lean over them.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.4
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. 8:12 a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.3511904761904762,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.6694
              },
              "speech": {
                "id": "home-compare-home-compare-table-b1-20261015",
                "src": "/comic/speech/home-20261015/home-compare-home-compare-table-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 2.673379,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "ruth",
              "text": "Signed order: section\nseven, site safety.\nThe sent copy\nskips it.",
              "x": 0.1702,
              "y": 0.3915,
              "w": 0.40608,
              "tail": [
                0.2219,
                0.3193
              ],
              "phone": {
                "x": 0.0229,
                "y": 0.4362,
                "w": 0.7,
                "tail": [
                  0.1025,
                  0.3311
                ]
              },
              "speech": {
                "id": "home-compare-home-compare-table-b2-20261015",
                "src": "/comic/speech/home-20261015/home-compare-home-compare-table-b2-eq-v1.mp3",
                "durationSeconds": 5.825306,
                "provider": "Fish Audio",
                "characterId": "ruth",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/compare/home-compare-table-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/compare/home-compare-table-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-compare-table",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-compare-table-plate-v1.png",
              "sha256": "ab30fcdbfb3de0f64faadb585ec5797ab8595d3e9525973f52ab54c812e3114c",
              "recordId": "home-compare-table-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-compare-table-plate-v1-1600.webp",
                  "sha256": "48aee06b8de8fd4caf38241284c56739b77b14956245a6318ec91b4a665e28c2",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                    "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-compare-table-plate-v1.png",
                    "sourceSha256": "ab30fcdbfb3de0f64faadb585ec5797ab8595d3e9525973f52ab54c812e3114c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-compare-table-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-compare-table-plate-v1-1600.avif",
                  "sha256": "15f3d40627b0c512ced027f15cb0aefd42c1a682884382a8e101df3deaf75a25",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                    "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-compare-table-plate-v1.png",
                    "sourceSha256": "ab30fcdbfb3de0f64faadb585ec5797ab8595d3e9525973f52ab54c812e3114c",
                    "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-compare-table-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.1451,
                0,
                0.7453,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.42,
            0,
            0.3,
            0.5
          ],
          "ar": [
            0.42,
            0,
            0.3,
            0.5
          ],
          "img": "home-compare-closeup",
          "alt": "Top-down close-up of the two pages side by side: on the left page a highlighted block, on the right page the same place is empty; Ruth’s finger points at the gap.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Same client. Old\nrates.\nNo safety clause.",
              "x": 0.52278,
              "y": 0.95,
              "w": 0.4472222222222222,
              "phone": {
                "x": 0.06188,
                "y": 0.95,
                "w": 0.6668
              },
              "speech": {
                "id": "home-compare-home-compare-closeup-b1-20261015",
                "src": "/comic/speech/home-20261015/home-compare-home-compare-closeup-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 3.299728,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-fix-compare-closeup-v2-v1-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-fix-compare-closeup-v2-v1-1600.avif"
            ],
            "ar": [
              0,
              0.03125,
              1,
              0.9375
            ],
            "canonicalSource": {
              "panelId": "home-compare-closeup",
              "path": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-compare-closeup-v2-v1.png",
              "sha256": "45eed25e57aa73313b2af88841f3676b138e8235fe60f8c46d06390aa8efddb2",
              "recordId": "home-fix-compare-closeup-v2-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-compare-closeup-v2-v1-1600.webp",
                  "sha256": "7db71fc8ba334abefae4ca79310ace76a4c9e6ec2b4e9487f630f17b6b4439e3",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-compare-closeup-v2-v1.png",
                    "sourceSha256": "45eed25e57aa73313b2af88841f3676b138e8235fe60f8c46d06390aa8efddb2",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-compare-closeup-v2-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-fix-compare-closeup-v2-v1-1600.avif",
                  "sha256": "258b86e0815a6d676db59b9f460d523bd3360d2bb128d324db4e092ea823c36e",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/panels/raster/home-fix-compare-closeup-v2-v1.png",
                    "sourceSha256": "45eed25e57aa73313b2af88841f3676b138e8235fe60f8c46d06390aa8efddb2",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-fix-compare-closeup-v2-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.56,
                0,
                0.336,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.72,
            0,
            0.28,
            0.5
          ],
          "ar": [
            0.72,
            0,
            0.28,
            0.5
          ],
          "img": "home-sam-card",
          "alt": "Sam slaps a new rate card down on the table beside the old 2024 card (both printed faces up): the new one shows a large 2026, the old one a large 2024 with a cross through it. Motion lines on his hand. Marco watches from the side. No other people.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "impact",
              "gain": 0.35
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "That’s the 2024 card.\nHere’s 2026.",
              "x": 0.03,
              "y": 0.38,
              "w": 0.6,
              "tail": [
                0.3192,
                0.27
              ],
              "phone": {
                "x": 0.03,
                "y": 0.38,
                "w": 0.7
              },
              "speech": {
                "id": "home-compare-home-sam-card-b1-20261015",
                "src": "/comic/speech/home-20261015/home-compare-home-sam-card-b1-eq-v1.mp3",
                "durationSeconds": 3.73551,
                "provider": "Fish Audio",
                "characterId": "sam",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/compare/home-sam-card-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/compare/home-sam-card-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-sam-card",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-sam-card-plate-v1.png",
              "sha256": "751f99134daa647d9a490103e44d364ac5f124b925a597704067085f39596825",
              "recordId": "home-sam-card-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-sam-card-plate-v1-1600.webp",
                  "sha256": "e863283e1b6671670209c379957d32583c771aaa4466f7f59160273fa400e1e1",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                    "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-sam-card-plate-v1.png",
                    "sourceSha256": "751f99134daa647d9a490103e44d364ac5f124b925a597704067085f39596825",
                    "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-sam-card-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-sam-card-plate-v1-1600.avif",
                  "sha256": "86f7040591c908d0f46818a62f47be621ec845404a2927071b974520baa602ad",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                    "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-sam-card-plate-v1.png",
                    "sourceSha256": "751f99134daa647d9a490103e44d364ac5f124b925a597704067085f39596825",
                    "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-sam-card-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.13447,
                0,
                0.78673,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0.5,
            0.28,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.28,
            0.5
          ],
          "img": "home-sam-labour",
          "alt": "Sam counts on his fingers, explaining the crew plan to Marco and Ruth, who sit at the table; a clipboard under his arm (back toward camera, plain). No other people.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Forty hours. Ten\ninstallers. Monday,\nfive a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.56151,
              "tail": [
                0.7712,
                0.23
              ],
              "phone": {
                "x": 0.1487,
                "y": 0.4974,
                "w": 0.7,
                "tail": [
                  0.7791,
                  0.204
                ]
              },
              "speech": {
                "id": "home-compare-home-sam-labour-b1-20261015",
                "src": "/comic/speech/home-20261015/home-compare-home-sam-labour-b1-eq-v1.mp3",
                "durationSeconds": 4.284082,
                "provider": "Fish Audio",
                "characterId": "sam",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/compare/home-sam-labour-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/compare/home-sam-labour-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-sam-labour",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-sam-labour-plate-v1.png",
              "sha256": "401b63037551a6d360d6724f3b182da49536f86a5bc4776e2bb86dca43153133",
              "recordId": "home-sam-labour-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-sam-labour-plate-v1-1600.webp",
                  "sha256": "d0470ee3bbfd73ac32adab9b1ab58984dc1311f6ffba1f9cdc18e27ea1a67037",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                    "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-sam-labour-plate-v1.png",
                    "sourceSha256": "401b63037551a6d360d6724f3b182da49536f86a5bc4776e2bb86dca43153133",
                    "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-sam-labour-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-sam-labour-plate-v1-1600.avif",
                  "sha256": "5881b6e014728dd204b2db7b97a0168750dcf2c91d185387b67b081465177de1",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                    "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-sam-labour-plate-v1.png",
                    "sourceSha256": "401b63037551a6d360d6724f3b182da49536f86a5bc4776e2bb86dca43153133",
                    "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-sam-labour-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.03791,
                0,
                0.92417,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.28,
            0.5,
            0.3,
            0.5
          ],
          "ar": [
            0.28,
            0.5,
            0.3,
            0.5
          ],
          "img": "home-codex-records",
          "alt": "Ruth, Sam and Marco at the sunlit meeting table look up toward an open standing space at the right end of the table; papers in front of them; through the window the teal Second Brain lattice tower with a newly lit floor. No other people. Codex projection (gauntlets teal) stands there absorbing the documents as teal light.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "light"
          },
          "sfx": [
            {
              "kind": "whoosh",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Signed order. 2026\nrates.\nLabour. Each with\nits owner.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.50185,
              "tail": [
                0.91297,
                0.1584
              ],
              "phone": {
                "x": 0.1908,
                "y": 0.4159,
                "w": 0.7,
                "tail": [
                  0.9018,
                  0.1714
                ]
              },
              "speech": {
                "id": "home-compare-home-codex-records-b1-20261015",
                "src": "/comic/speech/home-20261015/home-compare-home-codex-records-b1-eq-v1.mp3",
                "durationSeconds": 4.519184,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-records-composite-v3-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-records-composite-v3-1600.avif"
            ],
            "ar": [
              0.00359,
              0,
              0.99282,
              1
            ],
            "canonicalSource": {
              "panelId": "home-codex-records",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-composite-v3.png",
              "sha256": "bc74062506a0b5485cb4afbe4d226b884b9999c45ea5c2481cf372ff7e9b864e",
              "recordId": "home-codex-records-composite-v3",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-records-composite-v3-1600.webp",
                  "sha256": "2b00d8d8c6677d806670d15a111297c2ea841c37c305b1b19c7d84a7c176718f",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-composite-v3.png",
                    "sourceSha256": "bc74062506a0b5485cb4afbe4d226b884b9999c45ea5c2481cf372ff7e9b864e",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-records-composite-v3-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-records-composite-v3-1600.avif",
                  "sha256": "cd905349aeaa826a5b8c5a1dd5ce0323ba9a9b8bb4c4e1679c8fa42ed9ae1b79",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-composite-v3.png",
                    "sourceSha256": "bc74062506a0b5485cb4afbe4d226b884b9999c45ea5c2481cf372ff7e9b864e",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-records-composite-v3-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.28605,
                0,
                0.59195,
                1
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-codex-records-projection",
              "at": 0,
              "alt": "Ruth, Sam and Marco at the sunlit meeting table look up toward an open standing space at the right end of the table; papers in front of them; through the window the teal Second Brain lattice tower with a newly lit floor. No other people. Codex projection (gauntlets teal) stands there absorbing the documents as teal light.",
              "src": "/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.webp",
              "ar": [
                0.00359,
                0,
                0.99282,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-records",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-plate-v1.png",
                "sha256": "3a691841ed047a8b70e262798bb060c664c36e44fa5d87494c49f8a210838dc7",
                "recordId": "home-codex-records-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.webp",
                    "sha256": "e10e160628e0697fdb4783e0c43a8c012bb13fd1be4e158ce6dce69ccfb0cf46",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                      "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-plate-v1.png",
                      "sourceSha256": "3a691841ed047a8b70e262798bb060c664c36e44fa5d87494c49f8a210838dc7",
                      "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.avif",
                    "sha256": "8e367955443109df92f89dfbde5b6f10e79cf5a458ff549824eab888542365d3",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                      "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-plate-v1.png",
                      "sourceSha256": "3a691841ed047a8b70e262798bb060c664c36e44fa5d87494c49f8a210838dc7",
                      "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.28605,
                  0,
                  0.59195,
                  1
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-records",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-plate-v1.png",
                    "sha256": "3a691841ed047a8b70e262798bb060c664c36e44fa5d87494c49f8a210838dc7",
                    "recordId": "home-codex-records-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.webp",
                        "sha256": "e10e160628e0697fdb4783e0c43a8c012bb13fd1be4e158ce6dce69ccfb0cf46",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                          "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-plate-v1.png",
                          "sourceSha256": "3a691841ed047a8b70e262798bb060c664c36e44fa5d87494c49f8a210838dc7",
                          "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.avif",
                        "sha256": "8e367955443109df92f89dfbde5b6f10e79cf5a458ff549824eab888542365d3",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                          "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-plate-v1.png",
                          "sourceSha256": "3a691841ed047a8b70e262798bb060c664c36e44fa5d87494c49f8a210838dc7",
                          "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-codex-records-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-records-codex-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-records",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-codex-layer-v3.png",
                    "sha256": "4e183ae71572e21e5be547325fe054171293cde8c7863c8fd61e5f0114e4a187",
                    "recordId": "home-codex-records-codex-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-records-codex-layer-v3-1600.webp",
                        "sha256": "d114e8468369d992e518df20e96cd1bb279ce26ed536a0fc99ad409f4f299ce9",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-codex-layer-v3.png",
                          "sourceSha256": "4e183ae71572e21e5be547325fe054171293cde8c7863c8fd61e5f0114e4a187",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-records-codex-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-records-codex-layer-v3-1600.avif",
                        "sha256": "98db5ea442469ab4461beaf55d15d680c75732fb1060eb5d11aa696f57c28719",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-codex-records-codex-layer-v3.png",
                          "sourceSha256": "4e183ae71572e21e5be547325fe054171293cde8c7863c8fd61e5f0114e4a187",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-records-codex-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "light",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.58,
            0.5,
            0.42,
            0.5
          ],
          "ar": [
            0.58,
            0.5,
            0.42,
            0.5
          ],
          "img": "home-matt-rule",
          "alt": "Matt, standing at the window with the lit lattice tower behind him, speaks to Ruth; Ruth, arms folded, nods.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Every quote now checks\nagainst the signed\norder. Safety\nincluded.",
              "x": 0.40956,
              "y": 0.28,
              "w": 0.42196,
              "tail": [
                0.62054,
                0.17
              ],
              "phone": {
                "x": 0.25,
                "y": 0.03,
                "w": 0.72,
                "tail": [
                  0.88265,
                  0.17
                ]
              },
              "speech": {
                "id": "home-compare-home-matt-rule-b1-20261015",
                "src": "/comic/speech/home-20261015/home-compare-home-matt-rule-b1-eq-v1.mp3",
                "durationSeconds": 3.343673,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "ruth",
              "text": "And I approve\nthe terms.",
              "x": 0.10934,
              "y": 0.305,
              "w": 0.2791,
              "tail": [
                0.24889,
                0.19
              ],
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.62
              },
              "speech": {
                "id": "home-compare-home-matt-rule-b2-20261015",
                "src": "/comic/speech/home-20261015/home-compare-home-matt-rule-b2-eq-v1.mp3",
                "durationSeconds": 1.697959,
                "provider": "Fish Audio",
                "characterId": "ruth",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/compare/home-matt-rule-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/compare/home-matt-rule-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-matt-rule",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-matt-rule-plate-v1.png",
              "sha256": "d5cfe51ab82e526f3b9248e401e0782e5c693f5d6a51adbae972b345826d3a97",
              "recordId": "home-matt-rule-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-matt-rule-plate-v1-1600.webp",
                  "sha256": "16d5702cfeb965b1c95dcc5809d938730e8a29b2bea83466c8d7c2ac9dd01121",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                    "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-matt-rule-plate-v1.png",
                    "sourceSha256": "d5cfe51ab82e526f3b9248e401e0782e5c693f5d6a51adbae972b345826d3a97",
                    "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-matt-rule-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/compare/home-matt-rule-plate-v1-1600.avif",
                  "sha256": "7fbbe5be24b4852701ca1ec838c9881228992a4a4ed826ef7d244c5d54255036",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/compare-encodings-v2.json",
                    "sha256": "3fe15a9a4b1c9be5151ecedcb00b1b48156a1b33613a8a7826b73f5cf22b767f",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/compare/home-matt-rule-plate-v1.png",
                    "sourceSha256": "d5cfe51ab82e526f3b9248e401e0782e5c693f5d6a51adbae972b345826d3a97",
                    "outputPath": "site/public/comic/home/rebuild-20261014/compare/home-matt-rule-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.1396,
                0,
                0.58298,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-compare-table",
            "r": [
              0,
              0,
              0.6,
              0.3
            ]
          },
          {
            "img": "home-compare-closeup",
            "r": [
              0.6,
              0,
              0.4,
              0.3
            ]
          },
          {
            "img": "home-sam-card",
            "r": [
              0,
              0.3,
              0.46,
              0.33
            ]
          },
          {
            "img": "home-sam-labour",
            "r": [
              0.46,
              0.3,
              0.54,
              0.33
            ]
          },
          {
            "img": "home-codex-records",
            "r": [
              0,
              0.63,
              0.42,
              0.37
            ]
          },
          {
            "img": "home-matt-rule",
            "r": [
              0.42,
              0.63,
              0.58,
              0.37
            ]
          }
        ]
      ]
    },
    {
      "id": "nine",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/nine/home-nine-page-master-v1",
      "score": 0.4,
      "room": "office",
      "panels": [
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0,
            0.36,
            1
          ],
          "ar": [
            0,
            0,
            0.36,
            1
          ],
          "img": "home-quote-rebuilt",
          "alt": "Tall shot over Marco's shoulder: his monitor (screen faces Marco) shows the rebuilt quote table with source tags; the Codex projection stands beside the desk, gauntlets teal; sunny window and the lattice tower beyond.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. 8:20 a.m.\nForty minutes.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.40972222222222227,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.94
              },
              "speech": {
                "id": "home-quote-rebuilt-b0-20261013",
                "src": "/comic/speech/home-20261013/home-quote-rebuilt-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 3.305147,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Rates, 2026.\nDiscount, none.\nLabour, forty\nhours. Sources and\nchecks on page\none.",
              "x": 0.55179,
              "y": 0.03,
              "w": 0.41821,
              "tail": [
                0.1875,
                0.321
              ],
              "phone": {
                "x": 0.04,
                "y": 0.95,
                "w": 0.92,
                "tail": [
                  0.11,
                  0.2933
                ]
              },
              "speech": {
                "id": "home-nine-home-quote-rebuilt-b1",
                "src": "/comic/speech/home-20261012b/home-nine-home-quote-rebuilt-b1-eq-v1.mp3",
                "durationSeconds": 7.157551,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-quote-rebuilt-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-quote-rebuilt-composite-v2-1600.avif"
            ],
            "ar": [
              0.02,
              0,
              0.96,
              1
            ],
            "canonicalSource": {
              "panelId": "home-quote-rebuilt",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-composite-v2.png",
              "sha256": "3601458c7e3d8d51b5f22dd5c76de89b5f4b3c91addf45fde86de34a25e22659",
              "recordId": "home-quote-rebuilt-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-quote-rebuilt-composite-v2-1600.webp",
                  "sha256": "b3e8f8b82bb9328b77aed9240aa73d0a6971f507ab519cf583c07d42c978a5fe",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-composite-v2.png",
                    "sourceSha256": "3601458c7e3d8d51b5f22dd5c76de89b5f4b3c91addf45fde86de34a25e22659",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-quote-rebuilt-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-quote-rebuilt-composite-v2-1600.avif",
                  "sha256": "e363fc4621017c3f1fb384f217218e2b8cadd8ba1b484c712c2612f55472fe4f",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-composite-v2.png",
                    "sourceSha256": "3601458c7e3d8d51b5f22dd5c76de89b5f4b3c91addf45fde86de34a25e22659",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-quote-rebuilt-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.10816,
                1,
                0.78369
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-quote-rebuilt-projection",
              "at": 0,
              "alt": "Tall shot over Marco's shoulder: his monitor (screen faces Marco) shows the rebuilt quote table with source tags; the Codex projection stands beside the desk, gauntlets teal; sunny window and the lattice tower beyond.",
              "src": "/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.webp",
              "ar": [
                0.02,
                0,
                0.96,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-quote-rebuilt",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-plate-v1.png",
                "sha256": "5869517060b19d861a10cc27d9e4eddf4fa22c812dd9d1a2946bed8ae03aef45",
                "recordId": "home-quote-rebuilt-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.webp",
                    "sha256": "8c66dcc01f3f4305ddad28bd003dd1f23dcc9f29496f84f507bc3c278cfc0880",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                      "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-plate-v1.png",
                      "sourceSha256": "5869517060b19d861a10cc27d9e4eddf4fa22c812dd9d1a2946bed8ae03aef45",
                      "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.avif",
                    "sha256": "e9138686482df84aeba621f724b0f7acb903f1b3e08312db5bac573d9266ca87",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                      "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-plate-v1.png",
                      "sourceSha256": "5869517060b19d861a10cc27d9e4eddf4fa22c812dd9d1a2946bed8ae03aef45",
                      "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0,
                  0.10816,
                  1,
                  0.78369
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-quote-rebuilt",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-plate-v1.png",
                    "sha256": "5869517060b19d861a10cc27d9e4eddf4fa22c812dd9d1a2946bed8ae03aef45",
                    "recordId": "home-quote-rebuilt-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.webp",
                        "sha256": "8c66dcc01f3f4305ddad28bd003dd1f23dcc9f29496f84f507bc3c278cfc0880",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                          "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-plate-v1.png",
                          "sourceSha256": "5869517060b19d861a10cc27d9e4eddf4fa22c812dd9d1a2946bed8ae03aef45",
                          "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.avif",
                        "sha256": "e9138686482df84aeba621f724b0f7acb903f1b3e08312db5bac573d9266ca87",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                          "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-plate-v1.png",
                          "sourceSha256": "5869517060b19d861a10cc27d9e4eddf4fa22c812dd9d1a2946bed8ae03aef45",
                          "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-quote-rebuilt-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-quote-rebuilt-codex-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-quote-rebuilt",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-codex-layer-v2.png",
                    "sha256": "7c69faa17577c8b8b753aeeb3c474b63068629a5a698d20041fb53072045b90d",
                    "recordId": "home-quote-rebuilt-codex-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-quote-rebuilt-codex-layer-v2-1600.webp",
                        "sha256": "6a0a1fd9a6d04526007556df441f8dd8cf62ca218ac199b409dd54bf72b857d5",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-codex-layer-v2.png",
                          "sourceSha256": "7c69faa17577c8b8b753aeeb3c474b63068629a5a698d20041fb53072045b90d",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-quote-rebuilt-codex-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-quote-rebuilt-codex-layer-v2-1600.avif",
                        "sha256": "2825f4abde30efc5195ab93c1f4f94b1e8c5efd065d5966faaee96d4501981d5",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-quote-rebuilt-codex-layer-v2.png",
                          "sourceSha256": "7c69faa17577c8b8b753aeeb3c474b63068629a5a698d20041fb53072045b90d",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-quote-rebuilt-codex-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "push",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.36,
            0,
            0.34,
            0.5
          ],
          "ar": [
            0.36,
            0,
            0.32,
            0.5
          ],
          "img": "home-codex-safety-test",
          "alt": "Seen from behind the right shoulder of Matt: Matt types on a laptop whose screen faces him and us over his shoulder; the screen shows a large red stop symbol. The back of the laptop lid is never visible. Leave open space to the right of the desk for a standing figure.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "alarm",
              "gain": 0.15
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Test it. Drop the\nsafety clause.",
              "x": 0.03517,
              "y": 0.03,
              "w": 0.44965,
              "tail": [
                0.26,
                0.44311
              ],
              "phone": {
                "x": 0.3064,
                "y": 0.0226,
                "w": 0.8736,
                "tail": [
                  0.26,
                  0.26814
                ]
              },
              "speech": {
                "id": "home-nine-home-codex-safety-test-b1-20261015",
                "src": "/comic/speech/home-20261015/home-nine-home-codex-safety-test-b1-eq-v1.mp3",
                "durationSeconds": 1.671837,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Safety clause\nmissing. Draft\nstopped.",
              "x": 0.43285,
              "y": 0.23,
              "w": 0.38715,
              "tail": [
                0.86,
                0.13727
              ],
              "phone": {
                "x": 0.3757,
                "y": 0.5059,
                "w": 0.7637,
                "tail": [
                  0.9038,
                  0.217
                ]
              },
              "speech": {
                "id": "home-nine-home-codex-safety-test-b2-20261015",
                "src": "/comic/speech/home-20261015/home-nine-home-codex-safety-test-b2-eq-v1.mp3",
                "durationSeconds": 2.533878,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-safety-test-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-safety-test-composite-v2-1600.avif"
            ],
            "ar": [
              0,
              0.06055,
              1,
              0.87891
            ],
            "canonicalSource": {
              "panelId": "home-codex-safety-test",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-composite-v2.png",
              "sha256": "9f99a0864f8e456334fbb3d29d8ef9f587bca4deb2c11158e1d268c333b1360e",
              "recordId": "home-codex-safety-test-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-safety-test-composite-v2-1600.webp",
                  "sha256": "5090d3c60795ce1e8ad986d523c9f3e3247c591cafa75afd3c76d07dd0bf4bfa",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-composite-v2.png",
                    "sourceSha256": "9f99a0864f8e456334fbb3d29d8ef9f587bca4deb2c11158e1d268c333b1360e",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-safety-test-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-safety-test-composite-v2-1600.avif",
                  "sha256": "dd8af254223b210f9787832b997d4c49c0e684553568840b89af6ade7e4d90f0",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-composite-v2.png",
                    "sourceSha256": "9f99a0864f8e456334fbb3d29d8ef9f587bca4deb2c11158e1d268c333b1360e",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-safety-test-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.15759,
                0,
                0.78281,
                1
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-codex-safety-test-projection",
              "at": 0,
              "alt": "Seen from behind the right shoulder of Matt: Matt types on a laptop whose screen faces him and us over his shoulder; the screen shows a large red stop symbol. The back of the laptop lid is never visible. Leave open space to the right of the desk for a standing figure.",
              "src": "/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.webp",
              "ar": [
                0,
                0.06055,
                1,
                0.87891
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-safety-test",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-plate-v1.png",
                "sha256": "7c4ca8b0b0a256045be1bff8297056ef47b0cd6b7643ddae72342cf869570169",
                "recordId": "home-codex-safety-test-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.webp",
                    "sha256": "d4b1cffa0d787842e9d08dd1b5d08b88a19f3270005f87a0809ea6fa80ececf3",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                      "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-plate-v1.png",
                      "sourceSha256": "7c4ca8b0b0a256045be1bff8297056ef47b0cd6b7643ddae72342cf869570169",
                      "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.avif",
                    "sha256": "399c8f562ffc671c39769cc8e75adf701f7f0b3aec99715cfec3a70665284869",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                      "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-plate-v1.png",
                      "sourceSha256": "7c4ca8b0b0a256045be1bff8297056ef47b0cd6b7643ddae72342cf869570169",
                      "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.15759,
                  0,
                  0.78281,
                  1
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-safety-test",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-plate-v1.png",
                    "sha256": "7c4ca8b0b0a256045be1bff8297056ef47b0cd6b7643ddae72342cf869570169",
                    "recordId": "home-codex-safety-test-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.webp",
                        "sha256": "d4b1cffa0d787842e9d08dd1b5d08b88a19f3270005f87a0809ea6fa80ececf3",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                          "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-plate-v1.png",
                          "sourceSha256": "7c4ca8b0b0a256045be1bff8297056ef47b0cd6b7643ddae72342cf869570169",
                          "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.avif",
                        "sha256": "399c8f562ffc671c39769cc8e75adf701f7f0b3aec99715cfec3a70665284869",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                          "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-plate-v1.png",
                          "sourceSha256": "7c4ca8b0b0a256045be1bff8297056ef47b0cd6b7643ddae72342cf869570169",
                          "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-codex-safety-test-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-safety-test-codex-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-safety-test",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-codex-layer-v2.png",
                    "sha256": "101c20b1c807cf4b4f35bf4dd1af31ccd966e03c97b37caa6550545538d406e5",
                    "recordId": "home-codex-safety-test-codex-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-safety-test-codex-layer-v2-1600.webp",
                        "sha256": "1b4df42191acfe27ac9cd0a61c6d86bdf0e78d1111b7cae75f7387bd8b07c888",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-codex-layer-v2.png",
                          "sourceSha256": "101c20b1c807cf4b4f35bf4dd1af31ccd966e03c97b37caa6550545538d406e5",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-safety-test-codex-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-safety-test-codex-layer-v2-1600.avif",
                        "sha256": "b3bc5eb0cb86839e7ce123a17566a4c8510c6a3e788f4ca0409025ec4d330bfc",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-codex-safety-test-codex-layer-v2.png",
                          "sourceSha256": "101c20b1c807cf4b4f35bf4dd1af31ccd966e03c97b37caa6550545538d406e5",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-safety-test-codex-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "push",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.7,
            0,
            0.3,
            0.5
          ],
          "ar": [
            0.68,
            0,
            0.32,
            0.5
          ],
          "img": "home-marco-ticks",
          "alt": "Marco signs his initials beside each line of the printed quote, pen tip on the margin of a line (printed face toward him).",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.25
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Line by line.\nI initial\neach one.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.36632,
              "tail": [
                0.62,
                0.26106
              ],
              "phone": {
                "x": 0.4059,
                "y": 0.4296,
                "w": 0.7,
                "tail": [
                  0.6091,
                  0.3677
                ]
              },
              "speech": {
                "id": "home-nine-home-marco-ticks-b1-20261015",
                "src": "/comic/speech/home-20261015/home-nine-home-marco-ticks-b1-eq-v1.mp3",
                "durationSeconds": 1.811156,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/nine/home-marco-ticks-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/nine/home-marco-ticks-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.06055,
              1,
              0.87891
            ],
            "canonicalSource": {
              "panelId": "home-marco-ticks",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-marco-ticks-plate-v1.png",
              "sha256": "872b4dca8c948a98774815320ccf2073ac38b8d5db0a35c9bdcb9991489f26b0",
              "recordId": "home-marco-ticks-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-ticks-plate-v1-1600.webp",
                  "sha256": "5bb26cfe1955edbb199b09190698ea123a7b12500fd85c51477af28cf7de1406",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                    "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-marco-ticks-plate-v1.png",
                    "sourceSha256": "872b4dca8c948a98774815320ccf2073ac38b8d5db0a35c9bdcb9991489f26b0",
                    "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-ticks-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-ticks-plate-v1-1600.avif",
                  "sha256": "8dacdb05017be2d95b3eb2e5bd26f82d6db0f51d5ef6377cb20bce4fea0686cf",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                    "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-marco-ticks-plate-v1.png",
                    "sourceSha256": "872b4dca8c948a98774815320ccf2073ac38b8d5db0a35c9bdcb9991489f26b0",
                    "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-ticks-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.09716,
                0,
                0.80569,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.36,
            0.5,
            0.24,
            0.5
          ],
          "ar": [
            0.36,
            0.5,
            0.21,
            0.5
          ],
          "img": "home-new-total",
          "alt": "Over the shoulder of Marco (we see the back of his head and shoulder in the foreground): his monitor faces him and us, showing a total line with an old figure struck through in red and a larger new figure beside it.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "New total.\n$50,000 higher.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.6,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.7
              },
              "speech": {
                "id": "home-nine-home-new-total-b0",
                "src": "/comic/speech/home-20261012b/home-nine-home-new-total-b0-eq-v1.mp3",
                "durationSeconds": 3.030204,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/nine/home-new-total-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/nine/home-new-total-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.05357,
              1,
              0.89286
            ],
            "canonicalSource": {
              "panelId": "home-new-total",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-new-total-plate-v1.png",
              "sha256": "68ea418738bc17c268b1a34235786efa77927abad4bcf06a084c05f72b9bc16e",
              "recordId": "home-new-total-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-new-total-plate-v1-1600.webp",
                  "sha256": "e1d9a1b2e9bb5ed2c8d87f9c8c0428e6517edb6f9d8d9d779b9c5072a894daa9",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                    "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-new-total-plate-v1.png",
                    "sourceSha256": "68ea418738bc17c268b1a34235786efa77927abad4bcf06a084c05f72b9bc16e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-new-total-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-new-total-plate-v1-1600.avif",
                  "sha256": "24fae1efc433647e93195952d26f3276a451cd3609277187903dd5a2bab3fda0",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                    "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-new-total-plate-v1.png",
                    "sourceSha256": "68ea418738bc17c268b1a34235786efa77927abad4bcf06a084c05f72b9bc16e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-new-total-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.39045,
                1,
                0.21909
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.6,
            0.5,
            0.18,
            0.5
          ],
          "ar": [
            0.57,
            0.5,
            0.21,
            0.5
          ],
          "img": "home-marco-calls",
          "alt": "Marco on the phone to the client, standing, sunlit, determined.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [
            {
              "kind": "ring",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Before you sign.\nThe first number\nwas wrong.",
              "x": 0.0864,
              "y": 0.3126,
              "w": 0.6,
              "tail": [
                0.3911,
                0.2635
              ],
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.8,
                "tail": [
                  0.403,
                  0.2585
                ]
              },
              "speech": {
                "id": "home-nine-home-marco-calls-b0",
                "src": "/comic/speech/home-20261012b/home-nine-home-marco-calls-b0-eq-v1.mp3",
                "durationSeconds": 2.043356,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "narrator",
              "text": "Show us how\nyou got the\nnew one.",
              "x": 0.0206,
              "y": 0.545,
              "w": 0.49471,
              "phone": {
                "x": 0.3,
                "y": 0.4,
                "w": 0.66
              },
              "speech": {
                "id": "home-phone-client-b0-20261013",
                "src": "/comic/speech/home-20261013/home-phone-client-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 2.92678,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "It’s all on\npage one.",
              "x": 0.1494,
              "y": 0.7827,
              "w": 0.49471,
              "tail": [
                0.3911,
                0.2635
              ],
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.55,
                "tail": [
                  0.403,
                  0.2585
                ]
              },
              "speech": {
                "id": "home-nine-home-phone-client-b1",
                "src": "/comic/speech/home-20261012b/home-nine-home-phone-client-b1-eq-v1.mp3",
                "durationSeconds": 1.300317,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/nine/home-marco-calls-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/nine/home-marco-calls-plate-v1-1600.avif"
            ],
            "ar": [
              0.00222,
              0,
              0.99556,
              1
            ],
            "canonicalSource": {
              "panelId": "home-marco-calls",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-marco-calls-plate-v1.png",
              "sha256": "85f95301ef5c04ae1fe99053347df6801a8bf5c2811f2452fd123ad683b7f32d",
              "recordId": "home-marco-calls-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-calls-plate-v1-1600.webp",
                  "sha256": "d168be0d612f2ea3ee906eee650a4c63e2c6d24f9b7510b8528237c62e4c2661",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                    "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-marco-calls-plate-v1.png",
                    "sourceSha256": "85f95301ef5c04ae1fe99053347df6801a8bf5c2811f2452fd123ad683b7f32d",
                    "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-calls-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-calls-plate-v1-1600.avif",
                  "sha256": "fec9da62f97b2dffa16b38edf393d54b4144beecbd78c3ba5f24afb9425cfbfa",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                    "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-marco-calls-plate-v1.png",
                    "sourceSha256": "85f95301ef5c04ae1fe99053347df6801a8bf5c2811f2452fd123ad683b7f32d",
                    "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-calls-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.00997,
                1,
                0.98006
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.78,
            0.5,
            0.22,
            0.5
          ],
          "ar": [
            0.78,
            0.5,
            0.22,
            0.5
          ],
          "img": "home-marco-sends",
          "alt": "Marco's own finger presses send on the monitor (screen faces Marco); the wall clock behind shows 8:57.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "click",
              "gain": 0.5
            },
            {
              "kind": "whoosh",
              "gain": 0.3,
              "delay": 0.5
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "8:57 a.m. The real\nquote went out.",
              "x": 0.32985,
              "y": 0.95,
              "w": 0.640151515151515,
              "phone": {
                "x": 0.55075,
                "y": 0.95,
                "w": 0.775
              },
              "speech": {
                "id": "home-marco-sends-b0-20261013",
                "src": "/comic/speech/home-20261013/home-marco-sends-b0-20261013-eq-tempo112-crest-v2.mp3",
                "durationSeconds": 3.30585,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/nine/home-marco-sends-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/nine/home-marco-sends-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0.07386,
              1,
              0.85227
            ],
            "canonicalSource": {
              "panelId": "home-marco-sends",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-marco-sends-plate-v1.png",
              "sha256": "c9bf7997cbad595145d5acc5b5f300cad15947bce0ed8d79ddf753b6dc4b8155",
              "recordId": "home-marco-sends-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-sends-plate-v1-1600.webp",
                  "sha256": "cd4929d04f814760992d7116d96e24542c7993c088c7cd90a047c665af033f38",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                    "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-marco-sends-plate-v1.png",
                    "sourceSha256": "c9bf7997cbad595145d5acc5b5f300cad15947bce0ed8d79ddf753b6dc4b8155",
                    "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-sends-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-sends-plate-v1-1600.avif",
                  "sha256": "b9cb9f19d29c2bb6abb9ccba50c08c39e21c5e2ecd7d1e54d0ff3d8350002195",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/nine-encodings-v1.json",
                    "sha256": "254524479e9d91c6f06ff29b5782d115df404165a87082582ac035be06c5718a",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/nine/home-marco-sends-plate-v1.png",
                    "sourceSha256": "c9bf7997cbad595145d5acc5b5f300cad15947bce0ed8d79ddf753b6dc4b8155",
                    "outputPath": "site/public/comic/home/rebuild-20261014/nine/home-marco-sends-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.14141,
                1,
                0.71717
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-quote-rebuilt",
            "r": [
              0,
              0,
              0.52,
              0.34
            ]
          },
          {
            "img": "home-codex-safety-test",
            "r": [
              0.52,
              0,
              0.48,
              0.34
            ]
          },
          {
            "img": "home-marco-ticks",
            "r": [
              0,
              0.34,
              0.47,
              0.33
            ]
          },
          {
            "img": "home-new-total",
            "r": [
              0.47,
              0.34,
              0.53,
              0.33
            ]
          },
          {
            "img": "home-marco-calls",
            "r": [
              0,
              0.67,
              0.6,
              0.33
            ]
          },
          {
            "img": "home-marco-sends",
            "r": [
              0.6,
              0.67,
              0.4,
              0.33
            ]
          }
        ]
      ]
    },
    {
      "id": "roof",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/roof/home-roof-page-master-v2",
      "score": 0.55,
      "room": "street",
      "panels": [
        {
          "at": 0,
          "room": "street",
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
          "img": "home-roof",
          "alt": "Wide: Matt and Marco at the parapet from behind, coffee cups, looking at the giant teal lattice tower across the street with many lit floors; the Codex and Claude projections stand beside them at human height, full figure.",
          "motion": {
            "beats": 6,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [
            {
              "kind": "whoosh",
              "gain": 0.15
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "The roof. Friday,\n9:20 a.m.\nThe quote was sent.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.3,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.806453153153153
              },
              "speech": {
                "id": "home-roof-b0-20261013",
                "src": "/comic/speech/home-20261013/home-roof-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 4.364399,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-roof-composite-v3-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-roof-composite-v3-1600.avif"
            ],
            "ar": [
              0.00071,
              0,
              0.99858,
              1
            ],
            "canonicalSource": {
              "panelId": "home-roof",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-composite-v3.png",
              "sha256": "f17c3c6746613045b2c21b9acab08bdff2019ed373a0a166d13ff94f196fcdd7",
              "recordId": "home-roof-composite-v3",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-roof-composite-v3-1600.webp",
                  "sha256": "f95b746c23f9f6dc9c81d7f425663106d3217792f9af0354c178b727a6807cb4",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-composite-v3.png",
                    "sourceSha256": "f17c3c6746613045b2c21b9acab08bdff2019ed373a0a166d13ff94f196fcdd7",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-roof-composite-v3-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-roof-composite-v3-1600.avif",
                  "sha256": "629a0eee5d1c89400185df78080980ed129f63075bbbdce5fb548841fe41a5d7",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-composite-v3.png",
                    "sourceSha256": "f17c3c6746613045b2c21b9acab08bdff2019ed373a0a166d13ff94f196fcdd7",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-roof-composite-v3-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.16291,
                0,
                0.79109,
                1
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-roof-projection",
              "at": 0,
              "alt": "Wide: Matt and Marco at the parapet from behind, coffee cups, looking at the giant teal lattice tower across the street with many lit floors; the Codex and Claude projections stand beside them at human height, full figure.",
              "src": "/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.webp",
              "ar": [
                0.00071,
                0,
                0.99858,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-roof",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-plate-v1.png",
                "sha256": "bd3c7c6ae1b9b8630d2d5fef33619b50cf6a1654cc379c2d8172cd47c3e01d87",
                "recordId": "home-roof-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.webp",
                    "sha256": "dba906a694ea8e8ac311e1be6855a31794b1c436097c94ea533220a0b5454c79",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                      "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-plate-v1.png",
                      "sourceSha256": "bd3c7c6ae1b9b8630d2d5fef33619b50cf6a1654cc379c2d8172cd47c3e01d87",
                      "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.avif",
                    "sha256": "84ce798a1885a39256821ee5c1d58b3a4c8e6840f50f70cb6e924b1a48181c62",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                      "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-plate-v1.png",
                      "sourceSha256": "bd3c7c6ae1b9b8630d2d5fef33619b50cf6a1654cc379c2d8172cd47c3e01d87",
                      "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.16291,
                  0,
                  0.79109,
                  1
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-roof",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-plate-v1.png",
                    "sha256": "bd3c7c6ae1b9b8630d2d5fef33619b50cf6a1654cc379c2d8172cd47c3e01d87",
                    "recordId": "home-roof-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.webp",
                        "sha256": "dba906a694ea8e8ac311e1be6855a31794b1c436097c94ea533220a0b5454c79",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                          "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-plate-v1.png",
                          "sourceSha256": "bd3c7c6ae1b9b8630d2d5fef33619b50cf6a1654cc379c2d8172cd47c3e01d87",
                          "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.avif",
                        "sha256": "84ce798a1885a39256821ee5c1d58b3a4c8e6840f50f70cb6e924b1a48181c62",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                          "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-plate-v1.png",
                          "sourceSha256": "bd3c7c6ae1b9b8630d2d5fef33619b50cf6a1654cc379c2d8172cd47c3e01d87",
                          "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-roof-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-roof-codex-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-roof",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-codex-layer-v3.png",
                    "sha256": "5a9ab32fedbcba7cdd93b9f601539ad11dde8e2e38d37426bc66ad15b35afedc",
                    "recordId": "home-roof-codex-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-roof-codex-layer-v3-1600.webp",
                        "sha256": "3fcb48e111822ce3de64d00081d7056306d7ecf96ea3f4cc37420a3d318c0839",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-codex-layer-v3.png",
                          "sourceSha256": "5a9ab32fedbcba7cdd93b9f601539ad11dde8e2e38d37426bc66ad15b35afedc",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-roof-codex-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-roof-codex-layer-v3-1600.avif",
                        "sha256": "43eb6063085e4022529f172f80bf1221c8060847472f2fada2e8e02ce490768f",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-codex-layer-v3.png",
                          "sourceSha256": "5a9ab32fedbcba7cdd93b9f601539ad11dde8e2e38d37426bc66ad15b35afedc",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-roof-codex-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "claude",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-roof-claude-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-roof",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-claude-layer-v3.png",
                    "sha256": "1455ecf185a7b15c2024c98294a278ebfdcea3255fa6202f0ddd0178bf729c77",
                    "recordId": "home-roof-claude-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-roof-claude-layer-v3-1600.webp",
                        "sha256": "25db36901029a7c9f9b6b721b3a4a0df18e893a6630801f1844d898ae06fd390",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-claude-layer-v3.png",
                          "sourceSha256": "1455ecf185a7b15c2024c98294a278ebfdcea3255fa6202f0ddd0178bf729c77",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-roof-claude-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-roof-claude-layer-v3-1600.avif",
                        "sha256": "13c5c0ba3a718eafec065423446c6ecc91d2e1430f0b39906d44dee4aed113b9",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-roof-claude-layer-v3.png",
                          "sourceSha256": "1455ecf185a7b15c2024c98294a278ebfdcea3255fa6202f0ddd0178bf729c77",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-roof-claude-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "drift-right",
                  "beats": 6,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                },
                {
                  "layerId": "claude",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0.6,
            0,
            0.4,
            0.5
          ],
          "ar": [
            0.6,
            0,
            0.4,
            0.5
          ],
          "img": "home-marco-tired",
          "alt": "Marco, tired, leaning on the parapet, coffee in hand, looking at Matt.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Who checks it\nnext time? I won’t\nalways be here.",
              "x": 0.1498,
              "y": 0.4789,
              "w": 0.37639,
              "tail": [
                0.3446,
                0.3898
              ],
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.78953
              },
              "speech": {
                "id": "home-roof-home-marco-tired-b0",
                "src": "/comic/speech/home-20261012b/home-roof-home-marco-tired-b0-eq-v1.mp3",
                "durationSeconds": 2.507755,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/roof/home-marco-tired-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/roof/home-marco-tired-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-marco-tired",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-marco-tired-plate-v1.png",
              "sha256": "b6d81b2a00a5464e74c8c816a6ec415d76dc7e932fd35e8ccfa0fdf69969100e",
              "recordId": "home-marco-tired-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-marco-tired-plate-v1-1600.webp",
                  "sha256": "5980fe5e4e484259fc27803557c2bdcc4a40862616e0f50fbf2e438b1e7db4fa",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                    "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-marco-tired-plate-v1.png",
                    "sourceSha256": "b6d81b2a00a5464e74c8c816a6ec415d76dc7e932fd35e8ccfa0fdf69969100e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-marco-tired-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-marco-tired-plate-v1-1600.avif",
                  "sha256": "c2f35c7e8a3d0da9ed3ed366b43d8616f0edb72d86648d61749f500cf8299e59",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                    "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-marco-tired-plate-v1.png",
                    "sourceSha256": "b6d81b2a00a5464e74c8c816a6ec415d76dc7e932fd35e8ccfa0fdf69969100e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-marco-tired-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.12667,
                0,
                0.74667,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0,
            0.5,
            0.27,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-brain-rises",
          "alt": "Matt gestures toward the lit lattice tower; the sun behind it.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "The procedure\nstays. You review\nits sources when\nthe work changes.",
              "x": 0.39444,
              "y": 0.03,
              "w": 0.57556,
              "tail": [
                0.22999,
                0.45
              ],
              "phone": {
                "x": 0.03,
                "y": 0.555,
                "w": 0.8508,
                "tail": [
                  0.15714,
                  0.45
                ]
              },
              "speech": {
                "id": "home-roof-home-brain-rises-b0",
                "src": "/comic/speech/home-20261012b/home-roof-home-brain-rises-b0-eq-v1.mp3",
                "durationSeconds": 3.715193,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/roof/home-brain-rises-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/roof/home-brain-rises-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-brain-rises",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-brain-rises-plate-v1.png",
              "sha256": "ffd3b0b56a14fb6fc2fb0105045d58173aec3eca08e663ded8a216fa46883d72",
              "recordId": "home-brain-rises-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-brain-rises-plate-v1-1600.webp",
                  "sha256": "0b18a46b3842ac761e6a14b9ac10f18f5da3d5a10bb82d6c3386bfe85a7f02cb",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                    "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-brain-rises-plate-v1.png",
                    "sourceSha256": "ffd3b0b56a14fb6fc2fb0105045d58173aec3eca08e663ded8a216fa46883d72",
                    "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-brain-rises-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-brain-rises-plate-v1-1600.avif",
                  "sha256": "1e94ae220c8014ed5a78879f61670639b18bfb0b1da77ea11fff7c66fe52e43b",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                    "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-brain-rises-plate-v1.png",
                    "sourceSha256": "ffd3b0b56a14fb6fc2fb0105045d58173aec3eca08e663ded8a216fa46883d72",
                    "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-brain-rises-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.1,
                0,
                0.70428,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0.27,
            0.5,
            0.23,
            0.5
          ],
          "ar": [
            0.25,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-codex-teal",
          "alt": "Codex projection, gauntlets teal, standing tall at the parapet with arms crossed, calm.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "light"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Rates and labour\nfrom Sam. Terms\nfrom Ruth.",
              "x": 0.24805,
              "y": 0.305,
              "w": 0.54889,
              "tail": [
                0.52249,
                0.2222
              ],
              "phone": {
                "x": 0.13716,
                "y": 0.305,
                "w": 0.81095,
                "tail": [
                  0.52857,
                  0.2222
                ]
              },
              "speech": {
                "id": "home-roof-home-codex-teal-b1-20261015",
                "src": "/comic/speech/home-20261015/home-roof-home-codex-teal-b1-eq-v1.mp3",
                "durationSeconds": 2.847347,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-teal-composite-v3-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-teal-composite-v3-1600.avif"
            ],
            "ar": [
              0.05556,
              0,
              0.88889,
              1
            ],
            "canonicalSource": {
              "panelId": "home-codex-teal",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-composite-v3.png",
              "sha256": "5292c71c301d1e4e76bc94e1c3e81ab2c29434ef97ab34d3f191d21fe9b42d68",
              "recordId": "home-codex-teal-composite-v3",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-teal-composite-v3-1600.webp",
                  "sha256": "be203dd146f4ffc6b8b3c9a11b9f68d3a54dd83f6c2cea94f3d56b6a10428e59",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-composite-v3.png",
                    "sourceSha256": "5292c71c301d1e4e76bc94e1c3e81ab2c29434ef97ab34d3f191d21fe9b42d68",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-teal-composite-v3-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-teal-composite-v3-1600.avif",
                  "sha256": "da674e6a2c1f7bfa9a18f9ee026b74825e190003e573ce899fc2f03484ad4ba5",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-composite-v3.png",
                    "sourceSha256": "5292c71c301d1e4e76bc94e1c3e81ab2c29434ef97ab34d3f191d21fe9b42d68",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-teal-composite-v3-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.15,
                0,
                0.7,
                1
              ]
            }
          },
          "views": [
            {
              "id": "home-codex-teal-projection",
              "at": 0,
              "alt": "Codex projection, gauntlets teal, standing tall at the parapet with arms crossed, calm.",
              "src": "/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.webp",
              "ar": [
                0.05556,
                0,
                0.88889,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-teal",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-plate-v1.png",
                "sha256": "3b6ae5c3cfa2719fc8f24d990cf64d922456bb3e783f5b47ea6b60d04417c464",
                "recordId": "home-codex-teal-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.webp",
                    "sha256": "f27f7b5e7078cc03cbfc36d81c52422ab818c796523bbb95a3037bcc2a0f0787",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                      "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-plate-v1.png",
                      "sourceSha256": "3b6ae5c3cfa2719fc8f24d990cf64d922456bb3e783f5b47ea6b60d04417c464",
                      "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.avif",
                    "sha256": "e8e79b7de4df743413efe2d4de99d477caf515a83a22871a41af93b288b65288",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                      "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-plate-v1.png",
                      "sourceSha256": "3b6ae5c3cfa2719fc8f24d990cf64d922456bb3e783f5b47ea6b60d04417c464",
                      "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.15,
                  0,
                  0.7,
                  1
                ]
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-teal",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-plate-v1.png",
                    "sha256": "3b6ae5c3cfa2719fc8f24d990cf64d922456bb3e783f5b47ea6b60d04417c464",
                    "recordId": "home-codex-teal-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.webp",
                        "sha256": "f27f7b5e7078cc03cbfc36d81c52422ab818c796523bbb95a3037bcc2a0f0787",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                          "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-plate-v1.png",
                          "sourceSha256": "3b6ae5c3cfa2719fc8f24d990cf64d922456bb3e783f5b47ea6b60d04417c464",
                          "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.avif",
                        "sha256": "e8e79b7de4df743413efe2d4de99d477caf515a83a22871a41af93b288b65288",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                          "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-plate-v1.png",
                          "sourceSha256": "3b6ae5c3cfa2719fc8f24d990cf64d922456bb3e783f5b47ea6b60d04417c464",
                          "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-codex-teal-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-teal-codex-layer-v3-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-teal",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-codex-layer-v3.png",
                    "sha256": "43681d25c7d3a003c5ded29f9e82a36294e583000858a28181ef4fc89c36af63",
                    "recordId": "home-codex-teal-codex-layer-v3",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-teal-codex-layer-v3-1600.webp",
                        "sha256": "35dc1af53bcf5959255b1b434890f9a927d00eea40682e0a8f9e2594219b2a65",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-codex-layer-v3.png",
                          "sourceSha256": "43681d25c7d3a003c5ded29f9e82a36294e583000858a28181ef4fc89c36af63",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-teal-codex-layer-v3-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-teal-codex-layer-v3-1600.avif",
                        "sha256": "4dd93307b12539b480f3c40894e1ace13b5b0f5e8b3a53136b230b01992b7b2b",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-codex-teal-codex-layer-v3.png",
                          "sourceSha256": "43681d25c7d3a003c5ded29f9e82a36294e583000858a28181ef4fc89c36af63",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-teal-codex-layer-v3-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "light",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0.5,
            0.5,
            0.21,
            0.5
          ],
          "ar": [
            0.5,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-claude-teal",
          "alt": "Claude projection, visor teal, holding one page from his coat, reading it, calm.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "light"
          },
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.2
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Thirty-one\ncitations. Dana\nsigned each one.",
              "x": 0.09055,
              "y": 0.23,
              "w": 0.54889,
              "tail": [
                0.36499,
                0.158
              ],
              "phone": {
                "x": 0.0276,
                "y": 0.2315,
                "w": 0.82008,
                "tail": [
                  0.3283,
                  0.1936
                ]
              },
              "speech": {
                "id": "home-roof-continued-1-home-claude-teal-b0",
                "src": "/comic/speech/home-20261012b/home-roof-continued-1-home-claude-teal-b0-eq-v1.mp3",
                "durationSeconds": 3.369796,
                "provider": "Fish Audio",
                "characterId": "claude",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-claude-teal-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-claude-teal-composite-v2-1600.avif"
            ],
            "ar": [
              0.05556,
              0,
              0.88889,
              1
            ],
            "canonicalSource": {
              "panelId": "home-claude-teal",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-composite-v2.png",
              "sha256": "bdf17c9d3282489ad2a5a15d689e7d8bc5e9ff50b3b18938156431070b2757e6",
              "recordId": "home-claude-teal-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-teal-composite-v2-1600.webp",
                  "sha256": "424990e00d86fd29a2414b799849e5bf32d4ffed0474b241411530b8519b785b",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-composite-v2.png",
                    "sourceSha256": "bdf17c9d3282489ad2a5a15d689e7d8bc5e9ff50b3b18938156431070b2757e6",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-teal-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-teal-composite-v2-1600.avif",
                  "sha256": "a6d9e7d9cbc44642c337692015bc77b080a2090ce4a21f777e856d51de2673eb",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-composite-v2.png",
                    "sourceSha256": "bdf17c9d3282489ad2a5a15d689e7d8bc5e9ff50b3b18938156431070b2757e6",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-teal-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.15,
                0,
                0.7,
                1
              ]
            }
          },
          "views": [
            {
              "id": "home-claude-teal-projection",
              "at": 0,
              "alt": "Claude projection, visor teal, holding one page from his coat, reading it, calm.",
              "src": "/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.webp",
              "ar": [
                0.05556,
                0,
                0.88889,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-claude-teal",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-plate-v1.png",
                "sha256": "9541a03e757bd43b5bfacb848ae2c23a3804098396811c3d5b0a53ac4aaabb64",
                "recordId": "home-claude-teal-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.webp",
                    "sha256": "f7858b0ace7e3653be96d35293b8c71c114ff380005aaa0343153756039b9f25",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                      "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-plate-v1.png",
                      "sourceSha256": "9541a03e757bd43b5bfacb848ae2c23a3804098396811c3d5b0a53ac4aaabb64",
                      "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.avif",
                    "sha256": "557ac1629a5b7decc170f3a3fd60f9ecb72abbd390d6e312d86b6fb48ad43ead",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                      "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-plate-v1.png",
                      "sourceSha256": "9541a03e757bd43b5bfacb848ae2c23a3804098396811c3d5b0a53ac4aaabb64",
                      "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.15,
                  0,
                  0.7,
                  1
                ]
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-claude-teal",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-plate-v1.png",
                    "sha256": "9541a03e757bd43b5bfacb848ae2c23a3804098396811c3d5b0a53ac4aaabb64",
                    "recordId": "home-claude-teal-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.webp",
                        "sha256": "f7858b0ace7e3653be96d35293b8c71c114ff380005aaa0343153756039b9f25",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                          "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-plate-v1.png",
                          "sourceSha256": "9541a03e757bd43b5bfacb848ae2c23a3804098396811c3d5b0a53ac4aaabb64",
                          "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.avif",
                        "sha256": "557ac1629a5b7decc170f3a3fd60f9ecb72abbd390d6e312d86b6fb48ad43ead",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                          "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-plate-v1.png",
                          "sourceSha256": "9541a03e757bd43b5bfacb848ae2c23a3804098396811c3d5b0a53ac4aaabb64",
                          "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-claude-teal-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "claude",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-claude-teal-claude-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-claude-teal",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-claude-layer-v2.png",
                    "sha256": "3e4d74392337f696b388035448f90ec40be4d8f22350f6970f60acd3e636c424",
                    "recordId": "home-claude-teal-claude-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-teal-claude-layer-v2-1600.webp",
                        "sha256": "ec32e9746dd3657ff7d11e7de31c209f42069296ad20d6c8935aeed90215c1a4",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-claude-layer-v2.png",
                          "sourceSha256": "3e4d74392337f696b388035448f90ec40be4d8f22350f6970f60acd3e636c424",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-teal-claude-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-claude-teal-claude-layer-v2-1600.avif",
                        "sha256": "2210c7bf243d0e7a3a332d7a594c87fbfaf9a8cfc4cd3d7ce1a0f065fea56603",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-claude-teal-claude-layer-v2.png",
                          "sourceSha256": "3e4d74392337f696b388035448f90ec40be4d8f22350f6970f60acd3e636c424",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-claude-teal-claude-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "light",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "claude",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "street",
          "r": [
            0.71,
            0.5,
            0.29,
            0.5
          ],
          "ar": [
            0.75,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-matt-names",
          "alt": "Matt counts owners on his fingers, Marco beside him nodding.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Ruth owns the terms.\nSam owns the costs.\nYou approve every\nsend.",
              "x": 0.1141,
              "y": 0.3598,
              "w": 0.6,
              "tail": [
                0.2485,
                0.2842
              ],
              "phone": {
                "x": 0.03,
                "y": 0.405,
                "w": 0.73438,
                "tail": [
                  0.15714,
                  0.3
                ]
              },
              "speech": {
                "id": "home-roof-home-matt-names-b1-20261015",
                "src": "/comic/speech/home-20261015/home-roof-home-matt-names-b1-eq-v1.mp3",
                "durationSeconds": 3.808073,
                "provider": "ElevenLabs",
                "characterId": "matt",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/roof/home-matt-names-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/roof/home-matt-names-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-matt-names",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-matt-names-plate-v1.png",
              "sha256": "44f93d30832dfbfc21f245d2310b9706d5d66c2977f928f64438eda0474b4919",
              "recordId": "home-matt-names-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-matt-names-plate-v1-1600.webp",
                  "sha256": "de58d80612628e1fd1ea5cf90ad5f9abe3c58f861508eb7d508521b8f3f434c1",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                    "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-matt-names-plate-v1.png",
                    "sourceSha256": "44f93d30832dfbfc21f245d2310b9706d5d66c2977f928f64438eda0474b4919",
                    "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-matt-names-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/roof/home-matt-names-plate-v1-1600.avif",
                  "sha256": "b0ae74ee92ac38f45d0b68674572d7a8b1b774a28326b0cb57827a6879a5de13",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/roof-encodings-v2.json",
                    "sha256": "3c53c9355881d270051980d37f59a6ab765c0f78baf1bcf1c4622d08db85b1bf",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/roof/home-matt-names-plate-v1.png",
                    "sourceSha256": "44f93d30832dfbfc21f245d2310b9706d5d66c2977f928f64438eda0474b4919",
                    "outputPath": "site/public/comic/home/rebuild-20261014/roof/home-matt-names-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.134,
                0,
                0.69498,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-roof",
            "r": [
              0,
              0,
              0.6,
              0.2
            ]
          },
          {
            "img": "home-marco-tired",
            "r": [
              0.6,
              0,
              0.4,
              0.2
            ]
          },
          {
            "img": "home-brain-rises",
            "r": [
              0,
              0.2,
              0.5,
              0.4
            ]
          },
          {
            "img": "home-codex-teal",
            "r": [
              0.5,
              0.2,
              0.5,
              0.4
            ]
          },
          {
            "img": "home-claude-teal",
            "r": [
              0,
              0.6000000000000001,
              0.5,
              0.3999999999999999
            ]
          },
          {
            "img": "home-matt-names",
            "r": [
              0.5,
              0.6000000000000001,
              0.5,
              0.3999999999999999
            ]
          }
        ]
      ]
    },
    {
      "id": "monday",
      "artCropInsetPct": 0,
      "art": "/comic/home/rebuild-20261014/monday/home-monday-page-master-v2",
      "score": 0.5,
      "room": "office",
      "panels": [
        {
          "at": 0,
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
          "img": "home-monday-desks",
          "alt": "Wide sunny new office filled with rows of freshly installed desks; Sam in his hi-vis jacket and hard hat with a clipboard, his installers packing tools; a site-safety sign on the wall.",
          "motion": {
            "beats": 6,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [
            {
              "kind": "impact",
              "gain": 0.2
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Gilmour & Clark.\nMonday, 19 October,\n8:55 a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.3,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.8394
              },
              "speech": {
                "id": "home-monday-home-monday-desks-b1-20261015",
                "src": "/comic/speech/home-20261015/home-monday-home-monday-desks-b1-eq-tempo112-v1.mp3",
                "durationSeconds": 5.85644,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Two hundred desks.\nDone before nine.",
              "x": 0.71907,
              "y": 0.03,
              "w": 0.25093,
              "tail": [
                0.36,
                0.34133
              ],
              "phone": {
                "x": 0.0251,
                "y": 0.3083,
                "w": 0.7,
                "tail": [
                  0.2786,
                  0.2487
                ]
              },
              "speech": {
                "id": "home-monday-home-monday-desks-b2-20261015",
                "src": "/comic/speech/home-20261015/home-monday-home-monday-desks-b2-eq-v1.mp3",
                "durationSeconds": 2.56,
                "provider": "Fish Audio",
                "characterId": "sam",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/monday/home-monday-desks-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/monday/home-monday-desks-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              0.70313
            ],
            "canonicalSource": {
              "panelId": "home-monday-desks",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-monday-desks-plate-v1.png",
              "sha256": "d6093e0bfaae0d11da80b005febb0263391f6f883f31f46691224d87b2ef92cf",
              "recordId": "home-monday-desks-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-monday-desks-plate-v1-1600.webp",
                  "sha256": "6569306e613613c5b1c0441a7ef107593659699cf8e61bdf96dfe6b1139746c1",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                    "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-monday-desks-plate-v1.png",
                    "sourceSha256": "d6093e0bfaae0d11da80b005febb0263391f6f883f31f46691224d87b2ef92cf",
                    "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-monday-desks-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-monday-desks-plate-v1-1600.avif",
                  "sha256": "f77a95772fe64862b410eee23c1288b38ec1ce81a9eeef469472f0f22eee34a0",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                    "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-monday-desks-plate-v1.png",
                    "sourceSha256": "d6093e0bfaae0d11da80b005febb0263391f6f883f31f46691224d87b2ef92cf",
                    "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-monday-desks-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.15983,
                0,
                0.68034,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.6,
            0,
            0.4,
            0.5
          ],
          "ar": [
            0.6,
            0,
            0.4,
            0.5
          ],
          "img": "home-monday-floor",
          "alt": "Floor 31, sunny: Marco back at his desk with a fresh coffee, a new request on his laptop (screen faces Marco; we see it from beside him).",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.2
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 31. Monday,\n19 October, 9:10 a.m.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.40208333333333335,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.6151
              },
              "speech": {
                "id": "home-monday-floor-b0-20261013",
                "src": "/comic/speech/home-20261013/home-monday-floor-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 5.578481,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/monday/home-monday-floor-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/monday/home-monday-floor-plate-v1-1600.avif"
            ],
            "ar": [
              0,
              0,
              1,
              1
            ],
            "canonicalSource": {
              "panelId": "home-monday-floor",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-monday-floor-plate-v1.png",
              "sha256": "50f27c9d04c5de135baf9d9efb8ac10a2496428ac8236642617942fb5789f2cb",
              "recordId": "home-monday-floor-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-monday-floor-plate-v1-1600.webp",
                  "sha256": "e1e298d05f0446146b13085e207bd7ee03e797bed97a9ed6a06e7dad41966b54",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                    "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-monday-floor-plate-v1.png",
                    "sourceSha256": "50f27c9d04c5de135baf9d9efb8ac10a2496428ac8236642617942fb5789f2cb",
                    "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-monday-floor-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-monday-floor-plate-v1-1600.avif",
                  "sha256": "c8ddca663a420133ae3d11bd7066266496fe6906462d8a238a3aece12cb7c4ea",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                    "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-monday-floor-plate-v1.png",
                    "sourceSha256": "50f27c9d04c5de135baf9d9efb8ac10a2496428ac8236642617942fb5789f2cb",
                    "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-monday-floor-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.22308,
                0,
                0.55385,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0,
            0.5,
            0.21,
            0.5
          ],
          "ar": [
            0,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-chat-ok-again",
          "alt": "Over the shoulder of Marco (back of his curly head and blue shirt in the foreground): his laptop screen faces him and us, showing a chat reply bubble with a big green tick. The back of the laptop lid is never visible.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "push"
          },
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
              "who": "narrator",
              "text": "Looks great!\nReady to send.",
              "x": 0.03,
              "y": 0.03,
              "w": 0.49556,
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.7
              },
              "speech": {
                "id": "home-chat-ok-b0-20261013",
                "src": "/comic/speech/home-20261013/home-chat-ok-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 2.55678,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/monday/home-chat-ok-again-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/monday/home-chat-ok-again-plate-v1-1600.avif"
            ],
            "ar": [
              0.05556,
              0,
              0.88889,
              1
            ],
            "canonicalSource": {
              "panelId": "home-chat-ok-again",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-chat-ok-again-plate-v1.png",
              "sha256": "f25c6cd4f94a9bd22a715bbe08d10301d00b34828f45af9bfde832d80be9d67e",
              "recordId": "home-chat-ok-again-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-chat-ok-again-plate-v1-1600.webp",
                  "sha256": "cbb2d2e79f0eeaa7528c99a6f3974ac62ab632f33654c14af5f73acd4602afb2",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                    "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-chat-ok-again-plate-v1.png",
                    "sourceSha256": "f25c6cd4f94a9bd22a715bbe08d10301d00b34828f45af9bfde832d80be9d67e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-chat-ok-again-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-chat-ok-again-plate-v1-1600.avif",
                  "sha256": "3691368f9e67370ae1e4166506a4e81701ab06ca3769253f59141462efd6126b",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                    "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-chat-ok-again-plate-v1.png",
                    "sourceSha256": "f25c6cd4f94a9bd22a715bbe08d10301d00b34828f45af9bfde832d80be9d67e",
                    "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-chat-ok-again-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.35067,
                0,
                0.29867,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.21,
            0.5,
            0.24,
            0.5
          ],
          "ar": [
            0.25,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-marco-turns",
          "alt": "Marco turns from the laptop to the Codex projection standing beside his desk, pointing at it: show me.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-left"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "marco",
              "text": "Not yet. Show me\nthe assumptions.",
              "x": 0.13555,
              "y": 0.03,
              "w": 0.54889,
              "tail": [
                0.40999,
                0.42
              ],
              "phone": {
                "x": 0.03,
                "y": 0.03,
                "w": 0.7,
                "tail": [
                  0.23213,
                  0.42
                ]
              },
              "speech": {
                "id": "home-monday-home-marco-turns-b0",
                "src": "/comic/speech/home-20261012b/home-monday-home-marco-turns-b0-eq-v1.mp3",
                "durationSeconds": 1.950476,
                "provider": "ElevenLabs",
                "characterId": "marco",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-marco-turns-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-marco-turns-composite-v2-1600.avif"
            ],
            "ar": [
              0.05556,
              0,
              0.88889,
              1
            ],
            "canonicalSource": {
              "panelId": "home-marco-turns",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-composite-v2.png",
              "sha256": "c7272fc8244ec75d2cf755c758b7a76a66387c95110d2839dd1bac4f97263ea8",
              "recordId": "home-marco-turns-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-marco-turns-composite-v2-1600.webp",
                  "sha256": "30d550f57b87dfbc1d6a33566f6c787eb52f67a67ee1d24a90754998c41446cb",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-composite-v2.png",
                    "sourceSha256": "c7272fc8244ec75d2cf755c758b7a76a66387c95110d2839dd1bac4f97263ea8",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-marco-turns-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-marco-turns-composite-v2-1600.avif",
                  "sha256": "4a14b671454c3579cd920da95975dc8972f725eba13d015837c276bee76a84a7",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-composite-v2.png",
                    "sourceSha256": "c7272fc8244ec75d2cf755c758b7a76a66387c95110d2839dd1bac4f97263ea8",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-marco-turns-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0,
                0.07366,
                1,
                0.85268
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-marco-turns-projection",
              "at": 0,
              "alt": "Marco turns from the laptop to the Codex projection standing beside his desk, pointing at it: show me.",
              "src": "/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.webp",
              "ar": [
                0.05556,
                0,
                0.88889,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-marco-turns",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-plate-v1.png",
                "sha256": "3a33cfa43cd9f8c0f4001a6b40f03859962d7824aa977c329174ca096a6e3d73",
                "recordId": "home-marco-turns-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.webp",
                    "sha256": "b593f451929a2ecc31f43de74312b3d58ad8544a9a8041fa1db51feb93712669",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                      "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-plate-v1.png",
                      "sourceSha256": "3a33cfa43cd9f8c0f4001a6b40f03859962d7824aa977c329174ca096a6e3d73",
                      "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.avif",
                    "sha256": "3791e42340d7889e1984be89c9a19408e3f1937c5a350b6f8ddc038ce2b23654",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                      "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-plate-v1.png",
                      "sourceSha256": "3a33cfa43cd9f8c0f4001a6b40f03859962d7824aa977c329174ca096a6e3d73",
                      "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0,
                  0.07366,
                  1,
                  0.85268
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-marco-turns",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-plate-v1.png",
                    "sha256": "3a33cfa43cd9f8c0f4001a6b40f03859962d7824aa977c329174ca096a6e3d73",
                    "recordId": "home-marco-turns-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.webp",
                        "sha256": "b593f451929a2ecc31f43de74312b3d58ad8544a9a8041fa1db51feb93712669",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                          "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-plate-v1.png",
                          "sourceSha256": "3a33cfa43cd9f8c0f4001a6b40f03859962d7824aa977c329174ca096a6e3d73",
                          "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.avif",
                        "sha256": "3791e42340d7889e1984be89c9a19408e3f1937c5a350b6f8ddc038ce2b23654",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                          "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-plate-v1.png",
                          "sourceSha256": "3a33cfa43cd9f8c0f4001a6b40f03859962d7824aa977c329174ca096a6e3d73",
                          "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-marco-turns-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-marco-turns-codex-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-marco-turns",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-codex-layer-v2.png",
                    "sha256": "e2de57897e2f22364d250ea7bf797586d7c55e712e1d9fcb8057620353ed4449",
                    "recordId": "home-marco-turns-codex-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-marco-turns-codex-layer-v2-1600.webp",
                        "sha256": "b1641181e53bf12c6408a357254e31ef28f268eeed1265000c48d7ba1bbabce3",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-codex-layer-v2.png",
                          "sourceSha256": "e2de57897e2f22364d250ea7bf797586d7c55e712e1d9fcb8057620353ed4449",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-marco-turns-codex-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-marco-turns-codex-layer-v2-1600.avif",
                        "sha256": "92c8f224e11bfd29fef8e539e88f0bcebe289499872092e5efd3a5284fd29e3d",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-marco-turns-codex-layer-v2.png",
                          "sourceSha256": "e2de57897e2f22364d250ea7bf797586d7c55e712e1d9fcb8057620353ed4449",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-marco-turns-codex-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "drift-left",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.45,
            0.5,
            0.29,
            0.5
          ],
          "ar": [
            0.5,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-codex-lists",
          "alt": "Codex projection holds up a teal list card with three lines and ticks; Marco reading it.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "light"
          },
          "sfx": [],
          "balloons": [
            {
              "at": 0,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Rates, 2026, from Sam.\nSafety clause in.\nI hold\nthe draft for you.",
              "x": 0.37,
              "y": 0.03,
              "w": 0.6,
              "tail": [
                0.13999,
                0.2107
              ],
              "phone": {
                "x": 0.0266,
                "y": 0.4652,
                "w": 0.7,
                "tail": [
                  0.0959,
                  0.2236
                ]
              },
              "speech": {
                "id": "home-monday-home-codex-lists-b1-20261015",
                "src": "/comic/speech/home-20261015/home-monday-home-codex-lists-b1-eq-v1.mp3",
                "durationSeconds": 5.903673,
                "provider": "Fish Audio",
                "characterId": "codex",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/defect-pass-20261015/home-codex-lists-composite-v2-1600.webp",
            "alternates": [
              "/comic/home/defect-pass-20261015/home-codex-lists-composite-v2-1600.avif"
            ],
            "ar": [
              0.05556,
              0,
              0.88889,
              1
            ],
            "canonicalSource": {
              "panelId": "home-codex-lists",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-composite-v2.png",
              "sha256": "e5c0423b48f9c66bf915aebea2662ed23a69bbce09dab0705b0964fec8beebb4",
              "recordId": "home-codex-lists-composite-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-lists-composite-v2-1600.webp",
                  "sha256": "c4b79e369f648e45bcafb6a97442dd52137c74411b6b68e268d38556558d3793",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-composite-v2.png",
                    "sourceSha256": "e5c0423b48f9c66bf915aebea2662ed23a69bbce09dab0705b0964fec8beebb4",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-lists-composite-v2-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-lists-composite-v2-1600.avif",
                  "sha256": "a32b9b38b9776d3bf28c49f364b8e09163d5423e21ba8df8e407e074eee5a0ce",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                    "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-composite-v2.png",
                    "sourceSha256": "e5c0423b48f9c66bf915aebea2662ed23a69bbce09dab0705b0964fec8beebb4",
                    "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-lists-composite-v2-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.1104,
                0,
                0.72587,
                1
              ],
              "fit": "cover"
            }
          },
          "views": [
            {
              "id": "home-codex-lists-projection",
              "at": 0,
              "alt": "Codex projection holds up a teal list card with three lines and ticks; Marco reading it.",
              "src": "/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.webp",
              "ar": [
                0.05556,
                0,
                0.88889,
                1
              ],
              "fit": "cover",
              "canonicalSource": {
                "panelId": "home-codex-lists",
                "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-plate-v1.png",
                "sha256": "e0b3e7177c2e999f79129c3cad15302c4f7702c48b6019666cfcb722777befc4",
                "recordId": "home-codex-lists-plate-v1",
                "treatment": "comic-ink",
                "deliveryBindings": [
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.webp",
                    "sha256": "8c5f9f69eedbfd0b00fb47911056f47258f4399457e15301dddc687212d4cebd",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                      "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-plate-v1.png",
                      "sourceSha256": "e0b3e7177c2e999f79129c3cad15302c4f7702c48b6019666cfcb722777befc4",
                      "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.webp"
                    }
                  },
                  {
                    "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.avif",
                    "sha256": "c2670cf1a836439719863b58c82b9317c2ce81f856bf2f8bbf2087ecafbd589d",
                    "encoderReceipt": {
                      "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                      "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                      "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-plate-v1.png",
                      "sourceSha256": "e0b3e7177c2e999f79129c3cad15302c4f7702c48b6019666cfcb722777befc4",
                      "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.avif"
                    }
                  }
                ]
              },
              "phone": {
                "ar": [
                  0.1104,
                  0,
                  0.72587,
                  1
                ],
                "fit": "cover"
              },
              "layers": [
                {
                  "id": "plate",
                  "role": "background",
                  "src": "/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-lists",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-plate-v1.png",
                    "sha256": "e0b3e7177c2e999f79129c3cad15302c4f7702c48b6019666cfcb722777befc4",
                    "recordId": "home-codex-lists-plate-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.webp",
                        "sha256": "8c5f9f69eedbfd0b00fb47911056f47258f4399457e15301dddc687212d4cebd",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                          "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-plate-v1.png",
                          "sourceSha256": "e0b3e7177c2e999f79129c3cad15302c4f7702c48b6019666cfcb722777befc4",
                          "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.avif",
                        "sha256": "c2670cf1a836439719863b58c82b9317c2ce81f856bf2f8bbf2087ecafbd589d",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                          "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-plate-v1.png",
                          "sourceSha256": "e0b3e7177c2e999f79129c3cad15302c4f7702c48b6019666cfcb722777befc4",
                          "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-codex-lists-plate-v1-1600.avif"
                        }
                      }
                    ]
                  }
                },
                {
                  "id": "codex",
                  "role": "agents",
                  "src": "/comic/home/defect-pass-20261015/home-codex-lists-codex-layer-v2-1600.webp",
                  "canonicalSource": {
                    "panelId": "home-codex-lists",
                    "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-codex-layer-v2.png",
                    "sha256": "e774414eff41a9b5b1d3f89c9fb760dcb273f48cfe82d4a0c453bffd22ef4f66",
                    "recordId": "home-codex-lists-codex-layer-v1",
                    "treatment": "comic-ink",
                    "deliveryBindings": [
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-lists-codex-layer-v2-1600.webp",
                        "sha256": "29dfef5fa0efee44f42b0d991587b92e52143080859b19f854c87aa5841c51a1",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-codex-layer-v2.png",
                          "sourceSha256": "e774414eff41a9b5b1d3f89c9fb760dcb273f48cfe82d4a0c453bffd22ef4f66",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-lists-codex-layer-v2-1600.webp"
                        }
                      },
                      {
                        "publicPath": "site/public/comic/home/defect-pass-20261015/home-codex-lists-codex-layer-v2-1600.avif",
                        "sha256": "4f909318d17d369560225466fef58baee44f69f0802614d4bf0ea7e77f4bc12f",
                        "encoderReceipt": {
                          "path": "wiki/image-library/records/comic-b-home-defect-pass-20261015/encodings-v1.json",
                          "sha256": "3216d3176f3176f5d7642ed237bbf37dfe5bd05718e0a251b559eab68c0a4496",
                          "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-codex-lists-codex-layer-v2.png",
                          "sourceSha256": "e774414eff41a9b5b1d3f89c9fb760dcb273f48cfe82d4a0c453bffd22ef4f66",
                          "outputPath": "site/public/comic/home/defect-pass-20261015/home-codex-lists-codex-layer-v2-1600.avif"
                        }
                      }
                    ]
                  }
                }
              ],
              "layerMotion": [
                {
                  "layerId": "plate",
                  "preset": "light",
                  "beats": 4,
                  "strength": 0.3
                },
                {
                  "layerId": "codex",
                  "preset": "projection",
                  "fabrication": true,
                  "beats": 4,
                  "strength": 0.8
                }
              ]
            }
          ]
        },
        {
          "at": 0,
          "room": "office",
          "r": [
            0.74,
            0.5,
            0.26,
            0.5
          ],
          "ar": [
            0.75,
            0.5,
            0.25,
            0.5
          ],
          "img": "home-apology-letters",
          "alt": "Matt leaving through the glass door with his jacket over his shoulder; on Marco’s desk a stack of printed apology letters (printed face up) waits beside the signed Gilmour & Clark order.",
          "motion": {
            "beats": 4,
            "strength": 0.5,
            "preset": "drift-right"
          },
          "sfx": [
            {
              "kind": "door",
              "gain": 0.3
            }
          ],
          "balloons": [
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Gilmour & Clark signed\nthe corrected quote.\nThe Monday booking\nheld.",
              "x": 0.3,
              "y": 0.95,
              "w": 0.6699999999999999,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.6459
              },
              "speech": {
                "id": "home-apology-letters-b0-20261013",
                "src": "/comic/speech/home-20261013/home-apology-letters-b0-20261013-eq-tempo112-v1.mp3",
                "durationSeconds": 4.726327,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            },
            {
              "at": 0,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The four hundred\nemails\ncould not be unsent.",
              "x": 0.03,
              "y": 0.95,
              "w": 0.6166666666666667,
              "phone": {
                "x": 0.03,
                "y": 0.95,
                "w": 0.6
              },
              "speech": {
                "id": "home-apology-letters-b2-20261013",
                "src": "/comic/speech/home-20261013/home-apology-letters-b2-20261013-eq-tempo112-crest-v2.mp3",
                "durationSeconds": 2.851247,
                "provider": "Fish Audio",
                "characterId": "second-brain",
                "gain": 0.85
              }
            }
          ],
          "pageArt": [
            0,
            0,
            1,
            1
          ],
          "artFit": "cover",
          "staticArt": {
            "src": "/comic/home/rebuild-20261014/monday/home-apology-letters-plate-v1-1600.webp",
            "alternates": [
              "/comic/home/rebuild-20261014/monday/home-apology-letters-plate-v1-1600.avif"
            ],
            "ar": [
              0.00553,
              0,
              0.98895,
              1
            ],
            "canonicalSource": {
              "panelId": "home-apology-letters",
              "path": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-apology-letters-plate-v1.png",
              "sha256": "f2233f8fc55683f6699ba5e2a81df25df8fae3fb97c73260d1a0fdd8e5f6629d",
              "recordId": "home-apology-letters-plate-v1",
              "treatment": "comic-ink",
              "deliveryBindings": [
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-apology-letters-plate-v1-1600.webp",
                  "sha256": "b3a89f8bb9b05727c75abd89450fb0856363f1db8e705d20676ad946dfcca329",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                    "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-apology-letters-plate-v1.png",
                    "sourceSha256": "f2233f8fc55683f6699ba5e2a81df25df8fae3fb97c73260d1a0fdd8e5f6629d",
                    "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-apology-letters-plate-v1-1600.webp"
                  }
                },
                {
                  "publicPath": "site/public/comic/home/rebuild-20261014/monday/home-apology-letters-plate-v1-1600.avif",
                  "sha256": "c0cd1f11c18bf93e619bb25305cba42ff9459b3ac5c8f41751dd19a4f25f2f66",
                  "encoderReceipt": {
                    "path": "wiki/image-library/records/comic-b-home-rebuild-20261014/monday-encodings-v2.json",
                    "sha256": "8864810dd2ed0dc8a1c9aabe6bda6d67a473f6633da83b3c9affb229b523b0d6",
                    "sourcePath": "wiki/image-library/assets/scenes/comic-b/home-rebuild-20261014/monday/home-apology-letters-plate-v1.png",
                    "sourceSha256": "f2233f8fc55683f6699ba5e2a81df25df8fae3fb97c73260d1a0fdd8e5f6629d",
                    "outputPath": "site/public/comic/home/rebuild-20261014/monday/home-apology-letters-plate-v1-1600.avif"
                  }
                }
              ]
            },
            "phone": {
              "ar": [
                0.16603,
                0,
                0.66795,
                1
              ],
              "fit": "cover"
            },
            "fit": "cover"
          }
        }
      ],
      "phonePages": [
        [
          {
            "img": "home-monday-desks",
            "r": [
              0,
              0,
              0.55,
              0.3
            ]
          },
          {
            "img": "home-monday-floor",
            "r": [
              0.55,
              0,
              0.45,
              0.3
            ]
          },
          {
            "img": "home-chat-ok-again",
            "r": [
              0,
              0.3,
              0.38,
              0.3
            ]
          },
          {
            "img": "home-marco-turns",
            "r": [
              0.38,
              0.3,
              0.62,
              0.3
            ]
          },
          {
            "img": "home-codex-lists",
            "r": [
              0,
              0.6,
              0.52,
              0.4
            ]
          },
          {
            "img": "home-apology-letters",
            "r": [
              0.52,
              0.6,
              0.48,
              0.4
            ]
          }
        ]
      ]
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
});
