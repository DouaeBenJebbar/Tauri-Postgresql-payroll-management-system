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
  const [newSpecialty, setNewSpecialty] = useState({ specialite: "", nombre_annees: "" });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [formMode, setFormMode] = useState("add"); 


  const handleAddClick = () => {
    setFormMode("add");
    setOpen(true);
  };
  
  const handleEditClick = (id) => {
    const specialty = specialties.find((specialty) => specialty.specialite === id);
    setNewSpecialty(specialty);
    setFormMode("edit");
    setOpen(true);
  };

  const handleDeleteClick = async (specialite) => {
    try {
      await invoke("delete_specialty", { specialtyName: specialite });
      const updatedSpecialties = await invoke("get_specialties");
      setSpecialties(updatedSpecialties);
      setFilteredSpecialties(updatedSpecialties);
      setSnackbarMessage("Specialty deleted successfully");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to delete specialty", error);
      setSnackbarMessage("Failed to delete specialty");
      setSnackbarOpen(true);
    }
  };


  const handleClose = () => {
    setOpen(false);
    setNewSpecialty({ specialite: "", nombre_annees: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSpecialty((prev) => ({
      ...prev,
      [name]: name === "nombre_annees" ? value : value.trim(), // Ensure it's a string
    }));
  };
  
  const handleFormSubmit = async () => {
    try {
      // Validate form fields
      if (!newSpecialty.specialite || !newSpecialty.nombre_annees) {
        throw new Error("Veuillez remplir tous les champs.");
      }
  
      const duration = parseInt(newSpecialty.nombre_annees, 10); // Parse as integer
      if (isNaN(duration) || duration <= 0) {
        throw new Error("La durée de formation doit être un entier positif.");
      }
  
      if (formMode === "add") {
        // Perform specialty addition
        const specialtyToSubmit = {
          specialite: newSpecialty.specialite,
          nombre_annees: duration,
        };
  
        await invoke("add_specialty", { specialty: specialtyToSubmit });
  
        setSnackbarMessage("Spécialité ajoutée avec succès!");
      } else if (formMode === "edit") {
        // Perform specialty modification
        const specialtyToSubmit = {
          ...newSpecialty,
          nombre_annees: duration,
        };
  
        await invoke("modify_specialty", { specialty: specialtyToSubmit });
  
        setSnackbarMessage("Spécialité modifiée avec succès!");
      }
  
      // Refresh specialties data
      const updatedSpecialties = await invoke("get_specialties");
      setSpecialties(updatedSpecialties);
      setFilteredSpecialties(updatedSpecialties);
      handleClose();
    } catch (error) {
      console.error("Failed to add or modify specialty", error);
      setSnackbarMessage(error.message || "Failed to add or modify specialty.");
    } finally {
      setSnackbarOpen(true);
    }
  };
  
  const columns = [
    {
      field: "specialite",
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
      flex: 1,
      renderCell: (params) => (
        <Box>
          <Button
            variant="contained"
            color="primary"
            size="small"
            onClick={() => handleEditClick(params.row.specialite)}
            style={{ marginRight: 8 }}
          >
            Modifier
          </Button>
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => handleDeleteClick(params.row.specialite)}
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
        const data = await invoke("get_specialties");
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
        specialty.specialite.toLowerCase().includes(searchInput.toLowerCase())
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
      <Header title="Spécialités" />
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
          rows={filteredSpecialties}
          columns={columns}
          pagination={true}
          getRowId={(row) => row.specialite}
        />
      </Box>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Ajouter Spécialité</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="specialite"
            label="Spécialité médicale"
            type="text"
            fullWidth
            value={newSpecialty.specialite}
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarMessage.includes("Failed") ? "error" : "success"} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Specialties;
