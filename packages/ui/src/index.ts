/**
 * @your-scope/ui core entry.
 *
 * Nothing here imports the forms integration, Valibot, petite-vue-i18n or a
 * locale other than the built-in English fallback. Those live behind
 * `@your-scope/ui/forms`, `@your-scope/ui/i18n` and `@your-scope/ui/locales/*`.
 */

// foundation
export { default as UiProvider } from './components/foundation/UiProvider.vue'
export type { UiProviderProps } from './components/foundation/UiProvider.vue'
export { default as UiIcon } from './components/foundation/UiIcon.vue'
export type { UiIconProps } from './components/foundation/UiIcon.vue'

// actions
export { default as UiButton } from './components/actions/UiButton.vue'
export type { UiButtonProps } from './components/actions/UiButton.vue'
export { default as UiIconButton } from './components/actions/UiIconButton.vue'
export type { UiIconButtonProps } from './components/actions/UiIconButton.vue'
export { default as UiButtonGroup } from './components/actions/UiButtonGroup.vue'
export type { UiButtonGroupProps } from './components/actions/UiButtonGroup.vue'
export { default as UiLink } from './components/actions/UiLink.vue'
export type { UiLinkProps } from './components/actions/UiLink.vue'

// display
export { default as UiCard } from './components/display/UiCard.vue'
export type { UiCardProps } from './components/display/UiCard.vue'
export { default as UiBadge } from './components/display/UiBadge.vue'
export type { UiBadgeProps } from './components/display/UiBadge.vue'
export { default as UiAvatar } from './components/display/UiAvatar.vue'
export type { UiAvatarProps } from './components/display/UiAvatar.vue'
export { default as UiAvatarGroup } from './components/display/UiAvatarGroup.vue'
export type { UiAvatarGroupItem, UiAvatarGroupProps } from './components/display/UiAvatarGroup.vue'
export { default as UiSeparator } from './components/display/UiSeparator.vue'
export type { UiSeparatorProps } from './components/display/UiSeparator.vue'
export { default as UiKbd } from './components/display/UiKbd.vue'
export type { UiKbdProps } from './components/display/UiKbd.vue'
export { default as UiEmptyState } from './components/display/UiEmptyState.vue'
export type { UiEmptyStateProps } from './components/display/UiEmptyState.vue'

// feedback
export { default as UiAlert } from './components/feedback/UiAlert.vue'
export type { UiAlertProps } from './components/feedback/UiAlert.vue'
export { default as UiSpinner } from './components/feedback/UiSpinner.vue'
export type { UiSpinnerProps } from './components/feedback/UiSpinner.vue'
export { default as UiProgress } from './components/feedback/UiProgress.vue'
export type { UiProgressProps } from './components/feedback/UiProgress.vue'
export { default as UiSkeleton } from './components/feedback/UiSkeleton.vue'
export type { UiSkeletonProps } from './components/feedback/UiSkeleton.vue'
export { default as UiToastProvider } from './components/feedback/UiToastProvider.vue'
export type { UiToastProviderProps } from './components/feedback/UiToastProvider.vue'

