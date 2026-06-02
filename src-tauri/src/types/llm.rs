use serde::{Deserialize, Serialize};

use super::app_state::Transcript;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LLMConfig {
    pub provider: Option<String>,
    pub model: Option<String>,
    pub api_key: Option<String>,
    pub base_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LLMModelInfo {
    pub id: String,
    pub name: String,
    pub provider: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LLMConfigValidationResult {
    pub valid: bool,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LLMRequest {
    pub config: Option<LLMConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateLiveSuggestionRequest {
    pub config: Option<LLMConfig>,
    pub profile_data: String,
    pub context: String,
    pub transcripts: Vec<Transcript>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateActionSuggestionRequest {
    pub config: Option<LLMConfig>,
    pub profile_data: String,
    pub context: String,
    pub transcripts: Vec<Transcript>,
    pub image_names: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateSummarizeRequest {
    pub config: Option<LLMConfig>,
    pub transcripts: Vec<Transcript>,
}
