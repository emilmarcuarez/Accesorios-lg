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
import { resolveImage } from '@/utils/image'
import { useCatalogStore } from '@/store/catalog'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()

const isEdit = computed(() => Boolean(route.params.id))
const categories = ref([])
const uploading = ref(false)
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
    image: '',
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
        image: p.image || '',
        featured: p.featured,
        is_new: p.is_new,
      }
    }
  }
})

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
    alert('La imagen aún no está lista. Intenta subirla de nuevo en unos segundos.')
    return
  }
  form.value.image = res.url
}

function removeImage() {
  form.value.image = ''
}

async function save() {
  saving.value = true
  const payload = {
    ...form.value,
    description: form.value.description ? form.value.description.trim() : null,
    category_id: form.value.category_id || null,
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
      <div class="form-col">
        <div class="label">Imagen</div>
        <div class="dropzone" :class="{ loaded: form.image, uploading: uploading }">
          <template v-if="form.image">
            <img :src="resolveImage(form.image)" class="preview" alt="Vista previa" />
            <div class="preview-overlay">
              <button class="preview-action" @click="removeImage">
                <AppIcon name="trash" :size="17" /> Quitar
              </button>
            </div>
          </template>
          <template v-else>
            <input type="file" accept="image/*" hidden id="imageFile" @change="onFile" />
            <label for="imageFile" class="dropzone-inner">
              <span class="dropzone-icon"><AppIcon name="bag" :size="26" /></span>
              <span class="dropzone-text">{{ uploading ? 'Subiendo...' : 'Subir imagen' }}</span>
              <span class="dropzone-sub">PNG o JPG</span>
            </label>
          </template>
        </div>
        <p class="hint">Recomendado: 1200×1200 px (cuadrada)</p>
      </div>

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
          <button class="admin-btn" :disabled="saving" @click="save">
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
  grid-template-columns: 340px 1fr;
  gap: 40px;
}

.form-col {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
}

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

.preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(40, 26, 30, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.dropzone:hover .preview-overlay {
  opacity: 1;
}

.preview-action {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--white);
  color: #c0392b;
  padding: 10px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
}

.hint {
  color: var(--ink-400);
  font-size: 12px;
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
  .dropzone {
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
