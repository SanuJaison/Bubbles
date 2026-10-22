import LegalPage from "../components/LegalPage";

const Privacy = () => (
  <LegalPage title="Privacy Policy" updated="October 22, 2026">
    <p>
      Bubbles is a messaging application for one-to-one chats, group
      conversations, calls, and AI-assisted features. This policy explains what
      information we collect, how we use it, and the choices you have. By using
      Bubbles, you agree to the practices described here.
    </p>

    <h2>1. Information we collect</h2>
    <p>
      <strong>Account information.</strong> When you create an account we
      collect your name, username, email address, and password. Passwords are
      stored as one-way hashes, never as plain text. If you sign in with Google,
      we receive your Google account identifier, name, email address, and
      profile picture.
    </p>
    <p>
      <strong>Content you provide.</strong> This includes messages, group names,
      profile details, uploaded images and files, voice messages, and any
      prompts or content you submit to Bubbles AI. Messages are stored so they
      can be delivered to the people in your conversations.
    </p>
    <p>
      <strong>Technical information.</strong> We may collect IP address, browser
      and device information, timestamps, and security logs used to operate and
      protect the service.
    </p>
    <p>
      <strong>Preferences.</strong> We store settings such as your theme,
      wallpaper, notification choices, and privacy preferences.
    </p>

    <h2>2. How we use information</h2>
    <ul>
      <li>Create and secure your account, including email verification.</li>
      <li>Deliver messages and real-time updates to your conversations.</li>
      <li>Operate calls, file sharing, and AI-assisted features.</li>
      <li>Send verification and password-reset emails.</li>
      <li>Prevent abuse, investigate reports, and enforce our Terms.</li>
      <li>Maintain, troubleshoot, and improve the service.</li>
      <li>Comply with legal obligations.</li>
    </ul>

    <h2>3. Legal bases</h2>
    <p>
      Where required by law, we process information because it is necessary to
      provide the service you requested, because we have a legitimate interest
      in keeping Bubbles safe and functional, because you consented, or because
      the law requires it.
    </p>

    <h2>4. How we share information</h2>
    <p>
      <strong>With other users.</strong> Your profile information and the
      messages you send are shared with the people in your chats and groups as
      part of the service.
    </p>
    <p>
      <strong>With service providers.</strong> We use trusted providers for
      hosting, databases, media storage, email delivery, Google sign-in, and AI
      processing. They receive only the information needed to perform those
      services.
    </p>
    <p>
      <strong>For legal and safety reasons.</strong> We may disclose information
      if required by law or if necessary to protect the rights, safety, and
      security of our users or the public.
    </p>
    <p>
      We do not sell your personal information. We do not use your private
      messages to serve advertising.
    </p>

    <h2>5. International transfers</h2>
    <p>
      Our providers may process information in countries other than yours. We
      take reasonable steps to ensure information remains protected when it is
      transferred.
    </p>

    <h2>6. Data retention</h2>
    <p>
      We keep account information while your account is active. Messages remain
      until you delete them, delete the relevant chat, or delete your account.
      Security logs may be retained for a limited period. Verification and
      password-reset links expire automatically.
    </p>

    <h2>7. Security</h2>
    <p>
      Passwords are hashed with bcrypt, reset and verification tokens are stored
      only as hashes, and traffic between your browser and Bubbles uses HTTPS.
      No system is completely secure, so please use a strong, unique password
      and keep it private.
    </p>

    <h2>8. Your choices and rights</h2>
    <ul>
      <li>Update your name, username, bio, and profile picture in Settings.</li>
      <li>Change your password at any time.</li>
      <li>Delete individual messages and chats.</li>
      <li>Request deletion of your account by contacting us.</li>
      <li>
        Depending on where you live, request access to, correction of, or a copy
        of your information.
      </li>
    </ul>

    <h2>9. Children</h2>
    <p>
      Bubbles is not intended for children under 13, or under the minimum age
      required in your country. If you believe a child has created an account,
      contact us and we will take appropriate action.
    </p>

    <h2>10. Changes to this policy</h2>
    <p>
      We may update this policy as the service changes. When we do, we will
      update the date at the top of this page. Continued use of Bubbles after an
      update means you accept the revised policy.
    </p>

    <h2>11. Contact</h2>
    <p>
      Questions or requests about privacy can be sent to{" "}
      <a href="mailto:sanujaisonr@gmail.com">sanujaisonr@gmail.com</a>.
    </p>
  </LegalPage>
);

export default Privacy;
