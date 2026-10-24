import { Fragment } from 'react';

/**
 * Lightweight Markdown + LaTeX renderer.
 * Handles: headings, bold, italic, inline code, code blocks,
 * ordered/unordered lists, paragraphs, and $...$ / $$...$$ math spans.
 * Math is rendered as styled spans (not compiled) to avoid heavy deps.
 */

interface ParsedNode {
  type: 'text' | 'bold' | 'italic' | 'code' | 'math';
  content: string;
}

function parseInline(text: string): ParsedNode[] {
  const nodes: ParsedNode[] = [];
  let i = 0;
  while (i < text.length) {
    // Math: $$...$$
    if (text[i] === '$' && text[i + 1] === '$') {
      const end = text.indexOf('$$', i + 2);
      if (end !== -1) {
        nodes.push({ type: 'math', content: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    // Math: $...$
    if (text[i] === '$') {
      const end = text.indexOf('$', i + 1);
      if (end !== -1 && end > i + 1) {
        nodes.push({ type: 'math', content: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // Inline code: `...`
    if (text[i] === '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        nodes.push({ type: 'code', content: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // Bold: **...**
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        nodes.push({ type: 'bold', content: text.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    // Italic: *...*
    if (text[i] === '*') {
      const end = text.indexOf('*', i + 1);
      if (end !== -1 && end > i + 1 && text[end + 1] !== '*') {
        nodes.push({ type: 'italic', content: text.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // Accumulate plain text until next special char
    let j = i;
    while (j < text.length && text[j] !== '$' && text[j] !== '`' && text[j] !== '*') {
      j++;
    }
    if (j === i) j++;
    nodes.push({ type: 'text', content: text.slice(i, j) });
    i = j;
  }
  return nodes;
}

function renderInline(nodes: ParsedNode[], keyPrefix: string): React.ReactNode[] {
  return nodes.map((node, idx) => {
    const key = `${keyPrefix}-${idx}`;
    switch (node.type) {
      case 'bold':
        return <strong key={key} className="font-semibold text-slate-100">{renderInline(parseInline(node.content), key)}</strong>;
      case 'italic':
        return <em key={key} className="italic">{node.content}</em>;
      case 'code':
        return <code key={key} className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[0.85em] text-sky-300">{node.content}</code>;
      case 'math':
        return (
          <span key={key} className="mx-0.5 inline-block rounded bg-slate-800/60 px-1.5 py-0.5 font-mono text-[0.85em] text-amber-200">
            {node.content}
          </span>
        );
      default:
        return <Fragment key={key}>{node.content}</Fragment>;
    }
  });
}

interface Block {
  type: 'heading' | 'code' | 'olist' | 'ulist' | 'paragraph';
  level?: number;
  content?: string;
  items?: string[];
  lang?: string;
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: 'code', content: codeLines.join('\n'), lang });
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.*)/);
    if (headingMatch) {
      blocks.push({ type: 'heading', level: headingMatch[1].length, content: headingMatch[2] });
      i++;
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'olist', items });
      continue;
    }

    // Unordered list
    if (/^[-*]\s+/.test(line.trim())) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'ulist', items });
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph (accumulate consecutive non-empty lines)
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].match(/^(#{1,4})\s+/) &&
      !/^\d+\.\s+/.test(lines[i].trim()) &&
      !/^[-*]\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    blocks.push({ type: 'paragraph', content: paraLines.join(' ') });
  }

  return blocks;
}

export default function MarkdownRenderer({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-3 text-sm leading-relaxed text-slate-300">
      {blocks.map((block, idx) => {
        const key = `block-${idx}`;
        switch (block.type) {
          case 'heading': {
            const sizes: Record<number, string> = {
              1: 'text-lg font-bold text-white mt-4',
              2: 'text-base font-bold text-white mt-3',
              3: 'text-sm font-semibold text-slate-100 mt-2',
              4: 'text-sm font-semibold text-slate-200 mt-2',
            };
            return (
              <div key={key} className={sizes[block.level ?? 2]}>
                {renderInline(parseInline(block.content ?? ''), key)}
              </div>
            );
          }
          case 'code':
            return (
              <pre key={key} className="overflow-x-auto rounded-lg border border-slate-700/60 bg-slate-950/80 p-3 text-xs">
                <code className="font-mono text-sky-200">{block.content}</code>
              </pre>
            );
          case 'olist':
            return (
              <ol key={key} className="list-decimal space-y-1.5 pl-5">
                {block.items?.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(parseInline(item), `${key}-${j}`)}</li>
                ))}
              </ol>
            );
          case 'ulist':
            return (
              <ul key={key} className="list-disc space-y-1.5 pl-5">
                {block.items?.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(parseInline(item), `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          default:
            return (
              <p key={key}>{renderInline(parseInline(block.content ?? ''), key)}</p>
            );
        }
      })}
    </div>
  );
}
