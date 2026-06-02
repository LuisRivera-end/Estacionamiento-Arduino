// =============================================================================
// salida.ino — Módulo de SALIDA del Estacionamiento Inteligente
// Reconstruido con SoftwareSerial en pines 12 (RX) y 13 (TX)
//
// CONEXIONES ESP8266:
//   ESP TX   →  Pin 12 del Arduino  (directo)
//   ESP RX   →  Pin 13 del Arduino  (con divisor de voltaje 1kΩ / 2kΩ)
//   ESP VCC  →  3.3 V
//   ESP GND  →  GND
//   ESP CH_PD → 3.3 V
//
// ⚠ Pin 13 tiene LED integrado — parpadeará al transmitir, es normal.
//
// Serial (USB) queda libre para debug; ciérralo en producción si interfiere.
// =============================================================================

#include <Wire.h>
#include <hd44780.h>
#include <hd44780ioClass/hd44780_I2Cexp.h>
#include <Servo.h>
#include <Keypad.h>
#include <SoftwareSerial.h>
#include "wifi_credentials.h"   // WIFI_SSID, WIFI_PASS, DEVICE_TOKEN_EXIT,
                                 // SERVER_HOST, SERVER_PORT, USE_SSL

// =============================================================================
// PERIFÉRICOS
// =============================================================================
hd44780_I2Cexp  lcd;
Servo           servoMotor;
SoftwareSerial  espSerial(12, 13);  // RX=12 ← ESP TX  |  TX=13 → ESP RX

// =============================================================================
// PINES
// =============================================================================
const int IR_PIN     = 11;
const int SERVO_PIN  = 9;
const int BUZZER_PIN = 10;

// =============================================================================
// CONFIGURACIÓN DEL DISPOSITIVO
// =============================================================================
const char* DEVICE_ID    = "salida-01";
const char* DEVICE_TOKEN = DEVICE_TOKEN_EXIT;

// =============================================================================
// ENDPOINT API
// =============================================================================
// POST /api/v1/arduino/exit/validate
// Body:    {"ticket_code":"A1B2C3","device_id":"salida-01"}
// Headers: X-Device-Id, X-Device-Token, Content-Type: application/json
const char* API_PATH = "/api/v1/arduino/exit/validate";

// =============================================================================
// TECLADO MATRICIAL 4x4
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
const int   LONGITUD_TICKET        = 6;
const unsigned long DELAY_SERVO_MS = 4000;
const int   BUFFER_SIZE            = 224;

String codigoIngresado  = "";
String pantallaActual   = "";
bool   wifiConectado    = false;
char   ultimaRespuestaAT[80] = "";
char   respuestaBuffer[BUFFER_SIZE];

