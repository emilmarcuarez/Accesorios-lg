<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/AppIcon.vue'
import {
  createProduct,
  updateProduct,
  listCategories,
  uploadImage,
  listProducts,
} from '@/lib/db'
import { resolveImage, parseProductImages, parseProductOptions } from '@/utils/image'
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
    has_options: false,
    options: [],
    images: [],
    featured: false,
    is_new: false,
  }
}

const title = computed(() => (isEdit.value ? 'Editar producto' : 'Nuevo producto'))

const totalOptionsStock = computed(() => {
  if (!form.value.options || !form.value.options.length) return 0
  return form.value.options.reduce((sum, opt) => sum + (Number(opt.stock) || 0), 0)
})

onMounted(async () => {
  const res = await listCategories()
  categories.value = res.data || []
  if (isEdit.value) {
    const prod = await listProducts()
    const p = (prod.data || []).find((x) => x.id === Number(route.params.id))
    if (p) {
      const { hasOptions, options } = parseProductOptions(p.image)
      const imgs = parseProductImages(p.image)

      form.value = {
        name: p.name,
        description: p.description || '',
        category_id: p.category_id,
        price: p.price,
        old_price: p.old_price || 0,
        discount: p.discount || 0,
        stock: p.stock ?? 0,
        has_options: hasOptions,
        options: hasOptions && options.length
          ? options.map((opt, i) => ({
              id: opt.id || `opt_${Date.now()}_${i}`,
              name: opt.name || `Opción ${i + 1}`,
              image: opt.image || imgs[i] || '',
              stock: Number(opt.stock) || 0,
            }))
          : imgs.map((imgUrl, i) => ({
              id: `opt_${Date.now()}_${i}`,
              name: `Opción ${i + 1}`,
              image: imgUrl,
              stock: 1,
            })),
        images: imgs,
        featured: p.featured,
        is_new: p.is_new,
      }
    }
  }
})

// Sincronizar options cuando se activa has_options
watch(
  () => form.value.has_options,
  (val) => {
    if (val && form.value.images.length) {
      if (!form.value.options || form.value.options.length !== form.value.images.length) {
        form.value.options = form.value.images.map((imgUrl, idx) => {
          const prev = form.value.options && form.value.options[idx]
          return {
            id: prev?.id || `opt_${Date.now()}_${idx}`,
            name: prev?.name || `Opción ${idx + 1}`,
            image: imgUrl,
            stock: prev?.stock !== undefined ? Number(prev.stock) : Math.max(1, Math.floor((form.value.stock || 1) / form.value.images.length)),
          }
        })
      }
    }
  },
)

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
    form.value.options.push({
      id: `opt_${Date.now()}_${form.value.images.length}`,
      name: `Opción ${form.value.images.length}`,
      image: res.url,
      stock: 1,
    })
  }

  uploading.value = false
  uploadProgress.value = ''
  event.target.value = ''
}

function removeImageAt(idx) {
  form.value.images.splice(idx, 1)
  if (form.value.options && form.value.options.length > idx) {
    form.value.options.splice(idx, 1)
  }
}

function setAsMain(idx) {
  if (idx === 0) return
  moveImage(idx, 0)
}

function moveImage(fromIdx, toIdx) {
  if (toIdx < 0 || toIdx >= form.value.images.length) return
  const item = form.value.images.splice(fromIdx, 1)[0]
  form.value.images.splice(toIdx, 0, item)

  if (form.value.options && form.value.options.length) {
    const opt = form.value.options.splice(fromIdx, 1)[0]
    form.value.options.splice(toIdx, 0, opt)
  }
}

function sortOptionsByName() {
  if (!form.value.images || form.value.images.length <= 1) return

  // Sincronizar options si falta alguno
  if (!form.value.options) form.value.options = []
  while (form.value.options.length < form.value.images.length) {
    const i = form.value.options.length
    form.value.options.push({
      id: `opt_${Date.now()}_${i}`,
      name: `Opción ${i + 1}`,
      image: form.value.images[i],
      stock: 1,
    })
  }

  // Emparejar cada opción con su imagen
  const pairs = form.value.images.map((img, idx) => ({
    image: img,
    option: form.value.options[idx],
  }))

  // Ordenar de forma natural alfanumérica (Opción 1, Opción 2, Opción 10, etc.)
  pairs.sort((a, b) => {
    const nameA = (a.option?.name || '').trim()
    const nameB = (b.option?.name || '').trim()
    return nameA.localeCompare(nameB, undefined, { numeric: true, sensitivity: 'base' })
  })

  form.value.images = pairs.map((p) => p.image)
  form.value.options = pairs.map((p) => p.option)
}

