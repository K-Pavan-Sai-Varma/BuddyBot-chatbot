const chatWindow = document.getElementById("chat-window");
const inputField = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const micBtn = document.getElementById("mic-btn");
const themeToggle = document.getElementById("theme-toggle");
const realtimeCheckbox = document.getElementById("realtime-checkbox");
const welcomeScreen = document.getElementById("welcome-screen");
const noteScreen = document.getElementById("note-screen");
const chatPage = document.getElementById("chat-page");

// Show welcome → note → chat
document.getElementById("next-to-note").onclick = () => {
  welcomeScreen.style.display = "none";
  noteScreen.style.display = "flex";
};

document.getElementById("next-to-chat").onclick = () => {
  noteScreen.style.display = "none";
  chatPage.style.display = "flex";
};

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.className = sender === "You" ? "user-msg" : "bot-msg";
  msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendLoading() {
  const loading = document.createElement("div");
  loading.id = "loading";
  loading.className = "bot-msg";
  loading.innerHTML = 'Bot is typing<span class="loading-dots"><span>.</span><span>.</span><span>.</span></span>';
  chatWindow.appendChild(loading);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeLoading() {
  const el = document.getElementById("loading");
  if (el) el.remove();
}

async function handleSend() {
  const prompt = inputField.value.trim();
  if (!prompt) return;
  appendMessage("You", prompt);
  inputField.value = "";
  appendLoading();

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        realtime: realtimeCheckbox.checked
      })
    });

    const data = await res.json();
    removeLoading();
    appendMessage("Bot", data.reply);
  } catch (err) {
    removeLoading();
    appendMessage("Bot", "Error: Could not reach server.");
  }
}

// Theme toggle
themeToggle.onclick = () => {
  const isDark = document.body.classList.contains("dark-mode");
  document.body.classList.toggle("dark-mode", !isDark);
  document.body.classList.toggle("light-mode", isDark);
  themeToggle.textContent = isDark ? "🌙" : "☀️";
  localStorage.setItem("theme", isDark ? "light" : "dark");
};

// Restore saved theme
window.onload = () => {
  const saved = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("dark-mode", saved === "dark");
  document.body.classList.toggle("light-mode", saved === "light");
  themeToggle.textContent = saved === "dark" ? "☀️" : "🌙";
};

// Send on Enter
inputField.addEventListener("keypress", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleSend();
  }
});

sendBtn.onclick = handleSend;

// /// ✅ Voice input (fast & clean)
// micBtn.onclick = () => {
//   const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
//   recognition.lang = "en-US";
//   recognition.interimResults = false;
//   recognition.continuous = false;

//   micBtn.textContent = "..."; // 👈 shows dots while listening
//   recognition.start();

//   recognition.onresult = (event) => {
//     const transcript = event.results[0][0].transcript;
//     inputField.value = transcript;
//     micBtn.textContent = "🎤";
//     sendPrompt();
//   };

//   recognition.onerror = () => {
//     micBtn.textContent = "🎤";
//     alert("Voice recognition failed.");
//   };

//   recognition.onend = () => {
//     if (micBtn.textContent !== "🎤") {
//       micBtn.textContent = "🎤";
//     }
//   };
// };

let recognition; // Declare globally
let isRecognizing = false;

micBtn.onclick = () => {
  if (!isRecognizing) {
    // Start voice recognition
    recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    micBtn.textContent = "...";
    isRecognizing = true;
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      inputField.value = transcript;
    };

    recognition.onerror = (e) => {
      console.error("Recognition error:", e.error);
      alert("Voice recognition failed.");
      micBtn.textContent = "🎤";
      isRecognizing = false;
    };

    recognition.onend = () => {
      if (isRecognizing) {
        micBtn.textContent = "🎤";
        isRecognizing = false;
      }
    };
  } else {
    // Stop voice recognition manually
    recognition.stop();
    micBtn.textContent = "🎤";
    isRecognizing = false;
    sendPrompt(); // Send after stopping
  }
};