// =============================================================================
// SETUP
// =============================================================================
void setup() {
  Serial.begin(9600);       // Debug → USB/PC (cierra Serial Monitor en producción)
  espSerial.begin(9600);    // ESP8266 exclusivo → pines 12/13

  pinMode(IR_PIN,     INPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  lcd.begin(16, 2);
  lcd.backlight();

  servoMotor.attach(SERVO_PIN);
  servoMotor.write(0);

  lcd.setCursor(0, 0); lcd.print(F("Mod. Salida"));
  lcd.setCursor(0, 1); lcd.print(F("Conectando WiFi"));

  Serial.println(F("[BOOT] Iniciando modulo salida..."));

  wifiConectado = inicializarWiFi();

  lcd.clear();
  if (wifiConectado) {
    lcd.setCursor(0, 0); lcd.print(F("WiFi Conectado!"));
    lcd.setCursor(0, 1); lcd.print(F("Sistema Listo"));
    Serial.println(F("[WiFi] Conectado OK"));
  } else {
    lcd.setCursor(0, 0); lcd.print(F("ERROR WiFi!"));
    lcd.setCursor(0, 1); lcd.print(F("Reinicie modulo"));
    Serial.println(F("[WiFi] FALLO la conexion"));
  }
  delay(2000);
  lcd.clear();
  mostrarSalida();
}

// =============================================================================
// LOOP
// =============================================================================
void loop() {
  // Reconexión automática si se perdió el WiFi
  if (!wifiConectado) {
    lcd.setCursor(0, 0); lcd.print(F("WiFi Desconect."));
    lcd.setCursor(0, 1); lcd.print(F("Reconectando..."));
    wifiConectado = inicializarWiFi();
    if (wifiConectado) { lcd.clear(); pantallaActual = ""; }
    delay(5000);
    return;
  }

  // Sin vehículo → no permitir teclado
  if (digitalRead(IR_PIN) == HIGH) {
    codigoIngresado = "";
    mostrarSalida();
    return;
  }

  // Vehículo detectado → mostrar prompt
  if (pantallaActual != "INGRESE") mostrarIngreseTicket();

  char tecla = teclado.getKey();
  if (!tecla) return;

  tone(BUZZER_PIN, 2000, 50);

  if (tecla == '*') {
    if (codigoIngresado.length() == LONGITUD_TICKET) {
      verificarTicket();
    } else {
      lcd.setCursor(0, 1); lcd.print(F("Faltan digitos! "));
      delay(1500);
      actualizarPantalla();
    }
  } else if (tecla == '#') {
    if (codigoIngresado.length() > 0) {
      codigoIngresado.remove(codigoIngresado.length() - 1);
      actualizarPantalla();
    }
  } else if (codigoIngresado.length() < LONGITUD_TICKET) {
    codigoIngresado += tecla;
    actualizarPantalla();
  }
}

// =============================================================================
// INTERFAZ LCD
// =============================================================================
void mostrarSalida() {
  if (pantallaActual != "SALIDA") {
    lcd.clear();
    lcd.setCursor(0, 0); lcd.print(F("SALIDA"));
    lcd.setCursor(0, 1); lcd.print(F("Sin vehiculo"));
    pantallaActual = "SALIDA";
  }
}

void mostrarIngreseTicket() {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(F("Ingrese Ticket:"));
  lcd.setCursor(0, 1); lcd.print(codigoIngresado);
  pantallaActual = "INGRESE";
}

void actualizarPantalla() {
  lcd.setCursor(0, 1); lcd.print(F("                "));
  lcd.setCursor(0, 1); lcd.print(codigoIngresado);
}

void mostrarPasoLCD(const __FlashStringHelper* l1, const __FlashStringHelper* l2) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l1);
  lcd.setCursor(0, 1); lcd.print(l2);
  delay(600);
}

void mostrarPasoLCD(const __FlashStringHelper* l1, const char* l2) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l1);
  lcd.setCursor(0, 1); lcd.print(l2);
  delay(600);
}

void mostrarPasoLCD(const char* l1, const char* l2) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l1);
  lcd.setCursor(0, 1); lcd.print(l2);
  delay(600);
}

