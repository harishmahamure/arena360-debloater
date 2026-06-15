use tauri::AppHandle;

use super::error::EngineError;
use super::elevation;
use super::executor::Executor;
use super::logger::ChangeLogger;
use super::models::{
    ApplyResult, ApplyResultItem, PreviewResourceItem, ResourceAction, ResourceEntry,
};
use super::paths;
use super::powershell;
use super::reverter::Reverter;

pub struct ResourceRemover;

impl ResourceRemover {
    pub fn preview(
        entries: &[ResourceEntry],
        action: ResourceAction,
    ) -> Vec<PreviewResourceItem> {
        entries
            .iter()
            .map(|entry| {
                let (action_label, description) = match action {
                    ResourceAction::Stop => (
                        "Stop forever",
                        format!(
                            "Kill process {}, disable services [{}], remove startup entries",
                            entry.process_name,
                            entry.service_names.join(", ")
                        ),
                    ),
                    ResourceAction::Uninstall => (
                        "Uninstall",
                        if let Some(pkg) = &entry.package_name {
                            format!("Remove Appx package {pkg} and provisioned copy")
                        } else {
                            format!("Run Win32 uninstaller for {}", entry.display_name)
                        },
                    ),
                };
                PreviewResourceItem {
                    entry_id: entry.id.clone(),
                    display_name: entry.display_name.clone(),
                    action: action_label.into(),
                    description,
                    risk: entry.risk,
                    warning: entry.warning.clone(),
                }
            })
            .collect()
    }

    pub fn apply(
        app: &AppHandle,
        entries: &[ResourceEntry],
        action: ResourceAction,
        create_restore: bool,
    ) -> Result<ApplyResult, EngineError> {
        if powershell::is_windows() && !elevation::is_elevated() {
            return Err(EngineError::ElevationRequired);
        }

        let restore_point_created = if create_restore {
            Executor::create_restore_point("Debloater Resource Action")?
        } else {
            false
        };

        let mut session = ChangeLogger::create_session(restore_point_created)?;
        let mut items = Vec::new();
        let mut success_count = 0u32;
        let mut failure_count = 0u32;

        for entry in entries {
            if entry.is_protected {
                failure_count += 1;
                items.push(ApplyResultItem {
                    tweak_id: entry.id.clone(),
                    success: false,
                    message: "Entry is protected".into(),
                });
                continue;
            }

            let result = match action {
                ResourceAction::Stop => Self::stop_entry(app, entry),
                ResourceAction::Uninstall => Self::uninstall_entry(app, entry),
            };

            match result {
                Ok((success, message, snapshot)) => {
                    let method = match action {
                        ResourceAction::Stop => "resource_stop",
                        ResourceAction::Uninstall => "resource_uninstall",
                    };
                    if success {
                        success_count += 1;
                        ChangeLogger::append_with_method(
                            &mut session,
                            &entry.id,
                            method,
                            Some(message.clone()),
                            None,
                            snapshot,
                        )?;
                    } else {
                        failure_count += 1;
                        if action == ResourceAction::Uninstall && message.contains("no_uninstaller") {
                            // fallback to stop
                            let (stop_ok, stop_msg, stop_snap) = Self::stop_entry(app, entry)?;
                            if stop_ok {
                                success_count += 1;
                                failure_count -= 1;
                                ChangeLogger::append_with_method(
                                    &mut session,
                                    &entry.id,
                                    "resource_stop",
                                    Some(format!("Uninstall unavailable; stopped instead: {stop_msg}")),
                                    None,
                                    stop_snap,
                                )?;
                            }
                        }
                    }
                    items.push(ApplyResultItem {
                        tweak_id: entry.id.clone(),
                        success,
                        message,
                    });
                }
                Err(e) => {
                    failure_count += 1;
                    let _ = Reverter::rollback_resource_session(app, &session);
                    return Err(e);
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

    fn stop_entry(
        app: &AppHandle,
        entry: &ResourceEntry,
    ) -> Result<(bool, String, Option<String>), EngineError> {
        let script = paths::scripts_dir(app).join("remediation/stop-resource.ps1");
        let json = serde_json::to_string(entry).map_err(|e| EngineError::Script(e.to_string()))?;
        let result = powershell::run_script_with_args(&script, &["-EntryJson", &json], 120)?;
        let snapshot = if result.success {
            Some(result.stdout.clone())
        } else {
            None
        };
        Ok((
            result.success,
            if result.stdout.is_empty() {
                "Stopped".into()
            } else {
                result.stdout.clone()
            },
            snapshot,
        ))
    }

    fn uninstall_entry(
        app: &AppHandle,
        entry: &ResourceEntry,
    ) -> Result<(bool, String, Option<String>), EngineError> {
        if !entry.can_uninstall && entry.package_name.is_none() {
            return Ok((false, "no_uninstaller_found".into(), None));
        }
        let script = paths::scripts_dir(app).join("remediation/uninstall-resource.ps1");
        let json = serde_json::to_string(entry).map_err(|e| EngineError::Script(e.to_string()))?;
        let result = powershell::run_script_with_args(&script, &["-EntryJson", &json], 120)?;
        Ok((
            result.success,
            if result.stdout.is_empty() {
                result.stderr.clone()
            } else {
                result.stdout.clone()
            },
            None,
        ))
    }
}
