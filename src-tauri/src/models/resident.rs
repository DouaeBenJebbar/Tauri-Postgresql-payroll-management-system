use sqlx::FromRow;
use serde::{Serialize, Deserialize};
use chrono::NaiveDate;


#[derive(Debug, Serialize, Deserialize)]
pub struct Resident {
    pub id_resident: i32,
    pub cin: String,
    pub nom_prenom: String,
    pub date_debut: NaiveDate,
    pub id_specialite: Option<i32>,
    pub date_fin: Option<NaiveDate>,
    pub rib: String,
    pub id_banque: Option<i32>,
    pub nombre_enfants: Option<i32>,
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