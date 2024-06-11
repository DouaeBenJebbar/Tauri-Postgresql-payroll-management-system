#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


use tokio::sync::Mutex;

mod commands;
mod models;


use commands::{connect_db, login,get_banks, get_specialties, add_specialty, delete_specialty, modify_specialty, get_residents, add_resident, delete_resident,modify_resident, get_payments, generate_payments,get_rappels};
use models::AppState;

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            pool: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![
            connect_db,
            login,
            get_banks,
            get_specialties,
            add_specialty,
            delete_specialty,
            modify_specialty,
            get_residents,
            add_resident,
            delete_resident,
            modify_resident,
            get_payments,
            generate_payments,
            get_rappels
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
