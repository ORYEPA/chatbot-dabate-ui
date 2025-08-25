# Debate Chatbot UI

Interfaz web (React + TypeScript + Vite) tipo **Messenger** para conversar con el API de debate y seleccionar el **perfil** de respuesta del bot.

🔗 **Producción:** https://chatbot-dabate-ui.vercel.app

---

## Características
- Barra superior con:
  - **Nueva conversación** (icono a la izquierda)
  - **Conversation ID** (centro, copiable)
  - **Selector de perfil** (derecha, cargado desde `/profiles`)
- Chat con burbujas estilo Messenger.
- Persistencia ligera de `conversation_id` y `profile` en `localStorage`.

---

## Requisitos
- Node.js 18+
- API accesible y con CORS permitido para tu dominio (ej. `https://chatbot-dabate-ui.vercel.app`).

---

## Variables de entorno
Crea un archivo `.env` en la raíz:

```env
VITE_API_BASE_URL=https://debate-api.fly.dev
VITE_API_SEND_PATH=/ask
VITE_PROFILES_PATH=/profiles
VITE_SET_PROFILE_PATH=/conversations/profile
