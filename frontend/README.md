# APUCHITORNEO - Frontend

Aplicación Expo / React Native / TypeScript. La navegación se realiza con Expo Router y las rutas están en `src/app`.

## Dependencias compatibles con el SDK instalado

Desde esta carpeta, ejecuta:

```powershell
npx expo install expo-router expo-secure-store react-native-safe-area-context react-native-screens expo-linking expo-constants
npx expo install react-native-web react-dom
```

Crea tu configuración local: `Copy-Item .env.example .env`. Ajusta `EXPO_PUBLIC_API_URL`: Android Emulator usa `http://10.0.2.2:3000`; iOS Simulator usa `http://localhost:3000`; un teléfono físico necesita la IP local del ordenador.

Inicia con `npx expo start` desde `frontend/`.

El backend NestJS es la fuente de verdad. No se implementa Socket.IO porque el backend documenta actualmente HTTP; no se inventan endpoints ni reglas económicas. El registro público crea PARTICIPANTE; el rol ANFITRION se asigna administrativamente.
