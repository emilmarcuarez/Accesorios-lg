<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/AppIcon.vue'
import { STORE } from '@/config'

const faqs = computed(() => [
  {
    q: `¿Cómo compro en ${STORE.name}?`,
    a: 'Elige tus accesorios, agrégalos al carrito y en "Finalizar compra" se abre WhatsApp con el detalle de tu pedido para confirmarlo con nuestro equipo.',
  },
  {
    q: '¿Cuáles son los métodos de pago?',
    a: 'Aceptamos Pago Móvil, transferencias, Zelle, USDT, dólares en efectivo y euros. Coordinamos el pago al confirmar el pedido por WhatsApp.',
  },
  {
    q: '¿Cuánto tarda el envío?',
    a: `Los tiempos de entrega se informan al coordinar tu pedido. Ofrecemos envío a todo el país y el envío es gratis en compras superiores a $${STORE.freeShipping}.`,
  },
  {
    q: '¿Puedo devolver o cambiar un producto?',
    a: 'Sí. Tenemos políticas de cambio y devolución. Escríbenos por WhatsApp dentro de los plazos establecidos para gestionar tu solicitud.',
  },
  {
    q: '¿Cómo cuido mis accesorios?',
    a: 'Evita el contacto con agua, perfumes y químicos. Guárdalos en un lugar seco y límpialos con un paño suave para que conserven su brillo.',
  },
  {
    q: '¿Qué tallas tienen los accesorios?',
    a: 'Collares, pulseras y anillos tienen tallas ajustables en su mayoría. Si dudas de tu talla, escríbenos y te asesoramos.',
  },
  {
    q: '¿Los accesorios vienen empacados para regalo?',
    a: 'Sí, todos nuestros productos se envían con un empaque especial listo para regalar. Si quieres una tarjeta personalizada, indícalo al coordinar tu pedido.',
  },
  {
    q: '¿Hacen envíos internacionales?',
    a: `Por ahora realizamos envíos dentro del país. Para pedidos especiales, contáctanos por WhatsApp a +${STORE.whatsapp} y evaluamos tu caso.`,
  },
])

const open = ref(0)
</script>

<template>
  <main class="faq">
    <section class="faq-hero" data-aos="fade-down">
      <div class="container">
        <span class="eyebrow">Ayudo</span>
        <h1 class="faq-title">Preguntas frecuentes</h1>
        <p class="faq-sub">Resolvemos tus dudas sobre accesorios, envíos y pagos.</p>
      </div>
    </section>

    <section class="container faq-body">
      <div
        v-for="(item, i) in faqs"
        :key="i"
        class="faq-item"
        :class="{ open: open === i }"
        data-aos="fade-up"
        :data-aos-delay="Math.min(i * 50, 400)"
        @click="open = open === i ? -1 : i"
      >
        <div class="faq-head">
          <span class="faq-q">{{ item.q }}</span>
          <AppIcon name="chevronRight" :size="18" class="faq-chevron" />
        </div>
        <div v-show="open === i" class="faq-a">{{ item.a }}</div>
      </div>

      <div class="faq-help">
        <p>¿No encontraste tu respuesta?</p>
        <router-link to="/contactos" class="btn btn-primary">Escríbenos</router-link>
      </div>
    </section>
  </main>
</template>

<style scoped>
.faq {
  background: var(--cream);
  min-height: 70vh;
}

.faq-hero {
  background: linear-gradient(180deg, #fff7f9 0%, #ffffff 100%);
  border-bottom: 1.5px solid var(--rose-200, #f3c6d2);
  color: var(--ink-900);
  text-align: center;
  padding: 54px 0;
}

.faq-hero .eyebrow {
  color: var(--rose-600);
}

.faq-title {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 54px);
  font-weight: 600;
  color: var(--ink-900);
}

.faq-sub {
  margin-top: 8px;
  color: var(--ink-500);
}

.faq-body {
  padding-top: 50px;
  padding-bottom: 70px;
  max-width: 820px;
}

.faq-item {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  margin-bottom: 14px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.faq-item.open {
  border-color: var(--rose-300);
}

.faq-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 20px 24px;
  cursor: pointer;
}

.faq-q {
  font-family: var(--font-display);
  font-size: 19px;
  font-weight: 600;
  color: var(--ink-900);
}

.faq-chevron {
  color: var(--rose-500);
  transition: transform 0.25s ease;
  flex: 0 0 auto;
}

.faq-item.open .faq-chevron {
  transform: rotate(90deg);
}

.faq-a {
  padding: 0 24px 22px;
  color: var(--ink-500);
  font-size: 15px;
  line-height: 1.7;
}

.faq-help {
  text-align: center;
  margin-top: 34px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.faq-help p {
  color: var(--ink-500);
  font-size: 15px;
}
</style>
