#!/usr/bin/env python3
"""Generate tweak YAML catalogs and PowerShell scripts for Debloater."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent / "src-tauri" / "resources"
SCRIPTS = ROOT / "scripts"

APP_PACKAGES = {
    "remove-xbox-app": {
        "name": "Remove Xbox Gaming Overlay",
        "packages": ["Microsoft.XboxGamingOverlay", "Microsoft.Xbox.TCUI", "Microsoft.XboxApp"],
    },
    "remove-clipchamp": {
        "name": "Remove Clipchamp",
        "packages": ["Clipchamp.Clipchamp"],
    },
    "remove-solitaire": {
        "name": "Remove Microsoft Solitaire",
        "packages": ["Microsoft.MicrosoftSolitaireCollection"],
    },
    "remove-news": {
        "name": "Remove Microsoft News",
        "packages": ["Microsoft.BingNews"],
    },
    "remove-weather": {
        "name": "Remove Microsoft Weather",
        "packages": ["Microsoft.BingWeather"],
    },
    "remove-get-help": {
        "name": "Remove Get Help",
        "packages": ["Microsoft.GetHelp"],
    },
    "remove-phone-link": {
        "name": "Remove Phone Link",
        "packages": ["Microsoft.YourPhone"],
    },
}

REGISTRY_TWEAKS = {
    "disable-advertising-id": {
        "name": "Disable Advertising ID",
        "category": "privacy",
        "risk": "safe",
        "hive": "HKCU",
        "path": r"Software\Microsoft\Windows\CurrentVersion\AdvertisingInfo",
        "name_val": "Enabled",
        "applied": 0,
        "revert": 1,
        "description": "Disables the Windows advertising ID used for tailored ads.",
    },
    "disable-activity-history": {
        "name": "Disable Activity History",
        "category": "privacy",
        "risk": "safe",
        "hive": "HKLM",
        "path": r"SOFTWARE\Policies\Microsoft\Windows\System",
        "name_val": "PublishUserActivities",
        "applied": 0,
        "revert": 1,
        "description": "Stops Windows from collecting and publishing activity history.",
    },
    "disable-tailored-experiences": {
        "name": "Disable Tailored Experiences",
        "category": "privacy",
        "risk": "safe",
        "hive": "HKCU",
        "path": r"Software\Microsoft\Windows\CurrentVersion\Privacy",
        "name_val": "TailoredExperiencesWithDiagnosticDataEnabled",
        "applied": 0,
        "revert": 1,
        "description": "Disables personalized tips and recommendations based on diagnostic data.",
    },
    "disable-location-tracking": {
        "name": "Disable Location Tracking",
        "category": "privacy",
        "risk": "moderate",
        "hive": "HKLM",
        "path": r"SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\location",
        "name_val": "Value",
        "applied": "Deny",
        "revert": "Allow",
        "description": "Denies location access at the system policy level.",
        "warning": "May affect apps that rely on location services.",
    },
    "disable-widgets": {
        "name": "Remove Widgets from Taskbar",
        "category": "ui",
        "risk": "safe",
        "hive": "HKCU",
        "path": r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced",
        "name_val": "TaskbarDa",
        "applied": 0,
        "revert": 1,
        "description": "Hides the Widgets button from the Windows 11 taskbar.",
    },
    "disable-chat-taskbar": {
        "name": "Remove Chat from Taskbar",
        "category": "ui",
        "risk": "safe",
        "hive": "HKCU",
        "path": r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced",
        "name_val": "TaskbarMn",
        "applied": 0,
        "revert": 1,
        "description": "Hides the Chat / Teams consumer button from the taskbar.",
    },
    "disable-start-recommendations": {
        "name": "Disable Start Menu Recommendations",
        "category": "ui",
        "risk": "safe",
        "hive": "HKLM",
        "path": r"SOFTWARE\Policies\Microsoft\Windows\Explorer",
        "name_val": "HideRecommendedSection",
        "applied": 1,
        "revert": 0,
        "description": "Removes promoted apps and recommendations from the Start menu.",
    },
    "classic-context-menu": {
        "name": "Enable Classic Context Menu",
        "category": "ui",
        "risk": "safe",
        "hive": "HKCU",
        "path": r"Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32",
        "name_val": "",
        "applied": "",
        "revert": "DELETE",
        "description": "Restores the full right-click context menu without 'Show more options'.",
    },
    "disable-copilot-button": {
        "name": "Disable Copilot Button",
        "category": "ui",
        "risk": "safe",
        "hive": "HKCU",
        "path": r"Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced",
        "name_val": "ShowCopilotButton",
        "applied": 0,
        "revert": 1,
        "description": "Hides the Copilot button from the taskbar on supported builds.",
    },
    "disable-lock-screen-tips": {
        "name": "Disable Lock Screen Tips",
        "category": "ui",
        "risk": "safe",
        "hive": "HKCU",
        "path": r"Software\Microsoft\Windows\CurrentVersion\ContentDeliveryManager",
        "name_val": "SubscribedContent-338387Enabled",
        "applied": 0,
        "revert": 1,
        "description": "Disables tips and fun facts on the lock screen.",
    },
    "pause-windows-update": {
        "name": "Pause Windows Update",
        "category": "windows_update",
        "risk": "moderate",
        "hive": "HKLM",
        "path": r"SOFTWARE\Microsoft\WindowsUpdate\UX\Settings",
        "name_val": "PauseUpdatesExpiryTime",
        "applied": "2099-12-31T00:00:00Z",
        "revert": "DELETE",
        "description": "Pauses Windows Update checks until a far-future date.",
        "warning": "Security updates will not install while paused.",
    },
    "defer-feature-updates": {
        "name": "Defer Feature Updates",
        "category": "windows_update",
        "risk": "moderate",
        "hive": "HKLM",
        "path": r"SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate",
        "name_val": "DeferFeatureUpdates",
        "applied": 1,
        "revert": 0,
        "description": "Defers major Windows feature updates.",
    },
    "disable-wu-auto-restart": {
        "name": "Disable Auto-Restart for Updates",
        "category": "windows_update",
        "risk": "safe",
        "hive": "HKLM",
        "path": r"SOFTWARE\Policies\Microsoft\Windows\WindowsUpdate\AU",
        "name_val": "NoAutoRebootWithLoggedOnUsers",
        "applied": 1,
        "revert": 0,
        "description": "Prevents automatic reboots while a user is signed in.",
    },
    "limit-wu-bandwidth": {
        "name": "Limit Update Download Bandwidth",
        "category": "windows_update",
        "risk": "safe",
        "hive": "HKLM",
        "path": r"SOFTWARE\Policies\Microsoft\Windows\DeliveryOptimization",
        "name_val": "DOMaxDownloadBandwidth",
        "applied": 500,
        "revert": "DELETE",
        "description": "Caps background update download bandwidth to 500 KB/s.",
    },
}


def write_app_scripts(tweak_id: str, packages: list[str]) -> None:
    folder = SCRIPTS / "apps"
    pkg_checks = " -or ".join([f"$null -ne (Get-AppxPackage -Name '{p}' -ErrorAction SilentlyContinue)" for p in packages])
    pkg_list = ", ".join([f"'{p}'" for p in packages])

    (folder / f"{tweak_id}-detect.ps1").write_text(f"""$packages = @({pkg_list})
