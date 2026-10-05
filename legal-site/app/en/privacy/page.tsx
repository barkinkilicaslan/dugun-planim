import type { Metadata } from 'next';
import { LegalLayout } from '../../legal-layout';
import { pageMetadata } from '../../metadata';
export const metadata: Metadata = pageMetadata(
  'en',
  'privacy',
  'Privacy Policy',
  'Düğün Planım privacy policy: your data stays on your device; there are no accounts or tracking.',
);
export default function PrivacyPageEn() {
  return (
    <LegalLayout
      locale="en"
      page="privacy"
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="Düğün Planım is designed to keep your personal planning data on your device."
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
        When you create a JSON backup, CSV or PDF, you choose the destination yourself on the operating system’s secure
        share screen. These files are subject to the rules of the destination you choose and cannot be managed remotely
        by the app.
      </p>
      <h2>5. Retention and deletion</h2>
      <p>
        Data is kept locally until you delete it or uninstall the app. The “Delete all my data” action in Settings
        clears app data and local reminders after two confirmations.
      </p>
      <h2>6. Children’s privacy and changes</h2>
      <p>
        The app is not specifically aimed at children. If the policy changes, the new text and effective date will be
        published on this page. Final publisher contact details must be added before the store release.
      </p>
    </LegalLayout>
  );
}
