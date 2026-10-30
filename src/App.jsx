import { useEffect, useState } from 'react'
import { Gauge, Heart, LogOut, ShoppingCart, User, Users } from 'lucide-react'
import { api } from './api.js'
import { NOMBRE_ROL, guardar, leer } from './marca.js'
import Inicio from './pantallas/Inicio.jsx'
import Carta from './pantallas/Carta.jsx'
import MiPedido from './pantallas/MiPedido.jsx'
import Seguimiento from './pantallas/Seguimiento.jsx'
import Cocina from './pantallas/Cocina.jsx'
import { Cuentas, Historial, Mesas, Platos, Reservas, Usuarios } from './pantallas/Personal.jsx'

const TITULOS = {
  inicio: 'Inicio', carta: 'Carta', pedido: 'Mi pedido', cocina: 'Pedidos', mesas: 'Mesas', cuentas: 'Cuentas',
  reservas: 'Reservas', platos: 'Platos', usuarios: 'Usuarios', historial: 'Historial',
}
// Qué ve cada rol (la API vuelve a validar todo con JWT: esto solo ordena la navegación)
const NAV = {
  ANONIMO: ['inicio', 'carta', 'pedido'],
  CLIENTE: ['carta', 'pedido', 'reservas'],
  MESERO: ['carta', 'pedido', 'cocina', 'mesas', 'cuentas', 'reservas'],
  COCINERO: ['cocina', 'carta', 'historial'],
  CAJERO: ['cuentas', 'cocina', 'mesas', 'reservas', 'historial'],
  ADMINISTRADOR: ['carta', 'pedido', 'cocina', 'mesas', 'cuentas', 'reservas', 'platos', 'usuarios', 'historial'],
}
const PIDEN = ['ANONIMO', 'CLIENTE', 'MESERO', 'ADMINISTRADOR']

