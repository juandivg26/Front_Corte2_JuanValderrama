import { useEffect } from 'react'
import { ArrowRight, Check, ChefHat, ClipboardList, BellRing, Utensils, CircleX } from 'lucide-react'
import { Foto, useApi } from '../componentes.jsx'
import { codigoPedido, hora, pesos } from '../marca.js'

const PASOS = [
  { estado: 'RECIBIDO', titulo: 'Pedido confirmado', Icono: Check },
  { estado: 'EN_PREPARACION', titulo: 'En preparación', Icono: ChefHat },
  { estado: 'LISTO', titulo: 'Listo', Icono: BellRing },
  { estado: 'ENTREGADO', titulo: 'En tu mesa', Icono: Utensils },
]

// El estado se consulta al back cada 4 s: lo que se ve es lo que la cocina marcó
export default function Seguimiento(ctx) {
  const { pedido: guardado, alActualizar, ir } = ctx
  const [vivo] = useApi(guardado ? `/pedidos/${guardado.id}` : null, ctx, 4000)
  useEffect(() => { if (vivo) alActualizar({ ...guardado, ...vivo }) }, [vivo])
  if (!guardado) {
    return (
      <section className="pedido-vacio">
        <h2>No tienes un pedido en curso</h2>
        <button className="btn" onClick={() => ir('carta')}>Ver la carta <ArrowRight size={18} /></button>
      </section>
    )
  }
  const pedido = { ...guardado, ...vivo }
  const cancelado = pedido.estado === 'CANCELADO'
  const paso = PASOS.findIndex((p) => p.estado === pedido.estado)

  return (
    <div className="seguimiento">
      <div className="seguimiento-main">
        <section className="confirmado">
          <div>
            <p className="confirmado-pre">{cancelado ? 'Lo sentimos' : '¡Listo!'}</p>
            <h1 className="display confirmado-titulo">{cancelado ? 'Tu pedido fue cancelado' : 'Tu pedido ha sido confirmado'}</h1>
            <p>{cancelado ? 'Habla con tu mesero para ayudarte con un nuevo pedido.' : 'Gracias por elegir American Bites. La buena comida siempre sabe mejor en compañía.'}</p>
          </div>
          <img src="/img/mascota.png" alt="" width="335" height="230" />
        </section>

        <section className="datos-pedido">
          <div><ClipboardList size={44} strokeWidth={1.5} aria-hidden="true" /><p>Número de pedido<strong>{codigoPedido(pedido.id)}</strong><small>Recibido a las {hora(pedido.timestamp)}</small></p></div>
          <div><Utensils size={44} strokeWidth={1.5} aria-hidden="true" /><p>Tu mesa<strong>Mesa {pedido.numeroMesa ?? pedido.idMesa}</strong><small>Te lo llevamos apenas esté listo.</small></p></div>
        </section>

        <section className="progreso" aria-label="Estado del pedido">
          {cancelado ? (
            <p className="progreso-cancelado"><CircleX size={22} aria-hidden="true" />Pedido cancelado</p>
          ) : (
            <ol>
              {PASOS.map(({ estado, titulo, Icono }, i) => (
                <li key={estado} className={i < paso ? 'hecho' : i === paso ? 'actual' : ''} aria-current={i === paso ? 'step' : undefined}>
                  <span className="paso-icono"><Icono size={24} aria-hidden="true" /></span>
                  <b>{titulo}</b>
                  <small>{i < paso ? 'Hecho' : i === paso ? 'Ahora' : 'Próximamente'}</small>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mientras">
          <img src="/img/hero-papas.jpg" alt="" width="496" height="220" loading="lazy" />
          <div>
            <p>Mientras esperas…</p>
            <h2 className="display">La vida es mejor con papas</h2>
            <button className="btn btn-claro" onClick={() => ir('carta')}>Explora más productos <ArrowRight size={18} /></button>
          </div>
          <p className="script" aria-hidden="true">Same Burgers<br />Higher Vibes</p>
        </section>
      </div>

      <aside className="resumen">
        <h2 className="h-sub">Resumen de tu pedido</h2>
        <ul className="resumen-items">
          {pedido.items?.map((i) => (
            <li key={i.id}>
              <Foto nombre={i.nombrePlato} className="linea-foto" />
              <span><b>{i.nombrePlato}</b>{i.cantidad} × {pesos(i.precioCongelado)}</span>
            </li>
          ))}
        </ul>
        <dl><div><dt>Subtotal</dt><dd>{pesos(pedido.total)}</dd></div><div><dt>Descuentos</dt><dd>{pesos(0)}</dd></div></dl>
        <div className="total"><span>Total</span><strong>{pesos(pedido.total)}</strong></div>
        <button className="btn btn-grande btn-bloque" onClick={() => ir('carta')}>Volver a la carta <ArrowRight size={20} /></button>
        <p className="gracias">Gracias por ser parte de una comunidad que valora la buena comida y las buenas personas. <b>American Bites · Good Food Good People.</b></p>
      </aside>
    </div>
  )
}
