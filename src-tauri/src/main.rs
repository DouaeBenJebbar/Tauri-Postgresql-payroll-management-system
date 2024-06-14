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
    get_rappels

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
            delete_specialite,
            modify_specialite, 
            get_residents,
            add_resident,
            delete_resident,
            modify_resident,
            get_paiments,
            generate_payments,
            get_rappels
            ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}