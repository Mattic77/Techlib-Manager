# Development Commands Guide

This guide provides the necessary commands to manage your Docker-based development environment for both the **Backend** and **Frontend**.

## 1. Reloading Changes

Since the current configuration does not use volume mounting for source code, you must rebuild the image whenever you make changes to the code.

### Reload Everything
If you've made changes across both frontend and backend:
```powershell
docker-compose up -d --build
```

### Reload Backend Only
If you've only changed backend code:
```powershell
docker-compose up -d --build backend
```

### Reload Frontend Only
If you've only changed frontend code:
```powershell
docker-compose up -d --build frontend
```

---

## 2. General Management

### Start the entire stack
```powershell
docker-compose up -d
```

### Stop the entire stack
```powershell
docker-compose down
```

### View Logs
Useful for debugging errors:
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

---

## 3. Database Migrations (Backend)

After making changes to the models, you'll need to run migrations:

```powershell
# Create a new migration script
docker-compose exec backend alembic revision --autogenerate -m "description of change"

# Apply migrations
docker-compose exec backend alembic upgrade head
```

---

## 4. Tip: Enabling Hot-Reload (Optional)

To avoid rebuilding every time, you can modify `docker-compose.yml` to mount your local files into the container.

### For Backend
Add this to the `backend` service in `docker-compose.yml`:
```yaml
    volumes:
      - ./backend:/app/backend
```
*Note: You would also need to update the `CMD` in your `backend/Dockerfile` to include `--reload`.*

### For Frontend
Add this to the `frontend` service in `docker-compose.yml`:
```yaml
    volumes:
      - ./frontend:/app
      - /app/node_modules # Prevents local node_modules from overwriting container's
```

---

## 5. Troubleshooting & Cleanup

If you encounter unexpected behavior or want to reset:

### Reset everything (including data)
Warning: This will delete your database content!
```powershell
docker-compose down -v
docker-compose up -d --build
```

### Clean up unused Docker resources
```powershell
docker system prune -f
```
