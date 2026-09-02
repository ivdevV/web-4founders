const FRANJAS = {
  manana: 'Mañana (9:00–12:00)',
  mediodia: 'Mediodía (12:00–15:00)',
  tarde: 'Tarde (15:00–18:00)',
  'tarde-noche': 'Tarde-noche (18:00–21:00)',
  cualquiera: 'Cualquier hora',
};

const PAISES_POR_PREFIJO = {
  '+34': { pais: 'España', paisIso: 'ES' },
  '+52': { pais: 'México', paisIso: 'MX' },
  '+54': { pais: 'Argentina', paisIso: 'AR' },
  '+57': { pais: 'Colombia', paisIso: 'CO' },
  '+56': { pais: 'Chile', paisIso: 'CL' },
  '+51': { pais: 'Perú', paisIso: 'PE' },
  '+1': { pais: 'Estados Unidos', paisIso: 'US' },
  '+44': { pais: 'Reino Unido', paisIso: 'GB' },
  '+33': { pais: 'Francia', paisIso: 'FR' },
  '+49': { pais: 'Alemania', paisIso: 'DE' },
  '+351': { pais: 'Portugal', paisIso: 'PT' },
};

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function asTrimmedString(value) {
  return String(value || '').trim();
}

export function normalizeContactPayload(body = {}) {
  const rawPrefix = asTrimmedString(body.prefijo || '+34');
  const prefixMatch = rawPrefix.match(/\+\d+/);
  const prefijo = prefixMatch ? prefixMatch[0] : '+34';
  const curso = asTrimmedString(body.curso);

  return {
    nombre: asTrimmedString(body.nombre),
    email: asTrimmedString(body.email),
    prefijo,
    telefono: asTrimmedString(body.telefono),
    franjaHoraria: asTrimmedString(body.franjaHoraria || 'cualquiera'),
    profesion: asTrimmedString(body.profesion || curso),
    descripcion: asTrimmedString(body.descripcion || body.mensaje),
    curso: curso || null,
  };
}

export function validateContactPayload(body = {}) {
  const payload = normalizeContactPayload(body);

  if (!payload.nombre || !isEmail(payload.email) || !payload.telefono || !payload.profesion || !payload.descripcion) {
    return { error: 'Datos incompletos o inválidos.' };
  }
  if (!Object.hasOwn(FRANJAS, payload.franjaHoraria)) {
    return { error: 'Selecciona una franja horaria válida.' };
  }

  return { payload };
}

export function countryFromPrefix(prefijo) {
  return PAISES_POR_PREFIJO[prefijo] || { pais: null, paisIso: null };
}

export function timeSlotLabel(franjaHoraria) {
  return FRANJAS[franjaHoraria];
}
