<script setup>
import { ref } from 'vue'
import AppIcon from '@/components/AppIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: 'Contraseña' },
  placeholder: { type: String, default: '••••••••' },
})

const emit = defineEmits(['update:modelValue'])
const visible = ref(false)

function update(event) {
  emit('update:modelValue', event.target.value)
}
</script>

<template>
  <label class="field">
    <span>{{ label }}</span>
    <div class="input-wrap">
      <input
        :type="visible ? 'text' : 'password'"
        :value="modelValue"
        :placeholder="placeholder"
        @input="update"
      />
      <button type="button" class="eye" aria-label="Mostrar contraseña" @click="visible = !visible">
        <AppIcon :name="visible ? 'eyeOff' : 'eye'" :size="18" />
      </button>
    </div>
  </label>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.field span {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.field input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: 13px 44px 13px 16px;
  font-size: 14px;
  color: var(--ink-700);
  background: var(--rose-50);
  outline: none;
}

.field input:focus {
  border-color: var(--rose-300);
  background: var(--white);
}

.eye {
  position: absolute;
  right: 10px;
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-400);
  border-radius: 8px;
}

.eye:hover {
  color: var(--rose-600);
}
</style>
