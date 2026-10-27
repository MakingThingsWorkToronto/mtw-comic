import { useState } from 'preact/hooks';
import { Link } from '../../../web/shell/Link';
import { setQuery } from '../../../web/shell/router';
import { AssetField, Badge, Button, DeleteControl, EmptyState, Menu, Table, Tabs, useDelete } from '../../../web/ui';
import { deleteSubject } from '../../../web/delete';
import type { Column } from '../../../web/ui';
import { copy } from '../copy';
import layout from '../layout.json';
import { isUnknown, mdBlocks, show, sentence } from '../shared';
import type { ConceptRec, CoverRow, DecisionRec, EntryRec, GateRow, QuestionRow, RoundRow, Stage } from '../shared';
import { ActionDialog } from './ActionDialog';
import { AnswerForm } from './AnswerForm';
import { Approval, Cover, Gloss, Notice, Sections, Unk, jUrl, latest, launchFields } from './common';
import type { RunnerChoice } from './common';
import { Blocks, Inline } from './Md';
import { setupHelp } from './help';
import { LaunchDialog, useJournalOps } from './Ops';
import { jpost } from './useJournal';
import type { Overview } from './useJournal';

interface Props {
  data: Overview;
  slug: string;
  tab: string;
  onDirty: (d: boolean) => void;
  onChanged: () => void;
}

const fmtDate = (iso: string): string => iso.slice(0, 16).replace('T', ' ');

