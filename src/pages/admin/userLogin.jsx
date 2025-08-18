import React, { useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Link as MuiLink,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';

// Replace this with your actual login action
import { loginUser } from '../../store/slices/authSlice';

const UserLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, success } = useSelector((state) => state.auth);

  useEffect(()=>{
    if (success) {
      navigate('/admin/services');
    }
  },[success, navigate]);

  const formik = useFormik({
    initialValues: {
      username: '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('username is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values) => {
      await dispatch(loginUser(values));
    },
  });

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          p: 3,
          boxShadow: 4,
          borderRadius: 3,
        }}
      >
        <CardContent>
          <Box mb={3} textAlign="center">
            <Typography variant="h5" fontWeight="bold">
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your account
            </Typography>
          </Box>

          <form onSubmit={formik.handleSubmit} noValidate>
            <Box mb={2}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                type="username"
                variant="outlined"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.username && Boolean(formik.errors.username)}
                helperText={formik.touched.username && formik.errors.username}
              />
            </Box>

            <Box mb={2}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                variant="outlined"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
              />
            </Box>

            {error && (
              <Typography variant="body2" color="error" mb={2}>
                {error}
              </Typography>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 'bold', mb: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Don't have an account?{' '}
              <MuiLink component={Link} to="/signup" color="primary">
                Sign up
              </MuiLink>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserLogin;
