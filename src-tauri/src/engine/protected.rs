use std::fs;
use std::path::Path;

use serde::Deserialize;

use super::models::{InstalledApp, ResourceEntry, RiskLevel};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ProtectedList {
    process_names: Vec<String>,
    service_names: Vec<String>,
    critical_svchost_services: Vec<String>,
    advanced_service_names: Vec<String>,
    #[serde(default)]
    package_names: Vec<String>,
    #[serde(default)]
    display_name_patterns: Vec<String>,
}

pub struct ProtectedRegistry {
    list: ProtectedList,
}

impl ProtectedRegistry {
    pub fn load(path: &Path) -> Result<Self, String> {
        let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
        let list: ProtectedList = serde_json::from_str(&content).map_err(|e| e.to_string())?;
        Ok(Self { list })
    }

    pub fn apply_resources(&self, entries: &mut [ResourceEntry]) {
        for entry in entries.iter_mut() {
            if self.is_protected_resource(entry) {
                entry.is_protected = true;
                entry.can_stop = false;
                entry.can_uninstall = false;
                entry.warning = Some(
                    "Protected system component — cannot stop or uninstall".into(),
                );
                entry.risk = RiskLevel::Advanced;
                continue;
            }
            entry.risk = self.assess_resource_risk(entry);
            if entry.risk == RiskLevel::Advanced {
                entry.warning = entry.warning.clone().or(Some(
                    "Core or Microsoft system component — proceed with caution".into(),
                ));
            } else if entry.risk == RiskLevel::Moderate {
                entry.warning = entry.warning.clone().or(Some(
                    "May affect hardware or OEM features".into(),
                ));
            }
        }
    }

    pub fn apply_apps(&self, apps: &mut [InstalledApp]) {
        for app in apps.iter_mut() {
            if self.is_protected_app(app) || app.is_protected {
                app.is_protected = true;
                app.can_uninstall = false;
                app.warning = app.warning.clone().or(Some(
                    "Protected system application — cannot uninstall".into(),
                ));
                app.risk = RiskLevel::Advanced;
                continue;
            }
            app.risk = self.assess_app_risk(app);
            if app.risk == RiskLevel::Advanced {
                app.warning = app.warning.clone().or(Some(
                    "Microsoft system app — uninstall may break Windows features".into(),
                ));
            } else if app.risk == RiskLevel::Moderate {
                app.warning = app.warning.clone().or(Some(
                    "OEM or driver-related app — proceed with caution".into(),
                ));
            }
        }
    }

    fn is_protected_resource(&self, entry: &ResourceEntry) -> bool {
        let proc = entry.process_name.to_lowercase();
        if self
            .list
            .process_names
            .iter()
            .any(|p| p.to_lowercase() == proc)
        {
            return true;
        }

        if proc == "svchost" {
            for svc in &entry.service_names {
                if self
                    .list
                    .critical_svchost_services
                    .iter()
                    .any(|c| c.eq_ignore_ascii_case(svc))
                {
                    return true;
                }
            }
        }

        for svc in &entry.service_names {
            if self
                .list
                .service_names
                .iter()
                .any(|s| s.eq_ignore_ascii_case(svc))
            {
                return true;
            }
        }

        if let Some(pkg) = &entry.package_name {
            if self.is_protected_package(pkg) {
                return true;
            }
        }

        false
    }

    fn is_protected_package(&self, pkg: &str) -> bool {
        self.list.package_names.iter().any(|p| {
            p.eq_ignore_ascii_case(pkg) || pkg.starts_with(p.as_str())
        })
    }

    fn is_protected_app(&self, app: &InstalledApp) -> bool {
        if let Some(pkg) = &app.package_name {
            if self.is_protected_package(pkg) {
                return true;
            }
        }

        for pattern in &self.list.display_name_patterns {
            if app.display_name.contains(pattern) {
                return true;
            }
        }

        false
    }

    fn assess_resource_risk(&self, entry: &ResourceEntry) -> RiskLevel {
        let publisher = entry.publisher.to_lowercase();
        let is_microsoft = publisher.contains("microsoft");
        let proc = entry.process_name.to_lowercase();

        for svc in &entry.service_names {
            if self
                .list
                .advanced_service_names
                .iter()
                .any(|s| s.eq_ignore_ascii_case(svc))
            {
                return RiskLevel::Advanced;
            }
        }

        if is_microsoft && !entry.service_names.is_empty() {
            return RiskLevel::Advanced;
        }

        if proc == "svchost"
            || publisher.contains("oem")
            || publisher.contains("dell")
            || publisher.contains("hp")
            || publisher.contains("lenovo")
        {
            return RiskLevel::Moderate;
        }

        RiskLevel::Safe
    }

    fn assess_app_risk(&self, app: &InstalledApp) -> RiskLevel {
        let publisher = app.publisher.to_lowercase();
        let name = app.display_name.to_lowercase();

        if publisher.contains("microsoft")
            && (name.contains("windows") || name.starts_with("microsoft."))
        {
            return RiskLevel::Advanced;
        }

        if publisher.contains("dell")
            || publisher.contains("hp")
            || publisher.contains("lenovo")
            || publisher.contains("mcafee")
        {
            return RiskLevel::Moderate;
        }

        RiskLevel::Safe
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_resource() -> ResourceEntry {
        ResourceEntry {
            id: "proc:1".into(),
            display_name: "Test".into(),
            entry_type: "app".into(),
            process_name: "csrss".into(),
            process_id: 1,
            service_names: vec![],
            package_name: None,
            publisher: String::new(),
            cpu_percent: 1.0,
            ram_mb: 100.0,
            gpu_percent: 0.0,
            gpu_copy_percent: 0.0,
            gpu_3d_percent: 0.0,
            gpu_video_percent: 0.0,
            gpu_top_engine: None,
            disk_mbps: 0.0,
            disk_read_mbps: 0.0,
            disk_write_mbps: 0.0,
            network_connections: 0,
            can_stop: true,
            can_uninstall: false,
            is_protected: false,
            risk: RiskLevel::Safe,
            warning: None,
        }
    }

    fn sample_app() -> InstalledApp {
        InstalledApp {
            id: "appx:edge".into(),
            display_name: "Microsoft Edge".into(),
            publisher: "Microsoft Corporation".into(),
            app_type: "appx".into(),
            package_name: Some("Microsoft.MicrosoftEdge.Stable".into()),
            uninstall_key: None,
            size_mb: 0.0,
            can_uninstall: true,
            is_protected: false,
            is_bloat: false,
            risk: RiskLevel::Safe,
            warning: None,
        }
    }

    #[test]
    fn protects_critical_processes() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/protected.json");
        let registry = ProtectedRegistry::load(&path).expect("load protected");
        let mut entries = vec![sample_resource()];
        registry.apply_resources(&mut entries);
        assert!(entries[0].is_protected);
        assert!(!entries[0].can_stop);
    }

    #[test]
    fn protects_edge_app() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR")).join("resources/protected.json");
        let registry = ProtectedRegistry::load(&path).expect("load protected");
        let mut apps = vec![sample_app()];
        registry.apply_apps(&mut apps);
        assert!(apps[0].is_protected);
        assert!(!apps[0].can_uninstall);
    }
}
