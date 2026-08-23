import { supabase } from '@/lib/supabase'

export async function listProducts() {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }
  return supabase
    .from('products')
    .select('*, categories(slug, name)')
    .order('id', { ascending: true })
}

export async function createProduct(product) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('products').insert(product).select().single()
}

export async function updateProduct(id, patch) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('products').update(patch).eq('id', id).select().single()
}

export async function deleteProduct(id) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('products').delete().eq('id', id)
}

export async function listCategories() {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }
  const { data, error } = await supabase.from('categories').select('*').order('id')
  const products = await supabase.from('products').select('category_id')
  return { data, error, counts: products.data }
}

export async function createCategory(category) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('categories').insert(category).select().single()
}

export async function updateCategory(id, patch) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('categories').update(patch).eq('id', id).select().single()
}

export async function deleteCategory(id) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('categories').delete().eq('id', id)
}

export async function listCoupons() {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }
  return supabase.from('coupons').select('*').order('id')
}

export async function createCoupon(coupon) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('coupons').insert(coupon).select().single()
}

export async function updateCoupon(id, patch) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('coupons').update(patch).eq('id', id).select().single()
}

export async function deleteCoupon(id) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('coupons').delete().eq('id', id)
}

export async function listOrders() {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }
  return supabase
    .from('orders')
    .select('*, profiles(name, lastname), order_items(*)')
    .order('created_at', { ascending: false })
}

export async function listMyOrders(userId) {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }
  return supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function getSavedCart(userId) {
  if (!supabase) return { data: null, error: 'Supabase no configurado' }
  return supabase.from('carts').select('items').eq('user_id', userId).maybeSingle()
}

export async function clearSavedCart(userId) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('carts').delete().eq('user_id', userId)
}

export async function updateOrderStatus(id, status) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('orders').update({ status }).eq('id', id).select().single()
}

export async function insertOrder(order, items) {
  if (!supabase) return { error: 'Supabase no configurado' }
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single()
  if (error || !data) return { error }
  await supabase.from('order_items').insert(
    items.map((item) => ({ order_id: data.id, product_id: item.id, qty: item.qty, price: item.price })),
  )
  return { data }
}

export async function getPromotions() {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }
  return supabase.from('promotions').select('*').order('id')
}

export async function upsertPromotion(promo) {
  if (!supabase) return { error: 'Supabase no configurado' }
  if (promo.id) return supabase.from('promotions').update(promo).eq('id', promo.id).select().single()
  return supabase.from('promotions').insert(promo).select().single()
}

export async function deletePromotion(id) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('promotions').delete().eq('id', id)
}
