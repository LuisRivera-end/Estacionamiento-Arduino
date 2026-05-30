// =============================================================================
// salida.ino — Módulo de SALIDA del Estacionamiento Inteligente
// =============================================================================
// Comunicación directa con el Backend API vía ESP8266 (Wi-Fi) en pines 0 y 1.
// El usuario ingresa su código de ticket (6 caracteres) en el teclado matricial.
// El Arduino envía POST al servidor para validar si el ticket está pagado.
// =============================================================================

#include <Wire.h>
#include <hd44780.h>
#include <hd44780ioClass/hd44780_I2Cexp.h>
#include <Servo.h>
#include <Keypad.h>
#include "wifi_credentials.h"   // Credenciales privadas (gitignored)

hd44780_I2Cexp lcd;
Servo servoMotor;

// =============================================================================
// PINES DE HARDWARE
// =============================================================================
// Pines 0 (RX) y 1 (TX) están reservados EXCLUSIVAMENTE para el módulo
// ESP8266 Wi-Fi conectado al puerto Serial nativo del Arduino Mega.
// NO usar Serial Monitor en producción; usar LCD para debug.
const int wifiRxPin = 0;  // ← Conectar a TX del ESP8266
const int wifiTxPin = 1;  // ← Conectar a RX del ESP8266 (via divisor de voltaje)

const int irPin     = 11;  // Sensor infrarrojo de detección de vehículo
const int servoPin  = 9;   // Servo motor de la barrera
const int buzzerPin = 10;  // Buzzer para retroalimentación sonora

// =============================================================================
// CONFIGURACIÓN DEL DISPOSITIVO
// =============================================================================
const char* DEVICE_ID    = "exit-001";        // Identificador único de este Arduino
const char* DEVICE_TOKEN = DEVICE_TOKEN_EXIT; // Token de wifi_credentials.h

// =============================================================================
// ENDPOINT API
// =============================================================================
// POST /api/v1/arduino/exit/validate
// Body:    {"ticket_code":"A1B2C3","device_id":"exit-001"}
// Headers: X-Device-Id, X-Device-Token, Content-Type: application/json
//
// Respuesta exitosa — salida autorizada (200):
// {
//   "authorized": true,
//   "message": "Salida autorizada",
//   "ticket_code": "A1B2C3",
//   "exit_at": "2026-05-30T10:30:00Z",
//   "available_spaces": 5
// }
//
// Respuesta — pago pendiente (200):
// {
//   "authorized": false,
//   "message": "Pago pendiente",
//   "reason": "payment_required"
// }
//
// Error 404: {"error_code":"ticket_not_found","message":"Ticket no encontrado"}
// Error 409: {"error_code":"ticket_already_exited","message":"El ticket ya fue usado"}
const char* API_PATH = "/api/v1/arduino/exit/validate";

// =============================================================================
// CONFIGURACIÓN DEL TECLADO MATRICIAL 4x4
// =============================================================================
const byte FILAS    = 4;
const byte COLUMNAS = 4;

char matriz[FILAS][COLUMNAS] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

byte pinesFilas[FILAS]       = {A0, 8, 7, 6};
byte pinesColumnas[COLUMNAS] = {5, 4, 3, 2};

Keypad teclado = Keypad(makeKeymap(matriz), pinesFilas, pinesColumnas, FILAS, COLUMNAS);

// =============================================================================
// VARIABLES DE ESTADO
// =============================================================================
const int LONGITUD_TICKET = 6;   // Tickets de 6 caracteres (0-9, A-D)
String codigoIngresado = "";
String pantallaActual = "";
bool wifiConectado = false;

// Tiempo extra antes de bajar el servo tras salida
const unsigned long DELAY_BAJADA_SERVO = 4000; // 4 segundos

// =============================================================================
// BUFFER DE RESPUESTA HTTP
// =============================================================================
const int BUFFER_SIZE = 512;
char respuestaBuffer[BUFFER_SIZE];

