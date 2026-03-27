let currentUser = null;

async function init() {
  try {
    const res = await fetch("/api/me", {
      credentials: "include"
    });

    if (!res.ok) {
      location.href = "/";
      return;
    }

    const data = await res.json();
    currentUser = data.user;

    const userInfo = document.getElementById("userInfo");
    if (userInfo) {
      userInfo.innerText = `${currentUser.cn} (${currentUser.role})`;
    }

    const adminMenu = document.getElementById("adminMenu");
    if (adminMenu && currentUser.role === "ADMIN") {
      adminMenu.classList.remove("hidden");
    }

  } catch (err) {
    console.error("初始化失敗:", err);
    location.href = "/";
  }
}

function loadPage(url) {
  const frame = document.getElementById("contentFrame");
  if (frame) {
    frame.src = url;
  }
}

async function logout() {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });
  } catch (err) {
    console.error("登出失敗:", err);
  } finally {
    location.href = "/";
  }
}

window.loadPage = loadPage;
window.logout = logout;

window.addEventListener("DOMContentLoaded", init);