$installed = $false
foreach ($pkg in $packages) {{
    if (Get-AppxPackage -Name $pkg -ErrorAction SilentlyContinue) {{ $installed = $true; break }}
}}
if (-not $installed) {{ Write-Output 'applied' }} else {{ Write-Output 'not_applied' }}
""")

    remove_lines = []
    for p in packages:
        remove_lines.append(f"Get-AppxPackage -Name '{p}' -ErrorAction SilentlyContinue | Remove-AppxPackage -ErrorAction SilentlyContinue")
        remove_lines.append(f"Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like '*{p}*' | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue")
    remove_body = "\n".join(remove_lines)

    (folder / f"{tweak_id}-apply.ps1").write_text(f"""$ErrorActionPreference = 'SilentlyContinue'
{remove_body}
Write-Output 'success'
""")

    (folder / f"{tweak_id}-revert.ps1").write_text(f"""Write-Output 'App removal revert requires manual reinstall from Microsoft Store'
""")


def hive_const(hive: str) -> str:
    return "HKCU" if hive == "HKCU" else "HKLM"


def write_registry_scripts(tweak_id: str, cfg: dict) -> None:
    cat = cfg["category"]
    folder = SCRIPTS / cat.replace("windows_update", "windows_update")
    hive = cfg["hive"]
    path = cfg["path"]
    name_val = cfg["name_val"]
    applied = cfg["applied"]
    revert = cfg["revert"]

    if tweak_id == "classic-context-menu":
        detect = f"""
