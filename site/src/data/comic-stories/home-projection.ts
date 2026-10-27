import type { ComicStory, ComicArtAuthority, ComicSpeakerAnchors, Rect } from './types';

// Exact native sources. Root activates this module only after maintained intake
// succeeds and byte-identical PNG copies exist at these integration URLs.
export interface HomeProjectionAsset {
  path: string; sha256: string; recordId: string; treatment: string; src: string;
}
export interface HomeProjectionRepair {
  base: HomeProjectionAsset;
  agents: HomeProjectionAsset[];
  props?: HomeProjectionAsset[];
  /** A later atlas repair may explicitly preserve its reviewed source crop. */
  ar?: Rect;
  speakers?: ComicSpeakerAnchors;
}
const repairs: Record<string, HomeProjectionRepair> = {
  "home-floors-light": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/floors-light/v1/cleanplate-native.png",
      "sha256": "45b68e66b88b3df34ee384351dd8a48211e276627f93592650117af5c79dbc69",
      "recordId": "cleanplate-native",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/floors-light/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-regeneration-20261012/floors-light/v1/plane-agents.png",
        "sha256": "33b29f53043eaf9546820795db12fcb65424afed0d6a6edae8695fa800b8d05b",
        "recordId": "comic-b-home-20261012-floors-light-plane-agents",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/floors-light/retained/plane-agents.png"
      }
    ]
  },
  "home-codex-teal": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/codex-teal/v1/cleanplate-native.png",
      "sha256": "fffe333b842440f9ee7a9941bef253961d9e8bb013e0c2b469b01d8459cecf60",
      "recordId": "cleanplate-native-12",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/codex-teal/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/codex-teal/v2/agent-silhouette-v2.png",
        "sha256": "61f42d79e21d99c3353de05b449cf18967db1e8ff402fb18852fb43b0f9748fb",
        "recordId": "agent-silhouette-v2-6",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/codex-teal/v2/agent-silhouette-v2.png"
      }
    ]
  },
  "home-claude-teal": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/claude-teal/v1/cleanplate-native.png",
      "sha256": "5d37aa46355ab48ad835b77b868fa4bd822dcc4b099b4622bd2ee2df11789e21",
      "recordId": "cleanplate-native-11",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/claude-teal/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/claude-teal/v2/agent-silhouette-v2.png",
        "sha256": "b663c2a53f16322fa13121f97d4429a95d59b74c3172b77bec5962bf371ce3cd",
        "recordId": "agent-silhouette-v2-5",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/claude-teal/v2/agent-silhouette-v2.png"
      }
    ]
  },
  "home-codex-lists": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/codex-lists/v1/cleanplate-native.png",
      "sha256": "57cd7efa8951fe2653c65617a4f1833bb5b67e90fc9c0111573aedc45fc175b6",
      "recordId": "cleanplate-native-10",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/codex-lists/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-regeneration-20261012/codex-lists/v1/plane-agent.png",
        "sha256": "3e06034fe3d63bea7605200e16c3817cd408fb5ac8852af968360fbff2c44233",
        "recordId": "comic-b-home-20261012-codex-lists-plane-agent",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/codex-lists/retained/plane-agent.png"
      }
    ]
  },
  "home-process-connect": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/process-connect/v1/cleanplate-native.png",
      "sha256": "e2290f712a6804d38aba816c675b4dbb925f7462b2002d0ff79cb31f900e0e78",
      "recordId": "cleanplate-native-5",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/process-connect/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/process-connect/v2/agent-silhouette-v2.png",
        "sha256": "37d02ac459c48ca35da613ca87fa6e4383aac6807fde9fa9212e070e0487f9a2",
        "recordId": "agent-silhouette-v2-4",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/process-connect/v2/agent-silhouette-v2.png"
      }
    ]
  },
  "home-process-output": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/process-output/v1/cleanplate-native.png",
      "sha256": "a42602950e09a18c526f66790a94d2556fb62e2467c2ab7c17fd06cbe14e613c",
      "recordId": "cleanplate-native-4",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/process-output/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/process-output/v2/agent-silhouette-v2.png",
        "sha256": "b1fa7153253ac6e1d1bbea85bab715fa66c550857006ddf50310782465f873d1",
        "recordId": "agent-silhouette-v2-3",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/process-output/v2/agent-silhouette-v2.png"
      }
    ]
  },
  "home-process-refusal": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/process-refusal/v1/cleanplate-native.png",
      "sha256": "a482ac2a93e0b1eaa143090753c83e55b002d4900eb590b0a03827989fba1323",
      "recordId": "cleanplate-native-3",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/process-refusal/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/process-refusal/v2/agent-silhouette-v2.png",
        "sha256": "030a41c0a967d05d09d5ad7897399d11c2b493f25b98e353a8e2a71cde1cdbe9",
        "recordId": "agent-silhouette-v2-2",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/process-refusal/v2/agent-silhouette-v2.png"
      }
    ]
  },
  "home-quote-rebuilt": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/quote-rebuilt/v1/cleanplate-native.png",
      "sha256": "d41213d7f3c8e5c89e329b145260312f9d0e3a5ea6fb91113bc415c3e56cdc54",
      "recordId": "cleanplate-native-2",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/quote-rebuilt/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/quote-rebuilt/v2/agent-silhouette-v2.png",
        "sha256": "44fd46202542039735beaee134d912eab625e24d4f71e22c55626069763ad778",
        "recordId": "agent-silhouette-v2",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/quote-rebuilt/v2/agent-silhouette-v2.png"
      }
    ]
  },
  "home-dana-office": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/dana-office/v1/cleanplate-native.png",
      "sha256": "eaac228120556be72d36ced5ceb6ed97d38e165a83f8b2ebdf483fafaeb7f55e",
      "recordId": "cleanplate-native-9",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/dana-office/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/dana-office/v1/actor-source-pixels.png",
        "sha256": "3fc80297330f8e9fc82d70c97b2144040b77f9e3c4b2e6ea51b3c48d28e617fa",
        "recordId": "actor-source-pixels-4",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/dana-office/v1/actor-source-pixels.png"
      }
    ]
  },
  "home-claude-stricken": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/claude-stricken/v1/cleanplate-native.png",
      "sha256": "4f386066a98522fedca3de4364acf9c43e4a2fbb66915c1bd90a2d111e1a0b50",
      "recordId": "cleanplate-native-8",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/claude-stricken/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/claude-stricken/v1/actor-source-pixels.png",
        "sha256": "4f0157a0cffe638bbc400d464bc6271e8ebd369b47130c6c6984b7320df6044b",
        "recordId": "actor-source-pixels-3",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/claude-stricken/v1/actor-source-pixels.png"
      }
    ]
  },
  "home-thirty-one": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/thirty-one/v1/cleanplate-native.png",
      "sha256": "ce602d71effe53b521400af36fe0004ee7507f16992cd467a4debc5647c44041",
      "recordId": "cleanplate-native-7",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/thirty-one/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/thirty-one/v1/actor-source-pixels.png",
        "sha256": "880360e82a2ae179ceb3b64a1a825387ad29884a6bfbad5924d6fb790efe0fae",
        "recordId": "actor-source-pixels-2",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/thirty-one/v1/actor-source-pixels.png"
      }
    ],
    "props": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/thirty-one/v1/physical-paper-source-pixels.png",
        "sha256": "cc44d48ac5104fe082a9fb869fd871a633430151f1508d5dfb58b237995a1f5a",
        "recordId": "physical-paper-source-pixels",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/thirty-one/v1/physical-paper-source-pixels.png"
      }
    ]
  },
  "home-codex-reaches": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/codex-reaches/v1/cleanplate-native.png",
      "sha256": "2a8b2afb76309a4c3e7cbf7e9c997564ec37a59936707d2c3ed6fc826b769b45",
      "recordId": "cleanplate-native-6",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/codex-reaches/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/codex-reaches/v1/actor-source-pixels.png",
        "sha256": "d82aea46ff4c9837b118058feec986fd01c002220444e39475be8801ca978fe6",
        "recordId": "actor-source-pixels",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/codex-reaches/v1/actor-source-pixels.png"
      }
    ]
  }
};

