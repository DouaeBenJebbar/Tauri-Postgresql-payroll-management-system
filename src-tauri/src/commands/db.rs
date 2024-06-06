use tauri::State;
use sqlx::PgPool;
use crate::models::{AppState, DbConfig, Specialty,Resident ,MyError,NewSpecialty,NewResident,Bank};
use tokio::sync::Mutex;


#[tauri::command]
pub async fn connect_db(config: DbConfig, state: State<'_, AppState>) -> Result<(), String> {
    let connection_str = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.user, config.password, config.host, config.port, config.database
    );

    match PgPool::connect(&connection_str).await {
        Ok(pool) => {
            *state.pool.lock().await = Some(pool);
            Ok(())
        }
        Err(e) => Err(format!("Failed to connect to the database: {}", e)),
    }
}
#[tauri::command]
pub async fn get_banks(state: State<'_, AppState>) -> Result<Vec<Bank>, MyError> {
    let pool = state.pool.lock().await;
    let pool = pool.as_ref().ok_or_else(|| MyError {
        message: "Database not connected".to_string(),
    })?;
    
    let banks = sqlx::query_as::<_, Bank>("SELECT id_bank, nom FROM banks")
        .fetch_all(pool)
        .await
        .map_err(MyError::from)?;

    Ok(banks)
}

#[tauri::command]
pub async fn get_specialties(state: State<'_, AppState>) -> Result<Vec<Specialty>, MyError> {
    let pool = state.pool.lock().await;
    let pool = pool.as_ref().ok_or_else(|| MyError {
        message: "Database not connected".to_string(),
    })?;
    
    let specialties = sqlx::query_as::<_, Specialty>("SELECT id, name, yearsofresidency FROM specialty")
        .fetch_all(pool)
        .await
        .map_err(MyError::from)?;

    Ok(specialties)
}


#[tauri::command]
pub async fn add_specialty(pool: State<'_, AppState>, specialty: NewSpecialty) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;
  
    let existing_specialty = sqlx::query!(
      "SELECT COUNT(*) FROM specialty WHERE name = $1",
      specialty.specialite
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
      "INSERT INTO specialty (name, yearsofresidency) VALUES ($1, $2)",
      specialty.specialite,
      specialty.nombre_annees
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to add specialty: {}", e))?;
  
    Ok(())
  }


#[tauri::command]
pub async fn delete_specialty(pool: State<'_, AppState>, specialty_name: String) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    sqlx::query!("DELETE FROM specialty WHERE name = $1", specialty_name)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete specialty: {}", e))?;

    Ok(())
}



#[tauri::command]
pub async fn modify_specialty(pool: State<'_, AppState>, specialty: Specialty) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    let existing_specialty = sqlx::query!(
        "SELECT COUNT(*) FROM specialty WHERE name = $1 AND id != $2",
        specialty.specialite,
        specialty.id
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
        "UPDATE specialty SET name = $1, yearsofresidency = $2 WHERE id = $3",
        specialty.specialite,
        specialty.nombre_annees,
        specialty.id
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to modify specialty: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_residents(pool: State<'_, AppState>) -> Result<Vec<Resident>, String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    let residents = sqlx::query_as!(
        Resident,
        r#"
        SELECT 
            residents.id_resident,
            residents.cin,
            residents.nom_prenom,
            residents.date_debut,
            residents.id_specialty,
            residents.date_fin,
            residents.is_titulaire,
            residents.rib,
            residents.nombre_enfants,
            residents.id_bank,
            specialty.name AS specialty_name
        FROM residents
        LEFT JOIN specialty ON residents.id_specialty = specialty.id
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch residents: {}", e))?;

    Ok(residents)
}

#[tauri::command]
pub async fn add_resident(pool: State<'_, AppState>, resident: NewResident) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;
  
    // Perform any validation checks here
  
    sqlx::query!(
      "INSERT INTO residents (cin, nom_prenom, date_debut, id_specialty, is_titulaire, rib, nombre_enfants, id_bank) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      resident.cin,
      resident.nom_prenom,
      resident.date_debut,
      resident.id_specialty,
      resident.is_titulaire,
      resident.rib,
      resident.nombre_enfants,
      resident.id_bank
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to add resident: {}", e))?;
  
    Ok(())
}

#[tauri::command]
pub async fn delete_resident(pool: State<'_, AppState>, cin: String) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;
  
    sqlx::query!(
        "DELETE FROM residents WHERE cin = $1",
        cin
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to delete resident: {}", e))?;
  
    Ok(())
}

#[tauri::command]
pub async fn modify_resident(pool: State<'_, AppState>, resident: Resident) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    // Perform any validation checks here

    sqlx::query!(
        "UPDATE residents SET 
            nom_prenom = $1, 
            date_debut = $2, 
            id_specialty = $3, 
            is_titulaire = $4, 
            rib = $5, 
            nombre_enfants = $6 ,
            cin = $7
            WHERE id_resident = $8",

        resident.nom_prenom,
        resident.date_debut,
        resident.id_specialty,
        resident.is_titulaire,
        resident.rib,
        resident.nombre_enfants,
        resident.cin,
        resident.id_resident
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to modify resident: {}", e))?;

    Ok(())
}
