<script setup>
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSettingsStore, DEFAULT_ABOUT } from '@/store/settings'
import { useCurrencyStore } from '@/store/currency'
import { DEFAULT_STORE, STORE } from '@/config'
import { uploadImage } from '@/lib/db'
import { resolveImage } from '@/utils/image'

const settings = useSettingsStore()
const currency = useCurrencyStore()

const loading = ref(false)
const saved = ref(false)
const uploadingAbout = ref(false)
const updatingRate = ref(false)
const rateUpdatedMsg = ref('')

const lowStock = ref(5)
const aboutForm = ref({ ...DEFAULT_ABOUT })
const currencyForm = ref({
  apiKey: '',
  manualRate: null,
  autoUpdate: true,
})
const form = ref({
  name: DEFAULT_STORE.name,
  tagline: DEFAULT_STORE.tagline,
  whatsapp: DEFAULT_STORE.whatsapp,
  email: DEFAULT_STORE.email,
  address: DEFAULT_STORE.address,
  instagram: DEFAULT_STORE.instagram,
  facebook: DEFAULT_STORE.facebook || '',
  tiktok: DEFAULT_STORE.tiktok || '',
  freeShipping: DEFAULT_STORE.freeShipping,
  coupon: DEFAULT_STORE.coupon,
})

onMounted(async () => {
  await Promise.all([
    settings.fetch(true),
    currency.init(),
  ])
  lowStock.value = settings.lowStock || 5
  aboutForm.value = {
    ...DEFAULT_ABOUT,
    ...(settings.about || {}),
  }
  currencyForm.value = {
    apiKey: currency.apiKey || '',
    manualRate: currency.manualRate || null,
    autoUpdate: currency.autoUpdate !== false,
  }
  form.value = {
    name: settings.storeInfo.name || DEFAULT_STORE.name,
    tagline: settings.storeInfo.tagline || DEFAULT_STORE.tagline,
    whatsapp: settings.storeInfo.whatsapp || DEFAULT_STORE.whatsapp,
    email: settings.storeInfo.email || DEFAULT_STORE.email,
    address: settings.storeInfo.address || DEFAULT_STORE.address,
    instagram: settings.storeInfo.instagram || DEFAULT_STORE.instagram,
    facebook: settings.storeInfo.facebook || DEFAULT_STORE.facebook || '',
    tiktok: settings.storeInfo.tiktok || DEFAULT_STORE.tiktok || '',
    freeShipping: settings.storeInfo.freeShipping ?? DEFAULT_STORE.freeShipping,
    coupon: settings.storeInfo.coupon || DEFAULT_STORE.coupon,
  }
})

async function refreshLiveRate() {
  updatingRate.value = true
  rateUpdatedMsg.value = ''
  const res = await currency.fetchRate(true)
  updatingRate.value = false
  if (res.ok) {
    rateUpdatedMsg.value = `¡Tasa actualizada con éxito! 1 USD = ${currency.formattedRate}`
  } else {
    rateUpdatedMsg.value = 'No se pudo consultar la API en vivo. Se mantiene la última tasa guardada.'
  }
  setTimeout(() => {
    rateUpdatedMsg.value = ''
  }, 5000)
}

async function onAboutImageUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return
  uploadingAbout.value = true
  const res = await uploadImage(file)
  if (res.error) {
    uploadingAbout.value = false
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
  uploadingAbout.value = false
  aboutForm.value.image = res.url
}

function restoreAboutDefault() {
  aboutForm.value.image = DEFAULT_ABOUT.image
}

async function save() {
  loading.value = true
  saved.value = false

  // Limpiar whatsapp de espacios y caracteres extraños por si el usuario pegó con + o guiones
  if (form.value.whatsapp) {
    form.value.whatsapp = form.value.whatsapp.replace(/[^0-9]/g, '')
  }

  await Promise.all([
    settings.saveStoreInfo(form.value),
    settings.saveLowStock(lowStock.value),
    settings.saveAbout(aboutForm.value),
    currency.saveConfig(currencyForm.value),
  ])

  loading.value = false
  saved.value = true
  setTimeout(() => {
    saved.value = false
  }, 4000)
}
</script>

