import { useEffect, useRef, useState } from 'react';
import { parseBackup, shareBackup } from '../lib/backup';
import { fmtDE, useToday } from '../lib/dates';
import { RoutinesSheet } from '../sheets/RoutinesSheet';
import { useStore } from '../lib/store';
import type { BackupFile, ThemeMode } from '../lib/types';
import { Segmented, Switch } from '../components/Fields';
import { IconBell, IconChevronRight, IconImport, IconInfo, IconLock, IconRepeat, IconShare, IconStack } from '../components/Icons';
import { Page } from '../components/Page';
import { Sheet } from '../components/Sheet';

export const VERSION = '2.0.0';

export function MoreView() {
  const { state, actions } = useStore();
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [pending, setPending] = useState<BackupFile | null>(null);
  const [guide, setGuide] = useState(false);
  const [routines, setRoutines] = useState(false);
  const today = useToday();
  const file = useRef<HTMLInputElement>(null);

  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null));
  }, []);

  const exportNow = async () => {
    try {
      if (await shareBackup(actions.exportBackup())) actions.toast('Backup erstellt');
    } catch {
      actions.toast('Backup konnte nicht erstellt werden');
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      setPending(parseBackup(await f.text()));
    } catch (err) {
      actions.toast(err instanceof SyntaxError ? 'Datei ist kein gültiges JSON' : (err as Error).message);
    } finally {
      if (file.current) file.current.value = '';
    }
  };

  const doImport = async (mode: 'replace' | 'merge') => {
    if (!pending) return;
    try {
      await actions.importBackup(pending, mode);
      actions.toast(mode === 'replace' ? 'Backup wiederhergestellt' : 'Backup zusammengeführt');
    } catch {
      actions.toast('Import fehlgeschlagen');
    }
    setPending(null);
  };

  const nTasks = Object.keys(state.tasks).length;
  const nHabits = Object.keys(state.habits).length;

  return (
    <Page title="Mehr">
      <div className="group-header">Darstellung</div>
      <div className="group pad">
        <Segmented<ThemeMode>
          label="Darstellung"
          value={state.settings.theme}
          onChange={theme => actions.setSettings({ theme })}
          options={[
            { value: 'auto', label: 'Automatisch' },
            { value: 'light', label: 'Hell' },
            { value: 'dark', label: 'Dunkel' },
          ]}
        />
      </div>

      <div className="group-header">Tagesplan</div>
      <div className="group">
        <div className="group-row">
          <span className="round-icon" style={{ background: 'var(--orange)' }}><IconRepeat size={17} /></span>
          <span className="grow">
            Unerledigtes mitnehmen
            <span className="row-sub">Offene Aufgaben vergangener Tage landen auf heute</span>
          </span>
          <Switch label="Unerledigtes mitnehmen" checked={state.settings.carryOver} onChange={v => actions.setSettings({ carryOver: v })} />
        </div>
      </div>

      <div className="group-header">Backup</div>
      <div className="group">
        <button type="button" className="group-row" onClick={exportNow}>
          <span className="round-icon" style={{ background: 'var(--blue)' }}><IconShare size={17} /></span>
          <span className="grow">Backup exportieren</span>
          <IconChevronRight size={16} className="chev" />
        </button>
        <button type="button" className="group-row" onClick={() => file.current?.click()}>
          <span className="round-icon" style={{ background: 'var(--green)' }}><IconImport size={17} /></span>
          <span className="grow">Backup importieren</span>
          <IconChevronRight size={16} className="chev" />
        </button>
        <div className="group-row">
          <span className="round-icon" style={{ background: 'var(--gray)' }}><IconLock size={17} /></span>
          <span className="grow">Dauerhafter Speicher</span>
          <span className="row-detail">{persisted ? 'Aktiv' : persisted === false ? 'Nicht bestätigt' : 'Unbekannt'}</span>
        </div>
      </div>
      <p className="hint">
        Alle Daten liegen nur auf diesem Gerät. Exportiere regelmäßig ein Backup, zum Beispiel in iCloud Drive.
      </p>
      <input ref={file} type="file" accept=".json,application/json" hidden onChange={e => onFile(e.target.files?.[0])} />

      <div className="group-header">Routinen</div>
      <div className="group">
        <button type="button" className="group-row" onClick={() => setRoutines(true)}>
          <span className="round-icon" style={{ background: 'var(--teal)' }}><IconStack size={17} /></span>
          <span className="grow">Routinen</span>
          <span className="row-detail">{Object.keys(state.routines).length}</span>
          <IconChevronRight size={16} className="chev" />
        </button>
      </div>
      <RoutinesSheet open={routines} date={today} onClose={() => setRoutines(false)} />

      <div className="group-header">Erinnerungen</div>
      <div className="group">
        <button type="button" className="group-row" onClick={() => setGuide(true)}>
          <span className="round-icon" style={{ background: 'var(--red)' }}><IconBell size={17} /></span>
          <span className="grow">Kurzbefehl einrichten</span>
          <IconChevronRight size={16} className="chev" />
        </button>
      </div>

      <div className="group-header">Info</div>
      <div className="group">
        <div className="group-row">
          <span className="round-icon" style={{ background: 'var(--gray)' }}><IconInfo size={17} /></span>
          <span className="grow">Version</span>
          <span className="row-detail">{VERSION} · {__BUILD_DATE__}</span>
        </div>
        <div className="group-row">
          <span className="grow">Einträge</span>
          <span className="row-detail">{nTasks} Aufgaben · {nHabits} Gewohnheiten</span>
        </div>
      </div>

      <Sheet
        open={!!pending}
        onClose={() => setPending(null)}
        title="Backup importieren"
        left={<button type="button" className="sheet-btn" onClick={() => setPending(null)}>Abbrechen</button>}
      >
        {pending && (
          <>
            <p className="hint">
              Backup vom {fmtDE(pending.exportedAt.slice(0, 10))}: {pending.tasks.length} Aufgaben,{' '}
              {pending.habits.length} Gewohnheiten, {pending.routines.length} Routinen, {pending.progress.length} Fortschrittseinträge.
            </p>
            <div className="group">
              <button type="button" className="group-row" onClick={() => doImport('merge')}>
                <span className="grow action">
                  Zusammenführen
                  <span className="row-sub">Vorhandenes bleibt, jeweils der neuere Stand gewinnt</span>
                </span>
              </button>
              <button
                type="button" className="group-row"
                onClick={() => confirm('Alle aktuellen Daten durch das Backup ersetzen?') && doImport('replace')}
              >
                <span className="grow danger">
                  Alles ersetzen
                  <span className="row-sub">Aktuelle Daten werden überschrieben</span>
                </span>
              </button>
            </div>
          </>
        )}
      </Sheet>

      <Sheet
        open={guide}
        onClose={() => setGuide(false)}
        title="Kurzbefehl"
        right={<button type="button" className="sheet-btn strong" onClick={() => setGuide(false)}>Fertig</button>}
      >
        <p className="hint">
          Tagesplan schickt selbst keine Mitteilungen. Mit diesem Kurzbefehl legt „In Erinnerungen übernehmen“ eine
          Erinnerung in der Apple-App „Erinnerungen“ an. Einmal einrichten, ca. 2 Minuten:
        </p>
        <ol className="steps group">
          <li>Öffne die App <b>Kurzbefehle</b> und tippe auf <b>+</b>.</li>
          <li>Nenne den Kurzbefehl genau <b>Tagesplan Erinnerung</b>.</li>
          <li>Füge <b>Text teilen</b> hinzu (Suche: „teilen“). Text: <b>Kurzbefehleingabe</b>, teilen bei <b>Neue Zeilen</b>.</li>
          <li>Füge <b>Objekt aus Liste abrufen</b> hinzu: <b>Erstes Objekt</b> – das ist der Titel.</li>
          <li>Füge nochmals <b>Objekt aus Liste abrufen</b> hinzu: <b>Letztes Objekt</b> – das sind Datum und Uhrzeit.</li>
          <li>Füge <b>Erinnerung hinzufügen</b> hinzu. Als Titel das erste Objekt wählen, bei <b>Fällig</b> (Erinnern am Tag) das letzte Objekt.</li>
          <li>Fertig. Im Detail eines Eintrags öffnet <b>In Erinnerungen übernehmen</b> jetzt diesen Kurzbefehl.</li>
        </ol>
        <p className="hint">
          Übergeben wird zum Beispiel: „Training“ in der ersten Zeile und „30.10.2026 18:00“ in der zweiten. Einträge im Eingang haben kein Datum –
          dann ist das letzte Objekt der Titel und die Erinnerung bekommt keine Fälligkeit.
        </p>
      </Sheet>
    </Page>
  );
}