async function save() {
  saving.value = true
  const imgs = (form.value.images || []).filter(Boolean)
  let imageValue = null
  let finalStock = Number(form.value.stock) || 0

  if (form.value.has_options && imgs.length > 0) {
    // Sincronizar y limpiar opciones
    const cleanOptions = imgs.map((url, idx) => {
      const opt = form.value.options[idx] || {}
      return {
        id: opt.id || `opt_${idx + 1}`,
        name: opt.name ? opt.name.trim() : `Opción ${idx + 1}`,
        image: url,
        stock: Number(opt.stock) >= 0 ? Number(opt.stock) : 0,
      }
    })
    finalStock = cleanOptions.reduce((s, o) => s + (Number(o.stock) || 0), 0)
    imageValue = JSON.stringify({
      has_options: true,
      options: cleanOptions,
      images: imgs,
    })
  } else {
    // Producto simple / solo (puede tener múltiples fotos en galería pero sin selección)
    imageValue = imgs.length > 1 ? JSON.stringify(imgs) : (imgs[0] || null)
  }

  const payload = {
    name: form.value.name,
    description: form.value.description ? form.value.description.trim() : null,
    category_id: form.value.category_id || null,
    price: form.value.price,
    old_price: form.value.old_price || 0,
    discount: form.value.discount || 0,
    stock: finalStock,
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

    <!-- Modalidad de producto: Simple vs Con Selección de Fotos / Opciones -->
    <div class="product-mode-box">
      <div class="mode-header">
        <span class="mode-title">✨ Modalidad del producto</span>
        <span class="mode-badge" :class="{ 'is-variants': form.has_options }">
          {{ form.has_options ? 'Con selección de variantes por foto' : 'Producto individual estándar' }}
        </span>
      </div>
      <div class="mode-cards">
        <label class="mode-card" :class="{ active: !form.has_options }">
          <input v-model="form.has_options" type="radio" :value="false" />
          <div class="mode-card-body">
            <div class="mode-card-title">
              <span class="mode-radio-dot"></span>
              <strong>Producto Individual / Solo</strong>
            </div>
            <p class="mode-card-desc">
              Tiene un stock único general. Puedes montarle varias fotos para que el cliente las vea en la galería sin que sean de selección obligatoria.
            </p>
          </div>
        </label>

        <label class="mode-card" :class="{ active: form.has_options }">
          <input v-model="form.has_options" type="radio" :value="true" />
          <div class="mode-card-body">
            <div class="mode-card-title">
              <span class="mode-radio-dot"></span>
              <strong>Producto con Selección de Fotos (Variantes)</strong>
            </div>
            <p class="mode-card-desc">
              Cada foto representa una opción a elegir (tono, color, modelo). Podrás asignarle su propio nombre y cantidad disponible a cada foto (ej: 2 de la opción A, 3 de la B).
            </p>
          </div>
        </label>
      </div>
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
          Sube todas las fotos que desees. La foto #1 será la portada principal del producto.
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

        <!-- Campo Stock: Automático si tiene opciones o Manual si es simple -->
        <div class="field">
          <div class="label-with-hint">
            <label>Stock</label>
            <span v-if="form.has_options" class="hint-pill">⚡ Suma automática de opciones</span>
          </div>
          <div v-if="form.has_options" class="stock-auto-box">
            <div class="stock-auto-value">{{ totalOptionsStock }} unidades</div>
            <span class="stock-auto-note">Calculado automáticamente con la suma del stock individual de cada foto</span>
          </div>
          <input v-else v-model.number="form.stock" type="number" min="0" placeholder="0" />
        </div>

        <div class="checks">
          <label class="admin-check">
            <input v-model="form.featured" type="checkbox" /> Destacado
          </label>
          <label class="admin-check">
            <input v-model="form.is_new" type="checkbox" /> Nuevo
          </label>
        </div>
      </div>
    </div>

    <!-- Gestor de Variantes / Opciones a todo lo ancho -->
    <div v-if="form.has_options && form.images.length" class="options-full-section">
      <div class="options-section-header">
        <div class="options-title-block">
          <div class="options-title-line">
            <span class="options-icon">🎨</span>
            <h3 class="options-main-title">Stock y orden de cada opción</h3>
          </div>
          <p class="options-main-desc">
            El orden de estas tarjetas es <strong>el mismo orden en que aparecen en la tienda</strong> (#1 es la portada principal y sale seleccionada por defecto). Puedes cambiar el orden con los botones o pulsar <strong>Ordenar A-Z</strong>.
          </p>
        </div>
        <div class="options-header-actions">
          <button
            v-if="form.images.length > 1"
            type="button"
            class="btn-sort-options"
            title="Ordenar opciones automáticamente por nombre (ej: Opción 1, 2, 3...)"
            @click="sortOptionsByName"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>
            </svg>
            <span>Ordenar A-Z (1, 2, 3...)</span>
          </button>
          <div class="options-total-badge">
            <span class="badge-label">Stock total:</span>
            <strong class="badge-count">{{ totalOptionsStock }} unidades</strong>
          </div>
        </div>
      </div>

      <div class="options-cards-grid">
        <div
          v-for="(imgUrl, idx) in form.images"
          :key="idx"
          class="variant-edit-card"
          :class="{ 'is-exhausted': (form.options[idx]?.stock || 0) <= 0 }"
        >
          <div class="card-visual-row">
            <div class="card-photo-box">
              <img :src="resolveImage(imgUrl)" :alt="`Foto ${idx + 1}`" />
              <span class="card-index-tag">#{{ idx + 1 }}</span>
            </div>
            <div class="card-header-meta">
              <div class="meta-tags-row">
                <span v-if="idx === 0" class="tag-primary-badge">⭐ Portada (#1)</span>
                <span v-if="(form.options[idx]?.stock || 0) <= 0" class="stock-pill-state out">
                  ✕ Agotado
                </span>
                <span v-else class="stock-pill-state in">
                  ● {{ form.options[idx]?.stock }} disp.
                </span>
              </div>
              <span class="card-photo-name-preview">
                {{ form.options[idx]?.name || `Opción ${idx + 1}` }}
              </span>
            </div>

            <!-- Botones directos para cambiar el orden de esta opción -->
            <div class="card-order-controls">
              <button
                v-if="idx > 0"
                type="button"
                class="order-ctrl-btn"
                title="Mover antes en la lista"
                @click="moveImage(idx, idx - 1)"
              >
                <AppIcon name="chevronLeft" :size="12" />
                <span class="btn-ctrl-label">Mover antes</span>
              </button>
              <button
                v-if="idx < form.images.length - 1"
                type="button"
                class="order-ctrl-btn"
                title="Mover después en la lista"
                @click="moveImage(idx, idx + 1)"
              >
                <span class="btn-ctrl-label">Mover después</span>
                <AppIcon name="chevronRight" :size="12" />
              </button>
              <button
                v-if="idx > 0"
                type="button"
                class="order-ctrl-btn make-cover-btn"
                title="Poner como la primera opción (#1 Portada)"
                @click="setAsMain(idx)"
              >
                ⭐ Poner 1ª
              </button>
            </div>
          </div>

          <div class="card-inputs-area">
            <div class="input-group">
              <label class="input-label">Nombre de la opción / tono:</label>
              <input
                v-if="form.options[idx]"
                v-model="form.options[idx].name"
                type="text"
                class="variant-input"
                :placeholder="`Ej: Tono ${idx + 1}, Rosa, Dorado...`"
              />
            </div>

            <div class="input-group">
              <div class="stock-label-bar">
                <label class="input-label">Stock de esta foto:</label>
                <div class="quick-stock-actions">
                  <button
                    type="button"
                    class="quick-pill-btn"
                    title="Poner en 0 (Agotar)"
                    @click="form.options[idx].stock = 0"
                  >
                    Agotar (0)
                  </button>
                  <button
                    type="button"
                    class="quick-pill-btn"
                    title="Añadir 1"
                    @click="form.options[idx].stock = (form.options[idx].stock || 0) + 1"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    class="quick-pill-btn"
                    title="Añadir 5"
                    @click="form.options[idx].stock = (form.options[idx].stock || 0) + 5"
                  >
                    +5
                  </button>
                </div>
              </div>

              <div class="stepper-box">
                <button
                  type="button"
                  class="stepper-btn"
                  :disabled="(form.options[idx]?.stock || 0) <= 0"
                  aria-label="Menos"
                  @click="form.options[idx].stock = Math.max(0, (form.options[idx].stock || 0) - 1)"
                >
                  <AppIcon name="minus" :size="14" />
                </button>
                <input
                  v-if="form.options[idx]"
                  v-model.number="form.options[idx].stock"
                  type="number"
                  min="0"
                  class="stepper-number"
                />
                <button
                  type="button"
                  class="stepper-btn"
                  aria-label="Más"
                  @click="form.options[idx].stock = (form.options[idx].stock || 0) + 1"
                >
                  <AppIcon name="plus" :size="14" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botones de Guardar y Cancelar al pie -->
    <div class="form-bottom-actions">
      <button class="admin-btn admin-btn-ghost" @click="router.push('/admin/productos')">
        Cancelar
      </button>
      <button class="admin-btn" :disabled="saving || uploading" @click="save">
        {{ saving ? 'Guardando...' : 'Guardar producto' }}
      </button>
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
  margin-bottom: 22px;
}

.form-page-title {
  font-family: var(--font-body);
  font-size: 24px;
  color: var(--ink-900);
}

/* Modalidad de Producto Switcher Box */
.product-mode-box {
  background: #fdfbfb;
  border: 1.5px solid #f1e2e6;
  border-radius: 14px;
  padding: 18px 22px;
  margin-bottom: 28px;
}

.mode-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-wrap: wrap;
  gap: 10px;
}

.mode-title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 700;
  color: #111111;
  letter-spacing: 0.02em;
}

.mode-badge {
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
  background: #f0f0f0;
  color: #555555;
  border: 1px solid #dcdcdc;
}

.mode-badge.is-variants {
  background: #fff0f3;
  color: #c92a54;
  border-color: #fccfd8;
}

.mode-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.mode-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  padding: 14px 16px;
  border-radius: 10px;
  background: #ffffff;
  border: 1.5px solid #e8e8e8;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-card input[type='radio'] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.mode-card.active {
  border-color: #111111;
  background: #ffffff;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.07);
}

