use reqwest::{Client, Response};
use serde::Serialize;
use serde_json::Value;

use crate::consts::BACKEND_BASE_URL;

pub type ApiError = String;

#[derive(Debug, Clone)]
pub struct ApiClient {
    client: Client,
    base_url: String,
    token: Option<String>,
}

impl ApiClient {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
            base_url: BACKEND_BASE_URL.to_string(),
            token: None,
        }
    }

    pub fn with_token(mut self, token: impl Into<String>) -> Self {
        let t = token.into();
        if !t.is_empty() { self.token = Some(t); }
        self
    }

    fn url(&self, path: &str) -> String {
        let base = self.base_url.trim_end_matches('/');
        let path = path.trim_start_matches('/');
        format!("{}/{}", base, path)
    }

    fn auth(&self) -> Option<String> {
        self.token.as_ref().map(|t| format!("Bearer {}", t))
    }

    pub async fn get(&self, path: &str) -> Result<Value, String> {
        let url = self.url(path);
        let mut req = self.client.get(&url);
        if let Some(auth) = self.auth() { req = req.header("Authorization", auth); }
        let resp = req.send().await.map_err(|e| e.to_string())?;
        parse_json_response(resp).await
    }

    pub async fn post(&self, path: &str, body: &impl Serialize) -> Result<Value, String> {
        let url = self.url(path);
        let mut req = self.client.post(&url).json(body);
        if let Some(auth) = self.auth() { req = req.header("Authorization", auth); }
        let resp = req.send().await.map_err(|e| e.to_string())?;
        parse_json_response(resp).await
    }

    pub async fn post_stream(&self, path: &str, body: &impl Serialize) -> Result<Response, String> {
        let url = self.url(path);
        let mut req = self.client.post(&url).json(body);
        if let Some(auth) = self.auth() { req = req.header("Authorization", auth); }
        let resp = req.send().await.map_err(|e| e.to_string())?;
        if !resp.status().is_success() {
            let status = resp.status().as_u16();
            let text = resp.text().await.unwrap_or_default();
            return Err(format!("HTTP {} - {}", status, text));
        }
        Ok(resp)
    }

    pub async fn post_multipart(&self, path: &str, form: reqwest::multipart::Form) -> Result<Value, String> {
        let url = self.url(path);
        let mut req = self.client.post(&url).multipart(form);
        if let Some(auth) = self.auth() { req = req.header("Authorization", auth); }
        let resp = req.send().await.map_err(|e| e.to_string())?;
        parse_json_response(resp).await
    }
}

async fn parse_json_response(resp: Response) -> Result<Value, String> {
    if resp.status().is_success() {
        resp.json::<Value>().await.map_err(|e| e.to_string())
    } else {
        let status = resp.status().as_u16();
        let body: Value = resp.json().await.unwrap_or_default();
        let msg = body["detail"]["message"].as_str().unwrap_or("HTTP error").to_string();
        Err(format!("HTTP {} - {}", status, msg))
    }
}
