#[cfg(windows)]
pub fn read_value(hive: &str, path: &str, name: &str) -> Result<Option<String>, String> {
    use winreg::enums::*;
    use winreg::RegKey;

    let hive_key = match hive {
        "HKCU" => RegKey::predef(HKEY_CURRENT_USER),
        "HKLM" => RegKey::predef(HKEY_LOCAL_MACHINE),
        _ => return Err(format!("unsupported hive: {hive}")),
    };

    let key = hive_key.open_subkey(path).map_err(|e| e.to_string())?;
    match key.get_value::<String, _>(name) {
        Ok(v) => Ok(Some(v)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[cfg(not(windows))]
pub fn read_value(_hive: &str, _path: &str, _name: &str) -> Result<Option<String>, String> {
    Ok(None)
}
