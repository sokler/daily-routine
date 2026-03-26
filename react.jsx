import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar as CalendarIcon,
  ChevronLeft,
  History,
  Clock,
  Save,
  X,
  Edit3,
  ChevronRight,
} from "lucide-react";

// --- Konfigurasi Helper ---
const formatTime = (timeStr) => {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  return `${hours}:${minutes} WIB`;
};

const getDayLabel = (timeStr) => {
  const hour = parseInt(timeStr.split(":")[0]);
  if (hour >= 4 && hour < 11) return { label: "Pagi", icon: "🌅" };
  if (hour >= 11 && hour < 17) return { label: "Siang", icon: "☀️" };
  return { label: "Malam", icon: "🌙" };
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}`;
};

const App = () => {
  // --- State ---
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem("routine_tasks");
    return saved ? JSON.parse(saved) : {};
  });

  const [view, setView] = useState("home"); // 'home', 'add', 'history'
  const [selectedDate, setSelectedDate] = useState(getTodayKey());
  const [editingTask, setEditingTask] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    time: "07:00",
    desc: "",
  });

  // --- Audio Effects ---
  const playPopSound = () => {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      800,
      audioCtx.currentTime + 0.1,
    );

    gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.1,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  };

  // --- Storage & Sync ---
  useEffect(() => {
    localStorage.setItem("routine_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Reset Check otomatis setiap ganti hari (Simulasi 00:00)
  useEffect(() => {
    const today = getTodayKey();
    if (!tasks[today] && tasks[Object.keys(tasks).sort().pop()]) {
      // Jika hari ini belum ada datanya, tapi ada data kemarin
      // Kita bisa mengkloning rutininitas rutin (opsional) atau mulai bersih
      const lastDate = Object.keys(tasks).sort().pop();
      const template = tasks[lastDate].map((t) => ({ ...t, completed: false }));
      setTasks((prev) => ({ ...prev, [today]: template }));
    }
  }, []);

  // --- Handlers ---
  const handleSaveTask = () => {
    if (!formData.name) return;

    const newTask = {
      id: editingTask ? editingTask.id : Date.now(),
      name: formData.name,
      time: formData.time,
      desc: formData.desc,
      completed: editingTask ? editingTask.completed : false,
    };

    const today = getTodayKey();
    const currentDayTasks = tasks[today] || [];

    let updatedTasks;
    if (editingTask) {
      updatedTasks = currentDayTasks.map((t) =>
        t.id === editingTask.id ? newTask : t,
      );
    } else {
      updatedTasks = [...currentDayTasks, newTask];
    }

    // Sort by time
    updatedTasks.sort((a, b) => a.time.localeCompare(b.time));

    setTasks({ ...tasks, [today]: updatedTasks });
    setFormData({ name: "", time: "07:00", desc: "" });
    setEditingTask(null);
    setView("home");
  };

  const toggleComplete = (id) => {
    const today = getTodayKey();
    const updated = tasks[today].map((t) => {
      if (t.id === id) {
        if (!t.completed) playPopSound();
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    setTasks({ ...tasks, [today]: updated });
  };

  const deleteTask = (id) => {
    const today = getTodayKey();
    setTasks({ ...tasks, [today]: tasks[today].filter((t) => t.id !== id) });
  };

  const startEdit = (task) => {
    setEditingTask(task);
    setFormData({ name: task.name, time: task.time, desc: task.desc });
    setView("add");
  };

  // --- Computed ---
  const todayTasks = tasks[getTodayKey()] || [];
  const completedCount = todayTasks.filter((t) => t.completed).length;
  const progressPercent =
    todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;

  const historyTasks = tasks[selectedDate] || [];

  // --- Components ---
  const TaskCard = ({ task, isHistory = false }) => {
    const dayInfo = getDayLabel(task.time);
    const isOverdue =
      !task.completed &&
      !isHistory &&
      task.time < new Date().toTimeString().slice(0, 5);

    return (
      <div
        className={`group relative overflow-hidden bg-white/80 backdrop-blur-sm p-4 rounded-3xl mb-4 shadow-sm border-2 transition-all duration-300 
        ${task.completed ? "border-pink-200 opacity-75" : isOverdue ? "border-orange-200" : "border-transparent"}`}
      >
        <div className="flex items-center gap-4">
          {!isHistory && (
            <button
              onClick={() => toggleComplete(task.id)}
              className={`transform transition-transform active:scale-125 ${task.completed ? "text-pink-400" : "text-gray-300"}`}
            >
              {task.completed ? (
                <CheckCircle2 size={28} className="animate-bounce" />
              ) : (
                <Circle size={28} />
              )}
            </button>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3
                className={`font-bold text-gray-700 ${task.completed ? "line-through decoration-pink-300" : ""}`}
              >
                {task.name}
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-pink-50 text-pink-500 font-medium">
                {dayInfo.icon} {dayInfo.label}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <Clock size={12} />
              <span>{formatTime(task.time)}</span>
              {isOverdue && (
                <span className="ml-2 text-orange-400 font-bold">
                  ⚠️ Terlewat
                </span>
              )}
            </div>
            {task.desc && (
              <p className="text-xs text-gray-500 mt-1 italic">{task.desc}</p>
            )}
          </div>

          {!isHistory && (
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(task)}
                className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Edit3 size={18} />
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          )}

          {isHistory && (
            <div className="text-xl">{task.completed ? "✅" : "❌"}</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFDEE9] to-[#B5FFFC] font-sans text-gray-800 flex justify-center p-4 sm:p-8">
      <div className="w-full max-w-md bg-white/40 backdrop-blur-xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative border border-white/50">
        {/* --- Header --- */}
        <header className="px-6 pt-10 pb-6 text-center">
          <h1 className="text-2xl font-black text-pink-600 tracking-tight">
            Daily Routine
          </h1>
          <p className="text-pink-400 font-medium">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>

          {view === "home" && (
            <div className="mt-6 bg-white/60 p-4 rounded-3xl border border-white/80 shadow-inner">
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-bold text-pink-500 uppercase tracking-widest">
                  Progress Hari Ini
                </span>
                <span className="text-xl font-black text-pink-600">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-rose-400 transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-2 font-medium">
                {completedCount} dari {todayTasks.length} rutinitas selesai
              </p>
            </div>
          )}
        </header>

        {/* --- Content Area --- */}
        <main className="flex-1 px-6 overflow-y-auto pb-24 scrollbar-hide">
          {/* HOME VIEW */}
          {view === "home" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {todayTasks.length === 0 ? (
                <div className="text-center py-12 opacity-50">
                  <div className="text-5xl mb-4">✨</div>
                  <p className="font-bold">Belum ada rutinitas!</p>
                  <p className="text-sm">Ketuk + untuk mulai hari hebatmu.</p>
                </div>
              ) : (
                todayTasks.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          )}

          {/* ADD/EDIT VIEW */}
          {view === "add" && (
            <div className="animate-in zoom-in-95 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-700">
                  {editingTask ? "Edit Rutinitas" : "Rutinitas Baru"}
                </h2>
                <button
                  onClick={() => setView("home")}
                  className="p-2 bg-gray-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 ml-2 uppercase">
                    Nama Rutinitas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Minum Air Putih"
                    className="w-full bg-white border-0 p-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-pink-300 outline-none"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1 ml-2 uppercase">
                      Waktu
                    </label>
                    <input
                      type="time"
                      className="w-full bg-white border-0 p-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-pink-300 outline-none"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex flex-col justify-end pb-2">
                    <span className="text-lg font-bold text-pink-500 ml-2">
                      {getDayLabel(formData.time).icon}{" "}
                      {getDayLabel(formData.time).label}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1 ml-2 uppercase">
                    Deskripsi (Opsional)
                  </label>
                  <textarea
                    placeholder="Tambah catatan kecil..."
                    className="w-full bg-white border-0 p-4 rounded-2xl shadow-sm focus:ring-2 focus:ring-pink-300 outline-none h-24 resize-none"
                    value={formData.desc}
                    onChange={(e) =>
                      setFormData({ ...formData, desc: e.target.value })
                    }
                  />
                </div>

                <button
                  onClick={handleSaveTask}
                  className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold py-4 rounded-2xl shadow-lg shadow-pink-200 active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Simpan Rutinitas
                </button>
              </div>
            </div>
          )}

          {/* HISTORY VIEW */}
          {view === "history" && (
            <div className="animate-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setView("home")}
                  className="p-2 hover:bg-white/50 rounded-full"
                >
                  <ChevronLeft />
                </button>
                <h2 className="text-lg font-bold">Riwayat Rutinitas</h2>
                <div className="w-8" />
              </div>

              <div className="bg-white/60 p-3 rounded-2xl flex items-center justify-between mb-6">
                <CalendarIcon className="text-pink-500 ml-2" size={20} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-0 outline-none font-bold text-gray-600"
                />
              </div>

              {historyTasks.length > 0 ? (
                historyTasks.map((task) => (
                  <TaskCard key={task.id} task={task} isHistory={true} />
                ))
              ) : (
                <div className="text-center py-12 opacity-50">
                  <History size={48} className="mx-auto mb-4" />
                  <p className="font-bold">Tidak ada data untuk tanggal ini</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* --- Bottom Navigation --- */}
        <nav className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md h-16 rounded-full shadow-2xl flex items-center justify-around px-4 border border-white">
          <button
            onClick={() => setView("home")}
            className={`flex flex-col items-center gap-1 transition-colors ${view === "home" ? "text-pink-500" : "text-gray-400"}`}
          >
            <Clock size={20} />
            <span className="text-[10px] font-bold uppercase">Hari Ini</span>
          </button>

          <button
            onClick={() => {
              setEditingTask(null);
              setFormData({ name: "", time: "07:00", desc: "" });
              setView("add");
            }}
            className="w-14 h-14 bg-gradient-to-t from-pink-600 to-rose-400 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-300 -translate-y-6 transform hover:scale-110 active:scale-90 transition-all border-4 border-white"
          >
            <Plus size={32} strokeWidth={3} />
          </button>

          <button
            onClick={() => setView("history")}
            className={`flex flex-col items-center gap-1 transition-colors ${view === "history" ? "text-pink-500" : "text-gray-400"}`}
          >
            <History size={20} />
            <span className="text-[10px] font-bold uppercase">Riwayat</span>
          </button>
        </nav>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes bounce-sm {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-sm { animation: bounce-sm 0.5s ease-in-out; }
      `}</style>
    </div>
  );
};

export default App;
