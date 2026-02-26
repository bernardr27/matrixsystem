# @matrix-lib/supabase

Shared Supabase client and utilities for Matrix V9 Singularity.

This library provides a centralized Supabase client instance and common utilities used across all Matrix applications. It eliminates code duplication, ensures consistency in database access patterns, and makes it easier to manage Supabase configurations.

## Installation

This is a local workspace package. It's already available in your Matrix monorepo.

```bash
# Install dependencies
npm install
```

## Usage

### Basic Client

```typescript
import { supabase } from '@matrix-lib/supabase';

// Fetch data
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .limit(10);

// Insert data
const { data, error } = await supabase
  .from('profiles')
  .insert([{ username: 'john', email: 'john@example.com' }]);

// Update data
const { data, error } = await supabase
  .from('profiles')
  .update({ bio: 'Updated bio' })
  .eq('id', 'user-id');

// Delete data
const { error } = await supabase
  .from('profiles')
  .delete()
  .eq('id', 'user-id');
```

### React Hooks

```typescript
import {
  useUser,
  useAuth,
  useTable,
  useInsert,
  useUpdate,
  useDelete,
} from '@matrix-lib/supabase';

// Get current user
function UserProfile() {
  const { user, loading, error } = useUser();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>Welcome, {user?.email}</div>;
}

// Authentication
function LoginForm() {
  const { signIn, loading, error } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    await signIn(email, password);
  };

  return (
    // ... form JSX
  );
}

// Fetch table data
function ProfilesList() {
  const { data: profiles, loading, error } = useTable('profiles');

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {profiles.map((profile) => (
        <li key={profile.id}>{profile.username}</li>
      ))}
    </ul>
  );
}

// Insert data
function CreateProfile() {
  const { insert, loading, error } = useInsert('profiles');

  const handleCreate = async () => {
    await insert({ username: 'john', email: 'john@example.com' });
  };

  return <button onClick={handleCreate}>Create Profile</button>;
}

// Update data
function EditProfile() {
  const { update, loading, error } = useUpdate('profiles');

  const handleUpdate = async (id: string) => {
    await update(id, { bio: 'Updated bio' });
  };

  return <button onClick={() => handleUpdate('profile-id')}>Update</button>;
}

// Delete data
function DeleteProfile() {
  const { delete: deleteProfile, loading, error } = useDelete('profiles');

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
  };

  return <button onClick={() => handleDelete('profile-id')}>Delete</button>;
}
```

## Configuration

Requires these environment variables in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Building

```bash
# Build the library
npm run build

# Watch for changes
npm run dev

# Type check
npm run type-check

# Clean build artifacts
npm run clean
```

## Exports

### Client

- `supabase` - Main Supabase client for client-side operations
- `supabaseAdmin` - Admin client for server-side operations (requires service key)
- `createClient` - Function to create custom Supabase clients

### Hooks

- `useUser()` - Get current authenticated user
- `useAuth()` - Sign up, sign in, sign out functions
- `useTable(tableName)` - Fetch table data with real-time subscriptions
- `useInsert(tableName)` - Insert data into table
- `useUpdate(tableName)` - Update table rows
- `useDelete(tableName)` - Delete table rows

### Types

All types from `@supabase/supabase-js` are re-exported, including:
- `Session`
- `User`
- `AuthChangeEvent`
- `AuthError`
- `PostgrestError`
- `RealtimePostgresChangesPayload`

## Best Practices

1. **Use the client in API routes** for server-side operations:
   ```typescript
   import { supabase } from '@matrix-lib/supabase';

   export async function GET(request: Request) {
     const { data } = await supabase.from('profiles').select('*');
     return Response.json(data);
   }
   ```

2. **Use hooks in React components** for client-side operations:
   ```typescript
   import { useTable } from '@matrix-lib/supabase';

   export default function Profiles() {
     const { data } = useTable('profiles');
     // ...
   }
   ```

3. **Handle errors properly** in all operations
4. **Subscribe to real-time changes** using the hooks
5. **Cache responses** where appropriate

## Contributing

When adding new functionality:

1. Add the feature to the appropriate file (client, hooks, types)
2. Export from `index.ts`
3. Add tests if applicable
4. Update this README
5. Build and test in a consuming app

## License

MIT
