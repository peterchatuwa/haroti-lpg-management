import { CONTACT_EMAIL, CONTACT_PHONES } from '../config/contact';

export const TermsPage = () => {
  return (
    <div className="bg-haroti-paper">
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Terms of Use</h1>
          <p className="text-haroti-muted mb-8">Last Updated: August 5, 2026</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-haroti-ink/90">
                By accessing and using the Haroti Gas website (harotiholdingslimited.com), you accept 
                and agree to be bound by these Terms of Use. If you do not agree, please do not use 
                this website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Website Use</h2>
              <p className="text-haroti-ink/90 mb-3">You agree to use this website only for lawful purposes and in a way that does not:</p>
              <ul className="list-disc list-inside space-y-2 text-haroti-ink/90">
                <li>Infringe the rights of others</li>
                <li>Restrict or inhibit anyone else's use of the website</li>
                <li>Transmit harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to any part of the website</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. Intellectual Property</h2>
              <p className="text-haroti-ink/90">
                All content on this website, including text, graphics, logos, images, and software, 
                is the property of Haroti Holdings Limited or its licensors and is protected by 
                Malawian and international copyright laws. You may not reproduce, distribute, or 
                create derivative works without written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. PAYC Programme Terms</h2>
              <p className="text-haroti-ink/90 mb-3">Use of the Pay-As-You-Cook programme is subject to separate terms and conditions provided during enrollment, including:</p>
              <ul className="list-disc list-inside space-y-2 text-haroti-ink/90">
                <li>Payment obligations and schedules</li>
                <li>Equipment use and maintenance requirements</li>
                <li>Safety compliance</li>
                <li>Account termination conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Franchise Applications</h2>
              <p className="text-haroti-ink/90">
                Submission of a franchise application does not guarantee approval or create any 
                contractual obligation. Haroti Gas reserves the right to accept or decline applications 
                at its sole discretion. Approved franchises are subject to separate franchise agreements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Job Applications</h2>
              <p className="text-haroti-ink/90">
                Information provided in job applications will be used solely for recruitment purposes. 
                Submission of an application does not guarantee an interview or employment offer. 
                All hiring decisions are at Haroti Gas's discretion.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-haroti-ink/90">
                This website is provided "as is" without warranties of any kind. While we strive for 
                accuracy, we do not warrant that the website will be error-free, uninterrupted, or 
                free from viruses or other harmful components.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
              <p className="text-haroti-ink/90">
                Haroti Holdings Limited shall not be liable for any indirect, incidental, special, 
                or consequential damages arising from your use of this website or services, to the 
                fullest extent permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. External Links</h2>
              <p className="text-haroti-ink/90">
                This website may contain links to third-party websites. We are not responsible for 
                the content, privacy practices, or terms of use of external sites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Privacy</h2>
              <p className="text-haroti-ink/90">
                Your use of this website is also governed by our Privacy Policy. Please review it 
                to understand how we collect, use, and protect your personal information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">11. Modifications</h2>
              <p className="text-haroti-ink/90">
                Haroti Gas reserves the right to modify these Terms of Use at any time. Changes will 
                be effective immediately upon posting on this page. Continued use of the website after 
                changes constitutes acceptance of the modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">12. Governing Law</h2>
              <p className="text-haroti-ink/90">
                These Terms of Use are governed by the laws of Malawi. Any disputes arising from 
                these terms shall be subject to the exclusive jurisdiction of Malawian courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">13. Contact Information</h2>
              <p className="text-haroti-ink/90">
                For questions about these Terms of Use, contact:
              </p>
              <div className="mt-4 p-6 bg-haroti-paper rounded-lg">
                <p className="font-semibold">Legal Department</p>
                <p className="text-haroti-ink/90">Haroti Holdings Limited</p>
                <p className="text-haroti-ink/90">
                  Email:{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className="text-haroti-forest hover:text-haroti-orange">
                    {CONTACT_EMAIL}
                  </a>
                </p>
                {CONTACT_PHONES.map((phone) => (
                  <p key={phone.href} className="text-haroti-ink/90">
                    Phone:{' '}
                    <a href={`tel:${phone.href}`} className="text-haroti-forest hover:text-haroti-orange">
                      {phone.display}
                    </a>
                  </p>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};
