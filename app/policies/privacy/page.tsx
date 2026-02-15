import PolicyLayout, { policyConfig } from "@/components/layout/policy-layout";

export default function PrivacyPolicy() {
    return (
        <PolicyLayout title="Privacy Policy">
            <p>Last Updated: {new Date().toLocaleDateString()}</p>
            <p>At {policyConfig.companyName}, we take your privacy seriously.</p>

            <h3>1. Information We Collect</h3>
            <p>We collect basic account information (email) for authentication. All tools are completely free to use.</p>

            <h3>2. File Security</h3>
            <p>Files uploaded to our tools are processed in memory and automatically deleted after processing. We do not permanently store your documents.</p>

            <h3>3. Cookies</h3>
            <p>We use cookies for authentication and to remember your preferences.</p>

            <h3>4. Contact</h3>
            <p>For privacy concerns, email us at {policyConfig.contactEmail}.</p>
        </PolicyLayout>
    );
}
