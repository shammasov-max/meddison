import { useEffect, useCallback, useRef } from 'react';

/**
 * Hook to auto-save data when pasting content into form fields
 * Uses debouncing to avoid multiple rapid saves
 *
 * @param onSave - The save function to call
 * @param enabled - Whether the hook is enabled (e.g., when form has data)
 * @param isSaving - Whether currently saving (prevents duplicate saves)
 * @param debounceMs - Debounce delay in milliseconds (default: 400ms)
 */
export function usePasteAutoSave(
  onSave: () => Promise<void> | void,
  enabled: boolean = true,
  isSaving: boolean = false,
  debounceMs: number = 400
) {
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(isSaving);
  const enabledRef = useRef(enabled);

  // Keep refs updated
  useEffect(() => {
    isSavingRef.current = isSaving;
  }, [isSaving]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;

      // Only trigger on input/textarea/contenteditable elements
      const isEditableField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[contenteditable="true"]') !== null ||
        target.closest('.ql-editor') !== null; // React Quill editor

      if (!isEditableField) return;
      if (!enabledRef.current) return;

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new debounce timer
      debounceTimerRef.current = setTimeout(async () => {
        // Don't save if currently saving
        if (isSavingRef.current) return;

        try {
          await onSave();
          // Show success message
          window.alert('Данные успешно сохранены!');
        } catch (error) {
          console.error('Paste auto-save error:', error);
          window.alert('Ошибка автосохранения!');
        }
      }, debounceMs);
    },
    [onSave, debounceMs]
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
      // Cleanup timer on unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [handlePaste]);
}
