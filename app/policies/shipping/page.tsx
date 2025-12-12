import PolicyLayout from "@/components/layout/policy-layout";

export default function ShippingPolicy() {
    return (
        <PolicyLayout title="Shipping & Delivery Policy">
            <p>Last Updated: {new Date().toLocaleDateString()}</p>

            <h3>Digital Service</h3>
            <p>Nebula PDF provides digital tools and credits. There is <strong>no physical shipping</strong> involved.</p>

            <h3>Delivery Timeline</h3>
            <p>Credits purchased are added to your account instantly (typically within seconds) after successful payment confirmation.</p>
        </PolicyLayout>
    );
}
