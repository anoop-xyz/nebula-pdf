import PolicyLayout, { policyConfig } from "@/components/layout/policy-layout";

export default function RefundPolicy() {
    return (
        <PolicyLayout title="Cancellation & Refund Policy">
            <p>Last Updated: {new Date().toLocaleDateString()}</p>

            <h3>1. Digital Products</h3>
            <p>Since we provide digital credits that are instantly available, we generally do not offer refunds once credits have been used.</p>

            <h3>2. Refunds</h3>
            <p>If you made a purchase by mistake and have NOT used any of the purchased credits, you may request a refund within 7 days. Contact {policyConfig.contactEmail}.</p>

            <h3>3. Cancellations</h3>
            <p>You can stop using our service at any time. Unused credits do not expire but are non-refundable after the 7-day window.</p>
        </PolicyLayout>
    );
}
