import { useEffect, useState } from 'react'
import { api } from './api.js'

const STAFF = ['ADMINISTRADOR', 'MESERO', 'COCINERO', 'CAJERO']
// Qué pestañas ve cada rol (igual que la matriz de SecurityConfig del back)
const SECCIONES = [
  { id: 'menu', titulo: 'Menú', roles: null },
  { id: 'platos', titulo: 'Platos', roles: ['ADMINISTRADOR'] },
  { id: 'mesas', titulo: 'Mesas', roles: STAFF },
  { id: 'pedidos', titulo: 'Pedidos', roles: STAFF },
  { id: 'cuentas', titulo: 'Cuentas', roles: ['ADMINISTRADOR', 'MESERO', 'CAJERO'] },
  { id: 'reservas', titulo: 'Reservas', roles: ['ADMINISTRADOR', 'MESERO', 'CAJERO', 'CLIENTE'] },
  { id: 'eventos', titulo: 'Eventos (Mongo)', roles: STAFF },
  { id: 'usuarios', titulo: 'Usuarios', roles: ['ADMINISTRADOR'] },
]
const puede = (rol, roles) => !roles || roles.includes(rol)
const pesos = (n) => '$' + Number(n ?? 0).toLocaleString('es-CO')
const fecha = (f) => (f ? new Date(f).toLocaleString('es-CO') : '')

function leerSesion() {
  try { return JSON.parse(localStorage.getItem('sesion')) } catch { return null }
}

export default function App() {
  const [sesion, setSesion] = useState(leerSesion)
  const [seccion, setSeccion] = useState('menu')
  const [aviso, setAviso] = useState(null)

  const guardarSesion = (s) => {
    setSesion(s)
    try { s ? localStorage.setItem('sesion', JSON.stringify(s)) : localStorage.removeItem('sesion') } catch { /* sin storage */ }
  }
  // Ejecuta una acción contra el back y muestra el resultado (éxito o el mensaje de error del back)
  const ejecutar = async (fn, ok) => {
    try {
      const r = await fn()
      if (ok) setAviso({ tipo: 'ok', texto: ok })
      return r
    } catch (e) {
      setAviso({ tipo: 'error', texto: e.message })
      if (e.message.startsWith('401')) guardarSesion(null)
    }
  }
  useEffect(() => { if (aviso) { const t = setTimeout(() => setAviso(null), 2500); return () => clearTimeout(t) } }, [aviso])

  const ctx = { token: sesion?.token, rol: sesion?.rol, ejecutar }
  const visibles = SECCIONES.filter((s) => s.id === 'menu' || (sesion && puede(sesion.rol, s.roles)))

  return (
    <>
      <header>
        <h1>🍔 American Bites</h1>
        {sesion ? (
          <div className="usuario">
            <span>{sesion.email} · <b>{sesion.rol}</b></span>
            <button className="sec" onClick={() => { guardarSesion(null); setSeccion('menu') }}>Salir</button>
          </div>
        ) : (
          <button onClick={() => setSeccion('login')}>Iniciar sesión</button>
        )}
      </header>
      <nav>
        {visibles.map((s) => (
          <button key={s.id} className={seccion === s.id ? 'activo' : ''} onClick={() => setSeccion(s.id)}>{s.titulo}</button>
        ))}
      </nav>
      {aviso && <div className={`aviso ${aviso.tipo}`} role="status">{aviso.texto}</div>}
      <main>
        {seccion === 'login' && !sesion && <Login ejecutar={ejecutar} alEntrar={(s) => { guardarSesion(s); setSeccion('menu') }} />}
        {seccion === 'menu' && <Menu {...ctx} />}
        {sesion && seccion === 'platos' && <Platos {...ctx} />}
        {sesion && seccion === 'mesas' && <Mesas {...ctx} />}
        {sesion && seccion === 'pedidos' && <Pedidos {...ctx} />}
        {sesion && seccion === 'cuentas' && <Cuentas {...ctx} />}
        {sesion && seccion === 'reservas' && <Reservas {...ctx} />}
        {sesion && seccion === 'eventos' && <Eventos {...ctx} />}
        {sesion && seccion === 'usuarios' && <Usuarios {...ctx} />}
      </main>
    </>
  )
}

