import type { Metadata } from 'next';
import { LegalLayout } from '../../legal-layout';
import { pageMetadata } from '../../metadata';
export const metadata: Metadata = pageMetadata(
  'en',
  'data-retention',
  'Data Retention and Deletion',
  'How Düğün Planım data is stored, backed up and deleted on your device.',
);
export default function DataPageEn() {
  return (
    <LegalLayout
      locale="en"
      page="data-retention"
      eyebrow="Data control"
      title="Data Retention and Deletion"
      intro="In Düğün Planım, you manage the data life cycle."
    >
      <h2>Storage on your device</h2>
      <p>
        App data is stored in the local space that the operating system reserves for the app. There is no automatic
        server copy or cloud sync.
      </p>
      <h2>Portable backup</h2>
      <p>
        In Settings you can create a JSON backup that includes the app and schema version. When restoring, the file
        size, format, version and records are validated; your current data is only replaced after you confirm.
        Invitation designs are included in the backup, but the photos you added to invitations are not included in the
        backup file; you need to add the photos again after restoring. Invitation images you upload with “Upload your
        own invitation” are not included either; they are kept if you restore on the same device and must be uploaded
        again on another device.
      </p>
      <h2>Permanent deletion</h2>
      <p>
        The Settings → Delete all my data option clears the local database and scheduled notifications after two
        separate confirmations. Uninstalling the app also causes the operating system to delete the app’s storage.
      </p>
      <h2>Exported files</h2>
      <p>
        Backup, CSV or PDF files that you share remain in the location you chose. You need to delete those copies
        separately from the relevant file or cloud service.
      </p>
    </LegalLayout>
  );
}
