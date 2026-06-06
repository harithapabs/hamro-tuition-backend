import { useEffect, useState } from 'react';
import { FiCopy, FiCheck, FiGift, FiUsers, FiTrendingUp, FiClock } from 'react-icons/fi';
import { studentAPI } from '../../utils/api';

const Referrals = () => {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    studentAPI.getReferralInfo()
      .then((r) => setInfo(r.data))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    if (!info?.referralCode) return;
    navigator.clipboard.writeText(info.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="p-8 text-gray-500">Loading...</div>;
  }
  if (!info) {
    return <div className="p-8 text-red-500">Failed to load referral info.</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <FiGift className="text-purple-600" /> Referrals & Tokens
        </h1>
        <p className="text-gray-600 mt-1">Share your code, earn tokens, unlock more courses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-purple-100 text-sm">Token Balance</span>
            <FiGift />
          </div>
          <div className="text-4xl font-bold">{info.balance}</div>
          <div className="text-purple-100 text-sm mt-1">≈ Rs {info.balance * info.tokenValueRs}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">Total Earned</span>
            <FiTrendingUp className="text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{info.totalEarned}</div>
          <div className="text-gray-400 text-sm mt-1">tokens from referrals</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-sm">People Referred</span>
            <FiUsers className="text-blue-500" />
          </div>
          <div className="text-3xl font-bold text-gray-900">{info.totalReferred}</div>
          <div className="text-gray-400 text-sm mt-1">successful enrollments</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Referral Code</h2>
        <div className="flex items-center gap-3 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4">
          <code className="flex-1 text-2xl font-mono font-bold text-purple-700 tracking-wider">
            {info.referralCode}
          </code>
          <button
            onClick={copyCode}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm"
          >
            {copied ? <><FiCheck /> Copied</> : <><FiCopy /> Copy</>}
          </button>
        </div>
        <div className="mt-4 bg-purple-50 border border-purple-100 rounded-xl p-4 text-sm text-gray-700">
          <p className="font-semibold text-purple-800 mb-1">How it works</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Share your code with friends.</li>
            <li>When they sign up and buy a course, both of you earn tokens (10% each of the course price).</li>
            <li>1 token = Rs {info.tokenValueRs}. Use tokens to discount future course purchases.</li>
            <li>Tokens are awarded only after the referred student's payment is approved by admin.</li>
          </ul>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <FiClock /> Transaction History
        </h2>
        {info.history.length === 0 ? (
          <p className="text-gray-400 text-sm">No transactions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Date</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Description</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {info.history.map((tx) => (
                  <tr key={tx._id} className="border-b last:border-0">
                    <td className="py-3 text-gray-500">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.type === 'earned' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3 text-gray-700">{tx.description}</td>
                    <td className={`py-3 text-right font-semibold ${
                      tx.type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'earned' ? '+' : '-'}{tx.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Referrals;
