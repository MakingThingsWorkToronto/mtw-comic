// Static client-side registry. Imports only meta.ts and lazy client views; never server code.
import type { ClientModule } from './types';
import { meta as operations } from './operations/meta';
import { meta as comics } from './comics/meta';
import { meta as soundtrack } from './soundtrack/meta';
import { meta as images } from './images/meta';
import { meta as workflows } from './workflows/meta';

export const clientModules: ClientModule[] = [
  { meta: operations, load: () => import('./operations/client') },
  { meta: comics, load: () => import('./comics/client') },
  { meta: soundtrack, load: () => import('./soundtrack/client') },
  { meta: images, load: () => import('./images/client') },
  { meta: workflows, load: () => import('./workflows/client') },
].sort((a, b) => a.meta.nav.order - b.meta.nav.order);

export function findClientModule(id: string): ClientModule | undefined {
  return clientModules.find((m) => m.meta.id === id);
}
