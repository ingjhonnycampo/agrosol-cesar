/*
  BANCO DE 200 RETOS  (100 micro:bit + 100 Arduino Uno)
  Formato: [nivel_de_dificultad(1-14), "pregunta", "RESPUESTA CORRECTA", "incorrecta", "incorrecta", "incorrecta"]
  La correcta se escribe siempre primera; el juego mezcla A/B/C/D al azar en cada partida.
  Cada nivel (1-14) equivale a un peldaño de la escalera de notas.
*/
const BANCO = {

  microbit: [
    // ---- Nivel 1 (8) ----
    [1, "¿Cuántos LEDs tiene la pantalla de la micro:bit?", "25 (5 × 5)", "16 (4 × 4)", "36 (6 × 6)", "10"],
    [1, "¿Cuántos botones programables hay en el frente de la micro:bit?", "2 (A y B)", "1", "3", "4"],
    [1, "¿Qué es la micro:bit?", "Una pequeña computadora programable", "Un tipo de teléfono", "Una consola de videojuegos", "Un televisor"],
    [1, "¿Qué editor en línea se usa para programar la micro:bit con bloques?", "MakeCode", "Photoshop", "Excel", "Word"],
    [1, "¿Qué bloque se ejecuta una sola vez cuando se enciende la micro:bit?", "al iniciar", "para siempre", "al sacudir", "al presionar botón B"],
    [1, "¿Para qué sirven principalmente los LEDs de la pantalla?", "Mostrar números, textos e imágenes", "Cargar la batería", "Medir la temperatura", "Reproducir música"],
    [1, "¿Qué cable se usa para pasar un programa del computador a la micro:bit?", "USB", "HDMI", "VGA", "Ethernet"],
    [1, "¿Qué bloque repite su contenido continuamente?", "para siempre", "al iniciar", "pausa", "al sacudir"],

    // ---- Nivel 2 (8) ----
    [2, "¿Qué hace el bloque «mostrar número 5»?", "Muestra el 5 en la pantalla de LEDs", "Reproduce 5 sonidos", "Espera 5 segundos", "Apaga 5 LEDs"],
    [2, "¿Qué bloque muestra un texto que se desplaza por la pantalla?", "mostrar cadena", "pausa", "borrar pantalla", "al iniciar"],
    [2, "El bloque «pausa (ms) 1000» espera…", "1 segundo", "1 milisegundo", "10 segundos", "1 minuto"],
    [2, "¿Qué bloque permite dibujar una figura encendiendo LEDs uno por uno?", "mostrar LEDs", "mostrar número", "pausa", "para siempre"],
    [2, "¿Qué bloque ejecuta código cuando se pulsa el botón A?", "al presionar botón A", "al iniciar", "para siempre", "pausa"],
    [2, "¿Qué hace el bloque «borrar pantalla»?", "Apaga todos los LEDs", "Borra el programa", "Reinicia la micro:bit", "Desconecta el USB"],
    [2, "¿Con qué bloque puedes mostrar un corazón en la pantalla?", "mostrar icono", "pausa", "borrar pantalla", "para siempre"],
    [2, "¿Para qué sirve el simulador de MakeCode?", "Probar el programa sin necesidad de la placa física", "Fabricar placas", "Conectarse a internet", "Cargar la batería"],

    // ---- Nivel 3 (7) ----
    [3, "¿Qué es una variable?", "Un espacio con nombre que guarda un valor", "Un tipo de cable", "Un tipo de LED", "Un botón"],
    [3, "¿Qué evento ocurre al mover bruscamente la micro:bit?", "al sacudir (shake)", "al iniciar", "al presionar botón A", "para siempre"],
    [3, "¿Qué bloque de evento se usa para actuar cuando se pulsan A y B juntos?", "al presionar botón A+B", "solo botón A", "para siempre", "al iniciar"],
    [3, "¿Qué hace «poner contador a 0»?", "Asigna el valor 0 a la variable contador", "Suma 0 al contador", "Apaga la pantalla", "Resta 1 al contador"],
    [3, "¿Qué hace «cambiar contador por 1»?", "Le suma 1 al contador", "Le resta 1", "Lo deja en 1 siempre", "Lo borra"],
    [3, "¿Qué versión de micro:bit tiene altavoz integrado?", "V2", "V1", "Ninguna", "Solo la versión Go"],
    [3, "¿Qué bloque sirve para simular un dado?", "número aleatorio", "pausa", "borrar pantalla", "mostrar flecha"],

    // ---- Nivel 4 (7) ----
    [4, "El bloque «si … entonces» sirve para…", "Ejecutar código solo si se cumple una condición", "Repetir código para siempre", "Esperar un tiempo", "Apagar la placa"],
    [4, "¿Qué bloque repite instrucciones una cantidad definida de veces?", "repetir 4 veces", "si … entonces", "pausa", "al iniciar"],
    [4, "«si temperatura > 30 entonces mostrar ☼». ¿Cuándo se muestra?", "Cuando la temperatura es mayor que 30", "Cuando es menor que 30", "Siempre", "Nunca"],
    [4, "En «si … si no», ¿cuándo se ejecuta la parte «si no»?", "Cuando la condición NO se cumple", "Cuando se cumple", "Siempre", "Solo al iniciar"],
    [4, "¿Qué operador compara si dos valores son iguales?", "= (igual a)", "+ (suma)", "× (multiplicación)", "pausa"],
    [4, "El bloque «mientras» (while) repite…", "Mientras la condición sea verdadera", "Una sola vez", "Solo si pulsas A", "Hasta apagar el USB"],
    [4, "El operador «y» (and) es verdadero cuando…", "Ambas condiciones son verdaderas", "Al menos una es verdadera", "Ninguna es verdadera", "Solo la primera es verdadera"],

    // ---- Nivel 5 (7) ----
    [5, "¿Qué sensor de la micro:bit detecta inclinación y movimiento?", "Acelerómetro", "Termómetro", "Micrófono", "Altavoz"],
    [5, "¿Qué mide el bloque «temperatura (°C)»?", "La temperatura aproximada (del chip/ambiente)", "La humedad", "La presión", "La velocidad"],
    [5, "¿Qué sensor permite saber hacia dónde está el norte?", "Brújula (magnetómetro)", "Acelerómetro", "Termómetro", "Radio"],
    [5, "¿Cómo mide la micro:bit el nivel de luz?", "Usando los propios LEDs de la pantalla como sensor", "Con una cámara", "Con un LDR obligatorio externo", "No puede medirla"],
    [5, "¿Qué es el logo táctil de la micro:bit?", "Un sensor táctil de la V2", "Un altavoz", "Una antena", "Un botón de reset"],
    [5, "¿Qué gestos puede reconocer el acelerómetro?", "Sacudir, inclinar y caída libre", "Sonidos agudos", "Cambios de luz", "Cambios de humedad"],
    [5, "¿Qué rango de valores devuelve el nivel de luz?", "0 a 255", "0 a 1023", "−100 a 100", "0 a 5"],

    // ---- Nivel 6 (7) ----
    [6, "¿Para qué sirven los bloques de radio?", "Enviar y recibir mensajes entre micro:bits", "Conectarse a internet por Wi-Fi", "Escuchar emisoras FM", "Tomar fotografías"],
    [6, "¿Qué deben tener igual dos micro:bits para comunicarse por radio?", "El mismo grupo de radio", "El mismo color", "El mismo nombre de archivo", "El mismo tamaño"],
    [6, "¿Qué rango tienen los grupos de radio en MakeCode?", "0 a 255", "1 a 5", "0 a 9", "1 a 1000"],
    [6, "¿Cuántos anillos grandes de conexión tiene el borde de la micro:bit?", "5 (P0, P1, P2, 3V y GND)", "3", "10", "25"],
    [6, "¿Qué bloque detecta que tocas el pin P0?", "al presionar pin P0", "al iniciar", "pausa", "brillo"],
    [6, "«Escritura digital» en un pin significa…", "Poner el pin en 0 o en 1", "Escribir texto en pantalla", "Guardar un archivo", "Tomar una foto"],
    [6, "¿Cuántos valores distintos da una lectura analógica de un pin?", "1024 (0 a 1023)", "2", "256", "100"],

    // ---- Nivel 7 (7) ----
    [7, "¿Qué es una función?", "Un bloque de código con nombre que se puede reutilizar", "Una variable", "Un LED", "Un pin"],
    [7, "¿Qué es una lista (arreglo)?", "Una colección ordenada de valores", "Un solo valor", "Un cable", "Un icono"],
    [7, "¿Cuál es la posición del primer elemento de una lista?", "0", "1", "−1", "10"],
    [7, "«para índice de 0 a 4» repite…", "5 veces", "4 veces", "1 vez", "Infinitas veces"],
    [7, "El operador % (módulo) devuelve…", "El resto de una división", "El porcentaje", "El cociente", "La raíz cuadrada"],
    [7, "¿Cuánto es 7 % 2?", "1", "3", "0", "2"],
    [7, "¿Para qué sirve el bloque «mapear» (map)?", "Convertir un valor de un rango a otro rango", "Dibujar un mapa", "Borrar la pantalla", "Hacer una pausa"],

    // ---- Nivel 8 (7) ----
    [8, "¿Qué versión de Python corre en la micro:bit?", "MicroPython", "Java", "Swift", "PHP"],
    [8, "En MicroPython, ¿qué línea importa todo lo de la micro:bit?", "from microbit import *", "import all", "include microbit", "using microbit"],
    [8, "¿Qué instrucción muestra «Hola» desplazándose?", "display.scroll(\"Hola\")", "print(\"Hola\")", "led.text(\"Hola\")", "show.hola()"],
    [8, "En MicroPython, sleep(1000) significa…", "Esperar 1000 milisegundos", "Dormir 1000 segundos", "Apagar la placa", "Reiniciar la placa"],
    [8, "¿Cómo se pregunta si el botón A está pulsado?", "button_a.is_pressed()", "button.a", "pressA()", "A.click"],
    [8, "¿Qué hace display.show(Image.HEART)?", "Muestra un corazón", "Dibuja un círculo", "Borra la pantalla", "Suena una alarma"],
    [8, "En Python, la indentación (sangría) sirve para…", "Definir qué líneas pertenecen a un bloque", "Decorar el código", "Nada, es opcional", "Cambiar el color del texto"],

    // ---- Nivel 9 (7) ----
    [9, "¿Qué hace display.clear()?", "Apaga todos los LEDs", "Borra el archivo", "Reinicia la placa", "Muestra un 0"],
    [9, "display.set_pixel(2, 2, 9) hace…", "Enciende el LED central al brillo máximo", "Apaga el LED central", "Escribe «2 2 9»", "Enciende la esquina"],
    [9, "¿Qué rango de brillo acepta set_pixel?", "0 a 9", "0 a 255", "0 a 100", "1 a 5"],
    [9, "¿Qué devuelve temperature()?", "La temperatura en grados Celsius", "La temperatura en Fahrenheit", "La humedad", "La presión"],
    [9, "accelerometer.get_x() devuelve…", "La aceleración en el eje X", "El brillo del LED", "Un texto", "El número del botón"],
    [9, "accelerometer.was_gesture(\"shake\") detecta…", "Si la placa fue sacudida", "Un sonido", "Un pulso eléctrico", "Un mensaje de radio"],
    [9, "¿Cómo se importa el módulo de números aleatorios?", "import random", "include random", "get random", "random()"],

    // ---- Nivel 10 (7) ----
    [10, "random.randint(1, 6) devuelve…", "Un entero aleatorio entre 1 y 6", "Un decimal entre 1 y 6", "Siempre 6", "Un entero entre 0 y 5"],
    [10, "¿Qué módulo de MicroPython maneja la comunicación por radio?", "radio", "wifi", "net", "air"],
    [10, "radio.on() hace…", "Activa la radio", "Envía un mensaje", "Apaga la radio", "Cambia el grupo"],
    [10, "radio.send(\"hola\") …", "Envía un mensaje de texto por radio", "Imprime hola en pantalla", "Guarda hola en un archivo", "No hace nada"],
    [10, "radio.receive() devuelve…", "El mensaje recibido, o None si no hay", "Siempre un número", "El nombre del emisor", "Un pin"],
    [10, "radio.config(group=5) configura…", "El grupo de radio 5 para comunicarse", "El brillo a 5", "5 segundos de pausa", "El pin 5"],
    [10, "pin0.read_analog() devuelve un valor entre…", "0 y 1023", "0 y 1", "0 y 255", "−1 y 1"],

    // ---- Nivel 11 (7) ----
    [11, "pin0.write_analog(512) genera…", "Una señal PWM de aproximadamente 50 %", "512 voltios", "Una lectura de 512", "Un error"],
    [11, "¿Qué es PWM?", "Modulación por ancho de pulso, simula voltajes analógicos", "Un tipo de pantalla", "Un puerto USB", "Un sensor de luz"],
    [11, "¿Cuál es el valor máximo de write_analog en la micro:bit?", "1023", "255", "100", "5"],
    [11, "¿Cuántas líneas usa el bus I2C?", "Dos: SDA y SCL", "Una: TX", "Tres: R, G y B", "Cuatro: MOSI, MISO, SCK y CS"],
    [11, "La comunicación UART sirve para…", "Comunicación serie entre dispositivos", "Cambiar el brillo", "Reproducir música", "Dibujar gráficos"],
    [11, "music.play(music.BIRTHDAY) …", "Reproduce la melodía de cumpleaños", "Muestra un pastel", "Borra la pantalla", "Graba un audio"],
    [11, "¿Qué hace «import music»?", "Carga el módulo de música", "Reproduce una canción", "Borra el programa", "Conecta a internet"],

    // ---- Nivel 12 (7) ----
    [12, "¿Por qué un LED externo necesita una resistencia en serie?", "Para limitar la corriente y no quemarlo", "Para cambiar su color", "Para que suene", "Para que gire"],
    [12, "¿Con qué voltaje trabajan los pines de la micro:bit?", "3 V", "5 V", "12 V", "9 V"],
    [12, "¿Qué es un servomotor?", "Un motor que gira a un ángulo controlado", "Un tipo de LED", "Un sensor de luz", "Una pantalla"],
    [12, "Para controlar la velocidad de un motor DC se usa…", "PWM con un transistor o driver", "Conectarlo directo a un pin", "Una pila de 9 V directa al pin", "Nada, gira solo"],
    [12, "¿Qué es una resistencia pull-up?", "Una que mantiene el pin en nivel alto por defecto", "Un tipo de botón", "Un sensor", "Un cable especial"],
    [12, "Un dato booleano puede ser…", "Verdadero o falso", "Cualquier número", "Cualquier texto", "Una imagen"],
    [12, "Si en MicroPython pones dos «while True» seguidos, ¿qué pasa?", "El segundo nunca se ejecuta", "Se ejecutan ambos a la vez", "Da siempre error", "Se invierten"],

    // ---- Nivel 13 (7) ----
    [13, "¿Qué es el «debounce» (antirrebote)?", "Evitar lecturas falsas repetidas al pulsar", "Aumentar la velocidad", "Bloquear la radio", "Rebotar una pelota"],
    [13, "¿Qué tecnología inalámbrica incluye la micro:bit además de su radio propia?", "Bluetooth de baja energía (BLE)", "Wi-Fi", "5G", "NFC"],
    [13, "¿Qué arquitectura de procesador usa la micro:bit?", "ARM Cortex-M", "x86", "AVR", "PIC"],
    [13, "¿Qué es una interrupción?", "Una señal que detiene el flujo para atender un evento", "Una pausa larga", "Un error de compilación", "Un tipo de cable"],
    [13, "for i in range(5): repite…", "5 veces, con i de 0 a 4", "5 veces, con i de 1 a 5", "6 veces", "Infinitas veces"],
    [13, "¿Cómo se define una función en Python?", "def nombre():", "function nombre()", "func nombre", "sub nombre"],
    [13, "Para pasar de °C a °F la fórmula es…", "C × 9/5 + 32", "C × 5/9", "C + 32", "C × 2"],

    // ---- Nivel 14 (7) ----
    [14, "x = 3; x += 2; display.show(x). ¿Qué muestra?", "5", "3", "2", "32"],
    [14, "¿Cuánto vale 10 // 3 en Python?", "3", "3.33", "1", "4"],
    [14, "¿Cuánto vale 10 % 3 en Python?", "1", "3", "0", "3.33"],
    [14, "Con lista = [5, 8, 2], ¿cuánto vale lista[1]?", "8", "5", "2", "1"],
    [14, "¿Cuánto devuelve len([4, 5, 6, 7])?", "4", "3", "7", "22"],
    [14, "¿Qué permite running_time() frente a sleep()?", "Medir el tiempo sin detener todo el programa", "Dormir más tiempo", "Reiniciar la placa", "Borrar la pantalla"],
    [14, "Una lectura analógica de 0 a 1023 corresponde a…", "10 bits", "8 bits", "12 bits", "16 bits"]
  ],

  arduino: [
    // ---- Nivel 1 (8) ----
    [1, "¿Qué es Arduino Uno?", "Una placa electrónica programable", "Un lenguaje de dibujo", "Un teléfono celular", "Un televisor"],
    [1, "¿Qué microcontrolador lleva el Arduino Uno?", "ATmega328P", "nRF52833", "ESP32", "Intel Core i7"],
    [1, "¿Con qué programa se escribe y sube el código a un Arduino?", "Arduino IDE", "Photoshop", "Paint", "Excel"],
    [1, "¿Qué cable conecta típicamente un Arduino Uno al computador?", "USB tipo A-B", "HDMI", "VGA", "RJ45"],
    [1, "¿Cuántos pines digitales tiene el Arduino Uno?", "14 (del 0 al 13)", "6", "20", "54"],
    [1, "¿Cuántas entradas analógicas tiene el Arduino Uno?", "6 (A0 a A5)", "14", "2", "10"],
    [1, "El LED integrado del Arduino Uno está conectado al pin…", "13", "0", "1", "A0"],
    [1, "¿Qué voltaje entrega el pin marcado 5V?", "5 voltios", "3 voltios", "12 voltios", "220 voltios"],

    // ---- Nivel 2 (8) ----
    [2, "¿Cuáles son las dos funciones obligatorias de un sketch?", "setup() y loop()", "start() y end()", "main() y run()", "init() y repeat()"],
    [2, "La función setup() se ejecuta…", "Una sola vez al inicio", "Continuamente", "Nunca", "Solo al final"],
    [2, "La función loop() se ejecuta…", "Una y otra vez, indefinidamente", "Una sola vez", "Nunca", "Solo al apagar"],
    [2, "¿Qué símbolo termina cada instrucción en Arduino?", "; (punto y coma)", ". (punto)", ": (dos puntos)", ", (coma)"],
    [2, "¿Cómo se escribe un comentario de una línea?", "// comentario", "# comentario", "<!-- comentario -->", "-- comentario"],
    [2, "El botón «Verificar» del IDE sirve para…", "Revisar errores y compilar el código", "Subir el código a la placa", "Abrir un archivo", "Borrar el programa"],
    [2, "El botón «Subir» del IDE sirve para…", "Cargar el programa a la placa", "Guardar en la nube", "Cerrar el IDE", "Borrar la memoria"],
    [2, "En Arduino, un «sketch» es…", "Un programa", "Un dibujo", "Un cable", "Un sensor"],

    // ---- Nivel 3 (7) ----
    [3, "pinMode(13, OUTPUT); hace…", "Configura el pin 13 como salida", "Lee el pin 13", "Apaga la placa", "Reinicia el sketch"],
    [3, "digitalWrite(13, HIGH); hace…", "Pone el pin 13 en 5 V (enciende)", "Apaga el pin 13", "Lee el pin 13", "Espera un segundo"],
    [3, "delay(1000); espera…", "1 segundo", "1 milisegundo", "10 segundos", "No espera"],
    [3, "¿Cuál es el «Hola Mundo» de Arduino?", "Blink (hacer parpadear un LED)", "Print", "Scan", "Reset"],
    [3, "LOW equivale a…", "0 voltios", "5 voltios", "3.3 voltios", "12 voltios"],
    [3, "¿Qué tipo de dato se usa para números enteros?", "int", "float", "char", "String"],
    [3, "¿Qué pata del LED es la más larga?", "El ánodo (+)", "El cátodo (−)", "Ninguna", "Las dos son iguales"],

    // ---- Nivel 4 (7) ----
    [4, "digitalRead(2); hace…", "Lee el estado del pin 2 (HIGH o LOW)", "Escribe en el pin 2", "Apaga el pin 2", "Espera 2 segundos"],
    [4, "Un pulsador se configura normalmente como…", "INPUT (o INPUT_PULLUP)", "OUTPUT", "PWM", "ANALOG"],
    [4, "INPUT_PULLUP activa…", "Una resistencia interna conectada a 5 V", "Un LED interno", "Un motor", "El monitor serie"],
    [4, "Con INPUT_PULLUP y el pulsador a GND, al pulsar la lectura es…", "LOW", "HIGH", "1023", "5"],
    [4, "Serial.begin(9600); hace…", "Inicia la comunicación serie a 9600 baudios", "Abre un archivo", "Reinicia la placa", "Lee un botón"],
    [4, "Serial.println(\"Hola\"); hace…", "Imprime el texto con salto de línea", "Enciende un LED", "Lee un sensor", "Borra la pantalla"],
    [4, "¿Qué herramienta del IDE muestra los mensajes enviados por Serial?", "Monitor Serie", "Gestor de placas", "Gestor de librerías", "Verificar"],

    // ---- Nivel 5 (7) ----
    [5, "analogRead(A0) devuelve un valor entre…", "0 y 1023", "0 y 255", "0 y 5", "0 y 1"],
    [5, "¿Qué resolución tiene el conversor analógico-digital del Uno?", "10 bits", "8 bits", "12 bits", "16 bits"],
    [5, "analogWrite(9, 128); produce…", "Una señal PWM de ~50 %", "128 voltios", "Una lectura analógica", "Un error"],
    [5, "¿Cómo se identifican los pines PWM del Uno en la placa?", "Con el símbolo ~", "Con un *", "Con un #", "Con un +"],
    [5, "¿Qué rango acepta analogWrite()?", "0 a 255", "0 a 1023", "0 a 100", "0 a 5"],
    [5, "Un potenciómetro es…", "Una resistencia variable", "Un tipo de LED", "Un motor", "Un interruptor"],
    [5, "¿Qué función convierte un rango 0–1023 a 0–255?", "map(valor, 0, 1023, 0, 255)", "convert()", "scale()", "change()"],

    // ---- Nivel 6 (7) ----
    [6, "¿Qué operador compara si dos valores son iguales en C/Arduino?", "==", "=", "===", ":="],
    [6, "else se ejecuta cuando…", "La condición del if es falsa", "Siempre", "Antes del if", "Nunca"],
    [6, "for (int i = 0; i < 3; i++) repite…", "3 veces", "4 veces", "2 veces", "Infinitas veces"],
    [6, "El operador && significa…", "Y lógico (AND)", "O lógico (OR)", "Negación", "Suma"],
    [6, "El operador || significa…", "O lógico (OR)", "Y lógico (AND)", "Negación", "Resta"],
    [6, "¿Qué es un sensor LDR?", "Una fotorresistencia: su resistencia cambia con la luz", "Un sensor de temperatura", "Un sensor de sonido", "Un sensor de movimiento"],
    [6, "Un divisor de tensión es…", "Dos resistencias que reparten el voltaje", "Una pila especial", "Un tipo de LED", "Un motor pequeño"],

    // ---- Nivel 7 (7) ----
    [7, "tone(8, 440); genera…", "Un sonido de 440 Hz en el pin 8", "Un LED de 440 ms", "Una lectura del pin 8", "Un error"],
    [7, "noTone(8); hace…", "Detiene el sonido del pin 8", "Inicia un sonido", "Lee el pin 8", "Reinicia la placa"],
    [7, "¿Qué librería se incluye para controlar servomotores?", "Servo.h", "Motor.h", "Wire.h", "EEPROM.h"],
    [7, "servo.write(90); mueve el servo a…", "90 grados", "90 vueltas", "90 milisegundos", "90 voltios"],
    [7, "El sensor HC-SR04 sirve para…", "Medir distancia con ultrasonido", "Medir temperatura", "Medir luz", "Medir humedad"],
    [7, "delayMicroseconds(10); espera…", "10 microsegundos", "10 milisegundos", "10 segundos", "10 minutos"],
    [7, "Un relé es…", "Un interruptor controlado eléctricamente", "Un sensor de luz", "Un tipo de LED", "Una resistencia"],

    // ---- Nivel 8 (7) ----
    [8, "Frente a int, el tipo long permite guardar…", "Enteros más grandes", "Decimales", "Texto", "Solo 0 o 1"],
    [8, "millis() devuelve…", "Los milisegundos transcurridos desde que arrancó la placa", "La hora real", "La fecha", "La temperatura"],
    [8, "¿Por qué usar millis() en lugar de delay()?", "Porque no bloquea el resto del programa", "Porque es más lento", "Porque es obligatorio", "Porque gasta más energía"],
    [8, "const int led = 13; ¿qué significa const?", "Que el valor no cambia", "Que el valor cambia solo", "Que es un pin analógico", "Que es una librería"],
    [8, "#define LED 13 hace…", "Define una constante antes de compilar", "Crea una variable que cambia", "Crea una función", "Enciende el pin 13"],
    [8, "Una función declarada como void…", "No devuelve ningún valor", "Devuelve un entero", "Es una librería", "Es una variable"],
    [8, "Con int pines[3] = {2, 3, 4}; ¿cuánto vale pines[0]?", "2", "3", "4", "0"],

    // ---- Nivel 9 (7) ----
    [9, "El sensor DHT11 mide…", "Temperatura y humedad", "Luz y sonido", "Distancia", "Gas"],
    [9, "En el Arduino Uno, el bus I2C usa los pines…", "A4 (SDA) y A5 (SCL)", "0 y 1", "9 y 10", "5V y GND"],
    [9, "¿Qué librería se usa para comunicación I2C?", "Wire.h", "Servo.h", "Stepper.h", "Ethernet.h"],
    [9, "Para activar un motor DC con Arduino se recomienda…", "Un transistor o driver (ej. L293D)", "Conectarlo directo al pin", "Una pila de 9 V al pin", "Un LED"],
    [9, "Un puente H sirve para…", "Invertir el sentido de giro de un motor", "Medir luz", "Reproducir sonido", "Guardar datos"],
    [9, "¿Qué corriente máxima recomendada soporta un pin digital?", "20 mA (máx. 40 mA)", "1 A", "5 A", "500 mA"],
    [9, "#include <Servo.h> hace…", "Incluye la librería Servo en el programa", "Es un comentario", "Define un pin", "Imprime un mensaje"],

    // ---- Nivel 10 (7) ----
    [10, "Para ver bien los datos, la velocidad del Monitor Serie debe…", "Coincidir con la de Serial.begin()", "Ser siempre 1", "Ser distinta", "Ser la más baja"],
    [10, "El tipo char guarda…", "Un carácter", "Un decimal", "Un valor booleano", "Un entero muy largo"],
    [10, "Serial.available() indica…", "Que hay datos recibidos listos para leer", "Que hay internet", "Que el LED está libre", "Que hay un error"],
    [10, "Serial.read() lee…", "Un byte recibido por el puerto serie", "Un texto completo siempre", "Una entrada analógica", "El pin 13"],
    [10, "¿Qué pines del Uno admiten interrupciones externas?", "2 y 3", "0 y 1", "12 y 13", "A0 y A1"],
    [10, "attachInterrupt() sirve para…", "Asociar una función a un cambio en un pin", "Adjuntar un archivo", "Conectar por Wi-Fi", "Cambiar la placa"],
    [10, "La memoria EEPROM sirve para…", "Guardar datos que no se borran al apagar", "Conectarse a internet", "Mostrar gráficos", "Acelerar el reloj"],

    // ---- Nivel 11 (7) ----
    [11, "Una variable global es…", "Declarada fuera de las funciones, visible en todo el sketch", "Solo existe dentro de loop()", "Una constante", "Un pin"],
    [11, "Una variable local…", "Solo existe dentro de su función o bloque", "Es visible en todo el sketch", "Es un pin", "Es una librería"],
    [11, "¿Qué tipo de dato usarías para 3.14?", "float", "int", "bool", "char"],
    [11, "Una variable bool puede valer…", "true o false", "Cualquier número", "Cualquier texto", "Solo 0 a 255"],
    [11, "El operador i++ …", "Incrementa i en 1", "Duplica i", "Resta 1 a i", "Eleva i al cuadrado"],
    [11, "¿Qué es String (con mayúscula) en Arduino?", "Un objeto para manejar texto", "Un solo carácter", "Un entero", "Un pin"],
    [11, "¿Qué es el antirrebote (debounce) en un pulsador?", "Ignorar las lecturas falsas producidas por los rebotes", "Hacerlo rebotar", "Encender un LED", "Hacer sonar un tono"],

    // ---- Nivel 12 (7) ----
    [12, "¿Cuánta memoria Flash tiene el Arduino Uno?", "32 KB", "1 GB", "2 MB", "256 KB"],
    [12, "¿Cuánta memoria SRAM tiene el Arduino Uno?", "2 KB", "32 KB", "1 MB", "8 KB"],
    [12, "¿Cuánta memoria EEPROM tiene el Arduino Uno?", "1 KB", "2 KB", "32 KB", "256 KB"],
    [12, "¿Cuál es la frecuencia de reloj del Arduino Uno?", "16 MHz", "80 MHz", "1 GHz", "160 MHz"],
    [12, "¿Qué rango de voltaje recomienda el Uno por su conector Jack?", "7 a 12 V", "24 V", "1.5 V", "0 a 3 V"],
    [12, "¿Qué pines usa el Uno para comunicación serie (RX/TX)?", "0 y 1", "2 y 3", "8 y 9", "12 y 13"],
    [12, "¿Qué pines usa el Uno para SPI?", "10, 11, 12 y 13", "2, 3, 4 y 5", "A0 a A3", "0, 1, 2 y 3"],

    // ---- Nivel 13 (7) ----
    [13, "En PWM, el «ciclo de trabajo» es…", "El porcentaje de tiempo que la señal está en alto", "La frecuencia", "El voltaje máximo", "La corriente"],
    [13, "¿Qué frecuencia PWM usa analogWrite() en la mayoría de pines del Uno?", "Aprox. 490 Hz", "1 Hz", "16 MHz", "5 kHz"],
    [13, "map(512, 0, 1023, 0, 100) devuelve aproximadamente…", "50", "512", "100", "0"],
    [13, "constrain(x, 0, 10); hace…", "Limita x al rango entre 0 y 10", "Borra x", "Multiplica x por 10", "Genera un aleatorio"],
    [13, "random(1, 7) devuelve…", "Un entero de 1 a 6", "Un entero de 1 a 7", "Un entero de 0 a 7", "Un entero de 0 a 6"],
    [13, "randomSeed(analogRead(A0)); sirve para…", "Cambiar la semilla y obtener secuencias distintas", "Fijar el valor aleatorio", "Leer un sensor", "Borrar la memoria"],
    [13, "Voltaje real a partir de analogRead() en un Uno a 5 V:", "v = lectura × 5.0 / 1023", "v = lectura × 10", "v = lectura / 5", "v = lectura + 5"],

    // ---- Nivel 14 (7) ----
    [14, "¿Qué imprime Serial.println(10 / 4); con enteros?", "2", "2.5", "3", "2.0"],
    [14, "¿Cuánto vale 10 % 4?", "2", "2.5", "0", "1"],
    [14, "El bootloader es…", "Un pequeño programa que permite cargar sketches por USB", "Un virus", "Un tipo de LED", "Un sensor"],
    [14, "¿Qué chip hace de interfaz USB-serie en el Uno R3?", "ATmega16U2", "ESP8266", "NE555", "LM35"],
    [14, "¿Cuántos bytes ocupa un int en el Arduino Uno?", "2", "4", "1", "8"],
    [14, "El tipo byte guarda valores de…", "0 a 255", "−128 a 127", "0 a 65535", "0 a 1023"],
    [14, "La ley de Ohm dice que…", "V = I × R", "V = I / R", "V = R / I", "I = V × R"]
  ]
};
