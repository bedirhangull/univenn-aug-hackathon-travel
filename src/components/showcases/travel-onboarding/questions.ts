import type Feather from '@expo/vector-icons/Feather';
import type { ComponentProps } from 'react';

export type OptionId = string;

export interface Option {
  id: OptionId;
  label: string;
  /** Shorter wording for the profile rail, where space is tight. */
  railLabel?: string;
  /**
   * Answers the question on its own. Picking it clears every other choice in
   * the group, and picking anything else clears it.
   */
  isExclusive?: boolean;
}

export interface CompanionOption extends Option {
  icon: ComponentProps<typeof Feather>['name'];
  detail: string;
}

/** Step 1 — who is on the trip. Single choice. */
export const COMPANIONS: CompanionOption[] = [
  {
    id: 'solo',
    label: 'Just me',
    detail: 'Plans that are easy to change',
    icon: 'user',
  },
  {
    id: 'partner',
    label: 'Two of us',
    detail: 'Tables for two, quieter evenings',
    icon: 'heart',
  },
  {
    id: 'friends',
    label: 'Friends',
    detail: 'Group bookings and late nights',
    icon: 'users',
  },
  {
    id: 'family',
    label: 'Family with kids',
    detail: 'Shorter days, somewhere to run around',
    icon: 'home',
  },
];

/** Shown only when the trip is a family one — it changes the plan a lot. */
export const KID_AGES: Option[] = [
  { id: 'under-2', label: 'Under 2', railLabel: 'Under 2' },
  { id: '2-5', label: '2 to 5', railLabel: 'Ages 2-5' },
  { id: '6-12', label: '6 to 12', railLabel: 'Ages 6-12' },
  { id: 'teens', label: 'Teens', railLabel: 'Teens' },
];

/** Step 2 — what has to work on the ground. */
export const ACCESS_NEEDS: Option[] = [
  {
    id: 'step-free',
    label: 'Step-free access',
    railLabel: 'Step-free',
  },
  {
    id: 'short-walks',
    label: 'Short walking distances',
    railLabel: 'Short walks',
  },
  { id: 'wheelchair', label: 'Room for a wheelchair', railLabel: 'Wheelchair' },
  { id: 'low-vision', label: 'Low vision', railLabel: 'Low vision' },
  { id: 'hearing', label: 'Hard of hearing', railLabel: 'Hard of hearing' },
  {
    id: 'none',
    label: 'Nothing to plan around',
    railLabel: 'No access needs',
    isExclusive: true,
  },
];

/** Step 3a — the safety half of the food question. */
export const ALLERGIES: Option[] = [
  { id: 'nuts', label: 'Nuts', railLabel: 'No nuts' },
  { id: 'shellfish', label: 'Shellfish', railLabel: 'No shellfish' },
  { id: 'gluten', label: 'Gluten', railLabel: 'No gluten' },
  { id: 'dairy', label: 'Dairy', railLabel: 'No dairy' },
  { id: 'eggs', label: 'Eggs', railLabel: 'No eggs' },
  { id: 'none', label: 'No allergies', isExclusive: true },
];

/** Step 3b — the preference half. */
export const DIETS: Option[] = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
  { id: 'pescatarian', label: 'Pescatarian' },
  {
    id: 'anything',
    label: 'I eat anything',
    railLabel: 'Eats anything',
    isExclusive: true,
  },
];

/**
 * Applies the exclusive-option rule to a new selection: the "none of these"
 * answer and the real answers can never be selected at the same time.
 */
export const resolveSelection = (
  options: Option[],
  next: Set<OptionId>,
  previous: Set<OptionId>
): Set<OptionId> => {
  const exclusive = options.find((option) => option.isExclusive)?.id;

  if (!exclusive) {
    return next;
  }

  const justAddedExclusive = next.has(exclusive) && !previous.has(exclusive);

  if (justAddedExclusive) {
    return new Set([exclusive]);
  }

  const withoutExclusive = new Set(next);
  withoutExclusive.delete(exclusive);

  return withoutExclusive.size > 0 ? withoutExclusive : next;
};

/** The label a chosen option shows in the profile rail. */
export const railLabelFor = (options: Option[], id: OptionId): string => {
  const option = options.find((entry) => entry.id === id);
  return option?.railLabel ?? option?.label ?? String(id);
};
