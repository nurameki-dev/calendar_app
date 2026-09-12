const { createApp } = Vue;
const STORAGE_KEY = 'kinenbi-anniversaries';

const SAMPLE_DATA = [
  { id: 1, month: 8,  day: 23, year: 2021, title: 'AWS認定試験 合格',         memo: 'ソリューションアーキテクト - アソシエイト取得' },
  { id: 2, month: 8,  day: 23, year: 2023, title: '副業プロジェクト開始',     memo: 'フリーランスエンジニアとしての第一歩' },
  { id: 3, month: 1,  day:  1, year: 2020, title: '新年・新たな目標設定',     memo: '10年後のビジョンを描いた元旦' },
  { id: 4, month: 3,  day: 15, year: 2022, title: 'Terraform 初デプロイ成功', memo: 'はじめてインフラをコードで管理した日' },
  { id: 5, month: 11, day:  3, year: 2019, title: '入社記念日',               memo: 'エンジニアとしてのキャリアスタート' },
];

createApp({
  data() {
    const now = new Date();
    return {
      view:        'calendar', // 'calendar' | 'detail' | 'register'
      prevView:    'calendar',
      viewMonth:   now.getMonth() + 1,   // 表示中の月 (1-12)
      currentYear: now.getFullYear(),    // 今年（曜日計算に使用）
      today:       { month: now.getMonth() + 1, day: now.getDate() },

      anniversaries:      [],
      selectedMonth:      null,
      selectedDay:        null,

      form: {
        title: '',
        month: now.getMonth() + 1,
        day:   now.getDate(),
        year:  now.getFullYear(),
        memo:  '',
      },
      editingId:          null,
      confirmingDeleteId: null,
      showErr:            false,
    };
  },

  computed: {
    /* "M-D" → [events] のマップ */
    eventsByDate() {
      const map = {};
      for (const e of this.anniversaries) {
        const k = `${e.month}-${e.day}`;
        (map[k] ??= []).push(e);
      }
      return map;
    },

    /* 現在表示中の月のカレンダーセル配列
       ※曜日は currentYear（画面を開いた年）の実際の曜日を使用 */
    calCells() {
      const firstDay    = new Date(this.currentYear, this.viewMonth - 1, 1).getDay(); // 0=日
      const daysInMonth = new Date(this.currentYear, this.viewMonth, 0).getDate();
      const cells = [];
      // 月頭の空白セル
      for (let j = 0; j < firstDay; j++)
        cells.push({ day: 0, col: j, hasEvents: false });
      // 日付セル
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push({
          day:       d,
          col:       (firstDay + d - 1) % 7,
          hasEvents: !!this.eventsByDate[`${this.viewMonth}-${d}`],
        });
      }
      return cells;
    },

    /* 選択日付のイベント（新しい年から順） */
    selectedEvents() {
      if (!this.selectedMonth) return [];
      const evs = this.eventsByDate[`${this.selectedMonth}-${this.selectedDay}`] || [];
      return [...evs].sort((a, b) => b.year - a.year);
    },

    /* 登録フォームの選択月の最大日数 */
    daysInFormMonth() {
      const year = this.form.year || this.currentYear;
      return new Date(year, this.form.month, 0).getDate();
    },
  },

  watch: {
    'form.month'() { this._clampDay(); },
    'form.year'()  { this._clampDay(); },
  },

  methods: {
    /* ── 内部ユーティリティ ── */
    _clampDay() {
      if (this.form.day > this.daysInFormMonth)
        this.form.day = this.daysInFormMonth;
    },

    isToday(day) {
      return this.viewMonth === this.today.month && day === this.today.day;
    },

    /* ── ストレージ ── */
    _load() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        this.anniversaries = raw ? JSON.parse(raw) : [];
      } catch { this.anniversaries = []; }
    },
    _save() {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.anniversaries)); } catch {}
    },

    /* ── カレンダーナビゲーション ── */
    prevMonth() {
      this.viewMonth = this.viewMonth === 1 ? 12 : this.viewMonth - 1;
    },
    nextMonth() {
      this.viewMonth = this.viewMonth === 12 ? 1 : this.viewMonth + 1;
    },

    /* ── 画面遷移 ── */
    handleDayClick(day) {
      const key = `${this.viewMonth}-${day}`;
      if (this.eventsByDate[key]) {
        this._openDetail(this.viewMonth, day);
      } else {
        this.openRegister(this.viewMonth, day);
      }
    },

    _openDetail(month, day) {
      this.selectedMonth      = month;
      this.selectedDay        = day;
      this.prevView           = this.view;
      this.confirmingDeleteId = null;
      this.view               = 'detail';
    },

    openRegister(month = null, day = null, editId = null) {
      this.editingId          = editId;
      this.showErr            = false;
      this.confirmingDeleteId = null;

      if (editId) {
        const ev = this.anniversaries.find(e => e.id === editId);
        if (ev) this.form = { title: ev.title, month: ev.month, day: ev.day, year: ev.year, memo: ev.memo || '' };
      } else {
        this.form = {
          title: '',
          month: month ?? this.viewMonth,
          day:   day   ?? 1,
          year:  this.currentYear,
          memo:  '',
        };
      }
      this.prevView = this.view;
      this.view     = 'register';
    },

    goBack() {
      if (this.view === 'register' && this.prevView === 'detail' && this.selectedMonth) {
        this.view = 'detail';
      } else {
        this.view = 'calendar';
      }
    },

    /* ── CRUD ── */
    saveEvent() {
      if (!this.form.title.trim()) { this.showErr = true; return; }
      const data = {
        title: this.form.title.trim(),
        month: +this.form.month,
        day:   +this.form.day,
        year:  +this.form.year || this.currentYear,
        memo:  this.form.memo.trim(),
      };
      if (this.editingId) {
        const i = this.anniversaries.findIndex(e => e.id === this.editingId);
        if (i >= 0) this.anniversaries[i] = { ...this.anniversaries[i], ...data };
      } else {
        this.anniversaries.push({ id: Date.now(), ...data });
      }
      this._save();

      // 保存後は詳細画面へ
      this.viewMonth     = data.month;
      this.selectedMonth = data.month;
      this.selectedDay   = data.day;
      this.prevView      = 'calendar';
      this.view          = 'detail';
    },

    confirmDelete(id)  { this.confirmingDeleteId = id; },
    cancelDelete()     { this.confirmingDeleteId = null; },

    deleteEvent(id) {
      const ev    = this.anniversaries.find(e => e.id === id);
      const month = ev?.month ?? this.selectedMonth;
      const day   = ev?.day   ?? this.selectedDay;

      this.anniversaries      = this.anniversaries.filter(e => e.id !== id);
      this.confirmingDeleteId = null;
      this._save();

      const remaining = this.anniversaries.filter(e => e.month === month && e.day === day);
      if (remaining.length) {
        this.selectedMonth = month;
        this.selectedDay   = day;
        this.view          = 'detail';
        this.prevView      = 'calendar';
      } else {
        this.viewMonth = month;
        this.view      = 'calendar';
      }
    },
  },

  mounted() {
    this._load();
    if (!this.anniversaries.length) {
      this.anniversaries = SAMPLE_DATA;
      this._save();
    }
  },
}).mount('#app');