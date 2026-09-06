<script setup>
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import {
  useSettingsStore,
  DEFAULT_BANNERS,
  DEFAULT_HERO,
  DEFAULT_REGISTER_BANNER,
  DEFAULT_TOP_BAR,
  DEFAULT_ABOUT,
} from '@/store/settings'
import { uploadImage, uploadHeroMedia, deleteHeroMedia } from '@/lib/db'
import { resolveImage } from '@/utils/image'

const settings = useSettingsStore()

const loading = ref(false)
const saved = ref(false)
const uploadingHero = ref(false)
const uploadingHeroVideo = ref(false)
const uploading1 = ref(false)
const uploading2 = ref(false)
const uploadingAbout = ref(false)

const form = ref({
  topBar: { ...DEFAULT_TOP_BAR },
  hero: { ...DEFAULT_HERO },
  banner1: { ...DEFAULT_BANNERS.banner1 },
  banner2: { ...DEFAULT_BANNERS.banner2 },
  registerBanner: { ...DEFAULT_REGISTER_BANNER },
  about: { ...DEFAULT_ABOUT },
})

async function onHeroVideoUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (file.size > 100 * 1024 * 1024) {
    alert('El video supera el límite de 100 MB. Por favor comprímelo o elige un video más corto.')
    return
  }

  uploadingHeroVideo.value = true
  const previousUrl = form.value.hero.video || null
  const res = await uploadHeroMedia(file, previousUrl)
  uploadingHeroVideo.value = false

  if (res.error) {
    alert(res.error)
    return
  }

  form.value.hero.video = res.url
  form.value.hero.mediaType = 'video'
}

async function removeHeroVideo() {
  if (!confirm('¿Deseas eliminar el video del servidor de almacenamiento para limpiar espacio?')) return
  if (form.value.hero.video) {
    await deleteHeroMedia(form.value.hero.video)
  }
  form.value.hero.video = ''
  form.value.hero.mediaType = 'image'
}

onMounted(async () => {
  await settings.fetch(true)
  form.value = {
    topBar: { ...DEFAULT_TOP_BAR, ...(settings.topBar || {}) },
    hero: { ...(settings.hero || DEFAULT_HERO) },
    banner1: { ...settings.banners.banner1 },
    banner2: { ...settings.banners.banner2 },
    registerBanner: { ...DEFAULT_REGISTER_BANNER, ...(settings.registerBanner || {}) },
    about: { ...DEFAULT_ABOUT, ...(settings.about || {}) },
  }
})

