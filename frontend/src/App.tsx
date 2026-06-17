import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./providers/ThemeProvider";
import { ToastProvider } from "./providers/ToastProvider";
import { AuthScreen } from "./components/auth/AuthScreen";
import { AppShell } from "./components/layout/AppShell";

export function App() {
  const auth = useAuth();

  return (
    <ThemeProvider>
      <ToastProvider>
        <TooltipPrimitive.Provider delayDuration={250}>
          {auth.isLoggedIn ? (
            <AppShell user={auth.user} onLogout={auth.logout} />
          ) : (
            <AuthScreen login={auth.login} register={auth.register} />
          )}
        </TooltipPrimitive.Provider>
      </ToastProvider>
    </ThemeProvider>
  );
}
