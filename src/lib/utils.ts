import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Tailwind class merger
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Currency Formatter (USD)
 */
export const formatUSD = (value: number | undefined | null) => {
  if (value === undefined || value === null) return 'U$S 0,00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value).replace('$', 'U$S ');
};

/**
 * Percentage Formatter
 */
export const formatPct = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '0,00%';
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

/**
 * Area Formatter (ha)
 */
export const formatHa = (value: number | undefined | null) => {
  if (value === undefined || value === null) return '0,00 ha';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ' ha';
};

/**
 * Date Formatter (America/Asuncion)
 */
export const formatDate = (date: string | Date | null) => {
  if (!date) return '-';
  const timeZone = 'America/Asuncion';
  const zonedDate = toZonedTime(new Date(date), timeZone);
  return format(zonedDate, 'dd/MM/yyyy');
};

/**
 * Future Date Validation
 */
export const isFutureDate = (date: string | Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) > today;
};

/**
 * Formulas
 */
export const formulas = {
  propuesta: {
    areaTratada: (cantidad: number, contenido: number, dosis: number, aplicaciones: number) => {
      if (!dosis || !aplicaciones) return 0;
      return (cantidad * contenido) / (dosis * aplicaciones);
    }
  },
  aplicaciones: {
    cantidad: (area: number, dosis: number, aplicaciones: number, contenido: number) => {
      if (!contenido) return 0;
      return Math.ceil((area * dosis * aplicaciones) / contenido);
    }
  },
  cosecha: {
    bolsasAlq: (resultadoKg: number) => {
      return (resultadoKg / 60) * 2.42;
    }
  },
  producto: {
    precioVenta: (precioCompra: number, margenPct: number) => {
      return precioCompra * (1 + margenPct / 100);
    },
    totalPct: (costoOp: number, costoFin: number, bonifVend: number, bonifCli: number, voucher: number) => {
      return costoOp + costoFin + bonifVend + bonifCli + voucher;
    },
    totalEnElCosto: (precioVenta: number, totalPct: number) => {
      return precioVenta * (totalPct / 100);
    },
    precioFinal: (precioVenta: number, totalEnElCosto: number) => {
      return precioVenta + totalEnElCosto;
    }
  }
};
