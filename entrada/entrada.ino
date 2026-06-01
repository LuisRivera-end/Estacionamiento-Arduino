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
const char* DEVICE_ID  = "entrada-01";     // Identificador registrado en backend
const char* DEVICE_TOKEN = DEVICE_TOKEN_ENTRY; // Token de wifi_credentials.h

// =============================================================================
// ENDPOINT API
// =============================================================================
// POST /api/v1/arduino/entry/tickets
// Body:    {"device_id":"entrada-01"}
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
String ultimaRespuestaAT = "";

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
  lcd.print(F("Mod. Entrada"));
  lcd.setCursor(0, 1);
  lcd.print(F("Conectando WiFi"));

  // --- Inicializar conexión Wi-Fi del ESP8266 ---
  wifiConectado = inicializarWiFi();

  lcd.clear();
  if (wifiConectado) {
    lcd.setCursor(0, 0);
    lcd.print(F("WiFi Conectado!"));
    lcd.setCursor(0, 1);
    lcd.print(F("Sistema Listo"));
  } else {
    lcd.setCursor(0, 0);
    lcd.print(F("ERROR WiFi!"));
    lcd.setCursor(0, 1);
    lcd.print(F("Reinicie modulo"));
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
    lcd.print(F("WiFi Desconect."));
    lcd.setCursor(0, 1);
    lcd.print(F("Reconectando..."));
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
      lcd.print(F("Disponibles: "));
      lcd.print(lugaresDisponibles);
      lcd.setCursor(0, 1);
      lcd.print(F("Acerque Vehiculo"));
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
      lcd.print(F("ESTACIONAMIENTO"));
      lcd.setCursor(0, 1);
      lcd.print(F("   LLENO  X   "));
      ultimoEstadoLugares = lugaresDisponibles;
    }
  } else {
    // lugaresDisponibles == -1 → primer arranque, aún no sabemos
    if (ultimoEstadoLugares != -1) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print(F("Acerque Vehiculo"));
      lcd.setCursor(0, 1);
      lcd.print(F("Sistema Activo"));
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
  lcd.print(F("Registrando..."));
  lcd.setCursor(0, 1);
  lcd.print(F("Espere..."));

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
      lcd.print(F("Ticket Generado"));
      lcd.setCursor(0, 1);
      lcd.print(F("Cod: "));
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
      mostrarError(F("Error Respuesta"));
    }
  } else if (httpCode == 409) {
    // Estacionamiento lleno
    lugaresDisponibles = 0;
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print(F("ESTACIONAMIENTO"));
    lcd.setCursor(0, 1);
    lcd.print(F("   LLENO  X   "));
    delay(3000);
  } else if (httpCode == 401 || httpCode == 403) {
    mostrarError(F("Auth Invalida"));
  } else {
    mostrarError(F("Error Servidor"));
  }

  ultimoEstadoLugares = -2; // Forzar re-dibujo del estado
}

// =============================================================================
// FUNCIONES DE COMUNICACIÓN ESP8266 (AT Commands)
// =============================================================================

// --- Funciones auxiliares para mostrar progreso en LCD ---
void mostrarPasoLCD(const __FlashStringHelper* linea1, const __FlashStringHelper* linea2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(linea1);
  lcd.setCursor(0, 1);
  lcd.print(linea2);
  delay(600); // Pausa de legibilidad
}

void mostrarPasoLCD(const __FlashStringHelper* linea1, const char* linea2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(linea1);
  lcd.setCursor(0, 1);
  lcd.print(linea2);
  delay(600); // Pausa de legibilidad
}

void mostrarPasoLCD(const char* linea1, const char* linea2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(linea1);
  lcd.setCursor(0, 1);
  lcd.print(linea2);
  delay(600); // Pausa de legibilidad
}

