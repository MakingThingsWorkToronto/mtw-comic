// The shared `help` prop: every Studio button explains in plain English what clicking does.
import { describe, expect, it } from 'vitest';
import { Button, IconButton, helpAttrs } from '../web/ui/Button';

type Props = Record<string, unknown>;
const propsOf = (node: unknown): Props => (node as { props: Props }).props;

describe('button help', () => {
  it('Button: help becomes the tooltip and the accessible description', () => {
    const p = propsOf(Button({ help: 'Saves your notes.', children: 'Save' }));
    expect(p.title).toBe('Saves your notes.');
    expect(p['aria-description']).toBe('Saves your notes.');
  });

  it('Button: help wins over a title passed by the caller', () => {
    const p = propsOf(Button({ help: 'Saves your notes.', title: 'old', children: 'Save' }));
    expect(p.title).toBe('Saves your notes.');
  });

  it('Button: a plain title still works and adds no description', () => {
    const p = propsOf(Button({ title: 'old', children: 'Save' }));
    expect(p.title).toBe('old');
    expect(p['aria-description']).toBeUndefined();
  });

  it('IconButton: the label is the tooltip until a longer help is given', () => {
    expect(propsOf(IconButton({ label: 'Close', glyph: 'close' })).title).toBe('Close');
    const p = propsOf(IconButton({ label: 'Close', glyph: 'close', help: 'Closes this window without saving.' }));
    expect(p.title).toBe('Closes this window without saving.');
    expect(p['aria-description']).toBe('Closes this window without saving.');
    expect(p['aria-label']).toBe('Close');
  });

  it('helpAttrs gives nothing when there is no text', () => {
    expect(helpAttrs(undefined)).toEqual({});
  });
});
