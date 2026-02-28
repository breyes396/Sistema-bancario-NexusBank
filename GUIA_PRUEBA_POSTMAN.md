# 📮 GUÍA DE PRUEBA CON POSTMAN

Basada en la estructura de tus collections JSON

---

## 📂 ESTRUCTURA EN POSTMAN

Crea esta estructura de carpetas en tu colección:

```
Mi Colección
├── Auth
│   ├── Login Cliente 1
│   ├── Login Cliente 2
│   └── Login Cliente 3
├── Accounts - Rate Limit
│   ├── Listar Cuentas
│   ├── Transferencia Exitosa
│   ├── Transferencia 10x (Rate Limit)
│   └── Transferencia 11x (Debe fallar)
├── Accounts - Bloqueo
│   ├── 3 Intentos Fallidos
│   ├── Transfer Bloqueado
│   └── Ver Estado Seguridad
├── Security Endpoints ⭐
│   ├── Ver Status
│   ├── Ver Intentos Fallidos
│   └── Ver Alertas Fraude
└── Bonus
    └── Transacciones Rápidas
```

---

## 🔧 VARIABLES EN POSTMAN

En tu colección, crea estas variables:

```
baseUrl = http://localhost:3006/nexusBank/v1
token_cliente1 = (se llena después del login)
token_cliente2 = (se llena después del login)
token_cliente3 = (se llena después del login)
```

---

## PASO 1️⃣: LOGIN CLIENTE 1

**Nombre:** Auth → Login Cliente 1

```
POST http://localhost:3006/nexusBank/v1/auth/login
Content-Type: application/json

{
  "email": "cliente1@test.com",
  "password": "Password123!"
}
```

**Script de Test (en pestaña "Tests"):**
```javascript
if (pm.response.code === 200) {
    var token = pm.response.json().data.token;
    pm.environment.set('token_cliente1', token);
    console.log('✅ Token Cliente 1 guardado');
}
```

**Esperado:** Status 200 + token guardado en variable

---

## PASO 2️⃣: LISTAR CUENTAS

**Nombre:** Accounts → Listar Cuentas

```
GET http://localhost:3006/nexusBank/v1/accounts
Authorization: Bearer {{token_cliente1}}
```

**Esperado:** Status 200 + lista de cuentas
**⚠️ IMPORTANTE: Copia los números de cuenta de esta respuesta - los usarás en todos los pasos siguientes**

Ejemplo de respuesta real:
```json
{
  "success": true,
  "data": [
    {
      "id": "acc_dTEfwt4FH5KU",
      "accountNumber": "002-9630694538-2",
      "accountType": "corriente",
      "accountBalance": "1000.00"
    },
    {
      "id": "acc_KEaA3tdPmYR9",
      "accountNumber": "001-5384449684-3",
      "accountType": "ahorro",
      "accountBalance": "4100.00"
    }
  ]
}
```

**Guarda estos números:**
- sourceAccountNumber = `002-9630694538-2` (cuenta 1)
- destinationAccountNumber = `001-5384449684-3` (cuenta 2)

---

## PASO 3️⃣: TRANSFERENCIA EXITOSA

**Nombre:** Accounts - Rate Limit → Transferencia Exitosa

**Usa los números de cuenta del PASO 2:**

```
POST http://localhost:3006/nexusBank/v1/accounts/transfers
Authorization: Bearer {{token_cliente1}}
Content-Type: application/json

{
  "sourceAccountNumber": "002-9630694538-2",
  "destinationAccountNumber": "001-5384449684-3",
  "recipientType": "PROPIA",
  "amount": 50
}
```

**Esperado:** Status 200 + transacción exitosa

---

## PASO 4️⃣: RATE LIMIT - 10 TRANSFERENCIAS

**Nombre:** Accounts - Rate Limit → Transferencia 10x

**Ejecuta el PASO 3 exactamente 10 veces (cambia el `amount: 50`)**

```
Intento 1:  Status 200 ✅
Intento 2:  Status 200 ✅
Intento 3:  Status 200 ✅
Intento 4:  Status 200 ✅
Intento 5:  Status 200 ✅
Intento 6:  Status 200 ✅
Intento 7:  Status 200 ✅
Intento 8:  Status 200 ✅
Intento 9:  Status 200 ✅
Intento 10: Status 200 ✅
```

**Esperado:** Todos exitosos (200)

---

## PASO 5️⃣: RATE LIMIT - INTENTO 11 (DEBE FALLAR)

**Nombre:** Accounts - Rate Limit → Transferencia 11x (Debe fallar)

