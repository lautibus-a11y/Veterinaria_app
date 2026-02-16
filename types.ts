
export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  VETERINARIAN = 'VETERINARIAN',
  RECEPTION = 'RECEPTION',
  CLIENT = 'CLIENT'
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  phone: string;
  address: string;
  settings: {
    primaryColor: string;
    currency: string;
    timezone: string;
  };
  isDemo?: boolean;
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
}

export interface Client {
  id: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  createdAt: string;
}

export interface Pet {
  id: string;
  tenantId: string;
  clientId: string;
  name: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  gender: 'M' | 'F';
  photoUrl?: string;
}

export interface Appointment {
  id: string;
  tenantId: string;
  petId: string;
  clientId: string;
  veterinarianId: string;
  dateTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  reason: string;
  notes?: string;
}

export interface MedicalRecord {
  id: string;
  tenantId: string;
  petId: string;
  veterinarianId: string;
  date: string;
  diagnosis: string;
  treatment: string;
  symptoms: string;
  attachments?: string[];
}
