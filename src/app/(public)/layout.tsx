import { Shell } from "@/components/site-shell";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
    return <Shell>{children}</Shell>;
}