<template>
  <div class="settings-page">
    <div class="admin-toolbar">
      <div>
        <h1 class="admin-title">Ajustes Generales de la Tienda</h1>
        <p class="admin-subtitle">
          Configura la información de contacto, WhatsApp, redes sociales, políticas de envío y alertas del sistema.
        </p>
      </div>
      <button class="admin-btn save-btn" :disabled="loading" @click="save">
        <AppIcon name="check" :size="16" />
        {{ loading ? 'Guardando...' : 'Guardar Ajustes' }}
      </button>
    </div>

    <!-- Alerta de éxito -->
    <div v-if="saved" class="alert-success">
      <AppIcon name="check" :size="18" />
      <span>¡Los datos de la tienda han sido actualizados y aplicados en toda la web!</span>
    </div>

    <div class="settings-layout">
      <!-- 1. INFORMACIÓN DE CONTACTO -->
      <div class="admin-card">
        <div class="card-head">
          <div class="card-icon"><AppIcon name="phone" :size="20" /></div>
          <div>
            <h2 class="card-title">Información de Contacto</h2>
            <p class="card-desc">Estos datos se reflejan en la página de Contacto, pie de página, carrito y políticas.</p>
          </div>
        </div>

        <div class="fields-grid">
          <!-- WhatsApp -->
          <div class="field-item col-span-2">
            <label class="field-label">
              <span>Número de WhatsApp para Pedidos y Atención *</span>
              <span class="field-tag">Crítico para compras</span>
            </label>
            <div class="input-with-prefix">
              <span class="prefix">+</span>
              <input
                v-model="form.whatsapp"
                type="text"
                placeholder="584147675878"
                class="field-input"
                required
              />
            </div>
            <p class="field-hint">
              Ingresa el número con el código de país sin el signo "+" ni espacios (ej: <strong>584147675878</strong>).
              Se utiliza directamente para generar los enlaces de WhatsApp de compra y contacto:
              <a :href="`https://wa.me/${form.whatsapp}`" target="_blank" class="live-link">
                wa.me/{{ form.whatsapp }}
              </a>
            </p>
          </div>

          <!-- Correo Electrónico -->
          <div class="field-item">
            <label class="field-label">Correo Electrónico de Contacto</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="hola@detallitosaccesorios.com"
              class="field-input"
            />
            <p class="field-hint">Aparece en el pie de página, contacto y políticas de la tienda.</p>
          </div>

          <!-- Ubicación / Dirección -->
          <div class="field-item">
            <label class="field-label">Ubicación / Dirección Física</label>
            <input
              v-model="form.address"
              type="text"
              placeholder="Puerto Ordaz, Venezuela"
              class="field-input"
            />
            <p class="field-hint">Ciudad o dirección física visible para los clientes.</p>
          </div>

          <!-- Nombre de la Tienda -->
          <div class="field-item">
            <label class="field-label">Nombre de la Marca</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Detallitos"
              class="field-input"
            />
          </div>

          <!-- Lema / Tagline -->
          <div class="field-item">
            <label class="field-label">Lema o Subtítulo</label>
            <input
              v-model="form.tagline"
              type="text"
              placeholder="Accesorios"
              class="field-input"
            />
          </div>
        </div>
      </div>

      <!-- 2. REDES SOCIALES -->
      <div class="admin-card">
        <div class="card-head">
          <div class="card-icon"><AppIcon name="instagram" :size="20" /></div>
          <div>
            <h2 class="card-title">Redes Sociales</h2>
            <p class="card-desc">Enlaces hacia tus perfiles en redes sociales en el pie de página y página de contacto.</p>
          </div>
        </div>

        <div class="fields-grid">
          <div class="field-item">
            <label class="field-label">Instagram (Usuario o Enlace)</label>
            <input
              v-model="form.instagram"
              type="text"
              placeholder="@detallitoslg"
              class="field-input"
            />
            <p class="field-hint">Ejemplo: <strong>@detallitoslg</strong> o https://instagram.com/detallitoslg</p>
          </div>

          <div class="field-item">
            <label class="field-label">Facebook (Enlace de Página)</label>
            <input
              v-model="form.facebook"
              type="text"
              placeholder="https://facebook.com/detallitos"
              class="field-input"
            />
          </div>

          <div class="field-item col-span-2">
            <label class="field-label">TikTok (Enlace o Perfil)</label>
            <input
              v-model="form.tiktok"
              type="text"
              placeholder="https://tiktok.com/@detallitos"
              class="field-input"
            />
          </div>
        </div>
      </div>

      <!-- 3. ENVÍOS Y CUPONES -->
      <div class="admin-card">
        <div class="card-head">
          <div class="card-icon"><AppIcon name="truck" :size="20" /></div>
          <div>
            <h2 class="card-title">Políticas de Envío y Cupón de Bienvenida</h2>
            <p class="card-desc">Información destacada en la barra superior y preguntas frecuentes.</p>
          </div>
        </div>

        <div class="fields-grid">
          <div class="field-item">
            <label class="field-label">Envío Gratis a partir de ($)</label>
            <input
              v-model.number="form.freeShipping"
              type="number"
              min="0"
              placeholder="60"
              class="field-input"
            />
            <p class="field-hint">Se anunciará como: "Envío GRATIS en compras superiores a ${{ form.freeShipping }}"</p>
          </div>

          <div class="field-item">
            <label class="field-label">Código de Cupón Anunciado</label>
            <input
              v-model="form.coupon"
              type="text"
              placeholder="BIENVENIDA"
              class="field-input"
            />
            <p class="field-hint">Cupón promocional exhibido en el cintillo superior de la tienda.</p>
          </div>
        </div>
      </div>

      <!-- 4. CONTROL DE INVENTARIO -->
      <div class="admin-card">
        <div class="card-head">
          <div class="card-icon"><AppIcon name="shield" :size="20" /></div>
          <div>
            <h2 class="card-title">Alertas de Inventario</h2>
            <p class="card-desc">Configuración de avisos de stock bajo en la tienda y dashboard.</p>
          </div>
        </div>

        <div class="field-item max-w-sm">
          <label class="field-label">Cantidad mínima para Alerta de Stock Bajo</label>
          <input
            v-model.number="lowStock"
            type="number"
            min="0"
            class="field-input"
          />
          <p class="field-hint">
            Cuando un producto tenga esta cantidad o menos, aparecerá la etiqueta
            <span class="chip">Últimas {{ lowStock }}</span> en su tarjeta y la alerta en el Dashboard.
          </p>
        </div>
      </div>

      <!-- 5. PÁGINA NOSOTROS (IMAGEN CONFIGURABLE) -->
      <div class="admin-card">
        <div class="card-head">
          <div class="card-icon"><AppIcon name="sparkles" :size="20" /></div>
          <div>
            <h2 class="card-title">Página Nosotros · Foto Principal</h2>
            <p class="card-desc">Personaliza la imagen que se exhibe en la sección "Nuestra esencia" de la página /nosotros.</p>
          </div>
        </div>

        <div class="about-image-config">
          <div class="about-image-preview-col">
            <div class="about-image-frame">
              <img
                :src="resolveImage(aboutForm.image || DEFAULT_ABOUT.image)"
                alt="Vista previa Nosotros"
                class="about-image-thumb"
              />
              <span class="preview-badge">Vista previa</span>
            </div>
          </div>

          <div class="about-image-actions-col">
            <label class="field-label">Foto de la Sección</label>
            <p class="field-hint" style="margin-top: -6px; margin-bottom: 4px;">
              Selecciona una nueva foto desde tu teléfono o computadora.
            </p>
            <div class="upload-action-row">
              <label class="admin-btn upload-btn" :class="{ disabled: uploadingAbout }">
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  :disabled="uploadingAbout"
                  @change="onAboutImageUpload"
                />
                <AppIcon name="download" :size="16" />
                {{ uploadingAbout ? 'Subiendo imagen...' : 'Cambiar foto' }}
              </label>
              <button
                v-if="aboutForm.image !== DEFAULT_ABOUT.image"
                type="button"
                class="admin-btn admin-btn-ghost reset-btn"
                @click="restoreAboutDefault"
              >
                Restablecer foto original
              </button>
            </div>

            <div class="about-nav-link-row">
              <router-link to="/nosotros" target="_blank" class="live-link">
                Ver página /nosotros en vivo →
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- 6. TASA DE CAMBIO BCV / DOLARVZLA -->
      <div class="admin-card rate-config-card">
        <div class="card-head">
          <div class="card-icon"><AppIcon name="sparkles" :size="20" /></div>
          <div>
            <h2 class="card-title">Tasa de Cambio BCV · DolarVZLA (USD / Bolívares)</h2>
            <p class="card-desc">
              Sincronización de la tasa oficial del Banco Central de Venezuela en tiempo real para mostrar precios duales (USD / Bs.) en toda la tienda y en los pedidos por WhatsApp.
            </p>
          </div>
        </div>

        <!-- Bloque de Estado de Tasa Activa -->
        <div class="rate-status-banner">
          <div class="rate-status-left">
            <span class="rate-live-dot"></span>
            <div>
              <span class="rate-status-tag">TASA VIGENTE APLICADA EN LA TIENDA</span>
              <div class="rate-status-val">{{ currency.formattedRate }} <small style="font-size: 14px; font-weight: 500; color: var(--ink-500);">/ 1 USD</small></div>
              <div class="rate-status-date">
                Fecha de vigencia oficial: <strong>{{ currency.formattedDate }}</strong>
                <span v-if="currency.changePercentage" class="rate-change-tag">
                  {{ currency.changePercentage > 0 ? '+' : '' }}{{ Number(currency.changePercentage).toFixed(2) }}%
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            class="admin-btn refresh-rate-btn"
            :disabled="updatingRate"
            @click="refreshLiveRate"
          >
            <AppIcon name="sparkles" :size="16" />
            {{ updatingRate ? 'Consultando API...' : 'Actualizar tasa ahora' }}
          </button>
        </div>

        <div v-if="rateUpdatedMsg" class="alert-success rate-alert">
          <AppIcon name="check" :size="16" />
          <span>{{ rateUpdatedMsg }}</span>
        </div>

        <div class="fields-grid" style="margin-top: 18px;">
          <!-- Modo Automático / Manual -->
          <div class="field-item col-span-2">
            <label class="toggle-rate-mode">
              <input
                v-model="currencyForm.autoUpdate"
                type="checkbox"
                class="toggle-checkbox"
              />
              <span class="toggle-label-text">
                <strong>Actualización automática desde DolarVZLA (Recomendado)</strong>
                <span class="toggle-sub">La tienda consulta la tasa oficial del día del BCV al momento y la mantiene al día sin intervención manual.</span>
              </span>
            </label>
          </div>

          <!-- Tasa Manual de Respaldo -->
          <div class="field-item">
            <label class="field-label">Tasa Manual de Respaldo (Bs.)</label>
            <input
              v-model.number="currencyForm.manualRate"
              type="number"
              step="0.01"
              placeholder="Ej: 813.74"
              class="field-input"
            />
            <p class="field-hint">
              Si desactivas la actualización automática o la API externa no responde, se aplicará este valor fijo.
            </p>
          </div>

          <!-- API Key DolarVZLA -->
          <div class="field-item">
            <label class="field-label">
              <span>API Key de DolarVZLA (Opcional)</span>
              <a href="https://dolarvzla.com/settings/api" target="_blank" class="live-link">
                dolarvzla.com/settings/api →
              </a>
            </label>
            <input
              v-model="currencyForm.apiKey"
              type="password"
              placeholder="Pega tu API Key de dolarvzla.com si dispones de una"
              class="field-input"
            />
            <p class="field-hint">
              El endpoint público BCV funciona sin clave. Si generas una clave en <strong>dolarvzla.com/settings/api</strong>, ingrésala aquí para mayor prioridad.
            </p>
          </div>
        </div>
      </div>

      <!-- 7. ACCESO DIRECTO A BANNERS DE LA PORTADA -->
      <div class="admin-card banner-shortcut-card">
        <div class="card-head">
          <div class="card-icon"><AppIcon name="sparkles" :size="20" /></div>
          <div>
            <h2 class="card-title">Banners de la Página de Inicio</h2>
            <p class="card-desc">Personaliza los textos, imágenes y botones de los 2 bloques promocionales de la portada.</p>
          </div>
        </div>
        <router-link to="/admin/banners" class="admin-btn admin-btn-secondary shortcut-btn">
          Editar Banners de Inicio →
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-page {
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

.save-btn {
  background: var(--rose-600);
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
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

.settings-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-card {
  background: #ffffff;
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}

.card-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--rose-50);
  color: var(--rose-600);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 2px;
}

