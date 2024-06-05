import React, { useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { Box, Button, TextField } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";

const DbForm = ({ onConnect }) => {
  const [isConnected, setIsConnected] = useState(false);

  const handleFormSubmit = async (values) => {
    try {
      const config = {
        host: values.host,
        user: values.user,
        password: values.password,
        port: parseInt(values.port, 10),
        database: values.database,
      };
      await invoke('connect_db', { config });
      setIsConnected(true);
      onConnect();
    } catch (error) {
      console.error('Error:', error);
      let errorMessage = error.message || error.toString();
      if (errorMessage.includes('invalid args')) {
        alert('Invalid arguments provided for database connection');
      } else if (errorMessage.includes('missing required key')) {
        alert('Missing required information for database connection');
      } else {
        alert('An unknown error occurred');
      }
    }
  };

  const validationSchema = yup.object().shape({
    user: yup.string().required("Required"),
    password: yup.string().required("Required"),
    host: yup.string().required("Required"),
    port: yup.number().required("Required").typeError("Must be a number"),
    database: yup.string().required("Required"),
  });

  const initialValues = {
    user: "",
    password: "",
    host: "",
    port: "",
    database: "",
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      width="100%"
    >
      <Box
        m="10px"
        p="20px"
        width="100%"
        maxWidth="500px"
        border="1px solid #ccc"
        borderRadius="8px"
        boxShadow="3"
      >
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleFormSubmit}
        >
          {({
            values,
            errors,
            touched,
            handleBlur,
            handleChange,
            handleSubmit,
          }) => (
            <form onSubmit={handleSubmit}>
              <Box display="grid" gap="20px">
                <TextField
                  fullWidth
                  variant="filled"
                  label="User"
                  name="user"
                  value={values.user}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.user && !!errors.user}
                  helperText={touched.user && errors.user}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  label="Password"
                  type="password"
                  name="password"
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && !!errors.password}
                  helperText={touched.password && errors.password}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  label="Host"
                  name="host"
                  value={values.host}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.host && !!errors.host}
                  helperText={touched.host && errors.host}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  label="Port"
                  name="port"
                  value={values.port}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.port && !!errors.port}
                  helperText={touched.port && errors.port}
                />
                <TextField
                  fullWidth
                  variant="filled"
                  label="Database"
                  name="database"
                  value={values.database}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.database && !!errors.database}
                  helperText={touched.database && errors.database}
                />
              </Box>
              <Box display="flex" justifyContent="end" mt="20px">
                <Button type="submit" color="secondary" variant="contained">
                  Connect
                </Button>
              </Box>
            </form>
          )}
        </Formik>
        {isConnected && <p>Connected to the database successfully!</p>}
      </Box>
    </Box>
  );
};

export default DbForm;
