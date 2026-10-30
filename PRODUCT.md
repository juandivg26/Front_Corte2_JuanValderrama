# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Cliente** sentado en una mesa del restaurante: mira la carta, arma su pedido para su número de mesa y sigue en vivo su estado. También reserva mesas.
- **Mesero**: toma pedidos, abre cuentas y cambia el estado de las mesas.
- **Cocina (COCINERO)**: mueve los pedidos por RECIBIDO → EN_PREPARACION → LISTO → ENTREGADO en un tablero.
- **Cajero**: registra pagos y cierra cuentas.
- **Administrador**: gestiona platos, mesas y ve usuarios y el historial de eventos.

## Product Purpose
Front de **American Bites**, restaurante de comida rápida americana (hamburguesas, papas, malteadas). Consume la API REST Spring Boot del repo `Bitacora_Corte2_JuanValderrama` (JWT, PostgreSQL, MongoDB). Es la entrega académica del curso DOSW (Escuela Colombiana de Ingeniería), Corte 2; el README debe llevar un video de las funcionalidades.

## Operating Context
Pedido en mesa (dine-in): el cliente indica el número de su mesa como si escaneara un QR. No hay domicilios, no hay pagos en línea: el pago lo registra el cajero.

## Capabilities and Constraints
- Toda acción va contra la API; los permisos los decide el back (401/403). El front solo oculta lo que el rol no puede usar.
- El registro público siempre crea CLIENTE; los roles de personal los asigna el administrador.
- Sin login social (Google/Microsoft/Apple no están configurados en el back).
- El total del pedido es el que calcula el back; no se inventan impuestos ni descuentos.
- Stack: React 18 + Vite 6, sin librerías de UI.

## Brand Commitments
- Nombre: American Bites. Lema: "Good Food Good People". Frases de marca: "Same Burgers, Higher Vibes", "Más que Burgers".
- Logo e ícono en `public/img/logo.png` y `public/img/icono.png` (entregados por el usuario).
- Mockups de referencia entregados por el usuario (registro, carta, mi pedido, confirmación, tablero de cocina): son la dirección visual vinculante.

## Evidence on Hand
Fotos de productos recortadas de los mockups del usuario. No hay testimonios, cifras ni clientes reales: no inventarlos.

## Product Principles
1. Cada rol ve solo su trabajo, con el camino más corto para hacerlo.
2. El estado del pedido siempre es el real del back, nunca simulado.
3. La marca se siente en la carta y el pedido del cliente; las pantallas de personal priorizan rapidez y lectura.
