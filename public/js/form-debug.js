// Script para depurar el envío de formularios
document.addEventListener('DOMContentLoaded', function() {
  // Buscar el formulario de creación de usuario
  const createUserForm = document.getElementById('createUserForm');
  
  if (createUserForm) {
    console.log('Formulario de creación de usuario encontrado');
    
    // Agregar evento para interceptar el envío del formulario
    createUserForm.addEventListener('submit', function(event) {
      // No detener el envío normal del formulario, solo registrar los datos
      
      // Recopilar los datos del formulario
      const formData = new FormData(createUserForm);
      const formDataObj = {};
      
      // Convertir FormData a objeto para visualización
      formData.forEach((value, key) => {
        formDataObj[key] = value;
      });
      
      // Registrar los datos en la consola
      console.log('Enviando formulario con los siguientes datos:', formDataObj);
      
      // Mostrar un mensaje al usuario
      alert('Enviando formulario. Revisa la consola para ver los datos.');
    });
    
    console.log('Evento de envío de formulario registrado');
  } else {
    console.log('Formulario de creación de usuario no encontrado');
  }
});
