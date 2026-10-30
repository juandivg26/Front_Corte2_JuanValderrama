import { useMemo, useState } from 'react'
import { ArrowRight, Plus, Search, X } from 'lucide-react'
import { Cantidad, Foto, useApi } from '../componentes.jsx'
import { infoCategoria, ordenarCategorias, pesos } from '../marca.js'

export default function Carta(ctx) {
  const { carrito, agregar, quitar, puedePedir, ir } = ctx
  const [menu] = useApi('/menu', ctx)
  const platos = menu || []
  const categorias = useMemo(() => ordenarCategorias([...new Set(platos.map((p) => p.categoria))]), [platos])
  const [elegida, setElegida] = useState(null)
  const [buscar, setBuscar] = useState('')
  const [orden, setOrden] = useState('carta')
  const categoria = elegida || categorias[0]

  const q = buscar.trim().toLowerCase()
  let lista = q
    ? platos.filter((p) => `${p.nombre} ${p.descripcion} ${p.categoria}`.toLowerCase().includes(q))
    : platos.filter((p) => p.categoria === categoria)
  if (orden === 'menor') lista = [...lista].sort((a, b) => a.precio - b.precio)
  if (orden === 'mayor') lista = [...lista].sort((a, b) => b.precio - a.precio)
  const info = categoria ? infoCategoria(categoria) : null
  const cantidadDe = (id) => carrito.find((i) => i.plato.id === id)?.cantidad || 0
  const subtotal = carrito.reduce((s, i) => s + i.plato.precio * i.cantidad, 0)

  return (
    <>
      <section className="banner banner-carta">
        <div className="banner-txt">
          <h1 className="display banner-titulo">Buenas historias<br />saben mejor</h1>
          <p>Explora nuestra carta y encuentra<br />tu próxima favorita.</p>
        </div>
        <img className="banner-foto" src="/img/hero-burger.jpg" alt="" width="620" height="232" fetchpriority="high" />
        <p className="script banner-script" aria-hidden="true">Good Food<br />Good People</p>
      </section>

      <div className={`carta ${puedePedir ? '' : 'sin-pedido'}`}>
        <aside className="categorias" aria-label="Categorías">
          <div className="categorias-lista">
            {categorias.map((c) => {
              const { titulo, Icono } = infoCategoria(c)
              const activa = !q && c === categoria
              return (
                <button key={c} className={activa ? 'activa' : ''} aria-pressed={activa} onClick={() => { setElegida(c); setBuscar('') }}>
                  <Icono size={24} strokeWidth={1.7} aria-hidden="true" />{titulo}
                </button>
              )
            })}
          </div>
          <img className="categorias-mascota" src="/img/mascota.png" alt="" width="335" height="230" loading="lazy" />
        </aside>

        <section className="productos" aria-labelledby="titulo-carta">
          <div className="herramientas">
            <label className="buscador">
              <Search size={20} aria-hidden="true" />
              <span className="sr-only">Buscar en la carta</span>
              <input type="search" placeholder="Buscar hamburguesas, papas, bebidas…" value={buscar} onChange={(e) => setBuscar(e.target.value)} />
              {buscar && <button type="button" onClick={() => setBuscar('')} aria-label="Limpiar búsqueda"><X size={18} /></button>}
            </label>
            <label className="ordenar">
              <span>Ordenar por</span>
              <select value={orden} onChange={(e) => setOrden(e.target.value)}>
                <option value="carta">Orden de la carta</option>
                <option value="menor">Menor precio</option>
                <option value="mayor">Mayor precio</option>
              </select>
            </label>
          </div>

          <div className="titulo-seccion">
            <h2 id="titulo-carta">{q ? `Resultados para “${buscar.trim()}”` : info?.titulo || 'Carta'}</h2>
            {!q && info?.lema && <p>{info.lema}</p>}
          </div>

          {menu && lista.length === 0 && <p className="vacio">No encontramos platos con ese nombre. Prueba con otra palabra.</p>}
          <div className="rejilla">
            {lista.map((p) => {
              const n = cantidadDe(p.id)
              return (
                <article key={p.id} className="producto">
                  <Foto nombre={p.nombre} />
                  <div className="producto-cuerpo">
                    <h3>{p.nombre}</h3>
                    <p>{p.descripcion}</p>
                    <div className="producto-pie">
                      <strong className="precio">{pesos(p.precio)}</strong>
                      {puedePedir && (n
                        ? <Cantidad valor={n} nombre={p.nombre} onCambiar={(d) => agregar(p, d)} />
                        : <button className="btn btn-sm" onClick={() => agregar(p)}><Plus size={17} />Agregar</button>)}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {puedePedir && (
          <aside className="lateral">
            <section className="mini-pedido" aria-labelledby="mini-titulo">
              <h2 id="mini-titulo">Mi pedido {carrito.length > 0 && <span className="contador">{carrito.reduce((n, i) => n + i.cantidad, 0)}</span>}</h2>
              {carrito.length === 0 ? (
                <p className="vacio">Aún no agregas nada. Elige tu burger favorita.</p>
              ) : (
                <ul>
                  {carrito.map(({ plato, cantidad }) => (
                    <li key={plato.id}>
                      <Foto nombre={plato.nombre} className="mini" />
                      <span className="mini-txt">{plato.nombre}<b>{pesos(plato.precio)}</b></span>
                      <Cantidad valor={cantidad} nombre={plato.nombre} onCambiar={(d) => agregar(plato, d)} />
                      <button className="quitar" onClick={() => quitar(plato.id)} aria-label={`Quitar ${plato.nombre}`}><X size={15} /></button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mini-total"><span>Subtotal</span><strong>{pesos(subtotal)}</strong></div>
              <button className="btn btn-bloque" disabled={!carrito.length} onClick={() => ir('pedido')}>Ver pedido <ArrowRight size={18} /></button>
            </section>
            <section className="completa">
              <img src="/img/combo.png" alt="" width="135" height="100" loading="lazy" />
              <h2 className="display">Completa tu experiencia</h2>
              <p>Agrega una bebida o un postre y haz tu comida aún mejor.</p>
              <button className="btn btn-bloque" onClick={() => { setElegida(categorias.includes('BEBIDAS') ? 'BEBIDAS' : categorias.at(-1)); setBuscar('') }}>Ver bebidas</button>
            </section>
          </aside>
        )}
      </div>
    </>
  )
}
