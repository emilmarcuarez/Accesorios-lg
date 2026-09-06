<script setup>
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { listGallery, addGallery, deleteGallery, uploadImage } from '@/lib/db'
import { resolveImage } from '@/utils/image'

const gallery = ref([])
const uploading = ref(false)

async function load() {
  const res = await listGallery()
  gallery.value = res.data || []
}

onMounted(load)

async function onFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploading.value = true
  const res = await uploadImage(file)
  if (res.error) {
    uploading.value = false
    alert(res.error)
    return
  }
  let ok = false
  for (let i = 0; i < 8; i++) {
    const check = await fetch(`/api/img?src=${encodeURIComponent(res.url)}`).catch(() => ({ ok: false }))
    if (check.ok) {
      ok = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 700))
  }
  uploading.value = false
  if (!ok) {
    alert('La imagen aún no está lista. Intenta de nuevo en unos segundos.')
    return
  }
  await addGallery(res.url)
  await load()
}

async function remove(item) {
  if (!confirm('¿Eliminar esta imagen?')) return
  await deleteGallery(item.id)
  await load()
}
</script>

<template>
  <div>
    <div class="admin-toolbar">
      <p class="admin-title">Galería · Inspírate con nosotros</p>
      <label class="admin-btn upload">
        <input type="file" accept="image/*" hidden @change="onFile" />
        <AppIcon name="plus" :size="16" />
        {{ uploading ? 'Subiendo...' : 'Subir imagen' }}
      </label>
    </div>
    <p class="admin-sub">Estas imágenes aparecen en la sección "Inspírate con nosotros" de la página principal.</p>

    <div v-if="gallery.length" class="gallery-grid">
      <div v-for="item in gallery" :key="item.id" class="gallery-item">
        <img :src="resolveImage(item.image)" :alt="'Imagen ' + item.id" />
        <button class="gallery-delete" aria-label="Eliminar" @click="remove(item)">
          <AppIcon name="trash" :size="16" />
        </button>
      </div>
    </div>
    <p v-else class="admin-empty">No hay imágenes. Sube la primera.</p>
  </div>
</template>

<style scoped>
.admin-title {
  font-size: 22px;
  color: var(--ink-900);
}

.admin-sub {
  color: var(--ink-500);
  font-size: 14px;
  margin-bottom: 22px;
}

.upload {
  cursor: pointer;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 20px;
}

.gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: var(--rose-50);
}

.gallery-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-delete {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: #c0392b;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.gallery-delete:hover {
  background: #fff;
}

@media (max-width: 800px) {
  .gallery-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 500px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    padding: 12px;
  }
  .upload {
    width: 100%;
    justify-content: center;
  }
}
</style>
