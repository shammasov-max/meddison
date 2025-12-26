import { useEffect, useCallback } from 'react';

/**
 * Hook to save data when pressing Ctrl+Enter (or Cmd+Enter on Mac)
 * Excludes textareas and contenteditable elements to allow normal Enter behavior
 *
 * @param onSave - The save function to call
 * @param enabled - Whether the hook is enabled (e.g., when form has data)
 * @param isSaving - Whether currently saving (prevents duplicate saves)
 */
export function useEnterSave(
  onSave: () => Promise<void> | void,
  enabled: boolean = true,
  isSaving: boolean = false
) {
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      // Check for Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        // Don't save if disabled or already saving
        if (!enabled || isSaving) return;

        // Prevent default behavior
        e.preventDefault();

        try {
          await onSave();
          // Show native browser alert after successful save
          window.alert('Данные успешно сохранены!');
        } catch (error) {
          console.error('Save error:', error);
          window.alert('Ошибка сохранения данных!');
        }
      }
    },
    [onSave, enabled, isSaving]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
