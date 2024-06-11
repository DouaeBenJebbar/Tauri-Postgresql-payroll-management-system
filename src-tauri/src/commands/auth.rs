use tauri::State;
use sqlx::Row;
use crate::models::{AppState, LoginPayload};

#[tauri::command]
pub async fn login(payload: LoginPayload, state: State<'_, AppState>) -> Result<bool, String> {
    println!("Attempting to login with username: {}", payload.username);
    let pool = state.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;
    
    match sqlx::query("SELECT password FROM admin WHERE username = $1")
        .bind(&payload.username)
        .fetch_one(pool)
        .await
    {
        Ok(row) => {
            let stored_password: String = row.try_get("password").map_err(|e| e.to_string())?;
            if stored_password == payload.password {
                println!("Login successful for username: {}", payload.username);
                Ok(true)
            } else {
                println!("Invalid credentials for username: {}", payload.username);
                Err("Invalid credentials".to_string())
            }
        }
        Err(sqlx::Error::RowNotFound) => {
            println!("User not found: {}", payload.username);
            Err("User not found".to_string())
        }
        Err(e) => {
            eprintln!("Database query error: {:?}", e);
            Err(format!("Failed to query database: {}", e))
        }
    }
}
