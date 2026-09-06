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

export async function getCouponRules() {
  const { data } = await getSetting('coupon_rules')
  if (!data) return {}
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch {
    return {}
  }
}

export async function saveCouponRules(rules) {
  return setSetting('coupon_rules', JSON.stringify(rules))
}

export async function getCouponUsages() {
  const { data } = await getSetting('coupon_usages')
  if (!data) return {}
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch {
    return {}
  }
}

export async function recordCouponUsage(code, userKey) {
  if (!code || !userKey) return
  const cleanCode = code.toUpperCase().trim()
  const usages = await getCouponUsages()
  if (!usages[cleanCode]) usages[cleanCode] = {}
  usages[cleanCode][userKey] = (usages[cleanCode][userKey] || 0) + 1
  return setSetting('coupon_usages', JSON.stringify(usages))
}

// Registro de cupones usados en órdenes
export async function getOrderCoupons() {
  const { data } = await getSetting('order_coupons')
  if (!data) return {}
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch {
    return {}
  }
}

export async function recordOrderCoupon(orderId, couponData) {
  if (!orderId || !couponData) return
  const current = await getOrderCoupons()
  current[String(orderId)] = {
    code: couponData.code?.toUpperCase()?.trim(),
    discount: Number(couponData.discount) || 0,
    amount: Number(couponData.amount) || 0,
    recorded_at: new Date().toISOString(),
  }
  return setSetting('order_coupons', JSON.stringify(current))
}

// Comprueba cupones vencidos o con límite alcanzado y los desactiva automáticamente en Supabase
export async function checkAndDeactivateExpiredCoupons() {
  if (!supabase) return
  try {
    const [couponsRes, rules] = await Promise.all([listCoupons(), getCouponRules()])
    const couponsList = couponsRes.data || []
    const now = new Date()

    for (const c of couponsList) {
      if (!c.active) continue
      const rule = rules[c.code?.toUpperCase()] || {}

      // 1. Verificar fecha de vencimiento
      if (rule.expires_at) {
        const expDate = new Date(rule.expires_at)
        if (!isNaN(expDate.getTime()) && now.getTime() > expDate.getTime()) {
          await updateCoupon(c.id, { active: false })
          c.active = false
          continue
        }
      }

      // 2. Verificar límite total de canjes globales si está configurado
      if (rule.total_usage_limit && Number(rule.total_usage_limit) > 0) {
        const usages = await getCouponUsages()
        const codeUsages = usages[c.code?.toUpperCase()] || {}
        const totalUsed = Object.values(codeUsages).reduce((sum, val) => sum + (Number(val) || 0), 0)
        if (totalUsed >= Number(rule.total_usage_limit)) {
          await updateCoupon(c.id, { active: false })
          c.active = false
        }
      }
    }
  } catch (err) {
    console.warn('Error al verificar vencimiento automático de cupones:', err)
  }
}

export async function listProfiles() {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }
  return supabase.from('profiles').select('*').order('created_at', { ascending: false })
}

export async function listOrders() {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }
  const [ordersRes, orderCouponsMap] = await Promise.all([
    supabase
      .from('orders')
      .select('*, profiles(name, lastname), order_items(*, products(name, price, discount, image))')
      .order('created_at', { ascending: false }),
    getOrderCoupons(),
  ])

  const ordersList = ordersRes.data || []
  const enriched = ordersList.map((o) => {
    const couponInfo = orderCouponsMap[String(o.id)] || null
    return {
      ...o,
      coupon_code: couponInfo?.code || null,
      coupon_discount: couponInfo?.discount || 0,
      coupon_amount: couponInfo?.amount || 0,
    }
  })

  return { data: enriched, error: ordersRes.error }
}

export async function listMyOrders(userId) {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }
  return supabase
    .from('orders')
    .select('*, order_items(*, products(name, price, discount, image))')
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

export async function getFavorites(userId) {
  if (!supabase) return { data: null, error: 'Supabase no configurado' }
  return supabase.from('favorites').select('product_ids').eq('user_id', userId).maybeSingle()
}