Mismo request del PASO 3, pero es el 11 intentar:

```
POST http://localhost:3006/nexusBank/v1/accounts/transfers
Authorization: Bearer {{token_cliente1}}
Content-Type: application/json

{
  "sourceAccountNumber": "002-9630694538-2",
  "destinationAccountNumber": "001-5384449684-3",
  "recipientType": "PROPIA",
  "amount": 50
}
```

**Esperado:** 
- Status 429 (TOO MANY REQUESTS)
- Mensaje: "Has excedido el límite de transferencias"

```json
{
  "success": false,
  "msg": "Has excedido el límite de transferencias. Intenta de nuevo en 1 hora"
}
```

✅ **RATE LIMIT FUNCIONANDO**

---

## PASO 6️⃣: LOGIN CLIENTE 2

**Nombre:** Auth → Login Cliente 2

```
POST http://localhost:3006/nexusBank/v1/auth/login
Content-Type: application/json

{
  "email": "cliente2@test.com",
  "password": "Password123!"
}
```

**Script de Test:**
```javascript
if (pm.response.code === 200) {
    var token = pm.response.json().data.token;
    pm.environment.set('token_cliente2', token);
    console.log('✅ Token Cliente 2 guardado');
}
```

---

## PASO 7️⃣: 3 INTENTOS FALLIDOS (MONTO EXCEDIDO)

**Nombre:** Accounts - Bloqueo → 3 Intentos Fallidos

Ejecuta este request **3 VECES** con `amount: 3000` (excede límite de Q2000):

**Usa los números de cuenta del PASO 2 (Cliente 2):**

```
POST http://localhost:3006/nexusBank/v1/accounts/transfers
Authorization: Bearer {{token_cliente2}}
Content-Type: application/json

{
  "sourceAccountNumber": "002-9630694538-2",
  "destinationAccountNumber": "001-5384449684-3",
  "recipientType": "PROPIA",
  "amount": 3000
}
```

**Esperado cada vez:** 
- Status 400 (BAD REQUEST)
- Mensaje: "Monto excede el límite máximo"

```json
{
  "success": false,
  "message": "Transferencia rechazada: el monto excede el limite maximo por transaccion de Q2000"
}
```

**Después del 3er intento:**
- Usuario bloqueado ✅
- Email enviado ✅

---

## PASO 8️⃣: TRANSFERENCIA VÁLIDA (DEBE ESTAR BLOQUEADO)

**Nombre:** Accounts - Bloqueo → Transfer Bloqueado

Request con monto válido (100 Q), pero usuario está bloqueado:

**Usa los números de cuenta del PASO 2 (Cliente 2):**

```
POST http://localhost:3006/nexusBank/v1/accounts/transfers
Authorization: Bearer {{token_cliente2}}
Content-Type: application/json

{
  "sourceAccountNumber": "002-9630694538-2",
  "destinationAccountNumber": "001-5384449684-3",
  "recipientType": "PROPIA",
  "amount": 100
}
```

**Esperado:**
- Status 423 (LOCKED)
- Mensaje: "Tu cuenta ha sido bloqueada temporalmente"

```json
{
  "success": false,
  "message": "Tu cuenta ha sido bloqueada temporalmente por razones de seguridad",
  "data": {
    "blockedUntil": "2026-02-28T15:30:00Z"
  }
}
```

✅ **BLOQUEO TEMPORAL FUNCIONANDO**

---

## PASO 9️⃣: VER ESTADO DE SEGURIDAD ⭐

**Nombre:** Security Endpoints → Ver Status

**En Postman:**
- Método: `GET`
- URL: `http://localhost:3006/nexusBank/v1/security/status`
- Header: `Authorization: Bearer {{token_cliente2}}`

**Esperado:** Status 200

```json
{
  "success": true,
  "data": {
    "isBlocked": true,
    "blockedUntil": "2026-02-28T15:30:00Z",
    "recentFailedAttempts": 3,
    "activeAlerts": 1,
    "security": {
      "status": "BLOCKED",
      "riskLevel": "HIGH"
    }
  }
}
```

✅ **ENDPOINT DE SEGURIDAD FUNCIONANDO**

---

## PASO 🔟: VER INTENTOS FALLIDOS ⭐

**Nombre:** Security Endpoints → Ver Intentos Fallidos

**En Postman:**
- Método: `GET`
- URL: `http://localhost:3006/nexusBank/v1/security/failed-attempts`
- Header: `Authorization: Bearer {{token_cliente2}}`

