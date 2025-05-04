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
        .setup(|_app: &mut App| {
            // Directly use the path to your resources (dist, _up_, etc.)
            let resource_dir = env::var("RESOURCES_DIR")
                .map(|v| PathBuf::from(v))
                .unwrap_or_else(|_| PathBuf::from("/usr/lib/mrdoom/_up_/dist"));

            // Define the correct node path based on your OS
            #[cfg(target_os = "linux")]
            let node_path = resource_dir.join("bin").join("node");

            #[cfg(target_os = "windows")]
            let node_path = resource_dir.join("node").join("node.exe");

            #[cfg(target_os = "macos")]
            let node_path = resource_dir.join("node").join("bin").join("node");

            println!("Node path: {:?}", node_path);
            println!("Working dir: {:?}", resource_dir);

            // Check if the Node.js binary exists
            if !node_path.exists() {
                panic!("Node binary not found at: {:?}", node_path);
            }

            // Start the Node.js server
            Command::new(&node_path)
                .arg("index.cjs")
                .current_dir(&resource_dir)
                .env("NODE_ENV", "production")
                .env("NPM_PREFIX", resource_dir.join("node_modules"))
                .spawn()
                .expect("Failed to start Node.js server");

            println!("Waiting for Node.js server on localhost:5000...");
            if !wait_for_server("localhost", 5000, 30, 200) {
                panic!("Node server failed to start in time.");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while running Tauri application");
}
