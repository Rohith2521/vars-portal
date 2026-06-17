import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://eiqwtejpouhzqlaoztce.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpcXd0ZWpwb3VoenFsYW96dGNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDk4NTksImV4cCI6MjA5NzI4NTg1OX0.LOUdW2gAngUFlfsM-1A1dx5d2z4CH4Nkg07PU6suE7k";

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
  r_lead:          { label: "R Lead",                color: "#2563EB", bg: "#EFF6FF", canAddCandidate: true,  canAddMember: false, canViewAll: true,  isAdmin: false },
  c_lead:          { label: "C Lead",                color: "#D97706", bg: "#FFFBEB", canAddCandidate: false, canAddMember: false, canViewAll: true,  isAdmin: false },
  recruiter:       { label: "Recruiter",             color: "#059669", bg: "#F0FDF4", canAddCandidate: false, canAddMember: false, canViewAll: false, isAdmin: false },
  interview_coord: { label: "Interview Coordinator", color: "#DC2626", bg: "#FEF2F2", canAddCandidate: false, canAddMember: false, canViewAll: false, isAdmin: false },
};

const ENTRY_TYPES = {
  screening_call:    { label: "Screening Call",      icon: "📞", color: "#2563EB" },
  interview_round1:  { label: "Interview Round 1",   icon: "🎯", color: "#7C3AED" },
  interview_round2:  { label: "Interview Round 2",   icon: "🎯", color: "#7C3AED" },
  interview_round3:  { label: "Interview Round 3",   icon: "🎯", color: "#7C3AED" },
  vendor_mock:       { label: "Vendor Mock",         icon: "🏢", color: "#D97706" },
  interview_mock:    { label: "Interview Mock",      icon: "🎤", color: "#DC2626" },
  pipeline_update:   { label: "Pipeline Update",     icon: "📋", color: "#0F766E" },
  offer:             { label: "Offer",               icon: "🎉", color: "#16A34A" },
  placement:         { label: "Placement",           icon: "✅", color: "#16A34A" },
  dropped:           { label: "Dropped",             icon: "❌", color: "#DC2626" },
};

