import LegalPage from "../components/LegalPage";
import usePageMeta from "../hooks/usePageMeta";

const Terms = () => {
  usePageMeta({
    title: "Terms of Service | Bubbles",
    description:
      "Read the terms that govern your use of Bubbles, including account rules, acceptable use, content, and AI features.",
    path: "/terms",
  });

  return (
    <LegalPage title="Terms of Service" updated="October 22, 2026">
      <p>
        These Terms govern your use of Bubbles. By creating an account or using
        the service, you agree to these Terms. If you do not agree, please do not
        use Bubbles.
      </p>

      <h2>1. Eligibility</h2>
      <p>
        You must be at least 13 years old, or the minimum age required in your
        country, to use Bubbles. If you use Bubbles on behalf of an organization,
        you confirm that you have authority to accept these Terms for that
        organization.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>Provide accurate account information and keep it up to date.</li>
        <li>Keep your password private and do not share your account.</li>
        <li>
          You are responsible for activity that happens through your account.
        </li>
        <li>
          Tell us promptly if you believe your account has been compromised.
        </li>
      </ul>

      <h2>3. Acceptable use</h2>
      <p>You agree not to use Bubbles to:</p>
      <ul>
        <li>Break the law or encourage illegal activity.</li>
        <li>Harass, threaten, stalk, or abuse another person.</li>
        <li>Send spam, scams, malware, or deceptive content.</li>
        <li>Impersonate someone else or misrepresent your identity.</li>
        <li>
          Upload content you do not have the right to share, including private
          information belonging to someone else.
        </li>
        <li>
          Attempt to access accounts, servers, or data you are not authorized to
          access.
        </li>
        <li>
          Interfere with the service, scrape it at scale, or bypass security and
          rate limits.
        </li>
        <li>
          Use Bubbles AI to generate content that violates these Terms or
          applicable law.
        </li>
      </ul>

      <h2>4. Your content</h2>
      <p>
        You keep ownership of the content you create and share. You give Bubbles
        permission to store, transmit, and display that content only as needed to
        provide the service, including delivering messages to the people in your
        conversations.
      </p>
      <p>
        You are responsible for the content you send. Do not share content that
        you do not have permission to share.
      </p>

      <h2>5. AI features</h2>
      <p>
        Bubbles AI can generate text, summaries, and other responses. AI output
        may be inaccurate, incomplete, or inappropriate. It is not professional
        advice. Review AI output before relying on it, and do not submit sensitive
        information you are not comfortable sharing with our AI provider.
      </p>

      <h2>6. Calls, voice messages, and media</h2>
      <p>
        You must have the consent required by law before recording a call or
        sharing someone else&apos;s voice, image, or personal information. Do not
        use calls or voice messages to harass or deceive others.
      </p>

      <h2>7. Privacy</h2>
      <p>
        Our <a href="/privacy">Privacy Policy</a> explains how we collect and use
        information. It is part of these Terms.
      </p>

      <h2>8. Termination</h2>
      <p>
        You may stop using Bubbles at any time. We may suspend or terminate access
        if you violate these Terms, if required by law, or if necessary to protect
        the service or other users. Where reasonable, we will explain the reason.
      </p>

      <h2>9. Disclaimers</h2>
      <p>
        Bubbles is provided on an &quot;as is&quot; and &quot;as available&quot;
        basis. We do not guarantee uninterrupted or error-free operation, and we
        do not guarantee that messages will always be delivered immediately or
        that AI output will be accurate.
      </p>

      <h2>10. Limitation of liability</h2>
      <p>
        To the extent permitted by law, Bubbles is not liable for indirect,
        incidental, special, or consequential damages, or for lost data, profits,
        or opportunities arising from your use of the service. Nothing in these
        Terms limits rights that cannot legally be limited.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms as the service changes. The date at the top of
        this page shows the latest version. Continued use of Bubbles after an
        update means you accept the revised Terms.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms can be sent to{" "}
        <a href="mailto:sanujaisonr@gmail.com">the Bubbles support inbox</a>.
      </p>
    </LegalPage>
  );
};

export default Terms;
