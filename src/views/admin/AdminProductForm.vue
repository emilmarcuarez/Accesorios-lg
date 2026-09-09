<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import {
  createProduct,
  updateProduct,
  listCategories,
  uploadImage,
  listProducts,
} from '@/lib/db'
import { resolveImage, parseProductImages } from '@/utils/image'
import { useCatalogStore } from '@/store/catalog'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()

const isEdit = computed(() => Boolean(route.params.id))
const categories = ref([])
const uploading = ref(false)
const uploadProgress = ref('')
const saving = ref(false)
const form = ref(emptyForm())

function emptyForm() {
  return {
    name: '',
    description: '',
    category_id: '',
    price: 0,
    old_price: 0,
    discount: 0,
    stock: 0,
    images: [],
    featured: false,
    is_new: false,
  }
}

const title = computed(() => (isEdit.value ? 'Editar producto' : 'Nuevo producto'))

onMounted(async () => {
  const res = await listCategories()
  categories.value = res.data || []
  if (isEdit.value) {
    const prod = await listProducts()
    const p = (prod.data || []).find((x) => x.id === Number(route.params.id))
    if (p) {
      form.value = {
        name: p.name,
        description: p.description || '',
        category_id: p.category_id,
        price: p.price,
        old_price: p.old_price || 0,
        discount: p.discount || 0,
        stock: p.stock ?? 0,
        images: parseProductImages(p.image),
        featured: p.featured,
        is_new: p.is_new,
      }
    }
  }
})

async function onFiles(event) {
  const files = Array.from(event.target.files || [])
  if (!files.length) return
  uploading.value = true

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    uploadProgress.value =
      files.length > 1
        ? `Subiendo ${i + 1} de ${files.length}...`
        : 'Subiendo imagen...'

    const res = await uploadImage(file)
    if (res.error) {
      alert(`Error al subir ${file.name}: ${res.error}`)
      continue
    }

    // Verificar disponibilidad
    for (let j = 0; j < 6; j++) {
      const check = await fetch(`/api/img?src=${encodeURIComponent(res.url)}`).catch(() => ({ ok: false }))
      if (check.ok) break
      await new Promise((resolve) => setTimeout(resolve, 600))
    }

    form.value.images.push(res.url)
  }

  uploading.value = false
  uploadProgress.value = ''
  event.target.value = ''
}

function removeImageAt(idx) {
  form.value.images.splice(idx, 1)
}

function setAsMain(idx) {
  if (idx === 0) return
  const item = form.value.images.splice(idx, 1)[0]
  form.value.images.unshift(item)
}

function moveImage(fromIdx, toIdx) {
  if (toIdx < 0 || toIdx >= form.value.images.length) return
  const item = form.value.images.splice(fromIdx, 1)[0]
  form.value.images.splice(toIdx, 0, item)
}

async function save() {
  saving.value = true
  const imgs = (form.value.images || []).filter(Boolean)
  const imageValue = imgs.length > 1 ? JSON.stringify(imgs) : (imgs[0] || null)

  const payload = {
    name: form.value.name,
    description: form.value.description ? form.value.description.trim() : null,
    category_id: form.value.category_id || null,
    price: form.value.price,
    old_price: form.value.old_price || 0,
    discount: form.value.discount || 0,
    stock: form.value.stock ?? 0,
    image: imageValue,
    featured: form.value.featured,
    is_new: form.value.is_new,
  }

  if (isEdit.value) await updateProduct(route.params.id, payload)
  else await createProduct(payload)

  await catalog.fetch(true)
  saving.value = false
  router.push('/admin/productos')
}
</script>

