import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, FileText, Settings, Bell, Search, 
  MapPin, Building2, Mail, Phone, Calendar, Briefcase, 
  ChevronRight, Award, GraduationCap, Link2
} from 'lucide-react';
import axios from 'axios';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active }) => (
  <div className={`flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 group ${
    active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
  }`}>
    <Icon size={16} className={active ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'} />
    <span className="font-medium text-xs tracking-wide">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600" />}
  </div>
);

const InfoCard = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
    <div className="p-1.5 bg-slate-50 rounded border border-slate-100 text-slate-500">
      <Icon size={14} />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">{label}</p>
      <p className="text-xs font-semibold text-slate-700 truncate">{value || '-'}</p>
    </div>
  </div>
);

const TimelineItem = ({ job, isLast }) => (
  <div className="relative pl-6 pb-6">
    {/* Line */}
    {!isLast && (
      <div className="absolute top-1.5 left-[7px] h-full w-[1px] bg-slate-200" />
    )}
    
    {/* Dot */}
    <div className="absolute top-1.5 left-0 w-4 h-4 rounded-full border-[3px] border-white bg-indigo-500 shadow-sm z-10" />
    
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-start">
        <h4 className="font-bold text-slate-800 text-sm leading-none">{job.jobTitle}</h4>
        <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
             {new Date(parseInt(job.startDate.match(/\d+/)[0])).toLocaleDateString()}
        </span>
      </div>
      
      <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-0.5">
          <Building2 size={12} className="text-slate-400" />
          <span>{job.departmentNav?.name || job.department}</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">{job.companyNav?.name}</span>
      </div>
      
      <div className="mt-1">
          <span className="inline-flex items-center text-[10px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
             {job.eventNav?.name || job.event}
          </span>
      </div>
    </div>
  </div>
);

// --- Main App ---

