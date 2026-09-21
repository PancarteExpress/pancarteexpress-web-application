'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { getActivePath } from '../utils/pathname';

import { ReactNode } from 'react';

interface LocalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  [key: string]: string | ReactNode | undefined;
}

export function LocalLink({ href, children, ...props }: LocalLinkProps) {
    const locale = useLocale();
    const localizedHref = `/${locale}${href}`;

    const pathname = usePathname();
    const activePath = getActivePath(pathname);
    const isActive = (path: string) => activePath === path;
  
    return <Link href={localizedHref} {...props} style={{ color: isActive(href) ? '#0E4D98' : 'black' }}>{children}</Link>;
}