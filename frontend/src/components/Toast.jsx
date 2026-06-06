// Toast is handled globally via react-hot-toast's Toaster component in App.jsx
// This file exists for re-exporting toast if needed
import toast from 'react-hot-toast';

export const showToast = (message, type = 'success') => {
  if (type === 'success') toast.success(message);
  else if (type === 'error') toast.error(message);
  else toast(message);
};

export default toast;