// =============================================================================
// VERIFICAR TICKET
// =============================================================================
void verificarTicket() {
  if (digitalRead(IR_PIN) == HIGH) { codigoIngresado = ""; mostrarSalida(); return; }

  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(F("Verificando..."));
  lcd.setCursor(0, 1); lcd.print(F("Espere..."));

  String jsonBody = "{\"ticket_code\":\"";
  jsonBody += codigoIngresado;
  jsonBody += "\",\"device_id\":\"";
  jsonBody += DEVICE_ID;
  jsonBody += "\"}";

  Serial.print(F("[API] Enviando ticket: ")); Serial.println(codigoIngresado);

  int httpCode = enviarHTTPPost(API_PATH, jsonBody);

  char autorizado[8]  = "";
  char mensaje[17]    = "";
  char razon[24]      = "";
  extraerValorJSON("authorized", autorizado, sizeof(autorizado));
  extraerValorJSON("message",    mensaje,    sizeof(mensaje));
  extraerValorJSON("reason",     razon,      sizeof(razon));

  lcd.clear();
  lcd.setCursor(0, 0);

  if (httpCode == 200 || autorizado[0] != '\0') {
    if (strcmp(autorizado, "true") == 0) {
      // ✅ Salida autorizada
      lcd.print(F("Salida OK!"));
      lcd.setCursor(0, 1); lcd.print(F("Abriendo..."));
      Serial.println(F("[ACCESO] Autorizado"));

      tone(BUZZER_PIN, 2500, 150); delay(200); tone(BUZZER_PIN, 2500, 150);
      servoMotor.write(90);

      unsigned long t = millis();
      while (digitalRead(IR_PIN) == LOW && millis() - t < 10000) delay(100);

      lcd.clear();
      lcd.setCursor(0, 0); lcd.print(F("Vehiculo salio"));
      lcd.setCursor(0, 1); lcd.print(F("Cerrando..."));
      delay(DELAY_SERVO_MS);
      servoMotor.write(0);

    } else {
      // ❌ No autorizado
      if (strcmp(razon, "payment_required") == 0) {
        lcd.print(F("PAGO PENDIENTE"));
        lcd.setCursor(0, 1); lcd.print(F("Pague primero"));
      } else {
        lcd.print(F("NO AUTORIZADO"));
        lcd.setCursor(0, 1); lcd.print(mensaje);
      }
      Serial.print(F("[ACCESO] Denegado: ")); Serial.println(razon);
      tone(BUZZER_PIN, 800, 800);
      delay(3000);
    }

  } else if (httpCode == 404) {
    lcd.print(F("TICKET NO"));
    lcd.setCursor(0, 1); lcd.print(F("ENCONTRADO"));
    tone(BUZZER_PIN, 500, 1000); delay(3000);

  } else if (httpCode == 409) {
    lcd.print(F("TICKET YA"));
    lcd.setCursor(0, 1); lcd.print(F("UTILIZADO"));
    tone(BUZZER_PIN, 600, 800); delay(3000);

  } else if (httpCode == 401 || httpCode == 403) {
    lcd.print(F("ERROR:"));
    lcd.setCursor(0, 1); lcd.print(F("Auth Invalida"));
    delay(3000);

  } else {
    lcd.print(F("ERROR:"));
    lcd.setCursor(0, 1); lcd.print(F("Sin conexion"));
    Serial.print(F("[API] Codigo HTTP: ")); Serial.println(httpCode);
    delay(3000);
  }

  codigoIngresado = "";
  pantallaActual  = "";
}

// =============================================================================
// WIFI — INICIALIZAR
// =============================================================================
bool inicializarWiFi() {
  // Reset
  mostrarPasoLCD(F("WiFi: Reset..."), F("AT+RST"));
  enviarAT("AT+RST", "ready", 8000);
  delay(3000);

  // Confirmar que el módulo responde
  byte intentos = 0;
  while (!enviarAT("AT", "OK", 2000) && intentos < 5) {
    Serial.println(F("[AT] Sin respuesta, reintentando..."));
    delay(1000);
    intentos++;
  }
  if (intentos >= 5) {
    mostrarPasoLCD(F("WiFi ERROR:"), F("No responde"));
    Serial.println(F("[AT] ESP8266 no responde. Verifica baudrate y cableado."));
    delay(2000);
    return false;
  }
  Serial.println(F("[AT] ESP8266 OK"));

  enviarAT("ATE0", "OK", 3000);   // Desactivar eco
  delay(500);

  // Modo estación
  mostrarPasoLCD(F("WiFi: Modo..."), F("AT+CWMODE=1"));
  if (!enviarAT("AT+CWMODE=1", "OK", 5000)) {
    mostrarPasoLCD(F("WiFi ERROR:"), F("Modo Estacion"));
    mostrarRespuestaAT();
    delay(2000);
    return false;
  }

  enviarAT("AT+CWQAP", "OK", 5000);
  delay(500);

  // Conectar a la red
  mostrarPasoLCD(F("WiFi: Conectando"), WIFI_SSID);
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
  Serial.println(F("[WiFi] Conectado a la red"));

  // Limpiar servidor anterior si quedó activo
  enviarAT("AT+CIPCLOSE", "OK", 2000);
  enviarAT("AT+CIPSERVER=0", "OK", 3000);

  // Múltiples conexiones
  mostrarPasoLCD(F("WiFi: Multi Mux"), F("AT+CIPMUX=1"));
  if (!enviarAT("AT+CIPMUX=1", "OK", 3000)) {
    mostrarPasoLCD(F("WiFi ERROR:"), F("CIPMUX=1"));
    delay(2000);
    return false;
  }

  enviarAT("AT+CIPMODE=0", "OK", 3000);

  // SSL (solo si USE_SSL = true)
  if (USE_SSL) {
    enviarAT("AT+CIPSSLCCONF=0", "OK", 3000);
    String cmdSni = "AT+CIPSSLCSNI=\"";
    cmdSni += SERVER_HOST;
    cmdSni += "\"";
    if (!enviarAT(cmdSni.c_str(), "OK", 3000)) {
      mostrarPasoLCD(F("SSL ERROR:"), F("SNI no soportado"));
      Serial.println(F("[SSL] Firmware viejo — prueba USE_SSL=false"));
      delay(2500);
      return false;
    }
    enviarAT("AT+CIPSSLSIZE=4096", "OK", 3000);
  }

  // Mostrar IP asignada
  enviarAT("AT+CIFSR", "OK", 3000);
  Serial.print(F("[IP] ")); Serial.println(ultimaRespuestaAT);

  return true;
}