.mode-card.active .mode-radio-dot {
  border-color: #111111;
  background: #111111;
  box-shadow: inset 0 0 0 3px #ffffff;
}

.mode-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mode-card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: #111111;
}

.mode-radio-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #bbb;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.mode-card-desc {
  font-size: 12px;
  color: #777777;
  line-height: 1.4;
  padding-left: 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 40px;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Sección de Variantes a todo lo ancho */
.options-full-section {
  margin-top: 32px;
  padding: 24px;
  background: #ffffff;
  border: 1.5px solid #f1e2e6;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}

.options-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #fce8ed;
  flex-wrap: wrap;
  gap: 14px;
}

.options-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-sort-options {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: #ffffff;
  border: 1.5px solid #d1d5db;
  color: #111827;
  font-weight: 600;
  font-size: 12.5px;
  padding: 8px 14px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-sort-options:hover {
  background: #fdf2f8;
  border-color: #ec4899;
  color: #be185d;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.15);
}

.options-title-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.options-icon {
  font-size: 20px;
}

.options-main-title {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 700;
  color: #111111;
  margin: 0;
}

.options-main-desc {
  font-size: 13px;
  color: #777777;
  margin: 4px 0 0 0;
}

.options-total-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #111111;
  color: #ffffff;
  padding: 8px 16px;
  border-radius: 30px;
  font-size: 13px;
}

