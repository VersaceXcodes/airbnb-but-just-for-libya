# Auth E2E Tests

## Overview
Comprehensive end-to-end authentication tests for the LibyaStay application using Vitest and React Testing Library. These tests interact with the **real backend API** (no mocking) to verify the complete authentication flow.

## Test Coverage

### 1. Full Auth Flow (`register -> logout -> login`)
- Registers a new user with unique email/phone
- Verifies authentication state after registration
- Logs out the user
- Logs back in with the same credentials
- Validates Zustand store state throughout

### 2. User Registration
- Tests successful registration with all required fields
- Verifies terms acceptance requirement
- Checks role selection (guest/host/both)
- Validates auth token and user data in store

### 3. User Logout
- Registers a user programmatically
- Logs out via store action
- Verifies auth state is cleared

### 4. User Login
- Registers a user, logs out, then logs back in
- Tests login form interaction
- Validates successful authentication

### 5. Invalid Credentials
- Tests login with non-existent email
- Verifies error message display
- Ensures auth state remains unauthenticated

### 6. Role-Based Registration
- Tests registration with "host" role
- Verifies role is correctly set in store

## Configuration

### Environment Variables (`.env.test`)
```
VITE_API_BASE_URL=http://localhost:3000
```

### Vitest Config (`vitest.config.ts`)
- **Environment**: jsdom
- **Globals**: enabled
- **Setup**: `./src/test/setup.ts`
- **Timeout**: 30 seconds per test
- **Path aliases**: `@/` resolves to `./src/`

### Test Setup (`src/test/setup.ts`)
```typescript
import '@testing-library/jest-dom';
```

## Running Tests

### Prerequisites
1. Start the backend server:
   ```bash
   cd /app/backend
   npm start
   ```

2. Ensure PostgreSQL database is running with the schema from `db.sql`

### Run Tests
```bash
cd /app/vitereact

# Run all tests
npm test

# Run auth tests only
npm test auth.e2e.test.tsx

# Run in watch mode
npm test -- --watch

# Run with UI
npm test -- --ui
```

## Key Features

### No API Mocking
- Tests hit the real backend at `http://localhost:3000`
- Uses actual database operations
- Validates full request/response cycle

### Unique Test Data
- Each test generates unique email: `user${Date.now()}@example.com`
- Unique phone numbers to avoid conflicts
- Prevents duplicate user errors

### Store State Validation
- Directly inspects Zustand store via `useAppStore.getState()`
- Validates `authentication_state.authentication_status.is_authenticated`
- Checks `authentication_state.auth_token` presence
- Verifies `authentication_state.current_user` data

### Resilient Selectors
- Uses flexible regex patterns: `/email address|email/i`
- Handles label variations
- Waits for elements to become enabled before interaction

## Test Data Structure

### Registration Payload
```typescript
{
  email: string;           // Unique: user${timestamp}@example.com
  phone_number: string;    // Unique: +218910${timestamp}
  password_hash: string;   // Plain text in dev (no bcrypt)
  name: string;
  profile_picture_url: null;
  bio: null;
  emergency_contact_name: null;
  emergency_contact_phone: null;
  role: 'traveler' | 'host' | 'both';
}
```

### Login Payload
```typescript
{
  email: string;
  password: string;
}
```

## Zustand Store Structure

### Auth State Path
```typescript
authentication_state: {
  current_user: User | null;
  auth_token: string | null;
  authentication_status: {
    is_authenticated: boolean;
    is_loading: boolean;
  };
  error_message: string | null;
}
```

### Store Actions
- `register_user(userData)` - POST `/api/auth/register`
- `login_user(email, password)` - POST `/api/auth/login`
- `logout_user()` - Clears local state
- `clear_auth_error()` - Resets error message

## Backend Endpoints

### Register
- **POST** `/api/auth/register`
- **Body**: `createUserInputSchema` (Zod validation)
- **Response**: `{ user: User, token: string }`

### Login
- **POST** `/api/auth/login`
- **Body**: `{ email: string, password: string }`
- **Response**: `{ user: User, token: string }`

### Logout
- **POST** `/api/auth/logout`
- **Headers**: `Authorization: Bearer ${token}`
- **Response**: `{ message: "Logout successful" }`

## Database Constraints

### Users Table
- `email` - UNIQUE, NOT NULL
- `phone_number` - UNIQUE, NOT NULL
- `password_hash` - NOT NULL (plain text in dev)
- `name` - NOT NULL
- `role` - NOT NULL ('traveler', 'host', 'admin', 'both')

## Troubleshooting

### Test Failures

**Backend Not Running**
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
→ Start backend: `cd /app/backend && npm start`

**Database Connection**
```
Error: Connection terminated unexpectedly
```
→ Check PostgreSQL is running and schema is loaded

**Duplicate Email**
```
Error: User with this email or phone number already exists
```
→ Tests use `Date.now()` for uniqueness; ensure tests aren't run in parallel

**Timeout Errors**
```
Error: Timed out waiting for authentication
```
→ Increase timeout in test or check backend logs

### Debugging Tips

1. **Check Backend Logs**: `cd /app/backend && npm start`
2. **Inspect Store State**: Add `console.log(useAppStore.getState())`
3. **Screenshot on Failure**: Use `screen.debug()` to see rendered HTML
4. **Network Requests**: Check browser DevTools Network tab if running in UI mode

## Best Practices

1. ✅ **Always clear localStorage** in `beforeEach`
2. ✅ **Reset store state** to unauthenticated
3. ✅ **Use unique emails** per test run
4. ✅ **Wait for async operations** with `waitFor`
5. ✅ **Check loading states** before assertions
6. ✅ **Validate store state** not just UI

## Future Enhancements

- [ ] Add password reset flow tests
- [ ] Test email verification (when implemented)
- [ ] Test phone verification (when implemented)
- [ ] Add token expiration tests
- [ ] Test concurrent login sessions
- [ ] Add API error handling tests (500, 503)
- [ ] Test WebSocket connection after auth