// Carga una lista del back y permite recargarla
function useLista(path, { token, ejecutar }) {
  const [datos, setDatos] = useState([])
  const recargar = async () => {
    if (!path) return
    const r = await ejecutar(() => api(path, { token }))
    if (r) setDatos(r)
  }
  useEffect(() => { recargar() }, [path, token])
  return [datos, recargar]
}

function Login({ ejecutar, alEntrar }) {
  const [modo, setModo] = useState('login')
  const [f, setF] = useState({ nombre: '', email: '', password: '' })
  const cambiar = (e) => setF({ ...f, [e.target.name]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    if (modo === 'registro') {
      const ok = await ejecutar(() => api('/auth/registro', { method: 'POST', body: f }), 'Cuenta creada')
      if (!ok) return
    }
    const r = await ejecutar(() => api('/auth/login', { method: 'POST', body: { email: f.email, password: f.password } }), 'Bienvenido')
    if (r) alEntrar({ token: r.token, email: r.email, rol: r.rol })
  }

  return (
    <form className="tarjeta login" onSubmit={enviar}>
      <h2>{modo === 'login' ? 'Iniciar sesión' : 'Crear cuenta de cliente'}</h2>
      {modo === 'registro' && <label>Nombre<input name="nombre" value={f.nombre} onChange={cambiar} required /></label>}
      <label>Email<input name="email" type="email" value={f.email} onChange={cambiar} required /></label>
      <label>Contraseña<input name="password" type="password" value={f.password} onChange={cambiar} required minLength={6} /></label>
      <button type="submit">{modo === 'login' ? 'Entrar' : 'Registrarme'}</button>
      <button type="button" className="link" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? '¿No tienes cuenta? Regístrate' : 'Ya tengo cuenta'}
      </button>
    </form>
  )
}

