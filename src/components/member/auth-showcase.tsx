import Image from "next/image";
import { HeartHandshakeIcon, ShieldCheckIcon, SmartphoneIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const highlights = [
    { icon: SmartphoneIcon, text: "Sign in with a one-time code. There is no password to remember." },
    { icon: ShieldCheckIcon, text: "Every account is reviewed and approved by COG." },
    { icon: HeartHandshakeIcon, text: "Serving KSI Jamaats across Gujarat since 1987." },
];

export function AuthShowcase() {
    return (
        <section className="relative isolate flex overflow-hidden bg-primary text-primary-foreground">
            <Image
                src="/images/community-hero.png"
                alt=""
                fill
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
                className="-z-20 object-cover object-[center_40%]"
            />
            <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/95 via-primary/90 to-primary/70" />
            <div className="absolute -right-24 -bottom-24 -z-10 size-96 rounded-full bg-accent/20 blur-3xl" />

            <div className="flex w-full flex-col justify-between gap-12 px-6 py-9 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
                <div className="flex flex-col gap-4 lg:gap-6">
                    <p className="text-xs font-bold tracking-[0.3em] text-accent">
                        THE COUNCIL OF GUJARAT
                    </p>
                    <h1 className="max-w-lg font-heading text-3xl leading-[1.1] font-normal tracking-tight sm:text-4xl lg:text-5xl">
                        One account for everything we do{" "}
                        <span className="text-accent italic">together.</span>
                    </h1>
                    <div className="h-0.5 w-16 bg-accent" />
                    <p className="hidden max-w-md text-base leading-relaxed sm:block text-primary-foreground/80">
                        Your profile, assistance applications, donations and notifications, all in
                        one secure place.
                    </p>
                </div>

                <div className="hidden flex-col gap-6 lg:flex">
                    <Separator className="bg-primary-foreground/20" />
                    <ul className="flex flex-col gap-5">
                        {highlights.map(({ icon: Icon, text }) => (
                            <li key={text} className="flex items-start gap-4">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 ring-1 ring-primary-foreground/20">
                                    <Icon className="size-5 text-accent" />
                                </span>
                                <span className="max-w-sm pt-2 text-sm leading-snug text-primary-foreground/85">
                                    {text}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
