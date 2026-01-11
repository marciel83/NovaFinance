
import React from 'react';
import { 
  Utensils, 
  Home, 
  Car, 
  Gamepad2, 
  GraduationCap, 
  Activity, 
  MoreHorizontal,
  Wallet,
  TrendingDown,
  Scale,
  ShoppingBag,
  Coffee,
  Zap,
  Heart,
  Plane,
  Gift,
  Smartphone,
  Trophy,
  Hammer,
  Dog,
  Banknote
} from 'lucide-react';

export const INITIAL_CATEGORIES = [];

export const ICON_LIBRARY: Record<string, React.ElementType> = {
  utensils: Utensils,
  home: Home,
  car: Car,
  gamepad: Gamepad2,
  graduation: GraduationCap,
  activity: Activity,
  shopping: ShoppingBag,
  coffee: Coffee,
  zap: Zap,
  heart: Heart,
  plane: Plane,
  gift: Gift,
  phone: Smartphone,
  trophy: Trophy,
  hammer: Hammer,
  dog: Dog,
  more: MoreHorizontal
};

export const getCategoryIcon = (iconKey: string, className: string = "w-5 h-5") => {
  const IconComponent = ICON_LIBRARY[iconKey] || MoreHorizontal;
  return <IconComponent className={className} />;
};

export const SUMMARY_ICONS = {
  budgeted: <Wallet className="w-6 h-6 text-blue-400" />,
  income: <Banknote className="w-6 h-6 text-cyan-400" />,
  spent: <TrendingDown className="w-6 h-6 text-rose-400" />,
  difference: <Scale className="w-6 h-6 text-emerald-400" />
};
