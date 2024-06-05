import React, { useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import { Formik } from "formik";
import * as yup from "yup";
import { invoke } from "@tauri-apps/api/tauri";

const LoginForm = ({ onLoginSuccess }) => {
  const [loginError, setLoginError] = useState("");

  const handleFormSubmit = async (values) => {
    try {
      const response = await invoke("login", { payload: values });
      if (response) {
        onLoginSuccess();
      } else {
        setLoginError("Invalid credentials");
      }
    } catch (error) {
      console.error("Error:", error);
      setLoginError(error.message || "An unknown error occurred");
    }
  };

  const validationSchema = yup.object().shape({
    username: yup.string().required("Required"),
    password: yup.string().required("Required"),
  });

  const initialValues = {
    username: "",
    password: "",
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
        maxWidth="400px"
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
                  label="Username"
                  name="username"
                  value={values.username}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.username && !!errors.username}
                  helperText={touched.username && errors.username}
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
              </Box>
              {loginError && <Typography color="error" mt="10px">{loginError}</Typography>}
              <Box display="flex" justifyContent="end" mt="20px">
                <Button type="submit" color="secondary" variant="contained">Login</Button>
              </Box>
            </form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

export default LoginForm;
