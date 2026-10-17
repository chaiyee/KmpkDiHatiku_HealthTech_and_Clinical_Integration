import { translationsDesign } from "./translations-design";
import { translationsContent } from "./translations-content";
import { translationsCompanions } from "./translations-companions";
import { translationsMeals } from "./translations-meals";
import { translationsMealPhoto } from "./translations-meal-photo";
import { translationsReplay } from "./translations-replay";
import { translationsSafety } from "./translations-safety";
// English wording is the stable dictionary key; clinical numbers and user data are never altered.
import { translationsBrief3 } from "./translations-brief3";
import { translationsBrief2 } from "./translations-brief2";
import { translationsConnected } from "./translations-connected";

export const translations: Record<string, { ms: string; zh: string }> = {
  ...translationsContent,
  ...translationsCompanions,
  ...translationsConnected,
  ...translationsSafety,
  ...translationsReplay,
  ...translationsMealPhoto,
  ...translationsMeals,
  ...translationsDesign,
  ...translationsBrief3,
  ...translationsBrief2,
  "Sign in to save online": {"ms": "Log masuk untuk simpan dalam talian", "zh": "登录以在线保存"},
  "Saved to your account": {"ms": "Disimpan ke akaun anda", "zh": "已保存到您的账户"},
  "Not saved to account": {"ms": "Tidak disimpan ke akaun", "zh": "未保存到账户"},
  "Saving…": {"ms": "Menyimpan…", "zh": "正在保存…"},
  "Sign out": {"ms": "Log keluar", "zh": "退出登录"},
  "Sign in": {"ms": "Log masuk", "zh": "登录"},
  "Create account": {"ms": "Cipta akaun", "zh": "创建账户"},
  "Email": {"ms": "E-mel", "zh": "电子邮件"},
  "Password": {"ms": "Kata laluan", "zh": "密码"},
  "Continue with Google": {"ms": "Teruskan dengan Google", "zh": "使用 Google 继续"},
  "Your readings, logs and care plan will be saved to your account and available on any device.": {"ms": "Bacaan, log dan pelan penjagaan anda akan disimpan ke akaun anda dan boleh diakses pada mana-mana peranti.", "zh": "您的读数、记录和护理计划将保存到您的账户，可在任何设备上使用。"},
  "Check your email to confirm your account.": {"ms": "Semak e-mel anda untuk mengesahkan akaun.", "zh": "请查看电子邮件以确认您的账户。"},
  "Need an account? Create one": {"ms": "Perlukan akaun? Cipta satu", "zh": "需要账户？立即创建"},
  "Already have an account? Sign in": {"ms": "Sudah ada akaun? Log masuk", "zh": "已有账户？登录"},
  "Back to the app": {"ms": "Kembali ke aplikasi", "zh": "返回应用"},
  "30-Second Consultation Brief": {"ms": "Ringkasan Konsultasi 30 Saat", "zh": "30秒问诊摘要"},
  "From recorded data only": {"ms": "Daripada data yang direkodkan sahaja", "zh": "仅基于已记录的数据"},
  "Insufficient data": {"ms": "Data tidak mencukupi", "zh": "数据不足"},
  "Repeated patterns": {"ms": "Corak berulang", "zh": "重复模式"},
  "None detected": {"ms": "Tiada dikesan", "zh": "未检测到"},
  "Not logged": {"ms": "Tidak dicatat", "zh": "未记录"},
  "(not the same as missed)": {"ms": "(tidak sama dengan tertinggal)", "zh": "（不等于漏服）"},
  "Patient questions from Copilot": {"ms": "Soalan pesakit daripada Copilot", "zh": "患者从助手保存的问题"},
  "Caregiver alerts (consented, simulated)": {"ms": "Amaran penjaga (dengan izin, simulasi)", "zh": "照护者提醒（已同意，模拟）"},
  "acknowledged": {"ms": "diakui", "zh": "已确认"},
  "None": {"ms": "Tiada", "zh": "无"},
  "Delayed": {"ms": "Ditangguhkan", "zh": "已延后"},
  "Purpose": {"ms": "Tujuan", "zh": "用途"},
  "Reason": {"ms": "Sebab", "zh": "原因"},
  "Save": {"ms": "Simpan", "zh": "保存"},
  "Log Missed / Skipped": {"ms": "Catat Tertinggal / Dilangkau", "zh": "记录漏服/跳过"},
  "Why was this dose not taken? Ask your doctor or pharmacist what to do about a missed dose.": {"ms": "Mengapa dos ini tidak diambil? Tanya doktor atau ahli farmasi anda tentang dos yang tertinggal.", "zh": "为什么没有服用这一剂？漏服时该怎么做，请咨询医生或药剂师。"},
  "Forgot": {"ms": "Terlupa", "zh": "忘记了"},
  "Side Effects": {"ms": "Kesan sampingan", "zh": "副作用"},
  "Ran Out": {"ms": "Ubat habis", "zh": "药已用完"},
  "Felt Unwell": {"ms": "Rasa tidak sihat", "zh": "身体不适"},
  "Fasting": {"ms": "Berpuasa", "zh": "禁食/斋戒"},
  "Other": {"ms": "Lain-lain", "zh": "其他"},
  "Skipped dose saved to your medication history.": {"ms": "Dos dilangkau disimpan dalam sejarah ubat anda.", "zh": "跳过的剂量已保存到用药记录。"},
  "Before meal": {"ms": "Sebelum makan", "zh": "饭前"},
  "With meal": {"ms": "Semasa makan", "zh": "随餐"},
  "After meal": {"ms": "Selepas makan", "zh": "饭后"},
  "At bedtime": {"ms": "Sebelum tidur", "zh": "睡前"},
  "Meal timing (only if prescribed)": {"ms": "Masa makan (hanya jika dipreskripsi)", "zh": "用餐时间（仅限医嘱）"},
  "No instruction": {"ms": "Tiada arahan", "zh": "无指示"},
  "What it is for (as told by your doctor, optional)": {"ms": "Kegunaan (seperti dimaklumkan doktor, pilihan)", "zh": "用途（按医生说明，可选）"},
  "e.g. Helps lower blood sugar": {"ms": "cth. Membantu menurunkan gula darah", "zh": "例如：帮助降低血糖"},
  "Caregiver phone (optional)": {"ms": "Telefon penjaga (pilihan)", "zh": "照护者电话（可选）"},
  "Recheck saved. Your reading is now 4.0 mmol/L or higher. Eat your usual meal or snack if it is due.": {"ms": "Semakan semula disimpan. Bacaan anda kini 4.0 mmol/L atau lebih. Makan hidangan atau snek biasa jika tiba masanya.", "zh": "复测已保存。读数已达 4.0 mmol/L 或以上。如到用餐时间，请正常进食正餐或小吃。"},
  "Low glucose rescue started": {"ms": "Rawatan gula rendah dimulakan", "zh": "已开始低血糖处理"},
  "15 g fast-acting carbohydrate, 15-minute recheck timer": {"ms": "15 g karbohidrat bertindak pantas, pemasa semakan 15 minit", "zh": "15 克速效碳水化合物，15 分钟复测计时"},
  "Low blood sugar": {"ms": "Gula darah rendah", "zh": "低血糖"},
  "Call 999 now if the person is drowsy, confused, having a seizure, unconscious, or cannot swallow safely.": {"ms": "Hubungi 999 sekarang jika orang itu mengantuk, keliru, sawan, tidak sedarkan diri, atau tidak boleh menelan dengan selamat.", "zh": "如患者嗜睡、意识混乱、抽搐、昏迷或无法安全吞咽，请立即拨打 999。"},
  "Never give food, drink or sugar by mouth to someone who is unconscious or cannot swallow — they may choke.": {"ms": "Jangan beri makanan, minuman atau gula melalui mulut kepada orang yang tidak sedarkan diri atau tidak boleh menelan — mereka boleh tercekik.", "zh": "切勿给昏迷或无法吞咽的人口服食物、饮料或糖——可能导致窒息。"},
  "Call 999": {"ms": "Hubungi 999", "zh": "拨打 999"},
  "If you are awake and can swallow safely, follow the 15-15 rule:": {"ms": "Jika anda sedar dan boleh menelan dengan selamat, ikut peraturan 15-15:", "zh": "如您清醒且能安全吞咽，请遵循 15-15 原则："},
  "Take 15 g of fast-acting sugar now.": {"ms": "Ambil 15 g gula bertindak pantas sekarang.", "zh": "立即摄入 15 克速效糖。"},
  "Sit down and rest for 15 minutes.": {"ms": "Duduk dan berehat selama 15 minit.", "zh": "坐下休息 15 分钟。"},
  "Recheck your glucose. If still below 4.0 mmol/L, repeat. If it stays low after 2–3 tries, call 999.": {"ms": "Semak semula glukosa anda. Jika masih di bawah 4.0 mmol/L, ulang. Jika masih rendah selepas 2–3 kali, hubungi 999.", "zh": "复测血糖。若仍低于 4.0 mmol/L，请重复。重复 2–3 次仍偏低，请拨打 999。"},
  "When it is 4.0 or higher, eat your next meal or a small snack (e.g. bread or biscuits).": {"ms": "Apabila 4.0 atau lebih, makan hidangan seterusnya atau snek kecil (cth. roti atau biskut).", "zh": "达到 4.0 或以上后，吃下一餐或少量点心（如面包或饼干）。"},
  "15 g fast-acting sugar — choose ONE:": {"ms": "15 g gula bertindak pantas — pilih SATU:", "zh": "15 克速效糖——任选一种："},
  "3 teaspoons of sugar dissolved in a small glass of water": {"ms": "3 sudu teh gula dilarutkan dalam segelas kecil air", "zh": "3 茶匙糖溶于一小杯水"},
  "1 tablespoon of honey": {"ms": "1 sudu besar madu", "zh": "1 汤匙蜂蜜"},
  "150 ml regular soft drink (not diet or zero sugar)": {"ms": "150 ml minuman ringan biasa (bukan diet atau tanpa gula)", "zh": "150 毫升普通汽水（非无糖/低糖）"},
  "150 ml fruit juice (e.g. orange or apple carton)": {"ms": "150 ml jus buah (cth. kotak oren atau epal)", "zh": "150 毫升果汁（如盒装橙汁或苹果汁）"},
  "Glucose tablets or hard sweets — check the pack for 15 g": {"ms": "Tablet glukosa atau gula-gula keras — semak pek untuk 15 g", "zh": "葡萄糖片或硬糖——按包装说明取 15 克"},
  "Chocolate and kuih are slower — not for treating a low.": {"ms": "Coklat dan kuih bertindak lebih perlahan — tidak sesuai untuk merawat gula rendah.", "zh": "巧克力和糕点起效较慢——不适合处理低血糖。"},
  "15 minutes are up. Recheck your glucose now.": {"ms": "15 minit telah tamat. Semak semula glukosa anda sekarang.", "zh": "15 分钟已到，请立即复测血糖。"},
  "Recheck timer": {"ms": "Pemasa semakan semula", "zh": "复测计时器"},
  "Pause": {"ms": "Jeda", "zh": "暂停"},
  "Start": {"ms": "Mula", "zh": "开始"},
  "Resume": {"ms": "Sambung", "zh": "继续"},
  "Recheck Now": {"ms": "Semak Semula Sekarang", "zh": "立即复测"},
  "A simulated safety alert is visible to your caregiver in this app. No SMS or WhatsApp was sent.": {"ms": "Amaran keselamatan simulasi boleh dilihat oleh penjaga dalam aplikasi ini. Tiada SMS atau WhatsApp dihantar.", "zh": "模拟安全提醒已在本应用中向照护者显示。未发送任何短信或 WhatsApp。"},
  "Caregiver sharing is off, so no caregiver alert was created.": {"ms": "Perkongsian penjaga dimatikan, jadi tiada amaran penjaga dibuat.", "zh": "照护者共享已关闭，因此未创建照护者提醒。"},
  "Call Caregiver": {"ms": "Hubungi Penjaga", "zh": "致电照护者"},
  "Simulation": {"ms": "Simulasi", "zh": "模拟"},
  "Simulation only. No sign-in or secure access control. Doctor feedback is not verified.": {"ms": "Simulasi sahaja. Tiada log masuk atau kawalan akses selamat. Maklum balas doktor tidak disahkan.", "zh": "仅为模拟，无登录或安全访问控制。医生反馈未经核实。"},
  "Before Your Visit": {"ms": "Sebelum Lawatan Anda", "zh": "就诊前"},
  "Doctor's Feedback": {"ms": "Maklum Balas Doktor", "zh": "医生反馈"},
  "After Your Visit": {"ms": "Selepas Lawatan Anda", "zh": "就诊后"},
  "Review recent readings": {"ms": "Semak bacaan terkini", "zh": "查看近期读数"},
  "Bring your medication list": {"ms": "Bawa senarai ubat anda", "zh": "携带用药清单"},
  "Write your questions": {"ms": "Tulis soalan anda", "zh": "写下您的问题"},
  "Questions and concerns": {"ms": "Soalan dan kebimbangan", "zh": "问题与顾虑"},
  "Your questions and concerns": {"ms": "Soalan dan kebimbangan anda", "zh": "您的问题与顾虑"},
  "Save questions": {"ms": "Simpan soalan", "zh": "保存问题"},
  "Questions saved.": {"ms": "Soalan disimpan.", "zh": "问题已保存。"},
  "No questions recorded yet.": {"ms": "Belum ada soalan direkodkan.", "zh": "暂无已记录的问题。"},
  "No doctor feedback recorded yet.": {"ms": "Belum ada maklum balas doktor direkodkan.", "zh": "暂无医生反馈记录。"},
  "Doctor's goal": {"ms": "Matlamat doktor", "zh": "医生指定目标"},
  "Goal explanation": {"ms": "Penerangan matlamat", "zh": "目标说明"},
  "Follow-up instructions": {"ms": "Arahan susulan", "zh": "后续指导"},
  "Follow-up date": {"ms": "Tarikh susulan", "zh": "复诊日期"},
  "No follow-up instructions recorded yet.": {"ms": "Belum ada arahan susulan direkodkan.", "zh": "暂无后续指导记录。"},
  "View My Care Plan": {"ms": "Lihat Pelan Penjagaan Saya", "zh": "查看我的护理计划"},
  "Today's Plan": {"ms": "Pelan Hari Ini", "zh": "今日计划"},
  "Today's suggestions": {"ms": "Cadangan hari ini", "zh": "今日建议"},
  "My Weekly Progress": {"ms": "Kemajuan Mingguan Saya", "zh": "我的每周进度"},
  "Doctor's Goals": {"ms": "Matlamat Doktor", "zh": "医生指定目标"},
  "After-meal reading recorded": {"ms": "Bacaan selepas makan direkodkan", "zh": "已记录餐后读数"},
  "Check-in updated.": {"ms": "Semakan dikemas kini.", "zh": "打卡已更新。"},
  "Completed check-ins this week": {"ms": "Semakan selesai minggu ini", "zh": "本周已完成打卡"},
  "Check-in complete": {"ms": "Semakan selesai", "zh": "打卡已完成"},
  "Check-in not completed": {"ms": "Semakan belum selesai", "zh": "尚未完成打卡"},
  "Meal records": {"ms": "Rekod makanan", "zh": "饮食记录"},
  "Activity records": {"ms": "Rekod aktiviti", "zh": "活动记录"},

  "Overview": {
    "ms": "Ringkasan",
    "zh": "总览"
  },
  "My Health": {
    "ms": "Kesihatan Saya",
    "zh": "我的健康"
  },
  "AI Copilot": {
    "ms": "AI Copilot",
    "zh": "AI 健康助手"
  },
  "Doctor Visit": {
    "ms": "Lawatan Doktor",
    "zh": "医生就诊"
  },
  "My Care Plan": {
    "ms": "Pelan Penjagaan Saya",
    "zh": "我的护理计划"
  },
  "Copilot": {
    "ms": "Copilot",
    "zh": "健康助手"
  },
  "Reset demo data": {
    "ms": "Tetapkan semula data demo",
    "zh": "重置演示数据"
  },
  "Language": {
    "ms": "Bahasa",
    "zh": "语言"
  },
  "Notifications": {
    "ms": "Notifikasi",
    "zh": "通知"
  },
  "Nothing new.": {
    "ms": "Tiada notifikasi baharu.",
    "zh": "暂无新通知。"
  },
  "View patterns →": {
    "ms": "Lihat corak →",
    "zh": "查看规律 →"
  },
  "English": {
    "ms": "English (EN)",
    "zh": "English (EN)"
  },
  "Sample data": {
    "ms": "Data contoh",
    "zh": "示例数据"
  },
  "Loading": {
    "ms": "Sedang dimuatkan",
    "zh": "正在加载"
  },
  "Date": {
    "ms": "Tarikh",
    "zh": "日期"
  },
  "Context": {
    "ms": "Keadaan pengukuran",
    "zh": "测量情境"
  },
  "Rule:": {
    "ms": "Peraturan:",
    "zh": "规则："
  },
  "· demo thresholds": {
    "ms": "· ambang demo",
    "zh": "· 演示阈值"
  },
  "supporting reading": {
    "ms": "bacaan sokongan",
    "zh": "条支持读数"
  },
  "Record glucose": {
    "ms": "Rekod glukosa",
    "zh": "记录血糖"
  },
  "Record a glucose reading": {
    "ms": "Rekod bacaan glukosa",
    "zh": "记录血糖读数"
  },
  "Ask Copilot": {
    "ms": "Tanya Copilot",
    "zh": "询问健康助手"
  },
  "Good morning": {
    "ms": "Selamat pagi",
    "zh": "早上好"
  },
  "Good afternoon": {
    "ms": "Selamat tengah hari",
    "zh": "下午好"
  },
  "Good evening": {
    "ms": "Selamat petang",
    "zh": "晚上好"
  },
  "Here's what matters from your recent records.": {
    "ms": "Inilah perkara penting daripada rekod terkini anda.",
    "zh": "以下是您近期记录中的重点。"
  },
  "Latest reading": {
    "ms": "Bacaan terkini",
    "zh": "最新读数"
  },
  "No readings yet.": {
    "ms": "Belum ada bacaan.",
    "zh": "暂无读数。"
  },
  "Logging this week": {
    "ms": "Rekod minggu ini",
    "zh": "本周记录"
  },
  "/ 7 days": {
    "ms": "/ 7 hari",
    "zh": "/ 7 天"
  },
  "readings recorded in the last 7 days": {
    "ms": "bacaan direkodkan dalam 7 hari lalu",
    "zh": "条读数记录于过去 7 天"
  },
  "Next consultation": {
    "ms": "Konsultasi seterusnya",
    "zh": "下次复诊"
  },
  "Prepare report": {
    "ms": "Sediakan laporan",
    "zh": "准备报告"
  },
  "7-day glucose trend": {
    "ms": "Trend glukosa 7 hari",
    "zh": "7 天血糖趋势"
  },
  "Includes sample data": {
    "ms": "Termasuk data contoh",
    "zh": "包含示例数据"
  },
  "Key insight": {
    "ms": "Penemuan utama",
    "zh": "健康重点"
  },
  "No patterns detected.": {
    "ms": "Tiada corak dikesan.",
    "zh": "未发现规律。"
  },
  "Lowest": {
    "ms": "Terendah",
    "zh": "最低"
  },
  "Highest": {
    "ms": "Tertinggi",
    "zh": "最高"
  },
  "Within range": {
    "ms": "Dalam julat",
    "zh": "在范围内"
  },
  "\"Within range\" is the share of these discrete sample readings between the demo low and after-meal thresholds. It is not continuous-monitoring Time-in-Range and may not reflect the whole day.": {
    "ms": "\"Dalam julat\" ialah peratusan bacaan sampel diskrit ini antara ambang rendah dan selepas makan demo. Ia bukan Time-in-Range pemantauan berterusan dan mungkin tidak menggambarkan sepanjang hari.",
    "zh": "“在范围内”指这些离散采样读数介于演示低血糖与餐后阈值之间的比例。它不是连续监测的“目标范围内时间（TIR）”，可能无法反映全天情况。"
  },
  "Symptoms like dizziness, shaking or sweating can be linked to low or high glucose.": {
    "ms": "Gejala seperti pening, menggigil atau berpeluh boleh dikaitkan dengan glukosa rendah atau tinggi.",
    "zh": "头晕、发抖或出汗等症状可能与血糖过低或过高有关。"
  },
  "Please check your glucose now if you can. If you feel very unwell, confused or drowsy, seek medical help immediately (999 in Malaysia).": {
    "ms": "Sila periksa glukosa anda sekarang jika boleh. Jika anda berasa sangat tidak sihat, keliru atau mengantuk, dapatkan bantuan perubatan dengan segera (999 di Malaysia).",
    "zh": "如可以，请立即测量血糖。若您感到非常不适、意识模糊或嗜睡，请立即就医（马来西亚请拨999）。"
  },
  "Check glucose now": {
    "ms": "Periksa glukosa sekarang",
    "zh": "立即测量血糖"
  },
  "Dismiss": {
    "ms": "Tutup",
    "zh": "关闭"
  },
  "Fasting readings were above {threshold} mmol/L on {days} different days in the last 7 days.": {
    "ms": "Bacaan puasa melebihi {threshold} mmol/L pada {days} hari berbeza dalam 7 hari terakhir.",
    "zh": "过去7天内有{days}天的空腹读数高于{threshold} mmol/L。"
  },
  "Fasting readings above {threshold} mmol/L on at least {min} different days within 7 days (multiple readings on the same day count once).": {
    "ms": "Bacaan puasa melebihi {threshold} mmol/L pada sekurang-kurangnya {min} hari berbeza dalam 7 hari (beberapa bacaan pada hari yang sama dikira sekali).",
    "zh": "7天内至少{min}个不同日期的空腹读数高于{threshold} mmol/L（同一天多次读数只计一次）。"
  },
  "After-meal readings were above {threshold} mmol/L on {days} different days in the last 7 days.": {
    "ms": "Bacaan selepas makan melebihi {threshold} mmol/L pada {days} hari berbeza dalam 7 hari terakhir.",
    "zh": "过去7天内有{days}天的餐后读数高于{threshold} mmol/L。"
  },
  "After-meal readings above {threshold} mmol/L on at least {min} different days within 7 days (multiple readings on the same day count once).": {
    "ms": "Bacaan selepas makan melebihi {threshold} mmol/L pada sekurang-kurangnya {min} hari berbeza dalam 7 hari (beberapa bacaan pada hari yang sama dikira sekali).",
    "zh": "7天内至少{min}个不同日期的餐后读数高于{threshold} mmol/L（同一天多次读数只计一次）。"
  },
  "Today's recommended action": {
    "ms": "Tindakan disyorkan hari ini",
    "zh": "今日建议行动"
  },
  "Contact your clinic about this reading. If you feel unwell, seek urgent care (999).": {
    "ms": "Hubungi klinik anda tentang bacaan ini. Jika anda berasa tidak sihat, dapatkan rawatan kecemasan (999).",
    "zh": "请就此读数联系诊所。如感到不适，请寻求急救（999）。"
  },
  "Keep recording your morning readings, and add this to your questions for your next visit.": {
    "ms": "Teruskan merekod bacaan pagi dan masukkan perkara ini dalam soalan untuk lawatan seterusnya.",
    "zh": "继续记录早晨读数，并在下次就诊时向医生咨询此情况。"
  },
  "Keep logging at your agreed times so patterns can be checked.": {
    "ms": "Teruskan merekod pada waktu yang dipersetujui supaya corak dapat disemak.",
    "zh": "继续在约定时间记录，以便查看规律。"
  },
  "See supporting records": {
    "ms": "Lihat rekod sokongan",
    "zh": "查看相关记录"
  },
  "Glucose (mmol/L)": {
    "ms": "Glukosa (mmol/L)",
    "zh": "血糖（mmol/L）"
  },
  "e.g. 6.8": {
    "ms": "cth. 6.8",
    "zh": "例如 6.8"
  },
  "Time": {
    "ms": "Masa",
    "zh": "时间"
  },
  "When was this taken?": {
    "ms": "Bilakah bacaan ini diambil?",
    "zh": "这次读数是在什么情况下测量的？"
  },
  "Note (optional)": {
    "ms": "Nota (pilihan)",
    "zh": "备注（选填）"
  },
  "e.g. late dinner": {
    "ms": "cth. makan malam lewat",
    "zh": "例如：晚餐较晚"
  },
  "Save reading": {
    "ms": "Simpan bacaan",
    "zh": "保存读数"
  },
  "Please enter your glucose reading.": {
    "ms": "Sila masukkan bacaan glukosa anda.",
    "zh": "请输入血糖读数。"
  },
  "Enter a value between 1.0 and 33.3 mmol/L.": {
    "ms": "Masukkan nilai antara 1.0 hingga 33.3 mmol/L.",
    "zh": "请输入 1.0 至 33.3 mmol/L 之间的数值。"
  },
  "Please choose a valid date and time.": {
    "ms": "Sila pilih tarikh dan masa yang sah.",
    "zh": "请选择有效的日期和时间。"
  },
  "The time can't be in the future.": {
    "ms": "Masa tidak boleh melebihi masa sekarang.",
    "zh": "时间不能晚于当前时间。"
  },
  "Reading saved. This is below the demo low threshold — if you feel unwell, follow your clinic's advice or call 999.": {
    "ms": "Bacaan disimpan. Nilai ini di bawah ambang rendah demo. Jika berasa tidak sihat, ikut nasihat klinik atau hubungi 999.",
    "zh": "读数已保存，低于演示低值阈值。如感到不适，请遵循诊所建议或拨打 999。"
  },
  "Reading saved. This is very high — if you feel very unwell, seek urgent care (999).": {
    "ms": "Bacaan disimpan. Nilai ini sangat tinggi. Jika berasa sangat tidak sihat, dapatkan rawatan kecemasan (999).",
    "zh": "读数已保存，数值很高。如感到严重不适，请寻求急救（999）。"
  },
  "Reading saved. Your history and chart are updated.": {
    "ms": "Bacaan disimpan. Sejarah dan carta anda telah dikemas kini.",
    "zh": "读数已保存，历史记录与图表已更新。"
  },
  "Fasting (before breakfast)": {
    "ms": "Puasa (sebelum sarapan)",
    "zh": "空腹（早餐前）"
  },
  "Before a meal": {
    "ms": "Sebelum makan",
    "zh": "餐前"
  },
  "2 hours after a meal": {
    "ms": "2 jam selepas makan",
    "zh": "餐后 2 小时"
  },
  "Bedtime": {
    "ms": "Sebelum tidur",
    "zh": "睡前"
  },
  "Other / random": {
    "ms": "Lain-lain / rawak",
    "zh": "其他／随机"
  },
  "Symptom": {
    "ms": "Gejala",
    "zh": "症状"
  },
  "Meal": {
    "ms": "Makanan",
    "zh": "饮食"
  },
  "Activity": {
    "ms": "Aktiviti",
    "zh": "活动"
  },
  "Medication record": {
    "ms": "Rekod ubat",
    "zh": "用药记录"
  },
  "Medication": {
    "ms": "Ubat",
    "zh": "药物"
  },
  "Record readings and see how they change over time.": {
    "ms": "Rekod bacaan dan lihat perubahannya dari semasa ke semasa.",
    "zh": "记录读数并查看随时间的变化。"
  },
  "Glucose": {
    "ms": "Glukosa",
    "zh": "血糖"
  },
  "Log activity": {
    "ms": "Rekod aktiviti",
    "zh": "记录活动"
  },
  "Timeline": {
    "ms": "Garis masa",
    "zh": "时间线"
  },
  "Patterns": {
    "ms": "Corak",
    "zh": "规律"
  },
  "Glucose history": {
    "ms": "Sejarah glukosa",
    "zh": "血糖历史"
  },
  "Last 3 days": {
    "ms": "3 hari lalu",
    "zh": "过去 3 天"
  },
  "Last 7 days": {
    "ms": "7 hari lalu",
    "zh": "过去 7 天"
  },
  "Last 14 days": {
    "ms": "14 hari lalu",
    "zh": "过去 14 天"
  },
  "Last 30 days": {
    "ms": "30 hari lalu",
    "zh": "过去 30 天"
  },
  "mmol/L (not a personal target).": {
    "ms": "mmol/L (bukan sasaran peribadi).",
    "zh": "mmol/L（并非个人目标）。"
  },
  "Recent readings": {
    "ms": "Bacaan terkini",
    "zh": "近期读数"
  },
  "No readings in this period.": {
    "ms": "Tiada bacaan dalam tempoh ini.",
    "zh": "此期间暂无读数。"
  },
  "Sample": {
    "ms": "Contoh",
    "zh": "示例"
  },
  "You": {
    "ms": "Anda",
    "zh": "您"
  },
  "Add a reading": {
    "ms": "Tambah bacaan",
    "zh": "添加读数"
  },
  "Your fasting baseline": {
    "ms": "Paras asas glukosa puasa anda",
    "zh": "您的空腹血糖基线"
  },
  "Earlier average:": {
    "ms": "Purata terdahulu:",
    "zh": "此前平均值："
  },
  "Last 7 days:": {
    "ms": "7 hari lalu:",
    "zh": "过去 7 天："
  },
  "readings, 8–28 days ago)": {
    "ms": "bacaan, 8–28 hari lalu)",
    "zh": "条读数，8–28 天前）"
  },
  "readings)": {
    "ms": "bacaan)",
    "zh": "条读数）"
  },
  "Not enough readings yet to calculate your usual level. Keep recording fasting readings.": {
    "ms": "Bacaan belum mencukupi untuk mengira paras biasa anda. Teruskan merekod bacaan puasa.",
    "zh": "目前读数不足，无法计算您的平常水平。请继续记录空腹读数。"
  },
  "Log something": {
    "ms": "Tambah rekod",
    "zh": "添加记录"
  },
  "e.g. Nasi lemak, half portion": {
    "ms": "cth. nasi lemak, separuh hidangan",
    "zh": "例如：椰浆饭，半份"
  },
  "e.g. Brisk walk, 30 min": {
    "ms": "cth. berjalan pantas, 30 minit",
    "zh": "例如：快走 30 分钟"
  },
  "e.g. Feeling dizzy": {
    "ms": "cth. berasa pening",
    "zh": "例如：感觉头晕"
  },
  "e.g. Metformin 500 mg taken": {
    "ms": "cth. telah mengambil Metformin 500 mg",
    "zh": "例如：已服用二甲双胍 500 mg"
  },
  "Please describe what you'd like to log.": {
    "ms": "Sila terangkan perkara yang ingin direkodkan.",
    "zh": "请描述您要记录的内容。"
  },
  "Please choose a valid time (not in the future).": {
    "ms": "Sila pilih masa yang sah (bukan masa akan datang).",
    "zh": "请选择有效时间（不能为未来时间）。"
  },
  "{category} saved to your timeline.": {
    "ms": "{category} disimpan dalam garis masa anda.",
    "zh": "{category}已保存到时间线。"
  },
  "What": {
    "ms": "Perkara",
    "zh": "内容"
  },
  "Details (optional)": {
    "ms": "Butiran (pilihan)",
    "zh": "详情（选填）"
  },
  "When": {
    "ms": "Tarikh dan masa",
    "zh": "日期和时间"
  },
  "Medication logs are your own records. A day without a log doesn't mean a dose was missed.": {
    "ms": "Rekod ubat ialah catatan anda sendiri. Hari tanpa rekod tidak bermakna anda terlepas dos.",
    "zh": "用药记录是您自行填写的内容。某天没有记录并不代表漏服药物。"
  },
  "Save to timeline": {
    "ms": "Simpan ke garis masa",
    "zh": "保存到时间线"
  },
  "Category": {
    "ms": "Kategori",
    "zh": "类别"
  },
  "All categories": {
    "ms": "Semua kategori",
    "zh": "全部类别"
  },
  "Date range": {
    "ms": "Julat tarikh",
    "zh": "日期范围"
  },
  "No records match these filters.": {
    "ms": "Tiada rekod yang sepadan dengan penapis ini.",
    "zh": "没有符合筛选条件的记录。"
  },
  "No patterns detected in the last 7 days.": {
    "ms": "Tiada corak dikesan dalam 7 hari lalu.",
    "zh": "过去 7 天未发现规律。"
  },
  "How patterns are detected": {
    "ms": "Cara corak dikesan",
    "zh": "如何发现规律"
  },
  "Simple rules check your records — no AI decides these. Demo thresholds (not personal clinical targets):": {
    "ms": "Peraturan mudah menyemak rekod anda, bukan keputusan AI. Ambang demo (bukan sasaran klinikal peribadi):",
    "zh": "记录由简单规则检查，并非由 AI 决定。演示阈值（并非个人临床目标）："
  },
  "Low: below": {
    "ms": "Rendah: di bawah",
    "zh": "低值：低于"
  },
  "· Fasting high: above": {
    "ms": "· Puasa tinggi: melebihi",
    "zh": "· 空腹高值：高于"
  },
  "· After-meal high: above": {
    "ms": "· Selepas makan tinggi: melebihi",
    "zh": "· 餐后高值：高于"
  },
  "· Very high: above": {
    "ms": "· Sangat tinggi: melebihi",
    "zh": "· 极高值：高于"
  },
  "A pattern needs at least": {
    "ms": "Corak memerlukan sekurang-kurangnya",
    "zh": "发现规律至少需要"
  },
  "readings. Patterns show what changed alongside other records, not what caused it. Your healthcare team should set your personal targets.": {
    "ms": "bacaan. Corak menunjukkan perubahan bersama rekod lain, bukan puncanya. Pasukan kesihatan anda perlu menetapkan sasaran peribadi anda.",
    "zh": "条读数。规律反映与其他记录同期发生的变化，而非原因。您的个人目标应由医疗团队制定。"
  },
  "Diabetes education and help understanding your records.": {
    "ms": "Pendidikan diabetes dan bantuan memahami rekod anda.",
    "zh": "糖尿病知识与记录解读支持。"
  },
  "How can I help today?": {
    "ms": "Apa yang boleh saya bantu hari ini?",
    "zh": "今天有什么可以帮您？"
  },
  "Try one of these questions to get started.": {
    "ms": "Cuba salah satu soalan ini untuk bermula.",
    "zh": "请选择以下问题开始。"
  },
  "Can you explain my recent glucose trend?": {
    "ms": "Boleh terangkan trend glukosa terkini saya?",
    "zh": "能解释一下我近期的血糖趋势吗？"
  },
  "What should I ask my doctor?": {
    "ms": "Apa yang patut saya tanya doktor?",
    "zh": "我应该向医生询问什么？"
  },
  "What are some diabetes-friendly Malaysian meal choices?": {
    "ms": "Apakah pilihan makanan Malaysia yang sesuai untuk diabetes?",
    "zh": "有哪些适合糖尿病患者的马来西亚饮食选择？"
  },
  "Preparing a demo answer…": {
    "ms": "Sedang menyediakan jawapan demo…",
    "zh": "正在准备演示回答…"
  },
  "Type your question…": {
    "ms": "Taip soalan anda…",
    "zh": "输入您的问题…"
  },
  "Your question": {
    "ms": "Soalan anda",
    "zh": "您的问题"
  },
  "Send": {
    "ms": "Hantar",
    "zh": "发送"
  },
  "Safety message": {
    "ms": "Mesej keselamatan",
    "zh": "安全提醒"
  },
  "Based on your records": {
    "ms": "Berdasarkan rekod anda",
    "zh": "根据您的记录"
  },
  "General diabetes education": {
    "ms": "Pendidikan diabetes umum",
    "zh": "糖尿病一般知识"
  },
  "Demo response": {
    "ms": "Jawapan demo",
    "zh": "演示回答"
  },
  "Sources": {
    "ms": "Sumber",
    "zh": "资料来源"
  },
  "No sources were retrieved — the medical-reference service isn't connected in this demo. Please confirm with your healthcare team.": {
    "ms": "Tiada sumber diperoleh kerana perkhidmatan rujukan perubatan belum disambungkan dalam demo ini. Sila sahkan dengan pasukan kesihatan anda.",
    "zh": "未检索资料来源——本演示尚未连接医学参考服务。请向医疗团队核实。"
  },
  "Sorry, something went wrong. Please try again.": {
    "ms": "Maaf, berlaku ralat. Sila cuba lagi.",
    "zh": "抱歉，出现错误。请重试。"
  },
  "Your consultation report, ready to share or print.": {
    "ms": "Laporan konsultasi anda, sedia untuk dikongsi atau dicetak.",
    "zh": "您的就诊报告，可供分享或打印。"
  },
  "Report period": {
    "ms": "Tempoh laporan",
    "zh": "报告期间"
  },
  "Print / Save PDF": {
    "ms": "Cetak / Simpan PDF",
    "zh": "打印／保存 PDF"
  },
  "Pre-consultation summary · DEMO": {
    "ms": "Ringkasan sebelum konsultasi · DEMO",
    "zh": "就诊前摘要 · 演示"
  },
  "Female": {
    "ms": "Perempuan",
    "zh": "女"
  },
  "Type 2 diabetes": {
    "ms": "Diabetes jenis 2",
    "zh": "2 型糖尿病"
  },
  " (fictional)": {
    "ms": " (rekaan)",
    "zh": "（虚构）"
  },
  "y ·": {
    "ms": "tahun ·",
    "zh": "岁 ·"
  },
  "y)": {
    "ms": "tahun)",
    "zh": "年）"
  },
  "Period:": {
    "ms": "Tempoh:",
    "zh": "期间："
  },
  "Visit:": {
    "ms": "Lawatan:",
    "zh": "就诊："
  },
  "Fictional patient. Legend:": {
    "ms": "Pesakit rekaan. Petunjuk:",
    "zh": "虚构患者。说明："
  },
  "Recorded": {
    "ms": "Direkodkan",
    "zh": "已记录"
  },
  "Rule-detected": {
    "ms": "Dikesan melalui peraturan",
    "zh": "规则检测"
  },
  "AI-generated": {
    "ms": "Dijana AI",
    "zh": "AI 生成"
  },
  "= entered by patient ·": {
    "ms": "= dimasukkan oleh pesakit ·",
    "zh": "= 患者填写 ·"
  },
  "= deterministic rules, demo thresholds ·": {
    "ms": "= peraturan tetap, ambang demo ·",
    "zh": "= 固定规则、演示阈值 ·"
  },
  "= explanatory text (demo, not verified). Nothing here is a diagnosis.": {
    "ms": "= teks penerangan (demo, belum disahkan). Tiada kandungan ini merupakan diagnosis.",
    "zh": "= 解释文本（演示，未经核实）。本报告内容均不构成诊断。"
  },
  "Glucose overview": {
    "ms": "Ringkasan glukosa",
    "zh": "血糖概况"
  },
  "Readings": {
    "ms": "Bacaan",
    "zh": "读数"
  },
  "Average": {
    "ms": "Purata",
    "zh": "平均值"
  },
  "Range": {
    "ms": "Julat",
    "zh": "范围"
  },
  "Fasting avg (7d)": {
    "ms": "Purata puasa (7 hari)",
    "zh": "空腹平均值（7 天）"
  },
  "Detected patterns": {
    "ms": "Corak dikesan",
    "zh": "检测到的规律"
  },
  "Symptoms & lifestyle context": {
    "ms": "Gejala dan gaya hidup",
    "zh": "症状与生活方式"
  },
  "Nothing logged in this period.": {
    "ms": "Tiada rekod dalam tempoh ini.",
    "zh": "此期间暂无记录。"
  },
  "Medication records": {
    "ms": "Rekod ubat",
    "zh": "用药记录"
  },
  "No medication records in this period.": {
    "ms": "Tiada rekod ubat dalam tempoh ini.",
    "zh": "此期间暂无用药记录。"
  },
  "{title}: recorded on {days} of {range} days.": {
    "ms": "{title}: direkodkan pada {days} daripada {range} hari.",
    "zh": "{title}：在 {range} 天中有 {days} 天记录。"
  },
  "Plain-language explanation": {
    "ms": "Penerangan mudah",
    "zh": "通俗说明"
  },
  "Morning readings have been higher this week than earlier. Late nights and late, heavier dinners were also logged on some of these days. These occurred around the same time; the records do not show that one caused the other.": {
    "ms": "Bacaan pagi minggu ini lebih tinggi berbanding sebelumnya. Tidur lewat serta makan malam lewat dan lebih banyak turut direkodkan pada beberapa hari tersebut. Ia berlaku sekitar waktu yang sama; rekod ini tidak membuktikan hubungan sebab akibat.",
    "zh": "本周早晨读数高于此前。有些日子也记录了熬夜、晚餐较晚且较丰盛。这些情况发生在相近时间，记录并不能证明因果关系。"
  },
  "Readings in this period look broadly similar to earlier records based on the available data.": {
    "ms": "Berdasarkan data yang tersedia, bacaan dalam tempoh ini secara umum hampir sama dengan rekod terdahulu.",
    "zh": "根据现有数据，此期间的读数与此前记录大致相似。"
  },
  "Questions the patient may want to discuss": {
    "ms": "Soalan yang boleh dibincangkan oleh pesakit",
    "zh": "患者可能想讨论的问题"
  },
  "Suggested": {
    "ms": "Cadangan",
    "zh": "建议"
  },
  "What could be contributing to my higher morning readings?": {
    "ms": "Apakah yang mungkin menyumbang kepada bacaan pagi saya yang lebih tinggi?",
    "zh": "哪些因素可能导致我的早晨读数升高？"
  },
  "Are my target ranges right for me?": {
    "ms": "Adakah julat sasaran saya sesuai untuk saya?",
    "zh": "我的目标范围适合我吗？"
  },
  "Should late dinners or sleep timing be something I work on?": {
    "ms": "Perlukah saya mengubah waktu makan malam atau waktu tidur?",
    "zh": "我是否应该调整晚餐或睡眠时间？"
  },
  "When should I contact the clinic between visits?": {
    "ms": "Bilakah saya perlu menghubungi klinik antara lawatan?",
    "zh": "两次就诊之间，我什么时候应联系诊所？"
  },
  "Clinician review notes": {
    "ms": "Nota semakan doktor",
    "zh": "医生审核备注"
  },
  "Doctor": {
    "ms": "Doktor",
    "zh": "医生"
  },
  "Observations reviewed, plan discussed…": {
    "ms": "Pemerhatian disemak, pelan dibincangkan…",
    "zh": "已审核的观察结果、已讨论的计划…"
  },
  "Save notes": {
    "ms": "Simpan nota",
    "zh": "保存备注"
  },
  "Notes saved.": {
    "ms": "Nota disimpan.",
    "zh": "备注已保存。"
  },
  "A simple goal to follow between visits.": {
    "ms": "Matlamat mudah untuk diikuti antara lawatan.",
    "zh": "两次就诊之间可遵循的简单目标。"
  },
  "Goal from": {
    "ms": "Matlamat daripada",
    "zh": "目标由以下医生制定："
  },
  "Progress": {
    "ms": "Kemajuan",
    "zh": "进度"
  },
  "of": {
    "ms": "daripada",
    "zh": "／"
  },
  "days": {
    "ms": "hari",
    "zh": "天"
  },
  "Follow-up:": {
    "ms": "Susulan:",
    "zh": "复诊："
  },
  "Today's check-in": {
    "ms": "Semakan hari ini",
    "zh": "今日打卡"
  },
  "Fasting reading recorded": {
    "ms": "Bacaan puasa direkodkan",
    "zh": "已记录空腹读数"
  },
  "After-dinner reading recorded": {
    "ms": "Bacaan selepas makan malam direkodkan",
    "zh": "已记录晚餐后读数"
  },
  "How did today go? (optional)": {
    "ms": "Bagaimana hari ini? (pilihan)",
    "zh": "今天情况如何？（选填）"
  },
  "e.g. Took my reading late because of work": {
    "ms": "cth. mengambil bacaan lewat kerana kerja",
    "zh": "例如：因工作较晚才测量"
  },
  "Today's check-in is complete": {
    "ms": "Semakan hari ini selesai",
    "zh": "今日打卡已完成"
  },
  "Undo": {
    "ms": "Batal",
    "zh": "撤销"
  },
  "Mark today complete": {
    "ms": "Tandakan hari ini selesai",
    "zh": "完成今日打卡"
  },
  "Check-in complete. Well done!": {
    "ms": "Semakan selesai. Syabas!",
    "zh": "打卡已完成，做得很好！"
  },
  "Doctor feedback": {
    "ms": "Maklum balas doktor",
    "zh": "医生反馈"
  },
  "Record fasting glucose before breakfast and 2 hours after dinner, every day for 14 days.": {
    "ms": "Rekod glukosa puasa sebelum sarapan dan 2 jam selepas makan malam, setiap hari selama 14 hari.",
    "zh": "连续 14 天，每天在早餐前测量空腹血糖，并在晚餐后 2 小时测量血糖。"
  },
  "Consistent readings at the same times help your doctor see your usual pattern and decide whether anything needs to change at your next visit.": {
    "ms": "Bacaan yang konsisten pada waktu yang sama membantu doktor melihat corak biasa anda dan menentukan perubahan yang diperlukan semasa lawatan seterusnya.",
    "zh": "在相同时间持续测量，有助于医生了解您的平常规律，并在下次就诊时判断是否需要调整。"
  },
  "Good consistency so far. Please keep noting late meals and late nights so we can review the morning readings together. (Sample feedback)": {
    "ms": "Rekod anda setakat ini konsisten. Teruskan mencatat waktu makan dan tidur yang lewat supaya kita dapat menyemak bacaan pagi bersama. (Maklum balas contoh)",
    "zh": "目前记录很规律。请继续记录晚餐较晚和熬夜的情况，以便一起查看早晨读数。（示例反馈）"
  },
  "No readings in this period yet.": {
    "ms": "Belum ada bacaan dalam tempoh ini.",
    "zh": "此期间暂无读数。"
  },
  "Glucose readings chart in mmol/L": {
    "ms": "Carta bacaan glukosa dalam mmol/L",
    "zh": "血糖读数图表，单位 mmol/L"
  },
  "Shaded band shows the demo reference range": {
    "ms": "Jalur berlorek menunjukkan julat rujukan demo",
    "zh": "阴影区域表示演示参考范围"
  },
  "Close": {
    "ms": "Tutup",
    "zh": "关闭"
  },
  "Page not found": {
    "ms": "Halaman tidak ditemui",
    "zh": "找不到页面"
  },
  "The page you're looking for doesn't exist or has been moved.": {
    "ms": "Halaman yang dicari tidak wujud atau telah dipindahkan.",
    "zh": "您查找的页面不存在或已移动。"
  },
  "Go home": {
    "ms": "Ke ringkasan",
    "zh": "返回总览"
  },
  "This page didn't load": {
    "ms": "Halaman ini gagal dimuatkan",
    "zh": "页面未能加载"
  },
  "Something went wrong on our end. You can try refreshing or head back home.": {
    "ms": "Berlaku ralat. Cuba muat semula atau kembali ke ringkasan.",
    "zh": "出现错误。您可以刷新页面或返回总览。"
  },
  "Try again": {
    "ms": "Cuba lagi",
    "zh": "重试"
  },
  "Metformin 500 mg": {
    "ms": "Metformin 500 mg",
    "zh": "二甲双胍 500 mg"
  },
  "Recorded as taken with breakfast": {
    "ms": "Direkodkan sebagai diambil bersama sarapan",
    "zh": "记录为随早餐服用"
  },
  "Nasi lemak with egg": {
    "ms": "Nasi lemak dengan telur",
    "zh": "椰浆饭配鸡蛋"
  },
  "Lunch at work canteen": {
    "ms": "Makan tengah hari di kantin tempat kerja",
    "zh": "在工作食堂吃午餐"
  },
  "Brown rice, ikan bakar, sayur": {
    "ms": "Nasi beras perang, ikan bakar, sayur",
    "zh": "糙米饭、烤鱼、蔬菜"
  },
  "Home-cooked dinner": {
    "ms": "Makan malam masakan rumah",
    "zh": "家常晚餐"
  },
  "Roti canai with teh tarik": {
    "ms": "Roti canai dengan teh tarik",
    "zh": "印度煎饼配拉茶"
  },
  "Late dinner with family": {
    "ms": "Makan malam lewat bersama keluarga",
    "zh": "与家人较晚吃晚餐"
  },
  "Mee goreng mamak": {
    "ms": "Mi goreng mamak",
    "zh": "嘛嘛炒面"
  },
  "Dinner out": {
    "ms": "Makan malam di luar",
    "zh": "外出吃晚餐"
  },
  "Chicken soup with half portion rice": {
    "ms": "Sup ayam dengan separuh hidangan nasi",
    "zh": "鸡汤配半份米饭"
  },
  "Brisk walk, 30 min": {
    "ms": "Berjalan pantas, 30 minit",
    "zh": "快走 30 分钟"
  },
  "Brisk walk, 25 min": {
    "ms": "Berjalan pantas, 25 minit",
    "zh": "快走 25 分钟"
  },
  "Brisk walk, 20 min": {
    "ms": "Berjalan pantas, 20 minit",
    "zh": "快走 20 分钟"
  },
  "Taman park": {
    "ms": "Taman rekreasi",
    "zh": "社区公园"
  },
  "Gardening, 40 min": {
    "ms": "Berkebun, 40 minit",
    "zh": "园艺活动 40 分钟"
  },
  "Slept late (after midnight)": {
    "ms": "Tidur lewat (selepas tengah malam)",
    "zh": "晚睡（午夜后）"
  },
  "Self-reported": {
    "ms": "Dilaporkan sendiri",
    "zh": "自行报告"
  },
  "Feeling tired in the morning": {
    "ms": "Berasa letih pada waktu pagi",
    "zh": "早晨感到疲倦"
  },
  "Mild, self-reported": {
    "ms": "Ringan, dilaporkan sendiri",
    "zh": "轻微，自行报告"
  },
  "More thirsty than usual": {
    "ms": "Lebih dahaga daripada biasa",
    "zh": "比平时更口渴"
  },
  "Forgot dinner reading, did it late.": {
    "ms": "Terlupa bacaan selepas makan malam, mengambilnya lewat.",
    "zh": "忘记晚餐后测量，后来才补测。"
  },
  "{count} low reading{plural} recorded": {
    "ms": "{count} bacaan rendah direkodkan",
    "zh": "已记录 {count} 条低值读数"
  },
  "{count} very high reading{plural} recorded": {
    "ms": "{count} bacaan sangat tinggi direkodkan",
    "zh": "已记录 {count} 条极高值读数"
  },
  "A reading below the demo low threshold was recorded. If you feel shaky, sweaty, confused or unwell, follow your clinic's low-glucose advice or seek urgent care (999 in Malaysia).": {
    "ms": "Bacaan di bawah ambang rendah demo direkodkan. Jika menggigil, berpeluh, keliru atau berasa tidak sihat, ikut nasihat klinik tentang glukosa rendah atau dapatkan rawatan kecemasan (999 di Malaysia).",
    "zh": "已记录低于演示低值阈值的读数。如出现发抖、出汗、意识混乱或不适，请遵循诊所的低血糖建议或寻求急救（马来西亚拨打 999）。"
  },
  "A reading above the demo very-high threshold was recorded. If you feel very unwell, are vomiting or drowsy, seek urgent medical care (999 in Malaysia).": {
    "ms": "Bacaan melebihi ambang sangat tinggi demo direkodkan. Jika berasa sangat tidak sihat, muntah atau mengantuk, dapatkan rawatan kecemasan (999 di Malaysia).",
    "zh": "已记录高于演示极高值阈值的读数。如感到严重不适、呕吐或嗜睡，请立即就医（马来西亚拨打 999）。"
  },
  "Any reading below {value} mmol/L in the last 7 days.": {
    "ms": "Mana-mana bacaan di bawah {value} mmol/L dalam 7 hari lalu.",
    "zh": "过去 7 天内任何低于 {value} mmol/L 的读数。"
  },
  "Any reading above {value} mmol/L in the last 7 days.": {
    "ms": "Mana-mana bacaan melebihi {value} mmol/L dalam 7 hari lalu.",
    "zh": "过去 7 天内任何高于 {value} mmol/L 的读数。"
  },
  "Morning (fasting) readings above range on several days": {
    "ms": "Bacaan pagi (puasa) melebihi julat pada beberapa hari",
    "zh": "多天空腹（早晨）读数高于范围"
  },
  "{count} fasting readings in the last 7 days were above {value} mmol/L.": {
    "ms": "{count} bacaan puasa dalam 7 hari lalu melebihi {value} mmol/L.",
    "zh": "过去 7 天有 {count} 条空腹读数高于 {value} mmol/L。"
  },
  "At least {count} fasting readings above {value} mmol/L within 7 days.": {
    "ms": "Sekurang-kurangnya {count} bacaan puasa melebihi {value} mmol/L dalam 7 hari.",
    "zh": "7 天内至少有 {count} 条空腹读数高于 {value} mmol/L。"
  },
  "After-meal readings above range on several days": {
    "ms": "Bacaan selepas makan melebihi julat pada beberapa hari",
    "zh": "多天餐后读数高于范围"
  },
  "{count} after-meal readings in the last 7 days were above {value} mmol/L.": {
    "ms": "{count} bacaan selepas makan dalam 7 hari lalu melebihi {value} mmol/L.",
    "zh": "过去 7 天有 {count} 条餐后读数高于 {value} mmol/L。"
  },
  "At least {count} after-meal readings above {value} mmol/L within 7 days.": {
    "ms": "Sekurang-kurangnya {count} bacaan selepas makan melebihi {value} mmol/L dalam 7 hari.",
    "zh": "7 天内至少有 {count} 条餐后读数高于 {value} mmol/L。"
  },
  "Fasting average higher than your usual": {
    "ms": "Purata puasa lebih tinggi daripada biasa",
    "zh": "空腹平均值高于平常水平"
  },
  "Your recent fasting average is {recent} mmol/L, compared with your earlier average of {earlier} mmol/L (+{shift}).": {
    "ms": "Purata puasa terkini anda ialah {recent} mmol/L, berbanding purata terdahulu {earlier} mmol/L (+{shift}).",
    "zh": "您近期的空腹平均值为 {recent} mmol/L，此前为 {earlier} mmol/L（上升 {shift}）。"
  },
  "Recent 7-day fasting average is at least {shift} mmol/L above the average of the previous 3 weeks (needs ≥{count} earlier readings).": {
    "ms": "Purata puasa 7 hari terkini sekurang-kurangnya {shift} mmol/L lebih tinggi daripada purata 3 minggu sebelumnya (memerlukan ≥{count} bacaan terdahulu).",
    "zh": "近 7 天空腹平均值比此前 3 周的平均值高至少 {shift} mmol/L（需要 ≥{count} 条此前读数）。"
  },
  "Not enough data for a personal baseline yet": {
    "ms": "Data belum mencukupi untuk paras asas peribadi",
    "zh": "数据不足，尚无法建立个人基线"
  },
  "Found {earlier} earlier fasting readings and {recent} recent ones.": {
    "ms": "Terdapat {earlier} bacaan puasa terdahulu dan {recent} bacaan terkini.",
    "zh": "共有 {earlier} 条此前空腹读数和 {recent} 条近期读数。"
  },
  "Needs at least {earlier} earlier and 3 recent fasting readings.": {
    "ms": "Memerlukan sekurang-kurangnya {earlier} bacaan puasa terdahulu dan 3 bacaan terkini.",
    "zh": "需要至少 {earlier} 条此前空腹读数及 3 条近期读数。"
  },
  "We can't compare with your usual levels until more readings are recorded.": {
    "ms": "Perbandingan dengan paras biasa anda memerlukan lebih banyak bacaan.",
    "zh": "需要更多读数，才能与您的平常水平比较。"
  },
  "{count} day{plural} without readings": {
    "ms": "{count} hari tanpa bacaan",
    "zh": "有 {count} 天未记录读数"
  },
  "No readings on {dates}.": {
    "ms": "Tiada bacaan pada {dates}.",
    "zh": "{dates} 没有读数。"
  },
  "Checks each of the last 7 full days for at least one reading.": {
    "ms": "Menyemak sekurang-kurangnya satu bacaan setiap hari dalam 7 hari penuh yang lalu.",
    "zh": "检查过去 7 个完整日期每天是否至少有一条读数。"
  },
  "Patterns may be less reliable when days are missing.": {
    "ms": "Corak mungkin kurang boleh dipercayai jika ada hari tanpa bacaan.",
    "zh": "缺少某些日期的记录可能降低规律分析的可靠性。"
  },
  "• No repeated out-of-range pattern was detected in the last 7 days.": {
    "ms": "• Tiada corak berulang di luar julat dikesan dalam 7 hari lalu.",
    "zh": "• 过去 7 天未检测到反复超出范围的规律。"
  },
  "There isn't enough earlier data yet to compare with your usual levels.": {
    "ms": "Data terdahulu belum mencukupi untuk dibandingkan dengan paras biasa anda.",
    "zh": "此前数据不足，暂时无法与您的平常水平比较。"
  },
  "You also logged late nights and some late, heavier dinners on some of these days. That may be worth discussing, but these records only show things happened around the same time — they don't prove one caused the other. Your doctor can help interpret this.": {
    "ms": "Anda turut merekodkan tidur lewat serta makan malam lewat dan lebih banyak pada beberapa hari tersebut. Perkara ini boleh dibincangkan, tetapi rekod hanya menunjukkan ia berlaku sekitar waktu yang sama, bukan bukti sebab akibat. Doktor boleh membantu mentafsirkannya.",
    "zh": "有些日子也记录了熬夜、晚餐较晚且较丰盛。这值得讨论，但记录只表明它们发生在相近时间，并不能证明因果关系。医生可以帮助解读。"
  },
  "These symptoms may need urgent attention. Please don't rely on this app. Call 999 or go to the nearest emergency department, or contact your clinic immediately. If you can safely check your glucose, do so and follow the plan your healthcare team gave you.": {
    "ms": "Gejala ini mungkin memerlukan perhatian segera. Jangan bergantung pada aplikasi ini. Hubungi 999, pergi ke jabatan kecemasan terdekat atau hubungi klinik anda segera. Jika selamat untuk memeriksa glukosa, lakukan dan ikut pelan daripada pasukan kesihatan anda.",
    "zh": "这些症状可能需要紧急处理。请不要依赖本应用。拨打 999、前往最近的急诊科，或立即联系诊所。如能安全测量血糖，请测量并遵循医疗团队给您的方案。"
  },
  "Based on your recent records, you might ask:": {
    "ms": "Berdasarkan rekod terkini, anda boleh bertanya:",
    "zh": "根据近期记录，您可以询问："
  },
  "• My morning readings have been higher this past week — what could be contributing?": {
    "ms": "• Bacaan pagi saya lebih tinggi minggu lalu — apakah yang mungkin menyumbang?",
    "zh": "• 过去一周我的早晨读数升高了，可能有哪些原因？"
  },
  "• Should my target ranges be adjusted for me?": {
    "ms": "• Perlukah julat sasaran disesuaikan untuk saya?",
    "zh": "• 我的目标范围是否需要调整？"
  },
  "• Are late dinners or late nights something I should change?": {
    "ms": "• Perlukah saya mengubah tabiat makan malam atau tidur lewat?",
    "zh": "• 我是否应该改变晚吃晚餐或熬夜的习惯？"
  },
  "• When should I contact the clinic if readings stay high?": {
    "ms": "• Bilakah perlu menghubungi klinik jika bacaan kekal tinggi?",
    "zh": "• 如果读数持续偏高，我什么时候应联系诊所？"
  },
  "You can find these on the Doctor Visit report too.": {
    "ms": "Soalan ini juga terdapat dalam laporan Lawatan Doktor.",
    "zh": "医生就诊报告中也有这些问题。"
  },
  "General ideas often discussed in diabetes education (demo answer, not personalised advice):": {
    "ms": "Idea umum yang sering dibincangkan dalam pendidikan diabetes (jawapan demo, bukan nasihat peribadi):",
    "zh": "糖尿病教育中常见的一般建议（演示回答，并非个性化建议）："
  },
  "• Use the 'suku-suku separuh' plate idea: half vegetables, a quarter protein, a quarter carbohydrates.": {
    "ms": "• Gunakan konsep pinggan suku-suku separuh: separuh sayur, suku protein dan suku karbohidrat.",
    "zh": "• 采用“四分之一、四分之一、一半”餐盘法：一半蔬菜，四分之一蛋白质，四分之一碳水化合物。"
  },
  "• Choose brown rice or smaller rice portions instead of large servings of white rice.": {
    "ms": "• Pilih beras perang atau hidangan nasi yang lebih kecil berbanding hidangan nasi putih yang banyak.",
    "zh": "• 选择糙米或较小份量的米饭，避免大份白米饭。"
  },
  "• Ikan bakar, chicken soup, tauhu and sayur goreng with less oil are lighter options than deep-fried dishes.": {
    "ms": "• Ikan bakar, sup ayam, tauhu dan sayur yang dimasak dengan kurang minyak ialah pilihan lebih ringan berbanding makanan bergoreng celup.",
    "zh": "• 烤鱼、鸡汤、豆腐和少油炒蔬菜通常比油炸菜肴更清淡。"
  },
  "• Ask for 'kurang manis' or plain drinks instead of teh tarik with condensed milk.": {
    "ms": "• Minta minuman kurang manis atau kosong berbanding teh tarik dengan susu pekat.",
    "zh": "• 选择少糖或无糖饮料，而不是加炼乳的拉茶。"
  },
  "A dietitian can tailor this to you.": {
    "ms": "Pakar diet boleh menyesuaikan cadangan ini untuk anda.",
    "zh": "营养师可以根据您的情况调整建议。"
  },
  "I'm a demo assistant and can currently help with: explaining your recent glucose trend, preparing questions for your doctor, and general Malaysian meal ideas. A full answer to this question needs the medical-source service, which isn't connected yet.": {
    "ms": "Saya pembantu demo yang boleh membantu menerangkan trend glukosa terkini, menyediakan soalan untuk doktor dan memberi idea umum makanan Malaysia. Jawapan lengkap memerlukan perkhidmatan sumber perubatan yang belum disambungkan.",
    "zh": "我是演示助手，目前可帮助解释近期血糖趋势、准备就诊问题，并提供马来西亚饮食的一般建议。完整回答此问题需要医学资料服务，目前尚未连接。"
  },
  "Medication Reminder": {
    "ms": "Peringatan Ubat",
    "zh": "用药提醒"
  },
  "Add medication": {
    "ms": "Tambah ubat",
    "zh": "添加药物"
  },
  "Edit medication": {
    "ms": "Edit ubat",
    "zh": "编辑药物"
  },
  "Remove medication": {
    "ms": "Padam ubat",
    "zh": "删除药物"
  },
  "Today's medication status": {
    "ms": "Status ubat hari ini",
    "zh": "今日用药状态"
  },
  "No medication reminders yet.": {
    "ms": "Belum ada peringatan ubat.",
    "zh": "暂无用药提醒。"
  },
  "Daily": {
    "ms": "Setiap hari",
    "zh": "每天"
  },
  "Selected days": {
    "ms": "Hari terpilih",
    "zh": "指定日期"
  },
  "Not scheduled today": {
    "ms": "Tidak dijadualkan hari ini",
    "zh": "今天未安排"
  },
  "Not Logged": {
    "ms": "Belum Direkodkan",
    "zh": "未记录"
  },
  "Taken": {
    "ms": "Telah Diambil",
    "zh": "已服用"
  },
  "Skipped": {
    "ms": "Tidak Diambil",
    "zh": "已跳过"
  },
  "Remind Later": {
    "ms": "Ingatkan Kemudian",
    "zh": "稍后提醒"
  },
  "Reminder due": {
    "ms": "Masa peringatan telah tiba",
    "zh": "提醒时间已到"
  },
  "Remind Later postpones the in-app reminder by 15 minutes. Reminders appear only while the app is open. Not Logged does not mean a dose was missed.": {
    "ms": "Ingatkan Kemudian menangguhkan peringatan dalam aplikasi selama 15 minit. Peringatan hanya dipaparkan semasa aplikasi dibuka. Belum Direkodkan tidak bermakna dos terlepas.",
    "zh": "稍后提醒会将应用内提醒延后 15 分钟。提醒仅在应用打开时显示。未记录并不代表漏服。"
  },
  "Enter the medication and dose exactly as prescribed.": {
    "ms": "Masukkan ubat dan dos tepat seperti yang dipreskripsikan.",
    "zh": "请严格按照处方填写药物和剂量。"
  },
  "Remove this reminder and its self-reported statuses? This does not change your prescription.": {
    "ms": "Padam peringatan ini dan status yang dilaporkan sendiri? Ini tidak mengubah preskripsi anda.",
    "zh": "删除此提醒及其自行报告的状态？这不会改变您的处方。"
  },
  "Cancel": {
    "ms": "Batal",
    "zh": "取消"
  },
  "Remove reminder": {
    "ms": "Padam peringatan",
    "zh": "删除提醒"
  },
  "Enter a medication name, a positive prescribed dose, a unit, and a valid reminder time.": {
    "ms": "Masukkan nama ubat, dos preskripsi yang lebih daripada sifar, unit dan masa peringatan yang sah.",
    "zh": "请输入药物名称、大于零的处方剂量、单位和有效提醒时间。"
  },
  "Choose at least one reminder day.": {
    "ms": "Pilih sekurang-kurangnya satu hari peringatan.",
    "zh": "请至少选择一个提醒日期。"
  },
  "Medication reminder saved.": {
    "ms": "Peringatan ubat disimpan.",
    "zh": "用药提醒已保存。"
  },
  "Prescribed medication name": {
    "ms": "Nama ubat yang dipreskripsikan",
    "zh": "处方药物名称"
  },
  "Prescribed dose": {
    "ms": "Dos yang dipreskripsikan",
    "zh": "处方剂量"
  },
  "Dose unit": {
    "ms": "Unit dos",
    "zh": "剂量单位"
  },
  "e.g. mg, mL, tablet": {
    "ms": "cth. mg, mL, tablet",
    "zh": "例如：mg、mL、片"
  },
  "Reminder time": {
    "ms": "Masa peringatan",
    "zh": "提醒时间"
  },
  "Frequency": {
    "ms": "Kekerapan",
    "zh": "频率"
  },
  "Reminder days": {
    "ms": "Hari peringatan",
    "zh": "提醒日期"
  },
  "Save reminder": {
    "ms": "Simpan peringatan",
    "zh": "保存提醒"
  },
  "Sunday": {
    "ms": "Ahad",
    "zh": "星期日"
  },
  "Monday": {
    "ms": "Isnin",
    "zh": "星期一"
  },
  "Tuesday": {
    "ms": "Selasa",
    "zh": "星期二"
  },
  "Wednesday": {
    "ms": "Rabu",
    "zh": "星期三"
  },
  "Thursday": {
    "ms": "Khamis",
    "zh": "星期四"
  },
  "Friday": {
    "ms": "Jumaat",
    "zh": "星期五"
  },
  "Saturday": {
    "ms": "Sabtu",
    "zh": "星期六"
  },
  "Daily Care Guide": {
    "ms": "Panduan Penjagaan Harian",
    "zh": "日常护理指南"
  },
  "Breakfast": {
    "ms": "Sarapan",
    "zh": "早餐"
  },
  "Lunch": {
    "ms": "Makan tengah hari",
    "zh": "午餐"
  },
  "Dinner": {
    "ms": "Makan malam",
    "zh": "晚餐"
  },
  "Physical activity": {
    "ms": "Aktiviti fizikal",
    "zh": "身体活动"
  },
  "Healthy-lifestyle tip": {
    "ms": "Tip gaya hidup sihat",
    "zh": "健康生活小贴士"
  },
  "Wholemeal toast, boiled egg, and unsweetened tea.": {
    "ms": "Roti bakar bijirin penuh, telur rebus dan teh tanpa gula.",
    "zh": "全麦吐司、水煮蛋及无糖茶。"
  },
  "Brown rice, grilled fish, and vegetables.": {
    "ms": "Nasi beras perang, ikan bakar dan sayur-sayuran.",
    "zh": "糙米饭、烤鱼和蔬菜。"
  },
  "Vegetable soup, tofu, and a carbohydrate portion suited to your usual care advice.": {
    "ms": "Sup sayur, tauhu dan hidangan karbohidrat yang sesuai dengan nasihat penjagaan biasa anda.",
    "zh": "蔬菜汤、豆腐，以及符合您平常护理建议的碳水化合物份量。"
  },
  "Gentle walking, if appropriate for you.": {
    "ms": "Berjalan santai, jika sesuai untuk anda.",
    "zh": "轻松步行，前提是适合您的情况。"
  },
  "Choose unsweetened drinks instead of sweetened teh tarik.": {
    "ms": "Pilih minuman tanpa gula berbanding teh tarik manis.",
    "zh": "选择无糖饮料，而不是甜拉茶。"
  },
  "Plain oats, a boiled egg, and unsweetened kopi O.": {
    "ms": "Oat kosong, telur rebus dan kopi O kosong.",
    "zh": "原味燕麦、水煮蛋和无糖黑咖啡。"
  },
  "Chapati with dhal and vegetables.": {
    "ms": "Capati dengan dhal dan sayur-sayuran.",
    "zh": "印度薄饼配扁豆及蔬菜。"
  },
  "Chicken soup, vegetables, and a rice portion suited to your usual care advice.": {
    "ms": "Sup ayam, sayur-sayuran dan hidangan nasi yang sesuai dengan nasihat penjagaan biasa anda.",
    "zh": "鸡汤、蔬菜，以及符合您平常护理建议的米饭份量。"
  },
  "Light stretching, if comfortable and appropriate for you.": {
    "ms": "Regangan ringan, jika selesa dan sesuai untuk anda.",
    "zh": "轻柔伸展，前提是舒适且适合您。"
  },
  "Keep a regular sleep routine where possible.": {
    "ms": "Kekalkan rutin tidur yang teratur jika boleh.",
    "zh": "尽可能保持规律的睡眠习惯。"
  },
  "Wholemeal bread with egg and cucumber, and unsweetened tea.": {
    "ms": "Roti bijirin penuh dengan telur dan timun serta teh tanpa gula.",
    "zh": "全麦面包配鸡蛋、黄瓜及无糖茶。"
  },
  "Ikan bakar, vegetables, and a rice portion suited to your usual care advice.": {
    "ms": "Ikan bakar, sayur-sayuran dan hidangan nasi yang sesuai dengan nasihat penjagaan biasa anda.",
    "zh": "烤鱼、蔬菜，以及符合您平常护理建议的米饭份量。"
  },
  "Clear vegetable soup with tofu and wholemeal toast.": {
    "ms": "Sup sayur jernih dengan tauhu dan roti bakar bijirin penuh.",
    "zh": "清蔬菜汤配豆腐及全麦吐司。"
  },
  "A relaxed walk around the taman, if appropriate for you.": {
    "ms": "Berjalan santai di taman, jika sesuai untuk anda.",
    "zh": "在社区公园轻松散步，前提是适合您。"
  },
  "Note how you feel and discuss concerns with your healthcare team.": {
    "ms": "Catat keadaan diri dan bincangkan kebimbangan dengan pasukan kesihatan anda.",
    "zh": "记录自己的感受，并与医疗团队讨论顾虑。"
  },
  "Medication reminder due": {
    "ms": "Masa peringatan ubat telah tiba",
    "zh": "用药提醒时间已到"
  },
  "Not Logged does not mean a dose was missed.": {
    "ms": "Belum Direkodkan tidak bermakna dos terlepas.",
    "zh": "未记录并不代表漏服。"
  },
  "Review medication status": {
    "ms": "Semak status ubat",
    "zh": "查看用药状态"
  },
  "Next medication reminder": {
    "ms": "Peringatan ubat seterusnya",
    "zh": "下次用药提醒"
  },
  "No medication scheduled.": {
    "ms": "Tiada ubat dijadualkan.",
    "zh": "暂无用药安排。"
  },
  "Caregiver support · simulated": {
    "ms": "Sokongan penjaga · simulasi",
    "zh": "照护者支持 · 模拟"
  },
  "Caregiver notifications · simulated": {
    "ms": "Notifikasi penjaga · simulasi",
    "zh": "照护者通知 · 模拟"
  },
  "Caregiver alert history · simulated": {
    "ms": "Sejarah amaran penjaga · simulasi",
    "zh": "照护者提醒历史 · 模拟"
  },
  "Simulated sharing only. Notifications have not been externally delivered. These frontend controls do not provide secure real-world access to patient data.": {
    "ms": "Perkongsian simulasi sahaja. Notifikasi tidak dihantar ke luar aplikasi. Kawalan paparan ini tidak menyediakan akses selamat sebenar kepada data pesakit.",
    "zh": "仅为模拟共享。通知并未发送至外部。这些前端控制不能为患者数据提供真实、安全的访问权限。"
  },
  "Several recent glucose readings are outside the patient's configured reference range. Please review the available records and follow the patient's agreed care instructions.": {
    "ms": "Beberapa bacaan glukosa terkini di luar julat rujukan pesakit yang dikonfigurasikan. Sila semak rekod yang tersedia dan ikut arahan penjagaan yang dipersetujui oleh pesakit.",
    "zh": "近期多条血糖读数超出患者设定的参考范围。请查看现有记录，并遵循患者已约定的护理指示。"
  },
  "For potentially urgent symptoms, seek medical assistance immediately; call 999 in Malaysia if needed. Do not wait for caregiver acknowledgement. Follow your clinic's agreed instructions.": {
    "ms": "Untuk gejala yang mungkin memerlukan rawatan segera, dapatkan bantuan perubatan segera; hubungi 999 di Malaysia jika perlu. Jangan tunggu pengesahan penjaga. Ikut arahan yang dipersetujui dengan klinik anda.",
    "zh": "如出现可能紧急的症状，请立即寻求医疗协助；必要时在马来西亚拨打 999。不要等待照护者确认。请遵循与诊所约定的指示。"
  },
  "Acknowledged": {
    "ms": "Telah disahkan",
    "zh": "已确认"
  },
  "Awaiting acknowledgement": {
    "ms": "Menunggu pengesahan",
    "zh": "待确认"
  },
  "Acknowledged at": {
    "ms": "Disahkan pada",
    "zh": "确认时间"
  },
  "Acknowledge alert": {
    "ms": "Sahkan amaran",
    "zh": "确认提醒"
  },
  "View alert details": {
    "ms": "Lihat butiran amaran",
    "zh": "查看提醒详情"
  },
  "Simulated caregiver notification": {
    "ms": "Notifikasi penjaga simulasi",
    "zh": "模拟照护者通知"
  },
  "No shared caregiver alerts. Sharing requires caregiver mode and selected consent.": {
    "ms": "Tiada amaran penjaga dikongsi. Perkongsian memerlukan mod penjaga dan persetujuan terpilih.",
    "zh": "暂无共享的照护者提醒。共享需要开启照护者模式并同意所选提醒。"
  },
  "Enable caregiver mode": {
    "ms": "Aktifkan mod penjaga",
    "zh": "启用照护者模式"
  },
  "Caregiver name": {
    "ms": "Nama penjaga",
    "zh": "照护者姓名"
  },
  "Relationship": {
    "ms": "Hubungan",
    "zh": "关系"
  },
  "Selected sharing consent": {
    "ms": "Persetujuan perkongsian terpilih",
    "zh": "选择共享授权"
  },
  "Share repeated out-of-range glucose alerts": {
    "ms": "Kongsi amaran bacaan glukosa berulang di luar julat",
    "zh": "共享反复超出范围的血糖提醒"
  },
  "Share existing glucose safety alerts": {
    "ms": "Kongsi amaran keselamatan glukosa sedia ada",
    "zh": "共享现有血糖安全提醒"
  },
  "Enter a caregiver name and relationship before enabling caregiver mode.": {
    "ms": "Masukkan nama dan hubungan penjaga sebelum mengaktifkan mod penjaga.",
    "zh": "启用照护者模式前，请填写照护者姓名和关系。"
  },
  "Caregiver settings saved.": {
    "ms": "Tetapan penjaga disimpan.",
    "zh": "照护者设置已保存。"
  },
  "Save caregiver settings": {
    "ms": "Simpan tetapan penjaga",
    "zh": "保存照护者设置"
  },
  "Revoke sharing consent": {
    "ms": "Tarik balik persetujuan perkongsian",
    "zh": "撤销共享授权"
  },
  "Sharing consent revoked.": {
    "ms": "Persetujuan perkongsian ditarik balik.",
    "zh": "共享授权已撤销。"
  },
  "Medication statuses and reflections are patient-reported, not verified. Doctor feedback is simulated. Caregiver notifications are simulated and not externally delivered.": {
    "ms": "Status ubat dan refleksi dilaporkan oleh pesakit, belum disahkan. Maklum balas doktor ialah simulasi. Notifikasi penjaga ialah simulasi dan tidak dihantar ke luar aplikasi.",
    "zh": "用药状态与反思为患者自行报告，未经核实。医生反馈为模拟内容。照护者通知为模拟内容，并未发送至外部。"
  },
  "Patient-reported": {
    "ms": "Dilaporkan pesakit",
    "zh": "患者自行报告"
  },
  "Medication schedules": {
    "ms": "Jadual ubat",
    "zh": "用药安排"
  },
  "Reported at": {
    "ms": "Dilaporkan pada",
    "zh": "报告时间"
  },
  "Care-plan goals and progress": {
    "ms": "Matlamat dan kemajuan pelan penjagaan",
    "zh": "护理计划目标与进度"
  },
  "Patient reflections": {
    "ms": "Refleksi pesakit",
    "zh": "患者反思"
  },
  "No patient reflections in this period.": {
    "ms": "Tiada refleksi pesakit dalam tempoh ini.",
    "zh": "此期间暂无患者反思。"
  },
  "Simulated doctor feedback": {
    "ms": "Maklum balas doktor simulasi",
    "zh": "模拟医生反馈"
  },
  "Rule-detected · simulated": {
    "ms": "Dikesan melalui peraturan · simulasi",
    "zh": "规则检测 · 模拟"
  },
  "No permitted caregiver alerts in this report period.": {
    "ms": "Tiada amaran penjaga yang dibenarkan dalam tempoh laporan ini.",
    "zh": "本报告期间暂无获准共享的照护者提醒。"
  },
  "Safety guidance is demo text, not clinician-reviewed. Clinical review is required before real-world use.": {
    "ms": "Panduan keselamatan ialah teks demo, belum disemak oleh doktor. Semakan klinikal diperlukan sebelum penggunaan sebenar.",
    "zh": "安全指引为演示文本，未经医生审核。实际使用前需要临床审核。"
  },
  "Detected patterns use the existing 7-day monitoring window, regardless of report period.": {
    "ms": "Corak dikesan menggunakan tempoh pemantauan 7 hari sedia ada, tanpa mengira tempoh laporan.",
    "zh": "检测规律使用现有的 7 天监测窗口，不受报告期间影响。"
  },
  "Shaking, cold sweats, dizziness or a pounding heart can happen when glucose is low or high. This app cannot tell the cause.": {"ms": "Badan ketar, peluh sejuk, pening atau jantung berdebar boleh berlaku apabila gula rendah atau tinggi. Aplikasi ini tidak dapat menentukan puncanya.", "zh": "发抖、冷汗、头晕或心慌可能在血糖偏低或偏高时出现。本应用无法判断原因。"},
  "Please check your glucose now if you safely can.": {"ms": "Sila periksa gula darah anda sekarang jika selamat untuk berbuat demikian.", "zh": "如能安全操作，请立即测量血糖。"},
  "Your latest recorded reading is {value} mmol/L.": {"ms": "Bacaan terkini anda ialah {value} mmol/L.", "zh": "您最近记录的读数为 {value} mmol/L。"},
  "No glucose reading was recorded in the last 3 hours.": {"ms": "Tiada bacaan gula direkodkan dalam 3 jam lepas.", "zh": "过去 3 小时内没有血糖记录。"},
  "That reading is below your low threshold. Follow the low blood sugar steps on the Health page and your care team's plan.": {"ms": "Bacaan itu di bawah had rendah anda. Ikut langkah gula darah rendah di halaman Kesihatan dan pelan pasukan penjagaan anda.", "zh": "该读数低于您的低血糖阈值。请按照健康页面的低血糖步骤及医护团队的计划处理。"},
  "If you feel confused, faint, cannot swallow, or symptoms do not improve, call 999 or go to the nearest emergency department.": {"ms": "Jika anda keliru, rasa hendak pengsan, tidak boleh menelan, atau simptom tidak bertambah baik, hubungi 999 atau pergi ke jabatan kecemasan terdekat.", "zh": "如感到意识混乱、快要晕倒、无法吞咽或症状未改善，请拨打 999 或前往最近的急诊部门。"},
  "Numbness, tingling, slow-healing wounds, strong thirst, passing urine often or blurred vision are worth telling your doctor about. This app cannot diagnose the cause.": {"ms": "Kaki kebas, semut-semut, luka lambat sembuh, haus sangat, kencing kerap atau kabur mata perlu dimaklumkan kepada doktor. Aplikasi ini tidak dapat mendiagnosis puncanya.", "zh": "麻木、刺痛、伤口难愈合、非常口渴、尿频或视力模糊值得告诉医生。本应用无法诊断原因。"},
  "Your records show {n} high readings in the last 7 days.": {"ms": "Rekod anda menunjukkan {n} bacaan tinggi dalam 7 hari lepas.", "zh": "您的记录显示过去 7 天有 {n} 次偏高读数。"},
  "No high readings were recorded in the last 7 days.": {"ms": "Tiada bacaan tinggi direkodkan dalam 7 hari lepas.", "zh": "过去 7 天没有偏高读数记录。"},
  "Please contact your clinic soon. If a wound looks infected, or you feel very unwell, vomit or are very drowsy, seek urgent care or call 999.": {"ms": "Sila hubungi klinik anda segera. Jika luka kelihatan dijangkiti, atau anda rasa sangat tidak sihat, muntah atau sangat mengantuk, dapatkan rawatan segera atau hubungi 999.", "zh": "请尽快联系诊所。如伤口疑似感染，或感到非常不适、呕吐或极度嗜睡，请立即就医或拨打 999。"},
  "No glucose readings were recorded yesterday, so there isn't enough information to explain yesterday's levels.": {"ms": "Tiada bacaan gula direkodkan semalam, jadi maklumat tidak mencukupi untuk menjelaskan paras semalam.", "zh": "昨天没有血糖记录，因此信息不足，无法解释昨天的血糖水平。"},
  "Try logging readings before and after meals today.": {"ms": "Cuba rekod bacaan sebelum dan selepas makan hari ini.", "zh": "今天请尝试在餐前和餐后记录读数。"},
  "Yesterday you recorded {n} readings. The highest was {value} mmol/L.": {"ms": "Semalam anda merekod {n} bacaan. Yang tertinggi ialah {value} mmol/L.", "zh": "昨天您记录了 {n} 次读数，最高为 {value} mmol/L。"},
  "Things you logged yesterday: {list}.": {"ms": "Perkara yang anda rekod semalam: {list}.", "zh": "您昨天记录的内容：{list}。"},
  "No meals, activity or sleep were logged yesterday, so possible contributors are unknown.": {"ms": "Tiada makanan, aktiviti atau tidur direkodkan semalam, jadi kemungkinan faktor tidak diketahui.", "zh": "昨天没有记录饮食、活动或睡眠，因此无法得知可能的影响因素。"},
  "Readings can rise for many reasons, such as meals, less activity, stress, illness, poor sleep or medication timing. These records only show what happened around the same time; they don't prove the cause.": {"ms": "Bacaan boleh naik atas banyak sebab, seperti makanan, kurang aktiviti, tekanan, sakit, kurang tidur atau masa ubat. Rekod ini hanya menunjukkan apa yang berlaku pada masa yang sama; ia tidak membuktikan puncanya.", "zh": "血糖可能因多种原因升高，如饮食、活动减少、压力、生病、睡眠不佳或用药时间。这些记录只显示同一时间发生的事情，并不能证明原因。"},
  "I had symptoms that needed urgent attention. What should I do if it happens again?": {"ms": "Saya mengalami simptom yang memerlukan perhatian segera. Apa patut saya buat jika ia berulang?", "zh": "我曾出现需要紧急处理的症状。如果再次发生该怎么办？"},
  "I sometimes feel shaky, sweaty or dizzy. What should I do when this happens?": {"ms": "Kadang-kadang saya rasa badan ketar, berpeluh atau pening. Apa patut saya buat?", "zh": "我有时会发抖、出汗或头晕。出现时我该怎么办？"},
  "I have noticed numbness, thirst, frequent urination, blurred vision or slow-healing wounds. Should these be checked?": {"ms": "Saya perasan kebas, haus, kerap kencing, kabur mata atau luka lambat sembuh. Perlukah ini diperiksa?", "zh": "我注意到麻木、口渴、尿频、视力模糊或伤口难愈合。需要检查吗？"},
  "My glucose went up on some days. What could be causing it?": {"ms": "Gula saya naik pada hari tertentu. Apa puncanya?", "zh": "我的血糖在某些日子升高了。可能是什么原因？"},
  "Added to your Doctor Visit questions.": {"ms": "Ditambah ke soalan Lawatan Doktor anda.", "zh": "已添加到您的就诊问题。"},
  "Added to Doctor Visit questions": {"ms": "Sudah ditambah ke soalan Lawatan Doktor", "zh": "已添加到就诊问题"},
  "Add to Doctor Visit Questions": {"ms": "Tambah ke Soalan Lawatan Doktor", "zh": "添加到就诊问题"},
  "Saved questions from Copilot": {"ms": "Soalan disimpan daripada Copilot", "zh": "从 Copilot 保存的问题"},
  "Mark discussed": {"ms": "Tanda sudah dibincang", "zh": "标记为已讨论"},
  "Mark not discussed": {"ms": "Tanda belum dibincang", "zh": "标记为未讨论"},
  "Question removed.": {"ms": "Soalan dibuang.", "zh": "问题已删除。"},
  "Remove": {"ms": "Buang", "zh": "删除"},
  "No saved questions yet. Use \"Add to Doctor Visit Questions\" in the Copilot.": {"ms": "Belum ada soalan disimpan. Guna \"Tambah ke Soalan Lawatan Doktor\" dalam Copilot.", "zh": "暂无保存的问题。请在 Copilot 中使用“添加到就诊问题”。"},
  "Recorded in the app": {"ms": "Direkod dalam aplikasi", "zh": "应用内记录"},
  "Morning": {"ms": "Pagi", "zh": "早上"},
  "Evening": {"ms": "Malam", "zh": "晚上"},
  "Log fasting reading": {"ms": "Rekod bacaan puasa", "zh": "记录空腹读数"},
  "Medication doses marked taken today": {"ms": "Dos ubat ditanda diambil hari ini", "zh": "今天已标记服用的药物剂量"},
  "Malaysian Food Swap Guide": {"ms": "Panduan Tukar Makanan Malaysia", "zh": "马来西亚食物替换指南"},
  "Smaller rice portion, more cucumber": {"ms": "Kurangkan nasi, tambah timun", "zh": "减少米饭份量，多加黄瓜"},
  "Teh C Kosong or Kopi O Kosong": {"ms": "Teh C Kosong atau Kopi O Kosong", "zh": "Teh C Kosong 或 Kopi O Kosong（无糖）"},
  "Smaller portion or vegetable-rich soup noodles": {"ms": "Hidangan lebih kecil atau mi sup dengan banyak sayur", "zh": "减少份量或选择多蔬菜的汤面"},
  "Consider tosai with dhal": {"ms": "Pertimbangkan tosai dengan dal", "zh": "可考虑印度薄饼配扁豆咖喱"},
  "General ideas only, not a diet restriction. Ask your doctor or dietitian what suits you.": {"ms": "Idea umum sahaja, bukan sekatan diet. Tanya doktor atau pakar diet apa yang sesuai untuk anda.", "zh": "仅为一般建议，并非饮食限制。请咨询医生或营养师什么适合您。"},
  "Your doctor's goal": {"ms": "Matlamat doktor anda", "zh": "医生为您设定的目标"},
  "Doctor-assigned, read-only": {"ms": "Ditetapkan doktor, baca sahaja", "zh": "医生设定，仅供查看"},
  "Learn more": {"ms": "Ketahui lebih lanjut", "zh": "了解更多"},
  "Daily log": {"ms": "Catatan harian", "zh": "日常记录"},
  "Insights": {"ms": "Cerapan", "zh": "分析"},
  "History": {"ms": "Sejarah", "zh": "历史"},
  "Devices & demo": {"ms": "Peranti & demo", "zh": "设备与演示"},
  "Record a meal, activity or symptom": {"ms": "Rekod makanan, aktiviti atau gejala", "zh": "记录餐食、活动或症状"},
  "Your day at a glance": {"ms": "Ringkasan hari anda", "zh": "今日概览"},
  "Readings, logs and trends": {"ms": "Bacaan, catatan dan trend", "zh": "读数、记录与趋势"},
  "Understand your records": {"ms": "Fahami rekod anda", "zh": "了解您的记录"},
  "Prepare for your appointment": {"ms": "Bersedia untuk janji temu", "zh": "准备就诊"},
  "Medication and daily check-in": {"ms": "Ubat dan semakan harian", "zh": "用药与每日签到"},
  "Demo tools": {"ms": "Alat demo", "zh": "演示工具"},
  "Today's care": {"ms": "Penjagaan hari ini", "zh": "今日护理"},
  "Home": {"ms": "Utama", "zh": "首页"},
  "Health": {"ms": "Kesihatan", "zh": "健康"},
  "Visit": {"ms": "Lawatan", "zh": "就诊"},
  "Care": {"ms": "Penjagaan", "zh": "护理"}

};