// =============================================================================
// SETUP
// =============================================================================
void setup() {
  // Serial nativo (pines 0 y 1) → comunicación con ESP8266
  Serial.begin(9600);

  pinMode(irPin, INPUT);
  pinMode(buzzerPin, OUTPUT);

  lcd.begin(16, 2);
  lcd.backlight();

  servoMotor.attach(servoPin);
  servoMotor.write(0);

  lcd.setCursor(0, 0);
  lcd.print("Mod. Salida");
  lcd.setCursor(0, 1);
  lcd.print("Conectando WiFi");

  // --- Inicializar conexión Wi-Fi del ESP8266 ---
  wifiConectado = inicializarWiFi();

  lcd.clear();
  if (wifiConectado) {
    lcd.setCursor(0, 0);
    lcd.print("WiFi Conectado!");
    lcd.setCursor(0, 1);
    lcd.print("Sistema Listo");
  } else {
    lcd.setCursor(0, 0);
    lcd.print("ERROR WiFi!");
    lcd.setCursor(0, 1);
    lcd.print("Reinicie modulo");
  }
  delay(2000);
  lcd.clear();
  mostrarSalida();
}

// =============================================================================
// LOOP PRINCIPAL
// =============================================================================
void loop() {
  // --- Verificar conexión WiFi ---
  if (!wifiConectado) {
    lcd.setCursor(0, 0);
    lcd.print("WiFi Desconect.");
    lcd.setCursor(0, 1);
    lcd.print("Reconectando...");
    wifiConectado = inicializarWiFi();
    if (wifiConectado) {
      lcd.clear();
      pantallaActual = "";
    }
    delay(5000);
    return;
  }

  // --- BLOQUEO PRINCIPAL ---
  // Si no hay vehículo frente al sensor, no permite usar el teclado
  if (digitalRead(irPin) == HIGH) {
    codigoIngresado = "";
    mostrarSalida();
    return;
  }

  // Si hay vehículo, permite ingresar ticket
  if (pantallaActual != "INGRESE") {
    mostrarIngreseTicket();
  }

  char tecla = teclado.getKey();

  if (tecla) {
    tone(buzzerPin, 2000, 50); // Beep de retroalimentación

    if (tecla == '*') {
      // --- Confirmar: validar ticket contra el servidor ---
      if (codigoIngresado.length() == LONGITUD_TICKET) {
        verificarTicket();
      } else {
        lcd.setCursor(0, 1);
        lcd.print("Faltan digitos! ");
        delay(1500);
        actualizarPantalla();
      }

    } else if (tecla == '#') {
      // --- Borrar último carácter ---
      if (codigoIngresado.length() > 0) {
        codigoIngresado.remove(codigoIngresado.length() - 1);
        actualizarPantalla();
      }

    } else if (codigoIngresado.length() < LONGITUD_TICKET) {
      // --- Agregar carácter (0-9, A-D) ---
      codigoIngresado += tecla;
      actualizarPantalla();
    }
  }
}

// =============================================================================
// FUNCIONES DE INTERFAZ LCD
// =============================================================================

void mostrarSalida() {
  if (pantallaActual != "SALIDA") {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("SALIDA");
    lcd.setCursor(0, 1);
    lcd.print("Sin vehiculo");
    pantallaActual = "SALIDA";
  }
}

void mostrarIngreseTicket() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ingrese Ticket:");
  lcd.setCursor(0, 1);
  lcd.print(codigoIngresado);
  pantallaActual = "INGRESE";
}

void actualizarPantalla() {
  lcd.setCursor(0, 1);
  lcd.print("                ");
  lcd.setCursor(0, 1);
  lcd.print(codigoIngresado);
}