async function onImageUpload(bannerKey, event) {
  const file = event.target.files?.[0]
  if (!file) return

  if (bannerKey === 'hero') uploadingHero.value = true
  else if (bannerKey === 'banner1') uploading1.value = true
  else if (bannerKey === 'banner2') uploading2.value = true
  else if (bannerKey === 'about') uploadingAbout.value = true

  const res = await uploadImage(file)

  if (res.error) {
    if (bannerKey === 'hero') uploadingHero.value = false
    else if (bannerKey === 'banner1') uploading1.value = false
    else if (bannerKey === 'banner2') uploading2.value = false
    else if (bannerKey === 'about') uploadingAbout.value = false
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
  else if (bannerKey === 'banner2') uploading2.value = false
  else if (bannerKey === 'about') uploadingAbout.value = false

  if (!ok) {
    alert('La imagen tardó en procesarse. Se asignó la URL pero puede tardar unos segundos en reflejarse.')
  }

  form.value[bannerKey].image = res.url
}

async function save() {
  loading.value = true
  saved.value = false
  await Promise.all([
    settings.saveTopBar(form.value.topBar),
    settings.saveHero(form.value.hero),
    settings.saveBanners({ banner1: form.value.banner1, banner2: form.value.banner2 }),
    settings.saveRegisterBanner(form.value.registerBanner),
    settings.saveAbout(form.value.about),
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
    topBar: { ...DEFAULT_TOP_BAR },
    hero: { ...DEFAULT_HERO },
    banner1: { ...DEFAULT_BANNERS.banner1 },
    banner2: { ...DEFAULT_BANNERS.banner2 },
    registerBanner: { ...DEFAULT_REGISTER_BANNER },
    about: { ...DEFAULT_ABOUT },
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

    <!-- ================= BARRA DE ANUNCIO SUPERIOR (CINTILLO / TOP BAR) ================= -->
    <div class="banner-box">
      <div class="banner-box-header banner-header-with-toggle">
        <div class="banner-title-left">
          <div class="banner-badge badge-topbar">
            <AppIcon name="bell" :size="14" />
            Cintillo Superior / Barra de Anuncio
          </div>
          <span class="preview-hint">Se muestra en la parte superior fija de toda la tienda</span>
        </div>

        <div class="section-toggle-wrap">
          <label class="section-toggle-label">
            <input
              v-model="form.topBar.enabled"
              type="checkbox"
              class="section-toggle-input"
            />
            <span class="section-toggle-slider"></span>
            <span class="section-toggle-text" :class="{ 'text-muted': !form.topBar.enabled }">
              {{ form.topBar.enabled ? 'Cintillo Visible' : 'Cintillo Oculto' }}
            </span>
          </label>
        </div>
      </div>

      <div class="banner-grid">
        <div class="banner-fields">
          <div class="field-row">
            <label>Mensaje 1 (Izquierdo)</label>
            <input
              v-model="form.topBar.text1"
              type="text"
              placeholder="Envío GRATIS en compras superiores a $60"
              class="input-text"
            />
          </div>

          <div class="field-row">
            <label>Mensaje 2 (Derecho - Opcional)</label>
            <input
              v-model="form.topBar.text2"
              type="text"
              placeholder="10% OFF en tu primera compra con el código: BIENVENIDA"
              class="input-text"
            />
          </div>
        </div>

        <!-- Vista previa en vivo Cintillo -->
        <div class="live-preview-box">
          <span class="preview-tag">VISTA PREVIA EN VIVO</span>
          <div v-if="!form.topBar.enabled" class="preview-hidden-alert">
            El cintillo superior está <strong>OCULTO</strong>. No se mostrará a los visitantes en la tienda.
          </div>
          <div class="preview-topbar-card" :class="{ 'is-section-disabled': !form.topBar.enabled }">
            <div class="preview-topbar-inner">
              <span v-if="form.topBar.text1">{{ form.topBar.text1 }}</span>
              <span v-if="form.topBar.text1 && form.topBar.text2" class="preview-topbar-sep"></span>
              <span v-if="form.topBar.text2">{{ form.topBar.text2 }}</span>
              <span v-if="!form.topBar.text1 && !form.topBar.text2" class="text-muted">(Sin textos configurados)</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= BANNER PRINCIPAL (HERO / CABECERA) ================= -->
    <div class="banner-box hero-admin-box">
      <div class="banner-box-header">
        <div class="banner-badge badge-hero">
          <AppIcon name="sparkles" :size="14" />
          Cabecera Principal (Portada / Hero)
        </div>
        <span class="preview-hint">Vista previa en tiempo real abajo</span>
      </div>

      <div class="banner-fields">
        <!-- Video de Fondo Hero (Recomendado) -->
        <div class="video-upload-card">
          <div class="video-upload-header">
            <div>
              <div class="video-title-row">
                <AppIcon name="sparkles" :size="16" class="spark-icon" />
                <label class="media-title">Video de Fondo del Header (Recomendado)</label>
                <span v-if="form.hero.video" class="video-active-tag">● Video Activo</span>
                <span v-else class="video-inactive-tag">Sin video (usando foto de fondo)</span>
              </div>
              <p class="media-desc">
                Sube un video en formato MP4 o WebM. <strong>Cada vez que subas uno nuevo, el anterior se borra automáticamente de Supabase Storage para no almacenar basura.</strong>
              </p>
            </div>
          </div>

          <div class="video-action-row">
            <label class="upload-button video-btn" :class="{ disabled: uploadingHeroVideo }">
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                hidden
                :disabled="uploadingHeroVideo"
                @change="onHeroVideoUpload"
              />
              <AppIcon name="download" :size="15" />
              {{ uploadingHeroVideo ? 'Subiendo video a Supabase...' : (form.hero.video ? 'Reemplazar video (elimina el anterior)' : 'Subir video de fondo (.mp4 / .webm)') }}
            </label>

            <button
              v-if="form.hero.video"
              type="button"
              class="btn-delete-video"
              @click="removeHeroVideo"
              title="Borrar video y limpiar Supabase Storage"
            >
              <AppIcon name="trash" :size="14" />
              Eliminar video (limpiar servidor)
            </button>
          </div>

          <div v-if="form.hero.video" class="video-active-preview">
            <video
              :src="form.hero.video"
              autoplay
              loop
              muted
              playsinline
              class="mini-video-thumb"
            ></video>
            <div class="video-meta-info">
              <span class="meta-sub">Enlace en Supabase Storage:</span>
              <a :href="form.hero.video" target="_blank" class="meta-link">{{ form.hero.video }}</a>
            </div>
          </div>
        </div>

        <!-- Imagen Hero (Respaldo) -->
        <div class="image-upload-block">
          <label>Imagen de Fondo de la Portada (Respaldo)</label>
          <div class="image-row">
            <img
              v-if="form.hero.image"
              :src="resolveImage(form.hero.image)"
              class="banner-thumb hero-thumb"
              alt="Portada"
            />
            <div class="upload-actions">
              <div class="upload-btn-row">
                <label class="upload-button" :class="{ disabled: uploadingHero }">
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    :disabled="uploadingHero"
                    @change="onImageUpload('hero', $event)"
                  />
                  <AppIcon name="download" :size="15" />
                  {{ uploadingHero ? 'Subiendo imagen...' : 'Subir nueva foto' }}
                </label>
                <button
                  type="button"
                  class="btn-reset-hero"
                  @click="form.hero.image = DEFAULT_HERO.image"
                >
                  Restablecer imagen original
                </button>
              </div>
              <input
                v-model="form.hero.image"
                type="text"
                placeholder="O pega la URL de la imagen..."
                class="url-input"
              />
              <small class="upload-hint">
                Se guarda en el servidor de imágenes y se sincroniza automáticamente en Vercel.
              </small>
            </div>
          </div>
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

      <!-- Vista previa en vivo del Hero -->
      <div class="live-preview-box">
        <span class="preview-tag">VISTA PREVIA EN VIVO DE LA PORTADA</span>
        <div
          class="preview-hero-card"
          :style="form.hero.video ? {} : { backgroundImage: `url('${resolveImage(form.hero.image || DEFAULT_HERO.image)}')` }"
        >
          <!-- Video de fondo en preview -->
          <video
            v-if="form.hero.video"
            :src="form.hero.video"
            autoplay
            loop
            muted
            playsinline
            class="preview-hero-video"
          ></video>

          <div class="preview-hero-shade"></div>
          <div class="preview-hero-content">
            <p class="preview-hero-eyebrow">{{ form.hero.eyebrow || 'Pequeños detalles,' }}</p>
            <h2 class="preview-hero-title">
              {{ form.hero.title || 'grandes' }}
              <span class="preview-hero-accent">{{ form.hero.titleAccent || 'recuerdos' }}</span>
            </h2>
            <p class="preview-hero-text">
              {{ form.hero.text || 'Accesorios que cuentan tu historia y realzan tu esencia.' }}
            </p>
            <div class="preview-hero-btn">
              {{ form.hero.buttonText || 'Descubre la colección' }} &rarr;
            </div>
          </div>
          <!-- Onda decorativa en preview -->
          <svg class="preview-wave" viewBox="0 0 1440 60" preserveAspectRatio="none">
            <path fill="#ffffff" d="M0,25 C320,55 640,15 960,40 C1200,60 1360,30 1440,35 L1440,60 L0,60 Z"></path>
          </svg>
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

    <!-- ================= BANNER REGISTRO Y BIENVENIDA (10% OFF) ================= -->
    <div class="banner-box">
      <div class="banner-box-header banner-header-with-toggle">
        <div class="banner-title-left">
          <div class="banner-badge badge-b1">
            <AppIcon name="user" :size="14" />
            Banner de Registro / Bienvenida (10% OFF)
          </div>
          <span class="preview-hint">Se muestra en la portada a ancho completo con ondas superiores</span>
        </div>

        <div class="section-toggle-wrap">
          <label class="section-toggle-label">
            <input
              v-model="form.registerBanner.enabled"
              type="checkbox"
              class="section-toggle-input"
            />
            <span class="section-toggle-slider"></span>
            <span class="section-toggle-text" :class="{ 'text-muted': !form.registerBanner.enabled }">
              {{ form.registerBanner.enabled ? 'Sección Visible' : 'Sección Oculta' }}
            </span>
          </label>
        </div>
      </div>

      <div class="banner-grid">
        <div class="banner-fields">
          <div class="field-row">
            <label>Etiqueta Superior (Eyebrow)</label>
            <input
              v-model="form.registerBanner.eyebrow"
              type="text"
              placeholder="BENEFICIO EXCLUSIVO DE BIENVENIDA"
              class="input-text"
            />
          </div>

          <div class="field-row">
            <label>Título Principal</label>
            <input
              v-model="form.registerBanner.title"
              type="text"
              placeholder="10% OFF"
              class="input-text"
            />
          </div>

          <div class="field-row">
            <label>Texto Descriptivo</label>
            <textarea
              v-model="form.registerBanner.text"
              rows="2"
              placeholder="Crea tu cuenta hoy y disfruta de un 10% de descuento en tu primera compra con el código:"
              class="input-textarea"
            ></textarea>
          </div>

          <div class="field-row">
            <label>Código de Cupón a Mostrar</label>
            <input
              v-model="form.registerBanner.couponCode"
              type="text"
              placeholder="BIENVENIDA"
              class="input-text"
            />
          </div>

          <div class="field-grid-3">
            <div class="field-row">
              <label>Beneficio 1</label>
              <input
                v-model="form.registerBanner.benefit1"
                type="text"
                placeholder="Descuento de bienvenida"
                class="input-text"
              />
            </div>
            <div class="field-row">
              <label>Beneficio 2</label>
              <input
                v-model="form.registerBanner.benefit2"
                type="text"
                placeholder="Seguimiento de pedidos"
                class="input-text"
              />
            </div>
            <div class="field-row">
              <label>Beneficio 3</label>
              <input
                v-model="form.registerBanner.benefit3"
                type="text"
                placeholder="Ofertas exclusivas"
                class="input-text"
              />
            </div>
          </div>

          <div class="field-row">
            <label>Texto del Botón de Registro</label>
            <input
              v-model="form.registerBanner.buttonText"
              type="text"
              placeholder="Registrarme y Obtener 10% OFF"
              class="input-text"
            />
          </div>
        </div>

        <!-- Vista previa en vivo -->
        <div class="live-preview-box">
          <span class="preview-tag">VISTA PREVIA EN VIVO</span>
          <div v-if="!form.registerBanner.enabled" class="preview-hidden-alert">
            Esta sección está <strong>OCULTA</strong>. No se mostrará a los visitantes en la tienda mientras esté desactivada.
          </div>
          <div class="preview-card-reg" :class="{ 'is-section-disabled': !form.registerBanner.enabled }">
            <div class="prev-reg-eyebrow">{{ form.registerBanner.eyebrow }}</div>
            <div class="prev-reg-title">{{ form.registerBanner.title }}</div>
            <p class="prev-reg-text">
              {{ form.registerBanner.text }}
              <span class="prev-reg-pill">{{ form.registerBanner.couponCode || 'BIENVENIDA' }}</span>
            </p>
            <div class="prev-reg-benefits">
              <span v-if="form.registerBanner.benefit1" class="prev-reg-item">✓ {{ form.registerBanner.benefit1 }}</span>
              <span v-if="form.registerBanner.benefit2" class="prev-reg-item">✓ {{ form.registerBanner.benefit2 }}</span>
              <span v-if="form.registerBanner.benefit3" class="prev-reg-item">✓ {{ form.registerBanner.benefit3 }}</span>
            </div>
            <div class="prev-reg-btn">
              {{ form.registerBanner.buttonText || 'Registrarme y Obtener 10% OFF' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= PÁGINA NOSOTROS (FOTO PRINCIPAL) ================= -->
    <div class="banner-box">
      <div class="banner-box-header">
        <div class="banner-badge badge-rose">
          <AppIcon name="sparkles" :size="14" />
          Página Nosotros (Nuestra Esencia)
        </div>
        <span class="preview-hint">Foto principal de la sección "Nuestra esencia" en /nosotros</span>
      </div>

      <div class="banner-fields">
        <div class="image-upload-block">
          <label>Foto de la Sección "Nuestra esencia"</label>
          <div class="image-row">
            <img
              v-if="form.about?.image"
              :src="resolveImage(form.about.image)"
              class="banner-thumb"
              alt="Página Nosotros"
            />
            <div class="upload-actions">
              <label class="upload-button" :class="{ disabled: uploadingAbout }">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  :disabled="uploadingAbout"
                  @change="onImageUpload('about', $event)"
                />
                <AppIcon name="download" :size="15" />
                {{ uploadingAbout ? 'Subiendo imagen...' : 'Cambiar foto' }}
              </label>
            </div>
          </div>
          <small class="field-help" style="margin-top: 8px; display: block;">
            Puedes previsualizar la página pública directamente en:
            <router-link to="/nosotros" target="_blank" style="color: var(--rose-600); font-weight: 600;">/nosotros →</router-link>
          </small>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.banner-header-with-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.banner-title-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.section-toggle-wrap {
  display: flex;
  align-items: center;
}

.section-toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.section-toggle-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.section-toggle-slider {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  background-color: #cbd5e1;
  border-radius: 20px;
  transition: all 0.25s ease;
}

.section-toggle-slider::before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: #ffffff;
  border-radius: 50%;
  transition: all 0.25s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.section-toggle-input:checked + .section-toggle-slider {
  background-color: #111111;
}

.section-toggle-input:checked + .section-toggle-slider::before {
  transform: translateX(20px);
}

.section-toggle-text {
  font-family: 'Montserrat', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #111111;
  transition: color 0.2s;
}

.section-toggle-text.text-muted {
  color: #94a3b8;
}

.preview-hidden-alert {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  font-size: 12px;
  font-weight: 500;
  padding: 10px 14px;
  border-radius: 2px;
  margin-bottom: 12px;
  line-height: 1.4;
}

.is-section-disabled {
  opacity: 0.45;
  filter: grayscale(80%);
  transition: all 0.25s ease;
}

.badge-topbar {
  background: #111111;
  color: #ffffff;
}

.preview-topbar-card {
  background: #000000;
  color: #ffffff;
  border-radius: 2px;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.preview-topbar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  flex-wrap: wrap;
  font-family: 'Montserrat', sans-serif;
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-align: center;
}

.preview-topbar-sep {
  width: 1px;
  height: 14px;
  background: rgba(255, 255, 255, 0.35);
  display: inline-block;
}

.field-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

@media (max-width: 650px) {
  .field-grid-3 {
    grid-template-columns: 1fr;
  }
}

.preview-card-reg {
  background: linear-gradient(135deg, #fdf2f5 0%, #fbe7ec 100%);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  padding: 24px;
}

.prev-reg-eyebrow {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #111111;
  text-transform: uppercase;
}

.prev-reg-title {
  font-family: 'Montserrat', sans-serif;
  font-size: 32px;
  font-weight: 800;
  color: #111111;
  margin: 6px 0;
}

.prev-reg-text {
  font-size: 13px;
  color: #4a4a4a;
  line-height: 1.4;
  margin-bottom: 12px;
}

.prev-reg-pill {
  display: inline-block;
  background: #111111;
  color: #ffffff;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 800;
  border-radius: 2px;
  margin-left: 4px;
}

.prev-reg-benefits {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.prev-reg-item {
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 11px;
  font-weight: 600;
  color: #333333;
  padding: 3px 8px;
  border-radius: 2px;
}

.prev-reg-btn {
  background: #111111;
  color: #ffffff;
  padding: 10px 16px;
  text-align: center;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  border-radius: 2px;
}

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

/* Hero Preview & Upload in Admin */
.hero-thumb {
  width: 90px !important;
  height: 56px !important;
  border-radius: 8px;
}

.upload-btn-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-reset-hero {
  background: #ffffff;
  border: 1px solid var(--line);
  color: var(--ink-600);
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reset-hero:hover {
  border-color: var(--rose-400);
  color: var(--rose-600);
  background: #fdf5f7;
}

.upload-hint {
  font-size: 11.5px;
  color: var(--ink-400);
  line-height: 1.3;
}

/* Video Upload Card */
.video-upload-card {
  background: #fffbfa;
  border: 1px solid #fed7aa;
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.video-title-row .spark-icon {
  color: #ea580c;
}

.media-title {
  font-size: 14px;
  font-weight: 700;
  color: #7c2d12;
}

.video-active-tag {
  font-size: 11px;
  font-weight: 700;
  background: #ecfdf5;
  color: #059669;
  border: 1px solid #a7f3d0;
  padding: 2px 8px;
  border-radius: 20px;
}

.video-inactive-tag {
  font-size: 11px;
  color: #9a3412;
  font-weight: 500;
  background: #ffedd5;
  padding: 2px 8px;
  border-radius: 20px;
}

.media-desc {
  font-size: 12px;
  color: #9a3412;
  margin-top: 4px;
  line-height: 1.4;
}

.video-action-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.video-btn {
  background: #ea580c !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 2px 6px rgba(234, 88, 12, 0.25);
  cursor: pointer;
}

.video-btn:hover {
  background: #c2410c !important;
}

.btn-delete-video {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  border: 1px solid #fca5a5;
  color: #dc2626;
  font-size: 12.5px;
  font-weight: 600;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete-video:hover {
  background: #fef2f2;
}

.video-active-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  border: 1px solid #fed7aa;
  padding: 10px;
  border-radius: 10px;
}

.mini-video-thumb {
  width: 90px;
  height: 54px;
  object-fit: cover;
  border-radius: 6px;
  background: #000;
}

.video-meta-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

.meta-sub {
  font-size: 11px;
  color: #7c2d12;
  font-weight: 600;
}

.meta-link {
  font-size: 11.5px;
  color: #ea580c;
  text-decoration: underline;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-hero-card {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  min-height: 170px;
  background-size: cover;
  background-position: center right;
  background-repeat: no-repeat;
  display: flex;
  align-items: center;
  padding: 22px 28px 36px;
  border: 1px solid #f0e2e6;
}

.preview-hero-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  pointer-events: none;
}

.preview-hero-shade {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(
    90deg,
    rgba(255, 248, 250, 0.96) 0%,
    rgba(255, 248, 250, 0.88) 45%,
    rgba(255, 248, 250, 0.25) 75%,
    rgba(255, 248, 250, 0) 100%
  );
  pointer-events: none;
}

.preview-hero-content {
  position: relative;
  z-index: 2;
  max-width: 400px;
}

.preview-hero-eyebrow {
  font-size: 12.5px;
  color: var(--ink-600);
  margin: 0 0 2px;
}

.preview-hero-title {
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 6px;
  line-height: 1.1;
}

.preview-hero-accent {
  font-family: var(--font-script, cursive);
  color: var(--rose-500);
  margin-left: 4px;
}

.preview-hero-text {
  font-size: 12.5px;
  color: var(--ink-500);
  margin: 0 0 12px;
  line-height: 1.4;
}

.preview-hero-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  background: var(--rose-gradient);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(184, 50, 89, 0.25);
}

.preview-wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 24px;
  line-height: 0;
  z-index: 2;
  pointer-events: none;
}

@media (max-width: 768px) {
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .banner-box {
    padding: 16px 14px;
  }
  .preview-hero-card {
    padding: 16px 14px 28px;
  }
  .preview-hero-title {
    font-size: 22px;
  }
  .preview-card {
    flex-direction: column;
  }
  .preview-media {
    width: 100%;
    height: 150px;
  }
}

@media (max-width: 600px) {
  .banner-header-with-toggle {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .toolbar-actions {
    width: 100%;
  }
  .save-btn {
    width: 100%;
    justify-content: center;
  }
  .image-row {
    flex-wrap: wrap;
  }
  .upload-actions {
    width: 100%;
  }
  .upload-button {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }
  .video-action-row {
    flex-direction: column;
    width: 100%;
  }
  .video-btn,
  .btn-delete-video {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }
  .video-active-preview {
    flex-direction: column;
    align-items: flex-start;
  }
  .mini-video-thumb {
    width: 100%;
    height: auto;
    aspect-ratio: 16/9;
  }
}
</style>
