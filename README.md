# Web Planning Hub

Una aplicación web de planificación personal modular y receptiva diseñada para usuarios con horarios no tradicionales (turnos rotativos, horarios familiares complejos). La Fase 1 ofrece una interfaz de usuario estática con navegación mobile-first y un panel de widgets interactivos.

<img width="367" height="823" alt="image" src="https://github.com/user-attachments/assets/76f159a1-7529-4f3c-8a1f-c086f8846984" />


## Visión General
- Estado: Fase 1 (HTML + CSS estático) completada y alineada con la visión de diseño.
- Navegación: Menú inferior fijo con 4 pantallas principales.
- Páginas:
  - Inicio (index.html): Widgets compactos 2x2 + agenda diaria debajo.
  - Rutinas (rutinas.html): Vista de agenda + selector de rutinas + enlace a gestión de rutinas.
  - Gestionar Rutinas (gestionar-rutinas.html): Lista estática CRUD.
  - Widgets (widgets.html): Panel de widgets interactivos; todos los elementos son clicables.
  - Lista del Mercado (mercado.html): Lista de compras simple con CTA.
  - Configuración (config.html): Ajustes simulados para uso futuro.

## Características Principales (Fase 1)
- Interfaz mobile-first usando Tailwind CDN y un sistema de diseño personalizado ligero.
- Navegación inferior con 4 pestañas consistentes: Inicio, Rutinas, Widgets, Configuración.
- Widgets interactivos mediante etiquetas de anclaje, que enlazan a páginas internas o recursos externos.
- Línea de tiempo de agenda diaria con eventos de ejemplo y un indicador estático de hora actual.

## Tecnologías Utilizadas
- Maquetado/Estilos: HTML5, Tailwind CSS (CDN), variables CSS personalizadas (styles.css).
- JavaScript: Archivos de marcador de posición para futuras fases (sin lógica activa aún).
- Sin herramientas de compilación necesarias; los archivos estáticos son directamente visibles en un navegador.

## Estructura del Proyecto
```
web-planning-hub/
├─ index.html                 # Inicio: Widgets 2x2 + agenda diaria
├─ rutinas.html               # Rutinas: agenda + selector + enlace a CRUD
├─ gestionar-rutinas.html     # Gestionar rutinas: lista CRUD estática
├─ widgets.html               # Panel: cuadrícula de widgets interactivos
├─ mercado.html               # Lista del mercado: lista de verificación básica
├─ config.html                # Configuración: opciones futuras
├─ css/
│  └─ styles.css             # Variables CSS y clases reutilizables
├─ js/
│  ├─ main.js
│  ├─ rutinas.js
│  ├─ widgets.js
│  └─ utils.js
└─ assets/                    # (reservado)
```

## Sistema de Diseño
- Variables CSS en `:root` para colores, radios, sombras y espaciados.
- Clases reutilizables:
  - `.container` utilidad de diseño
  - `.card` superficie elevada con borde y radio
  - `.button`, `.button-primary`, `.button-secondary`
- Iconos mediante SVGs en línea.

## Accesibilidad
- Diseño mobile-first y objetivos táctiles grandes.
- Etiquetas ARIA en iconos interactivos y elementos de navegación.
- Próximos pasos: estados de enfoque, `aria-current` en navegación, navegación por teclado y validación de contraste de color.

## Cómo Ejecutar
- Abre `index.html` en tu navegador.
- Navega usando el menú inferior.
- Los enlaces externos se abren en una nueva pestaña cuando es apropiado (ej. Pico y Placa, Clima).

## Hoja de Ruta
- Fase 1 (actual): Interfaz de usuario estática, páginas responsivas, widgets interactivos. ✅
- Fase 2: Interactividad (JavaScript)
  - Enrutamiento SPA basado en hash (sin recargas completas de página).
  - Capa de estado con `localStorage` para:
    - Lista de rutinas y rutina activa.
    - Widgets favoritos (mostrar 2x2 en Inicio).
    - CRUD de lista de mercado.
    - Preferencias básicas (tema, idioma, ciudad).
  - Indicador dinámico de hora actual en la agenda.
  - Widgets respaldados por APIs (ej. clima) con fallos elegantes.
- Fase 3: Persistencia y Usuarios (Backend)
  - Migrar estado de `localStorage` a Firebase/Supabase.
  - Autenticación (email/contraseña, OAuth).
  - Sincronización entre dispositivos, reglas de seguridad y gestión de cuotas.
- Fase 4: Inteligencia y Automatización
  - Sugerencias inteligentes para horarios.
  - Recordatorios y notificaciones inteligentes.
  - Relleno automático de agenda basado en patrones.

## Modelo de Datos Previsto (Fase 2)
- `preferenciasUsuario`: `{ tema, idioma, ciudad, formatoHora }`
- `rutinas`: `[{ id, nombre, icono, horario: [{ id, titulo, inicio, fin, color }], estaActiva }]`
- `idRutinaActiva`: `cadena`
- `catalogoWidgets`: `[{ id, tipo, nombre, configuracion }]`
- `widgetsFavoritos`: `[{ id, orden, configuracionPersonalizada }]` (máx. 4 para Inicio)
- `listaMercado`: `[{ id, texto, hecho }]`

## Contribución
- Mantén el código limpio, modular y autoexplicativo.
- Usa importaciones explícitas y evita el uso de comodines.
- Mantén un formato y nomenclatura consistentes.
- Abre issues para discutir cambios importantes antes de implementarlos.
