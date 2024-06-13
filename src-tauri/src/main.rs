#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


use tokio::sync::Mutex;
use std::sync::Arc;
use tauri::generate_handler;

mod commands;
mod models;


use commands::{
    connect_db, 
    login,
    get_banques,
    get_specialites,
    add_specialite,
    get_residents
};
    
use models::AppState;

#[tokio::main]
async fn main() {
    let state = AppState {
        pool: Arc::new(Mutex::new(None)),
    };

    tauri::Builder::default()
        .manage(state)
        .invoke_handler(generate_handler![
            connect_db,
            login,
            get_banques,
            get_specialites,
            add_specialite,
            get_residents

            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}