<script setup>
import { ref, computed, onMounted } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  getCouponRules,
  saveCouponRules,
} from '@/lib/db'

const coupons = ref([])
const couponRules = ref({})
const modalOpen = ref(false)
const editing = ref(null)
const form = ref(empty())

const statusFilter = ref('all') // 'all' | 'active' | 'inactive'
const searchQuery = ref('')

function empty() {
  return { code: '', discount: 0, active: true, max_uses_per_user: 1, unlimited: false }
}

async function load() {
  const [res, rules] = await Promise.all([listCoupons(), getCouponRules()])
  couponRules.value = rules || {}
  coupons.value = (res.data || []).map((c) => ({
    ...c,
    max_uses_per_user: couponRules.value[c.code?.toUpperCase()]?.max_uses_per_user ?? 0,
  }))
}

onMounted(load)

const activeCount = computed(
  () => (coupons.value || []).filter((c) => c.active).length,
)
const inactiveCount = computed(
  () => (coupons.value || []).filter((c) => !c.active).length,
)

const filteredCoupons = computed(() => {
  let list = coupons.value || []

  if (statusFilter.value === 'active') {
    list = list.filter((c) => c.active)
  } else if (statusFilter.value === 'inactive') {
    list = list.filter((c) => !c.active)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(
      (c) =>
        (c.code && c.code.toLowerCase().includes(q)) ||
        String(c.discount).includes(q),
    )
  }

  return list
})

function create() {
  editing.value = null
  form.value = empty()
  modalOpen.value = true
}

function edit(coupon) {
  editing.value = coupon
  const rule = couponRules.value[coupon.code?.toUpperCase()] || {}
  const maxUses = rule.max_uses_per_user !== undefined ? rule.max_uses_per_user : 0
  form.value = {
    code: coupon.code,
    discount: coupon.discount,
    active: coupon.active,
    max_uses_per_user: maxUses > 0 ? maxUses : 1,
    unlimited: maxUses === 0,
  }
  modalOpen.value = true
}

async function save() {
  if (!form.value.code.trim()) {
    alert('Ingresa el código del cupón')
    return
  }
  const cleanCode = form.value.code.trim().toUpperCase()
  const payload = {
    code: cleanCode,
    discount: Math.max(0, Math.min(100, Number(form.value.discount) || 0)),
    active: Boolean(form.value.active),
  }

  if (editing.value) await updateCoupon(editing.value.id, payload)
  else await createCoupon(payload)

  // Guardar regla de uso por usuario
  couponRules.value[cleanCode] = {
    max_uses_per_user: form.value.unlimited ? 0 : Math.max(1, Number(form.value.max_uses_per_user) || 1),
  }
  await saveCouponRules(couponRules.value)

  modalOpen.value = false
  await load()
}

async function remove(coupon) {
  if (!confirm(`¿Eliminar el cupón ${coupon.code}?`)) return
  await deleteCoupon(coupon.id)
  delete couponRules.value[coupon.code?.toUpperCase()]
  await saveCouponRules(couponRules.value)
  await load()
}

async function toggle(coupon) {
  await updateCoupon(coupon.id, { active: !coupon.active })
  await load()
}
</script>