Object.assign(repairs, {
  "home-marco-turns": {
    "base": {
      "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/marco-turns/v1/cleanplate-native.png",
      "sha256": "dc09a32ddedf824ff4567dda0edb57e3e6fb206e7935cc110fe7845466463516",
      "recordId": "comic-b-home-projection-cleanplate-20261013-marco-turns",
      "treatment": "comic-ink",
      "src": "/comic/home/home-projection-repair-20261013/marco-turns/v1/cleanplate-native.png"
    },
    "agents": [
      {
        "path": "wiki/image-library/assets/scenes/comic-b/home-projection-repair-20261013/marco-turns/v1/actor-source-pixels.png",
        "sha256": "c5b54a07ce14d03b89003e038a32eccf0517728a810e262dc3044d1cdc54df9a",
        "recordId": "comic-b-home-projection-marco-turns-actor-source-pixels-20261013",
        "treatment": "comic-ink",
        "src": "/comic/home/home-projection-repair-20261013/marco-turns/v1/actor-source-pixels.png"
      }
    ],
    "ar": [
      0,
      0,
      1,
      1
    ]
  }
}
);

const authority = (panelId: string, asset: HomeProjectionAsset): ComicArtAuthority => ({
  panelId, path: asset.path, sha256: asset.sha256, recordId: asset.recordId, treatment: asset.treatment,
});

