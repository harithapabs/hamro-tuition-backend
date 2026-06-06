import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiDownload, FiCalendar, FiHash, FiGlobe } from 'react-icons/fi';
import { certificateAPI } from '../../utils/api';

const CertificateView = () => {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await certificateAPI.getAll();
        const found = Array.isArray(data) ? data.find((c) => c._id === id) : null;
        setCert(found);
      } catch {}
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handlePrint = () => window.print();
  const handleDownloadPDF = () => {
    const token = localStorage.getItem('token');
    const a = document.createElement('a');
    a.href = `/api/certificates/${cert._id}/pdf?token=${token}`;
    a.download = `certificate-${cert.certNumber || cert._id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Certificate not found</p>
        <Link to="/dashboard/student/certificates" className="text-blue-600 text-sm mt-2">Back to Certificates</Link>
      </div>
    );
  }

  const courseName = cert.course?.title || cert.courseTitle;
  const instructor = cert.instructor || cert.course?.instructor || 'Hari Thapa';
  const issueDate = new Date(cert.issuedAt);
  const formattedDate = issueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const QR_CELLS = [
    1,1,0,1,1, 1,0,1,0,1, 0,1,0,1,0, 1,0,1,0,1, 1,1,0,1,1
  ];

  return (
    <div>
          <style>{`
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    .cert-gradient-text {
      background: linear-gradient(135deg, #1B2A4A 0%, #2C3E6B 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  `}</style>
          <div className="flex items-center justify-between mb-6 print:hidden">
        <Link to="/dashboard/student/certificates" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
          <FiArrowLeft /> Back
        </Link>
        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-all"
        >
          <FiDownload /> Download PDF
        </button>
      </div>

      <div className="max-w-5xl mx-auto">
        <div className="relative bg-white shadow-2xl overflow-hidden print:shadow-none"
             style={{ aspectRatio: '1.414 / 1' }}>

          <div className="absolute inset-0 border-[14px] border-[#1B2A4A] z-10 pointer-events-none" />
          <div className="absolute inset-[20px] border-[2.5px] border-[#C9A84C] z-10 pointer-events-none" />

          <div className="absolute top-4 left-4 w-24 h-24 z-20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M0 45 L0 0 L45 0" fill="none" stroke="#C9A84C" strokeWidth="3" />
              <path d="M0 35 L0 0 L35 0" fill="none" stroke="#1B2A4A" strokeWidth="5" />
              <circle cx="12" cy="12" r="5" fill="#C9A84C" />
              <circle cx="28" cy="6" r="2.5" fill="#C9A84C" />
              <circle cx="6" cy="28" r="2.5" fill="#C9A84C" />
            </svg>
          </div>
          <div className="absolute top-4 right-4 w-24 h-24 z-20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M100 45 L100 0 L55 0" fill="none" stroke="#C9A84C" strokeWidth="3" />
              <path d="M100 35 L100 0 L65 0" fill="none" stroke="#1B2A4A" strokeWidth="5" />
              <circle cx="88" cy="12" r="5" fill="#C9A84C" />
              <circle cx="72" cy="6" r="2.5" fill="#C9A84C" />
              <circle cx="94" cy="28" r="2.5" fill="#C9A84C" />
            </svg>
          </div>
          <div className="absolute bottom-4 left-4 w-24 h-24 z-20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M0 55 L0 100 L45 100" fill="none" stroke="#C9A84C" strokeWidth="3" />
              <path d="M0 65 L0 100 L35 100" fill="none" stroke="#1B2A4A" strokeWidth="5" />
              <circle cx="12" cy="88" r="5" fill="#C9A84C" />
              <circle cx="28" cy="94" r="2.5" fill="#C9A84C" />
              <circle cx="6" cy="72" r="2.5" fill="#C9A84C" />
            </svg>
          </div>
          <div className="absolute bottom-4 right-4 w-24 h-24 z-20">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <path d="M100 55 L100 100 L55 100" fill="none" stroke="#C9A84C" strokeWidth="3" />
              <path d="M100 65 L100 100 L65 100" fill="none" stroke="#1B2A4A" strokeWidth="5" />
              <circle cx="88" cy="88" r="5" fill="#C9A84C" />
              <circle cx="72" cy="94" r="2.5" fill="#C9A84C" />
              <circle cx="94" cy="72" r="2.5" fill="#C9A84C" />
            </svg>
          </div>

          <div className="absolute left-[5%] top-1/2 -translate-y-1/2 opacity-[0.12] z-0">
            <svg width="100" height="300" viewBox="0 0 100 300">
              <path d="M50 0 C50 50 10 80 10 130 C10 180 50 210 50 260 L50 300" fill="none" stroke="#1B2A4A" strokeWidth="8" strokeLinecap="round" />
              <path d="M50 0 C50 50 90 80 90 130 C90 180 50 210 50 260 L50 300" fill="none" stroke="#1B2A4A" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>
          <div className="absolute right-[5%] top-1/2 -translate-y-1/2 opacity-[0.12] z-0">
            <svg width="100" height="300" viewBox="0 0 100 300">
              <path d="M50 0 C50 50 10 80 10 130 C10 180 50 210 50 260 L50 300" fill="none" stroke="#1B2A4A" strokeWidth="8" strokeLinecap="round" />
              <path d="M50 0 C50 50 90 80 90 130 C90 180 50 210 50 260 L50 300" fill="none" stroke="#1B2A4A" strokeWidth="8" strokeLinecap="round" />
            </svg>
          </div>

          <div className="absolute -top-[2px] -left-[2px] z-20 w-48 h-48">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path d="M0 200 Q0 100 100 0 Q200 0 200 50" fill="none" stroke="#C9A84C" strokeWidth="2" opacity="0.4" />
              <path d="M0 200 Q20 120 120 20 Q200 0 200 60" fill="none" stroke="#1B2A4A" strokeWidth="1.5" opacity="0.15" />
            </svg>
          </div>
          <div className="absolute -bottom-[2px] -right-[2px] z-20 w-48 h-48">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <path d="M200 0 Q200 100 100 200 Q0 200 0 150" fill="none" stroke="#C9A84C" strokeWidth="2" opacity="0.4" />
              <path d="M200 0 Q180 80 80 180 Q0 200 0 140" fill="none" stroke="#1B2A4A" strokeWidth="1.5" opacity="0.15" />
            </svg>
          </div>

          <div className="absolute top-[28px] right-[32px] z-20">
            <div className="w-[52px] h-[60px] relative">
              <svg viewBox="0 0 52 60" className="w-full h-full">
                <defs>
                  <linearGradient id="badgeGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#C9A84C" />
                    <stop offset="50%" stopColor="#E8D48B" />
                    <stop offset="100%" stopColor="#C9A84C" />
                  </linearGradient>
                </defs>
                <polygon points="26,0 50,15 50,40 26,58 2,40 2,15" fill="url(#badgeGold)" stroke="#B8942E" strokeWidth="1.5" />
                <polygon points="26,4 46,17 46,38 26,54 6,38 6,17" fill="none" stroke="#FFF" strokeWidth="0.8" opacity="0.5" />
                <path d="M26 12 L26 44" stroke="#FFF" strokeWidth="1.5" opacity="0.4" />
                <path d="M14 20 C14 30 26 40 26 40 C26 40 38 30 38 20" fill="none" stroke="#FFF" strokeWidth="1.5" opacity="0.6" />
                <circle cx="26" cy="24" r="4" fill="#FFF" opacity="0.8" />
                <text x="26" y="50" textAnchor="middle" fill="#FFF" fontSize="6" fontWeight="bold" opacity="0.8">HC</text>
              </svg>
            </div>
          </div>

          <div className="absolute inset-[32px] z-10 flex flex-col items-center justify-between py-[3%] px-[5%]">

            <div className="text-center">
              <div className="w-[52px] h-[52px] mx-auto mb-1.5">
                <svg viewBox="0 0 52 52" className="w-full h-full">
                  <defs>
                    <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1B2A4A" />
                      <stop offset="100%" stopColor="#2C3E6B" />
                    </linearGradient>
                  </defs>
                  <path d="M26 4 L6 18 L26 32 L46 18 Z" fill="url(#lg)" />
                  <path d="M6 18 L6 28 L26 40 L46 28 L46 18" fill="none" stroke="#C9A84C" strokeWidth="2" />
                  <path d="M26 32 L26 42" stroke="#C9A84C" strokeWidth="2" />
                  <path d="M18 37 C18 42 26 45 26 45 C26 45 34 42 34 37" fill="none" stroke="url(#lg)" strokeWidth="1.5" />
                  <path d="M18 22 L26 17 L34 22 L26 27 Z" fill="#C9A84C" opacity="0.7" />
                </svg>
              </div>
              <h1 className="text-[clamp(18px,2.2vw,36px)] font-bold tracking-wide text-[#1B2A4A]" style={{ fontFamily: "'Times New Roman', serif" }}>
                Hamro Tuition
              </h1>
              <p className="text-[clamp(7px,0.7vw,11px)] text-[#C9A84C] tracking-[0.25em] uppercase font-medium mt-0.5">
                Empowering Learning, Building Future
              </p>
            </div>

            <div className="text-center">
              <h2 className="text-[clamp(22px,3vw,48px)] font-bold text-[#1B2A4A] tracking-[0.15em]"
                  style={{ fontFamily: "'Times New Roman', 'Georgia', serif" }}>
                CERTIFICATE
              </h2>
              <div className="flex items-center justify-center gap-3 mt-0.5">
                <div className="h-[1.5px] w-[clamp(30px,4vw,60px)] bg-[#C9A84C]" />
                <span className="text-[clamp(9px,1vw,16px)] font-semibold text-[#C9A84C] tracking-[0.3em] uppercase"
                      style={{ fontFamily: "'Times New Roman', serif" }}>
                  Of Completion
                </span>
                <div className="h-[1.5px] w-[clamp(30px,4vw,60px)] bg-[#C9A84C]" />
              </div>
            </div>

            <div className="text-center max-w-[78%]">
              <p className="text-[clamp(11px,1vw,16px)] text-[#1E293B] leading-relaxed">
                This is to certify that
              </p>
              <h3 className="text-[clamp(24px,3vw,44px)] font-bold mt-2 mb-3 tracking-[0.05em] cert-gradient-text"
                  style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>
                {cert.studentName}
              </h3>
              <p className="text-[clamp(9px,0.85vw,14px)] text-[#1E293B] leading-[2]">
                daughter/son of Mr. <span className="border-b border-dashed border-gray-400 inline-block min-w-[clamp(80px,10vw,160px)]">&nbsp;</span>,<br />
                a resident of <span className="border-b border-dashed border-gray-400 inline-block min-w-[clamp(100px,14vw,200px)]">&nbsp;</span>,<br />
                has successfully completed the course
              </p>
              <p className="mt-2 mb-1 text-[clamp(14px,1.4vw,24px)] font-bold text-[#2563EB] inline-block relative">
                &ldquo;{courseName}&rdquo;
                <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#C9A84C] rounded-full" />
              </p>
              <p className="text-[clamp(9px,0.85vw,14px)] text-[#1E293B] mt-2">
                with outstanding performance from Hamro Tuition.
              </p>
            </div>

            <div className="flex items-center justify-between w-full max-w-[90%]">
              <div className="text-center flex-1 max-w-[180px]">
                <div className="w-full h-[clamp(24px,2.8vw,42px)] flex items-end justify-center">
                  <svg viewBox="0 0 160 42" className="w-full h-full">
                    <path d="M12 34 Q30 8 55 28 Q72 38 88 18 Q105 2 122 26 Q135 36 148 16"
                          fill="none" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="border-t-2 border-[#1B2A4A] w-full pt-1 mt-1">
                  <p className="text-[clamp(9px,0.9vw,14px)] font-bold text-[#1B2A4A]">{instructor}</p>
                  <p className="text-[clamp(7px,0.7vw,11px)] text-gray-500 font-medium">Instructor</p>
                </div>
              </div>

              <div className="flex flex-col items-center px-4">
                <div className="w-[clamp(36px,4vw,60px)] h-[clamp(36px,4vw,60px)] rounded-full border-[2.5px] border-[#C9A84C] flex items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 shadow-md relative">
                  <svg viewBox="0 0 40 40" className="w-[clamp(20px,2.5vw,34px)] h-[clamp(20px,2.5vw,34px)]">
                    <circle cx="20" cy="14" r="8" fill="none" stroke="#C9A84C" strokeWidth="1.8" />
                    <path d="M14 22 L12 38 L20 30 L28 38 L26 22" fill="#C9A84C" opacity="0.85" />
                    <text x="20" y="17" textAnchor="middle" fill="#1B2A4A" fontSize="10" fontWeight="bold">★</text>
                  </svg>
                </div>
                <p className="text-[clamp(6px,0.55vw,9px)] text-[#C9A84C] font-semibold mt-0.5 tracking-[0.1em] uppercase">Verified</p>
              </div>

              <div className="text-center flex-1 max-w-[180px]">
                <div className="w-full h-[clamp(24px,2.8vw,42px)] flex items-end justify-center">
                  <svg viewBox="0 0 160 42" className="w-full h-full">
                    <path d="M12 28 Q28 14 46 30 Q62 40 78 20 Q94 4 112 26 Q128 36 148 16"
                          fill="none" stroke="#1B2A4A" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="border-t-2 border-[#1B2A4A] w-full pt-1 mt-1">
                  <p className="text-[clamp(9px,0.9vw,14px)] font-bold text-[#1B2A4A]">Bikash K. Sharma</p>
                  <p className="text-[clamp(7px,0.7vw,11px)] text-gray-500 font-medium">Director</p>
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between w-full max-w-[90%]">
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <FiHash className="text-[#C9A84C]" size={12} />
                  <span className="text-[clamp(8px,0.75vw,12px)] font-semibold text-[#1B2A4A]">Certificate No.</span>
                </div>
                <p className="font-mono text-[clamp(7px,0.6vw,10px)] text-gray-500 mt-1">{cert.certNumber}</p>
              </div>

              <div className="text-center">
                <div className="w-[clamp(40px,4.5vw,64px)] h-[clamp(40px,4.5vw,64px)] bg-white border-2 border-[#C9A84C] rounded-lg flex items-center justify-center mx-auto shadow-sm">
                  <div className="grid grid-cols-5 gap-[1.5px] w-[clamp(32px,3.8vw,54px)] h-[clamp(32px,3.8vw,54px)]">
                    {QR_CELLS.map((v, i) => (
                      <div key={i} className={`rounded-[1.5px] ${v ? 'bg-[#1B2A4A]' : 'bg-transparent'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-[clamp(7px,0.6vw,10px)] text-gray-500 font-medium mt-1">Scan to Verify Certificate</p>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <FiGlobe className="text-[#C9A84C]" size={9} />
                  <span className="text-[clamp(7px,0.6vw,10px)] text-[#1B2A4A] font-medium">www.hamrotuition.com</span>
                </div>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <FiCalendar className="text-[#C9A84C]" size={12} />
                  <span className="text-[clamp(8px,0.75vw,12px)] font-semibold text-[#1B2A4A]">Date of Completion</span>
                </div>
                <p className="text-[clamp(7px,0.6vw,10px)] text-gray-500 mt-1">{formattedDate}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateView;
