# Backups

Each folder here is a full copy of the database made with:

```bash
npm run backup
```

Restore one with:

```bash
npm run restore -- backup/<folder>
```

Add `--replace` to make the database exactly match the backup.
Files downloaded from the app (**Profile menu → Data Backup**) can be restored the same way:
`npm run restore -- path/to/kirpa-backup-....json`.

Backups contain private data (drivers, customers, logins), so the folders are not
pushed to GitHub. Copy them to Google Drive or a USB drive as well.
