export type DeviceType = 
  | 'laptop' 
  | 'desktop' 
  | 'mac' 
  | 'printer' 
  | 'network' 
  | 'cctv' 
  | 'data_recovery';

export interface ServiceDetail {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  tagline: string;
  category: 'hardware' | 'software' | 'network' | 'security' | 'enterprise';
  icon: string;
  description: string;
  features: string[];
  commonProblems: string[];
  estimatedTime: string;
  startingPrice: number;
  popular?: boolean;
}

export interface QuoteCalculation {
  device: DeviceType;
  issueKey: string;
  location: string;
  serviceMode: 'domicilio' | 'taller';
  estimatedMin: number;
  estimatedMax: number;
  timeEstimate: string;
  includes: string[];
}

export interface BookingData {
  fullName: string;
  phone: string;
  email?: string;
  district: string;
  address: string;
  deviceType: DeviceType;
  issueDescription: string;
  preferredDate: string;
  preferredTimeSlot: string;
  serviceMode: 'domicilio' | 'taller';
}

export interface DistrictCoverage {
  name: string;
  zone: string;
  eta: string;
  deliveryFee: number;
  availableToday: boolean;
}
