import { useState } from 'react'
import { ArrowRight, Lock, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { api } from '../api.js'
import { Cantidad, Foto, useApi } from '../componentes.jsx'
import { codigoPedido, pesos } from '../marca.js'

export default function MiPedido(ctx) {
  const { token, sesion, carrito, agregar, quitar, vaciar, ejecutar, ir, pedidoActivo, alConfirmar } = ctx
  const [menu] = useApi('/menu', ctx)
  const [mesas] = useApi(sesion ? '/mesas/disponibles' : null, ctx)
  const [idMesa, setIdMesa] = useState('')
  const [enviando, setEnviando] = useState(false)

  const subtotal = carrito.reduce((s, i) => s + i.plato.precio * i.cantidad, 0)
  const enCarrito = new Set(carrito.map((i) => i.plato.id))
  // Sugerencias: acompañamientos y bebidas que todavía no están en el pedido
  const sugeridos = (menu || []).filter((p) => !enCarrito.has(p.id) && p.categoria !== 'HAMBURGUESAS').slice(0, 2)
  const complementos = (menu || []).filter((p) => ['Papas clásicas', 'Coca-Cola'].includes(p.nombre) && !enCarrito.has(p.id))

  const confirmar = async () => {
    setEnviando(true)
    const body = { idMesa: Number(idMesa), items: carrito.map((i) => ({ idPlato: i.plato.id, cantidad: i.cantidad })) }
    const pedido = await ejecutar(() => api('/pedidos', { method: 'POST', token, body }))
    setEnviando(false)
    if (pedido) alConfirmar({ ...pedido, numeroMesa: mesas?.find((m) => m.id === pedido.idMesa)?.numero })
  }

  return (
    <>
      <section className="banner banner-pedido">
        <div className="banner-txt">
          <h1 className="display banner-titulo">Tu pedido,<br />a tu estilo</h1>
          <p>Buenos momentos, mejores elecciones.</p>
        </div>
        <img className="banner-mascota" src="/img/mascota.png" alt="" width="335" height="230" />
        <img className="banner-foto" src="/img/hero-papas.jpg" alt="" width="496" height="220" fetchpriority="high" />
      </section>

      {carrito.length === 0 ? (
        <section className="pedido-vacio">
          <ShoppingBag size={48} strokeWidth={1.4} aria-hidden="true" />
          <h2>Tu pedido está vacío</h2>
          <p>Agrega tus favoritos desde la carta y aquí verás el resumen.</p>
          <div className="acciones">
            <button className="btn" onClick={() => ir('carta')}>Ver la carta <ArrowRight size={18} /></button>
            {pedidoActivo && <button className="btn btn-borde" onClick={() => ir('seguimiento')}>Seguir mi pedido {codigoPedido(pedidoActivo.id)}</button>}
          </div>
        </section>
      ) : (
        <div className="pedido">
          <section className="pedido-lista" aria-labelledby="t-pedido">
            <h2 id="t-pedido" className="h-seccion">Tu pedido</h2>
            <ul>
              {carrito.map(({ plato, cantidad }) => (
                <li key={plato.id} className="linea">
                  <Foto nombre={plato.nombre} className="linea-foto" />
                  <div className="linea-txt"><h3>{plato.nombre}</h3><p>{plato.descripcion}</p></div>
                  <Cantidad valor={cantidad} nombre={plato.nombre} onCambiar={(d) => agregar(plato, d)} />
                  <strong className="precio">{pesos(plato.precio * cantidad)}</strong>
                  <button className="icono-btn peligro" onClick={() => quitar(plato.id)} aria-label={`Quitar ${plato.nombre}`}><Trash2 size={20} /></button>
                </li>
              ))}
            </ul>
            <div className="pedido-lista-pie">
              <button className="btn btn-borde" onClick={() => ir('carta')}><Plus size={20} />Agregar más productos</button>
              <button className="enlace-peligro" onClick={() => confirm('¿Vaciar todo el pedido?') && vaciar()}><Trash2 size={18} />Vaciar pedido</button>
            </div>
          </section>

          <div className="pedido-centro">
            {sugeridos.length > 0 && (
              <section aria-labelledby="t-sug">
                <h2 id="t-sug" className="h-sub">También te puede gustar</h2>
                <div className="sugeridos">
                  {sugeridos.map((p) => (
                    <article key={p.id} className="producto compacto">
                      <Foto nombre={p.nombre} />
                      <div className="producto-cuerpo">
                        <h3>{p.nombre}</h3><p>{p.descripcion}</p>
                        <strong className="precio">{pesos(p.precio)}</strong>
                        <button className="btn btn-sm btn-bloque" onClick={() => agregar(p)}><Plus size={17} />Agregar</button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {complementos.length > 0 && (
              <button className="hazlo-combo" onClick={() => complementos.forEach((p) => agregar(p))}>
                <span className="script">Hazlo<br />Combo</span>
                <span className="hazlo-txt">Agrega {complementos.map((p) => p.nombre).join(' y ')} y arma tu combo</span>
                <img src="/img/combo.png" alt="" width="135" height="100" />
              </button>
            )}
          </div>

          <aside className="resumen" aria-labelledby="t-resumen">
            <h2 id="t-resumen" className="h-sub">Resumen del pedido</h2>
            <dl>
              <div><dt>Subtotal</dt><dd>{pesos(subtotal)}</dd></div>
              <div><dt>Descuentos</dt><dd>{pesos(0)}</dd></div>
            </dl>
            <div className="total"><span>Total</span><strong>{pesos(subtotal)}</strong></div>
            <p className="nota">Precios con impuestos incluidos.</p>
            {sesion ? (
              <>
                <label className="mesa">
                  <span>¿En qué mesa estás?</span>
                  <select value={idMesa} onChange={(e) => setIdMesa(e.target.value)} required>
                    <option value="">Elige tu mesa</option>
                    {(mesas || []).map((m) => <option key={m.id} value={m.id}>Mesa {m.numero} · {m.capacidad} personas</option>)}
                  </select>
                </label>
                {mesas && mesas.length === 0 && <p className="nota">No hay mesas libres en este momento. Pregúntale a un mesero.</p>}
                <button className="btn btn-grande btn-bloque" disabled={!idMesa || enviando} onClick={confirmar}>
                  {enviando ? 'Enviando a cocina…' : 'Confirmar pedido'} <ArrowRight size={20} />
                </button>
              </>
            ) : (
              <button className="btn btn-grande btn-bloque" onClick={() => ir('inicio')}>Inicia sesión para pedir <ArrowRight size={20} /></button>
            )}
            <p className="seguro"><Lock size={16} aria-hidden="true" />Tu pedido está seguro con nosotros.</p>
          </aside>
        </div>
      )}
    </>
  )
}
