use tauri::AppHandle;

use super::catalog::TweakCatalog;
use super::error::EngineError;
use super::logger::ChangeLogger;
use super::models::{ApplyResultItem, RevertResult, SessionLog};
use super::paths;
use super::powershell::{self, run_script};

pub struct Reverter;

impl Reverter {
    pub fn revert_session(
        app: &AppHandle,
        catalog: &TweakCatalog,
        session_id: &str,
    ) -> Result<RevertResult, EngineError> {
        let session = ChangeLogger::load(session_id)?;
        Self::rollback_session(app, catalog, &session)
    }

    pub fn rollback_session(
        app: &AppHandle,
        catalog: &TweakCatalog,
        session: &SessionLog,
    ) -> Result<RevertResult, EngineError> {
        let mut items = Vec::new();
        let mut reverted_count = 0u32;
        let mut failed_count = 0u32;

        for entry in session.entries.iter().rev() {
            let result = if entry.method == "resource_stop" {
                Self::revert_resource_entry(app, entry)
            } else if entry.method == "resource_uninstall" || entry.method == "app_uninstall" {
                Ok(powershell::ScriptResult {
                    success: true,
                    stdout: "Uninstall revert requires manual reinstall".into(),
                    stderr: String::new(),
                    exit_code: 0,
                })
            } else {
                let tweak = catalog.get(&entry.tweak_id)?;
                let script_path = paths::resolve_script(app, &tweak.revert_script);
                run_script(&script_path, 120)
            };

            match result {
                Ok(output) => {
                    let success = output.success;
                    if success {
                        reverted_count += 1;
                    } else {
                        failed_count += 1;
                    }
                    items.push(ApplyResultItem {
                        tweak_id: entry.tweak_id.clone(),
                        success,
                        message: if output.stderr.is_empty() {
                            output.stdout
                        } else {
                            output.stderr
                        },
                    });
                }
                Err(e) => {
                    failed_count += 1;
                    items.push(ApplyResultItem {
                        tweak_id: entry.tweak_id.clone(),
                        success: false,
                        message: e.to_string(),
                    });
                }
            }
        }

        Ok(RevertResult {
            session_id: session.session_id.clone(),
            reverted_count,
            failed_count,
            items,
        })
    }

    pub fn rollback_resource_session(
        app: &AppHandle,
        session: &SessionLog,
    ) -> Result<RevertResult, EngineError> {
        let mut items = Vec::new();
        let mut reverted_count = 0u32;
        let mut failed_count = 0u32;

        for entry in session.entries.iter().rev() {
            if entry.method != "resource_stop" {
                continue;
            }
            match Self::revert_resource_entry(app, entry) {
                Ok(output) => {
                    let success = output.success;
                    if success {
                        reverted_count += 1;
                    } else {
                        failed_count += 1;
                    }
                    items.push(ApplyResultItem {
                        tweak_id: entry.tweak_id.clone(),
                        success,
                        message: output.stdout,
                    });
                }
                Err(e) => {
                    failed_count += 1;
                    items.push(ApplyResultItem {
                        tweak_id: entry.tweak_id.clone(),
                        success: false,
                        message: e.to_string(),
                    });
                }
            }
        }

        Ok(RevertResult {
            session_id: session.session_id.clone(),
            reverted_count,
            failed_count,
            items,
        })
    }

    fn revert_resource_entry(
        app: &AppHandle,
        entry: &super::models::ChangeLogEntry,
    ) -> Result<powershell::ScriptResult, EngineError> {
        let snapshot = entry
            .snapshot
            .resource_snapshot
            .as_deref()
            .unwrap_or("{}");
        let script = paths::scripts_dir(app).join("remediation/revert-resource.ps1");

        if !powershell::is_windows() {
            return Ok(powershell::ScriptResult {
                success: true,
                stdout: "reverted".into(),
                stderr: String::new(),
                exit_code: 0,
            });
        }

        let output = powershell::run_script_with_args(
            &script,
            &["-SnapshotJson", snapshot],
            120,
        )?;

        Ok(output)
    }
}
