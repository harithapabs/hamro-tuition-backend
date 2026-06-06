import { useState, useRef, useEffect } from 'react';
import {
  FiDownload, FiTrash2, FiRotateCcw, FiRotateCw,
  FiMinus, FiSquare, FiCircle, FiType, FiMousePointer,
  FiChevronLeft, FiChevronRight, FiPlus, FiUpload,
  FiSun, FiMoon, FiGrid, FiX,
} from 'react-icons/fi';
import { jsPDF } from 'jspdf';

const COLORS = ['#1B2A4A', '#2563EB', '#DC2626', '#16A34A', '#D97706', '#7C3AED', '#000000', '#6B7280'];
const SIZES = [2, 4, 8, 14];

const PenIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="m15 5 4 4" />
  </svg>
);

const EraserIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 20H7L3 16c-.8-.8-.8-2 0-2.8L14.6 1.6c.8-.8 2-.8 2.8 0L21 5.2c.8.8.8 2 0 2.8L12 17" />
    <path d="m6 11 7 7" />
  </svg>
);

const ArrowIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="19" x2="19" y2="5" />
    <polyline points="12 5 19 5 19 12" />
  </svg>
);

const HighlighterIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 11 4 4" />
    <path d="M14 4 20 10l-6 6-4-4Z" />
    <path d="M3 21 9 15l-2-2" />
    <path d="M7 13 3 21" />
  </svg>
);

const FillRectIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
  </svg>
);

const FillCircleIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
  </svg>
);

const TOOLS = [
  { id: 'pen', icon: PenIcon, label: 'Pen' },
  { id: 'highlighter', icon: HighlighterIcon, label: 'Highlighter' },
  { id: 'eraser', icon: EraserIcon, label: 'Eraser' },
  { id: 'arrow', icon: ArrowIcon, label: 'Arrow' },
  { id: 'line', icon: FiMinus, label: 'Line' },
  { id: 'rect', icon: FiSquare, label: 'Rect' },
  { id: 'fillRect', icon: FillRectIcon, label: 'Fill Rect' },
  { id: 'circle', icon: FiCircle, label: 'Circle' },
  { id: 'fillCircle', icon: FillCircleIcon, label: 'Fill Circle' },
  { id: 'text', icon: FiType, label: 'Text' },
  { id: 'select', icon: FiMousePointer, label: 'Select' },
];

const PEN_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="22" viewBox="0 0 18 22"><path d="M14 2a2.5 2.5 0 0 1 3.5 3.5L5.5 17.5 2 19l1.5-4.5L14 2z" fill="#333" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const PEN_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(PEN_SVG)}") 1 20, crosshair`;

const ERASER_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="2" width="14" height="14" rx="2" fill="#333" stroke="white" stroke-width="1.2"/></svg>';
const ERASER_CURSOR = `url("data:image/svg+xml,${encodeURIComponent(ERASER_SVG)}") 2 2, crosshair`;

const createPage = () => ({
  id: Date.now() + Math.random(),
  history: [],
  historyIdx: -1,
  images: [],
});

