import PolicyLayout, { policyConfig } from "@/components/layout/policy-layout";

export default function ContactUs() {
    return (
        <PolicyLayout title="Contact Us">
            <p>We are here to help you.</p>
            <h3>Get in Touch</h3>
            <p>If you have any questions about Nebula PDF, our tools, or your subscription, please contact us.</p>
            <ul>
                <li><strong>Email:</strong> {policyConfig.contactEmail}</li>
                <li><strong>Address:</strong> {policyConfig.address}</li>
                <li><strong>Operating Hours:</strong> Mon-Fri, 10 AM - 6 PM IST</li>
            </ul>
        </PolicyLayout>
    );
}
