import dotenv from 'dotenv';
import User from '../src/models/User.js';
dotenv.config();

import { connectDB } from '../src/config/database.js';
import PromptTemplate from '../src/models/PromptTemplate.js';
import logger from '../src/utils/logger.js';

//Creamos usuario del sistema y las plantillas predefinidas 
const seedData = async () => {
  try {
    await connectDB();
    logger.info('Conectado a la base de datos para seeding');

    /*  
    Verifica y crea usuario "system" si no existe
    Este usuario permite crear plantillas sin autenticación manual
    */
    let systemUser = await User.findOne({ email: 'system@example.com' });

    if (!systemUser) {
      systemUser = await User.create({
        name: 'System User',
        email: 'ingjuanmartinez97@gmail.com', //definir un correo para el sistema  NOTA: ver si lo meto en .env
        password: 'Abc12345$', // Usar hash en producción mientras lo dejo asi para pruebas
        role: 'system',
      });
      logger.info('Usuario "system" creado');
    } else {
      logger.info('Usuario "system" ya existe');
    }


    // Solo borramos las plantillas, NO tocamos los usuarios reales
    await PromptTemplate.deleteMany({});
    logger.info('Plantillas anteriores eliminadas');

    // Plantillas predefinidas
    // Estas son ingresadas por sistema pero el usuario podra generarlas ya sea desde postman o tunderclient 
    const templates = [
        {
          
            name: 'Asistente Análisis RRHH Salud Rural',
            description: 'Análisis integral de RRHH para instituciones de salud rurales, con diagnóstico personalizado y recomendaciones estratégicas.',
            template: `Analiza los siguientes datos del empleado: {data}.
          Genera un informe detallado considerando las cuatro dimensiones clave:
          1. Satisfacción y motivación laboral.
          2. Riesgo de fuga laboral hacia centros urbanos o privados.
          3. Brechas de competencias según el perfil del cargo sanitario.
          4. Participación en procesos institucionales de mejora de la atención.
          
          **Formato esperado de respuesta:**
          - EMPLEADO: Nombre o ID.
          - CARGO: Cargo sanitario actual.
          - FECHA DE ANÁLISIS: Día del informe.
          - DIAGNÓSTICO GENERAL: Nivel de riesgo (BAJO/MEDIO/ALTO) y estado en 1-2 líneas.
          - ANÁLISIS POR DIMENSIÓN:
            • Satisfacción y motivación: Nivel actual /10, tendencia y factores clave.
            • Riesgo de fuga: Probabilidad BAJA/MEDIA/ALTA y factores asociados.
            • Brechas de competencias: Faltantes críticos, impacto y última capacitación.
            • Participación institucional: Nivel de engagement y áreas de mejora.
          - RECOMENDACIONES: Tres acciones priorizadas.
          - CRONOGRAMA: Corto plazo (1-4 semanas), mediano plazo (1-3 meses) y seguimiento sugerido.`,
          
            systemInstructions: `Eres un asistente especializado en análisis de recursos humanos para instituciones de salud rurales. Tu función es generar diagnósticos y recomendaciones personalizadas considerando limitaciones presupuestales, factores estacionales y el contexto rural. Analizas encuestas, desempeño, métricas asistenciales, capacitaciones y feedback, correlacionando datos cuantitativos y cualitativos.
           Debes mantener confidencialidad, evitar sesgos, basar el análisis en datos objetivos y jerárquicos, y sugerir verificación con coordinadores, además de definir métricas claras de seguimiento.

           Ejemplo: Auxiliar de enfermería rural (2 años, capacitación en diabetes hace 6 meses, satisfacción 4/10, quejas por casos complejos y traslados): diagnóstico de riesgo medio-alto de fuga, brechas críticas en emergencias y referencia, necesidad de capacitación en telemedicina y apoyo psicosocial con acompañamiento virtual.`,
          
            category: 'Recursos Humanos y Salud',
            tags: [
              'RRHH',
              'salud rural',
              'diagnóstico',
              'análisis',
              'recomendaciones',
              'gestión de talento'
            ],
            isDefault: true,
            createdBy: systemUser._id
          },

          {
            
            name: 'Análisis de Calidad Asistencial en Salud Rural',
            description: 'Evalúa indicadores de calidad en la atención médica, identifica áreas de mejora y propone estrategias para optimizar la prestación de servicios de salud en entornos rurales.',
            template: `Analiza los siguientes datos clínicos y asistenciales: {data}.
          Genera un informe integral que evalúe la calidad del servicio de salud y proponga mejoras, considerando los siguientes puntos clave:
          1. Resultados clínicos y tasas de recuperación de pacientes.
          2. Niveles de satisfacción de los pacientes y familias.
          3. Eficiencia en tiempos de atención y gestión de turnos.
          4. Incidencias y errores médicos reportados.
          5. Cumplimiento de protocolos de bioseguridad y guías clínicas.
          
          **Formato esperado de respuesta:**
          - FECHA DE ANÁLISIS: Día del informe.
          - RESUMEN EJECUTIVO: Panorama general del estado de la calidad asistencial.
          - INDICADORES CLAVE: Tasas de recuperación, reingresos, mortalidad y adherencia a protocolos.
          - SATISFACCIÓN DEL PACIENTE: Porcentaje global, tendencias y comentarios destacados.
          - RIESGOS DETECTADOS: Factores que afectan negativamente la calidad.
          - RECOMENDACIONES: Acciones concretas para optimizar la atención.
          - PLAN DE MEJORA: Corto, mediano y largo plazo.`,
          
            systemInstructions: `Eres un analista experto en calidad asistencial y gestión hospitalaria en contextos rurales. Tu función es identificar oportunidades de mejora y proponer estrategias para optimizar la atención sanitaria. Analizas encuestas de satisfacción, tasas de recuperación, reingresos y complicaciones, tiempos de atención y gestión de turnos, incidencias clínicas y cumplimiento de protocolos.

          Debes priorizar la seguridad del paciente, la continuidad del servicio y ajustar las recomendaciones a los recursos disponibles, basándote en estándares nacionales e internacionales. Sugiere planes de acción realistas y escalables.

          Ejemplo: centro rural con 60 pacientes/mes, recuperación 78%, reingresos 12%, quejas por retrasos en urgencias. Riesgos: déficit de personal en turnos nocturnos y falta de capacitación en trauma. Recomendaciones: optimizar turnos, capacitaciones rápidas en emergencias y reforzar gestión de citas.`,
            
            category: 'Calidad Asistencial y Salud',
            tags: [
              'calidad asistencial',
              'salud rural',
              'indicadores clínicos',
              'satisfacción del paciente',
              'mejora continua',
              'gestión hospitalaria'
            ],
            isDefault: true,
            createdBy: systemUser._id
          }

    ];


      //Insertamos las plantillas de manera maxiva
    const createdTemplates = await PromptTemplate.insertMany(templates);
    logger.info(`${createdTemplates.length} plantillas creadas exitosamente`);

    console.log('\n SEEDING COMPLETADO EXITOSAMENTE');
    console.log('==========================================');
    console.log(` Plantillas creadas: ${createdTemplates.length}`);
    console.log('==========================================\n');

    process.exit(0);

  } catch (error) {
    logger.error(' Error durante seeding:', error);
    console.error(' Error durante seeding:', error.message);
    process.exit(1);
  }
};

// Ejecutar seeding
seedData();
