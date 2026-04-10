# expo-sqlite SQLiteProvider children memo bug repro

Minimal reproduction for a bug in `expo-sqlite` where `SQLiteProvider` skips re-renders when `children` change.

## Bug Summary

`SQLiteProvider` is wrapped with `React.memo` using a custom comparator in [`packages/expo-sqlite/src/hooks.tsx` lines 114–121](https://github.com/expo/expo/blob/main/packages/expo-sqlite/src/hooks.tsx#L114-L121). The comparator checks `databaseName`, `options`, `assetSource`, `directory`, `onInit`, `onError`, and `useSuspense` — but **omits `children`**. This means when `children` changes (e.g., switching between JSX nodes based on state), `SQLiteProvider` does not re-render and the UI stays stale.

## Root Cause

```ts
// packages/expo-sqlite/src/hooks.tsx lines 114–121
(prevProps: SQLiteProviderProps, nextProps: SQLiteProviderProps) =>
  prevProps.databaseName === nextProps.databaseName &&
  deepEqual(prevProps.options, nextProps.options) &&
  deepEqual(prevProps.assetSource, nextProps.assetSource) &&
  prevProps.directory === nextProps.directory &&
  prevProps.onInit === nextProps.onInit &&
  prevProps.onError === nextProps.onError &&
  prevProps.useSuspense === nextProps.useSuspense;
// `children` is never compared — always returns true when other props are stable
```

`children` is missing from the comparator. When all other props are stable (the common case), the comparator always returns `true`, telling React to skip re-rendering — even if `children` changed.

## Steps to Reproduce

1. Wrap your app in `<SQLiteProvider>`
2. Inside the provider, render different children based on a state value (e.g., `dbInit`)
3. Update that state inside `onInit`
4. Observe that the UI never updates to reflect the new children

```tsx
export default function RootLayout() {
  const [dbInit, setDbInit] = useState(false);

  return (
    <SQLiteProvider
      databaseName="repro"
      options={{ enableChangeListener: true }}
      onInit={async () => {
        setDbInit(true);
      }}
    >
      {dbInit ? (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      ) : (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text>dbInit: {String(dbInit)}</Text>
        </View>
      )}
    </SQLiteProvider>
  );
}
```

**Expected:** After `onInit` sets `dbInit` to `true`, the `<Stack>` is rendered.

**Actual:** The UI remains on the loading screen — `SQLiteProvider` never re-renders because `children` is not included in the memo comparator.

## Run This Repro

```bash
npm install
npm start
```

Open on iOS simulator or Android emulator. The app will be stuck on the loading screen and never transition to the home tab.

## Environment

- `expo-sqlite`: `~55.0.15`
- `expo`: `~55.x`
- Platform: iOS / Android

## Proposed Fix

Add `prevProps.children === nextProps.children` to the comparator:

```ts
(prevProps: SQLiteProviderProps, nextProps: SQLiteProviderProps) =>
  prevProps.databaseName === nextProps.databaseName &&
  deepEqual(prevProps.options, nextProps.options) &&
  deepEqual(prevProps.assetSource, nextProps.assetSource) &&
  prevProps.directory === nextProps.directory &&
  prevProps.onInit === nextProps.onInit &&
  prevProps.onError === nextProps.onError &&
  prevProps.useSuspense === nextProps.useSuspense &&
  prevProps.children === nextProps.children; // add this
```