.card-desc {
  font-size: 13px;
  color: var(--ink-400);
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px;
}

@media (max-width: 768px) {
  .fields-grid {
    grid-template-columns: 1fr;
  }
}

.col-span-2 {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .col-span-2 {
    grid-column: span 1;
  }
}

.field-item {
  display: flex;
  flex-direction: column;
}

.field-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-800);
  margin-bottom: 6px;
}

.field-tag {
  font-size: 11px;
  font-weight: 700;
  background: #fef2f2;
  color: #dc2626;
  padding: 1px 7px;
  border-radius: 6px;
}

.field-input {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  background: #ffffff;
  color: var(--ink-800);
  outline: none;
  transition: border-color 0.2s;
}

.field-input:focus {
  border-color: var(--rose-400);
}

.input-with-prefix {
  display: flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
}

.input-with-prefix:focus-within {
  border-color: var(--rose-400);
}

.input-with-prefix .prefix {
  padding: 0 12px;
  background: #f8fafc;
  color: var(--ink-500);
  font-weight: 700;
  border-right: 1px solid var(--line);
  line-height: 40px;
}

.input-with-prefix .field-input {
  border: none;
  border-radius: 0;
}

.field-hint {
  font-size: 12px;
  color: var(--ink-400);
  margin-top: 6px;
  line-height: 1.4;
}

