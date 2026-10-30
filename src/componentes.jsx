import { useCallback, useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { api } from './api.js'
import { fotoDe } from './marca.js'

// Foto del plato; si no hay foto, el ícono de la marca sobre vino
export function Foto({ nombre, className = '' }) {
  const src = fotoDe(nombre)
  return src
    ? <img className={`foto ${className}`} src={src} alt="" loading="lazy" width="320" height="200" />
    : <span className={`foto foto-vacia ${className}`} aria-hidden="true"><img src="/img/icono.png" alt="" width="133" height="126" /></span>
}

export function Cantidad({ valor, onCambiar, nombre }) {
  return (
    <div className="cantidad" role="group" aria-label={`Cantidad de ${nombre}`}>
      <button type="button" onClick={() => onCambiar(-1)} aria-label={`Quitar un ${nombre}`}><Minus size={16} /></button>
      <output aria-live="polite">{valor}</output>
      <button type="button" onClick={() => onCambiar(1)} aria-label={`Agregar un ${nombre}`}><Plus size={16} /></button>
    </div>
  )
}

// Carga un recurso del back; con intervalo se refresca solo (tablero de cocina, seguimiento)
export function useApi(path, { token, ejecutar }, intervalo = 0) {
  const [datos, setDatos] = useState(null)
  const cargar = useCallback(async () => {
    if (!path) return
    const r = await ejecutar(() => api(path, { token }))
    if (r !== undefined) setDatos(r)
  }, [path, token])
  useEffect(() => {
    cargar()
    if (!intervalo) return
    const t = setInterval(cargar, intervalo)
    return () => clearInterval(t)
  }, [cargar, intervalo])
  return [datos, cargar]
}

export function Cabecera({ titulo, children }) {
  return (
    <div className="cabecera">
      <h1>{titulo}</h1>
      {children && <div className="cabecera-acciones">{children}</div>}
    </div>
  )
}

export const Estado = ({ valor, texto }) => <span className={`estado e-${valor}`}>{texto || valor.replace('_', ' ').toLowerCase()}</span>