export async function setFavorites(userId, productIds) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('favorites').upsert(
    { user_id: userId, product_ids: productIds, updated_at: new Date().toISOString() },
    { onConflict: 'user_id' },
  )
}

export async function getSetting(key) {
  if (!supabase) return { data: null }
  const { data } = await supabase.from('settings').select('value').eq('key', key).maybeSingle()
  return { data: data?.value ?? null }
}

export async function setSetting(key, value) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('settings').upsert({ key, value }, { onConflict: 'key' })
}

export async function listGallery() {
  if (!supabase) return { data: [] }
  return supabase.from('gallery').select('*').order('id', { ascending: true })
}

export async function addGallery(image) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('gallery').insert({ image }).select().single()
}

export async function deleteGallery(id) {
  if (!supabase) return { error: 'Supabase no configurado' }
  return supabase.from('gallery').delete().eq('id', id)
}

export async function uploadImage(file) {
  const key = import.meta.env.VITE_X02
  if (!key) return { error: 'VITE_X02 no configurado en .env' }
  const form = new FormData()
  form.append('file', file)
  try {
    const res = await fetch('https://x02.me/api/upload', {
      method: 'POST',
      headers: { 'x-api-key': key },
      body: form,
    })
    if (!res.ok) return { error: 'Error al subir la imagen (x02.me)' }
    const text = (await res.text()).trim()
    let url = text
    try {
      const j = JSON.parse(text)
      url = j.url || j.link || j.direct || j.data?.url || text
    } catch {}
    return { url }
  } catch {
    return { error: 'No se pudo conectar con x02.me' }
  }
}

export async function uploadHeroMedia(file, previousUrl = null) {
  if (!supabase) return { error: 'Supabase no está configurado' }

  // 1. Borrar el archivo anterior de Supabase Storage para no dejar basura
  if (previousUrl) {
    await deleteHeroMedia(previousUrl)
  }

  // 2. Subir el nuevo archivo al bucket 'hero-videos'
  const fileExt = (file.name.split('.').pop() || 'mp4').toLowerCase()
  const cleanName = file.name
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 30)
  const fileName = `header_${Date.now()}_${cleanName}.${fileExt}`

  try {
    const { data, error } = await supabase.storage
      .from('hero-videos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      })

    if (error) {
      return {
        error:
          'Error en Supabase Storage: ' +
          (error.message || 'Por favor asegúrate de ejecutar el script SQL para crear el bucket hero-videos.'),
      }
    }

    const { data: publicData } = supabase.storage
      .from('hero-videos')
      .getPublicUrl(fileName)

    return {
      url: publicData.publicUrl,
      fileName,
    }
  } catch (err) {
    return { error: 'Error de conexión con Supabase: ' + (err.message || err) }
  }
}

export async function deleteHeroMedia(url) {
  if (!supabase || !url) return
  try {
    const parts = url.split('/hero-videos/')
    if (parts.length > 1) {
      const filename = decodeURIComponent(parts[1].split('?')[0])
      if (filename) {
        await supabase.storage.from('hero-videos').remove([filename])
      }
    }
  } catch (err) {
    console.warn('Error al eliminar media anterior en Supabase Storage:', err)
  }
}

export async function deductOrderStock(orderId) {
  if (!supabase || !orderId) return
  try {
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, qty')
      .eq('order_id', orderId)
    if (!items || !items.length) return

    for (const it of items) {
      if (!it.product_id || !it.qty) continue
      const { data: prod } = await supabase
        .from('products')
        .select('stock')
        .eq('id', it.product_id)
        .maybeSingle()
      if (prod) {
        const currentStock = Number(prod.stock) || 0
        const newStock = Math.max(0, currentStock - Number(it.qty))
        await supabase.from('products').update({ stock: newStock }).eq('id', it.product_id)
      }
    }
  } catch (err) {
    console.warn('Error al descontar stock de orden:', err)
  }
}

