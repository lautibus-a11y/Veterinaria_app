
import React, { createContext, useContext } from 'react';
import { Tenant } from '../types';

export const TenantContext = createContext<Tenant | null>(null);

export const useTenant = () => {
    const context = useContext(TenantContext);
    return context as Tenant; // We cast to Tenant because components using it are shielded by App.tsx logic
};
