import React, { useEffect, useState } from "react";
import {
  Box, useTheme, Button, IconButton, InputBase, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, MenuItem, FormControlLabel, Checkbox
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { invoke } from "@tauri-apps/api/tauri";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import SearchIcon from "@mui/icons-material/Search";

const Residents = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [specialties, setSpecialties] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [open, setOpen] = useState(false);
  const [newResident, setNewResident] = useState({
    id:"",
    cin: "",
    nom_prenom: "",
    date_debut: "",
    id_specialty: "",
    is_titulaire: false,
    rib: "",
    nombre_enfants: 0
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [formMode, setFormMode] = useState("add");

  const handleAddClick = () => {
    setFormMode("add");
    setOpen(true);
  };

  const handleEditClick = (id) => {
    const resident = residents.find((resident) => resident.id_resident === id);
    if (resident) {
      setNewResident({
        id_resident: resident.id_resident,
        cin: resident.cin,
        nom_prenom: resident.nom_prenom,
        date_debut: resident.date_debut,
        id_specialty: resident.id_specialty,
        is_titulaire: resident.is_titulaire,
        rib: resident.rib,
        nombre_enfants: resident.nombre_enfants,
      });
      setFormMode("edit");
      setOpen(true);
    }
  };
  

  const handleDeleteClick = async (cin) => {
    const residentToDelete = residents.find((resident) => resident.cin === cin);
    try {
      await invoke("delete_resident", { cin });
      const updatedResidents = await invoke("get_residents");
      setResidents(updatedResidents);
      setFilteredResidents(updatedResidents);
      setSnackbarMessage("Resident deleted successfully");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to delete resident", error);
      setSnackbarMessage("Failed to delete resident");
      setSnackbarOpen(true);
    }
  };
  
  const handleClose = () => {
    setOpen(false);
    setNewResident({
      cin: "",
      nom_prenom: "",
      date_debut: "",
      id_specialty: "",
      is_titulaire: false,
      rib: "",
      nombre_enfants: 0
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewResident((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'id_specialty' ? parseInt(value, 10) : value),
    }));
  };
  
  const handleFormSubmit = async () => {
    try {
      if (!newResident.nom_prenom || !newResident.date_debut || !newResident.id_specialty || !newResident.rib) {
        throw new Error("Veuillez remplir tous les champs.");
      }
  
      const childrenCount = parseInt(newResident.nombre_enfants, 10);
      if (isNaN(childrenCount) || childrenCount < 0) {
        throw new Error("Le nombre d'enfants doit être un entier non négatif.");
      }
  
      const rib = parseInt(newResident.rib, 10);
      if (isNaN(rib)) {
        throw new Error("Le RIB doit être un entier.");
      }
  
      // Parse id_specialty, nombre_enfants, and rib to integer
      const resident = {
        ...newResident,
        id_specialty: parseInt(newResident.id_specialty, 10),
        nombre_enfants: childrenCount,
        rib: rib,
      };
  
      // Log the resident object
      console.log(resident);
  
      if (formMode === "add") {
        await invoke("add_resident", { resident });
        setSnackbarMessage("Resident ajouté avec succès!");
      } else if (formMode === "edit") {
        await invoke("modify_resident", { resident });
        setSnackbarMessage("Resident modifié avec succès!");
      }
  
      const updatedResidents = await invoke("get_residents");
      setResidents(updatedResidents);
      setFilteredResidents(updatedResidents);
      handleClose();
    } catch (error) {
      console.error("Failed to add or modify resident", error);
      setSnackbarMessage(error.message || "Failed to add or modify resident.");
    } finally {
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const data = await invoke("get_residents");
        setResidents(data);
        setFilteredResidents(data);
      } catch (error) {
        console.error("Failed to fetch residents", error);
      }
    };
    const fetchSpecialties = async () => {
      try {
        const data = await invoke("get_specialties");
        console.log("Specialties data:", data); // Log the fetched data
        setSpecialties(data);
        setLoading(false); // Set loading to false once data is fetched
      } catch (error) {
        console.error("Failed to fetch specialties", error);
        setLoading(false); // Set loading to false even if there's an error
      }
    };

    fetchResidents();
    fetchSpecialties();

  }, []);

  useEffect(() => {
    setFilteredResidents(
      residents.filter((resident) =>
        resident.nom_prenom.toLowerCase().includes(searchInput.toLowerCase())
      )
    );
  }, [searchInput, residents]);

  const calculateHeight = () => {
    const rowHeight = 52;
    const headerHeight = 56;
    const numRows = filteredResidents.length;
    const totalHeight = headerHeight + (numRows * rowHeight);
    const maxHeight = 500;
    return totalHeight < maxHeight ? totalHeight : maxHeight;
  };

  const columns = [
    { field: "cin", headerName: "CIN", width: 150 },
    { field: "nom_prenom", headerName: "Nom et Prénom", width: 200 },
    { field: "date_debut", headerName: "Date de Début", width: 150 },
    { field: "date_fin", headerName: "Date de Fin", width: 150 },
    {field: "specialty_name", headerName: "Spécialité", width: 150},
    { field: "is_titulaire", headerName: "Titulaire", width: 100, type: "boolean" },
    { field: "rib", headerName: "RIB", width: 200 },
    { field: "nombre_enfants", headerName: "Nombre d'enfants", width: 150, type: "number" },
    {
      field: "actions",
      headerName: "Actions",
      width: 200,
      renderCell: (params) => (
        <Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row.id_resident)}
            style={{ marginRight: 8 }}
          >
            Modifier
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleDeleteClick(params.row.cin)}
          >
            Supprimer
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Box m="20px">
      <Header title="Résidents" />
      <Box display="flex" alignItems="center" marginTop={5} p={1}>
        <Box
          display="flex"
          alignItems="center"
          backgroundColor={colors.primary[400]}
          borderRadius="3px"
          p={1}
          sx={{ flex: 1 }}
        >
          <InputBase
            sx={{ ml: 2, flex: 1 }}
            placeholder="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <IconButton type="button" sx={{ p: 1 }}>
            <SearchIcon />
          </IconButton>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          size="medium"
          onClick={handleAddClick}
          sx={{ ml: 2 }}
        >
          Ajouter Resident
        </Button>
      </Box>
      <Box
        m="40px 0 0 0"
        sx={{
          height: `${calculateHeight()}px`,
          maxHeight: "600px",
          overflowY: "auto",
          "& .MuiDataGrid-root": {
            border: "none",
          },
          "& .MuiDataGrid-cell": {
            borderBottom: "none",
          },
          "& .name-column--cell": {
            color: colors.greenAccent[300],
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none",
          },
          "& .MuiDataGrid-virtualScroller": {
            backgroundColor: colors.primary[400],
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`,
          },
          "& .MuiDataGrid-footerContainer": {
            display: "none",
          },
        }}
      >
        <DataGrid
          rows={filteredResidents}
          columns={columns}
          getRowId={(row) => row.cin}
          disableSelectionOnClick
          autoHeight
          hideFooter
          pagination={true} // or remove this prop if you want to use default pagination behavior
        />
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{formMode === "add" ? "Ajouter Resident" : "Modifier Resident"}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            id="cin"
            name="cin"
            label="CIN"
            type="text"
            fullWidth
            value={newResident.cin}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <TextField
            margin="dense"
            id="nom_prenom"
            name="nom_prenom"
            label="Nom et Prénom"
            type="text"
            fullWidth
            value={newResident.nom_prenom}
            onChange={handleInputChange}
            autoComplete="name"
          />
          <TextField
            margin="dense"
            id="date_debut"
            name="date_debut"
            label="Date de Début"
            type="date"
            fullWidth
            value={newResident.date_debut}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            autoComplete="off"
          />
          <TextField
            margin="dense"
            id="id_specialty"
            name="id_specialty"
            label="Spécialité"
            select
            fullWidth
            value={newResident.id_specialty}
            onChange={(e) => handleInputChange(e)}
            autoComplete="off"
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  style: {
                    maxHeight: 200,
                    width: '40%', 
                    marginTop: 8, 
                  },
                },

              },
              renderValue: (selected) => {
                if (selected === "") {
                  return <em>Sélectionnez une spécialité</em>;
                }
                const selectedSpecialty = specialties.find((specialty) => specialty.id === selected);
                return selectedSpecialty.specialite;
              },
            }}
          >

            {loading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              specialties.map((specialty) => (
                <MenuItem key={specialty.id} value={specialty.id}>
                  {specialty.specialite}
                </MenuItem>
              ))
            )}
          </TextField>

          <FormControlLabel
            control={
              <Checkbox
                checked={newResident.is_titulaire}
                onChange={handleInputChange}
                name="is_titulaire"
                id="is_titulaire"
                autoComplete="off"
              />
            }
            label="Titulaire"
          />
          <TextField
            margin="dense"
            id="rib"
            name="rib"
            label="RIB"
            type="text"
            fullWidth
            value={newResident.rib}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <TextField
            margin="dense"
            id="nombre_enfants"
            name="nombre_enfants"
            label="Nombre d'enfants"
            type="number"
            fullWidth
            value={newResident.nombre_enfants || 0}
            onChange={handleInputChange}
            autoComplete="off"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Annuler
          </Button>
          <Button onClick={handleFormSubmit} color="secondary">
            {formMode === "add" ? "Ajouter" : "Modifier"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarMessage.includes("Failed") ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Residents;
