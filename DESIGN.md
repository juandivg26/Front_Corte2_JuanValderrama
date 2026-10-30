# Design — American Bites

Fuente: mockups y guía de marca entregados por el usuario (registro, carta, mi pedido, confirmación, tablero de cocina, logo, paleta y tipografía). Los tokens viven en `src/styles.css` (`:root`).

## Mundo visual
Diner americano contemporáneo: vino profundo con fotografía cálida de producto, barra azul noche, superficies beige como papel de envoltura, títulos gruesos en mayúscula y frases de marca escritas a mano ("Good Food Good People", "Same Burgers Higher Vibes", "Más que Burgers"). Mascota de línea (niño con gorra) y chef como ilustraciones de marca.

## Color
| Token | Valor | Uso |
|---|---|---|
| `--vino` | `#7A1E3D` | Primario: botones, estados activos, banners |
| `--azul` / `--azul-osc` | `#0D2B52` / `#081F3D` | Barra superior, pie, títulos de sección |
| `--beige` | `#F6EBD7` | Fondo de página |
| `--crema` | `#FBF5EA` | Tarjetas y paneles |
| `--arena` | `#EFE0C6` | Superficies secundarias (total, promos, encabezados de tabla) |
| `--negro` | `#1A1A1A` | Texto |
| `--texto-2` | `#5B4A40` | Texto secundario (cálido, no gris) |
| Estados | verde `#2C6E43`, ámbar `#8A5A00`, azul `#0D2B52` sobre sus claros | Columnas del tablero y pills de estado |

## Tipografía
- **Poppins** 400/500/600/700: texto e interfaz.
- **Lilita One**: títulos de banner y de marca, en mayúscula, levemente inclinados en los banners.
- **Kaushan Script**: frases de marca, nunca para información.

## Componentes
Botones vino con presión `scale(0.97)`; CTA grande tipo píldora. Tarjetas de 14px de radio con una sola elevación (sombra suave, sin borde). Pills de estado por color. Stepper de cantidad. Toast abajo a la derecha con `@starting-style`.

## Movimiento
Un solo momento con intención: entrada escalonada de los productos y avance del tracker del pedido. Curva `cubic-bezier(0.23, 1, 0.32, 1)`, menos de 400ms, desactivado con `prefers-reduced-motion`.

## Modos
- Carta, Mi pedido, Confirmación e Inicio: marca completa (banners, fotografía, scripts).
- Tablero, Mesas, Cuentas, Reservas, Platos, Usuarios e Historial (personal): sobriedad y lectura rápida; la marca vive en color, tipografía y detalles.
