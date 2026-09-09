import { defineStore } from 'pinia'
import { listProducts, listCategories } from '@/lib/db'
import { parseProductImages } from '@/utils/image'

function mapProduct(p, categoriesMap = {}) {
  const price = Number(p.price) || 0
  const prodDiscount = Number(p.discount) || 0
  const catDiscount =
    p.category_id && categoriesMap[p.category_id]?.discount
      ? Number(categoriesMap[p.category_id].discount)
      : 0

  // Si el producto tiene descuento propio se usa ese; de lo contrario hereda el de la categoría
  const discount = prodDiscount > 0 ? prodDiscount : catDiscount
  const discountSource =
    prodDiscount > 0 ? 'product' : catDiscount > 0 ? 'category' : null

  const effectivePrice =
    discount > 0 ? Number((price * (1 - discount / 100)).toFixed(2)) : price
  const oldPrice = discount > 0 ? price : p.old_price ? Number(p.old_price) : 0
  const discountAmount =
    discount > 0 ? Number((price - effectivePrice).toFixed(2)) : 0

  const images = parseProductImages(p.image)
  const mainImage = images[0] || (typeof p.image === 'string' && !p.image.startsWith('[') ? p.image : '')

  return {
    id: p.id,
    name: p.name,
    description: p.description || '',
    category: p.categories?.slug || '',
    categoryName: p.categories?.name || '',
    categoryId: p.category_id,
    originalPrice: price,
    price: effectivePrice,
    oldPrice,
    discount,
    discountAmount,
    discountSource,
    stock: p.stock ?? 0,
    image: mainImage,
    images: images.length ? images : (mainImage ? [mainImage] : []),
    pos: 'center',
    rating: p.rating || 5,
    reviews: 0,
    featured: p.featured,
    isNew: p.is_new,
  }
}

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    products: [],
    categories: [],
    loading: false,
    loaded: false,
  }),
  getters: {
    featured: (state) => state.products.filter((p) => p.featured && (Number(p.stock) || 0) > 0),
    newArrivals: (state) => state.products.filter((p) => p.isNew && (Number(p.stock) || 0) > 0),
    discounted: (state) => state.products.filter((p) => p.discount > 0 && (Number(p.stock) || 0) > 0),
    categoryCards: (state) =>
      state.categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        discount: c.discount || 0,
        image: c.image || '',
        pos: 'center',
      })),
  },
  actions: {
    async fetch(force = false) {
      if (!force && (this.loaded || this.loading)) return
      this.loading = true
      const [p, c] = await Promise.all([listProducts(), listCategories()])
      const categories = c.data || []
      const categoriesMap = {}
      categories.forEach((cat) => {
        categoriesMap[cat.id] = cat
      })
      this.categories = categories
      this.products = (p.data || []).map((prod) => mapProduct(prod, categoriesMap))
      this.loading = false
      this.loaded = true
    },
    byId(id) {
      return this.products.find((p) => p.id === Number(id))
    },
  },
})