<template>
  <div class="product-form-page">
    <div class="form-top">
      <button class="admin-mini" aria-label="Volver" @click="router.push('/admin/productos')">
        <AppIcon name="chevronLeft" :size="18" />
      </button>
      <h2 class="form-page-title">{{ title }}</h2>
    </div>

    <div class="form-grid">
      <!-- Columna de Imágenes Múltiples -->
      <div class="form-col">
        <div class="label-row">
          <span class="label">Fotos del producto ({{ form.images.length }})</span>
          <span v-if="form.images.length" class="label-badge">La #1 es la portada</span>
        </div>

        <!-- Si hay imágenes cargadas -->
        <div v-if="form.images.length" class="multi-img-panel">
          <!-- Vista principal de la portada -->
          <div class="main-preview-container">
            <img :src="resolveImage(form.images[0])" class="main-preview-img" alt="Foto principal" />
            <div class="main-tag">
              ⭐ Foto de Portada (Principal)
            </div>
            <div class="main-overlay">
              <button type="button" class="action-pill danger" @click="removeImageAt(0)">
                <AppIcon name="trash" :size="14" /> Quitar
              </button>
            </div>
          </div>

          <!-- Cuadrícula de miniaturas para ordenar y gestionar -->
          <div class="thumbs-grid">
            <div
              v-for="(imgUrl, idx) in form.images"
              :key="idx"
              class="thumb-box"
              :class="{ 'is-main': idx === 0 }"
            >
              <img :src="resolveImage(imgUrl)" :alt="`Foto ${idx + 1}`" />
              <span class="thumb-num">#{{ idx + 1 }}</span>
              <span v-if="idx === 0" class="main-star-icon">⭐</span>

              <!-- Controles flotantes en cada miniatura -->
              <div class="thumb-hover-actions">
                <button
                  v-if="idx > 0"
                  type="button"
                  class="thumb-icon-btn star-btn"
                  title="Establecer como foto principal"
                  @click="setAsMain(idx)"
                >
                  Principal
                </button>
                <div class="nav-arrows">
                  <button
                    v-if="idx > 0"
                    type="button"
                    class="thumb-icon-btn"
                    title="Mover a la izquierda"
                    @click="moveImage(idx, idx - 1)"
                  >
                    ◀
                  </button>
                  <button
                    v-if="idx < form.images.length - 1"
                    type="button"
                    class="thumb-icon-btn"
                    title="Mover a la derecha"
                    @click="moveImage(idx, idx + 1)"
                  >
                    ▶
                  </button>
                </div>
                <button
                  type="button"
                  class="thumb-icon-btn del-btn"
                  title="Eliminar foto"
                  @click="removeImageAt(idx)"
                >
                  <AppIcon name="trash" :size="13" />
                </button>
              </div>
            </div>

            <!-- Botón para añadir más fotos -->
            <label class="add-thumb-btn" :class="{ uploading: uploading }">
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                :disabled="uploading"
                @change="onFiles"
              />
              <span class="add-thumb-icon">
                <AppIcon v-if="!uploading" name="plus" :size="20" />
                <span v-else class="spin-icon">⏳</span>
              </span>
              <span class="add-thumb-txt">{{ uploading ? (uploadProgress || 'Subiendo...') : '+ Añadir' }}</span>
            </label>
          </div>
        </div>

        <!-- Dropzone inicial cuando todavía no hay fotos -->
        <div v-else class="dropzone" :class="{ uploading: uploading }">
          <input
            type="file"
            accept="image/*"
            multiple
            hidden
            id="multiImageFiles"
            :disabled="uploading"
            @change="onFiles"
          />
          <label for="multiImageFiles" class="dropzone-inner">
            <span class="dropzone-icon">
              <AppIcon v-if="!uploading" name="bag" :size="28" />
              <span v-else class="spin-icon">⏳</span>
            </span>
            <span class="dropzone-text">
              {{ uploading ? (uploadProgress || 'Subiendo imágenes...') : 'Subir fotos del producto' }}
            </span>
            <span class="dropzone-sub">Puedes seleccionar varias fotos a la vez (PNG o JPG)</span>
          </label>
        </div>

        <p class="hint">
          Sube todas las fotos que desees. La foto #1 será la portada y en la tienda los clientes podrán deslizarlas o elegir entre las miniaturas.
        </p>
      </div>

      <!-- Columna de Datos del Producto -->
      <div class="form-col">
        <div class="field">
          <label>Nombre</label>
          <input v-model="form.name" type="text" placeholder="Nombre del producto" />
        </div>

        <div class="field">
          <label>Descripción</label>
          <textarea
            v-model="form.description"
            rows="4"
            placeholder="Descripción detallada del producto (materiales, medidas, cuidados, etc.)..."
          ></textarea>
        </div>

        <div class="field">
          <label>Categoría</label>
          <select v-model="form.category_id">
            <option value="">Sin categoría</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
          </select>
        </div>

        <div class="grid-3">
          <div class="field">
            <label>Precio (USD)</label>
            <input v-model.number="form.price" type="number" step="0.01" />
          </div>
          <div class="field">
            <label>Precio antiguo</label>
            <input v-model.number="form.old_price" type="number" step="0.01" />
          </div>
          <div class="field">
            <label>Descuento %</label>
            <input v-model.number="form.discount" type="number" min="0" max="100" />
          </div>
        </div>

        <div v-if="form.discount > 0 && form.price > 0" class="discount-live-calc">
          <span>🏷️ Precio final en tienda (-{{ form.discount }}%):</span>
          <strong>${{ (form.price * (1 - form.discount / 100)).toFixed(2) }}</strong>
          <span class="calc-save">(Ahorro: ${{ (form.price * (form.discount / 100)).toFixed(2) }})</span>
        </div>

        <div class="field">
          <label>Stock</label>
          <input v-model.number="form.stock" type="number" />
        </div>

        <div class="checks">
          <label class="admin-check">
            <input v-model="form.featured" type="checkbox" /> Destacado
          </label>
          <label class="admin-check">
            <input v-model="form.is_new" type="checkbox" /> Nuevo
          </label>
        </div>

        <div class="form-actions">
          <button class="admin-btn admin-btn-ghost" @click="router.push('/admin/productos')">
            Cancelar
          </button>
          <button class="admin-btn" :disabled="saving || uploading" @click="save">
            {{ saving ? 'Guardando...' : 'Guardar producto' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.product-form-page {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  padding: 28px 32px;
}

.form-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 26px;
}

.form-page-title {
  font-family: var(--font-body);
  font-size: 24px;
  color: var(--ink-900);
}

.form-grid {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 40px;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
}

.label-badge {
  font-size: 11px;
  background: #fff0f3;
  color: #c92a54;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
  border: 1px solid #fed7e2;
}

/* Panel Multi-Imágenes */
.multi-img-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.main-preview-container {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--rose-50);
  border: 2px solid var(--rose-200);
  position: relative;
  box-shadow: var(--shadow-sm);
}

