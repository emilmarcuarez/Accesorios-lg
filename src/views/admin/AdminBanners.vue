<script setup>
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSettingsStore, DEFAULT_BANNERS, DEFAULT_HERO } from '@/store/settings'
import { uploadImage } from '@/lib/db'
import { resolveImage } from '@/utils/image'

const settings = useSettingsStore()

const loading = ref(false)
const saved = ref(false)
const uploadingHero = ref(false)
const uploading1 = ref(false)
const uploading2 = ref(false)

const form = ref({
  hero: { ...DEFAULT_HERO },
  banner1: { ...DEFAULT_BANNERS.banner1 },
  banner2: { ...DEFAULT_BANNERS.banner2 },
})

onMounted(async () => {
  await settings.fetch(true)
  form.value = {
    hero: { ...(settings.hero || DEFAULT_HERO) },
    banner1: { ...settings.banners.banner1 },
    banner2: { ...settings.banners.banner2 },
  }
})

async function onImageUpload(bannerKey, event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (bannerKey === 'hero') uploadingHero.value = true
  else if (bannerKey === 'banner1') uploading1.value = true
  else uploading2.value = true

  const res = await uploadImage(file)

  if (res.error) {
    if (bannerKey === 'hero') uploadingHero.value = false
    else if (bannerKey === 'banner1') uploading1.value = false
    else uploading2.value = false
    alert(res.error)
    return
  }

  // Polling de verificación de imagen
  let ok = false
  for (let i = 0; i < 8; i++) {
    const check = await fetch(`/api/img?src=${encodeURIComponent(res.url)}`).catch(() => ({ ok: false }))
    if (check.ok) {
      ok = true
      break
    }
    await new Promise((resolve) => setTimeout(resolve, 700))
  }

  if (bannerKey === 'hero') uploadingHero.value = false
  else if (bannerKey === 'banner1') uploading1.value = false
  else uploading2.value = false

  if (!ok) {
    alert('La imagen tardó en procesarse. Se asignó la URL pero puede tardar unos segundos en reflejarse.')
  }

  form.value[bannerKey].image = res.url
}

async function save() {
  loading.value = true
  saved.value = false
  await Promise.all([
    settings.saveHero(form.value.hero),
    settings.saveBanners({ banner1: form.value.banner1, banner2: form.value.banner2 }),
  ])
  loading.value = false
  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 4000)
}

function restoreDefaults() {
  if (!confirm('¿Deseas restablecer los textos e imágenes originales de la portada y los banners?')) return
  form.value = {
    hero: { ...DEFAULT_HERO },
    banner1: { ...DEFAULT_BANNERS.banner1 },
    banner2: { ...DEFAULT_BANNERS.banner2 },
  }
}
</script>

