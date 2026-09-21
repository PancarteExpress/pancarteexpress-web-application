type FieldType = 'radio' | 'textarea' | 'address' | 'number' | 'checkbox' | 'addonsOpenHouse' | 'addons';

export interface MaterialFieldConfig {
  key: string;
  label: string;
  type: FieldType;
}

export interface MaterialConfig {
  label: string;
  fields: MaterialFieldConfig[];
}
