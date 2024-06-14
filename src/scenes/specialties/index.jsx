// frontend
import React, { useEffect, useState } from "react";
import { Box, useTheme, Button, IconButton, InputBase, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { invoke } from "@tauri-apps/api/tauri";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import SearchIcon from "@mui/icons-material/Search";

const Specialties = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [specialties, setSpecialties] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredSpecialties, setFilteredSpecialties] = useState([]);
  const [open, setOpen] = useState(false);
  const [newSpecialty, setNewSpecialty] = useState({ nom: "", nombre_annees: "" });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarMessageType, setSnackbarMessageType] = useState("success"); 
  const [formMode, setFormMode] = useState("add"); 
  const [specialtyToDelete, setSpecialtyToDelete] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);

  const handleAddClick = () => {
    setFormMode("add");
    setOpen(true);
  };
  
  const handleEditClick = (id) => {
    const specialty = specialties.find((specialty) => specialty.id_specialite === id);
    setNewSpecialty(specialty);
    setFormMode("edit");
    setOpen(true);
  };

  const handleDeleteClick = (id) => {
    setSpecialtyToDelete(id);
    setConfirmationOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    try {
      await invoke("delete_specialty", { id_specialite: specialtyToDelete });
      const updatedSpecialties = await invoke("get_specialites");
      setSpecialties(updatedSpecialties);
      setFilteredSpecialties(updatedSpecialties);
      setSnackbarMessageType("success");
      setSnackbarMessage("Spécialité supprimée avec succès");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to delete specialty", error);
      setSnackbarMessageType("error");
      setSnackbarMessage("Échec de la suppression de la spécialité");
      setSnackbarOpen(true);
    } finally {
      setConfirmationOpen(false);
    }
  };
  
  const handleClose = () => {
    setOpen(false);
    setNewSpecialty({ nom: "", nombre_annees: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSpecialty((prev) => ({
      ...prev,
      [name]: name === "nombre_annees" ? parseInt(value) : value,
    }));
  };
  
  const handleFormSubmit = async () => {
    try {
      // Validate form fields
      if (!newSpecialty.nom || !newSpecialty.nombre_annees) {
        setSnackbarMessageType("error");
        throw new Error("Veuillez remplir tous les champs.");
      }
  
      const duration = parseInt(newSpecialty.nombre_annees, 10); // Parse as integer
      if (isNaN(duration) || duration <= 0) {
        throw new Error("La durée de formation doit être un entier positif.");
      }
  
      const specialtyToSend = { specialite: newSpecialty }; // Ensure object structure matches Rust function
      if (formMode === "add") {
        // Perform specialty addition
        await invoke("add_specialite", specialtyToSend);
        setSnackbarMessageType("success");
        setSnackbarMessage("Spécialité ajoutée avec succès!");
      } else if (formMode === "edit") {
        // Perform specialty modification
        await invoke("modify_specialite", specialtyToSend);
        setSnackbarMessageType("success");
        setSnackbarMessage("Spécialité modifiée avec succès!");
      }
  
      // Refresh specialties data
      const updatedSpecialties = await invoke("get_specialites");
      setSpecialties(updatedSpecialties);
      setFilteredSpecialties(updatedSpecialties);
      handleClose();
    } catch (error) {
      console.error("Failed to add or modify specialty", error);
      setSnackbarMessageType("error");
      setSnackbarMessage(
        error.message || "Échec d'ajout ou de modification de la spécialité."
      );
    } finally {
      setSnackbarOpen(true);
    }
  };
  
  
  const columns = [
    {
      field: "nom",
      headerName: "Spécialité médicale",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "nombre_annees",
      headerName: "Durée de formation",
      flex: 1,
    },
    {
      field: "action",
      headerName: "Action",
      flex: 0.5,
      renderCell: (params) => (
        <Box>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleEditClick(params.row.id_specialite)}
            style={{ marginRight: 8, backgroundColor: colors.grey[500]  }}
          >
            Modifier
          </Button>
          <Button
            variant="contained"
            sx={{ bgcolor: '#f44336', color: '#fff', '&:hover': { bgcolor: '#d32f2f' } }}
            size="small"
            onClick={() => handleDeleteClick(params.row.id_specialite)}
          >
            Supprimer
          </Button>
        </Box>
        
      ),
    },
  ];

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const data = await invoke("get_specialites");
        setSpecialties(data);
        setFilteredSpecialties(data);
      } catch (error) {
        console.error("Failed to fetch specialties", error);
      }
    };

    fetchSpecialties();
  }, []);

  useEffect(() => {
    setFilteredSpecialties(
      specialties.filter((specialty) =>
        specialty.nom.toLowerCase().includes(searchInput.toLowerCase())
      )
    );
  }, [searchInput, specialties]);

  const calculateHeight = () => {
    const rowHeight = 52;
    const headerHeight = 56;
    const numRows = filteredSpecialties.length;
    const totalHeight = headerHeight + (numRows * rowHeight);
    const maxHeight = 500; // Maximum height for the DataGrid
    return totalHeight < maxHeight ? totalHeight : maxHeight;
  };

  return (
    <Box m="20px">
      <Header title="SPÉCIALITÉS" />
      <Box
        display="flex"
        alignItems="center"
        marginTop={5}
        p={1}
      >
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
          Ajouter Spécialité
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
            color: colors.black,
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
          rows={filteredSpecialties}
          columns={columns}
          pagination={true}
          getRowId={(row) => row.id_specialite}
        />
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{formMode === "add" ? "Ajouter Spécialité" : "Modifier Spécialité"}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="nom"
            label="Spécialité médicale"
            type="text"
            fullWidth
            value={newSpecialty.nom}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="nombre_annees"
            label="Durée de formation"
            type="number"
            fullWidth
            value={newSpecialty.nombre_annees}
            onChange={handleInputChange}
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
      <Dialog open={confirmationOpen} onClose={() => setConfirmationOpen(false)}>
        <DialogTitle>Confirmation de suppression</DialogTitle>
        <DialogContent>
          <Box fontWeight="bold">
            Êtes-vous sûr de vouloir supprimer la spécialité sélectionnée?
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationOpen(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleConfirmDelete} sx={{color: '#f44336', '&:hover': { color: '#d32f2f' } }}>
            Supprimer
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
          severity={snackbarMessageType} // Use the new state here
          sx={{ width: "100%" }}
        >
          {snackbarMessage || "Success message"} {/* Provide a default success message */}
        </Alert>
    </Snackbar>
    </Box>
  );
};

export default Specialties;
