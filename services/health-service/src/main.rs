use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::get,
    Router,
};
use chrono::Utc;
use http_body_util::{BodyExt, Empty};
use hyper::body::Bytes;
use hyper_util::client::legacy::Client;
use hyper_util::rt::TokioExecutor;
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, sync::Arc, time::Duration};
use tower_http::cors::CorsLayer;
use tracing::{info, warn};

// ─── Types ────────────────────────────────────────────────────

#[derive(Clone)]
struct ServiceDef {
    name:       &'static str,
    url:        String,
    technology: &'static str,
}

#[derive(Debug, Serialize)]
struct ServiceStatus {
    name:        String,
    technology:  String,
    status:      String,
    latency_ms:  Option<u64>,
}

#[derive(Debug, Serialize)]
struct SystemStatus {
    overall:    String,
    checked_at: String,
    version:    &'static str,
    services:   Vec<ServiceStatus>,
    summary:    Summary,
}

#[derive(Debug, Serialize)]
struct Summary { total: usize, healthy: usize, unhealthy: usize }

#[derive(Debug, Serialize)]
struct HealthResponse {
    service:   &'static str,
    status:    &'static str,
    version:   &'static str,
    timestamp: String,
}

struct AppState {
    services: Vec<ServiceDef>,
}

// ─── HTTP ping helper ─────────────────────────────────────────

async fn ping(url: &str) -> (bool, u64) {
    let client: Client<_, Empty<Bytes>> = Client::builder(TokioExecutor::new()).build_http();
    let uri = match format!("{}/health", url).parse::<hyper::Uri>() {
        Ok(u) => u,
        Err(_) => return (false, 0),
    };
    let start = std::time::Instant::now();
    let result = tokio::time::timeout(
        Duration::from_secs(3),
        client.get(uri),
    ).await;
    let latency = start.elapsed().as_millis() as u64;
    match result {
        // Accept 2xx AND 3xx (redirect) as healthy — service is up
        Ok(Ok(resp)) => (resp.status().as_u16() < 500, latency),
        _            => (false, latency),
    }
}

// ─── Handlers ─────────────────────────────────────────────────

async fn health_handler() -> Json<HealthResponse> {
    Json(HealthResponse {
        service:   "health-service",
        status:    "running",
        version:   env!("CARGO_PKG_VERSION"),
        timestamp: Utc::now().to_rfc3339(),
    })
}

async fn status_handler(
    State(state): State<Arc<AppState>>,
) -> (StatusCode, Json<SystemStatus>) {
    let mut results = Vec::new();

    for svc in &state.services {
        let (ok, latency_ms) = ping(&svc.url).await;
        if !ok { warn!("[{}] unhealthy ({}ms)", svc.name, latency_ms); }
        else   { info! ("[{}] healthy  ({}ms)", svc.name, latency_ms); }
        results.push(ServiceStatus {
            name:       svc.name.to_string(),
            technology: svc.technology.to_string(),
            status:     if ok { "healthy" } else { "unhealthy" }.to_string(),
            latency_ms: Some(latency_ms),
        });
    }

    let healthy   = results.iter().filter(|s| s.status == "healthy").count();
    let unhealthy = results.len() - healthy;
    let overall   = if unhealthy == 0 { "healthy" } else if healthy > 0 { "degraded" } else { "unhealthy" };
    let code      = if overall == "unhealthy" { StatusCode::SERVICE_UNAVAILABLE } else { StatusCode::OK };

    (code, Json(SystemStatus {
        overall:    overall.to_string(),
        checked_at: Utc::now().to_rfc3339(),
        version:    env!("CARGO_PKG_VERSION"),
        summary: Summary { total: results.len(), healthy, unhealthy },
        services: results,
    }))
}

async fn metrics_handler() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "educonnect_health_service_up": 1,
        "timestamp": Utc::now().to_rfc3339(),
    }))
}

// ─── Main ─────────────────────────────────────────────────────

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    let get_env = |key: &str, default: &str| -> String {
        std::env::var(key).unwrap_or_else(|_| default.to_string())
    };

    let services = vec![
        ServiceDef { name: "auth-service",         url: get_env("AUTH_SERVICE_URL",         "http://auth-service:8001"),         technology: "FastAPI (Python)" },
        ServiceDef { name: "user-service",         url: get_env("USER_SERVICE_URL",         "http://user-service:8002"),         technology: "FastAPI (Python)" },
        ServiceDef { name: "file-service",         url: get_env("FILE_SERVICE_URL",         "http://file-service:8003"),         technology: "FastAPI (Python)" },
        ServiceDef { name: "ai-service",           url: get_env("AI_SERVICE_URL",           "http://ai-service:8004"),           technology: "FastAPI (Python)" },
        ServiceDef { name: "log-service",          url: get_env("LOG_SERVICE_URL",          "http://log-service:8005"),          technology: "ExpressJS (Node.js)" },
        ServiceDef { name: "notification-service", url: get_env("NOTIFICATION_SERVICE_URL", "http://notification-service:8006"), technology: "GoLang" },
    ];

    let state = Arc::new(AppState { services });
    let port: u16 = std::env::var("SERVICE_PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(8007);

    let app = Router::new()
        .route("/health",  get(health_handler))
        .route("/status",  get(status_handler))
        .route("/metrics", get(metrics_handler))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    info!("🦀 EduConnect Health Service (Rust/Axum) on :{}", port);
    let listener = tokio::net::TcpListener::bind(addr).await.expect("bind");
    axum::serve(listener, app).await.expect("serve");
}
