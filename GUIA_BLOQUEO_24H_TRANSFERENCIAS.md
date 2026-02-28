# Guía de Prueba: Bloqueo de Transferencias 24h a Misma Cuenta

## Objetivo
Validar que **no se puede** realizar dos transferencias a la misma cuenta destino dentro de un período de 24 horas.

---

## Regla Implementada

Si un usuario ya realizó una transferencia a una cuenta destino específica (completada exitosamente), **no pueda volver a transferir a esa misma cuenta hasta que hayan pasado 24 horas** desde la primera transferencia.

### Validaciones
- ✅ Se registra el bloqueo en auditoría de intentos fallidos
- ✅ Se notifica al usuario por email
- ✅ Se devuelve información clara: horas/minutos restantes, fecha de desbloqueo
- ✅ No afecta transferencias a **otras cuentas** (el bloqueo es específico por destino)

---

## Flujo de Prueba en Postman

### 1) Login del usuario
```
Método: POST
URL: http://localhost:3006/nexusBank/v1/auth/login
Body JSON:
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}
```

**Guarda el token** en variable `{{token}}`

---

### 2) Consultar mis cuentas
```
Método: GET
URL: http://localhost:3006/nexusBank/v1/accounts
Header: Authorization: Bearer {{token}}
```

**Identifica:**
- `sourceAccountNumber`: tu cuenta de origen
- `destAccountNumber`: cuenta destino (de otro usuario)
- Ambas deben tener saldo suficiente

---

### 3) Primera Transferencia (debe exitoso)

```
Método: POST
URL: http://localhost:3006/nexusBank/v1/accounts/transfers
Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json

Body JSON:
{
  "sourceAccountNumber": "001-1903093171-5",
  "destinationAccountNumber": "002-9630694538-2",
  "recipientType": "TERCERO",
  "amount": 100,
  "description": "Primera transferencia a esta cuenta"
}
```

**Esperado:**
- HTTP `200`
- Respuesta con `transactionId`, saldos actualizados

**Guarda:**
- `"lastTransferTime"` = timestamp actual
- `"destAccountNumber"` = la cuenta destino

---

### 4) Segunda Transferencia a MISMA cuenta (debe bloquear dentro de 24h)

**Sin esperar 24h**, intenta transferir a la misma cuenta destino:

```
Método: POST
URL: http://localhost:3006/nexusBank/v1/accounts/transfers
Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json

Body JSON:
{
  "sourceAccountNumber": "001-1903093171-5",
  "destinationAccountNumber": "002-9630694538-2",
  "recipientType": "TERCERO",
  "amount": 50,
  "description": "Segunda transferencia - debe bloquearse"
}
```

**Esperado:**
- HTTP `400`
- Mensaje: `"Transferencia bloqueada: No puedes transferir a la misma cuenta..."`
- Response data con:
  - `lastTransferAt`: fecha de última transferencia
  - `hoursRemaining`: horas para desbloqueo (ej. 23)
  - `minutesRemaining`: minutos restantes (ej. 45)
  - `blockedUntil`: fecha/hora de desbloqueo exacta

**Response esperado:**
```json
{
  "success": false,
  "message": "Transferencia bloqueada: No puedes transferir a la misma cuenta nuevamente hasta completar las 24 horas desde la última transferencia",
  "data": {
    "destinationAccountNumber": "002-9630694538-2",
    "lastTransferAt": "2026-02-28T22:30:15.000Z",
    "hoursRemaining": 23,
    "minutesRemaining": 45,
    "blockedUntil": "2026-02-29T22:30:15.000Z"
  }
}
```

---

### 5) Transferencia a OTRA cuenta (debe ser exitosa)

Usando **otra** cuenta destino, la transferencia debe pasar sin problemas:

```
Método: POST
URL: http://localhost:3006/nexusBank/v1/accounts/transfers
Headers:
- Authorization: Bearer {{token}}
- Content-Type: application/json

Body JSON:
{
  "sourceAccountNumber": "001-1903093093171-5",
  "destinationAccountNumber": "001-5384449684-3",
  "recipientType": "TERCERO",
  "amount": 50,
  "description": "Transferencia a cuenta diferente - debe permitirse"
}
```