$key = '{hive}:\\{path}'
if (Test-Path $key) {{ Write-Output 'applied' }} else {{ Write-Output 'not_applied' }}
"""
        apply = f"""
New-Item -Path '{hive}:\\{path}' -Force | Out-Null
Set-ItemProperty -Path '{hive}:\\{path}' -Name '(default)' -Value ''
Write-Output 'success'
"""
        revert = f"""
Remove-Item -Path '{hive}:\\{path}' -Recurse -Force -ErrorAction SilentlyContinue
Write-Output 'success'
"""
    else:
        val_type = "DWord" if isinstance(applied, int) else "String"
        detect = f"""
$key = '{hive}:\\{path}'
if (-not (Test-Path $key)) {{ Write-Output 'not_applied'; exit 0 }}
$val = Get-ItemProperty -Path $key -Name '{name_val}' -ErrorAction SilentlyContinue
if ($val -and $val.'{name_val}' -eq {repr(applied)}) {{ Write-Output 'applied' }} else {{ Write-Output 'not_applied' }}
"""
        apply = f"""
New-Item -Path '{hive}:\\{path}' -Force | Out-Null
Set-ItemProperty -Path '{hive}:\\{path}' -Name '{name_val}' -Type {val_type} -Value {repr(applied)}
Write-Output 'success'
"""
        if revert == "DELETE":
            revert = f"""
Remove-ItemProperty -Path '{hive}:\\{path}' -Name '{name_val}' -ErrorAction SilentlyContinue
Write-Output 'success'
"""
        else:
            rev_type = "DWord" if isinstance(revert, int) else "String"
            revert = f"""
New-Item -Path '{hive}:\\{path}' -Force | Out-Null
Set-ItemProperty -Path '{hive}:\\{path}' -Name '{name_val}' -Type {rev_type} -Value {repr(revert)}
Write-Output 'success'
"""

    (folder / f"{tweak_id}-detect.ps1").write_text(detect.strip() + "\n")
    (folder / f"{tweak_id}-apply.ps1").write_text(apply.strip() + "\n")
    (folder / f"{tweak_id}-revert.ps1").write_text(revert.strip() + "\n")


def write_service_scripts(tweak_id: str, service: str, name: str, risk: str, description: str, warning: str | None = None, category: str = "services") -> dict:
    folder = SCRIPTS / "services"
    for kind in ("detect", "apply", "revert"):
        if kind == "detect":
            content = f"""
$s = Get-Service -Name '{service}' -ErrorAction SilentlyContinue
if ($s -and $s.StartType -eq 'Disabled') {{ Write-Output 'applied' }} else {{ Write-Output 'not_applied' }}
"""
        elif kind == "apply":
            content = f"""
Stop-Service -Name '{service}' -Force -ErrorAction SilentlyContinue
Set-Service -Name '{service}' -StartupType Disabled
Write-Output 'success'
"""
        else:
            content = f"""
