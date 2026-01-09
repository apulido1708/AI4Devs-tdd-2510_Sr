## En este archivo estaran todos los prompt utilizado.

El inicial se obtiene luego de una par de iteraciones con Metaprompt. 

### Prompt inicial.

Actúa como un experto en testing de software con amplia experiencia en Jest y buenas prácticas de testing.

### Contexto del proyecto:
Estamos desarrollando un sistema de seguimiento de candidatos (ATS). Una funcionalidad clave es la **inserción de nuevos candidatos** en la base de datos. Esta inserción puede provenir de múltiples fuentes: formulario web, API directa, sistemas de parsing automatizado, etc.

Ya se cuenta con una versión funcional básica que permite insertar candidatos a través de un formulario web.

### Objetivo:
Implementar una suite de **tests unitarios en Jest** para cubrir la funcionalidad de inserción de candidatos, siguiendo estrictamente el patrón **AAA (Arrange – Act – Assert)**.

### Requisitos:

1. **Patrón de testing (AAA)**:
   - Todos los tests deben estar claramente estructurados en:
     - **Arrange**: preparación del escenario, datos y dobles de prueba.
     - **Act**: ejecución de la funcionalidad bajo test.
     - **Assert**: verificación de los resultados esperados.
   - Usa comentarios o separación visual clara para identificar cada fase.

2. **Cobertura esperada**:
   - Inserción exitosa de un candidato válido.
   - Manejo de errores:
     - Campos requeridos faltantes.
     - Candidatos duplicados (por ejemplo, mismo email).
     - Entradas inválidas.
   - Verificación de que el candidato queda correctamente registrado en la "base de datos".
   - Casos borde:
     - Nombres con caracteres especiales.
     - Campos opcionales vacíos.
     - Formatos de email límite.

3. **Base de datos simulada**:
   - Utiliza un **doble de prueba tipo FAKE** para simular la base de datos.
   - Este fake debe:
     - Mantener estado en memoria.
     - Exponer métodos como `insert(candidate)` y `findByEmail(email)` (o equivalentes).
   - No utilices una base de datos real ni mocks automáticos de librerías externas.

4. **Enfoque técnico**:
   - Usa Jest como framework de testing.
   - Prioriza tests unitarios puros, aislados y deterministas.
   - Aplica inyección de dependencias para poder sustituir la base de datos real por el fake.
   - Si es posible, sigue un enfoque TDD.

5. **Formato esperado**:
   - Archivo de tests completo y funcional en Jest.
   - Uso claro de `describe`, `it`/`test` y `expect`.
   - Incluye la implementación del fake de base de datos o muéstralo inline si simplifica la comprensión.
   - Código legible, comentado y fácil de mantener por otros desarrolladores del equipo.

Por favor, genera el archivo de tests completo cumpliendo todos estos criterios.

## Resultado.


> backend@1.0.0 test
> jest tests-APC.test.ts

PASS src/tests/tests-APC.test.ts
  Inserción de Candidatos - Tests Unitarios
    Inserción exitosa de candidatos válidos
      ✓ debe insertar correctamente un candidato con datos mínimos requeridos (2 ms)
      ✓ debe insertar correctamente un candidato con todos los campos opcionales
      ✓ debe insertar correctamente un candidato con nombre que contiene caracteres especiales (tildes)
      ✓ debe insertar correctamente un candidato con campos opcionales vacíos (undefined)
    Validación de campos requeridos
      ✓ debe lanzar error cuando falta el campo firstName (4 ms)
      ✓ debe lanzar error cuando falta el campo lastName
      ✓ debe lanzar error cuando falta el campo email (1 ms)
      ✓ debe lanzar error cuando todos los campos requeridos están ausentes
    Validación de formato de email
      ✓ debe lanzar error cuando el email tiene formato inválido (sin @)
      ✓ debe lanzar error cuando el email tiene formato inválido (sin dominio)
      ✓ debe lanzar error cuando el email tiene formato inválido (sin extensión) (1 ms)
      ✓ debe aceptar email con formato válido estándar
      ✓ debe aceptar email con subdominio
      ✓ debe aceptar email con caracteres especiales permitidos
    Validación de nombres
      ✓ debe lanzar error cuando el firstName es muy corto (menos de 2 caracteres)
      ✓ debe lanzar error cuando el firstName contiene caracteres no permitidos
      ✓ debe aceptar nombres con espacios (nombres compuestos)
    Validación de teléfono
      ✓ debe lanzar error cuando el teléfono tiene formato inválido (1 ms)
      ✓ debe aceptar teléfono válido que empieza con 6
      ✓ debe aceptar teléfono válido que empieza con 7
      ✓ debe aceptar teléfono válido que empieza con 9
      ✓ debe aceptar candidato sin teléfono (campo opcional)
    Manejo de candidatos duplicados
      ✓ debe lanzar error cuando se intenta insertar un candidato con email duplicado
      ✓ debe permitir insertar candidatos diferentes con emails diferentes
    Verificación de persistencia en base de datos
      ✓ debe persistir el candidato en la base de datos fake después de la inserción
      ✓ debe asignar un ID único a cada candidato insertado
      ✓ debe poder recuperar el candidato por email después de la inserción
    Casos borde
      ✓ debe manejar correctamente nombres con el mínimo de caracteres permitidos (2) (1 ms)
      ✓ debe manejar correctamente nombres con el máximo de caracteres permitidos (100)
      ✓ debe lanzar error cuando el nombre excede el máximo de caracteres (101)
      ✓ debe manejar correctamente emails con formato límite válido
      ✓ debe manejar correctamente direcciones con el máximo de caracteres permitidos (100)
      ✓ debe lanzar error cuando la dirección excede el máximo de caracteres (101)
    Aislamiento entre tests
      ✓ debe mantener el estado aislado entre diferentes tests
      ✓ debe empezar con base de datos limpia en cada test (verificación de beforeEach)

Test Suites: 1 passed, 1 total
Tests:       35 passed, 35 total
Snapshots:   0 total
Time:        0.665 s
Ran all test suites matching /tests-APC.test.ts/i.