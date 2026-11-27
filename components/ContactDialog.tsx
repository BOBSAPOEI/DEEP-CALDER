"use client";

import { useEffect, useRef, useState } from "react";
import { SITE } from "@/lib/content";
import { useSite } from "./SiteProvider";

const NEEDS = ["Immersive web", "Website", "E-commerce", "Film & AI"];
const BUDGETS = ["Under €5k", "€5k–10k", "€10k–20k", "€20k+", "Not sure yet"];
const TIMELINES = ["As soon as possible", "1–3 months", "3–6 months", "Just exploring"];

function Chips({
  name,
  options,
  value,
  onChange,
  multi,
}: {
  name: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  multi?: boolean;
}) {
  return (
    <div className="cf-chips" role={multi ? "group" : "radiogroup"} aria-label={name}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            role={multi ? undefined : "radio"}
            aria-checked={multi ? undefined : on}
            aria-pressed={multi ? on : undefined}
            className={`cf-chip ${on ? "is-on" : ""}`}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : [o])}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function ContactDialog() {
  const { contactOpen, closeContact } = useSite();
  const [needs, setNeeds] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [sent, setSent] = useState(false);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!contactOpen) return;
    const t = setTimeout(() => first.current?.focus(), 400);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeContact();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [contactOpen, closeContact]);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const body = [
      `Name: ${f.get("name")}`,
      `Email: ${f.get("email")}`,
      `Brand: ${f.get("brand") || "-"}`,
      `Website: ${f.get("website") || "-"}`,
      `Needs: ${needs.join(", ") || "-"}`,
      `Budget: ${budget[0] || "-"}`,
      `Timeline: ${timeline[0] || "-"}`,
      "",
      String(f.get("message") || ""),
    ].join("\n");
    window.location.href = `mailto:${SITE.email}?subject=${encodeURIComponent("New project — " + f.get("name"))}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <div
      className={`cf ${contactOpen ? "is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cf-title"
      aria-hidden={!contactOpen}
      id="contact"
    >
      <div className="cf-scrim" onClick={closeContact} />
      <div className="cf-panel" data-lenis-prevent>
        <div className="cf-head">
          <p className="cf-kick">Start a project</p>
          <button type="button" className="cf-close" onClick={closeContact} aria-label="Close">
            <span />
            <span />
          </button>
        </div>
        {sent ? (
          <div className="cf-done">
            <h2>Thank you.</h2>
            <p>Your email app should have opened with the brief. We reply personally, usually within two working days.</p>
            <button type="button" className="cf-send" onClick={() => setSent(false)}>
              Back to the form
            </button>
          </div>
        ) : (
          <form className="cf-form" onSubmit={submit}>
            <h2 id="cf-title">Tell us about it</h2>
            <div className="cf-row">
              <label className="cf-field">
                <span>Name</span>
                <input ref={first} name="name" required autoComplete="name" />
              </label>
              <label className="cf-field">
                <span>Your email</span>
                <input name="email" type="email" required autoComplete="email" />
              </label>
            </div>
            <div className="cf-row">
              <label className="cf-field">
                <span>Brand or company</span>
                <input name="brand" autoComplete="organization" />
              </label>
              <label className="cf-field">
                <span>Website (if any)</span>
                <input name="website" type="url" placeholder="https://" />
              </label>
            </div>
            <fieldset className="cf-set">
              <legend>What do you need?</legend>
              <Chips name="What do you need?" options={NEEDS} value={needs} onChange={setNeeds} multi />
            </fieldset>
            <fieldset className="cf-set">
              <legend>Budget</legend>
              <Chips name="Budget" options={BUDGETS} value={budget} onChange={setBudget} />
            </fieldset>
            <fieldset className="cf-set">
              <legend>Timeline</legend>
              <Chips name="Timeline" options={TIMELINES} value={timeline} onChange={setTimeline} />
            </fieldset>
            <label className="cf-field">
              <span>Tell us about the project</span>
              <textarea name="message" rows={4} />
            </label>
            <button type="submit" className="cf-send">
              Send <span aria-hidden="true">→</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
