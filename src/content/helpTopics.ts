import type { IconName } from "../components/ui/icons";

export interface HelpCategory {
  id: string;
  label: string;
  icon: IconName;
}

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: "orders", label: "Orders & Escrow", icon: "receipt" },
  { id: "appointments", label: "Appointments", icon: "calendar" },
  { id: "measurements", label: "Body Scan", icon: "camera" },
  { id: "visualizer", label: "3D Style Studio", icon: "layers" },
  { id: "messaging", label: "Messaging", icon: "message" },
  { id: "payments", label: "Payments", icon: "creditCard" },
  { id: "account", label: "Account & Profile", icon: "user" },
];

export interface FaqTopic {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export const FAQS: FaqTopic[] = [
  {
    id: "orders-escrow",
    category: "orders",
    question: "How does escrow protect my order?",
    answer:
      "When you confirm a quote, your payment is held safely in MorphoFit Escrow instead of going straight to the tailor. Funds are only released to the tailor and courier once your garment is delivered and you confirm you've received it.",
  },
  {
    id: "orders-track",
    category: "orders",
    question: "How do I track the status of my order?",
    answer:
      "Open My Orders from the dashboard and select the order — you'll see its current stage (Pending, Negotiating, Confirmed, In Production, Ready, Assigned, Out for Delivery, or Delivered) along with a description of what's happening at that stage.",
  },
  {
    id: "orders-cancel",
    category: "orders",
    question: "Can I cancel or change an order after confirming it?",
    answer:
      "Once an order is confirmed and escrow-paid, changes need to go through the tailor via Messages — use the order's chat to request adjustments. If production hasn't started yet, most tailors can still accommodate changes.",
  },
  {
    id: "appointments-book",
    category: "appointments",
    question: "How do I book a fitting appointment?",
    answer:
      "Go to Appointments, choose a tailor, and pick an available date and time. The tailor will confirm or decline your request, and you'll get a notification either way.",
  },
  {
    id: "appointments-reschedule",
    category: "appointments",
    question: "Can I reschedule or cancel an appointment?",
    answer:
      "Message the tailor directly from the appointment's conversation to request a new time. Appointments don't yet support self-service rescheduling, so the tailor needs to confirm the change.",
  },
  {
    id: "measurements-scan",
    category: "measurements",
    question: "How accurate is the body scan?",
    answer:
      "The Body Scan feature estimates your measurements (chest, waist, hip, inseam, and more) from guided photos. For a made-to-measure garment, we recommend double-checking key measurements with a tailor at your first fitting.",
  },
  {
    id: "measurements-update",
    category: "measurements",
    question: "How do I update my measurements?",
    answer:
      "Open Body Scan from the dashboard and re-run the scan at any time — your latest measurements are what tailors see when they prepare a quote for you.",
  },
  {
    id: "visualizer-use",
    category: "visualizer",
    question: "What is the 3D Style Studio for?",
    answer:
      "It renders a garment on a 3D model using your measurements, so you and your tailor can preview fit and style before any fabric is cut.",
  },
  {
    id: "messaging-attachments",
    category: "messaging",
    question: "Can I send photos or voice notes in chat?",
    answer:
      "Yes — open a conversation and use the camera or microphone icon in the composer to attach a photo or record a voice note alongside your message.",
  },
  {
    id: "messaging-notifications",
    category: "messaging",
    question: "Why am I not getting notified about new messages?",
    answer:
      "Check Settings → Notifications and make sure the Messages toggle is on. If it's already on, confirm you're connected to the internet — messages arrive in real time while you're online.",
  },
  {
    id: "payments-methods",
    category: "payments",
    question: "What payment methods are supported?",
    answer:
      "Orders are paid into escrow using mobile money (MTN/Orange) via USSD prompts. You'll confirm the payment with your PIN directly on your phone.",
  },
  {
    id: "payments-refund",
    category: "payments",
    question: "What happens to my payment if there's a dispute?",
    answer:
      "Because funds sit in escrow until delivery is confirmed, nothing is paid out to the tailor or courier while a dispute is open. Use Contact Support below to have our team review the order.",
  },
  {
    id: "account-role",
    category: "account",
    question: "Can I change my account role (e.g. from Client to Tailor)?",
    answer:
      "Roles aren't self-service today — reach out via Contact Support with the role you'd like and why, and our team will help.",
  },
  {
    id: "account-delete",
    category: "account",
    question: "How do I deactivate my account or export my data?",
    answer:
      "Both are in Settings → Account: \"Export my data\" downloads your measurements, orders, and appointments; \"Deactivate account\" disables sign-in immediately.",
  },
];