<template>
  <div class="banners-admin">
    <div class="admin-toolbar">
      <div>
        <h1 class="admin-title">Banners de la Página de Inicio</h1>
        <p class="admin-subtitle">
          Edita los textos, enlaces e imágenes de las dos secciones promocionales de la portada con vista previa en vivo.
        </p>
      </div>
      <div class="toolbar-actions">
        <button type="button" class="admin-btn admin-btn-ghost" @click="restoreDefaults">
          Restablecer originales
        </button>
        <button type="button" class="admin-btn save-btn" :disabled="loading" @click="save">
          <AppIcon name="check" :size="16" />
          {{ loading ? 'Guardando...' : 'Guardar cambios' }}
        </button>
      </div>
    </div>

    <div v-if="saved" class="alert-success">
      <AppIcon name="check" :size="18" />
      <span>¡La portada y los banners han sido actualizados con éxito en la tienda!</span>
    </div>

    <!-- ================= BANNER PRINCIPAL (HERO / CABECERA) ================= -->
    <div class="banner-box hero-admin-box">
      <div class="banner-box-header">
        <div class="banner-badge badge-hero">
          <AppIcon name="sparkles" :size="14" />
          Cabecera Principal (Portada / Hero)
        </div>
        <span class="preview-hint">Imagen de fondo y textos principales de la tienda</span>
      </div>

      <div class="banner-fields">
        <!-- Subida de imagen Hero -->
        <div class="field-row">
          <label>Imagen de Fondo del Hero</label>
          <div class="image-uploader">
            <div class="image-preview hero-preview-box">
              <img
                v-if="form.hero.image"
                :src="resolveImage(form.hero.image)"
                alt="Portada tienda"
              />
              <div v-else class="no-img">Sin imagen</div>
            </div>
            <div class="upload-controls">
              <label class="btn-upload" :class="{ disabled: uploadingHero }">
                <AppIcon name="download" :size="16" />
                {{ uploadingHero ? 'Subiendo imagen...' : 'Subir nueva imagen para el Hero' }}
                <input
                  type="file"
                  accept="image/*"
                  :disabled="uploadingHero"
                  @change="onImageUpload('hero', $event)"
                />
              </label>
              <button
                type="button"
                class="btn-reset-img"
                @click="form.hero.image = DEFAULT_HERO.image"
              >
                Restablecer imagen predeterminada
              </button>
              <small class="upload-help">
                Se almacena en el servidor de imágenes y se sincroniza en Vercel automáticamente.
              </small>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="field-row">
            <label>Badge Superior (Pastilla)</label>
            <input
              v-model="form.hero.badge"
              type="text"
              placeholder="Colección Exclusiva 2025"
              class="input-text"
            />
          </div>
          <div class="field-row">
            <label>Texto Superior (Eyebrow)</label>
            <input
              v-model="form.hero.eyebrow"
              type="text"
              placeholder="Pequeños detalles,"
              class="input-text"
            />
          </div>
        </div>

        <div class="grid-2">
          <div class="field-row">
            <label>Título (Palabra 1)</label>
            <input
              v-model="form.hero.title"
              type="text"
              placeholder="grandes"
              class="input-text"
            />
          </div>
          <div class="field-row">
            <label>Palabra Acentuada (Cursiva / Rosa)</label>
            <input
              v-model="form.hero.titleAccent"
              type="text"
              placeholder="recuerdos"
              class="input-text"
            />
          </div>
        </div>

        <div class="field-row">
          <label>Texto Descriptivo</label>
          <input
            v-model="form.hero.text"
            type="text"
            placeholder="Accesorios que cuentan tu historia y realzan tu esencia."
            class="input-text"
          />
        </div>

        <div class="grid-2">
          <div class="field-row">
            <label>Texto del Botón</label>
            <input
              v-model="form.hero.buttonText"
              type="text"
              placeholder="Descubre la colección"
              class="input-text"
            />
          </div>
          <div class="field-row">
            <label>Enlace del Botón</label>
            <input
              v-model="form.hero.buttonLink"
              type="text"
              placeholder="/tienda"
              class="input-text"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="banners-grid">
      <!-- ================= BANNER 1 (ROSA) ================= -->
      <div class="banner-box">
        <div class="banner-box-header">
          <div class="banner-badge badge-rose">Banner Izquierdo (Estilo Rosa)</div>
          <span class="preview-hint">Vista previa en tiempo real abajo</span>
        </div>

        <!-- Formulario Banner 1 -->
        <div class="banner-fields">
          <div class="field-row">
            <label>Título del Banner</label>
            <textarea
              v-model="form.banner1.title"
              rows="2"
              placeholder="Para ti, con amor"
              class="input-area"
            ></textarea>
            <small class="field-help">Puedes usar Enter para dar un salto de línea.</small>
          </div>

          <div class="field-row">
            <label>Texto descriptivo / Subtítulo</label>
            <input
              v-model="form.banner1.text"
              type="text"
              placeholder="Detalles que te hacen brillar todos los días."
              class="input-text"
            />
          </div>

          <div class="grid-2">
            <div class="field-row">
              <label>Texto del Botón</label>
              <input
                v-model="form.banner1.buttonText"
                type="text"
                placeholder="Nuestra alegría para ti"
                class="input-text"
              />
            </div>
            <div class="field-row">
              <label>Enlace del Botón</label>
              <input
                v-model="form.banner1.buttonLink"
                type="text"
                placeholder="/tienda"
                class="input-text"
              />
            </div>
          </div>

          <!-- Imagen Banner 1 -->
          <div class="image-upload-block">
            <label>Imagen del Banner</label>
            <div class="image-row">
              <img
                v-if="form.banner1.image"
                :src="resolveImage(form.banner1.image)"
                class="banner-thumb"
                alt="Banner 1"
              />
              <div class="upload-actions">
                <label class="upload-button">
                  <input type="file" accept="image/*" hidden @change="onImageUpload('banner1', $event)" />
                  <AppIcon name="download" :size="15" />
                  {{ uploading1 ? 'Subiendo imagen...' : 'Subir nueva foto' }}
                </label>
                <input
                  v-model="form.banner1.image"
                  type="text"
                  placeholder="O pega la ruta / URL de la imagen..."
                  class="url-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Vista previa en vivo Banner 1 -->
        <div class="live-preview-box">
          <span class="preview-tag">VISTA PREVIA EN VIVO</span>
          <div class="preview-card promo-rose">
            <div class="preview-copy">
              <h3 class="preview-title">{{ form.banner1.title }}</h3>
              <p class="preview-text">{{ form.banner1.text }}</p>
              <div class="preview-btn btn-light">{{ form.banner1.buttonText || 'Botón' }}</div>
            </div>
            <div class="preview-media">
              <img :src="resolveImage(form.banner1.image)" alt="Preview 1" />
            </div>
          </div>
        </div>
      </div>

      <!-- ================= BANNER 2 (CREMA) ================= -->
      <div class="banner-box">
        <div class="banner-box-header">
          <div class="banner-badge badge-cream">Banner Derecho (Estilo Crema)</div>
          <span class="preview-hint">Vista previa en tiempo real abajo</span>
        </div>

        <!-- Formulario Banner 2 -->
        <div class="banner-fields">
          <div class="field-row">
            <label>Título del Banner</label>
            <textarea
              v-model="form.banner2.title"
              rows="2"
              placeholder="El regalo perfecto"
              class="input-area"
            ></textarea>
            <small class="field-help">Puedes usar Enter para dar un salto de línea.</small>
          </div>

          <div class="field-row">
            <label>Texto descriptivo / Subtítulo</label>
            <input
              v-model="form.banner2.text"
              type="text"
              placeholder="Sorprende a quien más amas con algo inolvidable."
              class="input-text"
            />
          </div>

          <div class="grid-2">
            <div class="field-row">
              <label>Texto del Botón</label>
              <input
                v-model="form.banner2.buttonText"
                type="text"
                placeholder="Ver opciones de regalo"
                class="input-text"
              />
            </div>
            <div class="field-row">
              <label>Enlace del Botón</label>
              <input
                v-model="form.banner2.buttonLink"
                type="text"
                placeholder="/tienda/personalizados"
                class="input-text"
              />
            </div>
          </div>

          <!-- Imagen Banner 2 -->
          <div class="image-upload-block">
            <label>Imagen del Banner</label>
            <div class="image-row">
              <img
                v-if="form.banner2.image"
                :src="resolveImage(form.banner2.image)"
                class="banner-thumb"
                alt="Banner 2"
              />
              <div class="upload-actions">
                <label class="upload-button">
                  <input type="file" accept="image/*" hidden @change="onImageUpload('banner2', $event)" />
                  <AppIcon name="download" :size="15" />
                  {{ uploading2 ? 'Subiendo imagen...' : 'Subir nueva foto' }}
                </label>
                <input
                  v-model="form.banner2.image"
                  type="text"
                  placeholder="O pega la ruta / URL de la imagen..."
                  class="url-input"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Vista previa en vivo Banner 2 -->
        <div class="live-preview-box">
          <span class="preview-tag">VISTA PREVIA EN VIVO</span>
          <div class="preview-card promo-cream">
            <div class="preview-copy">
              <h3 class="preview-title preview-title-dark">{{ form.banner2.title }}</h3>
              <p class="preview-text preview-text-dark">{{ form.banner2.text }}</p>
              <div class="preview-btn btn-ghost">
                {{ form.banner2.buttonText || 'Botón' }}
                <AppIcon name="chevronRight" :size="14" />
              </div>
            </div>
            <div class="preview-media">
              <img :src="resolveImage(form.banner2.image)" alt="Preview 2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banners-admin {
  font-family: var(--font-body);
}

