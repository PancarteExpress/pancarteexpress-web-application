export interface ParsedAddress {
  streetNumber: string;
  streetName: string;
  city: string;
  province: string;   // code court : "QC"
  postalCode: string;
  formatted: string;
}