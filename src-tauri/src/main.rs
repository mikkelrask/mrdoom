#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{
    env,
    process::Command,
    thread,
    time::{Duration, Instant},
    net::TcpStream,
    io::ErrorKind,
};

use tauri::{App,Builder, Manager};
use tauri::path::BaseDirectory; // Correct import for BaseDirectory

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
        .setup(|app| {
            // Resolve the `resources` directory using BaseDirectory::Resource
            let resource_dir = app.path().resolve(BaseDirectory::Resource)?;

            println!("Resolved Resource dir: {:?}", resource_dir);

            // Define the correct Node.js binary path based on the OS
            #[cfg(target_os = "linux")]
            let node_path = resource_dir.join("node");

            #[cfg(target_os = "windows")]
            let node_path = resource_dir.join("node.exe");

            #[cfg(target_os = "macos")]
            let node_path = resource_dir.join("node");

            println!("Resolved Node path: {:?}", node_path);

            // Check if the Node.js binary exists
            if !node_path.exists() {
                panic!("Node binary not found at: {:?}", node_path);
            }

            // Start the Node.js server using absolute paths
            Command::new(&node_path)
                .arg("app/index.cjs") // Call app/index.cjs relative to the resources directory
                .current_dir(&resource_dir) // Set working directory to the resources directory
                .env("NODE_ENV", "production")
                .env("NPM_PREFIX", resource_dir.join("app/node_modules")) // Correct NPM_PREFIX path
                .spawn()
                .expect("Failed to start Node.js server");

            println!("Waiting for Node.js server on localhost:7666...");
            if !wait_for_server("localhost", 7666, 30, 200) {
                panic!("Node server failed to start in time.");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
