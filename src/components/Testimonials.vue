<script setup>
import { TESTIMONIALS } from '@/data/products'
import AppIcon from '@/components/AppIcon.vue'
</script>

<template>
  <section class="testimonials">
    <div class="container">
      <div class="t-head">
        <span class="eyebrow">Testimonios</span>
        <h2 class="section-title">Lo que dicen nuestras clientas</h2>
      </div>

      <div class="t-grid">
        <div v-for="testimonial in TESTIMONIALS" :key="testimonial.name" class="t-card">
          <div class="t-quote">
            <AppIcon
              v-for="n in testimonial.rating"
              :key="n"
              name="star"
              :size="15"
              class="t-star"
            />
          </div>
          <p class="t-text">"{{ testimonial.text }}"</p>
          <div class="t-avatar">{{ testimonial.name.charAt(0) }}</div>
          <p class="t-name">{{ testimonial.name }}</p>
          <p class="t-role">Cliente verificada</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.testimonials {
  padding: 60px 0;
}

.t-head {
  text-align: center;
  margin-bottom: 34px;
}

.t-head .eyebrow::before,
.t-head .eyebrow::after {
  background: var(--rose-300);
}

.t-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

.t-card {
  background: var(--white);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: 30px 28px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.t-quote {
  display: inline-flex;
  gap: 3px;
}

.t-star {
  color: var(--gold);
}

.t-text {
  margin: 16px 0 20px;
  font-family: var(--font-display);
  font-size: 18px;
  line-height: 1.5;
  color: var(--ink-700);
  font-style: italic;
}

.t-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--rose-100);
  color: var(--rose-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  margin-bottom: 8px;
}

.t-name {
  font-weight: 600;
  color: var(--ink-900);
  font-size: 14px;
}

.t-role {
  font-size: 12px;
  color: var(--ink-400);
  margin-top: 2px;
}

@media (max-width: 800px) {
  .t-grid {
    grid-template-columns: 1fr;
  }
}
</style>
