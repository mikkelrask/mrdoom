#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{
    env,
    process::{Child, Command},
    thread,
    time::{Duration, Instant},
    net::TcpStream,
    io::{ErrorKind, Read, Write},
};
use std::sync::{Arc, Mutex};
use tauri::{
    Builder,
    Manager,
    plugin::{Builder as PluginBuilder},
    http::{Request as TauriRequest, Response as TauriResponse},
    UriSchemeContext,
    Runtime,
};
use tauri::path::BaseDirectory;
use tauri_plugin_dialog;
use std::io::BufRead;
use std::collections::HashMap;
use std::str::FromStr;

// Import ResponseBuilder from the http crate
use http::response::Builder as HttpResponseBuilder;
use http::StatusCode;
use http::Response as HttpResponse;
use http::header::HeaderValue;


fn wait_for_server(host: &str, port: u16, timeout_secs: u64, retry_interval_ms: u64) -> bool {
    let start = Instant::now();
    let timeout = Duration::from_secs(timeout_secs);

    while start.elapsed() < timeout {
        match TcpStream::connect(format!("{}:{}", host, port)) {
            Ok(_) => return true,
            Err(e) if e.kind() == ErrorKind::ConnectionRefused => (),
            Err(e) => eprintln!("Connection error in wait_for_server: {:?}", e),
        }
        thread::sleep(Duration::from_millis(retry_interval_ms));
    }
    false
}

