import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://eiqwtejpouhzqlaoztce.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcXd0ZWpwb3VoenFsYW96dGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDk4NTksImV4cCI6MjA5NzI4NTg1OX0.LOUdW2gAngUFlfsM-1A1dx5d2z4CH4Nkg07PU6suE7k";
const VARS_LOGO = null;
const MPOWER_LOGO = null;

const sb = {
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return res.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` } });
  },
  async createUser(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, email_confirm: true }),
    });
    return res.json();
  },
  async get(table, query = "", token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token || SUPABASE_KEY}` },
    });
    return res.json();
  },
  async post(table, data, token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token || SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async patch(table, id, data, token) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH", headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token || SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

const today = () => new Date().toISOString().split("T")[0];
const nowTime = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
const fmtDateTime = (d) => d ? new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const ROLE_CONFIG = {
  president:       { label: "President",            color: "#7C3AED", bg: "#F5F3FF", canAddCandidate: false, canAddMember: false, canViewAll: true,  isAdmin: true  },
  manager:         { label: "Manager",               color: "#0F766E", bg: "#F0FDFA", canAddCandidate: true,  canAddMember: true,  canViewAll: true,  isAdmin: true  },
  r_lead:          { label: "R Lead",                color: "#2563EB", bg: "#EFF6FF", canAddCandidate: false, canAddMember: false, canViewAll: true,  isAdmin: false },
  c_lead:          { label: "C Lead",                color: "#D97706", bg: "#FFFBEB", canAddCandidate: false, canAddMember: false, canViewAll: true,  isAdmin: false },
  recruiter:       { label: "Recruiter",             color: "#059669", bg: "#F0FDF4", canAddCandidate: false, canAddMember: false, canViewAll: false, isAdmin: false },
  interview_coord: { label: "Interview Coordinator", color: "#DC2626", bg: "#FEF2F2", canAddCandidate: false, canAddMember: false, canViewAll: false, isAdmin: false },
};

const ENTRY_TYPES = {
  screening_call:    { label: "Screening Call",      icon: "", color: "#2563EB" },
  interview_round1:  { label: "Interview Round 1",   icon: "", color: "#7C3AED" },
  interview_round2:  { label: "Interview Round 2",   icon: "", color: "#7C3AED" },
  interview_round3:  { label: "Interview Round 3",   icon: "", color: "#7C3AED" },
  vendor_mock:       { label: "Vendor Mock",         icon: "", color: "#D97706" },
  interview_mock:    { label: "Interview Mock",      icon: "", color: "#DC2626" },
  pipeline_update:   { label: "Pipeline Update",     icon: "", color: "#0F766E" },
  offer:             { label: "Offer",               icon: "", color: "#16A34A" },
  placement:         { label: "Placement",           icon: "", color: "#16A34A" },
  dropped:           { label: "Dropped",             icon: "", color: "#DC2626" },
};

// ─── UI COMPONENTS ─────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const rc = ROLE_CONFIG[role] || { label: role, color: "#475569", bg: "#F1F5F9" };
  return <span style={{ background: rc.bg, color: rc.color, fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>{rc.label}</span>;
}
function NavIcon({id}){
  const icons={
    dashboard:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    daily_log:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    candidates:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    recruiters:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    my_recruiters:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    interviews:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
    logs_history:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    status_meeting:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18C1.6 2.1 2.41 1.17 3.5 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6 6l.38-.38a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 17l.92-.08z"/></svg>,
    overall_status:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    stats:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    team:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    notifications:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  };
  return <span style={{display:"flex",alignItems:"center",flexShrink:0}}>{icons[id]||icons.dashboard}</span>;
}

function StatusBadge({ status }) {
  const map = { solved:["#16A34A","#F0FDF4"], pending:["#D97706","#FFFBEB"], waiting:["#2563EB","#EFF6FF"], none:["#94A3B8","#F1F5F9"], Active:["#16A34A","#F0FDF4"], Inactive:["#94A3B8","#F1F5F9"], Placed:["#7C3AED","#F5F3FF"], Dropped:["#DC2626","#FEF2F2"], passed:["#16A34A","#F0FDF4"], failed:["#DC2626","#FEF2F2"], pending_:["#D97706","#FFFBEB"], scheduled:["#2563EB","#EFF6FF"] };
  const [c,b] = map[status] || ["#94A3B8","#F1F5F9"];
  return <span style={{ background:b, color:c, fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:600 }}>{status}</span>;
}
function Card({ children, style, onClick }) { return <div onClick={onClick} style={{ background:"#fff", border:"1px solid #E2E8F0", borderRadius:10, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>; }
function CardHeader({ title, action }) {
  return <div style={{ padding:"14px 18px", borderBottom:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"space-between" }}><span style={{ fontWeight:600, fontSize:14 }}>{title}</span>{action}</div>;
}
function StatCard({ label, value, color, sub }) {
  return <Card style={{ padding:"16px 18px" }}><div style={{ fontSize:11, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em", color:"#94A3B8", marginBottom:4 }}>{label}</div><div style={{ fontSize:28, fontWeight:800, color:color||"#0F172A" }}>{value}</div>{sub&&<div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{sub}</div>}</Card>;
}
function Input({ label, ...props }) {
  return <div style={{ marginBottom:14 }}>{label&&<label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>{label}</label>}<input style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }} {...props}/></div>;
}
function Select({ label, children, ...props }) {
  return <div style={{ marginBottom:14 }}>{label&&<label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>{label}</label>}<select style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", background:"#fff", boxSizing:"border-box" }} {...props}>{children}</select></div>;
}
function Textarea({ label, ...props }) {
  return <div style={{ marginBottom:14 }}>{label&&<label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>{label}</label>}<textarea style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box" }} rows={3} {...props}/></div>;
}
function Btn({ children, variant="primary", onClick, style, disabled }) {
  const s = { primary:{background:disabled?"#94A3B8":"#2563EB",color:"#fff",border:"none"}, outline:{background:"#fff",color:"#475569",border:"1px solid #E2E8F0"}, danger:{background:"#DC2626",color:"#fff",border:"none"}, success:{background:"#16A34A",color:"#fff",border:"none"} };
  return <button disabled={disabled} onClick={onClick} style={{ padding:"8px 16px", borderRadius:8, fontSize:13, fontWeight:600, cursor:disabled?"not-allowed":"pointer", ...s[variant], ...style }}>{children}</button>;
}
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
    <div style={{ background:"#fff", borderRadius:14, padding:28, width:wide?700:520, maxWidth:"100%", maxHeight:"90vh", overflowY:"auto" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
        <span style={{ fontSize:17, fontWeight:700 }}>{title}</span>
        <button onClick={onClose} style={{ background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#94A3B8" }}>×</button>
      </div>
      {children}
    </div>
  </div>;
}
function Toast({ msg, type="success", onDone }) {
  useEffect(()=>{ const t=setTimeout(onDone,3500); return()=>clearTimeout(t); },[onDone]);
  return <div style={{ position:"fixed", bottom:24, right:24, background:type==="error"?"#DC2626":"#16A34A", color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:14, fontWeight:500, zIndex:9999, maxWidth:340 }}>{type==="success"?"":""} {msg}</div>;
}
function Av({ name, role, size=32 }) {
  const rc = ROLE_CONFIG[role]||{color:"#2563EB",bg:"#EFF6FF"};
  const ini = name?.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase()||"?";
  return <div style={{ width:size, height:size, borderRadius:"50%", background:rc.bg, color:rc.color, display:"inline-flex", alignItems:"center", justifyContent:"center", fontSize:size*0.33, fontWeight:700, flexShrink:0 }}>{ini}</div>;
}
function Tabs({ tabs, active, onChange }) {
  return <div style={{ display:"flex", gap:4, marginBottom:20, borderBottom:"1px solid #E2E8F0", paddingBottom:0 }}>
    {tabs.map(t => <button key={t.id} onClick={()=>onChange(t.id)} style={{ padding:"8px 16px", fontSize:13, fontWeight:600, cursor:"pointer", background:"none", border:"none", borderBottom:`2px solid ${active===t.id?"#2563EB":"transparent"}`, color:active===t.id?"#2563EB":"#94A3B8", marginBottom:-1 }}>{t.label}</button>)}
  </div>;
}

// ─── PASSWORD VALIDATION ────────────────────────────────────────────────────
function validatePassword(password) {
  const errors = [];
  if (password.length < 8) errors.push("At least 8 characters required");
  if (!/[A-Z]/.test(password)) errors.push("At least 1 capital letter required");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(password)) errors.push("At least 1 special character required");
  if (!/[0-9]/.test(password)) errors.push("At least 1 number required");
  // Check repeated numbers
  if (/(\d)/.test(password)) errors.push("No repeated numbers allowed (e.g. 11, 22)");
  return errors;
}

// ─── CHANGE PASSWORD SCREEN ──────────────────────────────────────────────────
function ChangePasswordScreen({ user, onDone }) {
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const errors = validatePassword(newPass);
  const isValid = errors.length === 0 && newPass === confirmPass && newPass.length > 0;

  const handleChange = async () => {
    if (errors.length > 0) { setErr(errors[0]); return; }
    if (newPass !== confirmPass) { setErr("Passwords do not match"); return; }
    if (newPass === "VARS@2026") { setErr("New password cannot be same as default password"); return; }
    setLoading(true); setErr("");
    try {
      // Update password via Supabase Auth
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method: "PUT",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPass }),
      });
      const data = await res.json();
      if (data.error) { setErr(data.error.message || "Failed to update password"); setLoading(false); return; }
      // Mark password as changed
      await fetch(`${SUPABASE_URL}/rest/v1/team_members?id=eq.${user.id}`, {
        method: "PATCH",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({ password_changed: true }),
      });
      onDone();
    } catch (e) { setErr("Error updating password. Try again."); }
    setLoading(false);
  };

  return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0F1F3D 0%,#1E3A6E 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"40px 36px", width:420, boxShadow:"0 24px 64px rgba(0,0,0,0.25)" }}>
        <div style={{ fontSize:26, fontWeight:800, color:"#0F1F3D", marginBottom:2 }}>VARS <span style={{ color:"#2563EB" }}>Portal</span></div>
        <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"12px 14px", marginBottom:24, marginTop:8 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#2563EB", marginBottom:4 }}> First Login — Set Your Password</div>
          <div style={{ fontSize:12, color:"#475569" }}>Welcome {user.name}! Please set a new secure password to continue.</div>
        </div>

        {/* Password rules */}
        <div style={{ background:"#F8FAFC", borderRadius:8, padding:"12px 14px", marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"#475569", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>Password Requirements:</div>
          {[
            { rule: "At least 8 characters", pass: newPass.length >= 8 },
            { rule: "At least 1 capital letter (A-Z)", pass: /[A-Z]/.test(newPass) },
            { rule: "At least 1 special character (!@#$...)", pass: /[!@#$%^&*()_+\-=\[\]{};':"\|,.<>\/?]/.test(newPass) },
            { rule: "At least 1 number (0-9)", pass: /[0-9]/.test(newPass) },
            { rule: "No repeated numbers (11, 22, 33...)", pass: newPass.length > 0 && !/(\d)/.test(newPass) },
          ].map((r, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
              <span style={{ fontSize:12, color: newPass.length === 0 ? "#94A3B8" : r.pass ? "#16A34A" : "#DC2626" }}>
                {newPass.length === 0 ? "○" : r.pass ? "" : ""}
              </span>
              <span style={{ fontSize:12, color: newPass.length === 0 ? "#94A3B8" : r.pass ? "#16A34A" : "#DC2626" }}>{r.rule}</span>
            </div>
          ))}
        </div>

        {/* New password */}
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>New Password *</label>
          <div style={{ position:"relative" }}>
            <input type={show?"text":"password"} value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Enter new password" style={{ width:"100%", border:`1px solid ${newPass.length>0&&errors.length>0?"#FECACA":"#E2E8F0"}`, borderRadius:8, padding:"8px 40px 8px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
            <button onClick={()=>setShow(!show)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:12 }}>{show?"Hide":"Show"}</button>
          </div>
        </div>

        {/* Confirm password */}
        <div style={{ marginBottom:16 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>Confirm Password *</label>
          <div style={{ position:"relative" }}>
            <input type={showConfirm?"text":"password"} value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Re-enter new password" onKeyDown={e=>e.key==="Enter"&&isValid&&handleChange()} style={{ width:"100%", border:`1px solid ${confirmPass.length>0&&newPass!==confirmPass?"#FECACA":"#E2E8F0"}`, borderRadius:8, padding:"8px 40px 8px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
            <button onClick={()=>setShowConfirm(!showConfirm)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:12 }}>{showConfirm?"Hide":"Show"}</button>
          </div>
          {confirmPass.length>0&&newPass!==confirmPass&&<div style={{ fontSize:11, color:"#DC2626", marginTop:4 }}>Passwords do not match</div>}
          {confirmPass.length>0&&newPass===confirmPass&&errors.length===0&&<div style={{ fontSize:11, color:"#16A34A", marginTop:4 }}> Passwords match!</div>}
        </div>

        {err&&<div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#DC2626", marginBottom:16 }}>Note: {err}</div>}

        <button onClick={handleChange} disabled={loading||!isValid} style={{ width:"100%", background:loading||!isValid?"#94A3B8":"#2563EB", color:"#fff", border:"none", borderRadius:10, padding:13, fontSize:15, fontWeight:700, cursor:loading||!isValid?"not-allowed":"pointer" }}>
          {loading?"Setting password...":"Set Password & Continue →"}
        </button>
      </div>
    </div>
  );
}

// ─── LOGIN ──────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }) {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [loading,setLoading]=useState(false); const [err,setErr]=useState(""); const [show,setShow]=useState(false);
  const login = async () => {
    if(!email||!pass){setErr("Email and password required");return;}
    setLoading(true);setErr("");
    try {
      const auth = await sb.signIn(email.trim(),pass);
      if(auth.error||!auth.access_token){setErr("Invalid email or password.");setLoading(false);return;}
      const members = await sb.get("team_members",`email=ilike.${email.trim()}&limit=1`,auth.access_token);
      if(!members||members.length===0){setErr("Account not found. Contact your manager.");setLoading(false);return;}
      onLogin({...members[0],token:auth.access_token});
    } catch { setErr("Connection error. Try again."); }
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh", background:"#0a0f1e", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", position:"relative", overflow:"hidden" }}>
      {/* Background orbs */}
      <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(29,78,216,0.2) 0%, transparent 65%)", top:-150, left:-150 }}/>
      <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(139,27,45,0.18) 0%, transparent 65%)", bottom:-100, right:-100 }}/>
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(59,130,246,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.04) 1px,transparent 1px)", backgroundSize:"44px 44px" }}/>

      <div style={{ width:420, maxWidth:"calc(100vw - 32px)", position:"relative", zIndex:2 }}>
        {/* Logo strip */}
        <div style={{ display:"flex", alignItems:"stretch", borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,0.08)", marginBottom:3 }}>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"14px 16px", background:"linear-gradient(135deg,rgba(29,78,216,0.35),rgba(37,99,235,0.2))", borderRight:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(59,130,246,0.25)", border:"1px solid rgba(59,130,246,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}></div>
            <div><div style={{ fontSize:13, fontWeight:800, color:"#93C5FD", letterSpacing:-0.2 }}>Mpower Logic</div><div style={{ fontSize:9, color:"rgba(147,197,253,0.5)", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>Inc.</div></div>
          </div>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"14px 16px", background:"linear-gradient(135deg,rgba(100,10,20,0.4),rgba(139,27,45,0.25))" }}>
            <div style={{ width:36, height:36, borderRadius:"50%", background:"rgba(139,27,45,0.3)", border:"1px solid rgba(185,28,28,0.4)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>▲</div>
            <div><div style={{ fontSize:13, fontWeight:800, color:"#FCA5A5", letterSpacing:-0.2 }}>VARS Consulting</div><div style={{ fontSize:9, color:"rgba(252,165,165,0.5)", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:2 }}>Inc.</div></div>
          </div>
        </div>
        {/* Mirror reflection */}
        <div style={{ display:"flex", height:22, borderRadius:"0 0 10px 10px", overflow:"hidden", opacity:0.15, filter:"blur(1px)", marginBottom:3 }}>
          <div style={{ flex:1, background:"linear-gradient(135deg,rgba(29,78,216,0.3),rgba(37,99,235,0.15))" }}/>
          <div style={{ flex:1, background:"linear-gradient(135deg,rgba(100,10,20,0.35),rgba(139,27,45,0.2))", borderLeft:"1px solid rgba(255,255,255,0.05)" }}/>
        </div>
        <div style={{ height:16, background:"linear-gradient(to bottom,rgba(10,15,30,0),rgba(10,15,30,1))", marginBottom:20 }}/>

        {/* Portal name */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontSize:26, fontWeight:900, letterSpacing:-0.5, lineHeight:1.1 }}>
            <span style={{ color:"#93C5FD" }}>Mpower</span>
            <span style={{ color:"rgba(255,255,255,0.3)", margin:"0 8px" }}>—</span>
            <span style={{ color:"#FCA5A5" }}>VARS</span>
            <span style={{ color:"#fff" }}> IMS</span>
          </div>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"0.18em", textTransform:"uppercase", marginTop:6 }}>Internal Management System</div>
        </div>

        {/* Glass card */}
        <div style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"28px 28px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:"15%", right:"15%", height:1, background:"linear-gradient(90deg,transparent,rgba(147,197,253,0.5),rgba(252,165,165,0.5),transparent)" }}/>

          {/* Email field */}
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", marginBottom:6, letterSpacing:"0.08em", textTransform:"uppercase" }}>Email</label>
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="your@email.com" style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 14px", fontSize:14, color:"#fff", marginBottom:4, boxSizing:"border-box", outline:"none" }}/>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.25)", marginBottom:16 }}>@varsconsultinginc.com · @mpowerlogic.com · or personal email</div>

          {/* Password field */}
          <label style={{ display:"block", fontSize:11, fontWeight:700, color:"rgba(255,255,255,0.45)", marginBottom:6, letterSpacing:"0.08em", textTransform:"uppercase" }}>Password</label>
          <div style={{ position:"relative", marginBottom:20 }}>
            <input type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Enter your password" style={{ width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 50px 11px 14px", fontSize:14, color:"#fff", boxSizing:"border-box", outline:"none" }}/>
            <button onClick={()=>setShow(!show)} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"rgba(147,197,253,0.6)", fontSize:11, fontWeight:600 }}>{show?"Hide":"Show"}</button>
          </div>

          {err&&<div style={{ background:"rgba(220,38,38,0.15)", border:"1px solid rgba(220,38,38,0.3)", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#FCA5A5", marginBottom:14 }}>Note: {err}</div>}

          {/* Sign in button */}
          <button onClick={login} disabled={loading} style={{ width:"100%", background:loading?"rgba(255,255,255,0.1)":"linear-gradient(135deg,#1D4ED8 0%,#7f1d1d 100%)", color:"#fff", border:"none", borderRadius:10, padding:13, fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer", marginBottom:16, letterSpacing:"0.02em" }}>
            {loading?"Signing in...":"Sign in →"}
          </button>

          <div style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.25)", marginBottom:12 }}>Need help? Contact your manager</div>
          <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"9px 14px", fontSize:11, color:"rgba(255,255,255,0.3)", textAlign:"center" }}>
            Default password: <strong style={{ color:"rgba(255,255,255,0.55)" }}>VARS@2026</strong>
          </div>
          <div style={{ position:"absolute", bottom:-15, left:"50%", transform:"translateX(-50%)", width:"60%", height:30, background:"linear-gradient(90deg,rgba(29,78,216,0.4),rgba(139,27,45,0.4))", filter:"blur(18px)", borderRadius:"50%" }}/>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ──────────────────────────────────────────────────────────────
export default function VARSPortal() {
  const [user,setUser]=useState(null); const [page,setPage]=useState("dashboard");
  const [members,setMembers]=useState([]); const [candidates,setCandidates]=useState([]);
  const [logs,setLogs]=useState([]); const [notifications,setNotifications]=useState([]);
  const [timeline,setTimeline]=useState([]);
  const [toast,setToast]=useState(null); const [loading,setLoading]=useState(false); const [showN,setShowN]=useState(false); const [showProfile,setShowProfile]=useState(false);
  const showToast=(msg,type="success")=>setToast({msg,type});

  const loadData=useCallback(async(token)=>{
    const t=token||user?.token; if(!t)return; setLoading(true);
    try {
      const [m,c,l,n,tl]=await Promise.all([
        sb.get("team_members","select=*&order=role.asc,name.asc",t),
        sb.get("candidates","select=*&order=created_at.desc",t),
        sb.get("daily_logs","select=*&order=created_at.desc",t),
        sb.get("notifications","select=*&order=created_at.desc&limit=30",t),
        sb.get("candidate_timeline","select=*&order=created_at.desc",t),
      ]);
      if(Array.isArray(m))setMembers(m); if(Array.isArray(c))setCandidates(c);
      if(Array.isArray(l))setLogs(l); if(Array.isArray(n))setNotifications(n);
      if(Array.isArray(tl))setTimeline(tl);
    } catch { showToast("Failed to load data.","error"); }
    setLoading(false);
  },[user]);

  useEffect(()=>{ if(user)loadData(user.token); },[user]);
  const rc=user?ROLE_CONFIG[user.role]:null;
  const getMember=id=>members.find(m=>m.id===id);
  const myCands=user?candidates.filter(c=>{ if(!rc)return false; if(rc.canViewAll)return true; if(user.role==="recruiter")return c.recruiter_id===user.id; if(user.role==="interview_coord")return c.interview_coord_id===user.id; return true; }):[];
  const unread=notifications.filter(n=>!n.read_at).length;

  const markRead=async(id)=>{
    try {
      await sb.patch("notifications",id,{read_at:new Date().toISOString()},user.token);
      await loadData();
    } catch(e){console.error(e);}
  };

  const markAllRead=async()=>{
    try {
      const unreadIds=notifications.filter(n=>!n.read_at).map(n=>n.id);
      await Promise.all(unreadIds.map(id=>sb.patch("notifications",id,{read_at:new Date().toISOString()},user.token)));
      await loadData();
    } catch(e){console.error(e);}
  };

  const addLog=async(data)=>{
    setLoading(true);
    try {
      const r=await sb.post("daily_logs",{...data,user_id:user.id,log_date:today(),log_time:nowTime()},user.token);
      if(r?.error){showToast("Failed: "+r.error.message,"error");setLoading(false);return;}
      if(data.type==="manager_feedback"&&(data.feedback_to_president||data.feedback_to_team)){
        const weekStart=new Date();weekStart.setDate(weekStart.getDate()-weekStart.getDay());
        await sb.post("manager_feedbacks",{manager_id:user.id,candidate_id:data.candidate_id,feedback_to_president:data.feedback_to_president||"",feedback_to_team:data.feedback_to_team||"",week_start:weekStart.toISOString().split("T")[0]},user.token);
      }
      const cand=candidates.find(c=>c.id===data.candidate_id);
      await sb.post("notifications",{message:`${user.name} submitted ${rc?.label} log for ${cand?.name||"candidate"}`,candidate_id:data.candidate_id,triggered_by:user.id},user.token);
      await loadData(); showToast("Daily log submitted!");
    } catch { showToast("Error.","error"); }
    setLoading(false);
  };

  const addCandidate=async(data)=>{
    setLoading(true);
    try {
      const r=await sb.post("candidates",{...data,added_by:user.id,added_on:today(),status:"Active"},user.token);
      if(r?.error){showToast("Failed: "+r.error.message,"error");setLoading(false);return;}
      await loadData(); showToast("Candidate added!");
    } catch { showToast("Error.","error"); }
    setLoading(false);
  };

  const addMember=async(data)=>{
    setLoading(true);
    try {
      // Call Edge Function to create auth user + team member
      const res=await fetch(`${SUPABASE_URL}/functions/v1/create-user`,{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "Authorization":`Bearer ${user.token}`,
          "apikey":SUPABASE_KEY,
        },
        body:JSON.stringify({
          email:data.email,
          name:data.name,
          role:data.role,
          r_lead_team:data.r_lead_team||null,
        }),
      });
      const result=await res.json();
      if(result.error){showToast("Error: "+result.error,"error");setLoading(false);return;}
      await loadData();
      showToast(`${data.name} added! Login: ${data.email} / VARS@2026`);
    } catch(e){ showToast("Error adding member: "+e.message,"error"); }
    setLoading(false);
  };

  const addTimeline=async(data)=>{
    setLoading(true);
    try {
      const r=await sb.post("candidate_timeline",{...data,user_id:user.id},user.token);
      if(r?.error){showToast("Failed: "+r.error.message,"error");setLoading(false);return;}
      await loadData(); showToast("Entry added!");
    } catch { showToast("Error.","error"); }
    setLoading(false);
  };

  const logout=async()=>{ await sb.signOut(user.token); setUser(null); setPage("dashboard"); setMembers([]); setCandidates([]); setLogs([]); setNotifications([]); setTimeline([]); };

  if(!user)return <LoginPage onLogin={u=>setUser(u)} />;
  // First login — force password change
  if(user&&!user.password_changed)return <ChangePasswordScreen user={user} onDone={()=>setUser({...user,password_changed:true})}/>;
  // Safety check
  if(!rc)return <LoginPage onLogin={u=>setUser(u)} />;

  const NAV_ICONS={
    dashboard:"ti-layout-dashboard",
    daily_log:"ti-clipboard-text",
    candidates:"ti-user",
    recruiters:"ti-users",
    my_recruiters:"ti-users-group",
    interviews:"ti-briefcase",
    logs_history:"ti-history",
    status_meeting:"ti-phone-call",
    overall_status:"ti-chart-pie",
    stats:"ti-chart-bar",
    team:"ti-building",
    notifications:"ti-bell",
  };
  const navItems=[
    {id:"dashboard",label:"Dashboard",always:true},
    {id:"daily_log",label:"Daily Log",always:true},
    {id:"candidates",label:"Candidates",always:true},
    {id:"recruiters",label:"Recruiters",show:rc.isAdmin},
    {id:"my_recruiters",label:"My Recruiters",show:user.role==="r_lead"},
    {id:"interviews",label:"Interviews",show:user.role==="r_lead"||user.role==="c_lead"||user.role==="manager"||user.role==="president"},
    {id:"logs_history",label:"Log History",always:true},
    {id:"status_meeting",label:"Status Meeting",always:true},
    {id:"overall_status",label:"Overall Status",show:user.role==="president"},
    {id:"stats",label:"Stats & Reports",show:rc.canViewAll},
    {id:"team",label:"Team",show:rc.isAdmin||user.role==="r_lead"||user.role==="c_lead"},
    {id:"notifications",label:`Alerts${unread>0?` (${unread})`:""}`,show:rc.isAdmin},
  ].filter(n=>n.always||n.show);

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background:"#F8FAFC", color:"#0F172A" }}>
      <div style={{ background:"#0F1F3D", display:"flex", alignItems:"center", padding:"0 16px", height:60, gap:12, flexShrink:0 }}>
        {/* LEFT — Company Names */}
        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <div style={{ lineHeight:1.2 }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#60A5FA", letterSpacing:-0.3 }}>Mpower Logic</div>
            <div style={{ fontSize:9, color:"#93C5FD", letterSpacing:"0.08em", textTransform:"uppercase" }}>Inc.</div>
          </div>
          <div style={{ width:1, height:34, background:"rgba(255,255,255,0.25)" }}/>
          <div style={{ lineHeight:1.2 }}>
            <div style={{ fontSize:14, fontWeight:800, color:"#F87171", letterSpacing:-0.3 }}>VARS Consulting</div>
            <div style={{ fontSize:9, color:"#FCA5A5", letterSpacing:"0.08em", textTransform:"uppercase" }}>Inc.</div>
          </div>
        </div>
        {/* CENTER — Portal name */}
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ fontSize:15, fontWeight:800, color:"#fff", letterSpacing:-0.3 }}>Mpower - VARS <span style={{ color:"#60A5FA" }}>IMS</span></div>
          <div style={{ fontSize:10, color:"#93C5FD", letterSpacing:"0.05em" }}>Internal Management System</div>
        </div>
        {rc.isAdmin&&<div style={{ position:"relative" }}>
          <button onClick={()=>setShowN(!showN)} style={{ background:"none", border:"none", color:"#93C5FD", cursor:"pointer", fontSize:18, position:"relative" }}>{unread>0&&<span style={{ position:"absolute", top:-4, right:-4, background:"#DC2626", color:"#fff", fontSize:10, borderRadius:99, padding:"1px 5px" }}>{unread}</span>}</button>
          {showN&&<div style={{ position:"absolute", right:0, top:38, background:"#fff", border:"1px solid #E2E8F0", borderRadius:10, width:340, zIndex:200, boxShadow:"0 8px 30px rgba(0,0,0,0.15)", maxHeight:420, overflowY:"auto" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #E2E8F0", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, background:"#fff" }}>
              <div style={{ fontWeight:700, fontSize:13 }}> Notifications <span style={{ fontSize:11, color:"#94A3B8", fontWeight:400 }}>({unread} unread)</span></div>
              {unread>0&&<button onClick={markAllRead} style={{ fontSize:11, color:"#2563EB", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:6, padding:"3px 8px", cursor:"pointer", fontWeight:600 }}>Mark all read</button>}
            </div>
            {notifications.slice(0,12).map(n=><div key={n.id} onClick={()=>!n.read_at&&markRead(n.id)} style={{ padding:"10px 16px", borderBottom:"1px solid #F1F5F9", background:n.read_at?"#FAFAFA":"#fff", cursor:n.read_at?"default":"pointer", display:"flex", alignItems:"flex-start", gap:8 }}>
              <span style={{ fontSize:14, marginTop:1 }}>{n.read_at?"":""}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:12, color:n.read_at?"#94A3B8":"#0F172A", fontWeight:n.read_at?400:500 }}>{n.message}</div>
                <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{fmtDateTime(n.created_at)}</div>
              </div>
              {!n.read_at&&<span style={{ width:7, height:7, borderRadius:"50%", background:"#2563EB", flexShrink:0, marginTop:4 }}/>}
            </div>)}
            {notifications.length===0&&<div style={{ padding:20, textAlign:"center", fontSize:13, color:"#94A3B8" }}>No notifications yet.</div>}
          </div>}
        </div>}
        <div style={{ position:"relative" }}>
          <button onClick={()=>setShowProfile(!showProfile)} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", borderRadius:10, padding:"5px 10px", cursor:"pointer" }}>
            <div style={{ width:32, height:32, borderRadius:"50%", background:rc.bg, color:rc.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700 }}>{user.name?.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase()}</div>
            <div style={{ textAlign:"left" }}><div style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{user.name}</div><div style={{ fontSize:10, color:"#93C5FD" }}>{rc.label}</div></div>
            <span style={{ color:"#93C5FD", fontSize:10 }}>▼</span>
          </button>
          {showProfile&&<ProfileDropdown user={user} rc={rc} onClose={()=>setShowProfile(false)} onLogout={logout} token={user.token}/>}
        </div>
      </div>

      <div style={{ display:"flex", flex:1 }}>
        <div style={{ width:190, background:"#fff", borderRight:"1px solid #E2E8F0", padding:"12px 0", flexShrink:0 }}>
          {navItems.map(n=><div key={n.id} onClick={()=>setPage(n.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 18px", fontSize:13, cursor:"pointer", borderLeft:`3px solid ${page===n.id?"#2563EB":"transparent"}`, color:page===n.id?"#2563EB":"#475569", background:page===n.id?"#EFF6FF":"transparent", fontWeight:page===n.id?600:400 }}>
              <NavIcon id={n.id}/>
              {n.label}
            </div>)}
          <div style={{ margin:"16px 12px 0", padding:"10px 12px", background:rc.bg, borderRadius:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:rc.color }}>{rc.label}</div>
            <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>{rc.canViewAll?"Full view access":"Limited to assigned"}</div>
          </div>
        </div>

        <div style={{ flex:1, padding:22, overflowY:"auto" }}>
          {loading&&<div style={{ position:"fixed", top:60, right:20, background:"#0F1F3D", color:"#fff", padding:"5px 14px", borderRadius:8, fontSize:12, zIndex:500 }}>Syncing...</div>}
          {page==="dashboard"&&<DashPage user={user} rc={rc} candidates={rc.canViewAll?candidates:myCands} allCandidates={candidates} logs={logs} getMember={getMember} onNav={setPage} onRefresh={()=>loadData()} members={members} token={user?.token}/>}
          {page==="daily_log"&&<LogPage user={user} rc={rc} candidates={myCands} allCands={candidates} onSubmit={addLog} loading={loading} members={members} logs={logs} allLogs={logs} onRefresh={()=>loadData()}/>}
          {page==="candidates"&&<CandPage user={user} rc={rc} candidates={myCands} members={members} onAdd={addCandidate} onAddMember={addMember} logs={logs} getMember={getMember} loading={loading} timeline={timeline} onAddTimeline={addTimeline} token={user?.token} onRefresh={loadData}/>}
          {page==="recruiters"&&<RecruitersPage user={user} rc={rc} members={members} candidates={candidates} logs={logs} getMember={getMember} loading={loading} token={user?.token} onRefresh={loadData} onAdd={addMember}/>}
          {page==="my_recruiters"&&<MyRecruitersPage user={user} members={members} candidates={candidates} logs={logs} timeline={timeline} getMember={getMember} onAddTimeline={addTimeline} loading={loading}/>}
          {page==="logs_history"&&<HistPage user={user} rc={rc} candidates={myCands} logs={logs} getMember={getMember} allCands={candidates}/>}
          {page==="stats"&&<StatsPage candidates={candidates} logs={logs} members={members}/>}
          {page==="interviews"&&<InterviewsPage user={user} rc={rc} candidates={myCands} token={user.token} loading={loading} setToast={setToast}/>
}
          {page==="team"&&<TeamPage user={user} rc={rc} members={members} candidates={candidates} logs={logs} onAddMember={addMember} loading={loading}/>}
          {page==="status_meeting"&&<StatusMeetingPage user={user} rc={rc} members={members} candidates={myCands} allCandidates={candidates} logs={logs} token={user?.token} onRefresh={()=>loadData()}/>}
          {page==="overall_status"&&<OverallStatusPage user={user} members={members} candidates={candidates} logs={logs} token={user?.token}/>}
          {page==="notifications"&&<NotifsPage notifications={notifications} onRefresh={()=>loadData()} onMarkRead={markRead} onMarkAllRead={markAllRead}/>}
        </div>
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function DashPage({user,rc,candidates,allCandidates,logs,getMember,onNav,onRefresh,members,token}){
  const [expandedMonth,setExpandedMonth]=useState(null);
  const [expandedInterview,setExpandedInterview]=useState(null);
  const [interviewSessions,setInterviewSessions]=useState([]);
  useEffect(()=>{
    if(token&&user.role==="president"){
      sb.get("interview_sessions","select=*&order=interview_date.desc&limit=20",token).then(r=>{if(Array.isArray(r))setInterviewSessions(r);});
    }
  },[token]);
  const myLogs=rc.canViewAll?logs:logs.filter(l=>l.user_id===user.id);
  const todayLogs=myLogs.filter(l=>l.log_date===today());
  const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
  const wLogs=logs.filter(l=>l.type==="recruiter"&&new Date(l.log_date)>=weekAgo);

  // Week number
  const now=new Date();
  const startOfYear=new Date(now.getFullYear(),0,1);
  const weekNum=Math.ceil(((now-startOfYear)/86400000+startOfYear.getDay()+1)/7);

  // Placements this month
  const thisMonth=now.getMonth();
  const thisYear=now.getFullYear();
  const allCands=allCandidates||candidates;
  const placedThisMonth=allCands.filter(c=>{
    if(c.status!=="Placed"||!c.status_updated_at)return false;
    const d=new Date(c.status_updated_at);
    return d.getMonth()===thisMonth&&d.getFullYear()===thisYear;
  });

  // Monthly closures - Jan to current month this year
  const MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyClosures=MONTHS.slice(0,thisMonth+1).map((m,i)=>{
    const placed=allCands.filter(c=>{
      if(c.status!=="Placed"||!c.status_updated_at)return false;
      const d=new Date(c.status_updated_at);
      return d.getMonth()===i&&d.getFullYear()===thisYear;
    });
    return {month:m,monthIdx:i,count:placed.length,candidates:placed};
  }).reverse();

  const totalClosures=allCands.filter(c=>c.status==="Placed").length;

  return <div>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
      <div style={{ fontSize:20, fontWeight:700 }}>Welcome back, {user.name}!</div>
      <Btn variant="outline" onClick={onRefresh} style={{ fontSize:12, padding:"5px 12px" }}>↻ Refresh</Btn>
    </div>
    <div style={{ fontSize:13, color:"#94A3B8", marginBottom:20 }}>
      Week {weekNum} of {thisYear} · {placedThisMonth.length} placement{placedThisMonth.length!==1?"s":""} this month
    </div>

    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:20 }}>
      <StatCard label="My candidates" value={candidates.length} color="#2563EB" sub="assigned to you"/>
      <StatCard label="Today's logs" value={todayLogs.length} color="#7C3AED" sub="submitted today"/>
      {rc.canViewAll&&<StatCard label="Emails this week" value={wLogs.reduce((s,l)=>s+(l.emails_sent||0),0)} color="#0F766E" sub="all recruiters"/>}
      {rc.canViewAll&&<StatCard label="Submissions week" value={wLogs.reduce((s,l)=>s+(l.submissions||0),0)} color="#D97706" sub="all recruiters"/>}
    </div>

    {/* President sections */}
    {user.role==="president"&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>

      {/* Closures This Year */}
      <Card>
        <CardHeader title={`Closures ${thisYear}`} action={<span style={{ fontSize:12, fontWeight:700, color:"#7C3AED", background:"#F5F3FF", padding:"3px 10px", borderRadius:99 }}>Total: {totalClosures}</span>}/>
        <div style={{ padding:"0 0 8px" }}>
          {monthlyClosures.map(m=><div key={m.monthIdx}>
            <div onClick={()=>setExpandedMonth(expandedMonth===m.monthIdx?null:m.monthIdx)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:expandedMonth===m.monthIdx?"#F5F3FF":"transparent" }}>
              <div style={{ fontSize:13, fontWeight:600, color:expandedMonth===m.monthIdx?"#7C3AED":"#0F172A" }}>{m.month} {thisYear}</div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:13, fontWeight:700, color:m.count>0?"#7C3AED":"#94A3B8" }}>{m.count} placement{m.count!==1?"s":""}</span>
                <span style={{ fontSize:11, color:"#94A3B8" }}>{expandedMonth===m.monthIdx?"▲":"▼"}</span>
              </div>
            </div>
            {expandedMonth===m.monthIdx&&<div style={{ background:"#FAFAFF", borderBottom:"1px solid #E2E8F0" }}>
              {m.candidates.length===0&&<div style={{ padding:"12px 16px", fontSize:13, color:"#94A3B8" }}>No placements this month.</div>}
              {m.candidates.map(c=><div key={c.id} style={{ padding:"12px 16px", borderBottom:"1px solid #F1F5F9" }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>{c.name} · {c.tech}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:4, fontSize:11, color:"#475569" }}>
                  {c.vendor_name&&<div>Vendor: <strong>{c.vendor_name}</strong></div>}
                  {c.prime_vendor&&<div>Prime: <strong>{c.prime_vendor}</strong></div>}
                  {c.end_client&&<div>Client: <strong>{c.end_client}</strong></div>}
                  {c.project_start_date&&<div>Start: <strong>{fmtDate(c.project_start_date)}</strong></div>}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:6 }}>
                  {c.recruiter_id&&<span style={{ background:"#F0FDF4", color:"#16A34A", fontSize:10, padding:"1px 7px", borderRadius:99, fontWeight:600 }}>Rec: {getMember(c.recruiter_id)?.name||"?"}</span>}
                  {c.r_lead_id&&<span style={{ background:"#EFF6FF", color:"#2563EB", fontSize:10, padding:"1px 7px", borderRadius:99, fontWeight:600 }}>R Lead: {getMember(c.r_lead_id)?.name||"?"}</span>}
                  {c.c_lead_id&&<span style={{ background:"#FFFBEB", color:"#D97706", fontSize:10, padding:"1px 7px", borderRadius:99, fontWeight:600 }}>C Lead: {getMember(c.c_lead_id)?.name||"?"}</span>}
                  {c.interview_coord_id&&<span style={{ background:"#FEF2F2", color:"#DC2626", fontSize:10, padding:"1px 7px", borderRadius:99, fontWeight:600 }}>IC: {getMember(c.interview_coord_id)?.name||"?"}</span>}
                </div>
              </div>)}
            </div>}
          </div>)}
        </div>
      </Card>

      {/* Interview Feedbacks - Pending & Recent */}
      <Card>
        <CardHeader title={`Interview Feedbacks`} action={<span style={{fontSize:11,color:"#D97706",background:"#FFFBEB",padding:"2px 8px",borderRadius:99,fontWeight:600}}>{interviewSessions.filter(s=>s.feedback_status==="waiting"||!s.feedback_status).length} pending</span>}/>
        <div style={{ padding:"0 0 8px" }}>
          {/* Pending feedbacks first */}
          {interviewSessions.filter(s=>s.feedback_status==="waiting"||!s.feedback_status).length>0&&<div style={{padding:"10px 16px",borderBottom:"1px solid #F1F5F9",background:"#FFFBEB"}}>
            <div style={{fontSize:11,fontWeight:700,color:"#D97706",marginBottom:8}}>WAITING FOR FEEDBACK</div>
            {interviewSessions.filter(s=>s.feedback_status==="waiting"||!s.feedback_status).map(s=>{
              const cand=allCands.find(c=>c.id===s.candidate_id);
              const ROUNDS={round_1:"Round 1",round_2:"Round 2",round_3:"Round 3",round_4:"Round 4",round_5:"Round 5",round_6:"Round 6",final:"Final"};
              return <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:"#0F172A"}}>{cand?.name||"?"} — {ROUNDS[s.round]||s.round}</div>
                  {s.feedback_from&&<div style={{fontSize:11,color:"#D97706"}}>Need to receive feedback from {s.feedback_from}</div>}
                </div>
                <div style={{fontSize:11,color:"#94A3B8"}}>{fmtDate(s.interview_date)}</div>
              </div>;
            })}
          </div>}
          {interviewSessions.length===0&&<div style={{ padding:"16px", fontSize:13, color:"#94A3B8" }}>No interview sessions yet.</div>}
          {interviewSessions.filter(s=>s.feedback_status==="received").slice(0,5).map(s=>{
            const cand=allCands.find(c=>c.id===s.candidate_id);
            const ROUNDS={round_1:"Round 1",round_2:"Round 2",round_3:"Round 3",round_4:"Round 4",round_5:"Round 5",round_6:"Round 6",final:"Final"};
            const fbColor=s.overall_feedback==="went_well"?"#16A34A":s.overall_feedback==="okay"?"#D97706":"#DC2626";
            const fbBg=s.overall_feedback==="went_well"?"#F0FDF4":s.overall_feedback==="okay"?"#FFFBEB":"#FEF2F2";
            const fbLabel=s.overall_feedback==="went_well"?"Went Well":s.overall_feedback==="okay"?"Okay":"Not Went Well";
            return <div key={s.id}>
              <div onClick={()=>setExpandedInterview(expandedInterview===s.id?null:s.id)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 16px", borderBottom:"1px solid #F1F5F9", cursor:"pointer", background:expandedInterview===s.id?"#F8FAFC":"transparent" }}>
                <div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{cand?.name||"?"}</div>
                  <div style={{ fontSize:11, color:"#94A3B8" }}>{ROUNDS[s.round]||s.round} · {fmtDate(s.interview_date)}</div>
                  {s.with_whom&&<div style={{ fontSize:11, color:"#2563EB", marginTop:1 }}>{s.with_whom}</div>}
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ background:fbBg, color:fbColor, fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:600 }}>{fbLabel}</span>
                  <span style={{ fontSize:11, color:"#94A3B8" }}>{expandedInterview===s.id?"▲":"▼"}</span>
                </div>
              </div>
              {expandedInterview===s.id&&<div style={{ background:"#F8FAFC", borderBottom:"1px solid #E2E8F0", padding:"12px 16px" }}>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 }}>
                  <span style={{ background:"#F5F3FF", color:"#7C3AED", fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:600 }}>{({less_30:"<30 min","30_min":"30 min","45_min":"45 min","1_hour":"1 Hour","1_30_hour":"1.5 Hours","2_hours":"2 Hours","3_hours":"3 Hours"})[s.duration]||s.duration}</span>
                  <span style={{ background:"#EFF6FF", color:"#2563EB", fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:600 }}>{s.interview_mode==="virtual"?"Virtual":"In-person"}</span>
                  {s.tech_support_name&&<span style={{ background:"#F0FDF4", color:"#16A34A", fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:600 }}>Support: {s.tech_support_name}</span>}
                  {s.support_mode&&<span style={{ background:"#FFFBEB", color:"#D97706", fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:600 }}>{s.support_mode}</span>}
                </div>
                {s.detailed_feedback&&<div style={{ fontSize:12, color:"#334155", lineHeight:1.6, background:"#fff", borderRadius:8, padding:"8px 12px", border:"1px solid #E2E8F0" }}>{s.detailed_feedback}</div>}
              </div>}
            </div>;
          })}
        </div>
      </Card>

    </div>}

    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card><CardHeader title="My Candidates" action={<Btn variant="outline" onClick={()=>onNav("candidates")} style={{ fontSize:12, padding:"5px 10px" }}>View all</Btn>}/>
        {candidates.slice(0,5).map(c=><div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom:"1px solid #F1F5F9" }}><Av name={c.name} role="r_lead" size={34}/><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div><div style={{ fontSize:11, color:"#94A3B8" }}>{c.tech}</div></div><StatusBadge status={c.status}/></div>)}
        {candidates.length===0&&<div style={{ padding:24, textAlign:"center", fontSize:13, color:"#94A3B8" }}>No candidates assigned yet.</div>}
      </Card>
      <Card><CardHeader title="Recent Logs" action={<Btn variant="outline" onClick={()=>onNav("logs_history")} style={{ fontSize:12, padding:"5px 10px" }}>View all</Btn>}/>
        {myLogs.slice(0,5).map(l=>{const cand=candidates.find(c=>c.id===l.candidate_id);const m=getMember(l.user_id);return<div key={l.id} style={{ padding:"10px 16px", borderBottom:"1px solid #F1F5F9" }}><div style={{ display:"flex", justifyContent:"space-between" }}><div style={{ fontSize:12, fontWeight:600 }}>{m?.name} <span style={{ color:"#94A3B8", fontWeight:400 }}>→ {cand?.name||"?"}</span></div><RoleBadge role={l.type==="manager_feedback"?"manager":l.type}/></div><div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{fmtDate(l.log_date)} · {l.log_time}</div>{l.type==="recruiter"&&<div style={{ fontSize:11, color:"#475569", marginTop:3 }}>Emails: {l.emails_sent} emails · Subs: {l.submissions} subs</div>}</div>;})}
        {myLogs.length===0&&<div style={{ padding:24, textAlign:"center", fontSize:13, color:"#94A3B8" }}>No logs yet.</div>}
      </Card>
    </div>
  </div>;
}

