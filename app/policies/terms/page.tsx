import PolicyLayout, { policyConfig } from "@/components/layout/policy-layout";

export default function TermsConditions() {
    return (
        <PolicyLayout title="Terms and Conditions">
            <p>Last Updated: {new Date().toLocaleDateString()}</p>

            <h3>1. Acceptance of Terms</h3>
            <p>By accessing {policyConfig.companyName}, you agree to be bound by these terms.</p>

            <h3>2. Usage License</h3>
            <p>You are granted a limited license to access and use our PDF tools for personal or commercial use according to your credit plan.</p>

            <h3>3. Limitations</h3>
            <p>You may not use our service for any illegal purpose or to process illegal content.</p>

            <h3>4. Liability</h3>
            <p>{policyConfig.companyName} is provided "as is". We are not liable for any data loss or damages arising from the use of our tools.</p>
        </PolicyLayout>
    );
}
