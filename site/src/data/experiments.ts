export const experiments = [
  {
    slug: 'comics', preview: '/images/experiments/comics-20261027-v1.jpg', title: 'Comics',
    description: 'Illustrated stories about people, AI and the systems they work with. Read an issue, move through its panels and hear the characters.',
    href: 'https://comics.makingthings.work/',
    source: 'https://github.com/MakingThingsWorkToronto/mtw-comic',
    action: 'Read the comics', format: 'Illustrated stories',
  },
  {
    slug: '8bit', preview: '/images/experiments/8bit-20261027-v2.jpg', title: '8 Bit Music Video',
    description: 'A playlist of pixel animations cut to music. Pick a track, play it and follow the mixtape from one visualization to the next.',
    href: 'https://8bit.makingthings.work/',
    source: 'https://github.com/MakingThingsWorkToronto/mtw-8bit-pump-up',
    action: 'Play the mixtape', format: 'Music and motion',
  },
  {
    slug: 'ai-orbit-model', preview: '/images/experiments/ai-orbit-model-20261027-v2.jpg', title: 'AI Orbit Model',
    description: 'Explore an orbital model of enterprise knowledge, people and AI agents. Move around the scene and inspect its connections.',
    href: 'https://ai2026orbit.makingthings.work/',
    source: 'https://github.com/MakingThingsWorkToronto/mtw-ai2026orbit',
    action: 'Explore the orbit model', format: 'Interactive 3D',
  },
  {
    slug: 'second-brain-3d', preview: '/images/experiments/second-brain-3d-20261027-v1.jpg', title: 'Second Brain 3d',
    description: 'Explore a low-poly brain in an interactive 3D scene. The project includes the Blender script that builds the model.',
    href: 'https://secondbrain3d.makingthings.work/',
    source: 'https://github.com/MakingThingsWorkToronto/mtw-secondbrain3d',
    action: 'Explore the second brain', format: 'Interactive 3D',
  },
  {
    slug: 'visual-brainstorm', preview: '/images/experiments/visual-brainstorm-20261027-v1.jpg', title: 'Visual Brainstorm Studio',
    description: 'Visual Brainstorm connects MCP to Claude Code for SVG brainstorming. Choose, annotate and remix visual options in a local browser studio.',
    href: 'https://github.com/MakingThingsWorkToronto/visual-brainstorm',
    source: 'https://github.com/MakingThingsWorkToronto/visual-brainstorm',
    action: 'Explore Visual Brainstorm on GitHub', format: 'The original · MCP and Claude Code',
  },
] as const;
