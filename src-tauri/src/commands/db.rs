use sqlx::postgres::{PgPool, PgPoolOptions};
use std::sync::{Arc, Mutex};
use tauri::State;
use crate::models::{AppState, DbConfig, Resident, Banque, Specialite, NewSpecialite, MyError};

#[tauri::command]
pub async fn connect_db(config: DbConfig, state: State<'_, AppState>) -> Result<String, String> {
    let connection_str = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.user, config.password, config.host, config.port, config.database
    );

    match PgPoolOptions::new()
        .max_connections(5) // Set the number of connections in the pool
        .connect(&connection_str)
        .await
    {
        Ok(pool) => {
            let mut pool_guard = state.pool.lock().await;
            *pool_guard = Some(pool);
            Ok("Database connection established successfully.".to_string())
        },
        Err(e) => Err(format!("Failed to connect to the database: {}", e)),
    }
}
//managing banks
#[tauri::command]
pub async fn get_banques(state: State<'_, AppState>) -> Result<Vec<Banque>, MyError> {
    let pool = state.pool.lock().await;
    let pool = pool.as_ref().ok_or_else(|| MyError {
        message: "Database not connected".to_string(),
    })?;
    
    let banks = sqlx::query_as::<_, Banque>("SELECT id_banque, nom FROM banque")
        .fetch_all(pool)
        .await
        .map_err(MyError::from)?;

    Ok(banks)
}

//managing specialties

#[tauri::command]
pub async fn get_specialites(state: State<'_, AppState>) -> Result<Vec<Specialite>, MyError> {
    let pool = state.pool.lock().await;
    let pool = pool.as_ref().ok_or_else(|| MyError {
        message: "Database not connected".to_string(),
    })?;
    
    let specialties = sqlx::query_as::<_, Specialite>("SELECT id_specialite, nom, nombre_annees FROM specialites")
        .fetch_all(pool)
        .await
        .map_err(MyError::from)?;

    Ok(specialties)
}
#[tauri::command]
pub async fn add_specialite(pool: State<'_, AppState>, specialite: NewSpecialite) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or_else(|| MyError {
        message: "Database not connected".to_string(),
    }).map_err(|e| e.message)?; // Convert MyError to String here

    let existing_specialty = sqlx::query!(
        "SELECT COUNT(*) FROM specialites WHERE nom = $1",
        specialite.nom
    )
    .fetch_one(pool)
    .await
    .map_err(|e| format!("Failed to query database: {}", e))?;

    if let Some(count) = existing_specialty.count {
        if count > 0 {
            return Err("Specialty name already exists".to_string());
        }
    }

    sqlx::query!(
        "INSERT INTO specialites (nom, nombre_annees) VALUES ($1, $2)",
        specialite.nom,
        specialite.nombre_annees
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to add specialty: {}", e))?;

    Ok(())
}

//managing residents 
#[tauri::command]
pub async fn get_residents(state: State<'_, AppState>) -> Result<Vec<Resident>, String> {
    let pool = state.pool.lock().await;
    let conn = pool.as_ref().expect("Database not connected");
    let residents = sqlx::query_as!(
        Resident,
        "SELECT 
            id_resident,
            cin,
            nom_prenom,
            date_debut,
            id_specialite,
            date_fin,
            rib,
            id_banque,
            nombre_enfants
            FROM public.residents"
    )
    .fetch_all(conn)
    .await
    .map_err(|e| e.to_string())?;
    Ok(residents)
}