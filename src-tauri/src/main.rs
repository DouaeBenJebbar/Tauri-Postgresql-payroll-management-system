#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]


use tokio::sync::Mutex;
use dotenv::dotenv;
use std::env;

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
    dotenv().ok(); // Load environment variables

    // Attempt to establish a database connection
    let db_connection = match connect_db().await {
        Ok(pool) => {
            Some(pool)
        },
        Err(e) => {
            eprintln!("Failed to connect to the database: {}", e);
            None
        },
    };

    tauri::Builder::default()
        .manage(AppState {
            pool: Mutex::new(db_connection), // Pass the db connection to the AppState
        }) 
        .invoke_handler(tauri::generate_handler![
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