// --- Inicializar WiFi ---
bool inicializarWiFi() {
  // Reset del módulo
  mostrarPasoLCD(F("WiFi: Reset..."), F("AT+RST"));
  enviarAT("AT+RST", "ready", 5000);
  delay(1000);

  // Modo estación (cliente WiFi)
  mostrarPasoLCD(F("WiFi: Modo..."), F("AT+CWMODE=1"));
  if (!enviarAT("AT+CWMODE=1", "OK", 3000)) {
    mostrarPasoLCD(F("WiFi ERROR:"), F("Modo Estacion"));
    mostrarRespuestaAT();
    delay(2000);
    return false;
  }

  enviarAT("AT+CWQAP", "OK", 5000);
  delay(500);

  // Conectar a la red WiFi
  mostrarPasoLCD(F("WiFi: Conectando"), F(WIFI_SSID));
  String cmdJoin = "AT+CWJAP=\"";
  cmdJoin += WIFI_SSID;
  cmdJoin += "\",\"";
  cmdJoin += WIFI_PASS;
  cmdJoin += "\"";
  if (!enviarAT(cmdJoin.c_str(), "OK", 30000)) {
    mostrarPasoLCD(F("WiFi ERROR:"), F("Fallo conexion"));
    mostrarRespuestaAT();
    delay(2000);
    return false;
  }

  // Limpiar configuracion previa de pruebas donde el ESP8266 funcionaba
  // como servidor local en puerto 80.
  enviarAT("AT+CIPCLOSE", "OK", 2000);
  enviarAT("AT+CIPSERVER=0", "OK", 3000);

  // Modo conexion multiple: firmware AT viejo suele ser mas estable con link ID.
  mostrarPasoLCD(F("WiFi: Multi Mux"), F("AT+CIPMUX=1"));
  if (!enviarAT("AT+CIPMUX=1", "OK", 3000)) {
    mostrarPasoLCD(F("WiFi ERROR:"), F("CIPMUX=1"));
    delay(2000);
    return false;
  }
  enviarAT("AT+CIPMODE=0", "OK", 3000);

  // Configurar SSL antes de abrir conexiones HTTPS.
  // SNI es necesario para varios hosts modernos, incluido Render.
  if (USE_SSL) {
    enviarAT("AT+CIPSSLCCONF=0", "OK", 3000);  // Sin validacion de certificado
    String cmdSni = "AT+CIPSSLCSNI=\"";
    cmdSni += SERVER_HOST;
    cmdSni += "\"";
    if (!enviarAT(cmdSni.c_str(), "OK", 3000)) {
      mostrarPasoLCD(F("SSL ERROR:"), F("SNI no soportado"));
      delay(2500);
      return false;
    }
    enviarAT("AT+CIPSSLSIZE=4096", "OK", 3000); // Firmware AT antiguo
  }

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
      ultimaRespuestaAT = respuesta;
      return true;
    }
    if (respuesta.indexOf("FAIL") >= 0 || respuesta.indexOf("ERROR") >= 0) {
      ultimaRespuestaAT = respuesta;
      return false;
    }
    delay(10);
  }
  ultimaRespuestaAT = respuesta;
  return false;
}

bool conexionActivaAT() {
  enviarAT("AT+CIPSTATUS", "OK", 5000);
  return ultimaRespuestaAT.indexOf("STATUS:3") >= 0 ||
         ultimaRespuestaAT.indexOf("+CIPSTATUS:0,\"TCP\"") >= 0 ||
         ultimaRespuestaAT.indexOf("0,\"TCP\"") >= 0 ||
         ultimaRespuestaAT.indexOf("\"TCP\"") >= 0;
}

bool abrirConexionAT(const char* comando, unsigned long timeout) {
  while (Serial.available()) Serial.read();

  Serial.println(comando);

  unsigned long inicio = millis();
  String respuesta = "";
  bool estadoConsultado = false;

  while (millis() - inicio < timeout) {
    while (Serial.available()) {
      char c = Serial.read();
      respuesta += c;
    }
    ultimaRespuestaAT = respuesta;
    if (respuesta.indexOf("FAIL") >= 0 || respuesta.indexOf("ERROR") >= 0) {
      return false;
    }
    if (respuesta.indexOf("OK") >= 0 ||
        respuesta.indexOf("CONNECT") >= 0 ||
        respuesta.indexOf("Linked") >= 0 ||
        respuesta.indexOf("ALREADY CONNECTED") >= 0) {
      return true;
    }
    if (!estadoConsultado && millis() - inicio > 5000 && respuesta.indexOf("AT+CIPSTART") >= 0) {
      estadoConsultado = true;
      if (conexionActivaAT()) {
        return true;
      }
      Serial.println(comando);
    }
    delay(10);
  }
  return conexionActivaAT();
}