.options-total-badge .badge-label {
  color: rgba(255, 255, 255, 0.75);
}

.options-total-badge .badge-count {
  color: #4ade80;
  font-weight: 700;
  font-size: 14px;
}

.options-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.variant-edit-card {
  background: #faf8f9;
  border: 1.5px solid #ebd9df;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  transition: all 0.2s ease;
}

.variant-edit-card:hover {
  border-color: #111111;
  background: #ffffff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  transform: translateY(-2px);
}

.variant-edit-card.is-exhausted {
  border-color: #fca5a5;
  background: #fff8f8;
}

.card-visual-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-photo-box {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #e0e0e0;
  background: #f0f0f0;
  flex-shrink: 0;
}

.card-photo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-index-tag {
  position: absolute;
  bottom: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.75);
  color: #ffffff;
  font-size: 9.5px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 4px;
}

.card-header-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.meta-tags-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-primary-badge {
  font-size: 10.5px;
  font-weight: 700;
  background: #fff3bf;
  color: #d97706;
  padding: 2px 7px;
  border-radius: 4px;
}

.stock-pill-state {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
}

.stock-pill-state.in {
  background: #dcfce7;
  color: #15803d;
}

.stock-pill-state.out {
  background: #fee2e2;
  color: #b91c1c;
}

