use sqlx::FromRow;
use serde::{Serialize, Deserialize};
use chrono::NaiveDate;

#[derive(Debug, Serialize, Deserialize, FromRow)]
pub struct Resident {
    pub id_resident: i32,
    pub cin: String,
    pub nom_prenom: Option<String>,
    pub date_debut: NaiveDate,
    pub id_specialite: i32,
    pub date_fin: Option<NaiveDate>, 
    pub rib: i32, 
    pub id_banque: i32,
    pub nombre_enfants: i32, 
    pub nom_specialite: Option<String>,
    pub nom_banque: Option<String>,
}


#[derive(Debug, Deserialize, Serialize)]
pub struct NewResident {
    pub cin: String,
    pub nom_prenom: String,
    pub date_debut: NaiveDate,
    pub id_specialite: i32,
    pub rib: i32,
    pub id_banque: i32,
    pub nombre_enfants: i32,
}