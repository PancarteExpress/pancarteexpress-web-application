'use client'

import AddressAutocomplete from '@/shared/components/addressAutocomplete/AddressAutocomplete';
import { MATERIAL_CONFIGS } from '../../constants/materialOptions';
import styles from './materialDetailsForm.module.css';
import { ADDONS_LIST } from '../../constants/addonsOptions';
import OpenHouseAddon from '../openHouseAddon/openHouseAddon';
import {
  format,
} from 'date-fns';

interface Props {
  material: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (data: any) => void;
}

export default function MaterialDetailsForm({ material, data, onChange }: Props) {
  
  const config = MATERIAL_CONFIGS[material];

  if (!config) {
    console.log(`No config for ${material}`);
    return null;
  }

  const handleChange = (key: string, value: unknown) => {
  const newData = { ...data, [key]: value ?? (key === 'pickup' ? null : false) };
  
  if (material === 'frames' && key === 'quantity') {
    const qty = parseInt(value as string) || 1;
    const diff = Math.max(0, qty - (data?.addons?.length || 0));
    
    newData.rentAddons = [
      ...(data?.rentAddons || []),
      ...Array(diff).fill(false)
    ];
    newData.addons = [
      ...(data?.addons || []),
      ...Array.from({ length: diff }, () => ({}))
    ];
  }
  
  onChange(newData);
};

  const handleRadioChange = (key: string, value: boolean) => {
    const newData = { ...data, [key]: value };
    if (key === 'pickup' && !value) {
      newData.address = '';
    }
    onChange(newData);
  };

  return (
    <fieldset className={styles.fieldset}>
      <legend>{config.label}</legend>

      {config.fields.map(field => (
        <div key={field.key}>
          {field.key === 'toRent' && (<>
            <div className={styles.radioGroup}>
              <label>
                <span>{field.label}</span>
              </label>

              <div className={styles.buttons}>
                <button type="button" className={data?.[field.key] ? styles.active : ''} onClick={() => handleRadioChange(field.key, true)}>
                  Oui
                </button>

                <button type="button" className={!data?.[field.key] ? styles.active : ''} onClick={() => handleRadioChange(field.key, false)}>
                  Non
                </button>
              </div>
            </div>
          </>)}
          
          {((material !== 'frames' && data?.toRent === false) || material === 'frames') && field.key === 'pickup' && (<>
          
            <div className={styles.radioGroup}>
              <label>
                <span>{field.label}</span>
              </label>

              <div className={styles.buttons}>
                <button type="button" className={data?.[field.key] ? styles.active : ''} onClick={() => handleRadioChange(field.key, true)}>
                  Oui
                </button>

                <button type="button" className={!data?.[field.key] ? styles.active : ''} onClick={() => handleRadioChange(field.key, false)}>
                  Non
                </button>
              </div>
            </div>

            {data?.[field.key] === true && (
            <div className={styles.pickup}>
              <label>Un montant supplementaire base sur la distance de deplacement sera applique</label>
              <AddressAutocomplete
                id={`${material}-pickupaddress`}
                value={data?.pickupAddress || ''} 
                onChange={(addr) => handleChange('pickupAddress', addr)} 
              />
            </div>
            )}
          </>)}

          {field.key === 'password' &&
          <div className={styles.specialInstructions}>
            <label htmlFor={field.key}>{field.label}</label>
            <input
              id={field.key}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={data?.[field.key] || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                handleChange(field.key, value);
              }}
              onKeyDown={(e) => {
                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              placeholder="Entrez le code ici..."
            />
          </div>
          }

          {field.key === 'quantity' && (<>
          <div className={styles.radioGroup}>
            <label>{field.label}</label>
            <input id="framesQuantity" type="number" inputMode="numeric" min={1} max={3} value={data?.quantity || ''} onChange={(e) => handleChange('quantity', e.target.value)}
              onKeyDown={(e) => {
                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
            />
          </div>
          </>)}

          {material !== 'frames' && field.key === 'placements' && (<>
          {Array.from({ length: data?.quantity || 1 }).map((_, i) => (
          <div key={`placement-${i}`} className={styles.specialInstructions}>
            <label htmlFor={field.key}>{field.label} {i + 1}</label>
            <textarea
              id={`${field.key}-${i}`}
              value={data?.placements?.[i]?.placement || ''}
              onChange={(e) => {
                const newPlacement = [...(data?.placements || [])];
                newPlacement[i] = {
                  ...newPlacement[i],
                  placement: e.target.value
                };
                handleChange('placements', newPlacement);
              }}
              placeholder="Entrez vos instructions ici..."
              rows={4}
            />
          </div>
          ))}
          </>)}

          {field.key === 'rentAddons' && (<>
            {Array.from({ length: data?.quantity || 1 }).map((_, i) => (
            <div key={`addon-${i}`} className={styles.addonSection}>
              <div className={styles.radioGroup}>

                <label>
                  {field.label} {i + 1}
                </label>

                <div className={styles.buttons}>
                  <button 
                    type="button" 
                    className={data?.rentAddons?.[i] === true ? styles.active : ''} 
                    onClick={() => {
                      const newAddons = [...(data?.rentAddons || Array(data?.quantity || 1).fill(false))];
                      newAddons[i] = true;
                      handleChange('rentAddons', newAddons);
                    }}
                  >
                    Oui
                  </button>

                  <button 
                    type="button" 
                    className={data?.rentAddons?.[i] !== true ? styles.active : ''} 
                    onClick={() => {
                      const newAddons = [...(data?.rentAddons || Array(data?.quantity || 1).fill(false))];
                      newAddons[i] = false;
                      handleChange('rentAddons', newAddons);
                    }}
                  >
                    Non
                  </button>
                </div>
                
                {data?.rentAddons?.[i] === true && (
                <div className={styles.checkboxGroup}>
                  <label>Quel ajouts voulez-vous sur votre pancarte {i + 1}?</label>
                  <div className={styles.addonsItem}>
                    {ADDONS_LIST.map(addon => (
                      <label key={addon.key} className={addon.key in (data?.addons?.[i] || {}) ? styles.active : ''}>
                        <input
                          type="checkbox"
                          checked={addon.key in (data?.addons?.[i] || {}) || false}
                          onChange={(e) => {
                            
                            const newAddons = [...(data?.addons || [])];
                            const items = { ...(newAddons[i] || {}) };
                            
                            if (e.target.checked) {
                              if (addon.key === 'other') {
                                items[addon.key] = [''];
                              } else if (addon.key === 'customAddon') {
                                items[addon.key] = [''];
                              }else if (addon.key === 'openHouse') {
                                items[addon.key] = {
                                  selectedDate: format(new Date(), 'yyyy-MM-dd'),
                                  startTime: '09:00',
                                  endTime: '11:00',
                                };
                              } else {
                                items[addon.key] = true;
                              }
                            } else {
                              delete items[addon.key];
                            }
                            
                            newAddons[i] = items;
                            handleChange('addons', newAddons);
                          }}
                        />
                        {addon.label}
                      </label>
                    ))}
                  </div>

                  {data?.addons?.[i]?.openHouse && (
                    <OpenHouseAddon
                      data={data?.addons?.[i]?.openHouse || {
                        selectedDate: format(new Date(), 'yyyy-MM-dd'),
                        startTime: '09:00',
                        endTime: '11:00',
                      }}
                      onChange={(openHouseData) => {
                        const newAddons = [...(data?.addons || [])];
                        newAddons[i] = {
                          ...newAddons[i],
                          openHouse: openHouseData,
                        };
                        handleChange('addons', newAddons);
                      }}
                    />
                  )}

                  {data?.addons?.[i]?.customAddon && (
                    <div className={styles.specialInstructions}>
                      <label htmlFor={`customAddon-${i}`}>Donnez nous de details sur votre ajout personnaliser...</label>
                      <textarea
                        id={`customAddon-${i}`}
                        value={data?.addons?.[i]?.customAddon || ''}
                        onChange={(e) => {
                          const newAddons = [...(data?.addons || [])];
                          newAddons[i] = {
                            ...newAddons[i],
                            customAddon: e.target.value
                          };
                          handleChange('addons', newAddons);
                        }}
                        placeholder="Entrez les détails ici..."
                        rows={4}
                      />
                    </div>
                  )}

                  {data?.addons?.[i]?.other && (
                    <div className={styles.specialInstructions}>
                      <label htmlFor={`otherAddon-${i}`}>Donnez nous de details sur autre...</label>
                      <textarea
                        id={`otherAddon-${i}`}
                        value={data?.addons?.[i]?.other || ''}
                        onChange={(e) => {
                          const newAddons = [...(data?.addons || [])];
                          newAddons[i] = {
                            ...newAddons[i],
                            other: e.target.value
                          };
                          handleChange('addons', newAddons);
                        }}
                        placeholder="Entrez les détails ici..."
                        rows={4}
                      />
                    </div>
                  )}
                </div>
                )}

                <div key={`placement-${i}`} className={styles.specialInstructions}>
                  <label htmlFor={field.key}>Veuillez indiquer l emplacement d installation de la pancarte # {i + 1}</label>
                  <textarea
                    id={`${field.key}-${i}`}
                    value={data?.placements?.[i]?.placement || ''}
                    onChange={(e) => {
                      const newPlacement = [...(data?.placements || [])];
                      newPlacement[i] = {
                        ...newPlacement[i],
                        placement: e.target.value
                      };
                      handleChange('placements', newPlacement);
                    }}
                    placeholder="Entrez vos instructions ici..."
                    rows={4}
                  />
                </div>

                {/*material !== 'frames' && (
                  <div className={styles.specialInstructions}>
                    <label htmlFor={field.key}>{field.label}</label>
                    <textarea
                      id={field.key}
                      value={data?.[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder="Entrez vos instructions ici..."
                      rows={4}
                    />
                  </div>
                )*/}
              </div>
            </div>
            ))}
          </>)}

          {field.key === 'openHouseDetails' && <>
            
            <OpenHouseAddon
            data={data?.openHouse || {
              selectedDate: format(new Date(), 'yyyy-MM-dd'),
              startTime: '09:00',
              endTime: '11:00',
            }}
            onChange={(openHouseData) => {
              handleChange('openHouse', openHouseData);
            }}
          />
            
          </>}
          
          {field.key === 'addons' && <>
          {Array.from({ length: data?.quantity || 1 }).map((_, i) => (
          <div key={`addon-${i}`} className={styles.addonSection}>
            <div className={styles.radioGroup}>
              <div className={styles.checkboxGroup}>
                <label>{field.label} {i + 1}?</label>
                <div className={styles.addonsItem}>
                  {ADDONS_LIST.filter(addon => addon.key !== 'other' && addon.key !== 'openHouse').map(addon => (
                    <label key={addon.key} className={addon.key in (data?.addons?.[i] || {}) ? styles.active : ''}>
                      <input
                        type="checkbox"
                        checked={addon.key in (data?.addons?.[i] || {}) || false}
                        onChange={(e) => {
                          
                          const newAddons = [...(data?.addons || [])];
                          const items = { ...(newAddons[i] || {}) };
                          
                          if (e.target.checked) {
                            if (addon.key === 'other') {
                              items[addon.key] = [''];
                            } else if (addon.key === 'openHouse') {
                              // ← Initialiser avec objet OpenHouseData au lieu de true
                              items[addon.key] = {
                                selectedDate: format(new Date(), 'yyyy-MM-dd'),
                                startTime: '09:00',
                                endTime: '11:00',
                              };
                            } else {
                              items[addon.key] = true;
                            }
                          } else {
                            delete items[addon.key];
                          }
                          
                          newAddons[i] = items;
                          handleChange('addons', newAddons);
                        }}
                      />
                      {addon.label}
                    </label>
                  ))}
                </div>
              </div>

              {data?.addons?.[i]?.customAddon && (
                <div className={styles.specialInstructions}>
                  <label htmlFor={`otherAddon-${i}`}>Donnez nous de details sur votre ajout personnaliser...</label>
                  <textarea
                    id={`customAddonDetails-${i}`}
                    value={data?.addons?.[i]?.customAddonDetails || ''}
                    onChange={(e) => {
                      const newAddons = [...(data?.addons || [])];
                      newAddons[i] = {
                        ...newAddons[i],
                        customAddonDetails: e.target.value
                      };
                      handleChange('addons', newAddons);
                    }}
                    placeholder="Entrez les détails ici...ss"
                    rows={4}
                  />
                </div>
              )}

              <div className={styles.specialInstructions}>
                <label htmlFor={`otherAddon-${i}`}>Veuillez indiquer lemplacement de la pancarte # {i + 1}</label>
                <textarea
                  id={`addonPlacement-${i}`}
                  value={data?.addons?.[i]?.placement || ''}
                  onChange={(e) => {
                    const newAddons = [...(data?.addons || [])];
                    newAddons[i] = {
                      ...newAddons[i],
                      placement: e.target.value
                    };
                    handleChange('addons', newAddons);
                  }}
                  placeholder="Entrez les détails ici...asdas"
                  rows={4}
                />
              </div>
            </div>
          </div>
          ))}
          </>}

          {material !== 'addons' && field.key === 'details' && (<>
            {/*Array.from({ length: data?.quantity || 1 }).map((_, i) => (
            <div key={`addon-${i}`} className={styles.addonSection}>
              <div className={styles.radioGroup}>

                {material === 'frames' &&
                <div className={styles.buttons}>
                  <button 
                    type="button" 
                    className={data?.rentAddons?.[i] === true ? styles.active : ''} 
                    onClick={() => {
                      const newAddons = [...(data?.rentAddons || Array(data?.quantity || 1).fill(false))];
                      newAddons[i] = true;
                      handleChange('rentAddons', newAddons);
                    }}
                  >
                    Oui
                  </button>

                  <button 
                    type="button" 
                    className={data?.rentAddons?.[i] !== true ? styles.active : ''} 
                    onClick={() => {
                      const newAddons = [...(data?.rentAddons || Array(data?.quantity || 1).fill(false))];
                      newAddons[i] = false;
                      handleChange('rentAddons', newAddons);
                    }}
                  >
                    Non
                  </button>
                </div>
                }
                
                {material === 'frames' && data?.rentAddons?.[i] === true && (
                  <div className={styles.checkboxGroup}>
                    <label>Quel ajouts voulez-vous sur votre pancarte {i + 1}?</label>
                    <div className={styles.addonsItem}>
                      {ADDONS_LIST.map(addon => (
                        <label key={addon.key} className={addon.key in (data?.addons?.[i] || {}) ? styles.active : ''}>
                          <input
                            type="checkbox"
                            checked={addon.key in (data?.addons?.[i] || {}) || false}
                            onChange={(e) => {
                              console.log('CHECKBOX CHANGE - addon.key:', addon.key, 'checked:', e.target.checked);
                              
                              const newAddons = [...(data?.addons || [])];
                              const items = { ...(newAddons[i] || {}) };
                              
                              if (e.target.checked) {
                                if (addon.key === 'other') {
                                  items[addon.key] = [''];
                                } else if (addon.key === 'openHouse') {
                                  // ← Initialiser avec objet OpenHouseData au lieu de true
                                  items[addon.key] = {
                                    selectedDate: format(new Date(), 'yyyy-MM-dd'),
                                    startTime: '09:00',
                                    endTime: '11:00',
                                  };
                                } else {
                                  items[addon.key] = true;
                                }
                              } else {
                                delete items[addon.key];
                              }
                              
                              console.log('Items après traitement:', items);
                              newAddons[i] = items;
                              handleChange('addons', newAddons);
                            }}
                          />
                          {addon.label}
                        </label>
                      ))}
                    </div>

                    {data?.addons?.[i]?.openHouse && (
                      <OpenHouseAddon
                        data={data?.addons?.[i]?.openHouse || {
                          selectedDate: format(new Date(), 'yyyy-MM-dd'),
                          startTime: '09:00',
                          endTime: '11:00',
                        }}
                        onChange={(openHouseData) => {
                          const newAddons = [...(data?.addons || [])];
                          newAddons[i] = {
                            ...newAddons[i],
                            openHouse: openHouseData,
                          };
                          handleChange('addons', newAddons);
                        }}
                      />
                    )}

                    {data?.addons?.[i]?.other && (
                      <div className={styles.specialInstructions}>
                        <label htmlFor={`otherAddon-${i}`}>Donnez nous de details...</label>
                        <textarea
                          id={`otherAddon-${i}`}
                          value={data?.addons?.[i]?.other?.[0] || ''}
                          onChange={(e) => {
                            const newAddons = [...(data?.addons || [])];
                            newAddons[i] = {
                              ...newAddons[i],
                              other: [e.target.value]
                            };
                            handleChange('addons', newAddons);
                          }}
                          placeholder="Entrez les détails ici..."
                          rows={4}
                        />
                      </div>
                    )}
                  </div>
                )}

                {material !== 'frames' && (
                  <div className={styles.specialInstructions}>
                    <label htmlFor={field.key}>{field.label} {i + 1}</label>
                    <textarea
                      id={`${field.key}-${i}`}
                      value={data?.addons?.[i]?.[field.key] || ''}
                      onChange={(e) => {
                        const newAddons = [...(data?.addons || [])];
                        newAddons[i] = {
                          ...newAddons[i],
                          [field.key]: e.target.value
                        };
                        handleChange('addons', newAddons);
                      }}
                      placeholder="Entrez vos instructions ici..."
                      rows={4}
                    />
                  </div>
                )}
              </div>
            </div>
            ))*/}
          </>)}

          {field.key === 'specialNeeds' && <div className={styles.specialInstructions}>
            <div className={styles.specialInstructions}>
    <label htmlFor='specialNeeds'>Veuillez indiquer lemplacement dinstallation de la pancarte</label>
    <textarea
      id='specialNeeds'
      value={data?.specialNeeds || ''}  // ← Lis depuis data
      onChange={(e) => {
        handleChange('specialNeeds', e.target.value);  // ← Écrit directement
      }}
      placeholder="Entrez vos instructions ici..."
      rows={4}
    />
  </div>
          </div>}

          
        </div>
      ))}
    </fieldset>
  );
}