import { Navigate, createBrowserRouter } from 'react-router-dom'
import { RequireAuth } from './app/guards/RequireAuth'
import { RequireDealer, RequireInternal } from './app/guards/RequireDealerScope'
import { RequirePermission } from './app/guards/RequirePermission'
import { AdaptiveLayout } from './app/layouts/AdaptiveLayout'
import { AppLayout } from './app/layouts/AppLayout'
import { DealerLayout } from './app/layouts/DealerLayout'
import { PdaLayout } from './app/layouts/PdaLayout'
import { PublicLayout } from './app/layouts/PublicLayout'
import { AdminPage } from './pages/admin/AdminPage'
import { CertificateDetailPage, CertificatesPage } from './pages/certificates/CertificatesPage'
import { CargaPage } from './pages/charging/CargaPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { DealerCertsPage, DealerHonraNuevaPage, DealerHonraPage, DealerSellPage } from './pages/dealer/DealerOpsPages'
import { DealerDetailPage, DealersListPage } from './pages/dealers/DealersPages'
import { DesignSystemPage } from './pages/design-system/DesignSystemPage'
import { DealerAuthPage } from './pages/honras/DealerAuthPage'
import { HonrasListPage } from './pages/honras/HonrasListPage'
import { HonraWizardPage } from './pages/honras/HonraWizardPage'
import { InspectionDetailPage, InspectionListPage } from './pages/inspection/InspectionPages'
import { InspectionNewPage } from './pages/inspection/InspectionNewPage'
import { IntegracionPage } from './pages/integracion/IntegracionPage'
import { AccountPickerPage } from './pages/login/AccountPickerPage'
import { LoginPage } from './pages/login/LoginPage'
import { MaestrosPage } from './pages/maestros/MaestrosPage'
import { PdaConteoPage, PdaDiagnosticoPage, PdaHomePage, PdaResumenPage } from './pages/pda/PdaPages'
import { PoliciesPage } from './pages/policies/PoliciesPage'
import { TestCasesPage } from './pages/policies/TestCasesPage'
import { CertificateLookupPage } from './pages/public/CertificateLookupPage'
import { CertificatePublicPage } from './pages/public/CertificatePublicPage'
import { ReportesPage } from './pages/reportes/ReportesPage'
import { SearchPage } from './pages/search/SearchPage'
import { SerialPage } from './pages/serial/SerialPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/login/cuentas', element: <AccountPickerPage /> },
  {
    element: <PublicLayout />,
    children: [
      { path: '/certificado', element: <CertificateLookupPage /> },
      { path: '/certificado/:id', element: <CertificatePublicPage /> },
      { path: '/design-system', element: <DesignSystemPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AdaptiveLayout />,
        children: [
          { path: '/buscar', element: <SearchPage /> },
          { path: '/serial/:serial', element: <SerialPage /> },
        ],
      },
      {
        element: <RequireInternal />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/', element: <DashboardPage /> },
              { path: '/distribuidores', element: <DealersListPage /> },
              { path: '/distribuidores/:id', element: <DealerDetailPage /> },
              { path: '/gestion-tecnica', element: <InspectionListPage /> },
              { path: '/gestion-tecnica/nueva', element: <InspectionNewPage /> },
              { path: '/gestion-tecnica/:id', element: <InspectionDetailPage /> },
              { path: '/carga', element: <CargaPage /> },
              { path: '/certificados', element: <CertificatesPage /> },
              { path: '/certificados/:id', element: <CertificateDetailPage /> },
              {
                element: <RequirePermission anyOf={['ejecutar_honra']} />,
                children: [
                  { path: '/honras', element: <HonrasListPage /> },
                  { path: '/honras/nueva', element: <HonraWizardPage /> },
                ],
              },
              {
                element: <RequirePermission anyOf={['autorizar_honra_dealer']} />,
                children: [{ path: '/honras/dealer', element: <DealerAuthPage /> }],
              },
              {
                element: <RequirePermission anyOf={['editar_politicas']} />,
                children: [
                  { path: '/configuracion/politicas', element: <PoliciesPage /> },
                  { path: '/configuracion/casos-prueba', element: <TestCasesPage /> },
                ],
              },
              { path: '/maestros', element: <MaestrosPage /> },
              {
                element: <RequirePermission anyOf={['editar_matriz', 'reset_demo']} />,
                children: [{ path: '/administracion', element: <AdminPage /> }],
              },
              {
                element: <RequirePermission anyOf={['ver_integracion']} />,
                children: [{ path: '/integracion', element: <IntegracionPage /> }],
              },
              { path: '/reportes', element: <ReportesPage /> },
            ],
          },
        ],
      },
      {
        element: <RequireDealer />,
        children: [
          {
            element: <DealerLayout />,
            children: [
              { path: '/dealer', element: <DashboardPage /> },
              { path: '/dealer/vender', element: <DealerSellPage /> },
              { path: '/dealer/certificados', element: <DealerCertsPage /> },
              { path: '/dealer/honra', element: <DealerHonraPage /> },
              { path: '/dealer/honra/nueva', element: <DealerHonraNuevaPage /> },
            ],
          },
        ],
      },
      {
        element: <PdaLayout />,
        children: [
          { path: '/pda', element: <PdaHomePage /> },
          { path: '/pda/conteo', element: <PdaConteoPage /> },
          { path: '/pda/diagnostico/:serial', element: <PdaDiagnosticoPage /> },
          { path: '/pda/resumen', element: <PdaResumenPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
