use sqlx::postgres::PgPoolOptions;
use crate::models::{AppState, DbConfig, Specialite, Resident, MyError, NewSpecialite, NewResident, Banque, PaiementMensuel, RappelAnnuel};
use thiserror::Error;
use bigdecimal::BigDecimal;
use std::str::FromStr;
use chrono::{Local, NaiveDate};
use tauri::{Manager, State};
use tokio_cron_scheduler::{Job, JobScheduler};
use std::sync::Arc;


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
            // Store credentials in the application state after successful connection
            let mut credentials_guard = state.db_credentials.lock().await;
            *credentials_guard = Some(DbConfig {
                user: config.user,
                password: config.password,
                host: config.host,
                port: config.port,
                database: config.database,
            });            
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

#[tauri::command]
pub async fn delete_specialite(pool: State<'_, AppState>, id_specialite: i32) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    sqlx::query!("DELETE FROM specialites WHERE id_specialite = $1", id_specialite)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete specialty: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn modify_specialite(pool: State<'_, AppState>, specialite: Specialite) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    let existing_specialty = sqlx::query!(
        "SELECT COUNT(*) FROM specialites WHERE nom = $1 AND id_specialite != $2",
        specialite.nom,
        specialite.id_specialite
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
        "UPDATE specialites SET nom = $1, nombre_annees = $2 WHERE id_specialite = $3",
        specialite.nom,
        specialite.nombre_annees,
        specialite.id_specialite
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to modify specialty: {}", e))?;

    Ok(())
}


//managing residents 

#[derive(Debug, Error)]
pub enum ValidationError {
    #[error("Le RIB doit être une valeur numérique")]
    InvalidRIB,
    #[error("Le nombre d'enfants ne peut pas être négatif")]
    InvalidNumberOfChildren,
    #[error("Veuillez sélectionner une spécialité")]
    EmptySpecialtyID,
    #[error("Veuillez sélectionner une banque")]
    EmptyBankID,
}


trait ValidatableResident {
    fn rib(&self) -> &str;
    fn nombre_enfants(&self) -> i32;
    fn id_specialite(&self) -> i32;
    fn id_banque(&self) -> i32;
}

impl ValidatableResident for Resident {

    fn rib(&self) -> &str {
        &self.rib
    }

    fn nombre_enfants(&self) -> i32 {
        self.nombre_enfants
    }

    fn id_specialite(&self) -> i32 {
        self.id_specialite.unwrap_or(0)
    }

    fn id_banque(&self) -> i32 {
        self.id_banque.unwrap_or(0)
    }
}

impl ValidatableResident for NewResident {

    fn rib(&self) -> &str {
        &self.rib
    }

    fn nombre_enfants(&self) -> i32 {
        self.nombre_enfants.unwrap_or(0)
    }

    fn id_specialite(&self) -> i32 {
        self.id_specialite.unwrap_or(0)
    }

    fn id_banque(&self) -> i32 {
        self.id_banque.unwrap_or(0)
    }
}


fn validate_resident<R: ValidatableResident>(resident: &R) -> Result<(), String> {

    if !resident.rib().to_string().chars().all(|c| c.is_numeric()) {
        return Err(ValidationError::InvalidRIB.to_string());
    }

    if resident.nombre_enfants() < 0 {
        return Err(ValidationError::InvalidNumberOfChildren.to_string());
    }

    if resident.id_specialite() <= 0 {
        return Err(ValidationError::EmptySpecialtyID.to_string());
    }

    if resident.id_banque() <= 0 {
        return Err(ValidationError::EmptyBankID.to_string());
    }

    Ok(())
}


