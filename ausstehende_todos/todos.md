# Ausstehende Todos

## Sicherheit

### [ ] Audio-Bucket auf Private + Signed URLs umstellen

**Priorität:** Mittel – vor Produktivstart erledigen

**Aktueller Stand:**
- Supabase Storage Bucket `audio-files` ist **public**
- Jeder mit dem URL (enthält `userId/documentId`) kann die Datei abrufen

**Geplante Lösung:**
- Bucket auf **private** umstellen
- In `src/app/audio/[id]/page.tsx` beim Seitenaufruf eine Signed URL (60 Min. Laufzeit) über `supabase.storage.from('audio-files').createSignedUrl(path, 3600)` generieren
- Signed URL an `AudioPlayerClient` übergeben statt der permanenten Public URL

**Betroffene Dateien:**
- `src/app/audio/actions.ts` → `getPublicUrl()` durch `createSignedUrl()` ersetzen
- `src/app/audio/[id]/page.tsx` → Signed URL beim Laden generieren

---

## Features / Erweiterungen

### [ ] Zwei-Stimmen-Podcast (Dialog-Format)

Aktuell wird das Audio mit einer einzelnen Stimme (Kore) generiert.
NotebookLM-Stil mit zwei Stimmen (Host A + Host B) wäre möglich wenn:
- Script explizit in `[Host A]: ...` und `[Host B]: ...` Blöcke aufgeteilt wird
- Jeder Block separat mit anderer Stimme (z.B. Kore + Charon) synthetisiert wird
- PCM-Buffers zusammengefügt werden

### [ ] Offline-Funktion / Download-Button

Schüler sollen Audio-Dateien herunterladen können um sie offline zu hören.

### [ ] Lernkarten-Bilder

Lernkarten unterstützen aktuell nur Text. Bilder/Diagramme auf den Karten wären pädagogisch wertvoll.
