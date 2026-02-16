
export const generateWhatsAppLink = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};

export const createAppointmentMessage = (petName: string, service: string, date: string, time: string, clinicName: string) => {
  return `¡Hola! 👋 Te recordamos tu turno en *${clinicName}*.\n\n` +
    `🐶 Paciente: *${petName}*\n` +
    `🩺 Servicio: *${service}*\n` +
    `📅 Fecha: *${date}*\n` +
    `⏰ Hora: *${time}*\n\n` +
    `Por favor, confirma tu asistencia respondiendo a este mensaje. ¡Te esperamos!`;
};

export const createBudgetMessage = (petName: string, total: string, clinicName: string) => {
  return `¡Hola! 👋 Te enviamos el presupuesto solicitado para *${petName}* de *${clinicName}*.\n\n` +
    `💰 Total estimado: *${total}*\n\n` +
    `Puedes confirmar el servicio por este medio para agendar el turno correspondiente.`;
};