.main-preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.main-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(18, 18, 20, 0.75);
  backdrop-filter: blur(6px);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.02em;
}

.main-overlay {
  position: absolute;
  bottom: 10px;
  right: 10px;
}

.action-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #e0e0e0;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.2s ease;
}

.action-pill.danger {
  color: #c0392b;
}

.action-pill.danger:hover {
  background: #fdf2f2;
  border-color: #e74c3c;
}

/* Miniaturas */
.thumbs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.thumb-box {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f8f8f8;
  border: 2px solid #e8e8e8;
  transition: all 0.2s ease;
}

.thumb-box.is-main {
  border-color: #111111;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.thumb-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-num {
  position: absolute;
  top: 4px;
  left: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: #ffffff;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}

.main-star-icon {
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 11px;
}

.thumb-hover-actions {
  position: absolute;
  inset: 0;
  background: rgba(30, 20, 25, 0.72);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  padding: 4px;
}

.thumb-box:hover .thumb-hover-actions {
  opacity: 1;
}

.thumb-icon-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  border-radius: 4px;
  color: #111111;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.thumb-icon-btn:hover {
  background: #ffffff;
  transform: scale(1.05);
}

.thumb-icon-btn.star-btn {
  background: #fff3bf;
  color: #d97706;
  font-size: 9px;
  padding: 2px 6px;
}

.nav-arrows {
  display: flex;
  gap: 4px;
}

.thumb-icon-btn.del-btn {
  background: #fee2e2;
  color: #b91c1c;
}

/* Botón Añadir más fotos */
.add-thumb-btn {
  aspect-ratio: 1;
  border: 2px dashed var(--rose-300);
  border-radius: 8px;
  background: var(--rose-50);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--rose-600);
}

.add-thumb-btn:hover:not(.uploading) {
  border-color: var(--rose-500);
  background: #fff0f3;
  transform: translateY(-2px);
}

.add-thumb-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.add-thumb-txt {
  font-size: 10.5px;
  font-weight: 700;
  text-align: center;
  padding: 0 4px;
}

/* Dropzone grande inicial */
.dropzone {
  width: 100%;
  aspect-ratio: 1;
  border: 2px dashed var(--rose-300);
  border-radius: var(--radius-md);
  background: var(--rose-50);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dropzone-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--rose-500);
  padding: 20px;
  text-align: center;
}

.dropzone-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.dropzone-text {
  font-weight: 600;
  font-size: 14px;
}

.dropzone-sub {
  font-size: 12px;
  color: var(--ink-400);
}

.spin-icon {
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

.hint {
  color: var(--ink-400);
  font-size: 12px;
  line-height: 1.4;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
}

.field input,
.field select,
.field textarea {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 14px;
  color: var(--ink-700);
  background: var(--rose-50);
  outline: none;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  font-family: inherit;
  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--rose-300);
  background: var(--white);
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.discount-live-calc {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  background: #fff0f3;
  border: 1px solid #fed7e2;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 13px;
  color: #c92a54;
}

.discount-live-calc strong {
  font-size: 15px;
  color: #9f1239;
}

.calc-save {
  font-size: 12px;
  color: #831843;
}

.checks {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
  justify-content: flex-end;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .main-preview-container {
    max-width: 320px;
    margin: 0 auto;
  }
  .thumbs-grid {
    max-width: 320px;
    margin: 0 auto;
  }
  .hint {
    text-align: center;
  }
  .grid-3 {
    grid-template-columns: 1fr;
    gap: 14px;
  }
}

@media (max-width: 600px) {
  .product-form-page {
    padding: 18px 14px;
    border-radius: 12px;
  }
  .form-top {
    margin-bottom: 20px;
  }
  .form-page-title {
    font-size: 20px;
  }
  .form-actions {
    flex-direction: column-reverse;
    gap: 8px;
    width: 100%;
  }
  .form-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style>
