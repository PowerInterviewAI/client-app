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

type StrongProps = React.HTMLAttributes<HTMLElement> &
  MarkdownNodeProp & {
    children?: React.ReactNode;
  };

type EmProps = React.HTMLAttributes<HTMLElement> &
  MarkdownNodeProp & {
    children?: React.ReactNode;
  };

type DelProps = React.HTMLAttributes<HTMLElement> &
  MarkdownNodeProp & {
    children?: React.ReactNode;
  };

type BlockquoteProps = React.BlockquoteHTMLAttributes<HTMLQuoteElement> &
  MarkdownNodeProp & {
    children?: React.ReactNode;
  };

type HrProps = React.HTMLAttributes<HTMLHRElement> & MarkdownNodeProp;

type TableProps = React.TableHTMLAttributes<HTMLTableElement> &
  MarkdownNodeProp & {
    children?: React.ReactNode;
  };

type CellProps = React.ThHTMLAttributes<HTMLTableCellElement> &
  MarkdownNodeProp & {
    children?: React.ReactNode;
  };

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

// Block code is the only `code` that hast nests inside a `pre`, and react-markdown stopped passing
// an `inline` flag - so the parent element is what tells the two apart. Read as context rather than
// sniffed off the className, which is absent on a fence opened without a language.
const InsidePre = React.createContext(false);

