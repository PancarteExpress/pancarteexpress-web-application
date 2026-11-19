'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { getActivePath } from '../utils/pathname';

type LocalLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
  activeClassName?: string;
};

export function LocalLink({ href, className, activeClassName, children, ...props }: LocalLinkProps) {
  const locale = useLocale();
  const pathname = usePathname();

  const localizedHref = href === '/' ? `/${locale}` : `/${locale}${href}`;
  const isActive = getActivePath(pathname) === href;

  const classes = [className, isActive && activeClassName].filter(Boolean).join(' ');

  return (
    <Link
      href={localizedHref}
      className={classes || undefined}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </Link>
  );
}