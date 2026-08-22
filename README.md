# Detallitos Accesorios

Tienda online desarrollada con **Vue 3** que permite explorar el catálogo, armar el carrito y finalizar la compra enviando el pedido por **WhatsApp**. Diseño elegante, femenino y 100% responsive, con precios en **USD** y dirección en **Puerto Ordaz, Venezuela**.

> Pequeños detalles, grandes recuerdos.

---

## Stack tecnológico

| Capa            | Tecnología              | Uso                                             |
| --------------- | ----------------------- | ----------------------------------------------- |
| Framework UI    | **Vue 3** (Composition API) | Componentes y reactividad                     |
| Build tool      | **Vite**                | Dev server y builds rápidos                     |
| Enrutado        | **Vue Router 4**        | SPA con vistas lazy-loading                     |
| Estado global   | **Pinia**               | Carrito compartido entre componentes            |
| Estilos         | **CSS puro + variables**| Design tokens y tema rosa                       |
| Persistencia    | **PostgreSQL** *(próximamente)* | Catálogo, cupones y pedidos               |

---

## ¿Qué usamos de Vue?

- **Composition API + `<script setup>`**: lógica declarativa y concisa en cada componente.
- **Componentización completa**: la UI se divide en piezas pequeñas y reutilizables, sin lógica duplicada.
- **`props` y `defineProps`**: los datos viajan de padres a hijos (ej. `ProductCard` recibe `product`).
- **`computed`**: derivación de valores reactivos (subtotal, filtros, total del carrito).
- **`v-model`**: binding bidireccional en formularios (buscador, newsletter, contacto).
- **Directivas**: `v-for`, `v-if`, `v-else`, `:class`, `:style`, `@click`.
- **Vue Router**: rutas con `import()` dinámico → carga bajo demanda y separa el JS en chunks.
- **Pinia**: store del carrito con `state`, `getters` y `actions`.

---

## Arquitectura

```
src/
├── main.js                # Bootstrap: Pinia + Router
├── App.vue                # Layout global (Header + views + Footer + CartDrawer)
├── style.css              # Design tokens y estilos base
├── config.js              # Configuración de la tienda (STORE, CATEGORIES)
├── router/
│   └── index.js           # Rutas de la SPA
├── store/
│   └── cart.js            # Estado global del carrito + mensaje WhatsApp + orden
├── utils/
│   └── format.js          # Formateo de precios (USD) y números
├── data/
│   └── products.js        # Catálogo de productos y testimonios
├── components/            # Piezas reutilizables de UI
│   ├── AppIcon.vue        # Librería de iconos SVG
│   ├── SiteHeader.vue     # Barra promocional + navegación + drawer
│   ├── SiteFooter.vue     # Pie de página
│   ├── CartDrawer.vue     # Carrito deslizante
│   ├── HeroSection.vue    # Banner principal
│   ├── CategoriesSection.vue
│   ├── FeaturedProducts.vue
│   ├── ProductCard.vue    # Tarjeta de producto
│   ├── PromoBanner.vue
│   ├── NewArrivals.vue    # Carrusel de novedades
│   ├── TrustFeatures.vue
│   ├── Testimonials.vue
│   ├── InstagramSection.vue
│   └── NewsletterSection.vue
└── views/                 # Páginas
    ├── HomeView.vue
    ├── ShopView.vue       # Tienda + filtros por categoría / novedades / búsqueda
    ├── CategoriesView.vue
    ├── ProductView.vue    # Detalle de producto
    ├── AboutView.vue
    ├── ContactView.vue
    └── NotFoundView.vue
```

### Flujo de datos

1. El **catálogo** vive en `src/data/products.js` y se muestra en `ProductCard`.
2. Al pulsar **"Agregar al carrito"** se llama a la acción `cart.add(product)` de Pinia.
3. El carrito se vuelve visible en el `Header`, en el `CartDrawer` y en el `subtotal`.
4. **"Finalizar compra por WhatsApp"** abre `wa.me` con el detalle del pedido formateado.
5. **"Descargar orden"** genera una orden imprimible lista para guardar como PDF.

### Mensaje de WhatsApp

```
*Detallitos Accesorios*
_Nuevo pedido_
--------------------------------
Fecha: 22/08/2026
--------------------------------
1) Collar Corazón Dorado
   Cantidad: 1
   Precio: $10
--------------------------------
*Total: $10*
--------------------------------
_Gracias por confiar en nosotros_
```

---

## Configuración de la tienda

Todo se centraliza en `src/config.js`:

```js
export const STORE = {
  name: 'Detallitos',
  whatsapp: '584147675878',
  address: 'Puerto Ordaz, Venezuela',
  currency: { code: 'USD', locale: 'es-VE', symbol: '$' },
  coupon: 'BIENVENIDA',
  freeShipping: 60,
  instagram: '@detallitoslg',
}
```

Cambia aquí el número de WhatsApp, la ubicación, la moneda o el cupón.

---

## Instalación y uso

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción (carpeta dist/)
npm run preview  # previsualizar el build
```

---

## Integración con PostgreSQL (próximamente)

El proyecto está preparado para conectarse a una base de datos **PostgreSQL** mediante una API backend y un panel administrativo. La arquitectura por capas (datos → store → vista) permite sustituir el catálogo estático por datos reales con cambios mínimos.

### Panel administrativo

Un módulo futuro (posiblemente en `src/admin/`) para:

- Subir, editar y eliminar productos.
- Gestionar **categorías**, **descuentos** y **cupones**.
- Ver y actualizar el estado de los **pedidos** y las compras enviadas por WhatsApp.

---

## Responsive

- **Móvil**: barra única (hamburguesa + logo + buscador + carrito), menú lateral, carrusel deslizable, tarjetas apiladas.
- **Tablet / Escritorio**: navegación completa y grids de 3 a 5 columnas.
- Breakpoints: `1024px`, `900px`, `700px`, `480px`.

---

## Licencia

Proyecto de desarrollo. Los precios y contenidos actuales son de prueba.
