import { Note } from '../types';

export const INITIAL_NOTES: Note[] = [
  {
    id: 'note-1',
    title: 'Reunião Armas',
    content: 'On Line - 20:00h',
    date: '2026-08-27',
    time: '20:00',
    category: 'Reunião',
    location: 'Google Meet / Online',
    createdAt: '2026-08-26T11:21:00',
    createdBy: 'imc.sidnei@gmail.com'
  },
  {
    id: 'note-2',
    title: 'Pub Cruzeiro do Oeste',
    content: 'Feira do Produtor - Encontro de Carros antigos - 10:00h',
    date: '2026-08-30',
    time: '10:00',
    category: 'Evento',
    location: 'Feira do Produtor',
    createdAt: '2026-08-28T15:40:00',
    createdBy: 'imc.sidnei@gmail.com'
  },
  {
    id: 'note-3',
    title: 'Pub da Independência',
    content: 'Concentração no Posto às 09:00h - Encontro regional e confraternização',
    date: '2026-09-07',
    time: '09:00',
    category: 'Pub',
    location: 'Posto Central',
    createdAt: '2026-09-01T09:15:00',
    createdBy: 'imc.sidnei@gmail.com'
  }
];
