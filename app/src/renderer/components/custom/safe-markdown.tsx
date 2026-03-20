import { defaultSchema, type Schema } from 'hast-util-sanitize';
import React from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

const sanitizeSchema: Schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code || []), ['className']],
    pre: [...(defaultSchema.attributes?.pre || []), ['className']],
    span: [...(defaultSchema.attributes?.span || []), ['className']],
  },
};

type MarkdownNodeProp = {
  node?: unknown;
};

type LinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  MarkdownNodeProp & {
    href?: string;
    children?: React.ReactNode;
  };

type PreProps = React.HTMLAttributes<HTMLPreElement> &
  MarkdownNodeProp & {
    className?: string;
    children?: React.ReactNode;
  };

type CodeProps = React.HTMLAttributes<HTMLElement> &
  MarkdownNodeProp & {
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
  };

type UlProps = React.HTMLAttributes<HTMLUListElement> &
  MarkdownNodeProp & {
    ordered?: boolean;
    children?: React.ReactNode;
  };

type OlProps = React.OlHTMLAttributes<HTMLOListElement> &
  MarkdownNodeProp & {
    ordered?: boolean;
    children?: React.ReactNode;
  };

type LiProps = React.LiHTMLAttributes<HTMLLIElement> &
  MarkdownNodeProp & {
    ordered?: boolean;
    children?: React.ReactNode;
  };

type PProps = React.HTMLAttributes<HTMLParagraphElement> &
  MarkdownNodeProp & {
    children?: React.ReactNode;
  };

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

function headingFactory<L extends HeadingLevel>(level: L) {
  // formulaic scale: base (h1) and ratio (multiply previous by ratio for next)
  const base = 1.4; // rem for h1
  const ratio = 0.85; // multiply previous size by this to get next
  const sizes = Array.from({ length: 6 }, (_, i) => Number((base * Math.pow(ratio, i)).toFixed(4)));
  const mbs = ['my-[2.2]', 'my-[1.8]', 'my-[1.4]', 'my-[1.2]', 'my-[1]', 'my-[1]'];

  const Heading: React.FC<React.HTMLAttributes<HTMLHeadingElement> & MarkdownNodeProp> =
    function MarkdownHeading({ children, className, style, node, ...props }) {
      void node;
      const weight = level === 1 ? 'font-bold' : 'font-semibold';
      const classStr = cn('scroll-m-20', weight, mbs[level - 1], className);
      const Tag = `h${level}` as `h${L}`;
      const fontSize = sizes[level - 1];
      const mergedStyle = { ...(style || {}), fontSize: `${fontSize}rem` } as React.CSSProperties;
      return React.createElement(
        Tag,
        { className: classStr, style: mergedStyle, ...props },
        children
      );
    };

  Heading.displayName = `SafeMarkdownHeading${level}`;
  return Heading;
}

const components: Components = {
  a: function MarkdownLink({ children, href, node, ...props }: LinkProps) {
    void node;
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="underline underline-offset-2"
        {...props}
      >
        {children}
      </a>
    );
  },
  pre: function MarkdownPre({ children, className, node, ...props }: PreProps) {
    void node;
    return (
      <pre
        className={cn(
          'rounded-md bg-muted/60 p-3 text-xs leading-tight font-mono whitespace-pre-wrap',
          className
        )}
        {...props}
      >
        {children}
      </pre>
    );
  },
  code: function MarkdownCode({ children, className, inline, node, ...props }: CodeProps) {
    void node;
    const isInline = inline === true;
    const codeClass = isInline
      ? cn('font-mono font-bold leading-tight rounded bg-muted/60 px-1 py-0.5', className)
      : cn(
          'font-mono font-bold leading-tight whitespace-pre-wrap break-words text-[1.2em]',
          className
        );

    return (
      <code className={codeClass} {...props}>
        {children}
      </code>
    );
  },
  ul: function MarkdownUl({ children, ordered, node, ...props }: UlProps) {
    void ordered;
    void node;
    return (
      <ul className="list-disc pl-5" {...props}>
        {children}
      </ul>
    );
  },
  ol: function MarkdownOl({ children, ordered, node, ...props }: OlProps) {
    void ordered;
    void node;
    return (
      <ol className="list-decimal pl-5" {...props}>
        {children}
      </ol>
    );
  },
  li: function MarkdownLi({ children, ordered, node, ...props }: LiProps) {
    void ordered;
    void node;
    return (
      <li className="my-1 font-semibold" {...props}>
        {children}
      </li>
    );
  },
  p: function MarkdownP({ children, node, ...props }: PProps) {
    void node;
    return (
      <p className="my-2 font-semibold" {...props}>
        {children}
      </p>
    );
  },
  h1: headingFactory(1),
  h2: headingFactory(2),
  h3: headingFactory(3),
  h4: headingFactory(4),
  h5: headingFactory(5),
  h6: headingFactory(6),
};

export function SafeMarkdown({ content }: { content?: string }) {
  if (!content) return null;

  type MarkdownProps = React.ComponentProps<typeof ReactMarkdown>;
  const rehypePlugins = [
    rehypeHighlight,
    [rehypeSanitize, sanitizeSchema],
  ] as unknown as MarkdownProps['rehypePlugins'];

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
}