// inputs
export { default as UiField } from './components/inputs/UiField.vue'
export type { UiFieldProps, UiFieldSlotProps } from './components/inputs/UiField.vue'
export { default as UiInput } from './components/inputs/UiInput.vue'
export type { UiInputProps } from './components/inputs/UiInput.vue'
export { default as UiTextarea } from './components/inputs/UiTextarea.vue'
export type { UiTextareaProps } from './components/inputs/UiTextarea.vue'
export { default as UiPasswordInput } from './components/inputs/UiPasswordInput.vue'
export type { UiPasswordInputProps } from './components/inputs/UiPasswordInput.vue'
export { default as UiNumberInput } from './components/inputs/UiNumberInput.vue'
export type { UiNumberInputProps } from './components/inputs/UiNumberInput.vue'
export { default as UiDateInput } from './components/inputs/UiDateInput.vue'
export type { UiDateInputProps } from './components/inputs/UiDateInput.vue'
export { default as UiCheckbox } from './components/inputs/UiCheckbox.vue'
export type { UiCheckboxProps } from './components/inputs/UiCheckbox.vue'
export { default as UiCheckboxGroup } from './components/inputs/UiCheckboxGroup.vue'
export type { UiCheckboxGroupProps } from './components/inputs/UiCheckboxGroup.vue'
export { default as UiRadioGroup } from './components/inputs/UiRadioGroup.vue'
export type { UiRadioGroupProps } from './components/inputs/UiRadioGroup.vue'
export { default as UiSwitch } from './components/inputs/UiSwitch.vue'
export type { UiSwitchProps } from './components/inputs/UiSwitch.vue'
export { default as UiSelect } from './components/inputs/UiSelect.vue'
export type { UiSelectProps } from './components/inputs/UiSelect.vue'
export { default as UiSlider } from './components/inputs/UiSlider.vue'
export type { UiSliderProps } from './components/inputs/UiSlider.vue'
export { default as UiFileInput } from './components/inputs/UiFileInput.vue'
export type { UiFileInputProps } from './components/inputs/UiFileInput.vue'
export { default as UiCombobox } from './components/inputs/UiCombobox.vue'
export type { UiComboboxProps } from './components/inputs/UiCombobox.vue'

// overlays
export { default as UiDialog } from './components/overlays/UiDialog.vue'
export type { UiDialogProps } from './components/overlays/UiDialog.vue'
export { default as UiDrawer } from './components/overlays/UiDrawer.vue'
export type { UiDrawerProps } from './components/overlays/UiDrawer.vue'
export { default as UiPopover } from './components/overlays/UiPopover.vue'
export type { UiPopoverProps } from './components/overlays/UiPopover.vue'
export { default as UiTooltip } from './components/overlays/UiTooltip.vue'
export type { UiTooltipProps } from './components/overlays/UiTooltip.vue'
export { default as UiDropdownMenu } from './components/overlays/UiDropdownMenu.vue'
export type { UiDropdownMenuProps, UiMenuGroup, UiMenuItem } from './components/overlays/UiDropdownMenu.vue'
export type { UiTriggerBindings } from './components/overlays/trigger.ts'
export type { UiCloseReason } from './composables/use-overlay.ts'

// navigation
export { default as UiTabs } from './components/navigation/UiTabs.vue'
export type { UiTabItem, UiTabsProps } from './components/navigation/UiTabs.vue'
export { default as UiAccordion } from './components/navigation/UiAccordion.vue'
export type { UiAccordionItem, UiAccordionProps } from './components/navigation/UiAccordion.vue'
export { default as UiBreadcrumbs } from './components/navigation/UiBreadcrumbs.vue'
export type { UiBreadcrumbItem, UiBreadcrumbsProps } from './components/navigation/UiBreadcrumbs.vue'
export { default as UiPagination } from './components/navigation/UiPagination.vue'
export type { UiPaginationProps } from './components/navigation/UiPagination.vue'

// data
export { default as UiTable } from './components/data/UiTable.vue'
export type { UiTableColumn, UiTableProps, UiTableRowKey, UiTableSort } from './components/data/UiTable.vue'

// composables
export { useUiLocale } from './composables/use-ui-locale.ts'
export type { UiLocale } from './composables/use-ui-locale.ts'
export { useUiContext, useUiDefaults } from './composables/use-ui-config.ts'
export { useToast } from './composables/use-toast.ts'
export type { UiToast, UiToastAction, UiToastApi, UiToastInput } from './composables/use-toast.ts'
export { createUiTranslator } from './internal/translator.ts'
export type { CreateUiTranslatorOptions } from './internal/translator.ts'

// icons (individually tree-shakeable)
export * from './internal/icons.ts'

// shared types
export type * from './types/common.ts'
export type { UiContext, UiMessageParams, UiTranslator } from './types/config.ts'
export type { UiMessageKey, UiMessages } from './locales/en.ts'
