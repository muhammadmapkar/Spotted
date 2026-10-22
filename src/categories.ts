import { CategoryColors, CategoryColorsStrong } from '@/constants/Colors';
import { Category } from '@/src/db';

// Name and colour for each category, in one place.
export const CATEGORIES: Record<Category, { label: string; color: string; strongColor: string }> = {
  food: { label: 'Food', color: CategoryColors.food, strongColor: CategoryColorsStrong.food },
  shopping: { label: 'Shopping', color: CategoryColors.shopping, strongColor: CategoryColorsStrong.shopping },
  fun: { label: 'Fun', color: CategoryColors.fun, strongColor: CategoryColorsStrong.fun },
};
