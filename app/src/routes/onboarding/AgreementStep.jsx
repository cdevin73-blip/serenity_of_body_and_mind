import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../../contexts/AuthContext";
import { Toast, useToast } from "../../components/Toast";

const AGREEMENT_VERSION = "2.0";

const SECTIONS = [
  {
    h: "1. Parties to This Agreement",
    p: [
      "This Client Services Agreement (\"Agreement\") is entered into between Caroline Devin, Nutritionist and Holistic Wellness Coach, doing business as Serenity of Body and Mind, LLC (Portland, Oregon), and the Client identified by the signature below.",
      "Coach does not provide medical diagnosis, medical treatment, psychotherapy, counseling, licensed nutrition services, physical therapy, or other regulated healthcare services. No physician-patient, therapist-client, or fiduciary relationship is created through this Agreement.",
    ],
  },
  {
    h: "2. Services Included",
    p: [
      "Personalized nutrition and wellness coaching via weekly virtual sessions (video call), access to the Serenity wellness app for habit tracking, daily journaling, and progress monitoring, an elimination guide and/or recipes as applicable to your program, food and self-care samples, book(s) chosen specifically for you, gift certificates for holistic services (Gold and Platinum programs only), and secure in-app messaging with Coach during available hours.",
    ],
  },
  {
    h: "3. Fees & Payment",
    p: [
      "Full payment is due prior to the first session unless a payment plan has been separately agreed upon in writing. Coach reserves the right to suspend services until all outstanding balances are paid in full.",
      "Invoices not paid within 7 days of the due date may result in a pause of services. Client agrees to reimburse reasonable collection costs, attorney fees, court costs, and interest permitted by law if legal action is required to collect unpaid amounts.",
      "Cancellations 48+ hours before a session: rescheduled at no charge. Less than 48 hours: session may be forfeited or charged in full. Client-initiated cancellation after the first session: refund of unused sessions less a 15% administrative fee. No refunds after 50% of program sessions are completed. Coach-initiated cancellations: full refund for unused sessions.",
    ],
  },
  {
    h: "4. Session Scheduling & Attendance",
    p: [
      "Client is responsible for scheduling sessions in advance to maintain program continuity. Sessions may be rescheduled with at least 48 hours notice; sessions not rescheduled within the program period are forfeited. Program sessions must be completed within the program period plus a 30-day extension window, after which unused sessions are forfeited without refund. Late arrival to a session does not extend it — the full session fee still applies. Neither party is in breach if a session cannot occur due to internet outages, platform failures, or other technological interruptions beyond reasonable control.",
    ],
  },
  {
    h: "5. Serenity Wellness App Access",
    p: [
      "App access is included with all programs at no additional cost during the active program period. Following the conclusion of coaching, Client retains full app access for a 4-week grace period. After that, continued access is available on a subscription basis (App Only, or App + Messaging) at then-current rates. Clients who don't subscribe after the grace period retain permanent view-only access to their historical data at no charge — no new data may be logged in view-only mode. Client may download their wellness data at any time via the app's export feature.",
    ],
  },
  {
    h: "6. Messaging & Communication",
    p: [
      "In-app messaging is available Monday–Friday, 8:00 AM–6:00 PM PST, with responses within one business day. Messaging is intended for brief questions, check-ins, and scheduling (500 characters per message) — book a session for in-depth discussions. In-app messaging is NOT to be used for medical emergencies; it is not monitored continuously. In a medical emergency, call 911 or go to the nearest emergency room immediately.",
    ],
  },
  {
    h: "7. Health Disclosure & Medical Acknowledgment",
    p: [
      "Client agrees to provide accurate and complete health history information and to promptly inform Coach of any changes to health status, new diagnoses, medications, or medical treatments during the program.",
      "Client confirms they have consulted, or agree to consult, with their physician or healthcare provider before implementing significant dietary or lifestyle changes recommended through coaching, particularly with an existing medical condition (including but not limited to diabetes, heart disease, high blood pressure, kidney or liver disease, eating disorders, pregnancy or breastfeeding, cancer, autoimmune conditions, or current prescription medications).",
      "Client represents that all information provided is complete and accurate and understands Coach will rely on it when providing coaching services. Client voluntarily and knowingly assumes all risks associated with implementing dietary changes, supplement use, exercise, stress reduction techniques, lifestyle modifications, and other recommendations discussed during coaching.",
    ],
  },
  {
    h: "8. Confidentiality & Privacy",
    p: [
      "Coach agrees to keep all Client information, health history, session content, and app data strictly confidential, and will not share it with any third party without Client's written consent, except as required by law, court order, subpoena, mandatory reporting obligations, to defend legal claims, collect unpaid fees, or consult professional advisors. Client data stored in the Serenity app is used solely for providing coaching services — see the full Privacy Policy at serenityofbodyandmind.com. Coach may request permission to use anonymized feedback or testimonials for marketing; this is entirely voluntary and requires separate written consent.",
    ],
  },
  {
    h: "9. Intellectual Property",
    p: [
      "All materials provided to Client — guides, recipes, worksheets, app content, curriculum — are the intellectual property of Serenity of Body and Mind, LLC, for Client's personal use only. They may not be reproduced, shared, distributed, modified, uploaded to AI platforms for training or analysis, commercially exploited, resold, published, or distributed without prior written permission. Client may not audio or video record coaching sessions without Coach's prior written consent.",
    ],
  },
  {
    h: "10. Limitation of Liability",
    p: [
      "Serenity of Body and Mind, LLC and Caroline Devin are not liable for adverse health outcomes, injuries, or damages arising from Client's participation in coaching or implementation of recommendations. Client assumes full responsibility for their own health decisions. Coach's total liability for any claim under this Agreement shall not exceed the total fees paid under this Agreement. Coach makes no guarantee or warranty regarding weight loss, symptom improvement, health outcomes, behavioral changes, or any other specific result — individual results vary.",
    ],
  },
  {
    h: "11. Professional Boundaries",
    p: [
      "Wellness coaching is a supportive, educational relationship. Coaching is not therapy, counseling, or mental health treatment. If Client demonstrates a need for mental health support, Coach may recommend appropriate professional resources.",
    ],
  },
  {
    h: "12. Termination",
    p: [
      "Client may terminate this Agreement at any time by written notice; refunds follow the Cancellation & Refund Policy above. Coach may terminate for repeated missed appointments, repeated late payments, harassing/abusive/threatening/unsafe/inappropriate behavior, or misrepresentation of health information that creates risk — in which case a prorated refund for unused sessions will be issued.",
    ],
  },
  {
    h: "13. General Provisions",
    p: [
      "Governed by the laws of the State of Oregon. This Agreement is the entire agreement between the parties and supersedes prior discussions or agreements. Neither party may assign this Agreement without the other's written consent. Before filing suit, the parties agree to attempt good-faith resolution and, if needed, mediation in Multnomah County, Oregon. The prevailing party in any action may recover reasonable attorney fees and costs as permitted by Oregon law. Amendments must be in writing and signed by both parties. Client acknowledges that coaching is delivered virtually via video call and that this Agreement is valid and enforceable for services delivered in this format.",
    ],
  },
];

