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
