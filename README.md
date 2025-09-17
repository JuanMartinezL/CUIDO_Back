# CUIDO_Back

Backend robusto para gestión de plantillas de prompts con integración a Claude AI de Anthropic.

## 🚀 Características

- **Autenticación JWT**: Registro e inicio de sesión seguros
- **Gestión de Plantillas**: CRUD completo de prompts predefinidos
- **Integración Claude AI**: Procesamiento inteligente de prompts
- **Combinación de Prompts**: Ingeniería de prompts optimizada
- **Rate Limiting**: Control de límites por usuario y endpoint
- **Logging Avanzado**: Sistema de logs con rotación diaria
- **Validación Robusta**: Validación de datos con Zod
- **Seguridad**: Helmet, CORS, sanitización de entradas

## 🛠️ Tecnologías

- **Backend**: Node.js + Express
- **Base de Datos**: MongoDB + Mongoose
- **IA**: Claude API (Anthropic)
- **Autenticación**: JWT + bcrypt
- **Validación**: Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest

## 📋 Prerrequisitos

- Node.js >= 18.0.0
- MongoDB >= 5.0
- Cuenta en Anthropic (API Key)

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone 
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita `.env` con tus valores:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/claude-prompt-db
JWT_SECRET=tu_jwt_secret_super_seguro_256_bits_minimo
ANTHROPIC_API_KEY=sk-ant-api03-tu-api-key-aqui
CLAUDE_MODEL=claude-3-sonnet-20240229
```

### 4. Inicializar base de datos
```bash
npm run seed
```

### 5. Iniciar servidor
```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

## 📚 API Endpoints

### Autenticación
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/profile` - Obtener perfil (protegida)

### Plantillas
- `GET /api/prompts` - Listar plantillas
- `GET /api/prompts/:id` - Obtener plantilla específica
- `POST /api/prompts` - Crear plantilla (admin)
- `PUT /api/prompts/:id` - Actualizar plantilla (admin)
- `DELETE /api/prompts/:id` - Eliminar plantilla (admin)

### Chat
- `POST /api/chat/complete` - Generar respuesta con Claude
- `GET /api/chat/history` - Historial de conversaciones
- `GET /api/chat/conversations/:id` - Conversación específica