// --- Enviar petición HTTP POST y devolver código de estado ---
int enviarHTTPPost(const char* path, String& jsonBody) {
  // Limpiar buffer de respuesta
  memset(respuestaBuffer, 0, BUFFER_SIZE);

  mostrarPasoLCD(F("API: Conectando"), F(SERVER_HOST));
  // Abrir conexión TCP/SSL al servidor
  String cmdConnect = "AT+CIPSTART=0,\"";
  cmdConnect += USE_SSL ? "SSL" : "TCP";
  cmdConnect += "\",\"";
  cmdConnect += SERVER_HOST;
  cmdConnect += "\",";
  cmdConnect += SERVER_PORT;

  enviarAT("AT+CIPCLOSE=0", "OK", 2000); // Cerrar conexion previa si quedo abierta
  delay(200);

  if (!abrirConexionAT(cmdConnect.c_str(), 25000)) {
    mostrarPasoLCD(F("API ERROR:"), F("TCP Connect"));
    mostrarRespuestaAT();
    delay(2000);
    return -1; // Error de conexión
  }

  int contentLength = jsonBody.length();
  String contentLengthText = String(contentLength);
  int httpLength =
    (sizeof("POST ") - 1) + strlen(path) + (sizeof(" HTTP/1.1\r\n") - 1) +
    (sizeof("Host: ") - 1) + strlen(SERVER_HOST) + (sizeof("\r\n") - 1) +
    (sizeof("Content-Type: application/json\r\n") - 1) +
    (sizeof("X-Device-Id: ") - 1) + strlen(DEVICE_ID) + (sizeof("\r\n") - 1) +
    (sizeof("X-Device-Token: ") - 1) + strlen(DEVICE_TOKEN) + (sizeof("\r\n") - 1) +
    (sizeof("Content-Length: ") - 1) + contentLengthText.length() + (sizeof("\r\n") - 1) +
    (sizeof("Connection: close\r\n\r\n") - 1) +
    contentLength;

  mostrarPasoLCD(F("API: Preparando"), F("Envio..."));
  // Indicar al ESP8266 cuántos bytes se enviarán
  String cmdSend = "AT+CIPSEND=0,";
  cmdSend += httpLength;
  if (!enviarAT(cmdSend.c_str(), ">", 10000)) {
    mostrarPasoLCD(F("API ERROR:"), F("Send init"));
    if (ultimaRespuestaAT.length() == 0) {
      enviarAT("AT+CIPSTATUS", "OK", 3000);
    }
    mostrarRespuestaAT();
    enviarAT("AT+CIPCLOSE=0", "OK", 3000);
    delay(2000);
    return -2; // Error al preparar envío
  }

  mostrarPasoLCD(F("API: Enviando"), path);
  // Enviar la petición HTTP
  Serial.print(F("POST "));
  Serial.print(path);
  Serial.print(F(" HTTP/1.1\r\nHost: "));
  Serial.print(SERVER_HOST);
  Serial.print(F("\r\nContent-Type: application/json\r\nX-Device-Id: "));
  Serial.print(DEVICE_ID);
  Serial.print(F("\r\nX-Device-Token: "));
  Serial.print(DEVICE_TOKEN);
  Serial.print(F("\r\nContent-Length: "));
  Serial.print(contentLengthText);
  Serial.print(F("\r\nConnection: close\r\n\r\n"));
  Serial.print(jsonBody);

  mostrarPasoLCD(F("API: Esperando"), F("Respuesta..."));
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
  char* statusLine = strstr(respuestaBuffer, "HTTP/1.");
  if (statusLine != NULL) {
    int code = atoi(statusLine + 9); // "HTTP/1.x 200" -> 200
    String codeStr = "HTTP Code: ";
    codeStr += code;
    mostrarPasoLCD(F("API: Completado"), codeStr.c_str());
    delay(1000);
    return code;
  }

  mostrarPasoLCD(F("API ERROR:"), F("No status code"));
  delay(2000);
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

void mostrarError(const __FlashStringHelper* mensaje) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(F("ERROR:"));
  lcd.setCursor(0, 1);
  lcd.print(mensaje);
  delay(3000);
}

void mostrarError(const char* mensaje) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(F("ERROR:"));
  lcd.setCursor(0, 1);
  lcd.print(mensaje);
  delay(3000);
}

void mostrarRespuestaAT() {
  String detalle = ultimaRespuestaAT;
  detalle.replace("\r", " ");
  detalle.replace("\n", " ");
  detalle.trim();

  if (detalle.length() == 0) {
    detalle = "timeout";
  } else if (detalle.indexOf("STATUS:") >= 0) {
    int pos = detalle.indexOf("STATUS:");
    String estado = detalle.substring(pos, pos + 8);
    if (detalle.indexOf("\"TCP\"") >= 0 || detalle.indexOf("+CIPSTATUS") >= 0) {
      estado += " TCP";
    }
    detalle = estado;
  } else if (detalle.indexOf("busy") >= 0) {
    detalle = "busy";
  } else if (detalle.indexOf("link") >= 0) {
    detalle = "sin link";
  } else if (detalle.indexOf("ERROR") >= 0) {
    detalle = "ERROR";
  } else if (detalle.indexOf("FAIL") >= 0) {
    detalle = "FAIL";
  } else if (detalle.indexOf("CLOSED") >= 0) {
    detalle = "CLOSED";
  }

  if (detalle.length() > 16) {
    detalle = detalle.substring(0, 16);
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(F("AT resp:"));
  lcd.setCursor(0, 1);
  lcd.print(detalle);
  delay(3000);
}
