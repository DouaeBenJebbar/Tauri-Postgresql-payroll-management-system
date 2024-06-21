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
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("");
  const [open, setOpen] = useState(false);
  const [newResident, setNewResident] = useState({
    id_resident:"",
    nom_prenom: "",
    date_debut: "",
    id_specialite: "",
    rib: "",
    nombre_enfants: 0,
    id_banque: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarMessageType, setSnackbarMessageType] = useState("success"); 
  const [formMode, setFormMode] = useState("add");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [residentToDelete, setResidentToDelete] = useState(null);

  const handleAddClick = () => {
    setFormMode("add");
    setOpen(true);
  };

  const handleEditClick = (id) => {
    const resident = residents.find((resident) => resident.id_resident === id);
    if (resident) {
      setNewResident({
        id_resident: resident.id_resident,
        nom_prenom: resident.nom_prenom,
        date_debut: resident.date_debut,
        id_specialite: resident.id_specialite,
        rib: resident.rib,
        nombre_enfants: resident.nombre_enfants,
        id_banque: resident.id_banque,
      });
      setFormMode("edit");
      setOpen(true);
    }
  };
  

  const handleDeleteClick = (id_resident) => {
    const resident = residents.find((resident) => resident.id_resident === id_resident);
    if (resident) {
      setResidentToDelete(resident);
      setConfirmationOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (residentToDelete) {
      try {
        await invoke("delete_resident", { id: residentToDelete.id_resident });
        const updatedResidents = await invoke("get_residents");
        setResidents(updatedResidents);
        setFilteredResidents(updatedResidents);
        setSnackbarMessage("Résident supprimé avec succès");
        setSnackbarMessageType("success");
        setSnackbarOpen(true);
      } catch (error) {
        console.error("Failed to delete resident", error);
        setSnackbarMessage("Échec de la suppression du résident");
        setSnackbarMessageType("error");
        setSnackbarOpen(true);
      }
    }
    setConfirmationOpen(false);
  };

  const handleCancelDelete = () => {
    setResidentToDelete(null);
    setConfirmationOpen(false);
  };
  
  const handleClose = () => {
    setOpen(false);
    setNewResident({
      nom_prenom: "",
      date_debut: "",
      id_specialite: "",
      rib: "",
      nombre_enfants: 0,
      id_banque: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewResident((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'id_specialite' ? parseInt(value, 10) : value),
    }));
  };
  
  const handleFormSubmit = async () => {
    try {
      if (!newResident.nom_prenom || !newResident.date_debut || !newResident.id_specialite || !newResident.rib) {
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
        id_specialite: parseInt(newResident.id_specialite, 10),
        nombre_enfants: childrenCount,
        rib: newResident.rib.toString(),
      };
  
      // Log the resident object
      console.log(resident);
  
      if (formMode === "add") {
        await invoke("add_resident", { resident });
        const getResponse = await invoke("get_resident_id", { nomPrenom: newResident.nom_prenom }); 
        console.log(getResponse);
        await invoke("generate_rappel", { residentId: getResponse });
        setSnackbarMessageType("success");
        setSnackbarMessage("Resident ajouté avec succès!");
      } else if (formMode === "edit") {
        await invoke("modify_resident", { resident });
        setSnackbarMessageType("success");
        setSnackbarMessage("Resident modifié avec succès!");
      }
  
      const updatedResidents = await invoke("get_residents");
      setResidents(updatedResidents);
      setFilteredResidents(updatedResidents);
      handleClose();
    } catch (error) {
      console.error("Failed to add or modify resident", error);
      setSnackbarMessageType("error");
      setSnackbarMessage(error.message || "Échec d'ajout ou de modification du résident.");
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
        const data = await invoke("get_specialites");
        setSpecialties(data);
        setLoading(false); // Set loading to false once data is fetched
      } catch (error) {
        console.error("Failed to fetch specialties", error);
        setLoading(false); // Set loading to false even if there's an error
      }
    };
    const fetchBanks = async () => {
      try {
        const data = await invoke("get_banques");
        setBanks(data);
      } catch (error) {
        console.error("Failed to fetch banks", error);
      }
    };
  
    fetchBanks();
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
    { field: "nom_prenom", headerName: "Nom et Prénom", width: 200 },
    { field: "date_debut", headerName: "Date de Début", width: 150 },
    { field: "date_fin", headerName: "Date de Fin", width: 150 },
    {field: "nom_specialite", headerName: "Spécialité", width: 150},
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
            style={{ marginRight: 8, backgroundColor: colors.grey[500] }}
          >
            Modifier
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#f44336', color: '#fff', '&:hover': { bgcolor: '#d32f2f' } }}
            size="small"
            onClick={() => handleDeleteClick(params.row.id_resident)}
          >
            Supprimer
          </Button>
        </Box>
      )
    }
  ];

  return (
    <Box m="20px">
      <Header title="RÉSIDENTS" />
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
        getRowId={(row) => row.id_resident}
        disableSelectionOnClick
        autoHeight
        hideFooter
      />

      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{formMode === "add" ? "Ajouter Resident" : "Modifier Resident"}</DialogTitle>
        <DialogContent>
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
            id="id_specialite"
            name="id_specialite"
            label="Spécialité"
            select
            fullWidth
            value={newResident.id_specialite}
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
                const selectedSpecialty = specialties.find((specialty) => specialty.id_specialite === selected);
                return selectedSpecialty.nom;
              },
            }}
          >

            {loading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              specialties.map((specialty) => (
                <MenuItem key={specialty.id_specialite} value={specialty.id_specialite}>
                  {specialty.nom}
                </MenuItem>
              ))
            )}
          </TextField>

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
            id="id_banque"
            name="id_banque"
            label="Banque"
            select
            fullWidth
            value={newResident.id_banque}
            onChange={handleInputChange}
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
                  return <em>Sélectionnez une banque</em>;
                }
                const selectedBank = banks.find((bank) => bank.id_banque === selected);
                return selectedBank.nom;
              },
            }}
          >
            {loading ? (
              <MenuItem disabled>Loading...</MenuItem>
            ) : (
              banks.map((bank) => (
                <MenuItem key={bank.id_banque} value={bank.id_banque}>
                  {bank.nom}
                </MenuItem>
              ))
            )}
          </TextField>

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
      <Box m="20px">
      {/* JSX content */}
      <Dialog open={confirmationOpen} onClose={handleCancelDelete}>
        <DialogContent>
          <Box>
            Êtes-vous sûr de vouloir supprimer le résident{" "}
            <strong>{residentToDelete ? residentToDelete.nom_prenom : ""}</strong> ?
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} color="primary">
            Annuler
          </Button>
          <Button onClick={handleConfirmDelete} sx={{color: '#f44336', '&:hover': { color: '#d32f2f' } }}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarMessageType} // Use the new state here
          sx={{ width: "100%" }}
        >
          {snackbarMessage || "Success message"} {/* Provide a default success message */}
        </Alert>
    </Snackbar>
    </Box>
  );
};

export default Residents;