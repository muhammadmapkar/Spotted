import { CategoryColors } from '@/constants/Colors';
import { Category } from '@/src/db';

// Name, emoji and colour for each category, in one place.
export const CATEGORIES: Record<Category, { label: string; emoji: string; color: string }> = {
  food: { label: 'Food', emoji: '🍽️', color: CategoryColors.food },
  shopping: { label: 'Shopping', emoji: '🛍️', color: CategoryColors.shopping },
  fun: { label: 'Fun', emoji: '🎉', color: CategoryColors.fun },
};
