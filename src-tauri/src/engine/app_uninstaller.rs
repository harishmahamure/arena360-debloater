use tauri::AppHandle;

use super::error::EngineError;
use super::elevation;
use super::executor::Executor;
use super::logger::ChangeLogger;
use super::models::{ApplyResult, ApplyResultItem, InstalledApp, PreviewAppUninstall};
use super::paths;
use super::powershell;

pub struct AppUninstaller;

impl AppUninstaller {
    pub fn preview(apps: &[InstalledApp]) -> Vec<PreviewAppUninstall> {
        apps.iter()
            .map(|app| {
                let action = if app.app_type == "appx" {
                    format!(
                        "Remove Appx package {} and provisioned copy",
                        app.package_name.as_deref().unwrap_or(&app.display_name)
                    )
                } else {
                    format!("Run Win32 uninstaller for {}", app.display_name)
                };
                PreviewAppUninstall {
                    app_id: app.id.clone(),
                    display_name: app.display_name.clone(),
                    app_type: app.app_type.clone(),
                    action,
                    risk: app.risk,
                    warning: app.warning.clone(),
                }
            })
            .collect()
    }

    pub fn bulk_uninstall(
        app: &AppHandle,
        apps: &[InstalledApp],
        create_restore: bool,
    ) -> Result<ApplyResult, EngineError> {
        if powershell::is_windows() && !elevation::is_elevated() {
            return Err(EngineError::ElevationRequired);
        }

        let restore_point_created = if create_restore {
            Executor::create_restore_point("Debloater Bulk App Uninstall")?
        } else {
            false
        };

        let mut session = ChangeLogger::create_session(restore_point_created)?;
        let mut items = Vec::new();
        let mut success_count = 0u32;
        let mut failure_count = 0u32;

        for installed_app in apps {
            if installed_app.is_protected || !installed_app.can_uninstall {
                failure_count += 1;
                items.push(ApplyResultItem {
                    tweak_id: installed_app.id.clone(),
                    success: false,
                    message: "App is protected and cannot be uninstalled".into(),
                });
                continue;
            }

            match run_uninstall(app, installed_app) {
                Ok(result) => {
                    if result.success {
                        success_count += 1;
                        ChangeLogger::append_with_method(
                            &mut session,
                            &installed_app.id,
                            "app_uninstall",
                            Some(result.stdout.clone()),
                            Some(result.stderr.clone()),
                            None,
                        )?;
                    } else {
                        failure_count += 1;
                    }
                    items.push(ApplyResultItem {
                        tweak_id: installed_app.id.clone(),
                        success: result.success,
                        message: if result.stdout.is_empty() {
                            result.stderr
                        } else {
                            result.stdout
                        },
                    });
                }
                Err(e) => {
                    failure_count += 1;
                    items.push(ApplyResultItem {
                        tweak_id: installed_app.id.clone(),
                        success: false,
                        message: e.to_string(),
                    });
                }
            }
        }

        Ok(ApplyResult {
            session_id: session.session_id,
            items,
            success_count,
            failure_count,
            requires_reboot: false,
        })
    }
}

fn run_uninstall(
    app: &AppHandle,
    installed_app: &InstalledApp,
) -> Result<powershell::ScriptResult, EngineError> {
    let script = paths::scripts_dir(app).join("remediation/uninstall-app.ps1");

    if !powershell::is_windows() {
        return Ok(powershell::ScriptResult {
            success: true,
            stdout: format!("mock_uninstalled:{}", installed_app.display_name),
            stderr: String::new(),
            exit_code: 0,
        });
    }

    if !script.exists() {
        return Err(EngineError::Script(format!(
            "script not found: {}",
            script.display()
        )));
    }

    let json =
        serde_json::to_string(installed_app).map_err(|e| EngineError::Script(e.to_string()))?;

    powershell::run_script_with_args(&script, &["-AppJson", &json], 120)
}
