export const PrivacyPage = () => {
  return (
    <div className="bg-haroti-paper">
      <section className="py-16">
        <div className="container-custom max-w-4xl">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-haroti-muted mb-8">Last Updated: August 5, 2026</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
              <p className="text-haroti-ink/90">
                Haroti Holdings Limited (trading as "Haroti Gas") is committed to protecting your privacy 
                and personal data. This Privacy Policy explains how we collect, use, store, and protect 
                your information in accordance with Malawi's data protection laws and our Environmental 
                and Social Safeguards Framework.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
              <p className="text-haroti-ink/90 mb-3">We collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 text-haroti-ink/90">
                <li><strong>Personal Information:</strong> Name, address, phone number, email, National ID</li>
                <li><strong>PAYC Programme Data:</strong> Usage data, payment history, account balance</li>
                <li><strong>Franchise Applications:</strong> Business information, references, location details</li>
                <li><strong>Job Applications:</strong> CV, cover letter, contact information, references</li>
                <li><strong>Website Usage:</strong> IP address, browser type, pages visited</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
              <p className="text-haroti-ink/90 mb-3">We use your information to:</p>
              <ul className="list-disc list-inside space-y-2 text-haroti-ink/90">
                <li>Provide PAYC programme services and LPG refills</li>
                <li>Process payments and manage your account</li>
                <li>Review franchise and job applications</li>
                <li>Respond to enquiries and provide customer support</li>
                <li>Improve our services and website</li>
                <li>Comply with legal obligations</li>
                <li>Send service updates and important notices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">4. Data Sharing and Disclosure</h2>
              <p className="text-haroti-ink/90">
                We do not sell or rent your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside space-y-2 text-haroti-ink/90 mt-3">
                <li>Payment processors for PAYC transactions</li>
                <li>Mobile money providers (Airtel Money, TNM Mpamba)</li>
                <li>Government authorities when required by law</li>
                <li>Carbon finance partners for impact verification (aggregated data only)</li>
                <li>Service providers under strict confidentiality agreements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
              <p className="text-haroti-ink/90">
                We implement appropriate technical and organizational measures to protect your data 
                from unauthorized access, loss, or misuse. All website connections use SSL/HTTPS 
                encryption. Customer and applicant data is stored securely with restricted access.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">6. Your Rights</h2>
              <p className="text-haroti-ink/90 mb-3">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-haroti-ink/90">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data (subject to legal obligations)</li>
                <li>Opt out of marketing communications</li>
                <li>File a complaint with relevant authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">7. Data Retention</h2>
              <p className="text-haroti-ink/90">
                We retain your data for as long as necessary to provide services, comply with legal 
                obligations, resolve disputes, and enforce agreements. PAYC account data is retained 
                for 7 years after account closure for financial compliance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">8. Cookies</h2>
              <p className="text-haroti-ink/90">
                Our website uses cookies to improve user experience and analyze website traffic. 
                You can control cookie settings through your browser.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">9. Changes to This Policy</h2>
              <p className="text-haroti-ink/90">
                We may update this Privacy Policy periodically. Changes will be posted on this page 
                with an updated "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-4">10. Contact Us</h2>
              <p className="text-haroti-ink/90">
                For questions about this Privacy Policy or to exercise your rights, contact:
              </p>
              <div className="mt-4 p-6 bg-haroti-paper rounded-lg">
                <p className="font-semibold">Data Protection Officer</p>
                <p className="text-haroti-ink/90">Haroti Holdings Limited</p>
                <p className="text-haroti-ink/90">Email: privacy@harotiholdingslimited.com</p>
                <p className="text-haroti-ink/90">Phone: +265 XXX XXX XXX</p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
};
