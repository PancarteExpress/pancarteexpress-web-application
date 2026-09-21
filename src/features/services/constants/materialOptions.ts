import { MaterialConfig } from "../types/materials";

export const MATERIAL_CONFIGS: Record<string, MaterialConfig> = {
  frames: {
    label: 'DÉTAILS DES PANCARTES',
    fields: [
      { key: 'pickup', label: 'Devons-nous aller chercher le matériel (Pancartes, Ancrages, Poteaux) a une autre adresse?', type: 'radio' },
      { key: 'address', label: 'Adresse du pickup', type: 'address' },
      { key: 'quantity', label: 'Combien de pancartes voulez-vous installer ?', type: 'number' },
      { key: 'rentAddons', label: 'Voulez vous louer un ajout pour cette pancarte ?', type: 'radio' },
    ]
  },

  addonsOpenHouse: {
    label: 'DÉTAILS DE L\'AJOUT VISITE LIBRE',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'address', label: 'Adresse du pickup', type: 'address' },
      { key: 'openHouseDetails', label: 'Veuillez indiquer la date et l horaire de la visite libre ', type: 'addonsOpenHouse' },
      { key: 'quantity', label: 'Combien en avez vous besoin d installer ?', type: 'number' },
      { key: 'details', label: 'Veuillez indiquer l emplacement de la pancarte sur laqulle mettre la visite libre ', type: 'textarea' }
    ]
  },
  
  anchors: {
    label: 'DÉTAILS DES ANCRAGES',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'address', label: 'Adresse du pickup', type: 'address' },
      { key: 'quantity', label: 'Combien d ancrages voulez-vous installer ?', type: 'number' },
      { key: 'details', label: 'Veuillez indiquer l emplacement d installation de lancrages #', type: 'textarea' },
    ]
  },
  
  poles: {
    label: 'DÉTAILS DES POTEAUX',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'address', label: 'Adresse du pickup', type: 'address' },
      { key: 'quantity', label: 'Combien de poteaux voulez-vous installer ?', type: 'number' },
      { key: 'details', label: 'Veuillez indiquer l emplacement d installation du poteau #', type: 'textarea' },
    ]
  },
  
  addons: {
    label: 'DÉTAILS DES AJOUT GENERAUX',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'address', label: 'Adresse du pickup', type: 'address' },
      { key: 'quantity', label: 'Combien en avez vous besoin d installer ?', type: 'number' },
      { key: 'addons', label: 'Veuillez choisir les ajouts souhaitee pour la pancarte # ', type: 'addons' },
      { key: 'details', label: 'Veuillez indiquer l emplacement de la pancarte sur laqulle mettre l ajout ', type: 'textarea' }
    ]
  },
  
  keybox: {
    label: 'DÉTAILS DES BOITES A CLES',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'address', label: 'Adresse du pickup', type: 'address' },
      { key: 'password', label: 'Veuillez indiquer le code des boîtes à clé', type: 'textarea' },
      { key: 'quantity', label: 'Combien de boites a cles voulez-vous installer ?', type: 'number' },
      { key: 'details', label: 'Veuillez indiquer l emplacement d installation de la boites a cle #', type: 'textarea' },
    ]
  },
  
  flags: {
    label: 'DÉTAILS DES DRAPEAUX',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'address', label: 'Adresse du pickup', type: 'address' },
      { key: 'quantity', label: 'Combien de drapeau voulez-vous installer ?', type: 'number' },
      { key: 'details', label: 'Veuillez indiquer l emplacement d installation du drapeau #', type: 'textarea' },
    ]
  },
  
  directional: {
    label: 'DÉTAILS DES DIRECTIONNELLES',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'address', label: 'Adresse du pickup', type: 'address' },
      { key: 'quantity', label: 'Combien de directionnelle voulez-vous installer ?', type: 'number' },
      { key: 'details', label: 'Veuillez indiquer l emplacement d installation de la directionnelle #', type: 'textarea' },
    ]
  },
  
  other: {
    label: 'INSTRUCTIONS SPECIAL',
    fields: [
      { key: 'details', label: 'Veuillez preciser vos besoins d\'installation', type: 'textarea' },
    ]
  },
};