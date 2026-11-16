/**
 * @your-scope/ui core entry.
 *
 * Nothing here imports the forms integration, Valibot, petite-vue-i18n or a
 * locale other than the built-in English fallback. Those live behind
 * `@your-scope/ui/forms`, `@your-scope/ui/i18n` and `@your-scope/ui/locales/*`.
 */

// foundation
export { default as SoraProvider } from './components/foundation/SoraProvider.vue'
export type { SoraProviderProps } from './components/foundation/SoraProvider.vue'
export { default as SoraIcon } from './components/foundation/SoraIcon.vue'
export type { SoraIconProps } from './components/foundation/SoraIcon.vue'

// actions
export { default as SoraButton } from './components/actions/SoraButton.vue'
export type { SoraButtonProps } from './components/actions/SoraButton.vue'
export { default as SoraIconButton } from './components/actions/SoraIconButton.vue'
export type { SoraIconButtonProps } from './components/actions/SoraIconButton.vue'
export { default as SoraButtonGroup } from './components/actions/SoraButtonGroup.vue'
export type { SoraButtonGroupProps } from './components/actions/SoraButtonGroup.vue'
export { default as SoraLink } from './components/actions/SoraLink.vue'
export type { SoraLinkProps } from './components/actions/SoraLink.vue'

// display
export { default as SoraCard } from './components/display/SoraCard.vue'
export type { SoraCardProps } from './components/display/SoraCard.vue'
export { default as SoraBadge } from './components/display/SoraBadge.vue'
export type { SoraBadgeProps } from './components/display/SoraBadge.vue'
export { default as SoraAvatar } from './components/display/SoraAvatar.vue'
export type { SoraAvatarProps } from './components/display/SoraAvatar.vue'
export { default as SoraAvatarGroup } from './components/display/SoraAvatarGroup.vue'
export type { SoraAvatarGroupItem, SoraAvatarGroupProps } from './components/display/SoraAvatarGroup.vue'
export { default as SoraSeparator } from './components/display/SoraSeparator.vue'
export type { SoraSeparatorProps } from './components/display/SoraSeparator.vue'
export { default as SoraKbd } from './components/display/SoraKbd.vue'
export type { SoraKbdProps } from './components/display/SoraKbd.vue'
export { default as SoraEmptyState } from './components/display/SoraEmptyState.vue'
export type { SoraEmptyStateProps } from './components/display/SoraEmptyState.vue'

// feedback
export { default as SoraAlert } from './components/feedback/SoraAlert.vue'
export type { SoraAlertProps } from './components/feedback/SoraAlert.vue'
export { default as SoraSpinner } from './components/feedback/SoraSpinner.vue'
export type { SoraSpinnerProps } from './components/feedback/SoraSpinner.vue'
export { default as SoraProgress } from './components/feedback/SoraProgress.vue'
export type { SoraProgressProps } from './components/feedback/SoraProgress.vue'
export { default as SoraSkeleton } from './components/feedback/SoraSkeleton.vue'
export type { SoraSkeletonProps } from './components/feedback/SoraSkeleton.vue'
export { default as SoraToastProvider } from './components/feedback/SoraToastProvider.vue'
export type { SoraToastProviderProps } from './components/feedback/SoraToastProvider.vue'

