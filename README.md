# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups de velocidad, escudo y triple disparo; los tipos de asteroides únicos, como la estrella fugaz, están en el roadmap.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Power-ups

Hay tres tipos y todos caen al destruir un asteroide (15 % de probabilidad, máximo 2 en pantalla). Duran 5 s y cada recogida suma 5 s al temporizador de su tipo; pueden estar activos a la vez, cada uno con su propio contador.

- **Velocidad** (amarillo): ×2 de empuje y velocidad tope durante 5 s (la rotación no cambia).
- **Escudo** (cian): rodea la nave con un anillo durante 5 s. Si un asteroide impacta, rebota, la nave retrocede ligeramente y el escudo se consume al instante; la nave no sufre daño.
- **Triple disparo** (violeta): cada disparo lanza 3 balas alineadas una detrás de otra en la dirección de la nave, separadas 18 px.

Los tres efectos se pierden al morir y se reinician al pasar de nivel. La probabilidad de drop se ajusta en `POWERUP_DROP_CHANCE` y los tipos (duración, color, etiqueta e icono) en `POWERUP_TYPES`, ambos en `game.js`. El HUD muestra el tiempo restante de cada efecto activo y un `+5s` flotante en el color del power-up al recogerlo.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-ups de velocidad, escudo y triple disparo con drop aleatorio, duración acumulable e indicadores en el HUD
