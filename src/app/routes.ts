import { createBrowserRouter, redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

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
    lazy: async () => {
      const { default: Landing } = await import("../Landing");
      return { Component: Landing };
    },
  },
  {
    path: "/signin",
    loader: () => requireGuest(),
    lazy: async () => {
      const { default: SignIn } = await import("../pages/SignIn");
      return { Component: SignIn };
    },
  },
  {
    path: "/register",
    loader: () => requireGuest(),
    lazy: async () => {
      const { default: Register } = await import("../pages/Register");
      return { Component: Register };
    },
  },
  {
    path: "/dashboard",
    loader: () => requireAuth(),
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
          return { Component: Appointments };
        },
      },
      {
        path: "clients",
        lazy: async () => {
          const { default: Clients } = await import("../pages/dashboard/Clients");
          return { Component: Clients };
        },
      },
      {
        path: "measurements",
        lazy: async () => {
          const { default: Overview } = await import("../pages/dashboard/Overview");
          return { Component: Overview };
        },
      },
      {
        path: "users",
        lazy: async () => {
          const { default: AdminUsers } = await import("../pages/dashboard/AdminUsers");
          return { Component: AdminUsers };
        },
      },
    ],
  },
]);
