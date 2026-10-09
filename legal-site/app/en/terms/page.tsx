import type { Metadata } from 'next';
import { LegalLayout } from '../../legal-layout';
import { pageMetadata } from '../../metadata';

export const dynamic = 'force-static';

export const metadata: Metadata = pageMetadata(
  'en',
  'terms',
  'Terms of Use',
  'Terms of use for the Düğün Planım app, user responsibilities and the limits of advice.',
);
export default function TermsPageEn() {
  return (
    <LegalLayout
      locale="en"
      page="terms"
      eyebrow="Terms"
      title="Terms of Use"
      intro="This draft explains the basic framework for using the Düğün Planım app for personal planning."
    >
      <h2>1. Scope of the service</h2>
      <p>
        Düğün Planım is a tool that lets you organize task, guest, budget, table, vendor and note information on your
        device. It does not provide an account or a cloud sync service.
      </p>
      <h2>2. User responsibility</h2>
      <p>
        You are responsible for the accuracy of the information you enter, device security, taking regular backups,
        vendor contracts and verifying actual payment records.
      </p>
      <h2>3. Not advice</h2>
      <p>
        The app does not provide professional wedding, legal or financial advice. Budget summaries are mathematical
        presentations based only on the amounts you enter.
      </p>
      <h2>4. Acceptable use</h2>
      <p>
        You may not use the app for unlawful purposes, in a way that infringes the rights of third parties, or in a way
        that endangers device security.
      </p>
      <h2>5. Liability and changes</h2>
      <p>
        To the extent permitted by law, no warranty is given for indirect damages or for consequences arising from
        incorrect information entered by the user. Final publisher details, the governing law and dispute provisions
        should be verified with a legal advisor before release.
      </p>
    </LegalLayout>
  );
}
