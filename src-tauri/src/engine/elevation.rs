pub fn is_elevated() -> bool {
    #[cfg(windows)]
    {
        use windows::Win32::Security::{GetTokenInformation, TokenElevation, TOKEN_ELEVATION, TOKEN_QUERY};
        use windows::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};
        use windows::Win32::Foundation::CloseHandle;

        unsafe {
            let mut token = Default::default();
            if OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token).is_err() {
                return false;
            }
            let mut elevation = TOKEN_ELEVATION::default();
            let mut returned = 0u32;
            let ok = GetTokenInformation(
                token,
                TokenElevation,
                Some(&mut elevation as *mut _ as *mut _),
                std::mem::size_of::<TOKEN_ELEVATION>() as u32,
                &mut returned,
            )
            .is_ok();
            let _ = CloseHandle(token);
            ok && elevation.TokenIsElevated != 0
        }
    }

    #[cfg(not(windows))]
    {
        false
    }
}

pub fn request_elevation() -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use windows::core::PCWSTR;
        use windows::Win32::UI::Shell::ShellExecuteW;
        use windows::Win32::UI::WindowsAndMessaging::SW_SHOW;

        let exe = std::env::current_exe().map_err(|e| e.to_string())?;
        let exe_wide: Vec<u16> = OsStr::new(&exe)
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();
        let verb: Vec<u16> = OsStr::new("runas")
            .encode_wide()
            .chain(std::iter::once(0))
            .collect();

        unsafe {
            let result = ShellExecuteW(
                None,
                PCWSTR(verb.as_ptr()),
                PCWSTR(exe_wide.as_ptr()),
                PCWSTR::null(),
                PCWSTR::null(),
                SW_SHOW,
            );
            if result.0 as isize <= 32 {
                return Err("UAC elevation was denied or failed".into());
            }
        }
        std::process::exit(0);
    }

    #[cfg(not(windows))]
    {
        Err("Elevation is only available on Windows".into())
    }
}
