const FormData = require('../models/FormData');

// Guardar datos de un formulario
exports.saveFormData = async (req, res) => {
  try {
    const { formType, estudiante, formData, notes } = req.body;
    
    // Crear nuevo registro de datos de formulario
    const newFormData = new FormData({
      formType,
      estudiante: estudiante || null,
      formData,
      createdBy: req.session.user._id,
      notes
    });
    
    // Guardar en la base de datos
    await newFormData.save();
    
    // Respuesta exitosa
    return {
      success: true,
      message: 'Datos del formulario guardados exitosamente',
      formDataId: newFormData._id
    };
  } catch (error) {
    console.error('Error al guardar datos del formulario:', error);
    return {
      success: false,
      message: 'Error al guardar datos del formulario',
      error: error.message
    };
  }
};

// Obtener todos los datos de formularios
exports.getAllFormData = async (filters = {}) => {
  try {
    const formData = await FormData.find(filters)
      .populate('estudiante', 'cedula nombres apellidos')
      .populate('createdBy', 'username name')
      .sort({ createdAt: -1 });
    
    return {
      success: true,
      data: formData
    };
  } catch (error) {
    console.error('Error al obtener datos de formularios:', error);
    return {
      success: false,
      message: 'Error al obtener datos de formularios',
      error: error.message
    };
  }
};

// Obtener datos de un formulario específico
exports.getFormDataById = async (formDataId) => {
  try {
    const formData = await FormData.findById(formDataId)
      .populate('estudiante', 'cedula nombres apellidos email carrera tipoEstudiante tipoBeca')
      .populate('createdBy', 'username name');
    
    if (!formData) {
      return {
        success: false,
        message: 'Datos de formulario no encontrados'
      };
    }
    
    return {
      success: true,
      data: formData
    };
  } catch (error) {
    console.error('Error al obtener datos del formulario:', error);
    return {
      success: false,
      message: 'Error al obtener datos del formulario',
      error: error.message
    };
  }
};

// Actualizar estado de un formulario
exports.updateFormStatus = async (formDataId, status, notes) => {
  try {
    const updatedFormData = await FormData.findByIdAndUpdate(
      formDataId,
      { 
        status,
        notes: notes || undefined,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedFormData) {
      return {
        success: false,
        message: 'Datos de formulario no encontrados'
      };
    }
    
    return {
      success: true,
      message: 'Estado del formulario actualizado exitosamente',
      data: updatedFormData
    };
  } catch (error) {
    console.error('Error al actualizar estado del formulario:', error);
    return {
      success: false,
      message: 'Error al actualizar estado del formulario',
      error: error.message
    };
  }
};

// Eliminar datos de un formulario
exports.deleteFormData = async (formDataId) => {
  try {
    const deletedFormData = await FormData.findByIdAndDelete(formDataId);
    
    if (!deletedFormData) {
      return {
        success: false,
        message: 'Datos de formulario no encontrados'
      };
    }
    
    return {
      success: true,
      message: 'Datos del formulario eliminados exitosamente'
    };
  } catch (error) {
    console.error('Error al eliminar datos del formulario:', error);
    return {
      success: false,
      message: 'Error al eliminar datos del formulario',
      error: error.message
    };
  }
};

// Obtener estadísticas de formularios
exports.getFormStats = async () => {
  try {
    const stats = await FormData.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const formTypeStats = await FormData.aggregate([
      {
        $group: {
          _id: '$formType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return {
      success: true,
      statusStats: stats,
      formTypeStats: formTypeStats
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de formularios:', error);
    return {
      success: false,
      message: 'Error al obtener estadísticas de formularios',
      error: error.message
    };
  }
};