export default function App() {
  const [sesion, setSesion] = useState(() => leer('sesion', null))
  const rol = sesion?.rol || 'ANONIMO'
  const [vista, setVista] = useState(() => location.hash.slice(1) || NAV[rol][0])
  const [carrito, setCarrito] = useState(() => leer('carrito', []))
  const [pedidoActivo, setPedidoActivo] = useState(() => leer('pedidoActivo', null))
  const [aviso, setAviso] = useState(null)

  useEffect(() => guardar('carrito', carrito), [carrito])
  useEffect(() => guardar('pedidoActivo', pedidoActivo), [pedidoActivo])
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), 2800)
    return () => clearTimeout(t)
  }, [aviso])
  useEffect(() => {
    if (location.hash.slice(1) !== vista) location.hash = vista
    window.scrollTo(0, 0)
  }, [vista])
  useEffect(() => {
    const alCambiar = () => setVista(location.hash.slice(1) || NAV[leer('sesion', null)?.rol || 'ANONIMO'][0])
    addEventListener('hashchange', alCambiar)
    return () => removeEventListener('hashchange', alCambiar)
  }, [])

  const ir = (v) => setVista(v)
  const avisar = (texto, tipo = 'ok') => setAviso({ texto, tipo, id: Date.now() })
  const cerrarSesion = () => {
    setSesion(null); guardar('sesion', null); setPedidoActivo(null); setVista('inicio')
  }
  // Ejecuta una llamada al back y muestra el resultado; con 401 se cierra la sesión
  const ejecutar = async (fn, ok) => {
    try {
      const r = await fn()
      if (ok) avisar(ok)
      return r
    } catch (e) {
      avisar(e.message, 'error')
      if (e.status === 401 && sesion) cerrarSesion()
    }
  }
  const entrar = async ({ token, email, rol: r }) => {
    const yo = await api('/auth/me', { token }).catch(() => null)
    const s = { token, email, rol: r, nombre: yo?.nombre || email }
    setSesion(s); guardar('sesion', s)
    setVista(carrito.length && PIDEN.includes(r) ? 'pedido' : NAV[r][0])
  }

  const agregar = (plato, delta = 1) => setCarrito((c) => {
    const actual = c.find((i) => i.plato.id === plato.id)
    if (!actual) return delta > 0 ? [...c, { plato, cantidad: delta }] : c
    return c.map((i) => (i.plato.id === plato.id ? { ...i, cantidad: i.cantidad + delta } : i)).filter((i) => i.cantidad > 0)
  })
  const quitar = (id) => setCarrito((c) => c.filter((i) => i.plato.id !== id))
  const unidades = carrito.reduce((n, i) => n + i.cantidad, 0)
  const puedePedir = PIDEN.includes(rol)

  const ctx = { token: sesion?.token, rol, sesion, ejecutar, avisar, ir }
  const pedidoCtx = { ...ctx, carrito, agregar, quitar, vaciar: () => setCarrito([]), puedePedir }
  const vistaValida = NAV[rol].includes(vista) || vista === 'seguimiento' ? vista : NAV[rol][0]
  const conPie = ['inicio', 'carta', 'pedido', 'seguimiento'].includes(vistaValida)

  return (
    <>
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className="barra">
        <div className="barra-in">
          <button className="logo" onClick={() => ir(NAV[rol][0])} aria-label="American Bites, ir al inicio">
            <img src="/img/logo.png" alt="" width="274" height="130" />
          </button>
          <nav aria-label="Principal">
            {NAV[rol].map((v) => (
              <button key={v} className={vistaValida === v ? 'activo' : ''} aria-current={vistaValida === v ? 'page' : undefined} onClick={() => ir(v)}>
                {TITULOS[v]}
              </button>
            ))}
          </nav>
          <div className="barra-der">
            {sesion ? (
              <div className="saludo">
                <span className="avatar" aria-hidden="true"><User size={20} /></span>
                <span className="saludo-txt"><b>Hola, {(sesion.nombre || sesion.email).split(' ')[0]}</b><small>{NOMBRE_ROL[rol]}</small></span>
                <button className="icono-btn" onClick={cerrarSesion} aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut size={18} /></button>
              </div>
            ) : (
              vistaValida !== 'inicio' && <button className="btn" onClick={() => ir('inicio')}>Iniciar sesión</button>
            )}
            {puedePedir && (
              <button className="carrito" onClick={() => ir('pedido')} aria-label={`Mi pedido: ${unidades} productos`}>
                <ShoppingCart size={26} />
                {unidades > 0 && <span className="badge" key={unidades}>{unidades}</span>}
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="contenido" className={`vista-${vistaValida}`}>
        {vistaValida === 'inicio' && <Inicio {...ctx} entrar={entrar} />}
        {vistaValida === 'carta' && <Carta {...pedidoCtx} />}
        {vistaValida === 'pedido' && <MiPedido {...pedidoCtx} pedidoActivo={pedidoActivo} alConfirmar={(p) => { setPedidoActivo(p); setCarrito([]); ir('seguimiento') }} />}
        {vistaValida === 'seguimiento' && <Seguimiento {...ctx} pedido={pedidoActivo} alActualizar={setPedidoActivo} />}
        {vistaValida === 'cocina' && <Cocina {...ctx} />}
        {vistaValida === 'mesas' && <Mesas {...ctx} />}
        {vistaValida === 'cuentas' && <Cuentas {...ctx} />}
        {vistaValida === 'reservas' && <Reservas {...ctx} />}
        {vistaValida === 'platos' && <Platos {...ctx} />}
        {vistaValida === 'usuarios' && <Usuarios {...ctx} />}
        {vistaValida === 'historial' && <Historial {...ctx} />}
      </main>

      {conPie && (
        <footer className="pie">
          <div className="pie-in">
            <div className="pie-rasgo"><Gauge size={44} strokeWidth={1.6} /><p><b>Pedido en tiempo real</b>Sabemos que tu tiempo vale.</p></div>
            <div className="pie-rasgo"><Heart size={44} strokeWidth={1.6} /><p><b>Comida que conecta</b>Good Food Good People.</p></div>
            <div className="pie-rasgo"><Users size={44} strokeWidth={1.6} /><p><b>Experiencias memorables</b>Más que comida, son momentos.</p></div>
            <p className="script pie-firma">American Bites<br />Always a Good Idea</p>
          </div>
        </footer>
      )}

      {aviso && <div key={aviso.id} className={`aviso ${aviso.tipo}`} role={aviso.tipo === 'error' ? 'alert' : 'status'}>{aviso.texto}</div>}
    </>
  )
}