const TeachingBoard = () => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const pagesRef = useRef(null);
  const activePageRef = useRef(0);
  const dragRef = useRef(null);

  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#1B2A4A');
  const [size, setSize] = useState(4);
  const [canvasSize, setCanvasSize] = useState({ w: 900, h: 600 });
  const isDrawingRef = useRef(false);
  const [bgMode, setBgMode] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [pages, setPages] = useState([createPage()]);
  const [activePage, setActivePage] = useState(0);

  const startRef = useRef(null);
  const snapshotRef = useRef(null);
  const lastPosRef = useRef(null);
  const pointsRef = useRef([]);
  const snapCanvasRef = useRef(null);
  pagesRef.current = pages;
  activePageRef.current = activePage;

  const currentPage = pages[activePage] || pages[0];

  const bgModes = ['blank', 'grid', 'ruled'];

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ w: rect.width - 4, h: Math.max(400, rect.height - 4) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const c = bgCanvasRef.current;
    if (!c || canvasSize.w === 0) return;
    c.width = canvasSize.w;
    c.height = canvasSize.h;
    const ctx = c.getContext('2d');
    const mode = bgModes[bgMode];
    ctx.fillStyle = darkMode ? '#1a1a2e' : '#ffffff';
    ctx.fillRect(0, 0, canvasSize.w, canvasSize.h);

    if (mode === 'grid') {
      ctx.strokeStyle = darkMode ? '#2a2a4e' : '#e5e7eb';
      ctx.lineWidth = 0.5;
      const gs = 25;
      for (let x = 0; x <= canvasSize.w; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasSize.h); ctx.stroke(); }
      for (let y = 0; y <= canvasSize.h; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasSize.w, y); ctx.stroke(); }
    } else if (mode === 'ruled') {
      ctx.strokeStyle = darkMode ? '#2a2a4e' : '#dbeafe';
      ctx.lineWidth = 0.5;
      const spacing = 30;
      for (let y = spacing; y <= canvasSize.h; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasSize.w, y); ctx.stroke();
      }
      ctx.strokeStyle = darkMode ? '#4a1a1a' : '#fecaca';
      ctx.lineWidth = 1;
      const marginX = 70;
      ctx.beginPath(); ctx.moveTo(marginX, 0); ctx.lineTo(marginX, canvasSize.h); ctx.stroke();
    }
  }, [canvasSize, bgMode, darkMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasSize.w === 0) return;
    canvas.width = canvasSize.w;
    canvas.height = canvasSize.h;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctxRef.current = ctx;
    restorePage(activePage);
  }, [canvasSize.w, canvasSize.h]);

  const savePage = (pageIdx) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setPages(prev => {
      const next = [...prev];
      const page = { ...next[pageIdx] };
      const h = page.history.slice(0, page.historyIdx + 1);
      h.push(data);
      if (h.length > 30) h.shift();
      page.history = h;
      page.historyIdx = h.length - 1;
      next[pageIdx] = page;
      return next;
    });
  };

  const drawImagesOnCanvas = (ctx, images) => {
    images.forEach(img => {
      const el = new Image();
      el.onload = () => ctx.drawImage(el, img.x, img.y, img.w, img.h);
      el.src = img.dataUrl;
    });
  };

  const restorePage = (pageIdx) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const p = pagesRef.current[pageIdx];
    if (!p || p.history.length === 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawImagesOnCanvas(ctx, p?.images || []);
      return;
    }
    const img = new Image();
    img.src = p.history[p.historyIdx];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      drawImagesOnCanvas(ctx, p.images || []);
    };
  };

  const saveState = () => {
    savePage(activePageRef.current);
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const findImageAt = (pos) => {
    const p = pagesRef.current[activePageRef.current];
    if (!p || !p.images) return -1;
    for (let i = p.images.length - 1; i >= 0; i--) {
      const img = p.images[i];
      if (pos.x >= img.x && pos.x <= img.x + img.w && pos.y >= img.y && pos.y <= img.y + img.h) {
        return i;
      }
    }
    return -1;
  };

  const startDraw = (e) => {
    e.preventDefault();
    const pos = getPos(e);

    if (tool === 'select') {
      const idx = findImageAt(pos);
      if (idx >= 0) {
        const img = pagesRef.current[activePageRef.current].images[idx];
        dragRef.current = { imageIdx: idx, offsetX: pos.x - img.x, offsetY: pos.y - img.y };
        return;
      }
    }

    startRef.current = pos;
    isDrawingRef.current = true;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    snapshotRef.current = canvas.toDataURL();
    if (tool === 'pen') {
      pointsRef.current = [{ x: pos.x, y: pos.y }];
      lastPosRef.current = { x: pos.x, y: pos.y };
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, Math.max(size / 2, 1.5), 0, Math.PI * 2);
      ctx.fill();
    } else if (['highlighter', 'eraser'].includes(tool)) {
      lastPosRef.current = { x: pos.x, y: pos.y };
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const draw = (e) => {
    e.preventDefault();
    const pos = getPos(e);
    const ctx = ctxRef.current;

    if (tool === 'select' && dragRef.current) {
      const page = pagesRef.current[activePageRef.current];
      const img = page.images[dragRef.current.imageIdx];
      const nx = pos.x - dragRef.current.offsetX;
      const ny = pos.y - dragRef.current.offsetY;
      setPages(prev => {
        const next = [...prev];
        const p = { ...next[activePageRef.current] };
        const imgs = [...p.images];
        imgs[dragRef.current.imageIdx] = { ...imgs[dragRef.current.imageIdx], x: nx, y: ny };
        p.images = imgs;
        next[activePageRef.current] = p;
        return next;
      });
      const canvas = canvasRef.current;
      const p = pagesRef.current[activePageRef.current];
      if (p) {
        const bgImg = new Image();
        if (p.history.length > 0 && p.historyIdx >= 0) {
          bgImg.src = p.history[p.historyIdx];
          bgImg.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(bgImg, 0, 0);
            const updated = pagesRef.current[activePageRef.current];
            drawImagesOnCanvas(ctx, updated?.images || []);
          };
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawImagesOnCanvas(ctx, p.images);
        }
      }
      return;
    }

    if (!isDrawingRef.current) return;

    if (tool === 'pen') {
      const buf = pointsRef.current;
      if (buf.length === 0) return;
      const newPt = { x: pos.x, y: pos.y };
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.globalCompositeOperation = 'source-over';
      const r = Math.max(size / 2, 1.5);
      if (buf.length >= 3) {
        const p0 = buf[0], p1 = buf[1], p2 = buf[2];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (newPt.x - p1.x) / 6;
        const cp2y = p2.y - (newPt.y - p1.y) / 6;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
        ctx.stroke();
      } else {
        const last = buf[buf.length - 1];
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(newPt.x, newPt.y);
        ctx.stroke();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(newPt.x, newPt.y, r, 0, Math.PI * 2);
      ctx.fill();
      buf.push(newPt);
      if (buf.length > 3) buf.shift();
      lastPosRef.current = newPt;
    } else if (tool === 'highlighter') {
      const last = lastPosRef.current;
      if (!last) return;
      lastPosRef.current = { x: pos.x, y: pos.y };
      const hdx = pos.x - last.x, hdy = pos.y - last.y;
      if (hdx * hdx + hdy * hdy < 4) return;
      ctx.strokeStyle = color + '30';
      ctx.lineWidth = size * 5;
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      const last = lastPosRef.current;
      if (!last) return;
      lastPosRef.current = { x: pos.x, y: pos.y };
      const edx = pos.x - last.x, edy = pos.y - last.y;
      if (edx * edx + edy * edy < 4) return;
      ctx.strokeStyle = darkMode ? '#1a1a2e' : '#FFFFFF';
      ctx.lineWidth = size * 8;
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size * 4, 0, Math.PI * 2);
      ctx.fillStyle = darkMode ? '#1a1a2e' : '#FFFFFF';
      ctx.fill();
    } else if (['arrow', 'line', 'rect', 'fillRect', 'circle', 'fillCircle'].includes(tool)) {
      const img = new Image();
      img.src = snapshotRef.current;
      img.onload = () => {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctx.drawImage(img, 0, 0);
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.globalCompositeOperation = 'source-over';
        const sx = startRef.current.x, sy = startRef.current.y;

        if (tool === 'line') {
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y); ctx.stroke();
        } else if (tool === 'arrow') {
          const dx = pos.x - sx, dy = pos.y - sy;
          const angle = Math.atan2(dy, dx);
          const headLen = Math.min(15, Math.hypot(dx, dy) * 0.3);
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(pos.x, pos.y); ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          ctx.lineTo(pos.x - headLen * Math.cos(angle - Math.PI / 6), pos.y - headLen * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(pos.x - headLen * Math.cos(angle + Math.PI / 6), pos.y - headLen * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fillStyle = color;
          ctx.fill();
        } else if (tool === 'rect') {
          ctx.strokeRect(sx, sy, pos.x - sx, pos.y - sy);
        } else if (tool === 'fillRect') {
          ctx.fillStyle = color;
          ctx.fillRect(sx, sy, pos.x - sx, pos.y - sy);
        } else if (tool === 'circle') {
          const rx = Math.abs(pos.x - sx) / 2, ry = Math.abs(pos.y - sy) / 2;
          ctx.beginPath();
          ctx.ellipse(sx + (pos.x - sx) / 2, sy + (pos.y - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (tool === 'fillCircle') {
          const rx = Math.abs(pos.x - sx) / 2, ry = Math.abs(pos.y - sy) / 2;
          ctx.beginPath();
          ctx.ellipse(sx + (pos.x - sx) / 2, sy + (pos.y - sy) / 2, rx, ry, 0, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        }
      };
    }
  };

  const endDraw = (e) => {
    e.preventDefault();
    if (tool === 'select' && dragRef.current) {
      dragRef.current = null;
      return;
    }
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;
    const ctx = ctxRef.current;
    ctx.beginPath();
    if (tool === 'text') {
      const pos = getPos(e);
      const text = prompt('Enter text:');
      if (text) {
        ctx.font = `${size * 5}px Poppins, sans-serif`;
        ctx.fillStyle = color;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillText(text, pos.x, pos.y);
      }
    }
    saveState();
  };

  const undo = () => {
    const p = pages[activePage];
    if (!p || p.historyIdx <= 0) return;
    const newIdx = p.historyIdx - 1;
    setPages(prev => {
      const next = [...prev];
      next[activePage] = { ...next[activePage], historyIdx: newIdx };
      return next;
    });
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const h = p.history;
    const img = new Image();
    img.src = h[newIdx];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      drawImagesOnCanvas(ctx, p.images || []);
    };
  };

  const redo = () => {
    const p = pages[activePage];
    if (!p || p.historyIdx >= p.history.length - 1) return;
    const newIdx = p.historyIdx + 1;
    setPages(prev => {
      const next = [...prev];
      next[activePage] = { ...next[activePage], historyIdx: newIdx };
      return next;
    });
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    const h = p.history;
    const img = new Image();
    img.src = h[newIdx];
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      drawImagesOnCanvas(ctx, p.images || []);
    };
  };

  const clearCanvas = () => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPages(prev => {
      const next = [...prev];
      next[activePage] = { ...next[activePage], images: [] };
      return next;
    });
    saveState();
  };

  const addPage = () => {
    const newPage = createPage();
    setPages(prev => [...prev, newPage]);
    setActivePage(prev => prev + 1);
  };

  const switchPage = (idx) => {
    if (idx === activePage || idx < 0 || idx >= pages.length) return;
    savePage(activePage);
    setActivePage(idx);
  };

  const deletePage = () => {
    if (pages.length <= 1) return;
    const newPages = pages.filter((_, i) => i !== activePage);
    setPages(newPages);
    setActivePage(prev => Math.min(prev, newPages.length - 1));
  };

  useEffect(() => {
    restorePage(activePage);
  }, [activePage]);

  const exportPDF = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const page = pagesRef.current[activePageRef.current];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    const bgImg = new Image();
    if (page.history.length > 0 && page.historyIdx >= 0) {
      bgImg.src = page.history[page.historyIdx];
    }
    bgImg.onload = () => {
      tempCtx.drawImage(bgImg, 0, 0);
      drawImagesOnCanvas(tempCtx, page.images || []);
      const imgData = tempCanvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfW = 297, pdfH = 210, margin = 10;
      const imgW = pdfW - margin * 2;
      const imgH = (canvas.height / canvas.width) * imgW;
      const yOffset = margin + (pdfH - margin * 2 - imgH) / 2;
      pdf.addImage(imgData, 'PNG', margin, yOffset > margin ? yOffset : margin, imgW, Math.min(imgH, pdfH - margin * 2));
      pdf.save('teaching-board.pdf');
    };
    if (page.history.length === 0 || page.historyIdx < 0) bgImg.onload();
  };

  const savePNG = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const page = pagesRef.current[activePageRef.current];
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    const bgImg = new Image();
    if (page.history.length > 0 && page.historyIdx >= 0) {
      bgImg.src = page.history[page.historyIdx];
    }
    bgImg.onload = () => {
      tempCtx.drawImage(bgImg, 0, 0);
      drawImagesOnCanvas(tempCtx, page.images || []);
      const link = document.createElement('a');
      link.download = `board-page-${activePageRef.current + 1}.png`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
    };
    if (page.history.length === 0 || page.historyIdx < 0) bgImg.onload();
  };

  const handleLoadImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        const maxW = canvas.width * 0.5;
        const maxH = canvas.height * 0.5;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (canvas.width - w) / 2;
        const y = (canvas.height - h) / 2;
        const newImg = { id: Date.now(), dataUrl: ev.target.result, x, y, w, h };
        setPages(prev => {
          const next = [...prev];
          const page = { ...next[activePageRef.current] };
          page.images = [...(page.images || []), newImg];
          next[activePageRef.current] = page;
          return next;
        });
        const ctx = ctxRef.current;
        const p = pagesRef.current[activePageRef.current];
        if (p) {
          const bgImg2 = new Image();
          if (p.history.length > 0 && p.historyIdx >= 0) {
            bgImg2.src = p.history[p.historyIdx];
            bgImg2.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(bgImg2, 0, 0);
              const updated = pagesRef.current[activePageRef.current];
              drawImagesOnCanvas(ctx, updated?.images || []);
            };
          } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const updated = pagesRef.current[activePageRef.current];
            drawImagesOnCanvas(ctx, updated?.images || []);
          }
        }
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const cycleBg = () => setBgMode(v => (v + 1) % 3);

  const bgLabel = bgModes[bgMode];
  const bgIcon = bgMode === 0 ? '▢' : bgMode === 1 ? '⊞' : '≡';

  const getCursor = () => {
    if (tool === 'pen') return PEN_CURSOR;
    if (tool === 'eraser') return ERASER_CURSOR;
    return 'crosshair';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-wrap items-center gap-1 mb-2 bg-white rounded-2xl border border-gray-200 p-1.5 shadow-sm">
        <div className="flex items-center gap-0.5 px-1.5 border-r border-gray-200">
          <button onClick={() => switchPage(activePage - 1)} disabled={activePage <= 0}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <FiChevronLeft size={14} />
          </button>
          <span className="text-xs font-medium text-gray-600 min-w-[50px] text-center select-none">
            {activePage + 1}/{pages.length}
          </span>
          <button onClick={() => switchPage(activePage + 1)} disabled={activePage >= pages.length - 1}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <FiChevronRight size={14} />
          </button>
          <button onClick={addPage} title="Add page"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100">
            <FiPlus size={14} />
          </button>
          <button onClick={deletePage} disabled={pages.length <= 1} title="Delete page"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 disabled:opacity-30">
            <FiX size={14} />
          </button>
        </div>

        <div className="flex items-center gap-0.5 px-1.5 border-r border-gray-200">
          {TOOLS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTool(t.id)} title={t.label}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  tool === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'
                }`}>
                <Icon className="w-[16px] h-[16px]" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-0.5 px-1.5 border-r border-gray-200">
          {SIZES.map(s => (
            <button key={s} onClick={() => setSize(s)} title={`${s}px`}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${size === s ? 'bg-gray-200' : 'hover:bg-gray-100'}`}>
              <div className="rounded-full bg-gray-700"
                style={{ width: Math.min(s + 2, 12), height: Math.min(s + 2, 12) }} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5 px-1.5 border-r border-gray-200">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} title={c}
              className={`w-6 h-6 rounded-full border-2 transition-all ${color === c ? 'border-gray-400 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>

        <div className="flex items-center gap-0.5 px-1.5 border-r border-gray-200">
          <button onClick={undo} disabled={!currentPage || currentPage.historyIdx <= 0} title="Undo"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <FiRotateCcw size={13} />
          </button>
          <button onClick={redo} disabled={!currentPage || currentPage.historyIdx >= currentPage.history.length - 1} title="Redo"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30">
            <FiRotateCw size={13} />
          </button>
        </div>

        <div className="flex items-center gap-0.5 px-1.5">
          <button onClick={clearCanvas} title="Clear"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50">
            <FiTrash2 size={13} />
          </button>
          <button onClick={savePNG} title="Save PNG"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50">
            <FiDownload size={13} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} title="Load image"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-purple-600 hover:bg-purple-50">
            <FiUpload size={13} />
          </button>
          <button onClick={exportPDF} title="Export PDF"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all">
            <FiDownload size={12} /> PDF
          </button>
        </div>

        <div className="flex items-center gap-0.5 px-1.5 border-l border-gray-200 ml-auto">
          <button onClick={cycleBg} title={`Background: ${bgLabel}`}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all text-xs font-bold ${bgMode > 0 ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
            {bgIcon}
          </button>
          <button onClick={() => setDarkMode(v => !v)} title="Toggle dark mode"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${darkMode ? 'bg-gray-800 text-yellow-400' : 'text-gray-500 hover:bg-gray-100'}`}>
            {darkMode ? <FiSun size={13} /> : <FiMoon size={13} />}
          </button>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <canvas ref={bgCanvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        <canvas ref={canvasRef}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          className="absolute inset-0 w-full h-full touch-none"
          style={{ cursor: getCursor() }} />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLoadImage} className="hidden" />

      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-gray-400">
        <span>{tool.charAt(0).toUpperCase() + tool.slice(1)} tool</span>
        <span>|</span>
        <span>Step {(currentPage?.historyIdx ?? 0) + 1}/{currentPage?.history.length || 0}</span>
        <span>|</span>
        <span>{bgLabel === 'ruled' ? 'Ruled lines' : bgLabel === 'grid' ? 'Grid' : 'Blank'}</span>
        <span>|</span>
        <span>{darkMode ? 'Dark' : 'Light'}</span>
      </div>
    </div>
  );
};

export default TeachingBoard;
