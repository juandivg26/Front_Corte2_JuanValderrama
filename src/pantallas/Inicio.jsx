import { useState } from 'react'
import { ArrowRight, BellRing, ChefHat, Eye, EyeOff, Heart, Lock, Mail, Settings, Users, User, Sandwich } from 'lucide-react'
import { api } from '../api.js'

const ROLES = [
  { id: 'CLIENTE', nombre: 'Cliente', Icono: Users },
  { id: 'MESERO', nombre: 'Mesero', Icono: BellRing },
  { id: 'COCINERO', nombre: 'Cocina', Icono: ChefHat },
  { id: 'ADMINISTRADOR', nombre: 'Administrador', Icono: Settings },
]
// Solo en desarrollo: atajos con los usuarios semilla del back para la demo
const DEMO = import.meta.env.DEV ? [
  ['Cliente', 'cliente@americanbites.com', 'Cliente123*'],
  ['Mesero', 'mesero@americanbites.com', 'Mesero123*'],
  ['Cocina', 'cocinero@americanbites.com', 'Cocinero123*'],
  ['Caja', 'cajero@americanbites.com', 'Cajero123*'],
  ['Admin', 'admin@americanbites.com', 'Admin123*'],
] : []

export default function Inicio({ ejecutar, entrar }) {
  const [modo, setModo] = useState('registro')
  return (
    <section className="inicio">
      <div className="inicio-arte">
        <p className="script inicio-script">Más que<br />Burgers</p>
        <h1 className="display inicio-titulo">Good<br />Food<br />Good<br />People</h1>
        <p className="inicio-sub">Burgers, papas, shakes<br />y buenos momentos.</p>
        <ul className="rasgos">
          <li><Sandwich size={34} strokeWidth={1.6} />Comida<br />real</li>
          <li><Users size={34} strokeWidth={1.6} />Experiencias<br />memorables</li>
          <li><Heart size={34} strokeWidth={1.6} />Para<br />todos</li>
        </ul>
        <img className="inicio-foto" src="/img/hero-burger.jpg" alt="" width="620" height="232" fetchpriority="high" />
      </div>
      <div className="acceso">
        {modo === 'registro'
          ? <Registro ejecutar={ejecutar} entrar={entrar} cambiar={() => setModo('login')} />
          : <Login ejecutar={ejecutar} entrar={entrar} cambiar={() => setModo('registro')} />}
      </div>
    </section>
  )
}