// =============================================================================
// AT — HELPERS
// =============================================================================
void limpiarUltimaRespuestaAT() {
  ultimaRespuestaAT[0] = '\0';
}

void agregarRespuestaAT(char c) {
  size_t len = strlen(ultimaRespuestaAT);
  if (len < sizeof(ultimaRespuestaAT) - 1) {
    ultimaRespuestaAT[len]     = c;
    ultimaRespuestaAT[len + 1] = '\0';
  } else {
    memmove(ultimaRespuestaAT, ultimaRespuestaAT + 1, sizeof(ultimaRespuestaAT) - 2);
    ultimaRespuestaAT[sizeof(ultimaRespuestaAT) - 2] = c;
    ultimaRespuestaAT[sizeof(ultimaRespuestaAT) - 1] = '\0';
  }
}

void copiarRespuestaAT(char* dest, size_t len) {
  if (len == 0) return;
  strncpy(dest, ultimaRespuestaAT, len - 1);
  dest[len - 1] = '\0';
}

// Enviar comando AT por espSerial y esperar respuesta esperada
bool enviarAT(const char* cmd, const char* esperado, unsigned long timeout) {
  while (espSerial.available()) espSerial.read();  // flush
  limpiarUltimaRespuestaAT();

  espSerial.println(cmd);
  Serial.print(F("[AT] >> ")); Serial.println(cmd);

  unsigned long inicio = millis();
  while (millis() - inicio < timeout) {
    while (espSerial.available()) {
      agregarRespuestaAT((char)espSerial.read());
    }
    if (strstr(ultimaRespuestaAT, esperado) != NULL)  return true;
    if (strstr(ultimaRespuestaAT, "FAIL")   != NULL)  return false;
    if (strstr(ultimaRespuestaAT, "ERROR")  != NULL)  return false;
    delay(10);
  }
  return false;
}

bool conexionActivaAT() {
  char previo[sizeof(ultimaRespuestaAT)];
  copiarRespuestaAT(previo, sizeof(previo));

  bool respondio = enviarAT("AT+CIPSTATUS", "STATUS:", 5000);
  bool activa    = strstr(ultimaRespuestaAT, "STATUS:3")         != NULL ||
                   strstr(ultimaRespuestaAT, "+CIPSTATUS:0,\"TCP\"") != NULL ||
                   strstr(ultimaRespuestaAT, "\"TCP\"")            != NULL;

  if (!respondio && !activa && strstr(ultimaRespuestaAT, "AT+CIPSTATUS") != NULL) {
    strncpy(ultimaRespuestaAT, previo, sizeof(ultimaRespuestaAT) - 1);
    ultimaRespuestaAT[sizeof(ultimaRespuestaAT) - 1] = '\0';
  }
  return activa;
}