export function Entry({ data, slug, tab, onDirty, onChanged }: Props) {
  const { state, decisions } = data;
  const e = state.entries.find((x) => x.slug === slug);
  const { ops, options } = useJournalOps();
  const [dialog, setDialog] = useState<'approve' | 'publish' | null>(null);
  const [launching, setLaunching] = useState<string | null>(null);
  const [conditions, setConditions] = useState('');
  const del = useDelete({
    kind: 'journal',
    subject: deleteSubject.journal(slug),
    target: slug,
    paths: e ? e.files.filter((f) => f.present).map((f) => f.path) : [],
    onSettle: onChanged,
  });
  if (!e) return <EmptyState>{copy.entry.notFound}</EmptyState>;
  const concept = state.concepts.find((c) => c.entrySlug === slug) ?? null;
  const mine = decisions.filter((d) => d.subject === slug);
  const active = (layout.entryTabs as string[]).includes(tab) ? tab : 'status';
  const def = (id: string) => ops.find((o) => o.id === id);

  const approve = async (c: RunnerChoice) => {
    await jpost('/decide', { subject: slug, action: 'approve', ...(conditions.trim() ? { note: conditions.trim() } : {}) });
    const terminal = await jpost<{ id: string }>('/launch', {
      operation: 'journal-record-approval',
      params: { entry: slug, ...(conditions.trim() ? { conditions: conditions.trim() } : {}) },
      ...launchFields(c),
    });
    onChanged();
    return { terminal };
  };
  // Publish: Matt's click records his publish direction, then launches journal-publish in a terminal, which asks him
  // again before anything is deployed.
  const publish = async (c: RunnerChoice) => {
    await jpost('/decide', { subject: slug, action: 'publish-direction', explicit: true });
    const terminal = await jpost<{ id: string }>('/launch', { operation: 'journal-publish', params: { entry: slug }, ...launchFields(c) });
    onChanged();
    return { terminal };
  };
  const published = state.queue.published.some((r) => r.slug === slug);

  type MenuItem = { id: string; label: string; op: string; preset: Record<string, string>; help: string };
  const all: MenuItem[] = [];
  if (concept) {
    all.push({ id: 'interview', label: 'Run interview', op: 'journal-interview', preset: { concept: String(concept.number) }, help: setupHelp('journal-interview', 'Run interview') });
    all.push({ id: 'draft', label: 'Draft entry', op: 'journal-draft', preset: { concept: String(concept.number) }, help: setupHelp('journal-draft', 'Draft entry') });
  }
  all.push({ id: 'cover', label: copy.entry.assets.generate, op: 'journal-cover', preset: { entry: slug, count: '5' }, help: setupHelp('journal-cover', copy.entry.assets.generate) });
  const menu = all.filter((m) => def(m.op));
  const launchDef = launching ? menu.find((m) => m.id === launching) : null;

  return (
    <div class={`page ${del.zoneClass}`} ref={del.ref} {...del.zoneAttrs}>
      <div class="page-head">
        <div class="title-block">
          <h1>{e.title}</h1>
          <p class="sub">
            <Approval value={e.approval} />
          </p>
        </div>
        <div class="row">
          {e.post.found && (
            <Link class="btn btn--secondary" href={jUrl('entry', slug, 'preview')} title="Opens a readable preview of this entry inside Studio: cover, headline and text. Nothing is changed.">
              {copy.entry.preview}
            </Link>
          )}
          {e.post.found && (
            <a class="btn btn--ghost" href={e.localSiteUrl} target="_blank" rel="noopener noreferrer" title="Opens this entry's page on your local copy of the website in a new browser tab. Nothing is changed.">
              {copy.entry.site}
            </a>
          )}
          {menu.length > 0 && <Menu label={copy.module.tabs.operations} help="Lists jobs you can start for this entry, such as the interview, the draft or cover concepts. Picking one opens a window to set it up; nothing starts until you press Launch there." items={menu.map((m) => ({ id: m.id, label: m.label, help: m.help, onSelect: () => setLaunching(m.id) }))} />}
          <DeleteControl del={del} small={false} />
        </div>
      </div>
      <Notice title={copy.disagree.title} items={e.staleClaims} />
      <Tabs label="Entry sections" value={active} onChange={(id) => setQuery({ tab: id === 'status' ? undefined : id })} items={(layout.entryTabs as string[]).map((id) => ({ id, label: copy.entry.tabs[id as 'status'] }))} />

      {active === 'status' && <StatusTab e={e} concept={concept} mine={mine} published={published} canPublish={Boolean(def('journal-publish'))} onApprove={() => setDialog('approve')} onPublish={() => setDialog('publish')} />}
      {active === 'interview' && <InterviewTab e={e} onDirty={onDirty} onChanged={onChanged} />}
      {active === 'gates' && <GatesTab e={e} mine={mine} onChanged={onChanged} />}
      {active === 'assets' && <AssetsTab e={e} mine={mine} onChanged={onChanged} onGenerate={() => setLaunching('cover')} canGenerate={Boolean(def('journal-cover'))} />}
      {active === 'notes' && <NotesTab e={e} />}

      {dialog === 'approve' && (
        <ActionDialog title={copy.entry.approveTitle} body={copy.entry.approveBody} confirm={copy.entry.approve.replace('…', '')} confirmHelp="Records that you approve this entry, then opens a terminal where an agent writes your approval (and any conditions) into the entry's files. Approving does not publish anything." onClose={() => setDialog(null)} operation="journal-record-approval" run={approve}>
          <div class="field">
            <label for="j-conditions">{copy.entry.conditions}</label>
            <input id="j-conditions" class="input" value={conditions} onInput={(ev) => setConditions((ev.target as HTMLInputElement).value)} />
          </div>
        </ActionDialog>
      )}
      {dialog === 'publish' && <ActionDialog title={copy.entry.publishTitle} body={copy.entry.publishBody} confirm={copy.entry.publishConfirm} confirmHelp="Records that you want this entry published, then opens a terminal where an agent builds the page from the approved draft and checks it. It asks you for a yes in that terminal before anything goes live." onClose={() => setDialog(null)} operation="journal-publish" run={publish} />}
      {launchDef && def(launchDef.op) && <LaunchDialog def={def(launchDef.op)!} options={options} preset={launchDef.preset} onClose={() => setLaunching(null)} />}
    </div>
  );
}

// ---------------------------------------------------------------- Status

