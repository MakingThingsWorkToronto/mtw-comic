// Grammar for `img:<record-id>[#<style>]@<version>` (migration spec section 5). Version: current | v<N> | <sha8>.
export interface ImgRef {
  id: string;
  style?: string;
  version: string;
}

export function parseImgRef(ref: string): ImgRef | null {
  const m = /^img:(.+)$/.exec(ref.trim());
  if (!m) return null;
  let body = m[1] as string;
  let version = 'current';
  const at = body.lastIndexOf('@');
  if (at >= 0) {
    version = body.slice(at + 1) || 'current';
    body = body.slice(0, at);
  }
  let style: string | undefined;
  const hash = body.lastIndexOf('#');
  if (hash >= 0) {
    style = body.slice(hash + 1) || undefined;
    body = body.slice(0, hash);
  }
  if (!body || !/^(current|v\d+|[0-9a-f]{8})$/.test(version)) return null;
  return { id: body, ...(style ? { style } : {}), version };
}

export function formatImgRef(id: string, version = 'current', style?: string): string {
  return `img:${id}${style ? `#${style}` : ''}@${version}`;
}
