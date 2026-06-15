use std::fs;

use chrono::Utc;
use uuid::Uuid;

use super::error::EngineError;
use super::models::{ChangeLogEntry, ChangeLogSnapshot, SessionLog};
use super::paths;

pub struct ChangeLogger;

impl ChangeLogger {
    pub fn create_session(restore_point_created: bool) -> Result<SessionLog, EngineError> {
        paths::ensure_sessions_dir()?;
        let session = SessionLog {
            session_id: Uuid::new_v4().to_string(),
            created_at: Utc::now().to_rfc3339(),
            restore_point_created,
            entries: Vec::new(),
        };
        Self::save(&session)?;
        Ok(session)
    }

    pub fn load(session_id: &str) -> Result<SessionLog, EngineError> {
        let path = paths::session_path(session_id);
        if !path.exists() {
            return Err(EngineError::Session(format!(
                "session not found: {session_id}"
            )));
        }
        let content = fs::read_to_string(path)?;
        Ok(serde_json::from_str(&content)?)
    }

    pub fn save(session: &SessionLog) -> Result<(), EngineError> {
        paths::ensure_sessions_dir()?;
        let path = paths::session_path(&session.session_id);
        let content = serde_json::to_string_pretty(session)?;
        fs::write(path, content)?;
        Ok(())
    }

    pub fn append_entry(
        session: &mut SessionLog,
        tweak_id: &str,
        stdout: Option<String>,
        stderr: Option<String>,
    ) -> Result<(), EngineError> {
        Self::append_with_method(session, tweak_id, "script", stdout, stderr, None)
    }

    pub fn append_with_method(
        session: &mut SessionLog,
        entry_id: &str,
        method: &str,
        stdout: Option<String>,
        stderr: Option<String>,
        resource_snapshot: Option<String>,
    ) -> Result<(), EngineError> {
        session.entries.push(ChangeLogEntry {
            tweak_id: entry_id.to_string(),
            applied_at: Utc::now().to_rfc3339(),
            method: method.into(),
            snapshot: ChangeLogSnapshot {
                script_stdout: stdout,
                script_stderr: stderr,
                resource_snapshot,
            },
        });
        Self::save(session)
    }

    pub fn list_sessions() -> Result<Vec<SessionLog>, EngineError> {
        let dir = paths::ensure_sessions_dir()?;
        let mut sessions = Vec::new();
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            if entry.path().extension().is_some_and(|e| e == "json") {
                if let Ok(content) = fs::read_to_string(entry.path()) {
                    if let Ok(session) = serde_json::from_str::<SessionLog>(&content) {
                        sessions.push(session);
                    }
                }
            }
        }
        sessions.sort_by(|a, b| b.created_at.cmp(&a.created_at));
        Ok(sessions)
    }
}
