import { RouterProvider } from "react-router";
import { AuthProvider } from "./AuthContext";
import { NotificationsProvider } from "./NotificationsContext";
import { ThemeProvider } from "./theme";
import { ToastProvider } from "./components/ui/Toast";
import { router } from "./app/routes";

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NotificationsProvider>
            <RouterProvider router={router} />
          </NotificationsProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