.admin-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 4px;
}

.admin-subtitle {
  color: var(--ink-400);
  font-size: 13px;
  margin-top: 2px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.save-btn {
  background: var(--rose-600);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
}

.save-btn:hover {
  background: var(--rose-700);
}

.alert-success {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
  padding: 12px 18px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-weight: 600;
  font-size: 14px;
}

.banners-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1100px) {
  .banners-grid {
    grid-template-columns: 1fr;
  }
}

.banner-box {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.banner-box-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.banner-badge {
  font-size: 13px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 8px;
}

.hero-admin-box {
  margin-bottom: 28px;
}

.badge-hero {
  background: var(--rose-gradient);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.badge-rose {
  background: #fdf2f4;
  color: var(--rose-600);
  border: 1px solid #fed7df;
}

.badge-cream {
  background: #fff5f1;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

.hero-preview-box {
  width: 260px !important;
  height: 110px !important;
}

.btn-reset-img {
  background: none;
  border: none;
  color: var(--ink-500);
  font-size: 12px;
  text-decoration: underline;
  cursor: pointer;
  padding: 2px 0;
  text-align: left;
}

.btn-reset-img:hover {
  color: var(--rose-600);
}

.preview-hint {
  font-size: 12px;
  color: var(--ink-400);
}

.banner-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-row label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
  margin-bottom: 6px;
}

.input-text,
.input-area {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  background: #ffffff;
  color: var(--ink-800);
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s;
}

.input-text:focus,
.input-area:focus {
  border-color: var(--rose-400);
}

.input-area {
  resize: vertical;
}

.field-help {
  font-size: 11px;
  color: var(--ink-400);
  margin-top: 4px;
  display: block;
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.image-upload-block {
  margin-top: 6px;
}

.image-upload-block label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-700);
  margin-bottom: 8px;
}

.image-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.banner-thumb {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  border: 1px solid var(--line);
  background: var(--rose-50);
}

.upload-actions {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px dashed var(--rose-300);
  border-radius: 8px;
  color: var(--rose-600);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  width: fit-content;
  background: var(--rose-50);
}

.upload-button:hover {
  background: #fee7ec;
}

.url-input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  color: var(--ink-700);
}

