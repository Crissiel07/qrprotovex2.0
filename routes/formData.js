const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const formDataController = require('../controllers/formDataController');

// Ruta para guardar datos de un formulario
router.post('/save', isAuthenticated, async (req, res) => {
  try {
    const result = await formDataController.saveFormData(req, res);
    
    if (result.success) {
      req.flash('success_msg', result.message);
      return res.status(200).json(result);
    } else {
      req.flash('error_msg', result.message);
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error en la ruta de guardar formulario:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Ruta para obtener todos los datos de formularios
router.get('/', isAuthenticated, async (req, res) => {
  try {
    // Filtros opcionales desde query params
    const filters = {};
    
    if (req.query.formType) {
      filters.formType = req.query.formType;
    }
    
    if (req.query.status) {
      filters.status = req.query.status;
    }
    
    if (req.query.estudiante) {
      filters.estudiante = req.query.estudiante;
    }
    
    const result = await formDataController.getAllFormData(filters);
    
    if (result.success) {
      return res.render('formData/index', {
        user: req.session.user,
        formData: result.data,
        filters: req.query
      });
    } else {
      req.flash('error_msg', result.message);
      return res.redirect('/dashboard');
    }
  } catch (error) {
    console.error('Error en la ruta de listar formularios:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    return res.redirect('/dashboard');
  }
});

// Ruta para ver detalles de un formulario
router.get('/view/:id', isAuthenticated, async (req, res) => {
  try {
    const result = await formDataController.getFormDataById(req.params.id);
    
    if (result.success) {
      return res.render('formData/view', {
        user: req.session.user,
        formData: result.data
      });
    } else {
      req.flash('error_msg', result.message);
      return res.redirect('/form-data');
    }
  } catch (error) {
    console.error('Error en la ruta de ver formulario:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    return res.redirect('/form-data');
  }
});

// Ruta para actualizar estado de un formulario
router.post('/update-status/:id', isAuthenticated, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const result = await formDataController.updateFormStatus(req.params.id, status, notes);
    
    if (result.success) {
      req.flash('success_msg', result.message);
      return res.redirect(`/form-data/view/${req.params.id}`);
    } else {
      req.flash('error_msg', result.message);
      return res.redirect(`/form-data/view/${req.params.id}`);
    }
  } catch (error) {
    console.error('Error en la ruta de actualizar estado:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    return res.redirect(`/form-data/view/${req.params.id}`);
  }
});

// Ruta para eliminar datos de un formulario
router.get('/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const result = await formDataController.deleteFormData(req.params.id);
    
    if (result.success) {
      req.flash('success_msg', result.message);
      return res.redirect('/form-data');
    } else {
      req.flash('error_msg', result.message);
      return res.redirect('/form-data');
    }
  } catch (error) {
    console.error('Error en la ruta de eliminar formulario:', error);
    req.flash('error_msg', 'Error al procesar la solicitud');
    return res.redirect('/form-data');
  }
});

// Ruta para obtener estadísticas de formularios
router.get('/stats', isAuthenticated, async (req, res) => {
  try {
    const result = await formDataController.getFormStats();
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error en la ruta de estadísticas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