.card-photo-name-preview {
  font-size: 13.5px;
  font-weight: 700;
  color: #111111;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-order-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-left: auto;
}

.order-ctrl-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #ffffff;
  border: 1px solid #dcdfe4;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.order-ctrl-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  color: #111827;
}

.order-ctrl-btn.make-cover-btn {
  background: #fffbeb;
  border-color: #fcd34d;
  color: #b45309;
}

.order-ctrl-btn.make-cover-btn:hover {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #78350f;
}

.btn-ctrl-label {
  display: inline;
}

@media (max-width: 480px) {
  .card-order-controls {
    width: 100%;
    margin-left: 0;
    margin-top: 4px;
  }
}

.card-inputs-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 12px;
  font-weight: 600;
  color: #444444;
}

.variant-input {
  width: 100% !important;
  box-sizing: border-box !important;
  border: 1.5px solid #dcdcdc !important;
  border-radius: 8px !important;
  padding: 9px 12px !important;
  font-size: 13.5px !important;
  color: #111111 !important;
  background: #ffffff !important;
  outline: none !important;
  transition: all 0.2s ease !important;
}

.variant-input:focus {
  border-color: #111111 !important;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06) !important;
}

.stock-label-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.quick-stock-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.quick-pill-btn {
  background: #ffffff;
  border: 1px solid #dcdcdc;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #666666;
  padding: 2px 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.quick-pill-btn:hover {
  border-color: #111111;
  color: #111111;
  background: #f5f5f5;
}

.stepper-box {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #dcdcdc;
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.2s ease;
}

.stepper-box:focus-within {
  border-color: #111111;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06);
}

.stepper-btn {
  width: 42px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #333333;
  cursor: pointer;
  transition: background 0.15s ease;
  flex-shrink: 0;
}

.stepper-btn:hover:not(:disabled) {
  background: #f0f0f0;
}

.stepper-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.stepper-number {
  flex: 1;
  min-width: 0;
  border: none !important;
  background: transparent !important;
  text-align: center;
  font-size: 15px;
  font-weight: 700;
  color: #111111;
  padding: 6px 0 !important;
  outline: none !important;
  -moz-appearance: textfield;
}

.stepper-number::-webkit-outer-spin-button,
.stepper-number::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.form-bottom-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 32px;
  padding-top: 22px;
  border-top: 1.5px solid #f1e2e6;
}

/* Stock Auto Box */
.stock-label-row,
.label-with-hint {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stock-auto-badge,
.hint-pill {
  font-size: 10.5px;
  background: #ecfdf5;
  color: #047857;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 600;
  border: 1px solid #a7f3d0;
}

.stock-auto-box {
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 10px;
  padding: 12px 14px;
}

.stock-auto-value {
  font-size: 18px;
  font-weight: 800;
  color: #166534;
  margin-bottom: 2px;
}

.stock-auto-note {
  font-size: 11.5px;
  color: #15803d;
  line-height: 1.3;
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
  .mode-cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }
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
  .options-full-section {
    padding: 16px 12px;
    margin-top: 24px;
  }
  .options-cards-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  .form-bottom-actions {
    flex-direction: column-reverse;
    gap: 10px;
    width: 100%;
  }
  .form-bottom-actions button {
    width: 100%;
    justify-content: center;
  }
}
</style>
