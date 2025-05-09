// Cerrar automáticamente las alertas después de 5 segundos
document.addEventListener('DOMContentLoaded', function() {
  // Seleccionar todas las alertas
  const alerts = document.querySelectorAll('.alert');
  
  // Configurar un temporizador para cerrar cada alerta
  alerts.forEach(alert => {
    setTimeout(() => {
      // Crear un evento de clic para el botón de cerrar
      const closeButton = alert.querySelector('.close');
      if (closeButton) {
        closeButton.click();
      } else {
        // Si no hay botón de cerrar, eliminar la alerta directamente
        alert.style.opacity = '0';
        setTimeout(() => {
          alert.remove();
        }, 300);
      }
    }, 5000);
  });

  // Añadir animación a los formularios
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.style.opacity = '0';
    form.style.transition = 'opacity 0.5s ease';
    
    setTimeout(() => {
      form.style.opacity = '1';
    }, 300);
  });
});