/* Live Preview */
.live-preview-box {
  margin-top: 10px;
  background: #f8fafc;
  border: 1px dashed var(--line);
  border-radius: 12px;
  padding: 16px;
}

.preview-tag {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: var(--ink-400);
  margin-bottom: 10px;
}

.preview-card {
  display: flex;
  border-radius: 14px;
  overflow: hidden;
  min-height: 190px;
}

.promo-rose {
  background: var(--rose-gradient);
  color: #ffffff;
}

.promo-cream {
  background: linear-gradient(135deg, #fff5f1, #ffe8ef);
  color: var(--ink-900);
}

.preview-copy {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.preview-title {
  font-size: 20px;
  font-weight: 700;
  line-height: 1.15;
  white-space: pre-line;
  color: #ffffff;
}

.preview-title-dark {
  color: var(--ink-900);
}

.preview-text {
  font-size: 13px;
  opacity: 0.9;
  color: #ffffff;
}

.preview-text-dark {
  color: var(--ink-600);
}

.preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  width: fit-content;
  margin-top: 4px;
}

.btn-light {
  background: #ffffff;
  color: var(--rose-600);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
}

.btn-ghost {
  background: #ffffff;
  color: var(--ink-900);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.preview-media {
  width: 40%;
  overflow: hidden;
}

.preview-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
