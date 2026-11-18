# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye un power-up de velocidad; los tipos de asteroides únicos, como la estrella fugaz, están en el roadmap.

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

- **Velocidad**: ×2 de empuje y velocidad tope durante 5 s (la rotación no cambia). Se pierde al morir.
- Cae al destruir un asteroide. La probabilidad se ajusta en un único lugar: `POWERUP_DROP_CHANCE` en `game.js` (15 % por defecto).
- Solo hay un efecto activo a la vez: si recoges otro mientras dura, se suman 5 s al tiempo restante sin aumentar el multiplicador. El HUD muestra el tiempo restante y un `+5s` flotante al acumular.

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up de velocidad con drop aleatorio, duración acumulable e indicador en el HUD
