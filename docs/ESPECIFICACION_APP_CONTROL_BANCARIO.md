# Especificación de Proyecto — Sistema de Control Bancario y Casino

## 1. Contexto y objetivo

Actualmente el negocio opera un sistema de control de cuentas bancarias y cuentas de
casino usando Google Sheets (múltiples archivos conectados por letra + un maestro
consolidado). Funciona, pero es frágil: mover una fila o insertar una columna rompe
fórmulas, y no da una experiencia de uso clara para el equipo.

**Objetivo:** construir una aplicación web que reemplace este sistema, con base de
datos real, formularios dedicados por tipo de operación, y cálculos hechos en código
(no en fórmulas encadenadas).

**Usuarios:**
- **1 Administrador/Dueño(a):** ve todo consolidado, da de alta cuentas y casinos,
  edita status, ve reportes y tarjetas, puede registrar movimientos de cualquier letra.
- **Operadores (uno por "letra": A, B, C, D, E, F, G, Z...):** cada uno ve y opera
  solo sus propias cuentas de banco y casino, registra sus movimientos del día a día.
  No pueden dar de alta cuentas nuevas ni ver reportes/tarjetas.

---

## 2. Modelo de datos

### 2.1 Cuentas (bancarias)
| Campo | Tipo | Notas |
|---|---|---|
| id | string (PK) | formato `banco.letra.perfil`, ej `sant.a.101` |
| status | enum | Por verificar / Activa / Bloqueada / Baja / Sin acceso |
| tipo_cuenta | enum | Básica / Sin límite / Mejorada |
| letra | string | A, B, C... |
| perfil | string | número de perfil, ej "101" |
| banco | string | nombre del banco |
| saldo_inicial | decimal | |
| saldo_actual | decimal (calculado) | ver fórmula en sección 4 |
| clabe | string | |
| usuario, contraseña, nueva_contraseña, token, nip | string | credenciales |
| n_cuenta, n_cliente | string | |
| nombre_perfil | string | nombre del titular |
| n_tarjeta, exp, cvv | string | datos de tarjeta asociada |
| observaciones | text | |
| prestada_a | string | referencia libre |
| id_cliente, nombre_cliente | string | cruce con catálogo de clientes |
| cliente_activo | boolean | |

### 2.2 Casinos
| Campo | Tipo | Notas |
|---|---|---|
| id | string (PK) | formato `casino.letra.perfil`, ej `code.a.101` |
| no_casino | int | número de catálogo (1=Codere, 2=Bet365, etc.) |
| nombre_casino | string | |
| letra, perfil | string | |
| saldo_inicial | decimal | |
| saldo_actual | decimal (calculado) | ver fórmula en sección 4 |
| status_casino | enum | Activo / Bloqueado / Alerta |
| status_perfil | enum | Verificado / En proceso / Sin verificación |
| usuario, contraseña | string | |
| cobra_en | string (FK a Cuentas.id) | cuenta bancaria donde se retira ese casino |
| nota | text | |

### 2.3 Movimientos (bancarios)
| Campo | Tipo | Notas |
|---|---|---|
| id | int (PK) | |
| fecha | datetime | |
| tipo_movimiento | enum | Depósito a Casino / Retiro de Casino / Préstamo entre Cuentas / Gasto Operativo |
| cuenta_id | string (FK a Cuentas.id) | |
| tipo | enum | Retiro / Depósito (dirección contable) |
| monto | decimal | |
| estado | enum | Confirmado / Pendiente / Cancelado |
| casino_u_origen | string | ID de casino o de otra cuenta (para el lado contrario del movimiento) |
| concepto | text | |
| referencia | string | |
| notas | text | |
| registrado_por | string | usuario/email que lo creó |

### 2.4 Apuestas
| Campo | Tipo | Notas |
|---|---|---|
| id | int (PK) | |
| fecha | datetime | |
| letra, perfil | string | |
| casino_id | string (FK a Casinos.id) | |
| no_apuesta | string | |
| evento | string | |
| mercado | enum | Local / Empate / Visitante |
| descripcion | string | |
| momio | decimal | |
| saldo_real | decimal | monto apostado en efectivo |
| bono | decimal | monto apostado con bono |
| posible_ganancia | decimal | = momio × (saldo_real + bono) |
| status_apuesta | enum | En juego / Ganada / Perdida |
| resultado_ganancia | decimal (nullable) | monto real que se acredita cuando se marca Ganada |
| apuesta_relacionada_id | int (nullable) | si es un registro de ganancia, referencia a la apuesta original |

