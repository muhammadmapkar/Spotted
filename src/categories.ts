import { CategoryColors, CategoryColorsStrong } from '@/constants/Colors';
import { Category } from '@/src/db';

// Name, emoji and colour for each category, in one place.
export const CATEGORIES: Record<Category, { label: string; emoji: string; color: string; strongColor: string }> = {
  food: { label: 'Food', emoji: '🍽️', color: CategoryColors.food, strongColor: CategoryColorsStrong.food },
  shopping: { label: 'Shopping', emoji: '🛍️', color: CategoryColors.shopping, strongColor: CategoryColorsStrong.shopping },
  fun: { label: 'Fun', emoji: '🎉', color: CategoryColors.fun, strongColor: CategoryColorsStrong.fun },
};
