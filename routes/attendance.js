const express = require('express');
const router = express.Router();
const { isAuthenticated, isRecursosHumanos } = require('../middleware/auth');
const Employee = require('../models/Employee');
const AttendanceRecord = require('../models/AttendanceRecord');

// Ruta para la pu00e1gina de escaneo de QR
router.get('/scan', isAuthenticated, (req, res) => {
  res.render('recursos-humanos/attendance/scan', {
    user: req.session.user
  });
});

// Ruta para procesar el escaneo de QR
router.post('/process-scan', isAuthenticated, async (req, res) => {
  try {
    const { qrData } = req.body;
    
    if (!qrData) {
      return res.status(400).json({ success: false, message: 'No se proporcionu00f3 datos del QR' });
    }
    
    // Parsear los datos del QR
    let qrInfo;
    try {
      qrInfo = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Formato de QR invu00e1lido' });
    }
    
    // Verificar que sea un QR de empleado
    if (!qrInfo.id || !qrInfo.cedula || qrInfo.tipo !== 'empleado') {
      return res.status(400).json({ success: false, message: 'Cu00f3digo QR no vu00e1lido para registro de asistencia' });
    }
    
    // Buscar el empleado
    const employee = await Employee.findById(qrInfo.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Empleado no encontrado' });
    }
    
    // Verificar si ya tiene un registro de entrada sin salida
    const pendingRecord = await AttendanceRecord.findOne({
      employee: employee._id,
      status: 'entrada',
      exitTime: null
    }).sort({ entryTime: -1 });
    
    const now = new Date();
    const currentWeek = getWeekNumber(now);
    const currentMonth = now.getMonth() + 1; // getMonth() devuelve 0-11
    const currentYear = now.getFullYear();
    
    if (pendingRecord) {
      // Registrar salida
      pendingRecord.exitTime = now;
      pendingRecord.status = 'salida';
      await pendingRecord.save();
      
      return res.json({
        success: true,
        action: 'salida',
        message: `Salida registrada para ${employee.nombres} ${employee.apellidos}`,
        employee: {
          id: employee._id,
          cedula: employee.cedula,
          nombres: employee.nombres,
          apellidos: employee.apellidos
        },
        record: {
          entryTime: pendingRecord.entryTime,
          exitTime: pendingRecord.exitTime,
          hoursWorked: pendingRecord.hoursWorked
        }
      });
    } else {
      // Registrar entrada
      const newRecord = new AttendanceRecord({
        employee: employee._id,
        entryTime: now,
        status: 'entrada',
        week: currentWeek,
        month: currentMonth,
        year: currentYear
      });
      
      await newRecord.save();
      
      return res.json({
        success: true,
        action: 'entrada',
        message: `Entrada registrada para ${employee.nombres} ${employee.apellidos}`,
        employee: {
          id: employee._id,
          cedula: employee.cedula,
          nombres: employee.nombres,
          apellidos: employee.apellidos
        },
        record: {
          entryTime: newRecord.entryTime
        }
      });
    }
    
  } catch (error) {
    console.error('Error al procesar escaneo de QR:', error);
    return res.status(500).json({ success: false, message: 'Error al procesar el escaneo' });
  }
});

// Ruta para ver historial de asistencia
router.get('/history', isAuthenticated, isRecursosHumanos, async (req, res) => {
  try {
    // Paru00e1metros de filtro
    const employeeId = req.query.employee || null;
    const period = req.query.period || 'week';
    const value = req.query.value || getCurrentPeriodValue(period);
    
    // Obtener todos los empleados para el selector
    const employees = await Employee.find({ estado: 'Activo' }).sort({ apellidos: 1 });
    
    // Si no se seleccionu00f3 un empleado, mostrar la lista de empleados
    if (!employeeId) {
      return res.render('recursos-humanos/attendance/history', {
        user: req.session.user,
        employees,
        records: [],
        stats: null,
        filters: { employeeId, period, value },
        periodName: getPeriodName(period, value)
      });
    }
    
    // Buscar los registros de asistencia
    const records = await AttendanceRecord.find({
      employee: employeeId,
      ...(period === 'week' ? { week: value, year: new Date().getFullYear() } : {}),
      ...(period === 'month' ? { month: value, year: new Date().getFullYear() } : {}),
      ...(period === 'year' ? { year: value } : {})
    }).sort({ entryTime: -1 });
    
    // Calcular estadu00edsticas
    let totalHours = 0;
    let completedDays = 0;
    let incompleteDays = 0;
    
    records.forEach(record => {
      if (record.status === 'salida') {
        totalHours += record.hoursWorked;
        completedDays++;
      } else {
        incompleteDays++;
      }
    });
    
    const stats = {
      totalHours: totalHours.toFixed(2),
      completedDays,
      incompleteDays,
      totalDays: completedDays + incompleteDays
    };
    
    // Obtener informaciu00f3n del empleado seleccionado
    const selectedEmployee = await Employee.findById(employeeId);
    
    res.render('recursos-humanos/attendance/history', {
      user: req.session.user,
      employees,
      selectedEmployee,
      records,
      stats,
      filters: { employeeId, period, value },
      periodName: getPeriodName(period, value)
    });
    
  } catch (error) {
    console.error('Error al cargar historial de asistencia:', error);
    req.flash('error_msg', 'Error al cargar el historial de asistencia');
    res.redirect('/recursos-humanos');
  }
});

// Funciu00f3n para obtener el nu00famero de semana del au00f1o
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Funciu00f3n para obtener el valor actual del peru00edodo
function getCurrentPeriodValue(period) {
  const now = new Date();
  
  switch (period) {
    case 'week':
      return getWeekNumber(now);
    case 'month':
      return now.getMonth() + 1; // getMonth() devuelve 0-11
    case 'year':
      return now.getFullYear();
    default:
      return getWeekNumber(now);
  }
}

// Funciu00f3n para obtener el nombre del peru00edodo
function getPeriodName(period, value) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  switch (period) {
    case 'week':
      return `Semana ${value} del ${new Date().getFullYear()}`;
    case 'month':
      return `${months[value - 1]} ${new Date().getFullYear()}`;
    case 'year':
      return `Au00f1o ${value}`;
    default:
      return '';
  }
}

module.exports = router;