// ─── UI COMPONENTS ─────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const rc = ROLE_CONFIG[role] || { label: role, color: "#475569", bg: "#F1F5F9" };
  return <span style={{ background: rc.bg, color: rc.color, fontSize: 11, padding: "2px 8px", borderRadius: 99, fontWeight: 600 }}>{rc.label}</span>;
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
  return <div style={{ position:"fixed", bottom:24, right:24, background:type==="error"?"#DC2626":"#16A34A", color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:14, fontWeight:500, zIndex:9999, maxWidth:340 }}>{type==="success"?"✓":"✗"} {msg}</div>;
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
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#0F1F3D 0%,#1E3A6E 100%)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"40px 36px", width:380, boxShadow:"0 24px 64px rgba(0,0,0,0.25)" }}>
        <div style={{ fontSize:26, fontWeight:800, color:"#0F1F3D", marginBottom:2 }}>VARS <span style={{ color:"#2563EB" }}>Portal</span></div>
        <div style={{ fontSize:12, color:"#94A3B8", marginBottom:32 }}>Internal Recruitment Management System</div>
        <Input label="Work Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@varsconsultinginc.com" onKeyDown={e=>e.key==="Enter"&&login()} />
        <div style={{ marginBottom:14 }}>
          <label style={{ display:"block", fontSize:12, fontWeight:500, color:"#475569", marginBottom:5 }}>Password</label>
          <div style={{ position:"relative" }}>
            <input type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Enter your password" style={{ width:"100%", border:"1px solid #E2E8F0", borderRadius:8, padding:"8px 40px 8px 12px", fontSize:14, outline:"none", boxSizing:"border-box" }}/>
            <button onClick={()=>setShow(!show)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#94A3B8", fontSize:12 }}>{show?"Hide":"Show"}</button>
          </div>
        </div>
        {err&&<div style={{ background:"#FEF2F2", border:"1px solid #FECACA", borderRadius:8, padding:"10px 14px", fontSize:13, color:"#DC2626", marginBottom:16 }}>⚠️ {err}</div>}
        <button onClick={login} disabled={loading} style={{ width:"100%", background:loading?"#94A3B8":"#2563EB", color:"#fff", border:"none", borderRadius:10, padding:13, fontSize:15, fontWeight:700, cursor:loading?"not-allowed":"pointer" }}>{loading?"Signing in...":"Sign in →"}</button>
        <div style={{ marginTop:20, padding:"12px 14px", background:"#F8FAFC", borderRadius:8, fontSize:12, color:"#94A3B8" }}>Default password: <strong style={{ color:"#475569" }}>VARS@2026</strong></div>
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
  const [toast,setToast]=useState(null); const [loading,setLoading]=useState(false); const [showN,setShowN]=useState(false);
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
  const unread=notifications.filter(n=>!n.read_by_manager).length;

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
      const authUser=await sb.createUser(data.email,"VARS@2026");
      if(authUser?.error){showToast("Auth error: "+authUser.error.message,"error");setLoading(false);return;}
      const r=await sb.post("team_members",{id:authUser.id,name:data.name,email:data.email,role:data.role,avatar:data.name.split(" ").map(w=>w[0]).join("").substring(0,2).toUpperCase(),r_lead_team:data.r_lead_team||null},user.token);
      if(r?.error){showToast("Error: "+r.error.message,"error");setLoading(false);return;}
      await loadData(); showToast(`${data.name} added! Password: VARS@2026`);
    } catch { showToast("Error adding member.","error"); }
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

  const navItems=[
    {id:"dashboard",icon:"📊",label:"Dashboard",always:true},
    {id:"daily_log",icon:"📝",label:"Daily Log",always:true},
    {id:"candidates",icon:"👤",label:"Candidates",always:true},
    {id:"my_recruiters",icon:"👥",label:"My Recruiters",show:user.role==="r_lead"},
    {id:"logs_history",icon:"📅",label:"Log History",always:true},
    {id:"stats",icon:"📈",label:"Stats & Reports",show:rc.canViewAll},
    {id:"team",icon:"🏢",label:"Team",show:rc.isAdmin||user.role==="r_lead"||user.role==="c_lead"},
    {id:"notifications",icon:"🔔",label:`Alerts${unread>0?` (${unread})`:""}`,show:rc.isAdmin},
  ].filter(n=>n.always||n.show);

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif", background:"#F8FAFC", color:"#0F172A" }}>
      <div style={{ background:"#0F1F3D", display:"flex", alignItems:"center", padding:"0 20px", height:54, gap:12, flexShrink:0 }}>
        <div style={{ fontSize:17, fontWeight:800, color:"#fff" }}>VARS <span style={{ color:"#60A5FA" }}>Portal</span></div>
        <div style={{ flex:1 }}/>
        {rc.isAdmin&&<div style={{ position:"relative" }}>
          <button onClick={()=>setShowN(!showN)} style={{ background:"none", border:"none", color:"#93C5FD", cursor:"pointer", fontSize:18, position:"relative" }}>🔔{unread>0&&<span style={{ position:"absolute", top:-4, right:-4, background:"#DC2626", color:"#fff", fontSize:10, borderRadius:99, padding:"1px 5px" }}>{unread}</span>}</button>
          {showN&&<div style={{ position:"absolute", right:0, top:38, background:"#fff", border:"1px solid #E2E8F0", borderRadius:10, width:320, zIndex:200, boxShadow:"0 8px 30px rgba(0,0,0,0.15)" }}>
            <div style={{ padding:"12px 16px", borderBottom:"1px solid #E2E8F0", fontWeight:600, fontSize:13 }}>Notifications</div>
            {notifications.slice(0,8).map(n=><div key={n.id} style={{ padding:"10px 16px", borderBottom:"1px solid #F1F5F9" }}><div style={{ fontSize:12 }}>{n.message}</div><div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{fmtDateTime(n.created_at)}</div></div>)}
            {notifications.length===0&&<div style={{ padding:20, textAlign:"center", fontSize:13, color:"#94A3B8" }}>No notifications yet.</div>}
          </div>}
        </div>}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}><Av name={user.name} role={user.role} size={30}/><div><div style={{ fontSize:12, fontWeight:600, color:"#fff" }}>{user.name}</div><div style={{ fontSize:10, color:"#93C5FD" }}>{rc.label}</div></div></div>
        <button onClick={logout} style={{ background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)", color:"#fff", borderRadius:6, padding:"4px 10px", fontSize:12, cursor:"pointer" }}>Sign out</button>
      </div>

      <div style={{ display:"flex", flex:1 }}>
        <div style={{ width:190, background:"#fff", borderRight:"1px solid #E2E8F0", padding:"12px 0", flexShrink:0 }}>
          {navItems.map(n=><div key={n.id} onClick={()=>setPage(n.id)} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 18px", fontSize:13, cursor:"pointer", borderLeft:`3px solid ${page===n.id?"#2563EB":"transparent"}`, color:page===n.id?"#2563EB":"#475569", background:page===n.id?"#EFF6FF":"transparent", fontWeight:page===n.id?600:400 }}><span>{n.icon}</span>{n.label}</div>)}
          <div style={{ margin:"16px 12px 0", padding:"10px 12px", background:rc.bg, borderRadius:8 }}>
            <div style={{ fontSize:11, fontWeight:700, color:rc.color }}>{rc.label}</div>
            <div style={{ fontSize:10, color:"#94A3B8", marginTop:2 }}>{rc.canViewAll?"Full view access":"Limited to assigned"}</div>
          </div>
        </div>

        <div style={{ flex:1, padding:22, overflowY:"auto" }}>
          {loading&&<div style={{ position:"fixed", top:60, right:20, background:"#0F1F3D", color:"#fff", padding:"5px 14px", borderRadius:8, fontSize:12, zIndex:500 }}>Syncing...</div>}
          {page==="dashboard"&&<DashPage user={user} rc={rc} candidates={myCands} logs={logs} getMember={getMember} onNav={setPage} onRefresh={()=>loadData()}/>}
          {page==="daily_log"&&<LogPage user={user} rc={rc} candidates={myCands} onSubmit={addLog} loading={loading}/>}
          {page==="candidates"&&<CandPage user={user} rc={rc} candidates={myCands} members={members} onAdd={addCandidate} onAddMember={addMember} logs={logs} getMember={getMember} loading={loading} timeline={timeline} onAddTimeline={addTimeline}/>}
          {page==="my_recruiters"&&<MyRecruitersPage user={user} members={members} candidates={candidates} logs={logs} timeline={timeline} getMember={getMember} onAddTimeline={addTimeline} loading={loading}/>}
          {page==="logs_history"&&<HistPage user={user} rc={rc} candidates={myCands} logs={logs} getMember={getMember} allCands={candidates}/>}
          {page==="stats"&&<StatsPage candidates={candidates} logs={logs} members={members}/>}
          {page==="team"&&<TeamPage user={user} rc={rc} members={members} candidates={candidates} logs={logs} onAddMember={addMember} loading={loading}/>}
          {page==="notifications"&&<NotifsPage notifications={notifications} onRefresh={()=>loadData()}/>}
        </div>
      </div>
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
    </div>
  );
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────────
function DashPage({user,rc,candidates,logs,getMember,onNav,onRefresh}){
  const myLogs=rc.canViewAll?logs:logs.filter(l=>l.user_id===user.id);
  const todayLogs=myLogs.filter(l=>l.log_date===today());
  const weekAgo=new Date();weekAgo.setDate(weekAgo.getDate()-7);
  const wLogs=logs.filter(l=>l.type==="recruiter"&&new Date(l.log_date)>=weekAgo);
  return <div>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4 }}><div style={{ fontSize:20, fontWeight:700 }}>Good day, {user.name}! 👋</div><Btn variant="outline" onClick={onRefresh} style={{ fontSize:12, padding:"5px 12px" }}>↻ Refresh</Btn></div>
    <div style={{ fontSize:13, color:"#94A3B8", marginBottom:20 }}>VARS Portal · {fmtDate(today())}</div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:10, marginBottom:20 }}>
      <StatCard label="My candidates" value={candidates.length} color="#2563EB" sub="assigned to you"/>
      <StatCard label="Today's logs" value={todayLogs.length} color="#7C3AED" sub="submitted today"/>
      {rc.canViewAll&&<StatCard label="Emails this week" value={wLogs.reduce((s,l)=>s+(l.emails_sent||0),0)} color="#0F766E" sub="all recruiters"/>}
      {rc.canViewAll&&<StatCard label="Submissions week" value={wLogs.reduce((s,l)=>s+(l.submissions||0),0)} color="#D97706" sub="all recruiters"/>}
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card><CardHeader title="My Candidates" action={<Btn variant="outline" onClick={()=>onNav("candidates")} style={{ fontSize:12, padding:"5px 10px" }}>View all</Btn>}/>
        {candidates.slice(0,5).map(c=><div key={c.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 16px", borderBottom:"1px solid #F1F5F9" }}><Av name={c.name} role="r_lead" size={34}/><div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{c.name}</div><div style={{ fontSize:11, color:"#94A3B8" }}>{c.tech}</div></div><StatusBadge status={c.status}/></div>)}
        {candidates.length===0&&<div style={{ padding:24, textAlign:"center", fontSize:13, color:"#94A3B8" }}>No candidates assigned yet.</div>}
      </Card>
      <Card><CardHeader title="Recent Logs" action={<Btn variant="outline" onClick={()=>onNav("logs_history")} style={{ fontSize:12, padding:"5px 10px" }}>View all</Btn>}/>
        {myLogs.slice(0,5).map(l=>{const cand=candidates.find(c=>c.id===l.candidate_id);const m=getMember(l.user_id);return<div key={l.id} style={{ padding:"10px 16px", borderBottom:"1px solid #F1F5F9" }}><div style={{ display:"flex", justifyContent:"space-between" }}><div style={{ fontSize:12, fontWeight:600 }}>{m?.name} <span style={{ color:"#94A3B8", fontWeight:400 }}>→ {cand?.name||"?"}</span></div><RoleBadge role={l.type==="manager_feedback"?"manager":l.type}/></div><div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{fmtDate(l.log_date)} · {l.log_time}</div>{l.type==="recruiter"&&<div style={{ fontSize:11, color:"#475569", marginTop:3 }}>📧 {l.emails_sent} emails · 📤 {l.submissions} subs</div>}</div>;})}
        {myLogs.length===0&&<div style={{ padding:24, textAlign:"center", fontSize:13, color:"#94A3B8" }}>No logs yet.</div>}
      </Card>
    </div>
  </div>;
}

// ─── CANDIDATES PAGE (Manager view with tabs) ───────────────────────────────
function CandPage({user,rc,candidates,members,onAdd,onAddMember,logs,getMember,loading,timeline,onAddTimeline}){
  const [tab,setTab]=useState(user.role==="manager"||user.role==="president"?"candidates":"candidates");
  const [selectedCand,setSelectedCand]=useState(null);

  const tabs=[];
  tabs.push({id:"candidates",label:"Candidates"});
  if(user.role==="manager"||user.role==="president") tabs.push({id:"recruiters",label:"Recruiters"});

  return <div>
    <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>
      {selectedCand ? <span style={{ cursor:"pointer", color:"#94A3B8", fontSize:14 }} onClick={()=>setSelectedCand(null)}>← Back</span> : "Candidates & Recruiters"}
    </div>
    {selectedCand ? (
      <CandidateProfile candidate={selectedCand} members={members} logs={logs} timeline={timeline} getMember={getMember} onAddTimeline={onAddTimeline} loading={loading} user={user} onBack={()=>setSelectedCand(null)}/>
    ) : (
      <>
        <Tabs tabs={tabs} active={tab} onChange={setTab}/>
        {tab==="candidates"&&<CandidatesTab candidates={candidates} members={members} onAdd={onAdd} logs={logs} getMember={getMember} loading={loading} rc={rc} onSelectCand={setSelectedCand}/>}
        {tab==="recruiters"&&<RecruitersTab members={members} candidates={candidates} logs={logs} onAddMember={onAddMember} loading={loading} getMember={getMember} onSelectCand={setSelectedCand}/>}
      </>
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
            <div style={{ display:"flex", alignItems:"center", gap:12 }}><Av name={c.name} role="president" size={44}/><div><div style={{ fontSize:16, fontWeight:700 }}>{c.name}</div><div style={{ fontSize:12, color:"#94A3B8" }}>{c.tech} · Added {fmtDate(c.added_on)}</div></div></div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}><StatusBadge status={c.status}/><span style={{ fontSize:11, color:"#94A3B8" }}>👁 View Profile</span></div>
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
function RecruitersTab({members,candidates,logs,onAddMember,loading,getMember,onSelectCand}){
  const [showAdd,setShowAdd]=useState(false); const [form,setForm]=useState({});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const rLeads=members.filter(m=>m.role==="r_lead");
  const recruiters=members.filter(m=>m.role==="recruiter");
  const submit=()=>{
    if(!form.name?.trim()||!form.email?.trim())return alert("Name and email required");
    if(!form.r_lead_team)return alert("Assign R Lead team");
    onAddMember({...form,role:"recruiter"});setForm({});setShowAdd(false);
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
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {rCands.map(c=><span key={c.id} onClick={()=>onSelectCand(c)} style={{ background:"#EFF6FF", color:"#2563EB", fontSize:12, padding:"4px 10px", borderRadius:6, cursor:"pointer", fontWeight:500 }}>{c.name} · {c.tech}</span>)}
            {rCands.length===0&&<span style={{ fontSize:12, color:"#94A3B8" }}>No candidates assigned yet.</span>}
          </div>
        </Card>;
      })}
    </div>
    <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add New Recruiter">
      <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#2563EB", marginBottom:16 }}>🔐 Login credentials auto-created. Default password: <strong>VARS@2026</strong></div>
      <Input label="Full name *" value={form.name||""} onChange={e=>set("name",e.target.value)} placeholder="e.g. John Smith"/>
      <Input label="Work email *" type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} placeholder="john@varsconsultinginc.com"/>
      <Select label="Assign to R Lead team *" value={form.r_lead_team||""} onChange={e=>set("r_lead_team",e.target.value)}><option value="">-- Select R Lead --</option>{rLeads.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select>
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn onClick={submit} disabled={loading}>{loading?"Adding...":"Add Recruiter"}</Btn></div>
    </Modal>
  </div>;
}

// ─── CANDIDATE PROFILE (360° view) ─────────────────────────────────────────
function CandidateProfile({candidate,members,logs,timeline,getMember,onAddTimeline,loading,user,onBack}){
  const [tab,setTab]=useState("overview");
  const [showAdd,setShowAdd]=useState(false); const [form,setForm]=useState({});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const candTimeline=timeline.filter(t=>t.candidate_id===candidate.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const candLogs=logs.filter(l=>l.candidate_id===candidate.id).sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  const canAddTimeline=["r_lead","manager","president","interview_coord","c_lead"].includes(user.role);

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
  ];

  return <div>
    <button onClick={onBack} style={{ background:"none", border:"none", color:"#2563EB", cursor:"pointer", fontSize:13, fontWeight:600, marginBottom:16, padding:0 }}>← Back to candidates</button>
    <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20, padding:"20px", background:"#fff", border:"1px solid #E2E8F0", borderRadius:12 }}>
      <Av name={candidate.name} role="president" size={56}/>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:22, fontWeight:800 }}>{candidate.name}</div>
        <div style={{ fontSize:14, color:"#94A3B8" }}>{candidate.tech} · Added {fmtDate(candidate.added_on)}</div>
        <div style={{ display:"flex", gap:8, marginTop:8, flexWrap:"wrap" }}>
          {[["Recruiter",candidate.recruiter_id,"recruiter"],["R Lead",candidate.r_lead_id,"r_lead"],["C Lead",candidate.c_lead_id,"c_lead"],["IC",candidate.interview_coord_id,"interview_coord"]].map(([lbl,id,role])=>{
            const m=getMember(id);const rc2=ROLE_CONFIG[role];
            return <span key={lbl} style={{ background:rc2.bg, color:rc2.color, fontSize:11, padding:"3px 10px", borderRadius:99, fontWeight:600 }}>{lbl}: {m?.name||"?"}</span>;
          })}
        </div>
      </div>
      <StatusBadge status={candidate.status}/>
    </div>

    <Tabs tabs={tabs} active={tab} onChange={setTab}/>

    {tab==="overview"&&<div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
      <Card style={{ padding:16 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>📋 Latest Pipeline Status</div>
        {candTimeline.filter(t=>t.entry_type==="pipeline_update").slice(0,1).map(t=><div key={t.id} style={{ background:"#F8FAFC", borderRadius:8, padding:12 }}><div style={{ fontSize:13, fontWeight:600 }}>{t.title}</div><div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{t.details}</div><div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>)}
        {candTimeline.filter(t=>t.entry_type==="pipeline_update").length===0&&<div style={{ fontSize:13, color:"#94A3B8" }}>No pipeline updates yet.</div>}
      </Card>
      <Card style={{ padding:16 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>🎯 Latest Interview</div>
        {candTimeline.filter(t=>["interview_round1","interview_round2","interview_round3"].includes(t.entry_type)).slice(0,1).map(t=>{const et=ENTRY_TYPES[t.entry_type];return<div key={t.id} style={{ background:"#F8FAFC", borderRadius:8, padding:12 }}><div style={{ fontSize:13, fontWeight:600 }}>{et.icon} {et.label}</div><div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{t.title}</div>{t.outcome&&<div style={{ marginTop:6 }}><StatusBadge status={t.outcome}/></div>}<div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>;})}
        {candTimeline.filter(t=>["interview_round1","interview_round2","interview_round3"].includes(t.entry_type)).length===0&&<div style={{ fontSize:13, color:"#94A3B8" }}>No interviews yet.</div>}
      </Card>
      <Card style={{ padding:16 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>🎤 Latest Mock Feedback</div>
        {candTimeline.filter(t=>["vendor_mock","interview_mock"].includes(t.entry_type)).slice(0,1).map(t=>{const et=ENTRY_TYPES[t.entry_type];return<div key={t.id} style={{ background:"#F8FAFC", borderRadius:8, padding:12 }}><div style={{ fontSize:13, fontWeight:600 }}>{et.icon} {et.label}</div><div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{t.feedback}</div><div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>;})}
        {candTimeline.filter(t=>["vendor_mock","interview_mock"].includes(t.entry_type)).length===0&&<div style={{ fontSize:13, color:"#94A3B8" }}>No mock feedback yet.</div>}
      </Card>
      <Card style={{ padding:16 }}>
        <div style={{ fontWeight:600, fontSize:14, marginBottom:12 }}>📞 Screening Calls</div>
        {candTimeline.filter(t=>t.entry_type==="screening_call").slice(0,2).map(t=><div key={t.id} style={{ background:"#F8FAFC", borderRadius:8, padding:10, marginBottom:8 }}><div style={{ fontSize:13, fontWeight:600 }}>{t.title}</div>{t.outcome&&<div style={{ marginTop:4 }}><StatusBadge status={t.outcome}/></div>}<div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>)}
        {candTimeline.filter(t=>t.entry_type==="screening_call").length===0&&<div style={{ fontSize:13, color:"#94A3B8" }}>No screening calls yet.</div>}
      </Card>
    </div>}

    {tab==="timeline"&&<div>
      {canAddTimeline&&<div style={{ display:"flex", justifyContent:"flex-end", marginBottom:16 }}><Btn onClick={()=>setShowAdd(true)}>+ Add Entry</Btn></div>}
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", left:20, top:0, bottom:0, width:2, background:"#E2E8F0" }}/>
        {candTimeline.map(t=>{const et=ENTRY_TYPES[t.entry_type]||{label:t.entry_type,icon:"📌",color:"#94A3B8"};const addedBy=getMember(t.user_id);return<div key={t.id} style={{ display:"flex", gap:16, marginBottom:20, position:"relative" }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:et.color+"20", border:`2px solid ${et.color}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0, zIndex:1 }}>{et.icon}</div>
          <Card style={{ flex:1, padding:16 }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
              <div><div style={{ fontSize:14, fontWeight:700 }}>{t.title}</div><div style={{ fontSize:11, color:et.color, fontWeight:600 }}>{et.label}</div></div>
              <div style={{ textAlign:"right" }}>{t.outcome&&<StatusBadge status={t.outcome}/>}<div style={{ fontSize:11, color:"#94A3B8", marginTop:4 }}>{fmtDateTime(t.created_at)}</div></div>
            </div>
            {t.details&&<div style={{ fontSize:13, color:"#475569", marginBottom:8 }}>{t.details}</div>}
            {t.feedback&&<div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#475569", marginBottom:8 }}><strong>Feedback:</strong> {t.feedback}</div>}
            {t.scheduled_date&&<div style={{ fontSize:12, color:"#2563EB" }}>🗓️ Scheduled: {fmtDate(t.scheduled_date)}</div>}
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
          <option value="passed">✅ Passed</option>
          <option value="failed">❌ Failed</option>
          <option value="pending">⏳ Pending</option>
          <option value="scheduled">🗓️ Scheduled</option>
        </Select>
        <Input label="Scheduled date (if any)" type="date" value={form.scheduled_date||""} onChange={e=>set("scheduled_date",e.target.value)}/>
        <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn onClick={submit} disabled={loading}>{loading?"Adding...":"Add Entry"}</Btn></div>
      </Modal>
    </div>}

    {tab==="daily_logs"&&<div>
      {candLogs.map(l=>{const m=getMember(l.user_id);const roleMap={recruiter:"recruiter",r_lead:"r_lead",c_lead:"c_lead",interview_coord:"interview_coord",manager_feedback:"manager"};return<Card key={l.id} style={{ padding:16, marginBottom:10 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}><Av name={m?.name} role={m?.role} size={34}/><div><div style={{ fontSize:13, fontWeight:700 }}>{m?.name||"?"}</div><div style={{ fontSize:11, color:"#94A3B8" }}>📅 {fmtDate(l.log_date)} · ⏰ {l.log_time}</div></div></div>
          <RoleBadge role={roleMap[l.type]||"recruiter"}/>
        </div>
        <div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px 14px" }}>
          {l.type==="recruiter"&&<div style={{ fontSize:13 }}>📧 <strong>{l.emails_sent}</strong> emails · 📤 <strong>{l.submissions}</strong> submissions{l.notes&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>{l.notes}</div>}</div>}
          {l.type==="r_lead"&&<><div style={{ fontSize:13 }}>📋 {l.interview_stage||"—"}</div>{l.scheduled_date&&<div style={{ fontSize:12, marginTop:3 }}>🗓️ {fmtDate(l.scheduled_date)}</div>}{l.vendor_issue&&<div style={{ fontSize:12, color:"#DC2626", marginTop:3 }}>⚠️ {l.vendor_feedback}</div>}{l.notes&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:3 }}>{l.notes}</div>}</>}
          {l.type==="c_lead"&&<><div style={{ fontSize:13 }}>🖥️ {l.floor_issues}</div>{l.resolution_status&&<div style={{ marginTop:6 }}><StatusBadge status={l.resolution_status}/></div>}</>}
          {l.type==="interview_coord"&&<><div style={{ fontSize:13 }}>🎤 <strong>{l.session_type}</strong> · {l.sessions_done} sessions</div>{l.feedback&&<div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{l.feedback}</div>}</>}
          {l.type==="manager_feedback"&&<>
            <div style={{ fontSize:13, background:"#F0FDFA", padding:"8px 10px", borderRadius:6, marginBottom:6 }}>💬 <strong>Team:</strong> {l.feedback_to_team||l.manager_feedback||"—"}</div>
            {user.role==="president"&&l.feedback_to_president&&<div style={{ fontSize:13, background:"#F5F3FF", padding:"8px 10px", borderRadius:6, marginBottom:6 }}>🔒 <strong>President only:</strong> {l.feedback_to_president}</div>}
            {l.action_items&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>Action: {l.action_items}</div>}
          </>}
        </div>
      </Card>;})}
      {candLogs.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94A3B8", fontSize:14 }}>No daily logs yet.</div>}
    </div>}
  </div>;
}

// ─── MY RECRUITERS (R Lead view) ────────────────────────────────────────────
function MyRecruitersPage({user,members,candidates,logs,timeline,getMember,onAddTimeline,loading}){
  const [selectedRec,setSelectedRec]=useState(null);
  const [selectedCand,setSelectedCand]=useState(null);
  const myRecruiters=members.filter(m=>m.role==="recruiter"&&m.r_lead_team===user.id);

  if(selectedCand) return <CandidateProfile candidate={selectedCand} members={members} logs={logs} timeline={timeline} getMember={getMember} onAddTimeline={onAddTimeline} loading={loading} user={user} onBack={()=>setSelectedCand(null)}/>;

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
                  {todayLog.length>0?<span style={{ fontSize:11, background:"#F0FDF4", color:"#16A34A", padding:"2px 8px", borderRadius:99, fontWeight:600 }}>✅ Log submitted today</span>:<span style={{ fontSize:11, background:"#FFFBEB", color:"#D97706", padding:"2px 8px", borderRadius:99, fontWeight:600 }}>⏳ Log pending today</span>}
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
                  {l.type==="recruiter"&&<div style={{ fontSize:12, color:"#475569" }}>📧 {l.emails_sent} emails · 📤 {l.submissions} submissions</div>}
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
function LogPage({user,rc,candidates,onSubmit,loading}){
  const [form,setForm]=useState({});
  const set=(k,v)=>setForm(p=>({...p,[k]:v}));
  const sub=(type)=>{if(!form.candidate_id)return alert("Select a candidate");onSubmit({...form,type});setForm({});};
  const CS=()=><Select label="Select candidate *" value={form.candidate_id||""} onChange={e=>set("candidate_id",e.target.value)}><option value="">-- Select candidate --</option>{candidates.map(c=><option key={c.id} value={c.id}>{c.name} · {c.tech}</option>)}</Select>;
  return <div>
    <div style={{ fontSize:20, fontWeight:700, marginBottom:4 }}>Daily Log</div>
    <div style={{ fontSize:13, color:"#94A3B8", marginBottom:20 }}>Submit your end-of-day update · Due by 6:00 PM EST</div>
    {candidates.length===0&&<div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:10, padding:"14px 18px", fontSize:13, color:"#D97706", marginBottom:16 }}>⚠️ No candidates assigned yet.</div>}
    <Card style={{ padding:22, maxWidth:520 }}>
      {user.role==="recruiter"&&<><div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📝 Recruiter Daily Log</div><CS/><Input label="Emails sent today *" type="number" min={0} value={form.emails_sent||""} onChange={e=>set("emails_sent",+e.target.value)} placeholder="e.g. 15"/><Input label="Submissions done today *" type="number" min={0} value={form.submissions||""} onChange={e=>set("submissions",+e.target.value)} placeholder="e.g. 3"/><Textarea label="Notes (optional)" value={form.notes||""} onChange={e=>set("notes",e.target.value)}/><Btn onClick={()=>sub("recruiter")} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Submit Daily Log"}</Btn></>}
      {user.role==="r_lead"&&<><div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>📋 R Lead Daily Log</div><CS/><Input label="Interview stage" value={form.interview_stage||""} onChange={e=>set("interview_stage",e.target.value)} placeholder="e.g. Client Interview Scheduled"/><Input label="Scheduled date" type="date" value={form.scheduled_date||""} onChange={e=>set("scheduled_date",e.target.value)}/><div style={{ marginBottom:14 }}><label style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, cursor:"pointer" }}><input type="checkbox" checked={form.vendor_issue||false} onChange={e=>set("vendor_issue",e.target.checked)}/>Vendor mock issue today?</label></div>{form.vendor_issue&&<Textarea label="Vendor issue details" value={form.vendor_feedback||""} onChange={e=>set("vendor_feedback",e.target.value)}/>}<Textarea label="Notes" value={form.notes||""} onChange={e=>set("notes",e.target.value)}/><Btn onClick={()=>sub("r_lead")} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Submit Daily Log"}</Btn></>}
      {user.role==="c_lead"&&<><div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>🖥️ C Lead Daily Log</div><CS/><Textarea label="Floor issues / observations" value={form.floor_issues||""} onChange={e=>set("floor_issues",e.target.value)}/><Select label="Resolution status" value={form.resolution_status||""} onChange={e=>set("resolution_status",e.target.value)}><option value="">-- Select --</option><option value="solved">✅ Solved</option><option value="pending">⏳ Pending</option><option value="waiting">🔄 Waiting for decision</option><option value="none">✔️ No issues today</option></Select><Textarea label="Notes" value={form.notes||""} onChange={e=>set("notes",e.target.value)}/><Btn onClick={()=>sub("c_lead")} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Submit Daily Log"}</Btn></>}
      {user.role==="interview_coord"&&<><div style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>🎤 IC Daily Log</div><CS/><Select label="Session type" value={form.session_type||""} onChange={e=>set("session_type",e.target.value)}><option value="">-- Select --</option><option value="Lip Sync">Lip Sync Session</option><option value="Turbo Prompt">Turbo Prompt Session</option><option value="Mock Interview">Mock Interview</option><option value="Mixed">Mixed Session</option></Select><Input label="Sessions conducted" type="number" min={0} value={form.sessions_done||""} onChange={e=>set("sessions_done",+e.target.value)}/><Textarea label="Candidate feedback" value={form.feedback||""} onChange={e=>set("feedback",e.target.value)}/><Textarea label="Notes" value={form.notes||""} onChange={e=>set("notes",e.target.value)}/><Btn onClick={()=>sub("interview_coord")} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Submit Daily Log"}</Btn></>}
      {(user.role==="manager"||user.role==="president")&&<>
        <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>👔 Manager Feedback</div>
        <div style={{ fontSize:12, color:"#94A3B8", marginBottom:16 }}>Add feedback for this candidate's progress</div>
        <CS/>
        <div style={{ background:"#F0FDFA", border:"1px solid #99F6E4", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#0F766E", marginBottom:6 }}>💬 Feedback to Team <span style={{ fontWeight:400, color:"#94A3B8" }}>(R Lead, C Lead, Recruiter can see)</span></div>
          <textarea value={form.feedback_to_team||""} onChange={e=>set("feedback_to_team",e.target.value)} placeholder="Write feedback visible to R Lead, C Lead and Recruiter..." style={{ width:"100%", border:"1px solid #99F6E4", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box", background:"#fff" }} rows={3}/>
        </div>
        <div style={{ background:"#F5F3FF", border:"1px solid #C4B5FD", borderRadius:10, padding:"14px 16px", marginBottom:14 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#7C3AED", marginBottom:6 }}>🔒 Feedback to President <span style={{ fontWeight:400, color:"#94A3B8" }}>(Only President can see)</span></div>
          <textarea value={form.feedback_to_president||""} onChange={e=>set("feedback_to_president",e.target.value)} placeholder="Confidential feedback for President only..." style={{ width:"100%", border:"1px solid #C4B5FD", borderRadius:8, padding:"8px 12px", fontSize:14, outline:"none", resize:"vertical", boxSizing:"border-box", background:"#fff" }} rows={3}/>
        </div>
        <Textarea label="Action items" value={form.action_items||""} onChange={e=>set("action_items",e.target.value)} placeholder="Any action items for the team..."/>
        <Btn onClick={()=>{
          if(!form.candidate_id)return alert("Select a candidate");
          sub("manager_feedback");
        }} disabled={loading||!form.candidate_id}>{loading?"Saving...":"Post Feedback"}</Btn>
      </>}
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
            <div style={{ display:"flex", alignItems:"center", gap:10 }}><Av name={m?.name} role={m?.role} size={34}/><div><div style={{ fontSize:13, fontWeight:700 }}>{m?.name||"?"}</div><div style={{ fontSize:11, color:"#94A3B8" }}>📅 {fmtDate(l.log_date)} · ⏰ {l.log_time}</div></div></div>
            <RoleBadge role={roleMap[l.type]||"recruiter"}/>
          </div>
          <div style={{ background:"#F8FAFC", borderRadius:8, padding:"10px 14px" }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#475569", marginBottom:6 }}>Candidate: {cand?.name||"?"} · {cand?.tech}</div>
            {l.type==="recruiter"&&<div style={{ fontSize:13 }}>📧 <strong>{l.emails_sent}</strong> emails · 📤 <strong>{l.submissions}</strong> submissions{l.notes&&<div style={{ fontSize:12, color:"#94A3B8", marginTop:4 }}>{l.notes}</div>}</div>}
            {l.type==="r_lead"&&<><div style={{ fontSize:13 }}>📋 {l.interview_stage||"—"}</div>{l.scheduled_date&&<div style={{ fontSize:12, marginTop:3 }}>🗓️ {fmtDate(l.scheduled_date)}</div>}{l.vendor_issue&&<div style={{ fontSize:12, color:"#DC2626", marginTop:3 }}>⚠️ {l.vendor_feedback}</div>}</>}
            {l.type==="c_lead"&&<><div style={{ fontSize:13 }}>🖥️ {l.floor_issues}</div>{l.resolution_status&&<div style={{ marginTop:6 }}><StatusBadge status={l.resolution_status}/></div>}</>}
            {l.type==="interview_coord"&&<><div style={{ fontSize:13 }}>🎤 <strong>{l.session_type}</strong> · {l.sessions_done} sessions</div>{l.feedback&&<div style={{ fontSize:12, color:"#475569", marginTop:4 }}>{l.feedback}</div>}</>}
            {l.type==="manager_feedback"&&<>
            <div style={{ fontSize:13, background:"#F0FDFA", padding:"8px 10px", borderRadius:6, marginBottom:6 }}>💬 <strong>Team:</strong> {l.feedback_to_team||l.manager_feedback||"—"}</div>
            {user.role==="president"&&l.feedback_to_president&&<div style={{ fontSize:13, background:"#F5F3FF", padding:"8px 10px", borderRadius:6, marginBottom:6 }}>🔒 <strong>President only:</strong> {l.feedback_to_president}</div>}
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
      <div style={{ background:"#EFF6FF", border:"1px solid #BFDBFE", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#2563EB", marginBottom:16 }}>🔐 Login auto-created. Default password: <strong>VARS@2026</strong></div>
      <Input label="Full name *" value={form.name||""} onChange={e=>set("name",e.target.value)}/>
      <Input label="Work email *" type="email" value={form.email||""} onChange={e=>set("email",e.target.value)}/>
      <Select label="Role *" value={form.role||""} onChange={e=>set("role",e.target.value)}><option value="">-- Select --</option><option value="recruiter">Recruiter</option><option value="r_lead">R Lead</option><option value="c_lead">C Lead</option><option value="interview_coord">Interview Coordinator</option><option value="manager">Manager</option></Select>
      {form.role==="recruiter"&&<Select label="Assign to R Lead team *" value={form.r_lead_team||""} onChange={e=>set("r_lead_team",e.target.value)}><option value="">-- Select R Lead --</option>{rLeads.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</Select>}
      <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}><Btn variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn><Btn onClick={submit} disabled={loading}>{loading?"Adding...":"Add Member"}</Btn></div>
    </Modal>
  </div>;
}

// ─── NOTIFICATIONS ──────────────────────────────────────────────────────────
function NotifsPage({notifications,onRefresh}){
  return <div>
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
      <div><div style={{ fontSize:20, fontWeight:700 }}>Notifications</div><div style={{ fontSize:13, color:"#94A3B8" }}>{notifications.length} alerts</div></div>
      <Btn variant="outline" onClick={onRefresh}>↻ Refresh</Btn>
    </div>
    <div style={{ display:"grid", gap:8 }}>
      {notifications.map(n=><Card key={n.id} style={{ padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}><div style={{ fontSize:20 }}>🔔</div><div style={{ flex:1 }}><div style={{ fontSize:13 }}>{n.message}</div><div style={{ fontSize:11, color:"#94A3B8", marginTop:2 }}>{fmtDateTime(n.created_at)}</div></div></Card>)}
      {notifications.length===0&&<div style={{ textAlign:"center", padding:60, color:"#94A3B8" }}>No notifications yet.</div>}
    </div>
  </div>;
}