const App = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [photo, setPhoto] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await axios.get('user-api/currentUser');
        const userId = userRes.data.name || 'sfadmin';

        const [profileRes, photoRes, jobRes] = await Promise.all([
          axios.get(`SuccessFactors_API/odata/v2/User('${userId}')`),
          axios.get(`SuccessFactors_API/odata/v2/Photo(photoType=1,userId='${userId}')`),
          axios.get(`SuccessFactors_API/odata/v2/EmpJob?$filter=userId eq '${userId}'&$expand=eventNav,companyNav,departmentNav&$orderby=startDate desc`)
        ]);

        setUserData(profileRes.data.d);
        setJobHistory(jobRes.data.d.results);
        if (photoRes.data.d.photo) {
            setPhoto(`data:image/jpeg;base64,${photoRes.data.d.photo}`);
        }

      } catch (err) {
        console.error("Data fetch failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-500 font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FA] font-sans text-slate-900">
      
      {/* 1. Slim Left Sidebar (Z-Index 50) */}
      <aside className="w-56 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-50">
        <div className="h-14 flex items-center gap-2 px-5 border-b border-slate-100">
          <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center text-white font-bold text-xs shadow-sm">
            SF
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-800">Talent<span className="text-indigo-600">View</span></span>
        </div>

        <div className="px-3 py-4">
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Workspace</p>
            <div className="space-y-0.5">
                <SidebarItem icon={LayoutDashboard} label="Dashboard" />
                <SidebarItem icon={Users} label="My Profile" active />
                <SidebarItem icon={Award} label="Performance" />
                <SidebarItem icon={GraduationCap} label="Learning" />
                <SidebarItem icon={FileText} label="Documents" />
            </div>
        </div>
        
        <div className="mt-auto p-3 border-t border-slate-100">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100 cursor-pointer hover:bg-white hover:shadow-sm transition-all">
                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                     {photo ? <img src={photo} alt="Me" className="w-full h-full object-cover" /> : <Users size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{userData?.firstName} {userData?.lastName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{userData?.title}</p>
                </div>
                <Settings size={14} className="text-slate-400 hover:text-slate-600" />
            </div>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 md:ml-56 relative">
        
        {/* Compact Top Header (Sticky, Z-Index 40) */}
        <header className="bg-white/90 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-200 px-6 h-14 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <span className="hover:text-slate-800 cursor-pointer">Employees</span>
                <ChevronRight size={14} />
                <span className="text-slate-800 font-bold">{userData?.lastName}, {userData?.firstName}</span>
            </div>
            
            <div className="flex items-center gap-3">
                <div className="relative hidden sm:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input type="text" placeholder="Search..." className="pl-8 pr-3 py-1.5 bg-slate-100 border border-transparent focus:bg-white focus:border-indigo-200 rounded text-xs focus:outline-none w-52 transition-all" />
                </div>
                <div className="h-4 w-[1px] bg-slate-200 mx-1"></div>
                <button className="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 rounded-md transition-colors relative">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>
        </header>

        <div className="p-5 max-w-6xl mx-auto space-y-4">
            
            {/* 1. Optimized Profile Header (White, No Banner) */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm pt-6 px-6 relative">
                <div className="flex flex-col md:flex-row items-start gap-5">
                    {/* Profile Photo */}
                    <div className="w-20 h-20 rounded-lg border border-slate-100 shadow-sm overflow-hidden bg-slate-50 shrink-0">
                        {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><Users size={32}/></div>}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 pt-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{userData?.firstName} {userData?.lastName}</h2>
                                <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                                    <Briefcase size={14} /> {userData?.title}
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                                        <Building2 size={12} /> {userData?.department}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-xs font-medium text-slate-600">
                                        <MapPin size={12} /> {userData?.location}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded hover:bg-slate-50 transition-colors">
                                    View Org Chart
                                </button>
                                <button className="px-3 py-1.5 bg-slate-900 border border-slate-900 text-white text-xs font-semibold rounded hover:bg-slate-800 transition-colors shadow-sm">
                                    Actions
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs Integrated into Header */}
                <div className="mt-6 flex items-center gap-6 border-t border-slate-100">
                    {['Overview', 'Job History', 'Compensation', 'Documents'].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase().replace(' ', ''))}
                            className={`pt-3 pb-3 text-xs font-bold transition-all relative uppercase tracking-wide ${
                                activeTab === tab.toLowerCase().replace(' ', '') 
                                ? 'text-indigo-600' 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            {tab}
                            {activeTab === tab.toLowerCase().replace(' ', '') && (
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-indigo-600" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* 2. Content Grid (Dense) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                
                {/* Left Column (Fixed Width-like behavior via Col Span) */}
                <div className="lg:col-span-4 space-y-4">
                    {/* Personal Details */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        <div className="flex justify-between items-center mb-3">
                             <h3 className="text-sm font-bold text-slate-800">Contact Information</h3>
                             <button className="text-slate-400 hover:text-indigo-600"><Link2 size={14}/></button>
                        </div>
                        <div className="flex flex-col gap-2">
                            <InfoCard icon={Mail} label="Email Address" value={userData?.email} />
                            <InfoCard icon={Phone} label="Business Phone" value={userData?.businessPhone} />
                            <InfoCard icon={Phone} label="Cell Phone" value={userData?.cellPhone || 'Not Registered'} />
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-3">Skills</h3>
                        <div className="flex flex-wrap gap-1.5">
                            {['SAP SuccessFactors', 'React', 'Fiori', 'JavaScript', 'Team Leadership'].map(skill => (
                                <span key={skill} className="px-2.5 py-1 bg-[#F1F3F5] text-slate-700 border border-slate-200 text-[11px] font-semibold rounded-md hover:border-slate-300 transition-colors cursor-default">
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column (Wider) */}
                <div className="lg:col-span-8">
                    {activeTab === 'overview' && (
                        <div className="space-y-4">
                            {/* Condensed Summary / Alert */}
                            <div className="bg-white rounded-lg border-l-4 border-indigo-500 p-4 shadow-sm flex justify-between items-center">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-800">Pending Actions</h4>
                                    <p className="text-xs text-slate-500 mt-0.5">You have 3 performance goals waiting for approval.</p>
                                </div>
                                <button className="text-xs font-semibold text-indigo-600 hover:underline">Review</button>
                            </div>

                            {/* Recent Activity */}
                            <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
                                    <h3 className="text-sm font-bold text-slate-800">Recent Job Activity</h3>
                                    <button 
                                        onClick={() => setActiveTab('jobhistory')}
                                        className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
                                    >
                                        View All
                                    </button>
                                </div>
                                <div className="pt-1 pl-1">
                                    {jobHistory.slice(0, 3).map((job, idx) => (
                                        <TimelineItem key={idx} job={job} isLast={idx === 2} />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'jobhistory' && (
                        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
                             <h3 className="text-sm font-bold text-slate-800 mb-5">Full Job History</h3>
                             <div className="pl-1">
                                {jobHistory.map((job, idx) => (
                                    <TimelineItem key={idx} job={job} isLast={idx === jobHistory.length - 1} />
                                ))}
                             </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default App;