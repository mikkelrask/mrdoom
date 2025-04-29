#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{env, path::PathBuf, process::Command, thread, time::Duration, net::TcpStream, io::ErrorKind};

// Function to check if server is ready
fn wait_for_server(host: &str, port: u16, timeout_secs: u64, retry_interval_ms: u64) -> bool {
    let start = std::time::Instant::now();
    let timeout = Duration::from_secs(timeout_secs);
    
    while start.elapsed() < timeout {
        match TcpStream::connect(format!("{}:{}", host, port)) {
            Ok(_) => {
                println!("Server at {}:{} is ready!", host, port);
                return true;
            },
            Err(e) if e.kind() == ErrorKind::ConnectionRefused => {
                println!("Server at {}:{} not ready yet, retrying...", host, port);
            },
            Err(e) => {
                println!("Error connecting to server: {}", e);
            }
        }
        thread::sleep(Duration::from_millis(retry_interval_ms));
    }
    
    println!("Timed out waiting for server at {}:{}", host, port);
    false
}

fn main() {
    env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");

    if env::var("WAYLAND_DISPLAY").is_ok() {
        env::set_var("MOZ_ENABLE_WAYLAND", "1"); 
    }

    tauri::Builder::default()
        .setup(|_app| {
            let node_path = PathBuf::from("/usr/lib/mrdoom/_up_/dist/bin/node");
            env::set_var("MESA_GL_VERSION_OVERRIDE", "4.5");
            env::set_var("MOZ_GMP_PATH", "/usr/lib/mozilla/plugins");
            env::set_var("RUST_BACKTRACE", "1");
            env::set_var("RUST_LOG", "full");

            if !node_path.exists() {
                panic!("Node binary not found at: {:?}", node_path);
            }
            let work_dir = PathBuf::from("/usr/lib/mrdoom/_up_/dist");
            Command::new(&node_path)
                .arg("index.cjs")
                .current_dir(&work_dir)
                .env("NODE_ENV", "production")
                .env("NPM_PREFIX", work_dir.join("node_modules"))
                .spawn()
                .expect("Failed to start Node.js server");
                
            println!("Waiting for Node.js server to be ready...");
            // Wait for the server to be ready at localhost:5000
            // Try for up to 30 seconds, checking every 200ms
            if !wait_for_server("localhost", 5000, 30, 200) {
                panic!("Timed out waiting for Node.js server to start");
            }
            println!("Node.js server is ready! Continuing with Tauri setup.");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