#[tauri::command]
pub async fn get_residents(pool: State<'_, AppState>) -> Result<Vec<Resident>, String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    // Fetch records with the correct type annotations
    let records = sqlx::query!(
        r#"
        SELECT 
            residents.id_resident as "id_resident",
            residents.nom_prenom as "nom_prenom",
            residents.date_debut as "date_debut",
            residents.id_specialite as "id_specialite",
            residents.date_fin as "date_fin",
            residents.rib as "rib",
            residents.nombre_enfants as "nombre_enfants",
            residents.id_banque as "id_banque",
            specialites.nom as "nom_specialite",
            banque.nom as "nom_banque"
        FROM residents
        LEFT JOIN specialites ON residents.id_specialite = specialites.id_specialite
        LEFT JOIN banque ON residents.id_banque = banque.id_banque
        WHERE residents.date_fin > CURRENT_DATE
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch residents: {}", e))?;

    let residents: Vec<Resident> = records
        .into_iter()
        .map(|record| Resident {
            id_resident: record.id_resident,
            nom_prenom: record.nom_prenom,
            date_debut: record.date_debut,
            id_specialite: Some(record.id_specialite.expect("id_specialty is None")),
            date_fin: record.date_fin,
            rib: record.rib,
            nombre_enfants: record.nombre_enfants.expect("nombre_enfants is None"),
            id_banque: Some(record.id_banque.expect("id_bank is None")),
            nom_specialite: record.nom_specialite,
            nom_banque: record.nom_banque,
        })
        .collect();

    Ok(residents)
}

#[tauri::command]
pub async fn get_resident_id(pool: State<'_, AppState>, nom_prenom: String) -> Result<i32, String> {
    let pool = pool.pool.lock().await;
    // Assuming pool is an Option<Pool<Postgres>>, ensure it's not None
    let pool = match pool.as_ref() {
        Some(pool) => pool,
        None => return Err("Database pool is not initialized".into()),
    };

    let recs = sqlx::query!(
        "SELECT id_resident FROM residents WHERE nom_prenom = $1",
        nom_prenom
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to find resident by nom_prenom: {}", e))?;

    // Assuming you're expecting only one record, adjust as needed
    if let Some(rec) = recs.first() {
        Ok(rec.id_resident)
    } else {
        Err("No resident found with the provided nom_prenom".into())
    }
}


#[tauri::command]
pub async fn add_resident(pool: State<'_, AppState>, resident: NewResident) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;
  
    validate_resident(&resident).map_err(|e| e.to_string())?;
  
    sqlx::query!(
      "INSERT INTO residents (nom_prenom, date_debut, id_specialite, rib, nombre_enfants, id_banque) VALUES ($1, $2, $3, $4, $5, $6)",
      resident.nom_prenom,
      resident.date_debut,
      resident.id_specialite,
      resident.rib,
      resident.nombre_enfants.unwrap_or(0),
      resident.id_banque
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to add resident: {}", e))?;
  
    Ok(())
}

#[tauri::command]
pub async fn delete_resident(pool: State<'_, AppState>, id: i32) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;
  
    sqlx::query!(
        "DELETE FROM residents WHERE id_resident = $1",
        id
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

    validate_resident(&resident).map_err(|e| e.to_string())?;

    sqlx::query!(
        "UPDATE residents SET 
            nom_prenom = $1, 
            date_debut = $2, 
            id_specialite = $3,
            id_banque = $4,
            rib = $5, 
            nombre_enfants = $6
            WHERE id_resident = $7",

        resident.nom_prenom,
        resident.date_debut,
        resident.id_specialite,
        resident.id_banque,
        resident.rib,
        resident.nombre_enfants,
        resident.id_resident
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to modify resident: {}", e))?;
    

    Ok(())
}


//manage payments

#[tauri::command]
pub async fn get_paiments(state: State<'_, AppState>) -> Result<Vec<PaiementMensuel>, String> {
    let pool = state.pool.lock().await;
    let conn = pool.as_ref().ok_or("Database not connected")?;

    let records = sqlx::query!(
        r#"
        SELECT 
            paiement_mensuel.id_paiement,
            paiement_mensuel.id_resident,
            paiement_mensuel.jours_travail,
            paiement_mensuel.allocations_familiales,
            paiement_mensuel.montant,
            paiement_mensuel.date_paiement,
            residents.nom_prenom as nom_resident,
            residents.rib as rib_string,
            banque.nom as nom_banque
        FROM paiement_mensuel
        LEFT JOIN residents ON paiement_mensuel.id_resident = residents.id_resident
        LEFT JOIN banque ON residents.id_banque = banque.id_banque
        "#
    )
    .fetch_all(conn)
    .await
    .map_err(|e| format!("Failed to fetch payments: {}", e))?;

    let payments: Vec<PaiementMensuel> = records
        .into_iter()
        .map(|record| PaiementMensuel {
            id_paiement: record.id_paiement,
            id_resident: Some(record.id_resident.expect("id_resident is None")),
            jours_travail: record.jours_travail,
            allocations_familiales: record.allocations_familiales.map(|v| BigDecimal::from_str(&v.to_string()).expect("Failed to parse BigDecimal")),
            montant: BigDecimal::from_str(&record.montant.to_string()).expect("Failed to parse BigDecimal"),
            date_paiement: record.date_paiement,
            nom_resident: record.nom_resident,
            rib: record.rib_string.map(|rib| rib.parse::<i32>().expect("Failed to parse rib as i32")),
            nom_banque: record.nom_banque,
        })
        .collect();

    Ok(payments)
}

#[tauri::command]
pub async fn generate_payments(pool: State<'_, AppState>) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    let current_date: NaiveDate = Local::now().naive_local().date();

    sqlx::query!(
        "SELECT generate_monthly_payments($1)",
        current_date
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to generate payments: {}", e))?;

    Ok(())
}

//manage rappels annuels

#[tauri::command]
pub async fn get_rappels(pool: State<'_, AppState>) -> Result<Vec<RappelAnnuel>, String> {
    let pool_guard = pool.pool.lock().await;
    let pool_ref = pool_guard.as_ref().ok_or("Database not connected")?;

    let records = sqlx::query!(
        r#"
        SELECT 
            rappels_annuels.id_rappel as "id_rappel!",
            rappels_annuels.id_resident as "id_resident!",
            rappels_annuels.exercice as "exercice?",
            rappels_annuels.duree_rappel as "duree_rappel?",
            rappels_annuels.montant as "montant?",
            rappels_annuels.date_generation as "date_generation?",
            residents.nom_prenom as "nom_resident?",
            residents.rib as "rib?",
            banque.nom as "nom_banque?"
        FROM rappels_annuels
        LEFT JOIN residents ON rappels_annuels.id_resident = residents.id_resident
        LEFT JOIN banque ON residents.id_banque = banque.id_banque
        "#
    )
    .fetch_all(pool_ref)
    .await
    .map_err(|e| format!("Failed to fetch payments: {}", e))?;

    let rappels: Vec<RappelAnnuel> = records
    .into_iter()
    .map(|record| RappelAnnuel {
        id_rappel: record.id_rappel,
    id_resident: Some(record.id_resident),
    exercice: record.exercice.expect("exercice is None"),
    duree_rappel: record.duree_rappel.expect("duree_rappel is None"),
    montant: record.montant.map(|v| BigDecimal::from_str(&v.to_string()).expect("Failed to parse BigDecimal")).expect("montant is None"),
    date_generation: Some(record.date_generation.expect("date_generation is None")),
    nom_resident: record.nom_resident,
    rib: record.rib.map(|rib| rib.parse::<i32>().expect("Failed to parse rib as i32")),
    nom_banque: record.nom_banque,
    })
    .collect();

    Ok(rappels)
}


#[tauri::command]
pub async fn generate_rappel(pool: State<'_, AppState>, resident_id: i32) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    let current_date: NaiveDate = Local::now().naive_local().date();

    sqlx::query!(
        "SELECT generate_yearly_payments($1, $2)",
        resident_id,
        current_date
    )
    .execute(pool)
    .await
    .map_err(|e| format!("Failed to generate rappel: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn start_scheduler<R: tauri::Runtime>(manager: tauri::AppHandle<R>) -> Result<(), String> {
    // Check if the scheduler is already running
    let state = manager.state::<AppState>();
    {
        let pool_guard = state.pool.lock().await;
        if pool_guard.is_none() {
            eprintln!("Database pool is not connected.");
            return Err("Database not connected".to_string());
        }
    }

    // Set up the job scheduler
    let scheduler = JobScheduler::new().await.map_err(|e| format!("Failed to create scheduler: {}", e))?;
    let manager_arc = Arc::new(manager.clone());

    // Define the job to generate payments
    let job = Job::new_async("0 0 1 * * *", move |_uuid, _l| {
        let manager_clone = manager_arc.clone();
        Box::pin(async move {
            if let Err(e) = generate_payments(manager_clone.state::<AppState>()).await {
                eprintln!("Failed to generate payments: {}", e);
            }
        })
    }).map_err(|e| format!("Failed to create job: {}", e))?;

    scheduler.add(job).await.map_err(|e| format!("Failed to add job to scheduler: {}", e))?;

    // Start the scheduler
    scheduler.start().await.map_err(|e| format!("Failed to start scheduler: {}", e))?;

    Ok(())
}
