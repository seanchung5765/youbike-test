function showPassword() {
  const input = document.getElementById("p");
  const btn = document.getElementById("togglePwd");
  input.type = "text";
  btn.textContent = "🙈";
}

function hidePassword() {
  const input = document.getElementById("p");
  const btn = document.getElementById("togglePwd");
  input.type = "password";
  btn.textContent = "👁";
}

async function login() {
  const btn = document.getElementById("btn");
  const msg = document.getElementById("msg");
  const username = document.getElementById("u").value.trim();
  const password = document.getElementById("p").value;

  msg.textContent = "";

  if (!username || !password) {
    msg.textContent = "請輸入帳號與密碼";
    return;
  }

  btn.disabled = true;
  btn.textContent = "登入中...";

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      msg.textContent = "登入失敗（帳號或密碼不正確 / 無權限）";
      return;
    }

    location.href = "/search";
  } catch (e) {
    msg.textContent = "連線失敗，請確認後端有啟動";
  } finally {
    btn.disabled = false;
    btn.textContent = "登入";
  }
}

window.showPassword = showPassword;
window.hidePassword = hidePassword;
window.login = login;