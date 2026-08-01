import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation
} from "react-router-dom";
import { routes } from "@/routes/routes";
import Loading from "@/pages/_layout/loading.tsx";
import Layout from "@/pages/_layout";
import { useLanguageParameter } from "@/hooks/useLanguageParameter.ts";

const ProtectedRoute = lazy(() => import("@/routes/ProtectedRoute"));

/** Chuẩn hoá /permissions/ → /permissions để khớp route SPA (tránh 404 trên host). */
function StripTrailingSlash() {
  const location = useLocation();

  if (location.pathname.length > 1 && location.pathname.endsWith("/")) {
    const next =
      `${location.pathname.replace(/\/+$/, "")}${location.search}${location.hash}` ||
      "/";
    return <Navigate to={next} replace />;
  }

  return null;
}

const RoutesWithLanguageDetection = () => {
  useLanguageParameter();

  return (
    <>
      <StripTrailingSlash />
      <Routes>
        {routes.map(route => {
          const Element = route.element;

          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                route.auth ? (
                  <Layout>
                    <Suspense fallback={<Loading />}>
                      <ProtectedRoute
                        roles={route.roles}
                        permissions={route.permissions}
                        requiredMenu={route.requiredMenu}
                      >
                        <Element />
                      </ProtectedRoute>
                    </Suspense>
                  </Layout>
                ) : (
                  <Element />
                )
              }
            />
          );
        })}
      </Routes>
    </>
  );
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <RoutesWithLanguageDetection />
    </BrowserRouter>
  );
};

export default AppRoutes;