Set-Service -Name '{service}' -StartupType Automatic -ErrorAction SilentlyContinue
Start-Service -Name '{service}' -ErrorAction SilentlyContinue
Write-Output 'success'
"""
        (folder / f"{tweak_id}-{kind}.ps1").write_text(content.strip() + "\n")

    return {
        "id": tweak_id,
        "name": name,
        "category": category,
        "risk": risk,
        "requires_reboot": False,
        "win11_build_min": 22000,
        "description": description,
        "warning": warning,
        "detect_script": f"scripts/services/{tweak_id}-detect.ps1",
        "apply_script": f"scripts/services/{tweak_id}-apply.ps1",
        "revert_script": f"scripts/services/{tweak_id}-revert.ps1",
    }


def write_cleanup_scripts(tweak_id: str, name: str, description: str, apply_body: str, detect_body: str) -> dict:
    folder = SCRIPTS / "cleanup"
    (folder / f"{tweak_id}-detect.ps1").write_text(detect_body.strip() + "\n")
    (folder / f"{tweak_id}-apply.ps1").write_text(apply_body.strip() + "\n")
    (folder / f"{tweak_id}-revert.ps1").write_text("Write-Output 'Cleanup actions cannot be reverted'\n")
    return {
        "id": tweak_id,
        "name": name,
        "category": "cleanup",
        "risk": "safe",
        "requires_reboot": False,
        "win11_build_min": 22000,
        "description": description,
        "warning": None,
        "detect_script": f"scripts/cleanup/{tweak_id}-detect.ps1",
        "apply_script": f"scripts/cleanup/{tweak_id}-apply.ps1",
        "revert_script": f"scripts/cleanup/{tweak_id}-revert.ps1",
    }


def write_task_scripts(tweak_id: str, task_path: str, name: str, description: str) -> dict:
    folder = SCRIPTS / "tasks"
    task_name = task_path.split("\\")[-1]
    parent = task_path[: task_path.rfind("\\") + 1]
    for kind, body in {
        "detect": f"""
$t = Get-ScheduledTask -TaskPath '{parent}' -TaskName '{task_name}' -ErrorAction SilentlyContinue
if ($t -and $t.State -eq 'Disabled') {{ Write-Output 'applied' }} else {{ Write-Output 'not_applied' }}
""",
        "apply": f"""
Disable-ScheduledTask -TaskPath '{parent}' -TaskName '{task_name}' -ErrorAction SilentlyContinue
Write-Output 'success'
""",
        "revert": f"""
Enable-ScheduledTask -TaskPath '{parent}' -TaskName '{task_name}' -ErrorAction SilentlyContinue
Write-Output 'success'
""",
    }.items():
        (folder / f"{tweak_id}-{kind}.ps1").write_text(body.strip() + "\n")

    return {
        "id": tweak_id,
        "name": name,
        "category": "tasks",
        "risk": "safe",
        "requires_reboot": False,
        "win11_build_min": 22000,
        "description": description,
        "warning": None,
        "detect_script": f"scripts/tasks/{tweak_id}-detect.ps1",
        "apply_script": f"scripts/tasks/{tweak_id}-apply.ps1",
        "revert_script": f"scripts/tasks/{tweak_id}-revert.ps1",
    }


def yaml_tweak(t: dict) -> str:
    warning = f'warning: "{t["warning"]}"' if t.get("warning") else "warning: null"
    return f"""  - id: {t['id']}
    name: {t['name']}
    category: {t['category']}
    risk: {t['risk']}
    requiresReboot: {str(t['requires_reboot']).lower()}
    win11BuildMin: {t['win11_build_min']}
    description: {t['description']}
    {warning}
    detectScript: {t['detect_script']}
    applyScript: {t['apply_script']}
    revertScript: {t['revert_script']}
