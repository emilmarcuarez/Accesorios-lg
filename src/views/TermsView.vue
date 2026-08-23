<script setup>
import { STORE } from '@/config'
</script>

<template>
  <main class="legal">
    <section class="legal-hero">
      <div class="container">
        <p class="crumbs">Inicio / Términos y Condiciones</p>
        <h1 class="legal-title">Términos del Servicio</h1>
        <p class="legal-sub">Última actualización: 22 de agosto de 2026</p>
      </div>
    </section>

    <section class="container legal-body">
      <div class="legal-card">
        <p class="legal-lead">
          Bienvenida a {{ STORE.name }} Accesorios. Al acceder o usar nuestra tienda, aceptas los
          siguientes términos y condiciones. Te recomendamos leerlos con atención.
        </p>

        <h2>1. Sobre la tienda</h2>
        <p>
          {{ STORE.name }} Accesorios ("la tienda", "nosotros") ofrece accesorios y regalos
          personalizados desde {{ STORE.address }}. Los precios se muestran en dólares
          estadounidenses (USD).
        </p>

        <h2>2. Cuentas de usuario</h2>
        <p>
          Para comprar o guardar tu carrito puedes crear una cuenta. Eres responsable de mantener la
          confidencialidad de tus datos de acceso y de la información que ingreses.
        </p>

        <h2>3. Productos y disponibilidad</h2>
        <p>
          Procuramos que las imágenes, descripciones y precios sean precisos. Sin embargo, pueden
          existir diferencias menores debido al proceso de producción y las fotografías. Nos
          reservamos el derecho de actualizar, modificar o discontinuar productos sin previo aviso.
        </p>

        <h2>4. Pedidos y pagos</h2>
        <p>
          La compra se finaliza a través de WhatsApp al número <strong>+{{ STORE.whatsapp }}</strong>.
          Enviar tu carrito por este medio constituye una solicitud de pedido, que será confirmada por
          nuestro equipo. El pago y las condiciones de entrega se acuerdan directamente al coordinar
          el pedido.
        </p>

        <h2>5. Precios y promociones</h2>
        <p>
          Los precios, descuentos y cupones pueden cambiar en cualquier momento. Los descuentos se
          aplican según lo indicado en la oferta. Nos reservamos el derecho de corregir errores de
          precio en pedidos no confirmados.
        </p>

        <h2>6. Envíos y devoluciones</h2>
        <p>
          Los tiempos y condiciones de envío se informan al coordinar el pedido. Para solicitudes de
          devolución o cambios, contacta a nuestro equipo por WhatsApp o correo dentro de los plazos
          establecidos.
        </p>

        <h2>7. Uso permitido</h2>
        <p>
          Te comprometes a no usar la tienda para fines ilegales, para intentar acceder a información
          ajena o para alterar el funcionamiento del sitio. Nos reservamos el derecho de suspender
          cuentas que incumplan estas condiciones.
        </p>

        <h2>8. Propiedad intelectual</h2>
        <p>
          Todo el contenido de la tienda (marca, textos, imágenes y diseño) es propiedad de
          {{ STORE.name }} Accesorios o de sus licenciantes. No puede reproducirse sin autorización.
        </p>

        <h2>9. Limitación de responsabilidad</h2>
        <p>
          No seremos responsables por daños derivados del uso indebido del sitio, interrupciones del
          servicio o factores fuera de nuestro control razonable.
        </p>

        <h2>10. Modificaciones</h2>
        <p>
          Podemos actualizar estos términos en cualquier momento. Los cambios serán publicados en
          esta página con la nueva fecha de actualización.
        </p>

        <h2>11. Ley aplicable y contacto</h2>
        <p>
          Estos términos se rigen por la legislación vigente en Venezuela. Para cualquier consulta,
          contáctanos por WhatsApp (+{{ STORE.whatsapp }}) o correo ({{ STORE.email }}).
        </p>
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

.legal-card strong {
  color: var(--ink-700);
}

@media (max-width: 600px) {
  .legal-card {
    padding: 28px 22px;
  }
}
</style>