export async function restoreOrderStock(orderId) {
  if (!supabase || !orderId) return
  try {
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id, qty')
      .eq('order_id', orderId)
    if (!items || !items.length) return

    for (const it of items) {
      if (!it.product_id || !it.qty) continue
      const { data: prod } = await supabase
        .from('products')
        .select('stock')
        .eq('id', it.product_id)
        .maybeSingle()
      if (prod) {
        const currentStock = Number(prod.stock) || 0
        const newStock = currentStock + Number(it.qty)
        await supabase.from('products').update({ stock: newStock }).eq('id', it.product_id)
      }
    }
  } catch (err) {
    console.warn('Error al restaurar stock de orden:', err)
  }
}

export async function updateOrderStatus(id, status, oldStatus = null) {
  if (!supabase) return { error: 'Supabase no configurado' }
  const res = await supabase.from('orders').update({ status }).eq('id', id).select().single()
  if (res.error) return res

  const isNowConfirmed = ['pagado', 'enviado', 'entregado'].includes(status)
  const wasConfirmed = ['pagado', 'enviado', 'entregado'].includes(oldStatus)

  if (isNowConfirmed && !wasConfirmed) {
    await deductOrderStock(id)
  } else if (!isNowConfirmed && wasConfirmed && status === 'cancelado') {
    await restoreOrderStock(id)
  }

  return res
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

  // Si se crea directamente como pagado/confirmado (ej. venta manual en admin)
  if (['pagado', 'enviado', 'entregado'].includes(order.status)) {
    await deductOrderStock(data.id)
  }

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

// -----------------------------------------------------------------------------
// GESTIÓN DE USUARIOS (ADMIN)
// -----------------------------------------------------------------------------

export async function listUsers() {
  if (!supabase) return { data: [], error: 'Supabase no configurado' }

  // 1. Intentar llamar a la función RPC admin_get_users (incluye auth.users + profiles)
  const { data: rpcData, error: rpcError } = await supabase.rpc('admin_get_users')
  if (!rpcError && Array.isArray(rpcData)) {
    return { data: rpcData, source: 'rpc' }
  }

  // 2. Fallback: consultar la tabla profiles directamente
  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (profilesError) {
    return { data: [], error: profilesError.message || rpcError?.message }
  }

  // Mapear campos consistentes
  const formatted = (profilesData || []).map((p) => ({
    id: p.id,
    email: p.email || '—',
    name: p.name || '',
    lastname: p.lastname || '',
    phone: p.phone || '',
    role: p.role || 'customer',
    created_at: p.created_at,
    last_sign_in_at: null,
  }))

  return { data: formatted, source: 'profiles_fallback', rpcWarning: !!rpcError }
}

export async function updateUserRole(userId, role) {
  if (!supabase) return { error: 'Supabase no configurado' }

  // 1. Intentar con RPC
  const { error: rpcError } = await supabase.rpc('admin_set_user_role', {
    target_user_id: userId,
    new_role: role,
  })

  if (!rpcError) return { success: true }

  // 2. Fallback: actualización directa en tabla profiles
  const { error: directError } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (directError) return { error: directError.message || rpcError?.message }
  return { success: true }
}

export async function adminChangePassword(userId, newPassword) {
  if (!supabase) return { error: 'Supabase no configurado' }
  if (!newPassword || newPassword.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const { error } = await supabase.rpc('admin_update_user_password', {
    target_user_id: userId,
    new_password: newPassword,
  })

  if (error) {
    return { error: error.message || 'No se pudo actualizar la contraseña. Asegúrate de ejecutar el script SQL en Supabase.' }
  }
  return { success: true }
}

export async function sendPasswordResetEmail(email) {
  if (!supabase) return { error: 'Supabase no configurado' }
  if (!email || !email.includes('@')) {
    return { error: 'Email inválido' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateUserProfile(userId, patch) {
  if (!supabase) return { error: 'Supabase no configurado' }
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) return { error: error.message }
  return { success: true }
}

