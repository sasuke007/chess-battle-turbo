
```
docker build --no-cache \
  -f apps/web/Dockerfile \
  -t replay-chess-web:latest \
  --build-arg DATABASE_URL="$DATABASE_URL" \
  --build-arg CLERK_SECRET_KEY="$CLERK_SECRET_KEY" \
  --build-arg NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" \
  --build-arg NEXT_PUBLIC_WEBSOCKET_URL="$NEXT_PUBLIC_WEBSOCKET_URL" \
  .
  ```


```
docker run -p 3000:3000 replay-chess-web:latest
``` 









  