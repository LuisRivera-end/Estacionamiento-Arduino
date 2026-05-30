// =============================================================================
// entrada.ino — Módulo de ENTRADA del Estacionamiento Inteligente
// =============================================================================
// Comunicación directa con el Backend API vía ESP8266 (Wi-Fi) en pines 0 y 1.
// Al detectar un vehículo, envía POST al servidor para crear un ticket y
// muestra el código recibido en el LCD.
// =============================================================================

#include <Wire.h>
#include <hd44780.h>
#include <hd44780ioClass/hd44780_I2Cexp.h>
#include <Servo.h>
#include "wifi_credentials.h"   // Credenciales privadas

hd44780_I2Cexp lcd;
Servo servoMotor;

// =============================================================================
// PINES DE HARDWARE
// =============================================================================
// Pines 0 (RX) y 1 (TX) están reservados EXCLUSIVAMENTE para el módulo
// ESP8266 Wi-Fi conectado al puerto Serial nativo del Arduino UNO.
const int wifiRxPin = 0;  // ← Conectar a TX del ESP8266
const int wifiTxPin = 1;  // ← Conectar a RX del ESP8266 (via divisor de voltaje)

const int irPin    = 7;   // Sensor infrarrojo de detección de vehículo
const int servoPin = 9;   // Servo motor de la barrera

// =============================================================================
// CONFIGURACIÓN DEL DISPOSITIVO
// =============================================================================
const char* DEVICE_ID  = "entry-001";      // Identificador único de este Arduino
const char* DEVICE_TOKEN = DEVICE_TOKEN_ENTRY; // Token de wifi_credentials.h

// =============================================================================
// ENDPOINT API
// =============================================================================
// POST /api/v1/arduino/entry/tickets
// Body:    {"device_id":"entry-001"}
// Headers: X-Device-Id, X-Device-Token, Content-Type: application/json
//
// Respuesta exitosa (200):
// {
//   "ticket_code": "A1B2C3",
//   "entry_at": "2026-05-30T08:00:00Z",
//   "status": "active",
//   "payment_status": "unpaid",
//   "available_spaces": 4
// }
//
// Error 409 (estacionamiento lleno):
// {"error_code":"parking_full","message":"Estacionamiento lleno"}
const char* API_PATH = "/api/v1/arduino/entry/tickets";

// =============================================================================
// VARIABLES DE ESTADO
// =============================================================================
int lugaresDisponibles = -1;  // Se obtiene del servidor (-1 = desconocido)
int ultimoEstadoLugares = -2; // Para detectar cambios en LCD
bool wifiConectado = false;

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

  lcd.begin(16, 2);
  lcd.backlight();

  servoMotor.attach(servoPin);
  servoMotor.write(0);

  lcd.setCursor(0, 0);
  lcd.print("Mod. Entrada");
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
}

// =============================================================================
// LOOP PRINCIPAL
// =============================================================================
void loop() {
  if (!wifiConectado) {
    // Intentar reconexión cada 10 segundos
    lcd.setCursor(0, 0);
    lcd.print("WiFi Desconect.");
    lcd.setCursor(0, 1);
    lcd.print("Reconectando...");
    wifiConectado = inicializarWiFi();
    if (wifiConectado) {
      lcd.clear();
      ultimoEstadoLugares = -2; // Forzar re-dibujo
    }
    delay(5000);
    return;
  }

  // --- Mostrar estado de disponibilidad ---
  if (lugaresDisponibles > 0) {
    if (lugaresDisponibles != ultimoEstadoLugares) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Disponibles: ");
      lcd.print(lugaresDisponibles);
      lcd.setCursor(0, 1);
      lcd.print("Acerque Vehiculo");
      ultimoEstadoLugares = lugaresDisponibles;
    }

    // --- Detectar vehículo con sensor IR ---
    if (digitalRead(irPin) == LOW) {
      registrarEntrada();
    }
  } else if (lugaresDisponibles == 0) {
    if (lugaresDisponibles != ultimoEstadoLugares) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("ESTACIONAMIENTO");
      lcd.setCursor(0, 1);
      lcd.print("   LLENO  X   ");
      ultimoEstadoLugares = lugaresDisponibles;
    }
  } else {
    // lugaresDisponibles == -1 → primer arranque, aún no sabemos
    if (ultimoEstadoLugares != -1) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Acerque Vehiculo");
      lcd.setCursor(0, 1);
      lcd.print("Sistema Activo");
      ultimoEstadoLugares = -1;
    }
    if (digitalRead(irPin) == LOW) {
      registrarEntrada();
    }
  }

  delay(10);
}

// =============================================================================
// REGISTRAR ENTRADA — Enviar POST al servidor
// =============================================================================
void registrarEntrada() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Registrando...");
  lcd.setCursor(0, 1);
  lcd.print("Espere...");

  // Construir JSON body
  String jsonBody = "{\"device_id\":\"";
  jsonBody += DEVICE_ID;
  jsonBody += "\"}";

  // Enviar POST al servidor
  int httpCode = enviarHTTPPost(API_PATH, jsonBody);

  if (httpCode == 200) {
    // --- Parsear respuesta exitosa ---
    String ticketCode = extraerValorJSON("ticket_code");
    String espacios   = extraerValorJSON("available_spaces");

    if (ticketCode.length() > 0) {
      // Actualizar lugares disponibles desde el servidor
      if (espacios.length() > 0) {
        lugaresDisponibles = espacios.toInt();
      }

      // Mostrar ticket en LCD
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Ticket Generado");
      lcd.setCursor(0, 1);
      lcd.print("Cod: ");
      lcd.print(ticketCode);

      // Abrir barrera
      servoMotor.write(90);

      // Esperar a que el vehículo pase
      unsigned long tInicio = millis();
      while (digitalRead(irPin) == LOW && millis() - tInicio < 8000) {
        delay(100);
      }

      delay(800);
      servoMotor.write(0); // Cerrar barrera
    } else {
      mostrarError("Error Respuesta");
    }
  } else if (httpCode == 409) {
    // Estacionamiento lleno
    lugaresDisponibles = 0;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("ESTACIONAMIENTO");
    lcd.setCursor(0, 1);
    lcd.print("   LLENO  X   ");
    delay(3000);
  } else if (httpCode == 401 || httpCode == 403) {
    mostrarError("Auth Invalida");
  } else {
    mostrarError("Error Servidor");
  }

  ultimoEstadoLugares = -2; // Forzar re-dibujo del estado
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

  // Modo conexión única
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
// Funciona para strings ("key":"value") y números ("key":123).
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

// =============================================================================
// UTILIDADES LCD
// =============================================================================

void mostrarError(const char* mensaje) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("ERROR:");
  lcd.setCursor(0, 1);
  lcd.print(mensaje);
  delay(3000);
}