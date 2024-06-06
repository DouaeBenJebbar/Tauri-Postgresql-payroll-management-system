use sqlx::FromRow;
use serde::{Serialize, Deserialize};
use chrono::NaiveDate;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Resident {
    pub id_resident: i32,
    pub cin: String,
    pub nom_prenom: Option<String>,
    pub date_debut: NaiveDate,
    pub id_specialty: i32,
    pub id_bank: i32,
    pub date_fin: Option<NaiveDate>, 
    pub is_titulaire: Option<bool>, 
    pub rib: i32, 
    pub nombre_enfants: i32, 
    pub specialty_name: Option<String>,
}

#[derive(Debug, Deserialize, Serialize)]
pub struct NewResident {
    pub cin: String,
    pub nom_prenom: String,
    pub date_debut: NaiveDate,
    pub id_specialty: i32,
    pub id_bank: i32,
    pub is_titulaire: bool,
    pub rib: i32,
    pub nombre_enfants: i32,
}