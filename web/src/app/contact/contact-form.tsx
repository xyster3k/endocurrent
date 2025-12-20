"use client";

import { useState } from "react";
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react";

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          Contact Us
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-300">
          Have a question, suggestion, or want to collaborate? We&apos;d love to hear from you.
        </p>
      </div>

      {status === "success" ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-800 dark:bg-green-900/20">
          <CheckCircle className="mx-auto h-12 w-12 text-green-600 dark:text-green-400" />
          <h2 className="mt-4 text-xl font-semibold text-green-800 dark:text-green-200">
            Message Sent!
          </h2>
          <p className="mt-2 text-green-700 dark:text-green-300">
            Thank you for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-6 rounded-full bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            Send Another Message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {status === "error" && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p>{errorMessage}</p>
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="subject" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Subject
            </label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="">Select a subject</option>
              <option value="General Inquiry">General Inquiry</option>
              <option value="Article Suggestion">Article Suggestion</option>
              <option value="Collaboration">Collaboration</option>
              <option value="Feedback">Feedback</option>
              <option value="Technical Issue">Technical Issue</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder-slate-500"
              placeholder="Your message..."
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading"}
            className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "loading" ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                Send Message
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
