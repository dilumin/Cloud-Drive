# Quick API Examples

## Register
```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{ "email":"test@example.com", "password":"password123" }'
```

## Login (returns access token + sets refresh cookie)
```bash
curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{ "email":"test@example.com", "password":"password123" }'
```

Copy the `accessToken` from JSON.

## Browse root
```bash
curl http://localhost:3000/drive/root \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

## Initiate upload
```bash
curl -X POST http://localhost:3000/drive/files/initiate-upload \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{ "parentId":"1", "name":"demo.txt", "totalSize":"12", "mimeType":"text/plain" }'
```
