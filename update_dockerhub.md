# 🚀 Actualizar imagen en Docker Hub a la versión 1.0.6

## 1. Inicia sesión en Docker
```bash
docker login
```

## 2. Construye la nueva imagen con la versión 1.0.6
```bash
docker build -t balmacefa/whatsapp_web_client_api:1.0.6 .
```

## 3. (Opcional) Actualizar el tag `latest`
```bash
docker tag balmacefa/whatsapp_web_client_api:1.0.6 balmacefa/whatsapp_web_client_api:latest
```

## 4. Sube las imágenes a Docker Hub

### Push del tag 1.0.6
```bash
docker push balmacefa/whatsapp_web_client_api:1.0.6
```

### Push del tag latest (si lo usaste)
```bash
docker push balmacefa/whatsapp_web_client_api:latest
```

## ✔️ Verificación
Después del push, revisa Docker Hub para confirmar que aparecen:

- `1.0.6`
- `latest` (si lo actualizaste)
