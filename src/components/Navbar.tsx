import React, { useState, useEffect } from 'react';
import type { User, UserRole, NotificationItem } from '../shared/types.js';
import { api } from '../lib/api.js';
import { KitaLogo } from './KitaLogo.js';
import { useTheme } from './ThemeContext.js';
import {
  Briefcase,
  Building2,
  LifeBuoy,
  LogOut,
  Menu,
  X,
  FileText,
  Bell,
  Search,
  MapPin,
  Moon,
  Sun,
  UserCheck
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: (mode?: 'login' | 'register', role?: UserRole) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab,
  onSelectTab,
  onOpenAuth,
  onLogout
}) => {