<template>
  <div class="admin-page-wrap">
    <div class="admin-toolbar">
      <div>
        <p class="admin-title">Cupones</p>
        <span class="muted">{{ coupons.length }} cupón(es) registrados</span>
      </div>
      <button class="admin-btn" @click="create">
        <AppIcon name="plus" :size="16" /> Nuevo cupón
      </button>
    </div>

    <!-- Barra de Filtros -->
    <div class="filter-bar">
      <div class="tabs">
        <button
          class="tab-btn"
          :class="{ active: statusFilter === 'all' }"
          @click="statusFilter = 'all'"
        >
          Todos ({{ coupons.length }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: statusFilter === 'active' }"
          @click="statusFilter = 'active'"
        >
          Activos ({{ activeCount }})
        </button>
        <button
          class="tab-btn"
          :class="{ active: statusFilter === 'inactive' }"
          @click="statusFilter = 'inactive'"
        >
          Inactivos ({{ inactiveCount }})
        </button>
      </div>

      <div class="search-box">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Buscar por código..."
          class="search-input"
        />
      </div>
    </div>

    <div class="admin-card">
      <div v-if="filteredCoupons.length" class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Descuento</th>
              <th>Límite por usuario</th>
              <th>Estado</th>
              <th class="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="coupon in filteredCoupons" :key="coupon.id">
              <td>
                <span class="coupon-code-badge">{{ coupon.code }}</span>
              </td>
              <td>
                <strong class="discount-num">-{{ coupon.discount }}%</strong>
              </td>
              <td>
                <span v-if="coupon.max_uses_per_user > 0" class="limit-badge">
                  {{ coupon.max_uses_per_user }} uso(s) por cliente
                </span>
                <span v-else class="limit-unlimited">Ilimitado</span>
              </td>
              <td>
                <button
                  class="status"
                  :class="coupon.active ? 'st-pagado' : 'st-pendiente'"
                  title="Haz clic para cambiar estado"
                  style="cursor: pointer"
                  @click="toggle(coupon)"
                >
                  {{ coupon.active ? '● Activo' : '○ Inactivo' }}
                </button>
              </td>
              <td>
                <div class="admin-actions right">
                  <button class="admin-mini" aria-label="Editar" @click="edit(coupon)">
                    <AppIcon name="edit" :size="15" />
                  </button>
                  <button class="admin-mini danger" aria-label="Eliminar" @click="remove(coupon)">
                    <AppIcon name="trash" :size="15" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else-if="searchQuery || statusFilter !== 'all'" class="admin-empty">
        No se encontraron cupones con los filtros actuales.
      </p>
      <p v-else class="admin-empty">No hay cupones registrados.</p>
    </div>

    <div v-if="modalOpen" class="admin-modal" @click.self="modalOpen = false">
      <div class="admin-modal-card">
        <div class="admin-modal-head">
          <h3 class="admin-modal-title">{{ editing ? 'Editar' : 'Nuevo' }} cupón</h3>
          <button class="admin-mini" @click="modalOpen = false"><AppIcon name="close" :size="16" /></button>
        </div>
        <div class="admin-form">
          <div class="admin-field">
            <label>Código del cupón</label>
            <input v-model="form.code" type="text" placeholder="BIENVENIDA" />
          </div>
          <div class="admin-field">
            <label>Descuento %</label>
            <input v-model.number="form.discount" type="number" min="1" max="100" />
          </div>

          <div class="admin-field">
            <label>Límite de usos por usuario</label>
            <div class="uses-input-row">
              <input
                v-model.number="form.max_uses_per_user"
                type="number"
                min="1"
                :disabled="form.unlimited"
                class="uses-number-input"
              />
              <label class="admin-check-inline">
                <input v-model="form.unlimited" type="checkbox" /> Sin límite (Ilimitado)
              </label>
            </div>
            <small class="upload-hint">
              {{ form.unlimited ? 'Cualquier usuario puede usarlo ilimitadamente.' : 'Cada usuario solo podrá canjear este cupón ' + form.max_uses_per_user + ' vez/veces.' }}
            </small>
          </div>

          <label class="admin-check">
            <input v-model="form.active" type="checkbox" /> Cupón Activo
          </label>
          <div class="admin-form-actions">
            <button class="admin-btn admin-btn-ghost" @click="modalOpen = false">Cancelar</button>
            <button class="admin-btn" @click="save">Guardar cupón</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-page-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.tabs {
  display: flex;
  gap: 6px;
  background: #f3ecee;
  padding: 4px;
  border-radius: 10px;
}

.tab-btn {
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink-600);
  background: transparent;
  transition: all 0.2s ease;
  cursor: pointer;
}

.tab-btn.active {
  background: var(--white);
  color: var(--rose-600);
  box-shadow: var(--shadow-sm);
}

.search-input {
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 8px 14px;
  font-size: 13px;
  width: 240px;
  background: var(--white);
  outline: none;
}

.search-input:focus {
  border-color: var(--rose-300);
}

.coupon-code-badge {
  display: inline-block;
  font-family: monospace;
  font-size: 13.5px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #c92a54;
  background: #fff0f3;
  border: 1px solid #fed7e2;
  padding: 4px 10px;
  border-radius: 6px;
}

.discount-num {
  color: var(--ink-900);
  font-size: 14px;
}

.st-pagado {
  background: var(--rose-50);
  color: var(--rose-600);
  border: 1px solid var(--rose-200);
}

.st-pendiente {
  background: #fff3e0;
  color: #b26a00;
  border: 1px solid #f0d9b0;
}

.text-right {
  text-align: right;
}

.admin-actions.right {
  justify-content: flex-end;
}

.limit-badge {
  display: inline-block;
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
}

.limit-unlimited {
  color: var(--ink-400);
  font-size: 12px;
  font-style: italic;
}

.uses-input-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 4px;
}

.uses-number-input {
  width: 100px;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  background: #ffffff;
  color: var(--ink-800);
}

.uses-number-input:disabled {
  background: #f8fafc;
  color: var(--ink-400);
  cursor: not-allowed;
}

.admin-check-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--ink-700);
  cursor: pointer;
  user-select: none;
}
</style>
