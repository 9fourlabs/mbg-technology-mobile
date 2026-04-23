import { SafeAreaProvider } from "react-native-safe-area-context";
import AppRoot from "./src/AppRoot";
import ErrorBoundary from "./src/components/ErrorBoundary";

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <AppRoot />
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
