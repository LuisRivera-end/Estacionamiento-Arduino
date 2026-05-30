#include <Wire.h>
#include <hd44780.h>
#include <hd44780ioClass/hd44780_I2Cexp.h>
#include <Servo.h>
#include <Keypad.h>

hd44780_I2Cexp lcd;
Servo servoMotor;

// --- Configuración de Pines ---
const int irPin     = 11;  
const int servoPin  = 9;   
const int buzzerPin = 10;

// --- Configuración del Ticket ---
const String TICKET_CORRECTO = "1234";
String codigoIngresado = "";

// --- Tiempo extra antes de bajar el servo ---
const unsigned long DELAY_BAJADA_SERVO = 4000; // 4 segundos

// --- Teclado Matricial 4x4 ---
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

String pantallaActual = "";

// -------------------------------------------------------

void setup() {
  Serial.begin(9600);

  pinMode(irPin, INPUT);
  pinMode(buzzerPin, OUTPUT);

  lcd.begin(16, 2);
  lcd.backlight();

  servoMotor.attach(servoPin);
  servoMotor.write(0); 

  lcd.setCursor(0, 0);
  lcd.print("Modulo Salida");
  delay(1500);
  lcd.clear();

  mostrarSalida();
}

void loop() {
  // -------------------------------------------------------
  // BLOQUEO PRINCIPAL:
  // Si no hay vehículo, no permite usar el teclado
  // -------------------------------------------------------
  if (digitalRead(irPin) == HIGH) {
    codigoIngresado = "";
    mostrarSalida();
    return;
  }

  // Si sí hay vehículo, permite ingresar ticket
  if (pantallaActual != "INGRESE") {
    mostrarIngreseTicket();
  }

  char tecla = teclado.getKey();

  if (tecla) {
    tone(buzzerPin, 2000, 50); 

    if (tecla == '*') {
      verificarTicket();

    } else if (tecla == '#') {
      if (codigoIngresado.length() > 0) {
        codigoIngresado.remove(codigoIngresado.length() - 1);
        actualizarPantalla();
      }

    } else if (codigoIngresado.length() < 4) {
      codigoIngresado += tecla;
      actualizarPantalla();
    }
  }
}

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

void verificarTicket() {
  // Seguridad extra:
  // Si por alguna razon ya no hay vehiculo, cancela la operacion
  if (digitalRead(irPin) == HIGH) {
    codigoIngresado = "";
    mostrarSalida();
    return;
  }

  lcd.clear();
  lcd.setCursor(0, 0);

  if (codigoIngresado == TICKET_CORRECTO) {
    lcd.print("Ticket Correcto");
    lcd.setCursor(0, 1);
    lcd.print("Abriendo...");

    // --- SONIDO DE ÉXITO ---
    tone(buzzerPin, 2500, 150);
    delay(200);
    tone(buzzerPin, 2500, 150);

    servoMotor.write(90); 

    // Espera mientras el vehiculo sigue frente al IR
    unsigned long tInicio = millis();
    while (digitalRead(irPin) == LOW && millis() - tInicio < 10000) {
      delay(100);
    }

    // Cuando el vehiculo ya salio del sensor, espera mas antes de bajar
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Vehiculo salio");
    lcd.setCursor(0, 1);
    lcd.print("Cerrando...");

    delay(DELAY_BAJADA_SERVO);

    servoMotor.write(0); 

  } else {
    lcd.print("PAGO PENDIENTE");
    lcd.setCursor(0, 1);
    lcd.print("Codigo Erroneo");
    
    tone(buzzerPin, 800, 800); 
    delay(3000);
  }

  codigoIngresado = "";
  pantallaActual = "";
}