import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/DashboardShellLayout";
import HomePage from "@/pages/PublicHome";
import NotFound from "@/pages/NotFoundView";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/DashboardOverview";
import CampusPage from "./pages/Campus";
import CoursesPage from "./pages/Courses";
import CourseDetailPage from "./pages/CourseDetail";
import SubjectsPage from "./pages/Subjects";
import AreasPage from "./pages/Areas";
import PpcUploadPage from "./pages/PpcUpload";
import ApprovalsPage from "./pages/Approvals";
import ReportsPage from "./pages/Reports";
import UsersPage from "./pages/Users";
import AuditPage from "./pages/Audit";
import OfferingsPage from "./pages/Offerings";
import MemoryCalcPage from "./pages/MemoryCalc";
import BrandComposerPage from "./pages/BrandComposer";

function AuthenticatedRouter() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/campus" component={CampusPage} />
        <Route path="/courses" component={CoursesPage} />
        <Route path="/courses/:id" component={CourseDetailPage} />
        <Route path="/subjects" component={SubjectsPage} />
        <Route path="/areas" component={AreasPage} />
        <Route path="/ppc-upload" component={PpcUploadPage} />
        <Route path="/approvals" component={ApprovalsPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/users" component={UsersPage} />
        <Route path="/offerings" component={OfferingsPage} />
        <Route path="/memory-calc" component={MemoryCalcPage} />
        <Route path="/audit" component={AuditPage} />
        <Route path="/brand-composer" component={BrandComposerPage} />
        <Route path="/" component={Dashboard} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route>
        <AuthenticatedRouter />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
