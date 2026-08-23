<script setup>
import { STORE } from '@/config'
</script>

<template>
  <main class="legal">
    <section class="legal-hero">
      <div class="container">
        <p class="crumbs">Inicio / Política de Privacidad</p>
        <h1 class="legal-title">Política de Privacidad</h1>
        <p class="legal-sub">Última actualización: 22 de agosto de 2026</p>
      </div>
    </section>

    <section class="container legal-body">
      <div class="legal-card">
        <p class="legal-lead">
          En {{ STORE.name }} Accesorios nos tomamos en serio tu privacidad. Esta política explica
          qué información recopilamos, cómo la usamos y los derechos que tienes sobre ella.
        </p>

        <h2>1. Información que recopilamos</h2>
        <p>
          Cuando te registras o compras en nuestra tienda, podemos recopilar los siguientes datos:
        </p>
        <ul>
          <li>Nombre y apellido.</li>
          <li>Correo electrónico.</li>
          <li>Número de teléfono.</li>
          <li>Preferencias de cuenta (guardar carrito, notificaciones de descuentos y cupones).</li>
          <li>Información del pedido: productos, cantidades y montos.</li>
        </ul>

        <h2>2. Cómo usamos tu información</h2>
        <ul>
          <li>Crear y gestionar tu cuenta.</li>
          <li>Procesar tus pedidos y coordinar la entrega.</li>
          <li>Enviarte novedades, descuentos y cupones si activaste las notificaciones.</li>
          <li>Mejorar nuestros productos y la experiencia de compra.</li>
          <li>Cumplir obligaciones legales y de seguridad.</li>
        </ul>

        <h2>3. Información de contacto y gestión de compras</h2>
        <p>
          La finalización de la compra se realiza a través de WhatsApp al número
          <strong>+{{ STORE.whatsapp }}</strong>. Al enviar tu pedido por este medio, compartes la
          información del carrito voluntariamente para concretar la compra.
        </p>

        <h2>4. Acceso con Google</h2>
        <p>
          Si inicias sesión con Google, recibimos de Google los datos básicos de tu perfil (nombre
          y correo) que autorices. No tenemos acceso a tu contraseña de Google.
        </p>

        <h2>5. Cookies y seguridad</h2>
        <p>
          Usamos tecnologías de almacenamiento local y cookies propias de la aplicación para
          recordar tu sesión y preferencias. Protegemos tus datos con controles de acceso y medidas
          de seguridad razonables.
        </p>

        <h2>6. Con quién compartimos tu información</h2>
        <p>
          No vendemos ni alquilamos tus datos personales. Solo compartimos información cuando es
          necesario para operar el servicio o cumplir la ley (por ejemplo, proveedores de pago,
          envío o de infraestructura tecnológica).
        </p>

        <h2>7. Tus derechos</h2>
        <p>
          Puedes solicitar acceso, corrección o eliminación de tus datos personales en cualquier
          momento escribiéndonos a <strong>{{ STORE.email }}</strong> o por WhatsApp al
          <strong>+{{ STORE.whatsapp }}</strong>.
        </p>

        <h2>8. Contacto</h2>
        <p>
          Ante cualquier duda sobre esta política, contáctanos:
        </p>
        <ul>
          <li>WhatsApp: +{{ STORE.whatsapp }}</li>
          <li>Correo: {{ STORE.email }}</li>
          <li>Instagram: {{ STORE.instagram }}</li>
          <li>Ubicación: {{ STORE.address }}</li>
        </ul>
      </div>
    </section>
  </main>
</template>

<style scoped>
.legal {
  background: var(--cream);
  min-height: 70vh;
}

.legal-hero {
  background: var(--rose-gradient);
  color: var(--white);
  text-align: center;
  padding: 56px 0;
}

.crumbs {
  font-size: 13px;
  opacity: 0.9;
  margin-bottom: 10px;
}

.legal-title {
  font-family: var(--font-display);
  font-size: clamp(36px, 6vw, 56px);
  font-weight: 600;
}

.legal-sub {
  margin-top: 8px;
  opacity: 0.92;
  font-size: 14px;
}

.legal-body {
  padding-top: 50px;
  padding-bottom: 60px;
}

.legal-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 46px;
  max-width: 820px;
  margin: 0 auto;
}

.legal-lead {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--ink-700);
  line-height: 1.5;
  margin-bottom: 24px;
}

.legal-card h2 {
  font-family: var(--font-display);
  font-size: 24px;
  color: var(--ink-900);
  margin: 28px 0 12px;
}

.legal-card p {
  color: var(--ink-500);
  font-size: 15px;
  margin-bottom: 12px;
  line-height: 1.7;
}

.legal-card ul {
  list-style: disc;
  padding-left: 24px;
  margin-bottom: 14px;
}

.legal-card li {
  color: var(--ink-500);
  font-size: 15px;
  margin-bottom: 6px;
  line-height: 1.6;
}

.legal-card strong {
  color: var(--ink-700);
}

@media (max-width: 600px) {
  .legal-card {
    padding: 28px 22px;
  }
}
</style>
