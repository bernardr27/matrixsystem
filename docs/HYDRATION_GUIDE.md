# 💧 Matrix Hydration Guide v1.0

Hydration errors occur when the server-rendered HTML does not match the initial client-side React tree. This guide document common pitfalls and solutions for maintaining stability across the Matrix ecosystem.

## 🏹 Common Causes

### 1. Non-Deterministic Randomness
Using `Math.random()` during the render phase results in different values on the server and client.
- **❌ BAD**: `const id = useMemo(() => Math.random(), [])`
- **✅ GOOD**: `const [id, setId] = useState(0); useEffect(() => setId(Math.random()), [])` or use index-based seeds.

### 2. Time & Date Fluctuations
Rendering `new Date()` or `Date.now()` directly in the JSX will almost always cause a mismatch due to the millisecond gap between server execution and client mounting.
- **❌ BAD**: `<span>{new Date().toLocaleTimeString()}</span>`
- **✅ GOOD**: Use a `mounted` state guard.

### 3. Localized Formatting
Browser-specific locales can cause `toLocaleDateString()` to differ from the server's locale.

## 🛠️ The "Mounted" Guard Pattern

The most reliable way to handle client-only data is the `mounted` state pattern.

```tsx
function MyComponent() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Render a placeholder or null that matches the server
        return <div className="loading-state">--:--</div>; 
    }

    return <div>{new Date().toLocaleTimeString()}</div>;
}
```

## 🔍 How to Debug

1. **Check the Console**: Look for "Text content did not match" or "Prop `X` did not match".
2. **View Page Source**: Right-click -> View Page Source to see what the server sent.
3. **Compare with DevTools**: Inspect the element in Chrome DevTools to see what the client rendered.

## 🚀 Matrix Specific Standards

- All telemetry timestamps must use the `mounted` guard.
- All animations with random durations (Framer Motion) should use index-based seeds: `duration: 1 + (index % 5) * 0.2`.
- Unique IDs for database operations (`uuidv4`) should be generated inside `useEffect` or triggered by user events, never during raw render.

---
*Location: g:\matrix\docs\HYDRATION_GUIDE.md*
