import React, { useEffect, useState } from "react";
import {
  Box,
  useTheme,
  IconButton,
  InputBase,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Dialog, 
  DialogContent, 
  DialogActions,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { invoke } from "@tauri-apps/api/tauri";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import SearchIcon from "@mui/icons-material/Search";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";


const Payments = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [payments, setPayments] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [uniqueYears, setUniqueYears] = useState([]);
  const [monthsForYear, setMonthsForYear] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hasPaymentsForMonth, setHasPaymentsForMonth] = useState(true);
  const months = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogMonth, setConfirmDialogMonth] = useState("");
  const [confirmDialogYear, setConfirmDialogYear] = useState("");


  const currentYear = new Date().getFullYear();
  const currentMonthIndex = new Date().getMonth();
  const currentMonth = months[currentMonthIndex];

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [reloadTrigger, setReloadTrigger] = useState(false); 


const handleGenerateClick = async () => {
  try {
    // Load the Excel template file
    const response = await fetch('/templates/ovTemplate.xlsx');
    if (!response.ok) {
      throw new Error('Failed to fetch template file');
    }

    const templateArrayBuffer = await response.arrayBuffer();
    const templateWorkbook = XLSX.read(templateArrayBuffer, { type: 'array' });

    const templateWorksheetName = templateWorkbook.SheetNames[0];
    const templateWorksheet = templateWorkbook.Sheets[templateWorksheetName];

    // Find the last row with data in the template to avoid overwriting existing data
    const range = XLSX.utils.decode_range(templateWorksheet['!ref']);
    const lastRow = range.e.r + 1;

    // Convert filteredPayments data to the format expected by the template
    const excelData = filteredPayments.map(payment => [
      payment.resident_name,
      payment.rib,
      payment.bank_name,
      payment.amount,
    ]);

    // Add the new data starting from the appropriate row
    XLSX.utils.sheet_add_aoa(templateWorksheet, excelData, { origin: `A${lastRow + 1}` });

    // Calculate the total of all payments
    const totalPayments = filteredPayments.reduce((acc, curr) => acc + parseFloat(curr.amount), 0).toFixed(2);

    // Append the total to the total row in the worksheet
    const totalRow = `A${lastRow + 1 + filteredPayments.length}`;
    XLSX.utils.sheet_add_aoa(templateWorksheet, [['Total', '', '', totalPayments]], { origin: totalRow });

    // Add the updated worksheet to a new workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, templateWorksheet, 'Payments');

    // Write the workbook to a binary string
    const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });

    // Convert binary string to blob
    const buffer = new ArrayBuffer(wbout.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < wbout.length; ++i) {
      view[i] = wbout.charCodeAt(i) & 0xFF;
    }
    const blob = new Blob([buffer], { type: 'application/octet-stream' });

    // Use saveAs or a similar method to save the blob
    saveAs(blob, 'filename.xlsx');

    setSnackbarMessage('Fichier Excel généré avec succès !');
    setSnackbarOpen(true);
  } catch (error) {
    console.error('Error generating file: ', error);
    setSnackbarMessage('Échec de la génération du fichier Excel.');
    setSnackbarOpen(true);
  }
};

// Utility function to convert a base64 string to a Blob
function base64StringToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

  
  
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await invoke("get_payments");
        setPayments(data);
        setFilteredPayments(data);
        extractUniqueYears(data); // Extract unique years
      } catch (error) {
        console.error("Échec de la récupération des paiements", error);
      }
    };
    fetchPayments();
  }, [reloadTrigger]);

  useEffect(() => {
    let filtered = payments.filter((payment) =>
      payment.resident_name.toString().includes(searchInput)
    );
    if (selectedMonth) {
      filtered = filtered.filter(
        (payment) => new Date(payment.date_payment).getMonth() === months.indexOf(selectedMonth)
      );
    }
    if (selectedYear) {
      filtered = filtered.filter(
        (payment) => new Date(payment.date_payment).getFullYear() === parseInt(selectedYear, 10)
      );
    }
    setFilteredPayments(filtered);
    setHasPaymentsForMonth(filtered.length > 0);
  }, [searchInput, selectedMonth, selectedYear, payments]);

  useEffect(() => {
    if (selectedYear) {
      const monthsWithPayments = [
        ...new Set(
          payments
            .filter(payment => new Date(payment.date_payment).getFullYear() === parseInt(selectedYear))
            .map(payment => months[new Date(payment.date_payment).getMonth()])
        )
      ];
      if (!monthsWithPayments.includes(currentMonth)) {
        monthsWithPayments.push(currentMonth);
      }
      setMonthsForYear(monthsWithPayments);
    }
  }, [selectedYear, payments, currentMonth]);

  const extractUniqueYears = (payments) => {
    const years = payments.map(payment => new Date(payment.date_payment).getFullYear());
    const uniqueYears = [...new Set(years)];
    setUniqueYears(uniqueYears);
  };



  const calculateHeight = () => {
    const rowHeight = 52;
    const headerHeight = 56;
    const footerHeight = 56;
    const numRows = filteredPayments.length;
    const totalHeight = headerHeight + numRows * rowHeight + footerHeight;
    const maxHeight = 500;
    return totalHeight < maxHeight ? totalHeight : maxHeight;
  };

  const columns = [
    { field: "nom_resident", headerName: "Résident", flex: 1 },
    { 
      field: "date_paiement", 
      headerName: "Date de Paiement", 
      flex: 1,
    },
    { field: "jours_travail", headerName: "Jours travaillés", flex: 1 },
    { field: "allocations_familiales", headerName: "Allocations familiales", flex: 1 },
    {
      field: "montant",
      headerName: "Montant total",
      flex: 1,
      renderCell: (params) => {
        // Convert params.value to a number before formatting
        const value = parseFloat(params.value);
        const formattedValue = !isNaN(value) ? value.toFixed(2) : "0.00";
        return `${formattedValue} DH`;
      },
    },
  ];
  

  
  const totalPayments = filteredPayments.reduce((acc, curr) => {
    const amount = Number(curr.amount);
    return acc + (isNaN(amount) ? 0 : amount);
  }, 0);
  

  return (
    <Box m="20px">
      <Header title="PAIEMENTS" />
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
          <InputLabel>Mois</InputLabel>
          <Select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          {monthsForYear.map((month, index) => (
            <MenuItem key={index} value={month}>
              {month}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ ml: 2, minWidth: 120 }}>
        <InputLabel>Année</InputLabel>
        <Select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
        >
          {uniqueYears.map((year, index) => (
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
        onClick={handleGenerateClick}
        sx={{ ml: 2 }}
        disabled={!hasPaymentsForMonth}
      >
        Générer Ordre de Virement
      </Button>

    </Box>

    {hasPaymentsForMonth && (
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
          getRowId={(row) => row.id_payment}
          disableSelectionOnClick
          autoHeight
        />
        {/* Custom Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            padding: "8px 24px",
            backgroundColor: colors.grey[800], // Setting background color
            fontWeight: "bold",
          }}
        >
          Montant Total : {totalPayments.toFixed(2)} DH
        </div>
      </Box>
    )}

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

