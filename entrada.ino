#include <Wire.h>
#include <hd44780.h>
#include <hd44780ioClass/hd44780_I2Cexp.h>
#include <Servo.h>

hd44780_I2Cexp lcd;
Servo servoMotor;

// --- Configuración de Pines ---
const int irPin    = 7;  
const int servoPin = 9;  

// --- Control de Capacidad y Tickets ---
const int CAPACIDAD_MAXIMA = 5;
int lugaresDisponibles = CAPACIDAD_MAXIMA; 
String ticketActual = "NINGUNO"; 
bool nuevoTicketListo = false;   

String ticketsActivos[CAPACIDAD_MAXIMA]; 
int cantidadAutosDentro = 0; 

const char caracteresValidos[] = "0123456789ABCD"; 
const int totalCaracteres = 14; 
int ultimoEstadoLugares = -1; 

void setup() {
  // El puerto Serial nativo (pines 0 y 1) ahora se comunica EXCLUSIVAMENTE con el Wi-Fi
  Serial.begin(9600);   

  pinMode(irPin, INPUT);
  randomSeed(analogRead(A2)); 

  for (int i = 0; i < CAPACIDAD_MAXIMA; i++) {
    ticketsActivos[i] = "";
  }

  lcd.begin(16, 2);
  lcd.backlight();

  servoMotor.attach(servoPin);
  servoMotor.write(0); 

  lcd.setCursor(0, 0);
  lcd.print("Modulo Entrada");
  lcd.setCursor(0, 1);
  lcd.print("Iniciando Wi-Fi...");
  
  delay(2000);
  Serial.println("AT+CIPMUX=1");       
  delay(500);
  Serial.println("AT+CIPSERVER=1,80"); 
  delay(500);

  lcd.clear();
}

void loop() {
  // --- LÓGICA DE CONTROL DE ACCESO ---
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

    if (digitalRead(irPin) == LOW) { 
      generarEntradaYTicket();
    }
  } else {
    if (lugaresDisponibles != ultimoEstadoLugares) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("ESTACIONAMIENTO");
      lcd.setCursor(0, 1);
      lcd.print("   LLENO  X   ");
      ultimoEstadoLugares = lugaresDisponibles;
    }
  }

  // --- LÓGICA DEL MÓDULO WI-FI (ESCUCHAR PETICIONES DE LA PC) ---
  if (Serial.available()) {
    if (Serial.find("+IPD,")) {
      delay(100); 
      int connectionId = Serial.read() - 48; 
      enviarRespuestaJSON(connectionId);
    }
  }
  
  delay(10); 
}

void generarEntradaYTicket() {
  bool esDuplicado;
  
  do {
    esDuplicado = false;
    ticketActual = ""; 
    
    for (int i = 0; i < 6; i++) {
      int indiceAleatorio = random(0, totalCaracteres); 
      ticketActual += caracteresValidos[indiceAleatorio]; 
    }

    for (int i = 0; i < cantidadAutosDentro; i++) {
      if (ticketsActivos[i] == ticketActual) {
        esDuplicado = true; 
        break;
      }
    }
  } while (esDuplicado); 

  if (cantidadAutosDentro < CAPACIDAD_MAXIMA) {
    ticketsActivos[cantidadAutosDentro] = ticketActual;
    cantidadAutosDentro++;
  }

  nuevoTicketListo = true; 

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Ticket Generado");
  lcd.setCursor(0, 1);
  lcd.print("Cod: ");
  lcd.print(ticketActual);

  servoMotor.write(90);

  unsigned long tInicio = millis();
  while (digitalRead(irPin) == LOW && millis() - tInicio < 8000) {
    delay(100);
  }

  delay(800);          
  servoMotor.write(0); 

  lugaresDisponibles--;
}

void enviarRespuestaJSON(int connectionId) {
  String jsonPayload = "{";
  jsonPayload += "\"ticket\":\"" + ticketActual + "\",";
  jsonPayload += "\"disponibles\":" + String(lugaresDisponibles) + ",";
  jsonPayload += "\"nuevo\":" + String(nuevoTicketListo ? "true" : "false");
  jsonPayload += "}";

  String httpRequest = "HTTP/1.1 200 OK\r\n";
  httpRequest += "Content-Type: application/json\r\n";
  httpRequest += "Connection: close\r\n\r\n";
  httpRequest += jsonPayload;

  String cipSend = "AT+CIPSEND=";
  cipSend += connectionId;
  cipSend += ",";
  cipSend += httpRequest.length();
  
  Serial.println(cipSend);
  delay(100); 
  
  Serial.print(httpRequest);
  delay(100);
  
  if (nuevoTicketListo) {
    nuevoTicketListo = false; 
  }
}