use tauri::State;
use sqlx::PgPool;
use crate::models::{AppState, DbConfig, Specialite,Resident ,MyError,NewSpecialite,NewResident,Banque,PaiementMensuel,RappelAnnuel};
use thiserror::Error;
use chrono::{Local, NaiveDate};
use bigdecimal::BigDecimal;
use std::str::FromStr;



//connecting to database

#[tauri::command]
pub async fn connect_db(config: DbConfig, state: State<'_, AppState>) -> Result<(), String> {
    let connection_str = format!(
        "postgres://{}:{}@{}:{}/{}",
        config.user, config.password, config.host, config.port, config.database
    );

    match PgPool::connect(&connection_str).await {
        Ok(pool) => {
            // Replace the existing pool with the new one
            *state.pool.lock().await = Some(pool);
            Ok(())
        }
        Err(e) => Err(format!("Failed to connect to the database: {}", e)),
    }
}

pub async fn disconnect_db(state: State<'_, AppState>) {
    // Set the pool to None to release the resources
    *state.pool.lock().await = None;
}

//managing banks
#[tauri::command]
pub async fn get_banks(state: State<'_, AppState>) -> Result<Vec<Banque>, MyError> {
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
pub async fn get_specialties(state: State<'_, AppState>) -> Result<Vec<Specialite>, MyError> {
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


/*
#[tauri::command]
pub async fn add_specialty(pool: State<'_, AppState>, specialite: NewSpecialite) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;
  
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
pub async fn delete_specialty(pool: State<'_, AppState>, nom_specialite: String) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    sqlx::query!("DELETE FROM specialite WHERE nom = $1", nom_specialite)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to delete specialty: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn modify_specialty(pool: State<'_, AppState>, specialite: Specialite) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    let existing_specialty = sqlx::query!(
        "SELECT COUNT(*) FROM specialite WHERE nom = $1 AND id_specialite != $2",
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
        "UPDATE specialite SET nom = $1, nombre_annees = $2 WHERE id_specialite = $3",
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
    #[error("Le CIN ne peut pas être vide")]
    EmptyCIN,
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
    fn cin(&self) -> &str;
    fn rib(&self) -> i32; // Assuming rib is an integer, adjust the type as necessary
    fn nombre_enfants(&self) -> i32;
    fn id_specialty(&self) -> i32;
    fn id_bank(&self) -> i32;
}

impl ValidatableResident for Resident {
    fn cin(&self) -> &str {
        &self.cin
    }

    fn rib(&self) -> i32 {
        self.rib
    }

    fn nombre_enfants(&self) -> i32 {
        self.nombre_enfants
    }

    fn id_specialty(&self) -> i32 {
        self.id_specialty
    }

    fn id_bank(&self) -> i32 {
        self.id_bank
    }
}

impl ValidatableResident for NewResident {
    fn cin(&self) -> &str {
        &self.cin
    }

    fn rib(&self) -> i32 {
        self.rib
    }

    fn nombre_enfants(&self) -> i32 {
        self.nombre_enfants
    }

    fn id_specialty(&self) -> i32 {
        self.id_specialty
    }

    fn id_bank(&self) -> i32 {
        self.id_bank
    }
}

fn validate_resident<R: ValidatableResident>(resident: &R) -> Result<(), String> {
    if resident.cin().trim().is_empty() {
        return Err(ValidationError::EmptyCIN.to_string());
    }

    if !resident.rib().to_string().chars().all(|c| c.is_numeric()) {
        return Err(ValidationError::InvalidRIB.to_string());
    }

    if resident.nombre_enfants() < 0 {
        return Err(ValidationError::InvalidNumberOfChildren.to_string());
    }

    if resident.id_specialty() <= 0 {
        return Err(ValidationError::EmptySpecialtyID.to_string());
    }

    if resident.id_bank() <= 0 {
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
            residents.cin as "cin",
            residents.nom_prenom as "nom_prenom",
            residents.date_debut as "date_debut",
            residents.id_specialty as "id_specialty",
            residents.date_fin as "date_fin",
            residents.is_titulaire as "is_titulaire",
            residents.rib as "rib",
            residents.nombre_enfants as "nombre_enfants",
            residents.id_bank as "id_bank",
            specialty.name as "specialty_name",
            bank.bank_name as "bank_name"
        FROM residents
        LEFT JOIN specialty ON residents.id_specialty = specialty.id
        LEFT JOIN bank ON residents.id_bank = bank.id
        WHERE residents.date_fin > CURRENT_DATE
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| format!("Failed to fetch residents: {}", e))?;

    let residents: Vec<Resident> = records
        .into_iter()
        .map(|record| Resident {
            id_resident: record.id_resident.expect("id_resident is None"),
            cin: record.cin.expect("cin is None"),
            nom_prenom: record.nom_prenom,
            date_debut: record.date_debut.expect("date_debut is None"),
            id_specialty: record.id_specialty.expect("id_specialty is None"),
            date_fin: record.date_fin,
            is_titulaire: record.is_titulaire,
            rib: record.rib.expect("rib is None"),
            nombre_enfants: record.nombre_enfants.expect("nombre_enfants is None"),
            id_bank: record.id_bank.expect("id_bank is None"),
            specialty_name: Some(record.specialty_name), // Corrected to match expected type Option<String>
            bank_name: record.bank_name, // Already an Option<String>, no need to wrap in Some()
        })
        .collect();

    Ok(residents)
}



#[tauri::command]
pub async fn add_resident(pool: State<'_, AppState>, resident: NewResident) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;
  
    validate_resident(&resident).map_err(|e| e.to_string())?;

  
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

    validate_resident(&resident).map_err(|e| e.to_string())?;

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


//manage payments

#[tauri::command]
pub async fn get_payments(pool: State<'_, AppState>) -> Result<Vec<Payment>, String> {
    let pool_guard = pool.pool.lock().await;
    let pool_ref = pool_guard.as_ref().ok_or("Database not connected")?;

    let records = sqlx::query!(
        r#"
        SELECT 
            payment.id_payment as "id_payment!",
            payment.id_resident as "id_resident!",
            payment.worked_days as "worked_days?",
            payment.allocations_fam as "allocations_fam?",
            payment.amount as "amount?",
            payment.date_payment as "date_payment?",
            residents.nom_prenom as "resident_name?",
            residents.rib as "rib?",
            bank.bank_name as "bank_name?"
        FROM payment
        LEFT JOIN residents ON payment.id_resident = residents.id_resident
        LEFT JOIN bank ON residents.id_bank = bank.id
        "#
    )
    .fetch_all(pool_ref)
    .await
    .map_err(|e| format!("Failed to fetch payments: {}", e))?;

    let payments: Vec<Payment> = records
    .into_iter()
    .map(|record| Payment {
        id_payment: record.id_payment,
        id_resident: record.id_resident,
        worked_days: record.worked_days,
        allocations_fam: record.allocations_fam.map(|v| BigDecimal::from_str(&v.to_string()).expect("Failed to parse BigDecimal")),
        amount: record.amount.map(|v| BigDecimal::from_str(&v.to_string()).expect("Failed to parse BigDecimal")),
        date_payment: record.date_payment,
        resident_name: record.resident_name,
        rib: record.rib,
        bank_name: record.bank_name,
    })
    .collect();

    Ok(payments)
}




#[tauri::command]
pub async fn generate_payments(pool: State<'_, AppState>) -> Result<(), String> {
    let pool = pool.pool.lock().await;
    let pool = pool.as_ref().ok_or("Database not connected")?;

    // Use Local::now() instead of Local::today() and convert to NaiveDate
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
            rappel_annuel.id_rappel as "id_rappel!",
            rappel_annuel.id_resident as "id_resident!",
            rappel_annuel.exercice as "exercice?",
            rappel_annuel.nombre_jours as "nombre_jours?",
            rappel_annuel.montant as "montant?",
            residents.nom_prenom as "resident_name?"
        FROM rappel_annuel
        LEFT JOIN residents ON rappel_annuel.id_resident = residents.id_resident
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
        exercice: record.exercice,
        nombre_jours: record.nombre_jours,
        montant: record.montant.map(|v| BigDecimal::from_str(&v.to_string()).expect("Failed to parse BigDecimal")),
        resident_name: record.resident_name,
    })
    .collect();

    Ok(rappels)
}
    */