bool abrirConexionAT(const char* cmd, unsigned long timeout) {
  while (espSerial.available()) espSerial.read();
  limpiarUltimaRespuestaAT();

  espSerial.println(cmd);
  Serial.print(F("[AT] >> ")); Serial.println(cmd);

  unsigned long inicio        = millis();
  bool          yaConsultado  = false;

  while (millis() - inicio < timeout) {
    while (espSerial.available()) agregarRespuestaAT((char)espSerial.read());

    if (strstr(ultimaRespuestaAT, "FAIL")             != NULL) return false;
    if (strstr(ultimaRespuestaAT, "ERROR")            != NULL) return false;
    if (strstr(ultimaRespuestaAT, "OK")               != NULL) return true;
    if (strstr(ultimaRespuestaAT, "CONNECT")          != NULL) return true;
    if (strstr(ultimaRespuestaAT, "Linked")           != NULL) return true;
    if (strstr(ultimaRespuestaAT, "ALREADY CONNECTED")!= NULL) return true;

    if (!yaConsultado && millis() - inicio > 7000 && ultimaRespuestaAT[0] != '\0') {
      yaConsultado = true;
      char cip[sizeof(ultimaRespuestaAT)];
      copiarRespuestaAT(cip, sizeof(cip));
      if (conexionActivaAT()) return true;
      strncpy(ultimaRespuestaAT, cip, sizeof(ultimaRespuestaAT) - 1);
      ultimaRespuestaAT[sizeof(ultimaRespuestaAT) - 1] = '\0';
      while (espSerial.available()) espSerial.read();
      espSerial.println(cmd);
    }
    delay(10);
  }
  return conexionActivaAT();
}

// =============================================================================
// HTTP POST
// =============================================================================
int enviarHTTPPost(const char* path, String& jsonBody) {
  memset(respuestaBuffer, 0, BUFFER_SIZE);

  mostrarPasoLCD(F("API: Conectando"), SERVER_HOST);

  String cmdConn = "AT+CIPSTART=0,\"";
  cmdConn += USE_SSL ? "SSL" : "TCP";
  cmdConn += "\",\"";
  cmdConn += SERVER_HOST;
  cmdConn += "\",";
  cmdConn += SERVER_PORT;

  bool conectado = false;
  for (byte i = 0; i < 2 && !conectado; i++) {
    enviarAT("AT+CIPCLOSE=0", "OK", 2000);
    delay(300);
    conectado = abrirConexionAT(cmdConn.c_str(), 25000);
    if (!conectado) delay(1000);
  }

  if (!conectado) {
    mostrarPasoLCD(F("API ERROR:"), F("TCP Connect"));
    mostrarRespuestaAT();
    delay(2000);
    return -1;
  }

  // Calcular longitud total del request HTTP
  String contentLenStr = String(jsonBody.length());
  int httpLength =
    (sizeof("POST ") - 1)              + strlen(path)          +
    (sizeof(" HTTP/1.1\r\n") - 1)      +
    (sizeof("Host: ") - 1)             + strlen(SERVER_HOST)   + 2 +
    (sizeof("Content-Type: application/json\r\n") - 1)         +
    (sizeof("X-Device-Id: ") - 1)      + strlen(DEVICE_ID)     + 2 +
    (sizeof("X-Device-Token: ") - 1)   + strlen(DEVICE_TOKEN)  + 2 +
    (sizeof("Content-Length: ") - 1)   + contentLenStr.length()+ 2 +
    (sizeof("Connection: close\r\n\r\n") - 1)                  +
    jsonBody.length();

  mostrarPasoLCD(F("API: Preparando"), F("Envio..."));
  String cmdSend = "AT+CIPSEND=0,";
  cmdSend += httpLength;
  if (!enviarAT(cmdSend.c_str(), ">", 10000)) {
    mostrarPasoLCD(F("API ERROR:"), F("Send init"));
    mostrarRespuestaAT();
    enviarAT("AT+CIPCLOSE=0", "OK", 3000);
    delay(2000);
    return -2;
  }

  mostrarPasoLCD(F("API: Enviando"), path);

  // Enviar HTTP request por espSerial
  espSerial.print(F("POST ")); espSerial.print(path);
  espSerial.print(F(" HTTP/1.1\r\nHost: ")); espSerial.print(SERVER_HOST);
  espSerial.print(F("\r\nContent-Type: application/json\r\nX-Device-Id: "));
  espSerial.print(DEVICE_ID);
  espSerial.print(F("\r\nX-Device-Token: ")); espSerial.print(DEVICE_TOKEN);
  espSerial.print(F("\r\nContent-Length: ")); espSerial.print(contentLenStr);
  espSerial.print(F("\r\nConnection: close\r\n\r\n"));
  espSerial.print(jsonBody);

  mostrarPasoLCD(F("API: Esperando"), F("Respuesta..."));

  // Leer respuesta
  unsigned long inicio = millis();
  int  idx      = 0;
  int  httpCode = -1;
  bool cerrado  = false;

  while (millis() - inicio < 15000 && !cerrado) {
    while (espSerial.available()) {
      char c = (char)espSerial.read();
      if (idx < BUFFER_SIZE - 1) {
        respuestaBuffer[idx++] = c;
        respuestaBuffer[idx]   = '\0';
      } else {
        memmove(respuestaBuffer, respuestaBuffer + 1, BUFFER_SIZE - 2);
        respuestaBuffer[BUFFER_SIZE - 2] = c;
        respuestaBuffer[BUFFER_SIZE - 1] = '\0';
      }
      if (httpCode < 0) {
        char* sl = strstr(respuestaBuffer, "HTTP/1.");
        if (sl != NULL) httpCode = atoi(sl + 9);
      }
    }
    if (strstr(respuestaBuffer, "CLOSED") != NULL) cerrado = true;
    delay(10);
  }
  respuestaBuffer[idx < BUFFER_SIZE ? idx : BUFFER_SIZE - 1] = '\0';

  Serial.print(F("[HTTP] Codigo: ")); Serial.println(httpCode);

  if (httpCode > 0) {
    String msg = "HTTP Code: "; msg += httpCode;
    mostrarPasoLCD(F("API: Completado"), msg.c_str());
    delay(1000);
    return httpCode;
  }
  if (strstr(respuestaBuffer, "\"authorized\"") != NULL) {
    mostrarPasoLCD(F("API: Completado"), F("Datos OK"));
    delay(1000);
    return 200;
  }

  mostrarPasoLCD(F("API ERROR:"), F("No status code"));
  delay(2000);
  return -3;
}