// ─── CANDIDATES PAGE (Manager view with tabs) ───────────────────────────────
function CandPage({user,rc,candidates,members,onAdd,onAddMember,logs,getMember,loading,timeline,onAddTimeline,token,onRefresh}){
  const [selectedCand,setSelectedCand]=useState(null);

  return <div>
    <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>
      {selectedCand ? <span style={{ cursor:"pointer", color:"#94A3B8", fontSize:14 }} onClick={()=>setSelectedCand(null)}>← Back</span> : "Candidates"}
    </div>
    {selectedCand ? (
      <CandidateProfile candidate={selectedCand} members={members} logs={logs} timeline={timeline} getMember={getMember} onAddTimeline={onAddTimeline} loading={loading} user={user} onBack={()=>setSelectedCand(null)} token={user?.token} onRefresh={()=>window.location.reload()}/>
    ) : (
      <CandidatesTab candidates={candidates} members={members} onAdd={onAdd} logs={logs} getMember={getMember} loading={loading} rc={rc} onSelectCand={setSelectedCand}/>
    )}
  </div>;
}

// ─── CANDIDATES TAB ─────────────────────────────────────────────────────────
function CandidatesTab({candidates,members,onAdd,logs,getMember,loading,rc,onSelectCand}){
  const [showAdd,setShowAdd]=useState(false); const [form,setForm]=useState({});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const byRole=role=>members.filter(m=>m.role===role);
  const submit=()=>{if(!form.name?.trim()||!form.tech?.trim())return alert("Name and tech required");if(!form.recruiter_id||!form.r_lead_id||!form.c_lead_id||!form.interview_coord_id)return alert("Assign all 4 team members");onAdd(form);setForm({});setShowAdd(false);};
  return <div>
    <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
      {rc.canAddCandidate&&<Btn onClick={()=>setShowAdd(true)}>+ Add Candidate</Btn>}
    </div>
    {candidates.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94A3B8", fontSize:14 }}>{rc.canAddCandidate?"No candidates yet.":"No candidates assigned."}</div>}
    <div style={{ display:"grid", gap:12 }}>
      {candidates.map(c=>{
        const cLogs=logs.filter(l=>l.candidate_id===c.id); const lastLog=cLogs[0];
        return <Card key={c.id} style={{ padding:18 }} onClick={()=>onSelectCand(c)}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}><Av name={c.name} role="president" size={44}/><div><div style={{ fontSize:16, fontWeight:700 }}>{c.name}</div><div style={{ fontSize:12, color:"#94A3B8" }}>{c.tech} · Marketing started: {fmtDate(c.marketing_start_date||c.added_on)}</div></div></div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}><StatusBadge status={c.status}/><span style={{ fontSize:11, color:"#94A3B8" }}> View Profile</span></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8, marginBottom:lastLog?10:0 }}>
            {[["Recruiter",c.recruiter_id,"recruiter"],["R Lead",c.r_lead_id,"r_lead"],["C Lead",c.c_lead_id,"c_lead"],["IC",c.interview_coord_id,"interview_coord"]].map(([lbl,id,role])=>{
              const m=getMember(id);const rc2=ROLE_CONFIG[role];
              return <div key={lbl} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 10px", background:rc2.bg, borderRadius:8 }}><Av name={m?.name||"?"} role={role} size={26}/><div><div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>{lbl}</div><div style={{ fontSize:12, fontWeight:600, color:rc2.color }}>{m?.name||"Unassigned"}</div></div></div>;
            })}
          </div>
          {lastLog&&<div style={{ fontSize:11, color:"#94A3B8", background:"#F8FAFC", padding:"6px 10px", borderRadius:6 }}>Last log: {fmtDate(lastLog.log_date)} · {cLogs.length} total logs</div>}
        </Card>;
      })}
    </div>
    <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add New Candidate">
      <Input label="Full name *" value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="e.g. Arjun Sharma"/>
      <Input label="Tech stack *" value={form.tech||""} onChange={e=>set("tech",e.target.value)} placeholder="e.g. Java Full Stack"/>
      <Input label="Marketing start date *" type="date" value={form.marketing_start_date||""} onChange={e=>set("marketing_start_date",e.target.value)}/>
      <Select label="Assign Recruiter *" value={form.recruiter_id||""} onChange={e=>set("recruiter_id",e.target.value)}><option value="">-- Select --</option>{byRole("recruiter").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select>
      <Select label="Assign R Lead *" value={form.r_lead_id||""} onChange={e=>set("r_lead_id",e.target.value)}><option value="">-- Select --</option>{byRole("r_lead").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select>
      <Select label="Assign C Lead *" value={form.c_lead_id||""} onChange={e=>set("c_lead_id",e.target.value)}><option value="">-- Select --</option>{byRole("c_lead").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select>
      <Select label="Assign IC *" value={form.interview_coord_id||""} onChange={e=>set("interview_coord_id",e.target.value)}><option value="">-- Select --</option>{byRole("interview_coord").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select>
      <Textarea label="Notes (optional)" value={form.notes||""} onChange={e=>set("notes",e.target.value)}/>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn onClick={submit} disabled={loading}>{loading?"Adding...":"Add Candidate"}</Btn></div>
    </Modal>
  </div>;
}

// ─── RECRUITERS TAB (Manager only) ──────────────────────────────────────────
function RecruitersTab({members,candidates,logs,onAddMember,loading,getMember,onSelectCand,token,onRefresh}){
  const [showAdd,setShowAdd]=useState(false);
  const [showDeactivate,setShowDeactivate]=useState(null); // rec object
  const [deactForm,setDeactForm]=useState({});
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const setD=(k,v)=>setDeactForm(p=>({...p,[k]:v}));
  const rLeads=members.filter(m=>m.role==="r_lead");
  const recruiters=members.filter(m=>m.role==="recruiter"&&m.is_active!==false);
  const inactiveRecruiters=members.filter(m=>m.role==="recruiter"&&m.is_active===false);
  const submit=()=>{
    if(!form.name?.trim()||!form.email?.trim())return alert("Name and email required");
    if(!form.r_lead_team)return alert("Assign R Lead team");
    onAddMember({...form,role:"recruiter"});setForm({});setShowAdd(false);
  };

  const recCands=showDeactivate?candidates.filter(c=>c.recruiter_id===showDeactivate.id&&c.status==="Active"):[];

  const submitDeactivation=async()=>{
    if(!deactForm.end_date)return alert("End date is mandatory");
    // Check all candidates reassigned
    for(const c of recCands){
      if(!deactForm[`rec_${c.id}`])return alert(`Please assign new recruiter for ${c.name}`);
      if(!deactForm[`rec_start_${c.id}`])return alert(`Please set start date for ${c.name}`);
    }
    setSaving(true);
    try {
      // 1. Mark recruiter as inactive
      await sb.patch("team_members",showDeactivate.id,{is_active:false},token);
      // 2. Log deactivation
      await sb.post("member_deactivations",{member_id:showDeactivate.id,end_date:deactForm.end_date,deactivated_by:null,reason:deactForm.reason||""},token);
      // 3. Reassign each candidate
      for(const c of recCands){
        const yesterday=new Date(deactForm.end_date);yesterday.setDate(yesterday.getDate()-1);
        const yStr=yesterday.toISOString().split("T")[0];
        // End current assignment
        const curAssign=await sb.get("candidate_assignments",`candidate_id=eq.${c.id}&assignment_type=eq.recruiter&end_date=is.null`,token);
        if(Array.isArray(curAssign)&&curAssign.length>0){
          await sb.patch("candidate_assignments",curAssign[0].id,{end_date:yStr},token);
        }
        // New recruiter assignment
        await sb.post("candidate_assignments",{candidate_id:c.id,assignment_type:"recruiter",member_id:deactForm[`rec_${c.id}`],start_date:deactForm[`rec_start_${c.id}`]},token);
        // Update candidate record
        const updateData={recruiter_id:deactForm[`rec_${c.id}`]};
        if(deactForm[`rlead_${c.id}`]&&deactForm[`rlead_${c.id}`]!=="same") updateData.r_lead_id=deactForm[`rlead_${c.id}`];
        if(deactForm[`clead_${c.id}`]&&deactForm[`clead_${c.id}`]!=="same") updateData.c_lead_id=deactForm[`clead_${c.id}`];
        if(deactForm[`ic_${c.id}`]&&deactForm[`ic_${c.id}`]!=="same") updateData.interview_coord_id=deactForm[`ic_${c.id}`];
        await sb.patch("candidates",c.id,updateData,token);
      }
      setShowDeactivate(null);setDeactForm({});
      if(onRefresh)onRefresh();
      alert("Recruiter deactivated and candidates reassigned successfully!");
    } catch(e){alert("Error: "+e.message);}
    setSaving(false);
  };
  return <div>
    <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}>
      <Btn onClick={()=>setShowAdd(true)}>+ Add Recruiter</Btn>
    </div>
    {recruiters.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94A3B8", fontSize:14 }}>No recruiters yet. Add your first recruiter!</div>}
    <div style={{ display:"grid", gap:12 }}>
      {recruiters.map(r=>{
        const rCands=candidates.filter(c=>c.recruiter_id===r.id);
        const rLead=getMember(r.r_lead_team);
        const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
        const wLogs=logs.filter(l=>l.user_id===r.id&&l.type==="recruiter"&&new Date(l.log_date)>=weekAgo);
        const emails=wLogs.reduce((s,l)=>s+(l.emails_sent||0),0);
        const subs=wLogs.reduce((s,l)=>s+(l.submissions||0),0);
        return <Card key={r.id} style={{ padding:18 }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:12 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <Av name={r.name} role="recruiter" size={44}/>
              <div>
                <div style={{ fontSize:16, fontWeight:700 }}>{r.name}</div>
                <div style={{ fontSize:12, color:"#94A3B8" }}>{r.email}</div>
                {rLead&&<div style={{ fontSize:11, color:"#2563EB", marginTop:2 }}>Team: {rLead.name}</div>}
              </div>
            </div>
            <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, padding:"8px 14px", fontSize:12 }}>
              <div style={{ color:"#94A3B8", fontSize:10, fontWeight:600 }}>LOGIN</div>
              <div style={{ fontWeight:600, color:"#2563EB" }}>{r.email}</div>
              <div style={{ color:"#94A3B8" }}>Password: VARS@2026</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:12 }}>
            <div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px", textAlign:"center" }}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>CANDIDATES</div><div style={{ fontSize:20, fontWeight:800, color:"#2563EB" }}>{rCands.length}</div></div>
            <div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px", textAlign:"center" }}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>LOGS (WEEK)</div><div style={{ fontSize:20, fontWeight:800, color:"#7C3AED" }}>{wLogs.length}</div></div>
            <div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px", textAlign:"center" }}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>EMAILS (WEEK)</div><div style={{ fontSize:20, fontWeight:800, color:"#0F766E" }}>{emails}</div></div>
            <div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px", textAlign:"center" }}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>SUBS (WEEK)</div><div style={{ fontSize:20, fontWeight:800, color:"#D97706" }}>{subs}</div></div>
          </div>
          <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:8 }}>Assigned Candidates:</div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:10 }}>
            {rCands.map(c=><span key={c.id} onClick={()=>onSelectCand(c)} style={{ background:c.status==="Placed"?"#F5F3FF":c.status==="Dropped"?"#FEF2F2":"#EFF6FF", color:c.status==="Placed"?"#7C3AED":c.status==="Dropped"?"#DC2626":"#2563EB", fontSize:12, padding:"4px 10px", borderRadius:6, cursor:"pointer", fontWeight:500 }}>{c.status==="Placed"?" ":c.status==="Dropped"?" ":""}{c.name} · {c.tech}</span>)}
            {rCands.length===0&&<span style={{ fontSize:12, color:"#94A3B8" }}>No candidates assigned yet.</span>}
          </div>
          <button onClick={()=>{setShowDeactivate(r);setDeactForm({});}} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA" }}>End Association</button>
        </Card>;
      })}
    </div>

    {/* Deactivation Modal */}
    <Modal open={!!showDeactivate} onClose={()=>setShowDeactivate(null)} title={`End Association — ${showDeactivate?.name}`}>
      <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#DC2626", marginBottom:16 }}>
        Note: This will deactivate {showDeactivate?.name} and reassign all their candidates.
      </div>
      <Input label="Last working date *" type="date" value={deactForm.end_date||""} onChange={e=>setD("end_date",e.target.value)}/>
      <div style={{ marginBottom:12 }}>
        <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>Reason (optional)</label>
        <input value={deactForm.reason||""} onChange={e=>setD("reason",e.target.value)} placeholder="Reason for ending association..." style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:8, padding:"8px 12px", fontSize:13, outline:"none", boxSizing:"border-box" }}/>
      </div>
      {recCands.length>0&&<>
        <div style={{ fontSize:13, fontWeight:700, color:"#475569", marginBottom:10 }}>Reassign {recCands.length} active candidate(s):</div>
        {recCands.map(c=><div key={c.id} style={{ background:"#F8FAFC", border:"1px solid #E2E8F0", borderRadius:10, padding:"12px 14px", marginBottom:10 }}>
          <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>{c.name} · {c.tech}</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#475569", marginBottom:4 }}>New Recruiter *</label>
              <select value={deactForm[`rec_${c.id}`]||""} onChange={e=>setD(`rec_${c.id}`,e.target.value)} style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:6, padding:"6px 10px", fontSize:12, outline:"none" }}>
                <option value="">-- Select --</option>
                {members.filter(m=>m.role==="recruiter"&&m.id!==showDeactivate?.id&&m.is_active!==false).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#475569", marginBottom:4 }}>New Rec Start Date *</label>
              <input type="date" value={deactForm[`rec_start_${c.id}`]||""} onChange={e=>setD(`rec_start_${c.id}`,e.target.value)} style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:6, padding:"6px 10px", fontSize:12, outline:"none" }}/>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#475569", marginBottom:4 }}>R Lead</label>
              <select value={deactForm[`rlead_${c.id}`]||"same"} onChange={e=>setD(`rlead_${c.id}`,e.target.value)} style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:6, padding:"6px 10px", fontSize:12, outline:"none" }}>
                <option value="same">Same ({getMember(c.r_lead_id)?.name||"?"})</option>
                {members.filter(m=>m.role==="r_lead").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#475569", marginBottom:4 }}>C Lead</label>
              <select value={deactForm[`clead_${c.id}`]||"same"} onChange={e=>setD(`clead_${c.id}`,e.target.value)} style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:6, padding:"6px 10px", fontSize:12, outline:"none" }}>
                <option value="same">Same ({getMember(c.c_lead_id)?.name||"?"})</option>
                {members.filter(m=>m.role==="c_lead").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display:"block", fontSize:11, fontWeight:600, color:"#475569", marginBottom:4 }}>IC</label>
              <select value={deactForm[`ic_${c.id}`]||"same"} onChange={e=>setD(`ic_${c.id}`,e.target.value)} style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:6, padding:"6px 10px", fontSize:12, outline:"none" }}>
                <option value="same">Same ({getMember(c.interview_coord_id)?.name||"?"})</option>
                {members.filter(m=>m.role==="interview_coord").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>)}
      </>}
      {recCands.length===0&&<div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#16A34A", marginBottom:12 }}> No active candidates to reassign.</div>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="outline" onClick={()=>setShowDeactivate(null)}>Cancel</Btn>
        <Btn variant="danger" onClick={submitDeactivation} disabled={saving}>{saving?"Processing...":"Confirm End Association"}</Btn>
      </div>
    </Modal>

    <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add New Recruiter">
      <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#2563EB", marginBottom:16 }}> Login credentials auto-created. Default password: <strong>VARS@2026</strong></div>
      <Input label="Full name *" value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="e.g. John Smith"/>
      <Input label="Work email *" type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} placeholder="john@varsconsultinginc.com"/>
      <Select label="Assign to R Lead team *" value={form.r_lead_team||""} onChange={e=>set("r_lead_team",e.target.value)}><option value="">-- Select R Lead --</option>{rLeads.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn onClick={submit} disabled={loading}>{loading?"Adding...":"Add Recruiter"}</Btn></div>
    </Modal>
  </div>;
}

