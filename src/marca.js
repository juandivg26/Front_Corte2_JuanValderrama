import { CupSoda, IceCreamCone, Package, Popcorn, Sandwich } from 'lucide-react'

// Fotos de producto (recortadas de los mockups de American Bites) por nombre de plato
const FOTOS = {
  'classic bite': 'classic-bite.jpg',
  'bacon deluxe': 'bacon-deluxe.jpg',
  'bbq bites': 'bbq-bites.jpg',
  'mushroom melt': 'mushroom-melt.jpg',
  'spicy crunch': 'spicy-crunch.jpg',
  'chicken bliss': 'chicken-bliss.jpg',
  'veggie style': 'veggie-style.jpg',
  'papas clasicas': 'papas-clasicas.jpg',
  'chicken bites': 'chicken-bites.jpg',
  'coca-cola': 'coca-cola.jpg',
  'shake de oreo': 'shake-oreo.jpg',
}
const normalizar = (t = '') => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
export const fotoDe = (nombre) => (FOTOS[normalizar(nombre)] ? `/img/${FOTOS[normalizar(nombre)]}` : null)

export const CATEGORIAS = {
  HAMBURGUESAS: { titulo: 'Hamburguesas', lema: 'Sabor real. Ingredientes de verdad.', Icono: Sandwich },
  ACOMPAÑAMIENTOS: { titulo: 'Papas y acompañamientos', lema: 'El compañero perfecto de tu burger.', Icono: Popcorn },
  BEBIDAS: { titulo: 'Bebidas', lema: 'Frías, cremosas y para compartir.', Icono: CupSoda },
  POSTRES: { titulo: 'Postres', lema: 'El final feliz.', Icono: IceCreamCone },
}
const ORDEN = Object.keys(CATEGORIAS)
export const infoCategoria = (c) => CATEGORIAS[c] || { titulo: c.charAt(0) + c.slice(1).toLowerCase(), lema: '', Icono: Package }
export const ordenarCategorias = (lista) =>
  [...lista].sort((a, b) => (ORDEN.indexOf(a) + 1 || 99) - (ORDEN.indexOf(b) + 1 || 99))

export const NOMBRE_ROL = { CLIENTE: 'Cliente', MESERO: 'Mesero', COCINERO: 'Cocina', CAJERO: 'Caja', ADMINISTRADOR: 'Administrador' }

export const pesos = (n) => '$' + Math.round(Number(n ?? 0)).toLocaleString('es-CO')
export const hora = (f) => (f ? new Date(f).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' }) : '')
export const fecha = (f) => (f ? new Date(f).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }) : '')
export const minutosDesde = (f) => Math.max(0, Math.round((Date.now() - new Date(f).getTime()) / 60000))
// Código corto y legible para el pedido (el id real es un UUID v7)
export const codigoPedido = (id = '') => '#AB-' + id.replace(/-/g, '').slice(-5).toUpperCase()

export const leer = (clave, defecto) => {
  try { return JSON.parse(localStorage.getItem(clave)) ?? defecto } catch { return defecto }
}
export const guardar = (clave, valor) => {
  try { valor == null ? localStorage.removeItem(clave) : localStorage.setItem(clave, JSON.stringify(valor)) } catch { /* sin storage */ }
}