// =============================================================================
// JSON PARSING
// =============================================================================
bool copiarRango(const char* ini, const char* fin, char* dest, size_t destLen) {
  if (destLen == 0 || ini == NULL || fin == NULL || fin <= ini) return false;
  size_t len = fin - ini;
  if (len >= destLen) len = destLen - 1;
  memcpy(dest, ini, len);
  dest[len] = '\0';
  return len > 0;
}

bool extraerValorJSON(const char* clave, char* dest, size_t destLen) {
  if (destLen == 0) return false;
  dest[0] = '\0';

  char buscar[32];
  snprintf(buscar, sizeof(buscar), "\"%s\"", clave);

  const char* json = strchr(respuestaBuffer, '{');
  const char* pos  = strstr(json != NULL ? json : respuestaBuffer, buscar);
  if (!pos) return false;

  pos = strchr(pos, ':');
  if (!pos) return false;
  pos++;
  while (*pos == ' ' || *pos == '\r' || *pos == '\n' || *pos == '\t') pos++;

  const char* ini = pos;
  const char* fin = pos;
  if (*pos == '"') {
    ini = pos + 1;
    fin = strchr(ini, '"');
    if (!fin) return false;
  } else {
    while (*fin && *fin != ',' && *fin != '}' && *fin != ' ' &&
           *fin != '\r' && *fin != '\n') fin++;
  }
  return copiarRango(ini, fin, dest, destLen);
}

void mostrarRespuestaAT() {
  String d = ultimaRespuestaAT;
  d.replace("\r", " ");
  d.replace("\n", " ");
  d.trim();
  if (d.length() == 0)                 d = "timeout";
  else if (d.indexOf("STATUS:") >= 0)  d = "STATUS:" + d.substring(d.indexOf("STATUS:") + 7, d.indexOf("STATUS:") + 8);
  else if (d.indexOf("busy")    >= 0)  d = "busy";
  else if (d.indexOf("ERROR")   >= 0)  d = "ERROR";
  else if (d.indexOf("FAIL")    >= 0)  d = "FAIL";
  else if (d.indexOf("CLOSED")  >= 0)  d = "CLOSED";
  else if (d.indexOf("AT+")     >= 0)  d = "solo echo";
  if (d.length() > 16) d = d.substring(0, 16);

  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(F("AT resp:"));
  lcd.setCursor(0, 1); lcd.print(d);
  Serial.print(F("[AT] Resp: ")); Serial.println(d);
  delay(3000);
}