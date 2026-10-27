import type { AssetRegistry, AssetResolver, AssetSummary } from '../../modules/types';

/** Prefix -> resolver. Modules register theirs in ServerModule.register. */
export class Assets implements AssetRegistry {
  private resolvers = new Map<string, AssetResolver>();

  register(resolver: AssetResolver): void {
    this.resolvers.set(resolver.prefix, resolver);
  }

  resolver(prefix: string): AssetResolver | undefined {
    return this.resolvers.get(prefix);
  }

  prefixes(): { prefix: string; label: string; module: string }[] {
    return [...this.resolvers.values()].map((r) => ({ prefix: r.prefix, label: r.label, module: r.module }));
  }

  async resolve(ref: string): Promise<AssetSummary | null> {
    const prefix = ref.split(':', 1)[0] ?? '';
    return (await this.resolvers.get(prefix)?.resolve(ref)) ?? null;
  }
}
