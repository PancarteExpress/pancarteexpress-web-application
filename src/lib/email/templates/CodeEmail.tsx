import { Heading, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

export interface CodeEmailProps {
  code: string;
  heading: string;
  intro: string;
  expiry: string;
  locale: 'fr' | 'en';
}

export default function CodeEmail({ code, heading, intro, expiry, locale }: CodeEmailProps) {
  return (
    <EmailLayout preview={`${intro} ${code}`} locale={locale}>
      <Heading as="h1" style={title}>{heading}</Heading>
      <Text style={text}>{intro}</Text>
      <Text style={codeStyle}>{code}</Text>
      <Text style={muted}>{expiry}</Text>
    </EmailLayout>
  );
}

// Données d'exemple pour `npm run email`
CodeEmail.PreviewProps = {
  code: '123456',
  heading: 'Vérifiez votre adresse courriel',
  intro: 'Votre code de vérification est :',
  expiry: 'Ce code expire dans 15 minutes.',
  locale: 'fr',
} satisfies CodeEmailProps;

const title = { color: '#092E5B', fontSize: '22px', margin: '0 0 16px' };
const text = { color: '#111827', fontSize: '15px' };
const codeStyle = {
  color: '#0E4D9A',
  fontSize: '32px',
  fontWeight: 700,
  letterSpacing: '6px',
  textAlign: 'center' as const,
  backgroundColor: '#F4F6F9',
  borderRadius: '6px',
  padding: '16px 0',
};
const muted = { color: '#6B7280', fontSize: '13px' };
