# @matrix-lib/ui

Shared UI components and utilities for Matrix V9 Singularity.

This library provides consistent, reusable UI components used across all Matrix applications built with React, Tailwind CSS, and Framer Motion.

## Installation

This is a local workspace package. It's already available in your Matrix monorepo.

```bash
# Install dependencies
npm install
```

## Components

### Button

Customizable button component with multiple variants and sizes.

```typescript
import { Button } from '@matrix-lib/ui';

export function MyComponent() {
  return (
    <>
      <Button>Default Button</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="outline">Outline</Button>
      
      <Button size="sm">Small</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">🔒</Button>
      
      <Button loading>Loading...</Button>
      <Button disabled>Disabled</Button>
    </>
  );
}
```

**Variants**: `default`, `secondary`, `destructive`, `ghost`, `outline`  
**Sizes**: `default`, `sm`, `lg`, `icon`

### Card

Card component with header, content, and footer sections.

```typescript
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@matrix-lib/ui';
import { Button } from '@matrix-lib/ui';

export function MyCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content goes here</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  );
}
```

### Badge

Badge component for labels, tags, and status indicators.

```typescript
import { Badge } from '@matrix-lib/ui';

export function MyBadge() {
  return (
    <>
      <Badge>Default Badge</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Error</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="info">Info</Badge>
    </>
  );
}
```

**Variants**: `default`, `secondary`, `destructive`, `success`, `warning`, `info`

## Hooks

Custom React hooks for common UI patterns:

- `useClickOutside()` - Detect clicks outside an element
- `useLocalStorage()` - Sync state with localStorage
- `useMediaQuery()` - Respond to media queries
- `useDebounce()` - Debounce values
- `useTheme()` - Manage theme state

```typescript
import { useClickOutside, useLocalStorage, useMediaQuery } from '@matrix-lib/ui';

export function MyComponent() {
  const ref = useRef(null);
  const [showMenu, setShowMenu] = useClickOutside(ref, false);
  
  const [savedValue, setSavedValue] = useLocalStorage('mykey', '');
  
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  return (
    <div ref={ref}>
      {/* ... */}
    </div>
  );
}
```

## Utilities

Helper functions for styling and component development:

- `cn()` - Merge class names safely
- `clsx` - Conditional class names
- `twMerge` - Merge Tailwind CSS classes

```typescript
import { cn, clsx, twMerge } from '@matrix-lib/ui';

export function MyComponent({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={cn(
        'px-4 py-2 rounded-lg',
        isActive && 'bg-blue-600 text-white',
        !isActive && 'bg-gray-100 text-gray-900'
      )}
    />
  );
}
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

## Configuration

Tailwind CSS is required. Ensure your `tailwind.config.ts` includes the UI library:

```typescript
import type { Config } from 'tailwindcss';

export default {
  content: [
    './node_modules/@matrix-lib/ui/dist/**/*.js',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

## Design System

### Colors

- **Neutral**: gray-100 to gray-900
- **Primary**: blue-600 with shades
- **Destructive**: red-600 with shades
- **Success**: green-600 with shades
- **Warning**: yellow-600 with shades
- **Info**: cyan-600 with shades

### Typography

- **Headers**: Font-weight 600 (semibold)
- **Body**: Font-weight 400 (regular)
- **Small**: Text-xs with gray-600

### Spacing

Uses Tailwind's default spacing scale (4px base unit)

### Animations

Uses Framer Motion for smooth transitions:

- Fade in/out
- Slide in/out
- Scale animations
- Stagger groups

## Contributing

When adding new components:

1. Create a new file in `src/components/`
2. Export from `src/components/index.ts`
3. Add TypeScript types and props interfaces
4. Include JSDoc comments
5. Use Tailwind CSS for styling
6. Add examples in this README
7. Build and test in consuming apps

## Best Practices

1. **Use semantic components**: Prefer `<Button>` over `<div onClick>`
2. **Type props properly**: Define interfaces for all props
3. **Support composition**: Use `{children}` for flexibility
4. **Follow accessibility**: Include aria attributes, keyboard support
5. **Responsive design**: Use Tailwind's responsive modifiers
6. **Dark mode ready**: Plan for dark mode support (future)

## License

MIT
