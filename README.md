# Mochi · asistente con IA local

Una gatita pixel art a la que le preguntas cosas. Responde con un modelo que corre
en tu propio ordenador a través de [Ollama](https://ollama.com).

## Windows (lo más fácil)

1. Descomprime la carpeta `pixel-pet`.
2. Haz doble clic en **`Iniciar-Mochi.bat`**.

Todo es gráfico, sin consola:

- **La primera vez**, una ventanita rosa descarga el motor de la ventana (Electron, ~115 MB),
  comprueba su SHA-256 y lo guarda en `%LOCALAPPDATA%\Mochi`. **No necesitas Node.js ni
  permisos de administrador.** Las siguientes veces abre directo.
- **Si no tienes Ollama**, Mochi te lo ofrece nada más abrirse: lo descarga con barra de
  carga, comprueba su firma digital, lo instala en silencio y lo arranca.
- **Si no tienes ningún modelo**, te deja elegir uno y lo descarga con barra de progreso.
- Después aparece el chat.

> Al abrir el `.bat` por primera vez, Windows SmartScreen puede avisar de que el editor
> es desconocido (porque lo has descargado de Internet). Pulsa *Más información* →
> *Ejecutar de todos modos*. El script es de texto plano: puedes leerlo antes.

## Cómo jugar con Mochi

| Haces... | Mochi... |
|---|---|
| Clic en la cara | Reacciona de 6 formas distintas: parpadeo lento (un «te quiero» gatuno), ojos de corazón, guiño, susto, «¡nya!», saltito |
| Clic en la coronilla u orejas | ¡Golpe! Cierra los ojos `> <`, le sale un chichón, se frota la cabeza con la pata y a veces llora |
| Botón de la pelota (abajo a la derecha) | Aparece una pelota: cógela con el ratón y lánzala. Mochi corre a por ella, le da zarpazos, salta encima o la empuja con la cabeza. Tras un rato se cansa. Pulsa otra vez para guardarla |
| Botón del pescadito | Le das un pescadito (también haciendo clic en el suelo) |
| Clic en la barriga | Se ríe por las cosquillas y se menea |
| Clic en la cola | Se enfada, eriza la cola y bufa |
| 5 clics seguidos | Se marea (ojos en X y estrellitas girando) |
| Mover el ratón de lado a lado sobre su cabeza | Ronronea, inclina la cabeza y suelta notas y corazones |
| Doble clic | Da una voltereta (en modo mini, vuelve al chat) |
| Arrastrarla | Mueves la ventana; ella se balancea mientras vuela |
| Mover el ratón por la pantalla | Te sigue con la mirada, incluso fuera de su ventana |
| Dejarla sola un rato | Persigue mariposas, se acicala, estornuda, se persigue la cola, baila, canta, bosteza... y al final se duerme (Zzz) |
| Escribir | Saca un teclado pixel y teclea contigo, una pulsación por cada tecla tuya |
| Esperar su respuesta | Piensa con la pata en la barbilla; luego teclea la respuesta a toda velocidad (con letras saliendo volando) |
| Clic en un hueco del escenario | Cae un pescadito: lo mira caer, salta a por él y se lo come (¡ñam!). Con 4 seguidos está llena |
| Mover mucho el ratón por el escenario | Modo caza: se agazapa meneando el culete y salta hacia el cursor |
| Borrar mucho con Retroceso | Se ríe de ti («¡borra, borra!») |
| Dejarla sola con hambre, aburrida o sin cariño | Se lo dice: su tripa ruge, saca ella sola la pelota o te pide un mimo |
| De noche (a partir de las 22:00) | El escenario se oscurece, salen las estrellas y la luna, se duerme antes y a veces pide un deseo a una estrella fugaz. En otoño caen hojas; en invierno, nieve; en primavera, pétalos |
| Escribirle «gracias», «te quiero», «jaja», «baila», «hola», «adiós», «estoy triste», «miau»... | Reacciona al instante (corazones, risa, baile con música, saludo, consuelo...) |

**Nuevas actividades en reposo:** leer un libro (pasa las páginas), tomar un tazón de leche
con vapor, amasar con las patitas, estirarse, y de noche mirar el cielo.

**Pelajes:** el botón del corazón abre un selector con vista previa de 15 pelajes:
Crema, Sésamo, Mandarina, Kuro, Siamés, Calicó, Esmoquin, Panda, Tigre, Fresa, Menta,
Lavanda, Galaxia (con estrellitas que brillan), Dorado (brillante) y Fantasma (semitransparente
y flotando).

**Botones de la barra:** vida (estrella), memoria, pelaje, sonido
on/off, siempre visible, **modo mini** (solo la gatita flotando en tu escritorio),
minimizar y cerrar.

**Atajos:** `Enter` envía, `Shift+Enter` salto de línea, `Esc` detiene la respuesta y
`Ctrl+Shift+M` muestra u oculta a Mochi desde cualquier sitio.

Recuerda la conversación, el pelaje, el modo y la posición de la ventana entre sesiones.

## Vida de Mochi (el botón de la estrella)

- **Estado:** nivel de amistad y tres barras (comida, diversión, cariño) que bajan con el
  tiempo. Le das pescadito, juegas con la pelota o la mimas desde el propio panel. Si las dejas
  muy bajas te lo pide con animaciones. Mientras tienes la app cerrada se desgastan muy despacio
  y nunca llegan a lo peor.
- **Nivel:** sube con cada interacción (charlar, mimos, comida, juegos, logros, visitas diarias).
  Cada nivel te da un título (Conocida, Amiga, Mejor amiga… Leyenda) y desbloquea accesorios.
- **Vestidor:** 12 accesorios: lazo, flor, gafas, gorro de fiesta, cascos, bufanda, gafas de sol,
  gorro de Navidad, corona, sombrero de mago y aureola. Se combinan con cualquier pelaje.
- **Logros:** 21 retos con aviso en pantalla (hablar por primera vez, 10 pescaditos, un pomodoro,
  charlar de madrugada…).
- **Ajustes:** personalidad de Mochi (Dulce, Traviesa, Profe, Directa o Zen), leer sus
  respuestas en voz alta, avisos de descanso y abrir Mochi al iniciar el ordenador.

## Avisos y temporizadores

Escríbele cosas como «avísame en 10 minutos de sacar la pizza» o usa los comandos. Al terminar,
Mochi salta, suena una alarma, aparece en pantalla aunque la tengas minimizada y parpadea en la
barra de tareas. El tiempo restante se ve en una etiqueta del escenario.
Los avisos sobreviven si cierras la app.

| Comando | Qué hace |
|---|---|
| `/temporizador 10 pizza` | Aviso en 10 min con etiqueta (acepta `90s`, `1h30m`, `media hora`…) |
| `/pomodoro` / `/pomodoro stop` | 25 min de foco y 5 de descanso (15 cada 4 rondas); Mochi se queda callada mientras trabajas |
| `/parar` · `/avisos` · `/estado` | Cancela avisos · lista los que hay · cómo está Mochi |
| `/pelota` · `/pescado` · `/baila` | Juegos rápidos |
| `/pelaje siamés` · `/sombrero corona` | Cambia de pelaje o de accesorio |
| `/portapapeles` | Lee lo último que copiaste |
| `/ayuda` | Lista de comandos |

Estos comandos no pasan por la IA, así que funcionan al instante y sin modelo.

**Descanso:** si lo tienes activado, tras unos 50 min seguidos usando el ordenador te recuerda
estirarte, beber agua o descansar la vista. Si te vas un rato, se duerme; cuando vuelves, te saluda.

## Que lea tus cosas

- **Arrastra un archivo de texto o código** (`.txt`, `.md`, `.py`, `.js`, `.json`, `.csv`…) sobre
  Mochi, o un trozo de texto seleccionado. Se lo «come» y te ofrece **Resumir, Explicar, Traducir
  o Corregir**.
- El botón del **portapapeles** (junto a «nueva conversación») hace lo mismo con lo último que
  hayas copiado.
- Solo se envía a tu IA local; nada sale de tu ordenador.

## Memoria

Mochi se acuerda de ti entre conversaciones. Después de cada respuesta, la misma IA
local revisa tu último mensaje y **decide si contiene algo que merezca recordarse**:

- **Sí guarda:** tu nombre, edad, dónde vives o trabajas, gustos, mascotas, familia,
  proyectos largos, cómo prefieres que te responda, o lo que le pidas que recuerde.
- **No guarda:** preguntas puntuales, estados de ánimo pasajeros ni cosas repetidas.
- **Nunca guarda:** contraseñas, PIN, tarjetas, cuentas o documentos de identidad.
  Esto lo bloquea también el propio código, aunque la IA se equivoque.
- **Anti-invenciones:** solo acepta recuerdos que salgan de verdad de lo que escribiste.
- Si corriges un dato, lo **actualiza**; si le dices «olvida…», lo **borra**.
- Tu **nombre** lo capta al instante («me llamo…», «llámame…»), y antes de responder
  espera a que termine de guardar lo pendiente, para que lo use ya en la siguiente respuesta.
- Los modelos pequeños se fijan poco en las instrucciones iniciales, así que además le
  recuerda tus datos justo al lado de tu pregunta (sin guardarlo en el historial).
- Si usas un modelo de programación («coder») o muy pequeño (1b/1.5b), te avisa y te ofrece
  cambiar a uno mejor para charlar, como `qwen2.5:3b`.

Cada vez que aprende algo aparece una línea amarilla en el chat (✎ Recordado: …).
Con el botón del **libro** ves todo lo que sabe de ti, puedes borrar recuerdos uno a
uno o todos, añadirlos a mano o apagar la memoria. Todo se queda en tu PC; el botón
de conversación nueva borra el chat pero no la memoria.

## macOS / Linux

```
npm install
npm start
```

Mochi detecta si falta Ollama y te lleva a su web (la instalación automática solo está
implementada para Windows). El modelo sí lo descarga ella con barra de progreso.

## Crear un instalador .exe (opcional, en Windows)

```
npm install
npm run dist
```

Genera un instalador en `dist/` con electron-builder. Con el `.exe` ya no hace falta Node.js
en el equipo de quien lo use.

## Cómo está organizado

| Archivo | Qué hace |
|---|---|
| `Iniciar-Mochi.bat` / `.ps1` | Lanzador de Windows: descarga Electron con ventana gráfica y abre Mochi |
| `main.js` | Ventana de Electron y comunicación con el asistente de instalación |
| `ollama-setup.js` | Detectar, descargar, verificar, instalar y arrancar Ollama |
| `static-server.js` | Sirve `index.html` en `127.0.0.1` para que Ollama acepte la conexión |
| `preload.js` | Puente seguro entre la página y Electron |
| `index.html` | Toda la interfaz: mascota, chat y asistente de instalación |

## Alternativa sin instalar nada: en el navegador

Abre `index.html` directamente en el navegador. Para que Ollama acepte la conexión hay
que permitir el origen:

- Windows (PowerShell): `setx OLLAMA_ORIGINS "*"` y reinicia Ollama
- macOS: `launchctl setenv OLLAMA_ORIGINS "*"` y reinicia Ollama
- Linux: `OLLAMA_ORIGINS="*" ollama serve`

## Personalizar

Casi todo está en `index.html`:

- `HATS`, `ACHS`, `PERSONAS`: accesorios, logros y personalidades (añade los tuyos).

- `SYSTEM_PROMPT`: la personalidad de Mochi.
- `PET_NAME`: su nombre.
- `SKINS`: colores de cada pelaje (puedes añadir los tuyos).
- `SLEEP_AFTER_MS`: cuánto tarda en dormirse si no le haces caso.
- `MAX_HISTORY` / `SAVED_MESSAGES`: cuánta conversación recuerda.
- Frases de cada reacción: busca `reactHead`, `reactBelly`, `reactTail`...
- Lista de modelos ofrecidos: el `<select id="pull-model">`.
- Tamaño de la ventana: `SIZES` en `main.js`.

El sprite se dibuja por código (formas que se convierten en píxeles con contorno
automático), así que las expresiones, la cola y las orejas se animan sin imágenes.
Las fuentes pixel (Pixelify Sans y Press Start 2P, licencia OFL) van incrustadas;
ver `FONTS-LICENSE.txt`.

## Problemas frecuentes

- **"No pude arrancar Ollama"**: ábrelo a mano desde el menú Inicio y pulsa REINTENTAR.
- **El instalador no pasa la comprobación de firma**: Mochi se niega a ejecutarlo por
  seguridad. Usa el botón ABRIR WEB, instala Ollama a mano y vuelve a abrir Mochi.
- **"electron.exe desapareció..." o Electron no se instala**: casi siempre es el antivirus
  borrando `electron.exe` al extraerlo. Añade la carpeta `%LOCALAPPDATA%\Mochi` (y la de
  Mochi) a las exclusiones de Windows Security → Protección antivirus → Exclusiones, y vuelve
  a abrir Mochi. Para empezar de cero, borra `%LOCALAPPDATA%\Mochi`.
- **Falla la descarga de Electron**: el lanzador la hace desde GitHub; si tu red lo bloquea,
  instala Node.js, ejecuta `npm install` y `npm start` en la carpeta (el lanzador también
  detecta `node_modules\electron` si existe).
- **`npm install` falla**: suele ser por falta de conexión o por un antivirus/proxy que
  bloquea la descarga de Electron desde GitHub.
