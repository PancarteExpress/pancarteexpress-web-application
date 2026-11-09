import { Fragment } from 'react';
import { Heading, Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

export interface TextEmailProps {
  title: string;
  /** Mêmes sections que la version texte : chaque section est un paragraphe, chaque ligne un retour à la ligne */
  sections: string[][];
  locale: 'fr' | 'en';
}

// Gabarit générique pour les courriels faits de lignes de texte (reçus, notifications internes)
export default function TextEmail({ title, sections, locale }: TextEmailProps) {
  return (
    <EmailLayout preview={title} locale={locale}>
      <Heading as="h1" style={heading}>{title}</Heading>
      {sections.map((lines, i) => (
        <Text key={i} style={text}>
          {lines.map((line, j) => (
            <Fragment key={j}>
              {j > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </Text>
      ))}
    </EmailLayout>
  );
}

// Données d'exemple pour `npm run email`
TextEmail.PreviewProps = {
  title: 'Commande n° 1042',
  sections: [
    ['Client : Ana Tremblay', 'Courriel : ana@example.com'],
    ['Produits :', '- Pancarte 24x36 ×2 : 90,00 $', '', 'Total : 103,48 $'],
  ],
  locale: 'fr',
} satisfies TextEmailProps;

const heading = { color: '#092E5B', fontSize: '20px', margin: '0 0 16px' };
// pre-wrap conserve l'indentation des détails grand format
const text = { color: '#111827', fontSize: '14px', lineHeight: '22px', whiteSpace: 'pre-wrap' as const };
