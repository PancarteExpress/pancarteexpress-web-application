import { describe, expect, it } from 'vitest';
import { buildServiceNotes } from './notes';

describe('buildServiceNotes', () => {
  it('suit l\'ordre : installation, livraison, récupération, correction, ramassage', () => {
    expect(buildServiceNotes(['pickup', 'correction', 'removal', 'delivery', 'installation']))
      .toBe('INSTALLATION + LIVRER + RECUP + CORRECTION + PICK UP');
  });

  it('chaque service une seule fois', () => {
    expect(buildServiceNotes(['removal', 'installation', 'removal'])).toBe('INSTALLATION + RECUP');
  });

  it('aucun service : texte vide', () => {
    expect(buildServiceNotes([])).toBe('');
  });
});
