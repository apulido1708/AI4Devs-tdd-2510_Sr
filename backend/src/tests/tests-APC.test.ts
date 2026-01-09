import { addCandidate } from '../application/services/candidateService';
import { validateCandidateData } from '../application/validator';

/**
 * FAKE DATABASE - Simulación de base de datos en memoria
 * 
 * Este fake implementa las operaciones básicas necesarias para los tests:
 * - insert: Inserta un nuevo candidato
 * - findByEmail: Busca un candidato por email
 * - findById: Busca un candidato por ID
 * 
 * Mantiene el estado en memoria durante la ejecución de los tests.
 */
class FakeCandidateRepository {
    private candidates: Array<{
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        address?: string;
        educations?: any[];
        workExperiences?: any[];
        resumes?: any[];
    }> = [];
    private nextId: number = 1;

    /**
     * Inserta un nuevo candidato en el fake de base de datos
     */
    async insert(candidateData: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        address?: string;
        educations?: any[];
        workExperiences?: any[];
        resumes?: any[];
    }): Promise<any> {
        // Verificar si el email ya existe (simulando constraint único)
        const existingCandidate = this.candidates.find(c => c.email === candidateData.email);
        if (existingCandidate) {
            const error: any = new Error('Unique constraint failed');
            error.code = 'P2002';
            throw error;
        }

        const newCandidate = {
            id: this.nextId++,
            ...candidateData
        };

        this.candidates.push(newCandidate);
        return newCandidate;
    }

    /**
     * Busca un candidato por email
     */
    async findByEmail(email: string): Promise<any | null> {
        return this.candidates.find(c => c.email === email) || null;
    }

    /**
     * Busca un candidato por ID
     */
    async findById(id: number): Promise<any | null> {
        return this.candidates.find(c => c.id === id) || null;
    }

    /**
     * Obtiene todos los candidatos (útil para verificaciones en tests)
     */
    async findAll(): Promise<any[]> {
        return [...this.candidates];
    }

    /**
     * Limpia todos los datos (útil para resetear entre tests)
     */
    clear(): void {
        this.candidates = [];
        this.nextId = 1;
    }
}

/**
 * Servicio de candidatos testable con inyección de dependencias
 * 
 * Esta versión del servicio acepta un repositorio como dependencia,
 * permitiendo usar el fake de base de datos en los tests.
 */
class TestableCandidateService {
    constructor(private repository: FakeCandidateRepository) {}

    async addCandidate(candidateData: any): Promise<any> {
        // Validar los datos del candidato
        try {
            validateCandidateData(candidateData);
        } catch (error: any) {
            throw new Error(error.message || 'Validation error');
        }

        // Verificar duplicados por email
        const existingCandidate = await this.repository.findByEmail(candidateData.email);
        if (existingCandidate) {
            throw new Error('The email already exists in the database');
        }

        // Insertar el candidato
        try {
            const savedCandidate = await this.repository.insert({
                firstName: candidateData.firstName,
                lastName: candidateData.lastName,
                email: candidateData.email,
                phone: candidateData.phone,
                address: candidateData.address,
                educations: candidateData.educations || [],
                workExperiences: candidateData.workExperiences || [],
                resumes: candidateData.cv ? [candidateData.cv] : []
            });

            return savedCandidate;
        } catch (error: any) {
            if (error.code === 'P2002') {
                throw new Error('The email already exists in the database');
            }
            throw error;
        }
    }
}

// ============================================================================
// SUITE DE TESTS - Inserción de Candidatos
// ============================================================================

