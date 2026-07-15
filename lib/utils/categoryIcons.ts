import { 
  Home, 
  Utensils, 
  Gamepad2, 
  ShoppingCart, 
  Car, 
  Zap, 
  HeartPulse, 
  GraduationCap, 
  Plane, 
  Coffee, 
  Briefcase, 
  Folder, 
  CircleDollarSign,
  Shirt,
  Smartphone,
  Gift,
  ArrowUpCircle,
  ArrowDownCircle
} from "lucide-react";

const categoryIconsMap: Record<string, any> = {
  "casa": Home,
  "moradia": Home,
  "aluguel": Home,
  "alimentação": Utensils,
  "mercado": ShoppingCart,
  "supermercado": ShoppingCart,
  "lazer": Gamepad2,
  "compras": ShoppingCart,
  "roupa": Shirt,
  "transporte": Car,
  "uber": Car,
  "combustível": Car,
  "assinatura": Zap,
  "internet": Zap,
  "conta": Zap,
  "luz": Zap,
  "água": Zap,
  "saúde": HeartPulse,
  "farmácia": HeartPulse,
  "educação": GraduationCap,
  "curso": GraduationCap,
  "escola": GraduationCap,
  "viagem": Plane,
  "restaurante": Coffee,
  "ifood": Coffee,
  "trabalho": Briefcase,
  "salário": CircleDollarSign,
  "investimento": CircleDollarSign,
  "celular": Smartphone,
  "presente": Gift,
};

export function getCategoryIcon(categoryName: string, isIncome: boolean = false) {
  const normalized = categoryName.toLowerCase().trim();
  
  for (const [key, icon] of Object.entries(categoryIconsMap)) {
    if (normalized.includes(key)) {
      return icon;
    }
  }
  
  return isIncome ? ArrowUpCircle : ArrowDownCircle;
}
