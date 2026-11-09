import type { ReactNode } from 'react';
import { Body, Container, Head, Hr, Html, Preview, Section, Text } from '@react-email/components';
import { CONTACT } from '@/shared/constants/contact';
import { EmailHeader } from './EmailHeader';

interface EmailLayoutProps {
  /** Texte d'aperçu affiché dans la boîte de réception, à côté du sujet */
  preview: string;
  locale: 'fr' | 'en';
  children: ReactNode;
}

export function EmailLayout({ preview, locale, children }: EmailLayoutProps) {
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <EmailHeader />
          <Section style={content}>
            {children}
            <Hr />
            <Text style={footer}>
              Pancarte Express · {CONTACT.mainPhone} · {CONTACT.infoEmail}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: '#F4F6F9',
  fontFamily: 'Inter, Arial, Helvetica, sans-serif',
  margin: 0,
  padding: '24px 0',
};

const container = {
  backgroundColor: '#FFFFFF',
  maxWidth: '600px',
  margin: '0 auto',
  borderRadius: '8px',
  overflow: 'hidden' as const,
};

const content = {
  padding: '32px',
};

const footer = {
  color: '#6B7280',
  fontSize: '12px',
};