function Campo({ icono: Icono, clave, ...props }) {
  const [ver, setVer] = useState(false)
  const esClave = props.type === 'password'
  return (
    <label className="campo">
      <span className="sr-only">{props.placeholder}</span>
      <Icono size={19} aria-hidden="true" />
      <input {...props} type={esClave && ver ? 'text' : props.type} />
      {esClave && (
        <button type="button" className="ver" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
          {ver ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      )}
    </label>
  )
}

function Registro({ ejecutar, entrar, cambiar }) {
  const [f, setF] = useState({ nombre: '', apellido: '', email: '', password: '', confirmar: '' })
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const on = (e) => setF({ ...f, [e.target.name]: e.target.value })

  const enviar = async (e) => {
    e.preventDefault()
    if (f.password !== f.confirmar) return setError('Las contraseñas no coinciden.')
    setError(''); setEnviando(true)
    const body = { nombre: `${f.nombre} ${f.apellido}`.trim(), email: f.email, password: f.password }
    const ok = await ejecutar(() => api('/auth/registro', { method: 'POST', body }), '¡Bienvenido a American Bites!')
    const r = ok && await ejecutar(() => api('/auth/login', { method: 'POST', body: { email: f.email, password: f.password } }))
    setEnviando(false)
    if (r) entrar(r)
  }

  return (
    <form className="tarjeta-acceso" onSubmit={enviar}>
      <p className="acceso-pre">Únete a</p>
      <h2 className="display acceso-titulo">American Bites</h2>
      <p className="acceso-sub">Crea tu cuenta y comienza a vivir la experiencia.</p>
      <div className="fila-2">
        <Campo icono={User} name="nombre" placeholder="Nombre" value={f.nombre} onChange={on} required autoComplete="given-name" />
        <Campo icono={User} name="apellido" placeholder="Apellido" value={f.apellido} onChange={on} autoComplete="family-name" />
      </div>
      <Campo icono={Mail} name="email" type="email" placeholder="Correo electrónico" value={f.email} onChange={on} required autoComplete="email" spellCheck={false} />
      <Campo icono={Lock} name="password" type="password" placeholder="Contraseña" value={f.password} onChange={on} required minLength={6} autoComplete="new-password" />
      <Campo icono={Lock} name="confirmar" type="password" placeholder="Confirmar contraseña" value={f.confirmar} onChange={on} required minLength={6} autoComplete="new-password" />

      <fieldset className="roles">
        <legend>Selecciona tu rol</legend>
        <div className="roles-lista">
          {ROLES.map(({ id, nombre, Icono }) => (
            <label key={id} className={`rol ${id === 'CLIENTE' ? 'elegido' : ''}`}>
              <input type="radio" name="rol" value={id} defaultChecked={id === 'CLIENTE'} disabled={id !== 'CLIENTE'} />
              <Icono size={24} strokeWidth={1.7} aria-hidden="true" />
              <span>{nombre}</span>
              {id !== 'CLIENTE' && <Lock className="rol-candado" size={13} aria-hidden="true" />}
            </label>
          ))}
        </div>
        <p className="nota">Las cuentas de Mesero, Cocina y Administrador las crea el administrador.</p>
      </fieldset>

      {error && <p className="error-campo" role="alert">{error}</p>}
      <button className="btn btn-grande" disabled={enviando}>{enviando ? 'Creando cuenta…' : 'Crear cuenta'} <ArrowRight size={20} /></button>
      <p className="acceso-cambio">¿Ya tienes una cuenta? <button type="button" className="enlace" onClick={cambiar}>Inicia sesión</button></p>
    </form>
  )
}

function Login({ ejecutar, entrar, cambiar }) {
  const [f, setF] = useState({ email: '', password: '' })
  const [enviando, setEnviando] = useState(false)
  const on = (e) => setF({ ...f, [e.target.name]: e.target.value })
  const enviar = async (e) => {
    e.preventDefault()
    setEnviando(true)
    const r = await ejecutar(() => api('/auth/login', { method: 'POST', body: f }))
    setEnviando(false)
    if (r) entrar(r)
  }
  return (
    <form className="tarjeta-acceso" onSubmit={enviar}>
      <p className="acceso-pre">Bienvenido de nuevo</p>
      <h2 className="display acceso-titulo">Inicia sesión</h2>
      <p className="acceso-sub">Entra para pedir desde tu mesa o gestionar el restaurante.</p>
      <Campo icono={Mail} name="email" type="email" placeholder="Correo electrónico" value={f.email} onChange={on} required autoComplete="email" spellCheck={false} />
      <Campo icono={Lock} name="password" type="password" placeholder="Contraseña" value={f.password} onChange={on} required autoComplete="current-password" />
      <button className="btn btn-grande" disabled={enviando}>{enviando ? 'Entrando…' : 'Entrar'} <ArrowRight size={20} /></button>
      {DEMO.length > 0 && (
        <div className="demo">
          <p>Usuarios de prueba</p>
          <div>{DEMO.map(([n, email, password]) => <button type="button" key={n} className="chip" onClick={() => setF({ email, password })}>{n}</button>)}</div>
        </div>
      )}
      <p className="acceso-cambio">¿No tienes cuenta? <button type="button" className="enlace" onClick={cambiar}>Regístrate</button></p>
    </form>
  )
}
