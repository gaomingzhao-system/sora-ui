<script setup lang="ts" vapor>
// 8. Native dialog and popover: open, close, focus restoration.
import { useId, useTemplateRef, watch } from 'vue'

const open = defineModel<boolean>('open', { default: false })
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const popoverId = useId()

watch(open, (value) => {
  const element = dialog.value
  if (!element) return
  if (value && !element.open) element.showModal()
  else if (!value && element.open) element.close()
})
</script>

<template>
  <div>
    <button type="button" data-testid="dialog-trigger" @click="open = true">open dialog</button>
    <dialog ref="dialog" data-testid="dialog" @close="open = false">
      <p>dialog body</p>
      <button type="button" data-testid="dialog-close" @click="open = false">close</button>
    </dialog>

    <button type="button" data-testid="popover-trigger" :popovertarget="popoverId">open popover</button>
    <div :id="popoverId" popover="auto" data-testid="popover">
      <button type="button" data-testid="popover-inner">inner</button>
    </div>
  </div>
</template>
