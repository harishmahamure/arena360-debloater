import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const tauriBin = join(
  root,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tauri.cmd" : "tauri",
);

const EXE_NAME = process.platform === "win32" ? "debloater.exe" : "debloater";

function isDebloaterRunning() {
  const result = spawnSync("tasklist", ["/FI", `IMAGENAME eq ${EXE_NAME}`, "/NH"], {
    encoding: "utf8",
  });
  return result.stdout?.toLowerCase().includes(EXE_NAME.toLowerCase()) ?? false;
}

/** Stop a prior dev instance so Cargo can replace debloater.exe on Windows. */
function stopStaleDevApp(command) {
  if (command !== "dev" || process.platform !== "win32") return;

  if (!isDebloaterRunning()) return;

  spawnSync("taskkill", ["/IM", EXE_NAME, "/F"], { stdio: "ignore" });
  spawnSync("powershell", ["-NoProfile", "-Command", "Start-Sleep -Milliseconds 500"], {
    stdio: "ignore",
  });

  if (!isDebloaterRunning()) return;

  console.error(
    [
      "",
      "Cannot start dev: Debloater is still running and could not be stopped.",
      "If you used 'Elevate for system changes', close the Debloater window from the taskbar",
      "(or end debloater.exe in Task Manager as Administrator), then run dev again.",
      "",
      "For development, run this terminal as Administrator before `bun run tauri dev`",
      "so elevation does not spawn a separate admin process that locks the build.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const cargoBin = join(homedir(), ".cargo", "bin");
const cargoExe = join(cargoBin, process.platform === "win32" ? "cargo.exe" : "cargo");
const pathSep = process.platform === "win32" ? ";" : ":";
const env = { ...process.env };

if (existsSync(cargoExe)) {
  const currentPath = env.PATH ?? env.Path ?? "";
  const pathEntries = currentPath.split(pathSep).filter(Boolean);

  if (!pathEntries.some((entry) => entry.toLowerCase() === cargoBin.toLowerCase())) {
    const updatedPath = `${cargoBin}${pathSep}${currentPath}`;
    env.PATH = updatedPath;
    env.Path = updatedPath;
  }
}

const args = process.argv.slice(2);
stopStaleDevApp(args[0]);

const result = spawnSync(tauriBin, args, {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
