use serde::Serialize;
use serde::Deserialize;
use sqlx::FromRow;
use sqlx::Row;

#[derive(Serialize, Deserialize)]
pub struct Specialty {
    pub id: i32,
    pub specialite: String,
    pub nombre_annees: i32,
}

impl FromRow<'_, sqlx::postgres::PgRow> for Specialty {
    fn from_row(row: &sqlx::postgres::PgRow) -> Result<Self, sqlx::Error> {
        Ok(Self {
            id: row.try_get("id")?,
            specialite: row.try_get("name")?,
            nombre_annees: row.try_get("yearsofresidency")?,
        })
    }
}

#[derive(Serialize, Deserialize)]
pub struct NewSpecialty {
    pub specialite: String,
    pub nombre_annees: i32,
}

#[derive(Serialize, Deserialize, FromRow)]
pub struct Bank {
    pub id: i32,
    pub nom: String,
}