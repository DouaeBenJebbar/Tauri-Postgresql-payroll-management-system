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
import { saveAs } from 'file-saver';
import ExcelJS from 'exceljs';
import n2words from 'n2words';


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
      // Load header template
      const headerResponse = await fetch('/templates/headerOV.xlsx');
      if (!headerResponse.ok) {
        throw new Error('Failed to fetch template file');
      }
      const headerArrayBuffer = await headerResponse.arrayBuffer();
  
      // Load workbook and modify existing worksheet
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(headerArrayBuffer);
      const worksheet = workbook.getWorksheet(1); // Assuming data starts on the first sheet
  
  
      // Start inserting data from row 20
      let startDataRow = 20;
      let currentRow = startDataRow;
      let currentPageHeight = 385; // Height of header on the first page
      const maxPageHeight = 11 * 72; // Maximum page height for letter size (11 inches) in points
      const rowHeightPoints = 24; // Standard row height in points
      let endDataRow = 0;
  
      let previousTotalARow = startDataRow - 1; // Track the previous TOTAL A REPORTER row
      let previousTotalRow = startDataRow - 2; // Track the previous TOTAL REPORTE row
  
      filteredPayments.forEach(payment => {
        const row = worksheet.addRow([
          payment.nom_resident,
          payment.rib,
          payment.nom_banque,
          parseFloat(payment.montant) // Ensure montant is parsed as float
        ]);
  
        // Apply styles to cells in the current row
        row.eachCell((cell, colNumber) => {
          switch (colNumber) {
            case 1: // nom_resident
              cell.font = { name: 'Times New Roman', size: 16, bold: true, italic: true };
              cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
              break;
            case 2: // rib
              cell.font = { name: 'Times New Roman', size: 16, bold: true };
              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
              break;
            case 3: // nom_banque
              cell.font = { name: 'Times New Roman', size: 14, bold: true, italic: true };
              cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
              break;
            case 4: // montant
              cell.font = { name: 'Times New Roman', size: 14, bold: true };
              cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
              cell.numFmt = '#,##0.00'; // Format as number with two decimal places
              break;
            default:
              break;
        }
        // Set height of the row to standard row height
        worksheet.getRow(currentRow).height = rowHeightPoints;
        // Add border to each cell
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
        // Add row height to current page height
        currentPageHeight += rowHeightPoints;
        currentRow++;
  
        // Check if inserting another row would exceed the maximum page height
      if (currentPageHeight + rowHeightPoints> maxPageHeight) {
        // Update endDataRow to the last data entry before "TOTAL A REPORTER"
        endDataRow = currentRow - 1;

        // Insert TOTAL A REPORTER row
        insertTotalRow(worksheet, currentRow, 'TOTAL A REPORTER', startDataRow, endDataRow);

        // Move to the next row for TOTAL REPORTE
        currentRow++;

        startDataRow = currentRow;
        insertTotalRow(worksheet, currentRow, 'TOTAL REPORTE', startDataRow, previousTotalRow);

        // Move to the next row after TOTAL REPORTE
        currentRow++;

        // Reset current page height to header height for new page
        currentPageHeight = 100; // Assuming header height is 385 points

        // Update previousTotalARow and previousTotalRow for the next page
        previousTotalARow = currentRow - 3; // Subtracting 3 because we added 3 rows (1 TOTAL A REPORTER, 1 TOTAL REPORTE, 1 blank row)
        previousTotalRow = currentRow - 2;
      }
            });
  
      // Ensure the worksheet has at least 45 lines including header
      const minimumRows = 45;
      const totalRows = worksheet.rowCount;
      const rowsToAdd = minimumRows - totalRows; // Calculate rows to add
  
      // Add rows if necessary to reach minimum rows
      if (rowsToAdd > 0) {
        for (let i = 0; i < rowsToAdd; i++) {
          worksheet.addRow([]);
        }
      }
      // After the loop for adding static data rows

      // Insert "Total Général" row
      insertTotalRow(worksheet, currentRow, 'TOTAL GENERAL', startDataRow, currentRow - 1);
      let totalGeneralValue = 0;
      for (let i = startDataRow; i < currentRow; i++) {
        const cellValue = worksheet.getCell(`D${i}`).value;
        if (typeof cellValue === 'number') {
          totalGeneralValue += cellValue;
        }
      }
  
      // Convert the manually calculated total general value to French words
      const letterVersion = n2words(totalGeneralValue, { lang: 'fr' });

      // Assuming B18:D18 are already merged, set the value in B18
      const totalCell = worksheet.getCell(`A18`);
      totalCell.value = totalGeneralValue;
      const mergedCell = worksheet.getCell(`B18`);
      mergedCell.value = letterVersion;
  


      // Increment currentRow to move to the next row for the footer
      currentRow++;
  
      // First row of the footer: Merge cells A, B, C, and D and add text
      worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
      const firstFooterRow = worksheet.getCell(`A${currentRow}`);
      firstFooterRow.value = `Le règlement des indemnités de fonction et allocations familiales des résidents au titre du mois de ${selectedMonth} ${selectedYear}`;
      firstFooterRow.font = { name: 'Times New Roman', bold: true, size: 14 };
      firstFooterRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  
      // Set height of the first footer row to 39 pixels
      worksheet.getRow(currentRow).height = 39;
  
      // Second row of the footer: Individual cells for "L'ORDONNATEUR" and merged cells for "LE FONDE DE POUVOIRS"
      currentRow++; // Move to the next row
      const secondFooterRowA = worksheet.getCell(`A${currentRow}`);
      secondFooterRowA.value = "L'ORDONNATEUR";
      secondFooterRowA.font = { name: 'Arial', bold: true, size: 16 };
      secondFooterRowA.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  
      // Merge cells C and D in the second footer row
      worksheet.mergeCells(`C${currentRow}:D${currentRow}`);
      const secondFooterRowCD = worksheet.getCell(`C${currentRow}`);
      secondFooterRowCD.value = "LE FONDE DE POUVOIRS";
      secondFooterRowCD.font = { name: 'Arial', bold: true, size: 16 };
      secondFooterRowCD.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  
      // Save the modified workbook
      const fileName = `OV ${selectedMonth} ${selectedYear}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
    } catch (error) {
      console.error('Error generating Excel file from template:', error);
      throw error;
    }
  };
  
  // Function to insert custom styling row for TOTAL A REPORTER and TOTAL REPORTE
  function insertTotalRow(worksheet, rowNumber, text, startDataRow, endDataRow) {
    // Merge cells A, B, C, and D for the total row
    worksheet.mergeCells(`A${rowNumber}:C${rowNumber}`);
    const totalRowA = worksheet.getCell(`A${rowNumber}`);
    totalRowA.value = text;
    totalRowA.font = { name: 'Times New Roman', bold: true, size: 12};
    totalRowA.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  
    // Set background fill color for the total row
    totalRowA.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFBFBFBF' }, 
    };
  
    // Cell D for the total row with reference to previous total cell
    const totalRowD = worksheet.getCell(`D${rowNumber}`);
    if (text === 'TOTAL A REPORTER'|| text === 'TOTAL GENERAL') {
      // Sum from D[startDataRow] to D[endDataRow]
      totalRowD.value = { formula: `SUM(D${startDataRow}:D${endDataRow})` };
    } else if (text === 'TOTAL REPORTE') {
      // Reference the cell above it
      totalRowD.value = { formula: `D${rowNumber - 1}` };
    }
    totalRowD.font = { name: 'Arial', bold: true ,size: 14};
    totalRowD.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    totalRowD.numFmt = '#,##0.00'; // Format as number with two decimal places
  
    // Set border for the total row
    totalRowA.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    totalRowD.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };

    // Set height of the total row to standard row height in points
    worksheet.getRow(rowNumber).height = 33.75; // Adjust height as needed
}

  
  
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const data = await invoke("get_paiments");
        // Add unique id to each payment object
        const paymentsWithIds = data.map((payment, index) => ({ ...payment, id: index + 1 }));
        setPayments(paymentsWithIds);
        setFilteredPayments(paymentsWithIds);
        extractUniqueYears(data); // Extract unique years
      } catch (error) {
        console.error("Échec de la récupération des paiements", error);
      }
    };
    
    fetchPayments();
  }, [reloadTrigger]);

  useEffect(() => {
    let filtered = payments.filter((payment) =>
      payment.nom_resident ? payment.nom_resident.toString().includes(searchInput) : false
    );
    if (selectedMonth) {
      filtered = filtered.filter(
        (payment) => new Date(payment.date_paiement).getMonth() === months.indexOf(selectedMonth)
      );
    }
    if (selectedYear) {
      filtered = filtered.filter(
        (payment) => new Date(payment.date_paiement).getFullYear() === parseInt(selectedYear, 10)
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
            .filter(payment => new Date(payment.date_paiement).getFullYear() === parseInt(selectedYear))
            .map(payment => months[new Date(payment.date_paiement).getMonth()])
        )
      ];
      if (!monthsWithPayments.includes(currentMonth)) {
        monthsWithPayments.push(currentMonth);
      }
      setMonthsForYear(monthsWithPayments);
    }
  }, [selectedYear, payments, currentMonth]);

  const extractUniqueYears = (payments) => {
    const years = payments.map(payment => new Date(payment.date_paiement).getFullYear());
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
    const amount = parseFloat(curr.montant);
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
          getRowId={(row) => row.id_paiement} // Adjust according to your actual id property name
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
          Montant Total : {`${totalPayments.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          DH
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

