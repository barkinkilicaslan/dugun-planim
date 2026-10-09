import type { Metadata } from 'next';
import { LegalLayout } from '../../legal-layout';
import { pageMetadata } from '../../metadata';

export const dynamic = 'force-static';

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
        App data is stored in the local space that the operating system reserves for the app; the app does not operate
        its own server copy or sync service. Depending on your device backup settings, the operating system may include
        app data in an iCloud or Android device backup. Those backups are managed by the relevant platform, not received
        by the developer.
      </p>
      <h2>Portable backup</h2>
      <p>
        In Settings you can create a JSON backup that includes the app and schema version. When restoring, the file
        size, format, version and records are validated; your current data is only replaced after you confirm. JSON
        backup files are not encrypted by the app and may contain personal details; take care when storing or sharing
        them. Invitation designs are included in the backup, but the photos you added to invitations are not included in
        the backup file; you need to add the photos again after restoring. Invitation images you upload with “Upload
        your own invitation” are not included either; they are kept if you restore on the same device and must be
        uploaded again on another device.
      </p>
      <h2>Permanent deletion</h2>
      <p>
        The Settings → Delete all my data option clears the local database, the invitation images and photos you added
        on this device, scheduled notifications, the temporary export files the app keeps in its cache and your chosen
        visual style after two separate confirmations. If a leftover cannot be removed, the app tells you and retries on
        its next launch. Uninstalling the app also causes the operating system to delete the app’s storage.
      </p>
      <h2>Exported files</h2>
      <p>
        Temporary copies created for sharing are kept briefly in the app cache and deleted automatically at the next
        export, at the next launch, or when you return to the app after an hour or more. Backup, CSV or PDF files that
        you share remain in the location you chose. You need to delete those copies separately from the relevant file or
        cloud service.
      </p>
    </LegalLayout>
  );
}
