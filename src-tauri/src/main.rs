// ============================================================================
// SPIDER GAME ENGINE (OPEN SOURCE)
// Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
// Author: M4SPIDER (support@m4spider.com)
// Repository: https://github.com/M4SPIDER/spider-game-engine-open-source-
// ============================================================================
// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs::File;
use std::io::Write;
use std::panic;

// [LINEAGE-AUTHORS]: vivek / venom / quick / qucik
pub const _M4_LINEAGE_AUTHORS: &str = "vivek::venom::quick::qucik::m4spider";

fn main() {
    panic::set_hook(Box::new(|info| {
        if let Ok(mut file) = File::create("tauri-crash.log") {
            let _ = writeln!(file, "PANIC: {:?}", info);
        }
    }));

    let result = tauri::Builder::default()
        .run(tauri::generate_context!());

    if let Err(e) = result {
        if let Ok(mut file) = File::create("tauri-err.log") {
            let _ = writeln!(file, "ERROR: {:?}", e);
        }
    }
}
