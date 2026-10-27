import type { ComponentChildren } from 'preact';
import { anchorOf, inlineTokens } from '../shared';
import type { Block } from '../shared';

export const LOCAL_SITE_ORIGIN = 'http://localhost:8787';

/** Inline markdown as elements (never HTML strings). Site-absolute links point at the local site. */
export function Inline({ text }: { text: string }) {
  return (
    <>
      {inlineTokens(text).map((t, i) => {
        switch (t.t) {
          case 'link': {
            const href = t.href.startsWith('/') ? `${LOCAL_SITE_ORIGIN}${t.href}` : t.href;
            return /^https?:\/\//i.test(href) ? (
              <a key={i} href={href} target="_blank" rel="noopener noreferrer">
                {t.text}
              </a>
            ) : (
              <span key={i}>{t.text}</span>
            );
          }
          case 'code':
            return <code key={i}>{t.text}</code>;
          case 'strong':
            return <strong key={i}>{t.text}</strong>;
          case 'em':
            return <em key={i}>{t.text}</em>;
          default:
            return <span key={i}>{t.text}</span>;
        }
      })}
    </>
  );
}

export function Blocks({ blocks, anchors }: { blocks: Block[]; anchors?: boolean }): ComponentChildren {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'h') {
          const level = Math.min(Math.max(b.level, 2), 4);
          const Tag = `h${level}` as 'h2';
          return (
            <Tag key={i} id={anchors && level === 2 ? anchorOf(b.text.replace(/[*`]/g, '')) : undefined}>
              <Inline text={b.text} />
            </Tag>
          );
        }
        if (b.type === 'hr') return <hr key={i} />;
        if (b.type === 'quote')
          return (
            <blockquote key={i}>
              <Inline text={b.text} />
            </blockquote>
          );
        if (b.type === 'list') {
          const Tag = b.ordered ? 'ol' : 'ul';
          return (
            <Tag key={i}>
              {b.items.map((x, j) => (
                <li key={j}>
                  <Inline text={x} />
                </li>
              ))}
            </Tag>
          );
        }
        return (
          <p key={i}>
            <Inline text={b.text} />
          </p>
        );
      })}
    </>
  );
}