// Custom scheme handler function
fn custom_scheme_handler<R: Runtime>(
    _context: &UriSchemeContext<R>,
    request: TauriRequest<Vec<u8>>,
) -> Result<HttpResponse<Vec<u8>>, Box<dyn std::error::Error>> {
    let uri = request.uri().to_string();
    println!("Received request for custom protocol: {}", uri);

    let target_url = uri.replace("tauri://localhost", "http://localhost:7666");
    println!("Proxying request to target URL: {}", target_url);

    println!("Attempting to connect to Node.js server at localhost:7666...");
    match TcpStream::connect("localhost:7666") {
        Ok(mut stream) => {
            println!("Successfully connected to Node.js server.");

            let mut http_request = format!(
                "{} {} HTTP/1.1\r\nHost: localhost:7666\r\n",
                request.method(),
                target_url
            );

            // Add headers from the original request
            for (name, value) in request.headers().iter() {
                http_request.push_str(&format!("{}: {}\r\n", name, String::from_utf8_lossy(value.as_bytes())));
            }

            // Add Content-Length header
            let body_ref: &Vec<u8> = request.body();
            let content_length = body_ref.len();
            http_request.push_str(&format!("Content-Length: {}\r\n", content_length));

            // Ensure Content-Type is set to application/json if not present
            if !request.headers().contains_key("Content-Type") {
                http_request.push_str("Content-Type: application/json\r\n");
            }

            http_request.push_str("\r\n");

            println!("Constructed HTTP request:\n{}", http_request);

            // Write the request headers to the stream
            if let Err(e) = stream.write_all(http_request.as_bytes()) {
                eprintln!("Error writing headers to Node.js server: {:?}", e);
                return Ok(HttpResponseBuilder::new()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body(b"Error sending request to server".to_vec())
                    .unwrap());
            }
            println!("Successfully wrote HTTP request headers to Node.js server.");

            // Write the request body to the stream
            if !body_ref.is_empty() {
                println!("Request has a body. Attempting to write body to Node.js server.");
                if let Err(e) = stream.write_all(body_ref) {
                    eprintln!("Error writing body to Node.js server: {:?}", e);
                    return Ok(HttpResponseBuilder::new()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(b"Error sending request body to server".to_vec())
                        .unwrap());
                }
                println!("Successfully wrote body to Node.js server.");
            }

            // Use a BufReader for more efficient line reading
            let mut reader = std::io::BufReader::new(stream);
            let mut status_line = String::new();
            println!("Attempting to read status line from response...");
            if let Err(e) = reader.read_line(&mut status_line) {
                eprintln!("Error reading status line from Node.js server: {:?}", e);
                return Ok(HttpResponseBuilder::new()
                    .status(StatusCode::INTERNAL_SERVER_ERROR)
                    .body(b"Error parsing status line from server response".to_vec())
                    .unwrap());
            }
            println!("Read status line: {}", status_line.trim());

            let status_code_u16 = if status_line.starts_with("HTTP/1.1 ") {
                status_line.split_whitespace().nth(1).unwrap_or("500").parse::<u16>().unwrap_or(500)
            } else {
                500
            };
            println!("Parsed status code: {}", status_code_u16);
            let status = StatusCode::from_u16(status_code_u16)?;

            let mut headers = HashMap::<String, String>::new();
            let mut header_line = String::new();
            println!("Attempting to read headers from response...");
            while reader.read_line(&mut header_line).unwrap() > 2 { // Read until CRLFCRLF
                if let Some((name, value)) = header_line.split_once(':') {
                    headers.insert(
                        name.trim().to_lowercase().to_string(),
                        value.trim().to_string(),
                    );
                }
                header_line.clear();
            }
            println!("Finished reading headers. Parsed {} headers.", headers.len());
            println!("Parsed headers: {:?}", headers);

            let mut body = Vec::new();
            // Check for Content-Length header
            if let Some(content_length_str) = headers.get("content-length") {
                if let Ok(content_length) = usize::from_str(content_length_str) {
                    println!("Content-Length found: {}", content_length);
                    body.reserve(content_length); // Reserve space for the body
                    let mut body_reader = reader.take(content_length as u64); // Read exactly content_length bytes
                    if let Err(e) = body_reader.read_to_end(&mut body) {
                        eprintln!("Error reading response body with Content-Length: {:?}", e);
                        return Ok(HttpResponseBuilder::new()
                            .status(StatusCode::INTERNAL_SERVER_ERROR)
                            .body(b"Error reading response body".to_vec())
                            .unwrap());
                    }
                    println!("Successfully read body based on Content-Length. Body size: {}", body.len());
                } else {
                    eprintln!("Error parsing Content-Length header: {}", content_length_str);
                    return Ok(HttpResponseBuilder::new()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(b"Invalid Content-Length header".to_vec())
                        .unwrap());
                }
            } else {
                eprintln!("Warning: Content-Length header not found. Falling back to read_to_end.");
                if let Err(e) = reader.read_to_end(&mut body) {
                    eprintln!("Error reading response body with read_to_end: {:?}", e);
                    return Ok(HttpResponseBuilder::new()
                        .status(StatusCode::INTERNAL_SERVER_ERROR)
                        .body(b"Error reading response body (no Content-Length)".to_vec())
                        .unwrap());
                }
                println!("Successfully read body with read_to_end. Body size: {}", body.len());
            }

            // Build the http::Response
            let mut http_response_builder = HttpResponseBuilder::new().status(status);

            // Add headers to the builder
            for (name, value) in headers.iter() {
                if let Ok(header_value) = HeaderValue::from_str(value) {
                    http_response_builder = http_response_builder.header(name, header_value);
                } else {
                    eprintln!("Warning: Invalid header value for '{}': {}", name, value);
                }
            }

            // Set the body and build the final http::Response
            let http_response = http_response_builder.body(body)?;

            println!("Returning response with status {} and body size {}", status_code_u16, http_response.body().len());

            Ok(http_response)
        }
        Err(e) => {
            eprintln!("Error connecting to Node.js server: {:?}", e);
            Ok(HttpResponseBuilder::new()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(b"Error connecting to server".to_vec())
                .unwrap())
        }
    }
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

    let app = Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            PluginBuilder::<tauri::Wry, ()>::new("custom-scheme")
                .register_uri_scheme_protocol("tauri", move |context, request| {
                    custom_scheme_handler(&context, request).unwrap_or_else(|e| {
                        eprintln!("Error in custom scheme handler: {}", e);
                        TauriResponse::builder()
                            .status(500)
                            .body(b"Internal Server Error".to_vec())
                            .unwrap()
                    })
                })
                .build()
        )
        .setup({
            let node_process = Arc::clone(&node_process);
            move |app| {
                println!("Tauri setup is running from main.rs...");

                let resource_dir = app.path().resolve("resources", BaseDirectory::Resource)?;

                println!("Resolved Resource dir: {:?}", resource_dir);

                #[cfg(target_os = "linux")]
                let node_path = resource_dir.join("node");

                #[cfg(target_os = "windows")]
                let node_path = resource_dir.join("node.exe");

                #[cfg(target_os = "macos")]
                let node_path = resource_dir.join("node");

                println!("Resolved Node path: {:?}", node_path);

                if !node_path.exists() {
                    panic!("Node binary not found at: {:?}", node_path);
                }

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
                println!("Node.js server is ready.");

                *node_process.lock().unwrap() = Some(child);

                println!("Dialog plugin registered successfully!");

                Ok(())
            }
        })
        .build(tauri::generate_context!())
        .expect("Failed to build tauri application");

    app.run(move |_app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            if let Some(mut child) = node_process.lock().unwrap().take() {
                println!("Shutting down Node.js server...");
                let _ = child.kill();
            }
        }
    });
}
