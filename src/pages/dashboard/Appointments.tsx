import { useEffect, useState } from "react";
import { api, type Appointment, type AppointmentStatus, type User } from "../../api";
import { useAuth } from "../../AuthContext";

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  requested: "#C9A96E",
  confirmed: "#8B9E8A",
  declined: "#B47770",
  completed: "#7D8B9E",
};

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  requested: "Awaiting response",
  confirmed: "Confirmed",
  declined: "Declined",
  completed: "Completed",
};

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}

function Status({ status }: { status: AppointmentStatus }) {
  const color = STATUS_COLOR[status];
  return <span style={{ padding: "0.25rem 0.55rem", border: `1px solid ${color}55`, color, background: `${color}12`, borderRadius: "2px", fontFamily: "var(--font-mono-face)", fontSize: "0.55rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>{STATUS_LABEL[status]}</span>;
}

export default function Appointments() {
  const { user } = useAuth();
  const isClient = user?.role === "client";
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tailors, setTailors] = useState<User[]>([]);
  const [tailorId, setTailorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const loadAppointments = () => api.appointments.list().then(setAppointments).finally(() => setLoading(false));

  useEffect(() => {
    if (!user) return;
    loadAppointments().catch(() => setMessage("Unable to load appointments."));
    if (isClient) api.appointments.tailors().then((data) => { setTailors(data); if (data[0]) setTailorId(String(data[0].id)); }).catch(() => setMessage("Unable to load tailors."));
  }, [user, isClient]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tailorId || !date) return;
    setSubmitting(true);
    setMessage("");
    try {
      await api.appointments.create(tailorId, date, time, notes);
      setDate("");
      setNotes("");
      setMessage("Appointment request sent.");
      await loadAppointments();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to book appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (appointment: Appointment, status: AppointmentStatus) => {
    try {
      const updated = await api.appointments.updateStatus(appointment.id, status);
      setAppointments((current) => current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update appointment.");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "2.25rem" }}>
        <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--primary)", marginBottom: "0.55rem" }}>Atelier calendar</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "2.15rem", fontWeight: 400, marginBottom: "0.35rem" }}>{isClient ? "Book a fitting" : "Fitting appointments"}</h1>
        <p style={{ color: "var(--muted-foreground)", fontSize: "0.88rem", maxWidth: "540px" }}>{isClient ? "Choose a tailor and a time to discuss your next garment in person." : "Review client requests and keep every fitting on schedule."}</p>
      </div>

      {isClient && <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ marginBottom: "2.5rem" }}>
        <div style={{ padding: "1.5rem", border: "1px solid var(--border)", background: "var(--card)" }}>
          <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.57rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "1.25rem" }}>New request</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Tailor<select value={tailorId} onChange={(event) => setTailorId(event.target.value)} required style={inputStyle}><option value="">Select a tailor</option>{tailors.map((tailor) => <option key={tailor.id} value={tailor.id}>{tailor.name}{tailor.city ? ` · ${tailor.city}` : ""}</option>)}</select></label>
            <label style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Date<input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} required style={inputStyle} /></label>
            <label style={{ fontSize: "0.78rem", color: "var(--muted-foreground)" }}>Time<select value={time} onChange={(event) => setTime(event.target.value)} style={inputStyle}>{["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00"].map((slot) => <option key={slot}>{slot}</option>)}</select></label>
          </div>
          <label style={{ display: "block", fontSize: "0.78rem", color: "var(--muted-foreground)", marginTop: "1rem" }}>What would you like to discuss?<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="e.g. First fitting for the linen suit" rows={3} style={{ ...inputStyle, resize: "vertical" }} /></label>
          <button type="submit" disabled={submitting} style={{ marginTop: "1.25rem", padding: "0.75rem 1rem", border: "none", background: submitting ? "var(--muted)" : "var(--primary)", color: "var(--primary-foreground)", borderRadius: "2px", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", cursor: submitting ? "not-allowed" : "pointer" }}>{submitting ? "Sending…" : "Request appointment"}</button>
        </div>
        <div style={{ padding: "1.5rem", background: "var(--secondary)", border: "1px solid var(--border)" }}><div style={{ fontFamily: "var(--font-serif)", fontSize: "1.35rem", lineHeight: 1.25, marginBottom: "1rem" }}>A fitting is where the garment begins to feel like yours.</div><p style={{ fontSize: "0.8rem", lineHeight: 1.7, color: "var(--muted-foreground)" }}>Your tailor will confirm the appointment or suggest another time. Bring any reference pieces, fabric ideas, or notes about how you want the final silhouette to feel.</p></div>
      </form>}

      {message && <div style={{ padding: "0.75rem 1rem", border: "1px solid var(--border)", color: "var(--primary)", fontSize: "0.8rem", marginBottom: "1.5rem" }}>{message}</div>}
      <div style={{ fontFamily: "var(--font-mono-face)", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: "0.75rem" }}>{isClient ? "Your appointments" : "Incoming requests"}</div>
      {loading ? <div style={{ color: "var(--muted-foreground)", padding: "2rem 0" }}>Loading calendar…</div> : appointments.length === 0 ? <div style={{ padding: "3rem 1.5rem", border: "1px solid var(--border)", background: "var(--card)", color: "var(--muted-foreground)", textAlign: "center" }}>No appointments scheduled yet.</div> : <div className="flex flex-col" style={{ border: "1px solid var(--border)", background: "var(--card)" }}>{appointments.map((appointment) => <div key={appointment.id} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between" style={{ padding: "1.15rem 1.25rem", borderBottom: "1px solid var(--border)" }}><div><div style={{ fontSize: "0.92rem", color: "var(--foreground)", marginBottom: "0.25rem" }}>{isClient ? appointment.tailor?.name || "Tailor" : appointment.client?.name || "Client"}</div><div style={{ color: "var(--primary)", fontFamily: "var(--font-serif)", fontSize: "1.08rem" }}>{formatDate(appointment.date)} <span style={{ color: "var(--muted-foreground)", fontFamily: "var(--font-sans)", fontSize: "0.82rem" }}>at {appointment.time}</span></div>{appointment.notes && <div style={{ color: "var(--muted-foreground)", fontSize: "0.75rem", marginTop: "0.35rem" }}>{appointment.notes}</div>}</div><div className="flex items-center gap-3"><Status status={appointment.status} />{!isClient && appointment.status === "requested" && <><button onClick={() => updateStatus(appointment, "confirmed")} style={actionStyle}>Confirm</button><button onClick={() => updateStatus(appointment, "declined")} style={secondaryActionStyle}>Decline</button></>}</div></div>)}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = { display: "block", width: "100%", marginTop: "0.45rem", padding: "0.7rem 0.75rem", background: "var(--background)", border: "1px solid var(--border)", borderRadius: "2px", color: "var(--foreground)", fontFamily: "var(--font-sans)", fontSize: "0.82rem", outline: "none" };
const actionStyle: React.CSSProperties = { padding: "0.45rem 0.65rem", border: "1px solid var(--primary)", background: "var(--primary)", color: "var(--primary-foreground)", borderRadius: "2px", fontSize: "0.65rem", cursor: "pointer" };
const secondaryActionStyle: React.CSSProperties = { ...actionStyle, background: "transparent", color: "var(--muted-foreground)", borderColor: "var(--border)" };