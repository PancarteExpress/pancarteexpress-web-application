'use client'

import { useEffect, useState } from 'react';
import styles from './installationForm.module.css'
import { ACCESS_OPTIONS, MATERIALS_OPTIONS, SPECIAL_ACCESS_OPTIONS } from '../../constants/installationOptions';
import { Installation } from '../../types/services';
import MaterialDetailsForm from '../materialDetailsForm/materialDetailsForm';
import { MATERIAL_CONFIGS } from '../../constants/materialOptions';

interface Props {
  onDataChange?: (data: Omit<Installation, 'type'>) => void;
  initialData?: Omit<Installation, 'type'>;
}

export default function InstallationForm({ onDataChange, initialData }: Props) {

    const [selectedMaterials, setSelectedMaterials] = useState(() => {
        if (initialData?.items) {
            return initialData.items;
        }
        return {
            frames: { selected: false, details: {} },
            anchors: { selected: false, details: {} },
            poles: { selected: false, details: {} },
            addonsOpenHouse: { selected: false, details: {} },
            addons: { selected: false, details: {} },
            keybox: { selected: false, details: {} },
            flags: { selected: false, details: {} },
            directional: { selected: false, details: {} },
            other: { selected: false, details: {} },
        };
    });

    const [selectedAccess, setSelectedAccess] = useState<Installation['accessibility'] | undefined>(
        initialData?.accessibility
    );
    
    const [specialAccess, setSpecialAccess] = useState<Installation['specialAccess'] | undefined>(
        initialData?.specialAccess
    );

    // Réinitialise quand selectedAccess change
    useEffect(() => {
        if (selectedAccess && !['balcony', 'wall', 'fence'].includes(selectedAccess)) {
            setSpecialAccess(undefined);
        }
    }, [selectedAccess]);

    const getDefaultDetails = (material: string, quantity: number = 1) => {
        const config = MATERIAL_CONFIGS[material];
        const defaults: Record<string, unknown> = {};
        
       

        config?.fields.forEach(field => {
            if (field.key === 'rentAddons') {
                defaults[field.key] = Array(quantity).fill(false);
            } else {
                defaults[field.key] = field.type === 'radio' ? false : field.type === 'number' ? 1 : '';
            }
        });
        
        return defaults;
        };

    const isDependent = (key: string): boolean => {
        return MATERIALS_OPTIONS.some(opt => 
            (opt.dependencies as readonly string[]).includes(key) && 
            selectedMaterials[opt.key as keyof typeof selectedMaterials].selected
        );
    };

    const handleMaterialDetails = (material: keyof typeof selectedMaterials, details: unknown) => {
        setSelectedMaterials(prev => ({
            ...prev,
            [material]: { ...prev[material], details }
        }));
    };

    function handleMaterialChange(service: keyof typeof selectedMaterials) {
        const option = MATERIALS_OPTIONS.find(opt => opt.key === service);
        const isChecking = !selectedMaterials[service].selected;

        const quantity = Number(selectedMaterials.frames.details?.quantity) || 1;

        setSelectedMaterials(prev => {
        const newState = { ...prev };
        
        newState[service] = { 
            ...prev[service], 
            selected: !prev[service].selected,
            details: isChecking ? getDefaultDetails(service as string, quantity) : {}  // ← Passe quantity
        };

        if (isChecking && option?.dependencies) {
        option.dependencies.forEach(dep => {
            newState[dep as keyof typeof selectedMaterials] = { 
            selected: true,
            details: getDefaultDetails(dep, quantity)
            };
        });
        } else if (!isChecking && option?.dependencies) {
        option.dependencies.forEach(dep => {
            newState[dep as keyof typeof selectedMaterials] = { 
            selected: false,
            details: {}
            };
        });
        }

        return newState;
        });
    }

    // Envoie les données au parent chaque fois qu'elles changent
    useEffect(() => {
        onDataChange?.({
            items: selectedMaterials,
            accessibility: selectedAccess ?? null,
            specialAccess: specialAccess ?? null, // ← Ajoute ça
        });
    }, [selectedMaterials, selectedAccess, specialAccess, onDataChange]);

    useEffect(() => {
        console.log('initialData changée:', initialData);
        
        if (!initialData?.items) {
            console.log('Reset formulaire');
            setSelectedMaterials({
                frames: { selected: false, details: {}},
                anchors: { selected: false, details: {} },
                poles: { selected: false, details: {} },
                addonsOpenHouse: { selected: false, details: {} },
                addons: { selected: false, details: {} },
                keybox: { selected: false, details: {} },
                flags: { selected: false, details: {} },
                directional: { selected: false, details: {} },
                other: { selected: false, details: {} },
            });
            setSelectedAccess(undefined);
        } else {
            console.log('Charge items:', initialData.items);
            setSelectedMaterials(initialData.items);
            setSelectedAccess(initialData.accessibility);
        }
    }, [initialData]);


    return(
        <>
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Quavez vous besoin dinstaller?</legend>

            <div className={styles.userChoice}>
                {MATERIALS_OPTIONS.map(option => (
                <label key={option.key} className={selectedMaterials[option.key as keyof typeof selectedMaterials].selected ? styles.checked : ''}>
                    <input 
                        type="checkbox" 
                        checked={selectedMaterials[option.key as keyof typeof selectedMaterials].selected}
                        onChange={() => handleMaterialChange(option.key as keyof typeof selectedMaterials)}
                        disabled={isDependent(option.key)}
                    />
                    {option.label}
                </label>
                ))}
            </div>

            {(selectedMaterials.addons.selected || selectedMaterials.addonsOpenHouse.selected) && 
            <div className={styles.specialInstructions}>
                <label className={styles.addonsInstruction}>Assurez vous quune pancarte est presente sur les lieux pour quon puisse installer lajout</label>
            </div>
            }
            
            {(selectedMaterials.frames.selected) && 
            <div className={styles.specialInstructions}>
                <label className={styles.addonsInstruction}>Les installation de pancartes inclus linstallation des ancrages et des poteaux</label>
            </div>
            }

            {Object.entries(selectedMaterials).map(([material, data]) => {
            // Vérifie si ce material est une dépendance d'un autre sélectionné
            const isDependent = MATERIALS_OPTIONS.some(opt => 
                (opt.dependencies as readonly string[]).includes(material) && 
                selectedMaterials[opt.key as keyof typeof selectedMaterials].selected
            );
            
            return (
                data.selected && !isDependent && (
                <div key={material} className={styles.materialDetails}>
                    <MaterialDetailsForm 
                        material={material}
                        data={data.details || {}}
                        onChange={(details) => handleMaterialDetails(material as keyof typeof selectedMaterials, details)}
                    />
                </div>
                )
            );
            })}
        </fieldset>
        
        <fieldset className={styles.fieldset}>
            <legend className={styles.legend}>Quelle est laccessibilite de linstallation ?</legend>

            <div className={styles.userChoice}>
                {ACCESS_OPTIONS.map(option => (
                <label key={option.key} className={selectedAccess === option.key ? styles.checked : ''}>
                    <input 
                        type="radio" 
                        name="accessibility"
                        value={option.key}
                        checked={selectedAccess === option.key}
                        onChange={(e) => setSelectedAccess(e.target.value as Installation['accessibility'])}
                    />
                    {option.label}
                </label>
                ))}
            </div>

            {selectedAccess && ['balcony', 'wall', 'fence'].includes(selectedAccess) && <>
            <h3>Veuillez choisir parmis lune des options suivantes : </h3>
            <div className={styles.userChoice}>
                {SPECIAL_ACCESS_OPTIONS.map(option => (
                <label key={option.key} className={specialAccess === option.key ? styles.checked : ''}>
                <input 
                    type="radio" 
                    name="accessibility"
                    value={option.key}
                    checked={specialAccess === option.key}
                    onChange={(e) => setSpecialAccess(e.target.value as Installation['specialAccess'])}
                />
                {option.label}
                </label>
                ))}
            </div>
            </>}

            {(selectedAccess && ['other'].includes(selectedAccess)) && 
            <div className={styles.specialInstructions}>
                <label htmlFor="specialAccess">Instructions spéciales</label>
                <textarea
                    id="specialAccess"
                    value={specialAccess || ''}
                    onChange={(e) => setSpecialAccess(e.target.value as Installation['specialAccess'])}
                    placeholder="Entrez vos instructions ici..."
                    rows={4}
                />
            </div>}
        </fieldset>


        </>
    );
}