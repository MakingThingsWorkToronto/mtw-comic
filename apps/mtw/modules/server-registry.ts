// Static server-side registry. Imported only by the server; the web bundle uses client-registry.ts.
import type { ServerModule } from './types';
import { server as operations } from './operations/server';
import { server as comics } from './comics/server';
import { server as soundtrackBase, storeFor } from './soundtrack/server';
import { server as imagesBase } from './images/server';
import { server as workflows } from './workflows/server';
import { createImagesIntake } from './images/intake';
import { createSoundtrackIntake } from './soundtrack/intake';

// Auto-intake (server/core/intake.ts) is attached here so the modules' own server files stay unchanged.
const images: ServerModule = { ...imagesBase, intake: (services) => createImagesIntake(services) };
const soundtrack: ServerModule = { ...soundtrackBase, intake: (services) => createSoundtrackIntake(services, storeFor(services)) };

export const serverModules: ServerModule[] = [operations, comics, images, soundtrack, workflows];
