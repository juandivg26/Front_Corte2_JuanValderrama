import { useState } from 'react'
import { CalendarPlus, Plus, RefreshCw, Trash2 } from 'lucide-react'
import { api } from '../api.js'
import { Cabecera, Estado, Foto, useApi } from '../componentes.jsx'
import { codigoPedido, fecha, infoCategoria, pesos } from '../marca.js'

const ADMIN = 'ADMINISTRADOR'

export function Mesas(ctx) {
  const { token, rol, ejecutar } = ctx
  const [mesas, recargar] = useApi('/mesas', ctx)
  const [f, setF] = useState({ numero: '', capacidad: '' })
  const accion = async (fn, msg) => { if ((await ejecutar(fn, msg)) !== undefined) recargar() }
  const crear = (e) => {
    e.preventDefault()
    accion(() => api('/mesas', { method: 'POST', token, body: { numero: +f.numero, capacidad: +f.capacidad } }), `Mesa ${f.numero} creada`)
    setF({ numero: '', capacidad: '' })
  }
  return (
    <div className="panel">
      <Cabecera titulo="Mesas" />
      {rol === ADMIN && (
        <form className="formulario" onSubmit={crear}>
          <label>Número<input type="number" min="1" value={f.numero} onChange={(e) => setF({ ...f, numero: e.target.value })} required /></label>
          <label>Capacidad<input type="number" min="1" value={f.capacidad} onChange={(e) => setF({ ...f, capacidad: e.target.value })} required /></label>
          <button className="btn"><Plus size={18} />Crear mesa</button>
        </form>
      )}
      <div className="mesas">
        {(mesas || []).sort((a, b) => a.numero - b.numero).map((m) => (
          <article key={m.id} className={`mesa-tarjeta m-${m.estado}`}>
            <h2>Mesa {m.numero}</h2>
            <p>{m.capacidad} personas{m.cuentaAbierta && ' · cuenta abierta'}</p>
            {['ADMINISTRADOR', 'MESERO'].includes(rol) ? (
              <label className="mesa-estado">
                <span className="sr-only">Estado de la mesa {m.numero}</span>
                <select value={m.estado} onChange={(e) => accion(() => api(`/mesas/${m.id}/estado?nuevoEstado=${e.target.value}`, { method: 'PATCH', token }), `Mesa ${m.numero}: ${e.target.value.toLowerCase()}`)}>
                  {['DISPONIBLE', 'OCUPADA', 'RESERVADA'].map((s) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
                </select>
              </label>
            ) : <Estado valor={m.estado} />}
            {rol === ADMIN && (
              <button className="icono-btn peligro mesa-borrar" onClick={() => confirm(`¿Eliminar la mesa ${m.numero}?`) && accion(() => api(`/mesas/${m.id}`, { method: 'DELETE', token }), `Mesa ${m.numero} eliminada`)} aria-label={`Eliminar mesa ${m.numero}`}><Trash2 size={18} /></button>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

export function Cuentas(ctx) {
  const { token, rol, ejecutar } = ctx
  const [cuentas, recargar] = useApi('/cuentas', ctx)
  const [mesas] = useApi('/mesas', ctx)
  const [idMesa, setIdMesa] = useState('')
  const cobra = [ADMIN, 'CAJERO'].includes(rol)
  const numero = (id) => mesas?.find((m) => m.id === id)?.numero ?? id
  const accion = async (fn, msg) => { if (await ejecutar(fn, msg)) recargar() }
  const lista = [...(cuentas || [])].sort((a, b) => b.id - a.id)
  return (
    <div className="panel">
      <Cabecera titulo="Cuentas" />
      {[ADMIN, 'MESERO'].includes(rol) && (
        <form className="formulario" onSubmit={(e) => { e.preventDefault(); accion(() => api('/cuentas', { method: 'POST', token, body: { idMesa: +idMesa } }), `Cuenta abierta para la mesa ${numero(+idMesa)}`) }}>
          <label>Mesa
            <select value={idMesa} onChange={(e) => setIdMesa(e.target.value)} required>
              <option value="">Elige una mesa</option>
              {(mesas || []).filter((m) => !m.cuentaAbierta).map((m) => <option key={m.id} value={m.id}>Mesa {m.numero}</option>)}
            </select>
          </label>
          <button className="btn"><Plus size={18} />Abrir cuenta</button>
        </form>
      )}
      <Tabla vacia={cuentas && !lista.length} mensaje="Todavía no hay cuentas abiertas.">
        <thead><tr><th>Cuenta</th><th>Mesa</th><th className="num">Total</th><th>Estado</th><th>Apertura</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>
          {lista.map((c) => (
            <tr key={c.id}>
              <td>#{c.id}</td><td>Mesa {numero(c.idMesa)}</td><td className="num">{pesos(c.total)}</td>
              <td><Estado valor={c.estado} /></td><td>{fecha(c.fechaApertura)}</td>
              <td className="acciones-fila">
                {cobra && c.estado === 'ABIERTA' && <button className="btn btn-sm" onClick={() => accion(() => api(`/cuentas/${c.id}/pago`, { method: 'PATCH', token }), `Pago registrado en la cuenta #${c.id}`)}>Registrar pago</button>}
                {cobra && c.estado === 'EN_PAGO' && <button className="btn btn-sm btn-verde" onClick={() => accion(() => api(`/cuentas/${c.id}/cerrar`, { method: 'PATCH', token }), `Cuenta #${c.id} cerrada`)}>Cerrar cuenta</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </div>
  )
}

export function Reservas(ctx) {
  const { token, rol, sesion, ejecutar } = ctx
  const esCliente = rol === 'CLIENTE'
  // El cliente no puede listar todas las reservas (403): ve las que crea en esta sesión
  const [todas, recargar] = useApi(esCliente ? null : '/reservas', ctx)
  const [mesas] = useApi(esCliente ? '/mesas/disponibles' : '/mesas', ctx)
  const [mias, setMias] = useState([])
  const vacio = { idMesa: '', cliente: esCliente ? sesion.nombre || '' : '', fechaHora: '', comensales: 2 }
  const [f, setF] = useState(vacio)
  const lista = esCliente ? mias : [...(todas || [])].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
  const numero = (id) => mesas?.find((m) => m.id === id)?.numero ?? id

  const crear = async (e) => {
    e.preventDefault()
    const body = { ...f, idMesa: +f.idMesa, comensales: +f.comensales, fechaHora: f.fechaHora + ':00' }
    const r = await ejecutar(() => api('/reservas', { method: 'POST', token, body }), `Reserva confirmada para la mesa ${numero(+f.idMesa)}`)
    if (r) { setF(vacio); esCliente ? setMias([r, ...mias]) : recargar() }
  }
  const cancelar = async (id) => {
    const r = await ejecutar(() => api(`/reservas/${id}/cancelar`, { method: 'PATCH', token }), 'Reserva cancelada')
    if (r) esCliente ? setMias(mias.map((m) => (m.id === id ? r : m))) : recargar()
  }
  return (
    <div className="panel">
      <Cabecera titulo={esCliente ? 'Reserva tu mesa' : 'Reservas'} />
      {rol !== 'CAJERO' && (
        <form className="formulario" onSubmit={crear}>
          <label>Mesa
            <select value={f.idMesa} onChange={(e) => setF({ ...f, idMesa: e.target.value })} required>
              <option value="">Elige una mesa</option>
              {(mesas || []).map((m) => <option key={m.id} value={m.id}>Mesa {m.numero} · {m.capacidad} personas</option>)}
            </select>
          </label>
          <label>A nombre de<input value={f.cliente} onChange={(e) => setF({ ...f, cliente: e.target.value })} required autoComplete="name" /></label>
          <label>Fecha y hora<input type="datetime-local" value={f.fechaHora} onChange={(e) => setF({ ...f, fechaHora: e.target.value })} required /></label>
          <label>Personas<input type="number" min="1" value={f.comensales} onChange={(e) => setF({ ...f, comensales: e.target.value })} required /></label>
          <button className="btn"><CalendarPlus size={18} />Reservar</button>
        </form>
      )}
      <Tabla vacia={!lista.length} mensaje={esCliente ? 'Aquí verás las reservas que hagas.' : 'No hay reservas.'}>
        <thead><tr><th>A nombre de</th><th>Mesa</th><th>Fecha</th><th className="num">Personas</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>
          {lista.map((r) => (
            <tr key={r.id}>
              <td>{r.cliente}</td><td>Mesa {numero(r.idMesa)}</td><td>{fecha(r.fechaHora)}</td><td className="num">{r.comensales}</td>
              <td><Estado valor={r.vigente ? 'VIGENTE' : 'CANCELADA'} texto={r.vigente ? 'vigente' : 'cancelada'} /></td>
              <td className="acciones-fila">{r.vigente && rol !== 'CAJERO' && <button className="btn btn-sm btn-borde" onClick={() => cancelar(r.id)}>Cancelar</button>}</td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </div>
  )
}

export function Platos(ctx) {
  const { token, ejecutar } = ctx
  const [platos, recargar] = useApi('/platos', ctx)
  const vacio = { nombre: '', precio: '', categoria: 'HAMBURGUESAS', descripcion: '' }
  const [f, setF] = useState(vacio)
  const accion = async (fn, msg) => { if ((await ejecutar(fn, msg)) !== undefined) recargar() }
  const crear = async (e) => {
    e.preventDefault()
    const ok = await ejecutar(() => api('/platos', { method: 'POST', token, body: { ...f, precio: Number(f.precio) } }), `${f.nombre} agregado a la carta`)
    if (ok) { setF(vacio); recargar() }
  }
  return (
    <div className="panel">
      <Cabecera titulo="Platos de la carta" />
      <form className="formulario" onSubmit={crear}>
        <label>Nombre<input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} required maxLength={100} /></label>
        <label>Precio<input type="number" min="1" value={f.precio} onChange={(e) => setF({ ...f, precio: e.target.value })} required /></label>
        <label>Categoría
          <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value })}>
            {['HAMBURGUESAS', 'ACOMPAÑAMIENTOS', 'BEBIDAS', 'POSTRES'].map((c) => <option key={c} value={c}>{infoCategoria(c).titulo}</option>)}
          </select>
        </label>
        <label className="ancho">Descripción<input value={f.descripcion} onChange={(e) => setF({ ...f, descripcion: e.target.value })} maxLength={255} /></label>
        <button className="btn"><Plus size={18} />Crear plato</button>
      </form>
      <Tabla vacia={platos && !platos.length} mensaje="La carta está vacía.">
        <thead><tr><th>Plato</th><th>Categoría</th><th className="num">Precio</th><th>En la carta</th><th><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>
          {(platos || []).map((p) => (
            <tr key={p.id} className={p.disponible ? '' : 'apagado'}>
              <td><span className="celda-plato"><Foto nombre={p.nombre} className="ticket-foto" />{p.nombre}</span></td>
              <td>{infoCategoria(p.categoria).titulo}</td><td className="num">{pesos(p.precio)}</td>
              <td>
                <label className="interruptor">
                  <input type="checkbox" checked={p.disponible} onChange={() => accion(() => api(`/platos/${p.id}/disponible?disponible=${!p.disponible}`, { method: 'PATCH', token }), `${p.nombre} ${p.disponible ? 'oculto de' : 'visible en'} la carta`)} />
                  <span>{p.disponible ? 'Disponible' : 'No disponible'}</span>
                </label>
              </td>
              <td className="acciones-fila"><button className="icono-btn peligro" onClick={() => confirm(`¿Eliminar ${p.nombre} de la carta?`) && accion(() => api(`/platos/${p.id}`, { method: 'DELETE', token }), `${p.nombre} eliminado`)} aria-label={`Eliminar ${p.nombre}`}><Trash2 size={18} /></button></td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </div>
  )
}

export function Usuarios(ctx) {
  const [usuarios] = useApi('/usuarios', ctx)
  return (
    <div className="panel">
      <Cabecera titulo="Usuarios" />
      <Tabla vacia={usuarios && !usuarios.length} mensaje="No hay usuarios.">
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Creado</th></tr></thead>
        <tbody>{(usuarios || []).map((u) => <tr key={u.id}><td>{u.nombre}</td><td>{u.email}</td><td><Estado valor={u.rol} /></td><td>{fecha(u.fechaCreacion)}</td></tr>)}</tbody>
      </Tabla>
    </div>
  )
}

export function Historial(ctx) {
  const [eventos, recargar] = useApi('/eventos', ctx)
  const lista = [...(eventos || [])].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  return (
    <div className="panel">
      <Cabecera titulo="Historial de pedidos">
        <span className="nota">Eventos guardados en MongoDB</span>
        <button className="btn btn-borde btn-sm" onClick={recargar}><RefreshCw size={16} />Actualizar</button>
      </Cabecera>
      <Tabla vacia={eventos && !lista.length} mensaje="Aún no hay movimientos.">
        <thead><tr><th>Fecha</th><th>Pedido</th><th>Mesa</th><th>Evento</th><th>Cambio</th></tr></thead>
        <tbody>
          {lista.map((e) => (
            <tr key={e.id}>
              <td>{fecha(e.timestamp)}</td><td>{codigoPedido(e.idPedido)}</td><td>{e.idMesa}</td><td>{e.tipo?.replaceAll('_', ' ').toLowerCase()}</td>
              <td>{e.estadoAnterior ? <><Estado valor={e.estadoAnterior} /> → <Estado valor={e.estadoNuevo} /></> : <Estado valor={e.estadoNuevo || 'RECIBIDO'} />}</td>
            </tr>
          ))}
        </tbody>
      </Tabla>
    </div>
  )
}

function Tabla({ vacia, mensaje, children }) {
  return (
    <div className="tabla">
      <table>{children}</table>
      {vacia && <p className="vacio">{mensaje}</p>}
    </div>
  )
}
