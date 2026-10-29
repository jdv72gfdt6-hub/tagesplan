export interface AddDefaults {
  kind: 'task' | 'habit';
  date: string | null;
  time: number | null;
}

export interface DetailTarget {
  kind: 'task' | 'habit';
  id: string;
  /** Tag, aus dem heraus geöffnet wurde (für Fortschritt und Erinnerung) */
  date: string;
}