function Menu(ctx) {
  const [platos] = useLista('/menu', ctx)
  const [cat, setCat] = useState('TODAS')
  const categorias = ['TODAS', ...new Set(platos.map((p) => p.categoria))]
  const lista = cat === 'TODAS' ? platos : platos.filter((p) => p.categoria === cat)
  return (
    <section>
      <h2>Menú del día</h2>
      <div className="chips">
        {categorias.map((c) => <button key={c} className={c === cat ? 'activo' : 'sec'} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      <div className="grid">
        {lista.map((p) => (
          <article key={p.id} className="tarjeta plato">
            <span className="etiqueta">{p.categoria}</span>
            <h3>{p.nombre}</h3>
            <p>{p.descripcion}</p>
            <strong>{pesos(p.precio)}</strong>
          </article>
        ))}
        {!lista.length && <p className="vacio">No hay platos disponibles.</p>}
      </div>
    </section>
  )
}

function Platos(ctx) {
  const { token, ejecutar } = ctx
  const [platos, recargar] = useLista('/platos', ctx)
  const vacio = { nombre: '', precio: '', categoria: '', descripcion: '' }
  const [f, setF] = useState(vacio)
  const crear = async (e) => {
    e.preventDefault()
    const ok = await ejecutar(() => api('/platos', { method: 'POST', token, body: { ...f, precio: Number(f.precio) } }), 'Plato creado')
    if (ok) { setF(vacio); recargar() }
  }
  const accion = async (fn, msg) => { if (await ejecutar(fn, msg) !== undefined) recargar() }
  return (
    <section>
      <h2>Gestión de platos</h2>
      <form className="tarjeta fila" onSubmit={crear}>
        <input placeholder="Nombre" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required />
        <input placeholder="Precio" type="number" min="1" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} required />
        <input placeholder="Categoría" value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value.toUpperCase() })} required />
        <input placeholder="Descripción" value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} />
        <button type="submit">Crear plato</button>
      </form>
      <table>
        <thead><tr><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Disponible</th><th></th></tr></thead>
        <tbody>
          {platos.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td><td>{p.categoria}</td><td>{pesos(p.precio)}</td>
              <td><span className={`estado ${p.disponible ? 'DISPONIBLE' : 'OCUPADA'}`}>{p.disponible ? 'Sí' : 'No'}</span></td>
              <td className="acciones">
                <button className="sec" onClick={() => accion(() => api(`/platos/${p.id}/disponible?disponible=${!p.disponible}`, { method: 'PATCH', token }), 'Disponibilidad actualizada')}>
                  {p.disponible ? 'Desactivar' : 'Activar'}
                </button>
                <button className="peligro" onClick={() => accion(() => api(`/platos/${p.id}`, { method: 'DELETE', token }), 'Plato eliminado')}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Mesas(ctx) {
  const { token, rol, ejecutar } = ctx
  const [mesas, recargar] = useLista('/mesas', ctx)
  const [f, setF] = useState({ numero: '', capacidad: '' })
  const esAdmin = rol === 'ADMINISTRADOR'
  const accion = async (fn, msg) => { if (await ejecutar(fn, msg) !== undefined) recargar() }
  return (
    <section>
      <h2>Mesas</h2>
      {esAdmin && (
        <form className="tarjeta fila" onSubmit={(e) => { e.preventDefault(); accion(() => api('/mesas', { method: 'POST', token, body: { numero: +f.numero, capacidad: +f.capacidad } }), 'Mesa creada'); setF({ numero: '', capacidad: '' }) }}>
          <input placeholder="Número" type="number" min="1" value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} required />
          <input placeholder="Capacidad" type="number" min="1" value={f.capacidad} onChange={(e) => setF({ ...f, capacidad: e.target.value })} required />
          <button type="submit">Crear mesa</button>
        </form>
      )}
      <div className="grid">
        {mesas.map((m) => (
          <article key={m.id} className="tarjeta">
            <h3>Mesa {m.numero}</h3>
            <p>Id {m.id} · {m.capacidad} personas {m.cuentaAbierta && '· cuenta abierta'}</p>
            <span className={`estado ${m.estado}`}>{m.estado}</span>
            {['ADMINISTRADOR', 'MESERO'].includes(rol) && (
              <div className="acciones">
                <select aria-label={`Estado mesa ${m.numero}`} value={m.estado} onChange={(e) => accion(() => api(`/mesas/${m.id}/estado?nuevoEstado=${e.target.value}`, { method: 'PATCH', token }), 'Estado actualizado')}>
                  {['DISPONIBLE', 'OCUPADA', 'RESERVADA'].map((s) => <option key={s}>{s}</option>)}
                </select>
                {esAdmin && <button className="peligro" onClick={() => accion(() => api(`/mesas/${m.id}`, { method: 'DELETE', token }), 'Mesa eliminada')}>Eliminar</button>}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

const SIGUIENTE = { RECIBIDO: 'EN_PREPARACION', EN_PREPARACION: 'LISTO', LISTO: 'ENTREGADO' }

function Pedidos(ctx) {
  const { token, rol, ejecutar } = ctx
  const [pedidos, recargar] = useLista('/pedidos', ctx)
  const [mesas] = useLista('/mesas', ctx)
  const [platos] = useLista('/platos/disponibles', ctx)
  const [idMesa, setIdMesa] = useState('')
  const [items, setItems] = useState([])
  const [linea, setLinea] = useState({ idPlato: '', cantidad: 1 })
  const tomaPedidos = ['ADMINISTRADOR', 'MESERO'].includes(rol)
  const cambiaEstado = rol !== 'CAJERO'
  const nombrePlato = (id) => platos.find((p) => p.id === +id)?.nombre

  const crear = async (e) => {
    e.preventDefault()
    const ok = await ejecutar(() => api('/pedidos', { method: 'POST', token, body: { idMesa: +idMesa, items } }), 'Pedido enviado a cocina')
    if (ok) { setItems([]); recargar() }
  }
  const estado = async (id, nuevo) => {
    if (await ejecutar(() => api(`/pedidos/${id}/estado`, { method: 'PATCH', token, body: { estado: nuevo } }), `Pedido ${nuevo}`)) recargar()
  }
  return (
    <section>
      <h2>Pedidos</h2>
      {tomaPedidos && (
        <form className="tarjeta" onSubmit={crear}>
          <h3>Nuevo pedido</h3>
          <div className="fila">
            <select aria-label="Mesa" value={idMesa} onChange={(e) => setIdMesa(e.target.value)} required>
              <option value="">Mesa…</option>
              {mesas.map((m) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
            </select>
            <select aria-label="Plato" value={linea.idPlato} onChange={(e) => setLinea({ ...linea, idPlato: e.target.value })}>
              <option value="">Plato…</option>
              {platos.map((p) => <option key={p.id} value={p.id}>{p.nombre} ({pesos(p.precio)})</option>)}
            </select>
            <input aria-label="Cantidad" type="number" min="1" value={linea.cantidad} onChange={(e) => setLinea({ ...linea, cantidad: e.target.value })} />
            <button type="button" className="sec" disabled={!linea.idPlato} onClick={() => { setItems([...items, { idPlato: +linea.idPlato, cantidad: +linea.cantidad }]); setLinea({ idPlato: '', cantidad: 1 }) }}>Agregar</button>
          </div>
          <ul>{items.map((i, n) => <li key={n}>{i.cantidad} × {nombrePlato(i.idPlato)}</li>)}</ul>
          <button type="submit" disabled={!items.length}>Enviar pedido</button>
        </form>
      )}
      <div className="grid">
        {pedidos.map((p) => (
          <article key={p.id} className="tarjeta">
            <h3>Mesa {mesas.find((m) => m.id === p.idMesa)?.numero ?? p.idMesa}</h3>
            <span className={`estado ${p.estado}`}>{p.estado}</span>
            <ul>{p.items?.map((i) => <li key={i.id}>{i.cantidad} × {i.nombrePlato} — {pesos(i.subtotal)}</li>)}</ul>
            <strong>Total {pesos(p.total)}</strong>
            <small>{fecha(p.timestamp)}</small>
            {cambiaEstado && SIGUIENTE[p.estado] && (
              <div className="acciones">
                <button onClick={() => estado(p.id, SIGUIENTE[p.estado])}>→ {SIGUIENTE[p.estado]}</button>
                <button className="peligro" onClick={() => estado(p.id, 'CANCELADO')}>Cancelar</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

function Cuentas(ctx) {
  const { token, rol, ejecutar } = ctx
  const [cuentas, recargar] = useLista('/cuentas', ctx)
  const [mesas] = useLista('/mesas', ctx)
  const [idMesa, setIdMesa] = useState('')
  const cobra = ['ADMINISTRADOR', 'CAJERO'].includes(rol)
  const accion = async (fn, msg) => { if (await ejecutar(fn, msg)) recargar() }
  return (
    <section>
      <h2>Cuentas</h2>
      {['ADMINISTRADOR', 'MESERO'].includes(rol) && (
        <form className="tarjeta fila" onSubmit={(e) => { e.preventDefault(); accion(() => api('/cuentas', { method: 'POST', token, body: { idMesa: +idMesa } }), 'Cuenta abierta') }}>
          <select aria-label="Mesa" value={idMesa} onChange={(e) => setIdMesa(e.target.value)} required>
            <option value="">Mesa…</option>
            {mesas.map((m) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
          </select>
          <button type="submit">Abrir cuenta</button>
        </form>
      )}
      <table>
        <thead><tr><th>#</th><th>Mesa</th><th>Total</th><th>Estado</th><th>Apertura</th><th></th></tr></thead>
        <tbody>
          {cuentas.map((c) => (
            <tr key={c.id}>
              <td>{c.id}</td><td>{mesas.find((m) => m.id === c.idMesa)?.numero ?? c.idMesa}</td><td>{pesos(c.total)}</td>
              <td><span className={`estado ${c.estado}`}>{c.estado}</span></td><td>{fecha(c.fechaApertura)}</td>
              <td className="acciones">
                {cobra && c.estado === 'ABIERTA' && <button onClick={() => accion(() => api(`/cuentas/${c.id}/pago`, { method: 'PATCH', token }), 'Pago registrado')}>Registrar pago</button>}
                {cobra && c.estado === 'EN_PAGO' && <button onClick={() => accion(() => api(`/cuentas/${c.id}/cerrar`, { method: 'PATCH', token }), 'Cuenta cerrada')}>Cerrar</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Reservas(ctx) {
  const { token, rol, ejecutar } = ctx
  const esCliente = rol === 'CLIENTE'
  // El cliente no puede listar todas las reservas (403), solo ve las que crea en esta sesión
  const [todas, recargar] = useLista(esCliente ? null : '/reservas', ctx)
  const [mias, setMias] = useState([])
  const vacio = { idMesa: '', cliente: '', fechaHora: '', comensales: 2 }
  const [f, setF] = useState(vacio)
  const lista = esCliente ? mias : todas

  const crear = async (e) => {
    e.preventDefault()
    const body = { ...f, idMesa: +f.idMesa, comensales: +f.comensales, fechaHora: f.fechaHora + ':00' }
    const r = await ejecutar(() => api('/reservas', { method: 'POST', token, body }), 'Reserva creada')
    if (r) { setF(vacio); esCliente ? setMias([r, ...mias]) : recargar() }
  }
  const cancelar = async (id) => {
    const r = await ejecutar(() => api(`/reservas/${id}/cancelar`, { method: 'PATCH', token }), 'Reserva cancelada')
    if (r) esCliente ? setMias(mias.map((m) => (m.id === id ? r : m))) : recargar()
  }
  return (
    <section>
      <h2>Reservas</h2>
      {rol !== 'CAJERO' && (
        <form className="tarjeta fila" onSubmit={crear}>
          <input placeholder="Id de mesa" type="number" min="1" value={f.idMesa} onChange={(e) => setF({ ...f, idMesa: e.target.value })} required />
          <input placeholder="Nombre del cliente" value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} required />
          <input aria-label="Fecha y hora" type="datetime-local" value={f.fechaHora} onChange={(e) => setF({ ...f, fechaHora: e.target.value })} required />
          <input aria-label="Comensales" type="number" min="1" value={f.comensales} onChange={(e) => setF({ ...f, comensales: e.target.value })} required />
          <button type="submit">Reservar</button>
        </form>
      )}
      <table>
        <thead><tr><th>Cliente</th><th>Mesa</th><th>Fecha</th><th>Comensales</th><th>Vigente</th><th></th></tr></thead>
        <tbody>
          {lista.map((r) => (
            <tr key={r.id}>
              <td>{r.cliente}</td><td>{r.idMesa}</td><td>{fecha(r.fechaHora)}</td><td>{r.comensales}</td>
              <td><span className={`estado ${r.vigente ? 'DISPONIBLE' : 'OCUPADA'}`}>{r.vigente ? 'Sí' : 'Cancelada'}</span></td>
              <td>{r.vigente && rol !== 'CAJERO' && <button className="peligro" onClick={() => cancelar(r.id)}>Cancelar</button>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!lista.length && <p className="vacio">No hay reservas.</p>}
    </section>
  )
}

function Eventos(ctx) {
  const [eventos, recargar] = useLista('/eventos', ctx)
  return (
    <section>
      <h2>Historial de eventos de pedidos <small>(MongoDB)</small> <button className="sec" onClick={recargar}>Actualizar</button></h2>
      <table>
        <thead><tr><th>Fecha</th><th>Tipo</th><th>Mesa</th><th>Antes</th><th>Después</th></tr></thead>
        <tbody>
          {[...eventos].reverse().map((e) => (
            <tr key={e.id}><td>{fecha(e.timestamp)}</td><td>{e.tipo}</td><td>{e.idMesa}</td><td>{e.estadoAnterior}</td><td>{e.estadoNuevo}</td></tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}

function Usuarios(ctx) {
  const [usuarios] = useLista('/usuarios', ctx)
  return (
    <section>
      <h2>Usuarios</h2>
      <table>
        <thead><tr><th>Nombre</th><th>Email</th><th>Rol</th><th>Creado</th></tr></thead>
        <tbody>{usuarios.map((u) => <tr key={u.id}><td>{u.nombre}</td><td>{u.email}</td><td>{u.rol}</td><td>{fecha(u.fechaCreacion)}</td></tr>)}</tbody>
      </table>
    </section>
  )
}
