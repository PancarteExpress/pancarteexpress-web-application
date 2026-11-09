import { Button, Heading, Section, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

export interface WelcomeEmailProps {
  greeting: string;
  body: string;
  cta: string;
  dashboardUrl: string;
  locale: 'fr' | 'en';
  pickupTitle: string;
  /** Récapitulatif du ramassage ; vide = section masquée */
  pickupDetails: string[];
}

export default function WelcomeEmail({ greeting, body, cta, dashboardUrl, locale, pickupTitle, pickupDetails }: WelcomeEmailProps) {
  return (
    <EmailLayout preview={body} locale={locale}>
      <Heading as="h1" style={heading}>{greeting}</Heading>
      <Text style={text}>{body}</Text>
      {pickupDetails.length > 0 && (
        <Section style={pickupBox}>
          <Text style={pickupHeading}>{pickupTitle}</Text>
          {pickupDetails.map((line) => (
            <Text key={line} style={pickupText}>{line}</Text>
          ))}
        </Section>
      )}
      <Button href={dashboardUrl} style={button}>{cta}</Button>
    </EmailLayout>
  );
}

// Données d'exemple pour `npm run email`
WelcomeEmail.PreviewProps = {
  greeting: 'Bonjour Ana,',
  body: 'Votre compte a bien été créé. Vous pouvez dès maintenant faire vos demandes de service depuis votre tableau de bord.',
  cta: 'Accéder à mon tableau de bord',
  dashboardUrl: 'http://localhost:3000/fr/dashboard',
  locale: 'fr',
  pickupTitle: 'Votre matériel',
  pickupDetails: ['Nous ramasserons votre matériel au 200 Boulevard Lebeau, Montréal, H4N 1R4.'],
} satisfies WelcomeEmailProps;

const heading = { color: '#092E5B', fontSize: '22px', margin: '0 0 16px' };
const text = { color: '#111827', fontSize: '15px', lineHeight: '24px' };
const pickupBox = { backgroundColor: '#F4F6F9', borderRadius: '6px', padding: '4px 16px', margin: '0 0 24px' };
const pickupHeading = { color: '#092E5B', fontSize: '15px', fontWeight: 600, margin: '12px 0 4px' };
const pickupText = { color: '#111827', fontSize: '14px', lineHeight: '22px', margin: '4px 0 12px' };
const button = {
  backgroundColor: '#0E4D9A',
  color: '#FFFFFF',
  padding: '12px 20px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: 600,
};