**Esperado:**
- HTTP `200`
- Exitoso (el bloqueo es específico por destino, no existe transferencia previa a esta cuenta)

---

## Test Scripts (Postman)

### Request 3 (Primera transferencia)

```javascript
pm.test("Primera transferencia exitosa", function () {
  pm.response.to.have.status(200);
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  
  if (body.data?.transactionId) {
    pm.environment.set("firstTransferId", body.data.transactionId);
    pm.environment.set("firstTransferTime", new Date().toISOString());
  }
  
  console.log("✅ Transferencia guardada, ahora espera sin hacer nada y prueba en 2 minutos");
});
```

### Request 4 (Segunda transferencia - bloqueo esperado)

```javascript
pm.test("Bloqueo de 24h validado", function () {
  pm.response.to.have.status(400);
  const body = pm.response.json();
  
  pm.expect(body.success).to.eql(false);
  pm.expect(body.message).to.include("bloqueada");
  pm.expect(body.data.hoursRemaining).to.be.greaterThan(0);
  pm.expect(body.data.blockedUntil).to.exist;
  
  console.log("✅ Bloqueo funcionando correctamente");
  console.log("⏰ Desbloquearse en:", body.data.hoursRemaining, "h", body.data.minutesRemaining, "min");
});
```

### Request 5 (Transferencia a otra cuenta)

```javascript
pm.test("Transferencia a cuenta diferente permitida", function () {
  pm.response.to.have.status(200);
  const body = pm.response.json();
  pm.expect(body.success).to.eql(true);
  
  console.log("✅ Transferencia a otra cuenta sin problemas");
});
```

---

## Checklist de Validación

- [ ] Transferencia 1 a cuenta X: **exitosa** (200)
- [ ] Transferencia 2 a cuenta X (mismo destino): **bloqueada** (400)
- [ ] Respuesta incluye `hoursRemaining` y `blockedUntil`
- [ ] Email de notificación recibido en ambos intentos
- [ ] Intento bloqueado registrado en auditoría de intentos fallidos
- [ ] Transferencia a **otra** cuenta Y: **exitosa** (sin afectar bloqueo por X)

---

## Casos Edge

### Caso A: Esperar exactamente 24h
Si esperas 24 horas desde la primera transferencia, la segunda debe permitirse:
- Primera transferencia: `2026-02-28 22:00:00`
- Segunda transferencia: `2026-03-01 22:00:01` (o después)
- Resultado: **debe ser exitosa**

### Caso B: Múltiples destinos
Un usuario puede transferir de forma secuencial a cuentas diferentes sin bloqueo:
- Transferencia A → Cuenta X: ✅
- Transferencia B → Cuenta Y: ✅ (sin esperar 24h)
- Transferencia C → Cuenta X (dentro de 24h): ❌ (bloqueada)

### Caso C: Reversión hace desaparecer bloqueo
Si la primera transferencia se revierte (dentro de 5 minutos):
- El registro de transacción se marca como `REVERTIDA`
- El bloqueo **no debería** activarse para una segunda transferencia a esa cuenta
- (Esto es porque buscamos transacciones COMPLETADAS, no revertidas)

---

## Notas Técnicas

### Cómo funciona internamente
1. Antes de crear la transferencia, busca en tabla `transactions`:
   - `accountId` = origen actual
   - `relatedAccountId` = destino actual
   - `type` = 'TRANSFERENCIA_ENVIADA'
   - `status` = 'COMPLETADA'
   - `createdAt` >= hace 24 horas

2. Si encuentra coincidencia → bloquea con mensaje descriptivo

3. Si no encuentra → permite la transferencia

---

## Solución de Problemas

### Error: "Transferencia bloqueada" pero acabo de transferir hace 1h
- ✅ Comportamiento esperado. Espera 24h desde la primera transferencia.

### No veo el email de bloqueo
- Verifica que el servicio de email esté configurado
- El intento fallido se registra aunque el email falle

### Caso de prueba: ¿cómo resetear el bloqueo?
- Solo el paso del tiempo (24h real)
- No hay endpoint de "desbloqueo manual" por diseño

---

**Fecha:** 2026-02-28  
**Versión:** 1.0.0