export function AgreementStep() {
  const { advance } = useOutletContext();
  const { session, profile } = useAuth();
  const { toast, showToast, clearToast } = useToast();
  const [name, setName] = useState(profile?.full_name || "");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 1 && agreed && !submitting;

  async function handleSubmit() {
    if (!canSubmit || !session?.user) return;
    setSubmitting(true);

    const { error } = await supabase.from("agreements").insert({
      user_id: session.user.id,
      agreement_version: AGREEMENT_VERSION,
      signature_method: "typed_name",
      signature_name: name.trim(),
      user_agent: navigator.userAgent,
    });

    if (error) {
      console.error("Agreement save error:", error);
      showToast("Something went wrong saving your signature — please try again.");
      setSubmitting(false);
      return;
    }

    await advance("quiz_learning_style", "/onboarding/quiz/learning-style");
  }

  return (
    <>
      <Toast toast={toast} onClose={clearToast} />
      <div className="ob-title">Client Services Agreement 📋</div>
      <div className="ob-sub">Please read through the agreement below, then sign to continue.</div>

      <div className="legal-notice">
        <strong>Important:</strong> Services provided by Serenity of Body and Mind are nutrition
        education and holistic wellness coaching only. Caroline Devin is not a licensed physician,
        registered dietitian, or other licensed healthcare professional. Coaching is educational in
        nature and not a substitute for professional medical advice — please consult your physician
        before implementing any nutrition, supplement, exercise, wellness, or lifestyle recommendations.
      </div>

      <div className="legal-box">
        {SECTIONS.map(s => (
          <div key={s.h}>
            <h4>{s.h}</h4>
            {s.p.map((para, i) => <p key={i}>{para}</p>)}
          </div>
        ))}
      </div>

      <div className="field-group">
        <div className="field-label">Type your full legal name to sign</div>
        <input className="text-input" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="agree-row">
        <input id="agree-checkbox" type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        <label htmlFor="agree-checkbox">
          I have read, understood, and agree to the terms of this Client Services Agreement (Version {AGREEMENT_VERSION}).
        </label>
      </div>

      <div className="ob-actions">
        <button className="btn-next" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "Signing…" : "Sign & Continue →"}
        </button>
      </div>
    </>
  );
}
