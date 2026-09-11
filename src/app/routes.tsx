import { createBrowserRouter, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import ErrorPage from "../components/ErrorPage";
import { RoleGate } from "../components/RoleGate";
import type { UserRole } from "../api";

function requireAuth() {
  const token = localStorage.getItem("morphofit_token");
  if (!token) return redirect("/signin");
  return null;
}

function requireGuest() {
  const token = localStorage.getItem("morphofit_token");
  if (token) return redirect("/dashboard");
  return null;
}

export const router = createBrowserRouter([
  {
    path: "/",
    errorElement: <ErrorPage />,
    lazy: async () => {
      const { default: Landing } = await import("../Landing");
      return { Component: Landing };
    },
  },
  {
    path: "/signin",
    loader: () => requireGuest(),
    errorElement: <ErrorPage />,
    lazy: async () => {
      const { default: SignIn } = await import("../pages/SignIn");
      return { Component: SignIn };
    },
  },
  {
    path: "/register",
    loader: () => requireGuest(),
    errorElement: <ErrorPage />,
    lazy: async () => {
      const { default: Register } = await import("../pages/Register");
      return { Component: Register };
    },
  },
  {
    // Public because the whole point is recovering an account you can't
    // sign in to — requireGuest would lock out a logged-out user with a
    // valid emailed link.
    path: "/forgot-password",
    errorElement: <ErrorPage />,
    lazy: async () => {
      const { default: ForgotPassword } = await import("../pages/ForgotPassword");
      return { Component: ForgotPassword };
    },
  },
  {
    path: "/reset-password",
    errorElement: <ErrorPage />,
    lazy: async () => {
      const { default: ResetPassword } = await import("../pages/ResetPassword");
      return { Component: ResetPassword };
    },
  },
  {
    // Reachable signed in or out — the link lands from an email client.
    path: "/verify-email",
    errorElement: <ErrorPage />,
    lazy: async () => {
      const { default: VerifyEmail } = await import("../pages/VerifyEmail");
      return { Component: VerifyEmail };
    },
  },
  {
    path: "/dashboard",
    loader: () => requireAuth(),
    errorElement: <ErrorPage />,
    lazy: async () => {
      const { default: Layout } = await import("../pages/dashboard/Layout");
      return { Component: Layout };
    },
    children: [
      {
        index: true,
        lazy: async () => {
          const { default: Overview } = await import("../pages/dashboard/Overview");
          return { Component: Overview };
        },
      },
      {
        path: "orders",
        lazy: async () => {
          const { default: Orders } = await import("../pages/dashboard/Orders");
          return { Component: Orders };
        },
      },
      {
        path: "appointments",
        lazy: async () => {
          const { default: Appointments } = await import("../pages/dashboard/Appointments");
          return { Component: () => <RoleGate roles={["client", "tailor"] as UserRole[]}><Appointments /></RoleGate> };
        },
      },
      {
        path: "clients",
        lazy: async () => {
          const { default: Clients } = await import("../pages/dashboard/Clients");
          return { Component: () => <RoleGate roles={["stylist"] as UserRole[]}><Clients /></RoleGate> };
        },
      },
      {
        path: "tailors",
        lazy: async () => {
          const { default: TailorsDirectory } = await import("../pages/dashboard/TailorsDirectory");
          return { Component: () => <RoleGate roles={["client"] as UserRole[]}><TailorsDirectory /></RoleGate> };
        },
      },
      {
        path: "measurements",
        lazy: async () => {
          const { default: MeasurementsScan } = await import("../pages/dashboard/MeasurementsScan");
          return { Component: () => <RoleGate roles={["client"] as UserRole[]}><MeasurementsScan /></RoleGate> };
        },
      },
      {
        path: "visualizer",
        lazy: async () => {
          const { default: StyleVisualizer } = await import("../pages/dashboard/StyleVisualizer");
          return { Component: () => <RoleGate roles={["client", "stylist", "tailor"] as UserRole[]}><StyleVisualizer /></RoleGate> };
        },
      },
      {
        path: "delivery-radar",
        lazy: async () => {
          const { default: DeliveryRadar } = await import("../pages/dashboard/DeliveryRadar");
          return { Component: () => <RoleGate roles={["delivery_agent"] as UserRole[]}><DeliveryRadar /></RoleGate> };
        },
      },
      {
        path: "stylist-studio",
        lazy: async () => {
          const { default: StylistStudio } = await import("../pages/dashboard/StylistStudio");
          return { Component: () => <RoleGate roles={["stylist"] as UserRole[]}><StylistStudio /></RoleGate> };
        },
      },
      {
        path: "catalog",
        lazy: async () => {
          const { default: AdminCatalog } = await import("../pages/dashboard/AdminCatalog");
          return { Component: () => <RoleGate roles={["admin"] as UserRole[]}><AdminCatalog /></RoleGate> };
        },
      },
      {
        path: "reports",
        lazy: async () => {
          const { default: AdminReports } = await import("../pages/dashboard/AdminReports");
          return { Component: () => <RoleGate roles={["admin"] as UserRole[]}><AdminReports /></RoleGate> };
        },
      },
      {
        path: "support",
        lazy: async () => {
          const { default: AdminSupport } = await import("../pages/dashboard/AdminSupport");
          return { Component: () => <RoleGate roles={["admin"] as UserRole[]}><AdminSupport /></RoleGate> };
        },
      },
      {
        path: "help",
        lazy: async () => {
          const { default: Help } = await import("../pages/dashboard/Help");
          return { Component: Help };
        },
      },
      {
        path: "users",
        lazy: async () => {
          const { default: AdminUsers } = await import("../pages/dashboard/AdminUsers");
          return { Component: () => <RoleGate roles={["admin"] as UserRole[]}><AdminUsers /></RoleGate> };
        },
      },
      {
        path: "users/:id",
        lazy: async () => {
          const { default: PublicProfile } = await import("../pages/dashboard/PublicProfile");
          return { Component: PublicProfile };
        },
      },
      {
        path: "profile",
        lazy: async () => {
          const { default: Profile } = await import("../pages/dashboard/Profile");
          return { Component: Profile };
        },
      },
      {
        path: "settings",
        lazy: async () => {
          const { default: Settings } = await import("../pages/dashboard/Settings");
          return { Component: Settings };
        },
      },
      {
        path: "messages",
        lazy: async () => {
          const { default: Messaging } = await import("../pages/dashboard/Messaging");
          return { Component: Messaging };
        },
      },
      {
        path: "messages/:conversationId",
        lazy: async () => {
          const { default: Messaging } = await import("../pages/dashboard/Messaging");
          return { Component: Messaging };
        },
      },
    ],
  },
]);