// =============================================================================
// VERIFICAR TICKET — Enviar POST al servidor
// =============================================================================
void verificarTicket() {
  // Seguridad: si el vehículo ya no está, cancelar
  if (digitalRead(irPin) == HIGH) {
    codigoIngresado = "";
    mostrarSalida();
    return;
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Verificando...");
  lcd.setCursor(0, 1);
  lcd.print("Espere...");

  // Construir JSON body
  String jsonBody = "{\"ticket_code\":\"";
  jsonBody += codigoIngresado;
  jsonBody += "\",\"device_id\":\"";
  jsonBody += DEVICE_ID;
  jsonBody += "\"}";

  // Enviar POST al servidor
  int httpCode = enviarHTTPPost(API_PATH, jsonBody);

  lcd.clear();
  lcd.setCursor(0, 0);

  if (httpCode == 200) {
    // --- Parsear respuesta ---
    String autorizado = extraerValorJSON("authorized");
    String mensaje    = extraerValorJSON("message");
    String razon      = extraerValorJSON("reason");

    if (autorizado == "true") {
      // ✅ SALIDA AUTORIZADA
      lcd.print("Salida OK!");
      lcd.setCursor(0, 1);
      lcd.print("Abriendo...");

      // Sonido de éxito
      tone(buzzerPin, 2500, 150);
      delay(200);
      tone(buzzerPin, 2500, 150);

      // Abrir barrera
      servoMotor.write(90);

      // Esperar a que el vehículo pase
      unsigned long tInicio = millis();
      while (digitalRead(irPin) == LOW && millis() - tInicio < 10000) {
        delay(100);
      }

      // Vehículo salió, esperar antes de cerrar
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Vehiculo salio");
      lcd.setCursor(0, 1);
      lcd.print("Cerrando...");

      delay(DELAY_BAJADA_SERVO);
      servoMotor.write(0); // Cerrar barrera

    } else {
      // ❌ NO AUTORIZADO
      if (razon == "payment_required") {
        lcd.print("PAGO PENDIENTE");
        lcd.setCursor(0, 1);
        lcd.print("Pague primero");
      } else {
        lcd.print("NO AUTORIZADO");
        lcd.setCursor(0, 1);
        // Mostrar mensaje del servidor (truncado a 16 chars)
        if (mensaje.length() > 16) mensaje = mensaje.substring(0, 16);
        lcd.print(mensaje);
      }

      // Sonido de error
      tone(buzzerPin, 800, 800);
      delay(3000);
    }

  } else if (httpCode == 404) {
    // Ticket no encontrado
    lcd.print("TICKET NO");
    lcd.setCursor(0, 1);
    lcd.print("ENCONTRADO");
    tone(buzzerPin, 500, 1000);
    delay(3000);

  } else if (httpCode == 409) {
    // Ticket ya usado
    lcd.print("TICKET YA");
    lcd.setCursor(0, 1);
    lcd.print("UTILIZADO");
    tone(buzzerPin, 600, 800);
    delay(3000);

  } else if (httpCode == 401 || httpCode == 403) {
    lcd.print("ERROR:");
    lcd.setCursor(0, 1);
    lcd.print("Auth Invalida");
    delay(3000);

  } else {
    lcd.print("ERROR:");
    lcd.setCursor(0, 1);
    lcd.print("Sin conexion");
    delay(3000);
  }

  codigoIngresado = "";
  pantallaActual = "";
}

// =============================================================================
// FUNCIONES DE COMUNICACIÓN ESP8266 (AT Commands)
// =============================================================================

// --- Inicializar WiFi ---
bool inicializarWiFi() {
  // Reset del módulo
  enviarAT("AT+RST", "ready", 5000);
  delay(1000);

  // Modo estación (cliente WiFi)
  if (!enviarAT("AT+CWMODE=1", "OK", 3000)) {
    return false;
  }

  // Conectar a la red WiFi
  String cmdJoin = "AT+CWJAP=\"";
  cmdJoin += WIFI_SSID;
  cmdJoin += "\",\"";
  cmdJoin += WIFI_PASS;
  cmdJoin += "\"";
  if (!enviarAT(cmdJoin.c_str(), "OK", 15000)) {
    return false;
  }

  // Modo conexión única (cliente)
  enviarAT("AT+CIPMUX=0", "OK", 3000);

  return true;
}

// --- Enviar comando AT y esperar respuesta ---
bool enviarAT(const char* comando, const char* respuestaEsperada, unsigned long timeout) {
  // Limpiar buffer de entrada
  while (Serial.available()) Serial.read();

  Serial.println(comando);

  unsigned long inicio = millis();
  String respuesta = "";

  while (millis() - inicio < timeout) {
    while (Serial.available()) {
      char c = Serial.read();
      respuesta += c;
    }
    if (respuesta.indexOf(respuestaEsperada) >= 0) {
      return true;
    }
    if (respuesta.indexOf("FAIL") >= 0 || respuesta.indexOf("ERROR") >= 0) {
      return false;
    }
    delay(10);
  }
  return false;
}

// --- Enviar petición HTTP POST y devolver código de estado ---
int enviarHTTPPost(const char* path, String& jsonBody) {
  // Limpiar buffer de respuesta
  memset(respuestaBuffer, 0, BUFFER_SIZE);

  // Abrir conexión TCP/SSL al servidor
  String cmdConnect = "AT+CIPSTART=\"";
  cmdConnect += USE_SSL ? "SSL" : "TCP";
  cmdConnect += "\",\"";
  cmdConnect += SERVER_HOST;
  cmdConnect += "\",";
  cmdConnect += SERVER_PORT;

  if (!enviarAT(cmdConnect.c_str(), "OK", 10000)) {
    return -1; // Error de conexión
  }

  // Construir petición HTTP completa
  String httpReq = "POST ";
  httpReq += path;
  httpReq += " HTTP/1.1\r\n";
  httpReq += "Host: ";
  httpReq += SERVER_HOST;
  httpReq += "\r\n";
  httpReq += "Content-Type: application/json\r\n";
  httpReq += "X-Device-Id: ";
  httpReq += DEVICE_ID;
  httpReq += "\r\n";
  httpReq += "X-Device-Token: ";
  httpReq += DEVICE_TOKEN;
  httpReq += "\r\n";
  httpReq += "Content-Length: ";
  httpReq += jsonBody.length();
  httpReq += "\r\n";
  httpReq += "Connection: close\r\n\r\n";
  httpReq += jsonBody;

  // Indicar al ESP8266 cuántos bytes se enviarán
  String cmdSend = "AT+CIPSEND=";
  cmdSend += httpReq.length();
  if (!enviarAT(cmdSend.c_str(), ">", 5000)) {
    enviarAT("AT+CIPCLOSE", "OK", 3000);
    return -2; // Error al preparar envío
  }

  // Enviar la petición HTTP
  Serial.print(httpReq);

  // Leer respuesta del servidor
  unsigned long inicio = millis();
  int idx = 0;
  bool cerrado = false;

  while (millis() - inicio < 15000 && !cerrado) {
    while (Serial.available() && idx < BUFFER_SIZE - 1) {
      respuestaBuffer[idx++] = Serial.read();
    }
    if (strstr(respuestaBuffer, "CLOSED") != NULL) {
      cerrado = true;
    }
    delay(10);
  }
  respuestaBuffer[idx] = '\0';

  // Extraer código de estado HTTP
  char* statusLine = strstr(respuestaBuffer, "HTTP/1.1 ");
  if (statusLine != NULL) {
    return atoi(statusLine + 9); // "HTTP/1.1 200" → 200
  }

  return -3; // No se pudo parsear la respuesta
}

// =============================================================================
// FUNCIONES DE PARSING JSON (sin librería externa)
// =============================================================================

// Extrae el valor de una clave JSON string del buffer de respuesta.
// Funciona para strings ("key":"value") y números/booleanos ("key":123, "key":true).
String extraerValorJSON(const char* clave) {
  String bufStr = String(respuestaBuffer);
  String buscar = "\"";
  buscar += clave;
  buscar += "\"";

  int pos = bufStr.indexOf(buscar);
  if (pos < 0) return "";

  // Avanzar hasta después del ":"
  pos = bufStr.indexOf(':', pos);
  if (pos < 0) return "";
  pos++; // Saltar el ':'

  // Saltar espacios
  while (pos < (int)bufStr.length() && bufStr.charAt(pos) == ' ') pos++;

  if (bufStr.charAt(pos) == '"') {
    // Valor tipo string
    int inicio = pos + 1;
    int fin = bufStr.indexOf('"', inicio);
    if (fin < 0) return "";
    return bufStr.substring(inicio, fin);
  } else {
    // Valor numérico o booleano
    int inicio = pos;
    int fin = inicio;
    while (fin < (int)bufStr.length()) {
      char c = bufStr.charAt(fin);
      if (c == ',' || c == '}' || c == ' ' || c == '\r' || c == '\n') break;
      fin++;
    }
    return bufStr.substring(inicio, fin);
  }
}