**Esperado:** Status 200 + lista de 3 intentos

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAttempts": 3,
      "blockedAttempts": 1,
      "byType": { "TRANSFER": 3 }
    },
    "attempts": [
      {
        "type": "TRANSFER",
        "amount": "3000.00",
        "reason": "Monto excede el límite máximo",
        "isBlocked": true,
        "blockedUntil": "2026-02-28T15:30:00Z"
      }
    ]
  }
}
```

✅ **HISTORIAL DE INTENTOS FUNCIONANDO**

---

## PASO 1️⃣1️⃣: VER ALERTAS DE FRAUDE ⭐

**Nombre:** Security Endpoints → Ver Alertas Fraude

**En Postman:**
- Método: `GET`
- URL: `http://localhost:3006/nexusBank/v1/security/fraud-alerts`
- Header: `Authorization: Bearer {{token_cliente2}}`

**Esperado:** Status 200 + alerta de tipo EXCESSIVE_FAILED_ATTEMPTS

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalAlerts": 1,
      "activeAlerts": 1,
      "bySeverity": {
        "HIGH": 1
      }
    },
    "alerts": [
      {
        "type": "EXCESSIVE_FAILED_ATTEMPTS",
        "severity": "HIGH",
        "description": "Usuario bloqueado tras 3 intentos fallidos",
        "status": "ACTIVE",
        "failedAttempts": 3,
        "createdAt": "2026-02-28T14:53:45Z"
      }
    ]
  }
}
```

✅ **DETECCIÓN DE FRAUDE FUNCIONANDO**

---

## PASO 1️⃣2️⃣: BONUS - TRANSACCIONES RÁPIDAS

**Nombre:** Bonus → Transacciones Rápidas

### Primero: Login Cliente 3

```
POST http://localhost:3006/nexusBank/v1/auth/login
Content-Type: application/json

{
  "email": "cliente3@test.com",
  "password": "Password123!"
}
```

Guarda el token en `token_cliente3`

### Luego: 3 Transferencias en <5 minutos

Request (ejecuta 3 VECES rápido):

**Usa los números de cuenta del PASO 2 (Cliente 3):**

```
POST http://localhost:3006/nexusBank/v1/accounts/transfers
Authorization: Bearer {{token_cliente3}}
Content-Type: application/json

{
  "sourceAccountNumber": "002-9630694538-2",
  "destinationAccountNumber": "001-5384449684-3",
  "recipientType": "PROPIA",
  "amount": 100
}
```

**Esperado:**
- Status 200 en las 3 (exitosas)
- Pero se crea alerta de transacciones rápidas

### Finalmente: Ver Alertas

**En Postman:**
- Método: `GET`
- URL: `http://localhost:3006/nexusBank/v1/security/fraud-alerts`
- Header: `Authorization: Bearer {{token_cliente3}}`

**Esperado:** Alerta de tipo RAPID_TRANSACTIONS

```json
{
  "alerts": [
    {
      "type": "RAPID_TRANSACTIONS",
      "severity": "MEDIUM",
      "description": "3 transacciones en los últimos 5 minutos",
      "status": "ACTIVE"
    }
  ]
}
```

✅ **DETECCIÓN DE TRANSACCIONES RÁPIDAS FUNCIONANDO**

---

## ✅ CHECKLIST FINAL

```
RATE LIMITING
  ✅ Paso 4: 10 transferencias OK (200)
  ✅ Paso 5: Transferencia 11 rechazada (429)

BLOQUEO TEMPORAL
  ✅ Paso 7: 3 intentos fallidos
  ✅ Paso 8: Transferencia bloqueada (423)

ENDPOINTS NUEVOS
  ✅ Paso 9:  /security/status muestra bloqueado
  ✅ Paso 10: /security/failed-attempts lista intentos
  ✅ Paso 11: /security/fraud-alerts muestra alerta

DETECCIÓN DE FRAUDE
  ✅ Paso 12: Alerta de transacciones rápidas

SISTEMA COMPLETAMENTE FUNCIONAL ✅ ✅ ✅
```

---

## 📊 RESUMEN DE TIEMPOS

```
Pasos 1-2:   5 min (login + listar cuentas)
Pasos 3-5:   5 min (rate limit)
Pasos 6-8:   5 min (bloqueo temporal)
Pasos 9-11:  5 min (endpoints de seguridad)
Paso 12:     5 min (transacciones rápidas)
─────────────────
TOTAL:       ~25 minutos
```

---

**¡Importa esta guía a Postman y prueba cada paso! 🚀**
