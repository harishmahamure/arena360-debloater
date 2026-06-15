import { CategoryPage } from "./CategoryPage";
import { InstalledAppsPage } from "./InstalledApps";

export function AppsPage() {
  return <InstalledAppsPage />;
}

export function PrivacyPage() {
  return (
    <CategoryPage
      category="privacy"
      title="Privacy & Telemetry"
      description="Disable telemetry, advertising ID, and activity tracking."
    />
  );
}

export function ServicesPage() {
  return (
    <CategoryPage
      category="services"
      title="Services"
      description="Disable unnecessary Windows services. Grouped by risk level."
      groupByRisk
    />
  );
}

export function CleanupPage() {
  return (
    <CategoryPage
      category="cleanup"
      title="Disk Cleanup"
      description="Clear temp files, update cache, and run maintenance cleanup."
    />
  );
}

export function WindowsUpdatePage() {
  return (
    <CategoryPage
      category="windows_update"
      title="Windows Update"
      description="Control update behavior. Advanced options can block security patches."
      groupByRisk
    />
  );
}

export function GamingPage() {
  return (
    <CategoryPage
      category="gaming"
      title="Gaming & FPS"
      description="Game Mode, capture settings, power plan, and other FPS-oriented tweaks."
      groupByRisk
    />
  );
}

export function PerformancePage() {
  return (
    <CategoryPage
      category="performance"
      title="Performance"
      description="CPU, RAM, network, and disk optimizations — indexing, uploads, hibernate, and compact OS."
      groupByRisk
    />
  );
}
