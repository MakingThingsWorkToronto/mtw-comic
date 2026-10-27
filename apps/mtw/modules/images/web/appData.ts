// New. App-mode data adapter: every call is a small paged request to /api/images; the manifest stays on the server.
import { api } from '../../../web/api';
import type { Card, CardQuery, DecisionEntry, EvidenceItem, Facets, RecordDetail } from '../shared/types';
import type { DecideInput, ImagesData, PlanPreview, RemovePlan, RemoveResult, SweepReport } from './host';

const BASE = '/api/images';

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '' || v === false) continue;
    q.set(k, v === true ? '1' : String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

export function createAppData(): ImagesData {
  return {
    facets: (collection, category) => api.get<Facets>(`${BASE}/facets${qs({ collection, category })}`),
    records: (q: CardQuery) =>
      api.get<{ total: number; items: Card[] }>(
        `${BASE}/records${qs({ collection: q.collection, q: q.q, category: q.category, service: q.service, style: q.style, status: q.status, gaps: q.gaps, sort: q.sort, offset: q.offset, limit: q.limit })}`,
      ),
    record: (id) => api.get<RecordDetail>(`${BASE}/records/${encodeURIComponent(id)}`).catch(() => null),
    evidence: (q) => api.get<{ total: number; items: EvidenceItem[]; groups: { value: string; count: number }[] }>(`${BASE}/evidence${qs({ q: q.q, group: q.group, offset: q.offset, limit: q.limit })}`),
    thumb: (file, w = 320) => `${BASE}/thumb/${file.sha}?w=${w}`,
    file: (path) => `${BASE}/file/${encodeURIComponent(`wiki/image-library/${path}`)}`,
    decide: (input: DecideInput) => api.post<DecisionEntry>(`${BASE}/decide`, input),
    sweep: (opts) => api.get<SweepReport>(`${BASE}/sweep${qs({ files: opts?.files, hash: opts?.hash, deep: opts?.deep })}`),
    planRegister: (paths) => api.post<PlanPreview>(`${BASE}/register/plan`, { paths }),
    planRemove: (req) => api.post<RemovePlan>(`${BASE}/remove/plan`, req),
    remove: (req) => api.post<RemoveResult>(`${BASE}/remove`, req),
    reveal: async (path) => {
      await api.post(`${BASE}/reveal`, { path: `wiki/image-library/${path}` });
    },
  };
}
