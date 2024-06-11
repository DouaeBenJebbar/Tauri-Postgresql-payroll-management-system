use serde::Serialize;
use serde::Deserialize;
use sqlx::FromRow;
use sqlx::Row;

#[derive(Serialize, Deserialize)]
pub struct Specialite {
    pub id_specialite: i32,
    pub nom: String,
    pub nombre_annees: i32,
}

impl FromRow<'_, sqlx::postgres::PgRow> for Specialite  {
    fn from_row(row: &sqlx::postgres::PgRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id_specialite: row.try_get("id_specialite")?,
            nom: row.try_get("nom")?,
            nombre_annees: row.try_get("nombre_annees")?,
        })
    }
}

#[derive(Serialize, Deserialize)]
pub struct NewSpecialite {
    pub nom: String,
    pub nombre_annees: i32,
}

#[derive(Serialize, Deserialize)]
pub struct Banque {
    pub id_banque: i32,
    pub nom: String,
}

impl FromRow<'_, sqlx::postgres::PgRow> for Banque {
    fn from_row(row: &sqlx::postgres::PgRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id_banque: row.try_get("id_banque")?,
            nom: row.try_get("nom")?,
        })
    }
}