.live-link {
  color: var(--rose-600);
  font-weight: 600;
  text-decoration: underline;
  margin-left: 4px;
}

.chip {
  display: inline-block;
  background: #fff3e0;
  color: #b26a00;
  border-radius: 6px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 700;
}

.max-w-sm {
  max-width: 460px;
}

.banner-shortcut-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.banner-shortcut-card .card-head {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.shortcut-btn {
  text-decoration: none;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
}

.about-image-config {
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 28px;
  align-items: flex-start;
}

@media (max-width: 768px) {
  .about-image-config {
    grid-template-columns: 1fr;
  }
}

.about-image-preview-col {
  width: 100%;
}

.about-image-frame {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  max-height: 280px;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid var(--rose-200, #f3c6d2);
  background: #fdf2f4;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.about-image-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preview-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.about-image-actions-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-action-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.upload-btn {
  background: var(--rose-600);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  transition: background 0.2s;
}

.upload-btn:hover {
  background: var(--rose-700);
}

.upload-btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.reset-btn {
  border: 1px solid var(--line);
  background: #f8fafc;
  color: var(--ink-700);
  padding: 9px 14px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
}

.reset-btn:hover {
  background: #e2e8f0;
}

.url-field {
  max-width: 520px;
}

.about-nav-link-row {
  margin-top: 2px;
}

/* Estilos de Configuración de Tasa de Cambio */
.rate-status-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  background: #fff7f9;
  border: 1.5px solid var(--rose-200, #f3c6d2);
  border-radius: 12px;
  padding: 18px 22px;
  flex-wrap: wrap;
}

.rate-status-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rate-status-tag {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--rose-600);
  display: block;
  margin-bottom: 2px;
}

.rate-status-val {
  font-size: 28px;
  font-weight: 800;
  color: var(--ink-900);
  line-height: 1.1;
}

.rate-status-date {
  font-size: 12px;
  color: var(--ink-500);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.rate-change-tag {
  background: #ecfdf5;
  color: #047857;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
}

.refresh-rate-btn {
  background: #ffffff;
  color: var(--rose-600);
  border: 1.5px solid var(--rose-300, #f4b4c4);
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.refresh-rate-btn:hover {
  background: var(--rose-50);
  border-color: var(--rose-400);
}

.refresh-rate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.rate-alert {
  margin-top: 14px;
  margin-bottom: 0;
}

.toggle-rate-mode {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  background: #f8fafc;
  border: 1px solid var(--line);
  padding: 14px 18px;
  border-radius: 10px;
  user-select: none;
}

.toggle-checkbox {
  margin-top: 3px;
  width: 18px;
  height: 18px;
  accent-color: var(--rose-600);
  cursor: pointer;
}

.toggle-label-text {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.toggle-label-text strong {
  font-size: 13.5px;
  color: var(--ink-900);
}

.toggle-sub {
  font-size: 12px;
  color: var(--ink-500);
  line-height: 1.4;
}

.rate-live-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.35);
  animation: pulse-rate-dot 2s infinite;
  display: inline-block;
  flex-shrink: 0;
}

@keyframes pulse-rate-dot {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 5px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

@media (max-width: 600px) {
  .rate-status-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 14px 16px;
  }
  .refresh-rate-btn {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }
  .admin-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .save-btn {
    width: 100%;
    justify-content: center;
    box-sizing: border-box;
  }
  .card-head {
    align-items: flex-start;
  }
}
</style>
