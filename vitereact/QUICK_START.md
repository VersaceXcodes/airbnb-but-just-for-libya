# Auth E2E Tests - Quick Start Guide

## 🚀 Run Tests in 3 Steps

### Step 1: Start Backend
```bash
cd /app/backend
npm start
```
Wait for: `Server running on port 3000`

### Step 2: Run Tests
```bash
cd /app/vitereact
npm test auth.e2e.test.tsx
```

### Step 3: View Results
```
✓ completes full auth flow: register -> logout -> login (60s)
✓ registers a new user successfully (30s)
✓ logs out successfully (30s)
✓ logs in with valid credentials (30s)
✓ handles invalid login credentials (30s)
✓ registers as host role (30s)

Test Files  1 passed (1)
     Tests  6 passed (6)
```

## 📋 What's Tested?

| #  | Test Case | What It Does |
|----|-----------|--------------|
| 1️⃣ | Full Auth Flow | Register → Logout → Login (complete cycle) |
| 2️⃣ | Registration | New user signup with all fields |
| 3️⃣ | Logout | Clear authentication state |
| 4️⃣ | Login | Authenticate existing user |
| 5️⃣ | Invalid Login | Handle wrong credentials |
| 6️⃣ | Host Registration | Register with host role |

## 🔍 Test Details

### Test 1: Full Auth Flow (Main Test)
```
1. Register new user
2. Verify authenticated
3. Logout
4. Verify logged out
5. Login with same credentials
6. Verify authenticated again
```
**Duration**: 60 seconds

### Test 2-6: Individual Flows
Each test validates a specific auth action (30s each)

## 💡 Key Points

- ✅ **Real API**: Tests hit actual backend (no mocks)
- ✅ **Real DB**: PostgreSQL operations
- ✅ **Unique Data**: Each run uses `Date.now()` for emails
- ✅ **Store Validation**: Checks Zustand state directly
- ✅ **Clean State**: localStorage cleared before each test

## 📊 Store State Checked

```typescript
authentication_state: {
  is_authenticated: boolean     // ← Checked
  auth_token: string | null     // ← Checked
  current_user: User | null     // ← Checked
}
```

## 🛠️ Troubleshooting

### Backend Not Running?
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Fix**: Start backend first (`cd /app/backend && npm start`)

### Test Timeout?
```
Error: Timed out waiting for authentication
```
**Fix**: Check backend logs for errors

### Database Error?
```
Error: Connection terminated
```
**Fix**: Ensure PostgreSQL is running

## 📁 Test Location
```
/app/vitereact/src/__tests__/auth.e2e.test.tsx
```

## 📖 Full Documentation
- `/app/vitereact/src/__tests__/README.md` - Detailed docs
- `/app/vitereact/AUTH_TESTS_SUMMARY.md` - Implementation summary

## 🎯 Test Commands

```bash
# Run all tests
npm test

# Run auth tests only
npm test auth.e2e.test.tsx

# Watch mode (re-run on changes)
npm test -- --watch

# UI mode (visual test runner)
npm test -- --ui

# Run specific test by name
npm test -- -t "full auth flow"

# Verbose output
npm test -- --reporter=verbose
```

## 🔐 Test Users Created

Each test creates unique users:
- Email: `user${Date.now()}@example.com`
- Phone: `+218910${Date.now().slice(-6)}`
- Password: `testpass123`, `regpass123`, etc.
- Name: `E2E Test User`, `Registration Test`, etc.

## ✨ Success Output Example

```
 ✓ src/__tests__/auth.e2e.test.tsx (6) 45231ms
   ✓ Auth E2E Flow (real API) (6) 45230ms
     ✓ completes full auth flow: register -> logout -> login 12456ms
     ✓ registers a new user successfully 5234ms
     ✓ logs out successfully 4123ms
     ✓ logs in with valid credentials 8234ms
     ✓ handles invalid login credentials 6789ms
     ✓ registers as host role 5234ms

Test Files  1 passed (1)
     Tests  6 passed (6)
  Start at  17:30:15
  Duration  45.51s
```

## 🎨 What Gets Validated?

### Registration
- ✅ User created in database
- ✅ JWT token generated
- ✅ Store updated: `is_authenticated = true`
- ✅ Store has `auth_token`
- ✅ Store has `current_user` data

### Login
- ✅ Credentials validated
- ✅ Token returned
- ✅ Store authenticated
- ✅ User data loaded

### Logout
- ✅ Store cleared
- ✅ `is_authenticated = false`
- ✅ `auth_token = null`
- ✅ `current_user = null`

## 🚦 Ready to Run?

```bash
# Terminal 1
cd /app/backend && npm start

# Terminal 2
cd /app/vitereact && npm test auth.e2e.test.tsx
```

That's it! 🎉