---

## 3. Reglas de negocio clave

1. **Trazabilidad total:** nunca se edita el monto de un movimiento ya registrado.
   Cualquier corrección se hace agregando un movimiento nuevo.

2. **Apuestas:**
   - Al registrar una apuesta: se resta `saldo_real + bono` del saldo del casino,
     status = "En juego".
   - Al cerrar una apuesta como **Perdida**: solo se actualiza el status. El dinero
     ya estaba restado, no se toca nada más.
   - Al cerrar una apuesta como **Ganada**: se actualiza el status Y se crea un
     registro nuevo con el monto de `resultado_ganancia`, que suma al saldo del
     casino. Nunca se edita el monto original de la apuesta.

3. **Depósito a Casino:** crea 1 movimiento bancario (Retiro, de la cuenta elegida,
   con `casino_u_origen` = id del casino). El saldo del casino se calcula sumando
   estos retiros automáticamente (ver sección 4).

4. **Retiro de Casino** (cobro): crea 1 movimiento bancario (Depósito, a la cuenta
   elegida, con `casino_u_origen` = id del casino).

5. **Préstamo entre Cuentas:** crea 2 movimientos bancarios simultáneos — un Retiro
   en la cuenta origen y un Depósito en la cuenta destino, mismo monto, mismo
   momento, cada uno con `casino_u_origen` apuntando a la otra cuenta.

6. **Gasto Operativo:** crea 1 movimiento (Retiro) sin cuenta/casino destino — el
   dinero simplemente sale del sistema.

7. **Ganancia neta por casino** (para reportes) = suma de Retiros de Casino
   (cobros) − suma de Depósitos a Casino. Esto es distinto al saldo que hay
   guardado en el casino en un momento dado.

---

## 4. Fórmulas de saldo (deben implementarse como lógica de servidor, no fórmulas)

**Saldo Actual de una Cuenta bancaria:**
```
saldo_actual = saldo_inicial
  + SUM(monto WHERE movimientos.cuenta_id = esta_cuenta AND tipo='Depósito' AND estado='Confirmado')
  - SUM(monto WHERE movimientos.cuenta_id = esta_cuenta AND tipo='Retiro' AND estado='Confirmado')
  + SUM(monto WHERE movimientos.casino_u_origen = esta_cuenta AND tipo='Retiro' AND estado='Confirmado')
    -- esto cubre cuando ESTA cuenta es el destino de un préstamo desde otra cuenta
```

**Saldo Actual de un Casino:**
```
saldo_actual = saldo_inicial
  + SUM(monto WHERE movimientos.casino_u_origen = este_casino AND tipo='Retiro' AND estado='Confirmado')
    -- dinero que entró al casino desde algún banco (Depósito a Casino)
  - SUM(monto WHERE movimientos.casino_u_origen = este_casino AND tipo='Depósito' AND estado='Confirmado')
    -- dinero que salió del casino hacia algún banco (Retiro de Casino / cobro)
  - SUM(saldo_real + bono WHERE apuestas.casino_id = este_casino AND status_apuesta IN ('En juego','Ganada','Perdida'))
    -- todo lo apostado, se resta siempre
  + SUM(resultado_ganancia WHERE apuestas.casino_id = este_casino AND status_apuesta = 'Ganada')
    -- las ganancias confirmadas
```

Recalcular estos valores al vuelo (en cada consulta) o mantenerlos como campo
cacheado que se actualiza en cada transacción — cualquiera de los dos enfoques es
válido, pero debe ser consistente y transaccional (usar transacciones de base de
datos para que un movimiento y su efecto en el saldo se guarden juntos o no se
guarde ninguno).

---

## 5. Pantallas / funcionalidades necesarias

### 5.1 Dashboard
- Para operador: resumen de sus cuentas y casinos (saldos totales, alertas de
  pendientes).
- Para admin: todo lo anterior mas consolidado de TODAS las letras.

### 5.2 "Nuevo Movimiento" (la pantalla más usada, uso diario)
Formulario inteligente que muestra solo los campos relevantes según lo que el
usuario está haciendo, en este orden:

1. **Buscar Casino** por perfil (ej. escribir "101") → lista las cuentas de casino
   activas de ese perfil con saldo, usuario, contraseña, "cobra en" → se elige una.
2. **Tabla de Apuesta** (opcional, solo si se va a registrar una apuesta): Evento,
   Mercado (Local/Empate/Visitante), Descripción, Momio, Apostado, Tipo de Saldo
   (Efectivo/Bono) → calcula Posible Ganancia automático → botón "Registrar
   Apuesta".
