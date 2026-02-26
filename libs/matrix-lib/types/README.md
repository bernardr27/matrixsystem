# @matrix-lib/types

Shared TypeScript type definitions for Matrix V9 Singularity.

This library provides comprehensive type definitions used across all Matrix applications. It ensures consistency and provides excellent IDE support throughout the codebase.

## Installation

This is a local workspace package. It's already available in your Matrix monorepo.

```bash
npm install
```

## Usage

### Import All Types

```typescript
import {
  User,
  UserProfile,
  ApiResponse,
  AuthState,
  Document,
  // ... and 100+ more types
} from '@matrix-lib/types';
```

### Import by Category

```typescript
// Database types
import {
  User,
  UserProfile,
  DataRecord,
  JournalEntry,
  Insight,
} from '@matrix-lib/types/database';

// API types
import {
  ApiResponse,
  ApiError,
  SearchQuery,
  ChatRequest,
} from '@matrix-lib/types/api';

// Authentication types
import {
  AuthState,
  AuthUser,
  LoginRequest,
  Permission,
  Role,
} from '@matrix-lib/types/auth';

// Domain models
import {
  Document,
  Comment,
  Project,
  Organization,
  Report,
} from '@matrix-lib/types/models';
```

## Type Categories

### Database Types (`database.ts`)
Core data models for Supabase:
- User authentication & profiles
- Sessions & tokens
- Records, tasks, insights
- Files & attachments
- Notifications & messages
- Settings & preferences
- Query results & pagination

**Use when**: Working with database operations, defining Supabase schemas, storing user data

### API Types (`api.ts`)
Request/response patterns:
- ApiResponse wrapper
- Error handling
- Pagination
- Search & filtering
- Batch operations
- Webhooks
- AI/LLM requests
- File uploads

**Use when**: Creating API endpoints, building client code, handling API responses

### Authentication Types (`auth.ts`)
Auth flows and permissions:
- Auth state & sessions
- Login/signup requests
- Roles & permissions
- JWT payloads
- API key management
- Two-factor authentication

**Use when**: Building auth features, protecting routes, managing permissions

### Model Types (`models.ts`)
Domain-specific entities:
- Analytics & metrics
- Documents & versioning
- Social & collaboration (comments, likes, follows)
- AI/ML model management
- Organizations & teams
- Projects & sprints
- Reporting & auditing
- Billing & subscriptions

**Use when**: Building specific features in your domain, managing complex data relationships

## Examples

### API Response Handler

```typescript
import { ApiResponse } from '@matrix-lib/types';

async function fetchUser(id: string): Promise<ApiResponse<User>> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}

const result = await fetchUser('user-123');
if (result.success) {
  console.log(result.data?.email);
} else {
  console.error(result.error?.message);
}
```

### Database Record

```typescript
import { Document, DocumentMetadata } from '@matrix-lib/types';

const doc: Document = {
  id: 'doc-123',
  user_id: 'user-456',
  title: 'My Document',
  content: '# Markdown content',
  type: 'markdown',
  status: 'published',
  version: 1,
  tags: ['important', 'work'],
  metadata: {
    word_count: 1000,
    read_time_minutes: 5,
    is_featured: true,
    views: 42,
    likes: 8,
    comments_count: 3,
  } as DocumentMetadata,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

### Authentication

```typescript
import { AuthContextType, LoginRequest } from '@matrix-lib/types';

const authContext: AuthContextType = {
  isAuthenticated: false,
  user: null,
  session: null,
  isLoading: false,
  error: null,
  login: async (email: string, password: string) => {
    // Implementation
  },
  signup: async (request: SignupRequest) => {
    // Implementation
  },
  signout: async () => {
    // Implementation
  },
  // ... other methods
};
```

### API Request/Response

```typescript
import { ApiResponse, SearchQuery, SearchResult } from '@matrix-lib/types';

const query: SearchQuery = {
  q: 'typescript',
  type: 'document',
  filters: { status: 'published' },
  limit: 20,
  offset: 0,
};

const result: SearchResult<Document> = await searchDocuments(query);
console.log(`Found ${result.total} results in ${result.took_ms}ms`);
```

### Team & Organization

```typescript
import { Organization, Team, TeamMember } from '@matrix-lib/types';

const org: Organization = {
  id: 'org-123',
  name: 'Acme Corp',
  slug: 'acme-corp',
  plan: 'enterprise',
  max_members: 100,
  max_projects: 50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const team: Team = {
  id: 'team-456',
  organization_id: org.id,
  name: 'Engineering',
  members: ['user-1', 'user-2', 'user-3'],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

## Type Certifications

All types are:
- ✅ **Strictly typed**: No `any` types, proper interfaces
- ✅ **Well-documented**: JSDoc comments on all exports
- ✅ **Consistent**: Follows naming conventions across categories
- ✅ **Extensible**: Use `extends` to build on base types
- ✅ **Nullable-safe**: Optional fields clearly marked with `?`
- ✅ **Discriminated unions**: Where appropriate (e.g., `status` fields)

## Best Practices

1. **Use discriminated unions** for polymorphic types:
   ```typescript
   export type Permission = 
     | { type: 'user'; user_id: string }
     | { type: 'role'; role_id: string };
   ```

2. **Mark timestamps consistently**:
   ```typescript
   interface Entity {
     created_at: string;
     updated_at: string;
     deleted_at?: string; // Always optional
   }
   ```

3. **Use enums for fixed values**:
   ```typescript
   type Status = 'draft' | 'published' | 'archived';
   ```

4. **Extend base types for variants**:
   ```typescript
   interface BaseRecord {
     id: string;
     user_id: string;
     created_at: string;
     updated_at: string;
   }
   
   interface Document extends BaseRecord {
     title: string;
     content: string;
   }
   ```

## Contributing

When adding new types:

1. Choose the appropriate file (or create a new one)
2. Follow the existing naming conventions
3. Add comprehensive JSDoc comments
4. Update the main `index.ts` to export new types
5. Add examples in this README
6. Ensure types are properly documented with usage patterns

## Building

```bash
# Build type definitions
npm run build

# Watch for changes
npm run dev

# Type check
npm run type-check

# Clean build artifacts
npm run clean
```

## File Organization

```
types/
├── src/
│   ├── database.ts     # Data models (100+ types)
│   ├── api.ts          # API/HTTP types (30+ types)
│   ├── auth.ts         # Authentication types (25+ types)
│   ├── models.ts       # Domain models (40+ types)
│   └── index.ts        # Main export
├── dist/               # Compiled .d.ts files (auto-generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Total Type Count

- **Database**: 25+ types
- **API**: 30+ types
- **Auth**: 25+ types
- **Models**: 40+ types
- **Total**: 120+ type definitions

## Schema Reference

For database schema documentation, see `MATRIX_SYSTEM_AUDIT.md` Section 3.

For API endpoint documentation, see `KILOCODE_INTEGRATION_GUIDE.md`.

## License

MIT