// ─── CANDIDATE PROFILE (360° view) ─────────────────────────────────────────
function CandidateProfile({candidate,members,logs,timeline,getMember,onAddTimeline,loading,user,onBack,token,onRefresh}){
  const [tab,setTab]=useState("overview");
  const [showAdd,setShowAdd]=useState(false); const [form,setForm]=useState({});
  const [showChangeRec,setShowChangeRec]=useState(false);
  const [showChangeRLead,setShowChangeRLead]=useState(false);
  const [showPlaced,setShowPlaced]=useState(false);
  const [showDropped,setShowDropped]=useState(false);
  const [assignments,setAssignments]=useState([]);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const candTimeline=timeline.filter(t=>t.candidate_id===candidate.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const candLogs=logs.filter(l=>l.candidate_id===candidate.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const canAddTimeline=["r_lead","manager","president","interview_coord","c_lead"].includes(user.role);
  const isManager=user.role==="manager"||user.role==="president";

  useEffect(()=>{
    if(token){
      sb.get("candidate_assignments",`candidate_id=eq.${candidate.id}&order=created_at.desc`,token).then(r=>{if(Array.isArray(r))setAssignments(r);});
    }
  },[candidate.id,token]);

  const changeAssignment=async(type,newMemberId)=>{
    if(!newMemberId)return alert("Select a team member");
    try {
      const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
      const yStr=yesterday.toISOString().split("T")[0];

      // Find current active assignment for this type
      const current=assignments.find(a=>a.assignment_type===type&&!a.end_date);
      if(current){
        // Set end date on current
        const patchRes=await sb.patch("candidate_assignments",current.id,{end_date:yStr},token);
        console.log("Patch result:",patchRes);
      } else {
        // No existing history — create entry for current person with end date
        const currentMemberId=type==="recruiter"?candidate.recruiter_id:candidate.r_lead_id;
        if(currentMemberId){
          await sb.post("candidate_assignments",{
            candidate_id:candidate.id,
            assignment_type:type,
            member_id:currentMemberId,
            start_date:candidate.added_on||today(),
            end_date:yStr,
            changed_by:user.id
          },token);
        }
      }

      // Add new assignment entry
      await sb.post("candidate_assignments",{
        candidate_id:candidate.id,
        assignment_type:type,
        member_id:newMemberId,
        start_date:today(),
        end_date:null,
        changed_by:user.id
      },token);

      // Update candidate record
      const updateField=type==="recruiter"?"recruiter_id":"r_lead_id";
      await sb.patch("candidates",candidate.id,{[updateField]:newMemberId},token);

      // Reload assignments
      const r=await sb.get("candidate_assignments",`candidate_id=eq.${candidate.id}&order=created_at.desc`,token);
      if(Array.isArray(r))setAssignments(r);
      setShowChangeRec(false);setShowChangeRLead(false);setForm({});
      if(onRefresh)onRefresh();
      alert(type==="recruiter"?"Recruiter changed successfully!":"R Lead changed successfully!");
    } catch(e){
      console.error("Change assignment error:",e);
      alert("Error changing assignment: "+e.message);
    }
  };

  const submit=()=>{
    if(!form.entry_type)return alert("Select entry type");
    if(!form.title?.trim())return alert("Title required");
    onAddTimeline({...form,candidate_id:candidate.id});
    setForm({});setShowAdd(false);
  };

  const tabs=[
    {id:"overview",label:"Overview"},
    {id:"timeline",label:`Timeline (${candTimeline.length})`},
    {id:"daily_logs",label:`Daily Logs (${candLogs.length})`},
    {id:"assignment_history",label:"Assignment History"},
  ];

  const recHistory=assignments.filter(a=>a.assignment_type==="recruiter");
  const rLeadHistory=assignments.filter(a=>a.assignment_type==="r_lead");

  return <div>
    <button onClick={onBack} style={{ background:"none", border:"none", color:"#2563EB", cursor:"pointer", fontSize:13, fontWeight:600, marginBottom:16, padding:0 }}>← Back to candidates</button>
    <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20, padding:"20px", background:"#fff", border:"1px solid #E2E8F0", borderRadius:12 }}>
      <Av name={candidate.name} role="president" size={56}/>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:22, fontWeight:800 }}>{candidate.name}</div>
        <div style={{ fontSize:12, color:"#94A3B8", marginTop:2 }}>{candidate.tech} · Marketing started: {fmtDate(candidate.marketing_start_date||candidate.added_on)}</div>
        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          {[["Recruiter",candidate.recruiter_id,"recruiter"],["R Lead",candidate.r_lead_id,"r_lead"],["C Lead",candidate.c_lead_id,"c_lead"],["IC",candidate.interview_coord_id,"interview_coord"]].map(([lbl,id,role])=>{
            const m=getMember(id);const rc2=ROLE_CONFIG[role];
            return <span key={lbl} style={{ background:rc2.bg, color:rc2.color, fontSize:11, padding:"3px 10px", borderRadius:99, fontWeight:600 }}>{lbl}: {m?.name||"?"}</span>;
          })}
        </div>
        {isManager&&<div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
          <button onClick={()=>{setShowChangeRec(true);setForm({});}} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:"#F0FDF4", color:"#16A34A", border:"1px solid #BBF7D0" }}>Change Recruiter</button>
          <button onClick={()=>{setShowChangeRLead(true);setForm({});}} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:"#EFF6FF", color:"#2563EB", border:"1px solid #BFDBFE" }}>Change R Lead</button>
          {candidate.status==="Active"&&<>
            <button onClick={()=>{setShowPlaced(true);setForm({});}} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:"#F5F3FF", color:"#7C3AED", border:"1px solid #DDD6FE" }}>Mark as Placed</button>
            <button onClick={()=>{setShowDropped(true);setForm({});}} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:"#FEF2F2", color:"#DC2626", border:"1px solid #FECACA" }}>Mark as Dropped</button>
          </>}
          {(candidate.status==="Placed"||candidate.status==="Dropped")&&<button onClick={async()=>{await sb.patch("candidates",candidate.id,{status:"Active",status_reason:null,vendor_name:null,prime_vendor:null,end_client:null,project_start_date:null},token);if(onRefresh)onRefresh();alert("Candidate reactivated!");}} style={{ padding:"5px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:"#F0FDF4", color:"#16A34A", border:"1px solid #BBF7D0" }}>Reactivate</button>}
        </div>}
      </div>
      <StatusBadge status={candidate.status}/>
    </div>
    
    {/* Change Recruiter Modal */}
    <Modal open={showChangeRec} onClose={()=>setShowChangeRec(false)} title="Change Recruiter">
      <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#D97706", marginBottom:16 }}>
        Note: Current recruiter's end date will be set to yesterday automatically. New recruiter starts from today.
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:4 }}>Current Recruiter:</div>
        <div style={{ fontSize:14, fontWeight:700 }}>{getMember(candidate.recruiter_id)?.name||"Not assigned"}</div>
        <div style={{ fontSize:11, color:"#94A3B8" }}>Will end: {new Date(Date.now()-86400000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
      </div>
      <Select label="Select new recruiter *" value={form.new_member_id||""} onChange={e=>set("new_member_id",e.target.value)}>
        <option value="">-- Select recruiter --</option>
        {members.filter(m=>m.role==="recruiter"&&m.id!==candidate.recruiter_id).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
      </Select>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="outline" onClick={()=>setShowChangeRec(false)}>Cancel</Btn>
        <Btn onClick={()=>changeAssignment("recruiter",form.new_member_id)}>Confirm Change</Btn>
      </div>
    </Modal>

    {/* Mark as Placed Modal */}
    <Modal open={showPlaced} onClose={()=>setShowPlaced(false)} title="Mark as Placed">
      <div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#7C3AED", marginBottom:16 }}>
        Candidate will be marked as Placed. They will no longer appear in daily log candidate selection.
      </div>
      <Input label="Vendor Name *" value={form.vendor_name||""} onChange={e=>set("vendor_name",e.target.value)} placeholder="e.g. TechCorp Solutions"/>
      <Input label="Prime Vendor / Implementation Partner *" value={form.prime_vendor||""} onChange={e=>set("prime_vendor",e.target.value)} placeholder="e.g. Infosys, Wipro"/>
      <Input label="End Client *" value={form.end_client||""} onChange={e=>set("end_client",e.target.value)} placeholder="e.g. Bank of America"/>
      <Input label="Project Start Date *" type="date" value={form.project_start_date||""} onChange={e=>set("project_start_date",e.target.value)}/>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="outline" onClick={()=>setShowPlaced(false)}>Cancel</Btn>
        <Btn onClick={async()=>{
          if(!form.vendor_name?.trim())return alert("Vendor name required");
          if(!form.prime_vendor?.trim())return alert("Prime vendor required");
          if(!form.end_client?.trim())return alert("End client required");
          if(!form.project_start_date)return alert("Project start date required");
          try {
            await sb.patch("candidates",candidate.id,{status:"Placed",vendor_name:form.vendor_name,prime_vendor:form.prime_vendor,end_client:form.end_client,project_start_date:form.project_start_date,status_updated_at:new Date().toISOString()},token);
            setShowPlaced(false);setForm({});
            if(onRefresh)onRefresh();
            alert("Candidate marked as Placed! ");
          } catch(e){alert("Error updating status");}
        }}>Confirm Placed</Btn>
      </div>
    </Modal>

    {/* Mark as Dropped Modal */}
    <Modal open={showDropped} onClose={()=>setShowDropped(false)} title="Mark as Dropped">
      <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#DC2626", marginBottom:16 }}>
        Candidate will be marked as Dropped. They will no longer appear in daily log candidate selection.
      </div>
      <Textarea label="Reason for dropping *" value={form.status_reason||""} onChange={e=>set("status_reason",e.target.value)} placeholder="Why is this candidate being dropped from marketing?"/>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="outline" onClick={()=>setShowDropped(false)}>Cancel</Btn>
        <Btn variant="danger" onClick={async()=>{
          if(!form.status_reason?.trim())return alert("Reason is mandatory");
          try {
            await sb.patch("candidates",candidate.id,{status:"Dropped",status_reason:form.status_reason,status_updated_at:new Date().toISOString()},token);
            setShowDropped(false);setForm({});
            if(onRefresh)onRefresh();
            alert("Candidate marked as Dropped.");
          } catch(e){alert("Error updating status");}
        }}>Confirm Drop</Btn>
      </div>
    </Modal>

    {/* Change R Lead Modal */}
    <Modal open={showChangeRLead} onClose={()=>setShowChangeRLead(false)} title="Change R Lead">
      <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#D97706", marginBottom:16 }}>
        Note: Current R Lead's end date will be set to yesterday automatically. New R Lead starts from today.
      </div>
      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:4 }}>Current R Lead:</div>
        <div style={{ fontSize:14, fontWeight:700 }}>{getMember(candidate.r_lead_id)?.name||"Not assigned"}</div>
        <div style={{ fontSize:11, color:"#94A3B8" }}>Will end: {new Date(Date.now()-86400000).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
      </div>
      <Select label="Select new R Lead *" value={form.new_member_id||""} onChange={e=>set("new_member_id",e.target.value)}>
        <option value="">-- Select R Lead --</option>
        {members.filter(m=>m.role==="r_lead"&&m.id!==candidate.r_lead_id).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
      </Select>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
        <Btn variant="outline" onClick={()=>setShowChangeRLead(false)}>Cancel</Btn>
        <Btn onClick={()=>changeAssignment("r_lead",form.new_member_id)}>Confirm Change</Btn>
      </div>
    </Modal>

    <Tabs tabs={tabs} active={tab} onChange={setTab}/>

    {tab==="overview"&&<div>
      {/* Placed details */}
      {candidate.status==="Placed"&&<div style={{ background:"#F5F3FF", border:"1px solid #DDD6FE", borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#7C3AED", marginBottom:12 }}> Placed in Project</div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <div><div style={{ fontSize:11, color:"#94A3B8", fontWeight:600, marginBottom:2 }}>VENDOR</div><div style={{ fontSize:13, fontWeight:600 }}>{candidate.vendor_name||"—"}</div></div>
          <div><div style={{ fontSize:11, color:"#94A3B8", fontWeight:600, marginBottom:2 }}>PRIME VENDOR / IMPL. PARTNER</div><div style={{ fontSize:13, fontWeight:600 }}>{candidate.prime_vendor||"—"}</div></div>
          <div><div style={{ fontSize:11, color:"#94A3B8", fontWeight:600, marginBottom:2 }}>END CLIENT</div><div style={{ fontSize:13, fontWeight:600 }}>{candidate.end_client||"—"}</div></div>
          <div><div style={{ fontSize:11, color:"#94A3B8", fontWeight:600, marginBottom:2 }}>PROJECT START DATE</div><div style={{ fontSize:13, fontWeight:600 }}>{fmtDate(candidate.project_start_date)||"—"}</div></div>
        </div>
      </div>}
      {/* Dropped reason */}
      {candidate.status==="Dropped"&&<div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:12, padding:"16px 20px", marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:700, color:"#DC2626", marginBottom:8 }}> Dropped from Marketing</div>
        <div style={{ fontSize:13, color:"#475569" }}>{candidate.status_reason||"No reason provided."}</div>
      </div>}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card style={{ padding:16 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}> Latest Pipeline Status</div>
        {candTimeline.filter(t=>t.entry_type==="pipeline_update").slice(0,1).map(t=><div key={t.id} style={{ background:"#F8FAFC", borderRadius:8, padding:12 }}><div style={{ fontSize:13, fontWeight:600 }}>{t.title}</div><div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{t.details}</div><div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>)}
        {candTimeline.filter(t=>t.entry_type==="pipeline_update").length===0&&<div style={{ fontSize:13, color:"#94A3B8" }}>No pipeline updates yet.</div>}
      </Card>
      <Card style={{ padding:16 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}> Latest Interview</div>
        {candTimeline.filter(t=>["interview_round1","interview_round2","interview_round3"].includes(t.entry_type)).slice(0,1).map(t=>{const et=ENTRY_TYPES[t.entry_type];return<div key={t.id} style={{ background:"#F8FAFC", borderRadius:8, padding:12 }}><div style={{ fontSize:13, fontWeight:600 }}>{et.icon} {et.label}</div><div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{t.title}</div>{t.outcome&&<div style={{ marginTop:6 }}><StatusBadge status={t.outcome}/></div>}<div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>;})}
        {candTimeline.filter(t=>["interview_round1","interview_round2","interview_round3"].includes(t.entry_type)).length===0&&<div style={{ fontSize:13, color:"#94A3B8" }}>No interviews yet.</div>}
      </Card>
      <Card style={{ padding:16 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}> Latest Mock Feedback</div>
        {candTimeline.filter(t=>["vendor_mock","interview_mock"].includes(t.entry_type)).slice(0,1).map(t=>{const et=ENTRY_TYPES[t.entry_type];return<div key={t.id} style={{ background:"#F8FAFC", borderRadius:8, padding:12 }}><div style={{ fontSize:13, fontWeight:600 }}>{et.icon} {et.label}</div><div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{t.feedback}</div><div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>;})}
        {candTimeline.filter(t=>["vendor_mock","interview_mock"].includes(t.entry_type)).length===0&&<div style={{ fontSize:13, color:"#94A3B8" }}>No mock feedback yet.</div>}
      </Card>
      <Card style={{ padding:16 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}> Screening Calls</div>
        {candTimeline.filter(t=>t.entry_type==="screening_call").slice(0,2).map(t=><div key={t.id} style={{ background:"#F8FAFC", borderRadius:8, padding:10, marginBottom:8 }}><div style={{ fontSize:13, fontWeight:600 }}>{t.title}</div>{t.outcome&&<div style={{ marginTop:4 }}><StatusBadge status={t.outcome}/></div>}<div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>)}
        {candTimeline.filter(t=>t.entry_type==="screening_call").length===0&&<div style={{ fontSize:13, color:"#94A3B8" }}>No screening calls yet.</div>}
      </Card>
      </div>
    </div>}

    {tab==="timeline"&&<div>
      {canAddTimeline&&<div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}><Btn onClick={()=>setShowAdd(true)}>+ Add Entry</Btn></div>}
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", left:20, top:0, bottom:0, width:2, background:"#E2E8F0" }}/>
        {candTimeline.map(t=>{const et=ENTRY_TYPES[t.entry_type]||{label:t.entry_type,icon:"",color:"#94A3B8"};const addedBy=getMember(t.user_id);return<div key={t.id} style={{ display:"flex", gap:16, marginBottom:20, position:"relative" }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:et.color+"20", border:`2px solid ${et.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0, zIndex:1 }}>{et.icon}</div>
          <Card style={{ flex:1, padding:16 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontSize:14, fontWeight:700 }}>{t.title}</div><div style={{ fontSize:11, color:et.color, fontWeight:600 }}>{et.label}</div></div>
              <div style={{ textAlign:"right" }}>{t.outcome&&<StatusBadge status={t.outcome}/>}<div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>
            </div>
            {t.details&&<div style={{ fontSize:13, color:"#475569", marginBottom:8 }}>{t.details}</div>}
            {t.feedback&&<div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#475569", marginBottom:8 }}><strong>Feedback:</strong> {t.feedback}</div>}
            {t.scheduled_date&&<div style={{ fontSize:12, color:"#2563EB" }}> Scheduled: {fmtDate(t.scheduled_date)}</div>}
            <div style={{ fontSize:11, color:"#94A3B8", marginTop:8 }}>Added by {addedBy?.name||"?"}</div>
          </Card>
        </div>;})}
        {candTimeline.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94A3B8", fontSize:14, paddingLeft:60 }}>No timeline entries yet. Click '+ Add Entry' to start.</div>}
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title={`Add Timeline Entry — ${candidate.name}`}>
        <Select label="Entry type *" value={form.entry_type||""} onChange={e=>set("entry_type",e.target.value)}>
          <option value="">-- Select type --</option>
          {Object.entries(ENTRY_TYPES).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </Select>
        <Input label="Title *" value={form.title||""} onChange={e=>set("title",e.target.value)} placeholder="e.g. First screening call with client"/>
        <Textarea label="Details" value={form.details||""} onChange={e=>set("details",e.target.value)} placeholder="What happened? Any updates?"/>
        <Textarea label="Feedback" value={form.feedback||""} onChange={e=>set("feedback",e.target.value)} placeholder="Candidate feedback, strengths, weaknesses..."/>
        <Select label="Outcome" value={form.outcome||""} onChange={e=>set("outcome",e.target.value)}>
          <option value="">-- Select outcome --</option>
          <option value="passed"> Passed</option>
          <option value="failed"> Failed</option>
          <option value="pending"> Pending</option>
          <option value="scheduled"> Scheduled</option>
        </Select>
        <Input label="Scheduled date (if any)" type="date" value={form.scheduled_date||""} onChange={e=>set("scheduled_date",e.target.value)}/>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn onClick={submit} disabled={loading}>{loading?"Adding...":"Add Entry"}</Btn></div>
      </Modal>
    </div>}

    {tab==="daily_logs"&&<div>
      {candLogs.map(l=>{const m=getMember(l.user_id);const roleMap={recruiter:"recruiter",r_lead:"r_lead",c_lead:"c_lead",interview_coord:"interview_coord",manager_feedback:"manager"};return<Card key={l.id} style={{ padding:16, marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}><Av name={m?.name} role={m?.role} size={34}/><div><div style={{ fontSize:13, fontWeight:700 }}>{m?.name||"?"}</div><div style={{ fontSize:11, color:"#94A3B8" }}> {fmtDate(l.log_date)} · ⏰ {l.log_time}</div></div></div>
          <RoleBadge role={roleMap[l.type]||"recruiter"}/>
        </div>
        <div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px 14px" }}>
          {l.type==="recruiter"&&<div style={{ fontSize:13 }}>Emails: <strong>{l.emails_sent}</strong> emails · Subs: <strong>{l.submissions}</strong> submissions{l.notes&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>{l.notes}</div>}</div>}
          {l.type==="r_lead"&&<><div style={{ fontSize:13 }}> {l.interview_stage||"—"}</div>{l.scheduled_date&&<div style={{ fontSize:12, marginTop:3 }}> {fmtDate(l.scheduled_date)}</div>}{l.vendor_issue&&<div style={{ fontSize:12, color:"#DC2626", marginTop:3 }}>Note: {l.vendor_feedback}</div>}{l.notes&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:3 }}>{l.notes}</div>}</>}
          {l.type==="c_lead"&&<><div style={{ fontSize:13 }}>️ {l.floor_issues}</div>{l.resolution_status&&<div style={{ marginTop:6 }}><StatusBadge status={l.resolution_status}/></div>}</>}
          {l.type==="interview_coord"&&<><div style={{ fontSize:13 }}> <strong>{l.session_type}</strong> · {l.sessions_done} sessions</div>{l.feedback&&<div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{l.feedback}</div>}</>}
          {l.type==="manager_feedback"&&<>
            <div style={{ fontSize:13, background:"#F0FDFA", padding:"8px 10px", borderRadius:6, marginBottom:6 }}> <strong>Team:</strong> {l.feedback_to_team||l.manager_feedback||"—"}</div>
            {user.role==="president"&&l.feedback_to_president&&<div style={{ fontSize:13, background:"#F5F3FF", padding:"8px 10px", borderRadius:6, marginBottom:6 }}> <strong>President only:</strong> {l.feedback_to_president}</div>}
            {l.action_items&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Action: {l.action_items}</div>}
          </>}
        </div>
      </Card>;})}
      {candLogs.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94A3B8", fontSize:14 }}>No daily logs yet.</div>}
    </div>}

    {tab==="assignment_history"&&<div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <Card>
          <CardHeader title="Recruiter History"/>
          <div style={{ padding:"0 0 8px" }}>
            {recHistory.length===0&&<div style={{ padding:"20px 16px", fontSize:13, color:"#94A3B8" }}>No history yet.</div>}
            {recHistory.map((a,i)=>{
              const m=getMember(a.member_id);
              const isCurrent=!a.end_date;
              return <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:"1px solid #F1F5F9" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:isCurrent?"#16A34A":"#E2E8F0", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{m?.name||"Unknown"}</div>
                  <div style={{ fontSize:11, color:"#94A3B8" }}>
                    From: {fmtDate(a.start_date)} → {isCurrent?<span style={{ color:"#16A34A", fontWeight:600 }}>Present</span>:fmtDate(a.end_date)}
                  </div>
                </div>
                {isCurrent&&<span style={{ background:"#F0FDF4", color:"#16A34A", fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:600 }}>Current</span>}
              </div>;
            })}
          </div>
        </Card>
        <Card>
          <CardHeader title="R Lead History"/>
          <div style={{ padding:"0 0 8px" }}>
            {rLeadHistory.length===0&&<div style={{ padding:"20px 16px", fontSize:13, color:"#94A3B8" }}>No history yet.</div>}
            {rLeadHistory.map((a,i)=>{
              const m=getMember(a.member_id);
              const isCurrent=!a.end_date;
              return <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px", borderBottom:"1px solid #F1F5F9" }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:isCurrent?"#2563EB":"#E2E8F0", flexShrink:0 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{m?.name||"Unknown"}</div>
                  <div style={{ fontSize:11, color:"#94A3B8" }}>
                    From: {fmtDate(a.start_date)} → {isCurrent?<span style={{ color:"#2563EB", fontWeight:600 }}>Present</span>:fmtDate(a.end_date)}
                  </div>
                </div>
                {isCurrent&&<span style={{ background:"#EFF6FF", color:"#2563EB", fontSize:11, padding:"2px 8px", borderRadius:99, fontWeight:600 }}>Current</span>}
              </div>;
            })}
          </div>
        </Card>
      </div>
    </div>}
  </div>;
}

// ─── MY RECRUITERS (R Lead view) ────────────────────────────────────────────
function MyRecruitersPage({user,members,candidates,logs,timeline,getMember,onAddTimeline,loading}){
  const [selectedRec,setSelectedRec]=useState(null);
  const [selectedCand,setSelectedCand]=useState(null);
  const myRecruiters=members.filter(m=>m.role==="recruiter"&&m.r_lead_team===user.id);

  if(selectedCand) return <CandidateProfile candidate={selectedCand} members={members} logs={logs} timeline={timeline} getMember={getMember} onAddTimeline={onAddTimeline} loading={loading} user={user} onBack={()=>setSelectedCand(null)} token={user?.token} onRefresh={()=>window.location.reload()}/>;

  return <div>
    <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>My Recruiters</div>
    <div style={{ fontSize:13, color:"#94A3B8", marginBottom:20 }}>{myRecruiters.length} recruiters in your team</div>

    {myRecruiters.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94A3B8", fontSize:14 }}>No recruiters assigned to your team yet. Ask your manager to assign recruiters.</div>}

    <div style={{ display:"grid", gap:16 }}>
      {myRecruiters.map(rec=>{
        const recCands=candidates.filter(c=>c.recruiter_id===rec.id);
        const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
        const wLogs=logs.filter(l=>l.user_id===rec.id&&l.type==="recruiter"&&new Date(l.log_date)>=weekAgo);
        const emails=wLogs.reduce((s,l)=>s+(l.emails_sent||0),0);
        const subs=wLogs.reduce((s,l)=>s+(l.submissions||0),0);
        const todayLog=logs.filter(l=>l.user_id===rec.id&&l.log_date===today());
        const isExpanded=selectedRec===rec.id;

        return <Card key={rec.id} style={{ overflow:"hidden" }}>
          <div onClick={()=>setSelectedRec(isExpanded?null:rec.id)} style={{ padding:"16px 18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <Av name={rec.name} role="recruiter" size={44}/>
              <div>
                <div style={{ fontSize:16, fontWeight:700 }}>{rec.name}</div>
                <div style={{ fontSize:12, color:"#94A3B8" }}>{rec.email}</div>
                <div style={{ display:"flex", gap:8, marginTop:4 }}>
                  <span style={{ fontSize:11, background:"#EFF6FF", color:"#2563EB", padding:"2px 8px", borderRadius:99, fontWeight:600 }}>{recCands.length} candidates</span>
                  {todayLog.length>0?<span style={{ fontSize:11, background:"#F0FDF4", color:"#16A34A", padding:"2px 8px", borderRadius:99, fontWeight:600 }}>Log submitted today</span>:<span style={{ fontSize:11, background:"#FFFBEB", color:"#D97706", padding:"2px 8px", borderRadius:99, fontWeight:600 }}> Log pending today</span>}
                </div>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              <div style={{ textAlign:"center", padding:"8px 12px", background:"#F8FAFC", borderRadius:8 }}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>EMAILS/WEEK</div><div style={{ fontSize:18, fontWeight:800, color:"#2563EB" }}>{emails}</div></div>
              <div style={{ textAlign:"center", padding:"8px 12px", background:"#F8FAFC", borderRadius:8 }}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>SUBS/WEEK</div><div style={{ fontSize:18, fontWeight:800, color:"#7C3AED" }}>{subs}</div></div>
              <span style={{ fontSize:18, color:"#94A3B8" }}>{isExpanded?"▲":"▼"}</span>
            </div>
          </div>

          {isExpanded&&<div style={{ borderTop:"1px solid #E2E8F0", padding:"16px 18px" }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:12, color:"#475569" }}>Assigned Candidates — click to view full profile:</div>
            {recCands.length===0&&<div style={{ fontSize:13, color:"#94A3B8" }}>No candidates assigned yet.</div>}
            <div style={{ display:"grid", gap:10 }}>
              {recCands.map(c=>{
                const candLogs=logs.filter(l=>l.candidate_id===c.id);
                const candTimeline=timeline.filter(t=>t.candidate_id===c.id);
                const lastLog=candLogs[0];
                return <div key={c.id} onClick={()=>setSelectedCand(c)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"#F8FAFC", borderRadius:10, cursor:"pointer", border:"1px solid #E2E8F0" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <Av name={c.name} role="president" size={36}/>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>{c.name}</div>
                      <div style={{ fontSize:11, color:"#94A3B8" }}>{c.tech}</div>
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <span style={{ fontSize:11, background:"#EFF6FF", color:"#2563EB", padding:"2px 8px", borderRadius:99 }}>{candTimeline.length} timeline entries</span>
                    <span style={{ fontSize:11, background:"#F5F3FF", color:"#7C3AED", padding:"2px 8px", borderRadius:99 }}>{candLogs.length} logs</span>
                    <StatusBadge status={c.status}/>
                    <span style={{ fontSize:12, color:"#2563EB", fontWeight:600 }}>View →</span>
                  </div>
                </div>;
              })}
            </div>

            {/* Recent daily logs */}
            <div style={{ marginTop:16 }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:10, color:"#475569" }}>Recent Daily Logs:</div>
              {logs.filter(l=>l.user_id===rec.id).slice(0,3).map(l=>{
                const cand=candidates.find(c=>c.id===l.candidate_id);
                return <div key={l.id} style={{ padding:"10px 12px", background:"#fff", border:"1px solid #E2E8F0", borderRadius:8, marginBottom:8 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:12, fontWeight:600 }}>{cand?.name||"?"}</span>
                    <span style={{ fontSize:11, color:"#94A3B8" }}>{fmtDate(l.log_date)} · {l.log_time}</span>
                  </div>
                  {l.type==="recruiter"&&<div style={{ fontSize:12, color:"#475569" }}>Emails: {l.emails_sent} emails · Subs: {l.submissions} submissions</div>}
                </div>;
              })}
              {logs.filter(l=>l.user_id===rec.id).length===0&&<div style={{ fontSize:12, color:"#94A3B8" }}>No logs yet.</div>}
            </div>
          </div>}
        </Card>;
      })}
    </div>
  </div>;
}

// ─── DAILY LOG ──────────────────────────────────────────────────────────────
function LogPage({user,rc,candidates,allCands,onSubmit,loading,members,logs,allLogs,onRefresh}){
  useEffect(()=>{
    // President needs fresh all logs on mount
    if(user.role==="president"&&onRefresh) onRefresh();
  },[]);
  const [form,setForm]=useState({});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const sub=(type)=>{if(!form.candidate_id)return alert("Select a candidate");onSubmit({...form,type});setForm({});};
  const CS=()=><Select label="Select candidate *" value={form.candidate_id||""} onChange={e=>set("candidate_id",e.target.value)}><option value="">-- Select candidate --</option>{candidates.map(c=><option key={c.id} value={c.id}>{c.name} · {c.tech}</option>)}</Select>;
  return <div>
    <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Daily Log</div>
    <div style={{ fontSize:13, color:"#94A3B8", marginBottom:20 }}>Submit your end-of-day update · Due by 6:00 PM EST</div>
    {candidates.length===0&&<div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"14px 18px", fontSize:13, color:"#D97706", marginBottom:16 }}>Note: No candidates assigned yet.</div>}
    <Card style={{ padding:22, maxWidth:520 }}>
      {user.role==="recruiter"&&<>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}> Recruiter Daily Log</div>
        <CS/>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div>
            <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>Emails Sent Today *</label>
            <input type="number" min={0} value={form.emails_sent||""} onChange={e=>set("emails_sent",+e.target.value)} placeholder="e.g. 15" style={{ width:"100%", border:`1px solid ${form.emails_sent!==undefined&&form.emails_sent<15&&form.emails_sent>0?"#FCA5A5":"#E2E8F0"}`, borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
            {form.emails_sent>0&&form.emails_sent<15&&<div style={{ fontSize:11, color:"#D97706", background:"#FFFBEB", padding:"4px 8px", borderRadius:4, marginTop:4 }}>Less than 15 — reason required</div>}
          </div>
          <div>
            <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>Submissions Done *</label>
            <input type="number" min={0} value={form.submissions||""} onChange={e=>set("submissions",+e.target.value)} placeholder="e.g. 3" style={{ width:"100%", border:`1px solid ${form.submissions===0&&form.emails_sent>0?"#FCA5A5":"#E2E8F0"}`, borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
            {form.submissions===0&&form.emails_sent>0&&<div style={{ fontSize:11, color:"#DC2626", background:"#FEF2F2", padding:"4px 8px", borderRadius:4, marginTop:4 }}>Zero submissions — reason required</div>}
          </div>
        </div>
        {form.emails_sent>0&&form.emails_sent<15&&<Textarea label="Reason for less emails *" value={form.reason_less_emails||""} onChange={e=>set("reason_less_emails",e.target.value)} placeholder="Why less than 15 emails today?"/>}
        {form.submissions===0&&form.emails_sent>0&&<Textarea label="Reason for zero submissions *" value={form.reason_zero_subs||""} onChange={e=>set("reason_zero_subs",e.target.value)} placeholder="Why zero submissions today?"/>}
        <div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#DC2626", marginBottom:10 }}>Issues Faced Today</div>
          <Textarea label="Issue description" value={form.issue_description||""} onChange={e=>set("issue_description",e.target.value)} placeholder="Describe any issues faced today..."/>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:8 }}>To whom informed</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {["R Lead","C Lead","Manager"].map(p=><label key={p} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, cursor:"pointer", background:(form.informed_to||[]).includes(p)?"#EFF6FF":"#F8FAFC", border:`1px solid ${(form.informed_to||[]).includes(p)?"#2563EB":"#E2E8F0"}`, padding:"6px 12px", borderRadius:8 }}>
                <input type="checkbox" checked={(form.informed_to||[]).includes(p)} onChange={e=>{const cur=form.informed_to||[];set("informed_to",e.target.checked?[...cur,p]:cur.filter(x=>x!==p));}} style={{ accentColor:"#2563EB" }}/>{p}
              </label>)}
            </div>
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:8 }}>Issue status *</label>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {[{v:"solved",l:"Solved",c:"#16A34A",b:"#F0FDF4"},{v:"pending",l:" Pending",c:"#D97706",b:"#FFFBEB"},{v:"waiting",l:" Waiting",c:"#2563EB",b:"#EFF6FF"},{v:"no_issues",l:"️ No Issues",c:"#475569",b:"#F8FAFC"}].map(s=><button key={s.v} type="button" onClick={()=>set("issue_status",s.v)} style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:form.issue_status===s.v?s.b:"#fff", color:form.issue_status===s.v?s.c:"#94A3B8", border:`1px solid ${form.issue_status===s.v?s.c:"#E2E8F0"}` }}>{s.l}</button>)}
            </div>
          </div>
        </div>
        <Textarea label="Notes (optional)" value={form.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Any additional notes..."/>
        <Btn onClick={()=>{
          if(!form.candidate_id)return alert("Select a candidate");
          if(form.emails_sent>0&&form.emails_sent<15&&!form.reason_less_emails?.trim())return alert("Reason for less emails is required");
          if(form.submissions===0&&form.emails_sent>0&&!form.reason_zero_subs?.trim())return alert("Reason for zero submissions is required");
          if(form.issue_description?.trim()&&!form.issue_status)return alert("Please select issue status");
          sub("recruiter");
        }} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Submit Daily Log"}</Btn>
      </>}
      {user.role==="r_lead"&&<>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>R Lead Daily Log</div>
        <CS/>
        <div style={{ background:"#F0FDF4", border:"1px solid #BBF7D0", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:13, fontWeight:700, color:"#16A34A", marginBottom:10 }}>Vendor Mock</div>
          <div style={{ marginBottom:12 }}>
            <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:8 }}>Was vendor mock conducted today? *</label>
            <div style={{ display:"flex", gap:8 }}>
              {[{v:"yes",l:"Conducted"},{v:"no",l:"Not Conducted"}].map(m=><button key={m.v} type="button" onClick={()=>set("vendor_mock_conducted",m.v)} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:form.vendor_mock_conducted===m.v?"#F0FDF4":"#fff", color:form.vendor_mock_conducted===m.v?"#16A34A":"#94A3B8", border:`1px solid ${form.vendor_mock_conducted===m.v?"#16A34A":"#E2E8F0"}` }}>{m.l}</button>)}
            </div>
          </div>
          {form.vendor_mock_conducted==="yes"&&<>
            <div style={{ marginBottom:12 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:8 }}>Mode of conduct *</label>
              <div style={{ display:"flex", gap:8 }}>
                {[{v:"video",l:" Video Meeting"},{v:"phone",l:" Phone Call"}].map(m=><button key={m.v} type="button" onClick={()=>set("vendor_mock_mode",m.v)} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:form.vendor_mock_mode===m.v?"#EFF6FF":"#fff", color:form.vendor_mock_mode===m.v?"#2563EB":"#94A3B8", border:`1px solid ${form.vendor_mock_mode===m.v?"#2563EB":"#E2E8F0"}` }}>{m.l}</button>)}
              </div>
            </div>
            <Textarea label="Vendor mock feedback *" value={form.vendor_mock_feedback||""} onChange={e=>set("vendor_mock_feedback",e.target.value)} placeholder="Feedback is mandatory..."/>
          </>}
          {form.vendor_mock_conducted==="no"&&<Textarea label="Reason for not conducting *" value={form.vendor_mock_reason||""} onChange={e=>set("vendor_mock_reason",e.target.value)} placeholder="Why was vendor mock not conducted today?"/>}
        </div>
        <Textarea label="Notes (optional)" value={form.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Any additional notes..."/>
        <Btn onClick={()=>{
          if(!form.candidate_id)return alert("Select a candidate");
          if(!form.vendor_mock_conducted)return alert("Select vendor mock status");
          if(form.vendor_mock_conducted==="yes"&&!form.vendor_mock_feedback?.trim())return alert("Vendor mock feedback is mandatory");
          if(form.vendor_mock_conducted==="no"&&!form.vendor_mock_reason?.trim())return alert("Reason is mandatory if not conducted");
          sub("r_lead");
        }} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Submit Daily Log"}</Btn>
      </>}
      {user.role==="c_lead"&&<>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>C Lead Daily Log</div>
        <CS/>
        <Textarea label="Floor issues / observations *" value={form.floor_issues||""} onChange={e=>set("floor_issues",e.target.value)} placeholder="Describe any floor issues or updates..."/>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:8 }}>To whom informed *</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {["Manager","R Lead"].map(p=><label key={p} style={{ display:"flex", alignItems:"center", gap:6, fontSize:13, cursor:"pointer", background:(form.clead_informed_to||[]).includes(p)?"#EFF6FF":"#F8FAFC", border:`1px solid ${(form.clead_informed_to||[]).includes(p)?"#2563EB":"#E2E8F0"}`, padding:"6px 12px", borderRadius:8 }}>
              <input type="checkbox" checked={(form.clead_informed_to||[]).includes(p)} onChange={e=>{const cur=form.clead_informed_to||[];set("clead_informed_to",e.target.checked?[...cur,p]:cur.filter(x=>x!==p));}} style={{ accentColor:"#2563EB" }}/>{p}
            </label>)}
          </div>
        </div>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:8 }}>Resolution status *</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {[{v:"solved",l:"Solved",c:"#16A34A",b:"#F0FDF4"},{v:"pending",l:" Pending",c:"#D97706",b:"#FFFBEB"},{v:"waiting",l:" Waiting",c:"#2563EB",b:"#EFF6FF"},{v:"no_issues",l:"️ No Issues",c:"#475569",b:"#F8FAFC"}].map(s=><button key={s.v} type="button" onClick={()=>set("resolution_status",s.v)} style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:form.resolution_status===s.v?s.b:"#fff", color:form.resolution_status===s.v?s.c:"#94A3B8", border:`1px solid ${form.resolution_status===s.v?s.c:"#E2E8F0"}` }}>{s.l}</button>)}
          </div>
        </div>
        <Textarea label="Notes (optional)" value={form.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Any additional notes..."/>
        <Btn onClick={()=>{
          if(!form.candidate_id)return alert("Select a candidate");
          if(!form.floor_issues?.trim())return alert("Floor issues field is required");
          if(!form.resolution_status)return alert("Select resolution status");
          sub("c_lead");
        }} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Submit Daily Log"}</Btn>
      </>}
      {user.role==="interview_coord"&&<>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>IC Daily Log</div>
        <CS/>
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:8 }}>Session Type *</label>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {[{v:"sync",l:"Sync"},{v:"prompt",l:"Prompt Session"},{v:"otter",l:"Otter Session"},{v:"otter_prompt",l:"Otter + Prompt"},{v:"mixed",l:"Mixed Sessions"}].map(s=><button key={s.v} type="button" onClick={()=>set("session_type",s.v)} style={{ padding:"6px 12px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:form.session_type===s.v?"#FEF2F2":"#fff", color:form.session_type===s.v?"#DC2626":"#94A3B8", border:`1px solid ${form.session_type===s.v?"#DC2626":"#E2E8F0"}` }}>{s.l}</button>)}
          </div>
        </div>
        <Input label="Sessions conducted *" type="number" min={0} value={form.sessions_done||""} onChange={e=>set("sessions_done",+e.target.value)} placeholder="e.g. 2"/>
        <Textarea label="Session Feedback *" value={form.feedback||""} onChange={e=>set("feedback",e.target.value)} placeholder="Detailed feedback — mandatory..."/>
        <Textarea label="Notes (optional)" value={form.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Any additional notes..."/>
        <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#2563EB" }}>Tomorrow's Interview</div>
            <label style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, cursor:"pointer" }}>
              <input type="checkbox" checked={form.tomorrow_interview||false} onChange={e=>set("tomorrow_interview",e.target.checked)} style={{ accentColor:"#2563EB" }}/>
              Interview scheduled tomorrow?
            </label>
          </div>
          {form.tomorrow_interview&&<>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <Input label="With whom *" value={form.tmr_with_whom||""} onChange={e=>set("tmr_with_whom",e.target.value)} placeholder="Company — Person name"/>
              <Input label="Interview time *" type="time" value={form.tmr_time||""} onChange={e=>set("tmr_time",e.target.value)}/>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:8 }}>Mode *</label>
              <div style={{ display:"flex", gap:8 }}>
                {[{v:"virtual",l:"️ Virtual"},{v:"in_person",l:" In-person"}].map(m=><button key={m.v} type="button" onClick={()=>set("tmr_mode",m.v)} style={{ padding:"6px 14px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:form.tmr_mode===m.v?"#EFF6FF":"#fff", color:form.tmr_mode===m.v?"#2563EB":"#94A3B8", border:`1px solid ${form.tmr_mode===m.v?"#2563EB":"#E2E8F0"}` }}>{m.l}</button>)}
              </div>
            </div>
            <Input label="Tech support name *" value={form.tmr_tech_support||""} onChange={e=>set("tmr_tech_support",e.target.value)} placeholder="Support person name"/>
            <div style={{ marginBottom:14 }}>
              <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:8 }}>Mode of Support *</label>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {[{v:"sync",l:"Sync"},{v:"otter",l:"Otter"},{v:"prompt",l:"Prompt"},{v:"otter_prompt",l:"Otter+Prompt"},{v:"self",l:"Self"},{v:"ai",l:"AI"}].map(s=><button key={s.v} type="button" onClick={()=>set("tmr_support_mode",s.v)} style={{ padding:"5px 10px", borderRadius:8, fontSize:12, fontWeight:600, cursor:"pointer", background:form.tmr_support_mode===s.v?"#EFF6FF":"#fff", color:form.tmr_support_mode===s.v?"#2563EB":["self","ai"].includes(s.v)?"#DC2626":"#94A3B8", border:`1px solid ${form.tmr_support_mode===s.v?"#2563EB":["self","ai"].includes(s.v)?"#FECACA":"#E2E8F0"}` }}>{s.l}</button>)}
              </div>
            </div>
            {["self","ai"].includes(form.tmr_support_mode)&&<Textarea label="Reason for Self/AI support *" value={form.tmr_support_reason||""} onChange={e=>set("tmr_support_reason",e.target.value)} placeholder="Reason mandatory if Self or AI selected..."/>}
          </>}
        </div>
        <Btn onClick={()=>{
          if(!form.candidate_id)return alert("Select a candidate");
          if(!form.session_type)return alert("Select session type");
          if(!form.feedback?.trim())return alert("Session feedback is mandatory");
          if(form.tomorrow_interview){
            if(!form.tmr_with_whom?.trim())return alert("Enter interview with whom");
            if(!form.tmr_time)return alert("Enter interview time");
            if(!form.tmr_mode)return alert("Select interview mode");
            if(!form.tmr_tech_support?.trim())return alert("Enter tech support name");
            if(!form.tmr_support_mode)return alert("Select mode of support");
            if(["self","ai"].includes(form.tmr_support_mode)&&!form.tmr_support_reason?.trim())return alert("Reason is mandatory for Self/AI support");
          }
          sub("interview_coord");
        }} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Submit Daily Log"}</Btn>
      </>}
      {user.role==="manager"&&<>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Manager Feedback</div>
        <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>Add feedback for this candidate's progress</div>
        <CS/>
        <div style={{ background:"#F0FDFA", border:"1px solid #99F6E4", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#0F766E", marginBottom:6 }}>Feedback to Team <span style={{ fontWeight:400, color:"#94A3B8" }}>(R Lead, C Lead, Recruiter can see)</span></div>
          <textarea value={form.feedback_to_team||""} onChange={e=>set("feedback_to_team",e.target.value)} placeholder="Write feedback visible to R Lead, C Lead and Recruiter..." style={{ width:"100%", border:"1px solid #99F6E4", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box", background:"#fff" }} rows={3}/>
        </div>
        <div style={{ background:"#F5F3FF", border:"1px solid #C4B5FD", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#7C3AED", marginBottom:6 }}>Confidential — President Only <span style={{ fontWeight:400, color:"#94A3B8" }}>(Only President can see)</span></div>
          <textarea value={form.feedback_to_president||""} onChange={e=>set("feedback_to_president",e.target.value)} placeholder="Confidential feedback for President only..." style={{ width:"100%", border:"1px solid #C4B5FD", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box", background:"#fff" }} rows={3}/>
        </div>
        <Textarea label="Action items" value={form.action_items||""} onChange={e=>set("action_items",e.target.value)} placeholder="Any action items for the team..."/>
        <Btn onClick={()=>{
          if(!form.candidate_id)return alert("Select a candidate");
          sub("manager_feedback");
        }} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Post Feedback"}</Btn>
      </>}
      {user.role==="president"&&<PresidentDailyView logs={allLogs||logs||[]} members={members||[]} candidates={allCands||candidates||[]} token={user.token} user={user}/>}
    </Card>
  </div>;
}

// ─── LOG HISTORY ────────────────────────────────────────────────────────────
function HistPage({user,rc,candidates,logs,getMember,allCands}){
  const [ft,setFt]=useState("all");const [fc,setFc]=useState("all");const [fp,setFp]=useState("all");
  const myLogs=rc.canViewAll?logs:logs.filter(l=>l.user_id===user.id);
  const filtered=myLogs.filter(l=>{
    if(ft!=="all"&&l.type!==ft)return false;if(fc!=="all"&&l.candidate_id!==fc)return false;
    if(fp==="today"&&l.log_date!==today())return false;
    if(fp==="week"){const ws=new Date();ws.setDate(ws.getDate()-7);if(new Date(l.log_date)<ws)return false;}
    if(fp==="month"){const ms=new Date();ms.setDate(ms.getDate()-30);if(new Date(l.log_date)<ms)return false;}
    return true;
  });
  const sel={border:"1px solid #E2E8F0",borderRadius:8,padding:"6px 12px",fontSize:13,outline:"none",background:"#fff"};
  const roleMap={recruiter:"recruiter",r_lead:"r_lead",c_lead:"c_lead",interview_coord:"interview_coord",manager_feedback:"manager"};
  return <div>
    <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Log History</div>
    <div style={{ fontSize:13, color:"#94A3B8", marginBottom:16 }}>{filtered.length} records</div>
    <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
      <select style={sel} value={ft} onChange={e=>setFt(e.target.value)}><option value="all">All roles</option><option value="recruiter">Recruiter</option><option value="r_lead">R Lead</option><option value="c_lead">C Lead</option><option value="interview_coord">IC</option><option value="manager_feedback">Manager</option></select>
      <select style={sel} value={fc} onChange={e=>setFc(e.target.value)}><option value="all">All candidates</option>{(rc.canViewAll?allCands:candidates).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select style={sel} value={fp} onChange={e=>setFp(e.target.value)}><option value="all">All time</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option></select>
    </div>
    <div style={{ display:"grid", gap:10 }}>
      {filtered.map(l=>{
        const cand=allCands.find(c=>c.id===l.candidate_id);const m=getMember(l.user_id);
        return <Card key={l.id} style={{ padding:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}><Av name={m?.name} role={m?.role} size={34}/><div><div style={{ fontSize:13, fontWeight:700 }}>{m?.name||"?"}</div><div style={{ fontSize:11, color:"#94A3B8" }}> {fmtDate(l.log_date)} · ⏰ {l.log_time}</div></div></div>
            <RoleBadge role={roleMap[l.type]||"recruiter"}/>
          </div>
          <div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px 14px" }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:6 }}>Candidate: {cand?.name||"?"} · {cand?.tech}</div>
            {l.type==="recruiter"&&<div style={{ fontSize:13 }}>Emails: <strong>{l.emails_sent}</strong> emails · Subs: <strong>{l.submissions}</strong> submissions{l.notes&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>{l.notes}</div>}</div>}
            {l.type==="r_lead"&&<><div style={{ fontSize:13 }}> {l.interview_stage||"—"}</div>{l.scheduled_date&&<div style={{ fontSize:12, marginTop:3 }}> {fmtDate(l.scheduled_date)}</div>}{l.vendor_issue&&<div style={{ fontSize:12, color:"#DC2626", marginTop:3 }}>Note: {l.vendor_feedback}</div>}</>}
            {l.type==="c_lead"&&<><div style={{ fontSize:13 }}>️ {l.floor_issues}</div>{l.resolution_status&&<div style={{ marginTop:6 }}><StatusBadge status={l.resolution_status}/></div>}</>}
            {l.type==="interview_coord"&&<><div style={{ fontSize:13 }}> <strong>{l.session_type}</strong> · {l.sessions_done} sessions</div>{l.feedback&&<div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{l.feedback}</div>}</>}
            {l.type==="manager_feedback"&&<>
            <div style={{ fontSize:13, background:"#F0FDFA", padding:"8px 10px", borderRadius:6, marginBottom:6 }}> <strong>Team:</strong> {l.feedback_to_team||l.manager_feedback||"—"}</div>
            {user.role==="president"&&l.feedback_to_president&&<div style={{ fontSize:13, background:"#F5F3FF", padding:"8px 10px", borderRadius:6, marginBottom:6 }}> <strong>President only:</strong> {l.feedback_to_president}</div>}
            {l.action_items&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Action: {l.action_items}</div>}
          </>}
          </div>
        </Card>;
      })}
      {filtered.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94A3B8", fontSize:14 }}>No logs found.</div>}
    </div>
  </div>;
}

// ─── STATS ──────────────────────────────────────────────────────────────────
function StatsPage({candidates,logs,members}){
  const [period,setPeriod]=useState("week");
  const days=period==="week"?7:30;const cutoff=new Date();cutoff.setDate(cutoff.getDate()-days);
  const rLogs=logs.filter(l=>l.type==="recruiter"&&new Date(l.log_date)>=cutoff);
  const recs=members.filter(m=>m.role==="recruiter");
  const stats=recs.map(r=>{const rl=rLogs.filter(l=>l.user_id===r.id);return{...r,emails:rl.reduce((s,l)=>s+(l.emails_sent||0),0),subs:rl.reduce((s,l)=>s+(l.submissions||0),0),lc:rl.length,cc:candidates.filter(c=>c.recruiter_id===r.id).length};});
  const mx=Math.max(...stats.map(s=>s.emails),1);
  return <div>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
      <div><div style={{ fontSize:20, fontWeight:700 }}>Stats & Reports</div><div style={{ fontSize:13, color:"#94A3B8" }}>Recruiter performance</div></div>
      <div style={{ display:"flex", gap:8 }}>{["week","month"].map(p=><button key={p} onClick={()=>setPeriod(p)} style={{ padding:"6px 14px", borderRadius:8, fontSize:13, fontWeight:600, cursor:"pointer", background:period===p?"#2563EB":"#fff", color:period===p?"#fff":"#475569", border:`1px solid ${period===p?"#2563EB":"#E2E8F0"}` }}>This {p}</button>)}</div>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:20 }}>
      <StatCard label={`Emails (${period})`} value={stats.reduce((s,r)=>s+r.emails,0)} color="#2563EB"/>
      <StatCard label={`Submissions (${period})`} value={stats.reduce((s,r)=>s+r.subs,0)} color="#7C3AED"/>
      <StatCard label="Active candidates" value={candidates.filter(c=>c.status==="Active").length} color="#0F766E"/>
      <StatCard label="Recruiters" value={recs.length} color="#D97706"/>
    </div>
    <Card style={{ marginBottom:14 }}><CardHeader title={`Recruiter Performance · This ${period}`}/>
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr style={{ background:"#F8FAFC" }}>{["Recruiter","Candidates","Logs","Emails","Submissions","Avg Emails/Day","Avg Subs/Day"].map(h=><th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, textTransform:"uppercase", color:"#94A3B8", borderBottom:"1px solid #E2E8F0", whiteSpace:"nowrap" }}>{h}</th>)}</tr></thead>
          <tbody>
            {stats.map(r=><tr key={r.id} style={{ borderBottom:"1px solid #F1F5F9" }}>
              <td style={{ padding:"12px 16px" }}><div style={{ display:"flex", alignItems:"center", gap:8 }}><Av name={r.name} role="recruiter" size={28}/><span style={{ fontSize:13, fontWeight:600 }}>{r.name}</span></div></td>
              <td style={{ padding:"12px 16px", fontSize:13 }}>{r.cc}</td>
              <td style={{ padding:"12px 16px", fontSize:13 }}>{r.lc}</td>
              <td style={{ padding:"12px 16px" }}><span style={{ fontSize:16, fontWeight:800, color:"#2563EB" }}>{r.emails}</span></td>
              <td style={{ padding:"12px 16px" }}><span style={{ fontSize:16, fontWeight:800, color:"#7C3AED" }}>{r.subs}</span></td>
              <td style={{ padding:"12px 16px", fontSize:13 }}>{(r.emails/days).toFixed(1)}</td>
              <td style={{ padding:"12px 16px", fontSize:13 }}>{(r.subs/days).toFixed(1)}</td>
            </tr>)}
            {stats.length===0&&<tr><td colSpan={7} style={{ padding:40, textAlign:"center", color:"#94A3B8" }}>No recruiter data yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </Card>
    <Card style={{ padding:20 }}><div style={{ fontWeight:600, fontSize:14, marginBottom:16 }}>Emails vs Submissions</div>
      <div style={{ display:"flex", gap:16, alignItems:"flex-end", minHeight:120 }}>
        {stats.map(r=><div key={r.id} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
          <div style={{ display:"flex", gap:4, alignItems:"flex-end", height:100 }}>
            <div style={{ width:22, height:`${Math.max(Math.round(r.emails/mx*100),4)}%`, background:"#2563EB", borderRadius:"4px 4px 0 0" }}/>
            <div style={{ width:22, height:`${Math.max(Math.round(r.subs/mx*100),4)}%`, background:"#7C3AED", borderRadius:"4px 4px 0 0" }}/>
          </div>
          <div style={{ fontSize:10, color:"#94A3B8", textAlign:"center" }}>{r.name.split(" ")[0]}</div>
        </div>)}
        <div style={{ display:"flex", flexDirection:"column", gap:6, fontSize:11, color:"#475569", alignSelf:"flex-start" }}>
          <span><span style={{ display:"inline-block", width:10, height:10, background:"#2563EB", borderRadius:2, marginRight:4 }}/>Emails</span>
          <span><span style={{ display:"inline-block", width:10, height:10, background:"#7C3AED", borderRadius:2, marginRight:4 }}/>Subs</span>
        </div>
      </div>
    </Card>
  </div>;
}

// ─── TEAM ────────────────────────────────────────────────────────────────────
function TeamPage({user,rc,members,candidates,logs,onAddMember,loading}){
  const [showAdd,setShowAdd]=useState(false);const [form,setForm]=useState({});const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const rLeads=members.filter(m=>m.role==="r_lead");
  const submit=()=>{if(!form.name?.trim()||!form.email?.trim())return alert("Name and email required");if(!form.role)return alert("Select a role");if(form.role==="recruiter"&&!form.r_lead_team)return alert("Select R Lead team");onAddMember(form);setForm({});setShowAdd(false);};
  const groups=["president","manager","r_lead","c_lead","recruiter","interview_coord"];
  return <div>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
      <div><div style={{ fontSize:20, fontWeight:700 }}>Team</div><div style={{ fontSize:13, color:"#94A3B8" }}>{members.length} members</div></div>
      {rc.canAddMember&&<Btn onClick={()=>setShowAdd(true)}>+ Add Member</Btn>}
    </div>
    {groups.map(role=>{
      const grp=members.filter(m=>m.role===role);if(!grp.length)return null;const rConf=ROLE_CONFIG[role];
      return <div key={role} style={{ marginBottom:20 }}>
        <div style={{ fontSize:12, fontWeight:700, color:rConf.color, marginBottom:10, textTransform:"uppercase", letterSpacing:"0.06em" }}>{rConf.label}s · {grp.length}</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:10 }}>
          {grp.map(m=>{const mL=logs.filter(l=>l.user_id===m.id);const mC=candidates.filter(c=>[c.recruiter_id,c.r_lead_id,c.c_lead_id,c.interview_coord_id].includes(m.id));const rln=m.r_lead_team?members.find(x=>x.id===m.r_lead_team)?.name:null;
            return <Card key={m.id} style={{ padding:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:10 }}><Av name={m.name} role={m.role} size={40}/><div><div style={{ fontSize:14, fontWeight:700 }}>{m.name}</div><RoleBadge role={m.role}/>{rln&&<div style={{ fontSize:10, color:"#94A3B8", marginTop:3 }}>Team: {rln}</div>}</div></div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                <div style={{ background:"#F8FAFC", borderRadius:6, padding:"6px 10px" }}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>CANDIDATES</div><div style={{ fontWeight:800, fontSize:18, color:rConf.color }}>{mC.length}</div></div>
                <div style={{ background:"#F8FAFC", borderRadius:6, padding:"6px 10px" }}><div style={{ fontSize:10, color:"#94A3B8", fontWeight:600 }}>LOGS</div><div style={{ fontWeight:800, fontSize:18, color:rConf.color }}>{mL.length}</div></div>
              </div>
            </Card>;})}
        </div>
      </div>;})}
    <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add New Team Member">
      <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#2563EB", marginBottom:16 }}> Login auto-created. Default password: <strong>VARS@2026</strong></div>
      <Input label="Full name *" value={form.name||""} onChange={e=>set("name",e.target.value)}/>
      <Input label="Work email *" type="email" value={form.email||""} onChange={e=>set("email",e.target.value)}/>
      <Select label="Role *" value={form.role||""} onChange={e=>set("role",e.target.value)}><option value="">-- Select --</option><option value="recruiter">Recruiter</option><option value="r_lead">R Lead</option><option value="c_lead">C Lead</option><option value="interview_coord">Interview Coordinator</option><option value="manager">Manager</option></Select>
      {form.role==="recruiter"&&<Select label="Assign to R Lead team *" value={form.r_lead_team||""} onChange={e=>set("r_lead_team",e.target.value)}><option value="">-- Select R Lead --</option>{rLeads.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn onClick={submit} disabled={loading}>{loading?"Adding...":"Add Member"}</Btn></div>
    </Modal>
  </div>;
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
function NotifsPage({notifications,onRefresh,onMarkRead,onMarkAllRead}){
  return <div>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}>
        <div><div style={{ fontSize:20, fontWeight:700 }}> Notifications</div><div style={{ fontSize:13, color:"#94A3B8" }}>{notifications.filter(n=>!n.read_at).length} unread · {notifications.length} total</div></div>
        {notifications.filter(n=>!n.read_at).length>0&&<button onClick={onMarkAllRead} style={{ fontSize:12, color:"#2563EB", background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontWeight:600 }}>Mark all as read</button>}
      </div>
      <Btn variant="outline" onClick={onRefresh}>↻ Refresh</Btn>
    </div>
    <div style={{ display:"grid", gap:8 }}>
      {notifications.map(n=><Card key={n.id} onClick={()=>!n.read_at&&onMarkRead&&onMarkRead(n.id)} style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12, opacity:n.read_at?0.6:1, background:n.read_at?"#FAFAFA":"#fff", cursor:n.read_at?"default":"pointer", marginBottom:8 }}>
        <div style={{ fontSize:20 }}>{n.read_at?"":""}</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13, color:n.read_at?"#94A3B8":"#0F172A", fontWeight:n.read_at?400:500 }}>{n.message}</div>
          <div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{fmtDateTime(n.created_at)}</div>
        </div>
        {!n.read_at&&<span style={{ width:8, height:8, borderRadius:"50%", background:"#2563EB", flexShrink:0 }}/>}
      </Card>)}
      {notifications.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94A3B8" }}>No notifications yet.</div>}
    </div>
  </div>;
}

// ─── INTERVIEWS PAGE (R Lead + C Lead) ──────────────────────────────────────
function InterviewsPage({user,rc,candidates,token,loading,setToast}){
  const [tab,setTab]=useState("sessions");
  const [sessions,setSessions]=useState([]);
  const [pipeline,setPipeline]=useState([]);
  const [pipelineUpdates,setPipelineUpdates]=useState([]);
  const [loadingData,setLoadingData]=useState(true);
  const [showAddSession,setShowAddSession]=useState(false);
  const [showAddPipeline,setShowAddPipeline]=useState(false);
  const [showAddUpdate,setShowAddUpdate]=useState(null);
  const [showDeletePipeline,setShowDeletePipeline]=useState(null);
  const [selectedInterview,setSelectedInterview]=useState(null);
  const [form,setForm]=useState({});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  useEffect(()=>{
    const load=async()=>{
      setLoadingData(true);
      try {
        const [s,p,pu]=await Promise.all([
          sb.get("interview_sessions","select=*&order=created_at.desc",token),
          sb.get("pipeline_interviews","select=*&order=created_at.desc",token),
          sb.get("pipeline_updates","select=*&order=created_at.desc",token),
        ]);
        if(Array.isArray(s))setSessions(s);
        if(Array.isArray(p))setPipeline(p);
        if(Array.isArray(pu))setPipelineUpdates(pu);
      } catch(e){ console.error(e); }
      setLoadingData(false);
    };
    load();
  },[token]);

  const myCands = candidates;

  const addSession=async()=>{
    if(!form.candidate_id)return alert("Select a candidate");
    if(!form.interview_date)return alert("Select interview date");
    if(!form.round)return alert("Select round");
    if(!form.duration)return alert("Select duration");
    if(!form.overall_feedback)return alert("Select overall feedback");
    if(!form.detailed_feedback?.trim())return alert("Detailed feedback is mandatory");
    if(!form.interview_mode)return alert("Select interview mode");
    try {
      const r=await sb.post("interview_sessions",{...form,user_id:user.id},token);
      if(r?.error){setToast({msg:"Failed: "+r.error.message,type:"error"});return;}
      const [s]=await Promise.all([sb.get("interview_sessions","select=*&order=created_at.desc",token)]);
      if(Array.isArray(s))setSessions(s);
      setForm({});setShowAddSession(false);
      setToast({msg:"Interview session added!",type:"success"});
    } catch(e){setToast({msg:"Error saving.",type:"error"});}
  };

  const addPipeline=async()=>{
    if(!form.candidate_id)return alert("Select a candidate");
    if(!form.interview_with?.trim())return alert("Enter interview with");
    if(!form.round?.trim())return alert("Enter round");
    if(!form.expecting)return alert("Select expecting timeline");
    try {
      const r=await sb.post("pipeline_interviews",{...form,user_id:user.id,status:"active"},token);
      if(r?.error){setToast({msg:"Failed: "+r.error.message,type:"error"});return;}
      // Add initial update
      if(form.initial_update?.trim()&&r[0]?.id){
        await sb.post("pipeline_updates",{pipeline_id:r[0].id,update_text:form.initial_update,user_id:user.id},token);
      }
      const [p,pu]=await Promise.all([
        sb.get("pipeline_interviews","select=*&order=created_at.desc",token),
        sb.get("pipeline_updates","select=*&order=created_at.desc",token),
      ]);
      if(Array.isArray(p))setPipeline(p);
      if(Array.isArray(pu))setPipelineUpdates(pu);
      setForm({});setShowAddPipeline(false);
      setToast({msg:"Pipeline interview added!",type:"success"});
    } catch(e){setToast({msg:"Error saving.",type:"error"});}
  };

  const addUpdate=async(pipelineId)=>{
    if(!form.update_text?.trim())return alert("Enter update text");
    try {
      await sb.post("pipeline_updates",{pipeline_id:pipelineId,update_text:form.update_text,user_id:user.id},token);
      const pu=await sb.get("pipeline_updates","select=*&order=created_at.desc",token);
      if(Array.isArray(pu))setPipelineUpdates(pu);
      setForm({});setShowAddUpdate(null);
      setToast({msg:"Update added!",type:"success"});
    } catch(e){setToast({msg:"Error.",type:"error"});}
  };

  const deletePipeline=async(pipelineId)=>{
    if(!form.delete_reason?.trim())return alert("Reason is mandatory");
    try {
      await sb.patch("pipeline_interviews",pipelineId,{status:"deleted",delete_reason:form.delete_reason},token);
      const p=await sb.get("pipeline_interviews","select=*&order=created_at.desc",token);
      if(Array.isArray(p))setPipeline(p);
      setForm({});setShowDeletePipeline(null);
      setToast({msg:"Removed from pipeline.",type:"success"});
    } catch(e){setToast({msg:"Error.",type:"error"});}
  };

  const ROUNDS=[{v:"round_1",l:"Round 1"},{v:"round_2",l:"Round 2"},{v:"round_3",l:"Round 3"},{v:"round_4",l:"Round 4"},{v:"round_5",l:"Round 5"},{v:"round_6",l:"Round 6"},{v:"final",l:"Final Round"}];
  const DURATIONS=[{v:"less_30",l:"< 30 min"},{v:"30_min",l:"30 min"},{v:"45_min",l:"45 min"},{v:"1_hour",l:"1 Hour"},{v:"1_30_hour",l:"1.5 Hours"},{v:"2_hours",l:"2 Hours"},{v:"3_hours",l:"3 Hours"}];
  const SUPPORT_MODES=[{v:"sync",l:"Sync"},{v:"otter",l:"Otter"},{v:"prompt",l:"Prompt"},{v:"otter_prompt",l:"Otter+Prompt"}];

  if(loadingData)return <div style={{padding:40,textAlign:"center",color:"#94A3B8"}}>Loading interviews...</div>;

  if(selectedInterview) return <InterviewDetailView
    interview={selectedInterview}
    user={user}
    token={token}
    onBack={()=>setSelectedInterview(null)}
    onUpdate={async(updatedData)=>{
      try {
        await sb.patch("interview_sessions",selectedInterview.id,updatedData,token);
        const s=await sb.get("interview_sessions","select=*&order=created_at.desc",token);
        if(Array.isArray(s))setSessions(s);
        setSelectedInterview({...selectedInterview,...updatedData});
      } catch(e){alert("Error updating.");}
    }}
  />;

  return <div>
    <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Interviews</div>
    <div style={{fontSize:13,color:"#94A3B8",marginBottom:20}}>Interview sessions and pipeline tracking</div>

    <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid #E2E8F0"}}>
      {[{id:"sessions",l:"Interview Sessions"},{id:"pipeline",l:"Pipeline Interviews"}].map(t=>
        <button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?"#2563EB":"transparent"}`,color:tab===t.id?"#2563EB":"#94A3B8",marginBottom:-1}}>{t.l}</button>
      )}
    </div>

    {tab==="sessions"&&<div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <Btn onClick={()=>setShowAddSession(true)}>+ Add Interview Session</Btn>
      </div>
      {sessions.length===0&&<div style={{textAlign:"center",padding:60,color:"#94A3B8",fontSize:14}}>No interview sessions yet. Click '+ Add Interview Session'.</div>}
      <div style={{display:"grid",gap:12}}>
        {sessions.map(s=>{
          const cand=myCands.find(c=>c.id===s.candidate_id);
          const roundLabel=ROUNDS.find(r=>r.v===s.round)?.l||s.round;
          const durationLabel=DURATIONS.find(d=>d.v===s.duration)?.l||s.duration;
          const fbColors={went_well:["#16A34A","#F0FDF4"],okay:["#D97706","#FFFBEB"],not_went_well:["#DC2626","#FEF2F2"]};
          const [fc,fb]=fbColors[s.overall_feedback]||["#94A3B8","#F1F5F9"];
          const cardBorder=s.feedback_received&&s.feedback_outcome==="positive"?"2px solid #BBF7D0":
            s.feedback_received&&s.feedback_outcome==="rejected"?"2px solid #FECACA":
            "2px solid #FDE68A";
          return <Card key={s.id} onClick={()=>setSelectedInterview(s)} style={{padding:18,cursor:"pointer",border:cardBorder}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:"#EFF6FF",color:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700}}>
                  {cand?.name?.split(" ").map(w=>w[0]).join("")||"?"}
                </div>
                <div>
                  <div style={{fontSize:16,fontWeight:700}}>{cand?.name||"Unknown"}</div>
                  <div style={{fontSize:12,color:"#94A3B8"}}>{cand?.tech} · {fmtDate(s.interview_date)}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
                <span style={{background:"#EFF6FF",color:"#2563EB",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{roundLabel}</span>
                <span style={{background:"#F5F3FF",color:"#7C3AED",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{durationLabel}</span>
                <span style={{background:fb,color:fc,fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{s.overall_feedback==="went_well"?"Went Well":s.overall_feedback==="okay"?"Okay":"Not Went Well"}</span>
              </div>
            </div>
            <div style={{background:"#F8FAFC",borderRadius:8,padding:"12px 14px",marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:4}}>Detailed Feedback:</div>
              <div style={{fontSize:13,color:"#334155"}}>{s.detailed_feedback}</div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {s.interview_mode&&<span style={{background:"#F0FDFA",color:"#0F766E",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}> {s.interview_mode==="virtual"?"Virtual":"In-person"}</span>}
              {s.tech_support_name&&<span style={{background:"#F5F3FF",color:"#7C3AED",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}> {s.tech_support_name}</span>}
              {s.support_mode&&<span style={{background:"#EFF6FF",color:"#2563EB",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{SUPPORT_MODES.find(m=>m.v===s.support_mode)?.l||s.support_mode}</span>}
            </div>
          </Card>;
        })}
      </div>

      <Modal open={showAddSession} onClose={()=>setShowAddSession(false)} title="Add Interview Session">
        <Select label="Candidate *" value={form.candidate_id||""} onChange={e=>set("candidate_id",e.target.value)}>
          <option value="">-- Select candidate --</option>
          {myCands.map(c=><option key={c.id} value={c.id}>{c.name} · {c.tech}</option>)}
        </Select>
        <Input label="Interview date *" type="date" value={form.interview_date||""} onChange={e=>set("interview_date",e.target.value)}/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:8}}>Round *</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {ROUNDS.map(r=><button key={r.v} type="button" onClick={()=>set("round",r.v)} style={{padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:form.round===r.v?"#EFF6FF":"#fff",color:form.round===r.v?"#2563EB":"#94A3B8",border:`1px solid ${form.round===r.v?"#2563EB":"#E2E8F0"}`}}>{r.l}</button>)}
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:8}}>Duration *</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {DURATIONS.map(d=><button key={d.v} type="button" onClick={()=>set("duration",d.v)} style={{padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:form.duration===d.v?"#F5F3FF":"#fff",color:form.duration===d.v?"#7C3AED":"#94A3B8",border:`1px solid ${form.duration===d.v?"#7C3AED":"#E2E8F0"}`}}>{d.l}</button>)}
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:8}}>Overall Feedback *</label>
          <div style={{display:"flex",gap:8}}>
            {[{v:"went_well",l:"Went Well",c:"#16A34A",b:"#F0FDF4"},{v:"okay",l:"Okay",c:"#D97706",b:"#FFFBEB"},{v:"not_went_well",l:"Not Went Well",c:"#DC2626",b:"#FEF2F2"}].map(f=><button key={f.v} type="button" onClick={()=>set("overall_feedback",f.v)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:form.overall_feedback===f.v?f.b:"#fff",color:form.overall_feedback===f.v?f.c:"#94A3B8",border:`1px solid ${form.overall_feedback===f.v?f.c:"#E2E8F0"}`}}>{f.l}</button>)}
          </div>
        </div>
        <Textarea label="Detailed Feedback *" value={form.detailed_feedback||""} onChange={e=>set("detailed_feedback",e.target.value)} placeholder="Detailed interview feedback — mandatory..."/>
        <Input label="Interview with (Company / Person) *" value={form.with_whom||""} onChange={e=>set("with_whom",e.target.value)} placeholder="e.g. TechCorp — Sarah Johnson"/>
        <Input label="Tech support name *" value={form.tech_support_name||""} onChange={e=>set("tech_support_name",e.target.value)} placeholder="Support person name"/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:8}}>Feedback from *</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["End Client","Prime Vendor","Vendor"].map(f=><button key={f} type="button" onClick={()=>set("feedback_from",f)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:form.feedback_from===f?"#EFF6FF":"#fff",color:form.feedback_from===f?"#2563EB":"#94A3B8",border:`1px solid ${form.feedback_from===f?"#2563EB":"#E2E8F0"}`}}>{f}</button>)}
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:8}}>Feedback status *</label>
          <div style={{display:"flex",gap:8}}>
            {[{v:"received",l:"Received"},{v:"waiting",l:"Waiting for feedback"}].map(s=><button key={s.v} type="button" onClick={()=>set("feedback_status",s.v)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:form.feedback_status===s.v?"#EFF6FF":"#fff",color:form.feedback_status===s.v?"#2563EB":"#94A3B8",border:`1px solid ${form.feedback_status===s.v?"#2563EB":"#E2E8F0"}`}}>{s.l}</button>)}
          </div>
        </div>
        {form.feedback_status==="received"&&<Textarea label="Official feedback" value={form.official_feedback||""} onChange={e=>set("official_feedback",e.target.value)} placeholder="Enter the official feedback received..."/>}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:8}}>Interview mode *</label>
          <div style={{display:"flex",gap:8}}>
            {[{v:"virtual",l:"️ Virtual"},{v:"in_person",l:" In-person"}].map(m=><button key={m.v} type="button" onClick={()=>set("interview_mode",m.v)} style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:form.interview_mode===m.v?"#EFF6FF":"#fff",color:form.interview_mode===m.v?"#2563EB":"#94A3B8",border:`1px solid ${form.interview_mode===m.v?"#2563EB":"#E2E8F0"}`}}>{m.l}</button>)}
          </div>
        </div>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:8}}>Mode of support</label>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {SUPPORT_MODES.map(s=><button key={s.v} type="button" onClick={()=>set("support_mode",s.v)} style={{padding:"5px 10px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:form.support_mode===s.v?"#EFF6FF":"#fff",color:form.support_mode===s.v?"#2563EB":"#94A3B8",border:`1px solid ${form.support_mode===s.v?"#2563EB":"#E2E8F0"}`}}>{s.l}</button>)}
          </div>
        </div>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn variant="outline" onClick={()=>{setShowAddSession(false);setForm({});}}>Cancel</Btn>
          <Btn onClick={addSession}>Add Session</Btn>
        </div>
      </Modal>
    </div>}

    {tab==="pipeline"&&<div>
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <Btn onClick={()=>setShowAddPipeline(true)}>+ Add to Pipeline</Btn>
      </div>
      {pipeline.filter(p=>p.status==="active").length===0&&<div style={{textAlign:"center",padding:60,color:"#94A3B8",fontSize:14}}>No pipeline interviews yet.</div>}
      <div style={{display:"grid",gap:12}}>
        {pipeline.filter(p=>p.status==="active").map(p=>{
          const cand=myCands.find(c=>c.id===p.candidate_id);
          const updates=pipelineUpdates.filter(u=>u.pipeline_id===p.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
          const expectingLabel={["1_week"]:"In 1 week","2_weeks":"In 2 weeks","not_sure":"Not sure"}[p.expecting]||p.expecting;
          return <Card key={p.id} style={{padding:18}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{cand?.name||"?"}</div>
                <div style={{fontSize:12,color:"#94A3B8"}}>{cand?.tech} · Interview with: <strong>{p.interview_with}</strong></div>
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{background:"#EFF6FF",color:"#2563EB",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{p.round}</span>
                <span style={{background:"#FFFBEB",color:"#D97706",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}> {expectingLabel}</span>
                <button onClick={()=>{setShowAddUpdate(p.id);setForm({});}} style={{padding:"4px 10px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:"#EFF6FF",color:"#2563EB",border:"1px solid #BFDBFE"}}>+ Update</button>
                <button onClick={()=>{setShowDeletePipeline(p.id);setForm({});}} style={{padding:"4px 10px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA"}}>Remove</button>
              </div>
            </div>
            <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:8}}>Update History:</div>
            {updates.length===0&&<div style={{fontSize:12,color:"#94A3B8",background:"#F8FAFC",padding:"8px 12px",borderRadius:8}}>No updates yet. Click '+ Update' to add.</div>}
            {updates.map((u,i)=><div key={u.id} style={{display:"flex",gap:10,marginBottom:8}}>
              <div style={{width:6,borderRadius:99,background:i===0?"#2563EB":"#E2E8F0",flexShrink:0}}/>
              <div style={{flex:1,background:i===0?"#EFF6FF":"#F8FAFC",borderRadius:8,padding:"8px 12px"}}>
                <div style={{fontSize:12,color:"#334155"}}>{u.update_text}</div>
                <div style={{fontSize:10,color:"#94A3B8",marginTop:3}}>{fmtDateTime(u.created_at)}</div>
              </div>
            </div>)}
          </Card>;
        })}
      </div>

      {/* Add Pipeline Modal */}
      <Modal open={showAddPipeline} onClose={()=>{setShowAddPipeline(false);setForm({});}} title="Add to Pipeline">
        <Select label="Candidate *" value={form.candidate_id||""} onChange={e=>set("candidate_id",e.target.value)}>
          <option value="">-- Select candidate --</option>
          {myCands.map(c=><option key={c.id} value={c.id}>{c.name} · {c.tech}</option>)}
        </Select>
        <Input label="Interview with (Company/Person) *" value={form.interview_with||""} onChange={e=>set("interview_with",e.target.value)} placeholder="e.g. TechCorp — Sarah Johnson"/>
        <Input label="Round *" value={form.round||""} onChange={e=>set("round",e.target.value)} placeholder="e.g. Round 1, HR Round"/>
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:8}}>Expecting *</label>
          <div style={{display:"flex",gap:8}}>
            {[{v:"1_week",l:"In 1 week"},{v:"2_weeks",l:"In 2 weeks"},{v:"not_sure",l:"Not sure"}].map(e=><button key={e.v} type="button" onClick={()=>set("expecting",e.v)} style={{padding:"6px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:form.expecting===e.v?"#EFF6FF":"#fff",color:form.expecting===e.v?"#2563EB":"#94A3B8",border:`1px solid ${form.expecting===e.v?"#2563EB":"#E2E8F0"}`}}>{e.l}</button>)}
          </div>
        </div>
        <Textarea label="Initial update" value={form.initial_update||""} onChange={e=>set("initial_update",e.target.value)} placeholder="Any initial notes about this pipeline entry..."/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn variant="outline" onClick={()=>{setShowAddPipeline(false);setForm({});}}>Cancel</Btn>
          <Btn onClick={addPipeline}>Add to Pipeline</Btn>
        </div>
      </Modal>

      {/* Add Update Modal */}
      <Modal open={!!showAddUpdate} onClose={()=>{setShowAddUpdate(null);setForm({});}} title="Add Update">
        <Textarea label="Update *" value={form.update_text||""} onChange={e=>set("update_text",e.target.value)} placeholder="What's the latest update on this interview?"/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn variant="outline" onClick={()=>{setShowAddUpdate(null);setForm({});}}>Cancel</Btn>
          <Btn onClick={()=>addUpdate(showAddUpdate)}>Add Update</Btn>
        </div>
      </Modal>

      {/* Delete Pipeline Modal */}
      <Modal open={!!showDeletePipeline} onClose={()=>{setShowDeletePipeline(null);setForm({});}} title="Remove from Pipeline">
        <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#DC2626",marginBottom:16}}>Note: This will remove the interview from the active pipeline. Reason is mandatory.</div>
        <Textarea label="Reason for removal *" value={form.delete_reason||""} onChange={e=>set("delete_reason",e.target.value)} placeholder="Why is this being removed from pipeline?"/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <Btn variant="outline" onClick={()=>{setShowDeletePipeline(null);setForm({});}}>Cancel</Btn>
          <Btn variant="danger" onClick={()=>deletePipeline(showDeletePipeline)}>Remove</Btn>
        </div>
      </Modal>
    </div>}
  </div>;
}

// ─── OVERALL STATUS PAGE (President) ────────────────────────────────────────
function OverallStatusPage({user,members,candidates,logs,token}){
  const [selRLead,setSelRLead]=useState("");
  const [selRec,setSelRec]=useState("");
  const [selCand,setSelCand]=useState("");
  const [selFromDate,setSelFromDate]=useState("");
  const [selToDate,setSelToDate]=useState("");
  const [presNotes,setPresNotes]=useState([]);
  const [newNote,setNewNote]=useState("");
  const [interviewSessions,setInterviewSessions]=useState([]);
  const [pipelineItems,setPipelineItems]=useState([]);
  const [pipelineUpdates,setPipelineUpdates]=useState([]);
  const [managerFeedbacks,setManagerFeedbacks]=useState([]);
  const [loading,setLoading]=useState(false);
  const [showNoteInput,setShowNoteInput]=useState(false);
  const [expandedSection,setExpandedSection]=useState(null);

  const rLeads=members.filter(m=>m.role==="r_lead");
  const recruitersUnder=selRLead?members.filter(m=>m.role==="recruiter"&&m.r_lead_team===selRLead):[];
  const candsUnder=selRec?candidates.filter(c=>c.recruiter_id===selRec):[];

  // Load extra data
  useEffect(()=>{
    if(!token)return;
    const load=async()=>{
      try {
        const [is,pi,pu,mf,pn]=await Promise.all([
          sb.get("interview_sessions","select=*&order=created_at.desc",token),
          sb.get("pipeline_interviews","select=*&order=created_at.desc",token),
          sb.get("pipeline_updates","select=*&order=created_at.desc",token),
          sb.get("manager_feedbacks","select=*&order=created_at.desc",token),
          sb.get("president_notes","select=*&order=created_at.desc",token),
        ]);
        if(Array.isArray(is))setInterviewSessions(is);
        if(Array.isArray(pi))setPipelineItems(pi);
        if(Array.isArray(pu))setPipelineUpdates(pu);
        if(Array.isArray(mf))setManagerFeedbacks(mf);
        if(Array.isArray(pn))setPresNotes(pn);
      } catch(e){console.error(e);}
    };
    load();
  },[token]);

  // Period calculation
  const getPeriodDates=()=>{
    if(selFromDate&&selToDate){
      return {start:new Date(selFromDate),end:new Date(selToDate)};
    }
    return {start:new Date(0),end:new Date()};
  };

  const inPeriod=(dateStr)=>{
    if(!dateStr)return false;
    const {start,end}=getPeriodDates();
    const d=new Date(dateStr);
    return d>=start&&d<=end;
  };

  const cand=selCand?candidates.find(c=>c.id===selCand):null;

  // Filtered data for selected candidate + period
  const candLogs=cand?logs.filter(l=>l.candidate_id===cand.id&&inPeriod(l.log_date)):[];
  const recLogs=candLogs.filter(l=>l.type==="recruiter");
  const totalEmails=recLogs.reduce((s,l)=>s+(l.emails_sent||0),0);
  const totalSubs=recLogs.reduce((s,l)=>s+(l.submissions||0),0);
  const candSessions=cand?interviewSessions.filter(s=>s.candidate_id===cand.id&&inPeriod(s.interview_date)):[];
  const candPipeline=cand?pipelineItems.filter(p=>p.candidate_id===cand.id):[];
  const candScreeningCalls=cand?screeningCalls.filter(s=>s.candidate_id===cand.id&&inPeriod(s.call_date)):[];
  const candMgrFeedbacks=cand?managerFeedbacks.filter(f=>f.candidate_id===cand.id&&inPeriod(f.created_at?.split("T")[0])):[];
  const candPresNotes=cand?presNotes.filter(n=>n.candidate_id===cand.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)):[];

  // Day wise breakdown
  const days={};
  recLogs.forEach(l=>{
    if(!days[l.log_date])days[l.log_date]={emails:0,subs:0};
    days[l.log_date].emails+=(l.emails_sent||0);
    days[l.log_date].subs+=(l.submissions||0);
  });
  const dayBreakdown=Object.entries(days).sort((a,b)=>a[0].localeCompare(b[0]));

  const saveNote=async()=>{
    if(!newNote.trim()||!cand)return;
    const {start,end}=getPeriodDates();
    try {
      await sb.post("president_notes",{candidate_id:cand.id,period_start:start.toISOString().split("T")[0],period_end:end.toISOString().split("T")[0],note:newNote.trim()},token);
      const pn=await sb.get("president_notes","select=*&order=created_at.desc",token);
      if(Array.isArray(pn))setPresNotes(pn);
      setNewNote("");setShowNoteInput(false);
    } catch(e){alert("Error saving note.");}
  };

  const getMember=id=>members.find(m=>m.id===id);
  const ROUNDS_MAP={round_1:"Round 1",round_2:"Round 2",round_3:"Round 3",round_4:"Round 4",round_5:"Round 5",round_6:"Round 6",final:"Final"};
  const DURATION_MAP={less_30:"<30 min","30_min":"30 min","45_min":"45 min","1_hour":"1 Hour","1_30_hour":"1.5 Hours","2_hours":"2 Hours","3_hours":"3 Hours"};

  return <div>
    <div style={{fontSize:20,fontWeight:700,marginBottom:4}}>Overall Status</div>
    <div style={{fontSize:13,color:"#94A3B8",marginBottom:20}}>Drill down: R Lead → Recruiter → Candidate → Period</div>

    {/* FILTERS */}
    <Card style={{padding:20,marginBottom:20}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:12}}>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>1. Select R Lead</label>
          <select value={selRLead} onChange={e=>{setSelRLead(e.target.value);setSelRec("");setSelCand("");}} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",background:"#fff"}}>
            <option value="">-- Select R Lead --</option>
            {rLeads.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>2. Select Recruiter</label>
          <select value={selRec} onChange={e=>{setSelRec(e.target.value);setSelCand("");}} disabled={!selRLead} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",background:selRLead?"#fff":"#F8FAFC"}}>
            <option value="">-- Select Recruiter --</option>
            {recruitersUnder.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>3. Select Candidate</label>
          <select value={selCand} onChange={e=>setSelCand(e.target.value)} disabled={!selRec} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",background:selRec?"#fff":"#F8FAFC"}}>
            <option value="">-- Select Candidate --</option>
            {candsUnder.map(c=><option key={c.id} value={c.id}>{c.name} · {c.tech}</option>)}
          </select>
        </div>
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>4. Select Period</label>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{flex:1}}>
              <label style={{display:"block",fontSize:11,color:"#94A3B8",marginBottom:4}}>From</label>
              <input type="date" value={selFromDate} onChange={e=>setSelFromDate(e.target.value)} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",fontSize:13,outline:"none"}}/>
            </div>
            <div style={{paddingTop:18,color:"#94A3B8",fontWeight:600}}>→</div>
            <div style={{flex:1}}>
              <label style={{display:"block",fontSize:11,color:"#94A3B8",marginBottom:4}}>To</label>
              <input type="date" value={selToDate} onChange={e=>setSelToDate(e.target.value)} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",fontSize:13,outline:"none"}}/>
            </div>
          </div>
          {selFromDate&&selToDate&&<div style={{fontSize:11,color:"#7C3AED",marginTop:6,fontWeight:600}}> {selFromDate} → {selToDate}</div>}
        </div>
      </div>
    </Card>

    {!cand&&<div style={{textAlign:"center",padding:60,color:"#94A3B8",fontSize:14}}> Select R Lead → Recruiter → Candidate → Period to see full report</div>}

    {cand&&<div>
      {/* CANDIDATE HEADER */}
      <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:20,marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:56,height:56,borderRadius:"50%",background:"#F5F3FF",color:"#7C3AED",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700}}>
          {cand.name.split(" ").map(w=>w[0]).join("")}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:800}}>{cand.name}</div>
          <div style={{fontSize:13,color:"#94A3B8"}}>{cand.tech} · Marketing started: {fmtDate(cand.marketing_start_date||cand.added_on)}</div>
          <div style={{display:"flex",gap:8,marginTop:6,flexWrap:"wrap"}}>
            <span style={{background:"#F0FDF4",color:"#16A34A",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>Rec: {getMember(cand.recruiter_id)?.name||"?"}</span>
            <span style={{background:"#EFF6FF",color:"#2563EB",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>R Lead: {getMember(cand.r_lead_id)?.name||"?"}</span>
            <span style={{background:"#FFFBEB",color:"#D97706",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>C Lead: {getMember(cand.c_lead_id)?.name||"?"}</span>
            <span style={{background:"#FEF2F2",color:"#DC2626",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>IC: {getMember(cand.interview_coord_id)?.name||"?"}</span>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:11,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.05em"}}>Period</div>
          <div style={{fontSize:13,fontWeight:700,color:"#7C3AED"}}>{selFromDate&&selToDate?`${selFromDate} → ${selToDate}`:"All time"}</div>
        </div>
      </div>

      {/* STATS SUMMARY — clickable cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}>
        {[
          {id:"emails",label:"Emails Sent",val:totalEmails,color:"#2563EB",bg:"#EFF6FF"},
          {id:"submissions",label:"Submissions",val:totalSubs,color:"#7C3AED",bg:"#F5F3FF"},
          {id:"interviews",label:"Interviews",val:candSessions.length,color:"#16A34A",bg:"#F0FDF4"},
          {id:"pipeline",label:"Pipeline",val:candPipeline.filter(p=>p.status==="active").length,color:"#D97706",bg:"#FFFBEB"},
          {id:"mocks",label:"Mock Sessions",val:candLogs.filter(l=>l.type==="interview_coord").length,color:"#DC2626",bg:"#FEF2F2"},
          {id:"manager",label:"Mgr Feedback",val:candLogs.filter(l=>l.type==="manager_feedback").length,color:"#0F766E",bg:"#F0FDFA"},
        ].map(s=><div key={s.id} onClick={()=>setExpandedSection(expandedSection===s.id?null:s.id)} style={{background:expandedSection===s.id?s.bg:"#fff",border:`2px solid ${expandedSection===s.id?s.color:"#E2E8F0"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all .15s"}}>
          <div style={{fontSize:11,fontWeight:600,textTransform:"uppercase",color:"#94A3B8",marginBottom:4}}>{s.label}</div>
          <div style={{fontSize:26,fontWeight:800,color:s.color}}>{s.val}</div>
          <div style={{fontSize:10,color:expandedSection===s.id?s.color:"#94A3B8",marginTop:2,fontWeight:600}}>{expandedSection===s.id?"▲ Hide details":"▼ Click to expand"}</div>
        </div>)}
      </div>

      {/* EXPANDABLE DETAIL SECTIONS */}

      {/* EMAILS EXPANDED */}
      {expandedSection==="emails"&&<Card style={{marginBottom:14,border:"2px solid #2563EB"}}>
        <CardHeader title="Emails: Day-wise Emails & Submissions — Full Detail"/>
        <div style={{padding:"0 0 8px"}}>
          {dayBreakdown.length===0&&<div style={{padding:"16px",fontSize:13,color:"#94A3B8"}}>No recruiter logs for this period.</div>}
          {dayBreakdown.map(([date,data])=>{
            const dayLogs=recLogs.filter(l=>l.log_date===date);
            return <div key={date} style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9"}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontSize:13,fontWeight:700}}>{fmtDate(date)}</div>
                <div style={{display:"flex",gap:12}}>
                  <span style={{fontSize:13,color:"#2563EB",fontWeight:700}}>Emails: {data.emails} emails</span>
                  <span style={{fontSize:13,color:"#7C3AED",fontWeight:700}}>Subs: {data.subs} submissions</span>
                </div>
              </div>
              {dayLogs.map(l=><div key={l.id} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
                {l.reason_less_emails&&<div style={{fontSize:12,color:"#D97706",marginBottom:4}}>Note: Less emails reason: {l.reason_less_emails}</div>}
                {l.reason_zero_subs&&<div style={{fontSize:12,color:"#DC2626",marginBottom:4}}>Note: Zero subs reason: {l.reason_zero_subs}</div>}
                {l.issue_description&&<div style={{fontSize:12,color:"#475569",marginBottom:4}}>Issue: {l.issue_description}</div>}
                {l.issue_status&&<div style={{fontSize:11,marginBottom:4}}><span style={{background:l.issue_status==="solved"?"#F0FDF4":"#FFFBEB",color:l.issue_status==="solved"?"#16A34A":"#D97706",padding:"1px 7px",borderRadius:99,fontWeight:600}}>Status: {l.issue_status}</span></div>}
                {l.notes&&<div style={{fontSize:12,color:"#94A3B8"}}>Notes: {l.notes}</div>}
              </div>)}
            </div>;
          })}
          {dayBreakdown.length>0&&<div style={{display:"flex",justifyContent:"space-between",padding:"12px 16px",background:"#EFF6FF",fontWeight:700,fontSize:14}}>
            <span>Total for period</span>
            <div style={{display:"flex",gap:16}}>
              <span style={{color:"#2563EB"}}>Emails: {totalEmails} emails</span>
              <span style={{color:"#7C3AED"}}>Subs: {totalSubs} submissions</span>
            </div>
          </div>}
        </div>
      </Card>}

      {/* SUBMISSIONS EXPANDED */}
      {expandedSection==="submissions"&&<Card style={{marginBottom:14,border:"2px solid #7C3AED"}}>
        <CardHeader title="Subs: Submissions — Full Detail"/>
        <div style={{padding:"0 0 8px"}}>
          {recLogs.length===0&&<div style={{padding:"16px",fontSize:13,color:"#94A3B8"}}>No submissions data for this period.</div>}
          {recLogs.map(l=><div key={l.id} style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:700}}>{fmtDate(l.log_date)} · {l.log_time}</span>
              <div style={{display:"flex",gap:10}}>
                <span style={{fontSize:13,color:"#2563EB",fontWeight:700}}>Emails: {l.emails_sent}</span>
                <span style={{fontSize:13,color:"#7C3AED",fontWeight:700}}>Subs: {l.submissions}</span>
              </div>
            </div>
            {l.reason_less_emails&&<div style={{fontSize:12,color:"#D97706",background:"#FFFBEB",padding:"6px 10px",borderRadius:6,marginBottom:4}}>Low emails: {l.reason_less_emails}</div>}
            {l.reason_zero_subs&&<div style={{fontSize:12,color:"#DC2626",background:"#FEF2F2",padding:"6px 10px",borderRadius:6,marginBottom:4}}>Note: Zero submissions: {l.reason_zero_subs}</div>}
            {l.notes&&<div style={{fontSize:12,color:"#94A3B8"}}>Notes: {l.notes}</div>}
          </div>)}
        </div>
      </Card>}

      {/* INTERVIEWS EXPANDED */}
      {expandedSection==="interviews"&&<Card style={{marginBottom:14,border:"2px solid #16A34A"}}>
        <CardHeader title="Interviews — Full Detail"/>
        <div style={{padding:"0 0 8px"}}>
          {candSessions.length===0&&<div style={{padding:"16px",fontSize:13,color:"#94A3B8"}}>No interviews this period.</div>}
          {candSessions.map(s=><div key={s.id} style={{padding:"16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{ROUNDS_MAP[s.round]||s.round}</div>
                <div style={{fontSize:12,color:"#94A3B8"}}>{fmtDate(s.interview_date)}</div>
              </div>
              <span style={{fontSize:12,background:s.overall_feedback==="went_well"?"#F0FDF4":s.overall_feedback==="okay"?"#FFFBEB":"#FEF2F2",color:s.overall_feedback==="went_well"?"#16A34A":s.overall_feedback==="okay"?"#D97706":"#DC2626",padding:"4px 12px",borderRadius:99,fontWeight:700,height:"fit-content"}}>{s.overall_feedback==="went_well"?"Went Well":s.overall_feedback==="okay"?"Okay":"Not Went Well"}</span>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:10}}>
              <span style={{background:"#F5F3FF",color:"#7C3AED",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>⏱️ {DURATION_MAP[s.duration]||s.duration}</span>
              <span style={{background:"#EFF6FF",color:"#2563EB",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}> {s.interview_mode==="virtual"?"Virtual":"In-person"}</span>
              {s.tech_support_name&&<span style={{background:"#F0FDF4",color:"#16A34A",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}> {s.tech_support_name}</span>}
              {s.support_mode&&<span style={{background:"#FFFBEB",color:"#D97706",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{s.support_mode}</span>}
            </div>
            <div style={{background:"#F8FAFC",borderRadius:8,padding:"12px"}}>
              <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:4}}>Detailed Feedback:</div>
              <div style={{fontSize:13,color:"#334155",lineHeight:1.6}}>{s.detailed_feedback}</div>
            </div>
          </div>)}
        </div>
      </Card>}

      {/* PIPELINE EXPANDED */}
      {expandedSection==="pipeline"&&<Card style={{marginBottom:14,border:"2px solid #D97706"}}>
        <CardHeader title="Pipeline Interviews — Full Detail"/>
        <div style={{padding:"0 0 8px"}}>
          {candPipeline.length===0&&<div style={{padding:"16px",fontSize:13,color:"#94A3B8"}}>No pipeline interviews.</div>}
          {candPipeline.map(p=>{
            const updates=pipelineUpdates.filter(u=>u.pipeline_id===p.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
            return <div key={p.id} style={{padding:"16px",borderBottom:"1px solid #F1F5F9"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700}}>{p.interview_with}</div>
                  <div style={{fontSize:12,color:"#94A3B8"}}>{p.round} · Added {fmtDate(p.created_at?.split("T")[0])}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{background:{"1_week":"#FFFBEB","2_weeks":"#EFF6FF","not_sure":"#F1F5F9"}[p.expecting]||"#F1F5F9",color:{"1_week":"#D97706","2_weeks":"#2563EB","not_sure":"#475569"}[p.expecting]||"#475569",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{{"1_week":"In 1 week","2_weeks":"In 2 weeks","not_sure":"Not sure"}[p.expecting]||p.expecting}</span>
                  <span style={{background:p.status==="active"?"#F0FDF4":"#FEF2F2",color:p.status==="active"?"#16A34A":"#DC2626",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{p.status==="active"?"Active":"Removed"}</span>
                </div>
              </div>
              {p.delete_reason&&<div style={{background:"#FEF2F2",borderRadius:8,padding:"8px 12px",marginBottom:8,fontSize:12,color:"#DC2626"}}>Removal reason: {p.delete_reason}</div>}
              <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:8}}>Update History ({updates.length}):</div>
              {updates.map((u,i)=><div key={u.id} style={{display:"flex",gap:10,marginBottom:8}}>
                <div style={{width:6,borderRadius:99,background:i===0?"#2563EB":"#E2E8F0",flexShrink:0,minHeight:20}}/>
                <div style={{flex:1,background:i===0?"#EFF6FF":"#F8FAFC",borderRadius:8,padding:"8px 12px"}}>
                  <div style={{fontSize:13,color:"#334155"}}>{u.update_text}</div>
                  <div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>{fmtDateTime(u.created_at)}</div>
                </div>
              </div>)}
              {updates.length===0&&<div style={{fontSize:12,color:"#94A3B8"}}>No updates yet.</div>}
            </div>;
          })}
        </div>
      </Card>}

      {/* MOCKS EXPANDED */}
      {expandedSection==="mocks"&&<Card style={{marginBottom:14,border:"2px solid #DC2626"}}>
        <CardHeader title=" Mock Sessions — Full Detail"/>
        <div style={{padding:"0 0 8px"}}>
          {candLogs.filter(l=>l.type==="interview_coord").length===0&&<div style={{padding:"16px",fontSize:13,color:"#94A3B8"}}>No mock sessions this period.</div>}
          {candLogs.filter(l=>l.type==="interview_coord").map(l=><div key={l.id} style={{padding:"16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
              <div>
                <div style={{fontSize:14,fontWeight:700}}>{l.session_type}</div>
                <div style={{fontSize:12,color:"#94A3B8"}}>{fmtDate(l.log_date)} · {l.sessions_done} sessions conducted</div>
              </div>
            </div>
            {l.feedback&&<div style={{background:"#FEF2F2",borderRadius:8,padding:"12px",marginBottom:8}}>
              <div style={{fontSize:12,fontWeight:600,color:"#DC2626",marginBottom:4}}>Session Feedback:</div>
              <div style={{fontSize:13,color:"#334155",lineHeight:1.6}}>{l.feedback}</div>
            </div>}
            {l.tmr_with_whom&&<div style={{background:"#EFF6FF",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:600,color:"#2563EB",marginBottom:6}}>Tomorrow's Interview:</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:12,color:"#475569"}}>With: {l.tmr_with_whom}</span>
                {l.tmr_time&&<span style={{fontSize:12,color:"#475569"}}>· Time: {l.tmr_time}</span>}
                {l.tmr_mode&&<span style={{background:"#F0FDFA",color:"#0F766E",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{l.tmr_mode==="virtual"?"Virtual":"In-person"}</span>}
                {l.tmr_support_mode&&<span style={{background:"#F5F3FF",color:"#7C3AED",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{l.tmr_support_mode}</span>}
              </div>
            </div>}
          </div>)}
        </div>
      </Card>}

      {/* MANAGER FEEDBACK EXPANDED */}
      {expandedSection==="manager"&&<Card style={{marginBottom:14,border:"2px solid #0F766E"}}>
        <CardHeader title="Manager Feedback & Notes — Full Detail"/>
        <div style={{padding:"0 0 8px"}}>
          {candLogs.filter(l=>l.type==="manager_feedback").length===0&&<div style={{padding:"16px",fontSize:13,color:"#94A3B8"}}>No manager feedback for this period.</div>}
          {candLogs.filter(l=>l.type==="manager_feedback").map(l=><div key={l.id} style={{padding:"16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:10}}>{getMember(l.user_id)?.name} · {fmtDate(l.log_date)} · {l.log_time}</div>
            {(l.feedback_to_team||l.manager_feedback)&&<div style={{background:"#F0FDFA",border:"1px solid #99F6E4",borderRadius:8,padding:"12px 14px",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:"#0F766E",marginBottom:6}}>Public Feedback (visible to all team):</div>
              <div style={{fontSize:13,color:"#334155",lineHeight:1.6}}>{l.feedback_to_team||l.manager_feedback}</div>
            </div>}
            {l.feedback_to_president&&<div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:8,padding:"12px 14px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#7C3AED",marginBottom:6}}>Confidential (President only):</div>
              <div style={{fontSize:13,color:"#334155",lineHeight:1.6}}>{l.feedback_to_president}</div>
            </div>}
            {l.action_items&&<div style={{marginTop:10,background:"#FFFBEB",border:"1px solid #FDE68A",borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#D97706",marginBottom:4}}> Action Items:</div>
              <div style={{fontSize:13,color:"#334155"}}>{l.action_items}</div>
            </div>}
          </div>)}
        </div>
      </Card>}

      {/* PRESIDENT PERSONAL NOTES */}
      <Card>
        <CardHeader title="My Personal Notes" action={<Btn variant="outline" onClick={()=>setShowNoteInput(!showNoteInput)} style={{fontSize:12,padding:"5px 12px"}}>+ Add Note</Btn>}/>
        {showNoteInput&&<div style={{padding:"14px 16px",borderBottom:"1px solid #E2E8F0"}}>
          <textarea value={newNote} onChange={e=>setNewNote(e.target.value)} placeholder="Add your private note for this candidate this period..." style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",resize:"vertical",boxSizing:"border-box"}} rows={3}/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <Btn variant="outline" onClick={()=>{setShowNoteInput(false);setNewNote("");}}>Cancel</Btn>
            <Btn onClick={saveNote}>Save Note</Btn>
          </div>
        </div>}
        <div style={{padding:"0 0 8px"}}>
          {candPresNotes.length===0&&<div style={{padding:"16px",fontSize:13,color:"#94A3B8"}}>No personal notes yet. Only you can see these notes.</div>}
          {candPresNotes.map(n=><div key={n.id} style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",background:"#FAFAFF"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:11,fontWeight:600,color:"#7C3AED",background:"#F5F3FF",padding:"2px 8px",borderRadius:99}}>Period: {fmtDate(n.period_start)} — {fmtDate(n.period_end)}</span>
              <span style={{fontSize:11,color:"#94A3B8"}}>{fmtDateTime(n.created_at)}</span>
            </div>
            <div style={{fontSize:13,color:"#334155"}}>{n.note}</div>
          </div>)}
        </div>
      </Card>
    </div>}
  </div>;
}

// ─── STATUS MEETING PAGE (All Roles) ────────────────────────────────────────
function StatusMeetingPage({user,rc,members,candidates,allCandidates,logs,token,onRefresh}){
  const [selCand,setSelCand]=useState("");
  const [fromDate,setFromDate]=useState("");
  const [toDate,setToDate]=useState("");
  const [activeTab,setActiveTab]=useState("overview");
  const [selectedInterview,setSelectedInterview]=useState(null);
  const [selectedPipeline,setSelectedPipeline]=useState(null);
  const [interviewSessions,setInterviewSessions]=useState([]);
  const [pipelineItems,setPipelineItems]=useState([]);
  const [pipelineUpdates,setPipelineUpdates]=useState([]);
  const [screeningCalls,setScreeningCalls]=useState([]);
  const [statusNotes,setStatusNotes]=useState([]);
  const [presNotes,setPresNotes]=useState([]);
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);
  const [loadingData,setLoadingData]=useState(false);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  useEffect(()=>{
    if(!token)return;
    const load=async()=>{
      setLoadingData(true);
      try {
        const [is,pi,pu,sc,sn,pn]=await Promise.all([
          sb.get("interview_sessions","select=*&order=created_at.desc",token),
          sb.get("pipeline_interviews","select=*&order=created_at.desc",token),
          sb.get("pipeline_updates","select=*&order=created_at.desc",token),
          sb.get("screening_calls","select=*&order=created_at.desc",token),
          sb.get("status_meeting_notes","select=*&order=created_at.desc",token),
          sb.get("president_notes","select=*&order=created_at.desc",token),
        ]);
        if(Array.isArray(is))setInterviewSessions(is);
        if(Array.isArray(pi))setPipelineItems(pi);
        if(Array.isArray(pu))setPipelineUpdates(pu);
        if(Array.isArray(sc))setScreeningCalls(sc);
        if(Array.isArray(sn))setStatusNotes(sn);
        if(Array.isArray(pn))setPresNotes(pn);
      } catch(e){console.error(e);}
      setLoadingData(false);
    };
    load();
  },[token]);

  const inPeriod=(dateStr)=>{
    if(!dateStr||!fromDate||!toDate)return true;
    const d=new Date(dateStr);
    return d>=new Date(fromDate)&&d<=new Date(toDate);
  };

  const getMember=id=>members.find(m=>m.id===id);
  const cand=selCand?allCandidates.find(c=>c.id===selCand):null;

  // Filtered data
  const candLogs=cand?logs.filter(l=>l.candidate_id===cand.id&&inPeriod(l.log_date)):[];
  const recLogs=candLogs.filter(l=>l.type==="recruiter");
  const rLeadLogs=candLogs.filter(l=>l.type==="r_lead");
  const cLeadLogs=candLogs.filter(l=>l.type==="c_lead");
  const icLogs=candLogs.filter(l=>l.type==="interview_coord");
  const mgrLogs=candLogs.filter(l=>l.type==="manager_feedback");
  const totalEmails=recLogs.reduce((s,l)=>s+(l.emails_sent||0),0);
  const totalSubs=recLogs.reduce((s,l)=>s+(l.submissions||0),0);
  const candSessions=cand?interviewSessions.filter(s=>s.candidate_id===cand.id&&inPeriod(s.interview_date)):[];
  const candPipeline=cand?pipelineItems.filter(p=>p.candidate_id===cand.id):[];
  const candScreeningCalls=cand?screeningCalls.filter(s=>s.candidate_id===cand.id&&inPeriod(s.call_date)):[];
  // Filter status notes by period_start/period_end overlap — not created_at!
  const candStatusNotes=cand?statusNotes.filter(n=>{
    if(n.candidate_id!==cand.id)return false;
    if(!fromDate||!toDate)return true;
    // Show note if its period overlaps with selected period
    if(!n.period_start||!n.period_end)return true;
    return n.period_start<=toDate && n.period_end>=fromDate;
  }):[];
  const candPresNotes=cand&&user.role==="president"?presNotes.filter(n=>n.candidate_id===cand.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)):[];

  const saveManagerNote=async()=>{
    if(!form.public_feedback?.trim()&&!form.confidential_note?.trim())return alert("Add at least one feedback");
    setSaving(true);
    try {
      await sb.post("status_meeting_notes",{
        candidate_id:selCand,
        manager_id:user.id,
        period_start:fromDate||null,
        period_end:toDate||null,
        public_feedback:form.public_feedback||"",
        confidential_note:form.confidential_note||"",
      },token);
      const sn=await sb.get("status_meeting_notes","select=*&order=created_at.desc",token);
      if(Array.isArray(sn))setStatusNotes(sn);
      setForm({});
      alert("Feedback saved!");
    } catch(e){alert("Error saving.");}
    setSaving(false);
  };

  const ROUNDS_MAP={round_1:"Round 1",round_2:"Round 2",round_3:"Round 3",round_4:"Round 4",round_5:"Round 5",round_6:"Round 6",final:"Final"};
  const DURATION_MAP={less_30:"<30 min","30_min":"30 min","45_min":"45 min","1_hour":"1 Hour","1_30_hour":"1.5 Hours","2_hours":"2 Hours","3_hours":"3 Hours"};

  const downloadPDF = () => {
    const getMemberName = id => members.find(m=>m.id===id)?.name || "?";
    const periodLabel = fromDate&&toDate ? `${fromDate} to ${toDate}` : "All time";
    const ROUNDS_MAP={round_1:"Round 1",round_2:"Round 2",round_3:"Round 3",round_4:"Round 4",round_5:"Round 5",round_6:"Round 6",final:"Final"};
    const DURATION_MAP={less_30:"<30 min","30_min":"30 min","45_min":"45 min","1_hour":"1 Hour","1_30_hour":"1.5 Hours","2_hours":"2 Hours","3_hours":"3 Hours"};

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
<title>Status Meeting Report - ${cand?.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0F172A; background: #fff; padding: 40px; }
  .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #E2E8F0; }
  .company-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin-bottom: 8px; }
  .company-mpower { font-size: 16px; font-weight: 800; color: #1D4ED8; }
  .company-vars { font-size: 16px; font-weight: 800; color: #7f1d1d; }
  .company-div { width: 1px; height: 20px; background: #E2E8F0; }
  .portal-title { font-size: 24px; font-weight: 900; color: #0F172A; margin-bottom: 4px; }
  .portal-sub { font-size: 12px; color: #94A3B8; letter-spacing: 0.1em; text-transform: uppercase; }
  .report-title { font-size: 18px; font-weight: 700; color: #2563EB; margin-top: 16px; }
  .candidate-info { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px; }
  .cand-name { font-size: 20px; font-weight: 800; margin-bottom: 4px; }
  .cand-tech { font-size: 13px; color: #475569; margin-bottom: 8px; }
  .team-row { display: flex; gap: 8px; flex-wrap: wrap; }
  .team-badge { font-size: 11px; padding: 3px 10px; border-radius: 99px; font-weight: 600; }
  .badge-rec { background: #F0FDF4; color: #16A34A; }
  .badge-rlead { background: #EFF6FF; color: #2563EB; }
  .badge-clead { background: #FFFBEB; color: #D97706; }
  .badge-ic { background: #FEF2F2; color: #DC2626; }
  .period-badge { background: #F5F3FF; color: #7C3AED; font-size: 12px; padding: 4px 12px; border-radius: 99px; font-weight: 600; margin-top: 8px; display: inline-block; }
  .section { margin-bottom: 24px; border: 1px solid #E2E8F0; border-radius: 10px; overflow: hidden; }
  .section-header { padding: 12px 16px; font-size: 14px; font-weight: 700; }
  .section-rec { background: #F0FDF4; color: #16A34A; border-bottom: 1px solid #BBF7D0; }
  .section-rlead { background: #EFF6FF; color: #2563EB; border-bottom: 1px solid #BFDBFE; }
  .section-clead { background: #FFFBEB; color: #D97706; border-bottom: 1px solid #FDE68A; }
  .section-ic { background: #FEF2F2; color: #DC2626; border-bottom: 1px solid #FECACA; }
  .section-mgr { background: #F0FDFA; color: #0F766E; border-bottom: 1px solid #99F6E4; }
  .section-body { padding: 12px 16px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .label { color: #94A3B8; font-weight: 500; }
  .value { font-weight: 600; color: #0F172A; }
  .stats-row { display: flex; gap: 12px; margin-bottom: 12px; }
  .stat-box { flex: 1; background: #F8FAFC; border-radius: 8px; padding: 10px; text-align: center; }
  .stat-val { font-size: 22px; font-weight: 800; }
  .stat-lbl { font-size: 10px; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }
  .feedback-box { background: #F0FDFA; border: 1px solid #99F6E4; border-radius: 8px; padding: 10px 14px; margin-bottom: 8px; font-size: 13px; }
  .confidential-box { background: #F5F3FF; border: 1px solid #DDD6FE; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
  .conf-label { font-size: 11px; font-weight: 700; color: #7C3AED; margin-bottom: 4px; }
  .no-data { color: #94A3B8; font-size: 13px; padding: 8px 0; }
  .interview-card { background: #F8FAFC; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
  .interview-title { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .interview-with { font-size: 12px; color: #2563EB; font-weight: 600; margin-bottom: 4px; }
  .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 99px; font-weight: 600; margin-right: 4px; }
  .badge-well { background: #F0FDF4; color: #16A34A; }
  .badge-ok { background: #FFFBEB; color: #D97706; }
  .badge-bad { background: #FEF2F2; color: #DC2626; }
  .footer { text-align: center; margin-top: 40px; padding-top: 16px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #94A3B8; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    <div class="company-row">
      <span class="company-mpower">Mpower Logic Inc.</span>
      <div class="company-div"></div>
      <span class="company-vars">VARS Consulting Inc.</span>
    </div>
    <div class="portal-title">Mpower - VARS IMS</div>
    <div class="portal-sub">Internal Management System</div>
    <div class="report-title">Status Meeting Report</div>
  </div>

  <!-- Candidate Info -->
  <div class="candidate-info">
    <div class="cand-name">${cand?.name}</div>
    <div class="cand-tech">${cand?.tech} · Marketing started: ${cand?.marketing_start_date || cand?.added_on || '—'}</div>
    <div class="team-row">
      <span class="team-badge badge-rec">Rec: ${getMemberName(cand?.recruiter_id)}</span>
      <span class="team-badge badge-rlead">R Lead: ${getMemberName(cand?.r_lead_id)}</span>
      <span class="team-badge badge-clead">C Lead: ${getMemberName(cand?.c_lead_id)}</span>
      <span class="team-badge badge-ic">IC: ${getMemberName(cand?.interview_coord_id)}</span>
    </div>
    <div class="period-badge">Period: ${periodLabel}</div>
  </div>

  <!-- Stats Summary -->
  <div class="stats-row">
    <div class="stat-box"><div class="stat-val" style="color:#2563EB">${totalEmails}</div><div class="stat-lbl">Emails Sent</div></div>
    <div class="stat-box"><div class="stat-val" style="color:#7C3AED">${totalSubs}</div><div class="stat-lbl">Submissions</div></div>
    <div class="stat-box"><div class="stat-val" style="color:#16A34A">${candSessions.length}</div><div class="stat-lbl">Interviews</div></div>
    <div class="stat-box"><div class="stat-val" style="color:#D97706">${candPipeline.filter(p=>p.status==="active").length}</div><div class="stat-lbl">Pipeline</div></div>
    <div class="stat-box"><div class="stat-val" style="color:#DC2626">${icLogs.length}</div><div class="stat-lbl">Mock Sessions</div></div>
  </div>

  <!-- Recruiter Section -->
  <div class="section">
    <div class="section-header section-rec">Recruiter — ${getMemberName(cand?.recruiter_id)}</div>
    <div class="section-body">
      ${recLogs.length === 0 ? '<div class="no-data">No recruiter logs for this period.</div>' :
        recLogs.map(l => `
          <div class="row">
            <span class="label">${l.log_date}</span>
            <span class="value">Emails: ${l.emails_sent || 0} emails &nbsp;·&nbsp; Subs: ${l.submissions || 0} submissions</span>
          </div>
          ${l.reason_less_emails ? `<div style="font-size:11px;color:#D97706;margin-bottom:4px;">Low emails: ${l.reason_less_emails}</div>` : ''}
          ${l.reason_zero_subs ? `<div style="font-size:11px;color:#DC2626;margin-bottom:4px;">Zero submissions: ${l.reason_zero_subs}</div>` : ''}
          ${l.issue_description ? `<div style="font-size:11px;color:#475569;margin-bottom:4px;">Issue: ${l.issue_description} (${l.issue_status || ''})</div>` : ''}
        `).join('')}
      <div class="row" style="background:#EFF6FF;padding:8px;border-radius:6px;margin-top:8px;">
        <span style="font-weight:700">Total</span>
        <span style="font-weight:700;color:#2563EB">Emails: ${totalEmails} &nbsp;·&nbsp; Subs: ${totalSubs}</span>
      </div>
    </div>
  </div>

  <!-- R Lead Section -->
  <div class="section">
    <div class="section-header section-rlead">R Lead — ${getMemberName(cand?.r_lead_id)}</div>
    <div class="section-body">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px;color:#475569;">Vendor Mocks:</div>
      ${rLeadLogs.length === 0 ? '<div class="no-data">No R Lead logs this period.</div>' :
        rLeadLogs.map(l => `
          <div class="interview-card">
            <div class="row"><span class="label">${l.log_date}</span><span class="value">${l.vendor_mock_conducted === 'yes' ? 'Conducted' : 'Not Conducted'}</span></div>
            ${l.vendor_mock_feedback ? `<div style="font-size:12px;color:#475569;margin-top:4px;">Feedback: ${l.vendor_mock_feedback}</div>` : ''}
            ${l.vendor_mock_reason ? `<div style="font-size:12px;color:#DC2626;margin-top:4px;">Reason: ${l.vendor_mock_reason}</div>` : ''}
          </div>
        `).join('')}
      <div style="font-weight:600;font-size:12px;margin:12px 0 8px;color:#475569;">Pipeline Interviews:</div>
      ${candPipeline.length === 0 ? '<div class="no-data">No pipeline interviews.</div>' :
        candPipeline.map(p => {
          const updates = pipelineUpdates.filter(u=>u.pipeline_id===p.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
          return `<div class="interview-card">
            <div class="interview-title">${p.interview_with} · ${p.round}</div>
            <div style="font-size:11px;color:${p.status==='active'?'#16A34A':'#DC2626'};margin-bottom:6px;">${p.status==='active'?'Active':'Removed'}</div>
            ${updates.slice(0,3).map(u=>`<div style="font-size:11px;color:#475569;border-left:2px solid #BFDBFE;padding-left:8px;margin-bottom:4px;">${u.update_text}</div>`).join('')}
          </div>`;
        }).join('')}
    </div>
  </div>

  <!-- C Lead Section -->
  <div class="section">
    <div class="section-header section-clead">C Lead — ${getMemberName(cand?.c_lead_id)}</div>
    <div class="section-body">
      ${cLeadLogs.length === 0 ? '<div class="no-data">No C Lead logs this period.</div>' :
        cLeadLogs.map(l => `
          <div class="row">
            <span class="label">${l.log_date}</span>
            <span class="value">${l.resolution_status || '—'}</span>
          </div>
          ${l.floor_issues ? `<div style="font-size:12px;color:#475569;margin-bottom:6px;">${l.floor_issues}</div>` : ''}
        `).join('')}
    </div>
  </div>

  <!-- IC Section -->
  <div class="section">
    <div class="section-header section-ic">Interview Coordinator — ${getMemberName(cand?.interview_coord_id)}</div>
    <div class="section-body">
      <div style="font-weight:600;font-size:12px;margin-bottom:8px;color:#475569;">Interviews (${candSessions.length}):</div>
      ${candSessions.length === 0 ? '<div class="no-data">No interviews this period.</div>' :
        candSessions.map(s => `
          <div class="interview-card">
            <div class="interview-title">${ROUNDS_MAP[s.round]||s.round}</div>
            ${s.with_whom ? `<div class="interview-with"> ${s.with_whom}</div>` : ''}
            <div style="margin-bottom:6px;">
              <span class="badge ${s.overall_feedback==='went_well'?'badge-well':s.overall_feedback==='okay'?'badge-ok':'badge-bad'}">${s.overall_feedback==='went_well'?'Went Well':s.overall_feedback==='okay'?'Okay':'Not Went Well'}</span>
              <span class="badge" style="background:#F5F3FF;color:#7C3AED;">${DURATION_MAP[s.duration]||s.duration}</span>
              <span class="badge" style="background:#EFF6FF;color:#2563EB;">${s.interview_mode==='virtual'?'Virtual':'In-person'}</span>
            </div>
            ${s.detailed_feedback ? `<div style="font-size:12px;color:#475569;">${s.detailed_feedback}</div>` : ''}
            ${s.tech_support_name ? `<div style="font-size:11px;color:#16A34A;margin-top:4px;"> ${s.tech_support_name} — ${s.support_mode||''}</div>` : ''}
          </div>
        `).join('')}
      <div style="font-weight:600;font-size:12px;margin:12px 0 8px;color:#475569;">Mock Sessions (${icLogs.length}):</div>
      ${icLogs.length === 0 ? '<div class="no-data">No mock sessions this period.</div>' :
        icLogs.map(l => `
          <div class="interview-card">
            <div class="row"><span class="label">${l.log_date}</span><span class="value">${l.session_type} · ${l.sessions_done} sessions</span></div>
            ${l.feedback ? `<div style="font-size:12px;color:#475569;margin-top:4px;">${l.feedback}</div>` : ''}
          </div>
        `).join('')}
    </div>
  </div>

  <!-- Manager Feedback -->
  <div class="section">
    <div class="section-header section-mgr">Manager Feedback</div>
    <div class="section-body">
      ${[...mgrLogs, ...candStatusNotes].length === 0 ? '<div class="no-data">No manager feedback for this period.</div>' : ''}
      ${mgrLogs.map(l => `
        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:6px;">${getMemberName(l.user_id)} · ${l.log_date}</div>
          ${(l.feedback_to_team||l.manager_feedback) ? `<div class="feedback-box"> ${l.feedback_to_team||l.manager_feedback}</div>` : ''}
          ${(user.role==='president' && l.feedback_to_president) ? `<div class="confidential-box"><div class="conf-label">Confidential (President only)</div>${l.feedback_to_president}</div>` : ''}
        </div>
      `).join('')}
      ${candStatusNotes.map(n => `
        <div style="margin-bottom:12px;">
          <div style="font-size:12px;font-weight:600;color:#475569;margin-bottom:6px;">${getMemberName(n.manager_id)} · Status Meeting Note</div>
          ${n.public_feedback ? `<div class="feedback-box"> ${n.public_feedback}</div>` : ''}
          ${(user.role==='president' && n.confidential_note) ? `<div class="confidential-box"><div class="conf-label">Confidential (President only)</div>${n.confidential_note}</div>` : ''}
        </div>
      `).join('')}
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div>Mpower Logic Inc. | VARS Consulting Inc. — Internal Management System</div>
    <div style="margin-top:4px;">Generated on ${new Date().toLocaleString('en-US', {dateStyle:'full',timeStyle:'short'})} by ${user.name} (${ROLE_CONFIG[user.role]?.label})</div>
    <div style="margin-top:4px;">CONFIDENTIAL — Internal use only</div>
  </div>
</body>
</html>`);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return <div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
      <div style={{fontSize:20,fontWeight:700}}>Status Meeting</div>
      {cand&&<button onClick={downloadPDF} style={{background:"#2563EB",color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>Download PDF Report</button>}
    </div>
    <div style={{fontSize:13,color:"#94A3B8",marginBottom:20}}>Select candidate + period to view full status — everyone sees all sections</div>

    {/* FILTERS */}
    <Card style={{padding:20,marginBottom:20}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr",gap:12}}>
        {/* R Lead filter — only for admin/president/manager */}
        {rc.canViewAll&&<div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>1. R Lead</label>
          <select value={form.sel_rlead||""} onChange={e=>{set("sel_rlead",e.target.value);set("sel_rec","");setSelCand("");}} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",fontSize:12,outline:"none",background:"#fff"}}>
            <option value="">-- All R Leads --</option>
            {members.filter(m=>m.role==="r_lead").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>}
        {/* Recruiter filter */}
        {rc.canViewAll&&<div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>2. Recruiter</label>
          <select value={form.sel_rec||""} onChange={e=>{set("sel_rec",e.target.value);setSelCand("");}} disabled={!form.sel_rlead} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",fontSize:12,outline:"none",background:form.sel_rlead?"#fff":"#F8FAFC"}}>
            <option value="">-- All Recruiters --</option>
            {members.filter(m=>m.role==="recruiter"&&(!form.sel_rlead||m.r_lead_team===form.sel_rlead)).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>}
        {/* Candidate filter */}
        <div style={{gridColumn:rc.canViewAll?"auto":"1 / span 3"}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>{rc.canViewAll?"3. Candidate *":"Select Candidate *"}</label>
          <select value={selCand} onChange={e=>setSelCand(e.target.value)} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",fontSize:12,outline:"none",background:"#fff"}}>
            <option value="">-- Select candidate --</option>
            {(()=>{
              let cands = rc.canViewAll ? allCandidates : candidates;
              if(form.sel_rec) cands = cands.filter(c=>c.recruiter_id===form.sel_rec);
              else if(form.sel_rlead) cands = cands.filter(c=>c.r_lead_id===form.sel_rlead);
              return cands.map(c=><option key={c.id} value={c.id}>{c.name} · {c.tech}</option>);
            })()}
          </select>
        </div>
        {/* From date */}
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>{rc.canViewAll?"4. From":"From"}</label>
          <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
        </div>
        {/* To date */}
        <div>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>{rc.canViewAll?"5. To":"To"}</label>
          <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 10px",fontSize:12,outline:"none",boxSizing:"border-box"}}/>
        </div>
      </div>
    </Card>

    {!cand&&<div style={{textAlign:"center",padding:60,color:"#94A3B8",fontSize:14}}> Select a candidate to view status meeting data</div>}

    {cand&&<div>
      {/* CANDIDATE HEADER */}
      <div style={{background:"#fff",border:"1px solid #E2E8F0",borderRadius:12,padding:20,marginBottom:16,display:"flex",alignItems:"center",gap:16}}>
        <div style={{width:50,height:50,borderRadius:"50%",background:"#EFF6FF",color:"#2563EB",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700}}>
          {cand.name.split(" ").map(w=>w[0]).join("")}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:800}}>{cand.name}</div>
          <div style={{fontSize:12,color:"#94A3B8"}}>{cand.tech} · Marketing: {fmtDate(cand.marketing_start_date||cand.added_on)}</div>
          <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
            <span style={{background:"#F0FDF4",color:"#16A34A",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>Rec: {getMember(cand.recruiter_id)?.name||"?"}</span>
            <span style={{background:"#EFF6FF",color:"#2563EB",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>R Lead: {getMember(cand.r_lead_id)?.name||"?"}</span>
            <span style={{background:"#FFFBEB",color:"#D97706",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>C Lead: {getMember(cand.c_lead_id)?.name||"?"}</span>
            <span style={{background:"#FEF2F2",color:"#DC2626",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>IC: {getMember(cand.interview_coord_id)?.name||"?"}</span>
          </div>
        </div>
        {fromDate&&toDate&&<div style={{textAlign:"right",background:"#F5F3FF",borderRadius:8,padding:"8px 12px"}}>
          <div style={{fontSize:10,fontWeight:600,color:"#94A3B8",textTransform:"uppercase"}}>Period</div>
          <div style={{fontSize:12,fontWeight:700,color:"#7C3AED"}}>{fmtDate(fromDate)}</div>
          <div style={{fontSize:11,color:"#94A3B8"}}>→ {fmtDate(toDate)}</div>
        </div>}
      </div>

      {/* TABS */}
      <div style={{display:"flex",gap:2,marginBottom:16,borderBottom:"1px solid #E2E8F0",overflowX:"auto"}}>
        {[
          {id:"overview",l:" Overview"},
          {id:"interviews",l:`Interviews (${candSessions.length})`},
          {id:"pipeline",l:` Pipeline (${candPipeline.filter(p=>p.status==="active").length})`},
          {id:"screening",l:` Screening Calls (${candScreeningCalls.length})`},
          {id:"manager",l:"Manager Notes"},
        ].map(t=><button key={t.id} onClick={()=>{setActiveTab(t.id);setSelectedInterview(null);setSelectedPipeline(null);}} style={{padding:"8px 14px",fontSize:12,fontWeight:600,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${activeTab===t.id?"#2563EB":"transparent"}`,color:activeTab===t.id?"#2563EB":"#94A3B8",marginBottom:-1,whiteSpace:"nowrap"}}>{t.l}</button>)}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab==="overview"&&<>
      {/*  RECRUITER SECTION */}
      <Card style={{marginBottom:12,border:"1px solid #BBF7D0"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #BBF7D0",background:"#F0FDF4",borderRadius:"10px 10px 0 0",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{fontWeight:700,fontSize:14,color:"#16A34A"}}>Recruiter — {getMember(cand.recruiter_id)?.name||"?"}</div>
          <div style={{display:"flex",gap:12}}>
            <span style={{fontSize:12,fontWeight:700,color:"#2563EB",background:"#EFF6FF",padding:"3px 10px",borderRadius:99}}>Emails: {totalEmails} emails</span>
            <span style={{fontSize:12,fontWeight:700,color:"#7C3AED",background:"#F5F3FF",padding:"3px 10px",borderRadius:99}}>Subs: {totalSubs} submissions</span>
          </div>
        </div>
        <div style={{padding:"0 0 8px"}}>
          {recLogs.length===0&&<div style={{padding:"14px 16px",fontSize:13,color:"#94A3B8"}}>No recruiter logs for this period.</div>}
          {recLogs.map(l=><div key={l.id} style={{padding:"10px 16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:13,fontWeight:600}}>{fmtDate(l.log_date)}</span>
              <div style={{display:"flex",gap:10}}>
                <span style={{fontSize:12,color:"#2563EB",fontWeight:600}}>Emails: {l.emails_sent}</span>
                <span style={{fontSize:12,color:"#7C3AED",fontWeight:600}}>Subs: {l.submissions}</span>
              </div>
            </div>
            {l.reason_less_emails&&<div style={{fontSize:11,color:"#D97706",background:"#FFFBEB",padding:"4px 8px",borderRadius:4,marginBottom:3}}>Low emails: {l.reason_less_emails}</div>}
            {l.reason_zero_subs&&<div style={{fontSize:11,color:"#DC2626",background:"#FEF2F2",padding:"4px 8px",borderRadius:4,marginBottom:3}}>Zero submissions: {l.reason_zero_subs}</div>}
            {l.issue_description&&<div style={{fontSize:11,color:"#475569",background:"#F8FAFC",padding:"4px 8px",borderRadius:4}}> {l.issue_description} — <span style={{fontWeight:600}}>{l.issue_status}</span></div>}
          </div>)}
        </div>
      </Card>

      {/*  R LEAD SECTION */}
      <Card style={{marginBottom:12,border:"1px solid #BFDBFE"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #BFDBFE",background:"#EFF6FF",borderRadius:"10px 10px 0 0"}}>
          <div style={{fontWeight:700,fontSize:14,color:"#2563EB"}}>R Lead — {getMember(cand.r_lead_id)?.name||"?"}</div>
        </div>
        <div style={{padding:"0 0 8px"}}>
          {/* Vendor Mocks */}
          <div style={{padding:"10px 16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:8}}>Vendor Mocks:</div>
            {rLeadLogs.length===0&&<div style={{fontSize:12,color:"#94A3B8"}}>No R Lead logs this period.</div>}
            {rLeadLogs.map(l=><div key={l.id} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600}}>{fmtDate(l.log_date)}</span>
                <span style={{fontSize:11,background:l.vendor_mock_conducted==="yes"?"#F0FDF4":"#FEF2F2",color:l.vendor_mock_conducted==="yes"?"#16A34A":"#DC2626",padding:"1px 7px",borderRadius:99,fontWeight:600}}>{l.vendor_mock_conducted==="yes"?"Conducted":"Not Conducted"}</span>
              </div>
              {l.vendor_mock_feedback&&<div style={{fontSize:12,color:"#475569"}}>Feedback: {l.vendor_mock_feedback}</div>}
              {l.vendor_mock_reason&&<div style={{fontSize:12,color:"#DC2626"}}>Reason: {l.vendor_mock_reason}</div>}
              {l.vendor_mock_mode&&<div style={{fontSize:11,color:"#94A3B8",marginTop:3}}>Mode: {l.vendor_mock_mode==="video"?"Video Meeting":"Phone Call"}</div>}
            </div>)}
          </div>
          {/* Interview Pipeline */}
          <div style={{padding:"10px 16px"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:8}}>Interview Pipeline:</div>
            {candPipeline.length===0&&<div style={{fontSize:12,color:"#94A3B8"}}>No pipeline interviews.</div>}
            {candPipeline.map(p=>{
              const updates=pipelineUpdates.filter(u=>u.pipeline_id===p.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
              return <div key={p.id} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:12,fontWeight:600}}>{p.interview_with} · {p.round}</span>
                  <span style={{fontSize:11,background:p.status==="active"?"#F0FDF4":"#FEF2F2",color:p.status==="active"?"#16A34A":"#DC2626",padding:"1px 7px",borderRadius:99,fontWeight:600}}>{p.status==="active"?"Active":"Removed"}</span>
                </div>
                {updates.slice(0,3).map((u,i)=><div key={u.id} style={{fontSize:11,color:"#475569",borderLeft:`2px solid ${i===0?"#2563EB":"#E2E8F0"}`,paddingLeft:8,marginBottom:4}}>
                  {u.update_text} <span style={{color:"#94A3B8"}}>· {fmtDate(u.created_at?.split("T")[0])}</span>
                </div>)}
              </div>;
            })}
          </div>
        </div>
      </Card>

      {/* ️ C LEAD SECTION */}
      <Card style={{marginBottom:12,border:"1px solid #FDE68A"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #FDE68A",background:"#FFFBEB",borderRadius:"10px 10px 0 0"}}>
          <div style={{fontWeight:700,fontSize:14,color:"#D97706"}}>C Lead — {getMember(cand.c_lead_id)?.name||"?"}</div>
        </div>
        <div style={{padding:"0 0 8px"}}>
          {cLeadLogs.length===0&&<div style={{padding:"14px 16px",fontSize:13,color:"#94A3B8"}}>No C Lead logs this period.</div>}
          {cLeadLogs.map(l=><div key={l.id} style={{padding:"10px 16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              <span style={{fontSize:13,fontWeight:600}}>{fmtDate(l.log_date)}</span>
              <span style={{fontSize:11,background:l.resolution_status==="solved"?"#F0FDF4":l.resolution_status==="no_issues"?"#F1F5F9":"#FFFBEB",color:l.resolution_status==="solved"?"#16A34A":l.resolution_status==="no_issues"?"#475569":"#D97706",padding:"1px 7px",borderRadius:99,fontWeight:600}}>{l.resolution_status}</span>
            </div>
            {l.floor_issues&&<div style={{fontSize:12,color:"#475569",marginBottom:4}}>️ {l.floor_issues}</div>}
            {l.clead_informed_to?.length>0&&<div style={{fontSize:11,color:"#94A3B8"}}>Informed: {Array.isArray(l.clead_informed_to)?l.clead_informed_to.join(", "):l.clead_informed_to}</div>}
          </div>)}
        </div>
      </Card>

      {/* IC SECTION */}
      <Card style={{marginBottom:12,border:"1px solid #FECACA"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #FECACA",background:"#FEF2F2",borderRadius:"10px 10px 0 0"}}>
          <div style={{fontWeight:700,fontSize:14,color:"#DC2626"}}>Interview Coordinator — {getMember(cand.interview_coord_id)?.name||"?"}</div>
        </div>
        <div style={{padding:"0 0 8px"}}>
          {/* Interview sessions */}
          {candSessions.length>0&&<div style={{padding:"10px 16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:8}}>Interviews ({candSessions.length}):</div>
            {candSessions.map(s=><div key={s.id} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <div>
                  <span style={{fontSize:12,fontWeight:600}}>{ROUNDS_MAP[s.round]||s.round} · {fmtDate(s.interview_date)}</span>
                  {s.with_whom&&<div style={{fontSize:11,color:"#2563EB",fontWeight:600,marginTop:2}}> {s.with_whom}</div>}
                </div>
                <span style={{fontSize:11,background:s.overall_feedback==="went_well"?"#F0FDF4":s.overall_feedback==="okay"?"#FFFBEB":"#FEF2F2",color:s.overall_feedback==="went_well"?"#16A34A":s.overall_feedback==="okay"?"#D97706":"#DC2626",padding:"1px 7px",borderRadius:99,fontWeight:600}}>{s.overall_feedback==="went_well"?"Went Well":s.overall_feedback==="okay"?"Okay":"Not Went Well"}</span>
              </div>
              <div style={{fontSize:12,color:"#475569"}}>{s.detailed_feedback?.substring(0,100)}{s.detailed_feedback?.length>100?"...":""}</div>
            </div>)}
          </div>}
          {/* Mock sessions */}
          <div style={{padding:"10px 16px"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:8}}>Mock Sessions ({icLogs.length}):</div>
            {icLogs.length===0&&<div style={{fontSize:12,color:"#94A3B8"}}>No mock sessions this period.</div>}
            {icLogs.map(l=><div key={l.id} style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",marginBottom:6}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                <span style={{fontSize:12,fontWeight:600}}>{l.session_type} · {l.sessions_done} sessions</span>
                <span style={{fontSize:11,color:"#94A3B8"}}>{fmtDate(l.log_date)}</span>
              </div>
              {l.feedback&&<div style={{fontSize:12,color:"#475569"}}>{l.feedback?.substring(0,100)}{l.feedback?.length>100?"...":""}</div>}
              {l.tmr_with_whom&&<div style={{fontSize:11,color:"#2563EB",marginTop:4}}>Tomorrow: {l.tmr_with_whom} · {l.tmr_time} · {l.tmr_mode}</div>}
            </div>)}
          </div>
        </div>
      </Card>

      </>}

      {/* INTERVIEWS TAB */}
      {activeTab==="interviews"&&<div>
        {!selectedInterview&&<div>
          {candSessions.length===0&&<div style={{textAlign:"center",padding:60,color:"#94A3B8",fontSize:14}}>No interviews for this period.</div>}
          <div style={{display:"grid",gap:12}}>
            {candSessions.map(s=>{
              const ROUNDS_MAP={round_1:"Round 1",round_2:"Round 2",round_3:"Round 3",round_4:"Round 4",round_5:"Round 5",round_6:"Round 6",final:"Final"};
              const DURATION_MAP={less_30:"<30 min","30_min":"30 min","45_min":"45 min","1_hour":"1 Hour","1_30_hour":"1.5 Hours","2_hours":"2 Hours","3_hours":"3 Hours"};
              return <Card key={s.id} style={{padding:18,cursor:"pointer",border:"1px solid #E2E8F0"}} onClick={()=>setSelectedInterview(s)}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700}}>{ROUNDS_MAP[s.round]||s.round}</div>
                    {s.with_whom&&<div style={{fontSize:13,color:"#2563EB",fontWeight:700,marginTop:2}}> {s.with_whom}</div>}
                    <div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{fmtDate(s.interview_date)} · {s.interview_mode==="virtual"?"️ Virtual":" In-person"}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:12,background:s.overall_feedback==="went_well"?"#F0FDF4":s.overall_feedback==="okay"?"#FFFBEB":"#FEF2F2",color:s.overall_feedback==="went_well"?"#16A34A":s.overall_feedback==="okay"?"#D97706":"#DC2626",padding:"4px 12px",borderRadius:99,fontWeight:700}}>{s.overall_feedback==="went_well"?"Went Well":s.overall_feedback==="okay"?"Okay":"Not Went Well"}</span>
                    <span style={{fontSize:12,color:"#2563EB",fontWeight:600}}>View details →</span>
                  </div>
                </div>
                <div style={{fontSize:12,color:"#475569",background:"#F8FAFC",padding:"8px 12px",borderRadius:8}}>{s.detailed_feedback?.substring(0,120)}{s.detailed_feedback?.length>120?"...":""}</div>
              </Card>;
            })}
          </div>
        </div>}
        {selectedInterview&&<InterviewDetailView
          interview={selectedInterview}
          user={user}
          token={token}
          onBack={()=>setSelectedInterview(null)}
          onUpdate={async(updatedData)=>{
            try {
              await sb.patch("interview_sessions",selectedInterview.id,updatedData,token);
              const s=await sb.get("interview_sessions","select=*&order=created_at.desc",token);
              if(Array.isArray(s))setSessions(s);
              setSelectedInterview({...selectedInterview,...updatedData});
            } catch(e){alert("Error updating.");}
          }}
        />}
      </div>}

      {/* PIPELINE TAB */}
      {activeTab==="pipeline"&&<div>
        {!selectedPipeline&&<div>
          {candPipeline.length===0&&<div style={{textAlign:"center",padding:60,color:"#94A3B8",fontSize:14}}>No pipeline interviews.</div>}
          <div style={{display:"grid",gap:12}}>
            {candPipeline.map(p=>{
              const updates=pipelineUpdates.filter(u=>u.pipeline_id===p.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
              return <Card key={p.id} style={{padding:18,cursor:"pointer"}} onClick={()=>setSelectedPipeline(p)}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <div>
                    <div style={{fontSize:15,fontWeight:700}}>{p.interview_with}</div>
                    <div style={{fontSize:12,color:"#94A3B8"}}>{p.round} · Added {fmtDate(p.created_at?.split("T")[0])}</div>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{background:p.status==="active"?"#F0FDF4":"#FEF2F2",color:p.status==="active"?"#16A34A":"#DC2626",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{p.status==="active"?"Active":"Removed"}</span>
                    <span style={{fontSize:12,color:"#2563EB",fontWeight:600}}>View details →</span>
                  </div>
                </div>
                {updates[0]&&<div style={{fontSize:12,color:"#475569",background:"#EFF6FF",padding:"6px 10px",borderRadius:6}}>Latest: {updates[0].update_text}</div>}
              </Card>;
            })}
          </div>
        </div>}
        {selectedPipeline&&<div>
          <button onClick={()=>setSelectedPipeline(null)} style={{background:"none",border:"none",color:"#2563EB",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:16,padding:0}}>← Back to pipeline</button>
          <Card style={{padding:24}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
              <div>
                <div style={{fontSize:20,fontWeight:800}}>{selectedPipeline.interview_with}</div>
                <div style={{fontSize:13,color:"#94A3B8"}}>{selectedPipeline.round} · Added {fmtDate(selectedPipeline.created_at?.split("T")[0])}</div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <span style={{background:{["1_week"]:"#FFFBEB","2_weeks":"#EFF6FF","not_sure":"#F1F5F9"}[selectedPipeline.expecting]||"#F1F5F9",color:{["1_week"]:"#D97706","2_weeks":"#2563EB","not_sure":"#475569"}[selectedPipeline.expecting]||"#475569",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{{"1_week":"In 1 week","2_weeks":"In 2 weeks","not_sure":"Not sure"}[selectedPipeline.expecting]||selectedPipeline.expecting}</span>
                <span style={{background:selectedPipeline.status==="active"?"#F0FDF4":"#FEF2F2",color:selectedPipeline.status==="active"?"#16A34A":"#DC2626",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:700}}>{selectedPipeline.status==="active"?"Active":"Removed"}</span>
              </div>
            </div>
            {selectedPipeline.delete_reason&&<div style={{background:"#FEF2F2",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#DC2626"}}>Removal reason: {selectedPipeline.delete_reason}</div>}
            <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:12}}>Update History:</div>
            <div style={{position:"relative"}}>
              <div style={{position:"absolute",left:10,top:0,bottom:0,width:2,background:"#E2E8F0"}}/>
              {pipelineUpdates.filter(u=>u.pipeline_id===selectedPipeline.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).map((u,i)=><div key={u.id} style={{display:"flex",gap:14,marginBottom:12,position:"relative"}}>
                <div style={{width:22,height:22,borderRadius:"50%",background:i===0?"#2563EB":"#E2E8F0",border:`2px solid ${i===0?"#2563EB":"#E2E8F0"}`,flexShrink:0,zIndex:1}}/>
                <div style={{flex:1,background:i===0?"#EFF6FF":"#F8FAFC",borderRadius:8,padding:"10px 14px"}}>
                  <div style={{fontSize:13,color:"#334155",lineHeight:1.6}}>{u.update_text}</div>
                  <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>{fmtDateTime(u.created_at)}</div>
                </div>
              </div>)}
              {pipelineUpdates.filter(u=>u.pipeline_id===selectedPipeline.id).length===0&&<div style={{paddingLeft:30,fontSize:13,color:"#94A3B8"}}>No updates yet.</div>}
            </div>
          </Card>
        </div>}
      </div>}

      {/* SCREENING CALLS TAB */}
      {activeTab==="screening"&&<div>
        {candScreeningCalls.length===0&&<div style={{textAlign:"center",padding:60,color:"#94A3B8",fontSize:14}}>No screening calls for this period.</div>}
        <div style={{display:"grid",gap:12}}>
          {candScreeningCalls.map(sc=><Card key={sc.id} style={{padding:18}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
              <div>
                <div style={{fontSize:15,fontWeight:700}}>{sc.with_whom||"—"}</div>
                <div style={{fontSize:12,color:"#94A3B8"}}>{sc.company_name} · {fmtDate(sc.call_date)}</div>
              </div>
              <span style={{background:{positive:"#F0FDF4",negative:"#FEF2F2",pending:"#FFFBEB",no_show:"#F1F5F9"}[sc.outcome]||"#F1F5F9",color:{positive:"#16A34A",negative:"#DC2626",pending:"#D97706",no_show:"#475569"}[sc.outcome]||"#475569",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{sc.outcome==="positive"?" Positive":sc.outcome==="negative"?" Negative":sc.outcome==="pending"?" Pending":sc.outcome==="no_show"?" No Show":"—"}</span>
            </div>
            {sc.company_details&&<div style={{fontSize:12,color:"#475569",background:"#F8FAFC",padding:"8px 12px",borderRadius:8,marginBottom:8}}>Company: {sc.company_details}</div>}
            {sc.feedback&&<div style={{fontSize:13,color:"#334155",background:"#F0FDFA",border:"1px solid #99F6E4",padding:"10px 14px",borderRadius:8}}>
              <div style={{fontSize:11,fontWeight:700,color:"#0F766E",marginBottom:4}}>Feedback:</div>
              {sc.feedback}
            </div>}
          </Card>)}
        </div>
      </div>}

      {/*  MANAGER SECTION */}
      {(user.role==="manager"||user.role==="president"||rc.canViewAll)&&activeTab==="manager"&&<Card style={{marginBottom:12,border:"1px solid #99F6E4"}}>
        <div style={{padding:"14px 18px",borderBottom:"1px solid #99F6E4",background:"#F0FDFA",borderRadius:"10px 10px 0 0"}}>
          <div style={{fontWeight:700,fontSize:14,color:"#0F766E"}}>Manager Feedback</div>
        </div>
        <div style={{padding:"0 0 8px"}}>
          {/* Existing feedbacks */}
          {[...mgrLogs,...candStatusNotes].length===0&&<div style={{padding:"14px 16px",fontSize:13,color:"#94A3B8"}}>No manager feedback for this period.</div>}
          {mgrLogs.map(l=><div key={l.id} style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:8}}>{getMember(l.user_id)?.name} · {fmtDate(l.log_date)}</div>
            {(l.feedback_to_team||l.manager_feedback)&&<div style={{background:"#F0FDFA",borderRadius:8,padding:"10px 12px",marginBottom:8,fontSize:13}}> {l.feedback_to_team||l.manager_feedback}</div>}
            {user.role==="president"&&l.feedback_to_president&&<div style={{background:"#F5F3FF",borderRadius:8,padding:"10px 12px",fontSize:13}}>Confidential: {l.feedback_to_president}</div>}
          </div>)}
          {candStatusNotes.map(n=><div key={n.id} style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9"}}>
            <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:8}}>{getMember(n.manager_id)?.name} · Status Meeting Note · {fmtDate(n.created_at?.split("T")[0])}</div>
            {n.public_feedback&&<div style={{background:"#F0FDFA",borderRadius:8,padding:"10px 12px",marginBottom:8,fontSize:13}}> {n.public_feedback}</div>}
            {user.role==="president"&&n.confidential_note&&<div style={{background:"#F5F3FF",borderRadius:8,padding:"10px 12px",fontSize:13}}>Confidential: {n.confidential_note}</div>}
          </div>)}
          {/* Manager add feedback */}
          {(user.role==="manager")&&<div style={{padding:"14px 16px",background:"#FAFAFA",borderTop:"1px solid #E2E8F0"}}>
            <div style={{fontSize:13,fontWeight:700,color:"#0F766E",marginBottom:10}}>+ Add Status Meeting Feedback</div>
            <div style={{marginBottom:10}}>
              <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:5}}>Public Feedback <span style={{fontSize:10,color:"#94A3B8"}}>(visible to all)</span></label>
              <textarea value={form.public_feedback||""} onChange={e=>set("public_feedback",e.target.value)} placeholder="Write public feedback for this period..." style={{width:"100%",border:"1px solid #99F6E4",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box",background:"#fff"}} rows={3}/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:5}}> Confidential Note <span style={{fontSize:10,color:"#7C3AED"}}>(President only)</span></label>
              <textarea value={form.confidential_note||""} onChange={e=>set("confidential_note",e.target.value)} placeholder="Confidential note for President only..." style={{width:"100%",border:"1px solid #DDD6FE",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box",background:"#fff"}} rows={2}/>
            </div>
            <Btn onClick={saveManagerNote} disabled={saving}>{saving?"Saving...":"Save Feedback"}</Btn>
          </div>}
        </div>
      </Card>}

      {/*  PRESIDENT PERSONAL NOTES */}
      {user.role==="president"&&<Card style={{marginBottom:12,border:"1px solid #DDD6FE"}}>
        <CardHeader title="My Personal Notes" action={<Btn variant="outline" onClick={()=>set("show_note_input",!form.show_note_input)} style={{fontSize:12,padding:"5px 12px"}}>+ Add Note</Btn>}/>
        {form.show_note_input&&<div style={{padding:"14px 16px",borderBottom:"1px solid #E2E8F0"}}>
          <textarea value={form.pres_note||""} onChange={e=>set("pres_note",e.target.value)} placeholder="Your private note for this candidate..." style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box"}} rows={3}/>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
            <Btn variant="outline" onClick={()=>set("show_note_input",false)}>Cancel</Btn>
            <Btn onClick={async()=>{
              if(!form.pres_note?.trim())return;
              try {
                await sb.post("president_notes",{candidate_id:selCand,period_start:fromDate||null,period_end:toDate||null,note:form.pres_note},token);
                const pn=await sb.get("president_notes","select=*&order=created_at.desc",token);
                if(Array.isArray(pn))setPresNotes(pn);
                set("pres_note","");set("show_note_input",false);
              } catch(e){alert("Error saving note.");}
            }}>Save Note</Btn>
          </div>
        </div>}
        <div style={{padding:"0 0 8px"}}>
          {candPresNotes.length===0&&<div style={{padding:"14px 16px",fontSize:13,color:"#94A3B8"}}>No personal notes yet. Only you can see these.</div>}
          {candPresNotes.map(n=><div key={n.id} style={{padding:"12px 16px",borderBottom:"1px solid #F1F5F9",background:"#FAFAFF"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
              {n.period_start&&<span style={{fontSize:11,color:"#7C3AED",background:"#F5F3FF",padding:"2px 8px",borderRadius:99,fontWeight:600}}>Period: {fmtDate(n.period_start)} → {fmtDate(n.period_end)}</span>}
              <span style={{fontSize:11,color:"#94A3B8"}}>{fmtDateTime(n.created_at)}</span>
            </div>
            <div style={{fontSize:13,color:"#334155"}}>{n.note}</div>
          </div>)}
        </div>
      </Card>}
    </div>}
  </div>;
}

// ─── PROFILE DROPDOWN ────────────────────────────────────────────────────────
function ProfileDropdown({user,rc,onClose,onLogout,token}){
  const [tab,setTab]=useState("profile");
  const [form,setForm]=useState({});
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState(null);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));

  const errors = form.new_pass ? validatePassword(form.new_pass) : [];
  const passValid = errors.length===0 && form.new_pass && form.new_pass===form.confirm_pass;

  const changePassword = async () => {
    if(!form.new_pass?.trim()) return setMsg({t:"error",m:"Enter new password"});
    if(errors.length>0) return setMsg({t:"error",m:errors[0]});
    if(form.new_pass!==form.confirm_pass) return setMsg({t:"error",m:"Passwords do not match"});
    setLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method:"PUT",
        headers:{ apikey:SUPABASE_KEY, Authorization:`Bearer ${token}`, "Content-Type":"application/json" },
        body:JSON.stringify({password:form.new_pass}),
      });
      const data = await res.json();
      if(data.error) { setMsg({t:"error",m:data.error.message}); setLoading(false); return; }
      setMsg({t:"success",m:"Password updated successfully!"});
      setForm({});
    } catch(e) { setMsg({t:"error",m:"Error updating password"}); }
    setLoading(false);
  };

  return <>
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:199}}/>
    <div style={{position:"absolute",right:0,top:"calc(100% + 8px)",background:"#fff",borderRadius:14,width:320,zIndex:200,boxShadow:"0 12px 40px rgba(0,0,0,0.2)",border:"1px solid #E2E8F0",overflow:"hidden"}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0F1F3D 0%,#1E3A6E 100%)",padding:"20px 20px 16px"}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:rc.bg,color:rc.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,marginBottom:10}}>
          {user.name?.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase()}
        </div>
        <div style={{fontSize:16,fontWeight:700,color:"#fff"}}>{user.name}</div>
        <div style={{fontSize:12,color:"#93C5FD",marginTop:2}}>{user.email}</div>
        <div style={{marginTop:6}}><span style={{background:rc.bg,color:rc.color,fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:700}}>{rc.label}</span></div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid #E2E8F0"}}>
        {[{id:"profile",l:" Profile"},{id:"password",l:" Password"}].map(t=>
          <button key={t.id} onClick={()=>{setTab(t.id);setMsg(null);setForm({});}} style={{flex:1,padding:"10px",fontSize:12,fontWeight:600,cursor:"pointer",background:"none",border:"none",borderBottom:`2px solid ${tab===t.id?"#2563EB":"transparent"}`,color:tab===t.id?"#2563EB":"#94A3B8"}}>{t.l}</button>
        )}
      </div>

      <div style={{padding:16}}>
        {tab==="profile"&&<div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Full Name</div>
            <div style={{fontSize:14,fontWeight:600,color:"#0F172A"}}>{user.name}</div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Designation</div>
            <div style={{fontSize:14,fontWeight:600,color:rc.color}}>{rc.label}</div>
          </div>
          <div style={{marginBottom:16}}>
            <div style={{fontSize:11,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:4}}>Email</div>
            <div style={{fontSize:13,color:"#0F172A"}}>{user.email}</div>
          </div>
          <button onClick={onLogout} style={{width:"100%",background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA",borderRadius:8,padding:"9px",fontSize:13,fontWeight:600,cursor:"pointer"}}>Sign out</button>
        </div>}

        {tab==="password"&&<div>
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:5}}>New Password *</label>
            <input type="password" value={form.new_pass||""} onChange={e=>set("new_pass",e.target.value)} placeholder="Enter new password" style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:10}}>
            <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:5}}>Confirm Password *</label>
            <input type="password" value={form.confirm_pass||""} onChange={e=>set("confirm_pass",e.target.value)} placeholder="Re-enter new password" style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
          </div>
          {/* Password rules mini */}
          <div style={{background:"#F8FAFC",borderRadius:8,padding:"10px 12px",marginBottom:12}}>
            {[
              {r:"8+ characters",p:form.new_pass?.length>=8},
              {r:"1 capital letter",p:/[A-Z]/.test(form.new_pass||"")},
              {r:"1 special character",p:/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(form.new_pass||"")},
              {r:"1 number",p:/[0-9]/.test(form.new_pass||"")},
              {r:"No repeated numbers",p:form.new_pass?.length>0&&!/(\d)\1/.test(form.new_pass||"")},
            ].map((r,i)=><div key={i} style={{fontSize:11,color:!form.new_pass?"#94A3B8":r.p?"#16A34A":"#DC2626",marginBottom:2}}>
              {!form.new_pass?"○":r.p?"":""} {r.r}
            </div>)}
          </div>
          {msg&&<div style={{background:msg.t==="success"?"#F0FDF4":"#FEF2F2",border:`1px solid ${msg.t==="success"?"#BBF7D0":"#FECACA"}`,borderRadius:8,padding:"8px 12px",fontSize:12,color:msg.t==="success"?"#16A34A":"#DC2626",marginBottom:10}}>{msg.t==="success"?"":"Note:"} {msg.m}</div>}
          <button onClick={changePassword} disabled={loading||!passValid} style={{width:"100%",background:loading||!passValid?"#94A3B8":"#2563EB",color:"#fff",border:"none",borderRadius:8,padding:"9px",fontSize:13,fontWeight:600,cursor:loading||!passValid?"not-allowed":"pointer"}}>
            {loading?"Updating...":"Update Password"}
          </button>
        </div>}
      </div>
    </div>
  </>;
}

// ─── PRESIDENT DAILY VIEW ────────────────────────────────────────────────────
function PresidentDailyView({logs,members,candidates,token,user}){
  const [selDate,setSelDate]=useState(new Date().toISOString().split('T')[0]);
  const [selRole,setSelRole]=useState("recruiter");
  const [selMember,setSelMember]=useState("");
  const [presNote,setPresNote]=useState("");
  const [savedNotes,setSavedNotes]=useState([]);
  const [savingNote,setSavingNote]=useState(false);
  const [showNoteInput,setShowNoteInput]=useState(false);

  useEffect(()=>{
    if(!token)return;
    sb.get("president_notes",`order=created_at.desc`,token).then(r=>{if(Array.isArray(r))setSavedNotes(r);});
  },[token]);

  const ROLES=[
    {id:"recruiter",label:"Recruiter",color:"#16A34A",bg:"#F0FDF4"},
    {id:"r_lead",label:"R Lead",color:"#2563EB",bg:"#EFF6FF"},
    {id:"c_lead",label:"C Lead",color:"#D97706",bg:"#FFFBEB"},
    {id:"interview_coord",label:"IC",color:"#DC2626",bg:"#FEF2F2"},
    {id:"manager_feedback",label:"Manager",color:"#0F766E",bg:"#F0FDFA"},
  ];

  const roleMembers=members.filter(m=>{
    if(selRole==="manager_feedback") return m.role==="manager";
    return m.role===selRole;
  });

  const memberLogs=logs.filter(l=>{
    if(l.user_id!==selMember)return false;
    if(l.log_date!==selDate)return false;
    // manager role tab uses "manager_feedback" type in logs
    if(selRole==="manager_feedback") return l.type==="manager_feedback";
    return l.type===selRole;
  });

  const getCand=id=>candidates.find(c=>c.id===id);

  const saveNote=async()=>{
    if(!presNote.trim())return;
    setSavingNote(true);
    try {
      await sb.post("president_notes",{
        candidate_id:null,
        period_start:selDate,
        period_end:selDate,
        note:`[${selDate}] ${presNote.trim()}`,
      },token);
      const r=await sb.get("president_notes","order=created_at.desc",token);
      if(Array.isArray(r))setSavedNotes(r);
      setPresNote("");
      setShowNoteInput(false);
    } catch(e){alert("Error saving note");}
    setSavingNote(false);
  };

  const todayNotes=savedNotes.filter(n=>n.period_start===selDate);

  return <div>
    {/* Header */}
    <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>President — Daily Activity View</div>
    <div style={{fontSize:12,color:"#94A3B8",marginBottom:16}}>See what each team member did on any day</div>

    {/* Date picker */}
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Select Date</label>
      <input type="date" value={selDate} onChange={e=>{setSelDate(e.target.value);setSelMember("");}} max={today()} style={{border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:14,outline:"none",background:"#fff"}}/>
    </div>

    {/* Role tabs */}
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
      {ROLES.map(r=><button key={r.id} onClick={()=>{setSelRole(r.id);setSelMember("");}} style={{padding:"6px 14px",borderRadius:99,fontSize:12,fontWeight:600,cursor:"pointer",background:selRole===r.id?r.bg:"#F8FAFC",color:selRole===r.id?r.color:"#94A3B8",border:`1px solid ${selRole===r.id?r.color:"#E2E8F0"}`}}>{r.label}</button>)}
    </div>

    {/* Members list */}
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:8}}>Select Person</label>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {roleMembers.map(m=>{
          const hasLog=logs.some(l=>{
            if(l.user_id!==m.id||l.log_date!==selDate)return false;
            if(selRole==="manager_feedback") return l.type==="manager_feedback";
            return l.type===selRole;
          });
          return <button key={m.id} onClick={()=>setSelMember(m.id)} style={{padding:"8px 14px",borderRadius:10,fontSize:12,fontWeight:600,cursor:"pointer",background:selMember===m.id?"#EFF6FF":"#fff",color:selMember===m.id?"#2563EB":"#475569",border:`1px solid ${selMember===m.id?"#2563EB":"#E2E8F0"}`,display:"flex",alignItems:"center",gap:6}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:hasLog?"#16A34A":"#DC2626",display:"inline-block"}}/>
            {m.name}
            <span style={{fontSize:10,color:hasLog?"#16A34A":"#DC2626"}}>{hasLog?" Submitted":" Pending"}</span>
          </button>;
        })}
        {roleMembers.length===0&&<div style={{fontSize:13,color:"#94A3B8"}}>No {ROLES.find(r=>r.id===selRole)?.label} members found.</div>}
      </div>
    </div>

    {/* Selected member logs */}
    {selMember&&<div style={{marginBottom:16}}>
      <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:10}}>
         {members.find(m=>m.id===selMember)?.name} — {selDate}
      </div>
      {memberLogs.length===0&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:"16px",fontSize:13,color:"#DC2626",textAlign:"center"}}> No log submitted for this date.</div>}
      {memberLogs.map(l=>{
        const cand=getCand(l.candidate_id);
        return <div key={l.id} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <div style={{fontSize:14,fontWeight:700}}>{cand?.name||"—"}</div>
            <div style={{fontSize:11,color:"#94A3B8"}}>{l.log_time}</div>
          </div>

          {/* Recruiter logs */}
          {l.type==="recruiter"&&<>
            <div style={{display:"flex",gap:12,marginBottom:8}}>
              <span style={{background:"#EFF6FF",color:"#2563EB",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>Emails: {l.emails_sent} emails</span>
              <span style={{background:"#F5F3FF",color:"#7C3AED",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>Subs: {l.submissions} submissions</span>
            </div>
            {l.reason_less_emails&&<div style={{fontSize:12,color:"#D97706",background:"#FFFBEB",padding:"6px 10px",borderRadius:6,marginBottom:6}}>Low emails: {l.reason_less_emails}</div>}
            {l.reason_zero_subs&&<div style={{fontSize:12,color:"#DC2626",background:"#FEF2F2",padding:"6px 10px",borderRadius:6,marginBottom:6}}>Zero submissions: {l.reason_zero_subs}</div>}
            {l.issue_description&&<div style={{fontSize:12,color:"#475569",background:"#F1F5F9",padding:"6px 10px",borderRadius:6,marginBottom:6}}>Issue: {l.issue_description} — <strong>{l.issue_status}</strong></div>}
            {l.notes&&<div style={{fontSize:12,color:"#94A3B8"}}>Notes: {l.notes}</div>}
          </>}

          {/* R Lead logs */}
          {l.type==="r_lead"&&<>
            <div style={{marginBottom:6}}>
              <span style={{background:l.vendor_mock_conducted==="yes"?"#F0FDF4":"#FEF2F2",color:l.vendor_mock_conducted==="yes"?"#16A34A":"#DC2626",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{l.vendor_mock_conducted==="yes"?" Mock Conducted":"Not Conducted"}</span>
            </div>
            {l.vendor_mock_feedback&&<div style={{fontSize:12,color:"#475569",background:"#F0FDF4",padding:"8px 10px",borderRadius:6,marginBottom:6}}>Feedback: {l.vendor_mock_feedback}</div>}
            {l.vendor_mock_reason&&<div style={{fontSize:12,color:"#DC2626",background:"#FEF2F2",padding:"6px 10px",borderRadius:6}}>Reason: {l.vendor_mock_reason}</div>}
          </>}

          {/* C Lead logs */}
          {l.type==="c_lead"&&<>
            {l.floor_issues&&<div style={{fontSize:12,color:"#475569",background:"#FFFBEB",padding:"8px 10px",borderRadius:6,marginBottom:6}}>️ {l.floor_issues}</div>}
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {l.resolution_status&&<span style={{background:"#F0FDF4",color:"#16A34A",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{l.resolution_status}</span>}
              {Array.isArray(l.clead_informed_to)&&l.clead_informed_to.map(p=><span key={p} style={{background:"#EFF6FF",color:"#2563EB",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{p}</span>)}
            </div>
          </>}

          {/* IC logs */}
          {l.type==="interview_coord"&&<>
            <div style={{marginBottom:8}}>
              <span style={{background:"#FEF2F2",color:"#DC2626",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{l.session_type} · {l.sessions_done} sessions</span>
            </div>
            {l.feedback&&<div style={{fontSize:12,color:"#475569",background:"#F8FAFC",padding:"8px 10px",borderRadius:6,marginBottom:6}}>{l.feedback}</div>}
            {l.tmr_with_whom&&<div style={{fontSize:12,color:"#2563EB",background:"#EFF6FF",padding:"6px 10px",borderRadius:6}}> Tomorrow: {l.tmr_with_whom} · {l.tmr_time} · {l.tmr_mode}</div>}
          </>}

          {/* Manager logs */}
          {l.type==="manager_feedback"&&<>
            {(l.feedback_to_team||l.manager_feedback)&&<div style={{background:"#F0FDFA",border:"1px solid #99F6E4",borderRadius:8,padding:"10px 12px",marginBottom:8,fontSize:13}}> {l.feedback_to_team||l.manager_feedback}</div>}
            {l.feedback_to_president&&<div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:8,padding:"10px 12px",fontSize:13}}>Confidential: {l.feedback_to_president}</div>}
          </>}
        </div>;
      })}
    </div>}

    {/* PRESIDENT PERSONAL NOTES */}
    <div style={{background:"#F5F3FF",border:"1px solid #DDD6FE",borderRadius:12,padding:"16px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:13,fontWeight:700,color:"#7C3AED"}}>My Personal Notes — {selDate}</div>
        <button onClick={()=>setShowNoteInput(!showNoteInput)} style={{padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:"#7C3AED",color:"#fff",border:"none"}}>+ Add Note</button>
      </div>
      {showNoteInput&&<div style={{marginBottom:12}}>
        <textarea value={presNote} onChange={e=>setPresNote(e.target.value)} placeholder="Write your private note for today..." style={{width:"100%",border:"1px solid #DDD6FE",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box",background:"#fff"}} rows={3}/>
        <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
          <button onClick={()=>{setShowNoteInput(false);setPresNote("");}} style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:"#F1F5F9",color:"#475569",border:"1px solid #E2E8F0"}}>Cancel</button>
          <button onClick={saveNote} disabled={savingNote||!presNote.trim()} style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:"#7C3AED",color:"#fff",border:"none"}}>{savingNote?"Saving...":"Save Note"}</button>
        </div>
      </div>}
      {todayNotes.length===0&&!showNoteInput&&<div style={{fontSize:13,color:"rgba(124,58,237,0.5)"}}>No notes for {selDate}. Only you can see these notes.</div>}
      {todayNotes.map(n=><div key={n.id} style={{background:"#fff",borderRadius:8,padding:"10px 14px",marginBottom:8,border:"1px solid #EDE9FE"}}>
        <div style={{fontSize:13,color:"#334155",lineHeight:1.6}}>{n.note?.replace(`[${selDate}] `,"")}</div>
        <div style={{fontSize:11,color:"#94A3B8",marginTop:4}}>{fmtDateTime(n.created_at)}</div>
      </div>)}
    </div>
  </div>;
}

// ─── RECRUITERS PAGE (Manager/President separate tab) ────────────────────────
function RecruitersPage({user,rc,members,candidates,logs,getMember,loading,token,onRefresh,onAdd}){
  const [showAdd,setShowAdd]=useState(false);
  const [showDeactivate,setShowDeactivate]=useState(null);
  const [deactForm,setDeactForm]=useState({});
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false);
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const setD=(k,v)=>setDeactForm(p=>({...p,[k]:v}));

  const rLeads=members.filter(m=>m.role==="r_lead");
  const recruiters=members.filter(m=>m.role==="recruiter"&&m.is_active!==false);
  const inactiveRecruiters=members.filter(m=>m.role==="recruiter"&&m.is_active===false);

  const submit=()=>{
    if(!form.name?.trim()||!form.email?.trim())return alert("Name and email required");
    if(!form.r_lead_team)return alert("Assign R Lead team");
    onAdd({...form,role:"recruiter"});setForm({});setShowAdd(false);
  };

  const recCands=showDeactivate?candidates.filter(c=>c.recruiter_id===showDeactivate.id&&c.status==="Active"):[];

  const submitDeactivation=async()=>{
    if(!deactForm.end_date)return alert("End date is mandatory");
    for(const c of recCands){
      if(!deactForm[`rec_${c.id}`])return alert(`Please assign new recruiter for ${c.name}`);
      if(!deactForm[`rec_start_${c.id}`])return alert(`Please set start date for ${c.name}`);
    }
    setSaving(true);
    try {
      await sb.patch("team_members",showDeactivate.id,{is_active:false},token);
      await sb.post("member_deactivations",{member_id:showDeactivate.id,end_date:deactForm.end_date,reason:deactForm.reason||""},token);
      for(const c of recCands){
        const yesterday=new Date(deactForm.end_date);yesterday.setDate(yesterday.getDate()-1);
        const yStr=yesterday.toISOString().split("T")[0];
        const curAssign=await sb.get("candidate_assignments",`candidate_id=eq.${c.id}&assignment_type=eq.recruiter&end_date=is.null`,token);
        if(Array.isArray(curAssign)&&curAssign.length>0){
          await sb.patch("candidate_assignments",curAssign[0].id,{end_date:yStr},token);
        }
        await sb.post("candidate_assignments",{candidate_id:c.id,assignment_type:"recruiter",member_id:deactForm[`rec_${c.id}`],start_date:deactForm[`rec_start_${c.id}`]},token);
        const updateData={recruiter_id:deactForm[`rec_${c.id}`]};
        if(deactForm[`rlead_${c.id}`]&&deactForm[`rlead_${c.id}`]!=="same") updateData.r_lead_id=deactForm[`rlead_${c.id}`];
        if(deactForm[`clead_${c.id}`]&&deactForm[`clead_${c.id}`]!=="same") updateData.c_lead_id=deactForm[`clead_${c.id}`];
        if(deactForm[`ic_${c.id}`]&&deactForm[`ic_${c.id}`]!=="same") updateData.interview_coord_id=deactForm[`ic_${c.id}`];
        await sb.patch("candidates",c.id,updateData,token);
      }
      setShowDeactivate(null);setDeactForm({});
      if(onRefresh)onRefresh();
      alert("Recruiter deactivated and candidates reassigned!");
    } catch(e){alert("Error: "+e.message);}
    setSaving(false);
  };

  return <div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
      <div>
        <div style={{fontSize:20,fontWeight:700,marginBottom:2}}>Recruiters</div>
        <div style={{fontSize:13,color:"#94A3B8"}}>{recruiters.length} active · {inactiveRecruiters.length} inactive</div>
      </div>
      <Btn onClick={()=>setShowAdd(true)}>+ Add Recruiter</Btn>
    </div>

    {recruiters.length===0&&<div style={{textAlign:"center",padding:60,color:"#94A3B8",fontSize:14}}>No recruiters yet. Click '+ Add Recruiter' to get started.</div>}

    <div style={{display:"grid",gap:12}}>
      {recruiters.map(r=>{
        const rCands=candidates.filter(c=>c.recruiter_id===r.id);
        const activeCands=rCands.filter(c=>c.status==="Active");
        const placedCands=rCands.filter(c=>c.status==="Placed");
        const rLead=getMember(r.r_lead_team);
        const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
        const wLogs=logs.filter(l=>l.user_id===r.id&&l.type==="recruiter"&&new Date(l.log_date)>=weekAgo);
        const emails=wLogs.reduce((s,l)=>s+(l.emails_sent||0),0);
        const subs=wLogs.reduce((s,l)=>s+(l.submissions||0),0);
        const todayLog=logs.some(l=>l.user_id===r.id&&l.log_date===today()&&l.type==="recruiter");

        return <Card key={r.id} style={{padding:18}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <Av name={r.name} role="recruiter" size={48}/>
              <div>
                <div style={{fontSize:16,fontWeight:700}}>{r.name}</div>
                <div style={{fontSize:12,color:"#94A3B8"}}>{r.email}</div>
                {rLead&&<div style={{fontSize:11,color:"#2563EB",marginTop:2,fontWeight:600}}>Team: {rLead.name}</div>}
                <div style={{marginTop:4}}>
                  <span style={{background:todayLog?"#F0FDF4":"#FEF2F2",color:todayLog?"#16A34A":"#DC2626",fontSize:11,padding:"2px 8px",borderRadius:99,fontWeight:600}}>{todayLog?"Log submitted today":"No log today"}</span>
                </div>
              </div>
            </div>
            <button onClick={()=>{setShowDeactivate(r);setDeactForm({});}} style={{padding:"5px 12px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:"#FEF2F2",color:"#DC2626",border:"1px solid #FECACA"}}>End Association</button>
          </div>

          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8,marginBottom:12}}>
            <div style={{background:"#EFF6FF",borderRadius:8,padding:"10px",textAlign:"center"}}><div style={{fontSize:10,color:"#2563EB",fontWeight:600,marginBottom:2}}>ACTIVE</div><div style={{fontSize:20,fontWeight:800,color:"#2563EB"}}>{activeCands.length}</div></div>
            <div style={{background:"#F5F3FF",borderRadius:8,padding:"10px",textAlign:"center"}}><div style={{fontSize:10,color:"#7C3AED",fontWeight:600,marginBottom:2}}>PLACED</div><div style={{fontSize:20,fontWeight:800,color:"#7C3AED"}}>{placedCands.length}</div></div>
            <div style={{background:"#F8FAFC",borderRadius:8,padding:"10px",textAlign:"center"}}><div style={{fontSize:10,color:"#94A3B8",fontWeight:600,marginBottom:2}}>LOGS/WK</div><div style={{fontSize:20,fontWeight:800,color:"#475569"}}>{wLogs.length}</div></div>
            <div style={{background:"#F0FDFA",borderRadius:8,padding:"10px",textAlign:"center"}}><div style={{fontSize:10,color:"#0F766E",fontWeight:600,marginBottom:2}}>EMAILS/WK</div><div style={{fontSize:20,fontWeight:800,color:"#0F766E"}}>{emails}</div></div>
            <div style={{background:"#FFFBEB",borderRadius:8,padding:"10px",textAlign:"center"}}><div style={{fontSize:10,color:"#D97706",fontWeight:600,marginBottom:2}}>SUBS/WK</div><div style={{fontSize:20,fontWeight:800,color:"#D97706"}}>{subs}</div></div>
          </div>

          <div style={{fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>Assigned Candidates:</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {rCands.map(c=><span key={c.id} style={{background:c.status==="Placed"?"#F5F3FF":c.status==="Dropped"?"#FEF2F2":"#EFF6FF",color:c.status==="Placed"?"#7C3AED":c.status==="Dropped"?"#DC2626":"#2563EB",fontSize:12,padding:"3px 10px",borderRadius:6,fontWeight:500}}>{c.status==="Placed"?" ":c.status==="Dropped"?" ":""}{c.name}</span>)}
            {rCands.length===0&&<span style={{fontSize:12,color:"#94A3B8"}}>No candidates assigned yet.</span>}
          </div>
        </Card>;
      })}
    </div>

    {/* Inactive Recruiters */}
    {inactiveRecruiters.length>0&&<div style={{marginTop:24}}>
      <div style={{fontSize:13,fontWeight:600,color:"#94A3B8",marginBottom:10}}>Inactive Recruiters ({inactiveRecruiters.length})</div>
      <div style={{display:"grid",gap:8}}>
        {inactiveRecruiters.map(r=><div key={r.id} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:8,padding:"12px 16px",display:"flex",alignItems:"center",gap:12,opacity:0.7}}>
          <Av name={r.name} role="recruiter" size={36}/>
          <div><div style={{fontSize:13,fontWeight:600,color:"#475569"}}>{r.name}</div><div style={{fontSize:11,color:"#94A3B8"}}>{r.email} · Inactive</div></div>
        </div>)}
      </div>
    </div>}

    {/* Add Recruiter Modal */}
    <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add New Recruiter">
      <div style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#2563EB",marginBottom:16}}> Login credentials auto-created. Default password: <strong>VARS@2026</strong></div>
      <Input label="Full name *" value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="e.g. John Smith"/>
      <Input label="Work email *" type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} placeholder="john@varsconsultinginc.com"/>
      <Select label="Assign to R Lead team *" value={form.r_lead_team||""} onChange={e=>set("r_lead_team",e.target.value)}>
        <option value="">-- Select R Lead --</option>
        {rLeads.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
      </Select>
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn>
        <Btn onClick={submit} disabled={loading}>{loading?"Adding...":"Add Recruiter"}</Btn>
      </div>
    </Modal>

    {/* Deactivation Modal */}
    <Modal open={!!showDeactivate} onClose={()=>setShowDeactivate(null)} title={`End Association — ${showDeactivate?.name}`}>
      <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#DC2626",marginBottom:16}}>
        Note: This will deactivate {showDeactivate?.name} and reassign all their candidates.
      </div>
      <Input label="Last working date *" type="date" value={deactForm.end_date||""} onChange={e=>setD("end_date",e.target.value)}/>
      <div style={{marginBottom:12}}>
        <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:5}}>Reason (optional)</label>
        <input value={deactForm.reason||""} onChange={e=>setD("reason",e.target.value)} placeholder="Reason..." style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
      </div>
      {recCands.length>0&&<>
        <div style={{fontSize:13,fontWeight:700,color:"#475569",marginBottom:10}}>Reassign {recCands.length} active candidate(s):</div>
        {recCands.map(c=><div key={c.id} style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:10,padding:"12px 14px",marginBottom:10}}>
          <div style={{fontSize:13,fontWeight:700,marginBottom:8}}>{c.name} · {c.tech}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4}}>New Recruiter *</label>
              <select value={deactForm[`rec_${c.id}`]||""} onChange={e=>setD(`rec_${c.id}`,e.target.value)} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:6,padding:"6px 10px",fontSize:12,outline:"none"}}>
                <option value="">-- Select --</option>
                {members.filter(m=>m.role==="recruiter"&&m.id!==showDeactivate?.id&&m.is_active!==false).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4}}>Start Date *</label>
              <input type="date" value={deactForm[`rec_start_${c.id}`]||""} onChange={e=>setD(`rec_start_${c.id}`,e.target.value)} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:6,padding:"6px 10px",fontSize:12,outline:"none"}}/>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4}}>R Lead</label>
              <select value={deactForm[`rlead_${c.id}`]||"same"} onChange={e=>setD(`rlead_${c.id}`,e.target.value)} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:6,padding:"6px 10px",fontSize:12,outline:"none"}}>
                <option value="same">Same ({getMember(c.r_lead_id)?.name||"?"})</option>
                {members.filter(m=>m.role==="r_lead").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{display:"block",fontSize:11,fontWeight:600,color:"#475569",marginBottom:4}}>C Lead</label>
              <select value={deactForm[`clead_${c.id}`]||"same"} onChange={e=>setD(`clead_${c.id}`,e.target.value)} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:6,padding:"6px 10px",fontSize:12,outline:"none"}}>
                <option value="same">Same ({getMember(c.c_lead_id)?.name||"?"})</option>
                {members.filter(m=>m.role==="c_lead").map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
        </div>)}
      </>}
      {recCands.length===0&&<div style={{background:"#F0FDF4",border:"1px solid #BBF7D0",borderRadius:8,padding:"10px 14px",fontSize:13,color:"#16A34A",marginBottom:12}}> No active candidates to reassign.</div>}
      <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
        <Btn variant="outline" onClick={()=>setShowDeactivate(null)}>Cancel</Btn>
        <Btn variant="danger" onClick={submitDeactivation} disabled={saving}>{saving?"Processing...":"Confirm End Association"}</Btn>
      </div>
    </Modal>
  </div>;
}

// ─── INTERVIEW DETAIL VIEW ────────────────────────────────────────────────────
function InterviewDetailView({interview,user,token,onBack,onUpdate}){
  const [feedbackReceived,setFeedbackReceived]=useState(interview.feedback_received||false);
  const [feedbackFrom,setFeedbackFrom]=useState(interview.feedback_from||"");
  const [feedbackOutcome,setFeedbackOutcome]=useState(interview.feedback_outcome||"");
  const [feedbackReason,setFeedbackReason]=useState(interview.feedback_reason||"");
  const [nextSteps,setNextSteps]=useState(interview.next_steps||"");
  const [officialFeedback,setOfficialFeedback]=useState(interview.official_feedback||"");
  const [expectedDate,setExpectedDate]=useState(interview.feedback_expected_date||"");
  const [saving,setSaving]=useState(false);
  const [editMode,setEditMode]=useState(!interview.feedback_received&&!interview.feedback_expected_date);

  const isLocked=interview.feedback_locked;
  const canEdit=user.role==="manager"||user.role==="president";
  const ROUNDS={round_1:"Round 1",round_2:"Round 2",round_3:"Round 3",round_4:"Round 4",round_5:"Round 5",round_6:"Round 6",final:"Final"};
  const DURATIONS={less_30:"<30 min","30_min":"30 min","45_min":"45 min","1_hour":"1 Hour","1_30_hour":"1.5 Hours","2_hours":"2 Hours","3_hours":"3 Hours"};

  const statusColor=interview.feedback_received&&interview.feedback_outcome==="positive"?"#16A34A":
    interview.feedback_received&&interview.feedback_outcome==="rejected"?"#DC2626":"#D97706";
  const statusBg=interview.feedback_received&&interview.feedback_outcome==="positive"?"#F0FDF4":
    interview.feedback_received&&interview.feedback_outcome==="rejected"?"#FEF2F2":"#FFFBEB";
  const statusBorder=interview.feedback_received&&interview.feedback_outcome==="positive"?"#BBF7D0":
    interview.feedback_received&&interview.feedback_outcome==="rejected"?"#FECACA":"#FDE68A";

  const saveFeedback=async()=>{
    if(feedbackReceived){
      if(!feedbackFrom)return alert("Select who feedback is from");
      if(!feedbackOutcome)return alert("Select outcome — Positive or Rejected");
      if(feedbackOutcome==="rejected"&&!feedbackReason.trim())return alert("Rejection reason is mandatory");
      if(feedbackOutcome==="positive"&&!nextSteps.trim())return alert("Next steps are mandatory");
    } else {
      if(!expectedDate)return alert("Expected date is mandatory");
    }
    setSaving(true);
    try {
      const data={
        feedback_received:feedbackReceived,
        feedback_from:feedbackFrom||null,
        feedback_outcome:feedbackOutcome||null,
        feedback_reason:feedbackReason||null,
        next_steps:nextSteps||null,
        official_feedback:officialFeedback||null,
        feedback_expected_date:expectedDate||null,
        feedback_locked:feedbackReceived?true:false,
      };
      await onUpdate(data);
      setEditMode(false);
    } catch(e){alert("Error saving.");}
    setSaving(false);
  };

  const fbColor=interview.overall_feedback==="went_well"?"#16A34A":interview.overall_feedback==="okay"?"#D97706":"#DC2626";
  const fbBg=interview.overall_feedback==="went_well"?"#F0FDF4":interview.overall_feedback==="okay"?"#FFFBEB":"#FEF2F2";

  return <div>
    <button onClick={onBack} style={{background:"none",border:"none",color:"#2563EB",cursor:"pointer",fontSize:13,fontWeight:600,marginBottom:16,padding:0}}>← Back to interviews</button>

    {/* STATUS BANNER */}
    <div style={{background:statusBg,border:`1px solid ${statusBorder}`,borderRadius:12,padding:"16px 20px",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:14,fontWeight:700,color:statusColor,marginBottom:4}}>
            {interview.feedback_received
              ? interview.feedback_outcome==="positive"
                ? `Positive feedback received from ${interview.feedback_from||"—"}`
                : `Rejected by ${interview.feedback_from||"—"}`
              : `Waiting for feedback${interview.feedback_expected_date?` · Expected by ${fmtDate(interview.feedback_expected_date)}`:""}`}
          </div>
          {interview.feedback_received&&interview.feedback_outcome==="rejected"&&interview.feedback_reason&&
            <div style={{fontSize:12,color:"#DC2626",marginTop:2}}>Reason: {interview.feedback_reason}</div>}
          {interview.feedback_received&&interview.feedback_outcome==="positive"&&interview.next_steps&&
            <div style={{fontSize:12,color:"#16A34A",marginTop:2}}>Next steps: {interview.next_steps}</div>}
        </div>
        <div>
          {isLocked&&!editMode&&canEdit&&<button onClick={()=>setEditMode(true)} style={{background:"none",border:"1px solid #E2E8F0",borderRadius:8,padding:"5px 12px",color:"#2563EB",cursor:"pointer",fontSize:11,fontWeight:600}}>Edit</button>}
          {isLocked&&!editMode&&!canEdit&&<span style={{fontSize:11,color:"#94A3B8",background:"#F1F5F9",padding:"4px 10px",borderRadius:8}}>Contact manager to edit</span>}
          {!isLocked&&!editMode&&<button onClick={()=>setEditMode(true)} style={{background:"#2563EB",color:"#fff",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer"}}>Update feedback</button>}
          {editMode&&<button onClick={()=>{setEditMode(false);}} style={{background:"none",border:"1px solid #E2E8F0",borderRadius:8,padding:"6px 14px",fontSize:12,cursor:"pointer",color:"#475569"}}>Cancel</button>}
        </div>
      </div>
    </div>

    {/* FEEDBACK FORM */}
    {editMode&&<Card style={{padding:20,marginBottom:16,border:"2px solid #2563EB"}}>
      <div style={{fontSize:14,fontWeight:700,marginBottom:16}}>Update Feedback Status</div>

      {/* Received? */}
      <div style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:8}}>Feedback received?</label>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setFeedbackReceived(true)} style={{padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",background:feedbackReceived?"#F0FDF4":"#fff",color:feedbackReceived?"#16A34A":"#94A3B8",border:`2px solid ${feedbackReceived?"#16A34A":"#E2E8F0"}`}}>Yes — Received</button>
          <button onClick={()=>setFeedbackReceived(false)} style={{padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",background:!feedbackReceived?"#FFFBEB":"#fff",color:!feedbackReceived?"#D97706":"#94A3B8",border:`2px solid ${!feedbackReceived?"#D97706":"#E2E8F0"}`}}>No — Still Waiting</button>
        </div>
      </div>

      {/* If received */}
      {feedbackReceived&&<>
        {/* From whom */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:8}}>Feedback from *</label>
          <div style={{display:"flex",gap:8}}>
            {["End Client","Prime Vendor","Vendor"].map(f=><button key={f} onClick={()=>setFeedbackFrom(f)} style={{padding:"6px 14px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",background:feedbackFrom===f?"#EFF6FF":"#fff",color:feedbackFrom===f?"#2563EB":"#94A3B8",border:`1px solid ${feedbackFrom===f?"#2563EB":"#E2E8F0"}`}}>{f}</button>)}
          </div>
        </div>

        {/* Outcome */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:8}}>Outcome *</label>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setFeedbackOutcome("positive")} style={{padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",background:feedbackOutcome==="positive"?"#F0FDF4":"#fff",color:feedbackOutcome==="positive"?"#16A34A":"#94A3B8",border:`2px solid ${feedbackOutcome==="positive"?"#16A34A":"#E2E8F0"}`}}>Positive</button>
            <button onClick={()=>setFeedbackOutcome("rejected")} style={{padding:"8px 20px",borderRadius:8,fontSize:13,fontWeight:600,cursor:"pointer",background:feedbackOutcome==="rejected"?"#FEF2F2":"#fff",color:feedbackOutcome==="rejected"?"#DC2626":"#94A3B8",border:`2px solid ${feedbackOutcome==="rejected"?"#DC2626":"#E2E8F0"}`}}>Rejected</button>
          </div>
        </div>

        {/* If rejected - reason */}
        {feedbackOutcome==="rejected"&&<div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#DC2626",marginBottom:6}}>Reason for rejection *</label>
          <textarea value={feedbackReason} onChange={e=>setFeedbackReason(e.target.value)} placeholder="Why was the candidate rejected?" rows={3} style={{width:"100%",border:"2px solid #FECACA",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
        </div>}

        {/* If positive - next steps */}
        {feedbackOutcome==="positive"&&<div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:600,color:"#16A34A",marginBottom:6}}>Next steps *</label>
          <textarea value={nextSteps} onChange={e=>setNextSteps(e.target.value)} placeholder="What are the next steps? (e.g. BGV initiated, offer letter, onboarding date...)" rows={3} style={{width:"100%",border:"2px solid #BBF7D0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
        </div>}

        {/* Optional additional feedback */}
        <div style={{marginBottom:14}}>
          <label style={{display:"block",fontSize:12,fontWeight:500,color:"#475569",marginBottom:6}}>Additional notes (optional)</label>
          <textarea value={officialFeedback} onChange={e=>setOfficialFeedback(e.target.value)} placeholder="Any additional notes from the client/vendor..." rows={2} style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
        </div>

        <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#DC2626",marginBottom:14}}>
          Once saved, this entry will be locked. Contact manager to edit.
        </div>
      </>}

      {/* If waiting */}
      {!feedbackReceived&&<div style={{marginBottom:14}}>
        <label style={{display:"block",fontSize:12,fontWeight:600,color:"#475569",marginBottom:6}}>When can we expect feedback? *</label>
        <input type="date" value={expectedDate} onChange={e=>setExpectedDate(e.target.value)} style={{border:"1px solid #E2E8F0",borderRadius:8,padding:"8px 12px",fontSize:13,outline:"none"}}/>
      </div>}

      <button onClick={saveFeedback} disabled={saving} style={{background:saving?"#94A3B8":feedbackReceived&&feedbackOutcome==="positive"?"#16A34A":feedbackReceived&&feedbackOutcome==="rejected"?"#DC2626":"#2563EB",color:"#fff",border:"none",borderRadius:8,padding:"10px 20px",fontSize:13,fontWeight:600,cursor:saving?"not-allowed":"pointer"}}>
        {saving?"Saving...":feedbackReceived?"Save Feedback":"Save — Still Waiting"}
      </button>
    </Card>}

    {/* INTERVIEW DETAILS */}
    <Card style={{padding:20}}>
      <div style={{fontSize:14,fontWeight:700,color:"#475569",marginBottom:16,borderBottom:"1px solid #E2E8F0",paddingBottom:10}}>Interview Details</div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
        <div>
          <div style={{fontSize:18,fontWeight:800}}>{ROUNDS[interview.round]||interview.round}</div>
          {interview.with_whom&&<div style={{fontSize:13,color:"#2563EB",fontWeight:700,marginTop:4}}>{interview.with_whom}</div>}
          <div style={{fontSize:12,color:"#94A3B8",marginTop:2}}>{fmtDate(interview.interview_date)}</div>
        </div>
        <span style={{background:fbBg,color:fbColor,fontSize:13,padding:"6px 16px",borderRadius:99,fontWeight:700,height:"fit-content"}}>{interview.overall_feedback==="went_well"?"Went Well":interview.overall_feedback==="okay"?"Okay":"Not Went Well"}</span>
      </div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <span style={{background:"#F5F3FF",color:"#7C3AED",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{DURATIONS[interview.duration]||interview.duration}</span>
        <span style={{background:"#EFF6FF",color:"#2563EB",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{interview.interview_mode==="virtual"?"Virtual":"In-person"}</span>
        {interview.tech_support_name&&<span style={{background:"#F0FDF4",color:"#16A34A",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>Support: {interview.tech_support_name}</span>}
        {interview.support_mode&&<span style={{background:"#FFFBEB",color:"#D97706",fontSize:12,padding:"3px 10px",borderRadius:99,fontWeight:600}}>{interview.support_mode}</span>}
      </div>
      <div style={{background:"#F8FAFC",borderRadius:10,padding:16,marginBottom:14}}>
        <div style={{fontSize:12,fontWeight:700,color:"#475569",marginBottom:8}}>Interview Feedback (Internal):</div>
        <div style={{fontSize:13,color:"#334155",lineHeight:1.8}}>{interview.detailed_feedback}</div>
      </div>
      {interview.feedback_received&&<div style={{background:interview.feedback_outcome==="positive"?"#F0FDF4":"#FEF2F2",border:`1px solid ${interview.feedback_outcome==="positive"?"#BBF7D0":"#FECACA"}`,borderRadius:10,padding:16}}>
        <div style={{fontSize:12,fontWeight:700,color:interview.feedback_outcome==="positive"?"#16A34A":"#DC2626",marginBottom:8}}>
          Official Outcome from {interview.feedback_from}: {interview.feedback_outcome==="positive"?"POSITIVE":"REJECTED"}
        </div>
        {interview.feedback_reason&&<div style={{fontSize:13,color:"#334155",marginBottom:8}}><strong>Reason:</strong> {interview.feedback_reason}</div>}
        {interview.next_steps&&<div style={{fontSize:13,color:"#334155",marginBottom:8}}><strong>Next steps:</strong> {interview.next_steps}</div>}
        {interview.official_feedback&&<div style={{fontSize:13,color:"#334155"}}><strong>Notes:</strong> {interview.official_feedback}</div>}
      </div>}
    </Card>
  </div>;
}
