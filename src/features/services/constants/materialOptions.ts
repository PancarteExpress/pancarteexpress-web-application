import { MaterialConfig } from "../types/materials";

export const MATERIAL_CONFIGS: Record<string, MaterialConfig> = {
  anchors: {
    label: 'DÉTAILS DES ANCRAGES',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'quantity', label: 'Combien d ancrages voulez-vous installer ?', type: 'number' },
      { key: 'placements', label: 'Veuillez indiquer l emplacement d installation de lancrages #', type: 'textarea' },
    ]
  },
  
  poles: {
    label: 'DÉTAILS DES POTEAUX',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'quantity', label: 'Combien de poteaux voulez-vous installer ?', type: 'number' },
      { key: 'placements', label: 'Veuillez indiquer l emplacement d installation du poteau #', type: 'textarea' },
    ]
  },
  
  flags: {
    label: 'DÉTAILS DES DRAPEAUX',
    fields: [
      /*{ key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'pickupAddress', label: 'Adresse du pickup', type: 'address' },
      { key: 'quantity', label: 'Combien de drapeau voulez-vous installer ?', type: 'number' },
      { key: 'placements', label: 'Veuillez indiquer l emplacement d installation du drapeau #', type: 'textarea' },*/
      { key: 'choice_rent_sold', label: 'Choisissez le type de drapeau desirer', type: 'radio' },
      { key: 'quantity_new', label: 'Combien voulez-vous installer ?', type: 'number' },
      { key: 'intersections', label: 'Veuillez indiquer l emplacement d installation du drapeau #', type: 'textarea' },
    ]
  },
  
  directional: {
    label: 'DÉTAILS DES DIRECTIONNELLES',
    fields: [
      /*{ key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'pickupAddress', label: 'Adresse du pickup', type: 'address' },
      { key: 'quantity', label: 'Combien de directionnelle voulez-vous installer ?', type: 'number' },
      { key: 'placements', label: 'Veuillez indiquer l emplacement d installation de la directionnelle #', type: 'textarea' },*/
      { key: 'choice_rent_sold', label: 'Choisissez le type de directionnelle desirer', type: 'radio' },
      { key: 'quantity_new', label: 'Combien voulez-vous installer ?', type: 'number' },
      { key: 'intersections', label: 'Veuillez indiquer l emplacement d installation de la directionnelle #', type: 'textarea' },
    ]
  },

  keybox: {
    label: 'DÉTAILS DES BOITES A CLES',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'password', label: 'Veuillez indiquer le code des boîtes à clé', type: 'textarea' },
      { key: 'quantity', label: 'Combien de boites a cles voulez-vous installer ?', type: 'number' },
      { key: 'placements', label: 'Veuillez indiquer l emplacement d installation de la boites a cle #', type: 'textarea' },
    ]
  },

  frames: {
    label: 'DÉTAILS DES PANCARTES',
    fields: [
      { key: 'pickup', label: 'Devons-nous aller chercher le matériel (Pancartes, Ancrages, Poteaux) a une autre adresse?', type: 'radio' },
      { key: 'quantity_new', label: 'Combien de pancartes voulez-vous installer ?', type: 'number' },
      /*{ key: 'rentAddons', label: 'Voulez vous louer un ajout pour cette pancarte ?', type: 'radio' },*/
      { key: 'placements', label: 'Veuillez indiquer l emplacement d installation de la pancarte #', type: 'textarea' }, // ne sert a rien
    ]
  },

  addonsOpenHouse: {
    label: 'DÉTAILS DE L\'AJOUT VISITE LIBRE',
    fields: [
      { key: 'toRent', label: 'Devons-nous vous louer le materiel necessaire pour la visite libre?', type: 'radio' },
      /*{ key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'address', label: 'Adresse du pickup', type: 'address' },*/
      { key: 'quantity_direct', label: 'Combien de directionnelle avez vous besoin ?', type: 'number' },
      { key: 'quantity_flag', label: 'Combien de drapeau avez vous besoin ?', type: 'number' },
      { key: 'quantity_openHouse', label: 'Combien de visite libre avez vous besoin ?', type: 'number' },
      /*{ key: 'placements', label: 'Veuillez indiquer l emplacement de la pancarte sur laqulle mettre la visite libre ', type: 'textarea' },*/
      { key: 'openHouseDetails', label: 'Veuillez indiquer la date et l horaire de la visite libre ', type: 'addonsOpenHouse' },
      { key: 'removeNextMonday', label: 'Devons-nous vous retirer tout le materiel de la visite libre le lundi qui suit?', type: 'radio' },
      
    ]
  },

  addons: {
    label: 'DÉTAILS DES AJOUT GENERAUX',
    fields: [
      /*{ key: 'toRent', label: 'Devons-nous vous louer le materiel?', type: 'radio' },
      { key: 'pickup', label: 'Devons-nous aller chercher le materiel a une autre adresse?', type: 'radio' },
      { key: 'pickupAddress', label: 'Adresse du pickup', type: 'address' },
      { key: 'quantity', label: 'Combien en avez vous besoin d installer ?', type: 'number' },
      { key: 'addons', label: 'Veuillez choisir les ajouts souhaitee pour la pancarte # ', type: 'addons' },*/
      { key: 'addonType', label: 'Veuillez choisir l ajout souhaite', type: 'addons' },
      
    ]
  },

  other: {
    label: 'INSTRUCTIONS SPECIAL',
    fields: [
      { key: 'specialNeeds', label: 'Veuillez preciser vos besoins d\'installation', type: 'textarea' },
    ]
  },
};