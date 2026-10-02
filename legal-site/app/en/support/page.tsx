import type { Metadata } from 'next';
import { LegalLayout } from '../../legal-layout';
import { pageMetadata } from '../../metadata';
import { siteConfig } from '../../../site-config';
export const metadata: Metadata = pageMetadata(
  'en',
  'support',
  'Support and FAQ',
  'Support for Düğün Planım: frequently asked questions about backups, notifications, language and deleting data.',
);
export default function SupportPageEn() {
  return (
    <LegalLayout
      locale="en"
      page="support"
      eyebrow="Help center"
      title="Support and Frequently Asked Questions"
      intro="Short answers to keep your plan safe and to solve common problems."
    >
      <h2>Where is my data?</h2>
      <p>Your data is stored in the app’s storage on this device. It is not sent to the developer’s server.</p>
      <h2>How do I move to a new device?</h2>
      <p>
        On the old device, use Settings → Create backup file. Save the file to a safe destination, choose it on the new
        device with “Restore from backup” and confirm the summary. Invitation photos are not included in the backup; you
        need to add them again on the new device.
      </p>
      <h2>Why did I not get a notification?</h2>
      <p>
        Check the notification permission for Düğün Planım in the system settings. The task must have a due date in the
        future and the one-day-before reminder must be turned on in the edit screen. Even if the permission is declined,
        the other features of the app keep working.
      </p>
      <h2>How do I change the app language?</h2>
      <p>
        In Settings → Language you can choose Automatic, Türkçe or English. Automatic uses your device language;
        unsupported languages are shown in Turkish. Names, notes and invitation text you write are not translated.
      </p>
      <h2>I get an invalid backup warning</h2>
      <p>
        Only unmodified JSON backups created by Düğün Planım, in a supported schema version, are accepted. A faulty file
        does not change your existing data.
      </p>
      <h2>What are the guest CSV headers?</h2>
      <p>
        The order must be: ad (name), telefon (phone), taraf (side), kisi_sayisi (number of people), cocuk_sayisi
        (number of children), rsvp, grup (group), yemek_alerji (meal/allergy), notlar (notes). The header names must be
        written exactly as shown, in Turkish.
      </p>
      <h2>Contact</h2>
      <p>
        Support address: <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>. You can reach us
        at this address for support requests about the app.
      </p>
    </LegalLayout>
  );
}
