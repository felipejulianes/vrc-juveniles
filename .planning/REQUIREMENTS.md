# Requirements — VRC Juveniles

## v1 Requirements

### Players

- [ ] **PLY-01**: Coach puede ver el listado de jugadores de su división con nombre, foto y puesto
- [ ] **PLY-02**: Coach puede crear un jugador con datos básicos (nombre, apellido, DNI, fecha de nacimiento, foto)
- [ ] **PLY-03**: Coach puede editar los datos de un jugador
- [ ] **PLY-04**: Coach puede registrar el puesto real y el puesto alternativo de un jugador (número 1-15)
- [ ] **PLY-05**: Coach puede ver la ficha completa de un jugador (foto, stats de asistencia, contacto, posiciones, bitácora)
- [ ] **PLY-06**: Jugadores marcados como `inactivo` aparecen al final de la lista (no dados de baja)
- [ ] **PLY-07**: Jugadores provenientes de M14 (app infantiles) heredan su historial automáticamente al cambiar de división

### Attendance

- [ ] **ATT-01**: Coach puede tomar lista en un entrenamiento seleccionando jugadores presentes
- [ ] **ATT-02**: Coach puede ver el historial de sesiones de su división
- [ ] **ATT-03**: Coach puede editar la asistencia de una sesión ya guardada
- [ ] **ATT-04**: La asistencia funciona offline y se sincroniza al recuperar conexión
- [ ] **ATT-05**: Coach puede ver estadísticas de asistencia por jugador (% presencia, sesiones totales)

### Fixture

- [ ] **FIX-01**: Admin puede importar el fixture oficial URBA desde un archivo Excel
- [ ] **FIX-02**: El import muestra una previsualización de los partidos antes de confirmar (preview-before-commit)
- [ ] **FIX-03**: Admin o coach puede agregar/editar un partido manualmente (fecha, rival, local/visitante, sede, división)
- [ ] **FIX-04**: Coach puede ver el fixture de su división ordenado por fecha
- [ ] **FIX-05**: Coach puede cargar el resultado de un partido (goles propios y del rival)
- [ ] **FIX-06**: Coach puede agregar anotadores de tries y tarjetas (amarilla/roja) al resultado de un partido

### Team Builder

- [ ] **TBL-01**: Coach puede iniciar el armado de equipo para un partido del fixture
- [ ] **TBL-02**: El armado muestra quiénes entrenaron (asistencia reciente) para facilitar la selección
- [ ] **TBL-03**: Coach puede asignar jugadores a las posiciones 1-15 (titulares) usando tap-to-place
- [ ] **TBL-04**: Coach puede asignar suplentes indicando en qué posiciones pueden entrar
- [ ] **TBL-05**: La planilla de equipo queda guardada y es visible para todos los coaches de la división
- [ ] **TBL-06**: El puesto registrado del jugador aparece como sugerencia al asignarlo a una posición

### Tutoras

- [ ] **TUT-01**: Tutora puede ver el listado de jugadores juveniles (M15-M19)
- [ ] **TUT-02**: Tutora puede registrar una entrevista a un jugador juvenil
- [ ] **TUT-03**: Tutora puede ver el historial de entrevistas por jugador
- [ ] **TUT-04**: Las mismas tutoras que usan la app de infantiles pueden loguearse aquí con la misma cuenta

### Admin

- [ ] **ADM-01**: Admin puede crear y gestionar cuentas de coach asignadas a divisiones juveniles
- [ ] **ADM-02**: Admin puede ver el fixture completo de todas las divisiones
- [ ] **ADM-03**: Admin puede importar el fixture URBA (acción exclusiva de admin)

---

## v2 Requirements (deferred)

- Evaluación de jugadores por partido (modelo a definir)
- Estadísticas deportivas avanzadas (tackles, metros ganados, etc.)
- Notificaciones / recordatorios de partido
- Export de planilla de equipo a PDF o imagen

---

## Out of Scope

- **Resultados en tiempo real / live scores** — fuera de alcance, requiere infraestructura diferente
- **Módulo de coordinación de sábados** (bondis, tercer tiempo) — es exclusivo de infantiles, no aplica a juveniles
- **Annual progression automático** — peligroso sobre la DB compartida; la migración M14→M15 se hace manualmente via admin de infantiles
- **Rating/notas de desempeño por partido** — no definido todavía, v2
- **Geocoding de sedes** — opponent_clubs ya tiene venues con geocoding en la DB compartida; reusar sin reconstruir

---

## Traceability

| REQ-ID | Phase |
|--------|-------|
| PLY-01 → PLY-07 | Phase 1 |
| ATT-01 → ATT-05 | Phase 1 |
| FIX-01 → FIX-06 | Phase 2 |
| TBL-01 → TBL-06 | Phase 3 |
| TUT-01 → TUT-04 | Phase 4 |
| ADM-01 → ADM-03 | Phase 1 (ADM-01), Phase 2 (ADM-02, ADM-03) |
