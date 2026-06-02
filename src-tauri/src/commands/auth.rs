use serde_json::Value;
use tauri::State;

use crate::AppServices;
use crate::services::auth::AuthService;

#[tauri::command]
pub async fn auth_signup(
    username: String,
    email: String,
    password: String,
    services: State<'_, AppServices>,
) -> Result<Value, String> {
    let result = AuthService::signup(&services.config_store, &username, &email, &password).await?;
    // update logged-in state
    services.app_state.set_logged_in(Some(true));
    Ok(result)
}

#[tauri::command]
pub async fn auth_login(
    email: String,
    password: String,
    services: State<'_, AppServices>,
) -> Result<Value, String> {
    let result = AuthService::login(&services.config_store, &email, &password).await?;
    services.app_state.set_logged_in(Some(true));
    Ok(result)
}

#[tauri::command]
pub async fn auth_logout(services: State<'_, AppServices>) -> Result<(), String> {
    AuthService::logout(&services.config_store).await?;
    services.app_state.set_logged_in(Some(false));
    Ok(())
}

#[tauri::command]
pub async fn auth_change_password(
    current_password: String,
    new_password: String,
    services: State<'_, AppServices>,
) -> Result<Value, String> {
    AuthService::change_password(&services.config_store, &current_password, &new_password).await
}
