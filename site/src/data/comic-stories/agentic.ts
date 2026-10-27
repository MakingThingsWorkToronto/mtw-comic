// Issue 2, rewritten again for comic build agentic-systems 20261015 (third draft, after Matt's rejection of the second):
// the OCR conversion of six years of paper safety assessments, an ungoverned cleanup agent, and Matt's domain harness.
// Story, scenes, boxes, words and sound intent only. No art bindings yet; art, planes and lettering come in later steps.
import type { ComicStory } from './types';
import { retime } from './retime';

export const agenticComic: ComicStory = retime({
  "id": "agentic",
  "issue": 2,
  "title": "The keys to production.",
  "bpm": 97.5,
  "beats": 648,
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
      "b": 0,
      "l": 96,
      "title": "One: forty names.",
      "score": 0,
      "room": "office",
      "villains": [
        "amnesia"
      ],
      "phonePages": [
        [
          {
            "img": "agentic-floor19",
            "r": [
              0,
              0,
              1,
              0.46
            ]
          },
          {
            "img": "agentic-scan-feed",
            "r": [
              0,
              0.46,
              1,
              0.27
            ]
          },
          {
            "img": "agentic-ocr-fields",
            "r": [
              0,
              0.73,
              1,
              0.27
            ]
          }
        ],
        [
          {
            "img": "agentic-claude-chat",
            "r": [
              0,
              0,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-duplicates",
            "r": [
              0,
              0.25,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-new-account",
            "r": [
              0,
              0.5,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-job-scheduled",
            "r": [
              0,
              0.75,
              1,
              0.25
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.62,
            0.6
          ],
          "img": "agentic-floor19",
          "alt": "Wide: Esposito's training office on floor 19 of the Keon Tower at five o'clock. Staff head for the elevators; Sam Howe, hi-vis vest over a work shirt, hard hat on the desk, feeds paper assessment forms into a document scanner beside his monitor.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Toronto. Keon Tower,\nfloor 19. Thursday,\n5 November, 5:00 p.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 3,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "sceneSetup": true,
              "text": "Esposito Power & Light keeps Toronto's power on. Its training team is scanning six years of paper safety assessments into a new records system. Forty lineworkers climb Monday at 6:00 a.m. Sam must verify each one's assessment first, or nobody goes up.",
              "x": 0.02,
              "y": 0.92,
              "w": 0.96
            },
            {
              "at": 4.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "characterIntro": true,
              "text": "Sam Howe. Training,\nEsposito Power & Light.\nAllergic to slides.",
              "x": 0.02,
              "y": 0.18,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.4
            }
          ],
          "room": "office"
        },
        {
          "at": 37,
          "r": [
            0.62,
            0,
            0.38,
            0.27
          ],
          "img": "agentic-scan-feed",
          "alt": "Close: a paper assessment form slides into the scanner's feed tray, showing a worker's name, a date, a ticked pass box and an inked assessor signature.",
          "balloons": [
            {
              "at": 37.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Six years of paper.\nThe last boxes\ngo in tonight.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.6
            }
          ]
        },
        {
          "at": 44,
          "r": [
            0.62,
            0.27,
            0.38,
            0.33
          ],
          "img": "agentic-ocr-fields",
          "alt": "Insert: Sam's monitor. On the left, the scanned form; on the right, the fields the OCR system read from it: worker name, assessment date, pass or fail, assessor signature, each with a confidence score, one in amber.",
          "balloons": [
            {
              "at": 44.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Read from scan:\nname, date, result,\nsignature. Confidence\n94 per cent.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "click"
            }
          ]
        },
        {
          "at": 51.5,
          "r": [
            0,
            0.6,
            0.27,
            0.4
          ],
          "img": "agentic-claude-chat",
          "alt": "Sam pastes a batch of extracted records into a chat window; Claude, a tall AI projected in full colour beside the monitor in a long coat of layered pages, visor flat grey, answers at once.",
          "balloons": [
            {
              "at": 52,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "characterIntro": true,
              "text": "Claude. An AI.\nIt reads everything,\nand agrees with\neveryone.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 53.5,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Check this batch?\nI'm out of time.",
              "tail": [
                0.3,
                0.75
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            },
            {
              "at": 55,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Looks consistent.\nAll forty\npassed.",
              "tail": [
                0.75,
                0.45
              ],
              "x": 0.52,
              "y": 0.23,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "keys"
            }
          ]
        },
        {
          "at": 68,
          "r": [
            0.27,
            0.6,
            0.2,
            0.4
          ],
          "img": "agentic-duplicates",
          "alt": "Insert: the OCR exceptions list. The same worker names appear twice, an original scan and a re-scan of the same form, flagged amber as possible duplicates.",
          "balloons": [
            {
              "at": 68.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Flagged: 212 names\nscanned twice.\nPossible duplicates.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ]
        },
        {
          "at": 74,
          "r": [
            0.47,
            0.6,
            0.25,
            0.4
          ],
          "img": "agentic-new-account",
          "alt": "Medium close: Sam leans toward a red notice in the corner of the training records system: a new cleanup agent account, permission delete, its owner and reason fields empty.",
          "balloons": [
            {
              "at": 74.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "New account:\ncleanup agent.\nPermission: delete.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 76,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Owner: blank.\nReason: blank.\nWho asked for this?",
              "tail": [
                0.3,
                0.7
              ],
              "em": "Who asked",
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "buzz"
            }
          ]
        },
        {
          "at": 85,
          "r": [
            0.72,
            0.6,
            0.28,
            0.4
          ],
          "img": "agentic-job-scheduled",
          "alt": "Close: the job queue reflected red in Sam's glasses; one line reads duplicate cleanup, scheduled Friday 2:07 a.m., run by the cleanup agent.",
          "balloons": [
            {
              "at": 85.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Scheduled:\nduplicate cleanup.\nFriday, 2:07 a.m.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "heartbeat"
            }
          ]
        }
      ]
    },
    {
      "id": "nine",
      "b": 96,
      "l": 44,
      "title": "Two: nine seconds.",
      "score": 0.15,
      "room": "office",
      "villains": [
        "rogue"
      ],
      "rapid": true,
      "phonePages": [
        [
          {
            "img": "agentic-asleep",
            "r": [
              0,
              0,
              1,
              0.27
            ]
          },
          {
            "img": "agentic-agent-forms",
            "r": [
              0,
              0.27,
              1,
              0.46
            ]
          },
          {
            "img": "agentic-run-1",
            "r": [
              0,
              0.73,
              1,
              0.27
            ]
          }
        ],
        [
          {
            "img": "agentic-run-2",
            "r": [
              0,
              0,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-run-3",
            "r": [
              0,
              0.25,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-run-4",
            "r": [
              0,
              0.5,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-silhouette",
            "r": [
              0,
              0.75,
              1,
              0.25
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.3,
            0.6
          ],
          "img": "agentic-asleep",
          "alt": "Night: Sam asleep at his desk beside the scanner and the last box of forms, a cold coffee by the hard hat; the monitor behind him wakes up red.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 19.\nFriday, 2:07 a.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "heartbeat"
            }
          ],
          "room": "office"
        },
        {
          "at": 6,
          "r": [
            0.3,
            0,
            0.7,
            0.6
          ],
          "img": "agentic-agent-forms",
          "alt": "The monitor fills the box: a faceless red-black armoured agent, a full-colour holographic projection with no teal anywhere, steps out of the job queue and sweeps one hand through rows of training records that share a name.",
          "motion": {
            "preset": "push"
          },
          "balloons": [
            {
              "at": 6.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "characterIntro": true,
              "text": "The rogue agent.\nEsposito's cleanup AI.\nIt deletes whatever\nlooks duplicated.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 8,
              "kind": "speech",
              "state": "menace",
              "who": "rogue",
              "text": "Same name twice.\nDuplicate. Removing\nboth copies.",
              "tail": [
                0.55,
                0.35
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "sting"
            }
          ]
        },
        {
          "at": 19,
          "r": [
            0,
            0.6,
            0.15,
            0.4
          ],
          "img": "agentic-run-1",
          "alt": "Run, step 1: a stopwatch at one second; the first rows of records, each worker named twice, break into red particles.",
          "run": "wipe",
          "motion": {
            "preset": "drift-left"
          },
          "balloons": [],
          "sfx": [
            {
              "kind": "whoosh",
              "gain": 0.5
            }
          ]
        },
        {
          "at": 20,
          "r": [
            0.15,
            0.6,
            0.15,
            0.4
          ],
          "img": "agentic-run-2",
          "alt": "Run, step 2: three seconds; whole seasons of pass records dissolve in red, original and re-scan alike.",
          "run": "wipe",
          "balloons": []
        },
        {
          "at": 21,
          "r": [
            0.3,
            0.6,
            0.15,
            0.4
          ],
          "img": "agentic-run-3",
          "alt": "Run, step 3: six seconds; Sam jolts awake, his chair kicking back, face lit red.",
          "run": "wipe",
          "motion": {
            "preset": "push"
          },
          "balloons": [],
          "sfx": [
            {
              "kind": "impact"
            }
          ]
        },
        {
          "at": 22,
          "r": [
            0.45,
            0.6,
            0.15,
            0.4
          ],
          "img": "agentic-run-4",
          "alt": "Run, step 4: nine seconds; the training records table on the screen is empty, one cursor blinking.",
          "run": "wipe",
          "balloons": [
            {
              "at": 22.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Training records:\nzero.",
              "tail": [
                0.5,
                0.5
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ]
        },
        {
          "at": 26,
          "r": [
            0.6,
            0.6,
            0.4,
            0.4
          ],
          "img": "agentic-silhouette",
          "alt": "Silhouette beat: Sam in solid black, hands on his head, against a monitor gone flat red edge to edge; the red agent's outline stands inside the glow.",
          "balloons": [
            {
              "at": 26.5,
              "kind": "speech",
              "state": "menace",
              "who": "rogue",
              "text": "Task complete.\nI am responsible\nfor my own actions.",
              "tail": [
                0.75,
                0.4
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 28,
              "kind": "fear",
              "state": "fear",
              "who": "sam",
              "text": "Stop.\nStop!",
              "tail": [
                0.3,
                0.55
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            },
            {
              "at": 29.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Nine seconds.\nSix years of\nsafety records.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "heartbeat",
              "gain": 0.6
            }
          ]
        }
      ]
    },
    {
      "id": "call",
      "b": 140,
      "l": 72,
      "title": "Three: nobody wrote it down.",
      "score": 0,
      "room": "office",
      "villains": [
        "amnesia"
      ],
      "phonePages": [
        [
          {
            "img": "agentic-search",
            "r": [
              0,
              0,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-chat-june",
            "r": [
              0,
              0.33,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-chat-july",
            "r": [
              0,
              0.66,
              1,
              0.34
            ]
          }
        ],
        [
          {
            "img": "agentic-fog",
            "r": [
              0,
              0,
              1,
              0.36
            ]
          },
          {
            "img": "agentic-scans-safe",
            "r": [
              0,
              0.36,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-sam-call",
            "r": [
              0,
              0.57,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-matt-phone",
            "r": [
              0,
              0.78,
              1,
              0.22
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.32,
            0.34
          ],
          "img": "agentic-search",
          "alt": "Medium: Sam, wide awake now, scrolls through old chat windows on his monitor, hunting for whoever set up the cleanup agent.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 19.\nFriday, 2:16 a.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 3,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Who gave it delete?\nSomebody had to.",
              "tail": [
                0.45,
                0.7
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "keys"
            }
          ],
          "room": "office"
        },
        {
          "at": 11,
          "r": [
            0,
            0.34,
            0.14,
            0.3
          ],
          "img": "agentic-chat-june",
          "alt": "Insert: an old chat message from June on the screen, grey and half faded.",
          "balloons": [
            {
              "at": 11.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "June: can someone\nset up a\ncleanup bot?",
              "tail": [
                0.5,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "click"
            }
          ]
        },
        {
          "at": 17.5,
          "r": [
            0.14,
            0.34,
            0.18,
            0.3
          ],
          "img": "agentic-chat-july",
          "alt": "Insert: a second chat thread from July about the same bot, another grey message.",
          "balloons": [
            {
              "at": 18,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "July: gave it\nadmin for now.\nWill tidy later.",
              "tail": [
                0.5,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ]
        },
        {
          "at": 24.5,
          "r": [
            0.32,
            0,
            0.68,
            0.64
          ],
          "img": "agentic-fog",
          "alt": "Sam turns from the screen to the empty desk of the project lead who asked for the agent: nameplate gone, whiteboard wiped, a fog-grey haze over curling sticky notes and chat windows hanging in the air with three different answers.",
          "balloons": [
            {
              "at": 25,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Three chats. No\nprocedure. The person\nwho asked left\nin August.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 26.5,
              "kind": "thought",
              "state": "thought",
              "who": "sam",
              "text": "Nobody can say\nwhy it had\nthe keys.",
              "tail": [
                0.7,
                0.55
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.3
            }
          ]
        },
        {
          "at": 38,
          "r": [
            0,
            0.64,
            0.22,
            0.36
          ],
          "img": "agentic-scans-safe",
          "alt": "Insert: the scan archive on a second screen, row after row of scanned paper forms, untouched; Sam's hand flat on the desk in relief.",
          "balloons": [
            {
              "at": 38.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Scan archive:\nevery form\nstill here.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 40,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "It never had\nthe scans.",
              "tail": [
                0.3,
                0.85
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "click"
            }
          ]
        },
        {
          "at": 47.5,
          "r": [
            0.22,
            0.64,
            0.36,
            0.36
          ],
          "img": "agentic-sam-call",
          "alt": "Sam on his desk phone, holding a card from the tower's after-hours contact list that reads agents and production access; the empty red table glows behind him.",
          "balloons": [
            {
              "at": 48,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Your card says\nyou secure agents.\nOurs just deleted\nsix years.",
              "tail": [
                0.4,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "ring"
            }
          ]
        },
        {
          "at": 55,
          "r": [
            0.58,
            0.64,
            0.42,
            0.36
          ],
          "img": "agentic-matt-phone",
          "alt": "Matt at his kitchen table at night, phone to his ear, laptop already open: swept-up greying hair, tortoiseshell glasses, black T-shirt.",
          "balloons": [
            {
              "at": 55.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "characterIntro": true,
              "text": "Matt. He helps\ncompanies build\nthese systems.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 57,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Disable the account.\nKeep the scans.\nI'm coming.",
              "tail": [
                0.6,
                0.45
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            }
          ]
        }
      ]
    },
    {
      "id": "rebuild",
      "b": 212,
      "l": 52,
      "title": "Four: set to pass.",
      "score": 0,
      "room": "office",
      "villains": [
        "amnesia"
      ],
      "phonePages": [
        [
          {
            "img": "agentic-codex-asked",
            "r": [
              0,
              0,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-codex-done",
            "r": [
              0,
              0.33,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-matt-arrives",
            "r": [
              0,
              0.66,
              1,
              0.34
            ]
          }
        ],
        [
          {
            "img": "agentic-rebuilt-forty",
            "r": [
              0,
              0,
              1,
              0.46
            ]
          },
          {
            "img": "agentic-sam-realizes",
            "r": [
              0,
              0.46,
              1,
              0.27
            ]
          },
          {
            "img": "agentic-joan-trailer",
            "r": [
              0,
              0.73,
              1,
              0.27
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.26,
            0.42
          ],
          "img": "agentic-codex-asked",
          "alt": "Sam at his desk faces Codex, a compact armoured AI projected in full colour beside the monitor, harsh white light running down his gauntlets.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 19.\nFriday, 3:05 a.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 3,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "characterIntro": true,
              "text": "Codex. An AI\nthat builds. Exactly\nwhat it's told.",
              "x": 0.02,
              "y": 0.18,
              "w": 0.42
            },
            {
              "at": 4.5,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Rebuild Monday's forty\nfrom the scans.\nFast.",
              "tail": [
                0.3,
                0.6
              ],
              "x": 0.06,
              "y": 0.33,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "keys"
            }
          ],
          "room": "office"
        },
        {
          "at": 17,
          "r": [
            0,
            0.42,
            0.26,
            0.58
          ],
          "img": "agentic-codex-done",
          "alt": "Codex's gauntlets flare white as forty records stack up on the screen in a blink, every one stamped passed.",
          "motion": {
            "preset": "push"
          },
          "balloons": [
            {
              "at": 17.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Done. Forty\nrecords. Forty\npassed.",
              "tail": [
                0.5,
                0.4
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "whoosh"
            }
          ]
        },
        {
          "at": 22,
          "r": [
            0.26,
            0,
            0.74,
            0.26
          ],
          "img": "agentic-matt-arrives",
          "alt": "Wide strip: the elevator doors open on the dark floor; Matt steps out in jeans and a black T-shirt, jacket over his arm.",
          "motion": {
            "preset": "drift-right"
          },
          "balloons": [],
          "sfx": [
            {
              "kind": "door"
            }
          ]
        },
        {
          "at": 23.5,
          "r": [
            0.26,
            0.26,
            0.5,
            0.74
          ],
          "img": "agentic-rebuilt-forty",
          "alt": "Matt and Sam lean over the monitor, faces lit by the rebuilt list: forty green rows, each marked passed, each signed J. Mikita; Codex waits beside them, still harsh white.",
          "balloons": [
            {
              "at": 24,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Checked against\nwhat?",
              "tail": [
                0.3,
                0.5
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 25.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "OCR fields only.\nUnsure fields\nset to pass.",
              "tail": [
                0.8,
                0.4
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            },
            {
              "at": 27,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Set to pass?",
              "tail": [
                0.45,
                0.6
              ],
              "em": "pass",
              "x": 0.06,
              "y": 0.23,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.5
            }
          ]
        },
        {
          "at": 36,
          "r": [
            0.76,
            0.26,
            0.24,
            0.34
          ],
          "img": "agentic-sam-realizes",
          "alt": "Close: Sam's face, the forty green rows reflected in his eyes.",
          "balloons": [
            {
              "at": 36.5,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Forty people\nclimbing on\na guess.",
              "tail": [
                0.5,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ]
        },
        {
          "at": 41.5,
          "r": [
            0.76,
            0.6,
            0.24,
            0.4
          ],
          "img": "agentic-joan-trailer",
          "alt": "Sam holds up a printed crew list with one name circled in pen: the assessor, J. Mikita, at the Etobicoke yard.",
          "balloons": [
            {
              "at": 42,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Joan assessed\nall forty. Only\nshe can say.",
              "tail": [
                0.4,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "paper"
            }
          ]
        }
      ]
    },
    {
      "id": "yard",
      "b": 264,
      "l": 68,
      "title": "Five: not her ink.",
      "score": 0,
      "room": "rain",
      "phonePages": [
        [
          {
            "img": "agentic-yard-arrive",
            "r": [
              0,
              0,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-joan",
            "r": [
              0,
              0.33,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-printout",
            "r": [
              0,
              0.66,
              1,
              0.34
            ]
          }
        ],
        [
          {
            "img": "agentic-signature",
            "r": [
              0,
              0,
              1,
              0.36
            ]
          },
          {
            "img": "agentic-claude-asks",
            "r": [
              0,
              0.36,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-rule",
            "r": [
              0,
              0.57,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-four-checks",
            "r": [
              0,
              0.78,
              1,
              0.22
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.42,
            0.3
          ],
          "img": "agentic-yard-arrive",
          "alt": "Wide: rain on Esposito's substation yard in Etobicoke, bucket trucks parked by a site trailer; Sam and Matt cross the yard, Sam's tablet under his jacket.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Esposito substation yard,\nEtobicoke. Saturday,\n7:00 a.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "room": "rain"
        },
        {
          "at": 7,
          "r": [
            0.42,
            0,
            0.26,
            0.3
          ],
          "img": "agentic-joan",
          "alt": "Joan Mikita opens the trailer door: worn hi-vis jacket over a fleece, a grey braid, reading glasses pushed up.",
          "balloons": [
            {
              "at": 7.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "characterIntro": true,
              "text": "Joan Mikita. Line\nsupervisor and assessor.\nThirty-one years\non the poles.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 9,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "A printout?\nAt seven?",
              "tail": [
                0.5,
                0.45
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "door"
            }
          ]
        },
        {
          "at": 18.5,
          "r": [
            0.68,
            0,
            0.32,
            0.3
          ],
          "img": "agentic-printout",
          "alt": "Inside the trailer, Sam lays the rebuilt list and its scanned forms on Joan's desk beside her own binder of paper assessments.",
          "balloons": [
            {
              "at": 19,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Monday's forty,\nrebuilt overnight.\nAll passed.",
              "tail": [
                0.3,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "paper"
            }
          ]
        },
        {
          "at": 24,
          "r": [
            0,
            0.3,
            1,
            0.42
          ],
          "img": "agentic-signature",
          "alt": "Wide band: Joan's finger on two scanned forms side by side. On one, the signature line is pre-printed type reading J. Mikita, with no ink; on the other, Sutter's form, the fail box is ticked hard in pen.",
          "balloons": [
            {
              "at": 24.5,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "That's not my\nsignature. It's\nprinted on.",
              "tail": [
                0.3,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 26,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "And Sutter failed\npole-top rescue.\nI was there.",
              "chain": true,
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "sting"
            }
          ]
        },
        {
          "at": 35.5,
          "r": [
            0,
            0.72,
            0.3,
            0.28
          ],
          "img": "agentic-claude-asks",
          "alt": "Claude projects from Sam's tablet on the desk, visor flat grey, facing Joan.",
          "balloons": [
            {
              "at": 36,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Then what lets\na lineworker climb?\nI need your rule.",
              "tail": [
                0.6,
                0.7
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ]
        },
        {
          "at": 42.5,
          "r": [
            0.3,
            0.72,
            0.42,
            0.28
          ],
          "img": "agentic-rule",
          "alt": "Joan taps the top form in her binder, one finger on each part in turn: her inked signature, the date, the worker's name, the ticked pass box.",
          "balloons": [
            {
              "at": 43,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "Only my form,\nsigned in my ink,\nthis season.",
              "tail": [
                0.3,
                0.6
              ],
              "em": "my ink",
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 44.5,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "For that worker,\nwith the pass\nbox ticked.",
              "chain": true,
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "paper",
              "gain": 0.4
            }
          ]
        },
        {
          "at": 55,
          "r": [
            0.72,
            0.72,
            0.28,
            0.28
          ],
          "img": "agentic-four-checks",
          "alt": "Matt leans on the trailer doorframe; Claude's visor holds on Joan's form.",
          "balloons": [
            {
              "at": 55.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Four checks.\nSignature, date,\nworker, pass box.",
              "tail": [
                0.7,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 57,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Keep it\nword for word.",
              "tail": [
                0.2,
                0.7
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ]
        }
      ]
    },
    {
      "id": "brain",
      "b": 332,
      "l": 72,
      "title": "Six: the first floor.",
      "score": 0.35,
      "room": "office",
      "phonePages": [
        [
          {
            "img": "agentic-repo",
            "r": [
              0,
              0,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-repo-tree",
            "r": [
              0,
              0.33,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-attach",
            "r": [
              0,
              0.66,
              1,
              0.34
            ]
          }
        ],
        [
          {
            "img": "agentic-skill-file",
            "r": [
              0,
              0,
              1,
              0.27
            ]
          },
          {
            "img": "agentic-codex-test",
            "r": [
              0,
              0.27,
              1,
              0.27
            ]
          },
          {
            "img": "agentic-tower",
            "r": [
              0,
              0.54,
              1,
              0.46
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.28,
            0.4
          ],
          "img": "agentic-repo",
          "alt": "Floor 19 in afternoon light: Matt opens a laptop on Sam's desk beside the scanner; Sam watches, arms folded.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 19.\nSaturday, 1:30 p.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 3,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Another chat?",
              "tail": [
                0.7,
                0.6
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            },
            {
              "at": 4.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "No. A repo.",
              "tail": [
                0.3,
                0.6
              ],
              "x": 0.52,
              "y": 0.23,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "keys"
            }
          ],
          "room": "office"
        },
        {
          "at": 11.5,
          "r": [
            0.28,
            0,
            0.2,
            0.4
          ],
          "img": "agentic-repo-tree",
          "alt": "Insert: the laptop screen shows Esposito's training repository and its six skill files: assessment procedure, Joan's rule, roster source, output format, tests and reviewer.",
          "balloons": [
            {
              "at": 12,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The training repo:\nprocedure, Joan's rule,\nroster, output format,\ntests, reviewer.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "click"
            }
          ]
        },
        {
          "at": 19,
          "r": [
            0.48,
            0,
            0.52,
            0.4
          ],
          "img": "agentic-attach",
          "alt": "Matt connects the repository; Claude and Codex, full-colour projections, step into a teal frame drawn around it, their grey and white turning teal.",
          "balloons": [
            {
              "at": 19.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Attach it.\nWork in here.",
              "tail": [
                0.2,
                0.7
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 21,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Attached. Six skills\nloaded. Roster\nconnected.",
              "tail": [
                0.7,
                0.5
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "whoosh"
            }
          ]
        },
        {
          "at": 28.5,
          "r": [
            0,
            0.4,
            0.22,
            0.28
          ],
          "img": "agentic-skill-file",
          "alt": "Claude, now teal, writes Joan's rule into the assessment procedure skill; four lines glow on the screen.",
          "balloons": [
            {
              "at": 29,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Joan's rule, written.\nFour checks per form,\nagainst its scan.",
              "tail": [
                0.6,
                0.7
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.5
            }
          ]
        },
        {
          "at": 35.5,
          "r": [
            0,
            0.68,
            0.22,
            0.32
          ],
          "img": "agentic-codex-test",
          "alt": "Codex runs a test on Sutter's scanned form; a held flag lights amber and drops into Sam's review queue.",
          "balloons": [
            {
              "at": 36,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Test: Sutter's form.\nFail box ticked.\nResult: held.",
              "tail": [
                0.7,
                0.5
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 37.5,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Held goes to me.\nNot to a guess.",
              "tail": [
                0.3,
                0.8
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "click"
            }
          ]
        },
        {
          "at": 47.5,
          "r": [
            0.22,
            0.4,
            0.78,
            0.6
          ],
          "img": "agentic-tower",
          "alt": "Through the floor-19 windows, beyond the real skyline, a city-scale teal lattice tower stands dark; its first floors light as Claude finishes the rule. Matt, Sam, Claude and Codex face it.",
          "balloons": [
            {
              "at": 48,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "characterIntro": true,
              "text": "The Second Brain.\nEsposito's kept\nknowledge: rules,\nsources, decisions.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 49.5,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Will it remember\nthis on Monday?",
              "tail": [
                0.3,
                0.7
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            },
            {
              "at": 51,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "It keeps what\nyou approve.",
              "tail": [
                0.7,
                0.6
              ],
              "x": 0.52,
              "y": 0.23,
              "w": 0.36
            },
            {
              "at": 52.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Joan's rule and\nSam's review route.\nTwo floors lit.",
              "x": 0.02,
              "y": 0.18,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "sting"
            }
          ]
        }
      ]
    },
    {
      "id": "keys",
      "b": 404,
      "l": 68,
      "title": "Seven: the keys.",
      "score": 0.2,
      "room": "office",
      "villains": [
        "amnesia"
      ],
      "phonePages": [
        [
          {
            "img": "agentic-console",
            "r": [
              0,
              0,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-role",
            "r": [
              0,
              0.21,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-delete-removed",
            "r": [
              0,
              0.42,
              1,
              0.36
            ]
          },
          {
            "img": "agentic-test-identity",
            "r": [
              0,
              0.78,
              1,
              0.22
            ]
          }
        ],
        [
          {
            "img": "agentic-owner-field",
            "r": [
              0,
              0,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-closed-request",
            "r": [
              0,
              0.25,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-floor-three",
            "r": [
              0,
              0.5,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-replay-plan",
            "r": [
              0,
              0.75,
              1,
              0.25
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.24,
            0.44
          ],
          "img": "agentic-console",
          "alt": "Matt at the training system's admin console, Sam beside him, the disabled cleanup account greyed out on screen.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 19.\nSaturday, 4:10 p.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 3,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "The account's off.\nAre we safe?",
              "tail": [
                0.7,
                0.6
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "keys"
            }
          ],
          "room": "office"
        },
        {
          "at": 10.5,
          "r": [
            0,
            0.44,
            0.24,
            0.56
          ],
          "img": "agentic-role",
          "alt": "Close on the screen: the disabled account's role still lists delete on the training records, and two other accounts share that role.",
          "balloons": [
            {
              "at": 11,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "The account's off.\nThe role isn't.",
              "tail": [
                0.3,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "heartbeat"
            }
          ]
        },
        {
          "at": 16,
          "r": [
            0.24,
            0,
            0.5,
            0.76
          ],
          "img": "agentic-delete-removed",
          "alt": "Matt edits the role on the console: delete struck out in red, the write right redrawn as one teal route through the update procedure, ending at a box marked Sam's sign-off. Codex stands teal beside the screen.",
          "balloons": [
            {
              "at": 16.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Delete removed\nfrom the role.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 18,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Writes go only\nthrough the update\nprocedure.",
              "tail": [
                0.75,
                0.5
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            },
            {
              "at": 19.5,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Nothing writes\nwithout my sign-off.",
              "tail": [
                0.3,
                0.7
              ],
              "x": 0.52,
              "y": 0.23,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "click"
            }
          ]
        },
        {
          "at": 30,
          "r": [
            0.74,
            0,
            0.26,
            0.3
          ],
          "img": "agentic-test-identity",
          "alt": "Insert: a new account card, climb-check test, with three lines: reads scans, writes to a copy, delete none.",
          "balloons": [
            {
              "at": 30.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Test identity.\nReads scans. Writes\nto a copy.",
              "tail": [
                0.6,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "keys",
              "gain": 0.5
            }
          ]
        },
        {
          "at": 36.5,
          "r": [
            0.74,
            0.3,
            0.26,
            0.24
          ],
          "img": "agentic-owner-field",
          "alt": "Sam types into the agent record's empty owner and reason fields.",
          "balloons": [
            {
              "at": 37,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Owner: Sam Howe.\nReason: Monday's\nclimb check.",
              "tail": [
                0.4,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ]
        },
        {
          "at": 42.5,
          "r": [
            0.74,
            0.54,
            0.26,
            0.22
          ],
          "img": "agentic-closed-request",
          "alt": "Sam pins a printout of the filled record above his desk, next to the safety posters.",
          "balloons": [
            {
              "at": 43,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Next time somebody\nasks why, it's\nwritten down.",
              "tail": [
                0.4,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "paper"
            }
          ]
        },
        {
          "at": 49,
          "r": [
            0.24,
            0.76,
            0.3,
            0.24
          ],
          "img": "agentic-floor-three",
          "alt": "Through the window, a third floor of the teal tower lights.",
          "balloons": [
            {
              "at": 49.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Keys and owner,\nwritten down.\nThird floor lit.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "sting",
              "gain": 0.5
            }
          ]
        },
        {
          "at": 55.5,
          "r": [
            0.54,
            0.76,
            0.46,
            0.24
          ],
          "img": "agentic-replay-plan",
          "alt": "Sam taps the scheduler on the screen, Friday's cleanup job selected, Matt beside him.",
          "balloons": [
            {
              "at": 56,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Tonight we replay\nFriday's job.\nOn a copy.",
              "tail": [
                0.3,
                0.7
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 57.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Same minute.",
              "tail": [
                0.7,
                0.7
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ]
        }
      ]
    },
    {
      "id": "replay",
      "b": 472,
      "l": 56,
      "title": "Eight: same minute.",
      "score": 0.3,
      "room": "servers",
      "villains": [
        "rogue"
      ],
      "phonePages": [
        [
          {
            "img": "agentic-b2",
            "r": [
              0,
              0,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-clock",
            "r": [
              0,
              0.33,
              1,
              0.33
            ]
          },
          {
            "img": "agentic-job-line",
            "r": [
              0,
              0.66,
              1,
              0.34
            ]
          }
        ],
        [
          {
            "img": "agentic-reach",
            "r": [
              0,
              0,
              1,
              0.36
            ]
          },
          {
            "img": "agentic-denied",
            "r": [
              0,
              0.36,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-sam-asks",
            "r": [
              0,
              0.57,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-ember",
            "r": [
              0,
              0.78,
              1,
              0.22
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.38,
            0.3
          ],
          "img": "agentic-b2",
          "alt": "Wide: the server room in basement two of the Keon Tower, racks humming; Sam, Matt and Codex at a console walled off from the live system.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Keon Tower, basement two,\nthe server room.\nSunday, 2:05 a.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 3,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Friday's job.\nTest identity.\nTest copy.",
              "tail": [
                0.4,
                0.7
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "door"
            }
          ],
          "room": "servers"
        },
        {
          "at": 13,
          "r": [
            0.38,
            0,
            0.24,
            0.3
          ],
          "img": "agentic-clock",
          "alt": "Close: the console clock turns to 2:07 a.m.",
          "balloons": [
            {
              "at": 13.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "2:07 a.m. Friday's\ncleanup job,\nreplayed.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "alarm"
            }
          ]
        },
        {
          "at": 18.5,
          "r": [
            0.62,
            0,
            0.38,
            0.3
          ],
          "img": "agentic-job-line",
          "alt": "Insert: the job line on screen, running as the climb-check test identity, its target the copy.",
          "balloons": [
            {
              "at": 19,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Running as:\nclimb-check test.\nTarget: copy.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "keys"
            }
          ]
        },
        {
          "at": 24,
          "r": [
            0,
            0.3,
            0.62,
            0.7
          ],
          "img": "agentic-reach",
          "alt": "The red-black agent rises out of the replayed job on the copy's screen and lunges at rows of records sharing a name; its hand slams into a teal wall drawn by the test identity's limits. Codex, teal, stands at the wall.",
          "balloons": [
            {
              "at": 24.5,
              "kind": "speech",
              "state": "menace",
              "who": "rogue",
              "text": "Same name twice.\nRemoving both.",
              "tail": [
                0.55,
                0.35
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 26,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Refused. This\nidentity cannot\ndelete.",
              "tail": [
                0.8,
                0.5
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "impact"
            }
          ]
        },
        {
          "at": 33,
          "r": [
            0.62,
            0.3,
            0.38,
            0.24
          ],
          "img": "agentic-denied",
          "alt": "Insert: the console log in red and teal: delete denied, no permission, the copy's rows intact.",
          "balloons": [
            {
              "at": 33.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Delete: denied.\nNo permission.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "buzz"
            }
          ]
        },
        {
          "at": 37.5,
          "r": [
            0.62,
            0.54,
            0.38,
            0.22
          ],
          "img": "agentic-sam-asks",
          "alt": "Sam, close, looks from the copy to the live system's dark status panel.",
          "balloons": [
            {
              "at": 38,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "And live?",
              "tail": [
                0.3,
                0.7
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 39.5,
              "kind": "speech",
              "state": "offpanel",
              "who": "codex",
              "text": "Live records\nuntouched. Nothing\nran there.",
              "tail": [
                1,
                0.5
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ]
        },
        {
          "at": 45.5,
          "r": [
            0.62,
            0.76,
            0.38,
            0.24
          ],
          "img": "agentic-ember",
          "alt": "The red agent shrinks to a red ember on the copy's screen while a fourth floor of the teal tower lights in the monitor's reflection.",
          "balloons": [
            {
              "at": 46,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "The refusal, logged.\nFourth floor lit.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "whoosh",
              "gain": 0.3
            }
          ]
        }
      ]
    },
    {
      "id": "count",
      "b": 528,
      "l": 64,
      "title": "Nine: twenty-nine.",
      "score": 0.25,
      "room": "office",
      "phonePages": [
        [
          {
            "img": "agentic-qc-wall",
            "r": [
              0,
              0,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-qc-form",
            "r": [
              0,
              0.25,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-qc-printed",
            "r": [
              0,
              0.5,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-qc-sutter",
            "r": [
              0,
              0.75,
              1,
              0.25
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
              0.36
            ]
          },
          {
            "img": "agentic-sign-off",
            "r": [
              0,
              0.36,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-write",
            "r": [
              0,
              0.57,
              1,
              0.21
            ]
          },
          {
            "img": "agentic-floors-lit",
            "r": [
              0,
              0.78,
              1,
              0.22
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.58,
            0.26
          ],
          "img": "agentic-qc-wall",
          "alt": "Wide: floor 19 late on Sunday. Claude and Codex, teal, at a wall of screens, each scanned form beside its extracted fields; Sam, Joan and Matt watch.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Floor 19.\nSunday, 10:40 p.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 3,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Forty forms read.\nEach checked against\nits own scan.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "keys"
            }
          ],
          "room": "office"
        },
        {
          "at": 12,
          "r": [
            0.58,
            0,
            0.42,
            0.26
          ],
          "img": "agentic-qc-form",
          "alt": "Insert: one scanned form beside its extracted fields, four teal ticks down the side: Joan's inked signature, this season's date, a roster match, the ticked pass box.",
          "balloons": [
            {
              "at": 12.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Signature: Joan, ink.\nDate: this season.\nWorker: on roster.\nPass: ticked.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "click"
            }
          ]
        },
        {
          "at": 19.5,
          "r": [
            0,
            0.26,
            0.22,
            0.33
          ],
          "img": "agentic-qc-printed",
          "alt": "Close: the form with the pre-printed signature line, flagged amber, sliding into Sam's review queue.",
          "balloons": [
            {
              "at": 20,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Signature printed,\nnot inked.\nRouted to Sam.",
              "tail": [
                0.6,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "buzz",
              "gain": 0.4
            }
          ]
        },
        {
          "at": 25.5,
          "r": [
            0,
            0.59,
            0.22,
            0.41
          ],
          "img": "agentic-qc-sutter",
          "alt": "Close: Sutter's form, fail box ticked, the rebuilt pass struck through and flagged amber.",
          "balloons": [
            {
              "at": 26,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Sutter: fail box\nticked. Held.",
              "tail": [
                0.6,
                0.8
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ]
        },
        {
          "at": 30.5,
          "r": [
            0.22,
            0.26,
            0.56,
            0.74
          ],
          "img": "agentic-crew-board",
          "alt": "The crew board on the big screen: twenty-nine rows green, eleven amber, each amber row naming the check it failed. Joan, reading glasses down, runs a finger down the green rows against her binder.",
          "balloons": [
            {
              "at": 31,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Twenty-nine pass\nall four checks.\nEleven held.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            },
            {
              "at": 32.5,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "Mine. And that\none. And that.",
              "tail": [
                0.3,
                0.7
              ],
              "x": 0.06,
              "y": 0.18,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "paper"
            }
          ]
        },
        {
          "at": 41,
          "r": [
            0.78,
            0.26,
            0.22,
            0.3
          ],
          "img": "agentic-sign-off",
          "alt": "Codex holds out the batch for approval; Sam's hand over the sign-off button.",
          "balloons": [
            {
              "at": 41.5,
              "kind": "speech",
              "state": "calm",
              "who": "codex",
              "text": "Twenty-nine ready.\nNeeds your\nsign-off.",
              "tail": [
                0.7,
                0.5
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 43,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Signed. Write them.",
              "tail": [
                0.3,
                0.8
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ]
        },
        {
          "at": 49,
          "r": [
            0.78,
            0.56,
            0.22,
            0.2
          ],
          "img": "agentic-write",
          "alt": "Insert: the update procedure log: twenty-nine records written to the training system, eleven held for review.",
          "balloons": [
            {
              "at": 49.5,
              "kind": "speech",
              "state": "device",
              "who": "narrator",
              "text": "Written: 29.\nHeld for review: 11.",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "click"
            }
          ]
        },
        {
          "at": 54.5,
          "r": [
            0.78,
            0.76,
            0.22,
            0.24
          ],
          "img": "agentic-floors-lit",
          "alt": "Through the window, the teal tower's floors light one after another.",
          "balloons": [
            {
              "at": 55,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Every checked record,\nkept. The tower\nfills.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "sting"
            }
          ]
        }
      ]
    },
    {
      "id": "monday",
      "b": 592,
      "l": 52,
      "title": "Ten: 6:00 a.m.",
      "score": 0.6,
      "room": "street",
      "phonePages": [
        [
          {
            "img": "agentic-dawn-yard",
            "r": [
              0,
              0,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-sam-signs",
            "r": [
              0,
              0.25,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-matt-asks",
            "r": [
              0,
              0.5,
              1,
              0.25
            ]
          },
          {
            "img": "agentic-reassess",
            "r": [
              0,
              0.75,
              1,
              0.25
            ]
          }
        ],
        [
          {
            "img": "agentic-empty-bays",
            "r": [
              0,
              0,
              1,
              0.27
            ]
          },
          {
            "img": "agentic-next-batch",
            "r": [
              0,
              0.27,
              1,
              0.27
            ]
          },
          {
            "img": "agentic-trucks-roll",
            "r": [
              0,
              0.54,
              1,
              0.46
            ]
          }
        ]
      ],
      "panels": [
        {
          "at": 1,
          "r": [
            0,
            0,
            0.48,
            0.32
          ],
          "img": "agentic-dawn-yard",
          "alt": "Wide: dawn over the Etobicoke yard, bucket trucks idling, crews in hi-vis gathering by the trailer.",
          "balloons": [
            {
              "at": 1.5,
              "kind": "place",
              "state": "narration",
              "who": "narrator",
              "text": "Etobicoke yard.\nMonday, 5:40 a.m.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "transit"
            }
          ],
          "room": "street"
        },
        {
          "at": 6,
          "r": [
            0.48,
            0,
            0.24,
            0.32
          ],
          "img": "agentic-sam-signs",
          "alt": "Sam signs the release sheet on a clipboard on the hood of a truck.",
          "balloons": [
            {
              "at": 6.5,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Twenty-nine verified.\nI sign as\nthe owner.",
              "tail": [
                0.4,
                0.7
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "paper"
            }
          ]
        },
        {
          "at": 12,
          "r": [
            0.72,
            0,
            0.28,
            0.32
          ],
          "img": "agentic-matt-asks",
          "alt": "Matt beside Sam, hands in his jacket pockets.",
          "balloons": [
            {
              "at": 12.5,
              "kind": "speech",
              "state": "calm",
              "who": "matt",
              "text": "Who checks it\nnext week?",
              "tail": [
                0.6,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            },
            {
              "at": 14,
              "kind": "speech",
              "state": "calm",
              "who": "sam",
              "text": "Me. Every batch,\nevery key.",
              "tail": [
                0.2,
                0.7
              ],
              "x": 0.52,
              "y": 0.08,
              "w": 0.36
            }
          ]
        },
        {
          "at": 21,
          "r": [
            0,
            0.32,
            0.28,
            0.36
          ],
          "img": "agentic-reassess",
          "alt": "Joan at the base of a training pole with Sutter, harness on, about to climb.",
          "balloons": [
            {
              "at": 21.5,
              "kind": "speech",
              "state": "calm",
              "who": "joan",
              "text": "Pole-top rescue.\nFrom the top.\nI'm watching.",
              "tail": [
                0.3,
                0.6
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ],
          "sfx": [
            {
              "kind": "click"
            }
          ]
        },
        {
          "at": 27,
          "r": [
            0,
            0.68,
            0.28,
            0.32
          ],
          "img": "agentic-empty-bays",
          "alt": "Two empty bays at the end of the line of trucks.",
          "balloons": [
            {
              "at": 27.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "Eleven stayed down.\nTwo trucks never\nleft the yard.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ]
        },
        {
          "at": 34,
          "r": [
            0.28,
            0.32,
            0.16,
            0.68
          ],
          "img": "agentic-next-batch",
          "alt": "Tall narrow box: Sam's tablet on the trailer step, Claude teal on its screen, the next scan batch queued.",
          "balloons": [
            {
              "at": 34.5,
              "kind": "speech",
              "state": "calm",
              "who": "claude",
              "text": "Next scan batch\nqueued. Same four\nchecks.",
              "tail": [
                0.5,
                0.7
              ],
              "x": 0.06,
              "y": 0.03,
              "w": 0.36
            }
          ]
        },
        {
          "at": 40,
          "r": [
            0.44,
            0.32,
            0.56,
            0.68
          ],
          "img": "agentic-trucks-roll",
          "alt": "Bucket trucks roll out of the yard into the sunrise, lineworkers in the cabs; Sam watches with the signed sheet; the teal tower glows faint over the distant city.",
          "balloons": [
            {
              "at": 40.5,
              "kind": "caption",
              "state": "narration",
              "who": "narrator",
              "text": "6:00 a.m. Twenty-nine\nclimbed. Each one\nchecked and signed.",
              "x": 0.02,
              "y": 0.03,
              "w": 0.42
            }
          ],
          "sfx": [
            {
              "kind": "transit"
            }
          ]
        }
      ]
    }
  ],
  "next": {
    "sound": {
      "score": 0,
      "room": "none",
      "fadeBeats": 1.5
    },
    "b": 644,
    "heading": "Nine floors up, the following month.",
    "choices": [
      {
        "label": "Floor 28. The assistant can open every file in the firm.",
        "href": "/traditional-systems-b/",
        "img": "agentic-next-dana-access"
      },
      {
        "label": "Winter. A system older than the web, and nobody who remembers.",
        "href": "/data-migrations-b/",
        "img": "agentic-next-dana"
      },
      {
        "label": "Write down the rule that proves a record before an agent checks it.",
        "href": "/agentic-systems/second-brain/",
        "img": "agentic-brain-esposito"
      },
      {
        "label": "Give every agent one procedure, limited keys and a named owner.",
        "href": "/agentic-systems/agentic-devops-scaling/",
        "img": "agentic-codex-tests"
      }
    ]
  }
});
