#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


use tokio::sync::Mutex;
use std::sync::Arc;
use tauri::generate_handler;

mod commands;
mod models;

use commands::login;

use commands::{
    connect_db,
    get_banques, 
    get_specialites, 
    add_specialite,
    get_residents,
    delete_specialite,
    modify_specialite, 
    add_resident,
    delete_resident,
    modify_resident,
    get_paiments,
    generate_payments,
    get_rappels,
    generate_rappel,
    get_resident_id

};
    
use models::AppState;


#[tokio::main]
async fn main() {
    // Initialize application state using Arc and Mutex for shared access
    let state = Arc::new(AppState {
        pool: Arc::new(Mutex::new(None)),
        db_credentials: Arc::new(Mutex::new(None)),
    });

    // Create a Tauri application builder
    tauri::Builder::default()
        .manage(state.clone()) // Clone state for Tauri app context
        .invoke_handler(tauri::generate_handler![
            connect_db,
            login,
            get_banques,
            get_specialites,
            add_specialite,
            delete_specialite,
            modify_specialite,
            get_residents,
            add_resident,
            delete_resident,
            modify_resident,
            get_paiments,
            generate_payments,
            get_rappels,
            generate_rappel,
            get_resident_id
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