"""


def main() -> None:
    app_tweaks = []
    for tid, cfg in APP_PACKAGES.items():
        write_app_scripts(tid, cfg["packages"])
        app_tweaks.append({
            "id": tid,
            "name": cfg["name"],
            "category": "apps",
            "risk": "safe",
            "requires_reboot": False,
            "win11_build_min": 22000,
            "description": f"Removes {cfg['name']} for current and new users.",
            "warning": None,
            "detect_script": f"scripts/apps/{tid}-detect.ps1",
            "apply_script": f"scripts/apps/{tid}-apply.ps1",
            "revert_script": f"scripts/apps/{tid}-revert.ps1",
        })

    privacy_tweaks = []
    ui_tweaks = []
    wu_tweaks = []

    privacy_tweaks.append(
        write_service_scripts(
            "disable-diagtrack",
            "DiagTrack",
            "Disable Diagnostic Tracking",
            "safe",
            "Disables the DiagTrack telemetry service.",
            category="privacy",
        )
    )

    for tid, cfg in REGISTRY_TWEAKS.items():
        write_registry_scripts(tid, cfg)
        entry = {
            "id": tid,
            "name": cfg["name"],
            "category": cfg["category"],
            "risk": cfg["risk"],
            "requires_reboot": False,
            "win11_build_min": 22000,
            "description": cfg["description"],
            "warning": cfg.get("warning"),
            "detect_script": f"scripts/{cfg['category']}/{tid}-detect.ps1",
            "apply_script": f"scripts/{cfg['category']}/{tid}-apply.ps1",
            "revert_script": f"scripts/{cfg['category']}/{tid}-revert.ps1",
        }
        if cfg["category"] == "privacy":
            privacy_tweaks.append(entry)
        elif cfg["category"] == "ui":
            ui_tweaks.append(entry)
        else:
            wu_tweaks.append(entry)

    service_tweaks = [
        write_service_scripts("disable-sysmain", "SysMain", "Disable SysMain (Superfetch)", "moderate", "Disables SysMain memory preloading.", "May slightly reduce performance on HDDs."),
        write_service_scripts("disable-remote-registry", "RemoteRegistry", "Disable Remote Registry", "safe", "Disables the Remote Registry service."),
        write_service_scripts("disable-xbox-live-auth", "XblAuthManager", "Disable Xbox Live Auth Manager", "safe", "Disables Xbox Live authentication services."),
    ]

    wu_tweaks.append(
        write_service_scripts(
            "disable-wu-service",
            "wuauserv",
            "Disable Windows Update Service",
            "advanced",
            "Disables the Windows Update service entirely.",
            "Security updates will not install. Use only if you accept the risk.",
            category="windows_update",
        )
    )

    cleanup_tweaks = [
        write_cleanup_scripts(
            "clear-temp-files",
            "Clear Temporary Files",
            "Removes user and system temporary files.",
            "Remove-Item -Path $env:TEMP\\* -Recurse -Force -ErrorAction SilentlyContinue\nRemove-Item -Path C:\\Windows\\Temp\\* -Recurse -Force -ErrorAction SilentlyContinue\nWrite-Output 'success'",
            "Write-Output 'not_applied'",
        ),
        write_cleanup_scripts(
            "clear-update-cache",
            "Clear Windows Update Cache",
            "Stops Windows Update and clears the SoftwareDistribution download cache.",
            "Stop-Service wuauserv -Force -ErrorAction SilentlyContinue\nRemove-Item C:\\Windows\\SoftwareDistribution\\Download\\* -Recurse -Force -ErrorAction SilentlyContinue\nStart-Service wuauserv -ErrorAction SilentlyContinue\nWrite-Output 'success'",
            "if (Test-Path 'C:\\Windows\\SoftwareDistribution\\Download') { Write-Output 'not_applied' } else { Write-Output 'applied' }",
        ),
        write_cleanup_scripts(
            "enable-storage-sense",
            "Enable Storage Sense",
            "Enables Storage Sense to automatically clean temporary files.",
            "New-Item -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy' -Force | Out-Null\nSet-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy' -Name '01' -Type DWord -Value 1\nWrite-Output 'success'",
            "$k='HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy'\nif ((Get-ItemProperty $k -Name '01' -ErrorAction SilentlyContinue).'01' -eq 1) { Write-Output 'applied' } else { Write-Output 'not_applied' }",
        ),
        write_cleanup_scripts(
            "dism-component-cleanup",
            "DISM Component Cleanup",
            "Runs DISM StartComponentCleanup to reduce WinSxS store size.",
            "Dism.exe /Online /Cleanup-Image /StartComponentCleanup /Quiet\nWrite-Output 'success'",
            "Write-Output 'not_applied'",
        ),
        write_cleanup_scripts(
            "clear-delivery-optimization",
            "Clear Delivery Optimization Cache",
            "Clears the Delivery Optimization download cache.",
            "Remove-Item -Path C:\\Windows\\ServiceProfiles\\NetworkService\\AppData\\Local\\Microsoft\\Windows\\DeliveryOptimization\\Cache\\* -Recurse -Force -ErrorAction SilentlyContinue\nWrite-Output 'success'",
            "Write-Output 'not_applied'",
        ),
    ]

    task_tweaks = [
        write_task_scripts("disable-ceip-task", "\\Microsoft\\Windows\\Customer Experience Improvement Program\\Consolidator", "Disable CEIP Scheduled Task", "Disables the Customer Experience Improvement Program task."),
        write_task_scripts("disable-feedback-task", "\\Microsoft\\Windows\\Feedback\\Siuf\\DmClient", "Disable Feedback Scheduled Task", "Disables the feedback notification scheduled task."),
    ]

    # OneDrive startup registry tweak
    folder = SCRIPTS / "tasks"
    (folder / "disable-onedrive-startup-detect.ps1").write_text("""
