import { createElement } from 'react';
import { render } from '@react-email/render';
import TextEmail, { type TextEmailProps } from './templates/TextEmail';

/** HTML du gabarit commun pour un courriel fait de sections de texte (le texte brut reste construit à part) */
export function renderTextEmail(props: TextEmailProps): Promise<string> {
  return render(createElement(TextEmail, props));
}