describe('Inserción de Candidatos - Tests Unitarios', () => {
    let fakeRepository: FakeCandidateRepository;
    let candidateService: TestableCandidateService;

    // Setup: Se ejecuta antes de cada test
    beforeEach(() => {
        // Arrange: Preparar el fake de base de datos y el servicio
        fakeRepository = new FakeCandidateRepository();
        candidateService = new TestableCandidateService(fakeRepository);
    });

    // ========================================================================
    // TESTS: Inserción exitosa
    // ========================================================================

    describe('Inserción exitosa de candidatos válidos', () => {
        it('debe insertar correctamente un candidato con datos mínimos requeridos', async () => {
            // Arrange: Preparar datos de candidato válido
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@example.com'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que el candidato fue insertado correctamente
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.firstName).toBe(candidateData.firstName);
            expect(result.lastName).toBe(candidateData.lastName);
            expect(result.email).toBe(candidateData.email);

            // Verificar que el candidato existe en la base de datos fake
            const savedCandidate = await fakeRepository.findByEmail(candidateData.email);
            expect(savedCandidate).not.toBeNull();
            expect(savedCandidate?.email).toBe(candidateData.email);
        });

        it('debe insertar correctamente un candidato con todos los campos opcionales', async () => {
            // Arrange: Preparar candidato completo con todos los campos
            const candidateData = {
                firstName: 'María',
                lastName: 'García López',
                email: 'maria.garcia@example.com',
                phone: '612345678',
                address: 'Calle Principal 123, Madrid'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar todos los campos
            expect(result.id).toBeDefined();
            expect(result.firstName).toBe(candidateData.firstName);
            expect(result.lastName).toBe(candidateData.lastName);
            expect(result.email).toBe(candidateData.email);
            expect(result.phone).toBe(candidateData.phone);
            expect(result.address).toBe(candidateData.address);
        });

        it('debe insertar correctamente un candidato con nombre que contiene caracteres especiales (tildes)', async () => {
            // Arrange: Preparar candidato con caracteres especiales
            const candidateData = {
                firstName: 'José',
                lastName: 'González',
                email: 'jose.gonzalez@example.com'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que los caracteres especiales se mantienen
            expect(result.firstName).toBe('José');
            expect(result.lastName).toBe('González');
            expect(result.email).toBe(candidateData.email);
        });

        it('debe insertar correctamente un candidato con campos opcionales vacíos (undefined)', async () => {
            // Arrange: Preparar candidato sin campos opcionales
            const candidateData = {
                firstName: 'Ana',
                lastName: 'Martínez',
                email: 'ana.martinez@example.com',
                phone: undefined,
                address: undefined
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que los campos opcionales no causan problemas
            expect(result.id).toBeDefined();
            expect(result.firstName).toBe(candidateData.firstName);
            expect(result.lastName).toBe(candidateData.lastName);
            expect(result.email).toBe(candidateData.email);
        });
    });

    // ========================================================================
    // TESTS: Validación de campos requeridos
    // ========================================================================

    describe('Validación de campos requeridos', () => {
        it('debe lanzar error cuando falta el campo firstName', async () => {
            // Arrange: Preparar datos sin firstName
            const candidateData = {
                lastName: 'Pérez',
                email: 'test@example.com'
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow();
        });

        it('debe lanzar error cuando falta el campo lastName', async () => {
            // Arrange: Preparar datos sin lastName
            const candidateData = {
                firstName: 'Juan',
                email: 'test@example.com'
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow();
        });

        it('debe lanzar error cuando falta el campo email', async () => {
            // Arrange: Preparar datos sin email
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez'
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow();
        });

        it('debe lanzar error cuando todos los campos requeridos están ausentes', async () => {
            // Arrange: Preparar datos vacíos
            const candidateData = {};

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow();
        });
    });

    // ========================================================================
    // TESTS: Validación de formato de email
    // ========================================================================

    describe('Validación de formato de email', () => {
        it('debe lanzar error cuando el email tiene formato inválido (sin @)', async () => {
            // Arrange: Preparar email inválido
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'emailinvalido.com'
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow('Invalid email');
        });

        it('debe lanzar error cuando el email tiene formato inválido (sin dominio)', async () => {
            // Arrange: Preparar email sin dominio
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'email@'
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow('Invalid email');
        });

        it('debe lanzar error cuando el email tiene formato inválido (sin extensión)', async () => {
            // Arrange: Preparar email sin extensión
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'email@dominio'
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow('Invalid email');
        });

        it('debe aceptar email con formato válido estándar', async () => {
            // Arrange: Preparar email válido
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@example.com'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.email).toBe(candidateData.email);
        });

        it('debe aceptar email con subdominio', async () => {
            // Arrange: Preparar email con subdominio
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@mail.example.com'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.email).toBe(candidateData.email);
        });

        it('debe aceptar email con caracteres especiales permitidos', async () => {
            // Arrange: Preparar email con caracteres especiales válidos
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez+test@example.com'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.email).toBe(candidateData.email);
        });
    });

    // ========================================================================
    // TESTS: Validación de nombres
    // ========================================================================

    describe('Validación de nombres', () => {
        it('debe lanzar error cuando el firstName es muy corto (menos de 2 caracteres)', async () => {
            // Arrange: Preparar nombre muy corto
            const candidateData = {
                firstName: 'A',
                lastName: 'Pérez',
                email: 'test@example.com'
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow('Invalid name');
        });

        it('debe lanzar error cuando el firstName contiene caracteres no permitidos', async () => {
            // Arrange: Preparar nombre con caracteres inválidos
            const candidateData = {
                firstName: 'Juan123',
                lastName: 'Pérez',
                email: 'test@example.com'
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow('Invalid name');
        });

        it('debe aceptar nombres con espacios (nombres compuestos)', async () => {
            // Arrange: Preparar nombre compuesto
            const candidateData = {
                firstName: 'María José',
                lastName: 'García López',
                email: 'maria.jose@example.com'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.firstName).toBe('María José');
            expect(result.lastName).toBe('García López');
        });
    });

    // ========================================================================
    // TESTS: Validación de teléfono
    // ========================================================================

    describe('Validación de teléfono', () => {
        it('debe lanzar error cuando el teléfono tiene formato inválido', async () => {
            // Arrange: Preparar teléfono inválido
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'test@example.com',
                phone: '123456789' // No empieza con 6, 7 o 9
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow('Invalid phone');
        });

        it('debe aceptar teléfono válido que empieza con 6', async () => {
            // Arrange: Preparar teléfono válido
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'test@example.com',
                phone: '612345678'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.phone).toBe('612345678');
        });

        it('debe aceptar teléfono válido que empieza con 7', async () => {
            // Arrange: Preparar teléfono válido
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'test@example.com',
                phone: '712345678'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.phone).toBe('712345678');
        });

        it('debe aceptar teléfono válido que empieza con 9', async () => {
            // Arrange: Preparar teléfono válido
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'test@example.com',
                phone: '912345678'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.phone).toBe('912345678');
        });

        it('debe aceptar candidato sin teléfono (campo opcional)', async () => {
            // Arrange: Preparar candidato sin teléfono
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'test@example.com'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente sin teléfono
            expect(result).toBeDefined();
            expect(result.email).toBe(candidateData.email);
        });
    });

    // ========================================================================
    // TESTS: Candidatos duplicados
    // ========================================================================

    describe('Manejo de candidatos duplicados', () => {
        it('debe lanzar error cuando se intenta insertar un candidato con email duplicado', async () => {
            // Arrange: Insertar primer candidato
            const candidateData1 = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@example.com'
            };
            await candidateService.addCandidate(candidateData1);

            // Preparar segundo candidato con el mismo email
            const candidateData2 = {
                firstName: 'Pedro',
                lastName: 'García',
                email: 'juan.perez@example.com' // Mismo email
            };

            // Act & Assert: Verificar que se lanza error de duplicado
            await expect(candidateService.addCandidate(candidateData2)).rejects.toThrow(
                'The email already exists in the database'
            );
        });

        it('debe permitir insertar candidatos diferentes con emails diferentes', async () => {
            // Arrange: Preparar dos candidatos con emails diferentes
            const candidateData1 = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@example.com'
            };
            const candidateData2 = {
                firstName: 'María',
                lastName: 'García',
                email: 'maria.garcia@example.com'
            };

            // Act: Insertar ambos candidatos
            const result1 = await candidateService.addCandidate(candidateData1);
            const result2 = await candidateService.addCandidate(candidateData2);

            // Assert: Verificar que ambos se insertaron correctamente
            expect(result1.email).toBe(candidateData1.email);
            expect(result2.email).toBe(candidateData2.email);
            expect(result1.id).not.toBe(result2.id);
        });
    });

    // ========================================================================
    // TESTS: Verificación de persistencia en base de datos
    // ========================================================================

    describe('Verificación de persistencia en base de datos', () => {
        it('debe persistir el candidato en la base de datos fake después de la inserción', async () => {
            // Arrange: Preparar datos de candidato
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@example.com',
                phone: '612345678',
                address: 'Calle Test 123'
            };

            // Act: Insertar el candidato
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que el candidato existe en la base de datos
            const savedCandidate = await fakeRepository.findById(result.id);
            expect(savedCandidate).not.toBeNull();
            expect(savedCandidate?.firstName).toBe(candidateData.firstName);
            expect(savedCandidate?.lastName).toBe(candidateData.lastName);
            expect(savedCandidate?.email).toBe(candidateData.email);
            expect(savedCandidate?.phone).toBe(candidateData.phone);
            expect(savedCandidate?.address).toBe(candidateData.address);
        });

        it('debe asignar un ID único a cada candidato insertado', async () => {
            // Arrange: Preparar múltiples candidatos
            const candidateData1 = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@example.com'
            };
            const candidateData2 = {
                firstName: 'María',
                lastName: 'García',
                email: 'maria.garcia@example.com'
            };
            const candidateData3 = {
                firstName: 'Pedro',
                lastName: 'López',
                email: 'pedro.lopez@example.com'
            };

            // Act: Insertar todos los candidatos
            const result1 = await candidateService.addCandidate(candidateData1);
            const result2 = await candidateService.addCandidate(candidateData2);
            const result3 = await candidateService.addCandidate(candidateData3);

            // Assert: Verificar que cada candidato tiene un ID único
            expect(result1.id).toBe(1);
            expect(result2.id).toBe(2);
            expect(result3.id).toBe(3);
            expect(result1.id).not.toBe(result2.id);
            expect(result2.id).not.toBe(result3.id);
            expect(result1.id).not.toBe(result3.id);
        });

        it('debe poder recuperar el candidato por email después de la inserción', async () => {
            // Arrange: Preparar y insertar candidato
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@example.com'
            };
            await candidateService.addCandidate(candidateData);

            // Act: Buscar el candidato por email
            const foundCandidate = await fakeRepository.findByEmail(candidateData.email);

            // Assert: Verificar que se encontró el candidato
            expect(foundCandidate).not.toBeNull();
            expect(foundCandidate?.email).toBe(candidateData.email);
            expect(foundCandidate?.firstName).toBe(candidateData.firstName);
        });
    });

    // ========================================================================
    // TESTS: Casos borde
    // ========================================================================

    describe('Casos borde', () => {
        it('debe manejar correctamente nombres con el mínimo de caracteres permitidos (2)', async () => {
            // Arrange: Preparar nombre con 2 caracteres (límite mínimo)
            const candidateData = {
                firstName: 'Jo',
                lastName: 'Pé',
                email: 'jo.pe@example.com'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.firstName).toBe('Jo');
            expect(result.lastName).toBe('Pé');
        });

        it('debe manejar correctamente nombres con el máximo de caracteres permitidos (100)', async () => {
            // Arrange: Preparar nombre con 100 caracteres (límite máximo)
            const longName = 'A'.repeat(100);
            const candidateData = {
                firstName: longName,
                lastName: 'Pérez',
                email: 'test@example.com'
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.firstName).toHaveLength(100);
            expect(result.firstName).toBe(longName);
        });

        it('debe lanzar error cuando el nombre excede el máximo de caracteres (101)', async () => {
            // Arrange: Preparar nombre con 101 caracteres (excede el límite)
            const tooLongName = 'A'.repeat(101);
            const candidateData = {
                firstName: tooLongName,
                lastName: 'Pérez',
                email: 'test@example.com'
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow('Invalid name');
        });

        it('debe manejar correctamente emails con formato límite válido', async () => {
            // Arrange: Preparar email con formato límite pero válido
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'a@b.co' // Email mínimo válido
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.email).toBe('a@b.co');
        });

        it('debe manejar correctamente direcciones con el máximo de caracteres permitidos (100)', async () => {
            // Arrange: Preparar dirección con 100 caracteres (límite máximo)
            const longAddress = 'A'.repeat(100);
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'test@example.com',
                address: longAddress
            };

            // Act: Ejecutar la inserción
            const result = await candidateService.addCandidate(candidateData);

            // Assert: Verificar que se insertó correctamente
            expect(result.address).toHaveLength(100);
            expect(result.address).toBe(longAddress);
        });

        it('debe lanzar error cuando la dirección excede el máximo de caracteres (101)', async () => {
            // Arrange: Preparar dirección con 101 caracteres (excede el límite)
            const tooLongAddress = 'A'.repeat(101);
            const candidateData = {
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'test@example.com',
                address: tooLongAddress
            };

            // Act & Assert: Verificar que se lanza error de validación
            await expect(candidateService.addCandidate(candidateData)).rejects.toThrow('Invalid address');
        });
    });

    // ========================================================================
    // TESTS: Aislamiento entre tests
    // ========================================================================

    describe('Aislamiento entre tests', () => {
        it('debe mantener el estado aislado entre diferentes tests', async () => {
            // Arrange: Insertar un candidato en este test
            const candidateData = {
                firstName: 'Test',
                lastName: 'Isolation',
                email: 'test.isolation@example.com'
            };

            // Act: Insertar el candidato
            await candidateService.addCandidate(candidateData);

            // Assert: Verificar que existe
            const found = await fakeRepository.findByEmail(candidateData.email);
            expect(found).not.toBeNull();
        });

        it('debe empezar con base de datos limpia en cada test (verificación de beforeEach)', async () => {
            // Arrange: Este test debería empezar con base de datos vacía
            // Si el test anterior no se limpió, este fallaría

            // Act: Intentar buscar un email que no debería existir
            const found = await fakeRepository.findByEmail('test.isolation@example.com');

            // Assert: Verificar que no existe (demuestra que beforeEach limpió el estado)
            expect(found).toBeNull();
        });
    });
});
