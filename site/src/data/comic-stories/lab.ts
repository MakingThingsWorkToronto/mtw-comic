// The Comic B style lab's specimen story (src/pages/comics/style-lab.astro; skill: mtw-comic-story, checks.md). Not an
// issue: nine boxes over the X-Men #137 calibration art, showing one example of every balloon kind and voice in the
// measured usage table (.claude/skills/mtw-comic-story/assets/reference-balloons/report.md) with copy in Issue #1's voice, shown still (every
// box and balloon in place) so the style can be judged against the reference crops. The engine composes the lines of
// any balloon written without "\n".
import type { ComicStory } from './types';

const CAL = '/comic/_lab/calibration-xmen137.svg';

export const labStory: ComicStory = {
  id: '_lab',
  issue: 0,
  title: 'Style lab.',
  bpm: 90,
  beats: 32,
  music: { src: '/audio/moire-epic-win.mp3', offset: 0.165, credit: 'Music: Epic Win by Moire', source: '' },
  scenes: [
    {
      id: 'lab', b: 0, l: 24,
      panels: [
        { at: 1, r: [0, 0, 0.42, 0.36], img: CAL, alt: 'Calibration art: a place caption, a narrative caption, speech and a chain.',
          balloons: [
            { at: 1, kind: 'place', who: 'narrator', state: 'narration', text: '11:04 p.m. King Street West.', x: 0, y: 0 },
            { at: 1.5, kind: 'caption', who: 'narrator', state: 'narration', text: 'Everyone has chat now. Nobody checks it.', em: 'Nobody checks it.', x: 0, y: 0, w: 0.46 },
            { at: 2, kind: 'speech', who: 'dana', state: 'calm', text: "This case doesn't exist.", em: "doesn't exist", x: 0.56, y: 0.08, tail: [0.62, 0.95] },
            { at: 3.5, kind: 'speech', who: 'dana', state: 'calm', text: 'Neither does this one.', x: 0.72, y: 0.5, chain: true },
          ] },
        { at: 2, r: [0.42, 0, 0.33, 0.36], img: CAL, alt: 'Calibration art: a speech balloon butted against the top border, and a thought: the yellow balloon with its bead stem.',
          balloons: [
            { at: 2, kind: 'speech', who: 'ruth', state: 'calm', text: 'Forty summaries.\nNone of them read\nthe application.', x: 0.3, y: 0, edge: 'top', tail: [0.25, 0.8] },
            { at: 3, kind: 'thought', who: 'marco', state: 'thought', text: 'Gilmour & Clark wanted it tonight.', x: 0.04, y: 0.6, tail: [0.2, 0.98] },
          ] },
        { at: 3, r: [0.75, 0, 0.25, 0.36], img: CAL, alt: 'Calibration art: a spooked voice in a scalloped balloon.',
          balloons: [
            { at: 3, kind: 'fear', who: 'sam', state: 'fear', text: 'The training records are gone.', x: 0.12, y: 0.12, tail: [0.3, 0.95] },
          ] },
        { at: 4, r: [0, 0.36, 0.27, 0.32], img: CAL, alt: 'Calibration art: a shout burst and a weak voice with a zigzag tail.',
          balloons: [
            { at: 4, kind: 'burst', who: 'marco', state: 'shout', text: 'Wait!', x: 0.08, y: 0.1, tail: [0.35, 0.8] },
            { at: 4.5, kind: 'speech', who: 'dana', state: 'weak', text: 'No...', x: 0.6, y: 0.45, tail: [0.85, 0.98] },
          ] },
        { at: 5, r: [0.27, 0.36, 0.4, 0.32], img: CAL, alt: 'Calibration art: a breakout balloon and ordinary speech from Codex.',
          balloons: [
            { at: 5, kind: 'speech', who: 'matt', state: 'calm', text: 'Stop.\nAsk them\nfirst.', em: 'Ask them', x: 0.72, y: -0.14, tail: [0.8, 0.7], breakout: true },
            { at: 6, kind: 'speech', who: 'codex', state: 'calm', text: 'Done. You said all customers.', em: 'all', x: 0.1, y: 0.4, tail: [0.3, 0.98] },
          ] },
        { at: 6, r: [0.67, 0.36, 0.33, 0.32], img: CAL, alt: 'Calibration art: a line continued across the gutter, and a chat voice with its tail to the screen.',
          balloons: [
            { at: 6.5, kind: 'speech', who: 'codex', state: 'calm', text: 'Every one of them.', x: 0.06, y: 0.1, across: true },
            { at: 7, kind: 'speech', who: 'narrator', state: 'device', text: 'Looks good to me!', x: 0.52, y: 0.42, tail: [0.78, 0.97] },
          ] },
        { at: 7, r: [0, 0.68, 0.36, 0.32], img: CAL, alt: 'Calibration art: an off-panel voice with a long thin tail, and a menacing line with a red wavy outline.',
          balloons: [
            { at: 7, kind: 'speech', who: 'ruth', state: 'offpanel', text: 'Who signed this?', x: 0.2, y: 0.12, tail: [0, 0.3] },
            { at: 8, kind: 'speech', who: 'amnesia', state: 'menace', text: 'Start again tomorrow. You always do.', x: 0.5, y: 0.34, tail: [0.8, 0.98] },
          ] },
        { at: 8, r: [0.36, 0.68, 0.3, 0.32], img: CAL, alt: 'Calibration art: a thought (yellow, bead stem), and a scream in red.',
          balloons: [
            { at: 8, kind: 'thought', who: 'marco', state: 'thought', text: 'Which rate card?', x: 0.08, y: 0.12, tail: [0.35, 0.9] },
            { at: 9, kind: 'burst', who: 'dana', state: 'scream', text: 'Marco!', x: 0.58, y: 0.3, tail: [0.8, 0.95] },
          ] },
        { at: 9, r: [0.66, 0.68, 0.34, 0.32], img: CAL, alt: 'Calibration art: panic in angular bursts, and a caption butted against the bottom border.',
          balloons: [
            { at: 9, kind: 'burst', who: 'sam', state: 'panic', text: 'Help! Help me!', x: 0.1, y: 0.08, tail: [0.4, 0.75] },
            { at: 10, kind: 'caption', who: 'narrator', state: 'narration', text: 'By Monday, other people were building on it.', x: 0.4, y: 0.8, w: 0.6, edge: 'bottom' },
          ] },
      ],
    },
  ],
  next: { b: 24, heading: 'Style lab.', choices: [{ label: 'Back to the issues.', href: '/comics/', img: CAL }] },
};
