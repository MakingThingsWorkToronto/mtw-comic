import type { ComicStory, Rect } from './types';
import { applyHomeProjection, type HomeProjectionRepair } from './home-projection';

// Exact selected v3 atlas authority; dedicated panel images keep their own repair.
const atlases = {
  "wiki/image-library/assets/scenes/comic-b/home-regeneration-20261011/codex/v3/master-v3.png": {
    "originalUrl": "/comic/home/home-regeneration-20261011/codex/v3/master-v3",
    "panelIds": [
      "home-matt-stops",
      "home-codex-literal",
      "home-matt-close",
      "home-matt-points"
    ],
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/codex-atlas/v1/cleanplate-native.png",
      "sha256": "b019379e6e68636028f7eff0196a0feff8348d0d4a391d0f88e3ef167d3f7557",
      "recordId": "comic-b-home-projection-cleanplate-20261013-codex-atlas",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/codex-atlas/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/codex-atlas/v2/agent-silhouette-v2.png",
        "sha256": "80e06d2b3d9fc0600b600faeee71b951a93e4757ab52b87321c618210e545ceb",
        "recordId": "comic-b-home-projection-actor-20261013-codex-atlas",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/codex-atlas/v2/agent-silhouette-v2.png"
      }
    ]
  },
  "wiki/image-library/assets/scenes/comic-b/home-regeneration-20261011/answers/v3/master-v3.png": {
    "originalUrl": "/comic/home/home-regeneration-20261011/answers/v3/master-v3",
    "panelIds": [
      "home-marco-answers-rate"
    ],
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/answers-atlas/v1/cleanplate-native.png",
      "sha256": "57c43232d2992567ed3aa8b3c3cf44050ecbde0c800b7a82237045c87844eaea",
      "recordId": "comic-b-home-projection-cleanplate-20261013-answers-atlas",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/answers-atlas/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/answers-atlas/v2/agent-silhouette-v2.png",
        "sha256": "dcd898d0defc6bbf6990775f0fd9fc6c8e7bb4772fed93ce2c003f37dbed5d74",
        "recordId": "comic-b-home-projection-actor-20261013-answers-atlas",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/answers-atlas/v2/agent-silhouette-v2.png"
      }
    ]
  }
};

export function buildHomeAtlasProjectionRepairs(story: ComicStory): Record<string, HomeProjectionRepair> {
  const selected: Record<string, HomeProjectionRepair> = {};
  for (const scene of story.scenes) for (const panel of scene.panels) {
    const prior = panel.views?.find(view => view.at === 0) ?? panel.staticArt;
    for (const [originalPath, atlas] of Object.entries(atlases)) {
      if (!atlas.panelIds.includes(panel.img ?? '')) continue;
      // An explicit newer/dedicated source always wins over the scene atlas.
      if (prior && prior.canonicalSource?.path !== originalPath) continue;
      if (!prior && scene.art !== atlas.originalUrl) continue;
      selected[panel.img!] = {
        base: atlas.base, agents: atlas.agents,
        ar: (prior?.ar ?? panel.ar ?? panel.r) as Rect,
        speakers: prior?.speakers ?? panel.speakers,
      };
    }
  }
  return selected;
}

export function applyHomeAtlasProjection(story: ComicStory): ComicStory {
  return applyHomeProjection(story, buildHomeAtlasProjectionRepairs(story));
}
