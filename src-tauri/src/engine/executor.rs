use tauri::AppHandle;

use super::catalog::TweakCatalog;
use super::elevation;
use super::error::EngineError;
use super::logger::ChangeLogger;
use super::models::{ApplyResult, ApplyResultItem, PreviewItem, SessionLog};
use super::paths;
use super::powershell::{self, create_restore_point, run_script};
use super::reverter::Reverter;

pub struct Executor;

impl Executor {
    pub fn preview(
        app: &AppHandle,
        catalog: &TweakCatalog,
        tweak_ids: &[String],
    ) -> Result<Vec<PreviewItem>, EngineError> {
        let tweaks = catalog.get_many(tweak_ids)?;
        Ok(tweaks
            .into_iter()
            .map(|tweak| PreviewItem {
                tweak_id: tweak.id.clone(),
                name: tweak.name.clone(),
                category: tweak.category.clone(),
                risk: tweak.risk,
                action: format!("Run apply script: {}", tweak.apply_script),
                description: tweak.description.clone(),
                script_path: paths::resolve_script(app, &tweak.apply_script)
                    .to_string_lossy()
                    .to_string(),
                warning: tweak.warning.clone(),
            })
            .collect())
    }

    pub fn create_restore_point(label: &str) -> Result<bool, EngineError> {
        create_restore_point(label)
    }

    pub fn apply(
        app: &AppHandle,
        catalog: &TweakCatalog,
        tweak_ids: &[String],
        create_restore: bool,
    ) -> Result<ApplyResult, EngineError> {
        if powershell::is_windows() && !elevation::is_elevated() {
            return Err(EngineError::ElevationRequired);
        }

        let tweaks = catalog.get_many(tweak_ids)?;
        let restore_point_created = if create_restore {
            Self::create_restore_point("Debloater Session")?
        } else {
            false
        };

        let mut session = ChangeLogger::create_session(restore_point_created)?;
        let mut items = Vec::new();
        let mut success_count = 0u32;
        let mut failure_count = 0u32;
        let mut requires_reboot = false;

        for tweak in &tweaks {
            let script_path = paths::resolve_script(app, &tweak.apply_script);
            let result = run_script(&script_path, 120);
            match result {
                Ok(output) => {
                    let success = output.success;
                    if success {
                        success_count += 1;
                        ChangeLogger::append_entry(
                            &mut session,
                            &tweak.id,
                            Some(output.stdout.clone()),
                            Some(output.stderr.clone()),
                        )?;
                    } else {
                        failure_count += 1;
                        Reverter::rollback_session(app, catalog, &session)?;
                        return Err(EngineError::Script(format!(
                            "apply failed for {}: {}",
                            tweak.id, output.stderr
                        )));
                    }
                    if tweak.requires_reboot {
                        requires_reboot = true;
                    }
                    items.push(ApplyResultItem {
                        tweak_id: tweak.id.clone(),
                        success,
                        message: if output.stdout.is_empty() {
                            "Applied successfully".into()
                        } else {
                            output.stdout
                        },
                    });
                }
                Err(e) => {
                    failure_count += 1;
                    let _ = Reverter::rollback_session(app, catalog, &session);
                    return Err(e);
                }
            }
        }

        Ok(ApplyResult {
            session_id: session.session_id,
            items,
            success_count,
            failure_count,
            requires_reboot,
        })
    }

    pub fn apply_preset(
        app: &AppHandle,
        catalog: &TweakCatalog,
        tweak_ids: &[String],
        create_restore: bool,
    ) -> Result<ApplyResult, EngineError> {
        Self::apply(app, catalog, tweak_ids, create_restore)
    }

    pub fn latest_session() -> Result<Option<SessionLog>, EngineError> {
        let sessions = ChangeLogger::list_sessions()?;
        Ok(sessions.into_iter().next())
    }
}
