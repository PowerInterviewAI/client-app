import React from 'react';

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
}

export default function ExternalLink({ href, children, className, ...rest }: ExternalLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    try {
      e.preventDefault();
      const url = href;
      if (window?.electronAPI?.openExternal) {
        window.electronAPI.openExternal(url).catch(() => window.open(url, '_blank', 'noopener'));
      } else {
        window.open(url, '_blank', 'noopener');
      }
      // eslint-disable-next-line
    } catch (err) {
      window.open(href, '_blank', 'noopener');
    }
  };

  return (
    <a href={href} onClick={handleClick} className={className} rel="noopener noreferrer" {...rest}>
      {children}
    </a>
  );
}
