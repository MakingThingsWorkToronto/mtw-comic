// Placeholder Comic Story: a three-scene test of the engine (camera, balloons, fx, layers, holds, NEXT page) using four
// tiny hand-drawn SVGs in public/comic/placeholder/, until the real stories (home, agentic, traditional, data-migrations) land. Not published copy.
import type { ComicStory } from './types';


export const placeholderStory: ComicStory = {
  id: 'placeholder',
  issue: 0,
  title: 'Engine test.',
  bpm: 100,
  beats: 192,
  music: { src: '/audio/aphelion-zambolino.mp3', offset: 0.565, credit: 'Music: Aphelion by Zambolino', source: 'https://freetouse.com/music/zambolino/aphelion' },
  scenes: [
    {
      id: 'one', b: 0, l: 16, title: 'Chapter one: the quote.', villains: ['snowball'], hold: [[8, 10]],
      panels: [
        { at: 1.5, r: [0, 0, 0.62, 0.55], img: 'office', alt: 'An office at night.', fx: ['rain'], drift: [0.02, 0, 0.04], balloons: [
          { at: 2, kind: 'place', who: 'narrator', text: '11:04 p.m. King Street West.', x: 0.03, y: 0.05, w: 0.4 },
          { at: 4, kind: 'caption', who: 'narrator', text: 'The quote went out at eleven.', x: 0.55, y: 0.72, w: 0.4 },
        ] },
        { at: 6, r: [0.62, 0, 0.38, 0.55], img: 'brain', alt: 'A sales rep at a desk.', fx: ['flicker'], focus: [0.5, 0.45, 1.1], balloons: [
          { at: 6.5, kind: 'speech', who: 'marco', text: 'The AI priced it. It looked right.', x: 0.08, y: 0.08, w: 0.55, tail: [0.45, 0.62], em: 'looked' },
        ] },
        { at: 10.5, r: [0, 0.55, 1, 0.45], img: 'office', alt: 'A long view of the floor.', fx: ['breathe'], balloons: [
          { at: 11, kind: 'machine', who: 'codex', text: 'Done. You said all customers.', x: 0.6, y: 0.12, w: 0.3, tail: [0.5, 0.7], steered: false, em: 'all' },
          { at: 13, kind: 'thought', who: 'marco', text: 'Fifty thousand below cost.', x: 0.08, y: 0.1, w: 0.3, tail: [0.25, 0.75] },
        ] },
      ],
    },
    {
      id: 'two', b: 16, l: 16, title: 'Chapter two: the mentor.',
      panels: [
        { at: 1.5, r: [0, 0, 0.4, 1], img: 'mentor', alt: 'Matt in a black T-shirt.', focus: [0.5, 0.35, 1], balloons: [
          { at: 2.5, kind: 'speech', who: 'matt', text: 'Ask them first.', x: 0.1, y: 0.06, w: 0.6, tail: [0.5, 0.3] },
        ] },
        { at: 6, r: [0.4, 0, 0.6, 0.5], img: 'brain', alt: 'The heroes listen.', fx: ['brain'], balloons: [
          { at: 7, kind: 'machine', who: 'claude', text: 'I can write this. Who decides whether it is true?', x: 0.05, y: 0.08, w: 0.42, tail: [0.3, 0.7], steered: true },
        ] },
        { at: 11, r: [0.4, 0.5, 0.6, 0.5], img: 'brain', alt: 'The second brain lights up.', fx: ['brain', 'breathe'], balloons: [
          { at: 11.5, kind: 'speech', who: 'dana', text: 'Nothing leaves this floor unchecked.', x: 0.5, y: 0.1, w: 0.42, tail: [0.3, 0.8], em: 'unchecked' },
          { at: 13.5, kind: 'whisper', who: 'ruth', text: 'Confirm it with the applicant.', x: 0.06, y: 0.62, w: 0.4, tail: [0.2, 0.95] },
        ] },
      ],
    },
    {
      id: 'three', b: 32, l: 16, title: 'Chapter three: the cost.', hold: [[12, 14]],
      panels: [
        { at: 1.5, r: [0, 0, 0.5, 1], img: 'dawn', alt: 'An empty desk at dawn.', fx: ['grey'], balloons: [
          { at: 2.5, kind: 'caption', who: 'narrator', text: 'Some losses stay on the page.', x: 0.06, y: 0.06, w: 0.6 },
        ] },
        { at: 7, r: [0.5, 0, 0.5, 1], img: 'office', alt: 'The team at work.', fx: ['rain', 'flicker'], balloons: [
          { at: 8, kind: 'speech', who: 'sam', text: 'Signed record or it did not happen.', x: 0.08, y: 0.08, w: 0.5, tail: [0.4, 0.6] },
        ] },
      ],
    },
  ],
  next: { b: 48, heading: 'The villains are still out there. Pick one.', choices: [
    { label: 'The Shadow gets into the files.', href: '/traditional-systems-b/', img: 'brain', villain: 'shadow' },
    { label: 'The Rogue Agent learns to build.', href: '/agentic-systems-b/', img: 'office', villain: 'rogue' },
    { label: 'The Amnesia eats the archive.', href: '/data-migrations-b/', img: 'office', villain: 'amnesia' },
  ] },
  collapseTo: '.home-intro',
};
