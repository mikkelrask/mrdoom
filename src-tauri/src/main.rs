#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{
    env,
    path::PathBuf,
    process::Command,
    thread,
    time::{Duration, Instant},
    net::TcpStream,
    io::ErrorKind,
};

use tauri::{App, Builder};

fn wait_for_server(host: &str, port: u16, timeout_secs: u64, retry_interval_ms: u64) -> bool {
    let start = Instant::now();
    let timeout = Duration::from_secs(timeout_secs);

    while start.elapsed() < timeout {
        match TcpStream::connect(format!("{}:{}", host, port)) {
            Ok(_) => return true,
            Err(e) if e.kind() == ErrorKind::ConnectionRefused => (),
            Err(e) => eprintln!("Connection error: {e}"),
        }
        thread::sleep(Duration::from_millis(retry_interval_ms));
    }

    false
}

fn main() {
    #[cfg(target_os = "linux")]
    {
        env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

        if env::var("WAYLAND_DISPLAY").is_ok() {
            env::set_var("MOZ_ENABLE_WAYLAND", "1");
        }

        env::set_var("MESA_GL_VERSION_OVERRIDE", "4.5");
        env::set_var("MOZ_GMP_PATH", "/usr/lib/mozilla/plugins");
    }

    env::set_var("RUST_BACKTRACE", "1");
    env::set_var("RUST_LOG", "full");

    Builder::default()
        .setup(|app_handle| {
            let resource_dir = app_handle
                .path_resolver()
                .resolve_resource("resources")
                .expect("Could not resolve resource dir");
        
            #[cfg(target_os = "linux")]
            {
                std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
                if std::env::var("WAYLAND_DISPLAY").is_ok() {
                    std::env::set_var("MOZ_ENABLE_WAYLAND", "1");
                }
                std::env::set_var("MESA_GL_VERSION_OVERRIDE", "4.5");
            }
        
            std::env::set_var("RUST_BACKTRACE", "1");
            std::env::set_var("RUST_LOG", "full");
        
            let node_path = resource_dir.join("node").join("bin").join("node");
            let work_dir = resource_dir.join("app");
        
            if !node_path.exists() {
                panic!("Node binary not found at: {:?}", node_path);
            }
        
            std::process::Command::new(&node_path)
                .arg("index.cjs")
                .current_dir(&work_dir)
                .env("NODE_ENV", "production")
                .spawn()
                .expect("Failed to start Node.js server");
        
            // Optional: wait for server to be ready here if needed
            Ok(())
        })
    
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
