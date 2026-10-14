import { notFound } from "next/navigation";

// Any unknown path under /en or /gu renders the localized not-found page.
export default function CatchAll() {
    notFound();
}
