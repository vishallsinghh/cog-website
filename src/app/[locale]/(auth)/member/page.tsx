import { AuthShowcase } from "@/components/member/auth-showcase";
import { MemberAuth } from "@/components/member/member-auth";

export default function Page() {
    return (
        <main className="grid min-h-[680px] lg:grid-cols-[1.05fr_1fr]">
            <AuthShowcase />
            <section className="flex items-center justify-center bg-background px-4 py-8 sm:px-10 sm:py-12 lg:py-16">
                <div className="w-full max-w-md">
                    <MemberAuth />
                </div>
            </section>
        </main>
    );
}
