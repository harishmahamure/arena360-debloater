use std::path::Path;
use std::process::Command;
use std::time::Duration;

use super::error::EngineError;

#[derive(Debug, Clone)]
pub struct ScriptResult {
    pub success: bool,
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

pub fn is_windows() -> bool {
    cfg!(windows)
}

pub fn run_script(path: &Path, timeout_secs: u64) -> Result<ScriptResult, EngineError> {
    if !path.exists() {
        return Err(EngineError::Script(format!(
            "script not found: {}",
            path.display()
        )));
    }

    if !is_windows() {
        return Ok(mock_result(path));
    }

    let child = Command::new("powershell")
        .args([
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-File",
            &path.to_string_lossy(),
        ])
        .output()
        .map_err(|e| EngineError::Script(format!("failed to spawn powershell: {e}")))?;

    let _ = timeout_secs;
    let exit_code = child.status.code().unwrap_or(-1);
    let stdout = String::from_utf8_lossy(&child.stdout).trim().to_string();
    let stderr = String::from_utf8_lossy(&child.stderr).trim().to_string();

    Ok(ScriptResult {
        success: child.status.success(),
        stdout,
        stderr,
        exit_code,
    })
}

pub fn run_detect(path: &Path) -> Result<bool, EngineError> {
    let result = run_script(path, 30)?;
    if result.stdout.eq_ignore_ascii_case("applied")
        || result.stdout.eq_ignore_ascii_case("true")
        || (result.success && result.stdout.is_empty())
    {
        return Ok(true);
    }
    if result.stdout.eq_ignore_ascii_case("not_applied")
        || result.stdout.eq_ignore_ascii_case("false")
    {
        return Ok(false);
    }
    Ok(result.success)
}

pub fn create_restore_point(label: &str) -> Result<bool, EngineError> {
    if !is_windows() {
        return Ok(true);
    }

    let script = format!(
        r#"
        $ErrorActionPreference = 'Stop'
        try {{
            Checkpoint-Computer -Description '{label}' -RestorePointType MODIFY_SETTINGS
            Write-Output 'success'
        }} catch {{
            if ($_.Exception.Message -match '221') {{
                Write-Output 'success'
            }} else {{
                throw $_
            }}
        }}
        "#
    );

    let result = run_inline(&script, 120)?;
    Ok(result.success || result.stdout.contains("success"))
}

pub fn run_inline(script: &str, _timeout_secs: u64) -> Result<ScriptResult, EngineError> {
    if !is_windows() {
        return Ok(ScriptResult {
            success: true,
            stdout: "mock".into(),
            stderr: String::new(),
            exit_code: 0,
        });
    }

    let output = Command::new("powershell")
        .args([
            "-NoProfile",
            "-ExecutionPolicy",
            "Bypass",
            "-Command",
            script,
        ])
        .output()
        .map_err(|e| EngineError::Script(format!("inline script failed: {e}")))?;

    Ok(ScriptResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    })
}

pub fn scan_startup_and_tasks() -> Result<String, EngineError> {
    if !is_windows() {
        return Ok(mock_tasks_json());
    }

    let script = r#"
        $startup = @()
        $runKeys = @(
            'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run',
            'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run'
        )
        foreach ($key in $runKeys) {
            if (Test-Path $key) {
                Get-ItemProperty $key | Get-Member -MemberType NoteProperty | Where-Object { $_.Name -notmatch '^PS' } | ForEach-Object {
                    $name = $_.Name
                    $command = (Get-ItemProperty $key).$name
                    $startup += [ordered]@{ name = $name; command = "$command"; location = $key; enabled = $true }
                }
            }
        }
        $tasks = @()
        $taskNames = @(
            '\Microsoft\Windows\Customer Experience Improvement Program\Consolidator',
            '\Microsoft\Windows\Feedback\Siuf\DmClient'
        )
        foreach ($tn in $taskNames) {
            $t = Get-ScheduledTask -TaskName ($tn.Split('\')[-1]) -TaskPath ($tn.Substring(0, $tn.LastIndexOf('\')+1)) -ErrorAction SilentlyContinue
            if ($t) {
                $tasks += [ordered]@{ name = $t.TaskName; path = $t.TaskPath; state = $t.State.ToString(); description = '' }
            }
        }
        [ordered]@{ startupEntries = $startup; scheduledTasks = $tasks } | ConvertTo-Json -Depth 5 -Compress
    "#;

    let result = run_inline(script, 60)?;
    if result.success {
        Ok(result.stdout)
    } else {
        Err(EngineError::Script(result.stderr))
    }
}

fn mock_result(path: &Path) -> ScriptResult {
    let name = path.file_name().unwrap_or_default().to_string_lossy();
    let applied = name.contains("detect") && name.contains("disable");
    ScriptResult {
        success: true,
        stdout: if applied {
            "applied".into()
        } else if name.contains("detect") {
            "not_applied".into()
        } else {
            "success".into()
        },
        stderr: String::new(),
        exit_code: 0,
    }
}

fn mock_tasks_json() -> String {
    r#"{"startupEntries":[{"name":"OneDrive","command":"OneDrive.exe","location":"HKCU:\\Run","enabled":true}],"scheduledTasks":[{"name":"Consolidator","path":"\\Microsoft\\Windows\\Customer Experience Improvement Program\\","state":"Ready","description":"CEIP task"}]}"#.to_string()
}

#[allow(dead_code)]
const SCRIPT_TIMEOUT: Duration = Duration::from_secs(120);
