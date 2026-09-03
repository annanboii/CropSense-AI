import React from "react";
import { FarmProvider, useFarm } from "./context/FarmContext";
import { LanguageProvider, useTranslation } from "./i18n/LanguageContext";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthPage } from "./components/auth/AuthPage";
import { FarmOnboardingFlow } from "./components/onboarding/FarmOnboardingFlow";
import { Dashboard } from "./pages/Dashboard";
import { CropScanner } from "./pages/CropScanner";
import { Weather } from "./pages/Weather";
import { MyCrops } from "./pages/MyCrops";
import { IrrigationAdvisor } from "./pages/IrrigationAdvisor";
import { DiseaseRisk } from "./pages/DiseaseRisk";
import { FarmAdvisor } from "./pages/FarmAdvisor";
import { Analytics } from "./pages/Analytics";
import { Alerts } from "./pages/Alerts";
import { Settings } from "./pages/Settings";
import { normalizeTab } from "./utils/navigation";
import { Sprout } from "lucide-react";

const MainContent: React.FC = () => {
  const {
    activeTab,
    activeTabKey,
    currentUser,
    isAuthenticated,
    isDemoMode,
    isLoadingAuth,
  } = useFarm();
  const { t } = useTranslation();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center animate-bounce shadow-lg shadow-emerald-900/40">
          <Sprout className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-slate-300">{t("common.loading", "Loading CropSense AI...")}</p>
      </div>
    );
  }

  // 1. If not logged in & not demo mode, show Auth / Welcome
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // 2. If signed up but farm setup is not yet completed (and not demo mode), show Onboarding
  if (currentUser && !currentUser.farmSetupCompleted && !isDemoMode) {
    return <FarmOnboardingFlow />;
  }

  // 3. User is authenticated and setup is completed -> Render Application
  const currentKey = activeTabKey || normalizeTab(activeTab);

  const renderActivePage = () => {
    switch (currentKey) {
      case "dashboard":
        return <Dashboard />;
      case "scanner":
        return <CropScanner />;
      case "weather":
        return <Weather />;
      case "crops":
        return <MyCrops />;
      case "irrigation":
        return <IrrigationAdvisor />;
      case "disease":
        return <DiseaseRisk />;
      case "advisor":
        return <FarmAdvisor />;
      case "analytics":
        return <Analytics />;
      case "alerts":
        return <Alerts />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return <AppLayout>{renderActivePage()}</AppLayout>;
};

export default function App() {
  return (
    <LanguageProvider>
      <FarmProvider>
        <MainContent />
      </FarmProvider>
    </LanguageProvider>
  );
}


