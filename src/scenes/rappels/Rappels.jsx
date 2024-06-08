import React, { useEffect, useState } from "react";
import {
  Box,
  useTheme,
  Button,
  IconButton,
  InputBase,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { invoke } from "@tauri-apps/api/tauri";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import SearchIcon from "@mui/icons-material/Search";

const Payments = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [payments, setPayments] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const exercices = Array.from(new Array(20), (val, index) => 2000 + index);

  const handleAddClick = () => {
    // Add logic for adding a payment
  };

  const handleEditClick = (id) => {
    // Add logic for editing a payment
  };

  const handleDeleteClick = async (id) => {
    try {
      await invoke("delete_payment", { id });
      const updatedPayments = await invoke("get_payments");
      setPayments(updatedPayments);
      setFilteredPayments(updatedPayments);
      setSnackbarMessage("Paiement supprimé avec succès");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Échec de la suppression du paiement", error);
      setSnackbarMessage("Échec de la suppression du paiement");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await invoke("get_payments");
        setPayments(data);
        setFilteredPayments(data);
      } catch (error) {
        console.error("Échec de la récupération des paiements", error);
      }
    };
    fetchPayments();
  }, []);

  useEffect(() => {
    let filtered = payments.filter((payment) =>
      payment.resident.toLowerCase().includes(searchInput.toLowerCase())
    );
    if (selectedMonth) {
      filtered = filtered.filter(
        (payment) => new Date(payment.date).getMonth() === months.indexOf(selectedMonth)
      );
    }
    if (selectedYear) {
      filtered = filtered.filter(
        (payment) => new Date(payment.date).getFullYear() === parseInt(selectedYear, 10)
      );
    }
    setFilteredPayments(filtered);
  }, [searchInput, selectedMonth, selectedYear, payments]);

  const calculateHeight = () => {
    const rowHeight = 52;
    const headerHeight = 56;
    const numRows = filteredPayments.length;
    const totalHeight = headerHeight + numRows * rowHeight;
    const maxHeight = 500;
    return totalHeight < maxHeight ? totalHeight : maxHeight;
  };

  const columns = [
    { field: "resident", headerName: "Résident", flex: 1 },
    { field: "salaire", headerName: "Salaire de base", flex: 1 },
    { field: "jours_travailles", headerName: "Jours travaillés", flex: 1 },
    { field: "allocations_fam", headerName: "Allocations familiales", flex: 1 },
    { field: "Montant_total", headerName: "Montant total", flex: 1 },
  ];

  return (
    <Box m="20px">
      <Header title="Paiements" />
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
            placeholder="Recherche"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <IconButton type="button" sx={{ p: 1 }}>
            <SearchIcon />
          </IconButton>
        </Box>
        <FormControl sx={{ ml: 2, minWidth: 120 }}>
          <InputLabel>Année</InputLabel>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <MenuItem value="">
              <em>Aucun</em>
            </MenuItem>
            {years.map((year, index) => (
              <MenuItem key={index} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="secondary"
          size="medium"
          onClick={handleAddClick}
          sx={{ ml: 2 }}
        >
          Générer Ordre de Paie
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
          rows={filteredPayments}
          columns={columns}
          getRowId={(row) => row.id}
          disableSelectionOnClick
          autoHeight
          hideFooter
        />
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarMessage.includes("Échec") ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Payments;
