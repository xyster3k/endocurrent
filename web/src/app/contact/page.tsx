import type { Metadata } from "next";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with EndoCurrent. Have a question, suggestion, or want to collaborate? We'd love to hear from you.",
  openGraph: {
    title: "Contact EndoCurrent",
    description:
      "Get in touch with EndoCurrent. Have a question, suggestion, or want to collaborate?",
  },
};

export default function ContactPage() {
  return <ContactForm />;
}
