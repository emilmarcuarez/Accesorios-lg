<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useCatalogStore } from '@/store/catalog'
import AppIcon from '@/components/AppIcon.vue'
import { resolveImage } from '@/utils/image'

const catalog = useCatalogStore()
const trackRef = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// Mostrar todas las categorías, organizando las que tienen stock primero
const categories = computed(() => {
  return [...catalog.categoryCards]
    .map((cat) => {
      const prodsWithStock = (catalog.products || []).filter(
        (p) =>
          (p.categoryId === cat.id || p.category === cat.slug) &&
          (Number(p.stock) || 0) > 0,
      )
      const totalStock = prodsWithStock.reduce((acc, p) => acc + (Number(p.stock) || 0), 0)
      return {
        ...cat,
        productCount: prodsWithStock.length,
        totalStock,
        hasStock: prodsWithStock.length > 0,
      }
    })
    .sort((a, b) => {
      if (a.hasStock && !b.hasStock) return -1
      if (!a.hasStock && b.hasStock) return 1
      if (a.hasStock && b.hasStock) return b.totalStock - a.totalStock
      return 0
    })
})

function updateScrollState() {
  const el = trackRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 10
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 10
}

function scroll(direction) {
  const el = trackRef.value
  if (!el) return
  const scrollAmount = el.clientWidth * 0.7
  el.scrollBy({
    left: direction === 'left' ? -scrollAmount : scrollAmount,
    behavior: 'smooth',
  })
}

watch(categories, () => {
  nextTick(updateScrollState)
})

onMounted(async () => {
  await catalog.fetch()
  nextTick(() => {
    updateScrollState()
  })
  window.addEventListener('resize', updateScrollState)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateScrollState)
})
</script>

<template>
  <section v-if="categories.length" class="categories" data-aos="fade-up">
    <div class="container">
      <div class="carousel-wrap">
        <!-- Botón Desplazar Izquierda -->
        <button
          v-show="canScrollLeft"
          class="carousel-nav prev"
          type="button"
          aria-label="Ver categorías anteriores"
          @click="scroll('left')"
        >
          <AppIcon name="chevronLeft" :size="20" />
        </button>

        <!-- Track Carrusel de Categorías -->
        <div
          ref="trackRef"
          class="cat-track"
          :class="{ 'is-centered': !canScrollLeft && !canScrollRight }"
          @scroll.passive="updateScrollState"
        >
          <router-link
            v-for="(cat, index) in categories"
            :key="cat.slug"
            :to="`/tienda/${cat.slug}`"
            class="cat-item"
            data-aos="zoom-in"
            :data-aos-delay="Math.min(index * 60, 400)"
          >
            <div class="cat-circle">
              <img
                v-if="cat.image"
                loading="lazy"
                :src="resolveImage(cat.image)"
                :alt="cat.name"
                :style="{ objectPosition: cat.pos }"
              />
              <div v-else class="cat-placeholder">
                <AppIcon name="bag" :size="28" />
              </div>
            </div>
            <p class="cat-name">{{ cat.name }}</p>
          </router-link>
        </div>

        <!-- Botón Desplazar Derecha -->
        <button
          v-show="canScrollRight"
          class="carousel-nav next"
          type="button"
          aria-label="Ver más categorías"
          @click="scroll('right')"
        >
          <AppIcon name="chevronRight" :size="20" />
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.categories {
  padding: 56px 0 32px;
  background: #ffffff;
  border-bottom: 1px solid rgba(234, 169, 187, 0.22);
}

.carousel-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.cat-track {
  display: flex;
  gap: 28px;
  overflow-x: auto;
  scroll-behavior: smooth;
  scroll-snap-type: x mandatory;
  padding: 12px 6px;
  width: 100%;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none; /* Firefox */
}

.cat-track::-webkit-scrollbar {
  display: none; /* Chrome, Safari */
}

.cat-track.is-centered {
  justify-content: center;
}

.cat-item {
  flex: 0 0 145px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
  scroll-snap-align: center;
  text-decoration: none;
  transition: transform 0.25s ease;
}

.cat-circle {
  position: relative;
  width: 135px;
  height: 135px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--rose-100);
  background: var(--rose-50);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), border-color 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 14px rgba(216, 90, 127, 0.08);
}

.cat-item:hover .cat-circle {
  transform: translateY(-6px) scale(1.03);
  border-color: var(--rose-400);
  box-shadow: 0 8px 20px rgba(216, 90, 127, 0.2);
}

.cat-circle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cat-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rose-300);
  background: var(--rose-100);
}

.cat-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--ink-700);
  line-height: 1.3;
  max-width: 130px;
  margin: 0;
  transition: color 0.2s ease;
}

.cat-item:hover .cat-name {
  color: var(--rose-600);
}

/* Botones de navegación del carrusel */
.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #ffffff;
  border: 1px solid var(--rose-200);
  color: var(--rose-600);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 5;
  transition: all 0.2s ease;
}

.carousel-nav:hover {
  background: var(--rose-500);
  border-color: var(--rose-500);
  color: #ffffff;
  transform: translateY(-50%) scale(1.08);
}

.carousel-nav.prev {
  left: -18px;
}

.carousel-nav.next {
  right: -18px;
}

@media (max-width: 768px) {
  .categories {
    padding: 32px 0 16px;
  }
  .cat-track {
    gap: 20px;
  }
  .cat-item {
    flex: 0 0 120px;
  }
  .cat-circle {
    width: 110px;
    height: 110px;
  }
  .cat-name {
    font-size: 13px;
  }
  .carousel-nav {
    display: none; /* En móviles se desliza de forma táctil natural */
  }
}
</style>
