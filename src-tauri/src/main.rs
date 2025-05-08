#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{
    env,
    process::{Child, Command},
    thread,
    time::{Duration, Instant},
    net::TcpStream,
    io::ErrorKind,
};
use std::sync::{Arc, Mutex};
use tauri::{ Builder, Manager };
use tauri::path::BaseDirectory;

// Import the dialog plugin
use tauri_plugin_dialog;

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

    let node_process: Arc<Mutex<Option<Child>>> = Arc::new(Mutex::new(None));

    // CRITICAL CHANGE: Register the dialog plugin at the application's entry point
    let app = Builder::default()
        .plugin(tauri_plugin_dialog::init())  // Register dialog plugin here
        .setup({
            let node_process = Arc::clone(&node_process);
            move |app| {
                println!("Tauri setup is running from main.rs...");
                
                // Resolve the `resources` directory using BaseDirectory::Resource
                let resource_dir = app.path().resolve("resources", BaseDirectory::Resource)?;

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
                let child = Command::new(&node_path)
                    .arg(resource_dir.join("app/index.cjs"))
                    .current_dir(&resource_dir) 
                    .env("NODE_ENV", "production")
                    .env("NPM_PREFIX", resource_dir.join("app/node_modules")) 
                    .spawn()
                    .expect("Failed to start Node.js server");

                println!("Waiting for Node.js server on localhost:7666...");
                if !wait_for_server("localhost", 7666, 30, 200) {
                    panic!("Node server failed to start in time.");
                }

                // Store the child process handle
                *node_process.lock().unwrap() = Some(child);

                // Debug logging for plugins - using v2 compatible logging
                println!("Dialog plugin registered successfully!");

                Ok(())
            }
        })
        .build(tauri::generate_context!())
        .expect("Failed to build tauri application");
        
    app.run(move |_app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            // Kill the Node.js process when the app exits
            if let Some(mut child) = node_process.lock().unwrap().take() {
                println!("Shutting down Node.js server...");
                let _ = child.kill(); // Attempt to kill the process
            }
        }
    });
}