$key = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
$val = Get-ItemProperty $key -Name 'OneDrive' -ErrorAction SilentlyContinue
if (-not $val) { Write-Output 'applied' } else { Write-Output 'not_applied' }
""")
    (folder / "disable-onedrive-startup-apply.ps1").write_text("""
Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'OneDrive' -ErrorAction SilentlyContinue
Write-Output 'success'
""")
    (folder / "disable-onedrive-startup-revert.ps1").write_text("""
Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'OneDrive' -Value '"C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe" /background'
Write-Output 'success'
""")
    task_tweaks.append({
        "id": "disable-onedrive-startup",
        "name": "Disable OneDrive Startup",
        "category": "tasks",
        "risk": "safe",
        "requires_reboot": False,
        "win11_build_min": 22000,
        "description": "Removes OneDrive from startup programs.",
        "warning": None,
        "detect_script": "scripts/tasks/disable-onedrive-startup-detect.ps1",
        "apply_script": "scripts/tasks/disable-onedrive-startup-apply.ps1",
        "revert_script": "scripts/tasks/disable-onedrive-startup-revert.ps1",
    })

    files = {
        "apps.yaml": app_tweaks,
        "privacy.yaml": privacy_tweaks,
        "ui.yaml": ui_tweaks,
        "services.yaml": service_tweaks,
        "cleanup.yaml": cleanup_tweaks,
        "windows_update.yaml": wu_tweaks,
        "tasks.yaml": task_tweaks,
    }

    for fname, tweaks in files.items():
        content = "tweaks:\n" + "".join(yaml_tweak(t) for t in tweaks)
        (ROOT / "tweaks" / fname).write_text(content)

    presets = """presets:
  - id: light
    name: Light Debloat
    description: Safe tweaks for casual users — removes obvious bloat and Start ads.
    targetUser: Casual
    tweakIds:
      - remove-xbox-app
      - remove-clipchamp
      - remove-solitaire
      - disable-widgets
      - disable-chat-taskbar
      - disable-start-recommendations
      - disable-lock-screen-tips
      - clear-temp-files
      - enable-storage-sense

  - id: privacy
    name: Privacy Focused
    description: Disables telemetry, ads, and tracking while keeping system stability.
    targetUser: Privacy-focused
    tweakIds:
      - disable-diagtrack
      - disable-advertising-id
      - disable-activity-history
      - disable-tailored-experiences
      - disable-location-tracking
      - disable-start-recommendations
      - disable-lock-screen-tips
      - disable-ceip-task
      - disable-feedback-task

  - id: gaming
    name: Gaming Profile
    description: Removes Xbox bloat, optimizes services, and reduces background overhead.
    targetUser: Gamers
    tweakIds:
      - remove-xbox-app
      - remove-clipchamp
      - remove-news
      - remove-weather
      - disable-sysmain
      - disable-xbox-live-auth
      - disable-widgets
      - disable-chat-taskbar
      - disable-copilot-button
      - clear-temp-files
      - clear-delivery-optimization
"""
    (ROOT / "presets" / "profiles.yaml").write_text(presets)
    print("Generated resources successfully")


if __name__ == "__main__":
    main()
