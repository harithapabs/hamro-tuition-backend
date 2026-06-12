import { useState, useEffect } from 'react';
import { FaEye } from 'react-icons/fa';
import { visitorAPI } from '../utils/api';

const VisitorCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const track = async () => {
      try {
        const { data } = await visitorAPI.hit();
        setCount(data.count || 0);
      } catch {
        try {
          const { data } = await visitorAPI.getCount();
          setCount(data.count || 0);
        } catch {}
      }
    };
    track();
  }, []);

  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-400">
      <FaEye className="text-[10px]" />
      <span>{count.toLocaleString()} visitors</span>
    </div>
  );
};

export default VisitorCounter;
