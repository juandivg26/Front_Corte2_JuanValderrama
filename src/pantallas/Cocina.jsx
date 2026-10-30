import { useEffect, useState } from 'react'
import { ChefHat, CircleCheck, Clock, ClipboardList, Send, CheckCheck, X } from 'lucide-react'
import { api } from '../api.js'
import { Foto, useApi } from '../componentes.jsx'
import { codigoPedido, hora, minutosDesde } from '../marca.js'

const COLUMNAS = [
  { estado: 'RECIBIDO', titulo: 'Nuevos', filtro: 'Nuevos', Icono: ClipboardList, accion: 'Iniciar preparación', siguiente: 'EN_PREPARACION', hecho: 'en preparación', AccionIcono: ChefHat },
  { estado: 'EN_PREPARACION', titulo: 'En preparación', filtro: 'En preparación', Icono: ChefHat, accion: 'Marcar como listo', siguiente: 'LISTO', hecho: 'listo', AccionIcono: CheckCheck },
  { estado: 'LISTO', titulo: 'Listos', filtro: 'Listos', Icono: CircleCheck, accion: 'Marcar como entregado', siguiente: 'ENTREGADO', hecho: 'entregado', AccionIcono: Send },
  { estado: 'ENTREGADO', titulo: 'Entregados', filtro: 'Entregados', Icono: CheckCheck },
]
const PUEDEN_MOVER = ['ADMINISTRADOR', 'MESERO', 'COCINERO']

// Tablero en tiempo real: se refresca cada 5 s desde GET /pedidos
export default function Cocina(ctx) {
  const { token, rol, ejecutar } = ctx
  const [pedidos, recargar] = useApi('/pedidos', ctx, 5000)
  const [mesas] = useApi('/mesas', ctx)
  const [filtro, setFiltro] = useState('TODOS')
  const [moviendo, setMoviendo] = useState(null)
  const lista = (pedidos || []).filter((p) => p.estado !== 'CANCELADO').sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  const numeroMesa = (id) => mesas?.find((m) => m.id === id)?.numero ?? id
  const puedeMover = PUEDEN_MOVER.includes(rol)

  const mover = async (p, estado, msg) => {
    setMoviendo(p.id)
    const ok = await ejecutar(() => api(`/pedidos/${p.id}/estado`, { method: 'PATCH', token, body: { estado } }), `${codigoPedido(p.id)}: ${msg}`)
    setMoviendo(null)
    if (ok) recargar()
  }
  const columnas = COLUMNAS.filter((c) => filtro === 'TODOS' || c.estado === filtro)

  return (
    <div className="tablero">
      <div className="tablero-cabeza">
        <div>
          <h1 className="h-pagina">Tablero de cocina</h1>
          <p>Gestiona los pedidos en tiempo real y mantén el ritmo.</p>
        </div>
        <p className="reloj"><Clock size={22} aria-hidden="true" /><Reloj /></p>
        <div className="filtros" role="group" aria-label="Filtrar por estado">
          <button className={filtro === 'TODOS' ? 'activo' : ''} aria-pressed={filtro === 'TODOS'} onClick={() => setFiltro('TODOS')}>Todos ({lista.length})</button>
          {COLUMNAS.map((c) => (
            <button key={c.estado} className={filtro === c.estado ? 'activo' : ''} aria-pressed={filtro === c.estado} onClick={() => setFiltro(c.estado)}>
              {c.filtro} ({lista.filter((p) => p.estado === c.estado).length})
            </button>
          ))}
        </div>
      </div>

      <div className={`columnas n-${columnas.length}`}>
        {columnas.map(({ estado, titulo, Icono, accion, siguiente, hecho, AccionIcono }) => {
          const enColumna = lista.filter((p) => p.estado === estado)
          return (
            <section key={estado} className={`columna c-${estado}`} aria-labelledby={`col-${estado}`}>
              <h2 id={`col-${estado}`}><Icono size={24} aria-hidden="true" />{titulo}<span className="contador">{enColumna.length}</span></h2>
              {enColumna.length === 0 && <p className="vacio">Sin pedidos aquí.</p>}
              {enColumna.map((p) => (
                <article key={p.id} className="ticket">
                  <header><b>{codigoPedido(p.id)}</b><span>Mesa {numeroMesa(p.idMesa)} · {hora(p.timestamp)}</span></header>
                  <ul>
                    {p.items.map((i) => (
                      <li key={i.id}><Foto nombre={i.nombrePlato} className="ticket-foto" />{i.nombrePlato}<span>x{i.cantidad}</span></li>
                    ))}
                  </ul>
                  {estado !== 'RECIBIDO' && estado !== 'ENTREGADO' && (
                    <p className="ticket-tiempo"><Clock size={16} aria-hidden="true" />Pedido hace {minutosDesde(p.timestamp)} min</p>
                  )}
                  {estado === 'ENTREGADO' && <p className="ticket-tiempo"><CircleCheck size={16} aria-hidden="true" />Entregado</p>}
                  {puedeMover && siguiente && (
                    <div className="ticket-acciones">
                      <button className={`btn btn-bloque ${estado === 'LISTO' ? 'btn-verde' : ''}`} disabled={moviendo === p.id} onClick={() => mover(p, siguiente, hecho)}>
                        <AccionIcono size={18} aria-hidden="true" />{accion}
                      </button>
                      {estado === 'RECIBIDO' && (
                        <button className="icono-btn peligro" disabled={moviendo === p.id} onClick={() => mover(p, 'CANCELADO', 'cancelado')} aria-label={`Cancelar ${codigoPedido(p.id)}`} title="Cancelar pedido"><X size={18} /></button>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </section>
          )
        })}
      </div>
    </div>
  )
}

function Reloj() {
  const [ahora, setAhora] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setAhora(new Date()), 30000); return () => clearInterval(t) }, [])
  return (
    <span><b>{ahora.toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })}</b>
      <small>{ahora.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</small></span>
  )
}