// inputs
export { default as SoraField } from './components/inputs/SoraField.vue'
export type { SoraFieldProps, SoraFieldSlotProps } from './components/inputs/SoraField.vue'
export { default as SoraInput } from './components/inputs/SoraInput.vue'
export type { SoraInputProps } from './components/inputs/SoraInput.vue'
export { default as SoraTextarea } from './components/inputs/SoraTextarea.vue'
export type { SoraTextareaProps } from './components/inputs/SoraTextarea.vue'
export { default as SoraPasswordInput } from './components/inputs/SoraPasswordInput.vue'
export type { SoraPasswordInputProps } from './components/inputs/SoraPasswordInput.vue'
export { default as SoraNumberInput } from './components/inputs/SoraNumberInput.vue'
export type { SoraNumberInputProps } from './components/inputs/SoraNumberInput.vue'
export { default as SoraDateInput } from './components/inputs/SoraDateInput.vue'
export type { SoraDateInputProps } from './components/inputs/SoraDateInput.vue'
export { default as SoraCheckbox } from './components/inputs/SoraCheckbox.vue'
export type { SoraCheckboxProps } from './components/inputs/SoraCheckbox.vue'
export { default as SoraCheckboxGroup } from './components/inputs/SoraCheckboxGroup.vue'
export type { SoraCheckboxGroupProps } from './components/inputs/SoraCheckboxGroup.vue'
export { default as SoraRadioGroup } from './components/inputs/SoraRadioGroup.vue'
export type { SoraRadioGroupProps } from './components/inputs/SoraRadioGroup.vue'
export { default as SoraSwitch } from './components/inputs/SoraSwitch.vue'
export type { SoraSwitchProps } from './components/inputs/SoraSwitch.vue'
export { default as SoraSelect } from './components/inputs/SoraSelect.vue'
export type { SoraSelectProps } from './components/inputs/SoraSelect.vue'
export { default as SoraSlider } from './components/inputs/SoraSlider.vue'
export type { SoraSliderProps } from './components/inputs/SoraSlider.vue'
export { default as SoraFileInput } from './components/inputs/SoraFileInput.vue'
export type { SoraFileInputProps } from './components/inputs/SoraFileInput.vue'
export { default as SoraCombobox } from './components/inputs/SoraCombobox.vue'
export type { SoraComboboxProps } from './components/inputs/SoraCombobox.vue'

// overlays
export { default as SoraDialog } from './components/overlays/SoraDialog.vue'
export type { SoraDialogProps } from './components/overlays/SoraDialog.vue'
export { default as SoraDrawer } from './components/overlays/SoraDrawer.vue'
export type { SoraDrawerProps } from './components/overlays/SoraDrawer.vue'
export { default as SoraPopover } from './components/overlays/SoraPopover.vue'
export type { SoraPopoverProps } from './components/overlays/SoraPopover.vue'
export { default as SoraTooltip } from './components/overlays/SoraTooltip.vue'
export type { SoraTooltipProps } from './components/overlays/SoraTooltip.vue'
export { default as SoraDropdownMenu } from './components/overlays/SoraDropdownMenu.vue'
export type {
  SoraDropdownMenuProps,
  SoraMenuGroup,
  SoraMenuItem,
} from './components/overlays/SoraDropdownMenu.vue'
export type { SoraTriggerBindings } from './components/overlays/trigger.ts'
export type { SoraCloseReason } from './composables/use-overlay.ts'

// navigation
export { default as SoraTabs } from './components/navigation/SoraTabs.vue'
export type { SoraTabItem, SoraTabsProps } from './components/navigation/SoraTabs.vue'
export { default as SoraAccordion } from './components/navigation/SoraAccordion.vue'
export type { SoraAccordionItem, SoraAccordionProps } from './components/navigation/SoraAccordion.vue'
export { default as SoraBreadcrumbs } from './components/navigation/SoraBreadcrumbs.vue'
export type { SoraBreadcrumbItem, SoraBreadcrumbsProps } from './components/navigation/SoraBreadcrumbs.vue'
export { default as SoraPagination } from './components/navigation/SoraPagination.vue'
export type { SoraPaginationProps } from './components/navigation/SoraPagination.vue'

// data
export { default as SoraTable } from './components/data/SoraTable.vue'
export type {
  SoraTableColumn,
  SoraTableProps,
  SoraTableRowKey,
  SoraTableSort,
} from './components/data/SoraTable.vue'

// composables
export { useSoraLocale } from './composables/use-sora-locale.ts'
export type { SoraLocale } from './composables/use-sora-locale.ts'
export { useSoraContext, useSoraDefaults } from './composables/use-sora-config.ts'
export { useToast } from './composables/use-toast.ts'
export type { SoraToast, SoraToastAction, SoraToastApi, SoraToastInput } from './composables/use-toast.ts'
export { createSoraTranslator } from './internal/translator.ts'
export type { CreateSoraTranslatorOptions } from './internal/translator.ts'

// icons (individually tree-shakeable)
export * from './internal/icons.ts'

// shared types
export type * from './types/common.ts'
export type { SoraContext, SoraMessageParams, SoraTranslator } from './types/config.ts'
export type { SoraMessageKey, SoraMessages } from './locales/en.ts'
