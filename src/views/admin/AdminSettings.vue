<script setup>
import { ref, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { useSettingsStore } from '@/store/settings'
import { DEFAULT_STORE, STORE } from '@/config'

const settings = useSettingsStore()

const loading = ref(false)
const saved = ref(false)

const lowStock = ref(5)
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
  await settings.fetch(true)
  lowStock.value = settings.lowStock || 5
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

      <!-- 5. ACCESO DIRECTO A BANNERS DE LA PORTADA -->
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
</style>
