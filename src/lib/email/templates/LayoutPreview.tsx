import { Text } from '@react-email/components';
import { EmailLayout } from '../components/EmailLayout';

// Gabarit d'aperçu pour `npm run email` : à supprimer quand les vrais courriels utiliseront EmailLayout
export default function LayoutPreview() {
  return (
    <EmailLayout preview="Aperçu de l'en-tête" locale="fr">
      <Text>Contenu du courriel</Text>
    </EmailLayout>
  );
}