3. **Tipo de Movimiento Bancario** (Depósito a Casino / Retiro de Casino) → buscar
   cuenta de banco por perfil → tabla con CLABE, usuario, contraseña, token, NIP,
   disponible, y alerta de "pendiente" si hay depósitos sin confirmar → Monto,
   Concepto, Estado → botón "Registrar Movimiento Bancario".
4. **Préstamo entre Cuentas** (siempre visible, aparte): tabla de cuenta ORIGEN y
   tabla de cuenta DESTINO (con toda la info de acceso), Monto, Concepto, Estado
   → botón "Registrar Préstamo".
5. Un pequeño widget lateral: "Quién puede prestar +$10,000" — lista de perfiles
   con más de $10,000 sumando sus cuentas, con su monto disponible.
6. Indicador en la parte superior que diga en vivo qué se está armando (Apuesta /
   Depósito / Retiro / Préstamo / nada activo) — para que se sienta claro y
   "de app", no como una hoja de cálculo.

### 5.3 "Cerrar Apuesta"
Vista de apuestas "En juego" con un botón por fila para marcarlas Ganada/Perdida.
Al marcar Ganada, pide o calcula el monto de `resultado_ganancia` y genera el
registro automáticamente.

### 5.4 Alta de Cuenta / Alta de Casino (solo admin)
Formularios para dar de alta cuentas bancarias y cuentas de casino nuevas, en
cualquier letra.

### 5.5 Editar Status (solo admin)
Cambiar Status/Tipo de una cuenta existente, de cualquier letra.

### 5.6 Reportes (solo admin)
- Flujo de movimientos: clasificado como Entrada / Salida / Interna.
- Ganancia por casino: Depósitos totales, Apuestas totales, Cobros totales,
  Ganancia Neta (Cobros − Depósitos), con total general.

### 5.7 Tarjetas (solo admin)
Catálogo de tarjetas asociadas a cada cuenta (número, NIP, CVV, vencimiento,
ubicación/custodia).

---

## 6. Roles y permisos

| Acción | Admin | Operador |
|---|---|---|
| Ver sus propias cuentas/casinos | ✅ | ✅ |
| Ver TODAS las letras consolidado | ✅ | ❌ |
| Registrar movimientos (cualquier letra) | ✅ | Solo su letra |
| Dar de alta cuentas/casinos | ✅ | ❌ |
| Editar status de cuenta | ✅ | ❌ |
| Ver reportes | ✅ | ❌ |
| Ver tarjetas | ✅ | ❌ |
| Cerrar apuestas | ✅ | ✅ (de su letra) |

---

## 7. Migración de datos existentes

Ya existen datos reales en Google Sheets que deben migrarse (no partir de cero):
- Catálogo de Cuentas (varias letras)
- Catálogo de Casinos
- Historial de Movimientos bancarios
- Historial de Apuestas

Plan sugerido:
1. Exportar cada hoja relevante a CSV.
2. Escribir un script de importación (Python o Node) que lea los CSV y los
   inserte en la base de datos nueva, preservando los IDs existentes
   (`banco.letra.perfil`, `casino.letra.perfil`) para no perder continuidad.
3. Validar totales de saldo después de importar (comparar saldo_actual calculado
   vs. lo que se veía en Sheets, cuenta por cuenta) antes de dar por buena la
   migración.

---

## 8. Sugerencia de stack técnico

Dado que es una herramienta interna para un equipo pequeño, con necesidad de
acceso multiusuario en la nube:

- **Frontend + Backend:** Next.js (React) — permite tener todo en un solo
  proyecto, fácil de desplegar.
- **Base de datos:** PostgreSQL (por ejemplo con Supabase o Neon, que dan
  hosting gratuito/barato y autenticación integrada).
- **Autenticación:** login simple por email/password o magic link, con roles
  (admin / operador + letra asignada).
- **Hosting:** Vercel (para el frontend/backend de Next.js) + la base de datos
  en Supabase/Neon.

Esto es una sugerencia de punto de partida — Claude Code puede ajustar el stack
según lo que se sienta más cómodo de mantener.

---

## 9. Cómo usar este documento

Pega este archivo completo como el mensaje inicial a Claude Code, junto con la
frase: *"Quiero que construyas esta aplicación paso a paso. Empecemos por el
modelo de datos y la base de datos, luego el CRUD básico, y después las pantallas
en el orden de la sección 5."* Claude Code puede ir construyendo por partes y
mostrándote avances en el camino.
