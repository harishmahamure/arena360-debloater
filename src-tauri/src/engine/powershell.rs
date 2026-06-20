use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Command, Output, Stdio};
use std::thread;
use std::time::{Duration, Instant};

use super::error::EngineError;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

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

fn powershell_exe() -> PathBuf {
    std::env::var("SystemRoot")
        .map(|root| {
            PathBuf::from(root)
                .join("System32")
                .join("WindowsPowerShell")
                .join("v1.0")
                .join("powershell.exe")
        })
        .unwrap_or_else(|_| {
            PathBuf::from(r"C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe")
        })
}

fn configure_hidden_command(cmd: &mut Command) {
    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);
}

fn command_for_script_file(script: &Path, extra_args: &[&str]) -> Command {
    let mut cmd = Command::new(powershell_exe());
    cmd.args([
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-WindowStyle",
        "Hidden",
        "-File",
    ]);
    cmd.arg(script);
    cmd.args(extra_args);
    configure_hidden_command(&mut cmd);
    cmd
}

fn command_for_inline(script: &str) -> Command {
    let mut cmd = Command::new(powershell_exe());
    cmd.args([
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-WindowStyle",
        "Hidden",
        "-Command",
        script,
    ]);
    configure_hidden_command(&mut cmd);
    cmd
}

fn output_to_result(output: Output) -> ScriptResult {
    ScriptResult {
        success: output.status.success(),
        stdout: String::from_utf8_lossy(&output.stdout).trim().to_string(),
        stderr: String::from_utf8_lossy(&output.stderr).trim().to_string(),
        exit_code: output.status.code().unwrap_or(-1),
    }
}

#[cfg(windows)]
fn run_command_with_timeout(mut cmd: Command, timeout_secs: u64) -> Result<ScriptResult, EngineError> {
    let timeout = Duration::from_secs(timeout_secs.max(1));
    let mut child = cmd
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| EngineError::Script(format!("failed to spawn powershell: {e}")))?;

    let started = Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                let mut stdout = String::new();
                let mut stderr = String::new();
                if let Some(mut out) = child.stdout.take() {
                    out.read_to_string(&mut stdout).ok();
                }
                if let Some(mut err) = child.stderr.take() {
                    err.read_to_string(&mut stderr).ok();
                }
                return Ok(ScriptResult {
                    success: status.success(),
                    stdout: stdout.trim().to_string(),
                    stderr: stderr.trim().to_string(),
                    exit_code: status.code().unwrap_or(-1),
                });
            }
            Ok(None) => {
                if started.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err(EngineError::Script(format!(
                        "script timed out after {timeout_secs}s"
                    )));
                }
                thread::sleep(Duration::from_millis(100));
            }
            Err(e) => {
                return Err(EngineError::Script(format!(
                    "failed waiting for script: {e}"
                )));
            }
        }
    }
}

#[cfg(not(windows))]
fn run_command_with_timeout(mut cmd: Command, timeout_secs: u64) -> Result<ScriptResult, EngineError> {
    let _ = timeout_secs;
    let output = cmd
        .output()
        .map_err(|e| EngineError::Script(format!("failed to spawn powershell: {e}")))?;
    Ok(output_to_result(output))
}

pub fn run_script(path: &Path, timeout_secs: u64) -> Result<ScriptResult, EngineError> {
    run_script_with_args(path, &[], timeout_secs)
}

pub fn run_script_with_args(
    path: &Path,
    extra_args: &[&str],
    timeout_secs: u64,
) -> Result<ScriptResult, EngineError> {
    if !path.exists() {
        return Err(EngineError::Script(format!(
            "script not found: {}",
            path.display()
        )));
    }

    if !is_windows() {
        return Ok(mock_result(path));
    }

    run_command_with_timeout(command_for_script_file(path, extra_args), timeout_secs)
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

    let escaped = label.replace('\'', "''");
    let script = format!(
        r#"
        $ErrorActionPreference = 'Stop'
        try {{
            $type = 12
            $result = ([wmiclass]'\\.\root\default:SystemRestore').CreateRestorePoint('{escaped}', 0, $type)
            if ($result.ReturnValue -eq 0) {{
                Write-Output 'success'
            }} else {{
                throw "CreateRestorePoint returned $($result.ReturnValue)"
            }}
        }} catch {{
            if ($_.Exception.Message -match '221|8259|enabled') {{
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

pub fn run_inline(script: &str, timeout_secs: u64) -> Result<ScriptResult, EngineError> {
    if !is_windows() {
        return Ok(ScriptResult {
            success: true,
            stdout: "mock".into(),
            stderr: String::new(),
            exit_code: 0,
        });
    }

    let result = run_command_with_timeout(command_for_inline(script), timeout_secs)?;
    Ok(result)
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
        [ordered]@{ startupEntries = @($startup); scheduledTasks = @($tasks) } | ConvertTo-Json -Depth 5 -Compress
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
