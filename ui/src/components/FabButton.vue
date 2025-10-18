<template>
  <q-btn
    fab
    :icon="icon"
    :color="color"
    class="fab-button"
    @click="handleClick"
  />
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  icon: {
    type: String,
    required: true
  },
  color: {
    type: String,
    default: 'secondary' 
  },
  action: {
    type: Function,
    required: true
  }
})

const handleClick = () => {
  props.action()
}
</script>

<style scoped>
.fab-button {
  position: fixed;
  bottom: 80px;
  right: 16px;
  z-index: 10;
}
</style>