export function applyHomeProjection(story: ComicStory, repairedMap: Record<string, HomeProjectionRepair> = {}): ComicStory {
  const selected = { ...repairs, ...repairedMap };
  for (const scene of story.scenes) for (const panel of scene.panels) {
    const repair = selected[panel.img ?? ''];
    if (!repair) continue;
    const prior = panel.views?.find(view => view.at === 0) ?? panel.staticArt;
    const crop: Rect = repair.ar ?? prior?.ar ?? panel.staticArt?.ar ?? panel.ar ?? [0, 0, 1, 1];
    const speakers = repair.speakers ?? prior?.speakers ?? panel.staticArt?.speakers ?? panel.speakers;
    const base = { id: 'base', src: repair.base.src, role: 'background' as const,
      opacity: 1, canonicalSource: authority(panel.img!, repair.base) };
    const agents = repair.agents.map((asset, index) => ({ id: 'agent-' + (index + 1),
      src: asset.src, role: 'agents' as const, opacity: .72, canonicalSource: authority(panel.img!, asset) }));
    const props = (repair.props ?? []).map((asset, index) => ({ id: 'physical-' + (index + 1),
      src: asset.src, role: 'props' as const, opacity: 1, canonicalSource: authority(panel.img!, asset) }));
    // A persistent group never flashes an opaque old agent before the repair.
    // Prior staticArt remains the honest retained all-source-failure fallback.
    panel.views = [{ id: 'home-projection', at: 0, src: repair.base.src, ar: crop,
      fit: panel.artFit ?? 'cover', alt: panel.alt, speakers,
      canonicalSource: base.canonicalSource, layers: [base, ...agents, ...props],
      layerMotion: [
        { layerId: base.id, preset: 'still' },
        ...agents.map(layer => ({ layerId: layer.id, preset: 'projection' as const,
          fabrication: true as const, beats: 6, strength: .9 })),
        ...props.map(layer => ({ layerId: layer.id, preset: 'still' as const })),
      ],
    }];
    panel.motion = { preset: 'still' };
  }
  return story;
}
