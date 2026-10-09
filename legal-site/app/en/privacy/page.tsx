import type { Metadata } from 'next';
import { LegalLayout } from '../../legal-layout';
import { pageMetadata } from '../../metadata';

export const dynamic = 'force-static';

export const metadata: Metadata = pageMetadata(
  'en',
  'privacy',
  'Privacy Policy',
  'Düğün Planım privacy policy: planning data is stored locally; device backups depend on operating system settings. No accounts or tracking.',
);
export default function PrivacyPageEn() {
  return (
    <LegalLayout
      locale="en"
      page="privacy"
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="Düğün Planım stores planning data in the app's local device area. Your operating system may include it in device backups depending on your settings."
    >
      <h2>1. Information collected and stored</h2>
      <p>
        Couple names, wedding date, tasks, guests, table assignments, budget and payment details, vendors and notes are
        stored in the app’s storage on your device only through your own input. Düğün Planım does not operate a user
        account or a data server.
      </p>
      <h2>2. Data transfer and tracking</h2>
      <p>
        App data is not sent to the developer’s server. No advertising, third-party analytics, behavioral tracking or
        cross-app tracking SDKs are used. The app does not request the advertising identifier. The language you choose
        in the app (automatic, Turkish or English) is stored only locally on your device and is not sent anywhere. There
        is no online RSVP service; there is no server or backend that collects replies.
      </p>
      <h2>3. Permissions</h2>
      <p>
        Notification permission is requested only after the benefit of local task reminders has been explained and only
        through your explicit choice. Contacts permission is requested only when you tap “Add guests from contacts” and
        after you have read why; only the name, phone number and email of the contacts you select are saved to your
        guest list, your address book as a whole is not copied, and no contact information is sent to a server. The file
        picker opens when you choose a backup, CSV file or invitation photo; the share, email, SMS and WhatsApp screens
        open only when you tap the relevant send or share button. The app never sends a message without your
        confirmation. With “Upload your own invitation”, the system photo or file picker opens; the app only accesses
        the image you choose and copies it into the app folder on your device, does not read your photo library as a
        whole, and does not send the image to a server. Access to location, camera and microphone is not requested.
      </p>
      <h2>4. Backups and sharing</h2>
      <p>
        When you create a JSON backup, CSV or PDF, you choose the destination yourself on the operating system’s share
        sheet. JSON backup files are not encrypted by the app and may contain personal details such as guest names,
        phone numbers and email addresses. Store or share them only somewhere you trust. These files are subject to the
        rules of the destination you choose and cannot be managed remotely by the app. Depending on your device backup
        settings, the operating system may include app data in an iCloud or Android device backup. Those backups are
        managed by Apple or Google; they are not received by a Düğün Planım account or developer server.
      </p>
      <h2>5. Retention and deletion</h2>
      <p>
        Data is kept locally until you delete it or uninstall the app. The “Delete all my data” action in Settings
        clears app data, the invitation images and photos you added on this device, local reminders, the temporary
        export files the app keeps in its cache and your chosen visual style after two confirmations.
      </p>
      <h2>6. Children’s privacy and changes</h2>
      <p>
        The app is not specifically aimed at children. If the policy changes, the new text and effective date will be
        published on this page. Final publisher contact details must be added before the store release.
      </p>
    </LegalLayout>
  );
}
