import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Resolves an icon name string to a Lucide React component.
 * Falls back to HelpCircle if the icon is not found.
 *
 * @param name - The name of the Lucide icon (e.g., "Gamepad2", "Wifi", "Car")
 * @returns The corresponding Lucide icon component
 */
export const getIcon = (name: string): LucideIcon => {
  const icon = (Icons as Record<string, LucideIcon>)[name];
  return icon || Icons.HelpCircle;
};

/**
 * Type-safe icon name validation.
 * Returns true if the icon name exists in Lucide icons.
 */
export const isValidIcon = (name: string): boolean => {
  return name in Icons;
};