function headingFactory<L extends HeadingLevel>(level: L) {
  // Scaled against the 0.875rem card body, not a document: an answer that opens with a heading
  // should read as a heading without taking over the panel. h5/h6 land at body size and lean on
  // weight alone.
  const sizes = [1.125, 1.0625, 1, 0.9375, 0.875, 0.875];
  const margins = [
    'mt-4 mb-2',
    'mt-4 mb-2',
    'mt-3 mb-1.5',
    'mt-3 mb-1.5',
    'mt-2 mb-1',
    'mt-2 mb-1',
  ];

  const Heading: React.FC<React.HTMLAttributes<HTMLHeadingElement> & MarkdownNodeProp> =
    function MarkdownHeading({ children, className, style, node, ...props }) {
      void node;
      const classStr = cn(
        'scroll-m-20 font-semibold text-foreground first:mt-0',
        margins[level - 1],
        className
      );
      const Tag = `h${level}` as `h${L}`;
      const mergedStyle = {
        ...(style || {}),
        fontSize: `${sizes[level - 1]}rem`,
      } as React.CSSProperties;
      return React.createElement(
        Tag,
        { dir: 'auto', className: classStr, style: mergedStyle, ...props },
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
      <InsidePre.Provider value={true}>
        <pre
          // Forced, not `auto`. Code is left-to-right in every language - the prompts say so
          // explicitly - and an RTL comment or string literal inside a fence is enough to flip
          // the block's resolved direction and reorder the brackets around it.
          dir="ltr"
          className={cn(
            'my-2 rounded-md bg-muted/60 p-3 text-[0.8125rem] leading-snug font-mono whitespace-pre-wrap',
            className
          )}
          {...props}
        >
          {children}
        </pre>
      </InsidePre.Provider>
    );
  },
  code: function MarkdownCode({ children, className, node, ...props }: CodeProps) {
    void node;
    const isBlock = React.useContext(InsidePre);

    // Neither form is bolded: the mono face and the chip already separate code from prose, and a
    // heavier weight on a block only muddies the syntax colours highlight.js paints over it.
    const codeClass = isBlock
      ? cn('font-mono whitespace-pre-wrap wrap-break-word', className)
      : cn(
          'font-mono text-[0.9em] rounded bg-muted/60 px-1 py-0.5 wrap-break-word text-foreground',
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
      <ul
        dir="auto"
        className="my-1.5 list-disc pl-5 marker:text-muted-foreground first:mt-0"
        {...props}
      >
        {children}
      </ul>
    );
  },
  ol: function MarkdownOl({ children, ordered, node, ...props }: OlProps) {
    void ordered;
    void node;
    return (
      <ol
        dir="auto"
        className="my-1.5 list-decimal pl-5 marker:text-muted-foreground first:mt-0"
        {...props}
      >
        {children}
      </ol>
    );
  },
  li: function MarkdownLi({ children, ordered, node, ...props }: LiProps) {
    void ordered;
    void node;
    return (
      <li dir="auto" className="my-1" {...props}>
        {children}
      </li>
    );
  },
  // Body copy carries no weight of its own. It used to be semibold, which left `**bold**` - the
  // headline the hint-only prompt puts on line 1, and any emphasis a model reaches for - with
  // one step of contrast against a page already at 600, so nothing in a card stood out. Regular
  // body is what makes the `strong` below legible as emphasis.
  p: function MarkdownP({ children, node, ...props }: PProps) {
    void node;
    return (
      <p dir="auto" className="my-2 first:mt-0 last:mb-0" {...props}>
        {children}
      </p>
    );
  },
  // Emphasis is what the prompts now spend on the words an answer turns on, so both marks are
  // declared here rather than left to the UA defaults: the default `bolder` resolves against
  // whatever weight it inherits rather than a fixed one, and italic alone is a weak signal at
  // 0.875rem on a dark card. The pair is deliberately asymmetric - bold carries weight,
  // italic carries slant plus a step down in colour - so a bolded term and an italicised caveat
  // read as two different kinds of emphasis rather than two flavours of "important".
  strong: function MarkdownStrong({ children, node, ...props }: StrongProps) {
    void node;
    return (
      <strong className="font-semibold text-foreground" {...props}>
        {children}
      </strong>
    );
  },
  em: function MarkdownEm({ children, node, ...props }: EmProps) {
    void node;
    return (
      <em className="italic text-foreground/85" {...props}>
        {children}
      </em>
    );
  },
  del: function MarkdownDel({ children, node, ...props }: DelProps) {
    void node;
    return (
      <del className="line-through text-muted-foreground" {...props}>
        {children}
      </del>
    );
  },
  blockquote: function MarkdownBlockquote({ children, node, ...props }: BlockquoteProps) {
    void node;
    return (
      <blockquote
        dir="auto"
        className="my-2 border-l-2 border-border pl-3 text-muted-foreground italic"
        {...props}
      >
        {children}
      </blockquote>
    );
  },
  hr: function MarkdownHr({ node, ...props }: HrProps) {
    void node;
    return <hr className="my-3 border-border" {...props} />;
  },
  // A wide table is the one construct that can push the card past the panel width, so it scrolls
  // in a box of its own rather than widening its parent.
  table: function MarkdownTable({ children, node, ...props }: TableProps) {
    void node;
    return (
      <div className="my-2 max-w-full overflow-x-auto">
        <table className="w-full border-collapse text-left text-[0.8125rem]" {...props}>
          {children}
        </table>
      </div>
    );
  },
  th: function MarkdownTh({ children, node, ...props }: CellProps) {
    void node;
    return (
      <th
        dir="auto"
        className="border border-border bg-muted/50 px-2 py-1 font-semibold"
        {...props}
      >
        {children}
      </th>
    );
  },
  td: function MarkdownTd({ children, node, ...props }: CellProps) {
    void node;
    return (
      <td dir="auto" className="border border-border px-2 py-1 align-top" {...props}>
        {children}
      </td>
    );
  },
  h1: headingFactory(1),
  h2: headingFactory(2),
  h3: headingFactory(3),
  h4: headingFactory(4),
  h5: headingFactory(5),
  h6: headingFactory(6),
};

/**
 * Every block element above carries `dir="auto"`, and that is what makes an Arabic or Hebrew
 * answer readable rather than merely present.
 *
 * The panels are laid out left-to-right, so without it an RTL paragraph inherits an LTR base
 * direction: the run itself still reads right-to-left, but the sentence-final punctuation is a
 * neutral and takes the *paragraph's* direction, so it is placed at the wrong end of the line.
 * Mixed content - and a technical answer is always mixed, since the prompts keep product names
 * and code in Latin script - reorders around it.
 *
 * Per block rather than once on a wrapper: `auto` resolves from the first strong character it
 * contains, so one wrapper would let an answer that opens on "React" set the direction for every
 * paragraph under it. Blocks are the unit the bidi algorithm works in anyway.
 *
 * It is a no-op for the languages that shipped before the picker: `auto` on Latin text resolves
 * to the `ltr` those blocks already inherited.
 */
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