function StatusTab({ e, concept, mine, published, canPublish, onApprove, onPublish }: { e: EntryRec; concept: ConceptRec | null; mine: DecisionRec[]; published: boolean; canPublish: boolean; onApprove: () => void; onPublish: () => void }) {
  const decisionRows = mine.filter((d) => d.action !== 'answer').sort((a, b) => b.at.localeCompare(a.at));
  const answers = mine.filter((d) => d.action === 'answer').length;
  const stageCols: Column<Stage>[] = [
    { key: 'label', header: 'Stage', render: (s) => s.label },
    { key: 'state', header: 'State', render: (s) => <Unk value={s.state} /> },
    { key: 'evidence', header: 'Evidence', render: (s) => <span title={s.evidence}>{sentence(s.evidence)}</span> },
  ];
  const decCols: Column<DecisionRec>[] = [
    { key: 'at', header: 'When', render: (d) => fmtDate(d.at) },
    { key: 'action', header: 'Decision', render: (d) => d.action },
    { key: 'note', header: 'Note', render: (d) => <span title={d.note ?? ''}>{d.note ?? ''}</span> },
  ];
  return (
    <Sections
      order={layout.entrySections.status}
      map={{
        statusLine: () => (
          <p>
            <span class="muted">{copy.entry.statusLine}: </span>“{show(e.recordedStatusLine)}”
          </p>
        ),
        stages: () =>
          concept ? (
            <>
              <h2>{copy.entry.status.stages}</h2>
              <Table columns={stageCols} rows={concept.stages} rowKey={(s) => s.id} />
            </>
          ) : null,
        approval: () => (
          <>
            <h2>{copy.entry.status.approval}</h2>
            <p>
              <span class="muted">{copy.entry.status.approvalFile}: </span>
              <Approval value={e.approval} /> <span class="muted">{e.approvalEvidence}</span>
            </p>
            <div class="row">
              <Button variant="primary" help="Opens a window to confirm. Confirming records that you approve this entry, then opens a terminal where an agent writes your approval into the entry's files. Approving does not publish anything." onClick={onApprove}>
                {copy.entry.approve}
              </Button>
              {e.approval === 'approved' && !published && canPublish && <Button help="Opens a window to confirm. Confirming records that you want this entry published and opens a terminal where an agent builds the page and checks it. It asks you for a yes there before anything goes live." onClick={onPublish}>{copy.entry.publishDirection}</Button>}
              {published && <span class="muted">{copy.entry.alreadyPublished}</span>}
            </div>
            <h3>{copy.entry.status.decisions}</h3>
            {decisionRows.length ? <Table columns={decCols} rows={decisionRows} rowKey={(d) => d.id} /> : <p class="muted">{copy.entry.status.noDecisions}</p>}
            {answers > 0 && <p class="muted">{answers} answer decision(s) recorded.</p>}
          </>
        ),
        files: () => (
          <>
            <h3>{copy.entry.status.files}</h3>
            <ul class="j-list">
              {e.files.map((f) => (
                <li key={f.key}>
                  <code>{f.path}</code> {!f.present && <span class="unk">{copy.entry.status.absent}</span>}
                </li>
              ))}
            </ul>
          </>
        ),
        measurements: () => (
          <>
            <h3>{copy.entry.status.measurements}</h3>
            {e.measurements.length ? (
              <ul class="j-list">
                {e.measurements.map((m) => (
                  <li key={m.file}>
                    <code>{m.file}</code> · {show(m.title)} <span class="muted">Limits recorded: {show(m.limits)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p class="muted">{copy.entry.status.noMeasurements}</p>
            )}
          </>
        ),
      }}
    />
  );
}

// -------------------------------------------------------------- Interview

function InterviewTab({ e, onDirty, onChanged }: { e: EntryRec; onDirty: (d: boolean) => void; onChanged: () => void }) {
  const qCols: Column<QuestionRow>[] = [
    { key: 'n', header: '#', render: (r) => r.number },
    { key: 'q', header: 'Question', render: (r) => <span title={r.question}>{r.question}</span> },
    { key: 'v', header: 'Self answer pass', render: (r) => <Unk value={r.selfAnswerVerdict} /> },
    { key: 's', header: 'State, as the file writes it', render: (r) => <Unk value={r.stateText} /> },
  ];
  const rCols: Column<RoundRow>[] = [
    { key: 'round', header: 'Round', render: (r) => <Unk value={r.round} /> },
    { key: 'date', header: 'Date', render: (r) => <span title={r.dateSource}><Unk value={r.date} /></span> },
    { key: 'n', header: 'Answers', render: (r) => r.questionsRecorded },
    { key: 'w', header: 'Words', render: (r) => r.words },
    { key: 'red', header: 'Redactions', render: (r) => <Unk value={r.redactions} /> },
    { key: 'file', header: 'File', render: (r) => <code>{r.path.replace(/^\.\.\//, 'wiki/journal/')}</code> },
  ];
  return (
    <Sections
      order={layout.entrySections.interview}
      map={{
        framing: () => (
          <>
            <h2>
              <Gloss term="Framing finding">{copy.entry.interview.framing}</Gloss>
            </h2>
            <dl class="j-dl">
              <dt>{copy.entry.interview.position}</dt>
              <dd>
                <Badge status={e.framing.namedPositionAvailable === 'yes' ? 'approved' : 'pending'}>{e.framing.namedPositionAvailable}</Badge> <span class="muted">{show(e.framing.namedPosition)}</span>
              </dd>
              <dt>{copy.entry.interview.event}</dt>
              <dd>
                <Badge status={e.framing.datedEventAvailable === 'yes' ? 'approved' : 'pending'}>{e.framing.datedEventAvailable}</Badge> <span class="muted">{show(e.framing.datedEvent)}</span>
              </dd>
            </dl>
          </>
        ),
        questions: () => (
          <>
            <h2>
              <Gloss term="Self answer pass">{copy.entry.interview.questions}</Gloss>
            </h2>
            {e.questions.rows.length ? <Table columns={qCols} rows={e.questions.rows} rowKey={(r) => String(r.number)} /> : <p class="muted">{copy.entry.interview.noQuestions} {e.questions.basis}</p>}
          </>
        ),
        raised: () =>
          e.questions.raised.length ? (
            <>
              <h3>{copy.entry.interview.raised}</h3>
              <ol class="j-list">
                {e.questions.raised.map((r) => (
                  <li key={r.number}>{r.question}</li>
                ))}
              </ol>
            </>
          ) : null,
        rounds: () => (
          <>
            <h3>{copy.entry.interview.rounds}</h3>
            {e.answers.count ? <Table columns={rCols} rows={e.answers.rounds} rowKey={(r) => r.file} /> : <p class="muted">{e.answers.note ?? copy.entry.interview.noRounds}</p>}
          </>
        ),
        answers: () => (
          <>
            <h2 id="answers">{copy.answers.title}</h2>
            <p class="muted">{copy.answers.sub}</p>
            <AnswerForm groups={e.questionsForMatt} target={{ entry: e.slug }} onDirty={onDirty} onRecorded={onChanged} />
          </>
        ),
      }}
    />
  );
}

// ------------------------------------------------------------------ Gates

function GatesTab({ e, mine, onChanged }: { e: EntryRec; mine: DecisionRec[]; onChanged: () => void }) {
  const [v, setV] = useState({ decision: false, mistake: false, number: false });
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const confirmations = mine.filter((d) => d.action === 'gate-pass-confirm').sort((a, b) => b.at.localeCompare(a.at));
  const cols: Column<GateRow>[] = [
    { key: 'gate', header: 'Gate', render: (g) => <Gloss term={g.gate.startsWith('Gate A') ? 'Gate A' : g.gate}>{g.gate}</Gloss> },
    { key: 'result', header: 'Result', render: (g) => <span title={g.result}>{g.result}</span> },
    { key: 'evidence', header: 'Evidence, as interview.md writes it', render: (g) => <span title={g.evidence}>{g.evidence}</span> },
  ];
  const save = async (): Promise<void> => {
    setError('');
    try {
      await jpost('/decide', { subject: e.slug, action: 'gate-pass-confirm', value: v, ...(note.trim() ? { note: note.trim() } : {}) });
      setV({ decision: false, mistake: false, number: false });
      setNote('');
      onChanged();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  return (
    <Sections
      order={layout.entrySections.gates}
      map={{
        gateTable: () => (
          <>
            <h2>{copy.entry.gates.table}</h2>
            {e.gates.found ? <Table columns={cols} rows={e.gates.rows} rowKey={(g) => g.gate} /> : <p class="muted">{e.gates.basis}</p>}
          </>
        ),
        verdict: () => (isUnknown(e.gates.verdictLine) ? null : <p><span class="muted">{copy.entry.gates.verdict}: </span>“{e.gates.verdictLine}”</p>),
        gateConfirm: () => (
          <>
            <h3>
              <Gloss term="Gate A">{copy.entry.gates.confirm}</Gloss>
            </h3>
            <form
              class="stack"
              onSubmit={(ev) => {
                ev.preventDefault();
                void save();
              }}
            >
              <div class="row">
                {(['decision', 'mistake', 'number'] as const).map((k) => (
                  <label key={k} class="row">
                    <input type="checkbox" checked={v[k]} onChange={(ev) => setV({ ...v, [k]: (ev.target as HTMLInputElement).checked })} />
                    <span>{copy.entry.gates.confirmItems[k]}</span>
                  </label>
                ))}
              </div>
              <div class="field">
                <label for="j-gate-note">{copy.entry.gates.confirmNote}</label>
                <input id="j-gate-note" class="input" value={note} onInput={(ev) => setNote((ev.target as HTMLInputElement).value)} />
              </div>
              <div class="row">
                <Button type="submit" variant="primary" help="Saves your tick boxes and note as a dated record that the interview gave a decision, a mistake and a number (only the ones you ticked). Nothing is launched or published.">
                  {copy.entry.gates.confirmSave}
                </Button>
              </div>
              {error && <p role="alert" style="color:var(--error)">{error}</p>}
            </form>
            {confirmations.length ? (
              <ul class="j-list">
                {confirmations.map((d) => {
                  const val = d.value as { decision?: boolean; mistake?: boolean; number?: boolean };
                  return (
                    <li key={d.id}>
                      {fmtDate(d.at)} · decision {val.decision ? 'yes' : 'no'}, mistake {val.mistake ? 'yes' : 'no'}, number {val.number ? 'yes' : 'no'}
                      {d.note ? ` · ${d.note}` : ''}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p class="muted">{copy.entry.gates.none}</p>
            )}
          </>
        ),
      }}
    />
  );
}

// ----------------------------------------------------------------- Assets

function AssetsTab({ e, mine, onChanged, onGenerate, canGenerate }: { e: EntryRec; mine: DecisionRec[]; onChanged: () => void; onGenerate: () => void; canGenerate: boolean }) {
  const [choosing, setChoosing] = useState<{ ref: string; file: string; label: string } | null>(null);
  const [other, setOther] = useState('');
  const covers = e.assets.covers;
  const chosenByFile = covers.some((c) => /chosen/i.test(c.option));
  const byDecision = latest(mine, e.slug, 'choose-cover') ?? mine.filter((d) => d.action === 'choose-cover').sort((a, b) => b.at.localeCompare(a.at))[0];
  const decidedFile = byDecision ? (byDecision.value as { file?: string } | undefined)?.file : undefined;

  const choose = async (c: RunnerChoice) => {
    const target = choosing as { ref: string; file: string };
    await jpost('/decide', { subject: target.ref, action: 'choose-cover', value: { entry: e.slug, file: target.file } });
    const terminal = await jpost<{ id: string }>('/launch', {
      operation: 'journal-record-cover',
      params: { entry: e.slug, cover: target.file },
      ...launchFields(c),
    });
    onChanged();
    return { terminal };
  };
  const refOf = (c: CoverRow): string => c.ref ?? `cover-file:${c.file}`;
  const immCols: Column<EntryRec['assets']['immersive'][number]>[] = [
    { key: 'type', header: 'Type', render: (i) => i.type },
    { key: 'id', header: 'Id', render: (i) => <code>{i.id}</code> },
    { key: 'status', header: 'Status, as assets.md writes it', render: (i) => <span title={i.status}>{i.status}</span> },
    { key: 'shows', header: 'Must show', render: (i) => <span title={i.shows}>{i.shows}</span> },
  ];
  return (
    <>
    <Sections
      order={layout.entrySections.assets}
      map={{
        immersive: () => (
          <>
            <h2>
              <Gloss term="Immersive set">{copy.entry.assets.immersive}</Gloss>
            </h2>
            {e.assets.immersive.length ? <Table columns={immCols} rows={e.assets.immersive} rowKey={(i) => i.id} /> : <p class="muted">{e.assets.basis}</p>}
          </>
        ),
        covers: () => (
          <>
            <div class="row">
              <h2>{copy.entry.assets.covers}</h2>
              {canGenerate && (
                <Button small help={setupHelp('journal-cover', copy.entry.assets.generate)} onClick={onGenerate}>
                  {copy.entry.assets.generate}
                </Button>
              )}
            </div>
            {!covers.length && <p class="muted">{copy.entry.assets.none}</p>}
            {covers.length > 1 && !chosenByFile && <Notice kind="info" title={copy.entry.assets.noneChosen} />}
            {chosenByFile && <p class="muted">{copy.entry.assets.chosenFile}</p>}
            {byDecision && decidedFile && !covers.some((c) => /chosen/i.test(c.option) && c.file === decidedFile) && (
              <Notice kind="info" title={`${copy.entry.assets.decided}: ${decidedFile}, ${fmtDate(byDecision.at)}. assets.md does not mark it yet.`} />
            )}
            <div class="j-covers">
              {covers.map((c) => (
                <figure key={c.file + c.option} class="j-cover-card">
                  <Cover cover={c} width={280} />
                  <figcaption>
                    <strong>{c.option}</strong>
                    <br />
                    <code>{show(c.file)}</code>
                    <br />
                    <span class="muted">{sentence(c.state)} {c.existsNote}</span>
                    {c.ref && (
                      <>
                        <br />
                        <code class="muted">{c.ref}</code>
                      </>
                    )}
                    {decidedFile === c.file && (
                      <>
                        <br />
                        <Badge status="candidate">{copy.entry.assets.decided}</Badge>
                      </>
                    )}
                  </figcaption>
                  <Button small disabled={!c.exists} help="Opens a window to confirm. Confirming records this cover as your choice, then opens a terminal where an agent marks it as chosen in the entry's cover notes. The other covers are kept." onClick={() => setChoosing({ ref: refOf(c), file: c.file, label: c.option })}>
                    {copy.entry.assets.choose}
                  </Button>
                </figure>
              ))}
            </div>
            {!isUnknown(e.assets.coverClaim) && (
              <p class="muted">
                assets.md: “{e.assets.coverClaim}”
              </p>
            )}
          </>
        ),
        otherCover: () => (
          <div class="stack">
            <AssetField label={copy.entry.assets.other} assetType="img" value={other} onChange={setOther} />
            <div class="row">
              <Button disabled={!/^img:\S+/.test(other.trim())} help="Uses the library image you picked above as this entry's cover. Opens a window to confirm first; the other covers are kept." onClick={() => setChoosing({ ref: other.trim(), file: other.trim(), label: other.trim() })}>
                {copy.entry.assets.otherChoose}
              </Button>
            </div>
          </div>
        ),
      }}
    />
    {choosing && (
      <ActionDialog title={`${copy.entry.assets.choose}: ${choosing.label}`} body="Records your choice as a decision, then launches the recorder that marks the row Chosen in assets.md." confirm="Choose and launch" confirmHelp="Records your cover choice, then opens a terminal where an agent marks it as chosen in the entry's cover notes. Other covers are kept." onClose={() => setChoosing(null)} operation="journal-record-cover" run={choose} />
    )}
    </>
  );
}

// ------------------------------------------------------------------ Notes

function NotesTab({ e }: { e: EntryRec }) {
  const notes = e.post.notes ? mdBlocks(e.post.notes) : [];
  const cut = notes.findIndex((b) => b.type === 'p' && /Open questions for you/i.test(b.text));
  const withoutQuestions = cut === -1 ? notes : notes.slice(0, cut);
  const open = e.post.openQuestions ?? [];
  return (
    <Sections
      order={layout.entrySections.notes}
      map={{
        draftNotes: () => (
          <>
            <h2>{copy.entry.notes.title}</h2>
            {withoutQuestions.length ? (
              <div class="j-prose">
                <Blocks blocks={withoutQuestions} />
              </div>
            ) : (
              <p class="muted">{copy.entry.notes.none}</p>
            )}
          </>
        ),
        openQuestions: () =>
          open.length ? (
            <>
              <h3>{copy.entry.notes.open}</h3>
              <ol class="j-list">
                {open.map((q) => (
                  <li key={q.number}>
                    <Inline text={q.text} />
                  </li>
                ))}
              </ol>
              <Link href={`${jUrl('entry', e.slug)}?tab=interview#answers`}>{copy.entry.notes.answerIn}</Link>
            </>
          ) : null,
      }}
    />
  );
}
