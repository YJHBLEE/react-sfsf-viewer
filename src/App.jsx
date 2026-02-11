import React, { useState, useEffect } from 'react';
import { Menu, Palette, User as UserIcon, Briefcase, Building2, MapPin } from 'lucide-react';
import axios from 'axios';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [jobHistory, setJobHistory] = useState([]);
  const [photo, setPhoto] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get Current User
        const userRes = await axios.get('user-api/currentUser');
        const userId = userRes.data.name || 'sfadmin';

        // 2. Parallel Fetch from SF
        const [profileRes, photoRes, jobRes] = await Promise.all([
          axios.get(`SuccessFactors_API/User('${userId}')`),
          axios.get(`SuccessFactors_API/Photo(photoType=1,userId='${userId}')`),
          axios.get(`SuccessFactors_API/EmpJob?$filter=userId eq '${userId}'&$expand=eventNav,companyNav,departmentNav&$orderby=startDate desc`)
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Global Navigation Bar */}
      <nav className="bg-white border-b px-4 py-2 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Menu size={20} className="text-slate-600" />
          </button>
          <h1 className="text-lg font-bold text-slate-800">SF Talent Viewer</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <Palette size={20} className="text-slate-600" />
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden border bg-slate-200">
            {photo ? <img src={photo} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={20} className="m-1.5 text-slate-400" />}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-slate-200 rounded-xl w-full"></div>
            <div className="h-64 bg-slate-200 rounded-xl w-full"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col md:flex-row gap-6 items-start">
              <img src={photo} className="w-24 h-24 rounded-full ring-4 ring-slate-50 shadow-lg" alt="Avatar" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{userData?.lastName}, {userData?.firstName}</h2>
                <p className="text-slate-500 flex items-center gap-2 mt-1">
                  <Briefcase size={16} /> {userData?.title}
                </p>
                <div className="flex flex-wrap gap-4 mt-4">
                  <span className="flex items-center gap-1 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    <Building2 size={14} /> {userData?.department}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    <MapPin size={14} /> {userData?.location}
                  </span>
                </div>
              </div>
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
            </div>

            {/* Job History Table */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="px-6 py-4 border-b bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Job History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold">
                    <tr>
                      <th className="px-6 py-3">Start Date</th>
                      <th className="px-6 py-3">Event</th>
                      <th className="px-6 py-3">Company</th>
                      <th className="px-6 py-3">Job Title</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {jobHistory.map((job, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors cursor-pointer">
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {new Date(parseInt(job.startDate.match(/\d+/)[0])).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-blue-600 font-semibold">{job.eventNav?.name || job.event}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{job.companyNav?.name}</td>
                        <td className="px-6 py-4 text-slate-600">{job.jobTitle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;