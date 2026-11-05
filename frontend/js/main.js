// ====== Cấu hình ======
const USE_MOCK = true;                       // đổi thành false khi backend sẵn sàng
const API_URL = "http://localhost:8000/predict";
const THRESHOLD = 0.6;                       // dưới 60% thì coi là "Không xác định"
const MAX_SIZE_MB = 5;

// ====== Lấy các phần tử ======
const fileInput = document.getElementById("fileInput");
const preview = document.getElementById("preview");
const btnPredict = document.getElementById("btnPredict");
const spinner = document.getElementById("spinner");
const btnText = document.getElementById("btnText");
const errorBox = document.getElementById("error");
const resultBox = document.getElementById("result");
const nameEl = document.getElementById("name");
const bar = document.getElementById("bar");
const btnReset = document.getElementById("btnReset");

// ====== Hàm gọi dự đoán ======
async function predict(file) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1000)); // giả vờ chờ 1 giây
    return { name: "Tên Người Nổi Tiếng", confidence: 0.92 };
  }

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(API_URL, { method: "POST", body: formData });
  const data = await res.json();

  if (!res.ok || data.error) {
    throw new Error(data.error || "Lỗi server");
  }
  return data;
}

// ====== Các hàm hiển thị ======
function showError(msg) {
  errorBox.textContent = msg;
  errorBox.classList.remove("d-none");
}

function resetUI() {
  errorBox.classList.add("d-none");
  resultBox.classList.add("d-none");
}

function setLoading(isLoading) {
  btnPredict.disabled = isLoading;
  btnReset.disabled = isLoading;
  spinner.classList.toggle("d-none", !isLoading);
  btnText.textContent = isLoading ? "Đang xử lý..." : "Nhận diện";
}

function showResult({ name, confidence }) {
  const percent = Math.round(confidence * 100);
  const unknown = confidence < THRESHOLD;

  nameEl.textContent = unknown ? "Không xác định" : name;
  bar.style.width = percent + "%";
  bar.textContent = percent + "%";
  bar.className = "progress-bar " + (unknown ? "bg-warning" : "bg-success");
  resultBox.classList.remove("d-none");
}

function resetAll() {
  fileInput.value = "";                 // xóa file đã chọn
  preview.src = "";
  preview.classList.add("d-none");
  btnPredict.disabled = true;
  btnReset.classList.add("d-none");
  resetUI();                            // ẩn lỗi và kết quả
}

btnReset.addEventListener("click", resetAll);
// ====== Sự kiện: chọn ảnh ======
fileInput.addEventListener("change", () => {
  resetUI();
  const file = fileInput.files[0];

  if (!file) {
    preview.classList.add("d-none");
    btnPredict.disabled = true;
    return;
  }
  if (!file.type.startsWith("image/")) {
    showError("Vui lòng chọn file ảnh.");
    preview.classList.add("d-none");
    btnPredict.disabled = true;
    return;
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    showError(`Ảnh quá lớn (tối đa ${MAX_SIZE_MB}MB).`);
    preview.classList.add("d-none");
    btnPredict.disabled = true;
    return;
  }

  preview.src = URL.createObjectURL(file);
  preview.classList.remove("d-none");
  btnPredict.disabled = false;
  btnReset.classList.remove("d-none");
});

// ====== Sự kiện: bấm nút Nhận diện ======
btnPredict.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  resetUI();
  setLoading(true);
  try {
    const data = await predict(file);
    showResult(data);
  } catch (err) {
    showError(err.message || "Không kết nối được server.");
  } finally {
    setLoading(false);
  }
});
