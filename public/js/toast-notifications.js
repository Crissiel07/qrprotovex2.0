// Sistema de notificaciones toast
$(document).ready(function() {
  // Configuración global de Toastr
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-top-right",
    timeOut: 5000,
    extendedTimeOut: 1000,
    preventDuplicates: true,
    newestOnTop: true,
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut"
  };

  // Función para mostrar notificaciones de éxito
  window.showSuccessToast = function(message) {
    toastr.success(message, 'Éxito');
  };

  // Función para mostrar notificaciones de error
  window.showErrorToast = function(message) {
    toastr.error(message, 'Error');
  };

  // Función para mostrar notificaciones de información
  window.showInfoToast = function(message) {
    toastr.info(message, 'Información');
  };

  // Función para mostrar notificaciones de advertencia
  window.showWarningToast = function(message) {
    toastr.warning(message, 'Advertencia');
  };

  // Mostrar notificaciones desde los mensajes flash
  if (typeof flashMessages !== 'undefined') {
    if (flashMessages.success && flashMessages.success.trim() !== '') {
      showSuccessToast(flashMessages.success);
    }
    if (flashMessages.error && flashMessages.error.trim() !== '') {
      showErrorToast(flashMessages.error);
    }
    if (flashMessages.info && flashMessages.info.trim() !== '') {
      showInfoToast(flashMessages.info);
    }
    if (flashMessages.warning && flashMessages.warning.trim() !== '') {
      showWarningToast(flashMessages.warning);
    }
  }

  // Agregar notificaciones para acciones comunes
  $('.btn-delete').on('click', function(e) {
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento?')) {
      e.preventDefault();
      showWarningToast('Operación cancelada');
    } else {
      showInfoToast('Procesando solicitud...');
    }
  });

  // Validación de formularios con Bootstrap
  (function() {
    'use strict';
    window.addEventListener('load', function() {
      // Obtener todos los formularios que necesitamos validar
      var forms = document.getElementsByClassName('needs-validation');
      // Bucle para prevenir el envío
      Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
          if (form.checkValidity() === false) {
            event.preventDefault();
            event.stopPropagation();
            
            // Mostrar notificaciones toast para campos vacíos
            $(form).find('[required]').each(function() {
              if (!this.validity.valid) {
                var emptyMessage = $(this).data('toast-empty');
                if (emptyMessage) {
                  showErrorToast(emptyMessage);
                }
              }
            });
          } else {
            // Si el formulario es válido, mostrar notificación de procesamiento
            var successMessage = $(form).data('toast-success');
            if (successMessage) {
              showInfoToast('Procesando: ' + successMessage);
            } else {
              showInfoToast('Procesando solicitud...');
            }
          }
          form.classList.add('was-validated');
        }, false);
      });
    }, false);
  })();

  // Validación de contraseñas coincidentes
  $('#password, #password2').on('keyup', function() {
    if ($('#password').val() !== '' && $('#password2').val() !== '') {
      if ($('#password').val() !== $('#password2').val()) {
        $('#password2')[0].setCustomValidity('Las contraseñas no coinciden');
        $('#password2').addClass('is-invalid');
      } else {
        $('#password2')[0].setCustomValidity('');
        $('#password2').removeClass('is-invalid').addClass('is-valid');
      }
    }
  });

  // Mostrar indicador de fortaleza de contraseña
  $('#password').on('keyup', function() {
    var password = $(this).val();
    var strength = 0;
    
    if (password.length >= 6) strength += 1;
    if (password.match(/[a-z]+/)) strength += 1;
    if (password.match(/[A-Z]+/)) strength += 1;
    if (password.match(/[0-9]+/)) strength += 1;
    if (password.match(/[^a-zA-Z0-9]+/)) strength += 1;
    
    var strengthText = '';
    var strengthClass = '';
    
    switch(strength) {
      case 0:
      case 1:
        strengthText = 'Débil';
        strengthClass = 'text-danger';
        break;
      case 2:
      case 3:
        strengthText = 'Media';
        strengthClass = 'text-warning';
        break;
      case 4:
      case 5:
        strengthText = 'Fuerte';
        strengthClass = 'text-success';
        break;
    }
    
    if (password.length > 0) {
      $('#formFeedback').html('<div class="alert alert-info">Fortaleza de la contraseña: <span class="' + strengthClass + '">' + strengthText + '</span></div>');
    } else {
      $('#formFeedback').html('');
    }
  });
});
